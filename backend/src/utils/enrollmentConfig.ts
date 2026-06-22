/**
 * 报名课程数量限制配置
 * @description 支持跨学期报名，不同学期有不同的课程数量限制
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
  
  console.log(`🔍 检查学期限制: "${semester}"`)
  
  // 2024年秋季特殊配置：允许3门课程
  // 支持多种格式：'2024秋季'、'2024年秋季'、'2024年秋'等
  if (semester.includes('2024') && (semester.includes('秋') || semester.includes('秋季'))) {
    console.log(`✅ 2024年秋季特殊政策：允许3门课程`)
    return 3
  }
  
  // 2025年及以后：标准限制为2门课程
  if (semester.includes('2025') || semester.includes('2026') || semester.includes('2027')) {
    console.log(`✅ 2025年及以后标准政策：限制2门课程`)
    return 2
  }
  
  // 默认限制为2门课程
  console.log(`⚠️ 未识别的学期格式，使用默认限制：2门课程`)
  return 2
}

/**
 * 获取跨学期报名限制信息（重新设计）
 * @param newSemester 新学期
 * @param existingEnrollments 现有报名记录
 * @param newCourseCount 本次要报名的课程数量
 * @returns 跨学期报名限制信息
 */
export function getCrossSemesterEnrollmentLimits(
  newSemester: string,
  existingEnrollments: Array<{ 
    course: { semester: string }, 
    status: string 
  }>,
  newCourseCount: number
): {
  canEnroll: boolean
  maxAllowed: number
  currentTotal: number
  semesterLimit: number
  message?: string
  semesterBreakdown: Array<{ semester: string, count: number, limit: number }>
  totalEnrollments: number
  policyDescription: string
} {
  console.log(`🔍 跨学期报名限制检查:`)
  console.log(`  - 新学期: "${newSemester}"`)
  console.log(`  - 新课程数量: ${newCourseCount}`)
  console.log(`  - 现有报名数量: ${existingEnrollments.length}`)
  
  // 按学期分组统计现有报名
  const semesterStats = new Map<string, { count: number, limit: number }>()
  
  existingEnrollments.forEach(enrollment => {
    if (enrollment.status === 'PENDING' || enrollment.status === 'APPROVED') {
      const semester = enrollment.course.semester
      if (semester) {
        const current = semesterStats.get(semester) || { count: 0, limit: 0 }
        current.count++
        current.limit = getMaxCoursesForSemester(semester)
        semesterStats.set(semester, current)
        console.log(`  - 现有报名: ${semester}学期，${current.count}门课程，限制${current.limit}门`)
      }
    }
  })
  
  // 获取新学期限制
  const newSemesterLimit = getMaxCoursesForSemester(newSemester)
  console.log(`  - 新学期限制: ${newSemesterLimit}门课程`)
  
  // 检查新学期是否超出限制
  const newSemesterCurrent = semesterStats.get(newSemester)?.count || 0
  const newSemesterRemaining = Math.max(0, newSemesterLimit - newSemesterCurrent)
  
  // 计算总报名数量
  const totalEnrollments = Array.from(semesterStats.values()).reduce((sum, stats) => sum + stats.count, 0)
  
  // 🔧 修复：根据学期确定总课程数量限制
  // 2024年秋季：总数限制为3门课程
  // 其他学期：总数限制为2门课程
  const totalLimit = (newSemester.includes('2024') && newSemester.includes('秋')) ? 3 : 2
  const totalRemaining = Math.max(0, totalLimit - totalEnrollments)
  
  console.log(`  - 总报名数量: ${totalEnrollments}门`)
  console.log(`  - 总限制: ${totalLimit}门课程`)
  console.log(`  - 剩余名额: ${totalRemaining}门课程`)
  
  // 检查总课程数量是否超出限制
  if (newCourseCount > totalRemaining) {
    console.log(`❌ 总课程数量超出限制: 新课程${newCourseCount}门 > 剩余名额${totalRemaining}门`)
    return {
      canEnroll: false,
      maxAllowed: totalLimit,
      currentTotal: totalEnrollments,
      semesterLimit: newSemesterLimit,
      message: `总课程数量限制：${newSemester}学期最多可报名${totalLimit}门课程，当前已报名${totalEnrollments}门，还可报名${totalRemaining}门`,
      semesterBreakdown: Array.from(semesterStats.entries()).map(([sem, stats]) => ({
        semester: sem,
        count: stats.count,
        limit: stats.limit
      })),
      totalEnrollments,
      policyDescription: `${newSemester}学期总限制：最多可报名${totalLimit}门课程`
    }
  }
  
  console.log(`✅ 总课程数量检查通过: 新课程${newCourseCount}门 <= 剩余名额${totalRemaining}门`)
  
  // 生成政策描述
  let policyDescription = ''
  if (newSemester.includes('2024') && newSemester.includes('秋')) {
    policyDescription = '2024年秋季特殊政策：最多可报名3门课程（总数限制3门）'
  } else if (newSemester.includes('2025')) {
    policyDescription = '2025年标准政策：最多可报名2门课程（总数限制2门）'
  } else {
    policyDescription = '标准政策：最多可报名2门课程（总数限制2门）'
  }
  
  // 检查新学期是否超出限制
  if (newCourseCount > newSemesterRemaining) {
    console.log(`❌ 新学期限制超出: 新课程${newCourseCount}门 > 学期剩余名额${newSemesterRemaining}门`)
    return {
      canEnroll: false,
      maxAllowed: newSemesterLimit,
      currentTotal: newSemesterCurrent,
      semesterLimit: newSemesterLimit,
      message: `${newSemester}学期最多可报名${newSemesterLimit}门课程，当前已报名${newSemesterCurrent}门，还可报名${newSemesterRemaining}门`,
      semesterBreakdown: Array.from(semesterStats.entries()).map(([sem, stats]) => ({
        semester: sem,
        count: stats.count,
        limit: stats.limit
      })),
      totalEnrollments,
      policyDescription
    }
  }
  
  console.log(`✅ 新学期限制检查通过: 新课程${newCourseCount}门 <= 学期剩余名额${newSemesterRemaining}门`)
  
  // 构建学期统计信息，避免重复
  const semesterBreakdown = Array.from(semesterStats.entries()).map(([sem, stats]) => {
    if (sem === newSemester) {
      // 如果是新学期，更新数量
      return {
        semester: sem,
        count: stats.count + newCourseCount,
        limit: stats.limit
      }
    } else {
      // 其他学期保持原样
      return {
        semester: sem,
        count: stats.count,
        limit: stats.limit
      }
    }
  })
  
  // 如果新学期不在现有统计中，则添加
  if (!semesterStats.has(newSemester)) {
    semesterBreakdown.push({
      semester: newSemester,
      count: newSemesterCurrent + newCourseCount,
      limit: newSemesterLimit
    })
  }
  
  return {
    canEnroll: true,
    maxAllowed: newSemesterLimit,
    currentTotal: newSemesterCurrent,
    semesterLimit: newSemesterLimit,
    semesterBreakdown,
    totalEnrollments,
    policyDescription
  }
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
 * 验证课程选择是否符合限制（支持跨学期）
 * @param semester 学期
 * @param existingEnrollments 现有报名记录
 * @param newCourseCount 本次要报名的课程数量
 * @returns 验证结果
 */
export function validateCourseSelection(
  semester: string | undefined, 
  existingEnrollments: Array<{ 
    course: { semester: string }, 
    status: string 
  }>,
  newCourseCount: number
): { 
  isValid: boolean
  maxAllowed: number
  message?: string 
  semesterBreakdown?: Array<{ semester: string, count: number, limit: number }>
  totalEnrollments?: number
  policyDescription?: string
} {
  console.log(`🔍 课程选择验证:`)
  console.log(`  - 学期: "${semester}"`)
  console.log(`  - 新课程数量: ${newCourseCount}`)
  console.log(`  - 现有报名数量: ${existingEnrollments.length}`)
  
  if (!semester) {
    console.log(`❌ 学期信息缺失`)
    return {
      isValid: false,
      maxAllowed: 0,
      message: '学期信息缺失，无法验证课程选择'
    }
  }
  
  const limits = getCrossSemesterEnrollmentLimits(semester, existingEnrollments, newCourseCount)
  
  if (!limits.canEnroll) {
    console.log(`❌ 验证失败: ${limits.message}`)
    return {
      isValid: false,
      maxAllowed: limits.maxAllowed,
      message: limits.message
    }
  }
  
  console.log(`✅ 验证通过: 可报名${limits.maxAllowed}门课程`)
  return {
    isValid: true,
    maxAllowed: limits.maxAllowed,
    semesterBreakdown: limits.semesterBreakdown,
    totalEnrollments: limits.totalEnrollments,
    policyDescription: limits.policyDescription
  }
}

export default {
  getMaxCoursesForSemester,
  getCrossSemesterEnrollmentLimits,
  getEnrollmentLimits,
  validateCourseSelection
}
