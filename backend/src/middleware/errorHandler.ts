/**
 * 全局错误处理中间件
 * @description 统一处理应用中的所有错误
 */

import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { logger, errorLogger } from '@/utils/logger'
import { config } from '@/config'

/**
 * 自定义业务错误类
 */
export class BusinessError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(message: string, statusCode: number = 400, code?: string, details?: any) {
    super(message)
    this.name = 'BusinessError'
    this.statusCode = statusCode
    this.code = code || 'BUSINESS_ERROR'
    this.details = details
  }
}

/**
 * 认证错误类
 */
export class AuthError extends Error {
  public statusCode: number = 401
  public code: string = 'AUTH_ERROR'

  constructor(message: string = '认证失败') {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * 权限错误类
 */
export class PermissionError extends Error {
  public statusCode: number = 403
  public code: string = 'PERMISSION_ERROR'

  constructor(message: string = '权限不足') {
    super(message)
    this.name = 'PermissionError'
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends Error {
  public statusCode: number = 400
  public code: string = 'VALIDATION_ERROR'
  public details: any

  constructor(message: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

/**
 * 处理Prisma数据库错误
 * @param error Prisma错误对象
 * @returns 格式化的错误响应
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
  let message = '数据库操作失败'
  let statusCode = 500
  let code = 'DATABASE_ERROR'

  switch (error.code) {
    case 'P2000':
      message = '输入数据过长'
      statusCode = 400
      code = 'DATA_TOO_LONG'
      break
    case 'P2002':
      message = '数据已存在，不能重复创建'
      statusCode = 409
      code = 'DUPLICATE_ERROR'
      break
    case 'P2014':
      message = '数据关系约束错误'
      statusCode = 400
      code = 'RELATION_ERROR'
      break
    case 'P2003':
      message = '外键约束失败'
      statusCode = 400
      code = 'FOREIGN_KEY_ERROR'
      break
    case 'P2025':
      message = '记录不存在'
      statusCode = 404
      code = 'RECORD_NOT_FOUND'
      break
    default:
      message = '数据库操作失败'
      break
  }

  return { message, statusCode, code, details: error.meta }
}

/**
 * 处理Joi验证错误
 * @param error Joi验证错误
 * @returns 格式化的错误响应
 */
const handleJoiError = (error: any) => {
  const message = error.details.map((detail: any) => detail.message).join('; ')
  return {
    message: `参数验证失败: ${message}`,
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    details: error.details
  }
}

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 记录错误日志
  errorLogger.system(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  })

  let statusCode = 500
  let code = 'INTERNAL_SERVER_ERROR'
  let message = '服务器内部错误'
  let details: any = undefined

  // 处理不同类型的错误
  if (error instanceof BusinessError) {
    statusCode = error.statusCode
    code = error.code
    message = error.message
    details = error.details
  } else if (error instanceof AuthError) {
    statusCode = error.statusCode
    code = error.code
    message = error.message
  } else if (error instanceof PermissionError) {
    statusCode = error.statusCode
    code = error.code
    message = error.message
  } else if (error instanceof ValidationError) {
    statusCode = error.statusCode
    code = error.code
    message = error.message
    details = error.details
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error)
    statusCode = prismaError.statusCode
    code = prismaError.code
    message = prismaError.message
    details = prismaError.details
  } else if (error.name === 'ValidationError' && (error as any).isJoi) {
    const joiError = handleJoiError(error)
    statusCode = joiError.statusCode
    code = joiError.code
    message = joiError.message
    details = joiError.details
  } else if (error.name === 'MulterError') {
    statusCode = 400
    code = 'FILE_UPLOAD_ERROR'
    message = '文件上传失败: ' + error.message
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 'TOKEN_INVALID'
    message = 'Token无效'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    code = 'TOKEN_EXPIRED'
    message = 'Token已过期'
  }

  // 构造错误响应
  const errorResponse: any = {
    code: statusCode,
    message,
    error: code,
    timestamp: new Date().toISOString(),
    path: req.url
  }

  // 开发环境下返回详细错误信息
  if (config.nodeEnv === 'development') {
    errorResponse.details = details
    errorResponse.stack = error.stack
  }

  // 发送错误响应
  res.status(statusCode).json(errorResponse)
}

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    code: 404,
    message: `API接口 ${req.method} ${req.originalUrl} 不存在`,
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.url
  })
}

/**
 * 异步错误包装器
 * @description 包装异步路由处理器，自动捕获Promise rejected
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

