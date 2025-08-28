<template>
  <a-modal
    v-model:open="visible"
    title="学生详情"
    :footer="null"
    width="800px"
    @cancel="handleClose"
  >
    <div v-if="student" class="student-detail">
      <!-- 基本信息卡片 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div class="flex items-center mb-6">
          <img 
            :src="getAvatarUrl(student.photo)" 
            :alt="student.name || ''" 
            class="w-20 h-20 rounded-full mr-6 object-cover border-4 border-blue-100"
            @error="handleAvatarError($event)"
          >
          <div>
            <h3 class="text-2xl font-bold text-gray-800 mb-1">{{ student.name }}</h3>
            <p class="text-lg text-gray-600 font-mono">{{ student.studentCode }}</p>
            <p class="text-sm text-gray-500 mt-1">
              <i class="fas fa-graduation-cap mr-1"></i>
              {{ getMainMajor(student.enrollments || []) || '未指定专业' }}
            </p>
          </div>
        </div>

        <!-- 详细信息网格 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">性别：</span>
              <span class="text-gray-800">{{ getGenderText(student.gender) }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">年龄：</span>
              <span class="text-gray-800">{{ student.birthDate ? calculateAge(student.birthDate) + '岁' : '暂无' }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">出生日期：</span>
              <span class="text-gray-800">{{ student.birthDate || '暂无' }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">联系电话：</span>
              <span class="text-gray-800">{{ student.contactPhone }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">身份证号：</span>
              <span class="text-gray-800 font-mono text-sm">{{ student.idNumber || '—' }}</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">学号：</span>
              <span class="text-gray-800 font-mono">{{ student.studentCode }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">报名状态：</span>
              <span :class="getMainStatusClass(student.enrollments)">
                {{ getMainStatusText(student.enrollments) }}
              </span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">注册时间：</span>
              <span class="text-gray-800">{{ formatDate(student.createdAt || '') }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 font-medium w-24">最后更新：</span>
              <span class="text-gray-800">{{ formatDate(student.updatedAt || '') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 证件照片 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-id-card mr-2 text-purple-500"></i>
          证件照片
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 个人头像 -->
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-3">个人头像</p>
            <div class="relative inline-block">
              <img 
                :src="getAvatarUrl(student.photo)" 
                :alt="student.name || ''" 
                class="w-32 h-40 object-cover border-2 border-gray-300 rounded-lg shadow-sm cursor-pointer"
                @error="handleAvatarError($event)"
                @click="previewImage(getAvatarUrl(student.photo), '个人头像')"
              >
              <div v-if="!student.photo" class="absolute inset-0 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                <i class="fas fa-user text-gray-400 text-2xl"></i>
              </div>
            </div>
          </div>

          <!-- 身份证正面 -->
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-3">身份证正面</p>
            <div class="relative inline-block">
              <img 
                :src="getIdCardUrl(student.idCardFront, 'front')" 
                alt="身份证正面" 
                class="w-32 h-20 object-cover border-2 border-gray-300 rounded-lg shadow-sm cursor-pointer"
                @error="handleIdCardFrontError($event)"
                @click="previewImage(getIdCardUrl(student.idCardFront, 'front'), '身份证正面')"
              >
              <div v-if="!student.idCardFront" class="absolute inset-0 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                <i class="fas fa-id-card text-gray-400 text-xl"></i>
              </div>
            </div>
          </div>

          <!-- 身份证反面 -->
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-3">身份证反面</p>
            <div class="relative inline-block">
              <img 
                :src="getIdCardUrl(student.idCardBack, 'back')" 
                alt="身份证反面" 
                class="w-32 h-20 object-cover border-2 border-gray-300 rounded-lg shadow-sm cursor-pointer"
                @error="handleIdCardBackError($event)"
                @click="previewImage(getIdCardUrl(student.idCardBack, 'back'), '身份证反面')"
              >
              <div v-if="!student.idCardBack" class="absolute inset-0 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                <i class="fas fa-id-card text-gray-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系信息 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-address-book mr-2 text-blue-500"></i>
          联系信息
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-gray-500 font-medium">现住址：</span>
            <p class="text-gray-800 mt-1">{{ student.currentAddress || '暂无' }}</p>
          </div>
          <div>
            <span class="text-gray-500 font-medium">紧急联系人：</span>
            <p class="text-gray-800 mt-1">
              {{ student.emergencyContact || '暂无' }}
              <span v-if="student.emergencyPhone" class="text-gray-600 ml-2">
                ({{ student.emergencyPhone }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- 保险信息 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-shield-alt mr-2 text-orange-500"></i>
          保险信息
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-gray-500 font-medium">保险公司：</span>
            <p class="text-gray-800 mt-1">{{ student.insuranceCompany || '暂无' }}</p>
          </div>
          <div>
            <span class="text-gray-500 font-medium">保险类别：</span>
            <p class="text-gray-800 mt-1">{{ student.retirementCategory || '暂无' }}</p>
          </div>
          <div>
            <span class="text-gray-500 font-medium">保险开始日期：</span>
            <p class="text-gray-800 mt-1">{{ formatDate(student.studyPeriodStart || '') || '暂无' }}</p>
          </div>
          <div>
            <span class="text-gray-500 font-medium">保险结束日期：</span>
            <p class="text-gray-800 mt-1">{{ formatDate(student.studyPeriodEnd || '') || '暂无' }}</p>
          </div>
        </div>
      </div>

      <!-- 报名课程 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6" v-if="student.enrollments && student.enrollments.length > 0">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-book mr-2 text-green-500"></i>
          报名课程 ({{ student.enrollments.length }})
        </h4>
        <div class="space-y-4">
          <div 
            v-for="enrollment in student.enrollments" 
            :key="enrollment.id"
            class="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex-1">
                <h5 class="font-medium text-gray-800 text-lg">{{ enrollment.course?.name || '未知课程' }}</h5>
                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>
                    <i class="fas fa-tag mr-1"></i>
                    {{ enrollment.course?.category || '未分类' }}
                  </span>
                  <span v-if="enrollment.course?.semester">
                    <i class="fas fa-calendar mr-1"></i>
                    {{ enrollment.course.semester }}
                  </span>
                  <span v-if="enrollment.course?.teacher">
                    <i class="fas fa-user-tie mr-1"></i>
                    {{ enrollment.course.teacher }}
                  </span>
                  <span v-if="enrollment.course?.location">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    {{ enrollment.course.location }}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <span :class="getEnrollmentStatusClass(enrollment.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                  {{ getEnrollmentStatusText(enrollment.status) }}
                </span>
              </div>
            </div>
            
            <!-- 报名详细信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div class="space-y-2">
                <div class="flex items-center">
                  <span class="text-gray-500 font-medium w-20">报名时间：</span>
                  <span class="text-gray-700 text-sm">{{ formatDate(enrollment.createdAt) }}</span>
                </div>
                <div class="flex items-center">
                  <span class="text-gray-500 font-medium w-20">更新时间：</span>
                  <span class="text-gray-700 text-sm">{{ formatDate(enrollment.updatedAt || '') }}</span>
                </div>

              </div>
              
              <div class="space-y-2">
                <div class="flex items-center" v-if="enrollment.insuranceStart">
                  <span class="text-gray-500 font-medium w-20">保险开始：</span>
                  <span class="text-gray-700 text-sm">{{ formatDate(enrollment.insuranceStart, 'date') }}</span>
                </div>
                <div class="flex items-center" v-if="enrollment.insuranceEnd">
                  <span class="text-gray-500 font-medium w-20">保险结束：</span>
                  <span class="text-gray-700 text-sm">{{ formatDate(enrollment.insuranceEnd, 'date') }}</span>
                </div>
                <div v-if="enrollment.remarks">
                  <span class="text-gray-500 font-medium">备注：</span>
                  <p class="text-gray-700 text-sm mt-1">{{ enrollment.remarks }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无报名课程提示 -->
      <div v-else class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-info-circle text-3xl mb-3"></i>
          <p>该学生暂无报名课程</p>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 学生详情查看弹窗
 * @component StudentDetailModal
 * @description 显示学生的详细信息，包括基本信息、联系信息、报名课程等
 */
import { computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { Student, Enrollment } from '@/types/models'
import { getIdCardUrl, getAvatarUrl, getImageUrl, handleImageError } from '@/utils/imageUtils'

// Props
interface Props {
  open: boolean
  student: Student | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// 监听学生数据变化，添加调试信息
watch(() => props.student, (newStudent) => {
  if (newStudent) {
    console.log('👤 学生数据更新:', newStudent)
    console.log('🎂 出生日期字段:', newStudent.birthDate)
    console.log('📸 头像字段:', newStudent.photo)
    console.log('🆔 身份证正面:', newStudent.idCardFront)
    console.log('🆔 身份证反面:', newStudent.idCardBack)
  }
}, { immediate: true, deep: true })

// 计算属性
const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

/**
 * 关闭弹窗
 */
const handleClose = (): void => {
  visible.value = false
}

// 使用统一的图片URL工具函数，无需重复定义

/**
 * 处理头像图片加载错误
 */
const handleAvatarError = (event: Event): void => {
  handleImageError(event, 'avatar')
}

/**
 * 处理身份证图片加载错误
 */
const handleIdCardFrontError = (event: Event): void => {
  handleImageError(event, 'idcard-front')
}

const handleIdCardBackError = (event: Event): void => {
  handleImageError(event, 'idcard-back')
}

/**
 * 获取性别文本
 */
const getGenderText = (gender: string): string => {
  const genderMap: Record<string, string> = {
    'MALE': '男',
    'FEMALE': '女',
    'OTHER': '其他'
  }
  return genderMap[gender] || '未知'
}

/**
 * 计算年龄
 */
const calculateAge = (birthDate: string | Date | null): number => {
  console.log('🎂 计算年龄输入:', birthDate, typeof birthDate)
  
  if (!birthDate) {
    console.log('❌ 出生日期为空')
    return 0
  }
  
  let birth: Date
  
  try {
    // 处理不同格式的日期输入
    if (typeof birthDate === 'string') {
      // 处理可能的日期格式
      if (birthDate.includes('T')) {
        // ISO 8601 格式: 2000-01-01T00:00:00.000Z
        birth = new Date(birthDate)
      } else if (birthDate.includes('-')) {
        // YYYY-MM-DD 格式: 2000-01-01
        birth = new Date(birthDate + 'T00:00:00.000Z')
      } else {
        // 其他格式
        birth = new Date(birthDate)
      }
    } else if (birthDate instanceof Date) {
      birth = birthDate
    } else {
      console.log('❌ 无法识别的日期格式:', birthDate)
      return 0
    }
    
    console.log('🗓️ 解析后的生日:', birth, birth.toISOString())
    
    // 检查日期是否有效
    if (isNaN(birth.getTime())) {
      console.log('❌ 日期无效:', birth)
      return 0
    }
    
    const today = new Date()
    console.log('📅 今日日期:', today.toISOString())
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    const calculatedAge = age < 0 ? 0 : age
    console.log('✅ 计算得出年龄:', calculatedAge)
    
    return calculatedAge
  } catch (error) {
    console.error('❌ 年龄计算出错:', error)
    return 0
  }
}



/**
 * 获取报名状态文本
 */
const getEnrollmentStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'APPROVED': '已通过',
    'PENDING': '待审核',
    'REJECTED': '已拒绝',
    'CANCELLED': '已取消'
  }
  return statusMap[status] || '未知'
}

/**
 * 获取报名状态样式
 */
const getEnrollmentStatusClass = (status: string): string => {
  const statusClassMap: Record<string, string> = {
    'APPROVED': 'bg-green-100 text-green-600',
    'PENDING': 'bg-yellow-100 text-yellow-600',
    'REJECTED': 'bg-red-100 text-red-600',
    'CANCELLED': 'bg-gray-100 text-gray-600'
  }
  return statusClassMap[status] || 'bg-gray-100 text-gray-600'
}

/**
 * 格式化日期
 */
const formatDate = (date: string | Date, type: 'datetime' | 'date' = 'datetime'): string => {
  if (!date) return '暂无'
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  
  if (type === 'datetime') {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return new Date(date).toLocaleString('zh-CN', options)
}

/**
 * 获取主要专业（最新报名的课程分类）
 */
const getMainMajor = (enrollments: Enrollment[]): string => {
  if (!enrollments || enrollments.length === 0) return '未指定专业'
  const latestEnrollment = enrollments[0] // 已按创建时间倒序排列
  return latestEnrollment.course?.category || '未分类'
}

/**
 * 获取主要状态（最新报名的状态）
 */
const getMainStatusText = (enrollments?: Enrollment[]): string => {
  if (!enrollments || enrollments.length === 0) return '无报名记录'
  const latestEnrollment = enrollments[0]
  return getEnrollmentStatusText(latestEnrollment.status)
}

/**
 * 获取主要状态样式（最新报名的状态）
 */
const getMainStatusClass = (enrollments?: Enrollment[]): string => {
  if (!enrollments || enrollments.length === 0) return 'text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium'
  const latestEnrollment = enrollments[0]
  return getEnrollmentStatusClass(latestEnrollment.status)
}





/**
 * 预览图片 - 使用浮层遮罩方式
 */
const previewImage = (imageUrl: string, title: string): void => {
  console.log('预览图片:', imageUrl, title)
  
  if (!imageUrl || imageUrl === getAvatarUrl(null) || imageUrl.includes('default-avatar') || imageUrl.includes('default-idcard')) {
    message.info('暂无图片可预览')
    return
  }
  
  // 检查图片URL并标准化 - 使用统一的图片URL处理
  let fullImageUrl = imageUrl
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    // 使用统一的图片URL构造函数
    fullImageUrl = getImageUrl(imageUrl)
  }
  
  console.log('完整图片URL:', fullImageUrl)
  
  // 先测试图片是否可以加载
  const testImg = new Image()
  testImg.onload = () => {
    console.log('图片加载成功，显示预览')
    
    // 创建预览遮罩层
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: pointer;
    `
    
    // 创建图片容器
    const container = document.createElement('div')
    container.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `
    
    // 创建标题
    const titleEl = document.createElement('h3')
    titleEl.textContent = title
    titleEl.style.cssText = `
      margin: 0 0 15px 0;
      text-align: center;
      color: #333;
      font-size: 18px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    `
    
    // 创建图片元素
    const img = document.createElement('img')
    img.src = fullImageUrl
    img.alt = title
    img.style.cssText = `
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 4px;
      display: block;
      margin: 0 auto;
    `
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button')
    closeBtn.innerHTML = '×'
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      width: 30px;
      height: 30px;
      border: none;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    `
    
    // 组装元素
    container.appendChild(titleEl)
    container.appendChild(img)
    container.appendChild(closeBtn)
    overlay.appendChild(container)
    
    // 关闭功能
    const closePreview = () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay)
      }
    }
    
    // 事件监听
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePreview()
    })
    closeBtn.addEventListener('click', closePreview)
    
    // 键盘ESC关闭
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreview()
        document.removeEventListener('keydown', handleKeydown)
      }
    }
    document.addEventListener('keydown', handleKeydown)
    
    // 添加到页面
    document.body.appendChild(overlay)
  }
  
  testImg.onerror = () => {
    console.log('图片加载失败:', fullImageUrl)
    message.error(`图片加载失败：${title}`)
  }
  
  testImg.src = fullImageUrl
}
</script>

<style scoped>
.student-detail {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
