<template>
  <div class="create-teacher-form">
    <a-form
      :model="formData"
      :rules="rules"
      @finish="handleSubmit"
      layout="vertical"
      class="space-y-4"
    >
      <!-- 手机号 -->
      <a-form-item name="phone" label="手机号">
        <a-input
          v-model:value="formData.phone"
          size="large"
          placeholder="请输入教师手机号"
          :disabled="loading"
          maxlength="11"
          @blur="checkPhone"
        />
        <div v-if="phoneChecking" class="text-xs text-blue-500 mt-1">
          <i class="fas fa-spinner fa-spin mr-1"></i>
          检查手机号可用性...
        </div>
        <div v-else-if="phoneAvailable === false" class="text-xs text-red-500 mt-1">
          <i class="fas fa-times mr-1"></i>
          手机号已被注册
        </div>
        <div v-else-if="phoneAvailable === true" class="text-xs text-green-500 mt-1">
          <i class="fas fa-check mr-1"></i>
          手机号可用
        </div>
      </a-form-item>

      <!-- 真实姓名 -->
      <a-form-item name="realName" label="真实姓名">
        <a-input
          v-model:value="formData.realName"
          size="large"
          placeholder="请输入教师真实姓名"
          :disabled="loading"
        />
      </a-form-item>

      <!-- 邮箱 -->
      <a-form-item name="email" label="邮箱">
        <a-input
          v-model:value="formData.email"
          size="large"
          placeholder="请输入教师邮箱"
          type="email"
          :disabled="loading"
          @blur="checkEmail"
        />
        <div v-if="emailChecking" class="text-xs text-blue-500 mt-1">
          <i class="fas fa-spinner fa-spin mr-1"></i>
          检查邮箱可用性...
        </div>
        <div v-else-if="emailAvailable === false" class="text-xs text-red-500 mt-1">
          <i class="fas fa-times mr-1"></i>
          邮箱已被占用
        </div>
        <div v-else-if="emailAvailable === true" class="text-xs text-green-500 mt-1">
          <i class="fas fa-check mr-1"></i>
          邮箱可用
        </div>
      </a-form-item>

      <!-- 所属部门 -->
      <a-form-item name="department" label="所属部门">
        <a-input
          v-model:value="formData.department"
          size="large"
          placeholder="请输入所属部门（可选）"
          :disabled="loading"
        />
      </a-form-item>

      <!-- 初始密码 -->
      <a-form-item name="initialPassword" label="初始密码">
        <div class="flex gap-2">
          <a-input-password
            v-model:value="formData.initialPassword"
            size="large"
            placeholder="请输入初始密码"
            :disabled="loading"
            class="flex-1"
          />
          <a-button
            size="large"
            @click="generatePassword"
            :disabled="loading"
            class="w-24"
          >
            随机生成
          </a-button>
        </div>
        <div v-if="passwordStrength" class="mt-2">
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full transition-all duration-300"
                :class="passwordStrengthClass"
                :style="{ width: passwordStrengthWidth }"
              ></div>
            </div>
            <span class="text-xs" :class="passwordStrengthTextClass">
              {{ passwordStrength.message }}
            </span>
          </div>
        </div>
      </a-form-item>

      <!-- 按钮组 -->
      <div class="flex gap-3">
        <a-button @click="handleCancel" :disabled="loading" class="flex-1">
          取消
        </a-button>
        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          :disabled="!canSubmit"
          class="flex-1"
        >
          {{ loading ? '创建中...' : '创建教师账户' }}
        </a-button>
      </div>
    </a-form>

    <!-- 说明信息 -->
    <div class="mt-6 p-4 bg-green-50 rounded-lg">
      <h4 class="text-sm font-medium text-green-800 mb-2">
        <i class="fas fa-info-circle mr-1"></i>
        创建教师账户说明
      </h4>
      <ul class="text-xs text-green-600 space-y-1">
        <li>• 教师账户创建后，系统会自动分配教师权限</li>
        <li>• 初始密码将通过短信发送给教师</li>
        <li>• 教师首次登录时需要修改密码</li>
        <li>• 可以在教师管理页面查看和管理所有教师</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 创建教师表单组件
 * @component CreateTeacherForm
 * @description 管理员创建教师账户的表单
 */
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { AuthService } from '@/api/auth'
import { validatePhone, validateEmail, validateRealName, validatePassword, generateRandomPassword } from '@/utils/auth'
import type { CreateTeacherRequest } from '@/types/auth'

// 定义事件
const emit = defineEmits<{
  success: [teacher: any]
  cancel: []
}>()

// 响应式数据
const loading = ref<boolean>(false)
const phoneChecking = ref<boolean>(false)
const phoneAvailable = ref<boolean | null>(null)
const emailChecking = ref<boolean>(false)
const emailAvailable = ref<boolean | null>(null)
const passwordStrength = ref<any>(null)

// 表单数据
const formData = reactive<CreateTeacherRequest>({
  phone: '',
  email: '',
  realName: '',
  department: '',
  initialPassword: ''
})

// 计算属性
const canSubmit = computed<boolean>(() => {
  return (
    formData.phone &&
    formData.realName &&
    formData.email &&
    formData.initialPassword &&
    phoneAvailable.value === true &&
    emailAvailable.value === true &&
    passwordStrength.value?.isValid
  )
})

const passwordStrengthClass = computed<string>(() => {
  if (!passwordStrength.value) return ''
  
  switch (passwordStrength.value.strength) {
    case 'weak': return 'bg-red-500'
    case 'medium': return 'bg-yellow-500'
    case 'strong': return 'bg-green-500'
    default: return 'bg-gray-300'
  }
})

const passwordStrengthWidth = computed<string>(() => {
  if (!passwordStrength.value) return '0%'
  
  switch (passwordStrength.value.strength) {
    case 'weak': return '33%'
    case 'medium': return '66%'
    case 'strong': return '100%'
    default: return '0%'
  }
})

const passwordStrengthTextClass = computed<string>(() => {
  if (!passwordStrength.value) return ''
  
  switch (passwordStrength.value.strength) {
    case 'weak': return 'text-red-500'
    case 'medium': return 'text-yellow-500'
    case 'strong': return 'text-green-500'
    default: return 'text-gray-400'
  }
})

// 表单验证规则
const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { 
      validator: (_: any, value: string) => {
        if (value && !validatePhone(value)) {
          return Promise.reject('请输入正确的手机号格式')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { 
      validator: (_: any, value: string) => {
        if (value && !validateRealName(value)) {
          return Promise.reject('请输入正确的姓名格式')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    { 
      validator: (_: any, value: string) => {
        if (value && !validateEmail(value)) {
          return Promise.reject('邮箱格式不正确')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  department: [
    { max: 50, message: '部门名称不能超过50个字符', trigger: 'blur' }
  ],
  initialPassword: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' }
  ]
}

/**
 * 检查手机号可用性
 */
const checkPhone = async (): Promise<void> => {
  if (!formData.phone || !validatePhone(formData.phone)) {
    phoneAvailable.value = null
    return
  }

  try {
    phoneChecking.value = true
    const response = await AuthService.checkPhone(formData.phone)
    phoneAvailable.value = response.data.available
  } catch (error) {
    console.error('检查手机号失败:', error)
    phoneAvailable.value = null
  } finally {
    phoneChecking.value = false
  }
}

/**
 * 检查邮箱可用性
 */
const checkEmail = async (): Promise<void> => {
  if (!formData.email || !validateEmail(formData.email)) {
    emailAvailable.value = null
    return
  }

  try {
    emailChecking.value = true
    const response = await AuthService.checkEmail(formData.email)
    emailAvailable.value = response.data.available
  } catch (error) {
    console.error('检查邮箱失败:', error)
    emailAvailable.value = null
  } finally {
    emailChecking.value = false
  }
}

/**
 * 生成随机密码
 */
const generatePassword = (): void => {
  formData.initialPassword = generateRandomPassword(12)
  checkPasswordStrength()
}

/**
 * 检查密码强度
 */
const checkPasswordStrength = (): void => {
  if (!formData.initialPassword) {
    passwordStrength.value = null
    return
  }
  
  passwordStrength.value = validatePassword(formData.initialPassword)
}

/**
 * 处理表单提交
 */
const handleSubmit = async (values: CreateTeacherRequest): Promise<void> => {
  try {
    loading.value = true

    const response = await AuthService.createTeacher(values)
    
    if (response.code === 200) {
      message.success('教师账户创建成功')
      emit('success', response.data)
    } else {
      message.error(response.message || '创建失败')
    }
  } catch (error: any) {
    console.error('创建教师账户失败:', error)
    message.error(error.message || '创建失败')
  } finally {
    loading.value = false
  }
}

/**
 * 处理取消
 */
const handleCancel = (): void => {
  emit('cancel')
}

// 监听密码变化
watch(() => formData.initialPassword, () => {
  checkPasswordStrength()
})
</script>

<style scoped>
.create-teacher-form {
  max-width: 500px;
}

h4 {
  margin: 0;
}

ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

li {
  margin: 0;
}
</style> 