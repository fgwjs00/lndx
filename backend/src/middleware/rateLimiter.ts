/**
 * API限流中间件
 * @description 防止API被恶意调用，保护服务器资源
 */

import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { config } from '@/config'
import { logger } from '@/utils/logger'

/**
 * 通用限流配置
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 时间窗口
  max: 1000,   // 临时增加到1000个请求 (开发调试用)
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    error: 'TOO_MANY_REQUESTS',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // 返回限流信息到 `RateLimit-*` headers
  legacyHeaders: false, // 不使用 `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('API限流触发', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    })
    
    res.status(429).json({
      code: 429,
      message: '请求过于频繁，请稍后再试',
      error: 'TOO_MANY_REQUESTS',
      timestamp: new Date().toISOString()
    })
  },
  keyGenerator: (req) => {
    // 优先使用真实IP
    return req.ip || req.connection.remoteAddress || 'unknown'
  }
})

/**
 * 登录接口限流（更严格）
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  skipSuccessfulRequests: true, // 成功请求不计入限流
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试',
    error: 'LOGIN_ATTEMPTS_EXCEEDED',
    timestamp: new Date().toISOString()
  },
  handler: (req, res) => {
    logger.warn('登录限流触发', {
      ip: req.ip,
      phone: req.body?.phone,
      userAgent: req.get('User-Agent')
    })
    
    res.status(429).json({
      code: 429,
      message: '登录尝试次数过多，请15分钟后再试',
      error: 'LOGIN_ATTEMPTS_EXCEEDED',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * 短信发送限流
 */
export const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 每分钟最多1条
  message: {
    code: 429,
    message: '短信发送过于频繁，请1分钟后再试',
    error: 'SMS_RATE_LIMITED',
    timestamp: new Date().toISOString()
  },
  keyGenerator: (req) => {
    // 基于手机号限流
    return req.body?.phone || req.ip
  },
  handler: (req, res) => {
    logger.warn('短信限流触发', {
      ip: req.ip,
      phone: req.body?.phone,
      userAgent: req.get('User-Agent')
    })
    
    res.status(429).json({
      code: 429,
      message: '短信发送过于频繁，请1分钟后再试',
      error: 'SMS_RATE_LIMITED',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * 文件上传限流
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 最多50次上传
  message: {
    code: 429,
    message: '文件上传过于频繁，请稍后再试',
    error: 'UPLOAD_RATE_LIMITED',
    timestamp: new Date().toISOString()
  },
  handler: (req, res) => {
    logger.warn('上传限流触发', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    res.status(429).json({
      code: 429,
      message: '文件上传过于频繁，请稍后再试',
      error: 'UPLOAD_RATE_LIMITED',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * API减速中间件（逐渐增加响应延迟）
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  delayAfter: config.rateLimit.maxRequests / 2, // 超过一半请求数开始延迟
  delayMs: () => 500, // 固定延迟500ms
  maxDelayMs: 20000, // 最大延迟20秒
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown'
  },
  validate: {
    delayMs: false // 禁用delayMs警告
  }
})

/**
 * 创建自定义限流器
 * @param windowMs 时间窗口（毫秒）
 * @param max 最大请求数
 * @param message 限流消息
 * @returns 限流中间件
 */
export const createLimiter = (
  windowMs: number,
  max: number,
  message: string = '请求过于频繁，请稍后再试'
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      code: 429,
      message,
      error: 'TOO_MANY_REQUESTS',
      timestamp: new Date().toISOString()
    },
    handler: (req, res) => {
      logger.warn('自定义限流触发', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        windowMs,
        max
      })
      
      res.status(429).json({
        code: 429,
        message,
        error: 'TOO_MANY_REQUESTS',
        timestamp: new Date().toISOString()
      })
    }
  })
}

/**
 * 基于用户的限流器
 * @param windowMs 时间窗口（毫秒）
 * @param max 最大请求数
 * @param message 限流消息
 */
export const createUserLimiter = (
  windowMs: number,
  max: number,
  message: string = '操作过于频繁，请稍后再试'
) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req: any) => {
      // 基于用户ID限流
      return req.user?.id || req.ip
    },
    message: {
      code: 429,
      message,
      error: 'USER_RATE_LIMITED',
      timestamp: new Date().toISOString()
    },
    handler: (req, res) => {
      logger.warn('用户限流触发', {
        userId: (req as any).user?.id,
        ip: req.ip,
        url: req.url,
        method: req.method
      })
      
      res.status(429).json({
        code: 429,
        message,
        error: 'USER_RATE_LIMITED',
        timestamp: new Date().toISOString()
      })
    }
  })
}
