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

const application = read('src/routes/application.ts')
const applicationV2 = read('src/routes/applicationV2.ts')
const enrollment = read('src/routes/enrollment.ts')
const service = read('src/services/enrollmentApplicationService.ts')

assertIncludes(service, 'reviewLegacyEnrollment', 'shared service must review legacy Enrollment rows')
assertIncludes(service, 'syncPhase2ApplicationsForLegacyEnrollment', 'legacy review must synchronize matching phase 2 applications')
assertIncludes(service, 'reviewEnrollmentApplication', 'shared service must review phase 2 EnrollmentApplication rows')
assertIncludes(service, 'CANNOT_REVIEW_NON_PENDING', 'shared service must reject repeated review attempts')
assertIncludes(service, 'APPROVED', 'shared review service must support approval')
assertIncludes(service, 'REJECTED', 'shared review service must support rejection')
assertIncludes(service, '"enrollment_applications"', 'phase 2 review must update enrollment_applications')
assertIncludes(service, '"enrollment_application_choices"', 'phase 2 review must update enrollment_application_choices')
assertIncludes(service, 'tx.enrollment.update', 'phase 2 review must keep legacy enrollment status in sync')
assertIncludes(service, 'INSERT INTO "roster_members"', 'approved phase 2 review must add the student to the live roster')
assertIncludes(service, 'assertClassSectionsCanAcceptRosterWrites', 'review service must check frozen rosters before approval writes')
assertRegex(
  service,
  /assertClassSectionsCanAcceptRosterWrites[\s\S]*ROSTER_FROZEN/,
  'frozen roster precheck must throw ROSTER_FROZEN before approval mutates review state'
)
assertRegex(
  service,
  /reviewEnrollmentApplication[\s\S]*assertClassSectionsCanAcceptRosterWrites[\s\S]*UPDATE "enrollment_applications"/,
  'phase 2 review must precheck roster writability before updating application status'
)
assertIncludes(service, 'buildReviewSnapshot', 'review service must build a persistent review snapshot')
assertIncludes(service, 'reviewSnapshot', 'approved enrollment metadata must store review snapshot')
assertRegex(service, /reviewLegacyEnrollment[\s\S]*syncPhase2ApplicationsForLegacyEnrollment/, 'legacy review must call phase 2 synchronization')
assertRegex(service, /status:\s*normalizedStatus/, 'legacy review must write the normalized status')
assertRegex(service, /approvedAt:\s*normalizedStatus === 'APPROVED'/, 'legacy review must set approvedAt only when approved')

assertIncludes(application, "from '../services/enrollmentApplicationService'", 'legacy route must use shared enrollment review service')
assertIncludes(application, 'reviewLegacyEnrollment', 'legacy route must call shared review service')

assertIncludes(enrollment, "from '@/services/enrollmentApplicationService'", 'enrollment route must use shared enrollment review service')
assertIncludes(enrollment, 'reviewLegacyEnrollment', 'enrollment approve route must call shared review service')
assertIncludes(enrollment, 'prisma.$transaction', 'enrollment approve route must review inside a database transaction')
assertRegex(enrollment, /reviewLegacyEnrollment\(tx,\s*\{[\s\S]*status:\s*'APPROVED'/, 'enrollment approve route must approve through the shared service')

assertIncludes(applicationV2, "from '../services/enrollmentApplicationService'", 'application V2 route must use shared enrollment service')
assertIncludes(applicationV2, "router.post('/:id/review'", 'application V2 must expose review endpoint')
assertIncludes(applicationV2, 'reviewEnrollmentApplication', 'application V2 review endpoint must call shared review service')

console.log('enrollment review service contracts passed')
