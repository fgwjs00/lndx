#!/usr/bin/env node

const path = require('path')
const { randomUUID } = require('crypto')
const { PrismaClient } = require('@prisma/client')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient()
const argv = process.argv.slice(2)
const execute = argv.includes('--execute')
const publish = argv.includes('--publish')
const openEnrollment = argv.includes('--open-enrollment')
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
  const value = String(text || '').toLowerCase()
  if (value.includes('spring') || value.includes('\u6625')) return 'spring'
  if (value.includes('summer') || value.includes('\u590f')) return 'summer'
  if (value.includes('autumn') || value.includes('fall') || value.includes('\u79cb')) return 'autumn'
  if (value.includes('winter') || value.includes('\u51ac')) return 'winter'
  return 'term'
}

function inferAcademicYearStart(semester) {
  const year = inferYear(semester)
  const season = inferSeason(semester)
  return season === 'autumn' || season === 'term' ? year : year - 1
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
  const value = String(semester || '').trim()
  const existingCode = value.match(/^(\d{4})-(spring|summer|autumn|winter|term)$/i)
  if (existingCode) {
    return `${existingCode[1]}-${existingCode[2].toLowerCase()}`
  }
  return `${inferYear(value)}-${inferSeason(value)}`
}

function safeCodePart(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function buildTargetCourseCode(toSemester, sourceCourse) {
  const sourcePart = safeCodePart(sourceCourse.courseCode || sourceCourse.id.slice(0, 8))
  return `${buildSemesterCode(toSemester)}-${sourcePart || sourceCourse.id.slice(0, 8)}`
}

async function assertPhase2TablesExist(client) {
  const rows = await client.$queryRawUnsafe(
    "SELECT to_regclass('public.academic_years')::text AS academic_years, to_regclass('public.semesters')::text AS semesters, to_regclass('public.class_sections')::text AS class_sections"
  )
  const state = rows[0] || {}
  if (!state.academic_years || !state.semesters || !state.class_sections) {
    throw new Error('Phase 2 foundation tables are missing. Run enrollment-phase2-apply-foundation.js --execute first.')
  }
}

async function getSourceCourses(fromSemester) {
  return prisma.course.findMany({
    where: {
      isActive: true,
      status: 'PUBLISHED',
      semester: fromSemester
    },
    select: {
      id: true,
      courseCode: true,
      name: true,
      description: true,
      category: true,
      level: true,
      duration: true,
      maxStudents: true,
      price: true,
      hasAgeRestriction: true,
      minAge: true,
      maxAge: true,
      ageDescription: true,
      tags: true,
      keywords: true,
      timeSlots: true,
      teacher: true,
      location: true,
      requiresGrades: true,
      gradeDescription: true,
      credits: true,
      startDate: true,
      endDate: true,
      createdBy: true,
      teachers: {
        select: {
          teacherId: true,
          isMain: true
        }
      }
    },
    orderBy: [
      { name: 'asc' },
      { id: 'asc' }
    ]
  })
}

async function ensureAcademicYear(tx, config, activate) {
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
      ${Boolean(activate)}, ${now}, ${now}
    )
    ON CONFLICT ("code") DO UPDATE SET
      "name" = EXCLUDED."name",
      "startsAt" = EXCLUDED."startsAt",
      "endsAt" = EXCLUDED."endsAt",
      "requiredInsuranceStart" = EXCLUDED."requiredInsuranceStart",
      "requiredInsuranceEnd" = EXCLUDED."requiredInsuranceEnd",
      "isActive" = CASE
        WHEN EXCLUDED."isActive" THEN true
        ELSE "academic_years"."isActive"
      END,
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
    VALUES (${randomUUID()}, ${academicYearId}, ${code}, ${semester}, ${openEnrollment}, true, ${now}, ${now})
    ON CONFLICT ("code") DO UPDATE SET
      "academicYearId" = EXCLUDED."academicYearId",
      "name" = EXCLUDED."name",
      "isEnrollmentOpen" = CASE
        WHEN EXCLUDED."isEnrollmentOpen" THEN true
        ELSE "semesters"."isEnrollmentOpen"
      END,
      "isActive" = true,
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id"
  `
  return rows[0].id
}

async function cloneCourse(tx, sourceCourse, toSemester, targetStatus) {
  const courseCode = buildTargetCourseCode(toSemester, sourceCourse)
  const existingTargetCourse = await tx.course.findUnique({
    where: { courseCode },
    select: { status: true }
  })
  const effectiveStatus = publish ? 'PUBLISHED' : (existingTargetCourse?.status || targetStatus)
  const createData = {
    courseCode,
    name: sourceCourse.name,
    description: sourceCourse.description,
    category: sourceCourse.category,
    level: sourceCourse.level,
    duration: sourceCourse.duration,
    maxStudents: sourceCourse.maxStudents,
    price: sourceCourse.price,
    hasAgeRestriction: sourceCourse.hasAgeRestriction,
    minAge: sourceCourse.minAge,
    maxAge: sourceCourse.maxAge,
    ageDescription: sourceCourse.ageDescription,
    tags: sourceCourse.tags || [],
    keywords: sourceCourse.keywords || [],
    timeSlots: sourceCourse.timeSlots || [],
    teacher: sourceCourse.teacher,
    location: sourceCourse.location,
    requiresGrades: sourceCourse.requiresGrades,
    gradeDescription: sourceCourse.gradeDescription,
    credits: sourceCourse.credits,
    startDate: sourceCourse.startDate,
    endDate: sourceCourse.endDate,
    semester: toSemester,
    status: effectiveStatus,
    isActive: true,
    createdBy: sourceCourse.createdBy
  }
  const updateData = {
    name: sourceCourse.name,
    description: sourceCourse.description,
    category: sourceCourse.category,
    level: sourceCourse.level,
    duration: sourceCourse.duration,
    maxStudents: sourceCourse.maxStudents,
    price: sourceCourse.price,
    hasAgeRestriction: sourceCourse.hasAgeRestriction,
    minAge: sourceCourse.minAge,
    maxAge: sourceCourse.maxAge,
    ageDescription: sourceCourse.ageDescription,
    tags: sourceCourse.tags || [],
    keywords: sourceCourse.keywords || [],
    timeSlots: sourceCourse.timeSlots || [],
    teacher: sourceCourse.teacher,
    location: sourceCourse.location,
    requiresGrades: sourceCourse.requiresGrades,
    gradeDescription: sourceCourse.gradeDescription,
    credits: sourceCourse.credits,
    startDate: sourceCourse.startDate,
    endDate: sourceCourse.endDate,
    semester: toSemester,
    status: effectiveStatus,
    isActive: true
  }

  const targetCourse = await tx.course.upsert({
    where: { courseCode },
    create: createData,
    update: updateData,
    select: {
      id: true,
      courseCode: true
    }
  })

  if (sourceCourse.teachers.length > 0) {
    await tx.courseTeacher.createMany({
      data: sourceCourse.teachers.map(teacher => ({
        courseId: targetCourse.id,
        teacherId: teacher.teacherId,
        isMain: teacher.isMain
      })),
      skipDuplicates: true
    })
  }

  return targetCourse
}

async function ensureClassSection(tx, academicYearId, semesterId, toSemester, sourceCourse, targetCourse, targetStatus) {
  const now = new Date()
  const code = buildTargetCourseCode(toSemester, sourceCourse)
  const existingRows = await tx.$queryRaw`
    SELECT "status"
    FROM "class_sections"
    WHERE "code" = ${code}
    LIMIT 1
  `
  const effectiveStatus = publish ? 'PUBLISHED' : (existingRows[0]?.status || targetStatus)
  const rows = await tx.$queryRaw`
    INSERT INTO "class_sections" (
      "id", "code", "name", "academicYearId", "semesterId", "courseId",
      "grade", "major", "capacity", "timeSlots", "status", "isActive", "createdAt", "updatedAt"
    )
    VALUES (
      ${randomUUID()}, ${code}, ${sourceCourse.name}, ${academicYearId}, ${semesterId}, ${targetCourse.id},
      ${sourceCourse.level || null}, ${sourceCourse.category || sourceCourse.name}, ${Number(sourceCourse.maxStudents) || 0},
      ${JSON.stringify(sourceCourse.timeSlots || [])}::jsonb, ${effectiveStatus}, true, ${now}, ${now}
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
    RETURNING "id"
  `
  return rows[0].id
}

async function main() {
  const fromSemester = getArg('--from-semester')
  const toSemester = getArg('--to-semester')

  if (!fromSemester || !toSemester) {
    throw new Error('Usage: node scripts/enrollment-phase2-prepare-next-courses.js --from-semester "2025年秋季" --to-semester "2026年秋季" [--execute] [--publish] [--open-enrollment]')
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!isLocalDatabase(databaseUrl) && !allowRemote) {
    throw new Error('Refusing to run against a non-local database. Add --allow-remote only after backup and approval.')
  }

  const targetStatus = publish ? 'PUBLISHED' : 'DRAFT'
  console.log('Enrollment phase 2 next semester legacy course clone')
  console.log(`Database: ${redactDatabaseUrl(databaseUrl)}`)
  console.log(`From semester: ${fromSemester}`)
  console.log(`To semester: ${toSemester}`)
  console.log(`Target course status: ${targetStatus}`)
  console.log(`Enrollment open: ${openEnrollment ? 'yes' : 'unchanged/closed'}`)
  console.log(execute ? 'Mode: EXECUTE' : 'Mode: DRY RUN')

  const sourceCourses = await getSourceCourses(fromSemester)
  const targetCodes = sourceCourses.map(course => buildTargetCourseCode(toSemester, course))
  const existingTargetCount = targetCodes.length > 0
    ? await prisma.course.count({ where: { courseCode: { in: targetCodes } } })
    : 0

  console.log(`Source published courses: ${sourceCourses.length}`)
  console.log(`Existing target courses: ${existingTargetCount}`)

  if (!execute) {
    console.log('\nDRY RUN: no database changes were made.')
    for (const course of sourceCourses.slice(0, 20)) {
      console.log(`- ${course.name}: ${course.courseCode || course.id.slice(0, 8)} -> ${buildTargetCourseCode(toSemester, course)}`)
    }
    if (sourceCourses.length > 20) {
      console.log(`- ... ${sourceCourses.length - 20} more courses`)
    }
    return
  }

  await assertPhase2TablesExist(prisma)

  const academicYearConfig = buildAcademicYearConfig(toSemester)
  const result = await prisma.$transaction(async tx => {
    const academicYearId = await ensureAcademicYear(tx, academicYearConfig, openEnrollment)
    const semesterId = await ensureSemester(tx, academicYearId, toSemester)
    let courseCount = 0
    let classSectionCount = 0

    for (const sourceCourse of sourceCourses) {
      const targetCourse = await cloneCourse(tx, sourceCourse, toSemester, targetStatus)
      await ensureClassSection(tx, academicYearId, semesterId, toSemester, sourceCourse, targetCourse, targetStatus)
      courseCount += 1
      classSectionCount += 1
    }

    return {
      academicYearId,
      semesterId,
      courseCount,
      classSectionCount
    }
  }, { timeout: 120000 })

  console.log('\nNext semester course clone completed.')
  console.log(`Academic year: ${result.academicYearId}`)
  console.log(`Semester: ${result.semesterId}`)
  console.log(`Courses prepared: ${result.courseCount}`)
  console.log(`Class sections prepared: ${result.classSectionCount}`)
  console.log('Roster members were not copied.')
}

main()
  .catch(error => {
    console.error(`\nError: ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
