/**
 * 短信服务
 * @description 处理短信验证码发送和验证
 */

import { config } from '@/config'
import { logger, businessLogger, errorLogger } from '@/utils/logger'

/**
 * 短信类型枚举
 */
export enum SmsType {
  REGISTER = 'register',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password',
  BIND_PHONE = 'bind_phone'
}

/**
 * 短信模板配置
 */
const SMS_TEMPLATES: Record<SmsType, { templateCode: string; content: string }> = {
  [SmsType.REGISTER]: {
    templateCode: 'SMS_REGISTER_001',
    content: '您的注册验证码是：{code}，有效期5分钟，请勿泄露。'
  },
  [SmsType.LOGIN]: {
    templateCode: 'SMS_LOGIN_001',
    content: '您的登录验证码是：{code}，有效期5分钟，请勿泄露。'
  },
  [SmsType.RESET_PASSWORD]: {
    templateCode: 'SMS_RESET_001',
    content: '您的密码重置验证码是：{code}，有效期5分钟，请勿泄露。'
  },
  [SmsType.BIND_PHONE]: {
    templateCode: 'SMS_BIND_001',
    content: '您的手机绑定验证码是：{code}，有效期5分钟，请勿泄露。'
  }
}

/**
 * 短信发送接口
 */
interface SmsProvider {
  sendSms(phone: string, code: string, type: SmsType): Promise<boolean>
}

/**
 * 阿里云短信服务实现
 */
class AliyunSmsProvider implements SmsProvider {
  private accessKeyId: string
  private accessKeySecret: string
  private signName: string

  constructor() {
    this.accessKeyId = config.sms.accessKeyId
    this.accessKeySecret = config.sms.accessKeySecret
    this.signName = config.sms.signName
  }

  async sendSms(phone: string, code: string, type: SmsType): Promise<boolean> {
    try {
      if (!this.accessKeyId || !this.accessKeySecret) {
        if (config.nodeEnv === 'production') {
          throw new Error('SMS_PROVIDER_NOT_CONFIGURED')
        }

        logger.warn('阿里云短信配置不完整，使用模拟发送')
        return this.simulateSms(phone, code, type)
      }

      const template = SMS_TEMPLATES[type]
      
      logger.info('发送短信', {
        phone,
        templateCode: template.templateCode,
        signName: this.signName,
        code: code.substring(0, 2) + '****' // 不记录完整验证码
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      return true
    } catch (error) {
      errorLogger.external('ALIYUN_SMS', error as Error, {
        phone,
        type,
        provider: 'aliyun'
      })
      return false
    }
  }

  /**
   * 模拟短信发送（开发环境使用）
   */
  private async simulateSms(phone: string, code: string, type: SmsType): Promise<boolean> {
    const template = SMS_TEMPLATES[type]
    const content = template.content.replace('{code}', code)
    
    logger.info('📱 模拟短信发送', {
      phone,
      content,
      type,
      templateCode: template.templateCode
    })

    // 在开发环境下，可以将验证码输出到控制台
    if (config.nodeEnv === 'development') {
      console.log(`\n📱 短信验证码 [${phone}]: ${code}\n`)
    }

    return true
  }
}

/**
 * 短信服务单例
 */
class SmsService {
  private provider: SmsProvider
  private codeCache: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map()
  private readonly CODE_EXPIRY = 5 * 60 * 1000 // 5分钟
  private readonly MAX_ATTEMPTS = 3 // 最大验证尝试次数

  constructor() {
    // 根据配置选择短信服务商
    this.provider = new AliyunSmsProvider()
    
    // 定时清理过期验证码
    setInterval(() => {
      this.cleanExpiredCodes()
    }, 60 * 1000) // 每分钟清理一次
  }

  /**
   * 发送短信验证码
   * @param phone 手机号
   * @param type 短信类型
   * @returns 是否发送成功
   */
  async sendSms(phone: string, type: SmsType): Promise<boolean> {
    try {
      // 检查发送频率限制
      const cacheKey = `${phone}:${type}`
      const cached = this.codeCache.get(cacheKey)
      
      if (cached && cached.expiresAt > Date.now()) {
        const remainingTime = Math.ceil((cached.expiresAt - Date.now()) / 1000)
        throw new Error(`验证码仍在有效期内，请${remainingTime}秒后再试`)
      }

      // 生成验证码
      const code = this.generateCode()
      
      // 发送短信
      const success = await this.provider.sendSms(phone, code, type)
      
      if (success) {
        // 存储验证码
        this.codeCache.set(cacheKey, {
          code,
          expiresAt: Date.now() + this.CODE_EXPIRY,
          attempts: 0
        })

        businessLogger.systemAction('SMS_SENT', {
          phone,
          type,
          success: true
        })

        return true
      } else {
        businessLogger.systemAction('SMS_SEND_FAILED', {
          phone,
          type,
          success: false
        })

        return false
      }
    } catch (error) {
      errorLogger.system(error as Error, { phone, type })
      return false
    }
  }

  /**
   * 验证短信验证码
   * @param phone 手机号
   * @param code 验证码
   * @param type 短信类型
   * @returns 是否验证成功
   */
  verifySms(phone: string, code: string, type: SmsType): { success: boolean; message: string } {
    const cacheKey = `${phone}:${type}`
    const cached = this.codeCache.get(cacheKey)

    if (!cached) {
      return { success: false, message: '验证码不存在或已过期' }
    }

    if (cached.expiresAt <= Date.now()) {
      this.codeCache.delete(cacheKey)
      return { success: false, message: '验证码已过期' }
    }

    if (cached.attempts >= this.MAX_ATTEMPTS) {
      this.codeCache.delete(cacheKey)
      return { success: false, message: '验证次数过多，请重新获取验证码' }
    }

    // 增加验证尝试次数
    cached.attempts++

    if (cached.code !== code) {
      businessLogger.systemAction('SMS_VERIFY_FAILED', {
        phone,
        type,
        attempts: cached.attempts,
        maxAttempts: this.MAX_ATTEMPTS
      })
      
      return { success: false, message: '验证码错误' }
    }

    // 验证成功，删除验证码
    this.codeCache.delete(cacheKey)
    
    businessLogger.systemAction('SMS_VERIFY_SUCCESS', {
      phone,
      type
    })

    return { success: true, message: '验证成功' }
  }

  /**
   * 生成6位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 清理过期的验证码
   */
  private cleanExpiredCodes(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, value] of this.codeCache.entries()) {
      if (value.expiresAt <= now) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => {
      this.codeCache.delete(key)
    })

    if (expiredKeys.length > 0) {
      logger.debug(`清理了${expiredKeys.length}个过期验证码`)
    }
  }

  /**
   * 获取验证码剩余有效时间（秒）
   * @param phone 手机号
   * @param type 短信类型
   */
  getRemainingTime(phone: string, type: SmsType): number {
    const cacheKey = `${phone}:${type}`
    const cached = this.codeCache.get(cacheKey)

    if (!cached || cached.expiresAt <= Date.now()) {
      return 0
    }

    return Math.ceil((cached.expiresAt - Date.now()) / 1000)
  }
}

// 导出单例实例
const smsService = new SmsService()

/**
 * 发送短信验证码
 * @param phone 手机号
 * @param code 验证码（兼容旧版本，如果不传则自动生成）
 * @param type 短信类型
 */
export const sendSms = async (phone: string, code: string, type: string): Promise<void> => {
  const smsType = type as SmsType
  const success = await smsService.sendSms(phone, smsType)
  
  if (!success) {
    throw new Error('短信发送失败')
  }
}

/**
 * 验证短信验证码
 */
export const verifySms = (phone: string, code: string, type: string) => {
  const smsType = type as SmsType
  return smsService.verifySms(phone, code, smsType)
}

/**
 * 生成短信验证码
 */
export const generateSmsCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 获取验证码剩余时间
 */
export const getSmsRemainingTime = (phone: string, type: string): number => {
  const smsType = type as SmsType
  return smsService.getRemainingTime(phone, smsType)
}

export default smsService

