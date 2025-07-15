/**
 * 开发模式工具函数
 * @module utils/dev
 * @description 提供开发环境下的特殊功能和配置
 */

// 引入类型声明
/// <reference types="../types/vite-env.d.ts" />

/**
 * 检查是否为开发模式
 * @returns {boolean} 是否为开发模式
 */
export const isDevelopment = (): boolean => {
  return typeof __DEV_MODE__ !== 'undefined' ? __DEV_MODE__ : import.meta.env.DEV
}

/**
 * 检查是否跳过验证码
 * @returns {boolean} 是否跳过验证码
 */
export const shouldSkipCaptcha = (): boolean => {
  return typeof __SKIP_CAPTCHA__ !== 'undefined' ? __SKIP_CAPTCHA__ : import.meta.env.DEV
}

/**
 * 检查是否启用模拟认证
 * @returns {boolean} 是否启用模拟认证
 */
export const shouldMockAuth = (): boolean => {
  return typeof __MOCK_AUTH__ !== 'undefined' ? __MOCK_AUTH__ : import.meta.env.DEV
}

/**
 * 模拟用户数据
 */
export const mockUsers = [
  {
    id: '1',
    phone: '13800138000',
    password: '123456',
    realName: '系统管理员',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    phone: '13800138001',
    password: '123456',
    realName: '张老师',
    email: 'teacher@example.com',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '3',
    phone: '13800138002',
    password: '123456',
    realName: '李学生',
    email: 'student@example.com',
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
    // 根据角色分配权限
    let permissions: string[] = []
    if (user.role === 'admin') {
      permissions = [
        'system:*',
        'student:*',
        'teacher:*',
        'user:*',
        'course:*',
        'application:*',
        'analysis:*',
        'logs:*',
        'setting:*'
      ]
    } else if (user.role === 'teacher') {
      permissions = [
        'student:read',
        'student:create',
        'student:update',
        'course:*',
        'application:*',
        'analysis:read'
      ]
    } else if (user.role === 'student') {
      permissions = [
        'application:read',
        'application:create',
        'course:read'
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
 * 开发模式提示信息
 */
export const showDevModeInfo = (): void => {
  if (isDevelopment()) {
    console.log('%c🚀 开发模式已启用', 'color: #10b981; font-weight: bold; font-size: 14px;')
    console.log('%c📱 测试账号信息:', 'color: #3b82f6; font-weight: bold;')
    console.log('%c管理员: 13800138000 / 123456', 'color: #6b7280;')
    console.log('%c教师: 13800138001 / 123456', 'color: #6b7280;')
    console.log('%c学生: 13800138002 / 123456', 'color: #6b7280;')
    console.log('%c📋 短信验证码: 123456', 'color: #6b7280;')
    console.log('%c🔧 验证码已跳过', 'color: #6b7280;')
    console.log('%c🔄 页面刷新后登录状态会自动保持', 'color: #10b981; font-weight: bold;')
  }
} 