<template>
  <div class="application-form">
    <!-- 表单头部 -->
    <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">学员报名登记</h1>
          <p class="text-blue-100">请填写完整的报名信息，带*为必填项</p>
        </div>
        <div class="text-6xl opacity-20">
          📝
        </div>
      </div>
    </div>

    <!-- 报名表单 -->
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @finish="handleSubmit"
        @finish-failed="handleSubmitFailed"
      >
        <!-- 基本信息 -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-user text-blue-500 mr-3"></i>
            基本信息
          </h3>

          <!-- 身份证读卡器 -->
          <div class="mb-6">
            <IdCardReader 
              @dataRead="handleIdCardDataRead"
              @error="handleReaderError"
            />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 姓名 -->
            <a-form-item label="姓名" name="name" required>
              <a-input
                v-model:value="formData.name"
                placeholder="请输入真实姓名"
                size="large"
                :maxlength="20"
              />
            </a-form-item>

            <!-- 性别 -->
            <a-form-item label="性别" name="gender" required>
              <a-radio-group v-model:value="formData.gender" size="large">
                <a-radio value="男">男</a-radio>
                <a-radio value="女">女</a-radio>
              </a-radio-group>
            </a-form-item>

            <!-- 出生年月 -->
            <a-form-item label="出生年月" name="birthDate" required>
              <a-date-picker
                v-model:value="formData.birthDate"
                placeholder="选择出生日期"
                size="large"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </a-form-item>

            <!-- 民族 -->
            <a-form-item label="民族" name="ethnicity" required>
              <a-select
                v-model:value="formData.ethnicity"
                placeholder="请选择民族"
                size="large"
                :options="ethnicityOptions"
              />
            </a-form-item>

            <!-- 文化程度 -->
            <a-form-item label="文化程度" name="educationLevel" required>
              <a-select
                v-model:value="formData.educationLevel"
                placeholder="请选择文化程度"
                size="large"
                :options="educationOptions"
              />
            </a-form-item>

            <!-- 政治面貌 -->
            <a-form-item label="政治面貌" name="politicalStatus" required>
              <a-select
                v-model:value="formData.politicalStatus"
                placeholder="请选择政治面貌"
                size="large"
                :options="politicalStatusOptions"
              />
            </a-form-item>

            <!-- 身份证号 -->
            <a-form-item label="身份证号" name="idNumber" required>
              <a-input
                v-model:value="formData.idNumber"
                placeholder="请输入18位身份证号"
                size="large"
                :maxlength="18"
                @blur="handleIdNumberBlur"
              />
            </a-form-item>

            <!-- 健康状况 -->
            <a-form-item label="健康状况" name="healthStatus" required>
              <a-select
                v-model:value="formData.healthStatus"
                placeholder="请选择健康状况"
                size="large"
                :options="healthStatusOptions"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 学籍信息 -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-graduation-cap text-green-500 mr-3"></i>
            学籍信息
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 是否在职 -->
            <a-form-item label="是否在职" name="isRetired" required>
              <a-radio-group v-model:value="formData.isRetired" size="large">
                <a-radio :value="false">在职</a-radio>
                <a-radio :value="true">退休</a-radio>
              </a-radio-group>
            </a-form-item>

            <!-- 保险类别 -->
            <a-form-item label="保险类别" name="retirementCategory" required>
              <a-select
                v-model:value="formData.retirementCategory"
                placeholder="请选择保险类别"
                size="large"
                :options="retirementCategoryOptions"
              />
            </a-form-item>

            <!-- 所报专业 -->
            <a-form-item label="所报专业" name="major" required>
              <a-select
                v-model:value="formData.major"
                placeholder="请选择报名专业"
                size="large"
                :options="majorOptions"
                :loading="coursesLoading"
              />
            </a-form-item>

            <!-- 保险有效期 -->
            <a-form-item label="保险有效期" name="studyPeriod" required>
              <a-date-picker
                v-model:value="formData.studyPeriod"
                placeholder="选择有效期"
                size="large"
                style="width: 100%"
              />
            </a-form-item>

            <!-- 学员证号 -->
            <a-form-item label="学员证号" name="studentId">
              <a-input
                v-model:value="formData.studentId"
                placeholder="自动生成或手动输入"
                size="large"
                :maxlength="20"
              />
            </a-form-item>

            <!-- 是否签订超龄协议 -->
            <a-form-item label="是否签订超龄协议" name="agreementSigned" required>
              <a-radio-group v-model:value="formData.agreementSigned" size="large">
                <a-radio :value="true">是</a-radio>
                <a-radio :value="false">否</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>

        <!-- 联系信息 -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-phone text-orange-500 mr-3"></i>
            联系信息
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 家庭住址 -->
            <a-form-item label="家庭住址" name="familyAddress" required>
              <a-textarea
                v-model:value="formData.familyAddress"
                placeholder="请输入详细家庭住址"
                :rows="3"
                :maxlength="200"
                show-count
              />
            </a-form-item>

            <!-- 联系电话 -->
            <a-form-item label="联系电话" name="familyPhone" required>
              <a-input
                v-model:value="formData.familyPhone"
                placeholder="请输入联系电话"
                size="large"
                :maxlength="20"
              />
            </a-form-item>

            <!-- 家属姓名 -->
            <a-form-item label="家属姓名" name="emergencyContact" required>
              <a-input
                v-model:value="formData.emergencyContact"
                placeholder="请输入紧急联系人姓名"
                size="large"
                :maxlength="20"
              />
            </a-form-item>

            <!-- 家属联系电话 -->
            <a-form-item label="家属联系电话" name="emergencyPhone" required>
              <a-input
                v-model:value="formData.emergencyPhone"
                placeholder="请输入紧急联系人电话"
                size="large"
                :maxlength="20"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 照片上传 -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-camera text-purple-500 mr-3"></i>
            照片上传
          </h3>
          
          <a-form-item label="学员照片" name="photo">
            <div class="flex items-center space-x-6">
              <!-- 照片预览 -->
              <div class="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <img
                  v-if="formData.photo"
                  :src="formData.photo"
                  alt="学员照片"
                  class="w-full h-full object-cover rounded-lg"
                />
                <div v-else class="text-center text-gray-400">
                  <i class="fas fa-user text-4xl mb-2"></i>
                  <p class="text-sm">学员照片</p>
                </div>
              </div>
              
              <!-- 上传按钮 -->
              <div>
                <a-upload
                  :file-list="[]"
                  :before-upload="handlePhotoUpload"
                  accept="image/*"
                  :show-upload-list="false"
                >
                  <a-button type="primary" size="large" :loading="photoUploading">
                    <i class="fas fa-upload mr-2"></i>
                    {{ photoUploading ? '上传中...' : '选择照片' }}
                  </a-button>
                </a-upload>
                
                <div class="mt-2 text-sm text-gray-500">
                  <p>支持 JPG、PNG 格式</p>
                  <p>文件大小不超过 2MB</p>
                </div>
                
                <!-- 上传进度 -->
                <div v-if="photoUploading && uploadProgress > 0" class="mt-2">
                  <a-progress :percent="uploadProgress" size="small" />
                </div>
              </div>
            </div>
          </a-form-item>
        </div>

        <!-- 备注信息 -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-sticky-note text-yellow-500 mr-3"></i>
            备注信息
          </h3>
          
          <a-form-item label="备注" name="remarks">
            <a-textarea
              v-model:value="formData.remarks"
              placeholder="请输入其他需要说明的信息"
              :rows="4"
              :maxlength="500"
              show-count
            />
          </a-form-item>
        </div>

        <!-- 提交按钮 -->
        <div class="flex justify-center space-x-8">
          <a-button size="large" @click="handleReset" class="px-12">
            <i class="fas fa-undo mr-2"></i>
            重置表单
          </a-button>
          
          <a-button 
            type="primary" 
            size="large" 
            html-type="submit"
            :loading="submitting"
            class="px-12"
          >
            <i class="fas fa-paper-plane mr-2"></i>
            {{ submitting ? '提交中...' : '提交报名' }}
          </a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 报名表单组件
 * @component ApplicationForm
 * @description 基于老年大学报名表的完整报名表单
 */
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import ApplicationService from '@/api/application'
import type { StudentInfo, IdCardData } from '@/types'
import IdCardReader from './IdCardReader.vue'

// 表单引用
const formRef = ref()

// 表单数据
type ApplicationFormData = Omit<Partial<StudentInfo>, 'birthDate'> & {
  birthDate: string | Dayjs
  studyPeriod: string | Dayjs
}

const formData = reactive<ApplicationFormData>({
  name: '',
  gender: '男',
  birthDate: '',
  ethnicity: '',
  healthStatus: '',
  educationLevel: '',
  politicalStatus: '',
  idNumber: '',
  isRetired: false,
  retirementCategory: '',
  major: '',
  studyPeriod: '',
  studentId: '',
  agreementSigned: false,
  familyAddress: '',
  familyPhone: '',
  emergencyContact: '',
  emergencyPhone: '',
  photo: '',
  remarks: ''
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
    { required: true, message: '请选择是否在职', trigger: 'change' }
  ],
  retirementCategory: [
    { required: true, message: '请选择保险类别', trigger: 'change' }
  ],
  major: [
    { required: true, message: '请选择报名专业', trigger: 'change' }
  ],
  studyPeriod: [
    { required: true, message: '请选择保险有效期', trigger: 'change' }
  ],
  agreementSigned: [
    { required: true, message: '请选择是否签订超龄协议', trigger: 'change' }
  ],
  familyAddress: [
    { required: true, message: '请输入家庭住址', trigger: 'blur' },
    { min: 5, max: 200, message: '地址长度在5-200个字符', trigger: 'blur' }
  ],
  familyPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  emergencyContact: [
    { required: true, message: '请输入紧急联系人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2-20个字符', trigger: 'blur' }
  ],
  emergencyPhone: [
    { required: true, message: '请输入紧急联系人电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

// 选项数据
const ethnicityOptions = [
  { label: '汉族', value: '汉族' },
  { label: '蒙古族', value: '蒙古族' },
  { label: '回族', value: '回族' },
  { label: '藏族', value: '藏族' },
  { label: '维吾尔族', value: '维吾尔族' },
  { label: '苗族', value: '苗族' },
  { label: '彝族', value: '彝族' },
  { label: '壮族', value: '壮族' },
  { label: '布依族', value: '布依族' },
  { label: '朝鲜族', value: '朝鲜族' },
  { label: '满族', value: '满族' },
  { label: '侗族', value: '侗族' },
  { label: '瑶族', value: '瑶族' },
  { label: '白族', value: '白族' },
  { label: '土家族', value: '土家族' },
  { label: '哈尼族', value: '哈尼族' },
  { label: '哈萨克族', value: '哈萨克族' },
  { label: '傣族', value: '傣族' },
  { label: '黎族', value: '黎族' },
  { label: '傈僳族', value: '傈僳族' },
  { label: '佤族', value: '佤族' },
  { label: '畲族', value: '畲族' },
  { label: '高山族', value: '高山族' },
  { label: '拉祜族', value: '拉祜族' },
  { label: '水族', value: '水族' },
  { label: '东乡族', value: '东乡族' },
  { label: '纳西族', value: '纳西族' },
  { label: '景颇族', value: '景颇族' },
  { label: '柯尔克孜族', value: '柯尔克孜族' },
  { label: '土族', value: '土族' },
  { label: '达斡尔族', value: '达斡尔族' },
  { label: '仫佬族', value: '仫佬族' },
  { label: '羌族', value: '羌族' },
  { label: '布朗族', value: '布朗族' },
  { label: '撒拉族', value: '撒拉族' },
  { label: '毛南族', value: '毛南族' },
  { label: '仡佬族', value: '仡佬族' },
  { label: '锡伯族', value: '锡伯族' },
  { label: '阿昌族', value: '阿昌族' },
  { label: '普米族', value: '普米族' },
  { label: '塔吉克族', value: '塔吉克族' },
  { label: '怒族', value: '怒族' },
  { label: '乌孜别克族', value: '乌孜别克族' },
  { label: '俄罗斯族', value: '俄罗斯族' },
  { label: '鄂温克族', value: '鄂温克族' },
  { label: '德昂族', value: '德昂族' },
  { label: '保安族', value: '保安族' },
  { label: '裕固族', value: '裕固族' },
  { label: '京族', value: '京族' },
  { label: '塔塔尔族', value: '塔塔尔族' },
  { label: '独龙族', value: '独龙族' },
  { label: '鄂伦春族', value: '鄂伦春族' },
  { label: '赫哲族', value: '赫哲族' },
  { label: '门巴族', value: '门巴族' },
  { label: '珞巴族', value: '珞巴族' },
  { label: '基诺族', value: '基诺族' }
]

const educationOptions = [
  { label: '小学', value: '小学' },
  { label: '初中', value: '初中' },
  { label: '高中', value: '高中' },
  { label: '中专', value: '中专' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '研究生', value: '研究生' },
  { label: '博士', value: '博士' }
]

const politicalStatusOptions = [
  { label: '群众', value: '群众' },
  { label: '共青团员', value: '共青团员' },
  { label: '中共党员', value: '中共党员' },
  { label: '中共预备党员', value: '中共预备党员' },
  { label: '民革党员', value: '民革党员' },
  { label: '民盟盟员', value: '民盟盟员' },
  { label: '民建会员', value: '民建会员' },
  { label: '民进会员', value: '民进会员' },
  { label: '农工党党员', value: '农工党党员' },
  { label: '致公党党员', value: '致公党党员' },
  { label: '九三学社社员', value: '九三学社社员' },
  { label: '台盟盟员', value: '台盟盟员' },
  { label: '无党派人士', value: '无党派人士' }
]

const healthStatusOptions = [
  { label: '健康', value: '健康' },
  { label: '良好', value: '良好' },
  { label: '一般', value: '一般' },
  { label: '较差', value: '较差' }
]

const retirementCategoryOptions = [
  { label: '企业职工基本养老保险', value: '企业职工基本养老保险' },
  { label: '机关事业单位养老保险', value: '机关事业单位养老保险' },
  { label: '城乡居民基本养老保险', value: '城乡居民基本养老保险' },
  { label: '其他', value: '其他' }
]

// 专业选项（从API获取）
const majorOptions = ref<Array<{ label: string; value: string }>>([])
const coursesLoading = ref(false)

// 状态变量
const submitting = ref(false)
const photoUploading = ref(false)
const uploadProgress = ref(0)

/**
 * 禁用未来日期
 */
const disabledDate = (current: Dayjs): boolean => {
  return current && current > dayjs().endOf('day')
}

/**
 * 处理身份证号失焦事件
 */
const handleIdNumberBlur = async (): Promise<void> => {
  if (formData.idNumber && formData.idNumber.length === 18) {
    try {
      const response = await ApplicationService.checkIdNumberExists(formData.idNumber)
      if (response.data.exists) {
        message.warning('该身份证号已存在报名记录')
      }
    } catch (error) {
      console.error('检查身份证号失败:', error)
    }
  }
}

/**
 * 处理照片上传
 */
const handlePhotoUpload = async (file: File): Promise<boolean> => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件')
    return false
  }

  // 验证文件大小
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过2MB')
    return false
  }

  try {
    photoUploading.value = true
    uploadProgress.value = 0

    const response = await ApplicationService.uploadStudentPhoto(file, (progress) => {
      uploadProgress.value = progress
    })

    if (response.code === 200) {
      formData.photo = response.data.url
      message.success('照片上传成功')
    } else {
      message.error(response.message || '照片上传失败')
    }
  } catch (error) {
    console.error('照片上传失败:', error)
    message.error('照片上传失败')
  } finally {
    photoUploading.value = false
    uploadProgress.value = 0
  }

  return false // 阻止默认上传行为
}

/**
 * 处理表单提交
 */
const handleSubmit = async (values: any): Promise<void> => {
  try {
    submitting.value = true

    // 转换日期格式
    const submitData = {
      ...values,
      birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : '',
      studyPeriod: values.studyPeriod ? dayjs(values.studyPeriod).format('YYYY-MM-DD') : '',
      applicationDate: new Date().toISOString(),
      status: 'pending' as const
    }

    const response = await ApplicationService.submitApplicationV2(submitData)

    if (response.code === 200) {
      message.success('报名提交成功，请等待审核')
      handleReset()
    } else {
      message.error(response.message || '报名提交失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    message.error('报名提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

/**
 * 处理表单提交失败
 */
const handleSubmitFailed = (errorInfo: any): void => {
  console.error('表单验证失败:', errorInfo)
  message.error('请检查表单信息是否填写完整')
}

/**
 * 重置表单
 */
const handleReset = (): void => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    name: '',
    gender: '男',
    birthDate: '',
    ethnicity: '',
    healthStatus: '',
    educationLevel: '',
    politicalStatus: '',
    idNumber: '',
    isRetired: false,
    retirementCategory: '',
    major: '',
    studyPeriod: '',
    studentId: '',
    agreementSigned: false,
    familyAddress: '',
    familyPhone: '',
    emergencyContact: '',
    emergencyPhone: '',
    photo: '',
    remarks: ''
  })
}

/**
 * 获取可报名课程
 */
const loadAvailableCourses = async (): Promise<void> => {
  try {
    coursesLoading.value = true
    const response = await ApplicationService.getAvailableCourses()
    
    if (response.code === 200) {
      majorOptions.value = response.data.map(course => ({
        label: course.name,
        value: course.name
      }))
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    message.error('获取课程列表失败')
  } finally {
    coursesLoading.value = false
  }
}

/**
 * 处理身份证读卡器数据读取
 */
const handleIdCardDataRead = (idCardData: IdCardData): void => {
  // 自动填充指定字段
  formData.name = idCardData.name || ''                    // 姓名
  
  // 性别处理 - 增强兼容性
  if (idCardData.sex) {
    const gender = idCardData.sex === '1' ? '男' : idCardData.sex === '2' ? '女' : idCardData.sex
    formData.gender = (gender === '男' || gender === '女') ? gender : '男'
  }
  
  // 民族处理
  formData.ethnicity = idCardData.nation || ''
  
  // 身份证号
  formData.idNumber = idCardData.certNo || ''
  
  // 住址
  formData.familyAddress = idCardData.address || ''
  
  // 出生年月处理
  if (idCardData.birth) {
    const birthDate = formatIdCardDate(idCardData.birth)
    if (birthDate) {
      formData.birthDate = dayjs(birthDate)
    }
  }
  
  // 身份证头像照片
  if (idCardData.base64Data) {
    formData.photo = `data:image/jpeg;base64,${idCardData.base64Data}`
  }
  
  // 显示填充完成的消息
  message.success('身份证信息已填充完成')
}



/**
 * 处理身份证读卡器错误
 */
const handleReaderError = (error: string): void => {
  message.error(`读卡器错误: ${error}`)
}

/**
 * 格式化身份证日期
 */
const formatIdCardDate = (dateStr: string): string => {
  if (!dateStr) return ''
  
  // 身份证日期格式通常是YYYYMMDD
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
  }
  
  return dateStr
}

/**
 * 组件挂载时初始化
 */
onMounted((): void => {
  loadAvailableCourses()
})
</script>

<style scoped>
.application-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
  color: #374151;
}

:deep(.ant-input), 
:deep(.ant-select-selector), 
:deep(.ant-picker) {
  border-radius: 8px;
}

:deep(.ant-btn) {
  border-radius: 8px;
  font-weight: 500;
}

:deep(.ant-upload) {
  width: 100%;
}

:deep(.ant-progress-line) {
  margin-top: 8px;
}
</style> 
