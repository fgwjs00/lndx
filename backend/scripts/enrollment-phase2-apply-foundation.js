#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient()
const args = new Set(process.argv.slice(2))
const execute = args.has('--execute')
const allowRemote = args.has('--allow-remote')

const migrationDir = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260605000000_enrollment_phase2_foundation'
)
const migrationFile = path.join(migrationDir, 'migration.sql')

const phase2Tables = [
  'academic_years',
  'semesters',
  'class_sections',
  'rosters',
  'roster_members',
  'enrollment_applications',
  'enrollment_application_choices',
  'student_insurances'
]

function isLocalDatabase(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl)
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)
  } catch (error) {
    return false
  }
}

function redactDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl)
    if (parsed.password) {
      parsed.password = '***'
    }
    return parsed.toString()
  } catch (error) {
    return '[invalid DATABASE_URL]'
  }
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map(statement => statement.trim())
    .filter(Boolean)
}

async function getTableState() {
  const state = {}

  for (const table of phase2Tables) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT to_regclass('public.${table}')::text AS table_name`
    )
    state[table] = Boolean(rows[0] && rows[0].table_name)
  }

  return state
}

function printTableState(state) {
  for (const table of phase2Tables) {
    const status = state[table] ? 'exists' : 'missing'
    console.log(`- ${table}: ${status}`)
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  console.log('Enrollment phase 2 foundation migration')
  console.log(`Database: ${redactDatabaseUrl(databaseUrl)}`)

  const local = isLocalDatabase(databaseUrl)
  if (!local && !allowRemote) {
    throw new Error('Refusing to run against a non-local database. Add --allow-remote only after backup and approval.')
  }

  if (!fs.existsSync(migrationFile)) {
    throw new Error(`Migration file not found: ${migrationFile}`)
  }

  const before = await getTableState()
  console.log('\nCurrent table state:')
  printTableState(before)

  const existing = phase2Tables.filter(table => before[table])
  const missing = phase2Tables.filter(table => !before[table])

  if (missing.length === 0) {
    console.log('\nAll phase 2 foundation tables already exist.')
    return
  }

  if (existing.length > 0) {
    throw new Error(`Partial phase 2 foundation detected. Existing tables: ${existing.join(', ')}. Review manually before continuing.`)
  }

  if (!execute) {
    console.log('\nDRY RUN: no database changes were made.')
    console.log('Run with --execute to apply the foundation migration to this database.')
    return
  }

  const sql = fs.readFileSync(migrationFile, 'utf8')
  const statements = splitSqlStatements(sql)
  console.log(`\nApplying ${statements.length} SQL statements...`)

  await prisma.$transaction(async tx => {
    for (const statement of statements) {
      await tx.$executeRawUnsafe(statement)
    }
  }, { timeout: 120000 })

  const after = await getTableState()
  console.log('\nUpdated table state:')
  printTableState(after)

  const stillMissing = phase2Tables.filter(table => !after[table])
  if (stillMissing.length > 0) {
    throw new Error(`Migration finished but tables are still missing: ${stillMissing.join(', ')}`)
  }

  console.log('\nPhase 2 foundation migration applied successfully.')
}

main()
  .catch(error => {
    console.error(`\nError: ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
