/**
 * 日志工具
 * @description 基于winston的日志记录系统
 */

import { createLogger, format, transports, Logger } from 'winston'
import { config } from '@/config'
import path from 'path'

/**
 * 自定义日志格式
 */
const customFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // 添加堆栈信息（错误时）
    if (stack) {
      log += `\n${stack}`
    }
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

/**
 * 控制台输出格式（开发模式带颜色）
 */
const consoleFormat = format.combine(
  format.colorize(),
  customFormat
)

/**
 * 创建logger实例
 */
export const logger: Logger = createLogger({
  level: config.log.level,
  format: customFormat,
  transports: [
    // 控制台输出
    new transports.Console({
      format: config.nodeEnv === 'development' ? consoleFormat : customFormat
    }),
    
    // 所有日志文件
    new transports.File({
      filename: path.join('logs', 'app.log'),
      maxsize: parseSize(config.log.maxSize),
      maxFiles: parseInt(config.log.maxFiles) || 14,
      tailable: true
    }),
    
    // 错误日志文件
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: parseSize(config.log.maxSize),
      maxFiles: parseInt(config.log.maxFiles) || 14,
      tailable: true
    })
  ],
  
  // 退出时不等待日志写入完成
  exitOnError: false
})

/**
 * 解析文件大小字符串
 * @param sizeStr 大小字符串 (如: '20m', '100k', '1g')
 * @returns 字节数
 */
function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+)([kmg])?$/i)
  if (!match) return 20 * 1024 * 1024 // 默认20MB
  
  const [, num, unit] = match
  const size = parseInt(num, 10)
  
  switch (unit?.toLowerCase()) {
    case 'k': return size * 1024
    case 'm': return size * 1024 * 1024
    case 'g': return size * 1024 * 1024 * 1024
    default: return size
  }
}

/**
 * 请求日志中间件辅助函数
 * @param req Express请求对象
 * @param res Express响应对象
 * @param responseTime 响应时间（毫秒）
 */
export const logRequest = (req: any, res: any, responseTime?: number): void => {
  const { method, url, ip, headers } = req
  const { statusCode } = res
  
  const logData = {
    method,
    url,
    ip: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
    userAgent: headers['user-agent'],
    statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined
  }
  
  if (statusCode >= 400) {
    logger.warn('HTTP请求异常', logData)
  } else {
    logger.info('HTTP请求', logData)
  }
}

/**
 * 业务日志记录器
 */
export const businessLogger = {
  /**
   * 用户操作日志
   */
  userAction: (userId: string, action: string, details?: any): void => {
    logger.info('用户操作', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    })
  },
  
  /**
   * 系统操作日志
   */
  systemAction: (action: string, details?: any): void => {
    logger.info('系统操作', {
      action,
      details,
      timestamp: new Date().toISOString()
    })
  },
  
  /**
   * 数据库操作日志
   */
  dbOperation: (operation: string, table: string, details?: any): void => {
    logger.info('数据库操作', {
      operation,
      table,
      details,
      timestamp: new Date().toISOString()
    })
  },
  
  /**
   * API调用日志
   */
  apiCall: (service: string, endpoint: string, success: boolean, details?: any): void => {
    const level = success ? 'info' : 'error'
    logger[level]('外部API调用', {
      service,
      endpoint,
      success,
      details,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * 错误日志记录器
 */
export const errorLogger = {
  /**
   * 业务错误
   */
  business: (error: Error, context?: any): void => {
    logger.error('业务错误', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  },
  
  /**
   * 系统错误
   */
  system: (error: Error, context?: any): void => {
    logger.error('系统错误', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  },
  
  /**
   * 数据库错误
   */
  database: (error: Error, query?: string, params?: any): void => {
    logger.error('数据库错误', {
      message: error.message,
      stack: error.stack,
      query,
      params,
      timestamp: new Date().toISOString()
    })
  },
  
  /**
   * 外部服务错误
   */
  external: (service: string, error: Error, details?: any): void => {
    logger.error('外部服务错误', {
      service,
      message: error.message,
      stack: error.stack,
      details,
      timestamp: new Date().toISOString()
    })
  }
}

// 创建logs目录（如果不存在）
const fs = require('fs')
const logsDir = 'logs'
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

export default logger

