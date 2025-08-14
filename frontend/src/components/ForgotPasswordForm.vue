<template>
  <div class="forgot-password-container">
    <!-- 表单标题 -->
    <div class="form-header">
      <div class="header-icon">
        <i class="fas fa-key"></i>
      </div>
      <h2 class="form-title">找回密码</h2>
      <p class="form-subtitle">通过手机验证码重置您的密码</p>
    </div>

    <a-form
      :model="formData"
      :rules="rules"
      @finish="handleSubmit"
      layout="vertical"
      class="forgot-password-form"
    >
      <!-- 手机验证卡片 -->
      <div class="form-section animate-slide-in">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-mobile-alt"></i>
          </div>
          <h3 class="section-title">手机验证</h3>
        </div>
        
        <!-- 手机号 -->
        <div class="form-item-wrapper">
          <a-form-item name="phone" label="手机号" class="form-item">
            <a-input
              v-model:value="formData.phone"
              size="large"
              placeholder="请输入注册时的手机号"
              :disabled="loading"
              maxlength="11"
              @focus="handleInputFocus"
              class="modern-input"
            >
              <template #prefix>
                <i class="fas fa-mobile-alt input-icon"></i>
              </template>
            </a-input>
            <div class="input-help">
              <i class="fas fa-info-circle"></i>
              我们将向您的手机发送验证码
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
                :disabled="!canSendSms || smsLoading"
                :loading="smsLoading"
                @click="sendSmsCode"
                size="large"
                class="sms-button"
              >
                <i v-if="!smsLoading && smsCountdown === 0" class="fas fa-paper-plane"></i>
                {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
              </a-button>
            </div>
            <div v-if="smsCountdown > 0" class="countdown-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${(60 - smsCountdown) / 60 * 100}%` }"
                ></div>
              </div>
              <span class="countdown-text">{{ smsCountdown }}秒后可重新发送</span>
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
          <h3 class="section-title">新密码设置</h3>
        </div>
        
        <div class="form-grid">
          <!-- 新密码 -->
          <div class="form-item-wrapper">
            <a-form-item name="newPassword" label="新密码" class="form-item">
              <a-input-password
                v-model:value="formData.newPassword"
                size="large"
                placeholder="请输入新密码"
                :disabled="loading"
                autocomplete="new-password"
                @focus="handleInputFocus"
                @input="checkPasswordStrength"
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
                      <i class="fas fa-check"></i> 长度6位以上
                    </span>
                  </div>
                </div>
              </div>
              <div class="input-help">
                <i class="fas fa-shield-alt"></i>
                密码长度6-20位，包含字母和数字
              </div>
            </a-form-item>
          </div>

          <!-- 确认密码 -->
          <div class="form-item-wrapper">
            <a-form-item name="confirmPassword" label="确认密码" class="form-item">
              <a-input-password
                v-model:value="formData.confirmPassword"
                size="large"
                placeholder="请再次输入新密码"
                :disabled="loading"
                autocomplete="new-password"
                @focus="handleInputFocus"
                class="modern-input"
              >
                <template #prefix>
                  <i class="fas fa-lock input-icon"></i>
                </template>
              </a-input-password>
              <div v-if="formData.confirmPassword && formData.newPassword" class="password-match">
                <div v-if="formData.confirmPassword === formData.newPassword" class="match-success">
                  <i class="fas fa-check-circle"></i>
                  密码匹配
                </div>
                <div v-else class="match-error">
                  <i class="fas fa-times-circle"></i>
                  密码不匹配
                </div>
              </div>
            </a-form-item>
          </div>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="form-actions animate-slide-in" style="animation-delay: 0.2s;">
        <a-button 
          @click="handleCancel" 
          :disabled="loading" 
          size="large"
          class="cancel-button"
        >
          <i class="fas fa-times"></i>
          取消
        </a-button>
        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          size="large"
          class="submit-button"
        >
          <i v-if="!loading" class="fas fa-check"></i>
          {{ loading ? '重置中...' : '重置密码' }}
        </a-button>
      </div>
    </a-form>

    <!-- 帮助信息 -->
    <div class="help-section animate-slide-in" style="animation-delay: 0.3s;">
      <div class="help-header">
        <i class="fas fa-info-circle"></i>
        <h4 class="help-title">重置密码说明</h4>
      </div>
      <div class="help-content">
        <div class="help-item">
          <i class="fas fa-check-circle"></i>
          <span>请确保输入的手机号是您注册时使用的手机号</span>
        </div>
        <div class="help-item">
          <i class="fas fa-clock"></i>
          <span>短信验证码有效期5分钟</span>
        </div>
        <div class="help-item">
          <i class="fas fa-key"></i>
          <span>新密码长度为6-20位，必须包含字母和数字</span>
        </div>
        <div class="help-item">
          <i class="fas fa-mobile-alt"></i>
          <span>如果没有收到短信，请检查是否被拦截</span>
        </div>
        <div class="help-item">
          <i class="fas fa-question-circle"></i>
          <span>如果仍有问题，请联系系统管理员</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 忘记密码表单组件
 * @component ForgotPasswordForm
 * @description 用户忘记密码表单，通过验证码直接重置密码
 */
import { ref, reactive, computed, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { AuthService } from '@/api/auth'
import { validatePhone, validatePassword } from '@/utils/auth'
import type { ResetPasswordWithCodeRequest } from '@/types/auth'

// 定义事件
const emit = defineEmits<{
  success: []
  cancel: []
}>()

// 响应式数据
const loading = ref(false)
const smsLoading = ref(false)
const smsCountdown = ref(0)
const smsTimer = ref<NodeJS.Timeout | null>(null)
const passwordStrength = ref<any>(null)

// 表单数据
const formData = reactive<ResetPasswordWithCodeRequest>({
  phone: '',
  smsCode: '',
  newPassword: '',
  confirmPassword: '',
  captcha: '' // 保持接口兼容性，但不在UI中显示
})

// 计算属性
const canSendSms = computed(() => {
  return Boolean(
    formData.phone && 
    validatePhone(formData.phone) && 
    smsCountdown.value === 0
  )
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
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { len: 6, message: '短信验证码长度为6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { 
      validator: (_: any, value: string) => {
        if (value && !validatePassword(value)) {
          return Promise.reject('密码长度6-20位，必须包含字母和数字')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (_: any, value: string) => {
        if (value && value !== formData.newPassword) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
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
 * 检查密码强度
 */
const checkPasswordStrength = (): void => {
  if (!formData.newPassword) {
    passwordStrength.value = null
    return
  }
  
  const result = validatePassword(formData.newPassword)
  passwordStrength.value = {
    ...result,
    hasLetter: /[a-zA-Z]/.test(formData.newPassword),
    hasNumber: /\d/.test(formData.newPassword),
    hasLength: formData.newPassword.length >= 6
  }
}

/**
 * 发送短信验证码
 */
const sendSmsCode = async (): Promise<void> => {
  if (!canSendSms.value) {
    return
  }

  try {
    smsLoading.value = true

    const response = await AuthService.sendSmsCode({
      phone: formData.phone,
      type: 'reset',
      captcha: '' // 不再需要图形验证码
    })

    if (response.code === 200) {
      message.success('短信验证码已发送')
      startSmsCountdown()
    } else {
      message.error(response.message || '发送失败')
    }
  } catch (error: any) {
    console.error('发送短信验证码失败:', error)
    message.error(error.message || '发送失败')
  } finally {
    smsLoading.value = false
  }
}

/**
 * 开始短信倒计时
 */
const startSmsCountdown = (): void => {
  smsCountdown.value = 60
  smsTimer.value = setInterval(() => {
    smsCountdown.value--
    if (smsCountdown.value <= 0) {
      clearInterval(smsTimer.value!)
      smsTimer.value = null
    }
  }, 1000)
}

/**
 * 处理表单提交
 */
const handleSubmit = async (values: ResetPasswordWithCodeRequest): Promise<void> => {
  try {
    loading.value = true

    const response = await AuthService.resetPasswordWithCode(values)
    
    if (response.code === 200) {
      message.success('密码重置成功，请使用新密码登录')
      emit('success')
    } else {
      message.error(response.message || '重置失败')
    }
  } catch (error: any) {
    console.error('重置密码失败:', error)
    message.error(error.message || '重置失败')
  } finally {
    loading.value = false
  }
}

/**
 * 处理取消
 */
const handleCancel = (): void => {
  // 清理倒计时
  if (smsTimer.value) {
    clearInterval(smsTimer.value)
    smsTimer.value = null
  }
  emit('cancel')
}

// 组件卸载时清理倒计时
onUnmounted(() => {
  if (smsTimer.value) {
    clearInterval(smsTimer.value)
  }
})
</script>

<style scoped>
.forgot-password-container {
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

.forgot-password-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0;
  box-shadow: none;
  padding: 32px;
  margin-bottom: 0;
  backdrop-filter: blur(20px);
  border: none;
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

.input-help {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-help i {
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

.countdown-progress {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.countdown-text {
  font-size: 12px;
  color: #6b7280;
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

.password-match {
  margin-top: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.match-success {
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;
}

.match-error {
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
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

.help-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0 0 16px 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  border: none;
  box-shadow: none;
}

.help-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.1);
}

.help-header i {
  font-size: 18px;
  color: #3b82f6;
  margin-right: 8px;
}

.help-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.help-item i {
  font-size: 12px;
  color: #3b82f6;
  min-width: 16px;
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
  .forgot-password-container {
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
  
  .help-section {
    padding: 20px;
  }
}

  /* 滚动条样式 */
.forgot-password-container::-webkit-scrollbar {
  width: 8px;
}

.forgot-password-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.forgot-password-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.forgot-password-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style> 
