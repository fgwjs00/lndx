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

const service = read('src/services/enrollmentApplicationService.ts')
const studentRoutes = read('src/routes/student.ts')
const config = read('src/config/index.ts')
const envTemplate = read('env.production.template')
const baotaUploadGuide = readWorkspace('宝塔面板图片上传配置指南.md')

assertIncludes(
  service,
  'assertStudentCanEnrollCoursesByHistoricalMajor',
  'service must expose a guard for backend direct course enrollment writes'
)
assertIncludes(
  service,
  'assertStudentCanEnrollClassSectionsByHistoricalMajor',
  'service must expose a guard for approval-time class section enrollment writes'
)
assertRegex(
  service,
  /reviewEnrollmentApplication[\s\S]*assertStudentCanEnrollClassSectionsByHistoricalMajor[\s\S]*addRosterMemberForChoice/,
  'phase 2 approval must re-check historical major conflicts before roster writes'
)

assertIncludes(
  studentRoutes,
  'assertStudentCanEnrollCoursesByHistoricalMajor',
  'student routes must import the backend direct enrollment guard'
)
assertRegex(
  studentRoutes,
  /router\.post\('\/'[\s\S]*assertStudentCanEnrollCoursesByHistoricalMajor[\s\S]*tx\.enrollment\.create/,
  'manual student creation with courses must check historical majors before creating approved enrollments'
)
assertRegex(
  studentRoutes,
  /router\.put\('\/:id\/courses'[\s\S]*assertStudentCanEnrollCoursesByHistoricalMajor[\s\S]*tx\.enrollment\.(?:create|update)/,
  'student course replacement must check historical majors before creating or reactivating approved enrollments'
)
assertRegex(
  studentRoutes,
  /router\.patch\('\/:id\/status'[\s\S]*status === 'APPROVED'[\s\S]*assertStudentCanEnrollCoursesByHistoricalMajor/,
  'student status approval shortcut must check historical majors before approving enrollments'
)

assertNotIncludes(config, "|| 'mysql://root:password@localhost:3306/lndx_db'", 'production config must not contain a default database URL')
assertNotIncludes(config, "|| 'your_super_secret_jwt_key_here'", 'production config must not contain a default JWT secret')
assertIncludes(config, "config.nodeEnv === 'production'", 'configuration validation must explicitly cover production')
assertRegex(
  config,
  /if \(config\.nodeEnv === 'production'\)[\s\S]*validateConfig\(\)/,
  'production startup must fail fast when required configuration is missing'
)

assertNotIncludes(envTemplate, 'lndx_pass_2026_secure', 'production env template must not contain real-looking database passwords')
assertNotIncludes(envTemplate, 'lndx_production_jwt_secret_key', 'production env template must not contain real-looking JWT secrets')
assertIncludes(envTemplate, '<CHANGE_ME_DATABASE_URL>', 'production env template must use explicit placeholders')
assertIncludes(envTemplate, '<CHANGE_ME_JWT_SECRET>', 'production env template must use explicit JWT placeholder')
assertIncludes(envTemplate, 'BCRYPT_ROUNDS', 'production env template must use the same bcrypt variable name as the application')
assertNotIncludes(envTemplate, 'BCRYPT_SALT_ROUNDS', 'production env template must not use stale bcrypt variable names')

assertNotIncludes(baotaUploadGuide, 'alias /www/wwwroot/lndx/backend/uploads/', 'Baota upload guide must not expose uploads with nginx alias')
assertNotIncludes(baotaUploadGuide, 'curl -I http://your-domain.com/uploads/', 'Baota upload guide must not document public upload URL checks')
assertIncludes(baotaUploadGuide, 'proxy_pass http://127.0.0.1:3000/uploads/', 'Baota upload guide must proxy uploads through Express auth')

console.log('p0 follow-up contracts passed')
