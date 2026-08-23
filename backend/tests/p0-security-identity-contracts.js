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

function assertNotIncludes(source, unexpected, label) {
  if (source.includes(unexpected)) {
    throw new Error(`${label}: source must not include ${JSON.stringify(unexpected)}`)
  }
}

const index = read('src/index.ts')
const application = read('src/routes/application.ts')
const applicationV2 = read('src/routes/applicationV2.ts')
const publicRegistration = read('src/routes/publicRegistration.ts')
const enrollmentApplicationService = read('src/services/enrollmentApplicationService.ts')
const mobileRegistration = readWorkspace('frontend/src/views/MobileRegistration.vue')

assertIncludes(index, 'assetAccessMiddleware', 'uploads must use resource-level authorization')
assertIncludes(index, "app.use('/uploads', assetAuthMiddleware, assetAccessMiddleware", 'uploads must authorize each requested resource')
assertIncludes(application, "router.get('/check-id', requireTeacher", 'legacy ID checks must be staff-only')
assertIncludes(application, "router.get('/student-enrollments', requireTeacher", 'legacy enrollment history must be staff-only')
assertIncludes(application, "router.put('/:id', requireTeacher", 'legacy application edits must be staff-only')
assertIncludes(application, "router.get('/check-id/:idNumber', requireTeacher", 'legacy full student lookup must be staff-only')
assertIncludes(applicationV2, "router.post('/', authMiddleware, requireTeacher", 'staff application submission must require a staff role')
assertIncludes(applicationV2, 'getAnonymousApplicantPhone', 'anonymous registration must validate the required contact phone')
assertIncludes(applicationV2, 'assertStudentPhoneMatchesRecord', 'existing students must still match their recorded phone')
assertIncludes(applicationV2, 'requireMatchingOwner', 'insurance attachment must match the submitted phone')
assertIncludes(publicRegistration, 'ownerPhone: contactPhone', 'public insurance upload must persist the declared owner phone')
assertNotIncludes(applicationV2, 'verifyEnrollmentVerificationToken', 'anonymous registration must not require SMS verification')
assertNotIncludes(publicRegistration, 'verifyEnrollmentVerificationToken', 'public insurance upload must not require SMS verification')
assertIncludes(enrollmentApplicationService, 'assertEnrollmentWindowOpen', 'phase-2 applications must enforce the enrollment window')
assertIncludes(enrollmentApplicationService, 'ENROLLMENT_WINDOW_CLOSED', 'closed enrollment windows must return a stable business error')
assertNotIncludes(mobileRegistration, 'enrollmentVerificationToken', 'mobile registration must not expose SMS verification')
assertNotIncludes(mobileRegistration, 'sendEnrollmentVerificationCode', 'mobile registration must not request SMS codes')

console.log('p0 security and identity contracts passed')
