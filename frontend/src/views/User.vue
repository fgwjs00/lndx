<template>
  <div class="user-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">用户管理</h1>
          <p class="text-blue-100">统一管理所有用户账户、权限分配和状态控制</p>
        </div>
        <div class="text-6xl opacity-20">
          👥
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-users text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ users.length }}</h3>
            <p class="text-gray-500 text-sm">总用户数</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-check text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ activeUsers.length }}</h3>
            <p class="text-gray-500 text-sm">活跃用户</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-graduate text-purple-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ studentUsers.length }}</h3>
            <p class="text-gray-500 text-sm">学生用户</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-chalkboard-teacher text-orange-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ teacherUsers.length }}</h3>
            <p class="text-gray-500 text-sm">教师用户</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-shield text-red-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ adminUsers.length }}</h3>
            <p class="text-gray-500 text-sm">管理员</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页签和操作区域 -->
    <div class="bg-white rounded-2xl shadow-lg mb-8">
      <!-- 分页标签 - 根据用户角色显示不同的标签-->
      <div class="border-b border-gray-200" v-if="authStore.isAdmin">
        <nav class="flex space-x-8 px-6">
          <button
            @click="activeTab = 'all'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'all' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fas fa-users mr-2"></i>
            全部用户 ({{ users.length }})
          </button>
          <button
            @click="activeTab = 'admin'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'admin' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fas fa-user-shield mr-2"></i>
            管理员({{ adminUsers.length }})
          </button>
          <button
            @click="activeTab = 'teacher'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'teacher' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fas fa-chalkboard-teacher mr-2"></i>
            教师 ({{ teacherUsers.length }})
          </button>
          <button
            @click="activeTab = 'student'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'student' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fas fa-user-graduate mr-2"></i>
            学生 ({{ studentUsers.length }})
          </button>
        </nav>
      </div>
      
      <!-- 教师角色的简化标签-->
      <div class="border-b border-gray-200" v-else-if="authStore.isTeacher">
        <nav class="flex space-x-8 px-6">
          <button
            @click="activeTab = 'student'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'student' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fas fa-user-graduate mr-2"></i>
            我的学生 ({{ studentUsers.length }})
          </button>
        </nav>
      </div>
      
      <!-- 学生角色不显示用户管理-->
      <div class="border-b border-gray-200" v-else>
        <div class="px-6 py-4 text-center text-gray-500">
          <i class="fas fa-lock text-2xl mb-2"></i>
          <p>您没有权限访问用户管理功能</p>
        </div>
      </div>

      <!-- 操作区域 - 只对管理员和教师显示 -->
      <div class="p-6" v-if="authStore.isAdmin || authStore.isTeacher">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <!-- 搜索框-->
          <div class="relative flex-1 max-w-md">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              :placeholder="getSearchPlaceholder()"
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              v-model="searchQuery"
            />
          </div>
          
          <!-- 筛选和操作按钮 -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <!-- 筛选区域-->
            <div class="flex flex-col sm:flex-row gap-3">
              <select 
                v-model="selectedStatus" 
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
              >
                <option value="">所有状态</option>
                <option value="active">正常</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
            
            <!-- 操作按钮 - 根据角色显示不同按钮 -->
            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                v-if="canAddUser"
                @click="showUserForm = true"
                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
              >
                <i class="fas fa-plus mr-2"></i>
                <span class="whitespace-nowrap">{{ getAddButtonText() }}</span>
              </button>
              
              <button 
                v-if="canExportData"
                @click="exportUserData"
                class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
              >
                <i class="fas fa-download mr-2"></i>
                <span class="whitespace-nowrap">导出数据</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 用户表格 -->
      <div class="overflow-x-auto">
        <!-- 加载状态显示 -->
        <div v-if="tableLoading" class="relative">
          <SkeletonLoader type="table" :rows="5" />
        </div>
        
        <!-- 实际表格内容 -->
        <div v-else class="relative">
          <!-- 刷新指示器 -->
          <div v-if="refreshing" class="absolute top-4 right-4 z-10">
            <LoadingSpinner size="small" message="刷新中..." />
          </div>
          
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left py-4 px-6 text-gray-600 font-semibold">头像</th>
                <th class="text-left py-4 px-6 text-gray-600 font-semibold">姓名</th>
                <th class="text-left py-4 px-6 text-gray-600 font-semibold">
                  {{ activeTab === 'teacher' ? '工号' : '手机号' }}
                </th>
                <th v-if="activeTab === 'teacher'" class="text-left py-4 px-6 text-gray-600 font-semibold">学科</th>
                <th v-if="activeTab === 'all'" class="text-left py-4 px-6 text-gray-600 font-semibold">角色</th>
                <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
                <th class="text-left py-4 px-6 text-gray-600 font-semibold">注册时间</th>
                <th class="text-left py-4 px-6 text-gray-600 font-semibold">最后登录</th>
                <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              <!-- 空状态 -->
              <tr v-if="currentTabUsers.length === 0">
                <td :colspan="activeTab === 'teacher' ? 8 : (activeTab === 'all' ? 8 : 7)" class="py-12 text-center text-gray-500">
                  <div class="flex flex-col items-center space-y-3">
                    <i class="fas fa-users text-4xl text-gray-300"></i>
                    <p>暂无用户数据</p>
                    <button 
                      @click="fetchUsers(true)" 
                      class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    >
                      <i class="fas fa-refresh mr-2"></i>刷新数据
                    </button>
                  </div>
                </td>
              </tr>
              
              <!-- 用户数据行 -->
              <tr 
                v-for="user in (currentTabUsers as User[])" 
                :key="user.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
              <td class="py-4 px-6">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.realName" class="w-10 h-10 rounded-full">
                <div v-else class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {{ user.realName?.charAt(0) || '?' }}
                </div>
              </td>
              <td class="py-4 px-6 text-gray-800 font-medium">{{ user.realName }}</td>
              <td class="py-4 px-6 text-gray-600">
                {{ user.phone }}
              </td>
              <td v-if="activeTab === 'teacher'" class="py-4 px-6 text-gray-600">
                未设置
              </td>
              <td v-if="activeTab === 'all'" class="py-4 px-6">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="getRoleClass(user.role)"
                >
                  {{ getRoleText(user.role) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="getStatusClass(user.isActive)"
                >
                  {{ getStatusText(user.isActive) }}
                </span>
              </td>
              <td class="py-4 px-6 text-gray-600">{{ formatDate(user.createdAt) }}</td>
              <td class="py-4 px-6 text-gray-600">{{ formatDate(user.lastLoginAt) || '从未登录' }}</td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <button 
                    @click="editUser(user)"
                    class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center min-w-0"
                    title="编辑用户"
                  >
                    <i class="fas fa-edit text-sm"></i>
                  </button>
                  <button 
                    @click="resetPassword(user)"
                    :disabled="isButtonLoading(`reset-password-${user.id}`)"
                    :class="[
                      'p-2 rounded-lg transition-colors flex items-center justify-center min-w-0',
                      isButtonLoading(`reset-password-${user.id}`) 
                        ? 'bg-yellow-100 text-yellow-400 cursor-not-allowed' 
                        : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    ]"
                    title="重置密码"
                  >
                    <LoadingSpinner v-if="isButtonLoading(`reset-password-${user.id}`)" size="small" />
                    <i v-else class="fas fa-key text-sm"></i>
                  </button>
                  <button 
                    @click="toggleUserStatus(user)"
                    :disabled="isButtonLoading(`toggle-status-${user.id}`)"
                    :class="[
                      'p-2 rounded-lg transition-colors flex items-center justify-center min-w-0',
                      isButtonLoading(`toggle-status-${user.id}`) 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : user.isActive 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                    ]"
                    :title="user.isActive ? '禁用用户' : '启用用户'"
                  >
                    <LoadingSpinner v-if="isButtonLoading(`toggle-status-${user.id}`)" size="small" />
                    <i v-else :class="user.isActive ? 'fas fa-ban' : 'fas fa-check'" class="text-sm"></i>
                  </button>
                  <button 
                    v-if="user.id !== String(authStore.user?.id)"
                    @click="deleteUser(user)"
                    :disabled="isButtonLoading(`delete-user-${user.id}`)"
                    :class="[
                      'p-2 rounded-lg transition-colors flex items-center justify-center min-w-0',
                      isButtonLoading(`delete-user-${user.id}`)
                        ? 'bg-red-100 text-red-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    ]"
                    title="删除用户"
                  >
                    <LoadingSpinner v-if="isButtonLoading(`delete-user-${user.id}`)" size="small" />
                    <i v-else class="fas fa-trash text-sm"></i>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="p-6 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            显示 1-10 条，共{{ currentTabUsers.length }} 条记录          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              上一页            </button>
            <button class="px-3 py-1 bg-blue-500 text-white rounded">
              1
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              2
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              下一页            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑用户弹窗 -->
    <a-modal
      v-model:open="showUserForm"
      :title="null"
      :width="900"
      :footer="null"
      :destroy-on-close="true"
      centered
    >
      <UserForm 
        :user="editingUser"
        :default-role="activeTab === 'teacher' ? 'teacher' : (activeTab === 'student' ? 'student' : undefined)"
        :loading="formSubmitLoading"
        @submit="handleUserSubmit" 
        @cancel="showUserForm = false"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户管理页面
 * @component User
 * @description 统一管理所有用户账户，包括管理员、教师、学生的账户管理
 */
import { ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import UserForm from '@/components/UserForm.vue'
import { useAuthStore } from '@/store/auth'
import { UserService, type User, type UserRole } from '@/api/user'
import { withErrorHandling, withRetry } from '@/utils/errorHandler'
import { useTableLoading, useButtonLoading } from '@/utils/loadingManager'
import { createAdvancedFilter, debounce, perfMonitor } from '@/utils/performance'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

// 响应式数据
const authStore = useAuthStore()
const activeTab = ref<'all' | 'admin' | 'teacher' | 'student'>('all')
const searchQuery = ref<string>('')
const selectedStatus = ref<string>('')
const showUserForm = ref<boolean>(false)
const editingUser = ref<any>(null)
const formSubmitLoading = ref<boolean>(false)

// 用户数据和分页
const users = ref<User[]>([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

// Loading状态管理
const { setButtonLoading, isButtonLoading } = useButtonLoading()
const { tableLoading, refreshing, setTableLoading, setRefreshing } = useTableLoading()

// 高性能计算属性 - 使用优化的过滤系统
const activeUsers = computed(() => users.value.filter(user => user.isActive))
const studentUsers = computed(() => users.value.filter(user => user.role === 'STUDENT'))
const teacherUsers = computed(() => users.value.filter(user => user.role === 'TEACHER'))
const adminUsers = computed(() => users.value.filter(user => 
  user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN'
))

// 使用高级过滤器优化性能  
const currentTabUsers = createAdvancedFilter<User>(users, (filter) => {
  // 权限检查
  if (authStore.isStudent) {
    return filter.filter(() => false) // 学生不能看到任何用户数据
  }
  
  if (authStore.isTeacher && !authStore.isAdmin) {
    filter.filterBy('role', 'STUDENT' as UserRole)
  }

  // 标签页过滤
  if (activeTab.value === 'admin') {
    filter.filter((user: User) => user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN')
  } else if (activeTab.value === 'teacher') {
    filter.filterBy('role', 'TEACHER' as UserRole)
  } else if (activeTab.value === 'student') {
    filter.filterBy('role', 'STUDENT' as UserRole)
  }

  // 搜索过滤 - 一次性搜索多个字段
  if (searchQuery.value?.trim()) {
    filter.search(['realName', 'phone', 'email'] as (keyof User)[], searchQuery.value)
  }

  // 状态过滤
  if (selectedStatus.value) {
    filter.filterBy('isActive', selectedStatus.value === 'active')
  }

  return filter
})

// 权限计算属性
const canAddUser = computed(() => {
  return authStore.isAdmin || (authStore.isTeacher && activeTab.value === 'student')
})

const canExportData = computed(() => {
  return authStore.isAdmin || authStore.isTeacher
})

// 方法

const getSearchPlaceholder = (): string => {
  const placeholders = {
    all: '搜索用户姓名或手机号...',
    admin: '搜索管理员姓名或手机号...',
    teacher: '搜索教师姓名、工号或手机号...',
    student: '搜索学生姓名或手机号...'
  }
  return placeholders[activeTab.value]
}

const getAddButtonText = (): string => {
  const texts = {
    all: '添加用户',
    admin: '添加管理员',
    teacher: '添加教师',
    student: '添加学生'
  }
  return texts[activeTab.value]
}

const getRoleClass = (role: string): string => {
  const classes = {
    'SUPER_ADMIN': 'bg-purple-100 text-purple-800',
    'SCHOOL_ADMIN': 'bg-red-100 text-red-800',
    'TEACHER': 'bg-blue-100 text-blue-800',
    'STUDENT': 'bg-green-100 text-green-800'
  }
  return classes[role as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getRoleText = (role: string): string => {
  const texts = {
    'SUPER_ADMIN': '超级管理员',
    'SCHOOL_ADMIN': '学校管理员',
    'TEACHER': '教师',
    'STUDENT': '学生'
  }
  return texts[role as keyof typeof texts] || '未知'
}

const getStatusClass = (isActive: boolean): string => {
  return isActive 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

const getStatusText = (isActive: boolean): string => {
  return isActive ? '正常' : '禁用'
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// API调用方法
/**
 * 获取用户列表 - 带性能监控
 */
const fetchUsers = withRetry(async (isRefresh: boolean = false): Promise<void> => {
  // 性能监控开始
  perfMonitor.mark('fetchUsers-start')
  
  if (isRefresh) {
    setRefreshing(true)
  } else {
    setTableLoading(true)
  }
  
  try {
    // 构建查询参数，过滤掉无效值
    const params: any = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    }
    
    // 只有当搜索词不为空时才添加 keyword 参数
    if (searchQuery.value && searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim()
    }
    
    // 只有当不是 'all' 标签页时才添加 role 参数
    if (activeTab.value !== 'all') {
      const roleParam = getRoleParam()
      if (roleParam) {
        params.role = roleParam
      }
    }

    const response = await UserService.getUsers(params)
    users.value = response.data?.list || []
    pagination.value.total = response.data?.total || 0
    
    // 性能监控结束
    perfMonitor.measure('用户列表加载', 'fetchUsers-start')
    console.log('获取用户列表成功:', response.data)
  } finally {
    setTableLoading(false)
    setRefreshing(false)
  }
}, '获取用户列表', { maxRetries: 2, delay: 1000 })

// 防抖优化的搜索函数
const debouncedFetchUsers = debounce(() => {
  pagination.value.current = 1
  fetchUsers()
}, 500)

/**
 * 根据当前标签页获取角色参数
 */
const getRoleParam = (): string | undefined => {
  const roleMap: Record<string, string> = {
    admin: 'SUPER_ADMIN,SCHOOL_ADMIN',
    teacher: 'TEACHER',
    student: 'STUDENT'
  }
  return roleMap[activeTab.value] || undefined
}

const editUser = (user: User): void => {
  editingUser.value = { ...user }
  showUserForm.value = true
}

/**
 * 重置用户密码
 */
const resetPassword = withErrorHandling(async (user: User): Promise<void> => {
  const buttonKey = `reset-password-${user.id}`
  setButtonLoading(buttonKey, true)
  
  try {
    await UserService.resetPassword(user.id, '123456')
    message.success(`已重置用户 ${user.realName} 的密码为默认密码`)
  } finally {
    setButtonLoading(buttonKey, false)
  }
}, '重置用户密码')

/**
 * 切换用户状态
 */
const toggleUserStatus = withErrorHandling(async (user: User): Promise<void> => {
  const buttonKey = `toggle-status-${user.id}`
  setButtonLoading(buttonKey, true)
  
  try {
    const newStatus = !user.isActive
    const action = newStatus ? '启用' : '禁用'
    
    await UserService.toggleUserStatus(user.id, newStatus)
    message.success(`${action}用户 ${user.realName} 成功`)
    // 重新获取数据
    await fetchUsers(true) // 使用刷新模式
  } finally {
    setButtonLoading(buttonKey, false)
  }
}, '切换用户状态')

/**
 * 删除用户
 */
const deleteUser = withErrorHandling(async (user: User): Promise<void> => {
  const buttonKey = `delete-user-${user.id}`
  setButtonLoading(buttonKey, true)
  
  try {
    await UserService.deleteUser(user.id)
    message.success(`删除用户 ${user.realName} 成功`)
    await fetchUsers(true) // 使用刷新模式
  } finally {
    setButtonLoading(buttonKey, false)
  }
}, '删除用户')

/**
 * 处理用户表单提交
 */
const handleUserSubmit = withErrorHandling(async (formData: any): Promise<void> => {
  formSubmitLoading.value = true
  
  try {
    if (editingUser.value) {
      // 更新用户
      await UserService.updateUser(editingUser.value.id, formData)
      message.success('更新用户成功')
    } else {
      // 创建用户
      await UserService.createUser(formData)
      message.success('创建用户成功')
    }
    
    // 关闭表单并重置
    showUserForm.value = false
    editingUser.value = null
    
    // 重新获取数据
    await fetchUsers(true)
  } finally {
    formSubmitLoading.value = false
  }
}, '保存用户信息')



const exportUserData = (): void => {
  const data: User[] = currentTabUsers.value
  if (data.length === 0) {
      message.warning('暂无数据可导出')
    return
  }
  
  // 构造CSV数据
  const headers = ['姓名', '手机号', '邮箱', '角色', '状态', '创建时间', '最后登录']
  const csvContent = [
    headers.join(','),
    ...data.map((user: User) => [
      user.realName,
      user.phone,
      user.email || '未设置',
      getRoleText(user.role),
      getStatusText(user.isActive),
      formatDate(user.createdAt),
      formatDate(user.lastLoginAt) || '从未登录'
    ].join(','))
  ].join('\n')
  
  // 创建下载链接
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `用户数据_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  message.success('用户数据导出成功')
}

// 监听器 - 优化搜索性能
watch(activeTab, () => {
  pagination.value.current = 1
  fetchUsers() // 立即执行标签页切换
})

watch(searchQuery, () => {
  debouncedFetchUsers() // 防抖搜索
})

// 生命周期
onMounted(() => {
  console.log('用户管理页面已挂载')
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 0;
}
</style> 
