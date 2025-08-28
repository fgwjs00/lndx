<template>
  <div class="analysis-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">数据分析</h1>
          <p class="text-cyan-100">学生数据统计分析、报表生成和趋势预测</p>
        </div>
        <div class="text-6xl opacity-20">
          📊
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-chart-line text-cyan-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ overviewStats.successRate }}%</h3>
            <p class="text-gray-500 text-sm">报名成功率</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-users text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ overviewStats.totalStudents.toLocaleString() }}</h3>
            <p class="text-gray-500 text-sm">活跃学生</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-graduation-cap text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ overviewStats.totalGraduated }}</h3>
            <p class="text-gray-500 text-sm">已通过报名</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-trophy text-purple-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ overviewStats.averageAge }}</h3>
            <p class="text-gray-500 text-sm">平均年龄</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 学生报名趋势 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-800 flex items-center">
            <i class="fas fa-chart-area text-cyan-500 mr-3"></i>
            学生报名趋势
          </h3>
          <div class="flex space-x-2">
            <button class="px-3 py-1 bg-cyan-100 text-cyan-600 rounded-full text-sm font-medium hover:bg-cyan-200 transition-colors">
              本月
            </button>
            <button class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              本年
            </button>
          </div>
        </div>
        <div class="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-chart-area text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">报名趋势图表 - 开发中</p>
          </div>
        </div>
      </div>
      
      <!-- 专业分布 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-800 flex items-center">
            <i class="fas fa-chart-pie text-blue-500 mr-3"></i>
            专业分布统计
          </h3>
        </div>
        <div class="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-chart-pie text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">专业分布饼图 - 开发中</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 详细数据表格 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 热门课程排行 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-fire text-red-500 mr-3"></i>
          热门课程排行
        </h3>
        <div class="flex flex-col gap-4" v-if="popularCourses.length > 0">
          <div v-for="(course, index) in popularCourses" :key="course.id" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mr-3 text-white font-bold text-sm">
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">{{ course.name }}</p>
              <p class="text-sm text-gray-500">{{ course.students }} 人报名 / {{ course.maxStudents }} 人上限</p>
              <p class="text-xs text-gray-400" v-if="course.category">{{ course.category }}</p>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-800">{{ course.rate }}%</div>
              <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-red-400 to-pink-400 rounded-full transition-all duration-300"
                  :style="{ width: course.rate + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <i class="fas fa-chart-bar text-2xl mb-2"></i>
          <p>暂无热门课程数据</p>
        </div>
      </div>
      
      <!-- 月度统计 -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-calendar-alt text-green-500 mr-3"></i>
          月度统计
        </h3>
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">新增学生</span>
            <span class="font-bold text-gray-800">+{{ monthlyStats.newStudents }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">课程报名</span>
            <span class="font-bold text-gray-800">+{{ monthlyStats.newEnrollments }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">完成学业</span>
            <span class="font-bold text-gray-800">+{{ monthlyStats.graduatedStudents }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">退学率</span>
            <span class="font-bold text-gray-800">{{ monthlyStats.dropoutRate }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 系统状态-->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-server text-purple-500 mr-3"></i>
          系统状态
        </h3>
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">数据库连接</span>
            <span :class="{
              'px-2 py-1 rounded-full text-xs font-medium': true,
              'bg-green-100 text-green-600': systemStatus.dbStatus === 'normal',
              'bg-red-100 text-red-600': systemStatus.dbStatus === 'error'
            }">{{ systemStatus.dbStatus === 'normal' ? '正常' : '错误' }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">服务器负载</span>
            <span :class="{
              'px-2 py-1 rounded-full text-xs font-medium': true,
              'bg-green-100 text-green-600': systemStatus.serverLoad === 'low',
              'bg-yellow-100 text-yellow-600': systemStatus.serverLoad === 'medium',
              'bg-red-100 text-red-600': systemStatus.serverLoad === 'high'
            }">{{ 
              systemStatus.serverLoad === 'low' ? '较低' : 
              systemStatus.serverLoad === 'medium' ? '中等' : '较高' 
            }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">在线用户</span>
            <span class="font-bold text-gray-800">{{ systemStatus.onlineUsers }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">系统运行时间</span>
            <span class="font-bold text-gray-800">{{ systemStatus.uptimeHours }}小时</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据分析页面
 * @component Analysis
 * @description 系统数据统计分析和报表展示
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import AnalysisService from '@/api/analysis'
import type { 
  OverviewStats, 
  PopularCourse, 
  MonthlyStats, 
  CategoryStats, 
  SystemStatus 
} from '@/api/analysis'

// 响应式数据
const loading = ref<boolean>(false)
const overviewStats = ref<OverviewStats>({
  successRate: 0,
  totalStudents: 0,
  totalGraduated: 0,
  averageAge: 0,
  totalCourses: 0,
  totalEnrollments: 0,
  approvedEnrollments: 0,
  pendingEnrollments: 0,
  rejectedEnrollments: 0,
  activeTeachers: 0
})
const popularCourses = ref<PopularCourse[]>([])
const monthlyStats = ref<MonthlyStats>({
  newStudents: 0,
  newEnrollments: 0,
  graduatedStudents: 0,
  dropoutRate: 0
})
const categoryStats = ref<CategoryStats[]>([])
const systemStatus = ref<SystemStatus>({
  dbStatus: 'normal',
  serverLoad: 'low',
  onlineUsers: 0,
  uptimeHours: 0
})

/**
 * 获取统计概览数据
 */
const fetchOverviewStats = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getOverviewStats()
    overviewStats.value = response.data
    console.log('获取统计概览成功:', response.data)
  } catch (error) {
    console.error('获取统计概览失败:', error)
    message.error('获取统计概览失败')
  }
}

/**
 * 获取热门课程数据
 */
const fetchPopularCourses = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getPopularCourses(5)
    popularCourses.value = response.data
    console.log('获取热门课程成功:', response.data)
  } catch (error) {
    console.error('获取热门课程失败:', error)
    message.error('获取热门课程失败')
  }
}

/**
 * 获取月度统计数据
 */
const fetchMonthlyStats = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getMonthlyStats()
    monthlyStats.value = response.data
    console.log('获取月度统计成功:', response.data)
  } catch (error) {
    console.error('获取月度统计失败:', error)
    message.error('获取月度统计失败')
  }
}

/**
 * 获取系统状态数据
 */
const fetchSystemStatus = async (): Promise<void> => {
  try {
    const response = await AnalysisService.getSystemStatus()
    systemStatus.value = response.data
    console.log('获取系统状态成功:', response.data)
  } catch (error) {
    console.error('获取系统状态失败:', error)
    message.error('获取系统状态失败')
  }
}

/**
 * 获取所有分析数据
 */
const fetchAllAnalysisData = async (): Promise<void> => {
  loading.value = true
  try {
    await Promise.all([
      fetchOverviewStats(),
      fetchPopularCourses(),
      fetchMonthlyStats(),
      fetchSystemStatus()
    ])
  } finally {
    loading.value = false
  }
}

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Analysis 组件已挂载')
  fetchAllAnalysisData()
})
</script>

<style scoped>
.analysis-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style> 
