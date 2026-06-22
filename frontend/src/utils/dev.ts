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
  return false
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
  return false
}

export const mockUsers: any[] = []

/**
 * 模拟登录验证
 * @param {string} phone 手机号
 * @param {string} password 密码
 * @returns {Promise<any>} 用户信息或null
 */
export const mockLogin = async (phone: string, password: string): Promise<any> => {
  void phone
  void password
  return {
    code: 503,
    message: '模拟登录已关闭，请使用真实后端账号',
    data: null
  }
}

/**
 * 模拟短信验证码发送
 * @param {string} phone 手机号
 * @returns {Promise<any>} 发送结果
 */
export const mockSendSms = async (phone: string): Promise<any> => {
  void phone
  return {
    code: 503,
    message: '模拟短信已关闭，请使用真实后端短信服务',
    data: null
  }
}

/**
 * 模拟短信验证码验证
 * @param {string} phone 手机号
 * @param {string} code 验证码
 * @returns {Promise<any>} 验证结果
 */
export const mockVerifySms = async (phone: string, code: string): Promise<any> => {
  void phone
  void code
  return {
    code: 503,
    message: '模拟验证码校验已关闭',
    data: { verified: false }
  }
}

/**
 * 显示开发模式信息
 * @description 在控制台显示开发环境的配置和测试数据
 */
export const showDevModeInfo = (): void => {
  if (!isDevelopment()) return
  console.log('[开发模式] 当前使用真实后端 API，模拟认证和固定验证码已关闭')
}

/**
 * 获取当前模式描述
 * @returns {string} 当前开发模式的描述文字
 */
export const getCurrentModeDescription = (): string => {
  if (!isDevelopment()) {
    return '生产模式'
  }

  return '开发模式 (真实API)'
}
