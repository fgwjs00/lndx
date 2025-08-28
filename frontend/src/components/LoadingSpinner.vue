/**
 * 统一加载动画组件
 * @component LoadingSpinner
 * @description 提供一致的加载动画样式和行为
 */
<template>
  <!-- 全屏遮罩加载 -->
  <div 
    v-if="overlay" 
    class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
    :class="{ 'cursor-wait': overlay }"
  >
    <div class="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center space-y-4">
      <div class="loading-spinner" :class="sizeClass"></div>
      <p v-if="message" class="text-gray-600 text-sm">{{ message }}</p>
    </div>
  </div>
  
  <!-- 内联加载 -->
  <div 
    v-else 
    class="flex items-center justify-center"
    :class="containerClass"
  >
    <div class="loading-spinner" :class="sizeClass"></div>
    <span v-if="message" class="ml-3 text-gray-600" :class="textClass">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * 加载动画组件
 * @description 支持多种尺寸和显示模式的统一加载动画
 */
import { computed } from 'vue'

interface Props {
  /** 是否显示全屏遮罩 */
  overlay?: boolean
  /** 加载提示信息 */
  message?: string
  /** 尺寸大小 */
  size?: 'small' | 'medium' | 'large'
  /** 容器样式类 */
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  overlay: false,
  message: '',
  size: 'medium',
  containerClass: 'py-8'
})

// 计算尺寸样式类
const sizeClass = computed(() => {
  const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  }
  return sizeMap[props.size]
})

// 计算文本样式类
const textClass = computed(() => {
  const textMap = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }
  return textMap[props.size]
})
</script>

<style scoped>
.loading-spinner {
  border: 2px solid #f3f4f6;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 悬浮效果 */
.loading-spinner:hover {
  border-top-color: #2563eb;
}
</style>
