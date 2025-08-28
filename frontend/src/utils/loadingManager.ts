/**
 * 加载状态管理工具
 * @description 统一管理各种加载状态，提供便捷的API
 */

import { ref, computed, type Ref } from 'vue'
import { message } from 'ant-design-vue'

// 加载状态类型
export interface LoadingState {
  loading: Ref<boolean>
  error: Ref<string | null>
  success: Ref<boolean>
}

// 全局加载状态管理器
class LoadingManager {
  private loadingStates = new Map<string, LoadingState>()
  
  /**
   * 创建加载状态
   * @param key 状态键
   * @returns 加载状态对象
   */
  createLoadingState(key: string): LoadingState {
    if (this.loadingStates.has(key)) {
      return this.loadingStates.get(key)!
    }
    
    const state: LoadingState = {
      loading: ref(false),
      error: ref(null),
      success: ref(false)
    }
    
    this.loadingStates.set(key, state)
    return state
  }
  
  /**
   * 获取加载状态
   * @param key 状态键
   * @returns 加载状态对象或undefined
   */
  getLoadingState(key: string): LoadingState | undefined {
    return this.loadingStates.get(key)
  }
  
  /**
   * 移除加载状态
   * @param key 状态键
   */
  removeLoadingState(key: string): void {
    this.loadingStates.delete(key)
  }
  
  /**
   * 清除所有加载状态
   */
  clearAllStates(): void {
    this.loadingStates.clear()
  }
  
  /**
   * 检查是否有正在加载的状态
   * @returns 是否有加载状态
   */
  hasLoadingStates(): boolean {
    return Array.from(this.loadingStates.values()).some(state => state.loading.value)
  }
  
  /**
   * 获取所有加载中的键
   * @returns 加载中的键数组
   */
  getLoadingKeys(): string[] {
    return Array.from(this.loadingStates.entries())
      .filter(([, state]) => state.loading.value)
      .map(([key]) => key)
  }
}

// 全局实例
const globalLoadingManager = new LoadingManager()

/**
 * 使用加载状态管理
 * @param key 唯一键
 * @returns 加载状态和管理方法
 */
export function useLoading(key?: string) {
  const stateKey = key || `loading_${Date.now()}_${Math.random()}`
  const state = globalLoadingManager.createLoadingState(stateKey)
  
  // 设置加载状态
  const setLoading = (loading: boolean) => {
    state.loading.value = loading
    if (loading) {
      state.error.value = null
      state.success.value = false
    }
  }
  
  // 设置错误状态
  const setError = (error: string | null) => {
    state.error.value = error
    state.loading.value = false
    state.success.value = false
  }
  
  // 设置成功状态
  const setSuccess = (success: boolean = true) => {
    state.success.value = success
    state.loading.value = false
    state.error.value = null
  }
  
  // 重置状态
  const reset = () => {
    state.loading.value = false
    state.error.value = null
    state.success.value = false
  }
  
  // 包装异步函数
  const withLoading = <T extends (...args: any[]) => Promise<any>>(
    asyncFn: T,
    options: {
      showSuccessMessage?: boolean
      successMessage?: string
      showErrorMessage?: boolean
      onError?: (error: any) => void
      onSuccess?: (result: any) => void
    } = {}
  ): T => {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        setLoading(true)
        const result = await asyncFn(...args)
        
        setSuccess(true)
        
        if (options.showSuccessMessage && options.successMessage) {
          message.success(options.successMessage)
        }
        
        if (options.onSuccess) {
          options.onSuccess(result)
        }
        
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '操作失败'
        setError(errorMessage)
        
        if (options.showErrorMessage) {
          message.error(errorMessage)
        }
        
        if (options.onError) {
          options.onError(error)
        }
        
        throw error
      }
    }) as T
  }
  
  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    reset,
    withLoading
  }
}

/**
 * 创建API加载状态管理
 * @param apiFunction API函数
 * @param options 配置选项
 * @returns 包装后的API函数和状态
 */
export function createApiLoader<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  options: {
    key?: string
    successMessage?: string
    errorMessage?: string
    showMessages?: boolean
  } = {}
) {
  const { key, successMessage, errorMessage, showMessages = true } = options
  const { loading, error, success, withLoading } = useLoading(key)
  
  const execute = withLoading(apiFunction, {
    showSuccessMessage: showMessages && !!successMessage,
    successMessage,
    showErrorMessage: showMessages,
    onError: (err) => {
      console.error(`API调用失败 [${key || 'Unknown'}]:`, err)
    }
  })
  
  return {
    loading,
    error,
    success,
    execute
  }
}

/**
 * 批量加载管理
 */
export function useBatchLoading() {
  const batchState = ref(new Map<string, boolean>())
  
  const isAnyLoading = computed(() => {
    return Array.from(batchState.value.values()).some(loading => loading)
  })
  
  const setItemLoading = (key: string, loading: boolean) => {
    const newState = new Map(batchState.value)
    if (loading) {
      newState.set(key, true)
    } else {
      newState.delete(key)
    }
    batchState.value = newState
  }
  
  const getItemLoading = (key: string): boolean => {
    return batchState.value.get(key) || false
  }
  
  const clearAll = () => {
    batchState.value.clear()
  }
  
  return {
    isAnyLoading,
    setItemLoading,
    getItemLoading,
    clearAll,
    batchState: computed(() => batchState.value)
  }
}

/**
 * 表格加载状态管理
 */
export function useTableLoading() {
  const tableLoading = ref(false)
  const refreshing = ref(false)
  const loadingMore = ref(false)
  
  const setTableLoading = (loading: boolean) => {
    tableLoading.value = loading
  }
  
  const setRefreshing = (loading: boolean) => {
    refreshing.value = loading
  }
  
  const setLoadingMore = (loading: boolean) => {
    loadingMore.value = loading
  }
  
  const isAnyTableLoading = computed(() => {
    return tableLoading.value || refreshing.value || loadingMore.value
  })
  
  return {
    tableLoading,
    refreshing,
    loadingMore,
    isAnyTableLoading,
    setTableLoading,
    setRefreshing,
    setLoadingMore
  }
}

/**
 * 按钮加载状态管理
 */
export function useButtonLoading() {
  const buttonStates = ref(new Map<string, boolean>())
  
  const setButtonLoading = (key: string, loading: boolean) => {
    const newStates = new Map(buttonStates.value)
    if (loading) {
      newStates.set(key, true)
    } else {
      newStates.delete(key)
    }
    buttonStates.value = newStates
  }
  
  const isButtonLoading = (key: string): boolean => {
    return buttonStates.value.get(key) || false
  }
  
  const clearButtonStates = () => {
    buttonStates.value.clear()
  }
  
  return {
    setButtonLoading,
    isButtonLoading: computed(() => (key: string) => buttonStates.value.get(key) || false),
    clearButtonStates,
    buttonStates: computed(() => buttonStates.value)
  }
}

// 导出管理器实例
export { globalLoadingManager }

// 便捷导出
export default useLoading
