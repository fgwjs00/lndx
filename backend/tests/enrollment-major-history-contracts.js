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

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${JSON.stringify(expected)}`)
  }
}

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

const service = read('src/services/enrollmentApplicationService.ts')
const applicationV2 = read('src/routes/applicationV2.ts')
const mobileRegistration = readWorkspace('frontend/src/views/MobileRegistration.vue')

assertIncludes(service, 'collectStudentHistoricalMajors', 'service must expose historical major collection')
assertIncludes(service, 'assertStudentHasNoHistoricalMajorConflict', 'service must expose enrollment major conflict guard')
assertIncludes(service, 'MAJOR_HISTORY_RULE_STARTS_AT', 'major history rule must have an explicit start date')
assertIncludes(service, "2026-09-01T00:00:00.000Z", 'major history rule must start from 2026 autumn')
assertIncludes(service, 'shouldEnforceHistoricalMajorRule', 'service must gate the major history rule by target semester')
assertRegex(
  service,
  /assertStudentHasNoHistoricalMajorConflict[\s\S]*shouldEnforceHistoricalMajorRule\(tx,\s*applicationData\)[\s\S]*return/,
  'major conflict guard must skip semesters before the 2026 autumn start'
)
assertRegex(
  service,
  /FROM "roster_members"[\s\S]*INNER JOIN "class_sections" cs[\s\S]*rm\."studentId" = \$\{studentId\}[\s\S]*rm\.status IN \('ACTIVE', 'DROPPED', 'TRANSFERRED', 'GRADUATED'\)/,
  'historical majors must include all real roster member history states'
)
assertRegex(
  service,
  /FROM "enrollment_applications" ea[\s\S]*INNER JOIN "enrollment_application_choices" eac[\s\S]*ea\."studentId" = \$\{studentId\}[\s\S]*ea\.status = 'APPROVED'/,
  'historical majors must include approved phase 2 application choices'
)
assertRegex(
  service,
  /FROM "enrollments" e[\s\S]*INNER JOIN "courses" c[\s\S]*e\."studentId" = \$\{studentId\}[\s\S]*e\.status = 'APPROVED'/,
  'historical majors must include approved legacy enrollments'
)
assertIncludes(
  service,
  "COALESCE(NULLIF(cs.major, ''), NULLIF(c.category, ''))",
  'class-section major resolution must prefer ClassSection.major and fall back to Course.category'
)
assertRegex(
  service,
  /throw new ValidationError\([\s\S]*已学过[\s\S]*不能再次选择该专业[\s\S]*未学过的专业/,
  'major conflict guard must return a clear learner-facing Chinese validation error'
)

assertIncludes(
  applicationV2,
  'assertStudentHasNoHistoricalMajorConflict',
  'application V2 routes must import the major conflict guard'
)
assertRegex(
  applicationV2,
  /assertStudentHasNoHistoricalMajorConflict\(tx,\s*existingStudent\.id,\s*applicationData\)/,
  'existing students must be checked before creating application records'
)
assertRegex(
  applicationV2,
  /assertStudentHasNoHistoricalMajorConflict\(tx,\s*deletedStudent\.id,\s*applicationData\)/,
  'recovered students must be checked before creating application records'
)
assertIncludes(
  mobileRegistration,
  "message.error(error?.message || '提交失败，请检查表单信息')",
  'mobile registration must display backend validation messages such as repeated major rejection'
)

console.log('enrollment major history contracts passed')
