/**
 * 报名申请API服务
 * @description 处理学员报名申请的相关接口
 */

import request from './request'
import type { 
  Application, 
  ApplicationStatus, 
  StudentInfo, 
  PaginatedResponse, 
  SearchFilters,
  ApiResponse 
} from '@/types'

/**
 * 报名申请API服务
 */
export class ApplicationService {
  /**
   * 获取报名申请列表
   * @param filters 搜索筛选条件
   * @returns 分页的报名申请列表
   */
  static async getApplicationList(filters: SearchFilters = {}): Promise<ApiResponse<PaginatedResponse<Application>>> {
    return request.get<PaginatedResponse<Application>>('/applications', filters)
  }

  /**
   * 获取报名申请详情
   * @param id 申请ID
   * @returns 报名申请详情
   */
  static async getApplicationDetail(id: number): Promise<ApiResponse<Application>> {
    return request.get<Application>(`/applications/${id}`)
  }

  /**
   * 提交报名申请
   * @param studentInfo 学员信息
   * @param courseId 课程ID
   * @returns 创建的报名申请
   */
  static async submitApplication(studentInfo: Omit<StudentInfo, 'id' | 'createdAt' | 'updatedAt'>, courseId: number): Promise<ApiResponse<Application>> {
    const applicationData = {
      studentInfo,
      courseId,
      applicationDate: new Date().toISOString(),
      status: 'pending' as ApplicationStatus
    }
    return request.post<Application>('/applications', applicationData)
  }

  /**
   * 更新报名申请
   * @param id 申请ID
   * @param data 更新数据
   * @returns 更新后的报名申请
   */
  static async updateApplication(id: number, data: Partial<Application>): Promise<ApiResponse<Application>> {
    return request.put<Application>(`/applications/${id}`, data)
  }

  /**
   * 删除报名申请
   * @param id 申请ID
   * @returns 删除结果
   */
  static async deleteApplication(id: number): Promise<ApiResponse<void>> {
    return request.delete<void>(`/applications/${id}`)
  }

  /**
   * 批量删除报名申请
   * @param ids 申请ID数组
   * @returns 删除结果
   */
  static async batchDeleteApplications(ids: number[]): Promise<ApiResponse<void>> {
    return request.post<void>('/applications/batch-delete', { ids })
  }

  /**
   * 审核报名申请
   * @param id 申请ID
   * @param status 审核状态
   * @param comments 审核意见
   * @returns 审核结果
   */
  static async reviewApplication(
    id: number, 
    status: ApplicationStatus, 
    comments?: string
  ): Promise<ApiResponse<Application>> {
    return request.post<Application>(`/applications/${id}/review`, {
      status,
      comments,
      reviewDate: new Date().toISOString()
    })
  }

  /**
   * 批量审核报名申请
   * @param ids 申请ID数组
   * @param status 审核状态
   * @param comments 审核意见
   * @returns 批量审核结果
   */
  static async batchReviewApplications(
    ids: number[], 
    status: ApplicationStatus, 
    comments?: string
  ): Promise<ApiResponse<void>> {
    return request.post<void>('/applications/batch-review', {
      ids,
      status,
      comments,
      reviewDate: new Date().toISOString()
    })
  }

  /**
   * 获取我的报名申请（学员用）
   * @param filters 搜索筛选条件
   * @returns 当前用户的报名申请列表
   */
  static async getMyApplications(filters: SearchFilters = {}): Promise<ApiResponse<PaginatedResponse<Application>>> {
    return request.get<PaginatedResponse<Application>>('/applications/my', filters)
  }

  /**
   * 取消报名申请
   * @param id 申请ID
   * @returns 取消结果
   */
  static async cancelApplication(id: number): Promise<ApiResponse<Application>> {
    return request.post<Application>(`/applications/${id}/cancel`)
  }

  /**
   * 获取报名统计数据
   * @returns 报名统计信息
   */
  static async getApplicationStatistics(): Promise<ApiResponse<{
    total: number
    pending: number
    approved: number
    rejected: number
    cancelled: number
    monthlyStats: Array<{ month: string; count: number }>
    courseStats: Array<{ courseName: string; count: number }>
  }>> {
    return request.get('/applications/statistics')
  }

  /**
   * 导出报名申请数据
   * @param filters 导出筛选条件
   * @returns 导出文件URL
   */
  static async exportApplications(filters: SearchFilters = {}): Promise<ApiResponse<{ url: string }>> {
    return request.post<{ url: string }>('/applications/export', filters)
  }

  /**
   * 上传学员照片
   * @param file 照片文件
   * @param onProgress 上传进度回调
   * @returns 上传结果
   */
  static async uploadStudentPhoto(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string }>> {
    return request.upload<{ url: string }>('/applications/upload-photo', file, onProgress)
  }

  /**
   * 检查身份证号是否已存在
   * @param idNumber 身份证号
   * @returns 检查结果
   */
  static async checkIdNumberExists(idNumber: string): Promise<ApiResponse<{ exists: boolean }>> {
    return request.get<{ exists: boolean }>('/applications/check-id', { idNumber })
  }

  /**
   * 获取可报名的课程列表
   * @returns 可报名课程列表
   */
  static async getAvailableCourses(): Promise<ApiResponse<Array<{
    id: number
    name: string
    description: string
    teacher: string
    capacity: number
    enrolled: number
    fee: number
    schedule: string
    startDate: string
    endDate: string
  }>>> {
    return request.get('/applications/available-courses')
  }

  /**
   * 验证报名表单数据
   * @param data 表单数据
   * @returns 验证结果
   */
  static async validateApplicationForm(data: Partial<StudentInfo>): Promise<ApiResponse<{
    valid: boolean
    errors: Array<{ field: string; message: string }>
  }>> {
    return request.post('/applications/validate', data)
  }
}

// 导出默认实例
export default ApplicationService 
