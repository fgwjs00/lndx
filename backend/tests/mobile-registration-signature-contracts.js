const fs = require('fs')
const path = require('path')

const workspaceRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8')
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${JSON.stringify(expected)}`)
  }
}

const schema = read('backend/prisma/schema.prisma')
const migration = read('backend/prisma/migrations/20260824000000_registration_signatures/migration.sql')
const publicRegistration = read('backend/src/routes/publicRegistration.ts')
const applicationV2 = read('backend/src/routes/applicationV2.ts')
const enrollmentService = read('backend/src/services/enrollmentApplicationService.ts')
const applicationApi = read('frontend/src/api/application.ts')
const mobileRegistration = read('frontend/src/views/MobileRegistration.vue')
const signaturePad = read('frontend/src/components/HandwrittenSignaturePad.vue')
const applicationDetail = read('frontend/src/components/ApplicationDetailModal.vue')
const signatureSmoke = read('backend/scripts/verify-public-registration-signature-upload.js')
const signatureTransaction = read('backend/scripts/verify-registration-signature-transaction.js')
const runbook = read('docs/deployment/baota-migration-runbook.md')

assertIncludes(schema, 'signatureFileId', 'enrollment application must reference its handwritten signature')
assertIncludes(schema, 'signatureSnapshot', 'enrollment application must retain immutable signature metadata')
assertIncludes(migration, '"signatureFileId"', 'signature migration must add the signature file reference')
assertIncludes(migration, '"signatureSnapshot"', 'signature migration must add the signature snapshot')
assertIncludes(migration, 'ON DELETE SET NULL', 'signature deletion must not delete an enrollment application')

assertIncludes(publicRegistration, "router.post('/signature-upload'", 'public registration must expose a signature upload endpoint')
assertIncludes(publicRegistration, "'REGISTRATION_SIGNATURE'", 'signature uploads must use a dedicated file type')
assertIncludes(publicRegistration, "uploads', 'registration-signatures'", 'signatures must use a dedicated controlled directory')
assertIncludes(publicRegistration, 'ownerPhone: contactPhone', 'signature uploads must bind to the registration phone')
assertIncludes(publicRegistration, 'isTemp: true', 'signature uploads must remain temporary before submission')

assertIncludes(applicationV2, 'resolvePublicRegistrationSignature', 'anonymous application must resolve the signature server-side')
assertIncludes(applicationV2, 'finalizePublicRegistrationSignature', 'signature must be finalized only after application creation')
assertIncludes(applicationV2, "AND \"fileType\" = 'REGISTRATION_SIGNATURE'", 'signature resolution must enforce its file type')
assertIncludes(applicationV2, "metadata ->> 'ownerPhone'", 'signature resolution must enforce phone ownership')
assertIncludes(applicationV2, 'FOR UPDATE', 'signature must be locked while being claimed')
assertIncludes(enrollmentService, 'buildRegistrationSignatureSnapshot', 'application creation must capture the signature snapshot')

assertIncludes(applicationApi, 'uploadPublicRegistrationSignature', 'frontend API must upload handwritten signatures')
assertIncludes(applicationApi, "'/public-registration/signature-upload'", 'frontend API must call the signature endpoint')
assertIncludes(mobileRegistration, "shortTitle: '签名'", 'mobile registration must expose signature as the final step')
assertIncludes(mobileRegistration, '<HandwrittenSignaturePad', 'mobile registration must render the handwritten signature pad')
assertIncludes(mobileRegistration, 'signatureFileId: await ensureSignatureUploaded()', 'submission must include the controlled signature file id')
assertIncludes(signaturePad, 'touch-action: none', 'the canvas must capture touch without disabling page scrolling elsewhere')
assertIncludes(signaturePad, 'pointerdown', 'the signature pad must support pointer input')
assertIncludes(signaturePad, '清除重签', 'the signature pad must provide an elderly-friendly retry action')
assertIncludes(signaturePad, '横屏全屏签名', 'the signature pad must offer a clear landscape fullscreen action')
assertIncludes(signaturePad, 'requestFullscreen', 'the signature pad must request native fullscreen when supported')
assertIncludes(signaturePad, "lock?.('landscape')", 'the signature pad must request landscape orientation when supported')
assertIncludes(signaturePad, 'height: 300px', 'the embedded signature area must be larger than the original canvas')
assertIncludes(signaturePad, '.signature-pad.is-fullscreen', 'the signature pad must provide a fullscreen fallback layout')
assertIncludes(signaturePad, 'rotate(90deg)', 'portrait fullscreen fallback must rotate the entire signature interface')
assertIncludes(signaturePad, 'class="signature-layout"', 'fullscreen rotation must include text, canvas, and actions together')
assertIncludes(applicationDetail, '本人手写签名', 'staff must be able to inspect the submitted signature')
assertIncludes(signatureSmoke, 'invalidSignatureRejected: true', 'signature smoke test must reject invalid file contents')
assertIncludes(signatureSmoke, "cleanup: 'completed'", 'signature smoke test must clean up its test upload')
assertIncludes(signatureTransaction, "cleanup: 'rolled-back'", 'signature transaction test must roll back all test data')
assertIncludes(runbook, '20260824000000_registration_signatures', 'deployment runbook must include the signature migration')

console.log('mobile registration signature contracts passed')
