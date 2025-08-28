<template>
  <a-modal
    :open="props.open"
    title="账户设置"
    :width="800"
    @ok="handleSave"
    @cancel="handleCancel"
    @update:open="(value) => emit('update:open', value)"
    :confirm-loading="loading"
    ok-text="保存设置"
    cancel-text="取消"
  >
    <div class="account-settings-modal">
      <a-tabs v-model:active-key="activeTab" type="card">
        <!-- 基本设置 -->
        <a-tab-pane key="basic" tab="基本设置">
          <div class="p-4">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">基本信息设置</h4>
            
            <div class="space-y-6">
              <!-- 语言设置 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">系统语言</h5>
                  <p class="text-sm text-gray-500">设置系统界面显示语言</p>
                </div>
                <a-select
                  v-model:value="settings.language"
                  style="width: 150px"
                  @change="handleLanguageChange"
                >
                  <a-select-option value="zh-CN">简体中文</a-select-option>
                  <a-select-option value="en-US">English</a-select-option>
                </a-select>
              </div>

              <!-- 时区设置 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">时区设置</h5>
                  <p class="text-sm text-gray-500">设置系统时区</p>
                </div>
                <a-select
                  v-model:value="settings.timezone"
                  style="width: 200px"
                  @change="handleTimezoneChange"
                >
                  <a-select-option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</a-select-option>
                  <a-select-option value="UTC">UTC (UTC+0)</a-select-option>
                </a-select>
              </div>

              <!-- 主题设置 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">主题模式</h5>
                  <p class="text-sm text-gray-500">设置界面主题</p>
                </div>
                <a-radio-group
                  v-model:value="settings.theme"
                  @change="handleThemeChange"
                >
                  <a-radio value="light">浅色</a-radio>
                  <a-radio value="dark">深色</a-radio>
                  <a-radio value="auto">自动</a-radio>
                </a-radio-group>
              </div>

              <!-- 自动登录 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">自动登录</h5>
                  <p class="text-sm text-gray-500">启用后下次访问将自动登录</p>
                </div>
                <a-switch
                  v-model:checked="settings.autoLogin"
                  @change="handleAutoLoginChange"
                />
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 通知设置 -->
        <a-tab-pane key="notifications" tab="通知设置">
          <div class="p-4">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">通知偏好设置</h4>
            
            <div class="space-y-6">
              <!-- 系统通知 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">系统通知</h5>
                  <p class="text-sm text-gray-500">接收系统重要通知</p>
                </div>
                <a-switch
                  v-model:checked="settings.notifications.system"
                  @change="handleNotificationChange"
                />
              </div>

              <!-- 邮件通知 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">邮件通知</h5>
                  <p class="text-sm text-gray-500">通过邮件接收通知</p>
                </div>
                <a-switch
                  v-model:checked="settings.notifications.email"
                  @change="handleNotificationChange"
                />
              </div>

              <!-- 短信通知 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">短信通知</h5>
                  <p class="text-sm text-gray-500">通过短信接收重要通知</p>
                </div>
                <a-switch
                  v-model:checked="settings.notifications.sms"
                  @change="handleNotificationChange"
                />
              </div>

              <!-- 桌面通知 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">桌面通知</h5>
                  <p class="text-sm text-gray-500">显示桌面弹窗通知</p>
                </div>
                <a-switch
                  v-model:checked="settings.notifications.desktop"
                  @change="handleNotificationChange"
                />
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 隐私设置 -->
        <a-tab-pane key="privacy" tab="隐私设置">
          <div class="p-4">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">隐私与安全</h4>
            
            <div class="space-y-6">
              <!-- 个人信息可见性 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">个人信息可见性</h5>
                  <p class="text-sm text-gray-500">控制其他用户查看您的个人信息范围</p>
                </div>
                <a-select
                  v-model:value="settings.privacy.profileVisibility"
                  style="width: 150px"
                  @change="handlePrivacyChange"
                >
                  <a-select-option value="public">公开</a-select-option>
                  <a-select-option value="internal">内部可见</a-select-option>
                  <a-select-option value="private">仅自己</a-select-option>
                </a-select>
              </div>

              <!-- 活动记录 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">活动记录</h5>
                  <p class="text-sm text-gray-500">记录登录和操作活动</p>
                </div>
                <a-switch
                  v-model:checked="settings.privacy.activityLog"
                  @change="handlePrivacyChange"
                />
              </div>

              <!-- 数据统计 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">数据统计</h5>
                  <p class="text-sm text-gray-500">参与系统数据统计分析</p>
                </div>
                <a-switch
                  v-model:checked="settings.privacy.analytics"
                  @change="handlePrivacyChange"
                />
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 高级设置 -->
        <a-tab-pane key="advanced" tab="高级设置">
          <div class="p-4">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">高级功能</h4>
            
            <div class="space-y-6">
              <!-- 开发者模式 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">开发者模式</h5>
                  <p class="text-sm text-gray-500">启用开发者调试功能</p>
                </div>
                <a-switch
                  v-model:checked="settings.advanced.developerMode"
                  @change="handleAdvancedChange"
                />
              </div>

              <!-- 实验性功能 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">实验性功能</h5>
                  <p class="text-sm text-gray-500">体验新的实验性功能</p>
                </div>
                <a-switch
                  v-model:checked="settings.advanced.experimentalFeatures"
                  @change="handleAdvancedChange"
                />
              </div>

              <!-- 缓存管理 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">缓存管理</h5>
                  <p class="text-sm text-gray-500">清理本地缓存数据</p>
                </div>
                <a-button
                  @click="handleClearCache"
                  :loading="clearing"
                  type="default"
                  danger
                >
                  清理缓存
                </a-button>
              </div>

              <!-- 数据导出 -->
              <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h5 class="font-medium text-gray-800">数据导出</h5>
                  <p class="text-sm text-gray-500">导出您的个人数据</p>
                </div>
                <a-button
                  @click="handleExportData"
                  :loading="exporting"
                  type="default"
                >
                  导出数据
                </a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 账户设置弹窗组件
 * @component AccountSettingsModal
 * @description 用于管理用户账户相关设置
 */
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'

// 组件属性
interface Props {
  open: boolean
}

const props = defineProps<Props>()

// 组件事件
const emit = defineEmits<{
  'update:open': [open: boolean]
  success: []
}>()

const authStore = useAuthStore()
const activeTab = ref<string>('basic')
const loading = ref<boolean>(false)
const clearing = ref<boolean>(false)
const exporting = ref<boolean>(false)

// 设置数据
const settings = reactive({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  theme: 'light',
  autoLogin: false,
  notifications: {
    system: true,
    email: true,
    sms: false,
    desktop: true
  },
  privacy: {
    profileVisibility: 'internal',
    activityLog: true,
    analytics: true
  },
  advanced: {
    developerMode: false,
    experimentalFeatures: false
  }
})

// 监听弹窗显示状态
watch(() => props.open, (newValue) => {
  if (newValue) {
    // 弹窗打开时，加载设置数据
    loadSettings()
  }
})

/**
 * 加载设置数据
 */
const loadSettings = (): void => {
  try {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      Object.assign(settings, parsed)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

/**
 * 保存设置数据
 */
const saveSettings = (): void => {
  try {
    localStorage.setItem('userSettings', JSON.stringify(settings))
    message.success('设置保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
    message.error('设置保存失败')
  }
}

/**
 * 处理语言变化
 */
const handleLanguageChange = (value: string): void => {
  message.info(`语言已切换为：${value === 'zh-CN' ? '简体中文' : 'English'}`)
  saveSettings()
}

/**
 * 处理时区变化
 */
const handleTimezoneChange = (value: string): void => {
  message.info(`时区已设置为：${value}`)
  saveSettings()
}

/**
 * 处理主题变化
 */
const handleThemeChange = (e: any): void => {
  const theme = e.target.value
  message.info(`主题已切换为：${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}模式`)
  saveSettings()
}

/**
 * 处理自动登录变化
 */
const handleAutoLoginChange = (checked: boolean): void => {
  message.info(`自动登录已${checked ? '启用' : '禁用'}`)
  saveSettings()
}

/**
 * 处理通知设置变化
 */
const handleNotificationChange = (): void => {
  saveSettings()
}

/**
 * 处理隐私设置变化
 */
const handlePrivacyChange = (): void => {
  saveSettings()
}

/**
 * 处理高级设置变化
 */
const handleAdvancedChange = (): void => {
  saveSettings()
}

/**
 * 处理清理缓存
 */
const handleClearCache = async (): Promise<void> => {
  try {
    clearing.value = true
    
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 清理本地存储
    const keysToKeep = ['token', 'refreshToken', 'user', 'permissions', 'userSettings']
    const allKeys = Object.keys(localStorage)
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    
    message.success('缓存清理完成')
  } catch (error) {
    console.error('清理缓存失败:', error)
    message.error('清理缓存失败')
  } finally {
    clearing.value = false
  }
}

/**
 * 处理数据导出
 */
const handleExportData = async (): Promise<void> => {
  try {
    exporting.value = true
    
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const userData = {
      user: authStore.user,
      settings: settings,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `user_data_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    message.success('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    message.error('导出数据失败')
  } finally {
    exporting.value = false
  }
}

/**
 * 处理保存
 */
const handleSave = async (): Promise<void> => {
  try {
    loading.value = true
    saveSettings()
    emit('success')
    emit('update:open', false)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 处理取消
 */
const handleCancel = (): void => {
  emit('update:open', false)
}
</script>

<style scoped>
.account-settings-modal {
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.ant-tabs-card .ant-tabs-tab) {
  border-radius: 8px 8px 0 0;
}

:deep(.ant-tabs-card .ant-tabs-content) {
  border-radius: 0 0 8px 8px;
}

:deep(.ant-btn) {
  border-radius: 8px;
}

:deep(.ant-select) {
  border-radius: 8px;
}
</style> 