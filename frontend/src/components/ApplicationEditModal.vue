<template>
  <a-modal 
    v-model:open="visible"
    title="编辑申请"
    width="600px"
    @ok="handleSave"
    @cancel="handleClose"
    :confirmLoading="saving"
  >
    <div v-if="application" class="application-edit">
      <a-form :model="formData" layout="vertical">
        <!-- 基本信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">基本信息</h3>
          
          <a-form-item label="学生姓名">
            <a-input v-model:value="formData.studentName" disabled />
          </a-form-item>
          
          <a-form-item label="申请编号">
            <a-input v-model:value="formData.applicationId" disabled />
          </a-form-item>
          
          <a-form-item label="申请课程">
            <a-select v-model:value="formData.courseId" placeholder="请选择课程">
              <a-select-option v-for="course in availableCourses" :key="course.id" :value="course.id">
                {{ course.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </div>
        
        <!-- 保险信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">保险信息</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a-form-item label="保险开始日期">
              <a-date-picker 
                v-model:value="formData.insuranceStart" 
                class="w-full"
                placeholder="选择开始日期"
              />
            </a-form-item>
            
            <a-form-item label="保险结束日期">
              <a-date-picker 
                v-model:value="formData.insuranceEnd" 
                class="w-full"
                placeholder="选择结束日期"
              />
            </a-form-item>
          </div>
        </div>
        
        <!-- 备注信息 -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">备注信息</h3>
          
          <a-form-item label="备注">
            <a-textarea 
              v-model:value="formData.remarks" 
              :rows="4"
              placeholder="请输入备注信息..."
            />
          </a-form-item>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 申请编辑模态框
 * @component ApplicationEditModal
 * @description 编辑申请信息
 */
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

// Props定义
interface Props {
  open: boolean
  application: any
  availableCourses: any[]
}

const props = defineProps<Props>()

// Emits定义
const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [data: any]
}>()

// 响应式数据
const saving = ref<boolean>(false)
const formData = ref({
  applicationId: '',
  studentName: '',
  courseId: '',
  insuranceStart: null as Dayjs | null,
  insuranceEnd: null as Dayjs | null,
  remarks: ''
})

// 计算属性
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// 监听申请数据变化
watch(() => props.application, (newApplication) => {
  if (newApplication) {
    formData.value = {
      applicationId: newApplication.applicationId || newApplication.enrollmentCode,
      studentName: newApplication.studentInfo?.name || newApplication.studentName,
      courseId: newApplication.courseInfo?.id || newApplication.courseId,
      insuranceStart: newApplication.insuranceStart ? dayjs(newApplication.insuranceStart) : null,
      insuranceEnd: newApplication.insuranceEnd ? dayjs(newApplication.insuranceEnd) : null,
      remarks: newApplication.remarks || ''
    }
  }
}, { immediate: true })

/**
 * 保存修改
 */
const handleSave = async (): Promise<void> => {
  try {
    saving.value = true
    
    const saveData = {
      id: props.application.id,
      courseId: formData.value.courseId,
      insuranceStart: formData.value.insuranceStart?.format('YYYY-MM-DD'),
      insuranceEnd: formData.value.insuranceEnd?.format('YYYY-MM-DD'),
      remarks: formData.value.remarks
    }
    
    emit('save', saveData)
    message.success('申请信息修改成功')
    handleClose()
  } catch (error) {
    console.error('保存失败:', error)
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

/**
 * 关闭模态框
 */
const handleClose = (): void => {
  visible.value = false
}
</script>

<style scoped>
.application-edit {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
