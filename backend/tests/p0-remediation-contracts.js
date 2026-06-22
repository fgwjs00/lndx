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

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

const applicationV2 = read('src/routes/applicationV2.ts')
const index = read('src/index.ts')
const userRoutes = read('src/routes/user.ts')
const userVue = readWorkspace('frontend/src/views/User.vue')
const publicRegistration = read('src/routes/publicRegistration.ts')
const smsService = read('src/services/smsService.ts')

assertNotIncludes(
  applicationV2,
  'if (result.enrollments.length === 0) {',
  'application v2 must not fail phase-2 applications only because no legacy Enrollment rows were created'
)
assertIncludes(
  applicationV2,
  'hasSuccessfulEnrollmentResult(result)',
  'application v2 success must consider phase-2 application creation as well as legacy Enrollment rows'
)
assertIncludes(
  applicationV2,
  'phase2ApplicationId',
  'application v2 responses must expose the phase-2 application id for auditability'
)

const attendanceMountCount = (index.match(/app\.use\(`\$\{apiPrefix\}\/attendance`, authMiddleware, attendanceRoutes\)/g) || []).length
if (attendanceMountCount !== 1) {
  throw new Error(`attendance route should be mounted exactly once, found ${attendanceMountCount}`)
}

assertNotIncludes(userVue, "'123456'", 'frontend user reset must not send a fixed default password')
assertNotIncludes(userVue, '默认密码', 'frontend user reset message must not announce a fixed default password')
assertIncludes(userVue, 'temporaryPassword', 'frontend user reset must display the backend-generated temporary password')
assertIncludes(userRoutes, 'generateTemporaryPassword', 'backend user reset must generate unpredictable temporary passwords')
assertIncludes(userRoutes, 'temporaryPassword', 'backend user reset response must return the generated temporary password to the admin')
assertNotIncludes(userRoutes, "const { newPassword } = req.body", 'backend user reset must not depend on caller-provided fixed passwords')

assertIncludes(
  publicRegistration,
  "import { uploadLimiter } from '@/middleware/rateLimiter'",
  'public insurance upload must use a dedicated upload limiter'
)
assertIncludes(
  publicRegistration,
  "router.post('/insurance-upload', uploadLimiter, insuranceUpload.single('file')",
  'public insurance upload must apply uploadLimiter before multer'
)
assertIncludes(publicRegistration, 'isTemp: true', 'public insurance uploads must be temporary until bound to an application')
assertIncludes(publicRegistration, 'validateInsuranceUploadMimeType', 'public insurance upload must validate MIME type explicitly')

assertIncludes(smsService, "config.nodeEnv === 'production'", 'SMS provider must distinguish production from development')
assertIncludes(smsService, 'SMS_PROVIDER_NOT_CONFIGURED', 'production SMS must fail closed when provider configuration is incomplete')
assertRegex(
  smsService,
  /if \(!this\.accessKeyId \|\| !this\.accessKeySecret\)[\s\S]*throw new Error\('SMS_PROVIDER_NOT_CONFIGURED'\)/,
  'production SMS must not silently simulate success without provider credentials'
)

console.log('p0 remediation contracts passed')
