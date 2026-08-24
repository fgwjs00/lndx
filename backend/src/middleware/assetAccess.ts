import path from 'path'
import { NextFunction, Request, Response } from 'express'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AuthError, PermissionError } from '@/middleware/errorHandler'

const ADMIN_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN
])

function getMetadataId(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeUploadPath(requestPath: string): string | null {
  try {
    const decoded = decodeURIComponent(requestPath)
    const segments = decoded.split('/').filter(Boolean)
    if (segments.some(segment => segment === '.' || segment === '..' || segment.includes('\\'))) {
      return null
    }

    const normalized = path.posix.normalize(`/${segments.join('/')}`)
    return normalized.startsWith('/') ? `/uploads${normalized}` : null
  } catch {
    return null
  }
}

async function canTeacherAccessStudentResource(
  userId: string,
  studentIds: string[],
  enrollmentApplicationId: string | null
): Promise<boolean> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true }
  })

  const resourceFilters: any[] = []
  if (studentIds.length > 0) {
    resourceFilters.push(
      { rosterMembers: { some: { studentId: { in: studentIds } } } },
      {
        enrollmentChoices: {
          some: { application: { studentId: { in: studentIds } } }
        }
      }
    )
  }
  if (enrollmentApplicationId) {
    resourceFilters.push({
      enrollmentChoices: { some: { applicationId: enrollmentApplicationId } }
    })
  }

  if (resourceFilters.length === 0) {
    return false
  }

  const courseOwnershipFilters: any[] = [
    { course: { createdBy: userId } }
  ]
  if (teacher) {
    courseOwnershipFilters.push({
      course: { teachers: { some: { teacherId: teacher.id } } }
    })
  }

  const assignedClassSection = await prisma.classSection.findFirst({
    where: {
      AND: [
        { OR: resourceFilters },
        { OR: courseOwnershipFilters }
      ]
    },
    select: { id: true }
  })

  return Boolean(assignedClassSection)
}

async function canAccessUpload(filePath: string, user: NonNullable<Request['user']>): Promise<boolean> {
  const [file, student] = await Promise.all([
    prisma.fileUpload.findFirst({
      where: { filePath },
      select: {
        uploadedBy: true,
        metadata: true,
        insuranceAttachments: {
          select: {
            student: {
              select: { id: true, userId: true }
            }
          }
        }
      }
    }),
    prisma.student.findFirst({
      where: {
        OR: [
          { photo: filePath },
          { idCardFront: filePath },
          { idCardBack: filePath }
        ]
      },
      select: { id: true, userId: true }
    })
  ])

  const resourceExists = Boolean(file || student)
  if (!resourceExists) {
    return false
  }

  if (ADMIN_ROLES.has(user.role)) {
    return true
  }

  if (file?.uploadedBy === user.id || student?.userId === user.id) {
    return true
  }

  if (file?.insuranceAttachments.some(item => item.student.userId === user.id)) {
    return true
  }

  const metadataStudentId = getMetadataId(file?.metadata, 'studentId')
  const enrollmentApplicationId = getMetadataId(file?.metadata, 'enrollmentApplicationId')
  const studentIds = Array.from(new Set([
    student?.id,
    metadataStudentId,
    ...(file?.insuranceAttachments.map(item => item.student.id) || [])
  ].filter((id): id is string => Boolean(id))))

  if (metadataStudentId) {
    const ownStudent = await prisma.student.findFirst({
      where: { id: metadataStudentId, userId: user.id },
      select: { id: true }
    })
    if (ownStudent) {
      return true
    }
  }

  if (user.role !== UserRole.TEACHER) {
    return false
  }

  return canTeacherAccessStudentResource(user.id, studentIds, enrollmentApplicationId)
}

/**
 * Restricts every upload request to a file the current user may actually read.
 * Static file middleware only runs after this check succeeds.
 */
export const assetAccessMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthError('请先登录后再访问文件')
    }

    const filePath = normalizeUploadPath(req.path)
    if (!filePath) {
      throw new PermissionError('文件路径无效')
    }

    if (!await canAccessUpload(filePath, req.user)) {
      throw new PermissionError('无权访问该文件')
    }

    next()
  } catch (error) {
    next(error)
  }
}
