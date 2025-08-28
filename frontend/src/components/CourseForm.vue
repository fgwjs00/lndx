<template>
    <div class="course-form">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 基本信息 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">基本信息</h3>
            
            <a-form-item label="课程名称" name="name">
              <a-input 
                v-model:value="formData.name" 
                placeholder="请输入课程名称"
                class="rounded-lg"
              />
            </a-form-item>
  
            <!-- 课程编号字段已移除，数据库保留但前端不显示 -->
  
            <a-form-item label="所属院系" name="category">
              <a-select 
                v-model:value="formData.category" 
                placeholder="请选择所属院系"
                class="rounded-lg"
              >
                <!-- 动态加载院系选项 -->
                <a-select-option v-for="deptCode in departmentCodes" :key="deptCode" :value="deptCode">
                  {{ deptCode }}
                </a-select-option>
              </a-select>
            </a-form-item>
  
            <!-- 年级管理配置 -->
            <a-form-item label="年级管理" name="requiresGrades">
              <a-radio-group v-model:value="formData.requiresGrades" @change="handleGradeTypeChange">
                <a-radio :value="true">分年级教学</a-radio>
                <a-radio :value="false">不分年级</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item v-if="formData.requiresGrades" label="年级" name="level">
              <a-select 
                v-model:value="formData.level" 
                placeholder="请选择年级"
                class="rounded-lg"
              >
                <a-select-option value="一年级">一年级</a-select-option>
                <a-select-option value="二年级">二年级</a-select-option>
                <a-select-option value="三年级">三年级</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item v-if="!formData.requiresGrades" label="年级说明" name="gradeDescription">
              <a-input 
                v-model:value="formData.gradeDescription" 
                placeholder="如：不分年级，适合所有学员"
                class="rounded-lg"
              />
            </a-form-item>
  
            <!-- 任课教师字段已移除显示，数据库字段保留 -->
  
            <a-form-item label="上课地点" name="location">
              <a-input 
                v-model:value="formData.location" 
                placeholder="请输入上课地点"
                class="rounded-lg"
              />
            </a-form-item>
          </div>
  
          <!-- 详细信息 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">详细信息</h3>
            
            <a-form-item label="课程容量" name="capacity">
              <a-input-number 
                v-model:value="formData.capacity" 
                :min="1"
                :max="100"
                placeholder="人数"
                class="w-full rounded-lg"
              />
            </a-form-item>
  
            <!-- 课程费用字段已移除，数据库保留但前端不显示 -->
  
            <!-- 开课日期和结课日期字段已移除，数据库保留但前端不显示 -->
  
            <a-form-item label="学期" name="semester">
              <a-input 
                v-model:value="formData.semester" 
                placeholder="如：2024秋季"
                class="rounded-lg"
              />
            </a-form-item>
  
            <a-form-item label="课程状态" name="status">
              <a-select 
                v-model:value="formData.status" 
                placeholder="请选择课程状态"
                class="rounded-lg"
              >
                <a-select-option value="DRAFT">草稿</a-select-option>
                <a-select-option value="PUBLISHED">已发布</a-select-option>
                <a-select-option value="SUSPENDED">暂停</a-select-option>
                <a-select-option value="CANCELLED">已取消</a-select-option>
              </a-select>
            </a-form-item>
          </div>
        </div>
  
        <!-- 上课时间设置 -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">上课时间</h3>
          <div class="space-y-4">
            <div v-for="(timeSlot, index) in formData.timeSlots" :key="index" 
                 class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <a-select 
                v-model:value="timeSlot.dayOfWeek" 
                placeholder="星期"
                class="w-32"
              >
                <a-select-option :value="1">周一</a-select-option>
                <a-select-option :value="2">周二</a-select-option>
                <a-select-option :value="3">周三</a-select-option>
                <a-select-option :value="4">周四</a-select-option>
                <a-select-option :value="5">周五</a-select-option>
                <a-select-option :value="6">周六</a-select-option>
                <a-select-option :value="7">周日</a-select-option>
              </a-select>
  
              <a-time-picker 
                v-model:value="timeSlot.startTime" 
                format="HH:mm"
                placeholder="开始时间"
              />
  
              <span class="text-gray-500">-</span>
  
              <a-time-picker 
                v-model:value="timeSlot.endTime" 
                format="HH:mm"
                placeholder="结束时间"
              />
  
              <a-select 
                v-model:value="timeSlot.period" 
                placeholder="时段"
                class="w-24"
              >
                <a-select-option value="morning">上午</a-select-option>
                <a-select-option value="afternoon">下午</a-select-option>
              </a-select>
  
              <a-button 
                type="text" 
                danger 
                @click="removeTimeSlot(index)"
                :disabled="formData.timeSlots.length <= 1"
              >
                <i class="fas fa-trash"></i>
              </a-button>
            </div>
  
            <a-button 
              type="dashed" 
              @click="addTimeSlot"
              class="w-full"
            >
              <i class="fas fa-plus mr-2"></i>
              添加上课时间
            </a-button>
          </div>
        </div>
  
        <!-- 课程描述 -->
        <div class="mt-6">
          <a-form-item label="课程描述" name="description">
            <a-textarea 
              v-model:value="formData.description" 
              placeholder="请输入课程描述..."
              :rows="4"
              class="rounded-lg"
            />
          </a-form-item>
        </div>

        <!-- 年龄限制设置 -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">年龄限制</h3>
          <div class="bg-gray-50 rounded-lg p-4 space-y-4">
            <a-form-item label="启用年龄限制" name="ageRestrictionEnabled">
              <a-switch 
                v-model:checked="formData.ageRestriction.enabled"
                checked-children="启用"
                un-checked-children="禁用"
              />
              <span class="ml-2 text-sm text-gray-500">开启后将根据年龄限制学员报名</span>
            </a-form-item>

            <div v-if="formData.ageRestriction.enabled" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <a-form-item label="最小年龄" name="minAge">
                  <a-input-number 
                    v-model:value="formData.ageRestriction.minAge"
                    :min="0"
                    :max="120"
                    placeholder="最小年龄"
                    class="w-full rounded-lg"
                    addon-after="岁"
                  />
                </a-form-item>

                <a-form-item label="最大年龄" name="maxAge">
                  <a-input-number 
                    v-model:value="formData.ageRestriction.maxAge"
                    :min="0"
                    :max="120"
                    placeholder="最大年龄"
                    class="w-full rounded-lg"
                    addon-after="岁"
                  />
                </a-form-item>
              </div>

              <a-form-item label="年龄限制说明" name="ageDescription">
                <a-textarea 
                  v-model:value="formData.ageRestriction.description"
                  placeholder="例如：舞蹈课程需要一定的身体协调性，建议65岁以下学员报名"
                  :rows="2"
                  class="rounded-lg"
                />
              </a-form-item>

              <!-- 年龄限制预设模板 -->
              <div class="border-t pt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">快速设置</label>
                <div class="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    @click="setAgeRestriction(null, 45, '舞蹈、体操等高强度运动课程')"
                    class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                  >
                    45岁以下（舞蹈类）
                  </button>
                  <button 
                    type="button"
                    @click="setAgeRestriction(null, 70, '需要一定体力的户外活动课程')"
                    class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition-colors"
                  >
                    70岁以下（体力类）
                  </button>
                  <button 
                    type="button"
                    @click="setAgeRestriction(50, null, '适合中老年人的养生保健课程')"
                    class="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition-colors"
                  >
                    50岁以上（养生类）
                  </button>
                  <button 
                    type="button"
                    @click="setAgeRestriction(60, null, '专为退休人员设计的兴趣课程')"
                    class="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs hover:bg-orange-200 transition-colors"
                  >
                    60岁以上（兴趣类）
                  </button>
                  <button 
                    type="button"
                    @click="clearAgeRestriction()"
                    class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                  >
                    清除限制
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年级管理配置 -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">年级管理配置</h3>
          <div class="bg-gray-50 rounded-lg p-4 space-y-4">
            <a-form-item label="需要年级管理" name="requiresGrades">
              <a-switch 
                v-model:checked="formData.requiresGrades"
                checked-children="需要"
                un-checked-children="不需要"
              />
              <span class="ml-2 text-sm text-gray-500">关闭后任何年级的学生都可以报名此课程</span>
            </a-form-item>

            <div v-if="!formData.requiresGrades" class="space-y-4">
              <a-form-item label="课程说明" name="gradeDescription">
                <a-textarea 
                  v-model:value="formData.gradeDescription"
                  placeholder="例如：这是一个不分年级的短期培训课程，适合所有年级的学员参加"
                  :rows="2"
                  class="rounded-lg"
                />
              </a-form-item>

              <!-- 快速设置模板 -->
              <div class="border-t pt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">常用说明</label>
                <div class="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    @click="formData.gradeDescription = '短期培训课程，不分年级，所有学员均可参加'"
                    class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                  >
                    短期培训
                  </button>
                  <button 
                    type="button"
                    @click="formData.gradeDescription = '专业技能课程，按能力水平分班，不按年级限制'"
                    class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition-colors"
                  >
                    技能课程
                  </button>
                  <button 
                    type="button"
                    @click="formData.gradeDescription = '兴趣爱好课程，欢迎各年级学员参加'"
                    class="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition-colors"
                  >
                    兴趣课程
                  </button>
                  <button 
                    type="button"
                    @click="formData.gradeDescription = ''"
                    class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                  >
                    清除说明
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 表单按钮 -->
        <div class="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <a-button @click="handleCancel" class="px-6">
            取消
          </a-button>
          <a-button 
            type="primary" 
            html-type="submit"
            :loading="loading"
            class="px-6"
          >
            {{ course ? '更新课程' : '创建课程' }}
          </a-button>
        </div>
      </a-form>
    </div>
  </template>
  
  <script setup lang="ts">
  /**
   * 课程表单组件
   * @component CourseForm
   * @description 用于创建和编辑课程的表单组件
   */
  import { ref, reactive, watch, onMounted } from 'vue'
  import { message } from 'ant-design-vue'
  import dayjs from 'dayjs'
  import type { Course, CourseLevel, AgeRestriction, CourseCategory } from '@/types/index'
  import { getDepartmentCodes } from '@/config/departments'
  import { CourseService } from '@/api/course'
  
  // Props
  interface Props {
    course?: Course | null
    visible?: boolean
  }
  
  // Emits
  interface Emits {
    (e: 'success', course: Course): void
    (e: 'cancel'): void
  }
  
  const props = withDefaults(defineProps<Props>(), {
    course: null,
    visible: false
  })
  
  const emit = defineEmits<Emits>()
  
  // 响应式数据
  const formRef = ref()
  const loading = ref<boolean>(false)
  
  // 院系选项
  const departmentCodes = getDepartmentCodes()
  
  // 表单数据
const formData = reactive({
  name: '',
  courseId: '',
  description: '',
  category: '' as CourseCategory,
  level: '' as CourseLevel,
  // teacher: '', // 已移除显示，数据库字段保留
  credits: 2,
  capacity: 30,
  location: '',
  // fee: 200, // 已移除，数据库保留
  // startDate: null as any, // 已移除，数据库保留
  // endDate: null as any, // 已移除，数据库保留
  semester: '2024秋季',
  status: 'DRAFT' as const,
  // 年级管理配置
  requiresGrades: true,
  gradeDescription: '',
  ageRestriction: {
    enabled: false,
    minAge: undefined,
    maxAge: undefined,
    description: ''
  } as AgeRestriction,
  timeSlots: [
    {
      dayOfWeek: 1 as 1,
      startTime: null as any,
      endTime: null as any,
      period: 'morning' as const
    }
  ] as Array<{
    dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7
    startTime: any
    endTime: any
    period: 'morning' | 'afternoon'
  }>
})
  
  // 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入课程名称', trigger: 'blur' }
  ],
  // courseId 验证规则已移除
  category: [
    { required: true, message: '请选择所属院系', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  teacher: [
    { required: true, message: '请输入任课教师', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入上课地点', trigger: 'blur' }
  ],
  capacity: [
    { required: true, message: '请输入课程容量', trigger: 'blur' }
  ],
  // credits 验证规则已移除
  // fee 验证规则已移除
  // startDate, endDate 验证规则已移除
  semester: [
    { required: true, message: '请输入学期', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择课程状态', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入课程描述', trigger: 'blur' }
  ]
}

/**
 * 重置表单
 */
const resetForm = (): void => {
  Object.assign(formData, {
    name: '',
    // courseId: '', // 已移除
    description: '',
    category: '',
    level: '',
    // teacher: '', // 已移除显示，数据库字段保留
    // credits: 2, // 已移除
    capacity: 30,
    location: '',
    // fee: 200, // 已移除
    // startDate: null, // 已移除
    // endDate: null, // 已移除
    semester: '2024秋季',
    status: 'DRAFT',
    ageRestriction: {
      enabled: false,
      minAge: undefined,
      maxAge: undefined,
      description: ''
    },
    // 年级管理配置
    requiresGrades: true,        // 默认需要年级管理
    gradeDescription: '',        // 年级说明
    timeSlots: [
      {
        dayOfWeek: 1 as 1,
        startTime: null,
        endTime: null,
        period: 'morning' as const
      }
    ] as Array<{
      dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7
      startTime: any
      endTime: any
      period: 'morning' | 'afternoon'
    }>
  })
  
  // 清除表单验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

/**
 * 设置年龄限制
 */
const setAgeRestriction = (minAge: number | null, maxAge: number | null, description: string): void => {
  formData.ageRestriction.enabled = true
  formData.ageRestriction.minAge = minAge || undefined
  formData.ageRestriction.maxAge = maxAge || undefined
  formData.ageRestriction.description = description
}

/**
 * 清除年龄限制
 */
const clearAgeRestriction = (): void => {
  formData.ageRestriction.enabled = false
  formData.ageRestriction.minAge = undefined
  formData.ageRestriction.maxAge = undefined
  formData.ageRestriction.description = ''
}

// 监听课程数据变化
watch(() => props.course, (newCourse) => {
  if (newCourse) {
    // 编辑模式，填充表单数据
    Object.assign(formData, {
      ...newCourse,
      // startDate, endDate 字段已移除
      timeSlots: Array.isArray(newCourse.timeSlots) 
        ? newCourse.timeSlots.map(slot => ({
            ...slot,
            startTime: dayjs(slot.startTime, 'HH:mm'),
            endTime: dayjs(slot.endTime, 'HH:mm')
          }))
        : [] // 如果不是数组，则使用空数组
    })
  } else {
    // 新增模式，重置表单
    resetForm()
  }
}, { immediate: true })
  
  /**
 * 添加时间段
 */
const addTimeSlot = (): void => {
  formData.timeSlots.push({
    dayOfWeek: 1 as 1,
    startTime: null,
    endTime: null,
    period: 'morning' as const
  })
}
  
  /**
   * 删除时间段
   */
  const removeTimeSlot = (index: number): void => {
    if (formData.timeSlots.length > 1) {
      formData.timeSlots.splice(index, 1)
    }
  }
  
  /**
   * 处理年级类型变化
   */
  const handleGradeTypeChange = (): void => {
    if (!formData.requiresGrades) {
      // 不分年级时清空年级字段
      formData.level = ''
      formData.gradeDescription = '不分年级，适合所有学员'
    } else {
      // 分年级时清空年级说明
      formData.gradeDescription = ''
    }
  }

  /**
   * 生成课程编号
   * 格式：DEPT-YYYY-XXXXXX (院系-年份-6位随机数)
   */
  const generateCourseCode = (): string => {
    const year = new Date().getFullYear()
    const random = Math.floor(100000 + Math.random() * 900000) // 6位随机数
    const deptCode = formData.category.replace(/[系部]/g, '').substring(0, 4) // 提取院系缩写
    return `${deptCode}-${year}-${random}`
  }

  /**
   * 处理表单提交
   */
  const handleSubmit = async (): Promise<void> => {
    try {
      loading.value = true
      
      // 验证时间段
      const validTimeSlots = formData.timeSlots.filter(slot => 
        slot.dayOfWeek && slot.startTime && slot.endTime && slot.period
      )
      
      if (validTimeSlots.length === 0) {
        message.error('请至少设置一个有效的上课时间')
        return
      }
      
      // 构造符合后端API格式的课程数据
      const courseData = {
        courseCode: generateCourseCode(), // 🔧 修复：自动生成课程编号
        name: formData.name,
        description: formData.description || '',
        category: formData.category,
        level: formData.level.toUpperCase(), // 后端期望大写格式
        duration: 120, // 默认2小时
        maxStudents: formData.capacity,
        // 🔥 修复：添加缺失的字段
        // teacher: formData.teacher,        // 任课教师字段已移除显示
        location: formData.location,         // 上课地点
        status: formData.status,             // 课程状态
        semester: formData.semester,         // 学期
        // 年龄限制
        hasAgeRestriction: formData.ageRestriction.enabled,
        minAge: formData.ageRestriction.enabled ? formData.ageRestriction.minAge : null,
        maxAge: formData.ageRestriction.enabled ? formData.ageRestriction.maxAge : null,
        ageDescription: formData.ageRestriction.enabled ? formData.ageRestriction.description : null,
        // 年级管理配置
        requiresGrades: formData.requiresGrades,
        gradeDescription: formData.gradeDescription || null,
        // 上课时间安排 - 转换为后端期望的格式
        timeSlots: validTimeSlots.map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime.format('HH:mm'),
          endTime: slot.endTime.format('HH:mm'),
          period: slot.period
        })),
        // 其他字段
        tags: [],
        teacherIds: [] // 暂时为空，后期可以实现教师选择
      }
      
      // 🔥 使用真实的API调用，而不是模拟数据
      let response
      if (props.course) {
        // 更新课程
        response = await CourseService.updateCourse(props.course.id.toString(), courseData as any)
      } else {
        // 创建课程  
        response = await CourseService.createCourse(courseData as any)
      }
      
      if (response.code === 200) {
        message.success(props.course ? '课程更新成功' : '课程创建成功')
        emit('success', response.data as any)
      } else {
        throw new Error(response.message || '操作失败')
      }
      
    } catch (error) {
      console.error('提交课程失败:', error)
      message.error('操作失败，请重试')
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 处理取消
   */
  const handleCancel = (): void => {
    resetForm()
    emit('cancel')
  }
  
  /**
   * 组件挂载时初始化
   */
  onMounted((): void => {
    if (!props.course) {
      resetForm()
    }
  })
  </script>
  
  <style scoped>
  .course-form {
    max-width: 100%;
  }
  
  :deep(.ant-form-item-label) {
    font-weight: 500;
    color: #374151;
  }
  
  :deep(.ant-input),
  :deep(.ant-select-selector),
  :deep(.ant-picker) {
    border-radius: 0.5rem;
  }
  
  :deep(.ant-btn) {
    border-radius: 0.5rem;
  }
  </style>
