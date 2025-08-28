/**
 * HTTP请求封装
 * @description 统一的HTTP请求配置和拦截器
 */

import type { ApiResponse } from '@/types'
import { shouldMockAuth, mockLogin, mockSendSms, mockVerifySms } from '@/utils/dev'

// 请求配置接口
interface RequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  params?: any
  headers?: Record<string, string>
  timeout?: number
}

// 请求拦截器配置
interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig
  onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T>
  onError?: (error: any) => Promise<any>
}

// 基础配置
const BASE_URL = '/api'
const DEFAULT_TIMEOUT = 10000

/**
 * HTTP请求类
 */
class HttpRequest {
  private baseURL: string
  private timeout: number
  private interceptors: RequestInterceptor

  constructor() {
    this.baseURL = BASE_URL
    this.timeout = DEFAULT_TIMEOUT
    this.interceptors = {}
    this.setupInterceptors()
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.interceptors.onRequest = (config: RequestConfig) => {
      // 添加认证token
      const token = localStorage.getItem('token')
      console.log('📤 请求拦截器:', { 
        url: config.url, 
        method: config.method, 
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
      })
      
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
      } else {
        console.warn('⚠️ 请求时未找到token')
      }

      // 添加默认headers (FormData时不设置Content-Type，让浏览器自动处理)
      config.headers = {
        ...(!(config.data instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...config.headers
      }

      return config
    }

    // 响应拦截器
    this.interceptors.onResponse = <T>(response: ApiResponse<T>) => {
      // 统一处理响应数据
      if (response.code >= 200 && response.code < 300) {
        return response
      } else {
        // 对于非2xx响应，直接抛出错误让onError处理
        throw new Error(response.message || '请求失败')
      }
    }

    // 错误拦截器
    this.interceptors.onError = (error: any) => {
      console.error('Request error:', error)
      
      // 网络错误
      if (!error.response) {
        console.warn('🌐 网络连接异常，但保持认证状态')
        return Promise.reject(new Error('网络连接异常，请检查网络连接'))
      }

      // HTTP错误
      const { status } = error.response
      switch (status) {
        case 400: {
          // 尝试提取后端返回的具体错误信息
          const badRequestData = error.response?.data
          if (badRequestData?.message) {
            // 如果后端提供了具体错误信息，使用它
            return Promise.reject(new Error(badRequestData.message))
          } else {
            // 否则使用通用错误信息
            return Promise.reject(new Error('请求参数错误'))
          }
        }
        case 401: {
          // 检查是否是登录相关的API请求
          const requestUrl = error.config?.url || ''
          const isAuthApi = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')
          
          // 如果是登录/注册API，让调用方处理错误，不要跳转
          if (isAuthApi) {
            console.log('🔐 登录API 401错误，返回错误信息供页面处理')
            const errorData = error.response?.data
            const errorMessage = errorData?.message || '登录失败'
            return Promise.reject(new Error(errorMessage))
          }
          
          // 对于其他API的401错误，需要谨慎处理
          console.warn('⚠️ API调用收到401错误:', requestUrl)
          
          // 检查是否真的是认证问题，还是网络问题
          const authErrorData = error.response?.data
          const isTokenExpired = authErrorData?.code === 401 && authErrorData?.message?.includes('token')
          
          // 只有明确是token问题才清除认证信息
          if (isTokenExpired) {
            console.log('🔑 Token确实已过期，清除认证信息')
            // 通过authStore来处理logout，而不是直接操作localStorage
            import('@/store/auth').then(({ useAuthStore }) => {
              const authStore = useAuthStore()
              authStore.logout()
            })
          } else {
            // 可能是网络问题或服务器问题，不要清除认证信息
            console.log('🌐 可能是网络问题，保持认证状态')
            return Promise.reject(new Error('网络连接异常，请检查网络或稍后重试'))
          }
          
          return Promise.reject(new Error('未授权访问'))
        }
        case 403: {
          return Promise.reject(new Error('权限不足'))
        }
        case 404: {
          return Promise.reject(new Error('请求资源不存在'))
        }
        case 409: {
          // 处理冲突错误，如数据重复等
          const errorMsg = error.response?.data?.message || '数据冲突，请检查输入'
          return Promise.reject(new Error(errorMsg))
        }
        case 429: {
          // 对于登录API的429错误，返回后端的具体错误信息
          const errorMsg = error.response?.data?.message || '请求过于频繁，请稍后再试'
          return Promise.reject(new Error(errorMsg))
        }
        case 500: {
          return Promise.reject(new Error('服务器内部错误'))
        }
        default: {
          return Promise.reject(new Error(`请求失败: ${status}`))
        }
      }
    }
  }

  /**
   * 处理模拟请求
   */
  private async handleMockRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    console.log(`[模拟模式] ${config.method} ${config.url}`, config.data)
    
    // 根据URL路径处理不同的模拟请�?
    if (config.url === '/auth/login' && config.method === 'POST') {
      const { phone, password } = config.data
      return mockLogin(phone, password) as Promise<ApiResponse<T>>
    }
    
    if (config.url === '/auth/send-sms' && config.method === 'POST') {
      const { phone } = config.data
      return mockSendSms(phone) as Promise<ApiResponse<T>>
    }
    
    if (config.url === '/auth/verify-sms' && config.method === 'POST') {
      const { phone, code } = config.data
      return mockVerifySms(phone, code) as Promise<ApiResponse<T>>
    }
    
    // 其他请求返回默认成功响应
    return Promise.resolve({
      code: 200,
      message: '模拟请求成功',
      data: {} as T
    })
  }

  /**
   * 发送请求
   */
  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // 应用请求拦截器
      const finalConfig = this.interceptors.onRequest?.(config) || config

      // 模拟模式处理
      if (shouldMockAuth()) {
        return this.handleMockRequest<T>(finalConfig)
      }

      // 构建完整URL
      const url = `${this.baseURL}${finalConfig.url}`

      // 构建请求选项
      const options: RequestInit = {
        method: finalConfig.method,
        headers: finalConfig.headers,
        signal: AbortSignal.timeout(finalConfig.timeout || this.timeout)
      }

      // 添加请求体
      if (finalConfig.data) {
        if (finalConfig.headers?.['Content-Type'] === 'application/json') {
          options.body = JSON.stringify(finalConfig.data)
        } else {
          options.body = finalConfig.data
        }
      }

      // 添加查询参数
      let requestUrl = url
      if (finalConfig.params) {
        // 过滤掉 undefined 值，避免传递 "undefined" 字符串
        const filteredParams: Record<string, string> = {}
        Object.keys(finalConfig.params).forEach(key => {
          const value = finalConfig.params[key]
          if (value !== undefined && value !== null && value !== '') {
            filteredParams[key] = String(value)
          }
        })
        
        if (Object.keys(filteredParams).length > 0) {
          const searchParams = new URLSearchParams(filteredParams)
          requestUrl = `${url}?${searchParams.toString()}`
        }
      }

      // 发送请求
      const response = await fetch(requestUrl, options)
      
      // 检查HTTP状态码 - 接受2xx范围内的所有成功状态码
      if (response.status < 200 || response.status >= 300) {
        // HTTP错误状态，构造错误对象并抛出
        const errorData = await response.json().catch(() => ({}))
        const error = {
          response: {
            status: response.status,
            data: errorData
          },
          config: finalConfig
        }
        throw error
      }
      
      const data = await response.json()

      // 应用响应拦截器
      return this.interceptors.onResponse?.(data) || data
    } catch (error) {
      // 应用错误拦截器
      return this.interceptors.onError?.(error) || Promise.reject(error)
    }
  }

  /**
   * GET请求
   */
  get<T>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      ...config
    })
  }

  /**
   * POST请求
   */
  post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config
    })
  }

  /**
   * PUT请求
   */
  put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config
    })
  }

  /**
   * DELETE请求
   */
  delete<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config
    })
  }

  /**
   * PATCH请求
   */
  patch<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config
    })
  }

  /**
   * 文件上传
   */
  upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      // 监听上传进度
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress(progress)
          }
        })
      }

      // 监听响应
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new Error('响应解析失败'))
          }
        } else {
          reject(new Error(`上传失败: ${xhr.status}`))
        }
      })

      // 监听错误
      xhr.addEventListener('error', () => {
        reject(new Error('上传失败'))
      })

      // 发送请求
      xhr.open('POST', `${this.baseURL}${url}`)
      
      // 添加认证头
      const token = localStorage.getItem('token')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.send(formData)
    })
  }
}

// 创建请求实例
const request = new HttpRequest()

export default request
export { HttpRequest }
export type { RequestConfig, RequestInterceptor } 
