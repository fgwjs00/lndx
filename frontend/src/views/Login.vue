<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
    <div class="max-w-md w-full mx-4">
      <!-- 登录卡片 -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- 头部 -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-graduation-cap text-white text-2xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-800">学籍管理系统</h1>
          <p class="text-gray-500 mt-2">请登录您的账户</p>
        </div>

        <!-- 登录表单 -->
        <a-form
          :model="formData"
          :rules="rules"
          @finish="handleLogin"
          layout="vertical"
          class="space-y-4"
        >
          <!-- 手机号 -->
          <a-form-item name="phone" label="手机号">
            <a-input
              v-model:value="formData.phone"
              size="large"
              placeholder="请输入手机号"
              :prefix="h(PhoneOutlined)"
              :disabled="loading"
              maxlength="11"
            />
          </a-form-item>

          <!-- 密码 -->
          <a-form-item name="password" label="密码">
            <a-input-password
              v-model:value="formData.password"
              size="large"
              placeholder="请输入密码"
              :prefix="h(LockOutlined)"
              :disabled="loading"
            />
          </a-form-item>

          <!-- 验证码 -->
          <!-- <a-form-item name="captcha" label="验证码" v-if="captchaImage">
            <div class="flex gap-2">
              <a-input
                v-model:value="formData.captcha"
                size="large"
                placeholder="请输入验证码"
                :prefix="h(SafetyOutlined)"
                :disabled="loading"
                class="flex-1"
                maxlength="4"
              />
              <div 
                class="w-24 h-10 border border-gray-300 rounded cursor-pointer flex items-center justify-center overflow-hidden"
                @click="refreshCaptcha"
                :title="'点击刷新验证码'"
              >
                <img 
                  v-if="captchaImage" 
                  :src="captchaImage" 
                  alt="验证码"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs text-gray-400">验证码</span>
              </div>
            </div>
          </a-form-item> -->

          <!-- 记住我 -->
          <div class="flex items-center justify-between">
            <a-checkbox v-model:checked="formData.rememberMe" :disabled="loading">
              记住我
            </a-checkbox>
            <a-button type="link" size="small" @click="showForgotPassword = true">
              忘记密码？
            </a-button>
          </div>

          <!-- 登录按钮 -->
          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              :loading="loading"
              class="w-full bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700"
            >
              {{ loading ? '登录中...' : '登录' }}
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 底部链接 -->
        <div class="text-center mt-6">
          <span class="text-gray-500">学生用户？</span>
          <a-button type="link" @click="showRegister = true">
            立即注册
          </a-button>
        </div>
        
        <!-- 提示信息 -->
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-xs text-blue-600 text-center">
            <i class="fas fa-info-circle mr-1"></i>
            教师账户由管理员统一创建，请联系管理员获取登录信息
          </p>
        </div>

        <!-- 开发模式提示 -->
        <div v-if="shouldSkipCaptcha()" class="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p class="text-xs text-green-700 text-center font-medium mb-2">
            <i class="fas fa-code mr-1"></i>
            开发模式已启用
          </p>
          <div class="text-xs text-green-600 space-y-1">
            <p><strong>测试账号：</strong></p>
            <p>管理员: 13800138000 / 123456</p>
            <p>教师: 13800138001 / 123456</p>
            <p>学生: 13800138002 / 123456</p>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="text-center mt-8 text-gray-400 text-sm">
        <p>© 2025 学生报名及档案管理系统</p>
        <p>版本 v1.0.0</p>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <a-modal
      v-model:open="showRegister"
      title="学生注册"
      :footer="null"
      width="1000px"
      :maskClosable="false"
      :centered="true"
      :bodyStyle="{ padding: '0', maxHeight: '80vh', overflow: 'auto' }"
      class="register-modal"
    >
      <RegisterForm @success="handleRegisterSuccess" @cancel="showRegister = false" />
    </a-modal>

    <!-- 忘记密码弹窗 -->
    <a-modal
      v-model:open="showForgotPassword"
      title="找回密码"
      :footer="null"
      width="1000px"
      :maskClosable="false"
      :centered="true"
      :bodyStyle="{ padding: '0', maxHeight: '80vh', overflow: 'auto' }"
      class="forgot-password-modal"
    >
      <ForgotPasswordForm @success="handleForgotPasswordSuccess" @cancel="showForgotPassword = false" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页面组件
 * @component Login
 * @description 用户登录页面，支持手机号登录、学生注册和忘记密码功能
 */
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PhoneOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/store/auth'
import { AuthService } from '@/api/auth'
import { validatePhone } from '@/utils/auth'
import { shouldSkipCaptcha, shouldMockAuth, showDevModeInfo } from '@/utils/dev'
import RegisterForm from '@/components/RegisterForm.vue'
import ForgotPasswordForm from '@/components/ForgotPasswordForm.vue'
import type { LoginRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref<boolean>(false)
const captchaImage = ref<string>('')
const captchaId = ref<string>('')
const showRegister = ref<boolean>(false)
const showForgotPassword = ref<boolean>(false)

// 表单数据
const formData = reactive<LoginRequest>({
  phone: '',
  password: '',
  captcha: '',
  rememberMe: false
})

// 表单验证规则
const rules = computed(() => {
  const baseRules: any = {
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
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少6位', trigger: 'blur' }
    ]
  }

  // 只在非开发模式下添加验证码验证
  if (!shouldSkipCaptcha()) {
    baseRules.captcha = [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { len: 4, message: '验证码长度为4位', trigger: 'blur' }
    ]
  }

  return baseRules
})

/**
 * 获取验证码
 */
const getCaptcha = async (): Promise<void> => {
  try {
    const response = await AuthService.getCaptcha()
    if (response.code === 200) {
      captchaImage.value = response.data.captchaImage
      captchaId.value = response.data.captchaId
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}

/**
 * 刷新验证码
 */
const refreshCaptcha = (): void => {
  formData.captcha = ''
  getCaptcha()
}

/**
 * 处理登录
 */
const handleLogin = async (values: LoginRequest): Promise<void> => {
  try {
    loading.value = true

    let loginData: LoginRequest

    // 开发模式下跳过验证码
    if (shouldSkipCaptcha()) {
      loginData = {
        phone: values.phone,
        password: values.password
      }
    } else {
      // 生产模式添加验证码ID
      loginData = {
        ...values,
        captchaId: captchaId.value
      }
    }

    const success = await authStore.login(loginData)
    
    if (success) {
      // 登录成功，跳转到首页
      const redirect = router.currentRoute.value.query.redirect as string
      await router.push(redirect || '/')
    } else {
      // 登录失败，刷新验证码（非开发模式）
      if (!shouldSkipCaptcha()) {
        refreshCaptcha()
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    if (!shouldSkipCaptcha()) {
      refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}

/**
 * 处理注册成功
 */
const handleRegisterSuccess = (): void => {
  showRegister.value = false
  message.success('注册成功，请登录')
}

/**
 * 处理忘记密码成功
 */
const handleForgotPasswordSuccess = (): void => {
  showForgotPassword.value = false
  message.success('密码重置短信已发送，请查收')
}

// 组件挂载时获取验证码
onMounted(() => {
  // 显示开发模式信息
  showDevModeInfo()
  
  // 只在非开发模式下获取验证码
  if (!shouldSkipCaptcha()) {
    getCaptcha()
  }
})
</script>

<style scoped>
/* 渐变背景动画 */
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-gradient-to-br {
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

/* 登录卡片阴影效果 */
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* 输入框聚焦效果 */
:deep(.ant-input-affix-wrapper:focus),
:deep(.ant-input-affix-wrapper-focused) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 按钮悬停效果 */
:deep(.ant-btn-primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 验证码图片悬停效果 */
.cursor-pointer:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

/* 弹窗样式优化 */
:deep(.register-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

:deep(.register-modal .ant-modal-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
  padding: 20px 24px;
}

:deep(.register-modal .ant-modal-title) {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

:deep(.register-modal .ant-modal-close) {
  color: white;
  top: 16px;
  right: 16px;
}

:deep(.register-modal .ant-modal-close:hover) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.forgot-password-modal .ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

:deep(.forgot-password-modal .ant-modal-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
  padding: 20px 24px;
}

:deep(.forgot-password-modal .ant-modal-title) {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

:deep(.forgot-password-modal .ant-modal-close) {
  color: white;
  top: 16px;
  right: 16px;
}

:deep(.forgot-password-modal .ant-modal-close:hover) {
  color: rgba(255, 255, 255, 0.8);
}

/* 响应式弹窗设计 */
@media (max-width: 768px) {
  :deep(.register-modal) {
    width: 95vw !important;
    max-width: 95vw !important;
  }
  
  :deep(.forgot-password-modal) {
    width: 95vw !important;
    max-width: 95vw !important;
  }
}
</style> 