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

function assertNotIncludes(source, unexpected, label) {
  if (source.includes(unexpected)) {
    throw new Error(`${label}: source must not include ${JSON.stringify(unexpected)}`)
  }
}

const application = read('src/routes/application.ts')
const student = read('src/routes/student.ts')
const course = read('src/routes/course.ts')
const applicationV2 = read('src/routes/applicationV2.ts')

assertIncludes(
  application,
  "import { authMiddleware, requireTeacher } from '@/middleware/auth'",
  'application routes should import role guard'
)
assertIncludes(application, "router.get('/', requireTeacher", 'application list should require teacher role')
assertIncludes(application, "router.get('/statistics', requireTeacher", 'application statistics should require teacher role')
assertIncludes(application, "router.post('/:id/review', requireTeacher", 'application review should require teacher role')

assertIncludes(student, "router.put('/:id/courses', requireTeacher", 'student course updates should require teacher role')
assertNotIncludes(
  student,
  "status: { in: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }\n            },",
  'student list default enrollments should not expose cancelled/rejected courses'
)
assertIncludes(
  student,
  "status: status && typeof status === 'string' ? status.toUpperCase() as any : { in: ['PENDING', 'APPROVED'] }",
  'student list default enrollments should show only current courses'
)

assertIncludes(course, "router.post('/batch-import', requireTeacher", 'course batch import should require teacher role')

assertNotIncludes(applicationV2, 'where: { id: courseId },', 'application v2 should not look up courses by id only')
assertIncludes(applicationV2, 'isActive: true', 'application v2 course checks should require active courses')
assertIncludes(applicationV2, "status: 'PUBLISHED'", 'application v2 course checks should require published courses')
assertIncludes(applicationV2, 'existingStudent && !isAnonymousApplication', 'anonymous v2 should not update existing student master records')

console.log('production hotfix contracts passed')
