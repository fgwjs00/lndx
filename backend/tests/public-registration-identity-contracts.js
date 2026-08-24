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

function assertFileExists(relativePath, label) {
  if (!fs.existsSync(path.join(backendRoot, relativePath))) {
    throw new Error(`${label}: expected ${relativePath} to exist`)
  }
}

const publicRegistration = readBackend('src/routes/publicRegistration.ts')
const applicationV2 = readBackend('src/routes/applicationV2.ts')
const applicationApi = readWorkspace('frontend/src/api/application.ts')
const mobileRegistration = readWorkspace('frontend/src/views/MobileRegistration.vue')

assertFileExists('scripts/verify-public-registration-identity-upload.js', 'identity upload smoke script')
const identitySmokeScript = readBackend('scripts/verify-public-registration-identity-upload.js')

assertIncludes(publicRegistration, "router.post('/identity-upload'", 'public registration must expose identity upload')
assertIncludes(publicRegistration, "uploads', 'registration-identities'", 'identity uploads must use a separate directory')
assertIncludes(publicRegistration, 'ALLOWED_IDENTITY_MIME_TYPES', 'identity uploads must restrict MIME types')
assertIncludes(publicRegistration, 'fileSize: 5 * 1024 * 1024', 'identity uploads must have a size limit')
assertIncludes(publicRegistration, "source: 'public-registration-identity'", 'identity uploads must record their public-registration source')
assertIncludes(publicRegistration, 'ownerPhone: contactPhone', 'identity uploads must bind to the registration phone')
assertIncludes(publicRegistration, 'isTemp: true', 'identity uploads must begin as temporary files')

assertIncludes(applicationV2, 'photoFileId', 'application schema must accept the profile-photo file id')
assertIncludes(applicationV2, 'idCardFrontFileId', 'application schema must accept the ID-card front file id')
assertIncludes(applicationV2, 'idCardBackFileId', 'application schema must accept the ID-card back file id')
assertIncludes(applicationV2, 'resolvePublicIdentityDocuments', 'anonymous application must resolve identity uploads server-side')
assertIncludes(applicationV2, 'AND "isTemp" = TRUE', 'identity uploads must be single-use temporary files')
assertIncludes(applicationV2, 'FOR UPDATE', 'identity uploads must be locked while claimed')
assertIncludes(applicationV2, 'requireMatchingOwner: true', 'anonymous registration must enforce phone ownership for identity uploads')
assertIncludes(applicationV2, 'resolvedIdentityDocuments.studentFields', 'new student records must receive only resolved identity paths')
assertIncludes(applicationV2, 'finalizePublicIdentityDocuments', 'identity uploads must be finalized only after application creation')

assertIncludes(applicationApi, 'uploadPublicIdentityDocument', 'frontend API must upload public identity documents')
assertIncludes(applicationApi, "'/public-registration/identity-upload'", 'frontend API must call the public identity upload endpoint')

assertIncludes(mobileRegistration, '本人近期照片', 'mobile registration must request a profile photo')
assertIncludes(mobileRegistration, '身份证正面照片', 'mobile registration must request an ID-card front photo')
assertIncludes(mobileRegistration, '身份证背面照片', 'mobile registration must request an ID-card back photo')
assertIncludes(mobileRegistration, 'handleProfilePhotoChange', 'mobile registration must upload the profile photo')
assertIncludes(mobileRegistration, 'handleIdCardFrontChange', 'mobile registration must upload the ID-card front photo')
assertIncludes(mobileRegistration, 'handleIdCardBackChange', 'mobile registration must upload the ID-card back photo')
assertIncludes(mobileRegistration, 'resetIdentityDocuments', 'changing the registration phone must clear bound identity uploads')
assertIncludes(mobileRegistration, 'photoFileId: formData.photoFileId', 'submission must include the profile-photo file id')
assertIncludes(mobileRegistration, 'idCardFrontFileId: formData.idCardFrontFileId', 'submission must include the ID-card front file id')
assertIncludes(mobileRegistration, 'idCardBackFileId: formData.idCardBackFileId', 'submission must include the ID-card back file id')

assertIncludes(identitySmokeScript, 'identity-smoke.png', 'identity smoke script must use a non-personal test image')
assertIncludes(identitySmokeScript, 'cleanup: \'completed\'', 'identity smoke script must verify cleanup')

console.log('public registration identity contracts passed')
