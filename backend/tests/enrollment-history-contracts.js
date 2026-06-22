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

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

const studentRoutes = read('src/routes/student.ts')
const applicationRoutes = read('src/routes/application.ts')
const applicationV2Routes = read('src/routes/applicationV2.ts')

assertNotIncludes(applicationV2Routes, 'tx.enrollment.delete({', 'application V2 must preserve rejected/cancelled enrollment history')

assertNotIncludes(studentRoutes, 'tx.enrollment.deleteMany({', 'student deletion must not physically delete enrollments')
assertRegex(
  studentRoutes,
  /tx\.enrollment\.updateMany\([\s\S]*status:\s*\{\s*in:\s*\['PENDING',\s*'APPROVED'\]\s*\}[\s\S]*status:\s*'CANCELLED'[\s\S]*cancelledAt:\s*new Date\(\)[\s\S]*cancelReason:/,
  'student deletion must cancel only active enrollments with cancellation metadata'
)

assertNotIncludes(
  studentRoutes,
  "status: 'APPROVED',\n              enrollmentDate: new Date(),\n              createdBy:",
  'student course update must not resurrect old rejected/cancelled enrollments'
)
assertIncludes(studentRoutes, 'skipHistoricalEnrollmentReuse', 'student course update must explicitly skip historical enrollment reuse')

assertIncludes(applicationRoutes, "if (enrollment.status !== 'PENDING')", 'application review must reject second review attempts')
assertIncludes(applicationRoutes, "status: 'PENDING'", 'application update must only edit pending enrollments')
assertNotIncludes(applicationRoutes, 'updateData.courseId = courseId', 'application update must not overwrite historical courseId')

console.log('enrollment history contracts passed')
