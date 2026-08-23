/**
 * 学生报名及档案管理系统后端服务
 * @description 基于Express + TypeScript + Prisma的后端API服务
 * @author LNDX Team
 * @version 1.0.0
 */

import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { prisma } from '@/lib/prisma'

// 导入配置和中间件
import { config } from '@/config'
import { errorHandler } from '@/middleware/errorHandler'
import { rateLimiter } from '@/middleware/rateLimiter'
import { assetAuthMiddleware, authMiddleware, generateAssetToken, sanitizeAuthUrl } from '@/middleware/auth'
import { assetAccessMiddleware } from '@/middleware/assetAccess'
import { logger } from '@/utils/logger'
import { setupSwagger } from '@/utils/swagger'

// 导入路由
import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/user'
import studentRoutes from '@/routes/student'
import courseRoutes from '@/routes/course'
import enrollmentRoutes from '@/routes/enrollment'
import applicationRoutes from '@/routes/application'
import applicationV2Routes from '@/routes/applicationV2'
import gradeManagementRoutes from '@/routes/gradeManagement'
import attendanceRoutes from '@/routes/attendance'
import uploadRoutes from '@/routes/upload'
import searchRoutes from '@/routes/search'
import roleRoutes from '@/routes/role'
import analysisRoutes from '@/routes/analysis'
import publicRegistrationRoutes from '@/routes/publicRegistration'
import insuranceRoutes from '@/routes/insurance'

// 加载环境变量
dotenv.config()

/**
 * 创建Express应用实例
 */
const app = express()

const sanitizeMorganMessage = (message: string): string => sanitizeAuthUrl(message.trim())

/**
 * 基础中间件配置
 */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})) // 安全头设置
app.use(compression()) // 响应压缩
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
})) // 跨域配置
app.use(express.json({ limit: '10mb' })) // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })) // URL编码解析
app.use(morgan('combined', { stream: { write: message => logger.info(sanitizeMorganMessage(message)) } })) // 日志记录

/**
 * 安全中间件
 */
app.use(rateLimiter) // API限流

/**
 * API路由配置
 */
const apiPrefix = config.apiPrefix || '/api'

/**
 * API文档设置
 */
setupSwagger(app)

const handleHealthCheck = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'healthy',
        api: 'healthy'
      }
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unhealthy',
        api: 'healthy'
      }
    })
  }
}

/**
 * 健康检查接口
 */
app.get('/health', handleHealthCheck)
app.get(`${apiPrefix}/health`, handleHealthCheck)

// API前缀下的健康检查
app.get(`${apiPrefix}/health`, handleHealthCheck)

/**
 * 静态文件服务 - 用于提供上传的图片文件
 */
app.get(`${apiPrefix}/assets/token`, authMiddleware, (req: Request, res: Response) => {
  res.json({
    code: 200,
    message: 'Asset token issued',
    data: {
      assetToken: generateAssetToken({ id: req.user!.id }),
      expiresInSeconds: 600
    }
  })
})

app.use('/uploads', assetAuthMiddleware, assetAccessMiddleware, (_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store')
  next()
}, express.static(path.join(__dirname, '../uploads')))

// 公开路由（不需要认证）
app.use(`${apiPrefix}/auth`, authRoutes)
app.use(`${apiPrefix}/public-registration`, publicRegistrationRoutes)
app.use(`${apiPrefix}/upload`, uploadRoutes) // 文件上传（身份证识别等）

// 需要认证的路由
app.use(`${apiPrefix}/users`, authMiddleware, userRoutes)
app.use(`${apiPrefix}/students`, authMiddleware, studentRoutes)
app.use(`${apiPrefix}/courses`, authMiddleware, courseRoutes)
app.use(`${apiPrefix}/insurances`, authMiddleware, insuranceRoutes)
app.use(`${apiPrefix}/enrollments`, authMiddleware, enrollmentRoutes)
app.use(`${apiPrefix}/applications`, authMiddleware, applicationRoutes) // 报名申请路由
app.use(`${apiPrefix}/applications-v2`, applicationV2Routes) // 新版报名申请路由（含年级管理）
app.use(`${apiPrefix}/attendance`, authMiddleware, attendanceRoutes)
app.use(`${apiPrefix}/analysis`, authMiddleware, analysisRoutes) // 数据分析路由
app.use(`${apiPrefix}/roles`, authMiddleware, roleRoutes) // 角色管理路由
app.use(`${apiPrefix}/grade-management`, authMiddleware, gradeManagementRoutes) // 年级管理路由
app.use(`${apiPrefix}/search`, searchRoutes)

/**
 * 404处理
 */
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: `API接口 ${req.method} ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  })
})

/**
 * 全局错误处理
 */
app.use(errorHandler)

/**
 * 启动服务器
 */
const port = config.port || 3000

const server = app.listen(port, () => {
  logger.info(`🚀 服务器启动成功！`)
  logger.info(`📍 服务地址: http://localhost:${port}`)
  logger.info(`🌍 环境模式: ${config.nodeEnv}`)
  logger.info(`📁 API前缀: ${apiPrefix}`)
  logger.info(`⏰ 启动时间: ${new Date().toISOString()}`)
})

/**
 * 优雅关闭处理
 */
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭服务器...')
  server.close(() => {
    logger.info('服务器已关闭')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭服务器...')
  server.close(() => {
    logger.info('服务器已关闭')
    process.exit(0)
  })
})

/**
 * 未捕获异常处理
 */
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason, promise })
  process.exit(1)
})

export default app
