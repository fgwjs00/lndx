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
const servicePath = path.join(root, 'src/services/studentAcademicEventService.ts')
if (!fs.existsSync(servicePath)) {
  throw new Error('student academic event service must exist')
}

const service = fs.readFileSync(servicePath, 'utf8')
const gradeRoutes = read('src/routes/gradeManagement.ts')
const studentRoutes = read('src/routes/student.ts')

assertIncludes(schema, 'model StudentAcademicEvent', 'schema must define append-only student academic events')
assertIncludes(schema, 'academicEvents     StudentAcademicEvent[]', 'Student must expose academic event history')
assertIncludes(schema, '@@map("student_academic_events")', 'student academic events must use a stable table name')

assertIncludes(service, 'recordStudentAcademicEvent', 'service must expose academic event recorder')
assertIncludes(service, 'tx.studentAcademicEvent.create', 'service must create academic event rows')
assertIncludes(service, 'GRADE_ADJUSTMENT', 'service or routes must record grade adjustment events')
assertIncludes(service, 'MAJOR_CHANGE', 'service or routes must record major change events')

assertIncludes(gradeRoutes, "from '@/services/studentAcademicEventService'", 'grade management route must import academic event service')
assertIncludes(gradeRoutes, 'recordStudentAcademicEvent(tx,', 'grade adjustment must append an academic event in the transaction')
assertIncludes(gradeRoutes, 'prisma.$transaction', 'grade adjustment must update student and event atomically')

assertIncludes(studentRoutes, "from '@/services/studentAcademicEventService'", 'student route must import academic event service')
assertIncludes(studentRoutes, 'recordStudentAcademicEvent(tx,', 'student major changes must append an academic event')
assertIncludes(studentRoutes, 'STUDENT_ACADEMIC_EVENT_TYPES.MAJOR_CHANGE', 'student route must mark major changes explicitly')

console.log('student academic events contracts passed')
