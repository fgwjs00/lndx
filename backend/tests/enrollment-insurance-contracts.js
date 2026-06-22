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

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function assertFileExists(relativePath, label) {
  if (!exists(relativePath)) {
    throw new Error(`${label}: expected ${relativePath} to exist`)
  }
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

assertFileExists('src/routes/insurance.ts', 'insurance review route')

const index = read('src/index.ts')
const publicRegistration = read('src/routes/publicRegistration.ts')
const insuranceRoute = read('src/routes/insurance.ts')
const applicationV2 = read('src/routes/applicationV2.ts')
const mobileRegistration = readWorkspace('frontend/src/views/MobileRegistration.vue')
const insuranceApi = readWorkspace('frontend/src/api/insurance.ts')
const router = readWorkspace('frontend/src/router/index.ts')
const layout = readWorkspace('frontend/src/components/BaseLayout.vue')
const insuranceReview = readWorkspace('frontend/src/views/InsuranceReview.vue')

assertIncludes(index, "import insuranceRoutes from '@/routes/insurance'", 'index must import insurance routes')
assertIncludes(index, "app.use(`${apiPrefix}/insurances`, authMiddleware, insuranceRoutes)", 'insurance routes must be mounted with auth')

assertIncludes(publicRegistration, "router.get('/insurance-requirement'", 'public registration must expose insurance requirement')
assertIncludes(publicRegistration, "router.post('/insurance-upload'", 'public registration must expose insurance attachment upload')
assertIncludes(publicRegistration, "uploads', 'insurances'", 'insurance uploads must be stored separately')
assertIncludes(publicRegistration, "fileType: 'INSURANCE'", 'insurance upload must create a FileUpload record')

assertIncludes(insuranceRoute, "router.get('/', requireTeacher", 'insurance list must require teacher role')
assertIncludes(insuranceRoute, "router.patch('/:id/review', requireTeacher", 'insurance review must require teacher role')
assertIncludes(insuranceRoute, 'InsuranceReviewStatus', 'insurance review route must validate review status')

assertIncludes(applicationV2, 'insuranceAttachmentFileId', 'application v2 schema must accept insurance attachment id')
assertIncludes(applicationV2, 'upsertStudentInsuranceForApplication', 'application v2 must persist student insurance')
assertIncludes(applicationV2, 'validateInsuranceCoverage', 'application v2 must validate insurance coverage window')
assertIncludes(applicationV2, '"student_insurances"', 'application v2 must write student_insurances')

const anonymousCreateStart = applicationV2.indexOf('创建新学生（匿名）')
const anonymousCreateEnd = applicationV2.indexOf('await upsertStudentInsuranceForApplication', anonymousCreateStart)
const anonymousCreateBlock = applicationV2.slice(anonymousCreateStart, anonymousCreateEnd)
assertIncludes(anonymousCreateBlock, "currentAddress: applicationData.familyAddress || applicationData.idCardAddress", 'anonymous v2 self-registration must map currentAddress for new students')
assertIncludes(anonymousCreateBlock, "emergencyRelation: applicationData.emergencyRelation || '紧急联系人'", 'anonymous v2 self-registration must default emergencyRelation for new students')

assertIncludes(insuranceApi, 'getInsuranceRequirement', 'frontend insurance API must load requirement')
assertIncludes(insuranceApi, 'uploadInsuranceAttachment', 'frontend insurance API must upload attachment')
assertIncludes(insuranceApi, 'getInsuranceList', 'frontend insurance API must list insurance submissions')
assertIncludes(insuranceApi, 'reviewInsurance', 'frontend insurance API must review insurance')

assertIncludes(mobileRegistration, 'insuranceCompany', 'mobile registration must collect insurance company')
assertIncludes(mobileRegistration, 'insuranceAttachmentFileId', 'mobile registration must retain uploaded insurance file id')
assertIncludes(mobileRegistration, 'handleInsuranceFileChange', 'mobile registration must upload insurance attachment')
assertIncludes(mobileRegistration, 'InsuranceService.getInsuranceRequirement', 'mobile registration must load insurance requirement')
assertIncludes(mobileRegistration, 'InsuranceService.uploadInsuranceAttachment', 'mobile registration must call insurance upload API')

assertIncludes(router, "path: 'insurance-review'", 'router must expose insurance review page')
assertIncludes(layout, "path: '/insurance-review'", 'layout menu must expose insurance review page')
assertIncludes(insuranceReview, 'InsuranceService.getInsuranceList', 'insurance review page must load submissions')
assertIncludes(insuranceReview, 'InsuranceService.reviewInsurance', 'insurance review page must review submissions')
assertIncludes(insuranceReview, 'formatAcademicYearName', 'insurance review page must format academic year labels for display')
assertIncludes(insuranceReview, 'hasUsableAttachment', 'insurance review page must not treat default placeholder files as insurance proof')
assertIncludes(insuranceReview, 'formatAttachmentLabel', 'insurance review page must hide raw upload file names in the table')
assertNotIncludes(insuranceReview, "dataIndex: 'academicYearName', key: 'academicYearName'", 'insurance review table must not render raw academic year names')
assertNotIncludes(insuranceReview, "{{ record.attachmentName ||", 'insurance review table must not render raw attachment filenames')

console.log('enrollment insurance contracts passed')
