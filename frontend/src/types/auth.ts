/**
 * 认证相关类型定义
 * @module types/auth
 */

// 用户角色枚举 - 四级权限系统
export enum UserRole {
  SUPER_ADMIN = 'super_admin',    // 超级管理员 - 公司拥有，最高权限
  SCHOOL_ADMIN = 'school_admin',  // 学校管理员 - 学校管理，可配置本校权限
  TEACHER = 'teacher',            // 教师 - 教学相关权限
  STUDENT = 'student'             // 学生 - 基础权限
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 登录请求数据
export interface LoginRequest {
  phone: string
  password: string
  captcha?: string
  captchaId?: string
  rememberMe?: boolean
}

// 注册请求数据
export interface RegisterRequest {
  phone: string
  email: string
  password: string
  confirmPassword: string
  realName: string
  captcha: string
  smsCode: string
}

// 管理员添加教师请求数据
export interface CreateTeacherRequest {
  phone: string
  email: string
  realName: string
  department?: string
  initialPassword: string
}

// 登录响应数据
export interface LoginResponse {
  token: string
  refreshToken: string
  user: UserInfo
  permissions: string[]
  expiresIn: number
}

// 用户信息
export interface UserInfo {
  id: number
  phone: string
  email: string
  role: UserRole
  status: UserStatus
  avatar?: string
  realName?: string
  department?: string
  lastLoginTime?: string
  createdAt: string
  updatedAt: string
}

// 权限信息
export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  level: number
}

// 角色权限配置
export interface RolePermissions {
  [UserRole.SUPER_ADMIN]: string[]
  [UserRole.SCHOOL_ADMIN]: string[]
  [UserRole.TEACHER]: string[]
  [UserRole.STUDENT]: string[]
}

// 认证状态
export interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
  token: string | null
  refreshToken: string | null
  permissions: string[]
  loading: boolean
  error: string | null
}

// 密码重置请求
export interface ResetPasswordRequest {
  phone: string
  captcha: string
}

// 通过验证码重置密码请求数据
export interface ResetPasswordWithCodeRequest {
  phone: string
  smsCode: string
  newPassword: string
  confirmPassword: string
  captcha: string
}

// 密码重置确认
export interface ResetPasswordConfirmRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

// 修改密码请求
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// 验证码响应数据
export interface CaptchaResponse {
  captchaId: string
  captchaImage: string
}

// 刷新令牌请求
export interface RefreshTokenRequest {
  refreshToken: string
}

// 用户资料更新请求
export interface UpdateProfileRequest {
  realName?: string
  email?: string
  avatar?: string
  department?: string
}

// 短信验证码请求数据
export interface SmsCodeRequest {
  phone: string
  type: 'register' | 'reset' | 'login'
  captcha: string
}

// 短信验证码验证请求数据
export interface SmsCodeVerifyRequest {
  phone: string
  code: string
  type: 'register' | 'reset' | 'login'
}

// 路由元信息
export interface RouteMeta {
  title: string
  requiresAuth?: boolean
  roles?: UserRole[]
  permissions?: string[]
  icon?: string
  hidden?: boolean
} 
