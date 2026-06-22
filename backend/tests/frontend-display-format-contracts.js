const fs = require('fs')
const path = require('path')

const workspaceRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(workspaceRoot, relativePath))
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

assertFileExists('frontend/src/utils/displayFormatters.ts', 'shared display formatter module')

const formatters = read('frontend/src/utils/displayFormatters.ts')
const rosterView = read('frontend/src/views/RosterManagement.vue')
const insuranceReview = read('frontend/src/views/InsuranceReview.vue')
const applicationDetail = read('frontend/src/components/ApplicationDetailModal.vue')
const attendanceView = read('frontend/src/views/Attendance.vue')
const mobileRegistration = read('frontend/src/views/MobileRegistration.vue')

assertIncludes(formatters, 'formatGender', 'shared formatter must expose gender display')
assertIncludes(formatters, 'formatClassSectionCode', 'shared formatter must expose class section code display')
assertIncludes(formatters, 'formatAcademicYearName', 'shared formatter must expose academic year display')
assertIncludes(formatters, 'hasUsableAttachment', 'shared formatter must detect placeholder attachments')
assertIncludes(formatters, 'formatAttachmentLabel', 'shared formatter must expose attachment label display')
assertIncludes(formatters, 'academic', 'academic year formatter must handle English source labels')
assertIncludes(formatters, 'autumn', 'class section formatter must handle English season source labels')
assertIncludes(formatters, 'default-avatar', 'attachment formatter must reject default avatar placeholders')

assertIncludes(rosterView, "from '@/utils/displayFormatters'", 'roster page must use shared display formatters')
assertIncludes(insuranceReview, "from '@/utils/displayFormatters'", 'insurance review page must use shared display formatters')
assertIncludes(applicationDetail, "from '@/utils/displayFormatters'", 'application detail modal must use shared display formatters')

assertNotIncludes(rosterView, 'const formatGender =', 'roster page must not keep local gender formatter')
assertNotIncludes(rosterView, 'const formatClassSectionCode =', 'roster page must not keep local class section formatter')
assertNotIncludes(rosterView, 'const formatAcademicYearName =', 'roster page must not keep local academic year formatter')
assertNotIncludes(insuranceReview, 'const formatAcademicYearName =', 'insurance page must not keep local academic year formatter')
assertNotIncludes(insuranceReview, 'const hasUsableAttachment =', 'insurance page must not keep local attachment placeholder logic')
assertNotIncludes(insuranceReview, 'const formatAttachmentLabel =', 'insurance page must not keep local attachment label formatter')

assertIncludes(applicationDetail, 'formatClassSectionCode(reviewSnapshot.classSectionCode', 'application detail must not display raw class section code')
assertNotIncludes(applicationDetail, '{{ reviewSnapshot.classSectionCode ||', 'application detail must not render raw class section code')

assertNotIncludes(attendanceView, 'Failed to load', 'attendance page visible error messages must be Chinese')
assertNotIncludes(mobileRegistration, '}} courses', 'mobile registration must not display English course-count copy')

console.log('frontend display format contracts passed')
