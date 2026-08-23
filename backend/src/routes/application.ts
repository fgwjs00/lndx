/**
 * 报名申请路由
 * @description 处理学生报名申请相关的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { authMiddleware, requireTeacher } from '@/middleware/auth'
import { businessLogger } from '@/utils/logger'

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { getMaxCoursesForSemester } from '../utils/enrollmentConfig'
import {
  batchReviewApplicationTargets,
  getPhase2PendingApplicationRows,
  reviewLegacyEnrollment
} from '../services/enrollmentApplicationService'

const router = Router()


/**
 * 获取所有报名申请列表（管理员用）
 * GET /api/applications
 */
router.get('/', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, keyword, status, courseId, department } = req.query
  const pageNum = Math.max(1, Number(page) || 1)
  const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 10))
  
  // 构建查询条件 - 直接查询报名记录而不是学生
  const where: any = {}
  
  // 状态筛选
  if (status && typeof status === 'string') {
    where.status = status.toUpperCase()
  }
  
  // 课程筛选
  if (courseId && typeof courseId === 'string') {
    where.courseId = courseId
  }
  
  // 院系筛选
  if (department && typeof department === 'string') {
    where.student = {
      ...where.student,
      major: department
    }
  }
  
  // 关键词搜索
  if (keyword && typeof keyword === 'string') {
    where.OR = [
      {
        student: {
          name: {
            contains: keyword.trim(),
            mode: 'insensitive'
          }
        }
      },
      {
        enrollmentCode: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      },
      {
        student: {
          idNumber: {
            contains: keyword.trim(),
            mode: 'insensitive'
          }
        }
      }
    ]
  }

  try {
    // 查询报名记录，但只包含活跃学生的记录
    where.student = {
      ...where.student,
      isActive: true  // 只显示活跃学生的报名记录
    }
    
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: true,
        course: true
      },
      orderBy: { enrollmentDate: 'desc' }
    })

    // 获取总数（只计算活跃学生的报名记录）
    const total = await prisma.enrollment.count({ where })

    // 转换数据格式为前端需要的格式
    const applications = enrollments.map(enrollment => ({
      id: enrollment.id,
      applicationId: enrollment.enrollmentCode,
      enrollmentCode: enrollment.enrollmentCode,
      studentInfo: {
        id: enrollment.student.id,
        name: enrollment.student.name,
        idNumber: enrollment.student.idNumber,
        phone: enrollment.student.contactPhone,
        gender: enrollment.student.gender,
        age: enrollment.student.age,
        major: enrollment.student.major,
        studentCode: enrollment.student.studentCode,
        emergencyContact: enrollment.student.emergencyContact, // 添加紧急联系人
        emergencyPhone: enrollment.student.emergencyPhone // 添加紧急联系电话
      },
      courseInfo: {
        id: enrollment.course.id,
        name: enrollment.course.name
      },
      applicationDate: enrollment.enrollmentDate.toISOString().split('T')[0],
      status: enrollment.status,
      avatar: (enrollment.student as any).photo || '/uploads/id-cards/default-avatar.jpg',
      idCardFront: enrollment.student.idCardFront,
      idCardBack: enrollment.student.idCardBack,
      insuranceStart: enrollment.insuranceStart?.toISOString().split('T')[0],
      insuranceEnd: enrollment.insuranceEnd?.toISOString().split('T')[0],
      remarks: enrollment.remarks,
      enrollmentDate: enrollment.enrollmentDate
    }))

    const phase2Applications = await getPhase2PendingApplicationRows(prisma, {
      keyword: typeof keyword === 'string' ? keyword : undefined,
      status: typeof status === 'string' ? status : undefined,
      courseId: typeof courseId === 'string' ? courseId : undefined,
      department: typeof department === 'string' ? department : undefined
    })
    const mergedAllApplications = [...phase2Applications, ...applications]
      .sort((left, right) => new Date(right.enrollmentDate).getTime() - new Date(left.enrollmentDate).getTime())
    const mergedApplications = mergedAllApplications.slice(
      (pageNum - 1) * pageSizeNum,
      pageNum * pageSizeNum
    )
    const mergedTotal = total + phase2Applications.length

    businessLogger.userAction(req.user!.id, 'APPLICATION_LIST_QUERY', {
      page: pageNum,
      pageSize: pageSizeNum,
      total: mergedTotal,
      resultCount: mergedApplications.length,
      filters: { keyword, status }
    })

    res.json({
      code: 200,
      message: '获取报名申请列表成功',
      data: {
        list: mergedApplications,
        total: mergedTotal,
        page: pageNum,
        pageSize: pageSizeNum
      }
    })
  } catch (error) {
    console.error('获取报名申请列表失败:', error)
    throw new BusinessError('获取报名申请列表失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 审核报名申请
 * POST /api/applications/:id/review
 */
/**
 * 获取报名统计数据
 * GET /api/applications/statistics
 */
router.get('/statistics', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取总报名数（只计算活跃学生的报名）
    const activeStudentCondition = {
      student: { isActive: true }
    }
    
    const totalEnrollments = await prisma.enrollment.count({
      where: activeStudentCondition
    })
    
    // 获取各状态的报名数（只计算活跃学生的报名）
    const pending = await prisma.enrollment.count({ 
      where: { status: 'PENDING', ...activeStudentCondition } 
    })
    const approved = await prisma.enrollment.count({ 
      where: { status: 'APPROVED', ...activeStudentCondition } 
    })
    const rejected = await prisma.enrollment.count({ 
      where: { status: 'REJECTED', ...activeStudentCondition } 
    })
    const cancelled = await prisma.enrollment.count({ 
      where: { status: 'CANCELLED', ...activeStudentCondition } 
    })
    const phase2PendingCount = (await getPhase2PendingApplicationRows(prisma)).length

    businessLogger.userAction(req.user!.id, 'APPLICATION_STATS_QUERY', {
      total: totalEnrollments + phase2PendingCount,
      pending: pending + phase2PendingCount,
      approved,
      rejected,
      cancelled,
      phase2PendingCount
    })

    res.json({
      code: 200,
      message: '获取报名统计数据成功',
      data: {
        total: totalEnrollments + phase2PendingCount,
        pending: pending + phase2PendingCount,
        approved,
        rejected,
        cancelled,
        monthlyStats: [], // 后期可扩展
        courseStats: []   // 后期可扩展
      }
    })
  } catch (error) {
    console.error('获取报名统计数据失败:', error)
    throw new BusinessError('获取报名统计数据失败', 500, 'STATS_ERROR')
  }
}))

router.post('/batch-review', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { items, ids, status, comments } = req.body || {}
  const rawTargets = Array.isArray(items)
    ? items
    : Array.isArray(ids)
      ? ids.map((id: string) => ({ id, targetType: 'legacyEnrollment' }))
      : []

  const targets = rawTargets.map((item: any) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return { id: String(item), targetType: 'legacyEnrollment' as const }
    }

    return {
      id: String(item.id || ''),
      targetType: item.targetType === 'phase2Application' ? 'phase2Application' as const : 'legacyEnrollment' as const
    }
  })

  const reviewedApplications = await prisma.$transaction((tx) => batchReviewApplicationTargets(tx, {
    targets,
    status,
    comments,
    reviewerId: req.user!.id
  }))

  businessLogger.userAction(req.user!.id, 'APPLICATION_BATCH_REVIEW', {
    count: reviewedApplications.length,
    status,
    comments
  })

  res.json({
    code: 200,
    message: 'Batch review completed successfully',
    data: {
      count: reviewedApplications.length
    }
  })
}))

router.post('/:id/review', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, comments } = req.body

  const updatedEnrollment = await prisma.$transaction((tx) => reviewLegacyEnrollment(tx, {
    id,
    status,
    comments,
    reviewerId: req.user!.id
  }))

  businessLogger.userAction(req.user!.id, 'APPLICATION_REVIEW', {
    enrollmentId: id,
    studentName: updatedEnrollment.student?.name,
    courseName: updatedEnrollment.course?.name,
    status,
    comments
  })

  res.json({
    code: 200,
    message: `Application ${String(status).toUpperCase() === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
    data: updatedEnrollment
  })
}))




// 配置multer用于图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'id-cards')
    
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueName = crypto.randomUUID()
    const ext = path.extname(file.originalname)
    cb(null, `idcard_${uniqueName}${ext}`)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片格式
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只能上传图片文件'))
    }
  }
})

/**
 * 将base64图片数据保存为文件
 * @param base64Data base64编码的图片数据
 * @param filePrefix 文件前缀（如 'idcard_front_', 'idcard_back_'）
 * @returns 保存的文件路径
 */
function saveBase64Image(base64Data: string, filePrefix: string): string | null {
  try {
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      return null
    }

    // 解析base64数据
    const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/)
    if (!matches || matches.length !== 3) {
      return null
    }

    const imageType = matches[1] // jpeg, png等
    const base64Image = matches[2]
    
    // 生成唯一文件名
    const fileName = `${filePrefix}${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${imageType}`
    
    // 确保uploads目录存在
    const uploadsDir = path.join(process.cwd(), 'uploads', 'id-cards')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    const filePath = path.join(uploadsDir, fileName)
    
    // 将base64数据写入文件
    fs.writeFileSync(filePath, base64Image, 'base64')
    
    // 返回相对路径用于存储在数据库中
    return `/uploads/id-cards/${fileName}`
  } catch (error) {
    console.error('保存base64图片失败:', error)
    return null
  }
}

/**
 * 上传身份证照片
 * POST /api/applications/upload-image
 */
router.post('/upload-image', authMiddleware, upload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('请选择要上传的图片文件', [{ field: 'image', message: '图片文件不能为空' }])
    }

    // 构建文件访问URL
    const fileUrl = `/uploads/id-cards/${req.file.filename}`
    await prisma.fileUpload.create({
      data: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType: 'ID_CARD',
        uploadedBy: req.user!.id,
        metadata: { source: 'legacy-application-upload' }
      }
    })
    
    // 记录上传日志
    businessLogger.userAction(req.user!.id, 'ID_CARD_UPLOAD', {
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    })

    res.json({
      code: 200,
      message: '图片上传成功',
      data: {
        url: fileUrl,
        fileName: req.file.filename,
        fileSize: req.file.size
      }
    })
  } catch (error) {
    console.error('图片上传失败:', error)
    throw new BusinessError('图片上传失败', 500, 'UPLOAD_ERROR')
  }
}))

/**
 * 获取可报名的课程列表
 * GET /api/applications/available-courses
 */
router.get('/available-courses', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 查询状态为PUBLISHED且活跃的课程
    const courses = await prisma.course.findMany({
      where: {
        isActive: true,
        status: 'PUBLISHED'
      },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                realName: true
              }
            }
          }
        },
        enrollments: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] }
          },
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 转换数据格式以匹配前端需求
    const availableCourses = courses
      .filter(course => {
        const enrolled = course.enrollments.length
        const capacity = course.maxStudents
        return enrolled < capacity // 只返回有剩余名额的课程
      })
      .map(course => ({
        id: course.id,
        name: course.name,
        description: course.description || '',
        teacher: course.teachers.map((ct: any) => ct.teacher.realName).join(', ') || '未指定教师',
        capacity: course.maxStudents,
        enrolled: course.enrollments.length,
        fee: Number(course.price),
        schedule: course.timeSlots ? 
          (course.timeSlots as any[]).map((slot: any) => {
            const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
            return `${days[slot.dayOfWeek]} ${slot.startTime}-${slot.endTime}`
          }).join(', ') : '时间待定',
        timeSlots: course.timeSlots || [], // 返回原始时间段数据用于冲突检测
        startDate: new Date().toISOString().split('T')[0], // 临时使用当前日期
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3个月后
      }))

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'AVAILABLE_COURSES_QUERY', {
      totalCourses: courses.length,
      availableCourses: availableCourses.length
    })

    res.json({
      code: 200,
      message: '获取可报名课程列表成功',
      data: availableCourses
    })
  } catch (error) {
    console.error('获取可报名课程列表失败:', error)
    throw new BusinessError('获取可报名课程列表失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 检查身份证号是否已存在
 * GET /api/applications/check-id
 */
router.get('/check-id', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { idNumber } = req.query

  if (!idNumber || typeof idNumber !== 'string') {
    throw new BusinessError('身份证号不能为空', 400, 'VALIDATION_ERROR')
  }

  try {
    const existingStudent = await prisma.student.findFirst({
      where: {
        idNumber: idNumber,
        isActive: true
      }
    })

    res.json({
      code: 200,
      message: '身份证号检查完成',
      data: {
        exists: !!existingStudent
      }
    })
  } catch (error) {
    console.error('身份证号检查失败:', error)
    throw new BusinessError('身份证号检查失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 查询学员详细报名信息（用于跨学期报名限制计算）
 * GET /api/applications/student-enrollments
 */
router.get('/student-enrollments', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { idNumber } = req.query

  if (!idNumber || typeof idNumber !== 'string') {
    throw new BusinessError('身份证号不能为空', 400, 'VALIDATION_ERROR')
  }

  try {
    // 查询学员信息
    const existingStudent = await prisma.student.findFirst({
      where: {
        idNumber: idNumber,
        isActive: true
      },
      include: {
        enrollments: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED']
            }
          },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                semester: true,
                level: true
              }
            }
          }
        }
      }
    })

    if (!existingStudent) {
      res.json({
        code: 200,
        message: '学员不存在',
        data: {
          exists: false,
          student: null,
          enrollments: []
        }
      })
      return
    }

    // 按学期分组统计报名情况
    const semesterStats = new Map<string, { count: number, limit: number, courses: Array<{ id: string, name: string, level: string }> }>()

    existingStudent.enrollments.forEach(enrollment => {
      const semester = enrollment.course.semester
      if (semester && typeof semester === 'string') {
        const current = semesterStats.get(semester) || { count: 0, limit: 0, courses: [] }
        current.count++
        current.limit = getMaxCoursesForSemester(semester)
        current.courses.push({
          id: enrollment.course.id,
          name: enrollment.course.name,
          level: enrollment.course.level || ''
        })
        semesterStats.set(semester, current)
      }
    })

    // 计算总报名数量
    const totalEnrollments = existingStudent.enrollments.length

    res.json({
      code: 200,
      message: '查询学员报名信息成功',
      data: {
        exists: true,
        student: {
          id: existingStudent.id,
          name: existingStudent.name,
          idNumber: existingStudent.idNumber,
          currentGrade: existingStudent.currentGrade,
          graduationStatus: existingStudent.graduationStatus
        },
        enrollments: existingStudent.enrollments.map(e => ({
          id: e.id,
          status: e.status,
          course: e.course
        })),
        semesterBreakdown: Array.from(semesterStats.entries()).map(([sem, stats]) => ({
          semester: sem,
          count: stats.count,
          limit: stats.limit,
          courses: stats.courses
        })),
        totalEnrollments
      }
    })
  } catch (error) {
    console.error('查询学员报名信息失败:', error)
    throw new BusinessError('查询学员报名信息失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 验证报名表单数据
 * POST /api/applications/validate
 */
router.post('/validate', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = req.body
  const errors: Array<{ field: string; message: string }> = []

  // 基础字段验证
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: '姓名不能为空' })
  }

  if (!data.idNumber || data.idNumber.trim().length === 0) {
    errors.push({ field: 'idNumber', message: '身份证号不能为空' })
  } else if (!/^\d{17}[\dX]$/.test(data.idNumber)) {
    errors.push({ field: 'idNumber', message: '身份证号格式不正确' })
  }

  if (!data.contactPhone || data.contactPhone.trim().length === 0) {
    errors.push({ field: 'contactPhone', message: '联系电话不能为空' })
  } else if (!/^1[3-9]\d{9}$/.test(data.contactPhone)) {
    errors.push({ field: 'contactPhone', message: '手机号格式不正确' })
  }

  if (!data.gender) {
    errors.push({ field: 'gender', message: '请选择性别' })
  }

  if (!data.birthday) {
    errors.push({ field: 'birthday', message: '请选择出生日期' })
  }

  res.json({
    code: 200,
    message: '表单验证完成',
    data: {
      valid: errors.length === 0,
      errors
    }
  })
}))

// 更新申请信息
router.put('/:id', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { courseId, insuranceStart, insuranceEnd, remarks } = req.body

    // 验证申请是否存在
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        course: true
      }
    })

    if (!enrollment) {
      throw new BusinessError('报名记录不存在', 404, 'ENROLLMENT_NOT_FOUND')
    }

    // 只允许编辑待审核的申请
    if (enrollment.status !== 'PENDING') {
      throw new BusinessError('只能编辑待审核的申请', 400, 'CANNOT_EDIT_REVIEWED')
    }

    // 更新申请信息
    const updateData: any = {}
    
    if (courseId && courseId !== enrollment.courseId) {
      throw new BusinessError('不能直接修改历史申请的课程，请取消原申请后重新提交', 400, 'CANNOT_CHANGE_ENROLLMENT_COURSE')
    }
    
    if (insuranceStart) {
      updateData.insuranceStart = new Date(insuranceStart)
    }
    
    if (insuranceEnd) {
      updateData.insuranceEnd = new Date(insuranceEnd)
    }
    
    if (remarks !== undefined) {
      updateData.remarks = remarks
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        student: true,
        course: true
      }
    })

    // 记录操作日志
    console.log('申请信息更新成功:', {
      enrollmentId: id,
      studentName: enrollment.student.name,
      courseName: enrollment.course.name,
      changes: updateData
    })

    res.json({
      code: 200,
      message: '申请信息更新成功',
      data: updatedEnrollment
    })
  } catch (error) {
    console.error('更新申请信息失败:', error)
    throw new BusinessError('更新申请信息失败')
  }
}))

/**
 * 匿名提交报名申请（手机端）
 * POST /api/applications/anonymous
 */
router.post('/anonymous', asyncHandler(async () => {
  throw new BusinessError(
    'Legacy anonymous application creation has moved to /api/applications-v2/anonymous',
    410,
    'LEGACY_APPLICATION_CREATE_DISABLED'
  )
}))

router.post('/', authMiddleware, asyncHandler(async () => {
  throw new BusinessError(
    'Legacy application creation has moved to /api/applications-v2',
    410,
    'LEGACY_APPLICATION_CREATE_DISABLED'
  )
}))


/**
 * 提交报名申请（需要认证）
 * POST /api/applications
 */

// 检查身份证号是否已存在并返回完整学员信息
router.get('/check-id/:idNumber', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { idNumber } = req.params
  
  try {
    const existingStudent = await prisma.student.findFirst({
      where: { 
        idNumber: idNumber,
        isActive: true
      },
      select: { 
        id: true, 
        name: true,
        gender: true,
        birthDate: true,
        ethnicity: true,
        educationLevel: true,
        politicalStatus: true,
        contactPhone: true,
        idCardAddress: true,
        familyAddress: true,
        currentAddress: true,
        healthStatus: true,
        photo: true,
        idCardFront: true,
        idCardBack: true,
        major: true,
        currentGrade: true,
        semester: true,
        insuranceCompany: true,
        retirementCategory: true,
        studyPeriodStart: true,
        studyPeriodEnd: true,
        emergencyContact: true, // 添加紧急联系人
        emergencyPhone: true, // 添加紧急联系电话
        emergencyRelation: true, // 添加紧急联系关系
        enrollments: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] }
          },
          select: {
            id: true,
            status: true,
            courseId: true,
            course: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        }
      }
    })
    
    res.json({
      code: 200,
      message: '检查完成',
      data: {
        exists: !!existingStudent,
        studentInfo: existingStudent,
        activeEnrollmentsCount: existingStudent?.enrollments?.length || 0,
        maxCoursesAllowed: 2,
        remainingCourseSlots: 2 - (existingStudent?.enrollments?.length || 0)
      }
    })
  } catch (error) {
    console.error('检查身份证号失败', error, {
      url: req.originalUrl,
      hasIdNumber: Boolean(idNumber)
    })
    throw new BusinessError('检查身份证号失败', 500, 'CHECK_ERROR')
  }
}))

export default router
