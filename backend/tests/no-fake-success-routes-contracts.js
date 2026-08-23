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

const enrollment = read('src/routes/enrollment.ts')
const attendance = read('src/routes/attendance.ts')
const upload = read('src/routes/upload.ts')
const enrollmentService = read('src/services/enrollmentApplicationService.ts')

for (const [label, source] of [
  ['enrollment route', enrollment],
  ['attendance route', attendance],
  ['upload route', upload]
]) {
  assertNotIncludes(source, 'TODO:', `${label} must not ship TODO fake-success handlers`)
}

assertIncludes(enrollment, 'prisma.enrollment.findMany', 'enrollment list must query real enrollments')
assertIncludes(enrollment, 'prisma.enrollment.count', 'enrollment list must use real pagination total')
assertIncludes(enrollment, 'reviewLegacyEnrollment', 'enrollment approval must delegate to the shared review service')
assertIncludes(enrollment, 'prisma.$transaction', 'enrollment approval must run in a transaction')
assertIncludes(enrollmentService, 'tx.enrollment.update', 'shared enrollment review service must update a real enrollment')
assertIncludes(enrollment, 'NOT_IMPLEMENTED', 'unsupported enrollment create path must be explicitly disabled')
assertNotIncludes(enrollment, "message: '报名成功'", 'enrollment create must not return fake success')

assertIncludes(attendance, 'prisma.attendance.findMany', 'attendance list must query real records')
assertIncludes(attendance, 'prisma.attendance.count', 'attendance list must use real pagination total')
assertIncludes(attendance, 'prisma.attendance.findFirst', 'attendance check-in must detect existing same-day records')
assertIncludes(attendance, 'tx.attendance.update', 'attendance check-in must update an existing same-day record in its transaction')
assertIncludes(attendance, 'tx.attendance.create', 'attendance check-in must create a real attendance record in its transaction')
assertIncludes(attendance, 'NOT_IMPLEMENTED', 'face-recognition attendance must be explicitly disabled until implemented')

assertIncludes(upload, 'NOT_IMPLEMENTED', 'unsupported upload OCR/avatar paths must be explicitly disabled')
assertNotIncludes(upload, 'example.com', 'upload route must not return sample public URLs')
assertNotIncludes(upload, '123456789012345678', 'upload route must not return sample ID numbers')

console.log('no fake success route contracts passed')
