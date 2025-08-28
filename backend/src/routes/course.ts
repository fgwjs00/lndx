/**
 * 课程管理路由
 * @description 处理课程相关的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler, BusinessError } from '@/middleware/errorHandler'
import { authMiddleware, requireTeacher } from '@/middleware/auth'
import { validatePaginationData } from '@/utils/validation'
import { businessLogger } from '@/utils/logger'
import multer from 'multer'
const XLSX = require('xlsx')
import fs from 'fs'
import path from 'path'

const router = Router()
const prisma = new PrismaClient()

// 解析上课时间字符串为timeSlots数组
function parseTimeSlots(timeString: string): any[] {
  if (!timeString || typeof timeString !== 'string') {
    return []
  }

  const slots = []
  // 按分号分割多个时间段
  const timeSegments = timeString.split(';').map(s => s.trim()).filter(s => s)
  
  for (const segment of timeSegments) {
    try {
      // 解析格式：周一 09:00-11:00
      const match = segment.match(/^(周[一二三四五六日])\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/)
      if (match) {
        const [, dayStr, startTime, endTime] = match
        
        // 转换星期为数字 (1=周一, 2=周二, ..., 7=周日)
        const dayMap: {[key: string]: number} = {
          '周一': 1, '周二': 2, '周三': 3, '周四': 4, 
          '周五': 5, '周六': 6, '周日': 7
        }
        
        const dayOfWeek = dayMap[dayStr]
        if (dayOfWeek) {
          // 根据开始时间自动判断上下午
          const [hours] = startTime.split(':').map(Number)
          const period = hours < 12 ? 'morning' : 'afternoon'
          
          slots.push({
            dayOfWeek,
            startTime,
            endTime,
            period // 自动生成的上午/下午标识
          })
        }
      }
    } catch (error) {
      console.warn('解析时间段失败:', segment, error)
    }
  }
  
  return slots
}

// 配置multer用于文件上传
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持Excel和CSV文件') as any, false)
    }
  }
})

/**
 * 获取课程列表
 * GET /api/courses
 */
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // 直接解构查询参数
  const { 
    page = 1, 
    pageSize = 10, 
    keyword,
    category,
    level,
    status,
    semester,
    teacherId,
    requiresGrades,
    sortField = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // 参数类型转换和验证
  const pageNum = parseInt(page as string) || 1
  const pageSizeNum = parseInt(pageSize as string) || 10
  
  if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
    throw new BusinessError('分页参数无效', 400, 'INVALID_PAGINATION')
  }

  try {
    // 构建查询条件
    const where: any = {
      isActive: true
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { courseCode: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (level) {
      where.level = level
    }

    // 年级管理筛选
    if (requiresGrades !== undefined) {
      where.requiresGrades = requiresGrades === 'true'
    }

    if (status) {
      where.status = status
    }

    if (semester) {
      where.semester = semester
    }

    // 如果指定了教师ID，需要关联查询
    if (teacherId) {
      where.teachers = {
        some: {
          teacherId: teacherId
        }
      }
    }

    // 查询课程总数
    const total = await prisma.course.count({ where })

    // 分页查询课程列表
    const courses = await prisma.course.findMany({
      where,
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                realName: true,
                specialties: true
              }
            }
          }
        },
        enrollments: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        [sortField as any]: sortOrder
      },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum
    })

    // 转换数据格式以匹配前端需求
    const formattedCourses = courses.map(course => ({
      id: course.id,
      courseCode: course.courseCode,
      name: course.name,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      maxStudents: course.maxStudents,
      price: Number(course.price),
      hasAgeRestriction: course.hasAgeRestriction,
      minAge: course.minAge,
      maxAge: course.maxAge,
      ageDescription: course.ageDescription,
      // 年级管理字段
      requiresGrades: course.requiresGrades,
      gradeDescription: course.gradeDescription,
      tags: course.tags,
      timeSlots: course.timeSlots,
      status: course.status,
      enrolled: course.enrollments.filter(e => e.status === 'PENDING' || e.status === 'APPROVED').length, // 已报名人数（包含待审核）
      capacity: course.maxStudents, // 容量
      // 🔥 修复：添加缺失的字段返回
      teacher: course.teacher,           // 任课教师
      location: course.location,         // 上课地点
      semester: course.semester,         // 学期
      teachers: course.teachers.map(ct => ({
        id: ct.teacher.id,
        name: ct.teacher.realName,
        isMain: ct.isMain,
        specialties: ct.teacher.specialties
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }))

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'COURSE_LIST_QUERY', {
      page,
      pageSize,
      total,
      resultCount: courses.length,
      filters: { keyword, category, level, status, teacherId }
    })

    const totalPages = Math.ceil(total / pageSizeNum)

    res.json({
      code: 200,
      message: '课程列表查询成功',
      data: {
        list: formattedCourses,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages
      }
    })
  } catch (error) {
    console.error('查询课程列表失败:', error)
    throw new BusinessError('查询课程列表失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取可用学期列表
 * GET /api/courses/semesters
 */
router.get('/semesters', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取所有不重复的学期
    const semesters = await prisma.course.findMany({
      where: {
        isActive: true
      },
      select: {
        semester: true
      },
      distinct: ['semester']
    })

    // 提取学期值并排序（过滤掉null值）
    const semesterList = semesters
      .map(item => item.semester)
      .filter(Boolean) // 过滤掉null、undefined、空字符串
      .sort((a, b) => {
        // 按年份和季节排序 (2025年春季 > 2024年冬季)
        const getYear = (s: string) => parseInt(s.match(/(\d{4})年/)?.[1] || '0')
        const getSeason = (s: string) => {
          if (s.includes('春季')) return 1
          if (s.includes('夏季')) return 2
          if (s.includes('秋季')) return 3
          if (s.includes('冬季')) return 4
          return 0
        }
        
        const yearA = getYear(a!)
        const yearB = getYear(b!)
        if (yearA !== yearB) return yearB - yearA // 年份倒序
        return getSeason(b!) - getSeason(a!) // 季节倒序
      })

    res.json({
      code: 200,
      message: '获取学期列表成功',
      data: semesterList
    })
  } catch (error) {
    console.error('获取学期列表失败:', error)
    throw new BusinessError('获取学期列表失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取可用分类列表
 * GET /api/courses/categories
 */
router.get('/categories', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取所有不重复的课程分类
    const categories = await prisma.course.findMany({
      where: {
        isActive: true
      },
      select: {
        category: true
      },
      distinct: ['category']
    })

    // 提取分类值并排序（过滤掉null值）
    const categoryList = categories
      .map(item => item.category)
      .filter(Boolean) // 过滤掉null、undefined、空字符串
      .sort((a, b) => a!.localeCompare(b!, 'zh-CN'))

    res.json({
      code: 200,
      message: '获取分类列表成功',
      data: categoryList
    })
  } catch (error) {
    console.error('获取分类列表失败:', error)
    throw new BusinessError('获取分类列表失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取课程统计信息
 * GET /api/courses/stats
 */
router.get('/stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取课程总数
    const totalCourses = await prisma.course.count({
      where: { isActive: true }
    })

    // 按状态统计
    const statusStats = await prisma.course.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: {
        id: true
      }
    })

    // 按分类统计
    const categoryStats = await prisma.course.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: {
        id: true
      }
    })

    // 获取总报名人数
    const totalEnrollments = await prisma.enrollment.count({
      where: { 
        status: 'APPROVED',
        course: {
          isActive: true
        }
      }
    })

    // 获取活跃教师数量
    const activeTeachers = await prisma.courseTeacher.findMany({
      where: {
        course: {
          isActive: true
        }
      },
      distinct: ['teacherId'],
      select: {
        teacherId: true
      }
    })

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'COURSE_STATS_QUERY', {
      totalCourses,
      totalEnrollments,
      activeTeachersCount: activeTeachers.length
    })

    res.json({
      code: 200,
      message: '课程统计查询成功',
      data: {
        totalCourses,
        totalEnrollments,
        activeTeachersCount: activeTeachers.length,
        statusStats: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id
          return acc
        }, {} as Record<string, number>),
        categoryStats: categoryStats.reduce((acc, stat) => {
          acc[stat.category] = stat._count.id
          return acc
        }, {} as Record<string, number>)
      }
    })
  } catch (error) {
    console.error('查询课程统计失败:', error)
    throw new BusinessError('查询课程统计失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 下载课程导入模板
 * GET /api/courses/import-template
 */
router.get('/import-template', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 创建Excel模板
    // 🔧 修复：与导出CSV格式保持一致
    const templateData = [
      {
        '课程编号': 'AUTO_GENERATED',
        '课程名称': '示例课程',
        '院系': '书画系',
        '年级/类型': '一年级',
        '学期': '2024年秋季',
        '上课时间': '周一 09:00-11:00',
        '地点': '教学楼201',
        '容量': 30,
        '已报名': 0,
        '年龄限制': '50-80岁',
        '状态': '已发布',
        '课程描述': '这是一个示例课程说明'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '课程导入模板')

    // 🔧 修复：调整列宽匹配新的字段顺序
    worksheet['!cols'] = [
      { width: 18 }, // 课程编号
      { width: 22 }, // 课程名称
      { width: 12 }, // 院系
      { width: 15 }, // 年级/类型
      { width: 15 }, // 学期
      { width: 25 }, // 上课时间
      { width: 15 }, // 地点
      { width: 10 }, // 容量
      { width: 10 }, // 已报名
      { width: 15 }, // 年龄限制
      { width: 12 }, // 状态
      { width: 30 }  // 课程描述
    ]

    // 生成Excel文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=course-import-template.xlsx')
    res.send(buffer)

    businessLogger.userAction((req as any).user?.id, 'COURSE_TEMPLATE_DOWNLOAD', {
      timestamp: new Date()
    })

  } catch (error) {
    console.error('模板下载失败:', error)
    throw new BusinessError('模板下载失败', 500, 'TEMPLATE_ERROR')
  }
}))

/**
 * 批量导入课程
 * POST /api/courses/batch-import
 */
router.post('/batch-import', authMiddleware, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BusinessError('请选择要导入的文件', 400, 'FILE_REQUIRED')
  }

  const filePath = req.file.path
  let importResults: any[] = []
  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  try {
    // 读取Excel或CSV文件
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet)

    console.log('导入数据:', rawData)

    // 验证和处理每一行数据
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any
      const rowNum = i + 2 // Excel行号（从2开始，因为第1行是标题）

      try {
        // 数据验证
        if (!row['课程名称']) {
          errors.push(`第${rowNum}行：课程名称不能为空`)
          errorCount++
          continue
        }

        if (!row['院系']) {
          errors.push(`第${rowNum}行：院系不能为空`)
          errorCount++
          continue
        }

        // 🔧 修复：验证容量字段
        if (row['容量'] && isNaN(parseInt(row['容量']))) {
          errors.push(`第${rowNum}行：容量必须是有效数字`)
          errorCount++
          continue
        }

        // 🔧 修复：处理时间字段，使用新的字段名称
        let timeSlots: any[] = []
        if (row['上课时间']) {
          timeSlots = parseTimeSlots(row['上课时间'])
          // 验证解析结果
          if (!Array.isArray(timeSlots)) {
            errors.push(`第${rowNum}行：上课时间解析失败，请检查格式`)
            errorCount++
            continue
          }
          
          // 验证每个时间段的完整性
          for (const slot of timeSlots) {
            if (!slot.dayOfWeek || !slot.startTime || !slot.endTime || !slot.period) {
              errors.push(`第${rowNum}行：上课时间格式不完整，请检查格式`)
              errorCount++
              continue
            }
          }
        }

        // 🔧 修复：解析年龄限制
        const parseAgeRestriction = (ageStr: string) => {
          if (!ageStr || ageStr === '无限制') return { minAge: null, maxAge: null }
          
          const match = ageStr.match(/(\d+)-(\d+)岁/)
          if (match) {
            return { minAge: parseInt(match[1]), maxAge: parseInt(match[2]) }
          }
          return { minAge: null, maxAge: null }
        }

        // 🔧 修复：解析状态字段
        const parseStatus = (statusStr: string) => {
          switch(statusStr) {
            case '已发布': return 'PUBLISHED'
            case '草稿': return 'DRAFT'
            case '已下架': return 'ARCHIVED'
            default: return 'PUBLISHED'
          }
        }

        // 🔧 修复：构建课程数据 - 使用新的字段映射
        const { minAge, maxAge } = parseAgeRestriction(row['年龄限制'] || '')
        
        const courseData: any = {
          name: row['课程名称'],
          description: row['课程描述'] || '',
          category: row['院系'],
          level: row['年级/类型'] || '一年级',
          duration: 40, // 默认课时
          maxStudents: parseInt(row['容量']) || 30,
          semester: row['学期'] || '2024年秋季',
          location: row['地点'] || '',
          requiresGrades: row['年级/类型'] !== '不分年级',
          ageDescription: row['年龄限制'] || '',
          status: parseStatus(row['状态'] || '已发布'),
          timeSlots, // 使用验证过的时间段数组
          tags: [],
          keywords: [],
          isActive: true,
          createdBy: (req as any).user?.id || 'admin'
        }

        // 🔧 修复：设置年龄限制字段和标志
        if (minAge !== null) courseData.minAge = minAge
        if (maxAge !== null) courseData.maxAge = maxAge
        // 自动设置hasAgeRestriction标志
        courseData.hasAgeRestriction = !!(minAge !== null || maxAge !== null || courseData.ageDescription)

        // 添加调试日志
        console.log(`第${rowNum}行 - 课程"${courseData.name}"的timeSlots:`, JSON.stringify(timeSlots, null, 2))

        // 检查课程名称和学期是否已存在
        const existingCourse = await prisma.course.findFirst({
          where: { 
            name: courseData.name,
            semester: courseData.semester,
            isActive: true 
          }
        })

        if (existingCourse) {
          errors.push(`第${rowNum}行：课程"${courseData.name}"在学期"${courseData.semester}"已存在`)
          errorCount++
          continue
        }

        // 创建课程
        const createdCourse = await prisma.course.create({
          data: courseData
        })

        importResults.push({
          rowNum,
          courseName: courseData.name,
          success: true,
          courseId: createdCourse.id
        })
        successCount++

      } catch (rowError) {
        console.error(`第${rowNum}行处理失败:`, rowError)
        errors.push(`第${rowNum}行：${rowError instanceof Error ? rowError.message : '未知错误'}`)
        errorCount++
      }
    }

    // 记录操作日志
    businessLogger.userAction((req as any).user?.id, 'COURSE_BATCH_IMPORT', {
      fileName: req.file.originalname,
      totalRows: rawData.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // 只记录前10个错误
    })

    res.json({
      code: 200,
      message: '批量导入完成',
      data: {
        totalRows: rawData.length,
        successCount,
        errorCount,
        errors,
        results: importResults
      }
    })

  } catch (error) {
    console.error('批量导入失败:', error)
    throw new BusinessError('文件解析失败，请检查文件格式', 400, 'IMPORT_ERROR')
  } finally {
    // 清理临时文件
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (cleanupError) {
      console.error('清理临时文件失败:', cleanupError)
    }
  }
}))

/**
 * 获取课程详情
 * GET /api/courses/:id
 */
router.get('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                realName: true,
                specialties: true,
                experience: true
              }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                contactPhone: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            realName: true
          }
        }
      }
    })

    if (!course || !course.isActive) {
      throw new BusinessError('课程不存在', 404, 'COURSE_NOT_FOUND')
    }

    // 转换数据格式
    const formattedCourse = {
      id: course.id,
      courseCode: course.courseCode,
      name: course.name,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      maxStudents: course.maxStudents,
      price: Number(course.price),
      hasAgeRestriction: course.hasAgeRestriction,
      // 年级管理字段
      requiresGrades: course.requiresGrades,
      gradeDescription: course.gradeDescription,
      minAge: course.minAge,
      maxAge: course.maxAge,
      ageDescription: course.ageDescription,
      tags: course.tags,
      timeSlots: course.timeSlots,
      status: course.status,
      enrolled: course.enrollments.filter(e => e.status === 'PENDING' || e.status === 'APPROVED').length,
      capacity: course.maxStudents,
      teachers: course.teachers.map(ct => ({
        id: ct.teacher.id,
        name: ct.teacher.realName,
        isMain: ct.isMain,
        specialties: ct.teacher.specialties,
        experience: ct.teacher.experience
      })),
      students: course.enrollments
        .filter(enrollment => enrollment.status === 'APPROVED')
        .map(enrollment => ({
          id: enrollment.student.id,
          name: enrollment.student.name,
          phone: enrollment.student.contactPhone,
          enrollmentDate: enrollment.enrollmentDate
        })),
      creator: course.creator,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'COURSE_DETAIL_QUERY', {
      courseId: id,
      courseName: course.name
    })

    res.json({
      code: 200,
      message: '课程详情查询成功',
      data: formattedCourse
    })
  } catch (error) {
    if (error instanceof BusinessError) {
      throw error
    }
    console.error('查询课程详情失败:', error)
    throw new BusinessError('查询课程详情失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 创建课程
 * POST /api/courses
 */
router.post('/', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  // TODO: 添加参数验证schema
  const {
    courseCode,
    name,
    description,
    category,
    level,
    duration,
    maxStudents,
    price,
    hasAgeRestriction,
    minAge,
    maxAge,
    ageDescription,
    tags,
    timeSlots,
    teacherIds,
    // 🔥 新增字段支持
    teacher,
    location,
    semester,
    status,
    // 年级管理配置
    requiresGrades,
    gradeDescription
  } = req.body

  try {
    // 检查课程编号是否已存在
    const existingCourse = await prisma.course.findUnique({
      where: { courseCode }
    })

    if (existingCourse) {
      throw new BusinessError('课程编号已存在', 400, 'COURSE_CODE_EXISTS')
    }

    // 验证timeSlots格式
    let validatedTimeSlots = []
    if (timeSlots) {
      if (!Array.isArray(timeSlots)) {
        throw new BusinessError('timeSlots必须是数组格式', 400, 'INVALID_TIME_SLOTS_FORMAT')
      }
      
      for (const slot of timeSlots) {
        if (!slot.dayOfWeek || !slot.startTime || !slot.endTime || !slot.period) {
          throw new BusinessError('timeSlots格式不正确，每个时间段必须包含dayOfWeek、startTime、endTime、period字段', 400, 'INVALID_TIME_SLOT_FORMAT')
        }
      }
      validatedTimeSlots = timeSlots
    }

    // 创建课程
    const course = await prisma.course.create({
      data: {
        courseCode,
        name,
        description,
        category,
        level,
        duration,
        maxStudents,
        price,
        // 🔧 修复：自动计算是否有年龄限制
        hasAgeRestriction: !!(minAge || maxAge || ageDescription),
        minAge,
        maxAge,
        ageDescription,
        tags: tags || [],
        timeSlots: validatedTimeSlots,
        // 🔥 新增字段支持
        teacher,
        location,
        semester,
        status: status || 'DRAFT',
        // 年级管理配置
        requiresGrades: requiresGrades !== undefined ? requiresGrades : true,
        gradeDescription,
        createdBy: req.user!.id
      }
    })

    // 如果指定了教师，添加课程教师关联
    if (teacherIds && teacherIds.length > 0) {
      await prisma.courseTeacher.createMany({
        data: teacherIds.map((teacherId: string, index: number) => ({
          courseId: course.id,
          teacherId,
          isMain: index === 0 // 第一个为主讲教师
        }))
      })
    }

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'COURSE_CREATE', {
      courseId: course.id,
      courseName: name
    })

    res.json({
      code: 200,
      message: '课程创建成功',
      data: {
        id: course.id,
        courseCode: course.courseCode,
        name: course.name
      }
    })
  } catch (error) {
    if (error instanceof BusinessError) {
      throw error
    }
    console.error('创建课程失败:', error)
    throw new BusinessError('创建课程失败', 500, 'CREATE_ERROR')
  }
}))

/**
 * 更新课程信息
 * PUT /api/courses/:id
 */
router.put('/:id', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    name,
    description,
    category,
    level,
    duration,
    maxStudents,
    price,
    hasAgeRestriction,
    minAge,
    maxAge,
    ageDescription,
    tags,
    timeSlots,
    status,
    // 🔥 新增字段支持
    teacher,
    location,
    semester,
    // 年级管理配置
    requiresGrades,
    gradeDescription
  } = req.body

  try {
    // 检查课程是否存在
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    })

    if (!existingCourse || !existingCourse.isActive) {
      throw new BusinessError('课程不存在', 404, 'COURSE_NOT_FOUND')
    }

    // 验证timeSlots格式
    let validatedTimeSlots = timeSlots
    if (timeSlots !== undefined) {
      if (timeSlots !== null && !Array.isArray(timeSlots)) {
        throw new BusinessError('timeSlots必须是数组格式', 400, 'INVALID_TIME_SLOTS_FORMAT')
      }
      
      if (Array.isArray(timeSlots)) {
        for (const slot of timeSlots) {
          if (!slot.dayOfWeek || !slot.startTime || !slot.endTime || !slot.period) {
            throw new BusinessError('timeSlots格式不正确，每个时间段必须包含dayOfWeek、startTime、endTime、period字段', 400, 'INVALID_TIME_SLOT_FORMAT')
          }
        }
      }
    }

    // 更新课程信息
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name,
        description,
        category,
        level,
        duration,
        maxStudents,
        price,
        // 🔧 修复：自动计算是否有年龄限制
        hasAgeRestriction: !!(minAge || maxAge || ageDescription),
        minAge,
        maxAge,
        ageDescription,
        tags,
        timeSlots: validatedTimeSlots,
        // 🔥 新增字段支持
        teacher,
        location,
        semester,
        status,
        // 年级管理配置
        requiresGrades: requiresGrades !== undefined ? requiresGrades : undefined,
        gradeDescription
      }
    })

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'COURSE_UPDATE', {
      courseId: id,
      courseName: updatedCourse.name
    })

    res.json({
      code: 200,
      message: '课程信息更新成功',
      data: {
        id: updatedCourse.id,
        name: updatedCourse.name,
        updatedAt: updatedCourse.updatedAt
      }
    })
  } catch (error) {
    if (error instanceof BusinessError) {
      throw error
    }
    console.error('更新课程信息失败:', error)
    throw new BusinessError('更新课程信息失败', 500, 'UPDATE_ERROR')
  }
}))

/**
 * 🔧 新增：批量删除课程
 * DELETE /api/courses/batch
 */
router.delete('/batch', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { courseIds }: { courseIds: string[] } = req.body

  if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
    throw new BusinessError('课程ID列表不能为空', 400, 'INVALID_INPUT')
  }

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      const deletedCourses: string[] = []
      const failedCourses: Array<{ id: string, name: string, reason: string }> = []

      for (const courseId of courseIds) {
        try {
          // 检查课程是否存在
          const course = await tx.course.findUnique({
            where: { id: courseId },
            include: {
              enrollments: {
                where: {
                  status: { in: ['PENDING', 'APPROVED'] }
                }
              }
            }
          })

          if (!course || !course.isActive) {
            failedCourses.push({ id: courseId, name: course?.name || '未知', reason: '课程不存在或已删除' })
            continue
          }

          // 检查是否有学生已报名
          if (course.enrollments.length > 0) {
            failedCourses.push({ id: courseId, name: course.name, reason: '课程已有学生报名' })
            continue
          }

          // 软删除课程（标记为不活跃）
          await tx.course.update({
            where: { id: courseId },
            data: {
              isActive: false
            }
          })

          deletedCourses.push(courseId)

          // 记录操作日志
          businessLogger.userAction(req.user!.id, 'COURSE_BATCH_DELETE', {
            courseId: courseId,
            courseName: course.name
          })
        } catch (error) {
          console.error(`删除课程 ${courseId} 失败:`, error)
          failedCourses.push({ id: courseId, name: '未知', reason: '删除操作失败' })
        }
      }

      return { deletedCourses, failedCourses }
    })

    // 返回结果
    const responseMessage = result.deletedCourses.length > 0 
      ? `成功删除${result.deletedCourses.length}门课程`
      : '没有课程被删除'

    res.json({
      code: 200,
      message: responseMessage,
      data: {
        deletedCount: result.deletedCourses.length,
        failedCount: result.failedCourses.length,
        deletedCourses: result.deletedCourses,
        failedCourses: result.failedCourses
      }
    })
  } catch (error) {
    console.error('批量删除课程失败:', error)
    throw new BusinessError('批量删除课程失败', 500, 'BATCH_DELETE_FAILED')
  }
}))

/**
 * 删除课程
 * DELETE /api/courses/:id
 */
router.delete('/:id', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] }
          }
        }
      }
    })

    if (!course || !course.isActive) {
      throw new BusinessError('课程不存在', 404, 'COURSE_NOT_FOUND')
    }

    // 检查是否有学生已报名
    if (course.enrollments.length > 0) {
      throw new BusinessError('课程已有学生报名，无法删除', 400, 'COURSE_HAS_ENROLLMENTS')
    }

    // 软删除课程（标记为不活跃）
    await prisma.course.update({
      where: { id },
      data: {
        isActive: false
      }
    })

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'COURSE_DELETE', {
      courseId: id,
      courseName: course.name
    })

    res.json({
      code: 200,
      message: '课程删除成功'
    })
  } catch (error) {
    if (error instanceof BusinessError) {
      throw error
    }
    console.error('删除课程失败:', error)
    throw new BusinessError('删除课程失败', 500, 'DELETE_ERROR')
  }
}))

export default router

