/**
 * 报名申请路由
 * @description 处理学生报名申请相关的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { authMiddleware } from '@/middleware/auth'
import { businessLogger } from '@/utils/logger'

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { 
  calculateCurrentGrade, 
  shouldGraduate, 
  canEnrollCourse, 
  canEnrollSameCourseInDifferentSemester,
  getCurrentSemester,
  type Grade,
  type GraduationStatus,
  type AcademicStatus
} from '../utils/gradeManagement'
import { generateStudentCode } from '../utils/studentCodeGenerator'

const router = Router()
const prisma = new PrismaClient()

/**
 * 计算年龄
 * @param birthDate 出生日期
 * @returns 年龄（周岁）
 */
function calculateAge(birthDate: string | Date): number {
  if (!birthDate) return 0
  
  const birth = new Date(birthDate)
  const today = new Date()
  
  if (isNaN(birth.getTime())) return 0
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * 获取所有报名申请列表（管理员用）
 * GET /api/applications
 */
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, keyword, status, courseId, department } = req.query
  
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
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
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
        studentCode: enrollment.student.studentCode
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

    businessLogger.userAction(req.user!.id, 'APPLICATION_LIST_QUERY', {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      resultCount: applications.length,
      filters: { keyword, status }
    })

    res.json({
      code: 200,
      message: '获取报名申请列表成功',
      data: {
        list: applications,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
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
router.get('/statistics', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
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

    businessLogger.userAction(req.user!.id, 'APPLICATION_STATS_QUERY', {
      total: totalEnrollments,
      pending,
      approved,
      rejected,
      cancelled
    })

    res.json({
      code: 200,
      message: '获取报名统计数据成功',
      data: {
        total: totalEnrollments,
        pending,
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

router.post('/:id/review', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, comments } = req.body

  try {
    // 查找报名记录
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

    // 更新报名状态
    const updateData: any = {
      status: status.toUpperCase() as 'APPROVED' | 'REJECTED'
    }
    
    // 根据状态设置不同字段
    if (status.toUpperCase() === 'APPROVED') {
      updateData.approvedAt = new Date()
      updateData.approvedBy = req.user!.id
    }
    
    // 设置备注
    if (comments) {
      updateData.remarks = comments
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: updateData
    })

    businessLogger.userAction(req.user!.id, 'APPLICATION_REVIEW', {
      enrollmentId: id,
      studentName: enrollment.student.name,
      courseName: enrollment.course.name,
      status,
      comments
    })

    res.json({
      code: 200,
      message: `报名申请${status === 'APPROVED' ? '批准' : '拒绝'}成功`,
      data: updatedEnrollment
    })
  } catch (error) {
    console.error('审核报名申请失败:', error)
    if (error instanceof BusinessError) {
      throw error
    }
    throw new BusinessError('审核报名申请失败', 500, 'REVIEW_ERROR')
  }
}))



/**
 * 生成日期+数字格式的申请编号
 * 格式：{YYYYMMDD}{3位序号}，如 20250819001, 20250819002
 */
async function generateApplicationCode(): Promise<string> {
  const today = new Date()
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  
  // 查找今日最大的申请编号
  const latestEnrollment = await prisma.enrollment.findFirst({
    where: {
      enrollmentCode: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      enrollmentCode: 'desc'
    }
  })

  let nextNumber = 1
  if (latestEnrollment) {
    // 提取序号部分并自增
    const codeMatch = latestEnrollment.enrollmentCode.match(/\d{8}(\d{3})/)
    if (codeMatch) {
      nextNumber = parseInt(codeMatch[1]) + 1
    }
  }

  // 格式化为3位数字，如：001, 002, 999
  return `${datePrefix}${nextNumber.toString().padStart(3, '0')}`
}

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
router.get('/check-id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
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
router.put('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
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
      updateData.courseId = courseId
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
router.post('/anonymous', asyncHandler(async (req: Request, res: Response) => {
  console.log('🚨🚨🚨 匿名报名申请接口被调用了！！！ 🚨🚨🚨')
  console.log('请求方法:', req.method)
  console.log('请求路径:', req.path)
  console.log('用户代理:', req.headers['user-agent'])
  
  const applicationData = req.body
  console.log('请求体存在:', !!applicationData)
  console.log('请求体键值:', Object.keys(applicationData || {}))
  
  try {
    console.log('🔍 开始基础字段验证...')
    
    // 验证必填字段
    if (!applicationData.name) {
      console.log('❌ 姓名验证失败:', applicationData.name)
      throw new ValidationError('姓名不能为空', [{ field: 'name', message: '姓名不能为空' }])
    }
    console.log('✅ 姓名验证通过:', applicationData.name)

    if (!applicationData.idNumber) {
      console.log('❌ 身份证号验证失败:', applicationData.idNumber)
      throw new ValidationError('身份证号不能为空', [{ field: 'idNumber', message: '身份证号不能为空' }])
    }
    console.log('✅ 身份证号验证通过:', applicationData.idNumber)

    if (!applicationData.selectedCourses || !Array.isArray(applicationData.selectedCourses) || applicationData.selectedCourses.length === 0) {
      console.log('❌ 课程选择验证失败:', applicationData.selectedCourses)
      throw new ValidationError('请至少选择一门课程', [{ field: 'selectedCourses', message: '请至少选择一门课程' }])
    }
    console.log('✅ 课程选择验证通过:', applicationData.selectedCourses)

    if (applicationData.selectedCourses.length > 2) {
      console.log('❌ 课程数量验证失败，选择了', applicationData.selectedCourses.length, '门课程')
      throw new ValidationError('最多只能选择2门课程', [{ field: 'selectedCourses', message: '最多只能选择2门课程' }])
    }
    console.log('✅ 课程数量验证通过，共选择', applicationData.selectedCourses.length, '门课程')

    console.log('🔍 开始学生和课程重复检查...')
    
    // 查找现有学生（包括毕业生）
    const existingStudent = await prisma.student.findFirst({
      where: {
        idNumber: applicationData.idNumber,
        isActive: true
      },
      include: {
        enrollments: {
          include: {
            course: true
          }
        }
      }
    })
    
    if (existingStudent) {
      console.log('找到现有学生:', existingStudent.name, '年级:', existingStudent.currentGrade, '状态:', existingStudent.graduationStatus)
      
      // 检查是否为毕业生 - 毕业生可以重新报名
      if (existingStudent.graduationStatus === 'GRADUATED' || existingStudent.graduationStatus === 'ARCHIVED') {
        console.log('✅ 毕业生重新报名，允许创建新的学习记录')
        // 毕业生可以重新开始，后续会创建新的学习周期
      } else {
        // 在读学生 - 检查课程和学期冲突
        for (const courseId of applicationData.selectedCourses) {
          // 查找目标课程信息
          const targetCourse = await prisma.course.findUnique({
            where: { id: courseId }
          })
          
          if (!targetCourse || !targetCourse.semester) {
            continue
          }
          
          // 检查是否在同一学期重复报名同一课程
          const duplicateEnrollment = existingStudent.enrollments.find(enrollment => 
            enrollment.courseId === courseId && 
            enrollment.course.semester === targetCourse.semester &&
            enrollment.status !== 'CANCELLED'
          )
          
          if (duplicateEnrollment) {
            console.log('❌ 同学期重复报名:', targetCourse.name, targetCourse.semester)
            throw new ValidationError(`您在${targetCourse.semester}已经报名过课程"${targetCourse.name}"`, [{ 
              field: 'selectedCourses', 
              message: `您在${targetCourse.semester}已经报名过课程"${targetCourse.name}"` 
            }])
          }
          
          // 检查学生是否有任何通过审核的课程
          const hasApprovedCourses = existingStudent.enrollments.some((enrollment: any) => 
            enrollment.status === 'APPROVED'
          )
          
          // 检查年级是否匹配
          const gradeCheck = canEnrollCourse(existingStudent.currentGrade, targetCourse.level, existingStudent.graduationStatus, true, hasApprovedCourses)
          if (!gradeCheck.canEnroll) {
            console.log('❌ 年级不匹配:', gradeCheck.reason)
            throw new ValidationError(`课程"${targetCourse.name}": ${gradeCheck.reason}`, [{ 
              field: 'selectedCourses', 
              message: gradeCheck.reason || '年级不匹配' 
            }])
          }
        }
        
        console.log('✅ 在读学生跨学期报名检查通过')
      }
    }
    
    // 检查是否有被软删除的学生记录
    const deletedStudent = await prisma.student.findFirst({
      where: { 
        idNumber: applicationData.idNumber,
        isActive: false
      }
    })
    
    if (deletedStudent) {
      console.log('🔄 发现已删除的学生记录，准备恢复并更新...')
      console.log('原学生信息:', deletedStudent.id, deletedStudent.name)
    }
    
    console.log('✅ 学生和课程重复检查通过')

    console.log('🔍 开始课程存在性验证...')
    // 验证选择的课程是否都存在且可报名
    for (const courseId of applicationData.selectedCourses) {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      })
      if (!course) {
        console.log('❌ 课程不存在:', courseId)
        throw new ValidationError(`选择的课程不存在: ${courseId}`, [{ field: 'selectedCourses', message: '选择的课程中包含无效课程' }])
      }
      if (course.status !== 'PUBLISHED') {
        console.log('❌ 课程未发布:', courseId, course.name)
        throw new ValidationError(`课程 "${course.name}" 当前不可报名`, [{ field: 'selectedCourses', message: '选择的课程中包含不可报名的课程' }])
      }
    }
    console.log('✅ 课程存在性验证通过')

    console.log('📝 开始创建学生和报名记录...')

    // 使用事务创建学生和报名记录
    const result = await prisma.$transaction(async (tx) => {
      let student
      const currentSemester = getCurrentSemester()
      
      if (existingStudent) {
        // 使用现有学生记录
        student = existingStudent
        console.log('使用现有学生记录:', student.name)
        
        // 如果是毕业生重新报名，创建新的学习周期
        if (existingStudent.graduationStatus === 'GRADUATED' || existingStudent.graduationStatus === 'ARCHIVED') {
          student = await tx.student.update({
            where: { id: existingStudent.id },
            data: {
              currentGrade: '一年级', // 重新开始
              enrollmentYear: new Date().getFullYear(),
              enrollmentSemester: currentSemester,
              graduationStatus: 'IN_PROGRESS',
              academicStatus: 'ACTIVE',
              updatedAt: new Date(),
              remarks: (existingStudent.remarks || '') + ` [${new Date().toISOString()}] 毕业生重新报名开始新学习周期`
            }
          })
          console.log(`🔄 毕业生重新开始学习周期: ${student.name}`)
        } else {
          // 检查并更新学生年级（如果需要）
          const shouldBeGrade = calculateCurrentGrade(student.enrollmentSemester || currentSemester, currentSemester)
          const needsGradeUpdate = shouldBeGrade !== student.currentGrade && shouldBeGrade !== 'GRADUATED'
          
          if (needsGradeUpdate) {
            student = await tx.student.update({
              where: { id: student.id },
              data: {
                currentGrade: shouldBeGrade as Grade,
                updatedAt: new Date()
              }
            })
            console.log(`✅ 学生年级已更新: ${student.name} -> ${shouldBeGrade}`)
          }
          
          // 检查是否应该毕业
          if (shouldGraduate(student.enrollmentSemester || currentSemester, currentSemester)) {
            student = await tx.student.update({
              where: { id: student.id },
              data: {
                graduationStatus: 'GRADUATED',
                graduationDate: new Date(),
                academicStatus: 'GRADUATED',
                updatedAt: new Date()
              }
            })
            console.log(`🎓 学生已自动毕业: ${student.name}`)
          }
        }
      } else if (false) { // 临时禁用：deletedStudent作用域问题
        // console.log('🔄 恢复已删除的学生记录:', (deletedStudent as any).id)
        
        // 恢复并更新学生记录
        student = await tx.student.update({
          where: { id: 'temp-id' }, // (deletedStudent as any).id
          data: {
            name: applicationData.name,
            gender: applicationData.gender === '男' ? 'MALE' : 'FEMALE',
            age: calculateAge(applicationData.birthDate) || 0,
            birthday: applicationData.birthDate ? new Date(applicationData.birthDate) : new Date('1900-01-01'),
            idCardAddress: applicationData.familyAddress || '地址信息不详',
            contactPhone: applicationData.familyPhone,
            currentAddress: applicationData.familyAddress,
            emergencyContact: applicationData.emergencyContact,
            emergencyPhone: applicationData.emergencyPhone,
            emergencyRelation: '紧急联系人',
            isActive: true, // 恢复为活跃状态
            // 重新设置年级管理字段
            currentGrade: '一年级',
            enrollmentYear: new Date().getFullYear(),
            enrollmentSemester: currentSemester,
            graduationStatus: 'IN_PROGRESS',
            academicStatus: 'ACTIVE',
            updatedAt: new Date(),
            // 将扩展信息存储在remarks字段中
            remarks: `手机端匿名提交 - 民族:${applicationData.ethnicity}, 健康状况:${applicationData.healthStatus}, 文化程度:${applicationData.educationLevel}, 政治面貌:${applicationData.politicalStatus}, 工作状态:${applicationData.isRetired ? '退休' : '在职'}, 保险类别:${applicationData.retirementCategory}, 超龄协议:${applicationData.agreementSigned ? '已签订' : '未签订'} [恢复记录]`
          }
        })
        console.log('✅ 学生记录恢复成功:', student.id, student.name)
      } else {
        // 🔧 生成学员编号，从第一门所选课程中获取学期信息
        let studentSemester: string | undefined
        if (applicationData.selectedCourses && applicationData.selectedCourses.length > 0) {
          const firstCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { semester: true }
          })
          studentSemester = firstCourse?.semester || undefined
        }
        const studentCode = await generateStudentCode(studentSemester)
        
        // 创建新学员
        student = await (tx.student.create as any)({
          data: {
            studentCode: studentCode,
            name: applicationData.name,
            gender: applicationData.gender === '男' ? 'MALE' : 'FEMALE',
            age: calculateAge(applicationData.birthDate) || 0,
            birthday: applicationData.birthDate ? new Date(applicationData.birthDate) : new Date('1900-01-01'),
            idNumber: applicationData.idNumber,
            idCardAddress: applicationData.familyAddress || '地址信息不详',
            contactPhone: applicationData.familyPhone,
            currentAddress: applicationData.familyAddress,
            emergencyContact: applicationData.emergencyContact,
            emergencyPhone: applicationData.emergencyPhone,
            emergencyRelation: '紧急联系人',
            isActive: true,
            createdBy: 'anonymous',
            // 设置年级管理字段
            currentGrade: '一年级',
            enrollmentYear: new Date().getFullYear(),
            enrollmentSemester: currentSemester,
            graduationStatus: 'IN_PROGRESS',
            academicStatus: 'ACTIVE',
            // 将扩展信息存储在remarks字段中
            remarks: `手机端匿名提交 - 民族:${applicationData.ethnicity}, 健康状况:${applicationData.healthStatus}, 文化程度:${applicationData.educationLevel}, 政治面貌:${applicationData.politicalStatus}, 工作状态:${applicationData.isRetired ? '退休' : '在职'}, 保险类别:${applicationData.retirementCategory}, 超龄协议:${applicationData.agreementSigned ? '已签订' : '未签订'}`
          }
        })
        console.log('✅ 学生创建成功:', student.id, student.name)
      }

      // 为每个课程创建报名记录
      const enrollments = []
      for (const courseId of applicationData.selectedCourses) {
        const enrollment = await tx.enrollment.create({
          data: {
            enrollmentCode: await generateApplicationCode(),
            studentId: student.id,
            courseId: courseId,
            enrollmentDate: new Date(),
            status: 'PENDING',
            // 保险有效期
            insuranceStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
            insuranceEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
            remarks: applicationData.remarks || '手机端匿名提交',
            createdBy: 'anonymous' // 匿名用户创建
          }
        })
        enrollments.push(enrollment)
        console.log('✅ 报名记录创建成功:', enrollment.enrollmentCode, '课程:', courseId)
      }

      return { student, enrollments }
    })

    // 记录操作日志（匿名用户）
    businessLogger.userAction('anonymous', 'ANONYMOUS_APPLICATION_SUBMIT', {
      studentId: result.student.id,
      courseIds: applicationData.selectedCourses,
      enrollmentIds: result.enrollments.map(e => e.id),
      source: 'mobile'
    })

    console.log('🎉 匿名报名提交成功！')
    res.json({
      code: 200,
      message: `成功提交${applicationData.selectedCourses.length}门课程的报名申请`,
      data: {
        studentId: result.student.id,
        enrollmentIds: result.enrollments.map(e => e.id),
        coursesCount: applicationData.selectedCourses.length
      }
    })
  } catch (error) {
    if (error instanceof BusinessError ||
        error instanceof ValidationError) {
      throw error
    }
    
    console.error('💥 匿名报名申请处理失败:', error)
    throw new BusinessError('报名申请提交失败，请重试')
  }
}))

/**
 * 提交报名申请（需要认证）
 * POST /api/applications
 */
router.post('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  console.log('🚨🚨🚨 报名申请接口被调用了！！！ 🚨🚨🚨')
  console.log('请求方法:', req.method)
  console.log('请求路径:', req.path)
  console.log('请求头Authorization:', req.headers.authorization?.substring(0, 50) + '...')
  
  const applicationData = req.body
  console.log('请求体存在:', !!applicationData)
  console.log('请求体键值:', Object.keys(applicationData || {}))
  
  try {
    console.log('🔍 开始基础字段验证...')
    
    // 验证必填字段
    if (!applicationData.name) {
      console.log('❌ 姓名验证失败:', applicationData.name)
      throw new ValidationError('姓名不能为空', [{ field: 'name', message: '姓名不能为空' }])
    }
    console.log('✅ 姓名验证通过:', applicationData.name)

    if (!applicationData.idNumber) {
      console.log('❌ 身份证号验证失败:', applicationData.idNumber)
      throw new ValidationError('身份证号不能为空', [{ field: 'idNumber', message: '身份证号不能为空' }])
    }
    console.log('✅ 身份证号验证通过:', applicationData.idNumber)

    if (!applicationData.selectedCourses || !Array.isArray(applicationData.selectedCourses) || applicationData.selectedCourses.length === 0) {
      console.log('❌ 课程选择验证失败:', applicationData.selectedCourses)
      throw new ValidationError('请至少选择一门课程', [{ field: 'selectedCourses', message: '请至少选择一门课程' }])
    }
    console.log('✅ 课程选择验证通过:', applicationData.selectedCourses)

    if (applicationData.selectedCourses.length > 2) {
      console.log('❌ 课程数量验证失败，选择了', applicationData.selectedCourses.length, '门课程')
      throw new ValidationError('最多只能选择2门课程', [{ field: 'selectedCourses', message: '最多只能选择2门课程' }])
    }
    console.log('✅ 课程数量验证通过，共选择', applicationData.selectedCourses.length, '门课程')

    console.log('🔍 开始学生和课程重复检查...')
    
    // 查找现有学生（包括毕业生）
    const existingStudent = await prisma.student.findFirst({
      where: {
        idNumber: applicationData.idNumber,
        isActive: true
      },
      include: {
        enrollments: {
          include: {
            course: true
          }
        }
      }
    })
    console.log('学生查询结果:', existingStudent ? '已存在' : '不存在')

    if (existingStudent) {
      console.log('找到现有学生:', existingStudent.name, '年级:', existingStudent.currentGrade, '状态:', existingStudent.graduationStatus)
      
      // 检查是否为毕业生 - 毕业生可以重新报名
      if (existingStudent.graduationStatus === 'GRADUATED' || existingStudent.graduationStatus === 'ARCHIVED') {
        console.log('✅ 毕业生重新报名，允许创建新的学习记录')
        // 毕业生可以重新开始，后续会创建新的学习周期
      } else {
        // 在读学生 - 检查课程和学期冲突
        for (const courseId of applicationData.selectedCourses) {
          // 查找目标课程信息
          const targetCourse = await prisma.course.findUnique({
            where: { id: courseId }
          })
          
          if (!targetCourse || !targetCourse.semester) {
            continue
          }
          
          // 检查是否在同一学期重复报名同一课程
          const duplicateEnrollment = existingStudent.enrollments.find(enrollment => 
            enrollment.courseId === courseId && 
            enrollment.course.semester === targetCourse.semester &&
            enrollment.status !== 'CANCELLED'
          )
          
          if (duplicateEnrollment) {
            console.log('❌ 同学期重复报名:', targetCourse.name, targetCourse.semester)
            throw new ValidationError(`您在${targetCourse.semester}已经报名过课程"${targetCourse.name}"`, [{ 
              field: 'selectedCourses', 
              message: `您在${targetCourse.semester}已经报名过课程"${targetCourse.name}"` 
            }])
          }
          
          // 检查学生是否有任何通过审核的课程
          const hasApprovedCourses = existingStudent.enrollments.some((enrollment: any) => 
            enrollment.status === 'APPROVED'
          )
          
          // 检查年级是否匹配
          const gradeCheck = canEnrollCourse(existingStudent.currentGrade, targetCourse.level, existingStudent.graduationStatus, true, hasApprovedCourses)
          if (!gradeCheck.canEnroll) {
            console.log('❌ 年级不匹配:', gradeCheck.reason)
            throw new ValidationError(`课程"${targetCourse.name}": ${gradeCheck.reason}`, [{ 
              field: 'selectedCourses', 
              message: gradeCheck.reason || '年级不匹配' 
            }])
          }
        }
        
        console.log('✅ 在读学生跨学期报名检查通过')
      }
    }
    
    console.log('✅ 学生和课程重复检查通过')

    console.log('🔍 开始获取课程信息...', applicationData.selectedCourses)
    // 获取选择的课程信息
    const selectedCourses = await prisma.course.findMany({
      where: {
        id: { in: applicationData.selectedCourses },
        isActive: true
      },
      include: {
        enrollments: {
          where: { 
            status: { in: ['PENDING', 'APPROVED'] }
          }
        }
      }
    })
    console.log('查询到的课程数量:', selectedCourses.length)
    console.log('课程详情:', selectedCourses.map(c => ({ id: c.id, name: c.name })))

    // 检查课程是否都存在
    if (selectedCourses.length !== applicationData.selectedCourses.length) {
      console.log('❌ 课程存在性检查失败')
      console.log('请求课程数:', applicationData.selectedCourses.length)
      console.log('找到课程数:', selectedCourses.length)
      console.log('请求的课程ID:', applicationData.selectedCourses)
      console.log('找到的课程ID:', selectedCourses.map(c => c.id))
      throw new BusinessError('部分课程不存在或已停止招生', 400, 'COURSE_NOT_FOUND')
    }
    console.log('✅ 课程存在性检查通过')

    // 检查课程名额
    for (const course of selectedCourses) {
      if (course.enrollments.length >= course.maxStudents) {
        throw new BusinessError(`课程"${course.name}"名额已满`, 400, 'COURSE_FULL')
      }
    }

    // 检查时间冲突（如果选择了多门课程）
    if (selectedCourses.length > 1) {
      for (let i = 0; i < selectedCourses.length; i++) {
        for (let j = i + 1; j < selectedCourses.length; j++) {
          const course1 = selectedCourses[i]
          const course2 = selectedCourses[j]
          
          // 检查时间冲突
          if (hasTimeSlotConflict(course1.timeSlots as any[], course2.timeSlots as any[])) {
            throw new BusinessError(`课程"${course1.name}"与"${course2.name}"时间冲突`, 400, 'TIME_CONFLICT')
          }
        }
      }
    }

    // 处理身份证照片 - 直接使用文件路径（已通过upload-image接口上传）
    const idCardFrontPath = applicationData.idCardFront || null
    const idCardBackPath = applicationData.idCardBack || null
    
    console.log('身份证照片路径:', { 
      front: idCardFrontPath, 
      back: idCardBackPath 
    })

    // 创建学员信息和报名记录
    const result = await prisma.$transaction(async (tx) => {
      let student
      const currentSemester = getCurrentSemester()
      
      if (existingStudent) {
        // 使用现有学生记录
        student = existingStudent
        console.log('使用现有学生记录:', student.name)
        
        // 如果是毕业生重新报名，创建新的学习周期
        if (existingStudent.graduationStatus === 'GRADUATED' || existingStudent.graduationStatus === 'ARCHIVED') {
          student = await tx.student.update({
            where: { id: existingStudent.id },
        data: {
              currentGrade: '一年级', // 重新开始
              enrollmentYear: new Date().getFullYear(),
              enrollmentSemester: currentSemester,
              graduationStatus: 'IN_PROGRESS',
              academicStatus: 'ACTIVE',
              updatedAt: new Date(),
              remarks: (existingStudent.remarks || '') + ` [${new Date().toISOString()}] 毕业生重新报名开始新学习周期`
            }
          })
          console.log(`🔄 毕业生重新开始学习周期: ${student.name}`)
        } else {
          // 检查并更新学生年级（如果需要）
          const shouldBeGrade = calculateCurrentGrade(student.enrollmentSemester || currentSemester, currentSemester)
          const needsGradeUpdate = shouldBeGrade !== student.currentGrade && shouldBeGrade !== 'GRADUATED'
          
          if (needsGradeUpdate) {
            student = await tx.student.update({
              where: { id: student.id },
              data: {
                currentGrade: shouldBeGrade as Grade,
                updatedAt: new Date()
              }
            })
            console.log(`✅ 学生年级已更新: ${student.name} -> ${shouldBeGrade}`)
          }
          
          // 检查是否应该毕业
          if (shouldGraduate(student.enrollmentSemester || currentSemester, currentSemester)) {
            student = await tx.student.update({
              where: { id: student.id },
              data: {
                graduationStatus: 'GRADUATED',
                graduationDate: new Date(),
                academicStatus: 'GRADUATED',
                updatedAt: new Date()
              }
            })
            console.log(`🎓 学生已自动毕业: ${student.name}`)
          }
        }
      } else if (false) { // 临时禁用：deletedStudent作用域问题
        // console.log('🔄 恢复已删除的学生记录:', (deletedStudent as any).id)
        
        // 恢复并更新学生记录
        student = await tx.student.update({
          where: { id: 'temp-id' }, // (deletedStudent as any).id
          data: {
          name: applicationData.name,
          gender: applicationData.gender === '女' ? 'FEMALE' : 'MALE',
          age: calculateAge(applicationData.birthDate) || 0,
            birthday: applicationData.birthDate ? new Date(applicationData.birthDate) : new Date('1900-01-01'),
          idCardAddress: applicationData.idCardAddress || '',
          contactPhone: applicationData.contactPhone || applicationData.phone || '',
          currentAddress: applicationData.familyAddress || '',
            idCardFront: idCardFrontPath,
            idCardBack: idCardBackPath,
            emergencyContact: applicationData.emergencyContact || '',
            emergencyPhone: applicationData.emergencyPhone || '',
            emergencyRelation: applicationData.emergencyRelation || '',
            healthStatus: applicationData.healthStatus || '良好',
            remarks: applicationData.remarks || '恢复并更新的学生记录',
            isActive: true, // 恢复为活跃状态
            // 重新设置年级管理字段
            currentGrade: '一年级',
            enrollmentYear: new Date().getFullYear(),
            enrollmentSemester: currentSemester,
            graduationStatus: 'IN_PROGRESS',
            academicStatus: 'ACTIVE',
            updatedAt: new Date()
          }
        })
        console.log('✅ 学生记录恢复成功:', student.id, student.name)
        
        // 为恢复的学生创建报名记录
        const enrollments = []
        for (const courseId of applicationData.selectedCourses) {
          // 检查是否已经报名该课程
          const existingEnrollment = await tx.enrollment.findFirst({
            where: {
              studentId: student.id,
              courseId: courseId
            }
          })
          
          if (existingEnrollment) {
            console.log(`⚠️ 学生${student.name}已报名课程${courseId}，跳过重复报名`)
            continue
          }
          
          const enrollment = await tx.enrollment.create({
            data: {
              enrollmentCode: await generateApplicationCode(),
              studentId: student.id,
              courseId: courseId,
              enrollmentDate: new Date(),
              status: 'PENDING',
              insuranceStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
              insuranceEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
              remarks: applicationData.remarks || '恢复学生记录后的新报名',
              createdBy: req.user!.id
            }
          })
          enrollments.push(enrollment)
        }
        
        return { student, enrollments }
      } else {
        // 🔧 生成学员编号，从第一门所选课程中获取学期信息
        let studentSemester: string | undefined
        if (applicationData.selectedCourses && applicationData.selectedCourses.length > 0) {
          const firstCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { semester: true }
          })
          studentSemester = firstCourse?.semester || undefined
        }
        const studentCode = await generateStudentCode(studentSemester)
        
        // 创建新学员
        student = await (tx.student.create as any)({
          data: {
            studentCode: studentCode,
            name: applicationData.name,
            gender: applicationData.gender === '女' ? 'FEMALE' : 'MALE',
            age: calculateAge(applicationData.birthDate) || 0,
            birthday: applicationData.birthDate ? new Date(applicationData.birthDate) : new Date('1900-01-01'),
          idNumber: applicationData.idNumber,
          idCardAddress: applicationData.idCardAddress || '',
          contactPhone: applicationData.contactPhone || applicationData.phone || '',
          currentAddress: applicationData.familyAddress || '',
            // 个人照片存储在idCardFront和idCardBack中，不需要单独的photo字段
          // 身份证照片 - 存储文件路径而非base64数据
          idCardFront: idCardFrontPath,
          idCardBack: idCardBackPath,
          emergencyContact: applicationData.emergencyContact || '',
          emergencyPhone: applicationData.emergencyPhone || '',
          emergencyRelation: applicationData.emergencyRelation || '',
          healthStatus: applicationData.healthStatus || '良好',
          remarks: applicationData.remarks || '',
            userId: null, // 设置为null，避免userId冲突
          createdBy: req.user!.id,
            isActive: true,
            // 设置年级管理字段
            currentGrade: '一年级',
            enrollmentYear: new Date().getFullYear(),
            enrollmentSemester: currentSemester,
            graduationStatus: 'IN_PROGRESS',
            academicStatus: 'ACTIVE'
          }
        })
        console.log('✅ 新学生创建成功:', student.id, student.name)
      }

      // 为每个课程创建报名记录
      const enrollments = []
      for (const courseId of applicationData.selectedCourses) {
        // 🔥 检查是否已经报名该课程
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            studentId: student.id,
            courseId: courseId
          }
        })
        
        if (existingEnrollment) {
          console.log(`⚠️ 学生${student.name}已报名课程${courseId}，跳过重复报名`)
          continue
        }
        
        const enrollment = await tx.enrollment.create({
          data: {
            enrollmentCode: await generateApplicationCode(), // 🔥 使用日期+数字格式的申请编号
            studentId: student.id,
            courseId: courseId,
            enrollmentDate: new Date(),
            status: 'PENDING',
            // 保险有效期
            insuranceStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
            insuranceEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
            remarks: applicationData.remarks || '',
            createdBy: req.user!.id
          }
        })
        enrollments.push(enrollment)
      }

      return { student, enrollments }
    })

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'APPLICATION_SUBMIT', {
      studentId: result.student.id,
      courseIds: applicationData.selectedCourses,
      enrollmentIds: result.enrollments.map(e => e.id)
    })

    res.json({
      code: 200,
      message: `成功提交${applicationData.selectedCourses.length}门课程的报名申请`,
      data: {
        studentId: result.student.id,
        enrollmentIds: result.enrollments.map(e => e.id),
        coursesCount: applicationData.selectedCourses.length
      }
    })
  } catch (error: any) {
    if (error instanceof BusinessError || error instanceof ValidationError) {
      throw error
    }
    
    console.error('提交报名申请失败:', error)
    
    // 处理Prisma数据库错误
    if (error.code === 'P2002') {
      const target = error.meta?.target
      console.error('数据库唯一约束冲突:', { code: error.code, target })
      
      if (target && target.includes('studentCode')) {
        throw new ValidationError('学员编号重复，请重试', [{ field: 'studentCode', message: '系统繁忙，请稍后重试' }])
      } else if (target && target.includes('idNumber')) {
        throw new ValidationError('该身份证号已经注册过', [{ field: 'idNumber', message: '该身份证号已经注册过' }])
      } else if (target && target.includes('userId')) {
        throw new ValidationError('用户账号冲突', [{ field: 'userId', message: '账号关联失败，请重试' }])
      } else {
        throw new ValidationError('数据重复冲突', [{ field: 'general', message: '提交的信息与现有记录冲突，请检查后重试' }])
      }
    }
    
    throw new BusinessError('提交报名申请失败', 500, 'CREATE_ERROR')
  }
}))

/**
 * 检查两个时间段数组是否有冲突
 */
const hasTimeSlotConflict = (timeSlots1: any[], timeSlots2: any[]): boolean => {
  if (!timeSlots1 || !timeSlots2 || timeSlots1.length === 0 || timeSlots2.length === 0) {
    return false
  }

  for (const slot1 of timeSlots1) {
    for (const slot2 of timeSlots2) {
      // 检查是否在同一天
      if (slot1.dayOfWeek === slot2.dayOfWeek) {
        // 检查时间是否重叠
        const start1 = slot1.startTime
        const end1 = slot1.endTime
        const start2 = slot2.startTime
        const end2 = slot2.endTime
        
        // 如果时间段有重叠，返回true
        if (start1 < end2 && start2 < end1) {
          return true
        }
      }
    }
  }
  return false
}



// 检查身份证号是否已存在并返回完整学员信息
router.get('/check-id/:idNumber', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
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
      idNumber
    })
    throw new BusinessError('检查身份证号失败', 500, 'CHECK_ERROR')
  }
}))

export default router
