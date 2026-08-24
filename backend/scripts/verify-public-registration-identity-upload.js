require('dotenv').config()

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const apiBaseUrl = (process.env.IDENTITY_UPLOAD_SMOKE_API_BASE_URL || 'http://127.0.0.1:3104').replace(/\/$/, '')
const uploadDirectory = path.resolve(process.cwd(), 'uploads', 'registration-identities')
const prisma = new PrismaClient()

// A non-personal 1x1 PNG used only to exercise the multipart upload contract.
const smokeImage = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9WQAAAABJRU5ErkJggg==',
  'base64'
)

let fileId = ''
let storedFilePath = ''
let smokeResult = null

async function verifyRejectedSignature() {
  const beforeFiles = new Set(fs.existsSync(uploadDirectory) ? fs.readdirSync(uploadDirectory) : [])
  const form = new FormData()
  form.append('file', new Blob([Buffer.from('not-a-real-image')], { type: 'image/png' }), 'invalid.png')
  form.append('contactPhone', '13900000000')
  form.append('documentType', 'PROFILE_PHOTO')

  const response = await fetch(`${apiBaseUrl}/api/public-registration/identity-upload`, {
    method: 'POST',
    body: form
  })
  const payload = await response.json()

  assert.strictEqual(response.status, 400, `invalid identity upload returned HTTP ${response.status}`)
  assert.strictEqual(payload.error, 'VALIDATION_ERROR', 'invalid identity upload returned the wrong error code')

  const afterFiles = new Set(fs.existsSync(uploadDirectory) ? fs.readdirSync(uploadDirectory) : [])
  assert.deepStrictEqual(afterFiles, beforeFiles, 'rejected identity upload left a file on disk')
}

function assertWithinUploadDirectory(candidatePath) {
  const relativePath = path.relative(uploadDirectory, candidatePath)
  assert(relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath), 'test file path escaped upload directory')
}

async function main() {
  await verifyRejectedSignature()

  const form = new FormData()
  form.append('file', new Blob([smokeImage], { type: 'image/png' }), 'identity-smoke.png')
  form.append('contactPhone', '13900000000')
  form.append('documentType', 'PROFILE_PHOTO')

  const response = await fetch(`${apiBaseUrl}/api/public-registration/identity-upload`, {
    method: 'POST',
    body: form
  })
  const payload = await response.json()

  assert.strictEqual(response.status, 200, `identity upload returned HTTP ${response.status}`)
  assert.strictEqual(payload.code, 200, 'identity upload did not return success')
  assert(payload.data?.fileId, 'identity upload did not return a file id')

  fileId = payload.data.fileId
  storedFilePath = path.resolve(uploadDirectory, payload.data.fileName)
  assertWithinUploadDirectory(storedFilePath)

  const upload = await prisma.fileUpload.findUnique({ where: { id: fileId } })
  assert(upload, 'identity upload database record was not created')
  assert.strictEqual(upload.fileType, 'PROFILE_PHOTO', 'identity upload file type is incorrect')
  assert.strictEqual(upload.isTemp, true, 'identity upload must remain temporary before submission')
  assert.strictEqual(upload.metadata?.ownerPhone, '13900000000', 'identity upload phone ownership is missing')
  assert(fs.existsSync(storedFilePath), 'identity upload file was not stored in its controlled directory')

  return {
    fileType: upload.fileType,
    temporary: upload.isTemp
  }
}

main()
  .then((result) => {
    smokeResult = result
  })
  .finally(async () => {
    if (fileId) {
      await prisma.fileUpload.delete({ where: { id: fileId } }).catch(() => undefined)
    }

    if (storedFilePath && fs.existsSync(storedFilePath)) {
      assertWithinUploadDirectory(storedFilePath)
      fs.unlinkSync(storedFilePath)
    }

    if (fileId) {
      const remainingUpload = await prisma.fileUpload.findUnique({ where: { id: fileId } })
      assert.strictEqual(remainingUpload, null, 'test upload database record was not removed')
    }
    if (storedFilePath) {
      assert(!fs.existsSync(storedFilePath), 'test upload file was not removed')
    }

    await prisma.$disconnect()

    if (smokeResult) {
    console.log(JSON.stringify({
      success: true,
      ...smokeResult,
      invalidSignatureRejected: true,
      cleanup: 'completed'
      }))
    }
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
