const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(root, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readWorkspace(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function assertFileExists(relativePath, label) {
  if (!exists(relativePath)) {
    throw new Error(`${label}: expected ${relativePath} to exist`)
  }
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${JSON.stringify(expected)}`)
  }
}

function assertNotIncludes(source, unexpected, label) {
  if (source.includes(unexpected)) {
    throw new Error(`${label}: source must not include ${JSON.stringify(unexpected)}`)
  }
}

for (const file of [
  'scripts/enrollment-phase2-apply-foundation.js',
  'scripts/enrollment-phase2-create-roster-snapshots.js',
  'scripts/enrollment-phase2-prepare-next-sections.js',
  'scripts/enrollment-phase2-prepare-next-courses.js',
  'scripts/README-enrollment-phase2.md'
]) {
  assertFileExists(file, 'phase 2 script package')
}

const applyFoundation = read('scripts/enrollment-phase2-apply-foundation.js')
const createSnapshots = read('scripts/enrollment-phase2-create-roster-snapshots.js')
const prepareNextSections = read('scripts/enrollment-phase2-prepare-next-sections.js')
const prepareNextCourses = read('scripts/enrollment-phase2-prepare-next-courses.js')
const applicationV2 = read('src/routes/applicationV2.ts')
const scriptReadme = read('scripts/README-enrollment-phase2.md')
const plan = readWorkspace('docs/superpowers/plans/2026-06-05-enrollment-roster-insurance-phase2.md')

assertIncludes(applyFoundation, 'isLocalDatabase', 'foundation script must detect local database targets')
assertIncludes(applyFoundation, '--allow-remote', 'foundation script must require an explicit remote override')
assertIncludes(applyFoundation, '--execute', 'foundation script must default to dry-run')
assertIncludes(applyFoundation, 'DRY RUN', 'foundation script must print dry-run mode')
assertIncludes(applyFoundation, '20260605000000_enrollment_phase2_foundation', 'foundation script must apply the phase 2 migration file')
assertIncludes(applyFoundation, "to_regclass('public.${table}')", 'foundation script must inspect phase 2 tables')

assertIncludes(createSnapshots, '--semester', 'snapshot script must require a source semester')
assertIncludes(createSnapshots, '--execute', 'snapshot script must default to dry-run')
assertIncludes(createSnapshots, 'APPROVED', 'snapshot script must snapshot approved enrollments only')
assertIncludes(createSnapshots, '"class_sections"', 'snapshot script must create class sections')
assertIncludes(createSnapshots, '"rosters"', 'snapshot script must create rosters')
assertIncludes(createSnapshots, '"roster_members"', 'snapshot script must create roster members')
assertIncludes(createSnapshots, '"sourceEnrollmentId"', 'snapshot script must preserve source enrollment links')
assertIncludes(createSnapshots, 'ON CONFLICT', 'snapshot script must be safe to re-run')

assertIncludes(prepareNextSections, '--from-semester', 'next-section script must require source semester')
assertIncludes(prepareNextSections, '--to-semester', 'next-section script must require target semester')
assertIncludes(prepareNextSections, '--execute', 'next-section script must default to dry-run')
assertIncludes(prepareNextSections, '"class_sections"', 'next-section script must create class sections')
assertNotIncludes(prepareNextSections, 'INSERT INTO "roster_members"', 'next-section script must not copy roster members')

assertIncludes(prepareNextCourses, '--from-semester', 'next-course script must require source semester')
assertIncludes(prepareNextCourses, '--to-semester', 'next-course script must require target semester')
assertIncludes(prepareNextCourses, '--execute', 'next-course script must default to dry-run')
assertIncludes(prepareNextCourses, '--publish', 'next-course script must require explicit publish mode')
assertIncludes(prepareNextCourses, '--allow-remote', 'next-course script must require explicit remote override')
assertIncludes(prepareNextCourses, 'isLocalDatabase', 'next-course script must detect local database targets')
assertIncludes(prepareNextCourses, 'DRY RUN', 'next-course script must print dry-run mode')
assertIncludes(prepareNextCourses, 'course.upsert', 'next-course script must clone legacy courses into new course rows')
assertIncludes(prepareNextCourses, 'courseTeacher.createMany', 'next-course script must copy course teacher links')
assertIncludes(prepareNextCourses, '"class_sections"', 'next-course script must create or rebind class sections')
assertIncludes(prepareNextCourses, 'targetCourse.id', 'next-course script must bind class sections to cloned target courses')
assertIncludes(prepareNextCourses, 'existingTargetCourse?.status || targetStatus', 'next-course script must not downgrade existing published courses during a non-publish rerun')
assertIncludes(prepareNextCourses, 'existingRows[0]?.status || targetStatus', 'next-course script must not downgrade existing published class sections during a non-publish rerun')
assertIncludes(prepareNextCourses, 'ensureAcademicYear(tx, academicYearConfig, openEnrollment)', 'next-course script must activate academic year when enrollment is opened')
assertIncludes(prepareNextCourses, 'WHEN EXCLUDED."isActive" THEN true', 'next-course script must not leave an open-enrollment academic year inactive')
assertNotIncludes(prepareNextCourses, 'INSERT INTO "roster_members"', 'next-course script must not copy roster members')

assertIncludes(scriptReadme, 'pg_dump', 'phase 2 README must document production backup export')
assertIncludes(scriptReadme, 'pg_restore', 'phase 2 README must document local rehearsal restore')
assertIncludes(scriptReadme, 'prisma migrate deploy', 'phase 2 README must document the Prisma migration option')
assertIncludes(scriptReadme, 'prisma migrate resolve', 'phase 2 README must document manual SQL plus resolve option')
assertIncludes(scriptReadme, 'enrollment-phase2-prepare-next-courses.js', 'phase 2 README must include legacy course preparation in rehearsal sequence')
assertIncludes(scriptReadme, 'Baota deployment order', 'phase 2 README must document Baota deployment order')
assertIncludes(scriptReadme, 'pm2 restart', 'phase 2 README must document PM2 restart')
assertIncludes(scriptReadme, '/api/health', 'phase 2 README must document health check verification')
assertIncludes(scriptReadme, 'Rollback decision', 'phase 2 README must document rollback decision points')

assertIncludes(applicationV2, "from '../services/enrollmentPolicyService'", 'application v2 must import shared enrollment policy service')
assertIncludes(applicationV2, 'validateSelectedCoursesPolicy', 'application v2 must validate selected course policy centrally')
assertIncludes(applicationV2, 'validateEnrollmentApplication', 'application v2 must call shared enrollment policy validation')

assertIncludes(plan, '[x] Rehearse migration against the restored local PostgreSQL database.', 'plan must record migration rehearsal completion')
assertIncludes(plan, '[x] Generate 2024/2025 roster snapshots from approved historical enrollments.', 'plan must record roster snapshot tooling completion')
assertIncludes(plan, '[x] Generate 2026 autumn class sections without mutating 2025 rosters.', 'plan must record next semester section tooling completion')
assertIncludes(plan, '[x] Move V2 application submission to the shared enrollment policy service.', 'plan must record policy service wiring completion')

console.log('enrollment phase 2 script contracts passed')
