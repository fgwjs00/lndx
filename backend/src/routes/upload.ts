/**
 * 文件上传路由
 * @description 仅保留真实能力；未接入 OCR/头像存储前不返回模拟数据
 */

import { Router } from 'express'
import { asyncHandler, BusinessError } from '@/middleware/errorHandler'
import { uploadLimiter } from '@/middleware/rateLimiter'

const router = Router()
const NOT_IMPLEMENTED = 'NOT_IMPLEMENTED'

/**
 * 身份证识别上传
 * POST /api/upload/id-card
 */
router.post('/id-card', uploadLimiter, asyncHandler(async () => {
  throw new BusinessError('身份证识别尚未接入真实OCR服务', 501, NOT_IMPLEMENTED)
}))

/**
 * 头像上传
 * POST /api/upload/avatar
 */
router.post('/avatar', uploadLimiter, asyncHandler(async () => {
  throw new BusinessError('头像上传请使用已接入的用户头像接口', 501, NOT_IMPLEMENTED)
}))

export default router
