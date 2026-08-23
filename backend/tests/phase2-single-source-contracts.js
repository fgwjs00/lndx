const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${JSON.stringify(expected)}`)
  }
}

const schema = read('prisma/schema.prisma')
const applicationV2 = read('src/routes/applicationV2.ts')
const enrollmentApplicationService = read('src/services/enrollmentApplicationService.ts')
const migration = read('prisma/migrations/20260820000000_roster_and_insurance_snapshots/migration.sql')

assertIncludes(schema, 'insuranceSnapshot Json?', 'enrollment applications must retain the insurance snapshot used for submission')
assertIncludes(schema, 'snapshot           Json?', 'roster members must retain an immutable roster snapshot')
assertIncludes(migration, 'ADD COLUMN "insuranceSnapshot" JSONB', 'migration must add application insurance snapshots')
assertIncludes(migration, 'ADD COLUMN "snapshot" JSONB', 'migration must add roster-member snapshots')
assertIncludes(applicationV2, 'if (enrollmentApplicationId) {', 'phase-2 submissions must skip legacy Enrollment writes')
assertIncludes(enrollmentApplicationService, 'pg_advisory_xact_lock', 'application creation must serialize duplicate submission checks')
assertIncludes(enrollmentApplicationService, 'ENROLLMENT_APPLICATION_ALREADY_SUBMITTED', 'duplicate submitted applications must have a stable error code')
assertIncludes(enrollmentApplicationService, 'FOR UPDATE', 'roster member creation must lock the class section before capacity checks')
assertIncludes(enrollmentApplicationService, 'buildInsuranceSnapshot', 'application creation must capture insurance data')
assertIncludes(enrollmentApplicationService, 'buildRosterMemberSnapshot', 'roster member creation must capture the final roster data')

console.log('phase2 single-source contracts passed')
