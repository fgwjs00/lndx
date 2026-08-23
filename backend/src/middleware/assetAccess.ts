import path from 'path'
import { NextFunction, Request, Response } from 'express'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AuthError, PermissionError } from '@/middleware/errorHandler'

const STAFF_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER
])

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

async function canAccessUpload(filePath: string, user: NonNullable<Request['user']>): Promise<boolean> {
  const [file, student] = await Promise.all([
    prisma.fileUpload.findFirst({
      where: { filePath },
      select: {
        uploadedBy: true,
        insuranceAttachments: {
          select: {
            student: {
              select: { userId: true }
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
      select: { userId: true }
    })
  ])

  const resourceExists = Boolean(file || student)
  if (!resourceExists) {
    return false
  }

  if (STAFF_ROLES.has(user.role)) {
    return true
  }

  if (file?.uploadedBy === user.id || student?.userId === user.id) {
    return true
  }

  return Boolean(file?.insuranceAttachments.some(item => item.student.userId === user.id))
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
