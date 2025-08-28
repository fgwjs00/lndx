<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- 头部 -->
      <div class="text-center">
        <div class="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <i class="fas fa-lock text-yellow-600 text-xl"></i>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          强制修改密码
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          检测到您正在使用默认密码，为了账户安全，请立即修改密码
        </p>
      </div>

      <!-- 修改密码表单 -->
      <div class="bg-white py-8 px-6 shadow rounded-lg">
        <a-form
          :model="formData"
          :rules="rules"
          @finish="handleSubmit"
          layout="vertical"
          autocomplete="off"
        >
          <a-form-item
            label="当前密码"
            name="oldPassword"
            :validate-status="errors.oldPassword ? 'error' : ''"
            :help="errors.oldPassword"
          >
            <a-input-password
              v-model:value="formData.oldPassword"
              placeholder="请输入当前密码"
              size="large"
              @blur="validateField('oldPassword')"
            />
          </a-form-item>

          <a-form-item
            label="新密码"
            name="newPassword"
            :validate-status="errors.newPassword ? 'error' : ''"
            :help="errors.newPassword"
          >
            <a-input-password
              v-model:value="formData.newPassword"
              placeholder="请输入新密码（至少6位）"
              size="large"
              @blur="validateField('newPassword')"
            />
          </a-form-item>

          <a-form-item
            label="确认新密码"
            name="confirmPassword"
            :validate-status="errors.confirmPassword ? 'error' : ''"
            :help="errors.confirmPassword"
          >
            <a-input-password
              v-model:value="formData.confirmPassword"
              placeholder="请再次输入新密码"
              size="large"
              @blur="validateField('confirmPassword')"
            />
          </a-form-item>

          <div class="mt-8">
            <a-button
              type="primary"
              html-type="submit"
              :loading="loading"
              size="large"
              class="w-full"
            >
              修改密码
            </a-button>
          </div>
        </a-form>
      </div>

      <!-- 安全提示 -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-amber-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-amber-800">
              密码安全建议
            </h3>
            <div class="mt-2 text-sm text-amber-700">
              <ul class="list-disc list-inside space-y-1">
                <li>密码长度至少6位字符</li>
                <li>建议包含数字、字母和特殊字符</li>
                <li>不要使用容易猜测的密码</li>
                <li>定期更换密码以确保账户安全</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="text-center text-sm text-gray-500">
        <p>
          修改密码后，您将能够正常访问系统功能
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 强制修改密码页面
 * @component ChangePasswordPage
 * @description 用户首次使用默认密码登录时的强制修改密码页面
 */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'
import type { ChangePasswordRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单数据
const formData = reactive<ChangePasswordRequest>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单状态
const loading = ref<boolean>(false)
const errors = reactive<Record<string, string>>({})

// 表单验证规则
const rules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value && value !== formData.newPassword) {
          return Promise.reject(new Error('两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}

/**
 * 验证单个字段
 */
const validateField = (field: keyof typeof formData): void => {
  errors[field] = ''
  
  if (field === 'oldPassword' && !formData.oldPassword) {
    errors[field] = '请输入当前密码'
  } else if (field === 'newPassword') {
    if (!formData.newPassword) {
      errors[field] = '请输入新密码'
    } else if (formData.newPassword.length < 6) {
      errors[field] = '密码长度至少6位'
    }
  } else if (field === 'confirmPassword') {
    if (!formData.confirmPassword) {
      errors[field] = '请确认新密码'
    } else if (formData.confirmPassword !== formData.newPassword) {
      errors[field] = '两次输入的密码不一致'
    }
  }
}

/**
 * 提交表单
 */
const handleSubmit = async (): Promise<void> => {
  try {
    // 先验证所有字段
    validateField('oldPassword')
    validateField('newPassword')
    validateField('confirmPassword')
    
    // 检查是否有错误
    const hasErrors = Object.values(errors).some(error => error)
    if (hasErrors) {
      message.error('请修正表单错误后重试')
      return
    }
    
    loading.value = true
    
    console.log('🔑 开始修改密码...')
    const success = await authStore.changePassword(formData)
    
    if (success) {
      console.log('✅ 密码修改成功')
      message.success('密码修改成功，即将跳转...')
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  } catch (error: any) {
    console.error('❌ 密码修改失败:', error)
    message.error(error.message || '密码修改失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 自定义样式可以在这里添加 */
.ant-form-item-label > label {
  font-weight: 500;
}

.ant-input-password,
.ant-input {
  border-radius: 8px;
}

.ant-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  height: 44px;
}

.ant-btn-primary:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}
</style>
