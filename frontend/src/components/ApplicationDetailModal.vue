<template>
  <a-modal 
    v-model:open="visible"
    title="申请详情"
    width="800px"
    :footer="null"
    @cancel="handleClose"
  >
    <div v-if="application" class="application-detail">
      <!-- 学生基本信息 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">学生基本信息</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center">
            <img 
              :src="getAvatarUrl(application.avatar)" 
              :alt="application.studentInfo?.name" 
              class="w-16 h-16 rounded-full mr-4 object-cover border border-gray-300"
              @error="$event.target.src = getAvatarUrl(null)"
            />
            <div>
              <p class="font-medium text-gray-800">{{ application.studentInfo?.name }}</p>
              <p class="text-sm text-gray-500">{{ application.studentInfo?.idNumber }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">联系电话:</span>
              <span class="text-gray-800">{{ application.studentInfo?.phone || '未填写' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">性别:</span>
              <span class="text-gray-800">{{ getGenderText(application.studentInfo?.gender) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">年龄:</span>
              <span class="text-gray-800">{{ application.studentInfo?.age ? `${application.studentInfo.age}岁` : '未填写' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 申请信息 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">申请信息</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">申请编号:</span>
              <span class="text-gray-800 font-mono">{{ application.applicationId || application.enrollmentCode }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">申请课程:</span>
              <span class="text-gray-800">{{ application.courseInfo?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">申请时间:</span>
              <span class="text-gray-800">{{ application.applicationDate }}</span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">当前状态:</span>
              <span 
                :class="getStatusClass(application.status)"
                class="px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ getStatusText(application.status) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">学员编号:</span>
              <span class="text-gray-800 font-mono">{{ application.studentInfo?.studentCode || '待生成' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 身份证照片 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">身份证照片</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-600 mb-2">身份证正面:</p>
            <img 
              v-if="application.idCardFront"
              :src="getImageUrl(application.idCardFront)" 
              alt="身份证正面"
              class="w-full h-64 object-cover rounded-lg border border-gray-300 cursor-pointer hover:shadow-lg transition-shadow"
              @click="previewImage(getImageUrl(application.idCardFront), '身份证正面')"
            />
            <div v-else class="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-gray-500">未上传</span>
            </div>
          </div>
          <div>
            <p class="text-gray-600 mb-2">身份证背面:</p>
            <img 
              v-if="application.idCardBack"
              :src="getImageUrl(application.idCardBack)" 
              alt="身份证背面"
              class="w-full h-64 object-cover rounded-lg border border-gray-300 cursor-pointer hover:shadow-lg transition-shadow"
              @click="previewImage(getImageUrl(application.idCardBack), '身份证背面')"
            />
            <div v-else class="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-gray-500">未上传</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 保险信息 -->
      <div class="mb-6" v-if="application.insuranceStart || application.insuranceEnd">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">保险信息</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex justify-between">
            <span class="text-gray-600">保险开始日期:</span>
            <span class="text-gray-800">{{ application.insuranceStart || '未设置' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">保险结束日期:</span>
            <span class="text-gray-800">{{ application.insuranceEnd || '未设置' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 备注信息 -->
      <div class="mb-6" v-if="application.remarks">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">备注信息</h3>
        <p class="text-gray-700 bg-gray-50 p-4 rounded-lg">{{ application.remarks }}</p>
      </div>
      
      <!-- 操作按钮 -->
      <div class="flex justify-end gap-4 pt-4 border-t">
        <a-button @click="handleClose">关闭</a-button>
        <a-button 
          v-if="application.status.toUpperCase() === 'PENDING'" 
          type="primary" 
          danger
          @click="handleReject"
        >
          拒绝申请
        </a-button>
        <a-button 
          v-if="application.status.toUpperCase() === 'PENDING'" 
          type="primary"
          @click="handleApprove"
        >
          批准申请
        </a-button>
      </div>
    </div>
    
    <!-- 图片预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewTitle"
      :footer="null"
      width="600px"
    >
      <div class="text-center">
        <img :src="previewImageUrl" alt="预览" class="max-w-full h-auto" />
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 申请详情查看模态框
 * @component ApplicationDetailModal
 * @description 展示申请的完整详细信息
 */
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { getImageUrl as getImageUrlUtil, getAvatarUrl, getIdCardUrl } from '@/utils/imageUtils'

// Props定义
interface Props {
  open: boolean
  application: any
}

const props = defineProps<Props>()

// Emits定义
const emit = defineEmits<{
  'update:open': [value: boolean]
  'approve': [application: any]
  'reject': [application: any]
}>()

// 响应式数据
const previewVisible = ref<boolean>(false)
const previewImageUrl = ref<string>('')
const previewTitle = ref<string>('')

// 计算属性
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

/**
 * 获取图片URL
 */
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return ''
  
  if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
    return imagePath
  }
  
  // 使用统一的图片URL工具函数
  return getImageUrlUtil(imagePath)
}

/**
 * 性别文本转换
 */
const getGenderText = (gender?: string): string => {
  switch (gender) {
    case 'MALE':
      return '男'
    case 'FEMALE':  
      return '女'
    default:
      return '未填写'
  }
}

/**
 * 预览图片
 */
const previewImage = (url: string, title: string): void => {
  previewImageUrl.value = url
  previewTitle.value = title
  previewVisible.value = true
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  const normalizedStatus = status.toUpperCase()
  switch (normalizedStatus) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-600'
    case 'APPROVED':
      return 'bg-green-100 text-green-600'
    case 'REJECTED':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  const normalizedStatus = status.toUpperCase()
  switch (normalizedStatus) {
    case 'PENDING':
      return '待审核'
    case 'APPROVED':
      return '已批准'
    case 'REJECTED':
      return '已拒绝'
    default:
      return '未知'
  }
}

/**
 * 关闭模态框
 */
const handleClose = (): void => {
  visible.value = false
}

/**
 * 批准申请
 */
const handleApprove = (): void => {
  emit('approve', props.application)
  handleClose()
}

/**
 * 拒绝申请
 */
const handleReject = (): void => {
  emit('reject', props.application)
  handleClose()
}
</script>

<style scoped>
.application-detail {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
