#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEnrollmentStatus() {
  try {
    console.log('📊 检查报名记录状态统计...')
    console.log('🔗 连接数据库...')
    
    // 测试数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    console.log()

    // 统计各种状态
    const cancelled = await prisma.enrollment.count({ 
      where: { status: 'CANCELLED' } 
    })
    
    const rejected = await prisma.enrollment.count({ 
      where: { status: 'REJECTED' } 
    })
    
    const rejectedWithReason = await prisma.enrollment.count({ 
      where: { 
        status: 'REJECTED', 
        cancelReason: '历史数据状态修正' 
      } 
    })

    const approved = await prisma.enrollment.count({ 
      where: { status: 'APPROVED' } 
    })

    const pending = await prisma.enrollment.count({ 
      where: { status: 'PENDING' } 
    })

    console.log('当前状态统计:')
    console.log('├─ CANCELLED:', cancelled)
    console.log('├─ REJECTED:', rejected)
    console.log('├─ REJECTED (历史数据状态修正):', rejectedWithReason)
    console.log('├─ APPROVED:', approved)
    console.log('└─ PENDING:', pending)
    console.log()

    // 如果有需要恢复的记录，显示详情
    if (rejectedWithReason > 0) {
      console.log('🔍 需要恢复的记录详情:')
      const recordsToRestore = await prisma.enrollment.findMany({
        where: {
          status: 'REJECTED',
          cancelReason: '历史数据状态修正'
        },
        include: {
          student: {
            select: { name: true, isActive: true }
          },
          course: {
            select: { name: true, semester: true }
          }
        },
        take: 10 // 只显示前10条
      })

      recordsToRestore.forEach((record, index) => {
        console.log(`${index + 1}. ${record.student.name} - ${record.course.name} (${record.course.semester}) [${record.student.isActive ? '活跃' : '非活跃'}]`)
      })

      if (rejectedWithReason > 10) {
        console.log(`... 还有 ${rejectedWithReason - 10} 条记录`)
      }
      console.log()
      console.log('💡 执行恢复命令:')
      console.log('   node scripts/restore-rejected-to-cancelled.js --execute')
    } else {
      console.log('✅ 没有找到需要恢复的记录')
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEnrollmentStatus()
