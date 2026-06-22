/**
 * 初始化年级数据脚本
 * @description 为现有学生数据添加年级管理信息
 */

import { prisma } from '@/lib/prisma'
import { getCurrentSemester } from '../utils/gradeManagement'


async function initializeGradeData() {
  console.log('🚀 开始初始化学生年级数据...')
  
  try {
    const currentSemester = getCurrentSemester()
    console.log('当前学期:', currentSemester)
    
    // 获取所有学生（先简单查询所有活跃学生）
    const studentsWithoutGrade = await prisma.student.findMany({
      where: {
        isActive: true,
        currentGrade: null // 只查询没有年级信息的学生
      }
    })
    
    console.log(`找到 ${studentsWithoutGrade.length} 名需要初始化年级信息的学生`)
    
    if (studentsWithoutGrade.length === 0) {
      console.log('✅ 所有学生已有年级信息，无需初始化')
      return
    }
    
    // 批量更新学生年级信息
    for (const student of studentsWithoutGrade) {
      // 根据创建时间推算入学信息
      const createdYear = student.createdAt.getFullYear()
      const enrollmentSemester = `${createdYear}年度`
      
      // 根据创建时间计算当前应该的年级
      const currentYear = new Date().getFullYear()
      const yearsPassed = currentYear - createdYear
      
      let currentGrade: string
      let graduationStatus: string
      let academicStatus: string
      let graduationDate: Date | null = null
      
      if (yearsPassed >= 3) {
        // 应该毕业
        currentGrade = '三年级'
        graduationStatus = 'GRADUATED'
        academicStatus = 'GRADUATED'
        graduationDate = new Date(createdYear + 3, 6, 1) // 假设7月毕业
      } else {
        // 还在读
        const grades = ['一年级', '二年级', '三年级']
        currentGrade = grades[yearsPassed] || '一年级'
        graduationStatus = 'IN_PROGRESS'
        academicStatus = 'ACTIVE'
      }
      
      await prisma.student.update({
        where: { id: student.id },
        data: {
          currentGrade,
          enrollmentYear: createdYear,
          enrollmentSemester,
          graduationStatus,
          academicStatus,
          graduationDate,
          updatedAt: new Date()
        }
      })
      
      console.log(`✅ 更新学生 ${student.name}: ${currentGrade}, 状态: ${graduationStatus}`)
    }
    
    console.log(`🎉 成功初始化 ${studentsWithoutGrade.length} 名学生的年级信息`)
    
    // 统计结果
    const stats = await prisma.student.groupBy({
      by: ['currentGrade', 'graduationStatus'],
      where: { isActive: true },
      _count: { id: true }
    })
    
    console.log('📊 年级分布统计:')
    stats.forEach(stat => {
      console.log(`  ${stat.currentGrade} (${stat.graduationStatus}): ${stat._count.id}人`)
    })
    
  } catch (error) {
    console.error('❌ 初始化年级数据失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeGradeData()
    .then(() => {
      console.log('✅ 年级数据初始化完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 年级数据初始化失败:', error)
      process.exit(1)
    })
}

export { initializeGradeData }
