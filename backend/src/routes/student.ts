/**
 * 学生管理路由
 * @description 处理学生档案相关的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { requireTeacher, authMiddleware } from '@/middleware/auth'
import { businessLogger } from '@/utils/logger'
import { generateStudentCode } from '../utils/studentCodeGenerator'
import {
  recordStudentAcademicEvent,
  STUDENT_ACADEMIC_EVENT_TYPES
} from '@/services/studentAcademicEventService'
import {
  assertStudentCanEnrollCoursesByHistoricalMajor
} from '@/services/enrollmentApplicationService'

const router = Router()

/**
 * 获取学生列表
 * GET /api/students
 */
router.get('/', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, keyword, status, major, politicalStatus, sortField = 'createdAt', sortOrder = 'desc' } = req.query

  console.log('📋 学生列表查询参数:', { page, pageSize, keyword, status, major, politicalStatus, sortField, sortOrder })

  // 参数验证
  const pageNum = parseInt(page as string) || 1
  const pageSizeNum = parseInt(pageSize as string) || 10

  if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
    throw new BusinessError('分页参数无效', 400, 'INVALID_PAGINATION')
  }

  // 构建排序条件
  const buildOrderBy = () => {
    const field = sortField as string
    const order = sortOrder as string

    // 支持的排序字段映射
    const sortFieldMap: Record<string, any> = {
      'createdAt': { createdAt: order },
      'name': { name: order },
      'enrollmentDate': { createdAt: order }, // 使用学生创建时间作为默认排序
      'firstEnrollmentDate': { createdAt: order } // 同上
    }

    return sortFieldMap[field] || { createdAt: 'desc' }
  }

  const orderBy = buildOrderBy()

  // 构建查询条件
  const where: any = {
    isActive: true
  }

  // 构建enrollment筛选条件
  const enrollmentWhere: any = {}

  // 状态筛选（基于报名状态）
  if (status && typeof status === 'string') {
    enrollmentWhere.status = status.toUpperCase()
  } else {
    // 默认只显示审核通过的课程报名
    enrollmentWhere.status = 'APPROVED'
  }

  // 专业筛选 (基于课程分类)
  if (major && typeof major === 'string') {
    where.major = major
    enrollmentWhere.course = {
      category: major,
      isActive: true
    }
  }

  // 🔧 修复：学期筛选支持双重条件（学生学期 OR 课程学期）
  if (req.query.semester && typeof req.query.semester === 'string') {
    const targetSemester = req.query.semester

    // 如果没有其他特定的enrollment筛选条件，使用学生学期作为主要筛选
    if (!status && !major && !req.query.courseId) {
      // 优先按学生的学期字段筛选
      where.semester = targetSemester
    } else {
      // 🔧 修复组合筛选：在enrollment筛选基础上，增加学期OR条件
      // 先按课程学期筛选（原逻辑）
      if (!enrollmentWhere.course) {
        enrollmentWhere.course = { isActive: true }
      }
      enrollmentWhere.course.semester = targetSemester

      console.log('🔧 组合筛选，课程学期筛选:', targetSemester)
    }
  }

  // 课程筛选 (基于课程ID)
  if (req.query.courseId && typeof req.query.courseId === 'string') {
    if (!enrollmentWhere.course) {
      enrollmentWhere.course = { isActive: true }
    }
    enrollmentWhere.course.id = req.query.courseId
  }

  // 年级筛选 (基于学生年级，特殊处理"不分年级")
  if (req.query.currentGrade && typeof req.query.currentGrade === 'string') {
    if (req.query.currentGrade === '不分年级') {
      where.currentGrade = null
    } else {
      where.currentGrade = req.query.currentGrade
    }
  }

  // 确保course过滤条件存在isActive检查
  if (enrollmentWhere.course && !enrollmentWhere.course.isActive) {
    enrollmentWhere.course.isActive = true
  } else if (!enrollmentWhere.course) {
    enrollmentWhere.course = { isActive: true }
  }

  // 🔧 修复：只有当有报名级别的筛选条件时才限制必须有报名记录
  // 注意：政治面貌和院系是学生级别的筛选，不需要报名记录
  const hasEnrollmentFilters = status || req.query.semester || req.query.courseId

  if (hasEnrollmentFilters) {
    // 有报名级别筛选条件时，只显示符合条件的报名记录的学生
    where.enrollments = {
      some: enrollmentWhere
    }

    // 🔧 特殊处理：当同时有学期筛选和状态筛选时，优先按学生学期筛选，状态单独筛选
    if (req.query.semester && typeof req.query.semester === 'string' && status) {
      const targetSemester = req.query.semester

      // 学生学期筛选 + enrollment状态筛选（不限制课程学期）
      where.semester = targetSemester

      // 重新构建enrollment条件，移除课程学期限制
      const statusEnrollmentWhere: any = {
        status: (status as string).toUpperCase()
      }

      // 保留其他条件但移除semester
      if (major) {
        statusEnrollmentWhere.course = {
          category: major,
          isActive: true
        }
      } else {
        statusEnrollmentWhere.course = { isActive: true }
      }

      if (req.query.courseId) {
        statusEnrollmentWhere.course.id = req.query.courseId
      }

      where.enrollments = {
        some: statusEnrollmentWhere
      }

      console.log('🔧 学期+状态组合筛选:', {
        studentSemester: targetSemester,
        enrollmentStatus: status,
        enrollmentCondition: statusEnrollmentWhere
      })
    }
  }
  // 没有具体筛选条件时，显示所有学生（不管是否有报名记录）

  // 政治面貌筛选 - 学生级别的筛选条件
  if (politicalStatus && typeof politicalStatus === 'string') {
    console.log('🔍 politicalStatus 类型:', typeof politicalStatus, '值:', politicalStatus)
    where.politicalStatus = politicalStatus
    console.log('✅ 添加政治面貌筛选条件:', politicalStatus)
  }

  // 关键词搜索
  if (keyword && typeof keyword === 'string') {
    const keywordSearch = [
      {
        name: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      },
      {
        studentCode: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      },
      {
        contactPhone: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      },
      {
        idNumber: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      }
    ]

    // 🔧 修复：如果已经有OR条件，需要合并而不是覆盖
    if (where.OR) {
      // 将现有OR条件与关键词搜索结合：(现有OR条件) AND (关键词OR条件)
      where.AND = [
        { OR: where.OR },
        { OR: keywordSearch }
      ]
      delete where.OR
    } else {
      where.OR = keywordSearch
    }
  }

  try {
    console.log('🔍 学生列表查询条件:', JSON.stringify(where, null, 2))
    console.log('📋 是否有报名筛选:', hasEnrollmentFilters)

      // 调试：打印最终查询条件
  console.log('🔍 最终学生列表查询条件 (传递给Prisma):', JSON.stringify(where, null, 2))

  // 并行查询列表和总数
  const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            where: hasEnrollmentFilters ? {
              status: status && typeof status === 'string' ? status.toUpperCase() as any : 'APPROVED'
            } : {
              // 默认只显示当前仍有效的报名记录，避免课程变更后旧课程继续出现在学生列表
              status: status && typeof status === 'string' ? status.toUpperCase() as any : { in: ['PENDING', 'APPROVED'] }
            },
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  category: true,
                  semester: true,
                  teacher: true,
                  location: true,
                  requiresGrades: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: orderBy,
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum
      }),
      prisma.student.count({ where })
    ])

    console.log(`📊 查询结果: 找到 ${students.length} 个学生, 总数 ${total}`)
    console.log('👥 学生列表:', students.map(s => ({ name: s.name, enrollmentsCount: s.enrollments.length, status: s.status })))

    // 为了获取准确的最早报名时间，我们需要查询每个学生的所有报名记录
    const studentIds = students.map(s => s.id)
    const allEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        // 仅按当前有效报名计算列表中的报名时间，避免旧课程影响排序和展示
        status: { in: ['PENDING', 'APPROVED'] }
      },
      select: {
        studentId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // 构建每个学生的最早报名时间映射
    const enrollmentTimeMap = new Map<string, Date>()
    allEnrollments.forEach(enrollment => {
      const studentId = enrollment.studentId
      const currentEarliest = enrollmentTimeMap.get(studentId)
      if (!currentEarliest || enrollment.createdAt < currentEarliest) {
        enrollmentTimeMap.set(studentId, enrollment.createdAt)
      }
    })

    // 格式化学生数据
    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      studentCode: student.studentCode,
      idNumber: student.idNumber, // 添加身份证号码字段
      email: '', // Student模型没有email字段
      contactPhone: student.contactPhone,
      phone: student.contactPhone, // 兼容字段
      photo: student.photo || '/default-avatar.png', // 修正：使用photo而非avatar
      avatar: student.photo || '/default-avatar.png', // 兼容字段
      major: student.major || '未设置', // 修正：使用学生自己的major字段
      currentGrade: student.currentGrade || '未设置', // 修正：显示年级而非班级
      semester: student.semester || '未设置', // 修正：使用正确的学期字段
      enrollmentYear: student.enrollmentYear,
      enrollmentSemester: student.enrollmentSemester,
      graduationStatus: student.graduationStatus,
      graduationDate: student.graduationDate,
      academicStatus: student.academicStatus,
      politicalStatus: student.politicalStatus || '未设置', // 政治面貌
      status: student.enrollments.length > 0
        ? student.enrollments[0].status
        : (student.status === 'approved' ? 'APPROVED' : 'PENDING'), // 没有报名记录时使用学生档案状态
      enrollments: student.enrollments, // 添加完整的报名记录
      // 添加报名时间字段
      enrollmentDate: student.enrollments.length > 0
        ? student.enrollments[0].createdAt
        : student.createdAt, // 如果没有报名记录，使用学生创建时间
      firstEnrollmentDate: enrollmentTimeMap.get(student.id) || student.createdAt, // 使用映射中的最早报名时间
      age: student.age,
      gender: student.gender,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    }))

    // 如果按报名时间排序，需要在应用层进行排序
    if (sortField === 'enrollmentDate' || sortField === 'firstEnrollmentDate') {
      formattedStudents.sort((a, b) => {
        const dateA = new Date(a.firstEnrollmentDate).getTime()
        const dateB = new Date(b.firstEnrollmentDate).getTime()

        if (sortOrder === 'asc') {
          return dateA - dateB
        } else {
          return dateB - dateA
        }
      })
    }

    businessLogger.userAction((req as any).user?.id, 'STUDENT_LIST_QUERY', {
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      resultCount: formattedStudents.length,
      filters: { keyword, status, major, semester: req.query.semester }
    })

  res.json({
    code: 200,
    message: '学生列表查询成功',
    data: {
        list: formattedStudents,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    })
  } catch (error) {
    console.error('获取学生列表失败:', error)
    throw new BusinessError('获取学生列表失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取学生统计信息
 * GET /api/students/statistics
 */
router.get('/statistics', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // 并行查询各种统计数据
    const [
      totalStudents,
      approvedStudents,
      pendingStudents,
      rejectedStudents,
      newStudentsThisMonth
    ] = await Promise.all([
      // 总学生数（只统计有至少一门已通过课程的学生）
      prisma.student.count({
        where: {
          isActive: true,
          enrollments: {
            some: {
              status: 'APPROVED'
            }
          }
        }
      }),
      // 已通过报名的学生数（同总学生数）
      prisma.student.count({
        where: {
          isActive: true,
          enrollments: {
            some: {
              status: 'APPROVED'
            }
          }
        }
      }),
      // 待审核的学生数（只有待审核课程，没有已通过课程的学生）
      prisma.student.count({
        where: {
          isActive: true,
          enrollments: {
            some: {
              status: 'PENDING'
            },
            none: {
              status: 'APPROVED'
            }
          }
        }
      }),
      // 被拒绝的学生数（只有被拒绝课程，没有已通过或待审核课程的学生）
      prisma.student.count({
        where: {
          isActive: true,
          enrollments: {
            some: {
              status: 'REJECTED'
            },
            none: {
              status: { in: ['APPROVED', 'PENDING'] }
            }
          }
        }
      }),
      // 本月新增学生（有至少一门已通过课程的新增学生）
      prisma.student.count({
        where: {
          isActive: true,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          enrollments: {
            some: {
              status: 'APPROVED'
            }
          }
        }
      })
    ])

    businessLogger.userAction((req as any).user?.id, 'STUDENT_STATS_QUERY', {
      totalStudents,
      activeStudents: approvedStudents,
      inactiveStudents: pendingStudents,
      graduatedStudents: rejectedStudents,
      newStudentsThisMonth
    })

    res.json({
      code: 200,
      message: '学生统计查询成功',
      data: {
        totalStudents,
        activeStudents: approvedStudents,
        inactiveStudents: pendingStudents,
        graduatedStudents: rejectedStudents,
        newStudentsThisMonth
      }
    })
  } catch (error) {
    console.error('获取学生统计失败:', error)
    throw new BusinessError('获取学生统计失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取专业列表（基于课程分类）
 * GET /api/students/majors
 */
router.get('/majors', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 从Course表获取所有分类作为专业选项
    const categories = await prisma.course.findMany({
      where: {
        isActive: true
      },
      select: {
        category: true
      },
      distinct: ['category']
    })

    const majorList = categories
      .map(item => item.category)
      .filter(Boolean)
      .sort((a, b) => a!.localeCompare(b!, 'zh-CN'))

    res.json({
      code: 200,
      message: '获取专业列表成功',
      data: majorList
    })
  } catch (error) {
    console.error('获取专业列表失败:', error)
    throw new BusinessError('获取专业列表失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取政治面貌选项列表
 * GET /api/students/political-status
 */
router.get('/political-status', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 从Student表获取所有政治面貌选项
    const politicalStatusList = await prisma.student.findMany({
      where: {
        isActive: true,
        politicalStatus: {
          not: null,
          notIn: ['', '未设置']
        }
      },
      select: {
        politicalStatus: true
      },
      distinct: ['politicalStatus']
    })

    const statusOptions = politicalStatusList
      .map(item => item.politicalStatus)
      .filter(Boolean)
      .sort((a, b) => a!.localeCompare(b!, 'zh-CN'))

    console.log('✅ 获取政治面貌选项成功:', statusOptions)

    res.json({
      code: 200,
      message: '获取政治面貌选项成功',
      data: statusOptions
    })
  } catch (error) {
    console.error('获取政治面貌选项失败:', error)
    throw new BusinessError('获取政治面貌选项失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取学期列表（基于课程学期）
 * GET /api/students/semesters
 */
router.get('/semesters', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 从Course表获取所有学期选项
    const semesters = await prisma.course.findMany({
      where: {
        isActive: true
      },
      select: {
        semester: true
      },
      distinct: ['semester']
    })

    const semesterList = semesters
      .map(item => item.semester)
      .filter(Boolean)
      .sort((a, b) => a!.localeCompare(b!, 'zh-CN'))

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
 * 创建新学生
 * POST /api/students
 */
router.post('/', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const studentData = req.body

  console.log('📝 收到创建学生请求:', {
    fields: Object.keys(studentData || {}),
    selectedCoursesCount: Array.isArray(studentData.selectedCourses) ? studentData.selectedCourses.length : 0
  })

  try {
    // 数据验证
    if (!studentData.name || !studentData.contactPhone || !studentData.idNumber) {
      throw new ValidationError('姓名、联系电话和身份证号为必填项')
    }

    // 检查身份证号是否已存在
    const existingStudent = await prisma.student.findFirst({
      where: {
        idNumber: studentData.idNumber,
        isActive: true
      }
    })

    if (existingStudent) {
      throw new ValidationError(`身份证号 ${studentData.idNumber} 已被使用`)
    }

    // 检查手机号是否已存在
    const existingPhone = await prisma.student.findFirst({
      where: {
        contactPhone: studentData.contactPhone,
        isActive: true
      }
    })

    if (existingPhone) {
      throw new ValidationError(`手机号 ${studentData.contactPhone} 已被使用`)
    }

    // 🔧 生成学生编号，使用新的按学期编号系统
    const studentCode = await generateStudentCode(studentData.semester)

    // 计算年龄
    const age = studentData.birthDate ?
      Math.floor((Date.now() - new Date(studentData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) :
      0

    // 使用事务处理学生创建和课程注册
    const result = await prisma.$transaction(async (tx) => {
      // 准备学生数据
      const newStudentData = {
        name: studentData.name,
        contactPhone: studentData.contactPhone,
        idNumber: studentData.idNumber,
        currentAddress: studentData.currentAddress || '',
        emergencyContact: studentData.emergencyContact || '',
        emergencyPhone: studentData.emergencyPhone || '',
        emergencyRelation: studentData.emergencyRelation || '紧急联系人',
        // 身份证件
        idCardFront: studentData.idCardFront || '',
        idCardBack: studentData.idCardBack || '',
        idCardAddress: studentData.idCardAddress || '',
        // 基本信息
        gender: (studentData.gender === '男' || studentData.gender === 'MALE') ? 'MALE' as const : 'FEMALE' as const,
        birthDate: studentData.birthDate ? new Date(studentData.birthDate) : new Date(),
        birthday: studentData.birthDate ? new Date(studentData.birthDate) : new Date(),
        age: age,
        ethnicity: studentData.ethnicity || '',
        educationLevel: studentData.educationLevel || '',
        politicalStatus: studentData.politicalStatus || '',
        healthStatus: studentData.healthStatus || '',
        // 保险信息
        insuranceCompany: studentData.insuranceCompany || '',
        retirementCategory: studentData.retirementCategory || '',
        studyPeriodStart: studentData.studyPeriodStart ? new Date(studentData.studyPeriodStart) : null,
        studyPeriodEnd: studentData.studyPeriodEnd ? new Date(studentData.studyPeriodEnd) : null,
        // 家庭信息
        familyAddress: studentData.familyAddress || '',
        familyPhone: studentData.familyPhone || '',
        // 学籍信息
        major: studentData.major || '',
        semester: studentData.semester || `${new Date().getFullYear()}年秋季`, // 默认当前学年秋季
        currentGrade: '一年级', // 新学生默认为一年级
        enrollmentYear: new Date().getFullYear(),
        enrollmentSemester: studentData.semester || `${new Date().getFullYear()}年秋季`,
        graduationStatus: 'IN_PROGRESS',
        academicStatus: 'ACTIVE',
        // 状态信息
        status: studentData.status || 'approved', // 添加学生默认为已审核
        isActive: true,
        studentCode: studentCode,
        createdBy: (req as any).user?.id || 'admin'
      }

      // 1. 创建学生记录
      const student = await tx.student.create({
        data: newStudentData
      })

      // 2. 处理课程选择
      const enrolledCourses = []
      const enrolledCourseNames = []

      if (studentData.selectedCourses && Array.isArray(studentData.selectedCourses) && studentData.selectedCourses.length > 0) {
        console.log('📚 开始处理选课:', studentData.selectedCourses)
        await assertStudentCanEnrollCoursesByHistoricalMajor(tx, student.id, student.semester, studentData.selectedCourses)

        for (const courseId of studentData.selectedCourses) {
          // 检查课程是否存在且有容量
          const targetCourse = await tx.course.findUnique({
            where: { id: courseId, isActive: true },
            include: {
              enrollments: {
                where: { status: { in: ['PENDING', 'APPROVED'] } },
                select: { id: true }
              }
            }
          })

          if (!targetCourse) {
            console.log(`⚠️ 课程 ${courseId} 不存在，跳过`)
            continue
          }

          // 🔧 新增：检查学期一致性
          if (student.semester && targetCourse.semester && student.semester !== targetCourse.semester) {
            console.log(`⚠️ 课程 ${targetCourse.name} 的学期 (${targetCourse.semester}) 与学生学期 (${student.semester}) 不匹配，跳过`)
            continue
          }

          // 检查课程容量
          if (targetCourse.enrollments.length >= targetCourse.maxStudents) {
            console.log(`⚠️ 课程 ${targetCourse.name} 已满员，跳过`)
            continue
          }

          // 创建报名记录
          const enrollment = await tx.enrollment.create({
            data: {
              studentId: student.id,
              courseId: courseId,
              enrollmentDate: new Date(),
              status: 'APPROVED', // 直接添加的学生课程默认为已批准
              createdBy: (req as any).user?.id || 'admin',
              enrollmentCode: `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              // 保险信息（如果有）
              insuranceStart: studentData.studyPeriodStart ? new Date(studentData.studyPeriodStart) : new Date(),
              insuranceEnd: studentData.studyPeriodEnd ? new Date(studentData.studyPeriodEnd) : null
            }
          })

          enrolledCourses.push(enrollment)
          enrolledCourseNames.push(targetCourse.name)
          console.log(`✅ 成功为学生添加课程: ${targetCourse.name}`)
        }
      }

      return {
        student,
        enrolledCourses,
        enrolledCourseNames,
        enrolledCount: enrolledCourses.length
      }
    })

    // 记录操作日志
    businessLogger.userAction((req as any).user!.id, 'STUDENT_CREATE_WITH_COURSES', {
      studentId: result.student.id,
      studentName: result.student.name,
      idNumber: result.student.idNumber,
      contactPhone: result.student.contactPhone,
      enrolledCourses: result.enrolledCourseNames,
      enrolledCount: result.enrolledCount,
      action: 'manual_add'
    })

    console.log(`✅ 成功创建学生: ${result.student.name} (${result.student.id})`)
    if (result.enrolledCount > 0) {
      console.log(`✅ 同时注册了 ${result.enrolledCount} 门课程: ${result.enrolledCourseNames.join(', ')}`)
    }

    const successMessage = result.enrolledCount > 0
      ? `学生 ${result.student.name} 添加成功，已注册 ${result.enrolledCount} 门课程`
      : `学生 ${result.student.name} 添加成功`

  res.status(201).json({
    code: 201,
      message: successMessage,
      data: {
        student: result.student,
        enrolledCourses: result.enrolledCourseNames.map((name, index) => ({
          id: result.enrolledCourses[index]?.courseId || '',
          name: name
        })),
        enrolledCount: result.enrolledCount
      }
    })

  } catch (error) {
    console.error('创建学生失败:', error)

    if (error instanceof ValidationError) {
      throw error
    }

    throw new BusinessError('创建学生失败', 500, 'CREATE_ERROR')
  }
}))

/**
 * 🔧 导出学生数据 - 必须放在动态路由之前
 * GET /api/students/export
 */
router.get('/export', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  console.log('🔄 开始导出学生数据...')

  const { keyword, major, semester, status, courseId, politicalStatus } = req.query

  // 构建查询条件（复用现有的筛选逻辑）
  const where: any = {
    isActive: true
  }

  // 构建enrollment筛选条件
  const enrollmentWhere: any = {}

  // 状态筛选
  if (status && typeof status === 'string') {
    enrollmentWhere.status = status.toUpperCase()
  }

  // 课程筛选
  if (courseId && typeof courseId === 'string') {
    enrollmentWhere.courseId = courseId
  }

  // 院系筛选
  if (major && typeof major === 'string') {
    where.major = major
  }

  // 政治面貌筛选 - 简单直接的实现
  if (politicalStatus && typeof politicalStatus === 'string') {
    where.politicalStatus = politicalStatus
    console.log('✅ 添加政治面貌筛选:', politicalStatus)
  }

  // 🔧 学期筛选支持双重条件（学生学期 OR 课程学期）
  if (req.query.semester && typeof req.query.semester === 'string') {
    const targetSemester = req.query.semester
    console.log('🔍 学期筛选条件判断:', {
      status: !!status,
      major: !!major,
      politicalStatus: !!politicalStatus,
      courseId: !!req.query.courseId,
      '简单路径条件': !status && !major && !politicalStatus && !req.query.courseId
    })

    // 如果没有其他特定的enrollment筛选条件，使用学生学期作为主要筛选
    if (!status && !major && !politicalStatus && !req.query.courseId) {
      console.log('✅ 走简单学期筛选路径')
      // 优先按学生的学期字段筛选
      where.semester = targetSemester
    } else {
      console.log('✅ 走复杂学期筛选路径（OR条件）')
      // 🔧 修复组合筛选：同时支持学生学期和课程学期
      // 使用OR条件，满足以下任一条件即可：
      // 1. 学生本身的学期匹配
      // 2. 学生选的课程学期匹配
      // 注意：需要在每个OR分支中都包含其他筛选条件（如政治面貌）
      const baseConditions: any = {}
      if (major) baseConditions.major = major
      if (politicalStatus) baseConditions.politicalStatus = politicalStatus
      console.log('🔍 基础条件:', baseConditions)

      where.OR = [
        // 条件1：按学生学期筛选
        {
          semester: targetSemester,
          ...baseConditions
        },
        // 条件2：按课程学期筛选（需要有enrollment记录）
        {
          ...baseConditions,
          enrollments: {
            some: {
              ...enrollmentWhere,
              course: {
                ...enrollmentWhere.course,
                semester: targetSemester
              }
            }
          }
        }
      ]
      console.log('✅ 设置OR条件后:', JSON.stringify(where, null, 2))

      // 清除原来的enrollment筛选条件，因为已经合并到OR条件中
      // 但需要保持isActive的基础筛选
      const originalEnrollmentWhere = { ...enrollmentWhere }
      if (Object.keys(originalEnrollmentWhere).length > 0) {
        where.OR.forEach(condition => {
          if (condition.enrollments) {
            Object.assign(condition.enrollments.some, originalEnrollmentWhere)
          }
        })
      }

      // 清除已经应用到OR条件中的筛选条件，避免重复筛选
      if (major) delete where.major
      if (politicalStatus) delete where.politicalStatus
      console.log('✅ 清除重复条件后:', JSON.stringify(where, null, 2))
    }
  } else {
    // 没有学期筛选时，使用原来的enrollment条件
    // 区分学生级别筛选和报名级别筛选
    const hasEnrollmentFilters = status || req.query.courseId

    if (hasEnrollmentFilters) {
      // 有报名级别筛选条件时，只显示符合条件的报名记录的学生
      where.enrollments = {
        some: enrollmentWhere
      }
    }
    // 注意：政治面貌和院系筛选已经在前面直接应用到where对象上了
  }

  // 关键词搜索
  if (keyword && typeof keyword === 'string') {
    const keywordSearch = [
      {
        name: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      },
      {
        studentCode: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      },
      {
        contactPhone: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      },
      {
        idNumber: {
          contains: keyword.trim(),
          mode: 'insensitive'
        }
      }
    ]

    if (where.OR) {
      // 如果已有OR条件（学期筛选），则将关键词搜索与现有OR条件结合
      where.AND = [
        { OR: where.OR },
        { OR: keywordSearch }
      ]
      delete where.OR
    } else {
      where.OR = keywordSearch
    }
  }

  try {
    // 🔧 重构：查询所有报名记录，而不是学生记录
    // 这样可以确保每行代表一个具体的报名记录
    const enrollmentWhere: any = {
      student: {
        isActive: true
      },
      course: {
        isActive: true
      }
    }

    // 🔧 应用学生级别的筛选条件
    // 院系筛选
    if (major && typeof major === 'string') {
      enrollmentWhere.student.major = major
    }

    // 政治面貌筛选
    if (politicalStatus && typeof politicalStatus === 'string') {
      enrollmentWhere.student.politicalStatus = politicalStatus
      console.log('✅ 导出添加政治面貌筛选:', politicalStatus)
    }

    // 学期筛选 - 优先按学生学期，其次按课程学期
    if (req.query.semester && typeof req.query.semester === 'string') {
      const targetSemester = req.query.semester
      enrollmentWhere.OR = [
        { student: { semester: targetSemester } },
        { course: { semester: targetSemester } }
      ]
    }

    // 关键词搜索 - 应用到学生信息
    if (keyword && typeof keyword === 'string') {
      const keywordSearch = [
        { student: { name: { contains: keyword.trim(), mode: 'insensitive' } } },
        { student: { studentCode: { contains: keyword.trim(), mode: 'insensitive' } } },
        { student: { contactPhone: { contains: keyword.trim(), mode: 'insensitive' } } },
        { student: { idNumber: { contains: keyword.trim(), mode: 'insensitive' } } }
      ]

      if (enrollmentWhere.OR) {
        // 如果已有OR条件（学期筛选），则将关键词搜索与现有OR条件结合
        enrollmentWhere.AND = [
          { OR: enrollmentWhere.OR },
          { OR: keywordSearch }
        ]
        delete enrollmentWhere.OR
      } else {
        enrollmentWhere.OR = keywordSearch
      }
    }

    // 如果有状态筛选，应用到报名记录级别
    if (status && typeof status === 'string') {
      enrollmentWhere.status = status.toUpperCase()
    }

    // 如果有课程筛选
    if (courseId && typeof courseId === 'string') {
      enrollmentWhere.courseId = courseId
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: true,
        course: true
      },
      orderBy: [
        { student: { createdAt: 'desc' } },
        { createdAt: 'desc' }
      ]
    })

    console.log(`📊 查询到 ${enrollments.length} 个报名记录`)

    // 生成CSV数据 - 每行代表一个报名记录
    const csvHeaders = [
      '学员编号',
      '姓名',
      '性别',
      '身份证号',
      '联系电话',
      '紧急联系人',
      '紧急联系电话',
      '学期',
      '院系',
      '年级',
      '政治面貌',
      '报名课程',
      '课程学期',
      '报名状态',
      '报名时间'
    ]

    const csvRows = []
    csvRows.push(csvHeaders.join(','))

    for (const enrollment of enrollments) {
      const student = enrollment.student
      const course = enrollment.course

      if (!student || !course) continue // 跳过无效记录

      const genderMap = { 'MALE': '男', 'FEMALE': '女' }
      const gender = genderMap[student.gender as keyof typeof genderMap] || student.gender

      const statusMap = {
        'PENDING': '待审核',
        'APPROVED': '已通过',
        'REJECTED': '已拒绝',
        'CANCELLED': '已取消'
      }
      const enrollmentStatus = statusMap[enrollment.status as keyof typeof statusMap] || enrollment.status

      const row = [
        student.studentCode || '',
        student.name || '',
        gender,
        student.idNumber || '',
        student.contactPhone || '',
        student.emergencyContact || '未填写',
        student.emergencyPhone || '未填写',
        student.semester || '',
        student.major || '',
        student.currentGrade || '',
        student.politicalStatus || '未填写',
        course.name || '未知课程',
        course.semester || '',
        enrollmentStatus,
        enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleString('zh-CN') : ''
      ]

      csvRows.push(row.map(field => `"${field}"`).join(','))
    }

    const csvContent = '\uFEFF' + csvRows.join('\n') // 添加BOM以支持中文

    // 设置响应头
    const timestamp = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_')
    const filename = `学员数据导出_${timestamp}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)

    businessLogger.userAction(req.user!.id, 'STUDENT_DATA_EXPORT', {
      totalExported: enrollments.length,
      filters: { keyword, major, semester, status, courseId, politicalStatus }
    })

    console.log(`✅ 学生数据导出成功: ${enrollments.length} 条报名记录`)

    res.send(csvContent)

  } catch (error) {
    console.error('导出学生数据失败:', error)
    throw new BusinessError('导出学生数据失败', 500, 'EXPORT_ERROR')
  }
}))

/**
 * 获取学生详情
 * GET /api/students/:id
 */
router.get('/:id', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const student = await prisma.student.findUnique({
      where: { id, isActive: true },
      include: {
        enrollments: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] } // 只返回有效的报名记录
          },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                category: true,
                semester: true,
                teacher: true,
                location: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!student) {
      throw new BusinessError('学生不存在', 404, 'STUDENT_NOT_FOUND')
    }

    // 格式化学生详情数据，包含所有报名表信息
    const formattedStudent = {
      // 基本信息
      id: student.id,
      name: student.name,
      studentCode: student.studentCode,
      gender: student.gender,
      birthDate: student.birthday ? student.birthday.toISOString().split('T')[0] : null, // 使用 birthday 字段
      contactPhone: student.contactPhone,
      idNumber: student.idNumber,

      // 照片信息
      photo: student.photo,           // 个人头像
      idCardFront: student.idCardFront,  // 身份证正面
      idCardBack: student.idCardBack,    // 身份证反面

      // 保险信息
      insuranceCompany: student.insuranceCompany,
      retirementCategory: student.retirementCategory,
      studyPeriodStart: student.studyPeriodStart,
      studyPeriodEnd: student.studyPeriodEnd,

      // 联系信息
      currentAddress: student.currentAddress,
      emergencyContact: student.emergencyContact,
      emergencyPhone: student.emergencyPhone,

      // 🔧 修复：添加学期字段
      semester: student.semester,
      major: student.major,

      // 系统信息
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,

      // 报名信息
      enrollments: student.enrollments.map(enrollment => ({
        id: enrollment.id,
        status: enrollment.status,
        insuranceStart: enrollment.insuranceStart,
        insuranceEnd: enrollment.insuranceEnd,
        remarks: enrollment.remarks,
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
        course: enrollment.course
      }))
    }

    businessLogger.userAction((req as any).user?.id, 'STUDENT_DETAIL_QUERY', {
      studentId: id,
      studentName: student.name
    })

  res.json({
    code: 200,
    message: '学生详情查询成功',
      data: formattedStudent
    })
  } catch (error) {
    if (error instanceof BusinessError) {
      throw error
    }
    console.error('获取学生详情失败:', error)
    throw new BusinessError('获取学生详情失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 更新学生信息
 * PUT /api/students/:id
 */
router.put('/:id', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    name,
    contactPhone,
    currentAddress,
    emergencyContact,
    emergencyPhone,
    // 身份证件
    idCardFront,
    idCardBack,
    // 保险信息
    insuranceCompany,
    retirementCategory,
    studyPeriodStart,
    studyPeriodEnd,
    // 学籍信息
    semester,
    major
  } = req.body

  try {
    // 构建更新数据，只包含有值的字段
    const updateData: any = {
      updatedAt: new Date()
    }

    // 基本信息
    if (name) updateData.name = name
    if (contactPhone) updateData.contactPhone = contactPhone
    if (currentAddress !== undefined) updateData.currentAddress = currentAddress
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact
    if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone

    // 身份证件
    if (idCardFront !== undefined) updateData.idCardFront = idCardFront
    if (idCardBack !== undefined) updateData.idCardBack = idCardBack

    // 保险信息
    if (insuranceCompany !== undefined) updateData.insuranceCompany = insuranceCompany
    if (retirementCategory !== undefined) updateData.retirementCategory = retirementCategory
    if (studyPeriodStart !== undefined) {
      updateData.studyPeriodStart = studyPeriodStart ? new Date(studyPeriodStart) : null
    }
    if (studyPeriodEnd !== undefined) {
      updateData.studyPeriodEnd = studyPeriodEnd ? new Date(studyPeriodEnd) : null
    }

    // 学籍信息
    if (semester !== undefined) updateData.semester = semester
    if (major !== undefined) updateData.major = major

    console.log('📝 学生更新数据:', updateData)

    const updatedStudent = await prisma.$transaction(async (tx) => {
      const existingStudent = major !== undefined
        ? await tx.student.findFirst({
          where: { id, isActive: true },
          select: { id: true, major: true }
        })
        : null

      const result = await tx.student.update({
        where: { id, isActive: true },
        data: updateData
      })

      if (major !== undefined && existingStudent && existingStudent.major !== major) {
        await recordStudentAcademicEvent(tx, {
          studentId: id,
          eventType: STUDENT_ACADEMIC_EVENT_TYPES.MAJOR_CHANGE,
          fromValue: existingStudent.major,
          toValue: major,
          reason: 'Student major updated',
          operatorId: (req as any).user?.id,
          metadata: {
            route: 'students/update'
          }
        })
      }

      return result
    })

    businessLogger.userAction((req as any).user?.id, 'STUDENT_UPDATE', {
      studentId: id,
      studentName: name,
      updatedFields: Object.keys(req.body)
    })

  res.json({
    code: 200,
    message: '学生信息更新成功',
      data: updatedStudent
    })
  } catch (error) {
    console.error('更新学生信息失败:', error)
    throw new BusinessError('更新学生信息失败', 500, 'UPDATE_ERROR')
  }
}))

/**
 * 修改学生报名状态
 * PATCH /api/students/:id/status
 */
router.patch('/:id/status', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, enrollmentId } = req.body

  if (!['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
    throw new BusinessError('无效的报名状态', 400, 'INVALID_STATUS')
  }

  try {
    const student = await prisma.$transaction(async (tx) => {
      if (status === 'APPROVED') {
        if (enrollmentId) {
          const targetEnrollment = await tx.enrollment.findFirst({
            where: { id: enrollmentId, studentId: id },
            include: { student: true, course: true }
          })

          if (!targetEnrollment) {
            throw new BusinessError('报名记录不存在', 404, 'ENROLLMENT_NOT_FOUND')
          }

          if (targetEnrollment.status !== 'APPROVED') {
            await assertStudentCanEnrollCoursesByHistoricalMajor(
              tx,
              id,
              targetEnrollment.student?.semester || targetEnrollment.course?.semester,
              [targetEnrollment.courseId]
            )
          }
        } else {
          const targetEnrollments = await tx.enrollment.findMany({
            where: {
              studentId: id,
              status: { not: 'APPROVED' }
            },
            include: { student: true, course: true }
          })

          const courseIds = targetEnrollments.map(enrollment => enrollment.courseId)
          const semester = targetEnrollments.find(enrollment => enrollment.student?.semester)?.student?.semester ||
            targetEnrollments.find(enrollment => enrollment.course?.semester)?.course?.semester

          await assertStudentCanEnrollCoursesByHistoricalMajor(tx, id, semester, courseIds)
        }
      }

      // 如果提供了enrollmentId，更新特定的报名状态
      if (enrollmentId) {
        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            status,
            updatedAt: new Date()
          }
        })
      } else {
        // 否则更新该学生的所有活跃报名状态
        await tx.enrollment.updateMany({
          where: {
            studentId: id
          },
          data: {
            status,
            updatedAt: new Date()
          }
        })
      }

      return tx.student.findUnique({
        where: { id },
        include: {
          enrollments: {
            include: { course: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    })

    businessLogger.userAction((req as any).user?.id, 'STUDENT_ENROLLMENT_STATUS_CHANGE', {
      studentId: id,
      newStatus: status,
      enrollmentId,
      studentName: student?.name
    })

    res.json({
      code: 200,
      message: '学生报名状态修改成功',
      data: student
    })
  } catch (error) {
    console.error('修改学生报名状态失败:', error)
    if (error instanceof BusinessError) {
      throw error
    }
    throw new BusinessError('修改学生报名状态失败', 500, 'UPDATE_ERROR')
  }
}))

/**
 * 删除学生档案（软删除并级联处理相关数据）
 * DELETE /api/students/:id
 */
router.delete('/:id', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 检查学生是否存在且激活
      const existingStudent = await tx.student.findFirst({
        where: { id, isActive: true },
        include: {
          enrollments: {
            // 🔧 修复：包含所有状态的报名记录，包括被拒绝的
            include: {
              course: {
                select: { name: true }
              }
            }
          },
          attendances: true  // 包含所有考勤记录
        }
      })

      if (!existingStudent) {
        throw new BusinessError('学生不存在或已被删除', 404, 'STUDENT_NOT_FOUND')
      }

      // 记录要处理的相关数据数量
      const totalEnrollmentsCount = existingStudent.enrollments.length
      const attendancesCount = existingStudent.attendances.length

      // 按状态统计报名记录
      const enrollmentsByStatus = existingStudent.enrollments.reduce((acc: any, enrollment: any) => {
        acc[enrollment.status] = (acc[enrollment.status] || 0) + 1
        return acc
      }, {})

      console.log(`学生 ${existingStudent.name} 的报名记录统计:`, enrollmentsByStatus)

      // 1. 保留历史报名记录，仅取消活跃报名
      let cancelledEnrollmentsCount = 0
      if (totalEnrollmentsCount > 0) {
        const cancelResult = await tx.enrollment.updateMany({
          where: {
            studentId: id,
            status: { in: ['PENDING', 'APPROVED'] }
          },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: '学生档案删除，自动取消活跃报名',
            updatedAt: new Date()
          }
        })
        cancelledEnrollmentsCount = cancelResult.count
        console.log(`✅ 已取消学生 ${existingStudent.name} 的 ${cancelledEnrollmentsCount} 条活跃报名记录`)
      }

      // 2. 软删除相关的考勤记录（如果数据库支持软删除）
      // 注意：由于Attendance模型可能没有isActive字段，这里仅作记录
      // 实际删除操作取决于具体的业务需求
      console.log(`学生 ${existingStudent.name} 有 ${attendancesCount} 条考勤记录，已保留作为历史数据`)

      // 3. 软删除学生档案
      const deletedStudent = await tx.student.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })

      return {
        student: deletedStudent,
        deletedEnrollments: 0,
        cancelledEnrollments: cancelledEnrollmentsCount,
        enrollmentsByStatus,
        attendancesCount: attendancesCount
      }
    })

    // 记录操作日志
    businessLogger.userAction((req as any).user?.id, 'STUDENT_DELETE_CASCADE', {
      studentId: id,
      studentName: result.student.name,
      deletedEnrollments: result.deletedEnrollments,
      cancelledEnrollments: result.cancelledEnrollments,
      enrollmentsByStatus: result.enrollmentsByStatus,
      attendancesCount: result.attendancesCount,
      action: 'soft_delete_preserve_history'
    })

    res.json({
      code: 200,
      message: `学生档案删除成功${result.cancelledEnrollments > 0 ? `，同时取消了 ${result.cancelledEnrollments} 条活跃报名记录` : ''}${result.attendancesCount > 0 ? `，保留了 ${result.attendancesCount} 条考勤历史记录` : ''}`,
      data: {
        studentId: id,
        deletedEnrollments: result.deletedEnrollments,
        cancelledEnrollments: result.cancelledEnrollments,
        enrollmentsByStatus: result.enrollmentsByStatus,
        attendancesCount: result.attendancesCount
      }
    })
  } catch (error) {
    console.error('删除学生档案失败:', error)

    if (error instanceof BusinessError) {
      throw error
    }

    throw new BusinessError('删除学生档案失败', 500, 'DELETE_ERROR')
  }
}))

/**
 * 更新学生选课
 * PUT /api/students/:id/courses
 */
router.put('/:id/courses', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { selectedCourses } = req.body

  if (!Array.isArray(selectedCourses)) {
    throw new ValidationError('selectedCourses 必须是数组')
  }

  console.log(`🔄 开始更新学生 ${id} 的选课:`, selectedCourses)

  try {
    // 使用事务处理课程变更
    const result = await prisma.$transaction(async (tx) => {
      // 1. 获取学生当前的选课情况
      const student = await tx.student.findUnique({
        where: { id, isActive: true },
        include: {
          enrollments: {
            where: {
              status: { in: ['PENDING', 'APPROVED'] } // 只考虑有效的选课
            },
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  maxStudents: true
                }
              }
            }
          }
        }
      })

      if (!student) {
        throw new BusinessError('学生不存在或已被删除', 404, 'STUDENT_NOT_FOUND')
      }

      const currentCourseIds = student.enrollments.map(e => e.course.id)
      console.log('📚 学生当前选课:', currentCourseIds)
      console.log('📚 新的选课列表:', selectedCourses)

      // 2. 计算需要退选和新选的课程
      const coursesToRemove = currentCourseIds.filter(id => !selectedCourses.includes(id))
      const coursesToAdd = selectedCourses.filter(id => !currentCourseIds.includes(id))

      console.log('❌ 需要退选的课程:', coursesToRemove)
      console.log('✅ 需要新选的课程:', coursesToAdd)
      await assertStudentCanEnrollCoursesByHistoricalMajor(tx, id, student.semester, coursesToAdd)

      // 3. 处理退选课程
      if (coursesToRemove.length > 0) {
        await tx.enrollment.updateMany({
          where: {
            studentId: id,
            courseId: { in: coursesToRemove },
            status: { in: ['PENDING', 'APPROVED'] }
          },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: '学生选课变更，取消原课程',
            updatedAt: new Date()
          }
        })
        console.log(`🗑️ 已取消 ${coursesToRemove.length} 门课程的报名`)
      }

      // 4. 处理新选课程（检查容量）
      const newEnrollments = []
      const addedCourseNames = [] // 新增：保存成功添加的课程名称

      for (const courseId of coursesToAdd) {
        // 检查课程是否存在且有容量
        const targetCourse = await tx.course.findUnique({
          where: { id: courseId, isActive: true },
          include: {
            enrollments: {
              where: { status: { in: ['PENDING', 'APPROVED'] } },
              select: { id: true }
            }
          }
        })

        if (!targetCourse) {
          console.log(`⚠️ 课程 ${courseId} 不存在，跳过`)
          continue
        }

        // 🔧 新增：检查学期一致性
        if (student.semester && targetCourse.semester && student.semester !== targetCourse.semester) {
          console.log(`⚠️ 课程 ${targetCourse.name} 的学期 (${targetCourse.semester}) 与学生学期 (${student.semester}) 不匹配，跳过`)
          continue
        }

        // 检查课程容量
        if (targetCourse.enrollments.length >= targetCourse.maxStudents) {
          console.log(`⚠️ 课程 ${targetCourse.name} 已满员，跳过`)
          continue
        }

        // 🔧 修复：检查是否已存在该学生+课程的enrollment记录
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            studentId: id,
            courseId: courseId
          }
        })

        const skipHistoricalEnrollmentReuse = existingEnrollment && ['REJECTED', 'CANCELLED'].includes(existingEnrollment.status)
        if (skipHistoricalEnrollmentReuse) {
          console.log(`🕘 课程 ${targetCourse.name} 存在历史报名记录，保留历史状态并跳过直接复活`)
          continue
        }

        let enrollment
        if (existingEnrollment) {
          // 如果已存在记录，更新状态和时间
          console.log(`🔄 更新现有enrollment记录: ${targetCourse.name}`)
          enrollment = await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              status: 'APPROVED',
              enrollmentDate: new Date(),
              updatedAt: new Date(),
              createdBy: (req as any).user?.id || 'SYSTEM'
            }
          })
        } else {
          // 如果不存在记录，创建新记录
          console.log(`➕ 创建新enrollment记录: ${targetCourse.name}`)
          enrollment = await tx.enrollment.create({
            data: {
              studentId: id,
              courseId: courseId,
              enrollmentDate: new Date(),
              status: 'APPROVED', // 管理员直接添加的课程默认为已批准
              createdBy: (req as any).user?.id || 'SYSTEM',
              enrollmentCode: `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
          })
        }

        // 保存成功创建的报名记录和课程信息
        newEnrollments.push(enrollment)
        addedCourseNames.push(targetCourse.name) // 使用确定存在的课程名称
        console.log(`✅ 成功为学生添加课程: ${targetCourse.name}`)
      }

      return {
        student: student,
        removedCount: coursesToRemove.length,
        addedCount: newEnrollments.length,
        removedCourses: coursesToRemove,
        addedEnrollments: newEnrollments,
        addedCourseNames: addedCourseNames, // 新增：返回课程名称数组
        totalCourses: currentCourseIds.length - coursesToRemove.length + newEnrollments.length
      }
    })

    // 记录操作日志
    businessLogger.userAction((req as any).user!.id, 'STUDENT_COURSES_UPDATE', {
      studentId: id,
      studentName: result.student.name,
      removedCount: result.removedCount,
      addedCount: result.addedCount,
      totalCourses: result.totalCourses,
      removedCourses: result.removedCourses,
      addedCourses: result.addedCourseNames // 使用正确的课程名称数组
    })

    const message = `学生选课更新成功！` +
      (result.removedCount > 0 ? `退选 ${result.removedCount} 门课程，` : '') +
      (result.addedCount > 0 ? `新选 ${result.addedCount} 门课程，` : '') +
      `当前共选 ${result.totalCourses} 门课程`

  res.json({
    code: 200,
      message,
      data: {
        studentId: id,
        removedCount: result.removedCount,
        addedCount: result.addedCount,
        totalCourses: result.totalCourses,
        addedCourses: result.addedCourseNames.map((courseName, index) => ({
          id: result.addedEnrollments[index]?.courseId || '',
          name: courseName
        }))
      }
    })

  } catch (error) {
    console.error('更新学生选课失败:', error)

    if (error instanceof BusinessError || error instanceof ValidationError) {
      throw error
    }

    throw new BusinessError('更新学生选课失败', 500, 'COURSE_UPDATE_ERROR')
  }
}))

export default router
