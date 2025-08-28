/**
 * 学生管理API服务
 * @description 处理学生相关的API请求
 */

import request from './request'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { 
  Student, 
  StudentQuery, 
  CreateStudentRequest,
  UpdateStudentRequest
} from '@/types/models'

// Re-export the types for convenience
export type { Student, StudentQuery, CreateStudentRequest, UpdateStudentRequest } from '@/types/models'

/**
 * 学生管理API服务
 */
export class StudentService {
  /**
   * 获取学生列表
   * @param params 查询参数
   * @returns 学生列表
   */
  static async getStudents(params: StudentQuery = {}): Promise<ApiResponse<PaginatedResponse<Student>>> {
    return request.get<PaginatedResponse<Student>>('/students', params)
  }

  /**
   * 获取学生统计信息
   * @returns 学生统计数据
   */
  static async getStudentStats(): Promise<ApiResponse<{
    totalStudents: number
    activeStudents: number
    inactiveStudents: number
    graduatedStudents: number
    newStudentsThisMonth: number
  }>> {
    return request.get('/students/statistics')
  }

  /**
   * 获取专业列表
   * @returns 专业列表
   */
  static async getMajors(): Promise<ApiResponse<string[]>> {
    return request.get('/students/majors')
  }

  /**
   * 获取学期列表
   * @returns 学期列表
   */
  static async getSemesters(): Promise<ApiResponse<string[]>> {
    return request.get('/students/semesters')
  }

  /**
   * 获取学生详情
   * @param id 学生ID
   * @returns 学生详情
   */
  static async getStudentDetail(id: string): Promise<ApiResponse<Student>> {
    return request.get(`/students/${id}`)
  }

  /**
   * 更新学生信息
   * @param id 学生ID
   * @param data 更新数据
   * @returns 更新结果
   */
  static async updateStudent(id: string, data: Partial<Student>): Promise<ApiResponse<Student>> {
    return request.put(`/students/${id}`, data)
  }

  /**
   * 删除学生（软删除）
   * @param id 学生ID
   * @returns 删除结果
   */
  static async deleteStudent(id: string): Promise<ApiResponse<{ message: string }>> {
    return request.delete(`/students/${id}`)
  }



  /**
   * 创建学生
   * @param studentData 学生数据
   * @returns 创建结果
   */
  static async createStudent(studentData: CreateStudentRequest): Promise<ApiResponse<Student>> {
    return request.post<Student>('/students', studentData)
  }

  /**
   * 修改学生状态
   * @param id 学生ID
   * @param status 新状态
   * @returns 更新结果
   */
  static async changeStudentStatus(id: string, status: Student['status']): Promise<ApiResponse<Student>> {
    return request.patch<Student>(`/students/${id}/status`, { status })
  }

  /**
   * 批量导入学生
   * @param students 学生数据列表
   * @returns 导入结果
   */
  static async batchImportStudents(students: CreateStudentRequest[]): Promise<ApiResponse<{
    success: number
    failed: number
    errors: string[]
  }>> {
    return request.post('/students/batch-import', { students })
  }

  /**
   * 导出学生数据
   * @param params 查询参数
   * @returns 导出结果
   */
  static async exportStudents(params: StudentQuery = {}): Promise<Blob> {
    // 使用request工具的基础配置，但需要处理blob响应
    const token = localStorage.getItem('token')
    const searchParams = new URLSearchParams()
    
    // 构建查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    
    const response = await fetch(`/api/students/export?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`导出失败: ${response.status} ${response.statusText}`)
    }
    
    return response.blob()
  }

  /**
   * 更新学生选课
   * @param studentId 学生ID
   * @param selectedCourses 选择的课程ID列表
   * @returns 更新结果
   */
  static async updateStudentCourses(studentId: string, selectedCourses: string[]): Promise<ApiResponse<{
    studentId: string
    removedCount: number
    addedCount: number
    totalCourses: number
    addedCourses: Array<{ id: string; name: string }>
  }>> {
    return request.put(`/students/${studentId}/courses`, { selectedCourses })
  }
}

