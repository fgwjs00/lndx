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
      const results: SearchResult[] = []
      const breakdown = { students: 0, courses: 0, teachers: 0 }

      // 如果使用PostgreSQL，使用全文搜索
      if (process.env.DATABASE_URL?.includes('postgresql')) {
        // 搜索学生
        if (types.includes('student')) {
          const students = await this.searchStudentsFullText(keyword, limit, includeInactive)
          results.push(...students)
          breakdown.students = students.length
        }

        // 搜索课程
        if (types.includes('course')) {
          const courses = await this.searchCoursesFullText(keyword, limit, includeInactive)
          results.push(...courses)
          breakdown.courses = courses.length
        }

        // 搜索教师
        if (types.includes('teacher')) {
          const teachers = await this.searchTeachersFullText(keyword, limit, includeInactive)
          results.push(...teachers)
          breakdown.teachers = teachers.length
        }
      } else {
        // MySQL降级到LIKE查询
        if (types.includes('student')) {
          const students = await this.searchStudentsLike(keyword, limit, includeInactive)
          results.push(...students)
          breakdown.students = students.length
        }

        if (types.includes('course')) {
          const courses = await this.searchCoursesLike(keyword, limit, includeInactive)
          results.push(...courses)
          breakdown.courses = courses.length
        }

        if (types.includes('teacher')) {
          const teachers = await this.searchTeachersLike(keyword, limit, includeInactive)
          results.push(...teachers)
          breakdown.teachers = teachers.length
        }
      }

      // 按相关度排序
      results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

      const searchTime = Date.now() - startTime
      const stats: SearchStats = {
        totalResults: results.length,
        searchTime,
        breakdown
      }

      logger.info('全局搜索执行', {
        keyword,
        totalResults: results.length,
        searchTime,
        types
      })

      return { results: results.slice(0, limit), stats }
    } catch (error) {
      logger.error('全局搜索失败', error)
      throw error
    }
  }

  /**
   * PostgreSQL全文搜索 - 学生
   */
  private async searchStudentsFullText(
    keyword: string,
    limit: number,
    includeInactive: boolean
  ): Promise<SearchResult[]> {
    const query = `
      SELECT s.id, s.real_name, s.student_code, s.contact_phone,
             ts_rank(
               to_tsvector('simple', s.real_name || ' ' || s.student_code || ' ' || s.contact_phone),
               to_tsquery('simple', $1)
             ) as rank
      FROM students s
      WHERE to_tsvector('simple', s.real_name || ' ' || s.student_code || ' ' || s.contact_phone) 
            @@ to_tsquery('simple', $1)
      ${includeInactive ? '' : 'AND s.is_active = true'}
      ORDER BY rank DESC
      LIMIT $2
    `

    const results = await prisma.$queryRaw<any[]>`${query}` 

    return results.map(row => ({
      type: 'student' as const,
      id: row.id,
      title: row.real_name,
      subtitle: `学号: ${row.student_code}`,
      description: `电话: ${row.contact_phone}`,
      relevanceScore: parseFloat(row.rank)
    }))
  }

  /**
   * PostgreSQL全文搜索 - 课程
   */
  private async searchCoursesFullText(
    keyword: string,
    limit: number,
    includeInactive: boolean
  ): Promise<SearchResult[]> {
    const query = `
      SELECT c.id, c.name, c.course_code, c.category, c.description,
             ts_rank(
               to_tsvector('simple', c.name || ' ' || c.course_code || ' ' || c.category || ' ' || COALESCE(c.description, '')),
               to_tsquery('simple', $1)
             ) as rank
      FROM courses c
      WHERE to_tsvector('simple', c.name || ' ' || c.course_code || ' ' || c.category || ' ' || COALESCE(c.description, '')) 
            @@ to_tsquery('simple', $1)
      ${includeInactive ? '' : 'AND c.is_active = true'}
      ORDER BY rank DESC
      LIMIT $2
    `

    const results = await prisma.$queryRaw<any[]>`${query}`

    return results.map(row => ({
      type: 'course' as const,
      id: row.id,
      title: row.name,
      subtitle: `课程编号: ${row.course_code} | ${row.category}`,
      description: row.description,
      relevanceScore: parseFloat(row.rank)
    }))
  }

  /**
   * PostgreSQL全文搜索 - 教师
   */
  private async searchTeachersFullText(
    keyword: string,
    limit: number,
    includeInactive: boolean
  ): Promise<SearchResult[]> {
    const query = `
      SELECT t.id, t.real_name, t.teacher_code, t.phone, 
             array_to_string(t.specialties, ' ') as specialties_str,
             ts_rank(
               to_tsvector('simple', t.real_name || ' ' || t.teacher_code || ' ' || t.phone || ' ' || array_to_string(t.specialties, ' ')),
               to_tsquery('simple', $1)
             ) as rank
      FROM teachers t
      WHERE to_tsvector('simple', t.real_name || ' ' || t.teacher_code || ' ' || t.phone || ' ' || array_to_string(t.specialties, ' ')) 
            @@ to_tsquery('simple', $1)
      ${includeInactive ? '' : 'AND t.is_active = true'}
      ORDER BY rank DESC
      LIMIT $2
    `

    const results = await prisma.$queryRaw<any[]>`${query}`

    return results.map(row => ({
      type: 'teacher' as const,
      id: row.id,
      title: row.real_name,
      subtitle: `工号: ${row.teacher_code}`,
      description: `专业: ${row.specialties_str} | 电话: ${row.phone}`,
      relevanceScore: parseFloat(row.rank)
    }))
  }

  /**
   * MySQL LIKE查询降级方案 - 学生
   */
  private async searchStudentsLike(
    keyword: string,
    limit: number,
    includeInactive: boolean
  ): Promise<SearchResult[]> {
    const students = await prisma.student.findMany({
      where: {
        AND: [
          {
            OR: [
              { realName: { contains: keyword } },
              { studentCode: { contains: keyword } },
              { contactPhone: { contains: keyword } }
            ]
          },
          includeInactive ? {} : { isActive: true }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return students.map(student => ({
      type: 'student' as const,
      id: student.id,
      title: student.realName,
      subtitle: `学号: ${student.studentCode}`,
      description: `电话: ${student.contactPhone}`,
      relevanceScore: 0.5 // 固定相关度
    }))
  }

  /**
   * MySQL LIKE查询降级方案 - 课程
   */
  private async searchCoursesLike(
    keyword: string,
    limit: number,
    includeInactive: boolean
  ): Promise<SearchResult[]> {
    const courses = await prisma.course.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: keyword } },
              { courseCode: { contains: keyword } },
              { category: { contains: keyword } },
              { description: { contains: keyword } }
            ]
          },
          includeInactive ? {} : { isActive: true }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return courses.map(course => ({
      type: 'course' as const,
      id: course.id,
      title: course.name,
      subtitle: `课程编号: ${course.courseCode} | ${course.category}`,
      description: course.description,
      relevanceScore: 0.5
    }))
  }

  /**
   * MySQL LIKE查询降级方案 - 教师
   */
  private async searchTeachersLike(
    keyword: string,
    limit: number,
    includeInactive: boolean
  ): Promise<SearchResult[]> {
    const teachers = await prisma.teacher.findMany({
      where: {
        AND: [
          {
            OR: [
              { realName: { contains: keyword } },
              { teacherCode: { contains: keyword } },
              { phone: { contains: keyword } }
            ]
          },
          includeInactive ? {} : { isActive: true }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return teachers.map(teacher => ({
      type: 'teacher' as const,
      id: teacher.id,
      title: teacher.realName,
      subtitle: `工号: ${teacher.teacherCode}`,
      description: `电话: ${teacher.phone}`,
      relevanceScore: 0.5
    }))
  }

  /**
   * 搜索建议
   * @param keyword 关键词前缀
   * @param limit 限制数量
   */
  async searchSuggestions(keyword: string, limit: number = 10): Promise<string[]> {
    if (!keyword || keyword.length < 2) return []

    try {
      if (process.env.DATABASE_URL?.includes('postgresql')) {
        // PostgreSQL三角相似度搜索
        const query = `
          SELECT DISTINCT suggestion, similarity(suggestion, $1) as sim
          FROM (
            SELECT real_name as suggestion FROM students WHERE real_name % $1
            UNION
            SELECT name as suggestion FROM courses WHERE name % $1
            UNION
            SELECT real_name as suggestion FROM teachers WHERE real_name % $1
          ) suggestions
          WHERE sim > 0.3
          ORDER BY sim DESC
          LIMIT $2
        `

        const results = await prisma.$queryRaw<{ suggestion: string }[]>`${query}`
        return results.map(r => r.suggestion)
      } else {
        // MySQL简单前缀匹配
        const students = await prisma.student.findMany({
          where: { realName: { startsWith: keyword } },
          select: { realName: true },
          take: Math.ceil(limit / 3)
        })

        const courses = await prisma.course.findMany({
          where: { name: { startsWith: keyword } },
          select: { name: true },
          take: Math.ceil(limit / 3)
        })

        const teachers = await prisma.teacher.findMany({
          where: { realName: { startsWith: keyword } },
          select: { realName: true },
          take: Math.ceil(limit / 3)
        })

        const suggestions = [
          ...students.map(s => s.realName),
          ...courses.map(c => c.name),
          ...teachers.map(t => t.realName)
        ]

        return [...new Set(suggestions)].slice(0, limit)
      }
    } catch (error) {
      logger.error('搜索建议失败', error)
      return []
    }
  }

  /**
   * 热门搜索词
   */
  async getHotSearchTerms(limit: number = 10): Promise<string[]> {
    // 这里可以基于搜索日志统计
    // 暂时返回固定的热门搜索词
    return ['舞蹈', '钢琴', '声乐', '美术', '书法', '古筝', '小提琴', '架子鼓']
  }
}

// 导出单例
export const searchService = new SearchService()
export default searchService

