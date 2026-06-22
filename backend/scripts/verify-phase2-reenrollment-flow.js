#!/usr/bin/env node

/**
 * Verifies the phase-2 re-enrollment loop against the local PostgreSQL schema.
 *
 * Run after building backend:
 *   npm run build
 *   node scripts/verify-phase2-reenrollment-flow.js
 *
 * The script creates temporary rows inside a transaction and intentionally
 * throws ROLLBACK_PHASE2_REENROLLMENT_FLOW at the end, so verification data is
 * not persisted.
 */

const { randomUUID } = require('crypto')
const { prisma } = require('../dist/lib/prisma')
const {
  batchReviewApplicationTargets,
  createEnrollmentApplicationWithChoices,
  getPhase2PendingApplicationRows
} = require('../dist/services/enrollmentApplicationService')

const ROLLBACK_PHASE2_REENROLLMENT_FLOW = 'ROLLBACK_PHASE2_REENROLLMENT_FLOW'

function unique(label) {
  return `codex_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  let summary = null

  try {
    await prisma.$transaction(async (tx) => {
      const suffix = unique('phase2_reenroll')
      const now = new Date()
      const requiredStart = new Date('2026-09-01T00:00:00.000Z')
      const requiredEnd = new Date('2027-08-31T23:59:59.000Z')

      const reviewer = await tx.user.create({
        data: {
          phone: `19${String(Date.now()).slice(-9)}`,
          password: 'phase2-flow-local-only',
          realName: 'Phase2 Flow Reviewer',
          role: 'SCHOOL_ADMIN'
        }
      })

      const student = await tx.student.create({
        data: {
          studentCode: suffix.slice(0, 32),
          name: 'Phase2 ReEnrollment Student',
          gender: 'FEMALE',
          age: 66,
          birthDate: new Date('1960-01-01T00:00:00.000Z'),
          birthday: new Date('1960-01-01T00:00:00.000Z'),
          idNumber: `11010119600101${String(Date.now()).slice(-4)}`,
          idCardAddress: 'Local verification address',
          contactPhone: `18${String(Date.now()).slice(-9)}`,
          currentAddress: 'Local verification address',
          emergencyContact: 'Emergency Contact',
          emergencyPhone: `17${String(Date.now()).slice(-9)}`,
          emergencyRelation: 'Family',
          currentGrade: '一年级',
          enrollmentYear: 2026,
          enrollmentSemester: '2026年秋季',
          graduationStatus: 'IN_PROGRESS',
          academicStatus: 'ACTIVE',
          createdBy: reviewer.id
        }
      })

      const course = await tx.course.create({
        data: {
          courseCode: suffix.slice(0, 40),
          name: 'Phase2 ReEnrollment Course',
          category: '声乐',
          level: '一年级',
          duration: 16,
          maxStudents: 30,
          timeSlots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:30' }],
          status: 'PUBLISHED',
          isActive: true,
          semester: '2026年秋季',
          createdBy: reviewer.id
        }
      })

      const academicYearRows = await tx.$queryRaw`
        INSERT INTO "academic_years" (
          id,
          code,
          name,
          "startsAt",
          "endsAt",
          "enrollmentStartsAt",
          "enrollmentEndsAt",
          "requiredInsuranceStart",
          "requiredInsuranceEnd",
          "isActive",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${randomUUID()},
          ${suffix.slice(0, 48)},
          '2026-2027 Phase2 Flow',
          ${requiredStart},
          ${requiredEnd},
          ${now},
          ${requiredEnd},
          ${requiredStart},
          ${requiredEnd},
          TRUE,
          NOW(),
          NOW()
        )
        RETURNING *
      `
      const academicYear = academicYearRows[0]

      const semesterRows = await tx.$queryRaw`
        INSERT INTO "semesters" (
          id,
          code,
          name,
          "academicYearId",
          "startsAt",
          "endsAt",
          "isEnrollmentOpen",
          "isActive",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${randomUUID()},
          ${`${suffix}_fall`.slice(0, 48)},
          '2026年秋季',
          ${academicYear.id},
          ${requiredStart},
          ${requiredEnd},
          TRUE,
          TRUE,
          NOW(),
          NOW()
        )
        RETURNING *
      `
      const semester = semesterRows[0]

      const sectionTimeSlots = JSON.stringify([{ dayOfWeek: 1, startTime: '09:00', endTime: '10:30' }])
      const classSectionRows = await tx.$queryRaw`
        INSERT INTO "class_sections" (
          id,
          code,
          name,
          "academicYearId",
          "semesterId",
          "courseId",
          grade,
          major,
          capacity,
          "timeSlots",
          status,
          "isActive",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${randomUUID()},
          ${`${suffix}_section`.slice(0, 48)},
          'Phase2 ReEnrollment Section',
          ${academicYear.id},
          ${semester.id},
          ${course.id},
          '一年级',
          ${course.category},
          30,
          ${sectionTimeSlots}::jsonb,
          'PUBLISHED',
          TRUE,
          NOW(),
          NOW()
        )
        RETURNING *
      `
      const classSection = classSectionRows[0]

      const cancelledEnrollment = await tx.enrollment.create({
        data: {
          enrollmentCode: `${suffix}_cancelled`.slice(0, 48),
          studentId: student.id,
          courseId: course.id,
          status: 'CANCELLED',
          cancelledAt: now,
          cancelReason: 'Local verification cancelled baseline',
          createdBy: reviewer.id
        }
      })

      const applicationId = await createEnrollmentApplicationWithChoices(
        tx,
        student.id,
        {
          semester: semester.code,
          selectedCourses: [course.id],
          remarks: 'Local phase2 re-enrollment verification'
        },
        null,
        'SELF_SERVICE'
      )
      assert(applicationId, 'phase 2 application was not created')

      const pendingRows = await getPhase2PendingApplicationRows(tx, {
        status: 'PENDING',
        courseId: course.id
      })
      const pendingRow = pendingRows.find((row) => row.id === applicationId)
      assert(pendingRow, 'phase 2 pending application is not visible in merged admin rows')
      assert(pendingRow.targetType === 'phase2Application', 'merged row must use phase2Application target type')

      await batchReviewApplicationTargets(tx, {
        targets: [{ id: applicationId, targetType: 'phase2Application' }],
        status: 'APPROVED',
        comments: 'Local closed-loop approval',
        reviewerId: reviewer.id
      })

      const oldEnrollment = await tx.enrollment.findUnique({
        where: { id: cancelledEnrollment.id }
      })
      assert(oldEnrollment && oldEnrollment.status === 'CANCELLED', 'cancelled legacy enrollment must remain historical')

      const rosterMemberRows = await tx.$queryRaw`
        SELECT
          rm.*,
          r.id AS "rosterId",
          r.status AS "rosterStatus",
          r."semesterId" AS "rosterSemesterId"
        FROM "roster_members" rm
        INNER JOIN "rosters" r ON r.id = rm."rosterId"
        WHERE rm."studentId" = ${student.id}
          AND rm."classSectionId" = ${classSection.id}
          AND rm.status = 'ACTIVE'
        LIMIT 1
      `
      const rosterMember = rosterMemberRows[0]
      assert(rosterMember, 'approved phase 2 application did not create an active roster member')
      assert(rosterMember.rosterSemesterId === semester.id, 'roster member must belong to the target semester roster')

      summary = {
        applicationId,
        targetType: pendingRow.targetType,
        cancelledEnrollmentStatus: oldEnrollment.status,
        rosterMemberId: rosterMember.id,
        rosterStatus: rosterMember.rosterStatus
      }

      const rollback = new Error(ROLLBACK_PHASE2_REENROLLMENT_FLOW)
      rollback.summary = summary
      throw rollback
    }, {
      maxWait: 5000,
      timeout: 30000
    })
  } catch (error) {
    if (error && error.message === ROLLBACK_PHASE2_REENROLLMENT_FLOW) {
      console.log('phase2 re-enrollment closed-loop verification passed')
      console.log(JSON.stringify(error.summary || summary, null, 2))
      return
    }

    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('phase2 re-enrollment closed-loop verification failed')
  console.error(error)
  process.exit(1)
})
