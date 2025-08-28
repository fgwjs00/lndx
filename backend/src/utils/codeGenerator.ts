/**
 * 代码生成工具
 * @description 生成学生编号、申请编号等唯一标识码
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 生成唯一的申请编号
 * @param prefix 前缀（如：APP, STU）
 * @returns 唯一编号
 */
export async function generateApplicationCode(prefix: string = 'APP'): Promise<string> {
  const timestamp = Date.now().toString().slice(-8) // 取时间戳后8位
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0') // 3位随机数
  
  return `${prefix}${timestamp}${random}`
}

/**
 * 🚫 已废弃：生成学生编号
 * @deprecated 请使用 application.ts 中的新版按学期生成编号函数
 * @returns 唯一的学生编号
 */
// export async function generateStudentCode(): Promise<string> {
//   const year = new Date().getFullYear().toString().slice(-2) // 年份后两位
//   const timestamp = Date.now().toString().slice(-6) // 时间戳后6位
//   const random = Math.floor(Math.random() * 100).toString().padStart(2, '0') // 2位随机数
//   
//   return `STU${year}${timestamp}${random}`
// }

/**
 * 生成课程编号
 * @returns 唯一的课程编号
 */
export async function generateCourseCode(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2)
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  return `COU${year}${timestamp}${random}`
}

/**
 * 生成教师编号
 * @returns 唯一的教师编号
 */
export async function generateTeacherCode(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2)
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  return `TEA${year}${timestamp}${random}`
}
