#!/usr/bin/env node

const path = require('path')
const { randomUUID } = require('crypto')
const { PrismaClient } = require('@prisma/client')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient()
const argv = process.argv.slice(2)
const execute = argv.includes('--execute')
const allowRemote = argv.includes('--allow-remote')

function getArg(name) {
  const index = argv.indexOf(name)
  if (index === -1) return null
  return argv[index + 1] || null
}

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

function inferYear(text) {
  const match = String(text || '').match(/(\d{4})/)
  if (!match) {
    throw new Error(`Cannot infer year from semester: ${text}`)
  }
  return Number(match[1])
}

function inferSeason(text) {
  if (String(text).includes('春')) return 'spring'
  if (String(text).includes('夏')) return 'summer'
  if (String(text).includes('秋')) return 'autumn'
  if (String(text).includes('冬')) return 'winter'
  return 'term'
}

function inferAcademicYearStart(semester) {
  const year = inferYear(semester)
  return String(semester).includes('春') ? year - 1 : year
}

function buildAcademicYearConfig(semester) {
  const startYear = inferAcademicYearStart(semester)
  return {
    code: `${startYear}-${startYear + 1}`,
    name: `${startYear}-${startYear + 1} academic year`,
    startsAt: new Date(`${startYear}-09-01T00:00:00.000Z`),
    endsAt: new Date(`${startYear + 1}-08-31T23:59:59.000Z`),
    requiredInsuranceStart: new Date(`${startYear}-09-01T00:00:00.000Z`),
    requiredInsuranceEnd: new Date(`${startYear + 1}-08-31T23:59:59.000Z`)
  }
}

function buildSemesterCode(semester) {
  return `${inferYear(semester)}-${inferSeason(semester)}`
}

function safeCodePart(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

async function assertPhase2TablesExist(client) {
  const rows = await client.$queryRawUnsafe(
    "SELECT to_regclass('public.class_sections')::text AS class_sections, to_regclass('public.rosters')::text AS rosters, to_regclass('public.roster_members')::text AS roster_members"
  )
  const state = rows[0] || {}
  if (!state.class_sections || !state.rosters || !state.roster_members) {
    throw new Error('Phase 2 foundation tables are missing. Run enrollment-phase2-apply-foundation.js --execute first.')
  }
}

async function getSemesterCourses(semester) {
  return prisma.$queryRaw`
    SELECT
      c."id",
      c."courseCode",
      c."name",
      c."category",
      c."level",
      c."maxStudents",
      c."timeSlots",
      c."semester",
      COUNT(e."id")::int AS "approvedCount"
    FROM "courses" c
    LEFT JOIN "enrollments" e
      ON e."courseId" = c."id"
      AND e."status" = 'APPROVED'
    WHERE c."isActive" = true
      AND c."semester" = ${semester}
    GROUP BY c."id"
    ORDER BY c."name" ASC
  `
}

async function ensureAcademicYear(tx, config) {
  const now = new Date()
  const rows = await tx.$queryRaw`
    INSERT INTO "academic_years" (
      "id", "code", "name", "startsAt", "endsAt",
      "requiredInsuranceStart", "requiredInsuranceEnd",
      "isActive", "createdAt", "updatedAt"
    )
    VALUES (
      ${randomUUID()}, ${config.code}, ${config.name}, ${config.startsAt}, ${config.endsAt},
      ${config.requiredInsuranceStart}, ${config.requiredInsuranceEnd},
      false, ${now}, ${now}
    )
    ON CONFLICT ("code") DO UPDATE SET
      "name" = EXCLUDED."name",
      "startsAt" = EXCLUDED."startsAt",
      "endsAt" = EXCLUDED."endsAt",
      "requiredInsuranceStart" = EXCLUDED."requiredInsuranceStart",
      "requiredInsuranceEnd" = EXCLUDED."requiredInsuranceEnd",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id"
  `
  return rows[0].id
}

async function ensureSemester(tx, academicYearId, semester) {
  const now = new Date()
  const code = buildSemesterCode(semester)
  const rows = await tx.$queryRaw`
    INSERT INTO "semesters" (
      "id", "academicYearId", "code", "name",
      "isEnrollmentOpen", "isActive", "createdAt", "updatedAt"
    )
    VALUES (${randomUUID()}, ${academicYearId}, ${code}, ${semester}, false, true, ${now}, ${now})
    ON CONFLICT ("code") DO UPDATE SET
      "academicYearId" = EXCLUDED."academicYearId",
      "name" = EXCLUDED."name",
      "isActive" = true,
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id"
  `
  return rows[0].id
}

async function ensureClassSection(tx, academicYearId, semesterId, semester, course) {
  const now = new Date()
  const coursePart = safeCodePart(course.courseCode || course.id.slice(0, 8))
  const code = `${buildSemesterCode(semester)}-${coursePart}`
  const rows = await tx.$queryRaw`
    INSERT INTO "class_sections" (
      "id", "code", "name", "academicYearId", "semesterId", "courseId",
      "grade", "major", "capacity", "timeSlots", "status", "isActive", "createdAt", "updatedAt"
    )
    VALUES (
      ${randomUUID()}, ${code}, ${course.name}, ${academicYearId}, ${semesterId}, ${course.id},
      ${course.level || null}, ${course.category || course.name}, ${Number(course.maxStudents) || 0},
      ${JSON.stringify(course.timeSlots || [])}::jsonb, 'PUBLISHED', true, ${now}, ${now}
    )
    ON CONFLICT ("code") DO UPDATE SET
      "name" = EXCLUDED."name",
      "academicYearId" = EXCLUDED."academicYearId",
      "semesterId" = EXCLUDED."semesterId",
      "courseId" = EXCLUDED."courseId",
      "grade" = EXCLUDED."grade",
      "major" = EXCLUDED."major",
      "capacity" = EXCLUDED."capacity",
      "timeSlots" = EXCLUDED."timeSlots",
      "status" = EXCLUDED."status",
      "isActive" = true,
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id", "code"
  `
  return rows[0]
}

async function ensureRoster(tx, academicYearId, semesterId, classSectionId, classSectionCode) {
  const now = new Date()
  const code = `${classSectionCode}-roster`
  const rows = await tx.$queryRaw`
    INSERT INTO "rosters" (
      "id", "code", "classSectionId", "semesterId", "academicYearId",
      "status", "snapshotAt", "createdAt", "updatedAt"
    )
    VALUES (${randomUUID()}, ${code}, ${classSectionId}, ${semesterId}, ${academicYearId}, 'PUBLISHED', ${now}, ${now}, ${now})
    ON CONFLICT ("code") DO UPDATE SET
      "classSectionId" = EXCLUDED."classSectionId",
      "semesterId" = EXCLUDED."semesterId",
      "academicYearId" = EXCLUDED."academicYearId",
      "status" = EXCLUDED."status",
      "snapshotAt" = EXCLUDED."snapshotAt",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id"
  `
  return rows[0].id
}

async function getApprovedEnrollments(tx, courseId) {
  return tx.$queryRaw`
    SELECT e."id" AS "sourceEnrollmentId", e."studentId"
    FROM "enrollments" e
    INNER JOIN "students" s ON s."id" = e."studentId"
    WHERE e."courseId" = ${courseId}
      AND e."status" = 'APPROVED'
      AND s."isActive" = true
    ORDER BY s."name" ASC
  `
}

async function upsertRosterMember(tx, rosterId, classSectionId, member) {
  const now = new Date()
  await tx.$executeRaw`
    INSERT INTO "roster_members" (
      "id", "rosterId", "classSectionId", "studentId", "sourceEnrollmentId",
      "status", "joinedAt", "createdAt", "updatedAt"
    )
    VALUES (
      ${randomUUID()}, ${rosterId}, ${classSectionId}, ${member.studentId}, ${member.sourceEnrollmentId},
      'ACTIVE', ${now}, ${now}, ${now}
    )
    ON CONFLICT ("rosterId", "studentId") DO UPDATE SET
      "classSectionId" = EXCLUDED."classSectionId",
      "sourceEnrollmentId" = EXCLUDED."sourceEnrollmentId",
      "status" = 'ACTIVE',
      "leftAt" = NULL,
      "updatedAt" = EXCLUDED."updatedAt"
  `
}

async function main() {
  const semester = getArg('--semester')
  if (!semester) {
    throw new Error('Usage: node scripts/enrollment-phase2-create-roster-snapshots.js --semester "2025年秋季" [--execute]')
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!isLocalDatabase(databaseUrl) && !allowRemote) {
    throw new Error('Refusing to run against a non-local database. Add --allow-remote only after backup and approval.')
  }

  console.log('Enrollment phase 2 roster snapshot')
  console.log(`Database: ${redactDatabaseUrl(databaseUrl)}`)
  console.log(`Semester: ${semester}`)
  console.log(execute ? 'Mode: EXECUTE' : 'Mode: DRY RUN')

  const courses = await getSemesterCourses(semester)
  const totalApproved = courses.reduce((sum, course) => sum + Number(course.approvedCount || 0), 0)
  console.log(`Courses found: ${courses.length}`)
  console.log(`APPROVED enrollments to snapshot: ${totalApproved}`)

  if (!execute) {
    console.log('\nDRY RUN: no database changes were made.')
    for (const course of courses.slice(0, 20)) {
      console.log(`- ${course.name}: ${Number(course.approvedCount || 0)} APPROVED`)
    }
    if (courses.length > 20) {
      console.log(`- ... ${courses.length - 20} more courses`)
    }
    return
  }

  await assertPhase2TablesExist(prisma)

  const academicYearConfig = buildAcademicYearConfig(semester)
  const result = await prisma.$transaction(async tx => {
    const academicYearId = await ensureAcademicYear(tx, academicYearConfig)
    const semesterId = await ensureSemester(tx, academicYearId, semester)
    let memberCount = 0

    for (const course of courses) {
      const classSection = await ensureClassSection(tx, academicYearId, semesterId, semester, course)
      const rosterId = await ensureRoster(tx, academicYearId, semesterId, classSection.id, classSection.code)
      const members = await getApprovedEnrollments(tx, course.id)

      for (const member of members) {
        await upsertRosterMember(tx, rosterId, classSection.id, member)
        memberCount += 1
      }
    }

    return {
      academicYearId,
      semesterId,
      classSectionCount: courses.length,
      memberCount
    }
  }, { timeout: 120000 })

  console.log('\nRoster snapshot completed.')
  console.log(`Academic year: ${result.academicYearId}`)
  console.log(`Semester: ${result.semesterId}`)
  console.log(`Class sections: ${result.classSectionCount}`)
  console.log(`Roster members: ${result.memberCount}`)
}

main()
  .catch(error => {
    console.error(`\nError: ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
