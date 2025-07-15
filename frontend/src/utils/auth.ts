/**
 * 认证工具函数
 * @module utils/auth
 */
import type { UserRole } from '@/types/auth'

/**
 * 默认角色权限配置
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'system:*',
    'user:*',
    'student:*',
    'teacher:*',
    'course:*',
    'application:*',
    'analysis:*',
    'setting:*',
    'logs:*'
  ],
  teacher: [
    'student:read',
    'student:create',
    'student:update',
    'course:read',
    'course:create',
    'course:update',
    'application:read',
    'application:approve',
    'analysis:read'
  ],
  student: [
    'profile:read',
    'profile:update',
    'course:read',
    'application:create',
    'application:read'
  ]
}

/**
 * 角色显示名称映射
 */
export const ROLE_NAMES: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  student: '学生'
}

/**
 * 角色颜色映射
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'red',
  teacher: 'blue',
  student: 'green'
}

/**
 * 验证Token格式
 * @param token JWT Token
 * @returns 是否有效
 */
export const isValidToken = (token: string): boolean => {
  if (!token) return false
  
  // 简单的JWT格式验证
  const parts = token.split('.')
  return parts.length === 3
}

/**
 * 解析JWT Token
 * @param token JWT Token
 * @returns 解析后的payload
 */
export const parseJwtToken = (token: string): any => {
  try {
    if (!isValidToken(token)) return null
    
    const payload = token.split('.')[1]
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch (error) {
    console.error('解析JWT Token失败:', error)
    return null
  }
}

/**
 * 检查Token是否过期
 * @param token JWT Token
 * @returns 是否过期
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = parseJwtToken(token)
    if (!payload || !payload.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  } catch (error) {
    return true
  }
}

/**
 * 获取Token剩余时间（秒）
 * @param token JWT Token
 * @returns 剩余时间（秒）
 */
export const getTokenRemainingTime = (token: string): number => {
  try {
    const payload = parseJwtToken(token)
    if (!payload || !payload.exp) return 0
    
    const currentTime = Math.floor(Date.now() / 1000)
    return Math.max(0, payload.exp - currentTime)
  } catch (error) {
    return 0
  }
}

/**
 * 格式化权限字符串
 * @param resource 资源
 * @param action 操作
 * @returns 权限字符串
 */
export const formatPermission = (resource: string, action: string): string => {
  return `${resource}:${action}`
}

/**
 * 解析权限字符串
 * @param permission 权限字符串
 * @returns 解析结果
 */
export const parsePermission = (permission: string): { resource: string; action: string } => {
  const [resource, action] = permission.split(':')
  return { resource: resource || '', action: action || '' }
}

/**
 * 检查权限是否匹配
 * @param userPermissions 用户权限列表
 * @param requiredPermission 需要的权限
 * @returns 是否匹配
 */
export const checkPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  // 直接匹配
  if (userPermissions.includes(requiredPermission)) return true
  
  // 通配符匹配
  const { resource } = parsePermission(requiredPermission)
  const wildcardPermission = `${resource}:*`
  if (userPermissions.includes(wildcardPermission)) return true
  
  // 超级管理员权限
  if (userPermissions.includes('system:*')) return true
  
  return false
}

/**
 * 获取用户角色显示名称
 * @param role 用户角色
 * @returns 显示名称
 */
export const getRoleName = (role: UserRole): string => {
  return ROLE_NAMES[role] || role
}

/**
 * 获取用户角色颜色
 * @param role 用户角色
 * @returns 颜色值
 */
export const getRoleColor = (role: UserRole): string => {
  return ROLE_COLORS[role] || 'default'
}

/**
 * 获取角色默认权限
 * @param role 用户角色
 * @returns 权限列表
 */
export const getRolePermissions = (role: UserRole): string[] => {
  return DEFAULT_PERMISSIONS[role] || []
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 验证结果
 */
export const validatePassword = (password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  message: string
} => {
  if (!password) {
    return { isValid: false, strength: 'weak', message: '密码不能为空' }
  }
  
  if (password.length < 8) {
    return { isValid: false, strength: 'weak', message: '密码长度至少8位' }
  }
  
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  
  const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  
  if (score < 2) {
    return { isValid: false, strength: 'weak', message: '密码强度太弱，需要包含字母、数字或特殊字符' }
  }
  
  if (score === 2) {
    return { isValid: true, strength: 'medium', message: '密码强度中等' }
  }
  
  return { isValid: true, strength: 'strong', message: '密码强度很强' }
}

/**
 * 验证手机号格式
 * @param phone 手机号
 * @returns 是否有效
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false
  
  // 中国手机号格式验证
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证邮箱格式
 * @param email 邮箱
 * @returns 是否有效
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证真实姓名格式
 * @param name 真实姓名
 * @returns 是否有效
 */
export const validateRealName = (name: string): boolean => {
  if (!name) return false
  
  // 中文姓名验证：2-10个字符，支持中文、英文字母
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z\s]{2,10}$/
  return nameRegex.test(name.trim())
}

/**
 * 验证短信验证码格式
 * @param code 验证码
 * @returns 是否有效
 */
export const validateSmsCode = (code: string): boolean => {
  if (!code) return false
  
  // 6位数字验证码
  const codeRegex = /^\d{6}$/
  return codeRegex.test(code)
}

/**
 * 格式化手机号显示
 * @param phone 手机号
 * @returns 格式化后的手机号
 */
export const formatPhone = (phone: string): string => {
  if (!phone || phone.length !== 11) return phone
  
  return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`
}

/**
 * 脱敏手机号显示
 * @param phone 手机号
 * @returns 脱敏后的手机号
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length !== 11) return phone
  
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

/**
 * 生成随机字符串
 * @param length 长度
 * @returns 随机字符串
 */
export const generateRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * 生成随机密码
 * @param length 密码长度
 * @returns 随机密码
 */
export const generateRandomPassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // 确保至少包含每种字符类型
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // 填充剩余长度
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // 随机打乱字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * 格式化最后登录时间
 * @param lastLoginTime 最后登录时间
 * @returns 格式化后的时间
 */
export const formatLastLoginTime = (lastLoginTime: string): string => {
  if (!lastLoginTime) return '从未登录'
  
  const now = new Date()
  const loginTime = new Date(lastLoginTime)
  const diffMs = now.getTime() - loginTime.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return loginTime.toLocaleDateString('zh-CN')
} 