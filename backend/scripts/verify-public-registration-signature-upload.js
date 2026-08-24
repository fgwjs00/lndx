const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const apiBaseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3104'
const ownerPhone = '13900000000'
const validFileName = `signature-smoke-${Date.now()}.png`
const invalidFileName = `signature-invalid-${Date.now()}.png`

async function uploadSignature(bytes, fileName) {
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'image/png' }), fileName)
  form.append('contactPhone', ownerPhone)
  return fetch(`${apiBaseUrl}/api/public-registration/signature-upload`, {
    method: 'POST',
    body: form
  })
}

async function main() {
  let uploadRecord = null
  let storedFilePath = null

  try {
    const invalidResponse = await uploadSignature(Buffer.from('not-a-png'), invalidFileName)
    const invalidPayload = await invalidResponse.json()
    assert.strictEqual(invalidResponse.status, 400, 'invalid signature must be rejected')
    assert.strictEqual(invalidPayload.error, 'VALIDATION_ERROR', 'invalid signature must return validation error')

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    )
    const response = await uploadSignature(png, validFileName)
    const payload = await response.json()
    assert.strictEqual(response.status, 200, `signature upload returned HTTP ${response.status}`)
    assert.strictEqual(payload.code, 200, 'signature upload did not return success')
    assert(payload.data?.fileId, 'signature upload did not return a file id')

    uploadRecord = await prisma.fileUpload.findUnique({ where: { id: payload.data.fileId } })
    assert(uploadRecord, 'signature upload database record was not created')
    assert.strictEqual(uploadRecord.fileType, 'REGISTRATION_SIGNATURE', 'signature file type is incorrect')
    assert.strictEqual(uploadRecord.isTemp, true, 'signature must remain temporary before submission')
    assert.strictEqual(uploadRecord.metadata?.ownerPhone, ownerPhone, 'signature phone ownership is missing')

    storedFilePath = path.join(__dirname, '..', uploadRecord.filePath.replace(/^\/uploads\//, 'uploads/'))
    assert(fs.existsSync(storedFilePath), 'signature image was not stored in its controlled directory')

    console.log(JSON.stringify({
      signatureUpload: 'passed',
      invalidSignatureRejected: true,
      fileType: uploadRecord.fileType,
      isTemp: uploadRecord.isTemp,
      cleanup: 'pending'
    }, null, 2))
  } finally {
    if (uploadRecord) {
      await prisma.fileUpload.delete({ where: { id: uploadRecord.id } }).catch(() => undefined)
    }
    if (storedFilePath && fs.existsSync(storedFilePath)) {
      fs.unlinkSync(storedFilePath)
    }
    await prisma.$disconnect()
  }

  console.log(JSON.stringify({ cleanup: 'completed' }))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
