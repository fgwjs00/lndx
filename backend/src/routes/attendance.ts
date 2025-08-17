/**
 * 考勤管理路由
 * @description 处理学生签到考勤相关的操作
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '@/middleware/errorHandler'
import { requireTeacher } from '@/middleware/auth'

const router = Router()
const prisma = new PrismaClient()

/**
 * 获取考勤记录列表
 * GET /api/attendance
 */
router.get('/', requireTeacher, asyncHandler(async (req, res) => {
  // TODO: 实现考勤记录查询
  res.json({
    code: 200,
    message: '考勤记录查询成功',
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
 * 创建签到记录
 * POST /api/attendance
 */
router.post('/', asyncHandler(async (req, res) => {
  // TODO: 实现学生签到
  res.json({
    code: 201,
    message: '签到成功',
    data: {}
  })
}))

/**
 * 人脸识别签到
 * POST /api/attendance/face-recognition
 */
router.post('/face-recognition', asyncHandler(async (req, res) => {
  // TODO: 实现人脸识别签到
  res.json({
    code: 200,
    message: '人脸识别签到成功',
    data: {}
  })
}))

export default router

