import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { reviewEnrollmentApplication } from '../src/services/enrollmentApplicationService'

const prisma = new PrismaClient()
const testRunId = randomUUID().replace(/-/g, '').slice(0, 12)
const prefix = `concurrency-${testRunId}`

function requireLocalOptIn(): void {
  if (process.env.RUN_PHASE2_CONCURRENCY_TEST !== '1') {
    throw new Error('Set RUN_PHASE2_CONCURRENCY_TEST=1 to run this local integration test.')
  }

  const databaseUrl = process.env.DATABASE_URL || ''
  const hostname = new URL(databaseUrl).hostname
  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('Concurrency integration tests may run only against a localhost database.')
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function createStudent(createdBy: string, index: number): Promise<string> {
  const idSuffix = `${Date.now()}${index}`.slice(-12)
  const student = await prisma.student.create({
    data: {
      studentCode: `${prefix}-student-${index}`,
      name: `Concurrency Student ${index}`,
      gender: 'FEMALE',
      age: 60,
      birthDate: new Date('1966-01-01T00:00:00.000Z'),
      birthday: new Date('1966-01-01T00:00:00.000Z'),
      idNumber: `61000019660101${idSuffix}`,
      idCardAddress: 'Integration test address',
      contactPhone: `139${String(Date.now() + index).slice(-8)}`,
      currentAddress: 'Integration test address',
      emergencyContact: 'Integration Contact',
      emergencyPhone: '13900000000',
      emergencyRelation: 'family',
      createdBy
    }
  })

  return student.id
}

async function main(): Promise<void> {
  requireLocalOptIn()

  let academicYearId: string | undefined
  let semesterId: string | undefined
  let courseId: string | undefined
  let classSectionId: string | undefined
  const studentIds: string[] = []
  const applicationIds: string[] = []

  try {
    const operator = await prisma.user.findFirst({
      where: { isActive: true, role: { in: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] } },
      select: { id: true }
    })
    assert(operator, 'A local active administrator is required for the concurrency fixture.')

    const now = new Date()
    const startsAt = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const academicYear = await prisma.academicYear.create({
      data: {
        code: `${prefix}-year`,
        name: `${prefix} year`,
        startsAt,
        endsAt,
        enrollmentStartsAt: startsAt,
        enrollmentEndsAt: endsAt,
        requiredInsuranceStart: startsAt,
        requiredInsuranceEnd: endsAt,
        isActive: true
      }
    })
    academicYearId = academicYear.id

    const semester = await prisma.semester.create({
      data: {
        academicYearId,
        code: `${prefix}-semester`,
        name: `${prefix} semester`,
        startsAt,
        endsAt,
        isActive: true,
        isEnrollmentOpen: true
      }
    })
    semesterId = semester.id

    const course = await prisma.course.create({
      data: {
        courseCode: `${prefix}-course`,
        name: `${prefix} course`,
        category: 'Integration',
        level: 'Level 1',
        duration: 1,
        maxStudents: 1,
        timeSlots: [],
        status: 'PUBLISHED',
        createdBy: operator.id
      }
    })
    courseId = course.id

    const classSection = await prisma.classSection.create({
      data: {
        code: `${prefix}-section`,
        name: `${prefix} section`,
        academicYearId,
        semesterId,
        courseId,
        major: 'Integration',
        capacity: 1,
        timeSlots: [],
        status: 'PUBLISHED'
      }
    })
    classSectionId = classSection.id

    for (const index of [1, 2]) {
      const studentId = await createStudent(operator.id, index)
      studentIds.push(studentId)
      const application = await prisma.enrollmentApplication.create({
        data: {
          applicationCode: `${prefix}-application-${index}`,
          studentId,
          academicYearId,
          semesterId,
          status: 'SUBMITTED',
          source: 'INTEGRATION_TEST',
          choices: {
            create: {
              choiceOrder: 1,
              classSectionId,
              status: 'PENDING'
            }
          }
        }
      })
      applicationIds.push(application.id)
    }

    const reviews = await Promise.allSettled(applicationIds.map((id) => (
      prisma.$transaction((tx) => reviewEnrollmentApplication(tx, {
        id,
        status: 'APPROVED',
        reviewerId: operator.id,
        comments: 'capacity concurrency integration test'
      }))
    )))

    const fulfilled = reviews.filter((result) => result.status === 'fulfilled')
    const rejected = reviews.filter((result) => result.status === 'rejected')
    const rejectedCodes = rejected.map((result) => String((result as PromiseRejectedResult).reason?.code || ''))
    const activeMembers = await prisma.rosterMember.count({
      where: {
        classSectionId,
        status: 'ACTIVE'
      }
    })

    assert(fulfilled.length === 1, `Expected exactly one approved application, got ${fulfilled.length}.`)
    assert(rejected.length === 1, `Expected exactly one capacity rejection, got ${rejected.length}.`)
    assert(rejectedCodes.includes('CLASS_SECTION_FULL'), 'Rejected application must fail with CLASS_SECTION_FULL.')
    assert(activeMembers === 1, `Expected exactly one active roster member, got ${activeMembers}.`)

    console.log(JSON.stringify({
      status: 'passed',
      approvedApplications: fulfilled.length,
      rejectedApplications: rejected.length,
      activeRosterMembers: activeMembers
    }))
  } finally {
    if (classSectionId) {
      await prisma.rosterMember.deleteMany({ where: { classSectionId } })
      await prisma.roster.deleteMany({ where: { classSectionId } })
    }
    if (applicationIds.length > 0) {
      await prisma.enrollmentApplication.deleteMany({ where: { id: { in: applicationIds } } })
    }
    if (classSectionId) {
      await prisma.classSection.deleteMany({ where: { id: classSectionId } })
    }
    if (courseId) {
      await prisma.course.deleteMany({ where: { id: courseId } })
    }
    if (studentIds.length > 0) {
      await prisma.student.deleteMany({ where: { id: { in: studentIds } } })
    }
    if (semesterId) {
      await prisma.semester.deleteMany({ where: { id: semesterId } })
    }
    if (academicYearId) {
      await prisma.academicYear.deleteMany({ where: { id: academicYearId } })
    }

    const [remainingYears, remainingSemesters, remainingCourses, remainingStudents, remainingApplications] = await Promise.all([
      prisma.academicYear.count({ where: { code: { startsWith: prefix } } }),
      prisma.semester.count({ where: { code: { startsWith: prefix } } }),
      prisma.course.count({ where: { courseCode: { startsWith: prefix } } }),
      prisma.student.count({ where: { studentCode: { startsWith: prefix } } }),
      prisma.enrollmentApplication.count({ where: { applicationCode: { startsWith: prefix } } })
    ])
    assert(
      remainingYears + remainingSemesters + remainingCourses + remainingStudents + remainingApplications === 0,
      'Concurrency integration fixture cleanup left residual local database rows.'
    )
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
