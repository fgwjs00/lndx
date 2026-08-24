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

const applicationV2 = readBackend('src/routes/applicationV2.ts')
const publicRegistration = readBackend('src/routes/publicRegistration.ts')
const backendPackage = readBackend('package.json')
const config = readBackend('src/config/index.ts')
const index = readBackend('src/index.ts')
const envTemplate = readBackend('env.production.template')
const courseApi = readWorkspace('frontend/src/api/course.ts')
const mobileRegistration = readWorkspace('frontend/src/views/MobileRegistration.vue')
const requestApi = readWorkspace('frontend/src/api/request.ts')
const loginView = readWorkspace('frontend/src/views/Login.vue')
const studentAddModal = readWorkspace('frontend/src/components/StudentAddModal.vue')
const baotaRunbook = readWorkspace('docs/deployment/baota-migration-runbook.md')
const legacyBaotaGuide = readWorkspace('\u5b9d\u5854\u90e8\u7f72\u6307\u5357.md')
const frontendPackage = readWorkspace('frontend/package.json')

assertIncludes(applicationV2, '"expiresAt" > NOW()', 'temporary application uploads must reject expired files')
assertIncludes(applicationV2, 'AND "isTemp" = TRUE', 'insurance attachments must be claimed only once')
assertIncludes(publicRegistration, 'validateUploadedFileSignature', 'public uploads must validate file signatures')
assertIncludes(publicRegistration, 'discardRejectedUpload', 'invalid public uploads must be removed from disk')

assertIncludes(courseApi, 'duration?: number', 'public course type must expose backend duration')
assertIncludes(courseApi, 'timeSlots?:', 'public course type must expose backend time slots')
assertIncludes(mobileRegistration, 'getCourseDuration(course)', 'mobile course cards must use the public duration field')
assertIncludes(mobileRegistration, 'formatCourseTimeSlots(course)', 'mobile course cards must render public time slots')
assertIncludes(requestApi, "'/public-registration/'", 'anonymous registration requests must be recognized as public')
assertIncludes(requestApi, "else if (!isPublicApiPath(config.url))", 'public requests must not emit missing-token warnings')
if (loginView.includes('AuthService.getCaptcha()')) {
  throw new Error('login view must not call an unavailable captcha endpoint')
}
assertIncludes(studentAddModal, 'idCardData.certNo', 'student card reader must use the normalized certificate number')
assertIncludes(studentAddModal, 'idCardData.nation', 'student card reader must use the normalized nationality')
assertIncludes(studentAddModal, 'ApplicationService.uploadIdCardImage(file)', 'student identity uploads must call an implemented API')
if (studentAddModal.includes('ApplicationService.uploadImage(')) {
  throw new Error('student identity uploads must not call the removed uploadImage API')
}

assertIncludes(backendPackage, 'pnpm prisma:generate && tsc && tsc-alias', 'backend builds must refresh Prisma Client')
assertIncludes(config, 'trustProxyHops', 'proxy hop count must be explicit configuration')
assertIncludes(index, "app.set('trust proxy', config.trustProxyHops)", 'Express must trust only the configured proxy hops')
assertIncludes(envTemplate, 'TRUST_PROXY_HOPS=1', 'Baota production template must declare one trusted Nginx hop')
assertIncludes(baotaRunbook, 'TRUST_PROXY_HOPS=1', 'Baota runbook must document the trusted Nginx hop')
assertIncludes(legacyBaotaGuide, '\u5df2\u505c\u7528', 'legacy whole-project Baota guide must be visibly retired')
assertIncludes(frontendPackage, '"typecheck": "vue-tsc --noEmit"', 'frontend must expose a real Vue typecheck gate')

console.log('p1 second audit runtime contracts passed')
