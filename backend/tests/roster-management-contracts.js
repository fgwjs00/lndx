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

const applicationV2 = readBackend('src/routes/applicationV2.ts')
const service = readBackend('src/services/enrollmentApplicationService.ts')
const courseApi = readWorkspace('frontend/src/api/course.ts')
const router = readWorkspace('frontend/src/router/index.ts')
const baseLayout = readWorkspace('frontend/src/components/BaseLayout.vue')
const rosterView = readWorkspace('frontend/src/views/RosterManagement.vue')
const displayFormatters = readWorkspace('frontend/src/utils/displayFormatters.ts')

assertIncludes(service, 'getRosterManagementRows', 'enrollment service must expose roster management rows')
assertIncludes(service, 'getRosterMemberRows', 'enrollment service must expose roster member detail rows')
assertIncludes(service, 'pendingApplicationCount', 'roster rows must expose pending application count')
assertIncludes(service, 'activeMemberCount', 'roster rows must expose active roster member count')
assertIncludes(service, 'LEFT JOIN "rosters"', 'roster management query must include roster status')
assertIncludes(service, 'LEFT JOIN "roster_members"', 'roster management query must include member count')
assertIncludes(service, 'LEFT JOIN "enrollment_application_choices"', 'roster management query must include pending choices')
assertIncludes(service, 'sourceEnrollmentMetadata', 'roster member rows must expose source enrollment metadata for history snapshots')

assertIncludes(applicationV2, "router.get('/rosters'", 'application V2 must expose roster management list endpoint')
assertIncludes(applicationV2, "router.get('/rosters/:classSectionId/members'", 'application V2 must expose roster member detail endpoint')
assertIncludes(applicationV2, "router.get('/rosters/:classSectionId/export'", 'application V2 must expose roster CSV export endpoint')
assertIncludes(applicationV2, 'getRosterManagementRows', 'roster management endpoint must use shared service')
assertIncludes(applicationV2, 'getRosterMemberRows', 'roster member endpoints must use shared service')
assertIncludes(applicationV2, 'requireTeacher', 'roster management endpoint must require teacher/admin permissions')
assertRegex(applicationV2, /router\.get\('\/rosters'[\s\S]*pageSize[\s\S]*total/, 'roster endpoint must return pagination metadata')
assertIncludes(applicationV2, 'text/csv; charset=utf-8', 'roster export must return CSV content')

assertIncludes(courseApi, 'RosterManagementRow', 'frontend API must model roster management rows')
assertIncludes(courseApi, 'RosterMemberRow', 'frontend API must model roster member rows')
assertIncludes(courseApi, 'getRosterManagementList', 'frontend API must expose roster management list')
assertIncludes(courseApi, 'getRosterMembers', 'frontend API must expose roster member detail loading')
assertIncludes(courseApi, 'exportRosterMembers', 'frontend API must expose roster CSV export')
assertIncludes(courseApi, "request.get<PaginatedResponse<RosterManagementRow>>('/applications-v2/rosters'", 'frontend API must call roster list endpoint')

assertIncludes(router, "path: 'rosters'", 'frontend router must expose roster management page')
assertIncludes(router, "component: () => import('@/views/RosterManagement.vue')", 'roster route must load roster management view')
assertIncludes(baseLayout, "name: '花名册管理'", 'sidebar must link roster management')
assertIncludes(baseLayout, "path: '/rosters'", 'sidebar roster item must use /rosters')

assertIncludes(rosterView, 'getRosterManagementList', 'roster view must load real backend roster data')
assertIncludes(rosterView, 'getRosterMembers', 'roster view must load roster members')
assertIncludes(rosterView, 'exportRosterMembers', 'roster view must export roster members')
assertIncludes(rosterView, 'membersVisible', 'roster view must show member detail modal')
assertIncludes(rosterView, 'reviewSnapshot', 'roster member detail must display review snapshot metadata')
assertIncludes(rosterView, 'formatGender', 'roster member detail must format gender enums for display')
assertNotIncludes(rosterView, '{{ member.gender }}', 'roster member detail must not display raw gender enum values')
assertIncludes(rosterView, 'formatClassSectionCode', 'roster list must format technical class section codes for display')
assertIncludes(rosterView, 'formatAcademicYearName', 'roster list must format academic year labels for display')
assertNotIncludes(rosterView, '{{ roster.classSectionCode }}', 'roster list must not display raw class section codes')
assertNotIncludes(rosterView, '{{ roster.academicYearName }}', 'roster list must not display raw academic year names')
assertIncludes(displayFormatters, 'academic', 'academic year formatter must handle English source labels')
assertIncludes(displayFormatters, 'year', 'academic year formatter must handle English source labels')
assertIncludes(displayFormatters, 'autumn', 'class section code formatter must handle English season codes')
assertIncludes(rosterView, 'freezeRosterSnapshot', 'roster view must expose freeze action')
assertIncludes(rosterView, 'pendingApplicationCount', 'roster view must show pending applications before freezing')
assertIncludes(rosterView, 'rosterStatus', 'roster view must show roster status')

console.log('roster management contracts passed')
