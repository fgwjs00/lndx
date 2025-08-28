<template>
  <div class="user-form-container">
    <!-- 表单头部 -->
    <div class="form-header mb-6">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <i :class="isEdit ? 'fas fa-user-edit text-blue-600' : 'fas fa-user-plus text-blue-600'"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-800">
            {{ isEdit ? '编辑用户信息' : '创建新用户' }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ isEdit ? '修改用户的基本信息和权限设置' : '填写用户的基本信息，创建新账户' }}
          </p>
        </div>
      </div>
    </div>

    <a-form
      :model="formData"
      :rules="rules"
      @finish="handleSubmit"
      layout="vertical"
      class="space-y-5"
    >
      <!-- 基本信息区域 -->
      <div class="bg-gray-50 rounded-lg p-4 space-y-4">
        <h4 class="text-md font-medium text-gray-700 flex items-center">
          <i class="fas fa-user mr-2 text-gray-500"></i>
          基本信息
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item label="真实姓名" name="realName" class="mb-0">
            <a-input 
              v-model:value="formData.realName" 
              placeholder="请输入真实姓名"
              size="large"
              prefix="👤"
            />
          </a-form-item>

          <a-form-item label="手机号" name="phone" class="mb-0">
            <a-input 
              v-model:value="formData.phone" 
              placeholder="请输入11位手机号"
              size="large"
              prefix="📱"
            />
          </a-form-item>
        </div>

        <a-form-item label="邮箱（选填）" name="email" class="mb-0">
          <a-input 
            v-model:value="formData.email" 
            placeholder="请输入邮箱地址（可选）"
            size="large"
            prefix="✉️"
          />
        </a-form-item>
      </div>

      <!-- 权限设置区域 -->
      <div class="bg-gray-50 rounded-lg p-4 space-y-4">
        <h4 class="text-md font-medium text-gray-700 flex items-center">
          <i class="fas fa-key mr-2 text-gray-500"></i>
          权限设置
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item label="用户角色" name="role" class="mb-0">
            <a-select 
              v-model:value="formData.role" 
              placeholder="请选择用户角色"
              size="large"
              @change="handleRoleChange"
            >
              <a-select-option value="admin">
                <div class="flex items-center">
                  <i class="fas fa-user-shield mr-2 text-red-500"></i>
                  管理员
                </div>
              </a-select-option>
              <a-select-option value="teacher">
                <div class="flex items-center">
                  <i class="fas fa-chalkboard-teacher mr-2 text-blue-500"></i>
                  教师
                </div>
              </a-select-option>
              <a-select-option value="student">
                <div class="flex items-center">
                  <i class="fas fa-user-graduate mr-2 text-green-500"></i>
                  学生
                </div>
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="账户状态" name="status" class="mb-0">
            <a-select 
              v-model:value="formData.status" 
              placeholder="请选择账户状态"
              size="large"
            >
              <a-select-option value="active">
                <div class="flex items-center">
                  <i class="fas fa-check-circle mr-2 text-green-500"></i>
                  正常
                </div>
              </a-select-option>
              <a-select-option value="inactive">
                <div class="flex items-center">
                  <i class="fas fa-ban mr-2 text-red-500"></i>
                  禁用
                </div>
              </a-select-option>
            </a-select>
          </a-form-item>
        </div>
      </div>

      <!-- 安全设置区域 -->
      <div v-if="!isEdit" class="bg-gray-50 rounded-lg p-4 space-y-4">
        <h4 class="text-md font-medium text-gray-700 flex items-center">
          <i class="fas fa-lock mr-2 text-gray-500"></i>
          安全设置
        </h4>
        
        <a-form-item label="初始密码" name="password" class="mb-0">
          <a-input-password 
            v-model:value="formData.password" 
            placeholder="请设置初始密码（至少6位）"
            size="large"
            autocomplete="new-password"
          />
          <div class="text-xs text-gray-500 mt-2">
            💡 用户首次登录时将被要求修改密码
          </div>
        </a-form-item>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <a-button 
          @click="handleCancel" 
          size="large"
          class="min-w-20"
        >
          <i class="fas fa-times mr-2"></i>
          取消
        </a-button>
        <a-button 
          type="primary" 
          html-type="submit" 
          :loading="loading"
          size="large"
          class="min-w-24"
        >
          <i v-if="!loading" :class="isEdit ? 'fas fa-save mr-2' : 'fas fa-plus mr-2'"></i>
          {{ isEdit ? '保存更新' : '创建用户' }}
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户表单组件
 * @component UserForm
 * @description 用于创建和编辑用户的表单组件
 */
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'

// 用户数据类型定义
interface UserFormData {
  realName: string
  phone: string
  email?: string
  role: string
  password?: string
  status: string
}

// 组件属性
interface Props {
  user?: UserFormData | null
  loading?: boolean
  defaultRole?: string
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  loading: false
})

// 组件事件
const emit = defineEmits<{
  submit: [data: UserFormData]
  cancel: []
}>()

// 表单数据
const formData = reactive<UserFormData>({
  realName: '',
  phone: '',
  email: '',
  role: props.defaultRole || 'student',
  password: '',
  status: 'active'
})

// 是否为编辑模式
const isEdit = ref<boolean>(false)

/**
 * 重置表单
 */
const resetForm = (): void => {
  formData.realName = ''
  formData.phone = ''
  formData.email = ''
  formData.role = props.defaultRole || 'student'
  formData.password = ''
  formData.status = 'active'
}

// 表单验证规则
const rules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在2-10个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 监听用户数据变化
watch(() => props.user, (newUser) => {
  if (newUser) {
    isEdit.value = true
    Object.assign(formData, {
      realName: newUser.realName || '',
      phone: newUser.phone || '',
      email: newUser.email || '',
      role: newUser.role || 'student',
      password: '',
      status: newUser.status || 'active'
    })
  } else {
    isEdit.value = false
    resetForm()
  }
}, { immediate: true })

/**
 * 处理角色变化
 */
const handleRoleChange = (role: string): void => {
  // 角色变化处理逻辑（暂时保留，可能有其他用途）
}

/**
 * 处理表单提交
 */
const handleSubmit = (): void => {
  emit('submit', formData)
}

/**
 * 处理取消
 */
const handleCancel = (): void => {
  emit('cancel')
}
</script>

<style scoped>
.user-form-container {
  @apply p-2;
}

.form-header {
  @apply border-b border-gray-100 pb-4;
}

/* 表单区域样式 */
.ant-form {
  @apply max-w-none;
}

.ant-form-item {
  @apply mb-4;
}

/* 响应式网格布局优化 */
@media (max-width: 768px) {
  .user-form-container {
    @apply p-1;
  }
  
  .grid-cols-1.md\:grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* 输入框优化 */
:deep(.ant-input-affix-wrapper) {
  @apply transition-all duration-200;
}

:deep(.ant-input-affix-wrapper:focus-within) {
  @apply shadow-md;
}

/* 选择框优化 */
:deep(.ant-select) {
  @apply w-full;
}

:deep(.ant-select-selector) {
  @apply transition-all duration-200;
}

:deep(.ant-select:hover .ant-select-selector) {
  @apply shadow-sm;
}

/* 按钮优化 */
:deep(.ant-btn) {
  @apply transition-all duration-200;
}

:deep(.ant-btn-primary) {
  @apply shadow-sm hover:shadow-md;
}

/* 表单项标签优化 */
:deep(.ant-form-item-label > label) {
  @apply font-medium text-gray-700;
}

/* 验证错误信息样式 */
:deep(.ant-form-item-explain-error) {
  @apply text-red-500 text-xs mt-1;
}

/* 区域卡片样式 */
.bg-gray-50 {
  @apply border border-gray-100 hover:border-gray-200 transition-colors duration-200;
}
</style> 
