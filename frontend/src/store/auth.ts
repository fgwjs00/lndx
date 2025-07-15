/**
 * 认证状态管理
 * @module store/auth
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { AuthService } from '@/api/auth'
import { shouldMockAuth, mockLogin, mockSendSms, mockVerifySms } from '@/utils/dev'
import type { 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  UserInfo, 
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserRole
} from '@/types/auth'

/**
 * 认证状态管理
 */
export const useAuthStore = defineStore('auth', () => {
  // 状态
  const isAuthenticated = ref<boolean>(false)
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const permissions = ref<string[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAdmin = computed<boolean>(() => user.value?.role === 'admin')
  const isTeacher = computed<boolean>(() => user.value?.role === 'teacher')
  const isStudent = computed<boolean>(() => user.value?.role === 'student')
  const userRole = computed<UserRole | null>(() => user.value?.role || null)
  const userName = computed<string>(() => user.value?.realName || user.value?.phone || '')
  const userAvatar = computed<string>(() => user.value?.avatar || '')
  const userPhone = computed<string>(() => user.value?.phone || '')

  /**
   * 初始化认证状态
   * 从localStorage恢复登录状态
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      const savedToken = localStorage.getItem('token')
      const savedRefreshToken = localStorage.getItem('refreshToken')
      const savedUser = localStorage.getItem('user')
      const savedPermissions = localStorage.getItem('permissions')

      if (savedToken && savedUser) {
        token.value = savedToken
        refreshToken.value = savedRefreshToken
        user.value = JSON.parse(savedUser)
        permissions.value = savedPermissions ? JSON.parse(savedPermissions) : []
        isAuthenticated.value = true

        // 在开发模式下跳过API验证，直接使用本地存储的用户信息
        if (shouldMockAuth()) {
          console.log('开发模式：跳过token验证，使用本地存储的用户信息')
          console.log('用户权限:', permissions.value)
          return
        }

        // 生产模式：验证token是否有效
        await getCurrentUser()
      }
    } catch (error) {
      console.error('初始化认证状态失败:', error)
      await logout()
    }
  }

  /**
   * 用户登录
   * @param loginData 登录数据
   */
  const login = async (loginData: LoginRequest): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      let response: any

      // 开发模式下使用模拟登录
      if (shouldMockAuth()) {
        response = await mockLogin(loginData.phone, loginData.password)
      } else {
        response = await AuthService.login(loginData)
      }
      
      if (response.code === 200) {
        const { token: newToken, refreshToken: newRefreshToken, user: userInfo } = response.data
        const userPermissions = response.data.permissions || []
        
        // 更新状态
        token.value = newToken
        refreshToken.value = newRefreshToken
        user.value = userInfo
        permissions.value = userPermissions
        isAuthenticated.value = true

        // 保存到localStorage
        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        localStorage.setItem('user', JSON.stringify(userInfo))
        localStorage.setItem('permissions', JSON.stringify(userPermissions))

        message.success('登录成功')
        return true
      } else {
        error.value = response.message || '登录失败'
        message.error(error.value)
        return false
      }
    } catch (err: any) {
      error.value = err.message || '登录失败'
      message.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 学生注册
   * @param registerData 注册数据
   */
  const register = async (registerData: RegisterRequest): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const response = await AuthService.register(registerData)
      
      if (response.code === 200) {
        message.success('注册成功，请登录')
        return true
      } else {
        error.value = response.message || '注册失败'
        message.error(error.value)
        return false
      }
    } catch (err: any) {
      error.value = err.message || '注册失败'
      message.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   */
  const logout = async (): Promise<void> => {
    try {
      // 调用登出API
      await AuthService.logout()
    } catch (error) {
      console.error('登出API调用失败:', error)
    } finally {
      // 清除状态
      isAuthenticated.value = false
      user.value = null
      token.value = null
      refreshToken.value = null
      permissions.value = []
      error.value = null

      // 清除localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')

      message.success('已退出登录')
    }
  }

  /**
   * 获取当前用户信息
   */
  const getCurrentUser = async (): Promise<void> => {
    try {
      const response = await AuthService.getCurrentUser()
      
      if (response.code === 200) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
      } else {
        throw new Error(response.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      
      // 在开发模式下，如果API调用失败，不要自动登出用户
      if (shouldMockAuth()) {
        console.log('开发模式：API调用失败，保持当前登录状态')
        return
      }
      
      await logout()
    }
  }

  /**
   * 刷新访问令牌
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      if (!refreshToken.value) {
        throw new Error('没有刷新令牌')
      }

      const response = await AuthService.refreshToken({ refreshToken: refreshToken.value })
      
      if (response.code === 200) {
        const { token: newToken, refreshToken: newRefreshToken, user: userInfo } = response.data
        
        token.value = newToken
        refreshToken.value = newRefreshToken
        user.value = userInfo

        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        localStorage.setItem('user', JSON.stringify(userInfo))

        return true
      } else {
        throw new Error(response.message || '刷新令牌失败')
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      await logout()
      return false
    }
  }

  /**
   * 修改密码
   * @param passwordData 密码数据
   */
  const changePassword = async (passwordData: ChangePasswordRequest): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const response = await AuthService.changePassword(passwordData)
      
      if (response.code === 200) {
        message.success('密码修改成功')
        return true
      } else {
        error.value = response.message || '密码修改失败'
        message.error(error.value)
        return false
      }
    } catch (err: any) {
      error.value = err.message || '密码修改失败'
      message.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用户资料
   * @param profileData 用户资料数据
   */
  const updateProfile = async (profileData: UpdateProfileRequest): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const response = await AuthService.updateProfile(profileData)
      
      if (response.code === 200) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        message.success('资料更新成功')
        return true
      } else {
        error.value = response.message || '资料更新失败'
        message.error(error.value)
        return false
      }
    } catch (err: any) {
      error.value = err.message || '资料更新失败'
      message.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查用户权限
   * @param permission 权限字符串
   */
  const hasPermission = (permission: string): boolean => {
    // 直接匹配
    if (permissions.value.includes(permission)) return true
    
    // 通配符匹配
    const [resource] = permission.split(':')
    const wildcardPermission = `${resource}:*`
    if (permissions.value.includes(wildcardPermission)) return true
    
    // 超级管理员权限
    if (permissions.value.includes('system:*')) return true
    
    return false
  }

  /**
   * 检查用户角色
   * @param roles 角色数组
   */
  const hasRole = (roles: UserRole[]): boolean => {
    return user.value ? roles.includes(user.value.role) : false
  }

  /**
   * 检查是否可以访问路由
   * @param requiredRoles 需要的角色
   * @param requiredPermissions 需要的权限
   */
  const canAccess = (requiredRoles?: UserRole[], requiredPermissions?: string[]): boolean => {
    if (!isAuthenticated.value) return false
    
    if (requiredRoles && !hasRole(requiredRoles)) return false
    
    if (requiredPermissions && !requiredPermissions.every(permission => hasPermission(permission))) {
      return false
    }
    
    return true
  }

  return {
    // 状态
    isAuthenticated,
    user,
    token,
    refreshToken,
    permissions,
    loading,
    error,
    
    // 计算属性
    isAdmin,
    isTeacher,
    isStudent,
    userRole,
    userName,
    userAvatar,
    userPhone,
    
    // 方法
    initializeAuth,
    login,
    register,
    logout,
    getCurrentUser,
    refreshAccessToken,
    changePassword,
    updateProfile,
    hasPermission,
    hasRole,
    canAccess
  }
})

export default useAuthStore 