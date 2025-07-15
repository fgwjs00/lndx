<template>
  <a-modal
    :open="visible"
    title="个人资料"
    :width="800"
    @ok="handleSave"
    @cancel="handleCancel"
    @update:open="(value) => emit('update:visible', value)"
    :confirm-loading="loading"
    ok-text="保存"
    cancel-text="取消"
  >
    <div class="user-profile-modal">
      <!-- 头像区域 -->
      <div class="flex flex-col items-center mb-8">
        <div class="relative mb-4">
          <img
            :src="formData.avatar || 'https://randomuser.me/api/portraits/women/65.jpg'"
            alt="用户头像"
            class="w-24 h-24 rounded-full border-4 border-gray-200 shadow-lg"
          />
          <button
            @click="handleAvatarUpload"
            class="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <i class="fas fa-camera text-sm"></i>
          </button>
        </div>
        <h3 class="text-xl font-semibold text-gray-800">{{ formData.realName || '用户' }}</h3>
        <p class="text-gray-500">
          <a-tag :color="getRoleColor(formData.role)" size="small">
            {{ getRoleName(formData.role) }}
          </a-tag>
        </p>
      </div>

      <!-- 表单区域 -->
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        class="space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 真实姓名 -->
          <a-form-item label="真实姓名" name="realName">
            <a-input
              v-model:value="formData.realName"
              placeholder="请输入真实姓名"
              size="large"
              :disabled="loading"
            />
          </a-form-item>

          <!-- 手机号 -->
          <a-form-item label="手机号" name="phone">
            <a-input
              v-model:value="formData.phone"
              placeholder="请输入手机号"
              size="large"
              :disabled="true"
            />
          </a-form-item>

          <!-- 邮箱 -->
          <a-form-item label="邮箱" name="email">
            <a-input
              v-model:value="formData.email"
              placeholder="请输入邮箱"
              size="large"
              :disabled="loading"
            />
          </a-form-item>

          <!-- 部门 -->
          <a-form-item label="部门" name="department">
            <a-input
              v-model:value="formData.department"
              placeholder="请输入部门"
              size="large"
              :disabled="loading"
            />
          </a-form-item>
        </div>

        <!-- 角色信息（只读） -->
        <div class="bg-gray-50 rounded-lg p-4 mt-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">系统信息</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">用户角色：</span>
              <span class="font-medium">{{ getRoleName(formData.role) }}</span>
            </div>
            <div>
              <span class="text-gray-500">账户状态：</span>
              <span class="font-medium text-green-600">{{ formData.status === 'active' ? '正常' : '禁用' }}</span>
            </div>
            <div>
              <span class="text-gray-500">注册时间：</span>
              <span class="font-medium">{{ formatDate(formData.createdAt) }}</span>
            </div>
            <div>
              <span class="text-gray-500">最后登录：</span>
              <span class="font-medium">{{ formatDate(formData.lastLoginTime) || '从未登录' }}</span>
            </div>
          </div>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 个人资料弹窗组件
 * @component UserProfileModal
 * @description 用于查看和编辑用户个人资料信息
 */
import { ref, reactive, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'
import { getRoleName, getRoleColor } from '@/utils/auth'
import type { UserInfo, UpdateProfileRequest } from '@/types/auth'

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
const formData = reactive<UserInfo>({
  id: 0,
  phone: '',
  email: '',
  role: 'student',
  status: 'active',
  avatar: '',
  realName: '',
  department: '',
  lastLoginTime: '',
  createdAt: '',
  updatedAt: ''
})

// 表单验证规则
const formRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  department: [
    { max: 50, message: '部门名称最长50个字符', trigger: 'blur' }
  ]
}

// 监听弹窗显示状态
watch(() => props.visible, (newValue) => {
  if (newValue && authStore.user) {
    // 弹窗打开时，填充用户数据
    Object.assign(formData, authStore.user)
  }
})

/**
 * 格式化日期
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

/**
 * 处理头像上传
 */
const handleAvatarUpload = (): void => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        message.error('只能上传图片文件')
        return
      }
      
      // 验证文件大小
      if (file.size > 2 * 1024 * 1024) {
        message.error('图片大小不能超过2MB')
        return
      }

      // 这里应该实现实际的上传逻辑
      // 暂时使用本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        formData.avatar = e.target?.result as string
      }
      reader.readAsDataURL(file)
      
      message.success('头像上传成功')
    }
  }
  input.click()
}

/**
 * 处理保存
 */
const handleSave = async (): Promise<void> => {
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    const updateData: UpdateProfileRequest = {
      realName: formData.realName,
      email: formData.email,
      avatar: formData.avatar,
      department: formData.department
    }
    
    const success = await authStore.updateProfile(updateData)
    
    if (success) {
      emit('success')
      emit('update:visible', false)
    }
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
  emit('update:visible', false)
}
</script>

<style scoped>
.user-profile-modal {
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
</style> 