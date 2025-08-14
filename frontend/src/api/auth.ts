/**
 * 认证API服务
 * @module api/auth
 */
import request from './request'
import type { ApiResponse } from '@/types'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateTeacherRequest,
  UserInfo,
  ResetPasswordRequest,
  ResetPasswordWithCodeRequest,
  ResetPasswordConfirmRequest,
  ChangePasswordRequest,
  CaptchaResponse,
  RefreshTokenRequest,
  UpdateProfileRequest,
  SmsCodeRequest,
  SmsCodeVerifyRequest
} from '@/types/auth'

/**
 * 认证API服务
 */
export class AuthService {
  /**
   * 用户登录
   * @param data 登录数据
   * @returns 登录响应
   */
  static async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return request.post<LoginResponse>('/auth/login', data)
  }

  /**
   * 学生注册
   * @param data 注册数据
   * @returns 注册响应
   */
  static async register(data: RegisterRequest): Promise<ApiResponse<UserInfo>> {
    return request.post<UserInfo>('/auth/register', data)
  }

  /**
   * 管理员添加教师
   * @param data 教师数据
   * @returns 创建响应
   */
  static async createTeacher(data: CreateTeacherRequest): Promise<ApiResponse<UserInfo>> {
    return request.post<UserInfo>('/auth/teacher', data)
  }

  /**
   * 用户登出
   * @returns 登出响应
   */
  static async logout(): Promise<ApiResponse<void>> {
    return request.post<void>('/auth/logout')
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  static async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    return request.get<UserInfo>('/auth/me')
  }

  /**
   * 刷新访问令牌
   * @param data 刷新令牌数据
   * @returns 新的令牌信息
   */
  static async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<LoginResponse>> {
    return request.post<LoginResponse>('/auth/refresh', data)
  }

  /**
   * 获取验证码
   * @returns 验证码信息
   */
  static async getCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
    return request.get<CaptchaResponse>('/auth/captcha')
  }

  /**
   * 发送短信验证码
   * @param data 短信验证码请求数据
   * @returns 操作结果
   */
  static async sendSmsCode(data: SmsCodeRequest): Promise<ApiResponse<void>> {
    return request.post<void>('/auth/sms-code', data)
  }

  /**
   * 验证短信验证码
   * @param data 短信验证码验证数据
   * @returns 验证结果
   */
  static async verifySmsCode(data: SmsCodeVerifyRequest): Promise<ApiResponse<{ valid: boolean }>> {
    return request.post<{ valid: boolean }>('/auth/sms-code/verify', data)
  }

  /**
   * 发送密码重置短信
   * @param data 重置密码请求数据
   * @returns 操作结果
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return request.post<void>('/auth/reset-password', data)
  }

  /**
   * 通过验证码重置密码
   * @param data 验证码重置密码请求数据
   * @returns 操作结果
   */
  static async resetPasswordWithCode(data: ResetPasswordWithCodeRequest): Promise<ApiResponse<void>> {
    return request.post<void>('/auth/reset-password/code', data)
  }

  /**
   * 确认密码重置
   * @param data 密码重置确认数据
   * @returns 操作结果
   */
  static async resetPasswordConfirm(data: ResetPasswordConfirmRequest): Promise<ApiResponse<void>> {
    return request.post<void>('/auth/reset-password/confirm', data)
  }

  /**
   * 修改密码
   * @param data 修改密码数据
   * @returns 操作结果
   */
  static async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return request.post<void>('/auth/change-password', data)
  }

  /**
   * 更新用户资料
   * @param data 用户资料数据
   * @returns 更新后的用户信息
   */
  static async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserInfo>> {
    return request.put<UserInfo>('/auth/profile', data)
  }

  /**
   * 上传用户头像
   * @param file 头像文件
   * @param onProgress 上传进度回调
   * @returns 头像URL
   */
  static async uploadAvatar(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string }>> {
    return request.upload<{ url: string }>('/auth/avatar', file, onProgress)
  }

  /**
   * 获取用户权限列表
   * @returns 权限列表
   */
  static async getUserPermissions(): Promise<ApiResponse<string[]>> {
    return request.get<string[]>('/auth/permissions')
  }

  /**
   * 检查手机号是否可用
   * @param phone 手机号
   * @returns 可用性检查结果
   */
  static async checkPhone(phone: string): Promise<ApiResponse<{ available: boolean }>> {
    return request.get<{ available: boolean }>(`/auth/check-phone?phone=${phone}`)
  }

  /**
   * 检查邮箱是否可用
   * @param email 邮箱
   * @returns 可用性检查结果
   */
  static async checkEmail(email: string): Promise<ApiResponse<{ available: boolean }>> {
    return request.get<{ available: boolean }>(`/auth/check-email?email=${email}`)
  }

  /**
   * 获取教师列表（管理员功能）
   * @param params 查询参数
   * @returns 教师列表
   */
  static async getTeacherList(params?: {
    page?: number
    pageSize?: number
    keyword?: string
  }): Promise<ApiResponse<{
    list: UserInfo[]
    total: number
    page: number
    pageSize: number
  }>> {
    return request.get<{
      list: UserInfo[]
      total: number
      page: number
      pageSize: number
    }>('/auth/teachers', { params })
  }

  /**
   * 更新教师信息（管理员功能）
   * @param id 教师ID
   * @param data 更新数据
   * @returns 更新后的教师信息
   */
  static async updateTeacher(id: number, data: Partial<CreateTeacherRequest>): Promise<ApiResponse<UserInfo>> {
    return request.put<UserInfo>(`/auth/teacher/${id}`, data)
  }

  /**
  * 删除教师（管理员功能）  
   * @param id 教师ID
   * @returns 操作结果
   */
  static async deleteTeacher(id: number): Promise<ApiResponse<void>> {
    return request.delete<void>(`/auth/teacher/${id}`)
  }

  /**
  * 重置教师密码（管理员功能）
   * @param id 教师ID
   * @param newPassword 新密码
   * @returns 操作结果
   */
  static async resetTeacherPassword(id: number, newPassword: string): Promise<ApiResponse<void>> {
    return request.post<void>(`/auth/teacher/${id}/reset-password`, { newPassword })
  }
}

// 导出默认实例
export default AuthService 
