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

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

const applicationV2 = read('src/routes/applicationV2.ts')
const courseRoute = read('src/routes/course.ts')
const service = read('src/services/enrollmentApplicationService.ts')
const scriptsReadme = read('scripts/README-enrollment-phase2.md')
const workspaceRoot = path.resolve(root, '..')
const courseApi = fs.readFileSync(path.join(workspaceRoot, 'frontend/src/api/course.ts'), 'utf8')
const courseView = fs.readFileSync(path.join(workspaceRoot, 'frontend/src/views/Course.vue'), 'utf8')

assertIncludes(service, 'freezeRosterSnapshot', 'enrollment service must expose roster freeze operation')
assertIncludes(service, 'UPDATE "rosters"', 'roster freeze must update a real roster')
assertIncludes(service, 'status = \'PUBLISHED\'::"RosterStatus"', 'roster freeze must publish the roster')
assertIncludes(service, '"publishedAt" = NOW()', 'roster freeze must record publishedAt')
assertIncludes(service, 'ROSTER_NOT_FOUND', 'roster freeze must reject missing rosters')
assertIncludes(service, 'ROSTER_ALREADY_ARCHIVED', 'roster freeze must reject archived rosters')
assertRegex(service, /FROM "roster_members"[\s\S]*status = 'ACTIVE'/, 'roster freeze must count active roster members before publishing')

assertIncludes(applicationV2, "router.post('/rosters/:classSectionId/freeze'", 'application V2 must expose roster freeze endpoint')
assertIncludes(applicationV2, 'freezeRosterSnapshot', 'roster freeze endpoint must call shared service')
assertIncludes(applicationV2, 'requireAdmin', 'roster freeze endpoint must require administrator permissions')

assertIncludes(courseRoute, '"classSectionId"', 'admin course list must expose class section id for roster operations')
assertIncludes(courseRoute, '"rosterStatus"', 'admin course list must expose roster status')
assertIncludes(courseApi, 'freezeRosterSnapshot', 'course API must expose roster freeze operation')
assertIncludes(courseApi, "request.post(`/applications-v2/rosters/${classSectionId}/freeze`", 'course API must call roster freeze endpoint')
assertIncludes(courseView, 'handleFreezeRoster', 'course page must expose a roster freeze action')
assertIncludes(courseView, 'course.classSectionId', 'course page roster freeze action must require classSectionId')

assertIncludes(scriptsReadme, 'Freeze roster', 'phase 2 runbook must document roster freeze')
assertIncludes(scriptsReadme, '/api/applications-v2/rosters/:classSectionId/freeze', 'runbook must name the roster freeze API')

console.log('roster freeze contracts passed')
