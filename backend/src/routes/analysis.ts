/**
 * 数据分析路由
 * @description 处理系统统计分析相关的API请求
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler, BusinessError } from '@/middleware/errorHandler'
import { authMiddleware } from '@/middleware/auth'
import { businessLogger } from '@/utils/logger'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取系统统计概览
 * GET /api/analysis/overview
 */
router.get('/overview', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取基础统计数据
    const [
      totalStudents,
      totalCourses,
      totalEnrollments,
      approvedEnrollments,
      pendingEnrollments,
      rejectedEnrollments,
      activeTeachers
    ] = await Promise.all([
      // 总学生数：只统计有至少一门已通过课程的学生
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
      prisma.course.count({ where: { isActive: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: 'APPROVED' } }),
      prisma.enrollment.count({ where: { status: 'PENDING' } }),
      prisma.enrollment.count({ where: { status: 'REJECTED' } }),
      prisma.teacher.count({ where: { isActive: true } })
    ])

    // 计算成功率
    const successRate = totalEnrollments > 0 ? 
      Math.round((approvedEnrollments / totalEnrollments) * 100 * 10) / 10 : 0

    // 计算平均年龄（只统计已通过审核的学生）
    const students = await prisma.student.findMany({
      where: { 
        isActive: true, 
        age: { gt: 0 },
        enrollments: {
          some: {
            status: 'APPROVED'
          }
        }
      },
      select: { age: true }
    })
    const averageAge = students.length > 0 ? 
      Math.round(students.reduce((sum, s) => sum + s.age, 0) / students.length * 10) / 10 : 0

    // 构建前端期望的数据格式
    const responseData = {
      students: {
        total: totalStudents,
        active: totalStudents, // 活跃学生等于总学生
        thisMonth: totalStudents, // 简化：假设本月新增等于总数
        thisWeek: totalStudents
      },
      courses: {
        total: totalCourses,
        active: totalCourses,
        thisMonth: totalCourses
      },
      applications: {
        total: totalEnrollments,
        pending: pendingEnrollments,
        approved: approvedEnrollments,
        rejected: rejectedEnrollments,
        thisWeek: totalEnrollments,
        thisMonth: totalEnrollments
      },
      teachers: {
        total: activeTeachers,
        active: activeTeachers
      },
      // 保留原始数据以防需要
      raw: {
        successRate,
        totalStudents,
        totalGraduated: approvedEnrollments,
        averageAge,
        totalCourses,
        totalEnrollments,
        approvedEnrollments,
        pendingEnrollments,
        rejectedEnrollments,
        activeTeachers
      }
    }

    console.log('📊 概览统计API返回数据:', JSON.stringify(responseData, null, 2))

    res.json({
      code: 200,
      message: '获取统计概览成功',
      data: responseData
    })
  } catch (error) {
    console.error('获取统计概览失败:', error)
    throw new BusinessError('获取统计概览失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取热门课程排行
 * GET /api/analysis/popular-courses
 */
router.get('/popular-courses', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5

    // 查询每个课程的报名人数
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          where: { status: 'APPROVED' }
        }
      }
    })

    // 计算每个课程的报名数和成功率
    const popularCourses = courses
      .map(course => {
        const approvedCount = course.enrollments.filter(e => e.status === 'APPROVED').length
        const totalApplied = course.enrollments.length // 简化，实际可能需要查询所有状态
        const rate = totalApplied > 0 ? Math.round((approvedCount / Math.max(totalApplied, 1)) * 100) : 0
        
        return {
          id: course.id,
          name: course.name,
          category: course.category,
          students: approvedCount,
          rate: rate,
          maxStudents: course.maxStudents
        }
      })
      .filter(course => course.students > 0) // 只显示有学生的课程
      .sort((a, b) => b.students - a.students) // 按学生数倒序
      .slice(0, limit)

    res.json({
      code: 200,
      message: '获取热门课程排行成功',
      data: popularCourses
    })
  } catch (error) {
    console.error('获取热门课程排行失败:', error)
    throw new BusinessError('获取热门课程排行失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取月度统计数据
 * GET /api/analysis/monthly-stats
 */
router.get('/monthly-stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // 获取本月数据
    const [
      newStudents,
      newEnrollments,
      graduatedStudents,
      totalEnrollments,
      rejectedEnrollments
    ] = await Promise.all([
      prisma.student.count({
        where: {
          isActive: true,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.enrollment.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.enrollment.count({
        where: {
          status: 'APPROVED',
          approvedAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.enrollment.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.enrollment.count({
        where: {
          status: 'REJECTED',
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      })
    ])

    // 计算退学率
    const dropoutRate = totalEnrollments > 0 ? 
      Math.round((rejectedEnrollments / totalEnrollments) * 100 * 10) / 10 : 0

    res.json({
      code: 200,
      message: '获取月度统计成功',
      data: {
        newStudents,
        newEnrollments,
        graduatedStudents,
        dropoutRate
      }
    })
  } catch (error) {
    console.error('获取月度统计失败:', error)
    throw new BusinessError('获取月度统计失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取课程分类统计
 * GET /api/analysis/category-stats
 */
router.get('/category-stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 按分类统计课程和报名情况
    const categories = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          where: { status: 'APPROVED' }
        }
      }
    })

    // 统计每个分类的数据
    const categoryStats = categories.reduce((acc: any, course) => {
      const category = course.category || '未分类'
      
      if (!acc[category]) {
        acc[category] = {
          name: category,
          courses: 0,
          students: 0
        }
      }
      
      acc[category].courses += 1
      acc[category].students += course.enrollments.filter(e => e.status === 'APPROVED').length
      
      return acc
    }, {})

    // 转换为数组并排序
    const categoryList = Object.values(categoryStats)
      .sort((a: any, b: any) => b.students - a.students)

    res.json({
      code: 200,
      message: '获取分类统计成功',
      data: categoryList
    })
  } catch (error) {
    console.error('获取分类统计失败:', error)
    throw new BusinessError('获取分类统计失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取系统状态信息
 * GET /api/analysis/system-status
 */
router.get('/system-status', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取数据库连接状态
    let dbStatus = 'normal'
    let onlineUsers = 0
    
    try {
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'normal'
    } catch {
      dbStatus = 'error'
    }

    // 获取活跃用户数（简化统计）
    const recentActiveUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // 30分钟内活跃
        }
      }
    })

    // 计算系统运行时间（简化处理）
    const uptime = process.uptime()
    const uptimeHours = Math.floor(uptime / 3600)

    res.json({
      code: 200,
      message: '获取系统状态成功',
      data: {
        dbStatus,
        serverLoad: 'medium', // 暂时硬编码，实际可通过系统监控获取
        onlineUsers: recentActiveUsers,
        uptimeHours
      }
    })
  } catch (error) {
    console.error('获取系统状态失败:', error)
    throw new BusinessError('获取系统状态失败', 500, 'QUERY_ERROR')
  }
}))

/**
 * 获取最近活动
 * GET /api/analysis/recent-activities
 */
router.get('/recent-activities', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50)
    
    // 获取最近的申请记录，使用enrollment表
    const recentApplications = await prisma.enrollment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            studentCode: true,
            photo: true
          }
        },
        course: {
          select: {
            name: true,
            category: true
          }
        }
      }
    })

    // 格式化数据
    const activities = recentApplications.map(enrollment => ({
      id: enrollment.id,
      type: 'enrollment',
      title: `${enrollment.student.name} 报名 ${enrollment.course.name}`,
      description: `课程分类：${enrollment.course.category}`,
      status: enrollment.status,
      avatar: enrollment.student.photo || '/default-avatar.png',
      time: enrollment.createdAt,
      metadata: {
        studentName: enrollment.student.name,
        courseName: enrollment.course.name,
        category: enrollment.course.category,
        phone: enrollment.student.studentCode // 使用学号代替电话
      }
    }))

    businessLogger.userAction((req as any).user?.id, 'RECENT_ACTIVITIES_QUERY', {
      limit,
      resultCount: activities.length
    })

    res.json({
      code: 200,
      message: '最近活动查询成功',
      data: activities
    })
  } catch (error) {
    console.error('最近活动查询失败:', error)
    throw new BusinessError('最近活动查询失败', 500, 'RECENT_ACTIVITIES_ERROR')
  }
}))

/**
 * 获取课程分类统计
 * GET /api/analysis/course-categories-stats
 */
router.get('/course-categories-stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取课程分类统计
    const categoryStats = await prisma.course.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    // 获取每个分类的报名数
    const categoryEnrollments = await prisma.enrollment.groupBy({
      by: ['courseId'],
      _count: {
        courseId: true
      }
    })

    // 合并数据
    const stats = await Promise.all(
      categoryStats.map(async (stat) => {
        const coursesInCategory = await prisma.course.findMany({
          where: { category: stat.category, isActive: true },
          select: { id: true }
        })
        
        const totalEnrollments = categoryEnrollments
          .filter(e => coursesInCategory.some(c => c.id === e.courseId))
          .reduce((sum, e) => sum + e._count.courseId, 0)

        return {
          category: stat.category,
          courseCount: stat._count.category,
          enrollmentCount: totalEnrollments
        }
      })
    )

    businessLogger.userAction((req as any).user?.id, 'COURSE_CATEGORIES_STATS_QUERY', {
      categoriesCount: stats.length
    })

    res.json({
      code: 200,
      message: '课程分类统计查询成功',
      data: stats
    })
  } catch (error) {
    console.error('课程分类统计查询失败:', error)
    throw new BusinessError('课程分类统计查询失败', 500, 'COURSE_CATEGORIES_STATS_ERROR')
  }
}))

export default router
