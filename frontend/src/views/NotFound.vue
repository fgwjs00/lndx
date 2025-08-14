<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
    <div class="max-w-md w-full mx-4 text-center">
      <!-- 404 图标 -->
      <div class="mb-8">
        <div class="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-exclamation-triangle text-white text-6xl"></i>
        </div>
        <h1 class="text-6xl font-bold text-gray-800 mb-2">404</h1>
        <h2 class="text-2xl font-semibold text-gray-600">页面不存在</h2>
      </div>

      <!-- 描述信息 -->
      <div class="mb-8">
        <p class="text-gray-500 mb-4">
          抱歉，您访问的页面不存在或已被删除
        </p>
        <p class="text-gray-400 text-sm">
          请检查URL是否正确，或者返回首页重新开始
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a-button 
          type="primary" 
          size="large"
          @click="goHome"
          class="bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700"
        >
          <i class="fas fa-home mr-2"></i>
          返回首页
        </a-button>
        
        <a-button 
          size="large"
          @click="goBack"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          返回上页
        </a-button>
      </div>

      <!-- 帮助信息 -->
      <div class="mt-12 p-6 bg-white rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
          可能的原因
        </h3>
        <ul class="text-left text-gray-600 space-y-2">
          <li class="flex items-start">
            <i class="fas fa-circle text-blue-500 text-xs mt-2 mr-3"></i>
            <span>URL地址输入错误</span>
          </li>
          <li class="flex items-start">
            <i class="fas fa-circle text-blue-500 text-xs mt-2 mr-3"></i>
            <span>页面已被移动或删除</span>
          </li>
          <li class="flex items-start">
            <i class="fas fa-circle text-blue-500 text-xs mt-2 mr-3"></i>
            <span>您没有访问该页面的权限</span>
          </li>
          <li class="flex items-start">
            <i class="fas fa-circle text-blue-500 text-xs mt-2 mr-3"></i>
            <span>网络连接问题</span>
          </li>
        </ul>
      </div>

      <!-- 联系信息 -->
      <div class="mt-8 text-gray-400 text-sm">
        <p>如果问题持续存在，请联系系统管理员</p>
        <p>邮箱：admin@example.com | 电话：400-000-0000</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 404页面组件
 * @component NotFound
 * @description 页面不存在提示页面
 */
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

/**
 * 返回首页
 */
const goHome = (): void => {
  if (authStore.isAuthenticated) {
    router.push('/')
  } else {
    router.push('/login')
  }
}

/**
 * 返回上一页
 */
const goBack = (): void => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}
</script>

<style scoped>
/* 渐变背景动画 */
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-gradient-to-br {
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

/* 按钮悬停效果 */
:deep(.ant-btn-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

:deep(.ant-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 卡片阴影效果 */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 图标动画 */
.fa-exclamation-triangle {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style> 
