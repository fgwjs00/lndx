<template>
  <div class="course-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">课程管理</h1>
          <p class="text-purple-100">管理课程信息、教学计划和课程安排</p>
        </div>
        <div class="text-6xl opacity-20">
          📚
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-book text-purple-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">56</h3>
            <p class="text-gray-500 text-sm">总课程数</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-play text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">42</h3>
            <p class="text-gray-500 text-sm">进行中</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-clock text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">8</h3>
            <p class="text-gray-500 text-sm">待开课</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-check text-gray-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">6</h3>
            <p class="text-gray-500 text-sm">已结课</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作区域 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- 搜索框 -->
        <div class="relative flex-1 max-w-md">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="搜索课程名称或编号..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            v-model="searchQuery"
          />
        </div>
        
        <!-- 筛选和操作按钮 -->
        <div class="flex items-center space-x-4">
          <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">所有状态</option>
            <option value="active">进行中</option>
            <option value="pending">待开课</option>
            <option value="completed">已结课</option>
          </select>
          
          <button class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors">
            <i class="fas fa-plus mr-2"></i>
            添加课程
          </button>
          
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors">
            <i class="fas fa-download mr-2"></i>
            导出数据
          </button>
        </div>
      </div>
    </div>
    
    <!-- 课程列表 -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">课程列表</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">
                <input type="checkbox" class="rounded">
              </th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">课程信息</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">课程编号</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">任课教师</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学分</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">上课时间</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in filteredCourses" :key="course.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6">
                <input type="checkbox" class="rounded">
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-book text-white"></i>
                  </div>
                  <div>
                    <p class="font-medium text-gray-800">{{ course.name }}</p>
                    <p class="text-sm text-gray-500">{{ course.description }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-gray-800 font-mono">{{ course.courseId }}</td>
              <td class="py-4 px-6 text-gray-600">{{ course.teacher }}</td>
              <td class="py-4 px-6 text-gray-600">{{ course.credits }}</td>
              <td class="py-4 px-6 text-gray-600">{{ course.schedule }}</td>
              <td class="py-4 px-6">
                <span 
                  :class="getStatusClass(course.status)"
                  class="px-3 py-1 rounded-full text-xs font-medium"
                >
                  {{ getStatusText(course.status) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <div class="flex space-x-2">
                  <button class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors" title="编辑">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="查看详情">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors" title="学生名单">
                    <i class="fas fa-users"></i>
                  </button>
                  <button class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="删除">
                    <i class="fas fa-trash"></i>
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
            显示 1-10 条，共 {{ courses.length }} 条记录
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              上一页
            </button>
            <button class="px-3 py-1 bg-purple-500 text-white rounded">
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
 * 课程管理页面
 * @component Course
 * @description 课程信息的增删改查管理
 */
import { ref, computed, onMounted } from 'vue'

// 课程数据类型定义
interface Course {
  id: number
  name: string
  courseId: string
  description: string
  teacher: string
  credits: number
  schedule: string
  status: 'active' | 'pending' | 'completed'
}

// 响应式数据
const searchQuery = ref<string>('')
const courses = ref<Course[]>([
  {
    id: 1,
    name: '高等数学',
    courseId: 'MATH101',
    description: '微积分基础理论与应用',
    teacher: '张教授',
    credits: 4,
    schedule: '周一 9:00-11:00',
    status: 'active'
  },
  {
    id: 2,
    name: '计算机程序设计',
    courseId: 'CS101',
    description: 'C++程序设计基础',
    teacher: '李老师',
    credits: 3,
    schedule: '周三 14:00-16:00',
    status: 'active'
  },
  {
    id: 3,
    name: '大学英语',
    courseId: 'ENG101',
    description: '英语综合技能训练',
    teacher: '王老师',
    credits: 2,
    schedule: '周五 10:00-12:00',
    status: 'pending'
  },
  {
    id: 4,
    name: '数据结构',
    courseId: 'CS201',
    description: '数据结构与算法基础',
    teacher: '赵教授',
    credits: 4,
    schedule: '周二 15:00-17:00',
    status: 'completed'
  }
])

// 计算属性 - 过滤课程列表
const filteredCourses = computed<Course[]>(() => {
  if (!searchQuery.value) {
    return courses.value
  }
  
  return courses.value.filter(course => 
    course.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    course.courseId.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-600'
    case 'pending':
      return 'bg-blue-100 text-blue-600'
    case 'completed':
      return 'bg-gray-100 text-gray-600'
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
      return '进行中'
    case 'pending':
      return '待开课'
    case 'completed':
      return '已结课'
    default:
      return '未知'
  }
}

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Course 组件已挂载')
})
</script>

<style scoped>
.course-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style> 