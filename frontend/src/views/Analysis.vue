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
            <h3 class="text-2xl font-bold text-gray-800">95.2%</h3>
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
            <h3 class="text-2xl font-bold text-gray-800">1,842</h3>
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
            <h3 class="text-2xl font-bold text-gray-800">324</h3>
            <p class="text-gray-500 text-sm">本月毕业</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-trophy text-purple-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">4.6</h3>
            <p class="text-gray-500 text-sm">平均绩点</p>
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
        <div class="flex flex-col gap-4">
          <div v-for="(course, index) in popularCourses" :key="course.id" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mr-3 text-white font-bold text-sm">
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">{{ course.name }}</p>
              <p class="text-sm text-gray-500">{{ course.students }} 人报名</p>
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
            <span class="font-bold text-gray-800">+86</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">课程报名</span>
            <span class="font-bold text-gray-800">+324</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">完成学业</span>
            <span class="font-bold text-gray-800">+52</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">退学率</span>
            <span class="font-bold text-gray-800">2.1%</span>
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
            <span class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">正常</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">服务器负载</span>
            <span class="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">中等</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">在线用户</span>
            <span class="font-bold text-gray-800">156</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">系统运行时间</span>
            <span class="font-bold text-gray-800">72小时</span>
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

// 热门课程数据类型定义
interface PopularCourse {
  id: number
  name: string
  students: number
  rate: number
}

// 响应式数组
const popularCourses = ref<PopularCourse[]>([
  { id: 1, name: '高等数学', students: 456, rate: 95 },
  { id: 2, name: '计算机程序设计', students: 389, rate: 87 },
  { id: 3, name: '大学英语', students: 342, rate: 78 },
  { id: 4, name: '数据结构', students: 298, rate: 72 },
  { id: 5, name: '线性代数', students: 256, rate: 65 }
])

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Analysis 组件已挂载')
})
</script>

<style scoped>
.analysis-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style> 
