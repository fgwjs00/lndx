/**
 * 用户管理路由
 * @description 处理用户相关的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { PrismaClient, UserRole } from '@prisma/client'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { requireAdmin, requireOwnerOrAdmin } from '@/middleware/auth'
import { validatePaginationData, validateIdParam } from '@/utils/validation'
import { businessLogger } from '@/utils/logger'

const router = Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [用户管理]
 *     summary: 获取用户列表
 *     description: 获取系统中的用户列表，支持分页、搜索和角色过滤
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页条数
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT]
 *         description: 角色过滤
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         list:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  // 参数验证
  const { error, value } = validatePaginationData(req.query)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { page, pageSize, keyword, role, sortField, sortOrder } = value

  // 构建查询条件
  const where: any = {}
  if (keyword) {
    where.OR = [
      { realName: { contains: keyword } },
      { phone: { contains: keyword } },
      { email: { contains: keyword } }
    ]
  }
  
  // 角色过滤
  if (role) {
    where.role = role
  }

  // 构建排序条件
  const orderBy: any = {}
  if (sortField) {
    orderBy[sortField] = sortOrder
  } else {
    orderBy.createdAt = sortOrder
  }

  // 查询总数
  const total = await prisma.user.count({ where })

  // 查询用户列表
  const users = await prisma.user.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      phone: true,
      email: true,
      realName: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  // 记录操作日志
  businessLogger.userAction(req.user!.id, 'USER_LIST_QUERY', {
    page,
    pageSize,
    keyword,
    total,
    resultCount: users.length
  })

  res.json({
    code: 200,
    message: '查询成功',
    data: {
      list: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  })
}))

/**
 * 创建新用户
 * POST /api/users
 */
router.post('/', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { realName, phone, email, role, password, status } = req.body

  // 基础验证
  if (!realName || !phone || !role || !password) {
    throw new ValidationError('请填写必填字段：姓名、手机号、角色、密码')
  }

  // 手机号格式验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('请输入正确的手机号格式')
  }

  // 邮箱格式验证（如果提供）
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('请输入正确的邮箱格式')
    }
  }

  // 角色映射
  const roleMapping: Record<string, UserRole> = {
    admin: 'SCHOOL_ADMIN',
    teacher: 'TEACHER',
    student: 'STUDENT'
  }

  const mappedRole = roleMapping[role]
  if (!mappedRole) {
    throw new ValidationError('无效的用户角色')
  }

  // 检查手机号是否已存在
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    }
  })

  if (existingUser) {
    if (existingUser.phone === phone) {
      throw new BusinessError('手机号已被使用', 409, 'PHONE_EXISTS')
    }
    if (existingUser.email === email) {
      throw new BusinessError('邮箱已被使用', 409, 'EMAIL_EXISTS')
    }
  }

  // 密码加密
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash(password, 10)

  // 创建用户
  const newUser = await prisma.user.create({
    data: {
      realName,
      phone,
      email: email || null,
      role: mappedRole,
      password: hashedPassword,
      isActive: status === 'active' ? true : false,
      mustChangePassword: true // 新用户首次登录需要修改密码
    },
    select: {
      id: true,
      phone: true,
      email: true,
      realName: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  // 记录日志
  businessLogger.userAction(req.user!.id, 'CREATE_USER', {
    newUserId: newUser.id,
    newUserPhone: newUser.phone,
    newUserRole: newUser.role
  })

  res.status(201).json({
    code: 201,
    message: '用户创建成功',
    data: newUser
  })
}))

/**
 * 获取用户详情
 * GET /api/users/:id
 */
router.get('/:id', requireOwnerOrAdmin(async (req) => {
  return req.params.id
}), asyncHandler(async (req: Request, res: Response) => {
  // 参数验证
  const { error: idError } = validateIdParam(req.params.id)
  if (idError) {
    throw new ValidationError('用户ID无效')
  }

  // 查询用户信息
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      phone: true,
      email: true,
      realName: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      studentProfile: {
        select: {
          id: true,
          studentCode: true,
          name: true,
          gender: true,
          age: true
        }
      },
      teacherProfile: {
        select: {
          id: true,
          teacherCode: true,
          realName: true,
          specialties: true,
          experience: true
        }
      }
    }
  })

  if (!user) {
    throw new BusinessError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  // 记录操作日志
  businessLogger.userAction(req.user!.id, 'USER_DETAIL_QUERY', {
    targetUserId: user.id
  })

  res.json({
    code: 200,
    message: '查询成功',
    data: user
  })
}))

/**
 * 更新用户信息
 * PUT /api/users/:id
 */
router.put('/:id', requireOwnerOrAdmin(async (req) => {
  return req.params.id
}), asyncHandler(async (req: Request, res: Response) => {
  // 参数验证
  const { error: idError } = validateIdParam(req.params.id)
  if (idError) {
    throw new ValidationError('用户ID无效')
  }

  const { realName, phone, email, role, status } = req.body
  const userId = req.params.id

  // 检查用户是否存在
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!existingUser) {
    throw new BusinessError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  // 构建更新数据
  const updateData: any = {}

  if (realName !== undefined) {
    if (!realName || realName.length < 2) {
      throw new ValidationError('姓名长度至少2个字符')
    }
    updateData.realName = realName
  }

  if (phone !== undefined) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      throw new ValidationError('请输入正确的手机号格式')
    }

    // 检查手机号是否被其他用户使用
    const phoneExists = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: userId }
      }
    })

    if (phoneExists) {
      throw new BusinessError('手机号已被其他用户使用', 409, 'PHONE_EXISTS')
    }

    updateData.phone = phone
  }

  if (email !== undefined) {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new ValidationError('请输入正确的邮箱格式')
      }

      // 检查邮箱是否被其他用户使用
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      })

      if (emailExists) {
        throw new BusinessError('邮箱已被其他用户使用', 409, 'EMAIL_EXISTS')
      }
    }
    updateData.email = email || null
  }

  if (role !== undefined) {
    const roleMapping: Record<string, UserRole> = {
      admin: 'SCHOOL_ADMIN',
      teacher: 'TEACHER',
      student: 'STUDENT'
    }

    const mappedRole = roleMapping[role]
    if (!mappedRole) {
      throw new ValidationError('无效的用户角色')
    }
    updateData.role = mappedRole
  }

  if (status !== undefined) {
    updateData.isActive = status === 'active'
  }

  // 更新用户信息
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      phone: true,
      email: true,
      realName: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  // 记录日志
  businessLogger.userAction(req.user!.id, 'UPDATE_USER', {
    targetUserId: userId,
    updateData: Object.keys(updateData)
  })

  res.json({
    code: 200,
    message: '用户信息更新成功',
    data: updatedUser
  })
}))

/**
 * 更新用户状态（启用/禁用）
 * PATCH /api/users/:id/status
 */
router.patch('/:id/status', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  // 参数验证
  const { error: idError } = validateIdParam(req.params.id)
  if (idError) {
    throw new ValidationError('用户ID无效')
  }

  const { isActive } = req.body
  if (typeof isActive !== 'boolean') {
    throw new ValidationError('isActive必须是boolean类型')
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, realName: true, role: true, isActive: true }
  })

  if (!user) {
    throw new BusinessError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  // 超级管理员不能被禁用
  if (user.role === UserRole.SUPER_ADMIN && !isActive) {
    throw new BusinessError('超级管理员不能被禁用', 400, 'CANNOT_DISABLE_SUPER_ADMIN')
  }

  // 不能禁用自己
  if (req.params.id === req.user!.id && !isActive) {
    throw new BusinessError('不能禁用自己的账号', 400, 'CANNOT_DISABLE_SELF')
  }

  // 更新用户状态
  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive },
    select: {
      id: true,
      realName: true,
      isActive: true
    }
  })

  // 记录操作日志
  businessLogger.userAction(req.user!.id, 'USER_STATUS_UPDATE', {
    targetUserId: updatedUser.id,
    targetUserName: updatedUser.realName,
    oldStatus: user.isActive,
    newStatus: isActive
  })

  res.json({
    code: 200,
    message: `用户${isActive ? '启用' : '禁用'}成功`,
    data: updatedUser
  })
}))

/**
 * 更新用户角色
 * PATCH /api/users/:id/role
 */
router.patch('/:id/role', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  // 参数验证
  const { error: idError } = validateIdParam(req.params.id)
  if (idError) {
    throw new ValidationError('用户ID无效')
  }

  const { role } = req.body
  if (!role || !Object.values(UserRole).includes(role)) {
    throw new ValidationError('用户角色无效')
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, realName: true, role: true }
  })

  if (!user) {
    throw new BusinessError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  // 只有超级管理员可以设置超级管理员角色
  if (role === UserRole.SUPER_ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
    throw new BusinessError('只有超级管理员可以设置超级管理员角色', 403, 'INSUFFICIENT_PERMISSION')
  }

  // 不能修改自己的角色
  if (req.params.id === req.user!.id) {
    throw new BusinessError('不能修改自己的角色', 400, 'CANNOT_MODIFY_SELF_ROLE')
  }

  // 更新用户角色
  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: {
      id: true,
      realName: true,
      role: true
    }
  })

  // 记录操作日志
  businessLogger.userAction(req.user!.id, 'USER_ROLE_UPDATE', {
    targetUserId: updatedUser.id,
    targetUserName: updatedUser.realName,
    oldRole: user.role,
    newRole: role
  })

  res.json({
    code: 200,
    message: '用户角色更新成功',
    data: updatedUser
  })
}))

/**
 * 删除用户
 * DELETE /api/users/:id
 */
router.delete('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  // 参数验证
  const { error: idError } = validateIdParam(req.params.id)
  if (idError) {
    throw new ValidationError('用户ID无效')
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { 
      id: true, 
      realName: true, 
      role: true,
      studentProfile: { select: { id: true } },
      teacherProfile: { select: { id: true } }
    }
  })

  if (!user) {
    throw new BusinessError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  // 超级管理员不能被删除
  if (user.role === UserRole.SUPER_ADMIN) {
    throw new BusinessError('超级管理员不能被删除', 400, 'CANNOT_DELETE_SUPER_ADMIN')
  }

  // 不能删除自己
  if (req.params.id === req.user!.id) {
    throw new BusinessError('不能删除自己的账号', 400, 'CANNOT_DELETE_SELF')
  }

  // 检查是否有关联数据
  if (user.studentProfile || user.teacherProfile) {
    throw new BusinessError('该用户有关联的学生或教师档案，无法删除', 400, 'USER_HAS_PROFILE')
  }

  // 删除用户
  await prisma.user.delete({
    where: { id: req.params.id }
  })

  // 记录操作日志
  businessLogger.userAction(req.user!.id, 'USER_DELETE', {
    targetUserId: user.id,
    targetUserName: user.realName,
    targetRole: user.role
  })

  res.json({
    code: 200,
    message: '用户删除成功'
  })
}))

/**
 * 重置用户密码
 * POST /api/users/:id/reset-password
 */
router.post('/:id/reset-password', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  // 参数验证
  const { error: idError } = validateIdParam(req.params.id)
  if (idError) {
    throw new ValidationError('用户ID无效')
  }

  const { newPassword } = req.body
  const userId = req.params.id

  // 验证新密码
  if (!newPassword || newPassword.length < 6) {
    throw new ValidationError('密码长度至少6个字符')
  }

  // 检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new BusinessError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  // 密码加密
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // 更新密码
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      mustChangePassword: true // 重置后需要修改密码
    }
  })

  // 记录操作日志
  businessLogger.userAction(req.user!.id, 'USER_PASSWORD_RESET', {
    targetUserId: userId,
    targetUserName: user.realName
  })

  res.json({
    code: 200,
    message: '密码重置成功',
    data: null
  })
}))

/**
 * 获取当前用户信息
 * GET /api/users/me
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      phone: true,
      email: true,
      realName: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      studentProfile: {
        select: {
          id: true,
          studentCode: true,
          name: true,
          gender: true,
          age: true
        }
      },
      teacherProfile: {
        select: {
          id: true,
          teacherCode: true,
          realName: true,
          specialties: true,
          experience: true
        }
      }
    }
  })

  if (!user) {
    throw new BusinessError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  res.json({
    code: 200,
    message: '查询成功',
    data: user
  })
}))

export default router
