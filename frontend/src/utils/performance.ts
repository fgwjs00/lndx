/**
 * 性能优化工具
 * @description 提供缓存、防抖、节流等性能优化功能
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

// 缓存管理器
class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5分钟默认缓存时间

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（毫秒）
   */
  set(key: string, data: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expires })
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  get<T = any>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  /**
   * 清除缓存
   * @param key 缓存键，不传则清除所有
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// 全局缓存管理器
export const globalCache = new CacheManager()

// 定期清理过期缓存
setInterval(() => globalCache.cleanup(), 60 * 1000) // 每分钟清理一次

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  let timeoutId: number | undefined
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => fn(...args), delay)
  }) as T
}

/**
 * 节流函数
 * @param fn 要节流的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 100
): T {
  let inThrottle: boolean
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

/**
 * 高效的数组过滤器
 * @description 优化多条件过滤性能，避免多次遍历
 */
export class AdvancedFilter<T> {
  private data: T[] = []
  private filters: Array<(item: T) => boolean> = []
  private cached = false
  private cachedResult: T[] = []

  constructor(data: T[]) {
    this.data = data
  }

  /**
   * 添加过滤条件
   * @param predicate 过滤函数
   * @returns 链式调用
   */
  filter(predicate: (item: T) => boolean): this {
    this.filters.push(predicate)
    this.cached = false
    return this
  }

  /**
   * 添加基于字段值的过滤
   * @param field 字段名
   * @param value 期望值
   * @returns 链式调用
   */
  filterBy<K extends keyof T>(field: K, value: T[K]): this {
    return this.filter(item => item[field] === value)
  }

  /**
   * 添加文本搜索过滤
   * @param fields 要搜索的字段
   * @param query 搜索关键词
   * @returns 链式调用
   */
  search<K extends keyof T>(fields: K[], query: string): this {
    if (!query.trim()) return this
    
    const lowerQuery = query.toLowerCase()
    return this.filter(item => 
      fields.some(field => {
        const value = item[field]
        return value && String(value).toLowerCase().includes(lowerQuery)
      })
    )
  }

  /**
   * 执行过滤并返回结果
   * @param forceRefresh 强制刷新缓存
   * @returns 过滤后的数组
   */
  result(forceRefresh = false): T[] {
    if (this.cached && !forceRefresh) {
      return this.cachedResult
    }

    // 单次遍历应用所有过滤条件
    this.cachedResult = this.data.filter(item =>
      this.filters.every(predicate => predicate(item))
    )

    this.cached = true
    return this.cachedResult
  }

  /**
   * 更新原始数据
   * @param data 新数据
   */
  updateData(data: T[]): void {
    this.data = data
    this.cached = false
  }

  /**
   * 清除所有过滤条件
   */
  clear(): this {
    this.filters = []
    this.cached = false
    return this
  }

  /**
   * 获取过滤后数据的统计信息
   */
  stats(): { total: number; filtered: number; ratio: number } {
    const filtered = this.result()
    return {
      total: this.data.length,
      filtered: filtered.length,
      ratio: this.data.length > 0 ? filtered.length / this.data.length : 0
    }
  }
}

/**
 * 创建高性能的过滤computed
 * @param source 数据源
 * @param filterFn 过滤函数工厂
 * @returns 响应式的过滤结果
 */
export function createAdvancedFilter<T>(
  source: Ref<T[]>,
  filterFn: (filter: AdvancedFilter<T>) => AdvancedFilter<T>
): ComputedRef<T[]> {
  let filter: AdvancedFilter<T> | null = null
  
  return computed(() => {
    if (!filter) {
      filter = new AdvancedFilter(source.value)
    } else {
      filter.updateData(source.value)
      filter.clear()
    }
    
    return filterFn(filter).result()
  })
}

/**
 * 虚拟滚动辅助工具
 */
export class VirtualScroller {
  private container: HTMLElement | null = null
  private itemHeight: number
  private visibleCount: number
  private scrollTop = 0
  private onUpdate: (startIndex: number, endIndex: number) => void

  constructor(
    itemHeight: number,
    visibleCount: number,
    onUpdate: (startIndex: number, endIndex: number) => void
  ) {
    this.itemHeight = itemHeight
    this.visibleCount = visibleCount
    this.onUpdate = onUpdate
  }

  /**
   * 绑定容器元素
   * @param container 滚动容器
   */
  bindContainer(container: HTMLElement): void {
    this.container = container
    this.container.addEventListener('scroll', this.handleScroll.bind(this))
  }

  /**
   * 处理滚动事件
   */
  private handleScroll = throttle(() => {
    if (!this.container) return
    
    this.scrollTop = this.container.scrollTop
    this.updateVisibleRange()
  }, 16) // 60fps

  /**
   * 更新可见范围
   */
  private updateVisibleRange(): void {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(startIndex + this.visibleCount, startIndex + this.visibleCount)
    
    this.onUpdate(startIndex, endIndex)
  }

  /**
   * 计算容器高度
   * @param totalItems 总项目数
   * @returns 容器总高度
   */
  calculateTotalHeight(totalItems: number): number {
    return totalItems * this.itemHeight
  }

  /**
   * 销毁虚拟滚动
   */
  destroy(): void {
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll)
      this.container = null
    }
  }
}

/**
 * 使用虚拟滚动的组合函数
 */
export function useVirtualScroll<T>(
  items: Ref<T[]>,
  itemHeight: number,
  containerHeight: number
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 // 额外渲染2项
  const startIndex = ref(0)
  const endIndex = ref(visibleCount)
  
  const visibleItems = computed(() => {
    return items.value.slice(startIndex.value, endIndex.value)
  })
  
  const totalHeight = computed(() => {
    return items.value.length * itemHeight
  })
  
  const offsetY = computed(() => {
    return startIndex.value * itemHeight
  })
  
  const virtualScroller = new VirtualScroller(
    itemHeight,
    visibleCount,
    (start, end) => {
      startIndex.value = start
      endIndex.value = end
    }
  )
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    bindContainer: virtualScroller.bindContainer.bind(virtualScroller),
    destroy: virtualScroller.destroy.bind(virtualScroller)
  }
}

/**
 * 内存泄漏防护
 */
export class MemoryGuard {
  private timers: Set<number> = new Set()
  private eventListeners: Array<{
    element: EventTarget
    event: string
    handler: EventListener
  }> = []

  /**
   * 安全的setTimeout
   */
  setTimeout(fn: Function, delay: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id)
      fn()
    }, delay)
    this.timers.add(id)
    return id
  }

  /**
   * 安全的setInterval
   */
  setInterval(fn: Function, delay: number): number {
    const id = window.setInterval(fn, delay)
    this.timers.add(id)
    return id
  }

  /**
   * 安全的事件监听
   */
  addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options)
    this.eventListeners.push({ element, event, handler })
  }

  /**
   * 清理所有资源
   */
  cleanup(): void {
    // 清理定时器
    this.timers.forEach(id => {
      clearTimeout(id)
      clearInterval(id)
    })
    this.timers.clear()

    // 清理事件监听器
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []
  }
}

/**
 * 使用内存守护的组合函数
 */
export function useMemoryGuard() {
  const guard = new MemoryGuard()
  
  // 组件卸载时自动清理
  if (typeof window !== 'undefined' && window.Vue) {
    // Vue 3 组合式API中使用onBeforeUnmount
    const { onBeforeUnmount } = require('vue')
    onBeforeUnmount(() => {
      guard.cleanup()
    })
  }
  
  return {
    setTimeout: guard.setTimeout.bind(guard),
    setInterval: guard.setInterval.bind(guard),
    addEventListener: guard.addEventListener.bind(guard),
    cleanup: guard.cleanup.bind(guard)
  }
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Array<{ name: string; duration: number }> = []

  /**
   * 开始性能标记
   * @param name 标记名称
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * 测量性能
   * @param name 测量名称
   * @param startMark 开始标记名称
   */
  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      console.warn(`性能标记 ${startMark} 不存在`)
      return 0
    }

    const duration = performance.now() - start
    this.measures.push({ name, duration })
    
    // 输出到控制台（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }

  /**
   * 获取性能报告
   */
  getReport(): Array<{ name: string; duration: number }> {
    return [...this.measures]
  }

  /**
   * 清除所有记录
   */
  clear(): void {
    this.marks.clear()
    this.measures = []
  }
}

// 全局性能监控实例
export const perfMonitor = new PerformanceMonitor()

/**
 * 性能监控装饰器（用于监控函数执行时间）
 */
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const measureName = name || `${target.constructor.name}.${propertyKey}`
    
    descriptor.value = async function (...args: any[]) {
      const startMark = `${measureName}-start`
      perfMonitor.mark(startMark)
      
      try {
        const result = await originalMethod.apply(this, args)
        perfMonitor.measure(measureName, startMark)
        return result
      } catch (error) {
        perfMonitor.measure(`${measureName} (错误)`, startMark)
        throw error
      }
    }
    
    return descriptor
  }
}
