<template>
  <div class="register-form-container">
    <!-- 表单标题 -->
    <div class="form-header">
      <div class="header-icon">
        <i class="fas fa-user-plus"></i>
      </div>
      <h2 class="form-title">学生注册</h2>
      <p class="form-subtitle">请填写完整信息完成注册</p>
    </div>

    <a-form
      :model="formData"
      :rules="rules"
      @finish="handleRegister"
      layout="vertical"
      class="register-form"
    >
      <!-- 基本信息卡片 -->
      <div class="form-section animate-slide-in">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-id-card"></i>
          </div>
          <h3 class="section-title">基本信息</h3>
        </div>
        
        <div class="form-grid">
          <!-- 手机号 -->
          <div class="form-item-wrapper">
            <a-form-item name="phone" label="手机号" class="form-item">
              <a-input
                v-model:value="formData.phone"
                size="large"
                placeholder="请输入手机号"
                :disabled="loading"
                maxlength="11"
                @blur="checkPhone"
                @focus="handleInputFocus"
                class="modern-input"
              >
                <template #prefix>
                  <i class="fas fa-mobile-alt input-icon"></i>
                </template>
              </a-input>
              <div v-if="phoneChecking" class="status-message checking">
                <div class="loading-spinner"></div>
                检查手机号可用性...
              </div>
              <div v-else-if="phoneAvailable === false" class="status-message error">
                <i class="fas fa-times-circle"></i>
                手机号已被注册
              </div>
              <div v-else-if="phoneAvailable === true" class="status-message success">
                <i class="fas fa-check-circle"></i>
                手机号可用
              </div>
            </a-form-item>
          </div>

          <!-- 真实姓名 -->
          <div class="form-item-wrapper">
            <a-form-item name="realName" label="真实姓名" class="form-item">
              <a-input
                v-model:value="formData.realName"
                size="large"
                placeholder="请输入真实姓名"
                :disabled="loading"
                @focus="handleInputFocus"
                class="modern-input"
              >
                <template #prefix>
                  <i class="fas fa-user input-icon"></i>
                </template>
              </a-input>
            </a-form-item>
          </div>
        </div>

        <!-- 邮箱 -->
        <div class="form-item-wrapper">
          <a-form-item name="email" label="邮箱" class="form-item">
            <a-input
              v-model:value="formData.email"
              size="large"
              placeholder="请输入邮箱"
              type="email"
              :disabled="loading"
              @blur="checkEmail"
              @focus="handleInputFocus"
              class="modern-input"
            >
              <template #prefix>
                <i class="fas fa-envelope input-icon"></i>
              </template>
            </a-input>
            <div v-if="emailChecking" class="status-message checking">
              <div class="loading-spinner"></div>
              检查邮箱可用性...
            </div>
            <div v-else-if="emailAvailable === false" class="status-message error">
              <i class="fas fa-times-circle"></i>
              邮箱已被占用
            </div>
            <div v-else-if="emailAvailable === true" class="status-message success">
              <i class="fas fa-check-circle"></i>
              邮箱可用
            </div>
          </a-form-item>
        </div>
      </div>

      <!-- 密码设置卡片 -->
      <div class="form-section animate-slide-in" style="animation-delay: 0.1s;">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-lock"></i>
          </div>
          <h3 class="section-title">密码设置</h3>
        </div>
        
        <div class="form-grid">
          <!-- 密码 -->
          <div class="form-item-wrapper">
            <a-form-item name="password" label="密码" class="form-item">
              <a-input-password
                v-model:value="formData.password"
                size="large"
                placeholder="请输入密码"
                :disabled="loading"
                @input="checkPasswordStrength"
                @focus="handleInputFocus"
                class="modern-input"
              >
                <template #prefix>
                  <i class="fas fa-key input-icon"></i>
                </template>
              </a-input-password>
              <div v-if="passwordStrength" class="password-strength">
                <div class="strength-bar">
                  <div 
                    class="strength-fill"
                    :class="passwordStrengthClass"
                    :style="{ width: passwordStrengthWidth }"
                  ></div>
                </div>
                <div class="strength-info">
                  <span class="strength-text" :class="passwordStrengthTextClass">
                    {{ passwordStrength.message }}
                  </span>
                  <div class="strength-tips">
                    <span class="tip-item" :class="{ active: passwordStrength.hasLetter }">
                      <i class="fas fa-check"></i> 包含字母
                    </span>
                    <span class="tip-item" :class="{ active: passwordStrength.hasNumber }">
                      <i class="fas fa-check"></i> 包含数字
                    </span>
                    <span class="tip-item" :class="{ active: passwordStrength.hasLength }">
                      <i class="fas fa-check"></i> 长度8位以上
                    </span>
                  </div>
                </div>
              </div>
            </a-form-item>
          </div>

          <!-- 确认密码 -->
          <div class="form-item-wrapper">
            <a-form-item name="confirmPassword" label="确认密码" class="form-item">
              <a-input-password
                v-model:value="formData.confirmPassword"
                size="large"
                placeholder="请再次输入密码"
                :disabled="loading"
                @focus="handleInputFocus"
                class="modern-input"
              >
                <template #prefix>
                  <i class="fas fa-lock input-icon"></i>
                </template>
              </a-input-password>
            </a-form-item>
          </div>
        </div>
      </div>

      <!-- 验证信息卡片 -->
      <div class="form-section animate-slide-in" style="animation-delay: 0.2s;">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h3 class="section-title">验证信息</h3>
        </div>
        
        <div class="form-grid">
          <!-- 验证码 -->
          <div class="form-item-wrapper">
            <a-form-item name="captcha" label="图形验证码" class="form-item">
              <div class="captcha-container">
                <a-input
                  v-model:value="formData.captcha"
                  size="large"
                  placeholder="请输入验证码"
                  :disabled="loading"
                  maxlength="4"
                  @focus="handleInputFocus"
                  class="modern-input captcha-input"
                >
                  <template #prefix>
                    <i class="fas fa-image input-icon"></i>
                  </template>
                </a-input>
                <div 
                  class="captcha-image"
                  @click="refreshCaptcha"
                  :title="'点击刷新验证码'"
                >
                  <img 
                    v-if="captchaImage" 
                    :src="captchaImage" 
                    alt="验证码"
                  />
                  <div v-else class="captcha-placeholder">
                    <i class="fas fa-sync-alt"></i>
                    <span>点击获取</span>
                  </div>
                </div>
              </div>
            </a-form-item>
          </div>

          <!-- 短信验证码 -->
          <div class="form-item-wrapper">
            <a-form-item name="smsCode" label="短信验证码" class="form-item">
              <div class="sms-container">
                <a-input
                  v-model:value="formData.smsCode"
                  size="large"
                  placeholder="请输入短信验证码"
                  :disabled="loading"
                  maxlength="6"
                  @focus="handleInputFocus"
                  class="modern-input sms-input"
                >
                  <template #prefix>
                    <i class="fas fa-sms input-icon"></i>
                  </template>
                </a-input>
                <a-button
                  size="large"
                  :disabled="smsCodeDisabled"
                  :loading="smsCodeSending"
                  @click="sendSmsCode"
                  class="sms-button"
                >
                  <i v-if="!smsCodeSending && smsCodeCountdown === 0" class="fas fa-paper-plane"></i>
                  {{ smsCodeButtonText }}
                </a-button>
              </div>
            </a-form-item>
          </div>
        </div>
      </div>

      <!-- 用户协议 -->
      <div class="form-section agreement-section animate-slide-in" style="animation-delay: 0.3s;">
        <a-form-item name="agreement" class="agreement-item">
          <a-checkbox v-model:checked="formData.agreement" :disabled="loading" class="agreement-checkbox">
            <span class="agreement-text">
              我已阅读并同意
              <a-button type="link" size="small" @click="showAgreement = true" class="agreement-link">
                《用户协议》
              </a-button>
              和
              <a-button type="link" size="small" @click="showPrivacy = true" class="agreement-link">
                《隐私政策》
              </a-button>
            </span>
          </a-checkbox>
        </a-form-item>
      </div>

      <!-- 按钮组 -->
      <div class="form-actions animate-slide-in" style="animation-delay: 0.4s;">
        <a-button 
          @click="handleCancel" 
          :disabled="loading" 
          size="large"
          class="cancel-button"
        >
          <i class="fas fa-times mr-2"></i>
          取消
        </a-button>
        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          :disabled="!canSubmit"
          size="large"
          class="submit-button"
        >
          <i v-if="!loading" class="fas fa-user-plus mr-2"></i>
          {{ loading ? '注册中...' : '立即注册' }}
        </a-button>
      </div>
    </a-form>

    <!-- 用户协议弹窗 -->
    <a-modal
      v-model:open="showAgreement"
      title="用户协议"
      :footer="null"
      width="600px"
      class="agreement-modal"
    >
      <div class="agreement-content">
        <h3>1. 服务条款</h3>
        <p>欢迎使用学生报名及档案管理系统。在使用本系统之前，请仔细阅读本协议。</p>
        
        <h3>2. 用户责任</h3>
        <p>用户应对其账户信息的真实性、准确性和完整性负责。</p>
        
        <h3>3. 隐私保护</h3>
        <p>我们承诺保护用户的个人信息安全，不会未经授权向第三方披露。</p>
        
        <h3>4. 服务限制</h3>
        <p>用户不得利用本系统进行任何违法或不当行为。</p>
        
        <h3>5. 免责声明</h3>
        <p>本系统按"现状"提供服务，不承担任何明示或暗示的保证责任。</p>
      </div>
    </a-modal>

    <!-- 隐私政策弹窗 -->
    <a-modal
      v-model:open="showPrivacy"
      title="隐私政策"
      :footer="null"
      width="600px"
      class="agreement-modal"
    >
      <div class="agreement-content">
        <h3>1. 信息收集</h3>
        <p>我们收集您提供的个人信息，包括但不限于姓名、邮箱、手机号等。</p>
        
        <h3>2. 信息使用</h3>
        <p>我们使用您的信息来提供服务、改进系统功能和保障系统安全。</p>
        
        <h3>3. 信息共享</h3>
        <p>除法律要求外，我们不会与第三方共享您的个人信息。</p>
        
        <h3>4. 信息安全</h3>
        <p>我们采取适当的技术和管理措施来保护您的个人信息安全。</p>
        
        <h3>5. 用户权利</h3>
        <p>您有权访问、更正、删除您的个人信息。</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 注册表单组件
 * @component RegisterForm
 * @description 学生注册表单，包含手机号验证和短信验证码功能
 */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'
import { AuthService } from '@/api/auth'
import { validatePhone, validateEmail, validateRealName, validatePassword, validateSmsCode } from '@/utils/auth'
import type { RegisterRequest } from '@/types/auth'

// 定义事件
const emit = defineEmits<{
  success: []
  cancel: []
}>()

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const captchaImage = ref('')
const captchaId = ref('')
const showAgreement = ref(false)
const showPrivacy = ref(false)
const phoneChecking = ref(false)
const phoneAvailable = ref<boolean | null>(null)
const emailChecking = ref(false)
const emailAvailable = ref<boolean | null>(null)
const passwordStrength = ref<any>(null)
const smsCodeSending = ref(false)
const smsCodeCountdown = ref(0)
const smsCodeTimer = ref<NodeJS.Timeout | null>(null)

// 表单数据
const formData = reactive<RegisterRequest & { agreement: boolean }>({
  phone: '',
  email: '',
  realName: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  smsCode: '',
  agreement: false
})

// 计算属性
const canSubmit = computed(() => {
  return Boolean(
    formData.phone &&
    formData.realName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.captcha &&
    formData.smsCode &&
    formData.agreement &&
    phoneAvailable.value === true &&
    emailAvailable.value === true &&
    passwordStrength.value?.isValid
  )
})

const smsCodeDisabled = computed(() => {
  return Boolean(
    !formData.phone ||
    !validatePhone(formData.phone) ||
    !formData.captcha ||
    formData.captcha.length !== 4 ||
    smsCodeCountdown.value > 0 ||
    smsCodeSending.value
  )
})

const smsCodeButtonText = computed(() => {
  if (smsCodeSending.value) return '发送中'
  if (smsCodeCountdown.value > 0) return `${smsCodeCountdown.value}s`
  return '获取验证码'
})

const passwordStrengthClass = computed(() => {
  if (!passwordStrength.value) return ''
  
  switch (passwordStrength.value.strength) {
    case 'weak': return 'strength-weak'
    case 'medium': return 'strength-medium'
    case 'strong': return 'strength-strong'
    default: return ''
  }
})

const passwordStrengthWidth = computed(() => {
  if (!passwordStrength.value) return '0%'
  
  switch (passwordStrength.value.strength) {
    case 'weak': return '33%'
    case 'medium': return '66%'
    case 'strong': return '100%'
    default: return '0%'
  }
})

const passwordStrengthTextClass = computed(() => {
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
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (_: any, value: string) => {
        if (value && value !== formData.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码长度为4位', trigger: 'blur' }
  ],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { 
      validator: (_: any, value: string) => {
        if (value && !validateSmsCode(value)) {
          return Promise.reject('请输入6位数字验证码')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  agreement: [
    { 
      validator: (_: any, value: boolean) => {
        if (!value) {
          return Promise.reject('请阅读并同意用户协议')
        }
        return Promise.resolve()
      },
      trigger: 'change'
    }
  ]
}

/**
 * 处理输入框聚焦
 */
const handleInputFocus = (e: Event): void => {
  const target = e.target as HTMLInputElement
  target.parentElement?.classList.add('focused')
}

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
 * 检查密码强度
 */
const checkPasswordStrength = (): void => {
  if (!formData.password) {
    passwordStrength.value = null
    return
  }
  
  const result = validatePassword(formData.password)
  passwordStrength.value = {
    ...result,
    hasLetter: /[a-zA-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasLength: formData.password.length >= 8
  }
}

/**
 * 发送短信验证码
 */
const sendSmsCode = async (): Promise<void> => {
  try {
    smsCodeSending.value = true
    
    const response = await AuthService.sendSmsCode({
      phone: formData.phone,
      type: 'register',
      captcha: formData.captcha
    })
    
    if (response.code === 200) {
      message.success('短信验证码已发送')
      startCountdown()
    } else {
      message.error(response.message || '发送失败')
    }
  } catch (error: any) {
    console.error('发送短信验证码失败:', error)
    message.error(error.message || '发送失败')
  } finally {
    smsCodeSending.value = false
  }
}

/**
 * 开始倒计时
 */
const startCountdown = (): void => {
  smsCodeCountdown.value = 60
  smsCodeTimer.value = setInterval(() => {
    smsCodeCountdown.value--
    if (smsCodeCountdown.value <= 0) {
      clearInterval(smsCodeTimer.value!)
      smsCodeTimer.value = null
    }
  }, 1000)
}

/**
 * 处理注册
 */
const handleRegister = async (values: any): Promise<void> => {
  try {
    loading.value = true

    // 添加验证码ID
    const registerData = {
      ...values,
      captchaId: captchaId.value
    }

    const success = await authStore.register(registerData)
    
    if (success) {
      emit('success')
    } else {
      refreshCaptcha()
    }
  } catch (error) {
    console.error('注册失败:', error)
    refreshCaptcha()
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

// 组件挂载时获取验证码
onMounted(() => {
  getCaptcha()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (smsCodeTimer.value) {
    clearInterval(smsCodeTimer.value)
  }
})
</script>

<style scoped>
.register-form-container {
  max-width: 100%;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: auto;
  display: flex;
  flex-direction: column;
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px;
  color: white;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.header-icon i {
  font-size: 28px;
  color: white;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.register-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0 0 20px 20px;
  box-shadow: none;
  padding: 32px;
  backdrop-filter: blur(20px);
  border: none;
  margin: 0;
}

.form-section {
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  position: relative;
  overflow: hidden;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.1);
}

.section-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.section-icon i {
  font-size: 16px;
  color: white;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-item-wrapper {
  position: relative;
}

.form-item {
  margin-bottom: 0;
}

.modern-input {
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modern-input:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.modern-input:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.modern-input.focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-icon {
  color: #6b7280;
  transition: color 0.3s ease;
}

.modern-input:focus-within .input-icon {
  color: #3b82f6;
}

.status-message {
  font-size: 12px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.status-message.checking {
  color: #3b82f6;
}

.status-message.error {
  color: #ef4444;
}

.status-message.success {
  color: #10b981;
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.strength-weak {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.strength-medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.strength-strong {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.strength-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
}

.strength-tips {
  display: flex;
  gap: 8px;
}

.tip-item {
  font-size: 10px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 2px;
  transition: color 0.3s ease;
}

.tip-item.active {
  color: #10b981;
}

.tip-item i {
  font-size: 8px;
}

.captcha-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 100px;
  height: 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: white;
}

.captcha-image:hover {
  border-color: #3b82f6;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #9ca3af;
}

.captcha-placeholder i {
  font-size: 12px;
}

.captcha-placeholder span {
  font-size: 10px;
}

.sms-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.sms-input {
  flex: 1;
}

.sms-button {
  width: 120px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sms-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.sms-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.agreement-section {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #f59e0b;
}

.agreement-section::before {
  background: linear-gradient(90deg, #f59e0b, #eab308);
}

.agreement-item {
  margin-bottom: 0;
}

.agreement-checkbox {
  font-size: 14px;
}

.agreement-text {
  color: #92400e;
  font-weight: 500;
}

.agreement-link {
  color: #3b82f6;
  font-weight: 600;
  padding: 0 4px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.agreement-link:hover {
  color: #2563eb;
  text-decoration: underline;
  transform: scale(1.05);
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.cancel-button {
  flex: 1;
  height: 50px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  color: #6b7280;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cancel-button:hover {
  border-color: #9ca3af;
  color: #374151;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.submit-button {
  flex: 2;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
}

.agreement-modal .agreement-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.agreement-content h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.agreement-content p {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #4b5563;
  font-size: 14px;
}

/* 动画效果 */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.6s ease-out forwards;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-form-container {
    padding: 16px;
    min-height: auto;
  }
  
  .form-section {
    padding: 20px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .submit-button {
    flex: 1;
  }
  
  .sms-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .sms-button {
    width: 100%;
  }
  
  .captcha-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .captcha-image {
    width: 100%;
    height: 50px;
  }
}

/* 滚动条样式 */
.register-form-container::-webkit-scrollbar {
  width: 8px;
}

.register-form-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.register-form-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.register-form-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style> 