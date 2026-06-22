#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { PrismaClient } = require('@prisma/client')

const DRY_RUN_ONLY = true

const backendRoot = path.resolve(__dirname, '..')
const migrationsDir = path.join(backendRoot, 'prisma', 'migrations')

const KNOWN_MIGRATION_OBJECTS = {
  '20250814161629_111': [
    'users',
    'students',
    'teachers',
    'courses',
    'course_teachers',
    'enrollments',
    'attendances',
    'operation_logs',
    'system_configs',
    'file_uploads'
  ],
  '20250819161543_add_insurance_period_fields': [
    'enrollments.insuranceStart',
    'enrollments.insuranceEnd'
  ],
  '20250819164123_make_course_fields_optional': [
    'courses.credits',
    'courses.startDate',
    'courses.endDate'
  ],
  '20250819171044_add_course_teaching_fields': [
    'courses.location',
    'courses.semester',
    'courses.teacher'
  ],
  '20250820012828_add_student_photo_field': [
    'students.photo'
  ],
  '20260605000000_enrollment_phase2_foundation': [
    'academic_years',
    'semesters',
    'class_sections',
    'rosters',
    'roster_members',
    'enrollment_applications',
    'enrollment_application_choices',
    'student_insurances'
  ],
  '20260606000000_student_academic_events': [
    'student_academic_events'
  ]
}

const EMPTY_MIGRATIONS = new Set([
  '20250819173734_change_to_uuid_format'
])

function listMigrationDirectories() {
  return fs.readdirSync(migrationsDir)
    .filter((entry) => fs.statSync(path.join(migrationsDir, entry)).isDirectory())
    .sort()
}

function redactDatabaseUrl(value) {
  if (!value) {
    return '<missing>'
  }

  try {
    const url = new URL(value)
    if (url.password) {
      url.password = '***'
    }
    if (url.username) {
      url.username = url.username ? '***' : ''
    }
    return url.toString()
  } catch {
    return '<unparseable DATABASE_URL>'
  }
}

async function hasTable(prisma, tableName) {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT to_regclass($1) IS NOT NULL AS "exists"',
    `public.${tableName}`
  )
  return Boolean(rows[0]?.exists)
}

async function readAppliedMigrations(prisma) {
  const hasBookkeeping = await hasTable(prisma, '_prisma_migrations')
  if (!hasBookkeeping) {
    return {
      hasBookkeeping,
      applied: []
    }
  }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT migration_name AS "migrationName", finished_at AS "finishedAt", rolled_back_at AS "rolledBackAt"
    FROM "_prisma_migrations"
    ORDER BY started_at ASC
  `)

  return {
    hasBookkeeping,
    applied: rows.filter((row) => row.finishedAt && !row.rolledBackAt).map((row) => row.migrationName)
  }
}

async function readPublicTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name AS "tableName"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `)

  return rows.map((row) => row.tableName)
}

async function readPublicColumns(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name AS "tableName", column_name AS "columnName"
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name ASC, column_name ASC
  `)

  return rows.map((row) => `${row.tableName}.${row.columnName}`)
}

function buildBaselineCommands(migrations, applied, existingTables, existingColumns) {
  const appliedSet = new Set(applied)
  const tableSet = new Set(existingTables)
  const columnSet = new Set(existingColumns)

  return migrations
    .filter((migration) => !appliedSet.has(migration))
    .map((migration) => {
      const expectedObjects = KNOWN_MIGRATION_OBJECTS[migration] || []
      const existingObjects = expectedObjects.filter((objectName) => (
        objectName.includes('.') ? columnSet.has(objectName) : tableSet.has(objectName)
      ))
      const isEmptyMigration = EMPTY_MIGRATIONS.has(migration)
      const shouldBaseline = isEmptyMigration || (
        expectedObjects.length > 0 && existingObjects.length === expectedObjects.length
      )

      return {
        migration,
        expectedObjects,
        existingObjects,
        isEmptyMigration,
        shouldBaseline,
        command: shouldBaseline ? `npx prisma migrate resolve --applied ${migration}` : null
      }
    })
}

async function main() {
  const prisma = new PrismaClient()

  try {
    const migrations = listMigrationDirectories()
    const { hasBookkeeping, applied } = await readAppliedMigrations(prisma)
    const publicTables = await readPublicTables(prisma)
    const userTables = publicTables.filter((table) => table !== '_prisma_migrations')
    const publicColumns = await readPublicColumns(prisma)
    const pending = migrations.filter((migration) => !applied.includes(migration))
    const baselinePlan = buildBaselineCommands(migrations, applied, userTables, publicColumns)
    const baselineCandidates = baselinePlan.filter((item) => item.shouldBaseline)

    const summary = {
      dryRunOnly: DRY_RUN_ONLY,
      databaseUrl: redactDatabaseUrl(process.env.DATABASE_URL),
      hasPrismaMigrationsTable: hasBookkeeping,
      publicTableCount: publicTables.length,
      userTableCount: userTables.length,
      migrations,
      applied,
      pending,
      baselineCandidates,
      p3005Risk: !hasBookkeeping && userTables.length > 0
    }

    console.log(JSON.stringify(summary, null, 2))

    if (summary.p3005Risk) {
      console.error(
        'P3005 risk: database is not empty and _prisma_migrations is missing. Restore and rehearse locally, then record explicit baseline entries before using Prisma migration deployment.'
      )
      process.exitCode = 2
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
