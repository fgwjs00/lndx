/**
 * 报名管理路由
 * @description 处理报名记录的只读查询和后台审核操作
 */

import { Router } from 'express'
import { prisma } from '@/lib/prisma'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { requireTeacher } from '@/middleware/auth'
import { reviewLegacyEnrollment } from '@/services/enrollmentApplicationService'

const router = Router()
const NOT_IMPLEMENTED = 'NOT_IMPLEMENTED'

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

/**
 * 获取报名列表
 * GET /api/enrollments
 */
router.get('/', requireTeacher, asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 10), 100)
  const { status, courseId, studentId } = req.query

  const where: any = {}
  if (typeof status === 'string' && status.trim()) {
    where.status = status.trim().toUpperCase()
  }
  if (typeof courseId === 'string' && courseId.trim()) {
    where.courseId = courseId.trim()
  }
  if (typeof studentId === 'string' && studentId.trim()) {
    where.studentId = studentId.trim()
  }

  const [list, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            name: true,
            contactPhone: true,
            currentGrade: true,
            major: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            category: true,
            level: true,
            semester: true
          }
        }
      },
      orderBy: { enrollmentDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.enrollment.count({ where })
  ])

  res.json({
    code: 200,
    message: '报名列表查询成功',
    data: {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })
}))

/**
 * 创建报名
 * POST /api/enrollments
 *
 * 报名创建必须走 /api/applications-v2，那里会校验学期、保险、课程选择和二期报名意向。
 */
router.post('/', requireTeacher, asyncHandler(async () => {
  throw new BusinessError('请通过报名申请接口提交报名，直接创建报名记录已关闭', 501, NOT_IMPLEMENTED)
}))

/**
 * 审核报名
 * PATCH /api/enrollments/:id/approve
 */
router.patch('/:id/approve', requireTeacher, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { remarks } = req.body || {}

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true } },
      course: { select: { id: true, name: true } }
    }
  })

  if (!enrollment) {
    throw new BusinessError('报名记录不存在', 404, 'ENROLLMENT_NOT_FOUND')
  }
  if (enrollment.status !== 'PENDING') {
    throw new BusinessError('只能审核待处理的报名记录', 400, 'CANNOT_REVIEW_NON_PENDING')
  }
  if (remarks !== undefined && typeof remarks !== 'string') {
    throw new ValidationError('备注必须是字符串')
  }

  const updatedEnrollment = await prisma.$transaction((tx) => reviewLegacyEnrollment(tx, {
    id,
    status: 'APPROVED',
    comments: typeof remarks === 'string' ? remarks : enrollment.remarks,
    reviewerId: req.user!.id
  }))

  res.json({
    code: 200,
    message: '报名审核成功',
    data: updatedEnrollment
  })
}))

export default router
