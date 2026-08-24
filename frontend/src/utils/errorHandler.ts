/**
 * 统一错误处理工具
 * @description 提供统一的错误处理、用户反馈和错误恢复机制
 */

import { message, Modal } from 'ant-design-vue'

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API', 
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  BUSINESS = 'BUSINESS',
  UNKNOWN = 'UNKNOWN'
}

// 错误级别枚举
export enum ErrorLevel {
  INFO = 'INFO',
  WARNING = 'WARNING', 
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType
  level: ErrorLevel
  message: string
  originalError?: any
  context?: any
  action?: string
  suggestions?: string[]
  retryable?: boolean
}

// 错误处理配置
export interface ErrorHandlerConfig {
  showUserMessage?: boolean
  logToConsole?: boolean
  reportToServer?: boolean
  showRetryButton?: boolean
  autoRetry?: boolean
  retryCount?: number
  retryDelay?: number
}

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  private static defaultConfig: ErrorHandlerConfig = {
    showUserMessage: true,
    logToConsole: true,
    reportToServer: false,
    showRetryButton: false,
    autoRetry: false,
    retryCount: 3,
    retryDelay: 1000
  }

  /**
   * 处理API调用错误
   * @param error 原始错误对象
   * @param context 上下文信息
   * @param config 处理配置
   * @returns 格式化的错误信息
   */
  static handleApiError(
    error: any, 
    context: string = '',
    config: ErrorHandlerConfig = {}
  ): ErrorInfo {
    const finalConfig = { ...this.defaultConfig, ...config }
    const errorInfo = this.parseError(error, context)
    
    if (finalConfig.logToConsole) {
      this.logError(errorInfo)
    }
    
    if (finalConfig.showUserMessage) {
      this.showUserMessage(errorInfo, finalConfig)
    }
    
    if (finalConfig.reportToServer) {
      this.reportError(errorInfo)
    }
    
    return errorInfo
  }

  /**
   * 解析错误信息
   * @param error 原始错误
   * @param context 上下文
   * @returns 格式化错误信息
   */
  private static parseError(error: any, context: string): ErrorInfo {
    const errorInfo: ErrorInfo = {
      type: ErrorType.UNKNOWN,
      level: ErrorLevel.ERROR,
      message: '未知错误',
      originalError: error,
      context: context,
      retryable: false
    }

    // 网络错误
    if (!error.response && error.message && (error.message.includes('网络') || error.message.includes('连接'))) {
      errorInfo.type = ErrorType.NETWORK
      errorInfo.message = '网络连接失败，请检查网络后重试'
      errorInfo.suggestions = ['检查网络连接', '刷新页面重试', '联系技术支持']
      errorInfo.retryable = true
    }
    // HTTP状态码错误
    else if (error.response) {
      const status = error.response.status
      const backendMessage = error.response.data?.message || error.message
      
      switch (status) {
        case 400:
          errorInfo.type = ErrorType.VALIDATION
          errorInfo.level = ErrorLevel.WARNING
          errorInfo.message = backendMessage || '请求参数有误，请检查输入信息'
          errorInfo.suggestions = ['检查输入信息是否正确', '确认必填项已填写']
          break
          
        case 401:
          errorInfo.type = ErrorType.PERMISSION
          errorInfo.message = backendMessage || '登录已过期，请重新登录'
          errorInfo.suggestions = ['重新登录', '清除浏览器缓存']
          errorInfo.action = 'REDIRECT_LOGIN'
          break
          
        case 403:
          errorInfo.type = ErrorType.PERMISSION
          errorInfo.message = backendMessage || '权限不足，无法执行此操作'
          errorInfo.suggestions = ['联系管理员获取权限', '切换具有相应权限的账号']
          break
          
        case 404:
          errorInfo.type = ErrorType.API
          errorInfo.message = backendMessage || '请求的资源不存在'
          errorInfo.suggestions = ['刷新页面重试', '检查访问路径是否正确']
          break
          
        case 429:
          errorInfo.type = ErrorType.API
          errorInfo.level = ErrorLevel.WARNING
          errorInfo.message = backendMessage || '操作过于频繁，请稍后再试'
          errorInfo.suggestions = ['稍等片刻再重试', '避免频繁操作']
          errorInfo.retryable = true
          break
          
        case 409:
          errorInfo.type = ErrorType.BUSINESS
          errorInfo.level = ErrorLevel.WARNING
          errorInfo.message = backendMessage || '数据冲突，请检查输入'
          errorInfo.suggestions = ['检查输入信息是否重复', '尝试使用不同的数据']
          break
          
        case 500:
          errorInfo.type = ErrorType.API
          errorInfo.level = ErrorLevel.CRITICAL
          errorInfo.message = backendMessage || '服务器内部错误'
          errorInfo.suggestions = ['刷新页面重试', '联系技术支持']
          errorInfo.retryable = true
          break
          
        default:
          errorInfo.type = ErrorType.API
          errorInfo.message = backendMessage || `请求失败 (${status})`
          errorInfo.retryable = status >= 500
      }
    }
    // 其他类型错误
    else if (error.message) {
      errorInfo.message = error.message
      errorInfo.type = this.inferErrorType(error.message)
      
      // 特殊处理：如果是冲突相关的错误，设置为业务错误类型
      if (error.message.includes('已被使用') || error.message.includes('重复') || error.message.includes('冲突')) {
        errorInfo.type = ErrorType.BUSINESS
        errorInfo.level = ErrorLevel.WARNING
        errorInfo.suggestions = ['检查输入信息是否重复', '尝试使用不同的数据']
      }
    }

    return errorInfo
  }

  /**
   * 根据错误信息推断错误类型
   */
  private static inferErrorType(errorMessage: string): ErrorType {
    if (errorMessage.includes('网络') || errorMessage.includes('连接')) return ErrorType.NETWORK
    if (errorMessage.includes('验证') || errorMessage.includes('格式')) return ErrorType.VALIDATION
    if (errorMessage.includes('权限') || errorMessage.includes('登录')) return ErrorType.PERMISSION
    return ErrorType.BUSINESS
  }

  /**
   * 显示用户错误信息
   */
  private static showUserMessage(errorInfo: ErrorInfo, config: ErrorHandlerConfig): void {
    const { type, level, message: errorMessage, suggestions, retryable } = errorInfo

    // 根据错误级别选择不同的显示方式
    switch (level) {
      case ErrorLevel.INFO:
        message.info(errorMessage)
        break
        
      case ErrorLevel.WARNING:
        message.warning(errorMessage)
        break
        
      case ErrorLevel.CRITICAL:
        // 严重错误使用Modal显示
        Modal.error({
          title: '系统错误',
          content: errorMessage,
          okText: '确定'
        })
        break
        
      default:
        // 对于一些特定错误，提供更友好的提示
        if (type === ErrorType.NETWORK) {
          message.error({
            content: errorMessage,
            duration: 5,
            key: 'network-error' // 避免重复显示网络错误
          })
        } else if (retryable && config.showRetryButton) {
          // TODO: 实现带重试按钮的错误提示
          message.error(errorMessage)
        } else {
          message.error(errorMessage)
        }
    }

    // 在控制台显示建议
    if (suggestions && suggestions.length > 0) {
      console.log(`💡 错误解决建议:`, suggestions)
    }
  }

  /**
   * 记录错误到控制台
   */
  private static logError(errorInfo: ErrorInfo): void {
    const { type, level, message: errorMessage, context, originalError } = errorInfo
    
    console.group(`%c🚨 错误处理 [${type}] [${level}]`, 'color: #ef4444; font-weight: bold;')
    console.log(`📍 上下文: ${context}`)
    console.log(`📝 错误信息: ${errorMessage}`)
    if (originalError) {
      console.log(`🔍 原始错误:`, originalError)
    }
    if (errorInfo.suggestions) {
      console.log(`💡 解决建议:`, errorInfo.suggestions)
    }
    console.groupEnd()
  }

  /**
   * 上报错误到服务器（可选）
   */
  private static reportError(errorInfo: ErrorInfo): void {
    // TODO: 实现错误上报功能
    if (errorInfo.level === ErrorLevel.CRITICAL) {
      console.log('🚨 严重错误，应该上报到服务器:', errorInfo)
    }
  }

  /**
   * 创建重试函数
   * @param originalFunction 原始函数
   * @param maxRetries 最大重试次数
   * @param delay 重试延迟
   */
  static createRetryHandler<T extends (...args: any[]) => Promise<any>>(
    originalFunction: T,
    maxRetries: number = 3,
    delay: number = 1000
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: any
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalFunction(...args)
        } catch (error) {
          lastError = error
          
          const errorInfo = this.parseError(error, `重试 ${attempt + 1}/${maxRetries + 1}`)
          
          // 如果不可重试，直接抛出错误
          if (!errorInfo.retryable) {
            throw error
          }
          
          // 最后一次尝试失败，抛出错误
          if (attempt === maxRetries) {
            throw lastError
          }
          
          // 等待后重试
          console.log(`⏳ ${delay}ms 后进行第 ${attempt + 2} 次重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      
      throw lastError
    }) as T
  }
}

/**
 * 便捷的错误处理函数
 */
export const handleApiError = ErrorHandler.handleApiError

/**
 * 为API调用包装错误处理
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  context: string,
  config: ErrorHandlerConfig = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await apiFunction(...args)
    } catch (error) {
      ErrorHandler.handleApiError(error, context, config)
      throw error // 重新抛出错误，让调用方决定如何处理
    }
  }) as T
}

/**
 * 创建带自动重试的API调用
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  context: string,
  retryConfig: { maxRetries?: number; delay?: number } = {}
): T {
  const { maxRetries = 3, delay = 1000 } = retryConfig
  
  const retryFunction = ErrorHandler.createRetryHandler(apiFunction, maxRetries, delay)
  
  return withErrorHandling(retryFunction, context, {
    showRetryButton: true
  })
}
