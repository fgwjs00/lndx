/**
 * 学员编号生成工具
 * @description 按学期生成规范化的学员编号
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 🔧 按学期生成学员编号
 * 格式：{年份}0001，如 20250001, 20240001
 * @param semester 学期字符串，如 "2025年秋季", "2024年秋季"
 */
export async function generateStudentCode(semester?: string): Promise<string> {
  // 🔧 从学期字符串中提取年份
  let yearFromSemester = new Date().getFullYear() // 默认当前年份
  
  if (semester) {
    const yearMatch = semester.match(/(\d{4})/)
    if (yearMatch) {
      yearFromSemester = parseInt(yearMatch[1])
    }
  }
  
  const yearPrefix = yearFromSemester.toString()
  
  console.log(`🔧 生成学员编号: 学期=${semester}, 年份前缀=${yearPrefix}`)
  
  // 最多重试5次防止并发冲突
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // 🔧 查找该年份最大的学员编号
      const latestStudent = await prisma.student.findFirst({
        where: {
          studentCode: {
            startsWith: yearPrefix
          },
          // 🔧 新增：优先从相同学期的学生中查找
          semester: semester || undefined
        },
        orderBy: {
          studentCode: 'desc'
        }
      })
      
      let nextNumber = 1
      if (latestStudent) {
        // 🔧 从编号中提取序号部分 (新格式：20250001 -> 0001)
        const codeMatch = latestStudent.studentCode.match(/\d{4}(\d{4})$/)
        if (codeMatch) {
          nextNumber = parseInt(codeMatch[1]) + 1
        }
      }
      
      // 🔧 格式化为4位数字，如0001, 0002
      const formattedNumber = nextNumber.toString().padStart(4, '0')
      const candidateCode = `${yearPrefix}${formattedNumber}`
      
      // 双重检查：验证该编号是否已存在
      const existing = await prisma.student.findUnique({
        where: { studentCode: candidateCode }
      })
      
      if (!existing) {
        console.log(`✅ 生成学员编号成功: ${candidateCode} (学期: ${semester}, 尝试次数: ${attempt + 1})`)
        return candidateCode
      } else {
        console.log(`⚠️ 学员编号 ${candidateCode} 已存在，重试 ${attempt + 1}/5`)
      }
    } catch (error) {
      console.error(`❌ 生成学员编号失败 (尝试 ${attempt + 1}/5):`, error)
    }
    
    // 等待随机时间后重试（避免并发冲突）
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  }
  
  // 如果所有重试都失败，使用时间戳作为后备方案
  const fallbackSuffix = Date.now().toString().slice(-4)
  const fallbackCode = `${yearPrefix}${fallbackSuffix}`
  console.log(`⚠️ 使用时间戳后备方案: ${fallbackCode}`)
  return fallbackCode
}
