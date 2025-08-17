<template>
    <div class="role-form space-y-6">
      <!-- 基本信息 -->
      <div>
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-info-circle mr-2 text-purple-500"></i>
          基本信息
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">角色名称 *</label>
            <a-input 
              v-model:value="formData.name" 
              placeholder="请输入角色名称"
              :maxlength="50"
              show-count
              class="w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">角色标识 *</label>
            <a-input 
              v-model:value="formData.key" 
              placeholder="请输入角色标识，如：custom_role"
              :maxlength="50"
              :disabled="!!role"
              class="w-full"
            />
            <div class="text-xs text-gray-500 mt-1">
              角色标识创建后不可修改，建议使用英文和下划线
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">角色图标</label>
            <a-input 
              v-model:value="formData.icon" 
              placeholder="请输入Font Awesome图标类名，如：fas fa-user"
              class="w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">角色状态</label>
            <a-switch 
              v-model:checked="formData.active"
              checked-children="启用" 
              un-checked-children="禁用"
            />
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">角色描述</label>
            <a-textarea 
              v-model:value="formData.description" 
              placeholder="请输入角色描述"
              :rows="3"
              :maxlength="200"
              show-count
              class="w-full"
            />
          </div>
        </div>
      </div>
  
      <!-- 权限分配 -->
      <div>
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-key mr-2 text-blue-500"></i>
          权限分配
        </h4>
        
        <!-- 权限操作栏 -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <a-checkbox 
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              >
                全选/取消全选
              </a-checkbox>
              <span class="text-sm text-gray-600">
                已选择 {{ selectedPermissions.length }} / {{ allPermissions.length }} 项权限
              </span>
            </div>
            <div class="flex items-center gap-2">
              <a-button size="small" @click="expandAll">
                <i class="fas fa-expand-arrows-alt mr-1"></i>
                展开全部
              </a-button>
              <a-button size="small" @click="collapseAll">
                <i class="fas fa-compress-arrows-alt mr-1"></i>
                收起全部
              </a-button>
            </div>
          </div>
        </div>
  
        <!-- 权限分组 -->
        <div class="space-y-4">
          <div 
            v-for="(perms, resource) in groupedPermissions" 
            :key="resource"
            class="border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- 资源模块头部 -->
            <div 
              class="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
              @click="toggleGroup(resource)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i 
                    class="fas fa-chevron-right transition-transform duration-200 mr-2"
                    :class="{ 'rotate-90': expandedGroups[resource] }"
                  ></i>
                  <i :class="getResourceIcon(resource)" class="mr-2 text-gray-600"></i>
                  <span class="font-medium text-gray-800">{{ getResourceName(resource) }}</span>
                </div>
                <div class="flex items-center gap-3">
                                  <a-checkbox
                  :checked="isGroupSelected(resource)"
                  :indeterminate="isGroupIndeterminate(resource)"
                  @change="(e: any) => handleGroupSelect(resource, e.target.checked)"
                  @click.stop
                >
                    <span class="text-sm text-gray-600">
                      {{ getGroupSelectedCount(resource) }} / {{ perms.length }}
                    </span>
                  </a-checkbox>
                </div>
              </div>
            </div>
  
                      <!-- 权限列表 -->
          <div v-show="expandedGroups[resource]" class="p-6 bg-white">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="permission in perms" 
                :key="permission"
                class="relative group"
              >
                                  <div 
                    class="flex items-start p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    :class="{
                      'border-blue-400 bg-blue-50': selectedPermissions.includes(permission),
                      'bg-gray-50': !selectedPermissions.includes(permission)
                    }"
                  >
                    <a-checkbox
                      :value="permission"
                      :checked="selectedPermissions.includes(permission)"
                      @change="(e: any) => handlePermissionChange(permission, e.target.checked)"
                      class="mr-6 mt-1"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <span class="font-semibold text-gray-800">
                          {{ getPermissionDisplayName(permission) }}
                        </span>
                      <a-tag 
                        :color="getPermissionColor(permission)" 
                        size="small"
                        class="ml-2"
                      >
                        {{ getPermissionLevel(permission) }}
                      </a-tag>
                    </div>
                    <div class="text-xs text-gray-500 font-mono">
                      {{ permission }}
                    </div>
                    <div class="text-xs text-gray-600 mt-1">
                      {{ getPermissionDescription(permission) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
  
              <!-- 选中权限预览 -->
      <div v-if="selectedPermissions.length > 0" class="mt-6">
        <div class="flex items-center justify-between mb-4">
                     <h5 class="text-lg font-semibold text-gray-800 flex items-center">
             <i class="fas fa-eye mr-2 text-green-500"></i>
             选中权限预览
             <a-tag color="cyan" class="ml-3">{{ selectedPermissions.length }} 项</a-tag>
           </h5>
          <a-button 
            size="small" 
            type="text" 
            @click="selectedPermissions = []"
            class="text-red-500 hover:text-red-600"
          >
            <i class="fas fa-trash mr-1"></i>
            清空全部
          </a-button>
        </div>
        
        <!-- 按分组显示选中的权限 -->
        <div class="space-y-4">
          <div 
            v-for="(perms, resource) in selectedGroupedPermissions" 
            :key="resource"
            class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
          >
                         <div class="flex items-center mb-3">
               <i :class="getResourceIcon(resource)" class="mr-2 text-blue-600"></i>
               <span class="font-semibold text-blue-800">{{ getResourceName(resource) }}</span>
               <a-tag color="blue" size="small" class="ml-2">{{ perms.length }} 项</a-tag>
             </div>
            <div class="flex flex-wrap gap-2">
              <a-tag 
                v-for="permission in perms" 
                :key="permission"
                :color="getPermissionColor(permission)"
                closable
                @close="removePermission(permission)"
                class="mb-1 cursor-pointer hover:scale-105 transition-transform"
              >
                <span class="font-medium">{{ getPermissionLevel(permission) }}</span>
                <span class="text-xs opacity-75 ml-1">({{ permission.split(':')[1] }})</span>
              </a-tag>
            </div>
          </div>
        </div>

        <!-- 权限统计信息 -->
        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>权限覆盖度：{{ Math.round((selectedPermissions.length / allPermissions.length) * 100) }}%</span>
            <span>涉及模块：{{ Object.keys(selectedGroupedPermissions).length }} 个</span>
          </div>
        </div>
      </div>
      </div>
  
      <!-- 操作按钮 -->
      <div class="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <a-button 
          size="large" 
          @click="$emit('cancel')"
        >
          <i class="fas fa-times mr-2"></i>
          取消
        </a-button>
        <a-button 
          type="primary" 
          size="large" 
          @click="handleSubmit"
          :loading="submitting"
        >
          <i class="fas fa-save mr-2"></i>
          {{ role ? '更新角色' : '创建角色' }}
        </a-button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  /**
   * 角色表单组件
   * @component RoleForm
   * @description 用于创建和编辑角色，包含权限分配功能
   */
  import { reactive, ref, computed, watch } from 'vue'
  import { message } from 'ant-design-vue'
  
  // 角色接口定义
  interface Role {
    id: string
    name: string
    key: string
    description: string
    icon?: string
    permissions: string[]
    status?: 'active' | 'inactive'
    isSystem?: boolean
  }
  
  interface Props {
    role?: Role | null
    permissions: string[]
  }
  
  const props = withDefaults(defineProps<Props>(), {
    role: null
  })
  
  const emit = defineEmits<{
    success: []
    cancel: []
  }>()
  
  // 响应式数据
  const submitting = ref<boolean>(false)
  const selectedPermissions = ref<string[]>([])
  const expandedGroups = ref<Record<string, boolean>>({})
  
  const formData = reactive({
    name: '',
    key: '',
    description: '',
    icon: 'fas fa-user',
    active: true
  })
  
  // 计算属性
  const allPermissions = computed(() => props.permissions)
  
  const groupedPermissions = computed(() => {
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
  
  const isAllSelected = computed(() => 
    selectedPermissions.value.length === allPermissions.value.length && allPermissions.value.length > 0
  )
  
  const isIndeterminate = computed(() => 
  selectedPermissions.value.length > 0 && selectedPermissions.value.length < allPermissions.value.length
)

const selectedGroupedPermissions = computed(() => {
  const groups: Record<string, string[]> = {}
  selectedPermissions.value.forEach(permission => {
    const [resource] = permission.split(':')
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(permission)
  })
  return groups
})
  
  // 方法
  const handleSubmit = async (): Promise<void> => {
    // 表单验证
    if (!formData.name.trim()) {
      message.error('请输入角色名称')
      return
    }
    if (!formData.key.trim()) {
      message.error('请输入角色标识')
      return
    }
    if (selectedPermissions.value.length === 0) {
      message.error('请至少选择一项权限')
      return
    }
  
    submitting.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      message.success(props.role ? '角色更新成功' : '角色创建成功')
      emit('success')
    } catch (error) {
      message.error('操作失败，请重试')
    } finally {
      submitting.value = false
    }
  }
  
  const handleSelectAll = (e: any): void => {
    if (e.target.checked) {
      selectedPermissions.value = [...allPermissions.value]
    } else {
      selectedPermissions.value = []
    }
  }
  
  const handlePermissionChange = (permission: string, checked: boolean): void => {
    if (checked) {
      if (!selectedPermissions.value.includes(permission)) {
        selectedPermissions.value.push(permission)
      }
    } else {
      const index = selectedPermissions.value.indexOf(permission)
      if (index > -1) {
        selectedPermissions.value.splice(index, 1)
      }
    }
  }
  
  const toggleGroup = (resource: string): void => {
    expandedGroups.value[resource] = !expandedGroups.value[resource]
  }
  
  const expandAll = (): void => {
    Object.keys(groupedPermissions.value).forEach(resource => {
      expandedGroups.value[resource] = true
    })
  }
  
  const collapseAll = (): void => {
    Object.keys(groupedPermissions.value).forEach(resource => {
      expandedGroups.value[resource] = false
    })
  }
  
  const isGroupSelected = (resource: string): boolean => {
    const resourcePerms = groupedPermissions.value[resource] || []
    return resourcePerms.length > 0 && resourcePerms.every(perm => selectedPermissions.value.includes(perm))
  }
  
  const isGroupIndeterminate = (resource: string): boolean => {
    const resourcePerms = groupedPermissions.value[resource] || []
    const selectedCount = resourcePerms.filter(perm => selectedPermissions.value.includes(perm)).length
    return selectedCount > 0 && selectedCount < resourcePerms.length
  }
  
  const getGroupSelectedCount = (resource: string): number => {
    const resourcePerms = groupedPermissions.value[resource] || []
    return resourcePerms.filter(perm => selectedPermissions.value.includes(perm)).length
  }
  
  const handleGroupSelect = (resource: string, checked: boolean): void => {
    const resourcePerms = groupedPermissions.value[resource] || []
    if (checked) {
      resourcePerms.forEach(perm => {
        if (!selectedPermissions.value.includes(perm)) {
          selectedPermissions.value.push(perm)
        }
      })
    } else {
      selectedPermissions.value = selectedPermissions.value.filter(perm => !resourcePerms.includes(perm))
    }
  }
  
  const removePermission = (permission: string): void => {
    const index = selectedPermissions.value.indexOf(permission)
    if (index > -1) {
      selectedPermissions.value.splice(index, 1)
    }
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
      profile: '个人资料',
      school: '学校管理'
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
      profile: 'fas fa-user',
      school: 'fas fa-school'
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
  
  const getPermissionDisplayName = (permission: string): string => {
    const [resource, action] = permission.split(':')
    const resourceName = getResourceName(resource)
    const actionMap: Record<string, string> = {
      read: '查看',
      create: '创建',
      update: '编辑',
      delete: '删除',
      approve: '审批',
      manage: '管理',
      '*': '全部权限'
    }
    const actionName = actionMap[action] || action
    return `${resourceName}:${actionName}`
  }
  
  const getPermissionColor = (permission: string): string => {
    const [, action] = permission.split(':')
    const colorMap: Record<string, string> = {
      read: 'green',
      create: 'blue',
      update: 'orange',
      delete: 'red',
      approve: 'purple',
      manage: 'cyan',
      '*': 'gold'
    }
    return colorMap[action] || 'default'
  }
  
  const getPermissionLevel = (permission: string): string => {
  const [, action] = permission.split(':')
  const levelMap: Record<string, string> = {
    read: '读取',
    create: '创建',
    update: '编辑',
    delete: '删除',
    approve: '审批',
    manage: '管理',
    '*': '完全'
  }
  return levelMap[action] || action
}

const getPermissionDescription = (permission: string): string => {
  const [resource, action] = permission.split(':')
  const resourceName = getResourceName(resource)
  
  const descriptionMap: Record<string, Record<string, string>> = {
    system: {
      read: '查看系统配置和状态信息',
      create: '创建系统配置和管理设置',
      update: '修改系统配置和参数',
      delete: '删除系统数据和配置',
      '*': '系统完全管理权限'
    },
    user: {
      read: '查看用户基本信息和列表',
      create: '创建新用户账号',
      update: '修改用户信息和状态',
      delete: '删除用户账号',
      '*': '用户完全管理权限'
    },
    student: {
      read: '查看学生档案和信息',
      create: '添加新学生档案',
      update: '修改学生信息',
      delete: '删除学生档案',
      '*': '学生完全管理权限'
    },
    teacher: {
      read: '查看教师信息',
      create: '添加新教师',
      update: '修改教师信息',
      delete: '删除教师账号',
      '*': '教师完全管理权限'
    },
    course: {
      read: '查看课程信息和安排',
      create: '创建新课程',
      update: '修改课程信息和安排',
      delete: '删除课程',
      '*': '课程完全管理权限'
    },
    application: {
      read: '查看报名申请',
      create: '提交报名申请',
      update: '修改报名信息',
      delete: '删除报名记录',
      approve: '审批报名申请',
      '*': '报名完全管理权限'
    },
    analysis: {
      read: '查看统计分析报表',
      '*': '数据分析完全权限'
    },
    setting: {
      read: '查看系统设置',
      update: '修改系统设置',
      '*': '设置完全管理权限'
    },
    logs: {
      read: '查看系统日志',
      '*': '日志完全管理权限'
    },
    attendance: {
      read: '查看签到记录',
      manage: '管理学员签到',
      '*': '签到完全管理权限'
    },
    profile: {
      read: '查看个人资料',
      update: '修改个人资料',
      '*': '个人资料完全权限'
    },
    school: {
      read: '查看学校信息',
      create: '创建学校',
      update: '修改学校信息',
      delete: '删除学校',
      '*': '学校完全管理权限'
    }
  }
  
  return descriptionMap[resource]?.[action] || `${resourceName}的${action}权限`
}
  
  // 监听props变化
  watch(() => props.role, (newRole) => {
    if (newRole) {
      formData.name = newRole.name
      formData.key = newRole.key
      formData.description = newRole.description
      formData.icon = newRole.icon || 'fas fa-user'
      formData.active = newRole.status === 'active'
      selectedPermissions.value = [...newRole.permissions]
    } else {
      formData.name = ''
      formData.key = ''
      formData.description = ''
      formData.icon = 'fas fa-user'
      formData.active = true
      selectedPermissions.value = []
    }
  }, { immediate: true })
  
  // 初始化展开状态
  watch(() => props.permissions, () => {
    Object.keys(groupedPermissions.value).forEach(resource => {
      expandedGroups.value[resource] = true
    })
  }, { immediate: true })
  </script>
  
  <style scoped>
  .role-form {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  :deep(.ant-checkbox-group) {
    width: 100%;
  }
  </style>