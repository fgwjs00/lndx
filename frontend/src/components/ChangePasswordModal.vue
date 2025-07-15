<template>
  <a-modal
    :open="visible"
    title="修改密码"
    :width="600"
    @ok="handleSubmit"
    @cancel="handleCancel"
    @update:open="(value) => emit('update:visible', value)"
    :confirm-loading="loading"
    ok-text="修改密码"
    cancel-text="取消"
  >
    <div class="change-password-modal">
      <div class="mb-6">
        <div class="flex items-center justify-center mb-4">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-key text-blue-500 text-2xl"></i>
          </div>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 text-center">修改登录密码</h3>
        <p class="text-gray-500 text-center mt-2">为了您的账户安全，请设置强密码</p>
      </div>

      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        class="space-y-4"
      >
        <!-- 当前密码 -->
        <a-form-item label="当前密码" name="oldPassword">
          <a-input-password
            v-model:value="formData.oldPassword"
            placeholder="请输入当前密码"
            size="large"
            :disabled="loading"
            autocomplete="current-password"
          >
            <template #prefix>
              <i class="fas fa-lock text-gray-400"></i>
            </template>
          </a-input-password>
        </a-form-item>

        <!-- 新密码 -->
        <a-form-item label="新密码" name="newPassword">
          <a-input-password
            v-model:value="formData.newPassword"
            placeholder="请输入新密码"
            size="large"
            :disabled="loading"
            autocomplete="new-password"
            @input="handlePasswordChange"
          >
            <template #prefix>
              <i class="fas fa-key text-gray-400"></i>
            </template>
          </a-input-password>
          
          <!-- 密码强度指示器 -->
          <div v-if="formData.newPassword" class="mt-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">密码强度：</span>
              <div class="flex space-x-1">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  class="w-6 h-2 rounded-full"
                  :class="getStrengthBarClass(i)"
                ></div>
              </div>
              <span class="text-sm font-medium" :class="getStrengthTextClass()">
                {{ getStrengthText() }}
              </span>
            </div>
            
            <!-- 密码要求提示 -->
            <div class="mt-3 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600 mb-2">密码要求：</p>
              <ul class="text-xs text-gray-500 space-y-1">
                <li class="flex items-center">
                  <i :class="passwordChecks.length ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'" class="w-3 mr-2"></i>
                  至少8个字符
                </li>
                <li class="flex items-center">
                  <i :class="passwordChecks.uppercase ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'" class="w-3 mr-2"></i>
                  包含大写字母
                </li>
                <li class="flex items-center">
                  <i :class="passwordChecks.lowercase ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'" class="w-3 mr-2"></i>
                  包含小写字母
                </li>
                <li class="flex items-center">
                  <i :class="passwordChecks.number ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'" class="w-3 mr-2"></i>
                  包含数字
                </li>
                <li class="flex items-center">
                  <i :class="passwordChecks.special ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'" class="w-3 mr-2"></i>
                  包含特殊字符
                </li>
              </ul>
            </div>
          </div>
        </a-form-item>

        <!-- 确认新密码 -->
        <a-form-item label="确认新密码" name="confirmPassword">
          <a-input-password
            v-model:value="formData.confirmPassword"
            placeholder="请再次输入新密码"
            size="large"
            :disabled="loading"
            autocomplete="new-password"
          >
            <template #prefix>
              <i class="fas fa-shield-alt text-gray-400"></i>
            </template>
          </a-input-password>
        </a-form-item>

        <!-- 安全提示 -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div class="flex items-start">
            <i class="fas fa-info-circle text-blue-500 mt-0.5 mr-3"></i>
            <div>
              <h4 class="text-sm font-medium text-blue-800 mb-1">安全提示</h4>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• 建议使用字母、数字和特殊字符组合</li>
                <li>• 避免使用常见密码或个人信息</li>
                <li>• 定期更新密码以保证账户安全</li>
                <li>• 不要在多个网站使用相同密码</li>
              </ul>
            </div>
          </div>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 修改密码弹窗组件
 * @component ChangePasswordModal
 * @description 用于修改用户登录密码
 */
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'
import type { ChangePasswordRequest } from '@/types/auth'

// 组件属性
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// 组件事件
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  success: []
}>()

const authStore = useAuthStore()
const formRef = ref()
const loading = ref<boolean>(false)

// 表单数据
const formData = reactive<ChangePasswordRequest>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码强度检查
const passwordChecks = reactive({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false
})

// 密码强度级别
const passwordStrength = computed<number>(() => {
  const checks = Object.values(passwordChecks)
  return checks.filter(Boolean).length
})

// 表单验证规则
const formRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少8个字符', trigger: 'blur' },
    { 
      validator: (_rule: any, value: string) => {
        if (value && passwordStrength.value < 3) {
          return Promise.reject('密码强度不够，请设置更强的密码')
        }
        return Promise.resolve()
      }, 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (_rule: any, value: string) => {
        if (value !== formData.newPassword) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      }, 
      trigger: 'blur' 
    }
  ]
}

// 监听弹窗显示状态
watch(() => props.visible, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

/**
 * 重置表单
 */
const resetForm = (): void => {
  formData.oldPassword = ''
  formData.newPassword = ''
  formData.confirmPassword = ''
  
  // 重置密码检查
  Object.keys(passwordChecks).forEach(key => {
    passwordChecks[key as keyof typeof passwordChecks] = false
  })
  
  // 重置表单验证
  formRef.value?.resetFields()
}

/**
 * 处理密码输入变化
 */
const handlePasswordChange = (): void => {
  const password = formData.newPassword
  
  // 检查密码强度
  passwordChecks.length = password.length >= 8
  passwordChecks.uppercase = /[A-Z]/.test(password)
  passwordChecks.lowercase = /[a-z]/.test(password)
  passwordChecks.number = /\d/.test(password)
  passwordChecks.special = /[!@#$%^&*(),.?":{}|<>]/.test(password)
}

/**
 * 获取强度条样式
 */
const getStrengthBarClass = (index: number): string => {
  const strength = passwordStrength.value
  
  if (index <= strength) {
    if (strength <= 2) return 'bg-red-400'
    if (strength <= 3) return 'bg-yellow-400'
    return 'bg-green-400'
  }
  
  return 'bg-gray-200'
}

/**
 * 获取强度文本样式
 */
const getStrengthTextClass = (): string => {
  const strength = passwordStrength.value
  
  if (strength <= 2) return 'text-red-600'
  if (strength <= 3) return 'text-yellow-600'
  return 'text-green-600'
}

/**
 * 获取强度文本
 */
const getStrengthText = (): string => {
  const strength = passwordStrength.value
  
  if (strength <= 2) return '弱'
  if (strength <= 3) return '中'
  return '强'
}

/**
 * 处理提交
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    const changePasswordData: ChangePasswordRequest = {
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    }
    
    const success = await authStore.changePassword(changePasswordData)
    
    if (success) {
      message.success('密码修改成功，请重新登录')
      emit('success')
      emit('update:visible', false)
      
      // 修改密码后，建议用户重新登录
      setTimeout(() => {
        authStore.logout()
      }, 1500)
    }
  } catch (error) {
    console.error('密码修改失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 处理取消
 */
const handleCancel = (): void => {
  emit('update:visible', false)
}
</script>

<style scoped>
.change-password-modal {
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.ant-form-item-label) {
  font-weight: 600;
  color: #374151;
}

:deep(.ant-input-lg) {
  border-radius: 8px;
}

:deep(.ant-btn) {
  border-radius: 8px;
}

:deep(.ant-input-password) {
  border-radius: 8px;
}

/* 密码强度条动画 */
.bg-red-400, .bg-yellow-400, .bg-green-400 {
  transition: all 0.3s ease;
}
</style> 