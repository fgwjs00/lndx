/**
 * 年龄相关工具函数
 * @description 提供年龄计算和验证功能
 */

import dayjs, { type Dayjs } from 'dayjs'

/**
 * 计算年龄
 * @param birthDate 出生日期
 * @param baseDate 基准日期，默认为今天
 * @returns 年龄（周岁）
 */
export const calculateAge = (birthDate: string | Date | Dayjs, baseDate?: string | Date | Dayjs): number => {
  if (!birthDate) return 0
  
  const birth = dayjs(birthDate)
  const base = baseDate ? dayjs(baseDate) : dayjs()
  
  if (!birth.isValid() || !base.isValid()) return 0
  
  return base.diff(birth, 'year')
}

/**
 * 检查年龄是否符合课程要求
 * @param studentAge 学生年龄
 * @param ageRestriction 课程年龄限制
 * @returns 是否符合要求和提示信息
 */
export const checkAgeRestriction = (
  studentAge: number, 
  ageRestriction: {
    enabled?: boolean
    minAge?: number | null
    maxAge?: number | null
    description?: string | null
  }
): { 
  isEligible: boolean
  message?: string 
} => {
  // 如果未启用年龄限制，则不限制
  if (!ageRestriction?.enabled) {
    return { isEligible: true }
  }
  
  const { minAge, maxAge, description } = ageRestriction
  
  // 检查最小年龄限制
  if (minAge && studentAge < minAge) {
    return {
      isEligible: false,
      message: `该课程要求最小年龄${minAge}岁${description ? `（${description}）` : ''}`
    }
  }
  
  // 检查最大年龄限制
  if (maxAge && studentAge > maxAge) {
    return {
      isEligible: false,
      message: `该课程要求最大年龄${maxAge}岁${description ? `（${description}）` : ''}`
    }
  }
  
  return { isEligible: true }
}

/**
 * 格式化年龄限制显示文本
 * @param ageRestriction 年龄限制对象
 * @returns 格式化的年龄限制说明
 */
export const formatAgeRestriction = (ageRestriction: {
  enabled?: boolean
  minAge?: number | null
  maxAge?: number | null
  description?: string | null
}): string => {
  if (!ageRestriction?.enabled) {
    return '无年龄限制'
  }
  
  const { minAge, maxAge, description } = ageRestriction
  let text = ''
  
  if (minAge && maxAge) {
    text = `${minAge}-${maxAge}岁`
  } else if (minAge) {
    text = `${minAge}岁以上`
  } else if (maxAge) {
    text = `${maxAge}岁以下`
  } else {
    text = '有年龄要求'
  }
  
  if (description) {
    text += ` (${description})`
  }
  
  return text
}

/**
 * 获取年龄限制的简短提示
 * @param ageRestriction 年龄限制对象
 * @returns 简短的年龄限制提示
 */
export const getAgeRestrictionHint = (ageRestriction: {
  enabled?: boolean
  minAge?: number | null
  maxAge?: number | null
}): string => {
  if (!ageRestriction?.enabled) return ''
  
  const { minAge, maxAge } = ageRestriction
  
  if (minAge && maxAge) {
    return `${minAge}-${maxAge}岁`
  } else if (minAge) {
    return `${minAge}岁+`
  } else if (maxAge) {
    return `≤${maxAge}岁`
  } else {
    return '有年龄要求'
  }
}
