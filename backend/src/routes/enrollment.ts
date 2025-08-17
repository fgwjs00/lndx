/**
 * 报名管理路由
 * @description 处理学生报名相关的操作
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '@/middleware/errorHandler'
import { requireTeacher } from '@/middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取报名列表
 * GET /api/enrollments
 */
router.get('/', requireTeacher, asyncHandler(async (req, res) => {
  // TODO: 实现报名列表查询
  res.json({
    code: 200,
    message: '报名列表查询成功',
    data: {
      list: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      }
    }
  })
}))

/**
 * 创建报名
 * POST /api/enrollments
 */
router.post('/', asyncHandler(async (req, res) => {
  // TODO: 实现学生报名
  res.json({
    code: 201,
    message: '报名成功',
    data: {}
  })
}))

/**
 * 审核报名
 * PATCH /api/enrollments/:id/approve
 */
router.patch('/:id/approve', requireTeacher, asyncHandler(async (req, res) => {
  // TODO: 实现报名审核
  res.json({
    code: 200,
    message: '报名审核成功',
    data: {}
  })
}))

export default router

