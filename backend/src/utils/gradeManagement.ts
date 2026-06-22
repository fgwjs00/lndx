/**
 * 学生年级管理工具
 * @description 处理学生年级升级、毕业归档等业务逻辑
 */

/**
 * 年级类型定义
 */
export type Grade = '一年级' | '二年级' | '三年级'
export type GraduationStatus = 'IN_PROGRESS' | 'GRADUATED' | 'ARCHIVED'
export type AcademicStatus = 'ACTIVE' | 'SUSPENDED' | 'GRADUATED'

/**
 * 学期信息接口
 */
export interface SemesterInfo {
  year: number
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  displayName: string // 如：2025年秋季
}

/**
 * 解析学期字符串
 * @param semester 学期字符串，如："2025年度"
 * @returns 学期信息对象
 */
export function parseSemester(semester: string): SemesterInfo {
  const normalizedSemester = semester.trim()
  const match = normalizedSemester.match(/(\d{4})年(?:度|春季|夏季|秋季|冬季)?/)
  if (!match) {
    throw new Error(`无效的学期格式: ${semester}`)
  }
  
  const year = parseInt(match[1])
  const seasonMatch = normalizedSemester.match(/(春季|夏季|秋季|冬季)/)
  const seasonMap: Record<string, SemesterInfo['season']> = {
    '春季': 'spring',
    '夏季': 'summer',
    '秋季': 'autumn',
    '冬季': 'winter'
  }
  
  return {
    year,
    season: seasonMatch ? seasonMap[seasonMatch[1]] : 'autumn',
    displayName: normalizedSemester
  }
}

/**
 * 计算年份差值
 * @param fromSemester 起始学期
 * @param toSemester 目标学期
 * @returns 年份数量差值
 */
export function calculateYearDifference(fromSemester: string, toSemester: string): number {
  const from = parseSemester(fromSemester)
  const to = parseSemester(toSemester)
  
  return to.year - from.year
}

/**
 * 计算学生当前应该的年级
 * @param enrollmentSemester 入学学期
 * @param currentSemester 当前学期
 * @returns 应该的年级
 */
export function calculateCurrentGrade(enrollmentSemester: string, currentSemester: string): Grade | 'GRADUATED' {
  const yearsPassed = calculateYearDifference(enrollmentSemester, currentSemester)
  
  // 每年升一年级（每年只有一个学期）
  if (yearsPassed >= 3) {
    return 'GRADUATED'
  }
  
  const grades: Grade[] = ['一年级', '二年级', '三年级']
  return grades[yearsPassed] || '一年级'
}

/**
 * 检查学生是否应该毕业
 * @param enrollmentSemester 入学学期
 * @param currentSemester 当前学期
 * @returns 是否应该毕业
 */
export function shouldGraduate(enrollmentSemester: string, currentSemester: string): boolean {
  const yearsPassed = calculateYearDifference(enrollmentSemester, currentSemester)
  return yearsPassed >= 3 // 3年毕业
}

/**
 * 检查学生是否可以报名特定课程
 * @param studentGrade 学生当前年级
 * @param courseLevel 课程年级要求
 * @param studentGraduationStatus 学生毕业状态
 * @param courseRequiresGrades 课程是否需要年级管理
 * @param hasApprovedCourses 学生是否已有通过审核的课程
 * @returns 是否可以报名
 */
export function canEnrollCourse(
  studentGrade: string | null, 
  courseLevel: string, 
  studentGraduationStatus: string,
  courseRequiresGrades: boolean = true,
  hasApprovedCourses: boolean = false
): { canEnroll: boolean; reason?: string } {
  // 如果课程不需要年级管理，任何人都可以报名
  if (!courseRequiresGrades) {
    return { canEnroll: true }
  }
  
  // 毕业生可以报名任何课程（作为新的学习周期）
  if (studentGraduationStatus === 'GRADUATED' || studentGraduationStatus === 'ARCHIVED') {
    return { canEnroll: true }
  }
  
  // 如果学生没有任何通过审核的课程，可以报名任何年级课程（首次报名更灵活）
  if (!hasApprovedCourses) {
    return { canEnroll: true }
  }
  
  // 在读学生年级检查（仅当有通过审核课程时执行）
  if (!studentGrade) {
    return { canEnroll: false, reason: '学生年级信息缺失' }
  }
  
  // 定义年级等级（用于记录和统计，不再用于限制报名）
  const gradeLevel: Record<string, number> = {
    '一年级': 1,
    '二年级': 2,
    '三年级': 3
  }
  
  const studentLevel = gradeLevel[studentGrade]
  const courseGradeLevel = gradeLevel[courseLevel]
  
  // 🔧 移除年级限制：允许所有年级的学生报名任何年级的课程
  // 不再检查 studentLevel < courseGradeLevel 的限制
  
  // 所有年级学生都可以报名任何年级课程
  return { canEnroll: true }
}

/**
 * 检查是否允许跨学期重复报名
 * @param existingEnrollments 现有报名记录
 * @param newCourseId 新课程ID
 * @param newSemester 新学期
 * @returns 是否允许报名
 */
export function canEnrollSameCourseInDifferentSemester(
  existingEnrollments: Array<{ courseId: string; course: { semester?: string | null } }>,
  newCourseId: string,
  newSemester: string
): { canEnroll: boolean; reason?: string } {
  const sameCourseDifferentSemester = existingEnrollments.find(enrollment => 
    enrollment.courseId === newCourseId && 
    enrollment.course.semester !== newSemester
  )
  
  if (sameCourseDifferentSemester) {
    return { 
      canEnroll: true, 
      reason: `您在${sameCourseDifferentSemester.course.semester}已报名过此课程，当前为不同学期可以重复报名` 
    }
  }
  
  // 检查同学期同课程重复报名
  const sameCoursesSameSemester = existingEnrollments.find(enrollment =>
    enrollment.courseId === newCourseId && 
    enrollment.course.semester === newSemester
  )
  
  if (sameCoursesSameSemester) {
    return { 
      canEnroll: false, 
      reason: `您在${newSemester}已经报名过此课程` 
    }
  }
  
  return { canEnroll: true }
}

/**
 * 获取当前学期（每年只有一个学期）
 * @returns 当前学期字符串
 */
export function getCurrentSemester(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  // 每年只有一个秋季学期。9月后进入当年秋季，9月前仍属于上一年秋季学期。
  if (month >= 9) {
    return `${year}年秋季`
  } else {
    return `${year - 1}年秋季`
  }
}

/**
 * 获取下一个学期
 * @param currentSemester 当前学期
 * @returns 下一个学期字符串
 */
export function getNextSemester(currentSemester: string): string {
  const year = parseInt(currentSemester.match(/(\d{4})年/)?.[1] || '2025')
  return `${year + 1}年秋季`
}
