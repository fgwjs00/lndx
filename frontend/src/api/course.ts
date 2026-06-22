/**
 * 课程管理API服务
 * @description 处理课程相关的API请求
 */

import request from './request'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface Course {
  id: string
  classSectionId?: string | null
  classSectionCode?: string | null
  classSectionName?: string | null
  rosterId?: string | null
  rosterStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null
  name: string
  code: string
  description?: string
  category: string // 院系
  level: '一年级' | '二年级' | '三年级' // 年级
  credits: number
  hours: number
  capacity: number
  enrolled: number
  teacherId?: string
  teacher?: {
    id: string
    realName: string
  }
  startDate: string
  endDate: string
  schedule: {
    dayOfWeek: number
    startTime: string
    endTime: string
    classroom?: string
  }[]
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  requirements?: string[]
  materials?: string[]
  createdAt: string
  updatedAt?: string
  // 年龄限制相关字段
  hasAgeRestriction?: boolean
  minAge?: number | null
  maxAge?: number | null
  ageDescription?: string | null
  // 年级管理字段
  requiresGrades?: boolean // 是否需要年级管理
  gradeDescription?: string | null // 年级说明
  ageRestriction?: {
    enabled: boolean
    minAge?: number | null
    maxAge?: number | null
    description?: string | null
  }
}

export interface CourseQuery {
  page?: number
  pageSize?: number
  keyword?: string
  category?: string
  level?: string
  status?: string
  semester?: string
  teacherId?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface RosterManagementRow {
  classSectionId: string
  classSectionCode: string
  classSectionName: string
  classSectionStatus: string
  courseId: string
  courseName: string
  major: string
  grade?: string | null
  capacity: number
  semesterId: string
  semesterName: string
  academicYearId: string
  academicYearName: string
  rosterId?: string | null
  rosterStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null
  snapshotAt?: string | null
  publishedAt?: string | null
  activeMemberCount: number
  pendingApplicationCount: number
}

export interface RosterMemberRow {
  memberId: string
  memberStatus: string
  joinedAt: string
  leftAt?: string | null
  remarks?: string | null
  classSectionId: string
  classSectionName: string
  classSectionCode: string
  rosterId: string
  rosterStatus: string
  studentId: string
  studentName: string
  studentCode: string
  idNumber: string
  contactPhone?: string | null
  gender: string
  age: number
  major?: string | null
  sourceEnrollmentId?: string | null
  enrollmentCode?: string | null
  insuranceStart?: string | null
  insuranceEnd?: string | null
  approvedAt?: string | null
  sourceEnrollmentMetadata?: Record<string, any> | null
  reviewSnapshot?: Record<string, any> | null
}

export interface RosterManagementQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  semesterId?: string
  courseId?: string
}

export interface AcademicTerm {
  id: string
  code: string
  name: string
  isActive?: boolean
  isEnrollmentOpen?: boolean
  startsAt?: string | null
  endsAt?: string | null
}

export interface CreateSemesterRequest {
  name: string
  isActive?: boolean
  isEnrollmentOpen?: boolean
  startsAt?: string
  endsAt?: string
  semesterStartsAt?: string
  semesterEndsAt?: string
  enrollmentStartsAt?: string
  enrollmentEndsAt?: string
  requiredInsuranceStart?: string
  requiredInsuranceEnd?: string
}

export interface CreateCourseRequest {
  name: string
  code: string
  description?: string
  category: string // 院系
  level: '一年级' | '二年级' | '三年级' // 年级
  credits: number
  hours: number
  capacity: number
  teacherId?: string
  startDate: string
  endDate: string
  schedule: {
    dayOfWeek: number
    startTime: string
    endTime: string
    classroom?: string
  }[]
  requirements?: string[]
  materials?: string[]
  // 年龄限制相关字段
  hasAgeRestriction?: boolean
  minAge?: number | null
  maxAge?: number | null
  ageDescription?: string | null
}

export interface UpdateCourseRequest {
  name?: string
  description?: string
  category?: string // 院系
  level?: '一年级' | '二年级' | '三年级' // 年级
  credits?: number
  hours?: number
  capacity?: number
  teacherId?: string
  startDate?: string
  endDate?: string
  schedule?: {
    dayOfWeek: number
    startTime: string
    endTime: string
    classroom?: string
  }[]
  status?: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  requirements?: string[]
  materials?: string[]
}

export class CourseService {
  /**
   * 获取课程列表
   * @param params 查询参数
   * @returns 课程列表
   */
  static async getCourses(params: CourseQuery = {}): Promise<ApiResponse<PaginatedResponse<Course>>> {
    return request.get<PaginatedResponse<Course>>('/courses', params)
  }

  /**
   * 鑾峰彇鍏紑鎶ュ悕璇剧▼鍒楄〃
   * @param params 鏌ヨ鍙傛暟
   * @returns 璇剧▼鍒楄〃
   */
  static async getPublicCourses(params: CourseQuery = {}): Promise<ApiResponse<PaginatedResponse<Course>>> {
    return request.get<PaginatedResponse<Course>>('/public-registration/courses', params)
  }

  /**
   * 根据ID获取课程详情
   * @param id 课程ID
   * @returns 课程详情
   */
  static async getCourseById(id: string): Promise<ApiResponse<Course>> {
    return request.get<Course>(`/courses/${id}`)
  }

  /**
   * 创建课程
   * @param courseData 课程数据
   * @returns 创建结果
   */
  static async createCourse(courseData: CreateCourseRequest): Promise<ApiResponse<Course>> {
    return request.post<Course>('/courses', courseData)
  }

  /**
   * 更新课程信息
   * @param id 课程ID
   * @param courseData 课程数据
   * @returns 更新结果
   */
  static async updateCourse(id: string, courseData: UpdateCourseRequest): Promise<ApiResponse<Course>> {
    return request.put<Course>(`/courses/${id}`, courseData)
  }

  /**
   * 删除课程
   * @param id 课程ID
   * @returns 删除结果
   */
  static async deleteCourse(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/courses/${id}`)
  }

  /**
   * 🔧 新增：批量删除课程
   * @param courseIds 课程ID数组
   * @returns 删除结果
   */
  static async batchDeleteCourses(courseIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    return request.delete('/courses/batch', { data: { courseIds } })
  }

  static async freezeRosterSnapshot(classSectionId: string): Promise<ApiResponse<{
    rosterId: string
    memberCount: number
  }>> {
    return request.post(`/applications-v2/rosters/${classSectionId}/freeze`)
  }

  static async getRosterManagementList(query: RosterManagementQuery = {}): Promise<ApiResponse<PaginatedResponse<RosterManagementRow>>> {
    return request.get<PaginatedResponse<RosterManagementRow>>('/applications-v2/rosters', query)
  }

  static async getRosterMembers(classSectionId: string): Promise<ApiResponse<{
    roster: RosterManagementRow | null
    list: RosterMemberRow[]
  }>> {
    return request.get(`/applications-v2/rosters/${classSectionId}/members`)
  }

  static async exportRosterMembers(classSectionId: string, fileName?: string): Promise<void> {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/applications-v2/rosters/${classSectionId}/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })

    if (!response.ok) {
      throw new Error(`导出花名册失败: ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || `roster_${classSectionId}.csv`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 修改课程状态
   * @param id 课程ID
   * @param status 新状态
   * @returns 更新结果
   */
  static async changeCourseStatus(id: string, status: Course['status']): Promise<ApiResponse<Course>> {
    return request.patch<Course>(`/courses/${id}/status`, { status })
  }

  /**
   * 获取课程统计信息
   * @returns 统计信息
   */
  static async getCourseStats(): Promise<ApiResponse<{
    total: number
    published: number
    ongoing: number
    completed: number
    totalStudents: number
    averageRating: number
  }>> {
    return request.get('/courses/stats')
  }

  /**
   * 获取可用学期列表
   * @returns 学期列表
   */
  static async getSemesters(): Promise<ApiResponse<string[]>> {
    return request.get('/courses/semesters')
  }

  static async createSemester(data: CreateSemesterRequest): Promise<ApiResponse<{
    academicYear: AcademicTerm
    semester: AcademicTerm
  }>> {
    return request.post('/courses/semesters', data)
  }

  static async syncSemesterClassSections(semester: string): Promise<ApiResponse<{
    semester: AcademicTerm
    courseCount: number
    createdCount: number
    updatedCount: number
    skippedCount: number
  }>> {
    return request.post('/courses/semesters/sync-class-sections', { semester })
  }

  /**
   * 鑾峰彇鍏紑鎶ュ悕瀛︽湡鍒楄〃
   * @returns 瀛︽湡鍒楄〃
   */
  static async getPublicSemesters(): Promise<ApiResponse<string[]>> {
    return request.get('/public-registration/semesters')
  }

  /**
   * 获取课程分类列表 (动态获取)
   * @returns 分类列表
   */
  static async getCategories(): Promise<ApiResponse<string[]>> {
    return request.get('/courses/categories')
  }

  /**
   * 批量导入课程
   * @param file Excel或CSV文件
   * @returns 导入结果
   */
  static async batchImportCourses(file: File): Promise<ApiResponse<{
    totalRows: number
    successCount: number
    errorCount: number
    errors: string[]
    results: Array<{
      rowNum: number
      courseName: string
      success: boolean
      courseId?: string
    }>
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    
    return request.post('/courses/batch-import', formData)
  }

  /**
   * 下载课程导入模板
   * @returns Excel模板文件
   */
  static async downloadImportTemplate(): Promise<Blob> {
    const response = await fetch('/api/courses/import-template', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('模板下载失败')
    }
    
    return response.blob()
  }

  /**
   * 导出课程数据
   * @param params 查询参数
   * @returns 导出结果
   */
  static async exportCourses(params: CourseQuery = {}): Promise<Blob> {
    const response = await fetch(`/api/courses/export?${new URLSearchParams(params as any)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.blob()
  }
}
