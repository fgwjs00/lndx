<template>
  <div class="registration-page">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold mb-3">学员报名登记</h1>
          <p class="text-purple-100 text-lg">请填写完整的报名信息，我们将尽快为您处理</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-8xl opacity-20">📝</div>
          <div class="text-right">
            <p class="text-purple-100 text-sm">当前登录：</p>
            <p class="text-white font-semibold">{{ authStore.userName }}</p>
            <p class="text-purple-200 text-xs">{{ getRoleName(authStore.userRole) }}</p>
          </div>
        </div>
      </div>
    </div>



    <!-- 表单内容 -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-8">
        <a-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          layout="vertical"
          @finish="handleSubmit"
          @finish-failed="handleSubmitFailed"
        >
          <!-- 身份证读卡器 -->
          <div class="mb-8">
            <IdCardReader 
              @dataRead="handleIdCardDataRead"
              @error="handleReaderError"
            />
          </div>

          <!-- 基本信息 -->
          <div class="mb-8">
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <i class="fas fa-user text-blue-500 mr-3"></i>
                基本信息
              </h2>
              <p class="text-gray-600">请填写您的基本个人信息，可使用身份证读卡器快速录入</p>
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
                  format="YYYY-MM-DD"
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
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <i class="fas fa-graduation-cap text-green-500 mr-3"></i>
                学籍信息
              </h2>
              <p class="text-gray-600">请填写学籍相关信息</p>
            </div>
            
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
                  format="YYYY-MM-DD"
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
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <i class="fas fa-address-book text-purple-500 mr-3"></i>
                联系信息
              </h2>
              <p class="text-gray-600">请填写联系方式和其他信息</p>
            </div>
            
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
                  :maxlength="11"
                />
              </a-form-item>

              <!-- 紧急联系人 -->
              <a-form-item label="紧急联系人" name="emergencyContact" required>
                <a-input
                  v-model:value="formData.emergencyContact"
                  placeholder="请输入紧急联系人姓名"
                  size="large"
                  :maxlength="20"
                />
              </a-form-item>

              <!-- 紧急联系电话 -->
              <a-form-item label="紧急联系电话" name="emergencyPhone" required>
                <a-input
                  v-model:value="formData.emergencyPhone"
                  placeholder="请输入紧急联系电话"
                  size="large"
                  :maxlength="11"
                />
              </a-form-item>

              <!-- 个人照片 -->
              <a-form-item label="个人照片" name="photo">
                <a-upload
                  v-model:file-list="fileList"
                  :before-upload="handlePhotoUpload"
                  :show-upload-list="false"
                  accept="image/*"
                  class="avatar-uploader"
                >
                  <div class="upload-area">
                    <img v-if="formData.photo" :src="formData.photo" alt="头像" class="uploaded-image" />
                    <div v-else class="upload-placeholder">
                      <i class="fas fa-camera text-2xl text-gray-400 mb-2"></i>
                      <p class="text-gray-600">点击上传照片</p>
                      <p class="text-xs text-gray-400">支持JPG/PNG格式，不超过2MB</p>
                    </div>
                  </div>
                </a-upload>
              </a-form-item>

              <!-- 备注 -->
              <a-form-item label="备注" name="remarks">
                <a-textarea
                  v-model:value="formData.remarks"
                  placeholder="请输入备注信息（可选）"
                  :rows="3"
                  :maxlength="500"
                  show-count
                />
              </a-form-item>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <div class="flex space-x-8">
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
          </div>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 报名登记页面
 * @component Registration
 * @description 独立的报名登记页面，供老师和学生共享使用
 */
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'
import { getRoleName } from '@/utils/auth'
import dayjs, { type Dayjs } from 'dayjs'
import ApplicationService from '@/api/application'
import type { StudentInfo, IdCardData } from '@/types'
import IdCardReader from '@/components/IdCardReader.vue'

const authStore = useAuthStore()
const formRef = ref()
const submitting = ref<boolean>(false)
const coursesLoading = ref<boolean>(false)
const fileList = ref<any[]>([])

// 表单数据
const formData = reactive<Partial<StudentInfo> & { birthDate: string | Dayjs }>({
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

// 选项数据
const ethnicityOptions = ref([
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
])

const educationOptions = ref([
  { label: '小学', value: '小学' },
  { label: '初中', value: '初中' },
  { label: '高中', value: '高中' },
  { label: '中专', value: '中专' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '硕士', value: '硕士' },
  { label: '博士', value: '博士' }
])

const politicalStatusOptions = ref([
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
])

const healthStatusOptions = ref([
  { label: '健康', value: '健康' },
  { label: '良好', value: '良好' },
  { label: '一般', value: '一般' },
  { label: '较差', value: '较差' },
  { label: '有慢性病', value: '有慢性病' },
  { label: '有传染性疾病', value: '有传染性疾病' }
])

const retirementCategoryOptions = ref([
  { label: '企业职工基本养老保险', value: '企业职工基本养老保险' },
  { label: '机关事业单位基本养老保险', value: '机关事业单位基本养老保险' },
  { label: '城乡居民基本养老保险', value: '城乡居民基本养老保险' },
  { label: '其他', value: '其他' }
])

const majorOptions = ref<Array<{ label: string; value: string }>>([])

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
    { required: true, message: '请输入紧急联系人', trigger: 'blur' },
    { min: 2, max: 20, message: '联系人姓名长度在2-20个字符', trigger: 'blur' }
  ],
  emergencyPhone: [
    { required: true, message: '请输入紧急联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}



/**
 * 禁用日期（不能选择未来日期）
 */
const disabledDate = (current: Dayjs): boolean => {
  return current && current > dayjs().endOf('day')
}

/**
 * 处理身份证号失焦
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
    // 暂时使用本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.photo = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    message.success('照片上传成功')
  } catch (error) {
    console.error('照片上传失败:', error)
    message.error('照片上传失败')
  }

  return false // 阻止默认上传行为
}

/**
 * 处理表单提交
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value.validate()
    
    submitting.value = true

    // 转换日期格式
    const submitData = {
      ...formData,
      birthDate: formData.birthDate ? dayjs(formData.birthDate).format('YYYY-MM-DD') : '',
      studyPeriod: formData.studyPeriod ? dayjs(formData.studyPeriod).format('YYYY-MM-DD') : '',
      applicationDate: new Date().toISOString(),
      status: 'pending' as const
    }

    const response = await ApplicationService.submitApplication(submitData, 1) // 假设课程ID为1

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
 * 组件挂载时初始化
 */
onMounted((): void => {
  loadAvailableCourses()
})
</script>

<style scoped>
.registration-page {
  min-height: calc(100vh - 200px);
}

.step-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  text-align: center;
  position: relative;
}

.step-header::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3B82F6, #8B5CF6);
  border-radius: 2px;
}

.upload-area {
  width: 120px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.upload-area:hover {
  border-color: #1890ff;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.upload-placeholder {
  text-align: center;
}

:deep(.ant-form-item-label) {
  font-weight: 600;
  color: #374151;
}

:deep(.ant-input-lg) {
  border-radius: 8px;
}

:deep(.ant-select-lg) {
  border-radius: 8px;
}

:deep(.ant-btn) {
  border-radius: 8px;
}

:deep(.ant-date-picker) {
  border-radius: 8px;
}

:deep(.ant-radio-group) {
  display: flex;
  gap: 16px;
}

:deep(.ant-upload) {
  width: 120px;
  height: 120px;
}
</style> 