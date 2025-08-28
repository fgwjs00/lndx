/**
 * 用户管理API服务
 * @description 处理用户相关的API请求
 */

import request from './request'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { 
  User, 
  UserQuery, 
  CreateUserRequest, 
  UpdateUserRequest,
  UserRole 
} from '@/types/models'

// 重新导出类型供其他组件使用
export type { User, UserQuery, CreateUserRequest, UpdateUserRequest, UserRole }

/**
 * 用户管理API服务
 */
export class UserService {
  /**
   * 获取用户列表
   * @param params 查询参数
   * @returns 用户列表
   */
  static async getUsers(params: UserQuery = {}): Promise<ApiResponse<PaginatedResponse<User>>> {
    return request.get<PaginatedResponse<User>>('/users', params)
  }

  /**
   * 根据ID获取用户详情
   * @param id 用户ID
   * @returns 用户详情
   */
  static async getUserById(id: string): Promise<ApiResponse<User>> {
    return request.get<User>(`/users/${id}`)
  }

  /**
   * 创建用户
   * @param userData 用户数据
   * @returns 创建结果
   */
  static async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return request.post<User>('/users', userData)
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param userData 用户数据
   * @returns 更新结果
   */
  static async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return request.put<User>(`/users/${id}`, userData)
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  static async deleteUser(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/users/${id}`)
  }

  /**
   * 启用/禁用用户
   * @param id 用户ID
   * @param isActive 是否启用
   * @returns 更新结果
   */
  static async toggleUserStatus(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    return request.patch<User>(`/users/${id}/status`, { isActive })
  }

  /**
   * 修改用户角色
   * @param id 用户ID
   * @param role 新角色
   * @returns 更新结果
   */
  static async changeUserRole(id: string, role: User['role']): Promise<ApiResponse<User>> {
    return request.patch<User>(`/users/${id}/role`, { role })
  }

  /**
   * 重置用户密码
   * @param id 用户ID
   * @param newPassword 新密码
   * @returns 重置结果
   */
  static async resetPassword(id: string, newPassword: string): Promise<ApiResponse<null>> {
    return request.post<null>(`/users/${id}/reset-password`, { newPassword })
  }
}

