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
      <!-- 分页签 -->
      <div class="border-b border-gray-200">
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
            管理员 ({{ adminUsers.length }})
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

      <!-- 操作区域 -->
      <div class="p-6">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <!-- 搜索框 -->
          <div class="relative flex-1 max-w-md">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="搜索用户姓名或手机号..."
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              v-model="searchQuery"
            />
          </div>
          
          <!-- 筛选和操作按钮 -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <!-- 筛选区域 -->
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
            
            <!-- 操作按钮 -->
            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                @click="showUserForm = true"
                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
              >
                <i class="fas fa-plus mr-2"></i>
                <span class="whitespace-nowrap">{{ getAddButtonText() }}</span>
              </button>
              
              <button class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
                <i class="fas fa-download mr-2"></i>
                <span class="whitespace-nowrap">导出数据</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 用户表格 -->
      <div class="overflow-x-auto">
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
            <tr 
              v-for="user in currentTabUsers" 
              :key="user.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-4 px-6">
                <img :src="user.avatar" :alt="user.realName" class="w-10 h-10 rounded-full">
              </td>
              <td class="py-4 px-6 text-gray-800 font-medium">{{ user.realName }}</td>
              <td class="py-4 px-6 text-gray-600">
                {{ activeTab === 'teacher' ? (user.teacherId || user.phone) : user.phone }}
              </td>
              <td v-if="activeTab === 'teacher'" class="py-4 px-6 text-gray-600">
                {{ user.subject || '未设置' }}
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
                  :class="getStatusClass(user.status)"
                >
                  {{ getStatusText(user.status) }}
                </span>
              </td>
              <td class="py-4 px-6 text-gray-600">{{ user.createTime }}</td>
              <td class="py-4 px-6 text-gray-600">{{ user.lastLoginTime || '从未登录' }}</td>
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
                    class="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center min-w-0"
                    title="重置密码"
                  >
                    <i class="fas fa-key text-sm"></i>
                  </button>
                  <button 
                    @click="toggleUserStatus(user)"
                    class="p-2 rounded-lg transition-colors flex items-center justify-center min-w-0"
                    :class="user.status === 'active' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'"
                    :title="user.status === 'active' ? '禁用用户' : '启用用户'"
                  >
                    <i :class="user.status === 'active' ? 'fas fa-ban' : 'fas fa-check'" class="text-sm"></i>
                  </button>
                  <button 
                    v-if="user.id !== authStore.user?.id"
                    @click="deleteUser(user)"
                    class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center min-w-0"
                    title="删除用户"
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
            显示 1-10 条，共 {{ currentTabUsers.length }} 条记录
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              上一页
            </button>
            <button class="px-3 py-1 bg-blue-500 text-white rounded">
              1
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              2
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑用户弹窗 -->
    <a-modal
      v-model:open="showUserForm"
      :title="editingUser ? '编辑用户' : '添加用户'"
      :width="800"
      :footer="null"
      :destroy-on-close="true"
    >
      <UserForm 
        :user="editingUser"
        :default-role="activeTab === 'teacher' ? 'teacher' : (activeTab === 'student' ? 'student' : undefined)"
        @success="handleUserSuccess" 
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
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import UserForm from '@/components/UserForm.vue'
import { useAuthStore } from '@/store/auth'

// 响应式数据
const authStore = useAuthStore()
const activeTab = ref<'all' | 'admin' | 'teacher' | 'student'>('all')
const searchQuery = ref<string>('')
const selectedStatus = ref<string>('')
const showUserForm = ref<boolean>(false)
const editingUser = ref<any>(null)

// 模拟用户数据
const users = ref([
  {
    id: 1,
    realName: '张三',
    phone: '13800138001',
    role: 'admin',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1',
    createTime: '2024-01-15 10:30:00',
    lastLoginTime: '2025-07-15 09:15:00'
  },
  {
    id: 2,
    realName: '李四',
    phone: '13800138002',
    role: 'teacher',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1',
    createTime: '2024-02-20 14:20:00',
    lastLoginTime: '2025-07-14 16:30:00',
    teacherId: 'T001',
    subject: '数学'
  },
  {
    id: 3,
    realName: '王五',
    phone: '13800138003',
    role: 'teacher',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher2',
    createTime: '2024-03-10 09:45:00',
    lastLoginTime: '2025-07-15 08:20:00',
    teacherId: 'T002',
    subject: '英语'
  },
  {
    id: 4,
    realName: '赵六',
    phone: '13800138004',
    role: 'student',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1',
    createTime: '2024-04-05 11:00:00',
    lastLoginTime: '2025-07-13 20:45:00'
  },
  {
    id: 5,
    realName: '钱七',
    phone: '13800138005',
    role: 'student',
    status: 'inactive',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2',
    createTime: '2024-05-12 15:30:00',
    lastLoginTime: null
  }
])

// 计算属性
const activeUsers = computed(() => users.value.filter(user => user.status === 'active'))
const studentUsers = computed(() => users.value.filter(user => user.role === 'student'))
const teacherUsers = computed(() => users.value.filter(user => user.role === 'teacher'))
const adminUsers = computed(() => users.value.filter(user => user.role === 'admin'))

const currentTabUsers = computed(() => {
  let filteredUsers = users.value

  // 按分页签过滤
  if (activeTab.value !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.role === activeTab.value)
  }

  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filteredUsers = filteredUsers.filter(user => 
      user.realName.toLowerCase().includes(query) || 
      user.phone.includes(query) ||
      (user.teacherId && user.teacherId.toLowerCase().includes(query))
    )
  }

  // 按状态过滤
  if (selectedStatus.value) {
    filteredUsers = filteredUsers.filter(user => user.status === selectedStatus.value)
  }

  return filteredUsers
})

// 方法
const getTabTitle = (): string => {
  const titles = {
    all: '全部用户',
    admin: '管理员列表',
    teacher: '教师列表',
    student: '学生列表'
  }
  return titles[activeTab.value]
}

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
    admin: 'bg-red-100 text-red-800',
    teacher: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800'
  }
  return classes[role as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getRoleText = (role: string): string => {
  const texts = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return texts[role as keyof typeof texts] || '未知'
}

const getStatusClass = (status: string): string => {
  return status === 'active' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

const getStatusText = (status: string): string => {
  return status === 'active' ? '正常' : '禁用'
}

const editUser = (user: any): void => {
  editingUser.value = { ...user }
  showUserForm.value = true
}

const resetPassword = (user: any): void => {
  message.success(`已重置用户 ${user.realName} 的密码`)
}

const toggleUserStatus = (user: any): void => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  // 更新用户状态
  const userIndex = users.value.findIndex(u => u.id === user.id)
  if (userIndex !== -1) {
    users.value[userIndex].status = newStatus
    message.success(`已${action}用户 ${user.realName}`)
  }
}

const deleteUser = (user: any): void => {
  if (confirm(`确定要删除用户 ${user.realName} 吗？此操作不可恢复。`)) {
    const userIndex = users.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users.value.splice(userIndex, 1)
      message.success(`已删除用户 ${user.realName}`)
    }
  }
}

const handleUserSuccess = (): void => {
  showUserForm.value = false
  editingUser.value = null
  message.success('用户操作成功')
}

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.user-management {
  padding: 0;
}
</style> 