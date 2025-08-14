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
  
            <a-form-item label="课程编号" name="courseId">
              <a-input 
                v-model:value="formData.courseId" 
                placeholder="如：MUS001"
                class="rounded-lg"
              />
            </a-form-item>
  
            <a-form-item label="课程分类" name="category">
              <a-select 
                v-model:value="formData.category" 
                placeholder="请选择课程分类"
                class="rounded-lg"
              >
                <a-select-option value="music">音乐类</a-select-option>
                <a-select-option value="instrument">器乐类</a-select-option>
                <a-select-option value="art">艺术类</a-select-option>
                <a-select-option value="literature">文学类</a-select-option>
                <a-select-option value="practical">实用技能</a-select-option>
                <a-select-option value="comprehensive">综合类</a-select-option>
              </a-select>
            </a-form-item>
  
            <a-form-item label="课程级别" name="level">
              <a-select 
                v-model:value="formData.level" 
                placeholder="请选择课程级别"
                class="rounded-lg"
              >
                <a-select-option value="beginner">入门</a-select-option>
                <a-select-option value="intermediate">中级</a-select-option>
                <a-select-option value="advanced">高级</a-select-option>
                <a-select-option value="grade1">一年级</a-select-option>
                <a-select-option value="grade2">二年级</a-select-option>
                <a-select-option value="grade3">三年级</a-select-option>
                <a-select-option value="foundation">基础班</a-select-option>
                <a-select-option value="improvement">提高班</a-select-option>
                <a-select-option value="senior">高级班</a-select-option>
              </a-select>
            </a-form-item>
  
            <a-form-item label="任课教师" name="teacher">
              <a-input 
                v-model:value="formData.teacher" 
                placeholder="请输入教师姓名"
                class="rounded-lg"
              />
            </a-form-item>
  
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
            
            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="课程容量" name="capacity">
                <a-input-number 
                  v-model:value="formData.capacity" 
                  :min="1"
                  :max="100"
                  placeholder="人数"
                  class="w-full rounded-lg"
                />
              </a-form-item>
  
              <a-form-item label="学分" name="credits">
                <a-input-number 
                  v-model:value="formData.credits" 
                  :min="1"
                  :max="10"
                  placeholder="学分"
                  class="w-full rounded-lg"
                />
              </a-form-item>
            </div>
  
            <a-form-item label="课程费用" name="fee">
              <a-input-number 
                v-model:value="formData.fee" 
                :min="0"
                placeholder="元/学期"
                class="w-full rounded-lg"
              />
            </a-form-item>
  
            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="开课日期" name="startDate">
                <a-date-picker 
                  v-model:value="formData.startDate" 
                  placeholder="选择开课日期"
                  class="w-full rounded-lg"
                />
              </a-form-item>
  
              <a-form-item label="结课日期" name="endDate">
                <a-date-picker 
                  v-model:value="formData.endDate" 
                  placeholder="选择结课日期"
                  class="w-full rounded-lg"
                />
              </a-form-item>
            </div>
  
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
                <a-select-option value="pending">待开课</a-select-option>
                <a-select-option value="active">进行中</a-select-option>
                <a-select-option value="completed">已结课</a-select-option>
                <a-select-option value="cancelled">已取消</a-select-option>
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
                <a-select-option value="evening">晚上</a-select-option>
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
  import type { Course, CourseCategory, CourseLevel, TimeSlot, AgeRestriction } from '@/types/index'
  
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
  
  // 表单数据
const formData = reactive({
  name: '',
  courseId: '',
  description: '',
  category: '' as CourseCategory,
  level: '' as CourseLevel,
  teacher: '',
  credits: 2,
  capacity: 30,
  location: '',
  fee: 200,
  startDate: null as any,
  endDate: null as any,
  semester: '2024秋季',
  status: 'pending' as const,
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
    period: 'morning' | 'afternoon' | 'evening'
  }>
})
  
  // 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入课程名称', trigger: 'blur' }
  ],
  courseId: [
    { required: true, message: '请输入课程编号', trigger: 'blur' },
    { pattern: /^[A-Z]{2,3}\d{3}$/, message: '课程编号格式：如MUS001', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择课程分类', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择课程级别', trigger: 'change' }
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
  credits: [
    { required: true, message: '请输入学分', trigger: 'blur' }
  ],
  fee: [
    { required: true, message: '请输入课程费用', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开课日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结课日期', trigger: 'change' }
  ],
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
    courseId: '',
    description: '',
    category: '',
    level: '',
    teacher: '',
    credits: 2,
    capacity: 30,
    location: '',
    fee: 200,
    startDate: null,
    endDate: null,
    semester: '2024秋季',
    status: 'pending',
    ageRestriction: {
      enabled: false,
      minAge: undefined,
      maxAge: undefined,
      description: ''
    },
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
      period: 'morning' | 'afternoon' | 'evening'
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
      startDate: newCourse.startDate ? dayjs(newCourse.startDate) : null,
      endDate: newCourse.endDate ? dayjs(newCourse.endDate) : null,
      timeSlots: newCourse.timeSlots.map(slot => ({
        ...slot,
        startTime: dayjs(slot.startTime, 'HH:mm'),
        endTime: dayjs(slot.endTime, 'HH:mm')
      }))
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
      
      // 构造课程数据
      const courseData: Partial<Course> = {
        ...formData,
        startDate: formData.startDate?.format('YYYY-MM-DD'),
        endDate: formData.endDate?.format('YYYY-MM-DD'),
        timeSlots: validTimeSlots.map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime.format('HH:mm'),
          endTime: slot.endTime.format('HH:mm'),
          period: slot.period
        })),
        enrolled: props.course?.enrolled || 0,
        teacherId: props.course?.teacherId || Math.floor(Math.random() * 1000),
        id: props.course?.id || Date.now(),
        createdAt: props.course?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      message.success(props.course ? '课程更新成功' : '课程创建成功')
      emit('success', courseData as Course)
      
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
