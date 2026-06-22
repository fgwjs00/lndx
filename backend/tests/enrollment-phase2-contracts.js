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

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

function assertFileExists(relativePath, label) {
  if (!exists(relativePath)) {
    throw new Error(`${label}: expected file ${relativePath} to exist`)
  }
}

const schema = read('prisma/schema.prisma')
const index = read('src/index.ts')
const applicationV2 = read('src/routes/applicationV2.ts')
const enrollmentApplicationService = read('src/services/enrollmentApplicationService.ts')
const courseApi = readWorkspace('frontend/src/api/course.ts')
const mobileRegistration = readWorkspace('frontend/src/views/MobileRegistration.vue')
const registration = readWorkspace('frontend/src/views/Registration.vue')

for (const model of [
  'AcademicYear',
  'Semester',
  'ClassSection',
  'Roster',
  'RosterMember',
  'EnrollmentApplication',
  'EnrollmentApplicationChoice',
  'StudentInsurance'
]) {
  assertIncludes(schema, `model ${model} `, `schema must define ${model}`)
}

for (const enumName of [
  'RosterStatus',
  'RosterMemberStatus',
  'EnrollmentApplicationStatus',
  'EnrollmentChoiceStatus',
  'InsuranceReviewStatus'
]) {
  assertIncludes(schema, `enum ${enumName} `, `schema must define ${enumName}`)
}

assertRegex(schema, /model AcademicYear[\s\S]*requiredInsuranceStart\s+DateTime[\s\S]*requiredInsuranceEnd\s+DateTime/, 'academic year must carry insurance coverage window')
assertRegex(schema, /model Semester[\s\S]*academicYearId\s+String[\s\S]*academicYear\s+AcademicYear/, 'semester must belong to an academic year')
assertRegex(schema, /model ClassSection[\s\S]*semesterId\s+String[\s\S]*courseId\s+String[\s\S]*timeSlots\s+Json/, 'class section must bind a course to a semester and schedule')
assertRegex(schema, /model Roster[\s\S]*classSectionId\s+String[\s\S]*semesterId\s+String[\s\S]*snapshotAt\s+DateTime/, 'roster must be a class-section semester snapshot')
assertRegex(schema, /model RosterMember[\s\S]*rosterId\s+String[\s\S]*classSectionId\s+String[\s\S]*studentId\s+String/, 'roster member must link roster, class section, and student')
assertRegex(schema, /model EnrollmentApplicationChoice[\s\S]*choiceOrder\s+Int[\s\S]*classSectionId\s+String/, 'enrollment choices must support ordered class-section choices')
assertRegex(schema, /model StudentInsurance[\s\S]*academicYearId\s+String[\s\S]*coverageStart\s+DateTime[\s\S]*coverageEnd\s+DateTime[\s\S]*attachmentFileId\s+String\?/, 'student insurance must bind to academic year, coverage dates, and upload')

assertFileExists('src/services/enrollmentPolicyService.ts', 'policy service')
const policyService = read('src/services/enrollmentPolicyService.ts')
assertIncludes(policyService, 'validateEnrollmentApplication', 'policy service must expose enrollment application validation')
assertIncludes(policyService, 'hasTimeSlotConflict', 'policy service must expose time conflict detection')
assertIncludes(policyService, 'validateInsuranceCoverage', 'policy service must expose insurance coverage validation')
assertRegex(policyService, /choices\.length\s*>\s*2/, 'policy service must enforce max two choices')

assertFileExists('src/routes/publicRegistration.ts', 'public registration route')
const publicRegistration = read('src/routes/publicRegistration.ts')
assertIncludes(publicRegistration, "router.get('/semesters'", 'public route must expose public semesters')
assertIncludes(publicRegistration, "router.get('/courses'", 'public route must expose public courses')
assertIncludes(publicRegistration, 'getPhase2PublicSemesters', 'public semesters must prefer Semester/AcademicYear data')
assertIncludes(publicRegistration, 'getLegacyPublicSemesters', 'public semesters must keep a legacy fallback')
assertIncludes(publicRegistration, 'FROM "semesters" s', 'public semesters must query phase 2 semesters')
assertIncludes(publicRegistration, 'getPhase2PublicCourses', 'public courses must prefer ClassSection/Roster data')
assertIncludes(publicRegistration, 'getLegacyPublicCourses', 'public courses must keep a legacy fallback')
assertIncludes(publicRegistration, 'FROM "class_sections" cs', 'public courses must query phase 2 class sections')
assertIncludes(publicRegistration, '"classSectionId"', 'public course response must expose classSectionId')
assertRegex(publicRegistration, /GROUP BY[\s\S]*cs\.id[\s\S]*s\.id[\s\S]*ay\.id[\s\S]*c\.id/, 'phase 2 public course query must group by primary keys for PostgreSQL aggregate safety')

assertIncludes(index, "import publicRegistrationRoutes from '@/routes/publicRegistration'", 'index must import public registration route')
assertIncludes(index, "app.use(`${apiPrefix}/public-registration`, publicRegistrationRoutes)", 'public registration route must be mounted without auth middleware')

assertIncludes(courseApi, 'getPublicSemesters', 'course API must expose public semester loader')
assertIncludes(courseApi, "request.get('/public-registration/semesters')", 'public semester loader must use public route')
assertIncludes(courseApi, 'getPublicCourses', 'course API must expose public course loader')
assertIncludes(courseApi, "request.get<PaginatedResponse<Course>>('/public-registration/courses'", 'public course loader must use public route')
assertIncludes(mobileRegistration, 'CourseService.getPublicSemesters()', 'mobile registration must load semesters without auth-only course route')
assertIncludes(mobileRegistration, 'CourseService.getPublicCourses', 'mobile registration must load courses without auth-only course route')
assertIncludes(mobileRegistration, 'semester: formData.semester', 'mobile registration must query courses for the selected semester')
assertIncludes(mobileRegistration, 'getCourseSelectionId', 'mobile registration must use class section ids as selection ids when public course data provides them')
assertIncludes(mobileRegistration, '@click="handleCourseSelect(getCourseSelectionId(course))"', 'mobile registration course cards must select the concrete class section')
assertIncludes(mobileRegistration, 'formData.selectedCourses.includes(getCourseSelectionId(course))', 'mobile registration selected state must be based on class section id')
assertIncludes(mobileRegistration, 'selectedClassSections: getSelectedClassSectionIds()', 'mobile registration submit payload must carry selected class section ids')
assertIncludes(registration, 'CourseService.getPublicCourses', 'desktop registration must load public class-section course data')
assertIncludes(registration, 'getCourseSelectionId', 'desktop registration must use class section ids as selection ids when available')
assertIncludes(registration, 'findCourseBySelectionId', 'desktop registration must resolve selected ids back to course data')
assertIncludes(registration, 'value: getCourseSelectionId(course)', 'desktop registration select options must use the concrete class section id')
assertIncludes(registration, 'selectedCourses: getSelectedCourseIds()', 'desktop registration submit payload must preserve legacy course ids')
assertIncludes(registration, 'selectedClassSections: getSelectedClassSectionIds()', 'desktop registration submit payload must carry selected class section ids')

assertIncludes(courseApi, 'classSectionId?: string | null', 'public course API type must expose optional classSectionId')
assertRegex(applicationV2, /course:\s*{\s*select:\s*{[\s\S]*id:\s*true,[\s\S]*name:\s*true,[\s\S]*level:\s*true,[\s\S]*semester:\s*true[\s\S]*}\s*}/, 'application v2 existing enrollment queries must include course semester')
assertIncludes(applicationV2, 'selectedClassSections: Joi.array().items(Joi.string()).optional()', 'application v2 schema must accept selected class sections')
assertIncludes(applicationV2, 'normalizeApplicationSelectionInput(value)', 'application v2 must normalize class-section selections before legacy course checks')
assertIncludes(applicationV2, 'createEnrollmentApplicationWithChoices', 'application v2 must create phase 2 application records')
assertIncludes(applicationV2, "from '../services/enrollmentApplicationService'", 'application v2 must use enrollment application service')
assertIncludes(enrollmentApplicationService, 'resolveApplicationClassSections', 'enrollment application service must resolve requested class sections')
assertIncludes(enrollmentApplicationService, 'applicationData.selectedClassSections', 'enrollment application service must prefer selected class sections')
assertRegex(enrollmentApplicationService, /WHERE cs\.id = ANY\(\$\{uniqueClassSectionIds\}::text\[\]\)/, 'enrollment application service must query class sections by requested classSectionId')
assertIncludes(enrollmentApplicationService, 'INSERT INTO "enrollment_applications"', 'enrollment application service must write enrollment_applications')
assertIncludes(enrollmentApplicationService, 'INSERT INTO "enrollment_application_choices"', 'enrollment application service must write enrollment_application_choices')
assertIncludes(enrollmentApplicationService, 'classSectionId', 'enrollment application choices must reference class sections')
assertNotIncludes(applicationV2, 'tx.enrollment.delete({', 'application v2 must not delete historical enrollment records')

assertFileExists('prisma/migrations/20260605000000_enrollment_phase2_foundation/migration.sql', 'phase 2 migration draft')
const migration = read('prisma/migrations/20260605000000_enrollment_phase2_foundation/migration.sql')
for (const table of [
  'academic_years',
  'semesters',
  'class_sections',
  'rosters',
  'roster_members',
  'enrollment_applications',
  'enrollment_application_choices',
  'student_insurances'
]) {
  assertIncludes(migration, `CREATE TABLE "${table}"`, `migration must create ${table}`)
}

console.log('enrollment phase 2 contracts passed')
