require('dotenv').config()

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const checks = [
  {
    name: 'class_section_academic_year_mismatch',
    severity: 'error',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM class_sections cs
      INNER JOIN semesters s ON s.id = cs."semesterId"
      WHERE cs."academicYearId" <> s."academicYearId"
    `
  },
  {
    name: 'roster_term_mismatch',
    severity: 'error',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM rosters r
      INNER JOIN class_sections cs ON cs.id = r."classSectionId"
      WHERE r."semesterId" <> cs."semesterId"
         OR r."academicYearId" <> cs."academicYearId"
    `
  },
  {
    name: 'roster_member_section_mismatch',
    severity: 'error',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM roster_members rm
      INNER JOIN rosters r ON r.id = rm."rosterId"
      WHERE rm."classSectionId" <> r."classSectionId"
    `
  },
  {
    name: 'applications_over_two_choices',
    severity: 'error',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT "applicationId"
        FROM enrollment_application_choices
        GROUP BY "applicationId"
        HAVING COUNT(*) > 2
      ) violations
    `
  },
  {
    name: 'active_roster_capacity_overflow',
    severity: 'error',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT rm."classSectionId"
        FROM roster_members rm
        INNER JOIN class_sections cs ON cs.id = rm."classSectionId"
        WHERE rm.status = 'ACTIVE'
        GROUP BY rm."classSectionId", cs.capacity
        HAVING COUNT(*) > cs.capacity
      ) violations
    `
  },
  {
    name: 'duplicate_attendance_per_section_day',
    severity: 'error',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT "studentId", "classSectionId", DATE("attendanceDate")
        FROM attendances
        WHERE "classSectionId" IS NOT NULL
        GROUP BY "studentId", "classSectionId", DATE("attendanceDate")
        HAVING COUNT(*) > 1
      ) violations
    `
  },
  {
    name: 'submitted_applications_without_choices',
    severity: 'warning',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM enrollment_applications ea
      LEFT JOIN enrollment_application_choices eac ON eac."applicationId" = ea.id
      WHERE ea.status IN ('SUBMITTED', 'APPROVED')
      GROUP BY ea.id
      HAVING COUNT(eac.id) = 0
    `,
    countRows: true
  },
  {
    name: 'expired_temporary_uploads',
    severity: 'warning',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM file_uploads
      WHERE "isTemp" = TRUE
        AND "expiresAt" IS NOT NULL
        AND "expiresAt" <= NOW()
    `
  }
]

async function main() {
  const results = []

  for (const check of checks) {
    const rows = await prisma.$queryRawUnsafe(check.sql)
    const count = check.countRows ? rows.length : Number(rows[0]?.count || 0)
    results.push({ name: check.name, severity: check.severity, count })
  }

  const errors = results.filter(result => result.severity === 'error' && result.count > 0)
  console.log(JSON.stringify({ success: errors.length === 0, checks: results }, null, 2))

  if (errors.length > 0) {
    process.exitCode = 1
  }
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
