<template>
  <a-modal
    v-model:open="visible"
    title="编辑学生信息"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleClose"
    width="800px"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <!-- 基本信息 -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-user mr-2 text-blue-500"></i>
          基本信息
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item
            label="真实姓名"
            name="realName"
          >
            <a-input 
              v-model:value="formData.realName"
              placeholder="请输入真实姓名"
              :disabled="true"
            />
            <div class="text-xs text-gray-500 mt-1">姓名不可修改</div>
          </a-form-item>

          <a-form-item
            label="学号"
            name="studentCode"
          >
            <a-input 
              v-model:value="formData.studentCode"
              placeholder="学号"
              :disabled="true"
            />
            <div class="text-xs text-gray-500 mt-1">学号不可修改</div>
          </a-form-item>

          <a-form-item
            label="联系电话"
            name="contactPhone"
            :rules="[{ required: true, message: '请输入联系电话' }]"
          >
            <a-input 
              v-model:value="formData.contactPhone"
              placeholder="请输入联系电话"
            />
          </a-form-item>

          <a-form-item
            label="身份证号"
            name="idCardNumber"
          >
            <a-input 
              v-model:value="formData.idCardNumber"
              placeholder="身份证号"
              :disabled="true"
            />
            <div class="text-xs text-gray-500 mt-1">身份证号不可修改</div>
          </a-form-item>
        </div>
      </div>

      <!-- 身份证件信息 -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-id-card mr-2 text-purple-500"></i>
          身份证件信息
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 身份证正面 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">身份证正面</label>
            <div class="space-y-3">
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white">
                <img 
                  v-if="formData.idCardFront" 
                  :src="getImagePreviewUrl(formData.idCardFront)" 
                  alt="身份证正面" 
                  class="w-full h-32 object-cover rounded-lg"
                >
                <div v-else class="py-8">
                  <i class="fas fa-id-card text-gray-400 text-3xl mb-2"></i>
                  <p class="text-gray-500 text-sm">暂无身份证正面</p>
                </div>
              </div>
              <a-upload
                :file-list="[]"
                :before-upload="beforeUploadIdCardFront"
                :show-upload-list="false"
                accept="image/*"
              >
                <a-button type="primary" block>
                  <i class="fas fa-upload mr-2"></i>
                  上传身份证正面
                </a-button>
              </a-upload>
            </div>
          </div>

          <!-- 身份证反面 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">身份证反面</label>
            <div class="space-y-3">
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white">
                <img 
                  v-if="formData.idCardBack" 
                  :src="getImagePreviewUrl(formData.idCardBack)" 
                  alt="身份证反面" 
                  class="w-full h-32 object-cover rounded-lg"
                >
                <div v-else class="py-8">
                  <i class="fas fa-id-card text-gray-400 text-3xl mb-2"></i>
                  <p class="text-gray-500 text-sm">暂无身份证反面</p>
                </div>
              </div>
              <a-upload
                :file-list="[]"
                :before-upload="beforeUploadIdCardBack"
                :show-upload-list="false"
                accept="image/*"
              >
                <a-button type="primary" block>
                  <i class="fas fa-upload mr-2"></i>
                  上传身份证反面
                </a-button>
              </a-upload>
            </div>
          </div>
        </div>
      </div>

      <!-- 保险信息 -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-shield-alt mr-2 text-indigo-500"></i>
          保险信息
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item
            label="保险公司"
            name="insuranceCompany"
          >
            <a-select
              v-model:value="formData.insuranceCompany"
              placeholder="请选择保险公司"
              :options="insuranceCompanyOptions"
              allow-clear
            />
          </a-form-item>

          <a-form-item
            label="保险类别"
            name="retirementCategory"
          >
            <a-select
              v-model:value="formData.retirementCategory"
              placeholder="请选择保险类别"
              :options="retirementCategoryOptions"
              allow-clear
            />
          </a-form-item>

          <a-form-item
            label="保险开始日期"
            name="studyPeriodStart"
          >
            <a-date-picker
              v-model:value="formData.studyPeriodStart"
              placeholder="请选择保险开始日期"
              style="width: 100%"
              format="YYYY-MM-DD"
            />
          </a-form-item>

          <a-form-item
            label="保险结束日期"
            name="studyPeriodEnd"
          >
            <a-date-picker
              v-model:value="formData.studyPeriodEnd"
              placeholder="请选择保险结束日期"
              style="width: 100%"
              format="YYYY-MM-DD"
            />
          </a-form-item>
        </div>
      </div>

      <!-- 学籍信息 -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-graduation-cap mr-2 text-orange-500"></i>
          学籍信息
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a-form-item
            label="学期"
            name="semester"
          >
            <a-select
              v-model:value="formData.semester"
              placeholder="请选择学期"
              :options="semesterOptions"
              :loading="semestersLoading"
              allow-clear
            />
          </a-form-item>



          <a-form-item
            label="所报课程"
            name="selectedCourses"
            class="md:col-span-2"
          >
            <a-select
              v-model:value="formData.selectedCourses"
              mode="multiple"
              placeholder="请选择课程"
              :options="courseOptions"
              :loading="coursesLoading"
              :disabled="false"
              style="width: 100%"
              :max-tag-count="3"
              show-search
              :filter-option="filterCourseOption"
            />
            <div class="text-xs text-gray-500 mt-1">
              可以添加或移除学生的选修课程，变更将立即生效
            </div>
          </a-form-item>
        </div>
      </div>

      <!-- 联系信息 -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-address-book mr-2 text-green-500"></i>
          联系信息
        </h4>
        
        <div class="space-y-4">
          <a-form-item
            label="现住址"
            name="currentAddress"
          >
            <a-textarea 
              v-model:value="formData.currentAddress"
              placeholder="请输入现住址"
              :rows="2"
            />
          </a-form-item>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a-form-item
              label="紧急联系人"
              name="emergencyContact"
            >
              <a-input 
                v-model:value="formData.emergencyContact"
                placeholder="请输入紧急联系人姓名"
              />
            </a-form-item>

            <a-form-item
              label="紧急联系电话"
              name="emergencyPhone"
            >
              <a-input 
                v-model:value="formData.emergencyPhone"
                placeholder="请输入紧急联系电话"
              />
            </a-form-item>
          </div>
        </div>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 学生编辑弹窗
 * @component StudentEditModal
 * @description 用于编辑学生基本信息、联系信息、身份证件、保险信息和学籍课程信息
 */
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, UploadProps } from 'ant-design-vue'
import type { Student } from '@/api/student'
import { StudentService } from '@/api/student'
import { ApplicationService } from '@/api/application'
import { CourseService } from '@/api/course'
import dayjs from 'dayjs'
import { getImageUrl } from '@/utils/imageUtils'

// Props
interface Props {
  open: boolean
  student: Student | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

// 响应式数据
const loading = ref<boolean>(false)
const semestersLoading = ref<boolean>(false)
const coursesLoading = ref<boolean>(false)
const formRef = ref<FormInstance>()
const formData = ref({
  realName: '',
  studentCode: '',
  contactPhone: '',
  idCardNumber: '',
  currentAddress: '',
  emergencyContact: '',
  emergencyPhone: '',
  // 身份证件
  idCardFront: '',
  idCardBack: '',
  // 保险信息
  insuranceCompany: '',
  retirementCategory: '',
  studyPeriodStart: null as any,
  studyPeriodEnd: null as any,
  // 学籍信息
  semester: '',
  selectedCourses: [] as string[]
})

// 课程和学期选项
const courseOptions = ref<Array<{ label: string; value: string }>>([])
const semesterOptions = ref<Array<{ label: string; value: string }>>([])
const studentEnrollments = ref<string[]>([])

// 保险公司选项
const insuranceCompanyOptions = ref([
  { label: '人保财险', value: '人保财险' },
  { label: '太平洋保险', value: '太平洋保险' },
  { label: '平安保险', value: '平安保险' },
  { label: '中国人寿', value: '中国人寿' },
  { label: '新华保险', value: '新华保险' },
  { label: '泰康保险', value: '泰康保险' },
  { label: '中邮保险', value: '中邮保险' },
  { label: '其他', value: '其他' }
])

// 保险类别选项
const retirementCategoryOptions = ref([
  { label: '意外保险', value: '意外保险' }
])

// 课程选择过滤函数
const filterCourseOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 表单验证规则
const rules = {
  contactPhone: [
    { required: true, message: '请输入联系电话' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
  ]
}

// 计算属性
const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

/**
 * 获取学期列表
 */
const fetchSemesters = async (): Promise<void> => {
  try {
    semestersLoading.value = true
    const response = await CourseService.getSemesters()
    semesterOptions.value = response.data?.map((semester: string) => ({
      label: semester,
      value: semester
    })) || []
  } catch (error) {
    console.error('获取学期列表失败:', error)
  } finally {
    semestersLoading.value = false
  }
}

/**
 * 获取课程列表
 */
const fetchCourses = async (): Promise<void> => {
  try {
    coursesLoading.value = true
    
    // 🔧 修复：根据学生学期筛选课程
    const params: any = {
      page: 1,
      pageSize: 100,
      status: 'PUBLISHED'
    }
    
    // 如果学生有明确的学期，只获取该学期的课程
    if (formData.value.semester) {
      params.semester = formData.value.semester
      console.log('🔧 按学生学期筛选课程:', formData.value.semester)
    }
    
    const response = await CourseService.getCourses(params)
    
    // 构建课程选项，包含容量信息和禁用状态
    courseOptions.value = (response.data?.list || []).map((course: any) => {
      const enrolled = course.enrolled || 0
      const capacity = course.capacity || course.maxStudents || 0
      const remainingSlots = capacity - enrolled
      const isAlreadySelected = formData.value.selectedCourses.includes(course.id)
      
      // 构建标签，显示容量信息
      let label = `${course.name} (${enrolled}/${capacity})`
      
      // 添加容量状态提示
      if (remainingSlots <= 0 && !isAlreadySelected) {
        label += ` - 已满员`
      } else if (remainingSlots <= 3 && remainingSlots > 0) {
        label += ` - 仅剩${remainingSlots}名额`
      }
      
      // 如果有年龄限制信息，也显示出来
      if (course.hasAgeRestriction && (course.minAge || course.maxAge)) {
        let ageHint = ''
        if (course.minAge && course.maxAge) {
          ageHint = `${course.minAge}-${course.maxAge}岁`
        } else if (course.minAge) {
          ageHint = `${course.minAge}岁以上`
        } else if (course.maxAge) {
          ageHint = `${course.maxAge}岁以下`
        }
        if (ageHint) {
          label += ` [${ageHint}]`
        }
      }
      
      return {
        label,
        value: course.id,
        disabled: remainingSlots <= 0 && !isAlreadySelected // 满员课程禁用，但已选择的课程不禁用
      }
    })
  } catch (error) {
    console.error('获取课程列表失败:', error)
  } finally {
    coursesLoading.value = false
  }
}

// 初始化表单数据的函数
const initializeFormData = async () => {
  if (!props.student || !props.open) return
  
  try {
    console.log('📝 编辑学生，获取完整信息:', props.student.id)
    
    // 获取完整的学生详情（包括身份证件和保险信息）
    const detailResponse = await StudentService.getStudentDetail(props.student.id)
    
    if (detailResponse.code === 200 && detailResponse.data) {
      const studentDetail = detailResponse.data
      
      console.log('📚 学生详情完整数据:', studentDetail)
      console.log('📚 学生enrollment数据:', studentDetail.enrollments)
      
      // 获取学生已选课程ID列表
      const enrolledCourseIds = studentDetail.enrollments?.map((enrollment: any) => {
        console.log('📚 单个enrollment数据:', enrollment)
        console.log('📚 enrollment.status:', enrollment.status)
        console.log('📚 enrollment.course:', enrollment.course)
        
        // 根据后端API结构，courseId在enrollment.course.id中
        const courseId = enrollment.course?.id
        
        console.log('📚 提取的courseId:', courseId)
        return courseId
      }).filter(Boolean) || [] // 过滤掉undefined值
      
      console.log('📚 有效的enrollment数量:', studentDetail.enrollments?.length || 0)
      console.log('📚 提取的有效courseId数量:', enrolledCourseIds.length)
      
      formData.value = {
        realName: studentDetail.name || '',
        studentCode: studentDetail.studentCode || '',
        contactPhone: studentDetail.contactPhone || '',
        idCardNumber: studentDetail.idNumber || '',
        currentAddress: studentDetail.currentAddress || '',
        emergencyContact: studentDetail.emergencyContact || '',
        emergencyPhone: studentDetail.emergencyPhone || '',
        // 身份证件
        idCardFront: studentDetail.idCardFront || '',
        idCardBack: studentDetail.idCardBack || '',
        // 保险信息
        insuranceCompany: studentDetail.insuranceCompany || '',
        retirementCategory: studentDetail.retirementCategory || '',
        studyPeriodStart: studentDetail.studyPeriodStart ? dayjs(studentDetail.studyPeriodStart) : null,
        studyPeriodEnd: studentDetail.studyPeriodEnd ? dayjs(studentDetail.studyPeriodEnd) : null,
        // 学籍信息
        semester: studentDetail.semester || '',
        selectedCourses: enrolledCourseIds
      }
      
      // 保存原始选课信息用于对比
      studentEnrollments.value = [...enrolledCourseIds]
      
      console.log('✅ 编辑表单数据初始化完成:', formData.value)
      console.log('📚 学生已选课程ID列表:', enrolledCourseIds)
      console.log('📚 课程数量:', enrolledCourseIds.length)
      
      if (enrolledCourseIds.length === 0 && (studentDetail.enrollments?.length || 0) > 0) {
        console.warn('⚠️ 警告：有enrollment记录但无法提取courseId，可能是数据结构问题')
      }
    } else {
      message.error('获取学生详情失败')
    }
  } catch (error) {
    console.error('获取学生详情失败:', error)
    message.error('获取学生详情失败')
  }
}

// 监听弹窗打开和学生数据变化
watch(
  () => [props.open, props.student],
  async ([isVisible, student]) => {
    if (isVisible && student) {
      // 获取课程和学期数据
      await Promise.all([
        fetchCourses(),
        fetchSemesters(),
        initializeFormData()
      ])
    }
  },
  { immediate: true }
)

/**
 * 提交表单
 */
const handleSubmit = async (): Promise<void> => {
  if (!props.student || !formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const updateData = {
      // 基本信息
      name: formData.value.realName,
      contactPhone: formData.value.contactPhone,
      currentAddress: formData.value.currentAddress,
      emergencyContact: formData.value.emergencyContact,
      emergencyPhone: formData.value.emergencyPhone,
      // 身份证件
      idCardFront: formData.value.idCardFront,
      idCardBack: formData.value.idCardBack,
      // 保险信息
      insuranceCompany: formData.value.insuranceCompany,
      retirementCategory: formData.value.retirementCategory,
      studyPeriodStart: formData.value.studyPeriodStart ? formData.value.studyPeriodStart.format('YYYY-MM-DD') : null,
      studyPeriodEnd: formData.value.studyPeriodEnd ? formData.value.studyPeriodEnd.format('YYYY-MM-DD') : null,
      // 学籍信息
      semester: formData.value.semester
      // 注意：课程信息需要通过专门的API处理，暂时不在这里提交
      // selectedCourses: formData.value.selectedCourses
    }

    console.log('📤 提交学生更新数据:', updateData)
    console.log('📚 原始课程:', studentEnrollments.value)
    console.log('📚 新选课程:', formData.value.selectedCourses)
    
    // 首先更新基本信息
    const response = await StudentService.updateStudent(props.student.id, updateData)
    
    if (response.code !== 200) {
      message.error(response.message || '更新失败')
      return
    }
    
    // 检查课程是否有变更
    const originalCourses = [...studentEnrollments.value].sort()
    const newCourses = [...formData.value.selectedCourses].sort()
    const coursesChanged = originalCourses.join(',') !== newCourses.join(',')
    
    console.log('🔄 课程是否变更:', coursesChanged)
    console.log('📚 原始课程排序:', originalCourses)
    console.log('📚 新课程排序:', newCourses)
    
    if (coursesChanged) {
      console.log('🔄 开始更新学生课程...')
      try {
        const courseResponse = await StudentService.updateStudentCourses(
          props.student.id, 
          formData.value.selectedCourses
        )
        
        if (courseResponse.code === 200) {
          console.log('✅ 课程更新成功:', courseResponse.data)
          message.success(`学生信息更新成功！${courseResponse.message}`)
        } else {
          console.warn('⚠️ 课程更新失败:', courseResponse.message)
          message.warning(`基本信息已更新，但课程更新失败: ${courseResponse.message}`)
        }
      } catch (error) {
        console.error('❌ 课程更新出错:', error)
        message.warning('基本信息已更新，但课程更新失败，请稍后重试')
      }
    } else {
      console.log('📚 课程无变更，只更新了基本信息')
      message.success('学生信息更新成功')
    }
    
    emit('success')
    handleClose()
  } catch (error) {
    console.error('更新学生信息失败:', error)
    message.error('更新学生信息失败')
  } finally {
    loading.value = false
  }
}

// 使用统一的图片URL工具函数，无需重复定义
const getImagePreviewUrl = getImageUrl

/**
 * 身份证正面上传前处理
 */
const beforeUploadIdCardFront: UploadProps['beforeUpload'] = async (file) => {
  try {
    loading.value = true
    console.log('📄 上传身份证正面:', file.name)
    
    const response = await ApplicationService.uploadIdCardImage(file)
    
    if (response.code === 200) {
      formData.value.idCardFront = response.data.url
      message.success('身份证正面上传成功')
    } else {
      message.error('身份证正面上传失败')
    }
  } catch (error) {
    console.error('身份证正面上传失败:', error)
    message.error('身份证正面上传失败')
  } finally {
    loading.value = false
  }
  
  return false // 阻止默认上传行为
}

/**
 * 身份证反面上传前处理
 */
const beforeUploadIdCardBack: UploadProps['beforeUpload'] = async (file) => {
  try {
    loading.value = true
    console.log('📄 上传身份证反面:', file.name)
    
    const response = await ApplicationService.uploadIdCardImage(file)
    
    if (response.code === 200) {
      formData.value.idCardBack = response.data.url
      message.success('身份证反面上传成功')
    } else {
      message.error('身份证反面上传失败')
    }
  } catch (error) {
    console.error('身份证反面上传失败:', error)
    message.error('身份证反面上传失败')
  } finally {
    loading.value = false
  }
  
  return false // 阻止默认上传行为
}

/**
 * 关闭弹窗
 */
const handleClose = (): void => {
  visible.value = false
  formRef.value?.resetFields()
}

// 监听对话框打开状态
watch(() => props.open, async (newValue) => {
  if (newValue && props.student) {
    await initializeFormData()
  }
}, { immediate: true })

// 监听课程选择变化，重新计算禁用状态
watch(() => formData.value.selectedCourses, () => {
  // 当课程选择发生变化时，重新获取课程列表以更新禁用状态
  if (courseOptions.value.length > 0) {
    fetchCourses()
  }
}, { deep: true })

// 🔧 新增：监听学期变化，重新获取课程列表
watch(() => formData.value.semester, async (newSemester, oldSemester) => {
  if (newSemester !== oldSemester && newSemester) {
    console.log('🔧 学期变化，重新获取课程列表:', newSemester)
    
    // 清空现有选课（因为学期变化后，原来的课程可能不匹配）
    const originalSelectedCourses = [...formData.value.selectedCourses]
    formData.value.selectedCourses = []
    
    // 重新获取课程列表
    await fetchCourses()
    
    if (originalSelectedCourses.length > 0) {
      message.warning(`学期已变更为 ${newSemester}，已清空原有选课，请重新选择该学期的课程`)
    }
  }
})
</script>
