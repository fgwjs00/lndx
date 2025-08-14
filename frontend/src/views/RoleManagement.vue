<template>
    <div class="role-management">
      <!-- 页面头部 -->
      <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">角色权限管理</h1>
            <p class="text-purple-100">管理系统角色和权限分配，控制用户访问范围</p>
          </div>
          <div class="text-6xl opacity-20">
            🔐
          </div>
        </div>
      </div>
  
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-user-tag text-purple-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ roles.length }}</h3>
              <p class="text-gray-500 text-sm">系统角色</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-key text-blue-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ totalPermissions }}</h3>
              <p class="text-gray-500 text-sm">系统权限</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-users text-green-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ activeRoles }}</h3>
              <p class="text-gray-500 text-sm">活跃角色</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-shield-alt text-orange-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-800">{{ customRoles }}</h3>
              <p class="text-gray-500 text-sm">自定义角色</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 主要内容区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 角色列表 -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl shadow-lg">
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold text-gray-800">
                  <i class="fas fa-list mr-2 text-purple-500"></i>
                  角色列表
                </h3>
                <button
                  @click="showRoleForm = true"
                  class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <i class="fas fa-plus mr-2"></i>
                  添加角色
                </button>
              </div>
            </div>
            
            <div class="p-6">
              <div class="space-y-4">
                <div
                  v-for="role in roles"
                  :key="role.id"
                  class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  :class="{ 'border-purple-300 bg-purple-50': selectedRole?.id === role.id }"
                  @click="selectRole(role)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <div 
                        class="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                        :class="getRoleColorClass(role.key)"
                      >
                        <i :class="role.icon" class="text-white"></i>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-800">{{ role.name }}</h4>
                        <p class="text-sm text-gray-500">{{ role.description }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <span 
                        class="px-3 py-1 rounded-full text-xs font-medium"
                        :class="role.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      >
                        {{ role.status === 'active' ? '启用' : '禁用' }}
                      </span>
                      <span class="text-sm text-gray-500">{{ role.permissions.length }} 项权限</span>
                      <div class="flex gap-2">
                        <button
                          @click.stop="editRole(role)"
                          class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="编辑角色"
                        >
                          <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          v-if="!role.isSystem"
                          @click.stop="deleteRole(role)"
                          class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="删除角色"
                        >
                          <i class="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 权限详情 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-lg">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-xl font-semibold text-gray-800">
                <i class="fas fa-key mr-2 text-blue-500"></i>
                {{ selectedRole ? `${selectedRole.name} 权限` : '选择角色查看权限' }}
              </h3>
            </div>
            
            <div class="p-6">
              <div v-if="selectedRole" class="space-y-4">
                <div
                  v-for="(perms, resource) in groupedPermissions"
                  :key="resource"
                  class="border border-gray-200 rounded-lg p-4"
                >
                  <h5 class="font-medium text-gray-800 mb-3 flex items-center">
                    <i :class="getResourceIcon(resource)" class="mr-2 text-gray-600"></i>
                    {{ getResourceName(resource) }}
                  </h5>
                  <div class="space-y-2">
                    <div
                      v-for="permission in perms"
                      :key="permission"
                      class="flex items-center justify-between text-sm"
                    >
                      <span class="text-gray-600">{{ getPermissionName(permission) }}</span>
                      <span 
                        class="px-2 py-1 rounded-full text-xs font-medium"
                        :class="hasPermission(permission) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                      >
                        {{ hasPermission(permission) ? '已授予' : '未授予' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="text-center py-12 text-gray-500">
                <i class="fas fa-hand-pointer text-4xl mb-4"></i>
                <p>请选择一个角色查看其权限详情</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 添加/编辑角色弹窗 -->
      <a-modal
        v-model:open="showRoleForm"
        :title="editingRole ? '编辑角色' : '添加角色'"
        :width="800"
        :footer="null"
        :destroy-on-close="true"
      >
        <RoleForm 
          :role="editingRole"
          :permissions="allPermissions"
          @success="handleRoleSuccess" 
          @cancel="showRoleForm = false"
        />
      </a-modal>
    </div>
  </template>
  
  <script setup lang="ts">
  /**
   * 角色权限管理页面
   * @component RoleManagement
   * @description 管理系统角色和权限分配   */
  import { ref, computed, onMounted } from 'vue'
  import { message } from 'ant-design-vue'
  import RoleForm from '@/components/RoleForm.vue'
  import type { UserRole } from '@/types/auth'
  
  // 角色接口定义
  interface Role {
    id: string
    key: UserRole | string
    name: string
    description: string
    icon: string
    permissions: string[]
    status: 'active' | 'inactive'
    isSystem: boolean
    createdAt: string
    updatedAt: string
  }
  
  // 响应式数据
  const selectedRole = ref<Role | null>(null)
  const showRoleForm = ref<boolean>(false)
  const editingRole = ref<Role | null>(null)
  
  // 模拟角色数据 - 四级权限系统
const roles = ref<Role[]>([
  {
    id: '1',
    key: 'super_admin',
    name: '超级管理员',
    description: '公司最高权限，拥有系统所有权限，可管理所有功能模块',
    icon: 'fas fa-crown',
    permissions: [
      'system:*', 'user:*', 'student:*', 'teacher:*', 'course:*', 
      'application:*', 'analysis:*', 'setting:*', 'logs:*', 'school:*'
    ],
    status: 'active',
    isSystem: true,
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    key: 'school_admin',
    name: '学校管理员',
    description: '学校级别管理权限，可配置本校用户、课程等信息',
    icon: 'fas fa-school',
    permissions: [
      'user:read', 'user:create', 'user:update',
      'student:*', 'teacher:*', 'course:*',
      'application:*', 'analysis:read', 'setting:read', 'setting:update'
    ],
    status: 'active',
    isSystem: true,
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: '3',
    key: 'teacher',
    name: '教师',
    description: '教学权限，可管理课程、学生和报名信息',
    icon: 'fas fa-chalkboard-teacher',
    permissions: [
      'student:read', 'student:create', 'student:update',
      'course:read', 'course:create', 'course:update',
      'application:read', 'application:approve',
      'analysis:read', 'attendance:manage'
    ],
    status: 'active',
    isSystem: true,
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  },
  {
    id: '4',
    key: 'student',
    name: '学生',
    description: '学生权限，可查看课程信息、提交报名申请',
    icon: 'fas fa-user-graduate',
    permissions: [
      'profile:read', 'profile:update',
      'course:read', 'application:create', 'application:read'
    ],
    status: 'active',
    isSystem: true,
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00'
  }
])
  
  // 所有可用权限
  const allPermissions = ref<string[]>([
    'system:read', 'system:create', 'system:update', 'system:delete', 'system:*',
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:*',
    'student:read', 'student:create', 'student:update', 'student:delete', 'student:*',
    'teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete', 'teacher:*',
    'course:read', 'course:create', 'course:update', 'course:delete', 'course:*',
    'application:read', 'application:create', 'application:update', 'application:delete', 'application:approve', 'application:*',
    'analysis:read', 'analysis:*',
    'setting:read', 'setting:update', 'setting:*',
    'logs:read', 'logs:*',
    'attendance:read', 'attendance:manage', 'attendance:*',
    'profile:read', 'profile:update', 'profile:*'
  ])
  
  // 计算属性
  const totalPermissions = computed(() => allPermissions.value.length)
  const activeRoles = computed(() => roles.value.filter(role => role.status === 'active').length)
  const customRoles = computed(() => roles.value.filter(role => !role.isSystem).length)
  
  const groupedPermissions = computed(() => {
    if (!selectedRole.value) return {}
    
    const groups: Record<string, string[]> = {}
    allPermissions.value.forEach(permission => {
      const [resource] = permission.split(':')
      if (!groups[resource]) {
        groups[resource] = []
      }
      groups[resource].push(permission)
    })
    
    return groups
  })
  
  // 方法
  const selectRole = (role: Role): void => {
    selectedRole.value = role
  }
  
  const editRole = (role: Role): void => {
    editingRole.value = { ...role }
    showRoleForm.value = true
  }
  
  const deleteRole = (role: Role): void => {
    if (confirm(`确定要删除角色 ${role.name} 吗？此操作不可恢复。`)) {
      const index = roles.value.findIndex(r => r.id === role.id)
      if (index !== -1) {
        roles.value.splice(index, 1)
        if (selectedRole.value?.id === role.id) {
          selectedRole.value = null
        }
        message.success(`已删除角色 ${role.name}`)
      }
    }
  }
  
  const handleRoleSuccess = (): void => {
    showRoleForm.value = false
    editingRole.value = null
    message.success('角色操作成功')
  }
  
  const getRoleColorClass = (roleKey: string): string => {
  const colorMap: Record<string, string> = {
    super_admin: 'bg-red-500',
    school_admin: 'bg-orange-500',
    teacher: 'bg-blue-500',
    student: 'bg-green-500'
  }
  return colorMap[roleKey] || 'bg-purple-500'
}
  
  const getResourceName = (resource: string): string => {
    const nameMap: Record<string, string> = {
      system: '系统管理',
      user: '用户管理',
      student: '学生管理',
      teacher: '教师管理',
      course: '课程管理',
      application: '报名管理',
      analysis: '数据分析',
      setting: '系统设置',
      logs: '日志管理',
      attendance: '签到管理',
      profile: '个人资料'
    }
    return nameMap[resource] || resource
  }
  
  const getResourceIcon = (resource: string): string => {
    const iconMap: Record<string, string> = {
      system: 'fas fa-cogs',
      user: 'fas fa-users',
      student: 'fas fa-user-graduate',
      teacher: 'fas fa-chalkboard-teacher',
      course: 'fas fa-book',
      application: 'fas fa-file-alt',
      analysis: 'fas fa-chart-bar',
      setting: 'fas fa-cog',
      logs: 'fas fa-list-alt',
      attendance: 'fas fa-check-circle',
      profile: 'fas fa-user'
    }
    return iconMap[resource] || 'fas fa-key'
  }
  
  const getPermissionName = (permission: string): string => {
    const [, action] = permission.split(':')
    const actionMap: Record<string, string> = {
      read: '查看',
      create: '创建',
      update: '编辑',
      delete: '删除',
      approve: '审批',
      manage: '管理',
      '*': '全部权限'
    }
    return actionMap[action] || action
  }
  
  const hasPermission = (permission: string): boolean => {
    if (!selectedRole.value) return false
    return selectedRole.value.permissions.includes(permission) || 
           selectedRole.value.permissions.includes(permission.split(':')[0] + ':*')
  }
  
  // 生命周期
  onMounted(() => {
    // 默认选择第一个角色
    if (roles.value.length > 0) {
      selectedRole.value = roles.value[0]
    }
  })
  </script>
  
  <style scoped>
  .role-management {
    padding: 0;
  }
  </style>
