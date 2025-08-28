/**
 * 角色管理API服务
 * @description 处理角色相关的API请求
 */

import request from './request'
import type { ApiResponse } from '@/types/api'
import type { UserRole } from '@/types/auth'

// 角色接口定义
export interface Role {
  id: string
  name: string
  key: UserRole | string
  description: string
  icon?: string
  permissions: string[]
  status?: 'active' | 'inactive'
  isSystem?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  key: string
  description: string
  icon?: string
  permissions: string[]
  status?: 'active' | 'inactive'
}

export interface UpdateRoleRequest extends CreateRoleRequest {
  id: string
}

/**
 * 角色管理服务类
 */
export class RoleService {
  
  /**
   * 获取角色列表
   * @returns 角色列表
   */
  static async getRoles(): Promise<ApiResponse<Role[]>> {
    return request.get('/roles')
  }

  /**
   * 根据ID获取角色详情
   * @param id 角色ID
   * @returns 角色详情
   */
  static async getRoleById(id: string): Promise<ApiResponse<Role>> {
    return request.get(`/roles/${id}`)
  }

  /**
   * 创建角色
   * @param roleData 角色数据
   * @returns 创建结果
   */
  static async createRole(roleData: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return request.post('/roles', roleData)
  }

  /**
   * 更新角色
   * @param id 角色ID
   * @param roleData 角色数据
   * @returns 更新结果
   */
  static async updateRole(id: string, roleData: Partial<CreateRoleRequest>): Promise<ApiResponse<Role>> {
    return request.put(`/roles/${id}`, roleData)
  }

  /**
   * 删除角色
   * @param id 角色ID
   * @returns 删除结果
   */
  static async deleteRole(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/roles/${id}`)
  }

  /**
   * 获取所有可用权限
   * @returns 权限列表
   */
  static async getPermissions(): Promise<ApiResponse<string[]>> {
    return request.get('/roles/permissions')
  }

  /**
   * 更新用户角色
   * @param userId 用户ID
   * @param role 新角色
   * @returns 更新结果
   */
  static async updateUserRole(userId: string, role: UserRole): Promise<ApiResponse<null>> {
    return request.put(`/users/${userId}/role`, { role })
  }
}

export default RoleService
