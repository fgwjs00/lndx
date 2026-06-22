/**
 * 考勤管理路由
 * @description 处理学生签到和考勤记录查询
 */

import { Router } from 'express'
import { prisma } from '@/lib/prisma'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { requireTeacher } from '@/middleware/auth'

const router = Router()
const NOT_IMPLEMENTED = 'NOT_IMPLEMENTED'

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function parseDate(value: unknown, fallback = new Date()): Date {
  if (!value) {
    return fallback
  }
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('考勤日期格式不正确')
  }
  return date
}

function dayRange(date: Date): { gte: Date; lt: Date } {
  const gte = new Date(date)
  gte.setHours(0, 0, 0, 0)
  const lt = new Date(gte)
  lt.setDate(lt.getDate() + 1)
  return { gte, lt }
}

/**
 * 获取考勤记录列表
 * GET /api/attendance
 */
router.get('/', requireTeacher, asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 10), 100)
  const { status, courseId, studentId, startDate, endDate } = req.query

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
  if (startDate || endDate) {
    where.attendanceDate = {}
    if (startDate) {
      where.attendanceDate.gte = parseDate(startDate)
    }
    if (endDate) {
      const end = parseDate(endDate)
      end.setHours(23, 59, 59, 999)
      where.attendanceDate.lte = end
    }
  }

  const [list, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            name: true,
            contactPhone: true
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
      orderBy: { attendanceDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.attendance.count({ where })
  ])

  res.json({
    code: 200,
    message: '考勤记录查询成功',
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
 * 创建或更新签到记录
 * POST /api/attendance
 */
router.post('/', requireTeacher, asyncHandler(async (req, res) => {
  const { studentId, courseId, attendanceDate, status = 'PRESENT', remarks } = req.body || {}

  if (!studentId || typeof studentId !== 'string') {
    throw new ValidationError('学生ID不能为空')
  }
  if (!courseId || typeof courseId !== 'string') {
    throw new ValidationError('课程ID不能为空')
  }

  const normalizedStatus = String(status).toUpperCase()
  if (!['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].includes(normalizedStatus)) {
    throw new ValidationError('考勤状态不正确')
  }

  const [student, course] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, isActive: true }, select: { id: true } }),
    prisma.course.findFirst({ where: { id: courseId, isActive: true }, select: { id: true } })
  ])

  if (!student) {
    throw new BusinessError('学生不存在或已停用', 404, 'STUDENT_NOT_FOUND')
  }
  if (!course) {
    throw new BusinessError('课程不存在或已停用', 404, 'COURSE_NOT_FOUND')
  }

  const targetDate = parseDate(attendanceDate)
  const range = dayRange(targetDate)
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      studentId,
      courseId,
      attendanceDate: range
    }
  })

  const data = {
    attendanceDate: targetDate,
    status: normalizedStatus as any,
    method: 'MANUAL' as const,
    checkInTime: normalizedStatus === 'PRESENT' || normalizedStatus === 'LATE' ? new Date() : null,
    isLate: normalizedStatus === 'LATE',
    remarks: typeof remarks === 'string' ? remarks : null
  }

  const record = existingAttendance
    ? await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data
      })
    : await prisma.attendance.create({
        data: {
          studentId,
          courseId,
          ...data
        }
      })

  res.json({
    code: 200,
    message: '签到记录已保存',
    data: record
  })
}))

/**
 * 人脸识别签到
 * POST /api/attendance/face-recognition
 */
router.post('/face-recognition', requireTeacher, asyncHandler(async () => {
  throw new BusinessError('人脸识别签到尚未接入真实识别服务', 501, NOT_IMPLEMENTED)
}))

export default router
