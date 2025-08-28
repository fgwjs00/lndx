/**
 * 开发模式工具函数
 * @module utils/dev
 * @description 提供开发环境下的特殊功能和配置
 * 
 * 🚨 注意：这些函数仅在开发环境使用，生产环境将被优化掉
 * 
 * 配置说明：
 * - __DEV_MODE__: 是否为开发模式
 * - __SKIP_CAPTCHA__: 是否跳过验证码验证
 * - __MOCK_AUTH__: 是否启用模拟认证（false = 使用真实API）
 */

// 引入类型声明
/// <reference types="../types/vite-env.d.ts" />

/**
 * 检查是否为开发模式
 * @returns {boolean} 是否为开发模式
 * @description 用于控制开发环境特有的功能显示
 */
export const isDevelopment = (): boolean => {
  return typeof __DEV_MODE__ !== 'undefined' ? __DEV_MODE__ : import.meta.env.DEV
}

/**
 * 检查是否跳过验证码
 * @returns {boolean} 是否跳过验证码
 * @description 开发环境下可跳过验证码验证，提高开发效率
 */
export const shouldSkipCaptcha = (): boolean => {
  return typeof __SKIP_CAPTCHA__ !== 'undefined' ? __SKIP_CAPTCHA__ : import.meta.env.DEV
}

/**
 * 检查是否启用模拟认证
 * @returns {boolean} 是否启用模拟认证
 * @description 
 * - true: 使用本地模拟数据，不发送网络请求
 * - false: 使用真实后端API
 * 
 * ⚠️ 当前配置：false（使用真实后端）
 */
export const shouldMockAuth = (): boolean => {
  const useMock = typeof __MOCK_AUTH__ !== 'undefined' ? __MOCK_AUTH__ : import.meta.env.DEV
  
  // 开发环境下打印当前配置状态
  if (isDevelopment() && typeof window !== 'undefined') {
    const mode = useMock ? '🧪 模拟模式' : '🔗 真实API模式'
    console.log(`%c[开发工具] ${mode}`, 'color: #10b981; font-weight: bold;')
  }
  
  return useMock
}

/**
 * 模拟用户数据 - 四级权限系统
 */
export const mockUsers = [
  {
    id: '1',
    phone: '13800000001',
    password: '123456',
    realName: '超级管理员',
    email: 'superadmin@company.com',
    role: 'super_admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    phone: '13800000002',
    password: '123456',
    realName: '学校管理员',
    email: 'schooladmin@school.com',
    role: 'school_admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=schooladmin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '3',
    phone: '13800000003',
    password: '123456',
    realName: '张老师',
    email: 'teacher@school.com',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '4',
    phone: '13800000004',
    password: '123456',
    realName: '李学生',
    email: 'student@school.com',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

/**
 * 模拟登录验证
 * @param {string} phone 手机号
 * @param {string} password 密码
 * @returns {Promise<any>} 用户信息或null
 */
export const mockLogin = async (phone: string, password: string): Promise<any> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const user = mockUsers.find(u => u.phone === phone && u.password === password)
  
  if (user) {
    // 根据角色分配权限 - 四级权限系统
    let permissions: string[] = []
    if (user.role === 'super_admin') {
      permissions = [
        'system:*',
        'student:*',
        'teacher:*',
        'user:*',
        'course:*',
        'application:*',
        'analysis:*',
        'logs:*',
        'setting:*',
        'school:*'
      ]
    } else if (user.role === 'school_admin') {
      permissions = [
        'user:read',
        'user:create',
        'user:update',
        'student:*',
        'teacher:*',
        'course:*',
        'application:*',
        'analysis:read',
        'setting:read',
        'setting:update'
      ]
    } else if (user.role === 'teacher') {
      permissions = [
        'student:read',
        'student:create',
        'student:update',
        'course:*',
        'application:*',
        'attendance:manage',
        'analysis:read'
      ]
    } else if (user.role === 'student') {
      permissions = [
        'application:read',
        'application:create',
        'course:read',
        'profile:read',
        'profile:update'
      ]
    }

    return {
      code: 200,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          realName: user.realName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token: `mock_token_${user.id}_${Date.now()}`,
        refreshToken: `mock_refresh_token_${user.id}_${Date.now()}`,
        permissions: permissions,
        expiresIn: 7200
      }
    }
  } else {
    return {
      code: 401,
      message: '手机号或密码错误',
      data: null
    }
  }
}

/**
 * 模拟短信验证码发送
 * @param {string} phone 手机号
 * @returns {Promise<any>} 发送结果
 */
export const mockSendSms = async (phone: string): Promise<any> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  console.log(`[开发模式] 模拟发送短信验证码到: ${phone}，验证码: 123456`)
  
  return {
    code: 200,
    message: '短信验证码发送成功',
    data: {
      captchaId: `mock_sms_${Date.now()}`,
      expireTime: 300 // 5分钟有效期
    }
  }
}

/**
 * 模拟短信验证码验证
 * @param {string} phone 手机号
 * @param {string} code 验证码
 * @returns {Promise<any>} 验证结果
 */
export const mockVerifySms = async (phone: string, code: string): Promise<any> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // 开发模式下，验证码固定为 123456
  if (code === '123456') {
    return {
      code: 200,
      message: '验证码验证成功',
      data: { verified: true }
    }
  } else {
    return {
      code: 400,
      message: '验证码错误',
      data: { verified: false }
    }
  }
}

/**
 * 显示开发模式信息
 * @description 在控制台显示开发环境的配置和测试数据
 */
export const showDevModeInfo = (): void => {
  if (!isDevelopment()) return
  
  const mockMode = shouldMockAuth()
  
  console.group('%c🚀 开发模式信息', 'color: #10b981; font-weight: bold; font-size: 14px;')
  
  // 当前配置状态
  console.log(`%c📊 当前配置:`, 'color: #3b82f6; font-weight: bold;')
  console.log(`%c  • API模式: ${mockMode ? '🧪 模拟数据' : '🔗 真实后端'}`, 'color: #6b7280;')
  console.log(`%c  • 验证码: ${shouldSkipCaptcha() ? '🔧 已跳过' : '🔒 启用'}`, 'color: #6b7280;')
  
  // 测试账号信息
  if (mockMode) {
    console.log('%c📱 模拟测试账号:', 'color: #3b82f6; font-weight: bold;')
  } else {
    console.log('%c📱 后端测试账号:', 'color: #3b82f6; font-weight: bold;')
  }
  
  console.log('%c  • 超级管理员: 13800000001 / 123456', 'color: #6b7280;')
  console.log('%c  • 学校管理员: 13800000002 / 123456', 'color: #6b7280;')
  console.log('%c  • 教师: 13800000003 / 123456', 'color: #6b7280;')
  console.log('%c  • 学生: 13800000004 / 123456', 'color: #6b7280;')
  
  // 开发提示
  console.log('%c💡 开发提示:', 'color: #f59e0b; font-weight: bold;')
  console.log('%c  • 短信验证码: 123456 (固定)', 'color: #6b7280;')
  console.log('%c  • 登录状态会自动保持', 'color: #6b7280;')
  console.log('%c  • 可以在登录页点击测试账号快速登录', 'color: #6b7280;')
  
  if (!mockMode) {
    console.log('%c⚠️ 注意: 当前使用真实后端API，请确保后端服务已启动', 'color: #ef4444; font-weight: bold;')
  }
  
  console.groupEnd()
}

/**
 * 获取当前模式描述
 * @returns {string} 当前开发模式的描述文字
 */
export const getCurrentModeDescription = (): string => {
  if (!isDevelopment()) {
    return '生产模式'
  }
  
  const mockMode = shouldMockAuth()
  const captchaSkipped = shouldSkipCaptcha()
  
  let description = mockMode ? '开发模式 (模拟数据)' : '开发模式 (真实API)'
  if (captchaSkipped) {
    description += ' + 跳过验证码'
  }
  
  return description
}
