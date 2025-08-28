<template>
  <div class="mobile-registration min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div class="flex items-center justify-between px-4 py-3">
        <button @click="handleBack" class="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
          <i class="fas fa-arrow-left text-lg mr-2"></i>
          <span class="font-medium">返回</span>
        </button>
        <h1 class="text-lg font-semibold text-gray-900">学员报名</h1>
        <div class="w-16"></div> <!-- 占位符保持居中 -->
      </div>
    </div>

    <!-- 进度指示器 -->
    <div class="bg-white px-4 py-3 border-b border-gray-200">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-500">进度</span>
        <span class="font-medium text-blue-600">{{ currentStep }}/{{ totalSteps }}</span>
      </div>
      <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>
    </div>

    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
      @finish="handleSubmit"
      class="flex-1"
    >
      <!-- 步骤1：基本信息 -->
      <div v-show="currentStep === 1" class="p-4 space-y-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 class="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
          
          <!-- 姓名 -->
          <a-form-item name="name" label="姓名" class="mb-4">
            <a-input 
              v-model:value="formData.name" 
              placeholder="请输入真实姓名" 
              size="large"
              class="rounded-lg"
            />
          </a-form-item>

          <!-- 性别 -->
          <a-form-item name="gender" label="性别" class="mb-4">
            <a-radio-group v-model:value="formData.gender" size="large" class="w-full">
              <a-radio value="男" class="flex-1 text-center mr-4">男</a-radio>
              <a-radio value="女" class="flex-1 text-center">女</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 出生日期 -->
          <a-form-item name="birthDate" label="出生日期" class="mb-4">
            <a-date-picker 
              v-model:value="formData.birthDate" 
              placeholder="将从身份证号码自动提取"
              size="large"
              format="YYYY-MM-DD"
              class="w-full rounded-lg"
              disabled
              :allow-clear="false"
            />
            <div class="text-xs text-gray-500 mt-1">💡 出生日期将根据身份证号码自动填写</div>
          </a-form-item>

          <!-- 身份证号 -->
          <a-form-item name="idNumber" label="身份证号" class="mb-4">
            <a-input 
              v-model:value="formData.idNumber" 
              placeholder="请输入身份证号码" 
              size="large"
              class="rounded-lg"
              :maxlength="18"
              @input="handleIdNumberInput"
            />
          </a-form-item>

          <!-- 民族 -->
          <a-form-item name="ethnicity" label="民族" class="mb-4">
            <a-select 
              v-model:value="formData.ethnicity" 
              placeholder="请选择民族"
              size="large"
              class="w-full"
              :options="ethnicityOptions"
            />
          </a-form-item>

          <!-- 健康状况 -->
          <a-form-item name="healthStatus" label="健康状况" class="mb-0">
            <a-select 
              v-model:value="formData.healthStatus" 
              placeholder="请选择健康状况"
              size="large"
              class="w-full"
              :options="healthStatusOptions"
            />
          </a-form-item>
        </div>
      </div>

      <!-- 步骤2：教育和工作信息 -->
      <div v-show="currentStep === 2" class="p-4 space-y-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 class="text-lg font-medium text-gray-900 mb-4">教育和工作信息</h2>
          
          <!-- 文化程度 -->
          <a-form-item name="educationLevel" label="文化程度" class="mb-4">
            <a-select 
              v-model:value="formData.educationLevel" 
              placeholder="请选择文化程度"
              size="large"
              class="w-full"
              :options="educationLevelOptions"
            />
          </a-form-item>

          <!-- 政治面貌 -->
          <a-form-item name="politicalStatus" label="政治面貌" class="mb-4">
            <a-select 
              v-model:value="formData.politicalStatus" 
              placeholder="请选择政治面貌"
              size="large"
              class="w-full"
              :options="politicalStatusOptions"
            />
          </a-form-item>

          <!-- 是否在职 -->
          <a-form-item name="isRetired" label="工作状态" class="mb-4">
            <a-radio-group v-model:value="formData.isRetired" size="large" class="w-full">
              <a-radio :value="false" class="block mb-2">在职</a-radio>
              <a-radio :value="true" class="block">退休</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 保险类别 -->
          <a-form-item name="retirementCategory" label="保险类别" class="mb-0">
            <a-select 
              v-model:value="formData.retirementCategory" 
              placeholder="请选择保险类别"
              size="large"
              class="w-full"
              :options="retirementCategoryOptions"
            />
          </a-form-item>
        </div>
      </div>

      <!-- 步骤3：课程选择 -->
      <div v-show="currentStep === 3" class="p-4 space-y-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 class="text-lg font-medium text-gray-900 mb-4">课程选择</h2>
          
          <!-- 学期选择 -->
          <a-form-item name="semester" label="学期" class="mb-4">
            <a-select
              v-model:value="formData.semester"
              placeholder="请选择学期"
              size="large"
              :options="semesterOptions"
              :loading="loading.semesters"
              @change="handleSemesterChange"
              class="rounded-lg"
            />
          </a-form-item>
          
          <!-- 可用课程列表 -->
          <a-form-item name="selectedCourses" label="选择课程（最多2门）" class="mb-4">
            <div v-if="loading.courses" class="text-center py-8">
              <a-spin size="large" />
              <p class="mt-2 text-gray-500">加载课程中...</p>
            </div>
            <div v-else-if="!formData.semester" class="text-center py-8">
              <i class="fas fa-calendar-alt text-4xl text-gray-300 mb-2"></i>
              <p class="text-gray-500">请先选择学期</p>
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="course in availableCourses" 
                :key="course.id"
                :class="[
                  'border-2 rounded-lg p-4 cursor-pointer transition-all',
                  formData.selectedCourses.includes(course.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                ]"
                @click="handleCourseSelect(course.id)"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-900">{{ course.name }}</h3>
                    <p class="text-sm text-gray-600 mt-1">{{ course.description }}</p>
                    <div class="flex items-center mt-2 text-xs text-gray-500">
                      <span class="mr-3">
                        <i class="fas fa-clock mr-1"></i>{{ course.hours || 0 }}学时
                      </span>
                      <span class="mr-3">
                        <i class="fas fa-calendar mr-1"></i>{{ course.startDate || '待定' }}
                      </span>
                      <span>
                        <i class="fas fa-users mr-1"></i>{{ course.enrolled || 0 }}/{{ course.capacity || 0 }}
                      </span>
                    </div>
                    <!-- 年龄限制显示 -->
                    <div v-if="getAgeRestrictionHint(course)" class="mt-1 text-xs text-orange-600">
                      <i class="fas fa-exclamation-triangle mr-1"></i>{{ getAgeRestrictionHint(course) }}
                    </div>
                    <!-- 年龄不符提示 -->
                    <div v-if="!isCourseAgeEligible(course)" class="mt-1 text-xs text-red-600">
                      <i class="fas fa-ban mr-1"></i>年龄不符合要求
                    </div>
                  </div>
                  <div class="ml-3">
                    <i 
                      :class="[
                        'fas text-lg',
                        formData.selectedCourses.includes(course.id) 
                          ? 'fa-check-circle text-blue-500' 
                          : 'fa-circle text-gray-300'
                      ]"
                    ></i>
                  </div>
                </div>
              </div>
              <p v-if="availableCourses.length === 0" class="text-center text-gray-500 py-8">
                暂无可报名课程
              </p>
            </div>
          </a-form-item>

          <!-- 学习期间（保险有效期）-->
          <div class="grid grid-cols-2 gap-3">
            <a-form-item name="studyPeriodStart" label="保险开始日期" class="mb-4">
              <a-date-picker 
                v-model:value="formData.studyPeriodStart" 
                placeholder="开始日期"
                size="large"
                format="YYYY-MM-DD"
                class="w-full rounded-lg"
              />
            </a-form-item>
            <a-form-item name="studyPeriodEnd" label="保险结束日期" class="mb-4">
              <a-date-picker 
                v-model:value="formData.studyPeriodEnd" 
                placeholder="结束日期"
                size="large"
                format="YYYY-MM-DD"
                class="w-full rounded-lg"
              />
            </a-form-item>
          </div>

          <!-- 超龄协议 -->
          <a-form-item name="agreementSigned" label="超龄协议" class="mb-0">
            <a-radio-group v-model:value="formData.agreementSigned" size="large">
              <a-radio :value="true" class="block mb-2">已签订超龄协议</a-radio>
              <a-radio :value="false" class="block">无需签订</a-radio>
            </a-radio-group>
          </a-form-item>
        </div>
      </div>

      <!-- 步骤4：联系信息 -->
      <div v-show="currentStep === 4" class="p-4 space-y-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 class="text-lg font-medium text-gray-900 mb-4">联系信息</h2>
          
          <!-- 现居住地址 -->
          <a-form-item name="familyAddress" label="现居住地址" class="mb-4">
            <a-textarea 
              v-model:value="formData.familyAddress" 
              placeholder="请输入详细地址" 
              :rows="3"
              size="large"
              class="rounded-lg"
            />
          </a-form-item>

          <!-- 联系电话 -->
          <a-form-item name="familyPhone" label="联系电话" class="mb-4">
            <a-input 
              v-model:value="formData.familyPhone" 
              placeholder="请输入手机号码" 
              size="large"
              class="rounded-lg"
            />
          </a-form-item>

          <!-- 紧急联系人 -->
          <a-form-item name="emergencyContact" label="紧急联系人" class="mb-4">
            <a-input 
              v-model:value="formData.emergencyContact" 
              placeholder="请输入紧急联系人姓名" 
              size="large"
              class="rounded-lg"
            />
          </a-form-item>

          <!-- 紧急联系电话 -->
          <a-form-item name="emergencyPhone" label="紧急联系电话" class="mb-4">
            <a-input 
              v-model:value="formData.emergencyPhone" 
              placeholder="请输入紧急联系人电话" 
              size="large"
              class="rounded-lg"
            />
          </a-form-item>

          <!-- 备注 -->
          <a-form-item name="remarks" label="备注" class="mb-0">
            <a-textarea 
              v-model:value="formData.remarks" 
              placeholder="其他需要说明的信息（选填）" 
              :rows="3"
              size="large"
              class="rounded-lg"
            />
          </a-form-item>
        </div>
      </div>
    </a-form>

    <!-- 底部操作按钮 -->
    <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4">
      <div class="flex gap-3">
        <a-button 
          v-if="currentStep > 1"
          @click="prevStep"
          size="large"
          class="flex-1 rounded-lg"
        >
          上一步
        </a-button>
        <a-button 
          v-if="currentStep < totalSteps"
          @click="nextStep"
          type="primary"
          size="large"
          class="flex-1 rounded-lg"
        >
          下一步
        </a-button>
        <a-button 
          v-if="currentStep === totalSteps"
          @click="handleSubmit"
          type="primary"
          size="large"
          :loading="loading.submit"
          class="flex-1 rounded-lg"
        >
          提交报名
        </a-button>
      </div>
    </div>

    <!-- 成功提示弹窗 -->
    <a-modal
      v-model:open="successModal.visible"
      title="报名提交成功"
      :footer="null"
      :closable="false"
      centered
      width="90%"
      :max-width="400"
    >
      <div class="text-center py-4">
        <div class="mb-4">
          <i class="fas fa-check-circle text-5xl text-green-500"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">报名申请已提交</h3>
        <p class="text-gray-600 mb-4">
          您的报名申请已成功提交，我们会在1-2个工作日内审核您的申请。
          审核结果将通过短信或电话通知您。
        </p>
        <div class="bg-gray-50 rounded-lg p-3 mb-4">
          <div class="text-sm text-gray-600 space-y-1">
            <div>报名课程：{{ successModal.coursesCount }}门</div>
            <div>学员ID：{{ successModal.studentId }}</div>
          </div>
        </div>
        <a-button 
          type="primary" 
          size="large" 
          @click="handleReturnHome"
          class="w-full rounded-lg"
        >
          返回首页
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 手机端报名登记页面
 * @component MobileRegistration
 * @description 为学员提供移动端优化的报名登记体验，采用分步表单设计
 */
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ApplicationService } from '@/api/application'
import { CourseService } from '@/api/course'
import type { Course } from '@/api/course'
import { calculateAge, checkAgeRestriction, getAgeRestrictionHint } from '@/utils/ageUtils'

// 路由实例
const router = useRouter()

// 表单引用
const formRef = ref()

// 步骤控制
const currentStep = ref<number>(1)
const totalSteps = ref<number>(4)

// 加载状态
const loading = reactive({
  semesters: false,
  courses: false,
  submit: false
})

// 学期选项
const semesterOptions = ref<Array<{ label: string; value: string }>>([]);

// 可用课程
const availableCourses = ref<Course[]>([])

// 表单数据
const formData = reactive({
  // 基本信息
  name: '',
  gender: '',
  birthDate: null as Dayjs | null,
  idNumber: '',
  ethnicity: '',
  healthStatus: '',
  
  // 教育和工作信息
  educationLevel: '',
  politicalStatus: '',
  isRetired: false,
  retirementCategory: '',
  
  // 学期选择
  semester: '',
  
  // 课程选择
  selectedCourses: [] as string[],
  studyPeriodStart: null as Dayjs | null,
  studyPeriodEnd: null as Dayjs | null,
  agreementSigned: false,
  
  // 联系信息
  familyAddress: '',
  familyPhone: '',
  emergencyContact: '',
  emergencyPhone: '',
  remarks: ''
})

// 成功弹窗
const successModal = reactive({
  visible: false,
  studentId: '',
  coursesCount: 0
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2-20个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  birthDate: [
    { required: true, message: '请选择出生日期', trigger: 'change' }
  ],
  ethnicity: [
    { required: true, message: '请选择民族', trigger: 'change' }
  ],
  healthStatus: [
    { required: true, message: '请选择健康状况', trigger: 'change' }
  ],
  educationLevel: [
    { required: true, message: '请选择文化程度', trigger: 'change' }
  ],
  politicalStatus: [
    { required: true, message: '请选择政治面貌', trigger: 'change' }
  ],
  idNumber: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  isRetired: [
    { required: true, message: '请选择工作状态', trigger: 'change' }
  ],
  retirementCategory: [
    { required: true, message: '请选择保险类别', trigger: 'change' }
  ],
  semester: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ],
  selectedCourses: [
    { required: true, message: '请选择至少一门课程', trigger: 'change' },
    { type: 'array', min: 1, max: 2, message: '请选择1-2门课程', trigger: 'change' }
  ],
  studyPeriodStart: [
    { required: true, message: '请选择保险开始日期', trigger: 'change' }
  ],
  studyPeriodEnd: [
    { required: true, message: '请选择保险结束日期', trigger: 'change' }
  ],
  agreementSigned: [
    { required: true, message: '请选择是否签订超龄协议', trigger: 'change' }
  ],
  familyAddress: [
    { required: true, message: '请输入现居住地址', trigger: 'blur' },
    { min: 5, max: 200, message: '地址长度在5-200个字符', trigger: 'blur' }
  ],
  familyPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  emergencyContact: [
    { required: true, message: '请输入紧急联系人', trigger: 'blur' },
    { min: 2, max: 10, message: '联系人姓名长度在2-10个字符', trigger: 'blur' }
  ],
  emergencyPhone: [
    { required: true, message: '请输入紧急联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '紧急联系电话格式不正确', trigger: 'blur' }
  ]
}

// 选项数据
const ethnicityOptions = [
  { value: '汉族', label: '汉族' },
  { value: '蒙古族', label: '蒙古族' },
  { value: '回族', label: '回族' },
  { value: '藏族', label: '藏族' },
  { value: '维吾尔族', label: '维吾尔族' },
  { value: '苗族', label: '苗族' },
  { value: '彝族', label: '彝族' },
  { value: '壮族', label: '壮族' },
  { value: '布依族', label: '布依族' },
  { value: '朝鲜族', label: '朝鲜族' },
  { value: '满族', label: '满族' },
  { value: '侗族', label: '侗族' },
  { value: '瑶族', label: '瑶族' },
  { value: '白族', label: '白族' },
  { value: '土家族', label: '土家族' },
  { value: '哈尼族', label: '哈尼族' },
  { value: '哈萨克族', label: '哈萨克族' },
  { value: '傣族', label: '傣族' },
  { value: '黎族', label: '黎族' },
  { value: '傈僳族', label: '傈僳族' },
  { value: '佤族', label: '佤族' },
  { value: '畲族', label: '畲族' },
  { value: '高山族', label: '高山族' },
  { value: '拉祜族', label: '拉祜族' },
  { value: '水族', label: '水族' },
  { value: '东乡族', label: '东乡族' },
  { value: '纳西族', label: '纳西族' },
  { value: '景颇族', label: '景颇族' },
  { value: '柯尔克孜族', label: '柯尔克孜族' },
  { value: '土族', label: '土族' },
  { value: '达斡尔族', label: '达斡尔族' },
  { value: '仫佬族', label: '仫佬族' },
  { value: '羌族', label: '羌族' },
  { value: '布朗族', label: '布朗族' },
  { value: '撒拉族', label: '撒拉族' },
  { value: '毛南族', label: '毛南族' },
  { value: '仡佬族', label: '仡佬族' },
  { value: '锡伯族', label: '锡伯族' },
  { value: '阿昌族', label: '阿昌族' },
  { value: '普米族', label: '普米族' },
  { value: '塔吉克族', label: '塔吉克族' },
  { value: '怒族', label: '怒族' },
  { value: '乌孜别克族', label: '乌孜别克族' },
  { value: '俄罗斯族', label: '俄罗斯族' },
  { value: '鄂温克族', label: '鄂温克族' },
  { value: '德昂族', label: '德昂族' },
  { value: '保安族', label: '保安族' },
  { value: '裕固族', label: '裕固族' },
  { value: '京族', label: '京族' },
  { value: '塔塔尔族', label: '塔塔尔族' },
  { value: '独龙族', label: '独龙族' },
  { value: '鄂伦春族', label: '鄂伦春族' },
  { value: '赫哲族', label: '赫哲族' },
  { value: '门巴族', label: '门巴族' },
  { value: '珞巴族', label: '珞巴族' },
  { value: '基诺族', label: '基诺族' },
  { value: '其他', label: '其他' }
]

const healthStatusOptions = [
  { value: '健康', label: '健康' },
  { value: '良好', label: '良好' },
  { value: '一般', label: '一般' },
  { value: '较差', label: '较差' }
]

const educationLevelOptions = [
  { value: '小学', label: '小学' },
  { value: '初中', label: '初中' },
  { value: '高中/中专', label: '高中/中专' },
  { value: '大专', label: '大专' },
  { value: '本科', label: '本科' },
  { value: '硕士', label: '硕士' },
  { value: '博士', label: '博士' }
]

const politicalStatusOptions = [
  { value: '群众', label: '群众' },
  { value: '共青团员', label: '共青团员' },
  { value: '中共党员', label: '中共党员' },
  { value: '民革会员', label: '民革会员' },
  { value: '民盟会员', label: '民盟会员' },
  { value: '民建会员', label: '民建会员' },
  { value: '民进会员', label: '民进会员' },
  { value: '农工党员', label: '农工党员' },
  { value: '致公党员', label: '致公党员' },
  { value: '九三学社社员', label: '九三学社社员' },
  { value: '台盟盟员', label: '台盟盟员' },
  { value: '无党派人士', label: '无党派人士' }
]

const retirementCategoryOptions = [
  { value: '企业退休', label: '企业退休' },
  { value: '机关退休', label: '机关退休' },
  { value: '事业单位退休', label: '事业单位退休' },
  { value: '军队退休', label: '军队退休' },
  { value: '灵活就业', label: '灵活就业' },
  { value: '城乡居民', label: '城乡居民' },
  { value: '其他', label: '其他' }
]

/**
 * 检查课程年龄限制
 * @param course 课程对象
 * @returns 是否符合年龄要求
 */
const isCourseAgeEligible = (course: Course): boolean => {
  if (!formData.birthDate) return true // 未填写出生日期时不限制
  
  const studentAge = calculateAge(formData.birthDate)
  const courseData = course as any
  const ageCheck = checkAgeRestriction(studentAge, {
    enabled: courseData.ageRestriction?.enabled || courseData.hasAgeRestriction,
    minAge: courseData.ageRestriction?.minAge || courseData.minAge,
    maxAge: courseData.ageRestriction?.maxAge || courseData.maxAge,
    description: courseData.ageRestriction?.description || courseData.ageDescription
  })
  
  return ageCheck.isEligible
}



/**
 * 处理课程选择
 * @param courseId 课程ID
 */
const handleCourseSelect = (courseId: string): void => {
  const index = formData.selectedCourses.indexOf(courseId)
  if (index > -1) {
    // 取消选择
    formData.selectedCourses.splice(index, 1)
  } else {
    // 选择课程
    if (formData.selectedCourses.length >= 2) {
      message.warning('最多只能选择2门课程')
      return
    }
    
    // 检查年龄限制
    const course = availableCourses.value.find(c => c.id === courseId)
    if (course && !isCourseAgeEligible(course)) {
      const studentAge = formData.birthDate ? calculateAge(formData.birthDate) : 0
      const courseData = course as any
      const ageCheck = checkAgeRestriction(studentAge, {
        enabled: courseData.ageRestriction?.enabled || courseData.hasAgeRestriction,
        minAge: courseData.ageRestriction?.minAge || courseData.minAge,
        maxAge: courseData.ageRestriction?.maxAge || courseData.maxAge,
        description: courseData.ageRestriction?.description || courseData.ageDescription
      })
      message.error(ageCheck.message || '您的年龄不符合该课程的报名要求')
      return
    }
    
    formData.selectedCourses.push(courseId)
  }
}

/**
 * 下一步
 */
const nextStep = async (): Promise<void> => {
  try {
    // 验证当前步骤的字段
    await validateCurrentStep()
    
    if (currentStep.value < totalSteps.value) {
      currentStep.value++
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

/**
 * 上一步
 */
const prevStep = (): void => {
  if (currentStep.value > 1) {
    currentStep.value--
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/**
 * 验证当前步骤
 */
const validateCurrentStep = async (): Promise<void> => {
  const fieldsToValidate: string[] = []
  
  switch (currentStep.value) {
    case 1:
      fieldsToValidate.push('name', 'gender', 'birthDate', 'idNumber', 'ethnicity', 'healthStatus')
      break
    case 2:
      fieldsToValidate.push('educationLevel', 'politicalStatus', 'isRetired', 'retirementCategory')
      break
    case 3:
      fieldsToValidate.push('semester', 'selectedCourses', 'studyPeriodStart', 'studyPeriodEnd', 'agreementSigned')
      break
    case 4:
      fieldsToValidate.push('familyAddress', 'familyPhone', 'emergencyContact', 'emergencyPhone')
      break
  }
  
  return formRef.value?.validateFields(fieldsToValidate)
}

/**
 * 提交表单
 */
const handleSubmit = async (): Promise<void> => {
  try {
    // 验证所有字段
    await formRef.value?.validate()
    
    loading.submit = true
    
    // 构建提交数据（保持前端字段名）
    const submitData = {
      name: formData.name,
      gender: formData.gender,
      birthDate: formData.birthDate?.format('YYYY-MM-DD'),
      idNumber: formData.idNumber,
      ethnicity: formData.ethnicity,
      healthStatus: formData.healthStatus,
      educationLevel: formData.educationLevel,
      politicalStatus: formData.politicalStatus,
      isRetired: formData.isRetired,
      retirementCategory: formData.retirementCategory,
      selectedCourses: formData.selectedCourses,
      studyPeriodStart: formData.studyPeriodStart?.format('YYYY-MM-DD'),
      studyPeriodEnd: formData.studyPeriodEnd?.format('YYYY-MM-DD'),
      agreementSigned: formData.agreementSigned,
      idCardAddress: formData.familyAddress, // 使用前端字段名
      familyPhone: formData.familyPhone,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      remarks: formData.remarks
    }
    
    console.log('提交报名数据:', submitData)
    
    // 调用匿名报名API提交（V2版本，支持年级管理）
    const response = await ApplicationService.submitAnonymousApplicationV2(submitData)
    
    if (response.code === 200) {
      // 显示成功弹窗
      successModal.visible = true
      successModal.studentId = String(response.data?.studentId || '')
      successModal.coursesCount = formData.selectedCourses.length
    } else {
      message.error(response.message || '提交失败，请重试')
    }
  } catch (error: any) {
    console.error('提交失败:', error)
    message.error('提交失败，请检查表单信息')
  } finally {
    loading.submit = false
  }
}

/**
 * 返回上一页
 */
const handleBack = (): void => {
  router.back()
}

/**
 * 返回首页
 */
const handleReturnHome = (): void => {
  router.push('/')
}



/**
 * 加载学期列表
 */
const loadSemesters = async (): Promise<void> => {
  try {
    loading.semesters = true
    const response = await CourseService.getSemesters()
    
    if (response.code === 200) {
      semesterOptions.value = response.data.map((semester: string) => ({
        label: semester,
        value: semester
      }))
      
      // 如果只有一个学期，自动选择
      if (semesterOptions.value.length === 1) {
        formData.semester = semesterOptions.value[0].value
        await loadCourses()
      }
    }
  } catch (error: any) {
    console.error('获取学期列表失败:', error)
    message.error('获取学期列表失败')
  } finally {
    loading.semesters = false
  }
}

/**
 * 处理学期变更
 */
const handleSemesterChange = async (): Promise<void> => {
  // 清空已选课程
  formData.selectedCourses = []
  
  // 重新加载该学期的课程
  await loadCourses()
}

/**
 * 加载可选课程
 */
const loadCourses = async (): Promise<void> => {
  if (!formData.semester) {
    availableCourses.value = []
    return
  }
  
  try {
    loading.courses = true
    const response = await CourseService.getCourses({
      page: 1,
      pageSize: 100,
      status: 'PUBLISHED'
    })
    
    if (response.code === 200) {
      availableCourses.value = response.data.list || []
    }
  } catch (error: any) {
    console.error('加载课程失败:', error)
    message.error('加载课程失败')
  } finally {
    loading.courses = false
  }
}

/**
 * 监听出生日期变化，重新验证课程年龄限制
 */
watch(() => formData.birthDate, () => {
  // 检查已选课程是否仍符合年龄要求
  if (formData.selectedCourses.length > 0 && formData.birthDate) {
    const studentAge = calculateAge(formData.birthDate)
    const invalidCourses: string[] = []
    
    formData.selectedCourses.forEach(courseId => {
      const course = availableCourses.value.find(c => c.id === courseId)
      if (course && !isCourseAgeEligible(course)) {
        invalidCourses.push(courseId)
      }
    })
    
    // 移除不符合年龄要求的课程
    if (invalidCourses.length > 0) {
      formData.selectedCourses = formData.selectedCourses.filter(id => !invalidCourses.includes(id))
      const courseNames = invalidCourses.map(id => {
        const course = availableCourses.value.find(c => c.id === id)
        return course?.name || '未知课程'
      }).join('、')
      message.warning(`根据您的年龄，已自动移除不符合要求的课程：${courseNames}`)
    }
  }
})

/**
 * 从身份证号码中提取出生日期
 * @param idNumber 身份证号码
 * @returns Dayjs对象或null
 */
const extractBirthDateFromId = (idNumber: string): Dayjs | null => {
  if (!idNumber) return null
  
  try {
    if (idNumber.length === 18) {
      // 18位身份证：第7-14位是出生日期 YYYYMMDD
      const birthStr = idNumber.substring(6, 14)
      if (birthStr.length === 8) {
        const year = parseInt(birthStr.substring(0, 4))
        const month = parseInt(birthStr.substring(4, 6))
        const day = parseInt(birthStr.substring(6, 8))
        
        // 验证日期的合理性
        if (year >= 1900 && year <= new Date().getFullYear() && 
            month >= 1 && month <= 12 && 
            day >= 1 && day <= 31) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          return dayjs(dateStr)
        }
      }
    } else if (idNumber.length === 15) {
      // 15位身份证：第7-12位是出生日期 YYMMDD
      const birthStr = idNumber.substring(6, 12)
      if (birthStr.length === 6) {
        let year = parseInt(birthStr.substring(0, 2))
        const month = parseInt(birthStr.substring(2, 4))
        const day = parseInt(birthStr.substring(4, 6))
        
        // 15位身份证的年份判断：00-09为2000-2009，10-99为1910-1999
        year = year <= 9 ? 2000 + year : 1900 + year
        
        // 验证日期的合理性
        if (year >= 1900 && year <= new Date().getFullYear() && 
            month >= 1 && month <= 12 && 
            day >= 1 && day <= 31) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          return dayjs(dateStr)
        }
      }
    }
  } catch (error) {
    console.error('解析身份证出生日期失败:', error)
  }
  
  return null
}

/**
 * 处理身份证号码输入
 */
const handleIdNumberInput = (): void => {
  // 当身份证号码长度足够时，自动提取出生日期
  if (formData.idNumber && (formData.idNumber.length === 15 || formData.idNumber.length === 18)) {
    const birthDate = extractBirthDateFromId(formData.idNumber)
    if (birthDate) {
      formData.birthDate = birthDate
      console.log('🎉 已从身份证号码自动提取出生日期:', birthDate.format('YYYY-MM-DD'))
    } else {
      console.warn('⚠️ 身份证号码中的出生日期格式不正确')
    }
  }
}

// 组件挂载时获取学期列表
onMounted(() => {
  loadSemesters()
})
</script>

<style scoped>
/* 移动端优化样式 */
.mobile-registration {
  max-width: 100vw;
  overflow-x: hidden;
}

/* 表单项间距调整 */
.mobile-registration :deep(.ant-form-item) {
  margin-bottom: 16px;
}

/* 单选按钮组样式优化 */
.mobile-registration :deep(.ant-radio-group) {
  width: 100%;
}

.mobile-registration :deep(.ant-radio-wrapper) {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-right: 12px;
  transition: all 0.2s;
}

.mobile-registration :deep(.ant-radio-wrapper:hover) {
  border-color: #3b82f6;
}

.mobile-registration :deep(.ant-radio-wrapper-checked) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

/* 选择器样式优化 */
.mobile-registration :deep(.ant-select-selector),
.mobile-registration :deep(.ant-picker) {
  border-radius: 8px !important;
  border: 1px solid #d1d5db !important;
}

.mobile-registration :deep(.ant-select-selector:hover),
.mobile-registration :deep(.ant-picker:hover) {
  border-color: #9ca3af !important;
}

.mobile-registration :deep(.ant-select-focused .ant-select-selector),
.mobile-registration :deep(.ant-picker-focused) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

/* 输入框样式优化 */
.mobile-registration :deep(.ant-input),
.mobile-registration :deep(.ant-input-affix-wrapper) {
  border-radius: 8px !important;
  border: 1px solid #d1d5db !important;
}

.mobile-registration :deep(.ant-input:hover),
.mobile-registration :deep(.ant-input-affix-wrapper:hover) {
  border-color: #9ca3af !important;
}

.mobile-registration :deep(.ant-input:focus),
.mobile-registration :deep(.ant-input-affix-wrapper-focused) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

/* 按钮样式优化 */
.mobile-registration :deep(.ant-btn) {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.mobile-registration :deep(.ant-btn-primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.mobile-registration :deep(.ant-btn-primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* 模态框样式调整 */
.mobile-registration :deep(.ant-modal) {
  margin: 0;
  padding: 16px;
}

@media (max-width: 640px) {
  .mobile-registration :deep(.ant-modal) {
    max-width: 90vw !important;
    width: 90vw !important;
  }
}
</style>
