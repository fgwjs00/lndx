const fs = require('fs')
const path = require('path')

const workspaceRoot = path.resolve(__dirname, '..', '..')
const backendRoot = path.join(workspaceRoot, 'backend')

function readWorkspace(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
}

function existsWorkspace(relativePath) {
  return fs.existsSync(path.join(workspaceRoot, relativePath))
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

function migrationDirs() {
  return fs.readdirSync(path.join(backendRoot, 'prisma/migrations'))
    .filter((name) => fs.statSync(path.join(backendRoot, 'prisma/migrations', name)).isDirectory())
    .sort()
}

if (!existsWorkspace('backend/scripts/check-prisma-migration-state.js')) {
  throw new Error('readonly Prisma migration state checker must exist')
}
if (!existsWorkspace('backend/scripts/check-baota-copy-boundary.js')) {
  throw new Error('Baota copy boundary checker must exist')
}
if (!existsWorkspace('docs/deployment/baota-migration-runbook.md')) {
  throw new Error('Baota migration runbook must exist')
}

const migrationChecker = readWorkspace('backend/scripts/check-prisma-migration-state.js')
const copyChecker = readWorkspace('backend/scripts/check-baota-copy-boundary.js')
const phase2Readme = readWorkspace('backend/scripts/README-enrollment-phase2.md')
const runbook = readWorkspace('docs/deployment/baota-migration-runbook.md')
const rootGitignore = readWorkspace('.gitignore')
const baotaDeploy = readWorkspace('baota-deploy.sh')
const ecosystem = readWorkspace('backend/ecosystem.config.js')
const simpleNginxUploads = readWorkspace('backend/simple_nginx_uploads.conf')
const debugNginxConfig = readWorkspace('backend/debug_nginx_config.sh')
const backendNginxUploads = readWorkspace('backend/nginx-uploads-config.conf')
const rootNginxUploads = readWorkspace('nginx-uploads-fix.conf')

assertIncludes(migrationChecker, 'DRY_RUN_ONLY', 'migration checker must be read-only by default')
assertIncludes(migrationChecker, 'P3005', 'migration checker must explain non-empty database baseline risk')
assertIncludes(migrationChecker, '_prisma_migrations', 'migration checker must inspect Prisma migration bookkeeping')
assertIncludes(migrationChecker, 'migrate resolve --applied', 'migration checker must recommend explicit baseline commands')
assertIncludes(migrationChecker, '20250814161629_111', 'migration checker must inspect the initial migration')
assertIncludes(migrationChecker, 'enrollments.insuranceStart', 'migration checker must inspect historical insurance columns')
assertIncludes(migrationChecker, 'courses.credits', 'migration checker must inspect historical course columns')
assertIncludes(migrationChecker, 'students.photo', 'migration checker must inspect historical student photo column')
assertIncludes(migrationChecker, 'student_academic_events', 'migration checker must know about the latest academic event migration')
assertNotIncludes(migrationChecker, 'migrate deploy', 'migration checker must not run migrate deploy itself')
assertNotIncludes(migrationChecker, 'db execute', 'migration checker must not execute SQL itself')

assertIncludes(copyChecker, 'COPY_EXCLUDE_PATTERNS', 'copy checker must define Baota exclude patterns')
for (const entry of [
  'node_modules/',
  'backend/node_modules/',
  'frontend/node_modules/',
  'backend/dist/',
  'frontend/dist/',
  'logs/',
  'backend/logs/',
  'backend/uploads/',
  'backend/.env',
  'lndx_backup_*/',
  '*.dump',
  '*.tar.gz',
  '.git/'
]) {
  assertIncludes(copyChecker, entry, `copy checker must exclude ${entry}`)
  assertIncludes(rootGitignore, entry === '.git/' ? '.git' : entry, `gitignore should protect ${entry}`)
}
assertIncludes(copyChecker, 'baota-source-manifest', 'copy checker must write a source manifest for Baota copy review')
assertIncludes(copyChecker, 'baota-build-manifest', 'copy checker must write a build artifact manifest for Baota copy review')
assertIncludes(copyChecker, 'baota-forbidden-local-paths', 'copy checker must write a forbidden local path report')
assertIncludes(copyChecker, 'REQUIRED_BUILD_ARTIFACTS', 'copy checker must identify required build artifacts')
assertIncludes(copyChecker, 'localForbiddenPathCount', 'copy checker must report local forbidden paths that must not be copied')
assertIncludes(copyChecker, 'git ls-files', 'copy checker must derive deployable source files from Git tracking')
assertIncludes(copyChecker, 'git ls-files --others --exclude-standard', 'copy checker must inspect untracked deployable source files')
assertIncludes(copyChecker, 'untrackedDeployableSources', 'copy checker must report untracked deployable sources before Baota copy')
assertIncludes(copyChecker, 'Baota copy boundary failed: untracked deployable source files exist.', 'copy checker must fail when deployable source files are not tracked')

assertIncludes(baotaDeploy, 'proxy_pass http://127.0.0.1:3001/uploads/;', 'Baota deploy template must proxy uploads through backend auth')
assertNotIncludes(baotaDeploy, 'alias /www/wwwroot/lndx/uploads/;', 'Baota deploy template must not publish uploads directly')
assertIncludes(baotaDeploy, 'LNDX_ALLOW_LEGACY_BAOTA_DEPLOY', 'legacy Baota deploy script must be disabled by default')
assertIncludes(runbook, 'baota-deploy.sh` is a legacy script', 'runbook must mark the legacy deploy script as disabled')
assertNotIncludes(ecosystem, 'prisma:deploy', 'PM2 deploy hooks must not auto-run Prisma migrations')
assertIncludes(ecosystem, 'Database migrations are run manually', 'PM2 config must document manual migration governance')

for (const [label, source] of [
  ['backend/simple_nginx_uploads.conf', simpleNginxUploads],
  ['backend/debug_nginx_config.sh', debugNginxConfig],
  ['backend/nginx-uploads-config.conf', backendNginxUploads],
  ['nginx-uploads-fix.conf', rootNginxUploads]
]) {
  assertIncludes(source, 'proxy_pass', `${label} must proxy uploads to Express auth`)
  assertIncludes(source, 'Authorization', `${label} must forward Authorization for uploads`)
  assertNotIncludes(source, 'alias /www/wwwroot', `${label} must not expose uploads with alias`)
  assertNotIncludes(source, 'Access-Control-Allow-Origin "*"', `${label} must not publish wildcard CORS for uploads`)
}

for (const migration of migrationDirs()) {
  assertIncludes(runbook, migration, `runbook must mention migration ${migration}`)
}
assertIncludes(runbook, 'P3005', 'runbook must document Prisma P3005 behavior')
assertIncludes(runbook, 'npx prisma migrate resolve --applied', 'runbook must document baseline resolve commands')
assertIncludes(runbook, 'npx prisma migrate deploy', 'runbook must document when migrate deploy is allowed')
assertIncludes(runbook, 'npx prisma db execute', 'runbook must document manual SQL fallback for rehearsals')
assertIncludes(runbook, 'pg_dump', 'runbook must require production backup')
assertIncludes(runbook, 'pg_restore', 'runbook must require local restore rehearsal')
assertIncludes(runbook, 'check-baota-copy-boundary.js', 'runbook must require copy boundary verification')
assertIncludes(runbook, 'baota-build-manifest.txt', 'runbook must document the build artifact manifest')
assertIncludes(runbook, 'baota-forbidden-local-paths.txt', 'runbook must document forbidden local path report')
assertIncludes(runbook, 'frontend/dist/', 'runbook must keep frontend build output separate from source')
assertIncludes(runbook, 'backend/dist/', 'runbook must keep backend build output separate from source')
assertIncludes(phase2Readme, 'docs/deployment/baota-migration-runbook.md', 'phase 2 README must point to the deployment runbook')
assertIncludes(phase2Readme, 'backend/uploads/', 'phase 2 README must exclude uploaded runtime files from Baota copy')
assertIncludes(phase2Readme, 'check-baota-copy-boundary.js', 'phase 2 README must require copy boundary verification')

console.log('migration governance contracts passed')
