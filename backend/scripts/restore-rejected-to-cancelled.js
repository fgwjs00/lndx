#!/usr/bin/env node

/**
 * 恢复REJECTED状态为CANCELLED状态的脚本
 * @description 将之前由CANCELLED更改为REJECTED的报名记录恢复为CANCELLED状态
 * @author AI Assistant
 * @date 2025-08-22
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * 恢复REJECTED状态为CANCELLED状态
 * @param {boolean} dryRun - 是否为试运行模式，默认true
 */
async function restoreRejectedToCancelled(dryRun = true) {
  try {
    console.log('🔄 开始恢复REJECTED状态为CANCELLED状态...')
    console.log(`📋 运行模式: ${dryRun ? '试运行 (不会实际修改数据)' : '实际执行'}`)
    console.log()

    // 1. 查询所有由脚本修改的REJECTED状态记录（通过cancelReason识别）
    console.log('🔍 正在查询需要恢复的REJECTED状态报名记录...')
    
    const rejectedEnrollments = await prisma.enrollment.findMany({
      where: {
        status: 'REJECTED',
        cancelReason: '历史数据状态修正'
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
        { course: { name: 'asc' } }
      ]
    })

    console.log(`📊 找到 ${rejectedEnrollments.length} 条需要恢复的REJECTED状态报名记录`)
    
    if (rejectedEnrollments.length === 0) {
      console.log('✅ 没有找到需要恢复的记录，可能已经恢复或未执行过状态更新脚本')
      return
    }

    // 2. 统计信息
    const studentStats = new Map()
    const semesterStats = new Map()

    rejectedEnrollments.forEach(enrollment => {
      const studentId = enrollment.student.id
      const semester = enrollment.course.semester

      // 统计学员信息
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          name: enrollment.student.name,
          isActive: enrollment.student.isActive,
          count: 0,
          courses: []
        })
      }
      const studentStat = studentStats.get(studentId)
      studentStat.count++
      studentStat.courses.push(`${enrollment.course.name}(${semester})`)

      // 统计学期信息
      if (!semesterStats.has(semester)) {
        semesterStats.set(semester, 0)
      }
      semesterStats.set(semester, semesterStats.get(semester) + 1)
    })

    // 3. 显示统计信息
    console.log('📈 统计信息:')
    console.log(`   总记录数: ${rejectedEnrollments.length}`)
    console.log(`   涉及学员数: ${studentStats.size}`)
    
    let activeCount = 0
    let inactiveCount = 0
    studentStats.forEach(stat => {
      if (stat.isActive) activeCount++
      else inactiveCount++
    })
    
    console.log(`   - 活跃学员: ${activeCount}`)
    console.log(`   - 非活跃学员: ${inactiveCount}`)
    console.log()

    console.log('📅 按学期分布:')
    for (const [semester, count] of semesterStats.entries()) {
      console.log(`   ${semester}: ${count} 条记录`)
    }
    console.log()

    // 4. 显示涉及的学员详情
    console.log('👥 涉及的学员详情:')
    console.log('='.repeat(120))
    console.log('| 序号 | 学员姓名     | 状态   | REJECTED记录数 | 详细课程信息                                    |')
    console.log('='.repeat(120))
    
    let index = 1
    for (const [studentId, stat] of studentStats.entries()) {
      const coursesInfo = stat.courses.length > 3 
        ? stat.courses.slice(0, 3).join(', ') + '...'
        : stat.courses.join(', ')
      
      console.log(`| ${index.toString().padStart(4)} | ${stat.name.padEnd(10)} | ${(stat.isActive ? '活跃' : '非活跃').padEnd(5)} | ${stat.count.toString().padStart(13)} | ${coursesInfo.padEnd(45).substring(0, 45)} |`)
      index++
    }
    console.log('='.repeat(120))
    console.log()

    // 5. 执行恢复操作
    if (dryRun) {
      console.log('🔍 试运行模式 - 以下是将要执行的恢复操作:')
      console.log('   - 将所有标记为"历史数据状态修正"的REJECTED状态恢复为CANCELLED状态')
      console.log('   - 清除cancelReason字段（设为null）')
      console.log('   - 更新updatedAt时间戳')
      console.log()
      console.log('💡 如需实际执行，请运行:')
      console.log('   node scripts/restore-rejected-to-cancelled.js --execute')
    } else {
      console.log('🚀 开始执行恢复操作...')
      console.log()

      // 批量更新状态
      const updateResult = await prisma.enrollment.updateMany({
        where: {
          status: 'REJECTED',
          cancelReason: '历史数据状态修正'
        },
        data: {
          status: 'CANCELLED',
          cancelReason: null,
          updatedAt: new Date()
        }
      })

      console.log(`✅ 恢复完成！共恢复了 ${updateResult.count} 条记录`)
      console.log()
      
      // 验证恢复结果
      const verifyCount = await prisma.enrollment.count({
        where: {
          status: 'CANCELLED'
        }
      })
      
      const remainingRejected = await prisma.enrollment.count({
        where: {
          status: 'REJECTED',
          cancelReason: '历史数据状态修正'
        }
      })

      console.log('📊 恢复后验证:')
      console.log(`   - 当前CANCELLED状态记录数: ${verifyCount}`)
      console.log(`   - 剩余待恢复的REJECTED记录数: ${remainingRejected}`)
      
      if (remainingRejected === 0) {
        console.log('✅ 所有记录已成功恢复！')
      } else {
        console.log('⚠️  仍有记录未恢复，请检查数据')
      }
    }

    console.log()
    console.log('📝 操作说明:')
    console.log('   1. 此脚本专门恢复之前由update-cancelled-to-rejected.js脚本修改的记录')
    console.log('   2. 通过cancelReason="历史数据状态修正"来识别需要恢复的记录')
    console.log('   3. 恢复后，CANCELLED状态表示因学员删除等原因取消的报名')
    console.log('   4. REJECTED状态仅表示正常的报名申请被拒绝')
    console.log('   5. 恢复后cancelReason字段会被清空')

  } catch (error) {
    console.error('❌ 恢复过程中发生错误:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 主函数
async function main() {
  console.log('🔧 批量恢复REJECTED状态为CANCELLED状态脚本')
  console.log('='.repeat(60))
  console.log('⚠️  当前为试运行模式，不会实际修改数据')
  console.log('💡 使用说明:')
  console.log('   - 试运行: node scripts/restore-rejected-to-cancelled.js')
  console.log('   - 实际执行: node scripts/restore-rejected-to-cancelled.js --execute')
  console.log()

  // 检查命令行参数
  const args = process.argv.slice(2)
  const shouldExecute = args.includes('--execute')

  try {
    await restoreRejectedToCancelled(!shouldExecute)
  } catch (error) {
    console.error('💥 脚本执行失败:', error.message)
    process.exit(1)
  }
}

// 执行主函数
if (require.main === module) {
  main()
}

module.exports = {
  restoreRejectedToCancelled
}
