<template>
  <div class="application-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">报名管理</h1>
          <p class="text-orange-100">管理学生报名申请、审核流程和报名统计</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-6xl opacity-20">
            📝
          </div>
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-file-alt text-orange-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">324</h3>
            <p class="text-gray-500 text-sm">总申请数</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-clock text-yellow-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">28</h3>
            <p class="text-gray-500 text-sm">待审核</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-check text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">268</h3>
            <p class="text-gray-500 text-sm">已批准</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-times text-red-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">28</h3>
            <p class="text-gray-500 text-sm">已拒绝</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作区域 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <!-- 搜索框 -->
        <div class="relative flex-1 max-w-md">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="搜索学生姓名或申请编号..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            v-model="searchQuery"
          />
        </div>
        
        <!-- 筛选和操作按钮 -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <!-- 筛选区域 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-0">
              <option value="">所有状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
            </select>
            
            <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-0">
              <option value="">所有课程</option>
              <option value="math">高等数学</option>
              <option value="english">英语文学</option>
              <option value="computer">计算机科学</option>
            </select>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
              <i class="fas fa-check mr-2"></i>
              <span class="whitespace-nowrap">批量审核</span>
            </button>
            
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
              <i class="fas fa-download mr-2"></i>
              <span class="whitespace-nowrap">导出数据</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 批量操作区域 -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center">
              <input type="checkbox" class="rounded mr-2">
              <span class="text-sm text-gray-600">全选</span>
            </label>
            <span class="text-sm text-gray-500">已选择 0 个申请</span>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-check mr-2"></i>
              <span class="whitespace-nowrap">批量批准</span>
            </button>
            
            <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-times mr-2"></i>
              <span class="whitespace-nowrap">批量拒绝</span>
            </button>
            
            <button class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-envelope mr-2"></i>
              <span class="whitespace-nowrap">发送通知</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 报名申请列表 -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">报名申请列表</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">
                <input type="checkbox" class="rounded">
              </th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学生信息</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">申请编号</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">申请课程</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">申请时间</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="application in filteredApplications" :key="application.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6">
                <input type="checkbox" class="rounded">
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center">
                  <img :src="application.avatar" :alt="application.studentName" class="w-10 h-10 rounded-full mr-3">
                  <div>
                    <p class="font-medium text-gray-800">{{ application.studentName }}</p>
                    <p class="text-sm text-gray-500">{{ application.studentId }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-gray-800 font-mono">{{ application.applicationId }}</td>
              <td class="py-4 px-6 text-gray-600">{{ application.courseName }}</td>
              <td class="py-4 px-6 text-gray-600">{{ application.applicationDate }}</td>
              <td class="py-4 px-6">
                <span 
                  :class="getStatusClass(application.status)"
                  class="px-3 py-1 rounded-full text-xs font-medium"
                >
                  {{ getStatusText(application.status) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <button 
                    v-if="application.status === 'pending'"
                    class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center min-w-0" 
                    title="批准"
                  >
                    <i class="fas fa-check text-sm"></i>
                  </button>
                  <button 
                    v-if="application.status === 'pending'"
                    class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center min-w-0" 
                    title="拒绝"
                  >
                    <i class="fas fa-times text-sm"></i>
                  </button>
                  <button 
                    class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center min-w-0" 
                    title="查看详情"
                  >
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                  <button 
                    class="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center min-w-0" 
                    title="编辑"
                  >
                    <i class="fas fa-edit text-sm"></i>
                  </button>
                  <button 
                    class="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center min-w-0" 
                    title="发送通知"
                  >
                    <i class="fas fa-envelope text-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div class="p-6 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            显示 1-10 条，共 {{ applications.length }} 条记录
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              上一页
            </button>
            <button class="px-3 py-1 bg-orange-500 text-white rounded">
              1
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              2
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              3
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 报名管理页面
 * @component Application
 * @description 学生报名申请的审核和管理
 */
import { ref, computed, onMounted } from 'vue'

// 报名申请数据类型定义
interface Application {
  id: number
  studentName: string
  studentId: string
  applicationId: string
  courseName: string
  applicationDate: string
  avatar: string
  status: 'pending' | 'approved' | 'rejected'
}

// 响应式数据
const searchQuery = ref<string>('')
const applications = ref<Application[]>([
  {
    id: 1,
    studentName: '李小明',
    studentId: '20231001',
    applicationId: 'APP001',
    courseName: '高等数学',
    applicationDate: '2023-10-05',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    status: 'approved'
  },
  {
    id: 2,
    studentName: '张婷婷',
    studentId: '20231002',
    applicationId: 'APP002',
    courseName: '英语文学',
    applicationDate: '2023-10-04',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    status: 'pending'
  },
  {
    id: 3,
    studentName: '王浩然',
    studentId: '20231003',
    applicationId: 'APP003',
    courseName: '计算机科学',
    applicationDate: '2023-10-03',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    status: 'approved'
  },
  {
    id: 4,
    studentName: '赵思思',
    studentId: '20231004',
    applicationId: 'APP004',
    courseName: '物理实验',
    applicationDate: '2023-10-03',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    status: 'rejected'
  },
  {
    id: 5,
    studentName: '刘子轩',
    studentId: '20231005',
    applicationId: 'APP005',
    courseName: '艺术设计',
    applicationDate: '2023-10-02',
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    status: 'approved'
  }
])

// 计算属性 - 过滤申请列表
const filteredApplications = computed<Application[]>(() => {
  if (!searchQuery.value) {
    return applications.value
  }
  
  return applications.value.filter(application => 
    application.studentName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    application.applicationId.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-600'
    case 'approved':
      return 'bg-green-100 text-green-600'
    case 'rejected':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return '待审核'
    case 'approved':
      return '已批准'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知'
  }
}

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Application 组件已挂载')
})
</script>

<style scoped>
.application-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style> 