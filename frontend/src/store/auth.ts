/**
 * 认证状态管理
 * @module store/auth
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { AuthService } from '@/api/auth'
import { shouldMockAuth, mockLogin, mockSendSms, mockVerifySms } from '@/utils/dev'
import { UserRole } from '@/types/auth'
import type { 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  UserInfo, 
  ChangePasswordRequest,
  UpdateProfileRequest
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
  const mustChangePassword = ref<boolean>(false)

  // 计算属性
  const isSuperAdmin = computed<boolean>(() => user.value?.role === 'super_admin')
  const isSchoolAdmin = computed<boolean>(() => user.value?.role === 'school_admin')
  const isTeacher = computed<boolean>(() => user.value?.role === 'teacher')
  const isStudent = computed<boolean>(() => user.value?.role === 'student')
  // 向后兼容：isAdmin 等同于 isSuperAdmin
  const isAdmin = computed<boolean>(() => user.value?.role === 'super_admin')
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
      console.log('🔄 开始初始化认证状态...')
      const savedToken = localStorage.getItem('token')
      const savedRefreshToken = localStorage.getItem('refreshToken')
      const savedUser = localStorage.getItem('user')
      const savedPermissions = localStorage.getItem('permissions')
      const savedMustChangePassword = localStorage.getItem('mustChangePassword')

      console.log('💾 从localStorage获取数据:', {
        hasToken: !!savedToken,
        hasRefreshToken: !!savedRefreshToken,
        hasUser: !!savedUser,
        hasPermissions: !!savedPermissions
      })

      // 打印实际的用户数据用于调试
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          console.log('👤 localStorage中的用户数据:', userData)
          
          // 检查数据是否被错误嵌套（如 {user: {...}} 格式）
          let actualUserData = userData
          if (userData.user && typeof userData.user === 'object' && !userData.id) {
            console.warn('⚠️ 检测到嵌套的用户数据格式，提取实际用户信息')
            actualUserData = userData.user
            console.log('🔄 提取后的用户数据:', actualUserData)
            
            // 重新保存正确格式的数据
            localStorage.setItem('user', JSON.stringify(actualUserData))
          }
          
          console.log('🔍 用户角色字段详情:', {
            role: actualUserData.role,
            roleType: typeof actualUserData.role,
            roleExists: 'role' in actualUserData,
            hasId: 'id' in actualUserData
          })
        } catch (parseError) {
          console.error('❌ 解析localStorage用户数据失败:', parseError)
          console.log('🧹 检测到损坏的用户数据，清除localStorage')
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          localStorage.removeItem('permissions')
          console.log('✅ 已清除损坏的认证数据，请重新登录')
          return
        }
      }

      if (savedToken && savedUser) {
        token.value = savedToken
        refreshToken.value = savedRefreshToken
        
        // 解析用户信息并转换角色格式
        let parsedUser: any
        try {
          const userData = JSON.parse(savedUser)
          
          // 处理可能的嵌套数据格式
          if (userData.user && typeof userData.user === 'object' && !userData.id) {
            console.warn('🔧 修复嵌套的用户数据格式')
            parsedUser = userData.user
            // 重新保存正确格式
            localStorage.setItem('user', JSON.stringify(parsedUser))
          } else {
            parsedUser = userData
          }
          
        } catch (parseError) {
          console.error('❌ 解析用户数据失败:', parseError)
          console.log('🧹 清除损坏的用户数据')
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          localStorage.removeItem('permissions')
          return
        }
        const roleMapping: Record<string, UserRole> = {
          'SUPER_ADMIN': UserRole.SUPER_ADMIN,
          'SCHOOL_ADMIN': UserRole.SCHOOL_ADMIN, 
          'TEACHER': UserRole.TEACHER,
          'STUDENT': UserRole.STUDENT
        }
        
        // 安全处理用户角色转换
        let userRole: UserRole
        if (parsedUser.role && typeof parsedUser.role === 'string') {
          userRole = roleMapping[parsedUser.role] || parsedUser.role.toLowerCase() as UserRole
        } else {
          console.warn('⚠️ 用户角色数据异常:', parsedUser.role, '，设置为默认学生角色')
          userRole = UserRole.STUDENT
        }
        
        user.value = {
          ...parsedUser,
          role: userRole
        }
        permissions.value = savedPermissions ? JSON.parse(savedPermissions) : []
        mustChangePassword.value = savedMustChangePassword ? JSON.parse(savedMustChangePassword) : false
        isAuthenticated.value = true

        console.log('✅ 认证状态已恢复:', {
          userId: user.value?.id,
          userRole: user.value?.role,
          userName: user.value?.realName,
          permissionCount: permissions.value.length,
          isAuthenticated: isAuthenticated.value
        })

        // 在开发模式下跳过API验证，直接使用本地存储的用户信息
        if (shouldMockAuth()) {
          console.log('开发模式：跳过token验证，使用本地存储的用户信息')
          console.log('用户权限:', permissions.value)
          console.log('🔍 初始化用户角色:', user.value?.role)
          return
        }

        // 生产模式：尝试验证token是否有效
        // 但不要因为API失败就强制退出登录
        try {
          await getCurrentUser(false) // 不强制退出登录
        } catch (error) {
          console.warn('验证token时API调用失败，但保持登录状态:', error)
          // 不抛出错误，保持当前登录状态
        }
      } else {
        console.log('❌ 未找到有效的token或用户信息，保持未登录状态')
      }
    } catch (error) {
      console.error('初始化认证状态失败:', error)
      
      // 只有在解析localStorage数据时出错才清除认证状态
      // 网络错误不应该导致logout
      if (error instanceof SyntaxError) {
        console.log('🧹 localStorage数据解析失败，清除损坏的数据')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('permissions')
      } else {
        console.log('🔄 其他初始化错误，但保持现有认证状态')
      }
    }
  }

  /**
   * 用户登录
   * @param loginData 登录数据
   */
  const login = async (loginData: LoginRequest): Promise<boolean> => {
    console.log('🔐 AuthStore.login 开始', loginData)
    try {
      loading.value = true
      error.value = null

      let response: any

      // 开发模式下使用模拟登录
      if (shouldMockAuth()) {
        console.log('🧪 使用模拟登录')
        response = await mockLogin(loginData.phone, loginData.password)
        console.log('🧪 模拟登录响应:', response)
      } else {
        console.log('🌐 使用真实API登录')
        response = await AuthService.login(loginData)
        console.log('🌐 API登录响应:', response)
      }
      
      if (response.code === 200) {
        const { token: newToken, refreshToken: newRefreshToken, user: userInfo, mustChangePassword: needPasswordChange } = response.data
        const userPermissions = response.data.permissions || []
        
        console.log('👤 用户信息:', userInfo)
        console.log('🔑 权限列表:', userPermissions)
        console.log('🔒 需要强制修改密码:', needPasswordChange)
        
        // 更新状态
        token.value = newToken
        refreshToken.value = newRefreshToken
        
        // 转换后端角色格式为前端格式（SUPER_ADMIN -> super_admin）
        const roleMapping: Record<string, UserRole> = {
          'SUPER_ADMIN': UserRole.SUPER_ADMIN,
          'SCHOOL_ADMIN': UserRole.SCHOOL_ADMIN, 
          'TEACHER': UserRole.TEACHER,
          'STUDENT': UserRole.STUDENT
        }
        
        // 安全处理角色转换
        let convertedRole: UserRole
        if (userInfo.role && typeof userInfo.role === 'string') {
          convertedRole = roleMapping[userInfo.role] || userInfo.role.toLowerCase() as UserRole
        } else {
          console.warn('⚠️ 登录返回的用户角色数据异常:', userInfo.role, '，设置为默认学生角色')
          convertedRole = UserRole.STUDENT
        }
        
        const convertedUserInfo = {
          ...userInfo,
          role: convertedRole
        }
        
        user.value = convertedUserInfo
        permissions.value = userPermissions
        isAuthenticated.value = true
        mustChangePassword.value = needPasswordChange || userInfo.mustChangePassword || false

        // 保存到localStorage
        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        localStorage.setItem('user', JSON.stringify(convertedUserInfo))
        localStorage.setItem('permissions', JSON.stringify(userPermissions))
        localStorage.setItem('mustChangePassword', JSON.stringify(mustChangePassword.value))

        console.log('✅ 登录成功，状态已更新')
        console.log('🔍 用户数据详情:', {
          originalRole: userInfo.role,
          convertedRole: convertedUserInfo.role,
          roleType: typeof convertedUserInfo.role,
          permissions: userPermissions,
          token: newToken?.substring(0, 20) + '...'
        })
        // 根据是否需要强制修改密码显示不同的消息
        if (mustChangePassword.value) {
          message.warning('登录成功，请立即修改密码')
        } else {
          message.success('登录成功')
        }
        return true
      } else {
        console.log('❌ 登录失败:', response.message)
        error.value = response.message || '登录失败'
        message.error(error.value)
        return false
      }
    } catch (err: any) {
      console.error('❌ 登录异常:', err)
      // 提取错误信息
      let errorMsg = '登录失败'
      if (err instanceof Error) {
        errorMsg = err.message
      } else if (err.message) {
        errorMsg = err.message
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message
      } else if (typeof err === 'string') {
        errorMsg = err
      }
      
      console.log('📢 显示错误消息:', errorMsg)
      error.value = errorMsg
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
      console.log('🔚 AuthStore.login 结束')
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
    // 打印调用堆栈，帮助调试
    console.log('🚪 执行用户登出...')
    console.trace('💡 Logout调用堆栈:')
    
    try {
      // 调用登出API
      await AuthService.logout()
      console.log('✅ 登出API调用成功')
    } catch (error) {
      console.error('❌ 登出API调用失败:', error)
    } finally {
      console.log('🧹 清除本地认证状态...')
      // 清除状态
      isAuthenticated.value = false
      user.value = null
      token.value = null
      refreshToken.value = null
      permissions.value = []
      error.value = null
      mustChangePassword.value = false

      // 清除localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
      localStorage.removeItem('mustChangePassword')

      message.success('已退出登录')
    }
  }

  /**
   * 获取当前用户信息
   */
  const getCurrentUser = async (forceLogoutOnError: boolean = true): Promise<void> => {
    try {
      const response = await AuthService.getCurrentUser()
      
      if (response.code === 200) {
        let userInfo = response.data
        console.log('📋 获取到的当前用户信息:', userInfo)
        
        // 检查是否是嵌套格式 {user: {...}}
        if ((userInfo as any).user && typeof (userInfo as any).user === 'object' && !userInfo.id) {
          console.log('🔄 检测到API返回嵌套格式，提取用户信息')
          userInfo = (userInfo as any).user
          console.log('🔄 提取后的用户信息:', userInfo)
        }
        
        // 确保用户信息格式与登录时一致，进行角色转换
        const roleMapping: Record<string, UserRole> = {
          'SUPER_ADMIN': UserRole.SUPER_ADMIN,
          'SCHOOL_ADMIN': UserRole.SCHOOL_ADMIN, 
          'TEACHER': UserRole.TEACHER,
          'STUDENT': UserRole.STUDENT
        }
        
        // 安全处理角色转换
        let convertedRole: UserRole
        if (userInfo.role && typeof userInfo.role === 'string') {
          convertedRole = roleMapping[userInfo.role] || userInfo.role.toLowerCase() as UserRole
          console.log('✅ 角色转换成功:', userInfo.role, '->', convertedRole)
        } else {
          console.warn('⚠️ 当前用户API返回的角色数据异常:', userInfo.role, '，设置为默认学生角色')
          convertedRole = UserRole.STUDENT
        }
        
        const convertedUserInfo = {
          ...userInfo,
          role: convertedRole
        }
        
        console.log('🔄 最终转换后的用户信息:', convertedUserInfo)
        
        user.value = convertedUserInfo
        localStorage.setItem('user', JSON.stringify(convertedUserInfo))
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
      
      // 只有在明确要求时才强制退出登录
      if (forceLogoutOnError) {
        await logout()
      } else {
        // 抛出错误让调用方决定如何处理
        throw error
      }
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
        console.log('🔄 刷新token返回的用户信息:', userInfo)
        
        // 检查是否是嵌套格式
        let actualUserInfo = userInfo
        if (userInfo && (userInfo as any).user && typeof (userInfo as any).user === 'object' && !userInfo.id) {
          console.log('🔄 刷新token检测到嵌套格式，提取用户信息')
          actualUserInfo = (userInfo as any).user
        }
        
        // 确保角色格式与登录时一致
        const roleMapping: Record<string, UserRole> = {
          'SUPER_ADMIN': UserRole.SUPER_ADMIN,
          'SCHOOL_ADMIN': UserRole.SCHOOL_ADMIN, 
          'TEACHER': UserRole.TEACHER,
          'STUDENT': UserRole.STUDENT
        }
        
        // 安全处理角色转换
        let convertedRole: UserRole
        if (actualUserInfo.role && typeof actualUserInfo.role === 'string') {
          convertedRole = roleMapping[actualUserInfo.role] || actualUserInfo.role.toLowerCase() as UserRole
          console.log('✅ 刷新token角色转换成功:', actualUserInfo.role, '->', convertedRole)
        } else {
          console.warn('⚠️ 刷新token返回的角色数据异常:', actualUserInfo.role, '，设置为默认学生角色')
          convertedRole = UserRole.STUDENT
        }
        
        const convertedUserInfo = {
          ...actualUserInfo,
          role: convertedRole
        }
        
        token.value = newToken
        refreshToken.value = newRefreshToken
        user.value = convertedUserInfo

        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        localStorage.setItem('user', JSON.stringify(convertedUserInfo))

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
        // 密码修改成功后清除强制修改密码标记
        mustChangePassword.value = false
        localStorage.removeItem('mustChangePassword')
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
    mustChangePassword,
    
    // 计算属性
    isSuperAdmin,
    isSchoolAdmin,
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
