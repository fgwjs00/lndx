/**
 * 文件上传路由
 * @description 处理文件上传相关操作（身份证识别、头像上传等）
 */

import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { uploadLimiter } from '@/middleware/rateLimiter'

const router = Router()

/**
 * 身份证识别上传
 * POST /api/upload/id-card
 */
router.post('/id-card', uploadLimiter, asyncHandler(async (req, res) => {
  // TODO: 实现身份证识别
  res.json({
    code: 200,
    message: '身份证识别成功',
    data: {
      name: '张三',
      idCard: '123456789012345678',
      address: '北京市朝阳区',
      imageFront: 'http://example.com/id-front.jpg',
      imageBack: 'http://example.com/id-back.jpg'
    }
  })
}))

/**
 * 头像上传
 * POST /api/upload/avatar
 */
router.post('/avatar', uploadLimiter, asyncHandler(async (req, res) => {
  // TODO: 实现头像上传
  res.json({
    code: 200,
    message: '头像上传成功',
    data: {
      url: 'http://example.com/avatar.jpg'
    }
  })
}))

export default router

