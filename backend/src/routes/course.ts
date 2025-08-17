/**
 * 课程管理路由
 * @description 处理课程相关的CRUD操作
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '@/middleware/errorHandler'
import { requireTeacher } from '@/middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取课程列表
 * GET /api/courses
 */
router.get('/', asyncHandler(async (req, res) => {
  // TODO: 实现课程列表查询
  res.json({
    code: 200,
    message: '课程列表查询成功',
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
 * 创建课程
 * POST /api/courses
 */
router.post('/', requireTeacher, asyncHandler(async (req, res) => {
  // TODO: 实现课程创建
  res.json({
    code: 201,
    message: '课程创建成功',
    data: {}
  })
}))

/**
 * 获取课程详情
 * GET /api/courses/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  // TODO: 实现课程详情查询
  res.json({
    code: 200,
    message: '课程详情查询成功',
    data: {}
  })
}))

/**
 * 更新课程信息
 * PUT /api/courses/:id
 */
router.put('/:id', requireTeacher, asyncHandler(async (req, res) => {
  // TODO: 实现课程信息更新
  res.json({
    code: 200,
    message: '课程信息更新成功',
    data: {}
  })
}))

/**
 * 删除课程
 * DELETE /api/courses/:id
 */
router.delete('/:id', requireTeacher, asyncHandler(async (req, res) => {
  // TODO: 实现课程删除
  res.json({
    code: 200,
    message: '课程删除成功'
  })
}))

export default router

