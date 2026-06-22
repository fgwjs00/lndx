#!/usr/bin/env node

/**
 * 批量更新CANCELLED状态为REJECTED状态的脚本
 * @description 将所有CANCELLED状态的报名记录更改为REJECTED状态，清理历史遗留数据
 * @author AI Assistant
 * @date 2025-08-22
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * 更新CANCELLED状态为REJECTED状态
 * @param {boolean} dryRun - 是否为试运行模式，默认true
 */
async function updateCancelledToRejected(dryRun = true) {
  try {
    console.log('🔄 开始批量更新CANCELLED状态为REJECTED状态...')
    console.log(`📋 运行模式: ${dryRun ? '试运行 (不会实际修改数据)' : '实际执行'}`)
    console.log()

    // 1. 查询所有CANCELLED状态的报名记录
    console.log('🔍 正在查询所有CANCELLED状态的报名记录...')
    
    const cancelledEnrollments = await prisma.enrollment.findMany({
      where: {
        status: 'CANCELLED'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            idNumber: true,
            isActive: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            semester: true,
            level: true
          }
        }
      },
      orderBy: [
        { student: { name: 'asc' } },
        { course: { semester: 'desc' } },
        { enrollmentDate: 'desc' }
      ]
    })

    console.log(`📊 找到 ${cancelledEnrollments.length} 条CANCELLED状态的报名记录`)
    console.log()

    if (cancelledEnrollments.length === 0) {
      console.log('✅ 没有找到需要更新的记录，脚本执行完成')
      return
    }

    // 2. 按学生分组统计
    const studentStats = new Map()
    const semesterStats = new Map()
    let activeStudentCount = 0
    let inactiveStudentCount = 0

    cancelledEnrollments.forEach(enrollment => {
      const studentId = enrollment.student.id
      const studentName = enrollment.student.name
      const isActive = enrollment.student.isActive
      const semester = enrollment.course.semester

      // 学生统计
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          name: studentName,
          isActive: isActive,
          count: 0,
          enrollments: []
        })
        
        if (isActive) {
          activeStudentCount++
        } else {
          inactiveStudentCount++
        }
      }
      
      const studentStat = studentStats.get(studentId)
      studentStat.count++
      studentStat.enrollments.push({
        course: enrollment.course.name,
        semester: enrollment.course.semester,
        level: enrollment.course.level,
        enrollmentDate: enrollment.enrollmentDate
      })

      // 学期统计
      if (!semesterStats.has(semester)) {
        semesterStats.set(semester, 0)
      }
      semesterStats.set(semester, semesterStats.get(semester) + 1)
    })

    // 3. 显示详细统计信息
    console.log('📈 统计信息:')
    console.log(`   总记录数: ${cancelledEnrollments.length}`)
    console.log(`   涉及学员数: ${studentStats.size}`)
    console.log(`   - 活跃学员: ${activeStudentCount}`)
    console.log(`   - 非活跃学员: ${inactiveStudentCount}`)
    console.log()

    console.log('📅 按学期分布:')
    Array.from(semesterStats.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([semester, count]) => {
        console.log(`   ${semester}: ${count} 条记录`)
      })
    console.log()

    // 4. 显示详细的学员信息
    console.log('👥 涉及的学员详情:')
    console.log('=' .repeat(120))
    console.log('| 序号 | 学员姓名     | 状态   | CANCELLED记录数 | 详细课程信息                                    |')
    console.log('=' .repeat(120))

    let index = 1
    for (const [studentId, stat] of studentStats) {
      const statusText = stat.isActive ? '活跃' : '非活跃'
      const coursesInfo = stat.enrollments
        .map(e => `${e.course}(${e.semester})`)
        .join(', ')
      
      console.log(`| ${String(index).padStart(4)} | ${stat.name.padEnd(10)} | ${statusText.padEnd(6)} | ${String(stat.count).padStart(15)} | ${coursesInfo.substring(0, 45).padEnd(45)} |`)
      index++
    }
    console.log('=' .repeat(120))
    console.log()

    // 5. 执行更新操作
    if (dryRun) {
      console.log('🔍 试运行模式 - 以下是将要执行的更新操作:')
      console.log('   - 将所有CANCELLED状态更改为REJECTED状态')
      console.log('   - 设置cancelReason为"历史数据状态修正"')
      console.log('   - 更新updatedAt时间戳')
      console.log()
      console.log('💡 如需实际执行，请运行:')
      console.log('   node scripts/update-cancelled-to-rejected.js --execute')
    } else {
      console.log('⚠️  准备执行实际更新操作...')
      console.log('🔄 正在更新数据库记录...')

      const updateResult = await prisma.enrollment.updateMany({
        where: {
          status: 'CANCELLED'
        },
        data: {
          status: 'REJECTED',
          cancelReason: '历史数据状态修正：由CANCELLED更改为REJECTED',
          updatedAt: new Date()
        }
      })

      console.log(`✅ 更新完成！共更新了 ${updateResult.count} 条记录`)
      
      // 验证更新结果
      const remainingCancelled = await prisma.enrollment.count({
        where: { status: 'CANCELLED' }
      })
      
      const newRejected = await prisma.enrollment.count({
        where: { 
          status: 'REJECTED',
          cancelReason: '历史数据状态修正：由CANCELLED更改为REJECTED'
        }
      })

      console.log()
      console.log('🔍 更新验证:')
      console.log(`   剩余CANCELLED记录: ${remainingCancelled} 条`)
      console.log(`   新增REJECTED记录: ${newRejected} 条`)
      
      if (remainingCancelled === 0 && newRejected === updateResult.count) {
        console.log('✅ 数据更新验证成功！')
      } else {
        console.log('⚠️  数据验证异常，请检查数据库状态')
      }
    }

    console.log()
    console.log('📝 操作说明:')
    console.log('   1. CANCELLED状态通常表示因学员删除而取消的报名')
    console.log('   2. REJECTED状态表示报名申请被拒绝')
    console.log('   3. 此次更新将历史的CANCELLED记录统一为REJECTED，便于数据管理')
    console.log('   4. 更新后的记录在cancelReason字段中会标注修改原因')

  } catch (error) {
    console.error('❌ 更新CANCELLED状态时出错:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  // 检查命令行参数
  const args = process.argv.slice(2)
  const isExecuteMode = args.includes('--execute') || args.includes('-e')
  
  console.log('🔧 批量更新CANCELLED状态为REJECTED状态脚本')
  console.log('=' .repeat(60))
  
  if (!isExecuteMode) {
    console.log('⚠️  当前为试运行模式，不会实际修改数据')
    console.log('💡 使用说明:')
    console.log('   - 试运行: node scripts/update-cancelled-to-rejected.js')
    console.log('   - 实际执行: node scripts/update-cancelled-to-rejected.js --execute')
    console.log()
  } else {
    console.log('🚨 当前为实际执行模式，将会修改数据库数据')
    console.log('⚠️  请确保已经备份重要数据！')
    console.log()
  }
  
  updateCancelledToRejected(!isExecuteMode)
}

module.exports = { updateCancelledToRejected }
