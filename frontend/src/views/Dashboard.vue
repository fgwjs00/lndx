<template>
  <div class="dashboard-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600 text-lg">正在加载控制面板数据...</p>
      </div>
    </div>

    <!-- 主要内容 -->
    <div v-else>
    <!-- 欢迎横幅 -->
    <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">学生报名及档案管理系统</h1>
        <p class="text-blue-100 text-xl">{{ currentTime }} | 欢迎回来！ 🎉</p>
        <div class="mt-6 flex justify-center space-x-8">
          <div class="text-center">
            <div class="text-3xl font-bold">{{ dashboardStats?.students?.total || 0 }}</div>
            <div class="text-sm text-blue-100">注册学生</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold">{{ dashboardStats?.courses?.total || 0 }}</div>
            <div class="text-sm text-blue-100">开设课程</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold">{{ dashboardStats?.applications?.pending || 0 }}</div>
            <div class="text-sm text-blue-100">待处理申请</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" @click="navigateTo('/student')">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-users text-white text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-800">{{ dashboardStats?.students?.total || 0 }}</h3>
            <p class="text-gray-500 text-sm">注册学生</p>
            <div class="flex items-center mt-1">
              <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                本月新增 {{ dashboardStats?.students?.thisMonth || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" @click="navigateTo('/course')">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-book text-white text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-800">{{ dashboardStats?.courses?.total || 0 }}</h3>
            <p class="text-gray-500 text-sm">开设课程</p>
            <div class="flex items-center mt-1">
              <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                活跃 {{ dashboardStats?.courses?.active || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" @click="navigateTo('/application')">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-file-signature text-white text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-800">{{ dashboardStats?.applications?.thisWeek || 0 }}</h3>
            <p class="text-gray-500 text-sm">本周报名</p>
            <div class="flex items-center mt-1">
              <span class="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                总计 {{ dashboardStats?.applications?.total || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" @click="navigateTo('/application')">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-tasks text-white text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-800">{{ dashboardStats?.applications?.pending || 0 }}</h3>
            <p class="text-gray-500 text-sm">待处理申请</p>
            <div class="flex items-center mt-1">
              <span :class="(dashboardStats?.applications?.pending || 0) > 0 ? 'text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full' : 'text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full'">
                {{ (dashboardStats?.applications?.pending || 0) > 0 ? '需要处理' : '已处理完' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快捷操作区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-bolt text-amber-500 mr-3"></i>
          快捷操作
        </h3>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <button @click="navigateTo('/registration')" class="flex flex-col items-center px-4 py-6 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center">
            <i class="fas fa-user-plus text-blue-600 text-2xl mb-2"></i>
            <span class="text-gray-800 font-medium text-sm">新学生报名</span>
          </button>
          <button @click="openMobileRegistration" class="flex flex-col items-center px-4 py-6 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-center relative">
            <i class="fas fa-mobile-alt text-pink-600 text-2xl mb-2"></i>
            <span class="text-gray-800 font-medium text-sm">手机端报名</span>
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">新</span>
          </button>
          <button @click="navigateTo('/course')" class="flex flex-col items-center px-4 py-6 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-center">
            <i class="fas fa-book-plus text-green-600 text-2xl mb-2"></i>
            <span class="text-gray-800 font-medium text-sm">创建新课程</span>
          </button>
          <button @click="navigateTo('/application')" class="flex flex-col items-center px-4 py-6 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center">
            <i class="fas fa-clipboard-check text-purple-600 text-2xl mb-2"></i>
            <span class="text-gray-800 font-medium text-sm">审核申请</span>
          </button>
          <!-- 数据分析功能暂时屏蔽 -->
          <!-- <button @click="navigateTo('/analysis')" class="flex flex-col items-center px-4 py-6 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center">
            <i class="fas fa-chart-bar text-indigo-600 text-2xl mb-2"></i>
            <span class="text-gray-800 font-medium text-sm">数据分析</span>
          </button> -->
        </div>
      </div>

      <!-- 课程分类统计 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-chart-pie text-emerald-500 mr-3"></i>
          课程分类统计
        </h3>
        <div class="space-y-4" v-if="categoryStats.length > 0">
          <div v-for="category in categoryStats.slice(0, 6)" :key="category.category" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center">
              <div class="w-4 h-4 rounded-full mr-3" :style="{ backgroundColor: getCategoryColor(category.category) }"></div>
              <span class="text-sm font-medium text-gray-800">{{ category.category }}</span>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-gray-800">{{ category.enrollmentCount }}</div>
              <div class="text-xs text-gray-500">{{ category.courseCount }}门课程</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-12">
          <i class="fas fa-chart-pie text-4xl mb-3 text-gray-300"></i>
          <p class="text-sm">暂无课程数据</p>
        </div>
      </div>
    </div>

    <!-- 最近报名记录-->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-800 flex items-center">
          <i class="fas fa-list text-blue-500 mr-3"></i>
          最近报名记录
        </h3>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">共 {{ recentActivities.length }} 条记录</span>
          <button @click="refreshActivities" class="p-2 text-gray-400 hover:text-blue-500 transition-colors">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      
      <div v-if="recentActivities.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="activity in recentActivities.slice(0, 9)" :key="activity.id" 
               class="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border hover:border-blue-200"
               @click="navigateTo('/application')">
            <img :src="getImageUrl(activity.avatar)" :alt="activity.metadata.studentName" 
                 class="w-12 h-12 rounded-full mr-4 object-cover border-2 border-white shadow-sm"
                 @error="handleImageError($event)">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-800 truncate">{{ activity.metadata.studentName }}</p>
              <p class="text-sm text-gray-600 truncate">{{ activity.metadata.courseName }}</p>
              <div class="flex items-center justify-between mt-2">
                <span :class="getStatusClass(activity.status)">
                  {{ getStatusText(activity.status) }}
                </span>
                <span class="text-xs text-gray-400">{{ formatTime(activity.time) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="text-center mt-6" v-if="recentActivities.length > 9">
          <button @click="navigateTo('/application')" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            查看更多报名记录
          </button>
        </div>
      </div>
      
      <div v-else class="text-center text-gray-500 py-16">
        <i class="fas fa-inbox text-6xl mb-4 text-gray-300"></i>
        <p class="text-lg mb-2">暂无最近活动</p>
        <button @click="refreshActivities" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
          刷新数据
        </button>
      </div>
    </div>
    
    <!-- 学生档案管理 -->
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h3 class="text-2xl font-bold text-gray-800 flex items-center mb-2">
            <i class="fas fa-user-graduate text-blue-500 mr-3"></i>
            学生档案管理
          </h3>
          <p class="text-gray-500">管理所有学生的档案信息和学习记录</p>
        </div>
        <div class="flex space-x-3 mt-4 md:mt-0">
          <button @click="navigateTo('/registration')" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg hover:shadow-xl">
            <i class="fas fa-user-plus mr-2"></i>
            新学生报名
          </button>
          <button @click="navigateTo('/student')" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg hover:shadow-xl">
            <i class="fas fa-list mr-2"></i>
            管理学生
          </button>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-600 text-sm font-medium">总学生数</p>
              <p class="text-2xl font-bold text-blue-800">{{ dashboardStats?.students?.total || 0 }}</p>
            </div>
            <i class="fas fa-users text-blue-500 text-2xl"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-600 text-sm font-medium">活跃学生</p>
              <p class="text-2xl font-bold text-green-800">{{ dashboardStats?.students?.active || 0 }}</p>
            </div>
            <i class="fas fa-user-check text-green-500 text-2xl"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-600 text-sm font-medium">本月新增</p>
              <p class="text-2xl font-bold text-purple-800">{{ dashboardStats?.students?.thisMonth || 0 }}</p>
            </div>
            <i class="fas fa-user-plus text-purple-500 text-2xl"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-600 text-sm font-medium">待处理</p>
              <p class="text-2xl font-bold text-orange-800">{{ dashboardStats?.applications?.pending || 0 }}</p>
            </div>
            <i class="fas fa-clock text-orange-500 text-2xl"></i>
          </div>
        </div>
      </div>
      
      <!-- 管理功能区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 学生管理 -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 transition-colors cursor-pointer" @click="navigateTo('/student')">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
              <i class="fas fa-users text-white text-xl"></i>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-gray-800">学生档案</h4>
              <p class="text-sm text-gray-600">查看和管理所有学生信息</p>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-blue-600 font-medium">进入管理</span>
            <i class="fas fa-arrow-right text-blue-500"></i>
          </div>
        </div>
        
        <!-- 课程管理 -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 transition-colors cursor-pointer" @click="navigateTo('/course')">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
              <i class="fas fa-book text-white text-xl"></i>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-gray-800">课程管理</h4>
              <p class="text-sm text-gray-600">管理课程信息和教学计划</p>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-green-600 font-medium">进入管理</span>
            <i class="fas fa-arrow-right text-green-500"></i>
          </div>
        </div>
        
        <!-- 申请审核 -->
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 transition-colors cursor-pointer" @click="navigateTo('/application')">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
              <i class="fas fa-clipboard-check text-white text-xl"></i>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-gray-800">申请审核</h4>
              <p class="text-sm text-gray-600">处理学生报名申请</p>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-purple-600 font-medium">进入审核</span>
            <i class="fas fa-arrow-right text-purple-500"></i>
          </div>
        </div>
      </div>
      
      <!-- 快速操作提示 -->
      <div class="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <div class="flex items-center">
          <i class="fas fa-lightbulb text-yellow-500 text-xl mr-3"></i>
          <div class="flex-1">
            <p class="text-gray-800 font-medium">快速提示</p>
            <p class="text-sm text-gray-600">点击上方卡片可以快速进入相应的管理页面，或使用顶部快捷操作按钮</p>
          </div>
        </div>
      </div>
    </div>
    
    </div> <!-- 关闭主要内容的div -->
  </div>
</template>

<script setup lang="ts">
/**
 * 控制面板页面
 * @component Dashboard
 * @description 显示系统概览、统计数据和最近活动  
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import DashboardService, { 
  type DashboardStats, 
  type RecentActivity, 
  type CategoryStats 
} from '@/api/dashboard'
import { getAvatarUrl } from '@/utils/imageUtils'

const router = useRouter()

// 响应式数据
const loading = ref<boolean>(false)
const dashboardStats = ref<DashboardStats | null>(null)
const recentActivities = ref<RecentActivity[]>([])
const categoryStats = ref<CategoryStats[]>([])
const currentTime = ref<string>('')
const timeInterval = ref<NodeJS.Timeout | null>(null)

/**
 * 页面导航
 */
const navigateTo = (path: string): void => {
  router.push(path)
}

/**
 * 打开手机端报名页面（新窗口）
 */
const openMobileRegistration = (): void => {
  // 生成完整的URL
  const baseUrl = window.location.origin
  const mobileUrl = `${baseUrl}/mobile-registration`
  
  // 在新窗口/标签页中打开手机端报名页面
  window.open(mobileUrl, '_blank', 'width=480,height=800,scrollbars=yes,resizable=yes')
}

/**
 * 更新当前时间
 */
const updateCurrentTime = (): void => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  })
}

/**
 * 获取概览统计数据
 */
const fetchOverviewStats = async (): Promise<void> => {
  try {
    console.log('🔄 开始获取概览统计数据...')
    const response = await DashboardService.getOverviewStats()
    console.log('📊 概览统计API响应:', response)
    if (response.code === 200) {
      dashboardStats.value = response.data
      console.log('✅ 概览统计数据设置成功:', dashboardStats.value)
    } else {
      console.error('❌ 概览统计API返回错误:', response)
      message.error(`获取概览数据失败: ${response.message}`)
    }
  } catch (error) {
    console.error('❌ 获取概览数据异常:', error)
    message.error('获取概览数据失败，请检查网络连接')
  }
}

/**
 * 格式化时间显示
 */
const formatTime = (timeStr: string): string => {
  const now = new Date()
  const time = new Date(timeStr)
  const diff = now.getTime() - time.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return time.toLocaleDateString('zh-CN')
  }
}

/**
 * 获取最近活动
 */
const fetchRecentActivities = async (): Promise<void> => {
  try {
    console.log('🔄 开始获取最近活动数据...')
    const response = await DashboardService.getRecentActivities(8)
    console.log('📝 最近活动API响应:', response)
    if (response.code === 200) {
      recentActivities.value = response.data
      console.log('✅ 最近活动数据设置成功:', recentActivities.value)
    } else {
      console.error('❌ 最近活动API返回错误:', response)
    }
  } catch (error) {
    console.error('❌ 获取最近活动异常:', error)
  }
}

/**
 * 获取课程分类统计
 */
const fetchCategoryStats = async (): Promise<void> => {
  try {
    console.log('🔄 开始获取课程分类统计...')
    const response = await DashboardService.getCategoryStats()
    console.log('📊 课程分类统计API响应:', response)
    if (response.code === 200) {
      categoryStats.value = response.data
      console.log('✅ 课程分类统计数据设置成功:', categoryStats.value)
    } else {
      console.error('❌ 课程分类统计API返回错误:', response)
    }
  } catch (error) {
    console.error('❌ 获取课程分类统计异常:', error)
  }
}



/**
 * 刷新活动数据
 */
const refreshActivities = async (): Promise<void> => {
  await fetchRecentActivities()
  message.success('活动数据已刷新')
}

/**
 * 获取分类颜色
 */
const getCategoryColor = (category: string): string => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}



/**
 * 获取图片URL - 使用统一的工具函数
 */
const getImageUrl = getAvatarUrl

/**
 * 处理图片加载错误
 */
const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  img.src = getAvatarUrl(null)
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  const statusClasses: Record<string, string> = {
    'APPROVED': 'px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium',
    'PENDING': 'px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium',
    'REJECTED': 'px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium',
    'CANCELLED': 'px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium'
  }
  return statusClasses[status] || statusClasses['PENDING']
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    'APPROVED': '已批准',
    'PENDING': '待审核',
    'REJECTED': '已拒绝',
    'CANCELLED': '已取消'
  }
  return statusTexts[status] || '待审核'
}

/**
 * 初始化数据
 */
const initializeData = async (): Promise<void> => {
  loading.value = true
  console.log('🚀 开始初始化控制面板数据...')
  try {
    await Promise.all([
      fetchOverviewStats(),
      fetchRecentActivities(),
      fetchCategoryStats()
    ])
    console.log('✅ 所有数据初始化完成')
  } catch (error) {
    console.error('❌ 初始化数据失败:', error)
    message.error('数据加载失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Dashboard 组件已挂载')
  updateCurrentTime()
  initializeData()
  
  // 设置时间更新定时器
  timeInterval.value = setInterval(updateCurrentTime, 60000) // 每分钟更新一次
})

/**
 * 组件卸载时清理
 */
onUnmounted((): void => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  transform: translateZ(0);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
}

.loading-bar {
  animation: loading 2s infinite;
}

@keyframes loading {
  0% {
    width: 0%;
  }
  50% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}

/* 自定义滚动条 */
.dashboard-container::-webkit-scrollbar {
  width: 6px;
}

.dashboard-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dashboard-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dashboard-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-container {
    gap: 1rem;
  }
  
  .card {
    padding: 1rem;
  }
}
</style> 
