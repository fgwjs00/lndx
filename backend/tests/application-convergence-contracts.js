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

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: expected source to match ${pattern}`)
  }
}

function assertCount(source, expected, count, label) {
  const actual = source.split(expected).length - 1
  if (actual !== count) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)} to appear ${count} time(s), found ${actual}`)
  }
}

const service = readBackend('src/services/enrollmentApplicationService.ts')
const legacyApplicationRoute = readBackend('src/routes/application.ts')
const applicationApi = readWorkspace('frontend/src/api/application.ts')
const applicationView = readWorkspace('frontend/src/views/Application.vue')
const applicationDetailModal = readWorkspace('frontend/src/components/ApplicationDetailModal.vue')
const faceRecognition = readWorkspace('frontend/src/components/FaceRecognition.vue')

assertIncludes(service, 'getPhase2PendingApplicationRows', 'application service must expose phase 2 pending list rows')
assertIncludes(service, 'batchReviewApplicationTargets', 'application service must expose transactional batch review')
assertIncludes(service, 'Phase2PendingApplicationRow', 'phase 2 list rows must have an explicit shape')
assertIncludes(service, 'targetType: \'phase2Application\'', 'phase 2 pending rows must carry a review target type')
assertIncludes(service, 'NOT EXISTS', 'phase 2 list query must avoid duplicating visible legacy pending enrollments')
assertIncludes(service, 'reviewEnrollmentApplication(tx, {', 'batch review must be able to review phase 2 applications')
assertIncludes(service, 'reviewLegacyEnrollment(tx, {', 'batch review must be able to review legacy enrollments')
assertNotIncludes(service, 'tx.classSection.', 'phase 2 service must not depend on generated classSection Prisma delegate')
assertNotIncludes(service, 'tx.enrollmentApplication.', 'phase 2 service must not depend on generated enrollmentApplication Prisma delegate')
assertNotIncludes(service, 'tx.enrollmentApplicationChoice.', 'phase 2 service must not depend on generated enrollmentApplicationChoice Prisma delegate')
assertNotIncludes(service, 'tx.roster.', 'phase 2 service must not depend on generated roster Prisma delegate')
assertNotIncludes(service, 'tx.rosterMember.', 'phase 2 service must not depend on generated rosterMember Prisma delegate')

assertIncludes(legacyApplicationRoute, 'getPhase2PendingApplicationRows', 'legacy application list must merge phase 2 pending rows')
assertIncludes(legacyApplicationRoute, 'batchReviewApplicationTargets', 'legacy application route must use service batch review')
assertIncludes(legacyApplicationRoute, "router.post('/batch-review'", 'legacy application route must expose batch review endpoint')
assertRegex(
  legacyApplicationRoute,
  /router\.get\('\/'[\s\S]*getPhase2PendingApplicationRows[\s\S]*list:\s*mergedApplications/,
  'application list must return merged legacy and phase 2 rows'
)
assertNotIncludes(
  legacyApplicationRoute,
  'Number(page) === 1',
  'application list must not merge phase 2 pending rows only on the first page'
)
assertNotIncludes(
  legacyApplicationRoute,
  'skip: (Number(page) - 1) * Number(pageSize)',
  'application list must not paginate legacy rows before merging phase 2 rows'
)
assertNotIncludes(
  legacyApplicationRoute,
  'take: Number(pageSize)',
  'application list must not cap legacy rows before merging phase 2 rows'
)
assertRegex(
  legacyApplicationRoute,
  /mergedAllApplications[\s\S]*\.sort\([\s\S]*enrollmentDate[\s\S]*\.slice\(\s*\(pageNum - 1\) \* pageSizeNum,\s*pageNum \* pageSizeNum\s*\)/,
  'application list must sort and paginate the merged legacy and phase 2 rows together'
)
assertRegex(
  legacyApplicationRoute,
  /router\.get\('\/statistics'[\s\S]*getPhase2PendingApplicationRows[\s\S]*phase2PendingCount/,
  'application statistics must include phase 2 pending rows'
)
assertRegex(
  legacyApplicationRoute,
  /pending:\s*pending\s*\+\s*phase2PendingCount/,
  'application statistics pending count must include phase 2 pending rows'
)
assertRegex(
  legacyApplicationRoute,
  /total:\s*totalEnrollments\s*\+\s*phase2PendingCount/,
  'application statistics total count must include phase 2 pending rows'
)
assertIncludes(legacyApplicationRoute, 'LEGACY_APPLICATION_CREATE_DISABLED', 'old application create endpoints must be explicitly disabled')
assertCount(legacyApplicationRoute, "router.post('/:id/review'", 1, 'legacy application route must not keep duplicate review handlers')
assertCount(legacyApplicationRoute, "router.post('/anonymous'", 1, 'legacy application route must keep only the disabled anonymous create endpoint')
assertCount(legacyApplicationRoute, "router.post('/', authMiddleware", 1, 'legacy application route must keep only the disabled authenticated create endpoint')
assertNotIncludes(legacyApplicationRoute, 'async function generateApplicationCode', 'legacy local application code generator must be removed')
assertNotIncludes(legacyApplicationRoute, 'function calculateAge(', 'legacy create helper calculateAge must be removed')
assertNotIncludes(legacyApplicationRoute, 'hasTimeSlotConflict', 'legacy create helper hasTimeSlotConflict must be removed')

assertIncludes(applicationApi, 'ReviewTargetType', 'frontend API must model review target type')
assertIncludes(applicationApi, 'reviewApplicationTarget', 'frontend API must review target-aware application rows')
assertIncludes(applicationApi, 'batchReviewApplications(', 'frontend API must expose batch review call')
assertIncludes(applicationApi, "request.post<void>('/applications/batch-review'", 'frontend batch review must call backend batch endpoint')
assertIncludes(applicationApi, 'return this.submitApplicationV2(applicationData)', 'legacy frontend submit must delegate to phase 2 submit')
assertIncludes(applicationApi, 'return this.submitAnonymousApplicationV2(applicationData)', 'legacy anonymous frontend submit must delegate to phase 2 submit')
assertNotIncludes(applicationApi, "request.post<Application>('/applications', applicationData)", 'frontend must not post new applications to the disabled legacy endpoint')
assertNotIncludes(applicationApi, "request.post<Application>('/applications/anonymous', applicationData)", 'frontend must not post anonymous applications to the disabled legacy endpoint')

assertIncludes(applicationView, 'reviewApplicationTarget(application', 'single review must use target-aware review')
assertIncludes(applicationView, 'getSelectedReviewTargets', 'batch review must derive review targets from selected rows')
assertIncludes(applicationView, 'ApplicationService.batchReviewApplications', 'batch review must call backend batch endpoint')
assertNotIncludes(applicationView, '批量审核功能开发中', 'batch review entry must not be a fake in-progress action')
assertRegex(
  applicationView,
  /handleBatchApprove[\s\S]*ApplicationService\.batchReviewApplications[\s\S]*await fetchApplications\(\)[\s\S]*await fetchStatistics\(\)/,
  'batch approve must refresh both list and statistics after transactional review'
)
assertRegex(
  applicationView,
  /handleBatchReject[\s\S]*ApplicationService\.batchReviewApplications[\s\S]*await fetchApplications\(\)[\s\S]*await fetchStatistics\(\)/,
  'batch reject must refresh both list and statistics after transactional review'
)
assertNotIncludes(applicationView, 'Promise.all(promises)', 'batch review must not issue per-row review calls from frontend')

assertIncludes(applicationDetailModal, 'reviewSnapshot', 'application detail modal must display persisted review snapshot')
assertIncludes(applicationDetailModal, '审核快照', 'application detail modal must label review snapshot section')

assertNotIncludes(faceRecognition, 'Math.random()', 'face recognition must not simulate detection or recognition')
assertNotIncludes(faceRecognition, 'mockStudents', 'face recognition must not use sample students')
assertNotIncludes(faceRecognition, "emit('attendance-confirmed'", 'face recognition must not emit real attendance confirmations from mock logic')
assertIncludes(faceRecognition, 'FACE_RECOGNITION_NOT_IMPLEMENTED', 'face recognition must be explicitly disabled until backed by a real service')

if (!existsWorkspace('backend/scripts/verify-phase2-reenrollment-flow.js')) {
  throw new Error('phase 2 re-enrollment closed-loop verification script must exist')
}
const reenrollmentScript = readWorkspace('backend/scripts/verify-phase2-reenrollment-flow.js')
assertIncludes(reenrollmentScript, 'getPhase2PendingApplicationRows', 'closed-loop script must verify admin merged phase 2 pending rows')
assertIncludes(reenrollmentScript, 'batchReviewApplicationTargets', 'closed-loop script must use transactional batch review')
assertIncludes(reenrollmentScript, 'FROM "roster_members"', 'closed-loop script must verify roster member creation')
assertIncludes(reenrollmentScript, 'ROLLBACK_PHASE2_REENROLLMENT_FLOW', 'closed-loop script must roll back temporary verification data')

console.log('application convergence contracts passed')
