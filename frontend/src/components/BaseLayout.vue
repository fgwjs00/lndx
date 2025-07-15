<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <div class="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-600 to-purple-700 text-white shadow-xl z-10 flex flex-col">
      <!-- Logo 区域 -->
      <div class="flex items-center px-6 py-5 border-b border-white/10 flex-shrink-0">
        <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
          <i class="fas fa-graduation-cap text-2xl"></i>
        </div>
        <h1 class="text-xl font-semibold">学籍管理</h1>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="flex-1 overflow-y-auto py-4">
        <div class="px-4 flex flex-col gap-2">
          <router-link
            v-for="item in visibleMenuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 group"
            :class="{ 'bg-white/20 text-white border-l-4 border-white': $route.path === item.path }"
          >
            <i :class="item.icon" class="text-lg mr-4 group-hover:scale-110 transition-transform flex-shrink-0"></i>
            <span class="font-medium">{{ item.name }}</span>
          </router-link>
        </div>
      </nav>
    </div>
    
    <!-- 主内容区域 -->
    <div class="ml-64 min-h-screen">
      <!-- 顶部头部 -->
      <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-blue-600">{{ currentPageTitle }}</h2>
            <p class="text-gray-500 text-sm mt-1">{{ currentPageDescription }}</p>
          </div>
          
          <!-- 用户信息 -->
          <div class="flex items-center space-x-4">
            <!-- 开发模式提示 -->
            <div v-if="isDevMode" class="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full">
              <span class="text-yellow-700 text-sm">
                <i class="fas fa-code mr-1"></i>
                开发模式
              </span>
            </div>
            
            <!-- 搜索框 -->
            <div class="relative">
              <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="搜索..."
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <!-- 通知 -->
            <div class="relative">
              <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <i class="fas fa-bell text-lg"></i>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
            
            <!-- 用户头像和下拉菜单 -->
            <a-dropdown placement="bottomRight" :trigger="['click']">
              <div class="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
                <img
                  :src="authStore.userAvatar || 'https://randomuser.me/api/portraits/women/65.jpg'"
                  alt="用户头像"
                  class="w-10 h-10 rounded-full border-2 border-gray-200"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ authStore.userName || '用户' }}</p>
                  <p class="text-xs text-gray-500">
                    <a-tag :color="getRoleColor(authStore.userRole)" size="small">
                      {{ getRoleName(authStore.userRole) }}
                    </a-tag>
                  </p>
                </div>
                <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
              
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile" @click="showProfile = true">
                    <i class="fas fa-user mr-2"></i>
                    个人资料
                  </a-menu-item>
                  <a-menu-item key="settings" @click="showSettings = true">
                    <i class="fas fa-cog mr-2"></i>
                    账户设置
                  </a-menu-item>
                  <a-menu-item key="change-password" @click="showChangePassword = true">
                    <i class="fas fa-key mr-2"></i>
                    修改密码
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="handleLogout">
                    <i class="fas fa-sign-out-alt mr-2"></i>
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </header>
      
      <!-- 页面内容 -->
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 基础布局组件
 * @component BaseLayout
 * @description 提供应用程序的基础布局结构，包含侧边栏导航和主内容区域
 */
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'
import { getRoleName, getRoleColor } from '@/utils/auth'
import { UserRole } from '@/types/auth'
import { shouldMockAuth } from '@/utils/dev'

// 菜单项配置
interface MenuItem {
  name: string
  path: string
  icon: string
  description: string
  roles?: UserRole[]
  permissions?: string[]
}

const menuItems: MenuItem[] = [
  { 
    name: '控制面板', 
    path: '/dashboard', 
    icon: 'fas fa-home', 
    description: '系统概览和数据统计',
    roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
  },
  { 
    name: '学生管理', 
    path: '/student', 
    icon: 'fas fa-user-graduate', 
    description: '学生信息管理',
    roles: [UserRole.ADMIN, UserRole.TEACHER],
    permissions: ['student:read']
  },

  { 
    name: '用户管理', 
    path: '/user', 
    icon: 'fas fa-users', 
    description: '用户账户管理',
    roles: [UserRole.ADMIN],
    permissions: ['user:read']
  },
  { 
    name: '课程管理', 
    path: '/course', 
    icon: 'fas fa-book', 
    description: '课程信息管理',
    roles: [UserRole.ADMIN, UserRole.TEACHER],
    permissions: ['course:read']
  },
  { 
    name: '报名管理', 
    path: '/application', 
    icon: 'fas fa-file-alt', 
    description: '学生报名申请管理',
    roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
    permissions: ['application:read']
  },
  { 
    name: '数据分析', 
    path: '/analysis', 
    icon: 'fas fa-chart-bar', 
    description: '数据统计与分析',
    roles: [UserRole.ADMIN, UserRole.TEACHER],
    permissions: ['analysis:read']
  },
  { 
    name: '系统日志', 
    path: '/logs', 
    icon: 'fas fa-file-alt', 
    description: '系统操作日志',
    roles: [UserRole.ADMIN],
    permissions: ['logs:read']
  },
  { 
    name: '系统设置', 
    path: '/setting', 
    icon: 'fas fa-cog', 
    description: '系统配置与设置',
    roles: [UserRole.ADMIN],
    permissions: ['setting:read']
  }
]

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const showProfile = ref<boolean>(false)
const showSettings = ref<boolean>(false)
const showChangePassword = ref<boolean>(false)

// 计算属性
const visibleMenuItems = computed<MenuItem[]>(() => {
  return menuItems.filter(item => {
    return authStore.canAccess(item.roles, item.permissions)
  })
})

// 开发模式状态
const isDevMode = computed<boolean>(() => shouldMockAuth())

// 当前页面标题
const currentPageTitle = computed<string>(() => {
  const currentItem = menuItems.find(item => route.path.includes(item.path))
  return currentItem?.name || '学生报名及档案管理系统'
})

// 当前页面描述
const currentPageDescription = computed<string>(() => {
  const currentItem = menuItems.find(item => route.path.includes(item.path))
  return currentItem?.description || '欢迎使用学生报名及档案管理系统'
})

/**
 * 处理登出
 */
const handleLogout = (): void => {
  Modal.confirm({
    title: '确认退出',
    content: '您确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      await authStore.logout()
      router.push('/login')
    }
  })
}

// 组件挂载时初始化认证状态
onMounted(async () => {
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    await authStore.initializeAuth()
  }
})
</script>

<style scoped>
/* 自定义菜单项样式 */
:deep(.ant-menu-item) {
  height: auto !important;
  line-height: normal !important;
  margin: 0 !important;
  padding: 12px 16px !important;
  border-radius: 12px !important;
}

:deep(.ant-menu-item-selected) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%) !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
}

:deep(.ant-menu-item-selected::after) {
  display: none !important;
}

/* 滚动条美化 */
:deep(.ant-layout-sider-children) {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

:deep(.ant-layout-sider-children::-webkit-scrollbar) {
  width: 4px;
}

:deep(.ant-layout-sider-children::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.ant-layout-sider-children::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

:deep(.ant-layout-sider-children::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.5);
}
</style> 