<template>
  <div class="dashboard-container">
    <!-- 数据统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-users text-white text-2xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">1,842</h3>
            <p class="text-gray-500 text-sm">注册学生</p>
          </div>
        </div>
      </div>
      
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-book text-white text-2xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">56</h3>
            <p class="text-gray-500 text-sm">开设课程</p>
          </div>
        </div>
      </div>
      
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-file-signature text-white text-2xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">324</h3>
            <p class="text-gray-500 text-sm">本周报名</p>
          </div>
        </div>
      </div>
      
      <div class="card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-400 rounded-xl flex items-center justify-center mr-4">
            <i class="fas fa-tasks text-white text-2xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">28</h3>
            <p class="text-gray-500 text-sm">待处理申请</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图表和最近报名记录-->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 图表区域 -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-800 flex items-center">
            <i class="fas fa-chart-line text-blue-500 mr-3"></i>
            报名趋势分析
          </h3>
          <div class="flex space-x-2">
            <button class="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              本月
            </button>
            <button class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              本年
            </button>
          </div>
        </div>
        <div class="h-80 bg-gray-50 rounded-xl flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">图表区域 - 开发中</p>
          </div>
        </div>
      </div>
      
      <!-- 最近报名记录-->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <i class="fas fa-list text-blue-500 mr-3"></i>
          最近报名记录        </h3>
        <div class="flex flex-col gap-4">
          <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="学生头像" class="w-10 h-10 rounded-full mr-3">
            <div class="flex-1">
              <p class="font-medium text-gray-800">李晓明</p>
              <p class="text-sm text-gray-500">高等数学</p>
            </div>
            <span class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">已批准</span>
          </div>
          
          <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <img src="https://randomuser.me/api/portraits/women/2.jpg" alt="学生头像" class="w-10 h-10 rounded-full mr-3">
            <div class="flex-1">
              <p class="font-medium text-gray-800">张婷</p>
              <p class="text-sm text-gray-500">英语文学</p>
            </div>
            <span class="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">待审核</span>
          </div>
          
          <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <img src="https://randomuser.me/api/portraits/men/3.jpg" alt="学生头像" class="w-10 h-10 rounded-full mr-3">
            <div class="flex-1">
              <p class="font-medium text-gray-800">王浩</p>
              <p class="text-sm text-gray-500">计算机科学</p>
            </div>
            <span class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">已批准</span>
          </div>
          
          <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <img src="https://randomuser.me/api/portraits/women/4.jpg" alt="学生头像" class="w-10 h-10 rounded-full mr-3">
            <div class="flex-1">
              <p class="font-medium text-gray-800">赵思</p>
              <p class="text-sm text-gray-500">物理实验</p>
            </div>
            <span class="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">已拒绝</span>
          </div>
          
          <div class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <img src="https://randomuser.me/api/portraits/men/5.jpg" alt="学生头像" class="w-10 h-10 rounded-full mr-3">
            <div class="flex-1">
                <p class="font-medium text-gray-800">刘子</p>
              <p class="text-sm text-gray-500">艺术设计</p>
            </div>
            <span class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">已批准</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 学生档案管理 -->
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-800 flex items-center">
          <i class="fas fa-user-graduate text-blue-500 mr-3"></i>
          学生档案管理
        </h3>
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center transition-colors">
          <i class="fas fa-plus mr-2"></i>
          添加新学生        </button>
      </div>
      
      <!-- 搜索-->
      <div class="mb-6">
        <div class="relative max-w-md">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="搜索学生姓名或学号.."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <!-- 学生表格 -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学号</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">姓名</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">专业</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">班级</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">联系方式</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6 text-gray-800">20231001</td>
              <td class="py-4 px-6 text-gray-800 font-medium">陈雨</td>
              <td class="py-4 px-6 text-gray-600">计算机科学</td>
              <td class="py-4 px-6 text-gray-600">CS2023A</td>
              <td class="py-4 px-6 text-gray-600">138****1234</td>
              <td class="py-4 px-6">
                <div class="flex space-x-2">
                  <button class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6 text-gray-800">20231002</td>
              <td class="py-4 px-6 text-gray-800 font-medium">杨天</td>
              <td class="py-4 px-6 text-gray-600">电子信息工程</td>
              <td class="py-4 px-6 text-gray-600">EE2023B</td>
              <td class="py-4 px-6 text-gray-600">139****5678</td>
              <td class="py-4 px-6">
                <div class="flex space-x-2">
                  <button class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6 text-gray-800">20231003</td>
              <td class="py-4 px-6 text-gray-800 font-medium">周欣</td>
              <td class="py-4 px-6 text-gray-600">工商管理</td>
              <td class="py-4 px-6 text-gray-600">BA2023C</td>
              <td class="py-4 px-6 text-gray-600">137****9012</td>
              <td class="py-4 px-6">
                <div class="flex space-x-2">
                  <button class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6 text-gray-800">20231004</td>
              <td class="py-4 px-6 text-gray-800 font-medium">吴宇</td>
              <td class="py-4 px-6 text-gray-600">机械工程</td>
              <td class="py-4 px-6 text-gray-600">ME2023D</td>
              <td class="py-4 px-6 text-gray-600">136****3456</td>
              <td class="py-4 px-6">
                <div class="flex space-x-2">
                  <button class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 控制面板页面
 * @component Dashboard
 * @description 显示系统概览、统计数据和最近活动  
 */
import { ref, onMounted } from 'vue'

// 响应式数据
const loading = ref<boolean>(false)

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Dashboard 组件已挂载')
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
}
</style> 
