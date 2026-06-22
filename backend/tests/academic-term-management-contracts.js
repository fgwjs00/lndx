const fs = require('fs')
const path = require('path')

const backendRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(backendRoot, '..')

function readBackend(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), 'utf8')
}

function readWorkspace(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
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

const courseRoute = readBackend('src/routes/course.ts')
const courseApi = readWorkspace('frontend/src/api/course.ts')
const courseView = readWorkspace('frontend/src/views/Course.vue')

assertIncludes(courseRoute, 'getPhase2SemesterNames', 'course route must read semesters from phase-2 term tables')
assertIncludes(courseRoute, 'getLegacyCourseSemesters', 'course route must keep legacy Course.semester compatibility')
assertIncludes(courseRoute, 'mergeSemesterNames', 'course route must merge phase-2 and legacy semester sources')
assertRegex(
  courseRoute,
  /router\.post\('\/semesters'[\s\S]*requireTeacher/,
  'course route must expose a teacher-only semester creation endpoint'
)
assertRegex(
  courseRoute,
  /router\.post\('\/semesters\/sync-class-sections'[\s\S]*requireTeacher/,
  'course route must expose a teacher-only class section sync endpoint'
)
assertIncludes(courseRoute, 'INSERT INTO "academic_years"', 'semester creation must upsert academic year master data')
assertIncludes(courseRoute, 'INSERT INTO "semesters"', 'semester creation must upsert semester master data')
assertIncludes(courseRoute, 'INSERT INTO "class_sections"', 'class section sync must upsert class section master data')
assertNotIncludes(
  courseRoute,
  'const semesters = await prisma.course.findMany({',
  'semester list endpoint must not be backed only by Course.semester distinct'
)

assertIncludes(courseApi, 'CreateSemesterRequest', 'frontend API must model semester creation payload')
assertIncludes(courseApi, 'createSemester', 'frontend API must expose semester creation')
assertIncludes(courseApi, 'syncSemesterClassSections', 'frontend API must expose class section sync')

assertIncludes(courseView, 'handleCreateCurrentSemester', 'course page must provide current semester creation action')
assertIncludes(courseView, 'handleSyncClassSections', 'course page must provide class section sync action')
assertIncludes(courseView, 'isCurrentSemesterAvailable', 'course page must know when the current semester already exists')
assertNotIncludes(
  courseView,
  "availableSemesters.value = ['2025年秋季',  '2024年秋季']",
  'course page must not fall back to stale hard-coded semesters'
)

console.log('academic term management contracts passed')
