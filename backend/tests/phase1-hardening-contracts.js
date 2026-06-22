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

function assertNotMatches(source, unexpected, label) {
  if (unexpected.test(source)) {
    throw new Error(`${label}: source must not match ${unexpected}`)
  }
}

function assertCodeLine(source, pattern, label) {
  const lines = source
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))

  if (!lines.some(line => pattern.test(line))) {
    throw new Error(`${label}: expected a real code line matching ${pattern}`)
  }
}

const index = read('src/index.ts')
const authMiddleware = read('src/middleware/auth.ts')
const errorHandler = read('src/middleware/errorHandler.ts')
const authRoutes = read('src/routes/auth.ts')
const studentRoutes = read('src/routes/student.ts')
const analysisRoutes = read('src/routes/analysis.ts')
const roleRoutes = read('src/routes/role.ts')
const gradeRoutes = read('src/routes/gradeManagement.ts')
const applicationRoutes = read('src/routes/application.ts')
const applicationV2Routes = read('src/routes/applicationV2.ts')
const tsconfig = read('tsconfig.json')
const imageUtils = fs.existsSync(path.join(root, '../frontend/src/utils/imageUtils.ts'))
  ? fs.readFileSync(path.join(root, '../frontend/src/utils/imageUtils.ts'), 'utf8')
  : ''
const frontendDevUtils = fs.readFileSync(path.join(root, '../frontend/src/utils/dev.ts'), 'utf8')
const frontendViteConfig = fs.readFileSync(path.join(root, '../frontend/vite.config.ts'), 'utf8')
const frontendAuthStore = fs.readFileSync(path.join(root, '../frontend/src/store/auth.ts'), 'utf8')
const frontendRequest = fs.readFileSync(path.join(root, '../frontend/src/api/request.ts'), 'utf8')
const backendPackage = read('package.json')
const loginVue = fs.readFileSync(path.join(root, '../frontend/src/views/Login.vue'), 'utf8')
const baotaDeploy = fs.readFileSync(path.join(root, '../baota-deploy.sh'), 'utf8')
const rootGitignorePath = path.join(root, '../.gitignore')
const healthcheckScript = read('healthcheck.js')
const ecosystemConfig = read('ecosystem.config.js')
const nginxUploadFix = fs.existsSync(path.join(root, '../nginx-uploads-fix.conf'))
  ? fs.readFileSync(path.join(root, '../nginx-uploads-fix.conf'), 'utf8')
  : ''
const nginxBackendUploadConfig = fs.existsSync(path.join(root, 'nginx-uploads-config.conf'))
  ? fs.readFileSync(path.join(root, 'nginx-uploads-config.conf'), 'utf8')
  : ''
const nginxStaticConfig = fs.existsSync(path.join(root, '../nginx-static-config.txt'))
  ? fs.readFileSync(path.join(root, '../nginx-static-config.txt'), 'utf8')
  : ''

assertNotIncludes(index, "app.use('/uploads', cors({", 'uploads must not be publicly served without auth')
assertIncludes(index, "app.use('/uploads', assetAuthMiddleware", 'uploads must require controlled asset auth before static serving')
assertIncludes(baotaDeploy, 'proxy_pass http://127.0.0.1:3001/uploads/;', 'Baota Nginx template must proxy uploads through Express auth')
assertNotIncludes(baotaDeploy, 'alias /www/wwwroot/lndx/uploads/;', 'Baota Nginx template must not expose uploads with alias')
assertIncludes(index, "await prisma.$queryRaw`SELECT 1`", 'health check must verify database connectivity')
assertIncludes(index, "app.get('/health', handleHealthCheck)", 'root health check must use the real health handler')
assertIncludes(index, "app.get(`${apiPrefix}/health`, handleHealthCheck)", 'api health check must use the real health handler')
assertCodeLine(index, /^app\.get\(`\$\{apiPrefix\}\/health`, handleHealthCheck\)$/, 'api health check must not be hidden in a comment')
assertCodeLine(index, /^app\.use\(`\$\{apiPrefix\}\/attendance`, authMiddleware, attendanceRoutes\)$/, 'attendance route must not be hidden in a comment')
assertIncludes(index, 'sanitizeMorganMessage', 'morgan access logs must sanitize auth query tokens')
assertIncludes(index, 'assetAuthMiddleware', 'uploads must accept only controlled asset access middleware')
assertIncludes(index, "app.get(`${apiPrefix}/assets/token`", 'backend must issue short-lived asset tokens through an authenticated endpoint')

assertIncludes(authMiddleware, 'sanitizeAuthUrl', 'auth middleware must sanitize URLs before logging')
assertNotIncludes(authMiddleware, 'token.substring', 'auth middleware must not log token prefixes')
assertIncludes(authMiddleware, 'generateAssetToken', 'auth middleware must generate short-lived asset tokens')
assertIncludes(authMiddleware, 'assetAuthMiddleware', 'uploads must use a dedicated asset token middleware')
assertNotIncludes(authMiddleware, 'req.query.token', 'auth middleware must not accept long-lived JWTs from query strings')
assertIncludes(authMiddleware, 'assetToken', 'asset query tokens must use a distinct short-lived asset token')

assertIncludes(errorHandler, 'sanitizeForLog', 'error handler must sanitize request data')
assertNotIncludes(errorHandler, 'body: req.body', 'error handler must not log raw request body')
assertNotIncludes(errorHandler, 'query: req.query', 'error handler must not log raw query params')

assertIncludes(authRoutes, 'verifySmsCode(value.phone, value.code, value.type)', 'verify-sms route must validate issued SMS code')
assertIncludes(authRoutes, "verifySmsCode(value.phone, smsCode, 'register')", 'register route must validate issued SMS code')
assertNotIncludes(authRoutes, "code === '123456'", 'fixed SMS verification code must not be accepted')
assertNotIncludes(authRoutes, "smsCode !== '123456'", 'fixed registration SMS code must not be accepted')

assertIncludes(studentRoutes, "router.get('/', requireTeacher", 'student list must require teacher role')
assertIncludes(studentRoutes, "router.get('/statistics', requireTeacher", 'student statistics must require teacher role')
assertIncludes(studentRoutes, "router.get('/export', requireTeacher", 'student export must require teacher role')
assertIncludes(studentRoutes, "router.get('/:id', requireTeacher", 'student detail must require teacher role')

assertNotIncludes(analysisRoutes, 'authMiddleware, asyncHandler', 'analysis endpoints must not use auth-only guards')
assertIncludes(analysisRoutes, "router.get('/overview', requireTeacher", 'analysis endpoints must require teacher role')
assertIncludes(roleRoutes, "router.get('/', requireAdmin", 'role list must require admin role')
assertIncludes(roleRoutes, "router.get('/permissions', requireAdmin", 'permission list must require admin role')
assertIncludes(gradeRoutes, "router.get('/students', requireTeacher", 'grade-management student list must require teacher role')

assertIncludes(imageUtils, 'withAssetToken', 'frontend image URLs must append signed asset token for protected uploads')
assertIncludes(imageUtils, 'assetToken', 'frontend image URLs must use a distinct asset token')
assertNotIncludes(imageUtils, "localStorage.getItem('token')", 'frontend image URLs must not append the login JWT')
assertNotIncludes(imageUtils, 'token=', 'frontend image URLs must not use token= query parameters')
assertIncludes(backendPackage, '"tslib"', 'backend runtime dependencies must include tslib for dist start')
assertNotIncludes(tsconfig, '"importHelpers": true', 'backend dist must not require tslib at runtime')

if (!fs.existsSync(rootGitignorePath)) {
  throw new Error('repository boundary: root .gitignore must exist')
}

const rootGitignore = fs.readFileSync(rootGitignorePath, 'utf8')
const requiredGitignoreEntries = [
  '.env',
  'backend/.env',
  'backend/uploads/',
  'backend/backups/',
  'backend/logs/',
  'backend/dist/',
  'backend/node_modules/',
  'frontend/node_modules/',
  'local-db-backups/',
  'lndx_backup_*/',
  '*.dump',
  '*.tar.gz',
  '*.backup',
]

for (const entry of requiredGitignoreEntries) {
  assertIncludes(rootGitignore, entry, 'repository boundary')
}

const forbiddenLoginNeedles = [
  'showTestAccounts',
  'quickLogin',
  '13800000001',
  '13800000002',
  '13800000003',
  '13800000004',
  '测试账号',
]

for (const needle of forbiddenLoginNeedles) {
  assertNotIncludes(loginVue, needle, 'login page must not expose test account shortcuts')
  assertNotIncludes(frontendDevUtils, needle, 'frontend dev utilities must not ship test account data')
}

assertNotIncludes(frontendDevUtils, "code === '123456'", 'frontend dev utilities must not accept a fixed SMS code')
assertNotIncludes(frontendDevUtils, "password: '123456'", 'frontend dev utilities must not ship fixed test passwords')
assertNotIncludes(frontendDevUtils, 'mock_token_', 'frontend dev utilities must not create mock auth tokens')
assertNotIncludes(frontendViteConfig, '__SKIP_CAPTCHA__', 'frontend build config must not define captcha bypass flags')

assertIncludes(healthcheckScript, "path: '/api/health'", 'healthcheck script must call database-backed health endpoint')
assertIncludes(ecosystemConfig, "url: 'http://localhost:3000/api/health'", 'PM2 health check must call database-backed health endpoint')

for (const nginxConfig of [nginxUploadFix, nginxBackendUploadConfig, nginxStaticConfig]) {
  assertNotIncludes(nginxConfig, 'alias /www/wwwroot', 'nginx uploads config must not bypass backend auth with alias')
  assertNotIncludes(nginxConfig, 'Access-Control-Allow-Origin "*"', 'nginx uploads config must not publish uploaded assets with wildcard CORS')
  if (nginxConfig) {
    assertIncludes(nginxConfig, 'proxy_pass http://127.0.0.1:3000/uploads/', 'nginx uploads config must proxy to authenticated backend uploads route')
    assertIncludes(nginxConfig, 'proxy_set_header Authorization $http_authorization', 'nginx uploads config must forward Authorization header')
  }
}

assertNotMatches(frontendAuthStore, /console\.log\([^)]*loginData/, 'frontend auth store must not log login payloads')
assertNotIncludes(frontendAuthStore, 'token: newToken?.substring', 'frontend auth store must not log token prefixes')
assertNotIncludes(frontendRequest, 'tokenPrefix', 'frontend request logging must not log token prefixes')
assertNotMatches(frontendRequest, /console\.log\([^)]*config\.data/, 'frontend request logging must not log request payloads')
assertNotMatches(loginVue, /console\.log\([^)]*values/, 'login page must not log raw form values')
assertNotMatches(loginVue, /console\.log\([^)]*loginData/, 'login page must not log login payloads')
assertNotIncludes(authRoutes, 'token: token ?', 'logout must not include token values in logs')
assertNotMatches(applicationRoutes, /console\.log\([^)]*authorization/i, 'application routes must not log Authorization headers')
assertNotMatches(applicationRoutes, /console\.log\([^)]*applicationData\.idNumber/, 'application routes must not log id numbers')
assertNotMatches(applicationV2Routes, /console\.log\([^)]*req\.body/, 'application V2 routes must not log raw request bodies')
assertNotMatches(studentRoutes, /console\.log\([^)]*JSON\.stringify\(studentData/, 'student routes must not log raw student payloads')
assertNotMatches(studentRoutes, /console\.log\([^)]*studentData\.contactPhone/, 'student routes must not log contact phones')
assertNotMatches(studentRoutes, /console\.log\([^)]*studentData\.idNumber/, 'student routes must not log id numbers')

console.log('phase1 hardening contracts passed')
