/**
 * 全文搜索服务
 * @description 基于PostgreSQL的全文搜索功能
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '@/utils/logger'

const prisma = new PrismaClient()

/**
 * 搜索结果接口
 */
interface SearchResult {
  type: 'student' | 'course' | 'teacher'
  id: string
  title: string
  subtitle: string
  description?: string
  avatar?: string
  relevanceScore?: number
}

/**
 * 搜索统计接口
 */
interface SearchStats {
  totalResults: number
  searchTime: number
  breakdown: {
    students: number
    courses: number
    teachers: number
  }
}

/**
 * 综合搜索服务类
 */
class SearchService {
  /**
   * 全局搜索
   * @param keyword 搜索关键词
   * @param options 搜索选项
   */
  async globalSearch(
    keyword: string,
    options: {
      limit?: number
      types?: ('student' | 'course' | 'teacher')[]
      includeInactive?: boolean
    } = {}
  ): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    const startTime = Date.now()
    const { limit = 20, types = ['student', 'course', 'teacher'], includeInactive = false } = options

    try {
      // 并行搜索所有类型
      const [students, courses, teachers] = await Promise.all([
        types.includes('student') ? this.searchStudents(keyword, { limit: Math.ceil(limit / types.length), includeInactive }) : [],
        types.includes('course') ? this.searchCourses(keyword, { limit: Math.ceil(limit / types.length), includeInactive }) : [],
        types.includes('teacher') ? this.searchTeachers(keyword, { limit: Math.ceil(limit / types.length), includeInactive }) : []
      ])

      // 合并结果并按相关性排序
      const allResults = [...students, ...courses, ...teachers]
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, limit)

      const searchTime = Date.now() - startTime

      return {
        results: allResults,
        stats: {
          totalResults: allResults.length,
          searchTime,
          breakdown: {
            students: students.length,
            courses: courses.length,
            teachers: teachers.length
          }
        }
      }
    } catch (error) {
      logger.error('全局搜索失败:', error)
      throw error
    }
  }

  /**
   * 搜索学生
   */
  private async searchStudents(
    keyword: string,
    options: { limit?: number; includeInactive?: boolean } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, includeInactive = false } = options

    try {
      const students = await prisma.student.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: keyword } }, // Student模型使用name字段
                { studentCode: { contains: keyword } },
                { contactPhone: { contains: keyword } }
              ]
            },
            includeInactive ? {} : { isActive: true }
          ]
        },
        take: limit,
        orderBy: {
          updatedAt: 'desc'
        }
      })

      return students.map(student => ({
        type: 'student' as const,
        id: student.id,
        title: student.name, // Student模型使用name字段
        subtitle: `学号: ${student.studentCode}`,
        description: student.major || '暂无专业信息',
        avatar: student.photo || undefined,
        relevanceScore: this.calculateRelevanceScore(keyword, student.name)
      }))
    } catch (error) {
      logger.error('搜索学生失败:', error)
      return []
    }
  }

  /**
   * 搜索课程
   */
  private async searchCourses(
    keyword: string,
    options: { limit?: number; includeInactive?: boolean } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, includeInactive = false } = options

    try {
      const courses = await prisma.course.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: keyword } }, // Course模型使用name字段
                { category: { contains: keyword } },
                { description: { contains: keyword } }
              ]
            },
            includeInactive ? {} : { isActive: true }
          ]
        },
        take: limit,
        orderBy: {
          updatedAt: 'desc'
        }
      })

      return courses.map(course => ({
        type: 'course' as const,
        id: course.id,
        title: course.name, // Course模型使用name字段
        subtitle: `分类: ${course.category}`,
        description: course.description || undefined,
        relevanceScore: this.calculateRelevanceScore(keyword, course.name)
      }))
    } catch (error) {
      logger.error('搜索课程失败:', error)
      return []
    }
  }

  /**
   * 搜索教师
   */
  private async searchTeachers(
    keyword: string,
    options: { limit?: number; includeInactive?: boolean } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, includeInactive = false } = options

    try {
      const teachers = await prisma.teacher.findMany({
        where: {
          AND: [
            {
              OR: [
                { realName: { contains: keyword } }, // Teacher模型使用realName字段
                { phone: { contains: keyword } },
                { email: { contains: keyword } }
              ]
            },
            includeInactive ? {} : { isActive: true }
          ]
        },
        take: limit,
        orderBy: {
          updatedAt: 'desc'
        }
      })

      return teachers.map(teacher => ({
        type: 'teacher' as const,
        id: teacher.id,
        title: teacher.realName, // Teacher模型使用realName字段
        subtitle: `工号: ${teacher.teacherCode}`,
        description: teacher.specialties.join(', ') || '暂无专业信息',
        relevanceScore: this.calculateRelevanceScore(keyword, teacher.realName)
      }))
    } catch (error) {
      logger.error('搜索教师失败:', error)
      return []
    }
  }

  /**
   * 搜索建议（自动完成）
   */
  async searchSuggestions(
    keyword: string,
    options: { limit?: number } = {}
  ): Promise<string[]> {
    const { limit = 10 } = options

    if (!keyword || keyword.length < 2) {
      return []
    }

    try {
      // 并行搜索各类型的名称
      const [students, courses, teachers] = await Promise.all([
        prisma.student.findMany({
          where: { name: { startsWith: keyword } }, // Student模型使用name字段
          select: { name: true },
          take: limit
        }),
        prisma.course.findMany({
          where: { name: { startsWith: keyword } }, // Course模型使用name字段
          select: { name: true },
          take: limit
        }),
        prisma.teacher.findMany({
          where: { realName: { startsWith: keyword } }, // Teacher模型使用realName字段
          select: { realName: true },
          take: limit
        })
      ])

      // 合并并去重
      const suggestions = Array.from(new Set([
        ...students.map(s => s.name),
        ...courses.map(c => c.name),
        ...teachers.map(t => t.realName)
      ])).slice(0, limit)

      return suggestions
    } catch (error) {
      logger.error('搜索建议失败:', error)
      return []
    }
  }

  /**
   * 计算相关性得分
   */
  private calculateRelevanceScore(keyword: string, text: string): number {
    if (!keyword || !text) return 0

    const lowerKeyword = keyword.toLowerCase()
    const lowerText = text.toLowerCase()

    // 完全匹配得分最高
    if (lowerText === lowerKeyword) return 100

    // 开头匹配得分较高
    if (lowerText.startsWith(lowerKeyword)) return 80

    // 包含匹配得分中等
    if (lowerText.includes(lowerKeyword)) return 60

    // 模糊匹配得分较低
    const distance = this.levenshteinDistance(lowerKeyword, lowerText)
    const maxLength = Math.max(lowerKeyword.length, lowerText.length)
    const similarity = 1 - distance / maxLength

    return Math.round(similarity * 40)
  }

  /**
   * 计算编辑距离（Levenshtein距离）
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }
  /**
   * 获取热门搜索词
   */
  async getHotSearchTerms(limit: number = 10): Promise<string[]> {
    // 简化实现，返回一些常用搜索词
    return [
      '数学', '语文', '英语', '物理', '化学', 
      '音乐', '美术', '体育', '计算机', '历史'
    ].slice(0, limit)
  }
}

export const searchService = new SearchService()