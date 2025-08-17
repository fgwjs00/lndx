/**
 * 应用配置文件
 * @description 统一管理环境变量和应用配置
 */

import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * 应用配置接口
 */
export interface AppConfig {
  // 基础配置
  nodeEnv: string
  port: number
  apiPrefix: string
  
  // 数据库配置
  databaseUrl: string
  
  // JWT配置
  jwtSecret: string
  jwtExpiresIn: string
  jwtRefreshExpiresIn: string
  
  // 加密配置
  bcryptRounds: number
  
  // 短信配置
  sms: {
    accessKeyId: string
    accessKeySecret: string
    signName: string
    templateCode: string
  }
  
  // 邮件配置
  smtp: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  
  // Redis配置
  redis: {
    host: string
    port: number
    password: string
    db: number
  }
  
  // 文件上传配置
  upload: {
    path: string
    maxSize: number
    allowedTypes: string[]
  }
  
  // 日志配置
  log: {
    level: string
    maxSize: string
    maxFiles: string
  }
  
  // 跨域配置
  corsOrigin: string | string[]
  
  // API限流配置
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
  
  // 外部服务配置
  services: {
    faceRecognition: {
      apiUrl: string
      apiKey: string
    }
    idCardRecognition: {
      apiUrl: string
      apiKey: string
    }
  }
}

/**
 * 解析环境变量为数组
 */
const parseArray = (value: string | undefined, defaultValue: string[] = []): string[] => {
  if (!value) return defaultValue
  return value.split(',').map(item => item.trim())
}

/**
 * 解析环境变量为布尔值
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

/**
 * 解析环境变量为数字
 */
const parseNumber = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * 应用配置实例
 */
export const config: AppConfig = {
  // 基础配置
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/lndx_db',
  
  // JWT配置
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // 加密配置
  bcryptRounds: parseNumber(process.env.BCRYPT_ROUNDS, 12),
  
  // 短信配置
  sms: {
    accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || '学生管理系统',
    templateCode: process.env.SMS_TEMPLATE_CODE || 'SMS_123456789'
  },
  
  // 邮件配置
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || '',
    db: parseNumber(process.env.REDIS_DB, 0)
  },
  
  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads',
    maxSize: parseNumber(process.env.UPLOAD_MAX_SIZE, 5242880), // 5MB
    allowedTypes: parseArray(process.env.ALLOWED_FILE_TYPES, ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },
  
  // 跨域配置
  corsOrigin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.includes(',') ? 
      parseArray(process.env.CORS_ORIGIN) : 
      process.env.CORS_ORIGIN :
    'http://localhost:5173',
  
  // API限流配置
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15分钟
    maxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100)
  },
  
  // 外部服务配置
  services: {
    faceRecognition: {
      apiUrl: process.env.FACE_RECOGNITION_API_URL || 'http://localhost:5000',
      apiKey: process.env.FACE_RECOGNITION_API_KEY || ''
    },
    idCardRecognition: {
      apiUrl: process.env.ID_CARD_RECOGNITION_API_URL || 'http://localhost:5001',
      apiKey: process.env.ID_CARD_RECOGNITION_API_KEY || ''
    }
  }
}

/**
 * 验证配置完整性
 */
export const validateConfig = (): void => {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:', missing.join(', '))
    console.error('请检查 .env 文件或环境变量设置')
    process.exit(1)
  }
  
  console.log('✅ 配置验证通过')
}

// 开发模式下验证配置
if (config.nodeEnv === 'development') {
  validateConfig()
}

