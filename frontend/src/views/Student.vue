<template>
  <div class="student-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">学生管理</h1>
          <p class="text-emerald-100">管理学生信息、学籍档案和相关数据</p>
        </div>
        <div class="text-6xl opacity-20">
          👨‍🎓
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-users text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">1,842</h3>
            <p class="text-gray-500 text-sm">总学生数</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-check text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">1,756</h3>
            <p class="text-gray-500 text-sm">在校学生</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-plus text-yellow-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">86</h3>
            <p class="text-gray-500 text-sm">新增学生</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-graduate text-red-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">324</h3>
            <p class="text-gray-500 text-sm">毕业学生</p>
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
            placeholder="搜索学生姓名或学号..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            v-model="searchQuery"
          />
        </div>
        
        <!-- 筛选和操作按钮 -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <!-- 筛选区域 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0">
              <option value="">所有专业</option>
              <option value="computer">计算机科学</option>
              <option value="engineering">工程技术</option>
              <option value="business">工商管理</option>
            </select>
            
            <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0">
              <option value="">所有状态</option>
              <option value="active">在校</option>
              <option value="inactive">休学</option>
              <option value="graduated">毕业</option>
            </select>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
              <i class="fas fa-plus mr-2"></i>
              <span class="whitespace-nowrap">添加学生</span>
            </button>
            
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
              <i class="fas fa-upload mr-2"></i>
              <span class="whitespace-nowrap">批量导入</span>
            </button>
            
            <button class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
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
            <span class="text-sm text-gray-500">已选择 0 个学生</span>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-user-slash mr-2"></i>
              <span class="whitespace-nowrap">批量禁用</span>
            </button>
            
            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-user-check mr-2"></i>
              <span class="whitespace-nowrap">批量启用</span>
            </button>
            
            <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-trash mr-2"></i>
              <span class="whitespace-nowrap">批量删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 学生列表 -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">学生列表</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">
                <input type="checkbox" class="rounded">
              </th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学生信息</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学号</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">专业</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">班级</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">联系方式</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6">
                <input type="checkbox" class="rounded">
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center">
                  <img :src="student.avatar" :alt="student.name" class="w-10 h-10 rounded-full mr-3">
                  <div>
                    <p class="font-medium text-gray-800">{{ student.name }}</p>
                    <p class="text-sm text-gray-500">{{ student.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-gray-800 font-mono">{{ student.studentId }}</td>
              <td class="py-4 px-6 text-gray-600">{{ student.major }}</td>
              <td class="py-4 px-6 text-gray-600">{{ student.class }}</td>
              <td class="py-4 px-6 text-gray-600">{{ student.phone }}</td>
              <td class="py-4 px-6">
                <span 
                  :class="getStatusClass(student.status)"
                  class="px-3 py-1 rounded-full text-xs font-medium"
                >
                  {{ getStatusText(student.status) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <button 
                    class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center min-w-0" 
                    title="编辑"
                  >
                    <i class="fas fa-edit text-sm"></i>
                  </button>
                  <button 
                    class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center min-w-0" 
                    title="查看详情"
                  >
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                  <button 
                    class="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center min-w-0" 
                    title="重置密码"
                  >
                    <i class="fas fa-key text-sm"></i>
                  </button>
                  <button 
                    class="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center min-w-0" 
                    title="状态切换"
                  >
                    <i class="fas fa-toggle-on text-sm"></i>
                  </button>
                  <button 
                    class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center min-w-0" 
                    title="删除"
                  >
                    <i class="fas fa-trash text-sm"></i>
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
            显示 1-10 条，共{{ students.length }} 条记录
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              上一页
            </button>
            <button class="px-3 py-1 bg-emerald-500 text-white rounded">
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
 * 学生管理页面
 * @component Student
 * @description 学生信息的增删改查管理
 */
import { ref, computed, onMounted } from 'vue'

// 学生数据类型定义
interface Student {
  id: number
  name: string
  studentId: string
  email: string
  major: string
  class: string
  phone: string
  avatar: string
  status: 'active' | 'inactive' | 'graduated'
}

// 响应式数据
const searchQuery = ref<string>('')
const students = ref<Student[]>([
  {
    id: 1,
    name: '陈雨',
    studentId: '20231001',
    email: 'chenyutong@example.com',
    major: '计算机科学',
    class: 'CS2023A',
    phone: '138****1234',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    status: 'active'
  },
  {
    id: 2,
    name: '杨天',
    studentId: '20231002',
    email: 'yangtianyu@example.com',
    major: '电子信息工程',
    class: 'EE2023B',
    phone: '139****5678',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    status: 'active'
  },
  {
    id: 3,
    name: '周欣',
    studentId: '20231003',
    email: 'zhouxinran@example.com',
    major: '工商管理',
    class: 'BA2023C',
    phone: '137****9012',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    status: 'inactive'
  },
  {
    id: 4,
    name: '吴宇',
    studentId: '20231004',
    email: 'wuyuhang@example.com',
    major: '机械工程',
    class: 'ME2023D',
    phone: '136****3456',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    status: 'graduated'
  }
])

// 计算属性 - 过滤学生列表
const filteredStudents = computed<Student[]>(() => {
  if (!searchQuery.value) {
    return students.value
  }
  
  return students.value.filter(student => 
    student.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    student.studentId.includes(searchQuery.value)
  )
})

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-600'
    case 'inactive':
      return 'bg-yellow-100 text-yellow-600'
    case 'graduated':
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  switch (status) {
    case 'active':
      return '在校'
    case 'inactive':
      return '休学'
    case 'graduated':
      return '毕业'
    default:
      return '未知'
  }
}

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Student 组件已挂载')
})
</script>

<style scoped>
.student-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style> 
