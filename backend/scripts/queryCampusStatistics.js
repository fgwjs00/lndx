/**
 * 按校区统计人数和报名人次脚本
 * 统计每个校区的学生人数和报名课程总人次
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function queryCampusStatistics() {
  try {
    console.log('🏫 开始查询校区统计数据...\n');

    // 首先查看数据库中有哪些字段可以用来表示校区
    console.log('🔍 检查数据库结构...');
    
    // 查询学生表的一些示例数据，看看有哪些字段
    const sampleStudents = await prisma.student.findMany({
      where: { isActive: true },
      select: {
        name: true,
        studentCode: true,
        major: true,
        semester: true,
        currentAddress: true,
        contactPhone: true,
        // 可能的校区相关字段
        enrollments: {
          select: {
            course: {
              select: {
                name: true,
                location: true, // 课程地点字段
                category: true, // 课程分类字段
                semester: true // 课程学期字段
              }
            }
          }
        }
      },
      take: 3
    });

    console.log('📋 数据样本 (前3个学生):');
    sampleStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.studentCode})`);
      console.log(`   专业: ${student.major || '未设置'}`);
      console.log(`   学期: ${student.semester}`);
      console.log(`   地址: ${student.currentAddress || '未设置'}`);
      console.log(`   报名课程:`);
      student.enrollments.forEach((enrollment, i) => {
        const course = enrollment.course;
        console.log(`     ${i + 1}. ${course.name}`);
        console.log(`        地点: ${course.location || '未设置'}`);
        console.log(`        分类: ${course.category || '未设置'}`);
        console.log(`        学期: ${course.semester || '未设置'}`);
      });
      console.log('');
    });

    // 方案1: 按课程地点统计 (使用课程表的location字段)
    console.log('\n📊 方案1: 按课程地点统计');
    console.log('='.repeat(60));

    try {
      const locationStats = await prisma.course.groupBy({
        by: ['location'],
        where: {
          isActive: true,
          location: {
            not: null,
            not: ''
          }
        },
        _count: {
          location: true
        }
      });

      if (locationStats.length > 0) {
        console.log('📈 按课程地点的课程数量统计:');
        locationStats.forEach((stat, index) => {
          console.log(`${index + 1}. ${stat.location}: ${stat._count.location} 门课程`);
        });

        // 按地点统计报名人次
        for (const locationStat of locationStats) {
          const location = locationStat.location;
          
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

          console.log(`\n📍 ${location} 详细统计:`);
          console.log(`   👥 学生人数: ${uniqueStudents.length} 人`);
          console.log(`   📚 报名人次: ${enrollmentCount} 人次`);
          console.log(`   📊 人均报名: ${(enrollmentCount / uniqueStudents.length || 0).toFixed(1)} 门课程`);
        }
      } else {
        console.log('❌ 课程表中没有地点信息');
      }
    } catch (error) {
      console.log('❌ 课程地点字段不存在或查询失败');
    }

    // 方案2: 按课程分类统计 (使用课程表的category字段)
    console.log('\n📊 方案2: 按课程分类统计');
    console.log('='.repeat(60));

    const categoryStats = await prisma.course.groupBy({
      by: ['category'],
      where: {
        isActive: true,
        category: {
          not: null,
          not: ''
        }
      },
      _count: {
        category: true
      }
    });

    if (categoryStats.length > 0) {
      console.log('📈 按课程分类的课程数量统计:');
      categoryStats.forEach((stat, index) => {
        console.log(`${index + 1}. ${stat.category}: ${stat._count.category} 门课程`);
      });

      // 按分类统计报名人次
      for (const categoryStat of categoryStats) {
        const category = categoryStat.category;
        
        // 统计该分类的报名人次
        const enrollmentCount = await prisma.enrollment.count({
          where: {
            status: 'APPROVED',
            course: {
              isActive: true,
              category: category
            },
            student: {
              isActive: true
            }
          }
        });

        // 统计该分类的学生人数（去重）
        const uniqueStudents = await prisma.enrollment.findMany({
          where: {
            status: 'APPROVED',
            course: {
              isActive: true,
              category: category
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

        console.log(`\n🎯 ${category} 详细统计:`);
        console.log(`   👥 学生人数: ${uniqueStudents.length} 人`);
        console.log(`   📚 报名人次: ${enrollmentCount} 人次`);
        console.log(`   📊 人均报名: ${(enrollmentCount / uniqueStudents.length || 0).toFixed(1)} 门课程`);
      }
    }

    // 方案3: 按学生专业统计 (使用学生表的major字段)
    console.log('\n📊 方案3: 按学生专业统计');
    console.log('='.repeat(60));

    const majorStats = await prisma.student.groupBy({
      by: ['major'],
      where: {
        isActive: true,
        major: {
          not: null,
          not: ''
        }
      },
      _count: {
        major: true
      }
    });

    if (majorStats.length > 0) {
      console.log('📈 按学生专业的学生数量统计:');
      majorStats.forEach((stat, index) => {
        console.log(`${index + 1}. ${stat.major}: ${stat._count.major} 人`);
      });

      // 按专业统计报名人次
      for (const majorStat of majorStats) {
        const major = majorStat.major;
        
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

        console.log(`\n🎓 ${major} 详细统计:`);
        console.log(`   👥 学生人数: ${majorStat._count.major} 人`);
        console.log(`   📚 报名人次: ${enrollmentCount} 人次`);
        console.log(`   📊 人均报名: ${(enrollmentCount / majorStat._count.major).toFixed(1)} 门课程`);
      }
    }

    // 总体统计
    console.log('\n📊 总体统计');
    console.log('='.repeat(60));
    
    const totalStudents = await prisma.student.count({
      where: { isActive: true }
    });
    
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        status: 'APPROVED',
        student: { isActive: true }
      }
    });

    const totalCourses = await prisma.course.count({
      where: { isActive: true }
    });

    console.log(`👥 总学生人数: ${totalStudents} 人`);
    console.log(`📚 总报名人次: ${totalEnrollments} 人次`);
    console.log(`🎯 总课程数量: ${totalCourses} 门`);
    console.log(`📊 平均每人报名: ${(totalEnrollments / totalStudents).toFixed(1)} 门课程`);
    console.log(`📊 平均每门课程报名: ${(totalEnrollments / totalCourses).toFixed(1)} 人次`);

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行查询
queryCampusStatistics();
