/**
 * 认证路由
 * @description 处理用户登录、注册、密码重置等认证相关功能
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserRole } from '@prisma/client'
import { config } from '@/config'
import { asyncHandler, ValidationError, BusinessError } from '@/middleware/errorHandler'
import { generateToken, generateRefreshToken } from '@/middleware/auth'
import { loginLimiter, smsLimiter } from '@/middleware/rateLimiter'
import { logger, businessLogger, errorLogger } from '@/utils/logger'
import { validateLoginData, validateSmsData, validateRegisterData } from '@/utils/validation'
import { sendSms, generateSmsCode } from '@/services/smsService'

const router = Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [认证管理]
 *     summary: 用户登录
 *     description: 使用手机号和密码进行用户登录认证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 手机号
 *                 example: "13800138000"
 *               password:
 *                 type: string
 *                 description: 密码
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "登录成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT访问令牌
 *                     refreshToken:
 *                       type: string
 *                       description: 刷新令牌
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: 认证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: 请求过于频繁
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { phone, password } = req.body

  // 参数验证
  const { error, value } = validateLoginData({ phone, password })
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { phone: value.phone }
  })

  if (!user) {
    businessLogger.userAction('unknown', 'LOGIN_FAILED', { 
      phone: value.phone, 
      reason: 'user_not_found',
      ip: req.ip
    })
    throw new BusinessError('手机号或密码错误', 401, 'LOGIN_FAILED')
  }

  // 检查用户是否被禁用
  if (!user.isActive) {
    businessLogger.userAction(user.id, 'LOGIN_FAILED', { 
      reason: 'account_disabled',
      ip: req.ip
    })
    throw new BusinessError('账号已被禁用，请联系管理员', 401, 'ACCOUNT_DISABLED')
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(value.password, user.password)
  if (!isPasswordValid) {
    businessLogger.userAction(user.id, 'LOGIN_FAILED', { 
      reason: 'invalid_password',
      ip: req.ip
    })
    throw new BusinessError('手机号或密码错误', 401, 'LOGIN_FAILED')
  }

  // 生成Token
  const token = generateToken({
    id: user.id,
    phone: user.phone,
    role: user.role
  })

  const refreshToken = generateRefreshToken({
    id: user.id,
    phone: user.phone,
    role: user.role
  })

  // 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  // 记录登录日志
  businessLogger.userAction(user.id, 'LOGIN_SUCCESS', { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // 根据用户角色获取权限列表
  const getUserPermissions = (role: string): string[] => {
    const rolePermissions: Record<string, string[]> = {
      'SUPER_ADMIN': [
        'system:*',
        'user:*',
        'student:*',
        'teacher:*',
        'course:*',
        'application:*',
        'analysis:*',
        'setting:*',
        'logs:*',
        'school:*'
      ],
      'SCHOOL_ADMIN': [
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
      ],
      'TEACHER': [
        // 学生管理权限
        'student:read', 'student:create', 'student:update', 'student:delete',
        // 课程管理权限
        'course:read', 'course:create', 'course:update', 'course:delete', 'course:import', 'course:export',
        // 报名管理权限
        'application:read', 'application:create', 'application:update', 'application:approve',
        // 年级管理权限
        'grade:read', 'grade:manage', 'grade:upgrade', 'grade:graduate',
        // 数据分析权限
        'analysis:read',
        // 考勤管理权限
        'attendance:read', 'attendance:manage',
        // 个人资料权限
        'profile:read', 'profile:update'
      ],
      'STUDENT': [
        'profile:read',
        'profile:update',
        'course:read',
        'application:create',
        'application:read'
      ]
    }
    return rolePermissions[role] || []
  }

  const permissions = getUserPermissions(user.role)

  // 检查是否需要强制修改密码
  const mustChangePassword = user.mustChangePassword || false

  // 返回登录成功响应
  res.json({
    code: 200,
    message: mustChangePassword ? '登录成功，需要修改密码' : '登录成功',
    data: {
      token,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        realName: user.realName,
        avatar: user.avatar,
        role: user.role.toLowerCase(),
        mustChangePassword
      },
      permissions,
      mustChangePassword
    }
  })
}))

/**
 * 发送短信验证码
 * POST /api/auth/send-sms
 */
router.post('/send-sms', smsLimiter, asyncHandler(async (req, res) => {
  const { phone, type } = req.body

  // 参数验证
  const { error, value } = validateSmsData({ phone, type })
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  // 检查手机号使用情况
  if (value.type === 'register') {
    const existingUser = await prisma.user.findUnique({
      where: { phone: value.phone }
    })
    if (existingUser) {
      throw new BusinessError('该手机号已被注册', 400, 'PHONE_EXISTS')
    }
  } else if (value.type === 'reset_password') {
    const existingUser = await prisma.user.findUnique({
      where: { phone: value.phone }
    })
    if (!existingUser) {
      throw new BusinessError('该手机号未注册', 400, 'PHONE_NOT_EXISTS')
    }
  }

  // 生成验证码
  const code = generateSmsCode()

  try {
    // 发送短信
    await sendSms(value.phone, code, value.type)

    // TODO: 将验证码存储到Redis中，设置过期时间
    // 这里暂时记录日志，实际项目中应该存储到缓存
    businessLogger.systemAction('SMS_SENT', {
      phone: value.phone,
      type: value.type,
      code, // 生产环境中不应该记录验证码
      ip: req.ip
    })

    res.json({
      code: 200,
      message: '验证码发送成功',
      data: {
        phone: value.phone,
        expiresIn: 300 // 5分钟过期
      }
    })
  } catch (error) {
    errorLogger.external('SMS_SERVICE', error as Error, {
      phone: value.phone,
      type: value.type
    })
    throw new BusinessError('短信发送失败，请稍后重试', 500, 'SMS_SEND_FAILED')
  }
}))

/**
 * 验证短信验证码
 * POST /api/auth/verify-sms
 */
router.post('/verify-sms', asyncHandler(async (req, res) => {
  const { phone, code, type } = req.body

  // 参数验证
  if (!phone || !code || !type) {
    throw new ValidationError('缺少必要参数')
  }

  // TODO: 从Redis中验证验证码
  // 这里暂时使用模拟验证
  const isValidCode = code === '123456' // 模拟验证码

  if (!isValidCode) {
    businessLogger.systemAction('SMS_VERIFY_FAILED', {
      phone,
      code,
      type,
      ip: req.ip
    })
    throw new BusinessError('验证码错误或已过期', 400, 'INVALID_SMS_CODE')
  }

  businessLogger.systemAction('SMS_VERIFY_SUCCESS', {
    phone,
    type,
    ip: req.ip
  })

  res.json({
    code: 200,
    message: '验证码验证成功',
    data: {
      phone,
      verified: true
    }
  })
}))

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { phone, password, realName, email, smsCode } = req.body

  // 参数验证
  const { error, value } = validateRegisterData({ phone, password, realName, email })
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  // TODO: 验证短信验证码
  if (!smsCode || smsCode !== '123456') {
    throw new BusinessError('请先进行短信验证', 400, 'SMS_NOT_VERIFIED')
  }

  // 检查用户是否已存在
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: value.phone },
        ...(value.email ? [{ email: value.email }] : [])
      ]
    }
  })

  if (existingUser) {
    const conflictField = existingUser.phone === value.phone ? '手机号' : '邮箱'
    throw new BusinessError(`${conflictField}已被注册`, 409, 'USER_EXISTS')
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(value.password, config.bcryptRounds)

  // 创建用户
  const user = await prisma.user.create({
    data: {
      phone: value.phone,
      email: value.email,
      password: hashedPassword,
      realName: value.realName,
      role: UserRole.STUDENT, // 默认为学生角色
      isActive: true
    }
  })

  // 记录注册日志
  businessLogger.userAction(user.id, 'USER_REGISTERED', {
    phone: user.phone,
    email: user.email,
    realName: user.realName,
    role: user.role,
    ip: req.ip
  })

  res.status(201).json({
    code: 200,
    message: '注册成功',
    data: {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        realName: user.realName,
        role: user.role
      }
    }
  })
}))

/**
 * 刷新Token
 * POST /api/auth/refresh
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new ValidationError('缺少刷新Token')
  }

  try {
    // 验证刷新Token
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as any
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      throw new BusinessError('用户不存在或已被禁用', 401, 'INVALID_REFRESH_TOKEN')
    }

    // 生成新的访问Token和刷新Token
    const newToken = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role
    })

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      phone: user.phone,
      role: user.role
    })

    res.json({
      code: 200,
      message: 'Token刷新成功',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          realName: user.realName,
          avatar: user.avatar,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    })
  } catch (error) {
    throw new BusinessError('刷新Token无效', 401, 'INVALID_REFRESH_TOKEN')
  }
}))

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    throw new BusinessError('缺少认证Token', 401, 'MISSING_TOKEN')
  }

  try {
    // 验证Token
    const decoded = jwt.verify(token, config.jwtSecret) as any
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      throw new BusinessError('用户不存在或已被禁用', 401, 'INVALID_TOKEN')
    }

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        realName: user.realName,
        avatar: user.avatar,
        role: user.role.toLowerCase(),
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    })
  } catch (error) {
    throw new BusinessError('Token无效', 401, 'INVALID_TOKEN')
  }
}))

/**
 * 退出登录
 * POST /api/auth/logout
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // TODO: 将Token加入黑名单（Redis）
  // 这里暂时只记录日志
  
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  businessLogger.systemAction('USER_LOGOUT', {
    token: token ? token.substring(0, 20) + '...' : 'unknown',
    ip: req.ip
  })

  res.json({
    code: 200,
    message: '退出登录成功'
  })
}))

/**
 * 修改密码
 * POST /api/auth/change-password
 */
router.post('/change-password', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    throw new BusinessError('缺少认证Token', 401, 'MISSING_TOKEN')
  }

  try {
    // 验证Token
    const decoded = jwt.verify(token, config.jwtSecret) as any
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      throw new BusinessError('用户不存在或已被禁用', 401, 'INVALID_TOKEN')
    }

    const { oldPassword, newPassword, confirmPassword } = req.body

    // 验证请求数据
    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new BusinessError('请填写完整的密码信息', 400, 'MISSING_REQUIRED_FIELDS')
    }

    if (newPassword !== confirmPassword) {
      throw new BusinessError('新密码和确认密码不一致', 400, 'PASSWORD_MISMATCH')
    }

    if (newPassword.length < 6) {
      throw new BusinessError('新密码至少需要6位', 400, 'PASSWORD_TOO_SHORT')
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldPasswordValid) {
      throw new BusinessError('原密码错误', 400, 'INVALID_OLD_PASSWORD')
    }

    // 哈希新密码
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // 更新密码并清除强制修改密码标记
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedNewPassword,
        mustChangePassword: false,
        updatedAt: new Date()
      }
    })

    businessLogger.userAction(user.id, 'PASSWORD_CHANGE', { 
      message: '用户修改密码成功',
      timestamp: new Date().toISOString()
    })

    res.json({
      code: 200,
      message: '密码修改成功',
      data: null
    })
  } catch (error) {
    if (error instanceof BusinessError) throw error
    throw new BusinessError('Token无效', 401, 'INVALID_TOKEN')
  }
}))

export default router
