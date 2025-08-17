/**
 * 用户管理路由
 * @description 处理用户相关的CRUD操作
 */

import { Router } from 'express'
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
 *     description: 获取系统中的用户列表，支持分页和搜索
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
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  // 参数验证
  const { error, value } = validatePaginationData(req.query)
  if (error) {
    throw new ValidationError('参数验证失败', error.details)
  }

  const { page, pageSize, keyword, sortField, sortOrder } = value

  // 构建查询条件
  const where: any = {}
  if (keyword) {
    where.OR = [
      { realName: { contains: keyword } },
      { phone: { contains: keyword } },
      { email: { contains: keyword } }
    ]
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
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })
}))

/**
 * 获取用户详情
 * GET /api/users/:id
 */
router.get('/:id', requireOwnerOrAdmin(async (req) => {
  return req.params.id
}), asyncHandler(async (req, res) => {
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
          realName: true,
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
 * 更新用户状态（启用/禁用）
 * PATCH /api/users/:id/status
 */
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
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
router.patch('/:id/role', requireAdmin, asyncHandler(async (req, res) => {
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
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
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
 * 获取当前用户信息
 * GET /api/users/me
 */
router.get('/me', asyncHandler(async (req, res) => {
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
          realName: true,
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
