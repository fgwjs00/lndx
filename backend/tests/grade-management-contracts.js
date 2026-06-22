const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
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

const gradeUtils = read('backend/src/utils/gradeManagement.ts')
const gradeRoutes = read('backend/src/routes/gradeManagement.ts')
const gradeView = read('frontend/src/views/GradeManagementSimple.vue')
const studentEditModal = read('frontend/src/components/StudentEditModal.vue')

assertIncludes(gradeUtils, "return `${year}年秋季`", 'current semester should use autumn semester naming after September')
assertIncludes(gradeUtils, "return `${year - 1}年秋季`", 'current semester should use autumn semester naming before September')
assertIncludes(gradeRoutes, "router.get('/students'", 'grade management should expose a dedicated full student list endpoint')
assertIncludes(gradeRoutes, 'academicStatus: true', 'grade management student list should include academic status')
assertIncludes(gradeRoutes, 'major: true', 'grade management student list should include major')
assertIncludes(gradeView, "request.get('/grade-management/students')", 'grade management page should not fetch the capped /students list')
assertNotIncludes(gradeView, '/students?page=1&pageSize=100&includeGradeInfo=true', 'grade management page must not be capped at 100 students')
assertIncludes(gradeView, 'handleManualRetention', 'grade management page should expose retention/manual grade adjustment action')
assertIncludes(gradeView, '/grade-management/adjust/', 'grade management page should call the existing grade adjustment endpoint')
assertIncludes(studentEditModal, "major: ''", 'student edit form should track major')
assertIncludes(studentEditModal, 'studentDetail.major ||', 'student edit form should initialize major from detail')
assertIncludes(studentEditModal, 'major: formData.value.major', 'student edit submit should send major to backend')
assertIncludes(studentEditModal, 'name="major"', 'student edit modal should render a major selector/input')

console.log('grade management contracts passed')
