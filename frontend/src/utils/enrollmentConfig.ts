/**
 * 前端报名课程数量限制配置
 * @description 根据不同学期设置不同的课程报名数量限制
 */

/**
 * 获取指定学期的课程报名数量限制
 * @param semester 学期字符串，如：'2024秋季'、'2025春季'等
 * @returns 该学期允许的最大课程报名数量
 */
export function getMaxCoursesForSemester(semester?: string): number {
  if (!semester) {
    return 2 // 默认限制为2门
  }
  
  // 2024年秋季特殊配置：允许3门课程
  if (semester.includes('2024') && (semester.includes('秋') || semester.includes('秋季'))) {
    return 3
  }
  
  // 未来可以根据需要添加其他学期的特殊配置
  // 例如：
  // if (semester.includes('2025') && semester.includes('春')) {
  //   return 4
  // }
  
  // 默认限制为2门课程
  return 2
}

/**
 * 获取课程数量限制的详细信息
 * @param semester 学期
 * @param currentEnrollmentCount 当前已报名课程数量
 * @returns 限制信息对象
 */
export function getEnrollmentLimits(semester?: string, currentEnrollmentCount: number = 0) {
  const maxCoursesAllowed = getMaxCoursesForSemester(semester)
  const remainingCourseSlots = Math.max(0, maxCoursesAllowed - currentEnrollmentCount)
  
  return {
    maxCoursesAllowed,
    currentEnrollmentCount,
    remainingCourseSlots,
    canEnroll: remainingCourseSlots > 0,
    semesterRule: semester?.includes('2024') && semester.includes('秋') 
      ? '2024年秋季特殊政策：最多可报名3门课程' 
      : '标准政策：最多可报名2门课程'
  }
}

/**
 * 验证课程选择是否符合限制
 * @param semester 学期
 * @param currentEnrollmentCount 当前已报名课程数量
 * @param newCourseCount 本次要报名的课程数量
 * @returns 验证结果
 */
export function validateCourseSelection(
  semester: string | undefined, 
  currentEnrollmentCount: number, 
  newCourseCount: number
): { 
  isValid: boolean
  maxAllowed: number
  message?: string 
} {
  const maxCoursesAllowed = getMaxCoursesForSemester(semester)
  const totalAfterSelection = currentEnrollmentCount + newCourseCount
  
  if (totalAfterSelection > maxCoursesAllowed) {
    const semesterNote = maxCoursesAllowed === 3 ? '（2024年秋季特殊政策：最多3门）' : ''
    return {
      isValid: false,
      maxAllowed: maxCoursesAllowed,
      message: `您最多只能同时报名${maxCoursesAllowed}门课程${semesterNote}，当前已有${currentEnrollmentCount}门课程，无法再报名${newCourseCount}门`
    }
  }
  
  return {
    isValid: true,
    maxAllowed: maxCoursesAllowed
  }
}

export default {
  getMaxCoursesForSemester,
  getEnrollmentLimits,
  validateCourseSelection
}
