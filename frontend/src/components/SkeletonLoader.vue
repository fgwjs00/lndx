/**
 * 骨架屏加载组件
 * @component SkeletonLoader
 * @description 提供各种类型的骨架屏加载效果
 */
<template>
  <!-- 表格骨架屏 -->
  <div v-if="type === 'table'" class="space-y-4">
    <!-- 表格头部 -->
    <div class="flex space-x-4 mb-4">
      <div class="skeleton h-8 w-24"></div>
      <div class="skeleton h-8 w-32"></div>
      <div class="skeleton h-8 w-20"></div>
    </div>
    
    <!-- 表格行 -->
    <div v-for="row in rows" :key="row" class="space-y-3">
      <div class="flex space-x-4">
        <div class="skeleton h-6 w-16"></div>
        <div class="skeleton h-6 w-24"></div>
        <div class="skeleton h-6 w-32"></div>
        <div class="skeleton h-6 w-20"></div>
        <div class="skeleton h-6 w-16"></div>
        <div class="skeleton h-6 w-12"></div>
      </div>
    </div>
  </div>
  
  <!-- 卡片骨架屏 -->
  <div v-else-if="type === 'card'" class="space-y-4">
    <div v-for="card in rows" :key="card" class="border rounded-lg p-4 space-y-3">
      <div class="flex items-center space-x-3">
        <div class="skeleton h-10 w-10 rounded-full"></div>
        <div class="space-y-2 flex-1">
          <div class="skeleton h-4 w-32"></div>
          <div class="skeleton h-3 w-24"></div>
        </div>
      </div>
      <div class="space-y-2">
        <div class="skeleton h-3 w-full"></div>
        <div class="skeleton h-3 w-3/4"></div>
      </div>
      <div class="flex justify-between">
        <div class="skeleton h-4 w-16"></div>
        <div class="skeleton h-4 w-20"></div>
      </div>
    </div>
  </div>
  
  <!-- 列表骨架屏 -->
  <div v-else-if="type === 'list'" class="space-y-3">
    <div v-for="item in rows" :key="item" class="flex items-center space-x-3 p-3 border rounded">
      <div class="skeleton h-8 w-8 rounded-full"></div>
      <div class="space-y-2 flex-1">
        <div class="skeleton h-4 w-40"></div>
        <div class="skeleton h-3 w-24"></div>
      </div>
      <div class="skeleton h-6 w-16"></div>
    </div>
  </div>
  
  <!-- 表单骨架屏 -->
  <div v-else-if="type === 'form'" class="space-y-6">
    <div v-for="field in rows" :key="field" class="space-y-2">
      <div class="skeleton h-4 w-20"></div>
      <div class="skeleton h-10 w-full rounded"></div>
    </div>
    <div class="flex space-x-3 pt-4">
      <div class="skeleton h-10 w-20 rounded"></div>
      <div class="skeleton h-10 w-16 rounded"></div>
    </div>
  </div>
  
  <!-- 文本骨架屏 -->
  <div v-else-if="type === 'text'" class="space-y-3">
    <div v-for="line in rows" :key="line" class="skeleton h-4" :style="{ width: randomWidth() }"></div>
  </div>
  
  <!-- 默认骨架屏 -->
  <div v-else class="space-y-4">
    <div v-for="item in rows" :key="item" class="skeleton h-6 w-full"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 骨架屏组件
 * @description 根据不同类型显示相应的骨架屏效果
 */
import { computed } from 'vue'

interface Props {
  /** 骨架屏类型 */
  type?: 'table' | 'card' | 'list' | 'form' | 'text' | 'default'
  /** 行数或项目数 */
  rows?: number
  /** 是否显示动画效果 */
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  rows: 3,
  animated: true
})

// 生成随机宽度（用于文本骨架屏）
const randomWidth = (): string => {
  const widths = ['60%', '80%', '90%', '70%', '85%', '75%']
  return widths[Math.floor(Math.random() * widths.length)]
}

// 计算动画类
const animationClass = computed(() => {
  return props.animated ? 'animate-pulse' : ''
})
</script>

<style scoped>
.skeleton {
  @apply bg-gray-200 rounded;
  background: linear-gradient(90deg, #f0f0f0 25%, transparent 37%, transparent 63%, #f0f0f0 75%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* 暂停动画选项 */
.no-animate .skeleton {
  animation: none;
  background: #f0f0f0;
}
</style>
