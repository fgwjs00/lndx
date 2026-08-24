const assert = require('assert')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const { createEnrollmentApplicationWithChoices } = require('../dist/services/enrollmentApplicationService')

const prisma = new PrismaClient()
const rollbackMarker = 'SIGNATURE_TRANSACTION_ROLLBACK'

async function main() {
  const token = Date.now().toString()
  let studentId = null
  let signatureFileId = null

  try {
    await prisma.$transaction(async tx => {
      const [systemUser, section] = await Promise.all([
        tx.user.findFirst({
          where: { role: 'SUPER_ADMIN', isActive: true },
          select: { id: true }
        }),
        tx.$queryRaw`
          SELECT
            cs.id,
            cs."courseId",
            s.name AS "semesterName"
          FROM "class_sections" cs
          INNER JOIN "semesters" s ON s.id = cs."semesterId"
          INNER JOIN "academic_years" ay ON ay.id = cs."academicYearId"
          INNER JOIN "courses" c ON c.id = cs."courseId"
          WHERE cs."isActive" = TRUE
            AND cs.status = 'PUBLISHED'
            AND s."isActive" = TRUE
            AND s."isEnrollmentOpen" = TRUE
            AND ay."isActive" = TRUE
            AND ay."enrollmentStartsAt" IS NOT NULL
            AND ay."enrollmentEndsAt" IS NOT NULL
            AND NOW() BETWEEN ay."enrollmentStartsAt" AND ay."enrollmentEndsAt"
            AND c."isActive" = TRUE
            AND c.status = 'PUBLISHED'
          LIMIT 1
        `
      ])

      assert(systemUser, 'active super administrator is required for the smoke transaction')
      assert(section[0], 'an open published class section is required for the smoke transaction')

      const student = await tx.student.create({
        data: {
          studentCode: `SIG-${token}`,
          name: '签名事务测试学员',
          gender: 'FEMALE',
          age: 60,
          birthDate: new Date('1966-01-01'),
          birthday: new Date('1966-01-01'),
          idNumber: `99000019660101${token.slice(-4)}`,
          idCardAddress: '本地测试地址',
          contactPhone: '13900000000',
          currentAddress: '本地测试地址',
          emergencyContact: '测试联系人',
          emergencyPhone: '13800000000',
          emergencyRelation: '家属',
          createdBy: systemUser.id
        }
      })
      studentId = student.id

      const signature = await tx.fileUpload.create({
        data: {
          originalName: 'signature-transaction.png',
          fileName: `signature_${crypto.randomUUID()}.png`,
          filePath: `/uploads/registration-signatures/signature_${crypto.randomUUID()}.png`,
          fileSize: 256,
          mimeType: 'image/png',
          fileType: 'REGISTRATION_SIGNATURE',
          isTemp: true,
          expiresAt: new Date(Date.now() + 60_000),
          metadata: { ownerPhone: student.contactPhone }
        }
      })
      signatureFileId = signature.id

      const applicationId = await createEnrollmentApplicationWithChoices(
        tx,
        student.id,
        {
          semester: section[0].semesterName,
          selectedCourses: [section[0].courseId],
          selectedClassSections: [section[0].id],
          remarks: 'signature transaction smoke'
        },
        null,
        'SELF_SERVICE',
        signature.id
      )

      assert(applicationId, 'phase 2 enrollment application was not created')
      const application = await tx.enrollmentApplication.findUnique({
        where: { id: applicationId },
        select: { signatureFileId: true, signatureSnapshot: true }
      })
      assert.strictEqual(application.signatureFileId, signature.id, 'application signature reference was not persisted')
      assert.strictEqual(application.signatureSnapshot.filePath, signature.filePath, 'signature snapshot path is incorrect')
      assert.strictEqual(application.signatureSnapshot.mimeType, 'image/png', 'signature snapshot MIME type is incorrect')

      throw new Error(rollbackMarker)
    })
  } catch (error) {
    if (error.message !== rollbackMarker) {
      throw error
    }
  }

  const [studentCount, signatureCount] = await Promise.all([
    studentId ? prisma.student.count({ where: { id: studentId } }) : 0,
    signatureFileId ? prisma.fileUpload.count({ where: { id: signatureFileId } }) : 0
  ])
  assert.strictEqual(studentCount, 0, 'smoke student was not rolled back')
  assert.strictEqual(signatureCount, 0, 'smoke signature was not rolled back')

  console.log(JSON.stringify({
    signatureTransaction: 'passed',
    applicationReference: 'verified',
    signatureSnapshot: 'verified',
    cleanup: 'rolled-back'
  }, null, 2))
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
