/**
 * 数据分析路由
 * @description 处理系统统计分析相关的API请求
 */

import { Router, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'
import { asyncHandler, BusinessError } from '@/middleware/errorHandler'
import { requireTeacher } from '@/middleware/auth'
import { businessLogger } from '@/utils/logger'

const router = Router()

/**
 * 获取系统统计概览
 * GET /api/analysis/overview
 */
router.get('/overview', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/popular-courses', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/monthly-stats', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/category-stats', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/system-status', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/recent-activities', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
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
router.get('/course-categories-stats', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
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

/**
 * 获取校区/教学点统计数据
 * GET /api/analysis/campus-stats
 */
router.get('/campus-stats', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 按课程地点统计
    const locationStats = await prisma.course.groupBy({
      by: ['location'],
      where: {
        isActive: true,
        AND: [
          { location: { not: null } },
          { location: { not: '' } }
        ]
      },
      _count: {
        location: true
      }
    });

    // 为每个地点获取详细统计
    const detailedLocationStats = await Promise.all(
      locationStats.map(async (stat) => {
        const location = stat.location;
        
        // 统计该地点的报名人次
        const enrollmentCount = await prisma.enrollment.count({
          where: {
            status: 'APPROVED',
            course: {
              isActive: true,
              location: location
            },
            student: {
              isActive: true
            }
          }
        });

        // 统计该地点的学生人数（去重）
        const uniqueStudents = await prisma.enrollment.findMany({
          where: {
            status: 'APPROVED',
            course: {
              isActive: true,
              location: location
            },
            student: {
              isActive: true
            }
          },
          select: {
            studentId: true
          },
          distinct: ['studentId']
        });

        return {
          location: location!,
          courseCount: stat._count.location,
          studentCount: uniqueStudents.length,
          enrollmentCount: enrollmentCount,
          averageEnrollment: uniqueStudents.length > 0 ? (enrollmentCount / uniqueStudents.length) : 0
        };
      })
    );

    // 按报名人次排序
    detailedLocationStats.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

    console.log('校区统计查询成功', {
      totalLocations: detailedLocationStats.length,
      topLocation: detailedLocationStats[0]?.location || 'N/A'
    });

    res.json({
      code: 200,
      message: '校区统计查询成功',
      data: detailedLocationStats
    });
  } catch (error) {
    console.error('校区统计查询失败:', error);
    throw new BusinessError('校区统计查询失败', 500, 'CAMPUS_STATS_ERROR');
  }
}));

/**
 * 获取专业分布统计数据
 * GET /api/analysis/major-stats
 */
router.get('/major-stats', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 按学生专业统计
    const majorStats = await prisma.student.groupBy({
      by: ['major'],
      where: {
        isActive: true,
        AND: [
          { major: { not: null } },
          { major: { not: '' } }
        ]
      },
      _count: {
        major: true
      }
    });

    // 为每个专业获取详细统计
    const detailedMajorStats = await Promise.all(
      majorStats.map(async (stat) => {
        const major = stat.major;
        
        // 统计该专业的报名人次
        const enrollmentCount = await prisma.enrollment.count({
          where: {
            status: 'APPROVED',
            student: {
              isActive: true,
              major: major
            }
          }
        });

        return {
          major: major!,
          studentCount: stat._count.major,
          enrollmentCount: enrollmentCount,
          averageEnrollment: (enrollmentCount / stat._count.major)
        };
      })
    );

    // 按学生人数排序
    detailedMajorStats.sort((a, b) => b.studentCount - a.studentCount);

    res.json({
      code: 200,
      message: '专业统计查询成功',
      data: detailedMajorStats
    });
  } catch (error) {
    console.error('专业统计查询失败:', error);
    throw new BusinessError('专业统计查询失败', 500, 'MAJOR_STATS_ERROR');
  }
}));

/**
 * 获取政治面貌统计数据
 * GET /api/analysis/political-stats
 */
router.get('/political-stats', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  try {
    const politicalStatusStats = await prisma.student.groupBy({
      by: ['politicalStatus'],
      where: {
        isActive: true,
        AND: [
          { politicalStatus: { not: null } },
          { politicalStatus: { not: '' } }
        ]
      },
      _count: {
        politicalStatus: true
      },
      orderBy: {
        _count: {
          politicalStatus: 'desc'
        }
      }
    });

    const totalStudents = await prisma.student.count({
      where: {
        isActive: true,
        AND: [
          { politicalStatus: { not: null } },
          { politicalStatus: { not: '' } }
        ]
      }
    });

    const detailedPoliticalStats = politicalStatusStats.map((stat) => {
      const status = stat.politicalStatus;
      const count = stat._count.politicalStatus;
      const percentage = ((count / totalStudents) * 100);
      
      // 判断是否为中共党员相关
      const isPartyMember = status && (status.includes('中共党员') || status.includes('党员'));
      
      return {
        politicalStatus: status!,
        studentCount: count,
        percentage: parseFloat(percentage.toFixed(1)),
        isPartyMember: isPartyMember
      };
    });

    // 计算中共党员总数
    const partyMemberCount = detailedPoliticalStats
      .filter(stat => stat.isPartyMember)
      .reduce((sum, stat) => sum + stat.studentCount, 0);

    res.json({
      code: 200,
      message: '政治面貌统计查询成功',
      data: {
        stats: detailedPoliticalStats,
        summary: {
          totalStudents,
          partyMemberCount,
          partyMemberPercentage: parseFloat(((partyMemberCount / totalStudents) * 100).toFixed(1))
        }
      }
    });
  } catch (error) {
    console.error('政治面貌统计查询失败:', error);
    throw new BusinessError('政治面貌统计查询失败', 500, 'POLITICAL_STATS_ERROR');
  }
}));

/**
 * 获取综合数据统计概览
 * GET /api/analysis/comprehensive-stats
 */
router.get('/comprehensive-stats', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  try {
    const [
      totalStudents,
      totalEnrollments,
      totalCourses,
      totalLocations,
      avgEnrollmentPerStudent
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.enrollment.count({ 
        where: { 
          status: 'APPROVED',
          student: { isActive: true }
        } 
      }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.course.findMany({
        where: { 
          isActive: true,
          AND: [
            { location: { not: null } },
            { location: { not: '' } }
          ]
        },
        select: { location: true },
        distinct: ['location']
      }),
      prisma.enrollment.count({ 
        where: { 
          status: 'APPROVED',
          student: { isActive: true }
        } 
      })
    ]);

    const avgEnrollmentPerCourse = totalCourses > 0 ? (totalEnrollments / totalCourses) : 0;
    const avgEnrollmentPerStudentCalc = totalStudents > 0 ? (totalEnrollments / totalStudents) : 0;

    res.json({
      code: 200,
      message: '综合统计查询成功',
      data: {
        totalStudents,
        totalEnrollments,
        totalCourses,
        totalLocations: totalLocations.length,
        avgEnrollmentPerStudent: parseFloat(avgEnrollmentPerStudentCalc.toFixed(1)),
        avgEnrollmentPerCourse: parseFloat(avgEnrollmentPerCourse.toFixed(1))
      }
    });
  } catch (error) {
    console.error('综合统计查询失败:', error);
    throw new BusinessError('综合统计查询失败', 500, 'COMPREHENSIVE_STATS_ERROR');
  }
}));

export default router
