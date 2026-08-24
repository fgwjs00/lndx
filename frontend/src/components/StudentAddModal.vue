<template>
  <a-modal
    v-model:open="modalVisible"
    title="添加学生"
    width="1200px"
    :footer="null"
    :maskClosable="false"
    :destroyOnClose="true"
    class="student-add-modal"
  >
    <div class="max-h-[80vh] overflow-y-auto">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @finish="handleSubmit"
        @finish-failed="handleSubmitFailed"
      >
        <!-- 身份证读卡器 -->
        <div class="mb-6">
          <IdCardReader 
            @dataRead="handleIdCardDataRead"
            @error="handleReaderError"
          />
        </div>

        <!-- 基本信息 -->
        <div class="mb-6">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-user text-blue-500 mr-2"></i>
              基本信息
            </h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- 姓名 -->
            <a-form-item label="姓名" name="name" required>
              <a-input
                v-model:value="formData.name"
                placeholder="请输入真实姓名"
                :maxlength="20"
              />
            </a-form-item>

            <!-- 性别 -->
            <a-form-item label="性别" name="gender" required>
              <a-radio-group v-model:value="formData.gender">
                <a-radio value="男">男</a-radio>
                <a-radio value="女">女</a-radio>
              </a-radio-group>
            </a-form-item>

            <!-- 出生年月 -->
            <a-form-item label="出生年月" name="birthDate" required>
              <a-date-picker
                v-model:value="formData.birthDate"
                placeholder="将从身份证号码自动提取"
                style="width: 100%"
                format="YYYY-MM-DD"
                disabled
                :allow-clear="false"
              />
              <div class="text-xs text-gray-500 mt-1">💡 出生日期将根据身份证号码自动填写</div>
            </a-form-item>

            <!-- 民族 -->
            <a-form-item label="民族" name="ethnicity" required>
              <a-select
                v-model:value="formData.ethnicity"
                placeholder="请选择民族"
                :options="ethnicityOptions"
              />
            </a-form-item>

            <!-- 文化程度 -->
            <a-form-item label="文化程度" name="educationLevel" required>
              <a-select
                v-model:value="formData.educationLevel"
                placeholder="请选择文化程度"
                :options="educationOptions"
              />
            </a-form-item>

            <!-- 政治面貌 -->
            <a-form-item label="政治面貌" name="politicalStatus" required>
              <a-select
                v-model:value="formData.politicalStatus"
                placeholder="请选择政治面貌"
                :options="politicalStatusOptions"
              />
            </a-form-item>

            <!-- 健康状况 -->
            <a-form-item label="健康状况" name="healthStatus" required>
              <a-select
                v-model:value="formData.healthStatus"
                placeholder="请选择健康状况"
                :options="healthOptions"
              />
            </a-form-item>

            <!-- 身份证号 -->
            <a-form-item label="身份证号" name="idNumber" required>
              <a-input
                v-model:value="formData.idNumber"
                placeholder="请输入身份证号"
                :maxlength="18"
                @input="handleIdNumberInput"
              />
            </a-form-item>

            <!-- 身份证地址 -->
            <a-form-item label="身份证地址" name="idCardAddress" required>
              <a-input
                v-model:value="formData.idCardAddress"
                placeholder="身份证上的地址"
                :maxlength="100"
              />
            </a-form-item>

            <!-- 联系电话 -->
            <a-form-item label="联系电话" name="contactPhone" required>
              <a-input
                v-model:value="formData.contactPhone"
                placeholder="请输入联系电话"
                :maxlength="15"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 身份证照片 -->
        <div class="mb-6">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-id-card text-green-500 mr-2"></i>
              身份证照片
            </h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 身份证正面照片 -->
            <a-form-item label="身份证正面" name="idCardFront">
              <a-upload
                v-model:file-list="idCardFrontFileList"
                :before-upload="(file: any) => handleIdCardUpload(file, 'front')"
                :show-upload-list="false"
                accept="image/*"
                class="id-card-uploader"
              >
                <div class="id-card-upload-area">
                  <div v-if="formData.idCardFront || pendingPhotoData.idCardFront" class="relative">
                    <img 
                      :src="idCardFrontUrl" 
                      alt="身份证正面" 
                      class="id-card-image cursor-pointer" 
                      @click.stop="previewIdCard('front')"
                    />
                    <div class="absolute top-2 right-2 flex space-x-1">
                      <a-button 
                        type="primary" 
                        size="small"
                        @click.stop="clearIdCardPhoto('front')"
                        class="text-xs"
                      >
                        重新上传
                      </a-button>
                    </div>
                  </div>
                  <div v-else class="upload-placeholder">
                    <i class="fas fa-id-card text-3xl text-gray-400 mb-2"></i>
                    <p class="text-gray-600 font-medium">身份证正面</p>
                    <p class="text-xs text-gray-400">点击上传或使用读卡器</p>
                  </div>
                </div>
              </a-upload>
            </a-form-item>

            <!-- 身份证反面照片 -->
            <a-form-item label="身份证反面" name="idCardBack">
              <a-upload
                v-model:file-list="idCardBackFileList"
                :before-upload="(file: any) => handleIdCardUpload(file, 'back')"
                :show-upload-list="false"
                accept="image/*"
                class="id-card-uploader"
              >
                <div class="id-card-upload-area">
                  <div v-if="formData.idCardBack || pendingPhotoData.idCardBack" class="relative">
                    <img 
                      :src="idCardBackUrl" 
                      alt="身份证反面" 
                      class="id-card-image cursor-pointer" 
                      @click.stop="previewIdCard('back')"
                    />
                    <div class="absolute top-2 right-2 flex space-x-1">
                      <a-button 
                        type="primary" 
                        size="small"
                        @click.stop="clearIdCardPhoto('back')"
                        class="text-xs"
                      >
                        重新上传
                      </a-button>
                    </div>
                  </div>
                  <div v-else class="upload-placeholder">
                    <i class="fas fa-id-card text-3xl text-gray-400 mb-2"></i>
                    <p class="text-gray-600 font-medium">身份证反面</p>
                    <p class="text-xs text-gray-400">点击上传或使用读卡器</p>
                  </div>
                </div>
              </a-upload>
            </a-form-item>
          </div>
        </div>

        <!-- 学籍信息 -->
        <div class="mb-6">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-graduation-cap text-green-500 mr-2"></i>
              学籍信息
            </h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- 学员证号 -->
            <a-form-item label="学员证号" name="studentId">
              <a-input
                v-model:value="formData.studentId"
                placeholder="自动生成或手动输入"
                :maxlength="20"
              />
            </a-form-item>

            <!-- 学期选择 -->
            <a-form-item label="学期" name="semester" required>
              <a-select
                v-model:value="formData.semester"
                placeholder="请选择学期"
                :options="semesterOptions"
                :loading="semestersLoading"
              />
            </a-form-item>

            <!-- 所报课程 -->
            <a-form-item label="所报课程" name="selectedCourses" required>
              <a-select
                v-model:value="formData.selectedCourses"
                mode="multiple"
                placeholder="请选择课程"
                :options="courseOptions"
                :loading="coursesLoading"
                style="width: 100%"
              />
            </a-form-item>

            <!-- 保险公司 -->
            <a-form-item label="保险公司" name="insuranceCompany">
              <a-select
                v-model:value="formData.insuranceCompany"
                placeholder="请选择保险公司"
                :options="insuranceCompanyOptions"
              />
            </a-form-item>

            <!-- 保险类别 -->
            <a-form-item label="保险类别" name="retirementCategory">
              <a-select
                v-model:value="formData.retirementCategory"
                placeholder="请选择保险类别"
                :options="retirementCategoryOptions"
              />
            </a-form-item>

            <!-- 保险有效期开始 -->
            <a-form-item label="保险有效期开始" name="studyPeriodStart">
              <a-date-picker
                v-model:value="formData.studyPeriodStart"
                placeholder="开始日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                @change="handleInsuranceStartDateChange"
              />
            </a-form-item>

            <!-- 保险有效期结束 -->
            <a-form-item label="保险有效期结束" name="studyPeriodEnd">
              <a-date-picker
                v-model:value="formData.studyPeriodEnd"
                placeholder="结束日期"
                style="width: 100%"
                format="YYYY-MM-DD"
              />
            </a-form-item>

            <!-- 是否在职 -->
            <a-form-item label="是否在职" name="isRetired" required>
              <a-radio-group v-model:value="formData.isRetired">
                <a-radio :value="false">在职</a-radio>
                <a-radio :value="true">退休</a-radio>
              </a-radio-group>
            </a-form-item>

            <!-- 是否签订超龄协议 -->
            <a-form-item label="是否签订超龄协议" name="agreementSigned" required>
              <a-radio-group v-model:value="formData.agreementSigned">
                <a-radio :value="true">是</a-radio>
                <a-radio :value="false">否</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>

        <!-- 联系信息 -->
        <div class="mb-6">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-address-book text-purple-500 mr-2"></i>
              联系信息
            </h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 紧急联系人 -->
            <a-form-item label="紧急联系人" name="emergencyContact" required>
              <a-input
                v-model:value="formData.emergencyContact"
                placeholder="请输入紧急联系人姓名"
                :maxlength="20"
              />
            </a-form-item>

            <!-- 紧急联系电话 -->
            <a-form-item label="紧急联系电话" name="emergencyPhone" required>
              <a-input
                v-model:value="formData.emergencyPhone"
                placeholder="请输入紧急联系人电话"
                :maxlength="15"
              />
            </a-form-item>

            <!-- 现居住地址 -->
            <a-form-item label="现居住地址" name="familyAddress" required>
              <a-textarea
                v-model:value="formData.familyAddress"
                placeholder="请输入详细现居住地址"
                :rows="3"
                :maxlength="200"
                show-count
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
                  <img v-if="formData.photo || pendingPhotoData.photo" :src="photoUrl" alt="头像" class="uploaded-image" />
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
        <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <a-button @click="handleCancel" size="large">
            取消
          </a-button>
          <a-button @click="handleReset" size="large">
            重置表单
          </a-button>
          <a-button
            type="primary"
            html-type="submit"
            :loading="submitting"
            size="large"
          >
            {{ submitting ? '添加中...' : '添加学生' }}
          </a-button>
        </div>
      </a-form>
    </div>

    <!-- 身份证照片预览模态框 -->
    <a-modal
      :open="previewVisible"
      :title="previewTitle"
      :footer="null"
      @cancel="handlePreviewCancel"
      centered
      width="600px"
      class="id-card-preview-modal"
    >
      <div class="preview-image-container">
        <img 
          :src="previewImage" 
          :alt="previewTitle"
          class="preview-image"
        />
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 添加学生弹窗
 * @component StudentAddModal
 * @description 直接添加学生，不经过报名审核，绕过所有限制
 */
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import type { IdCardData } from '@/types'
import IdCardReader from '@/components/IdCardReader.vue'
import ApplicationService from '@/api/application'
import { CourseService } from '@/api/course'
import { StudentService } from '@/api/student'

// Props
interface Props {
  open: boolean
}

// Emits
interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const modalVisible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const formRef = ref()
const submitting = ref<boolean>(false)
const semestersLoading = ref<boolean>(false)
const coursesLoading = ref<boolean>(false)

// 表单数据接口
interface StudentFormData {
  name: string
  gender: string
  birthDate: string | Dayjs
  ethnicity: string
  healthStatus: string
  educationLevel: string
  politicalStatus: string
  phone: string
  idNumber: string
  idCardAddress: string
  contactPhone: string
  idCardFront: string
  idCardBack: string
  isRetired: boolean
  insuranceCompany: string
  retirementCategory: string
  semester: string
  selectedCourses: string[]
  studyPeriodStart: string | Dayjs
  studyPeriodEnd: string | Dayjs
  studentId: string
  agreementSigned: boolean
  familyAddress: string
  familyPhone: string
  emergencyContact: string
  emergencyPhone: string
  emergencyRelation: string
  applicationDate: string
  status: 'pending' | 'approved' | 'rejected'
  photo: string
  remarks: string
}

// 表单数据
const formData = reactive<StudentFormData>({
  name: '',
  gender: '男',
  birthDate: '',
  ethnicity: '',
  healthStatus: '',
  educationLevel: '',
  politicalStatus: '',
  phone: '',
  idNumber: '',
  idCardAddress: '',
  contactPhone: '',
  idCardFront: '',
  idCardBack: '',
  isRetired: false,
  insuranceCompany: '',
  retirementCategory: '',
  semester: '',
  selectedCourses: [],
  studyPeriodStart: '',
  studyPeriodEnd: '',
  studentId: '',
  agreementSigned: false,
  familyAddress: '',
  familyPhone: '',
  emergencyContact: '',
  emergencyPhone: '',
  emergencyRelation: '',
  applicationDate: '',
  status: 'approved', // 直接设为已通过
  photo: '',
  remarks: ''
})

// 暂存照片数据
const pendingPhotoData = ref({
  photo: '',
  idCardFront: '',
  idCardBack: ''
})
const fileList = ref<any[]>([])
const idCardFrontFileList = ref<any[]>([])
const idCardBackFileList = ref<any[]>([])
const previewVisible = ref<boolean>(false)
const previewImage = ref<string>('')
const previewTitle = ref<string>('')

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
  { label: '硕士研究生', value: '硕士研究生' },
  { label: '博士研究生', value: '博士研究生' }
])

const politicalStatusOptions = ref([
  { label: '群众', value: '群众' },
  { label: '团员', value: '团员' },
  { label: '党员', value: '党员' },
  { label: '民主党派', value: '民主党派' },
  { label: '无党派人士', value: '无党派人士' }
])

const healthOptions = ref([
  { label: '健康', value: '健康' },
  { label: '良好', value: '良好' },
  { label: '一般', value: '一般' },
  { label: '较弱', value: '较弱' },
  { label: '有慢性病', value: '有慢性病' }
])

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

const retirementCategoryOptions = ref([
  { label: '意外保险', value: '意外保险' }
])

const semesterOptions = ref<Array<{ label: string; value: string }>>([])
const courseOptions = ref<Array<{ label: string; value: string }>>([])

// 表单验证规则（简化版本，移除大部分限制）
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
    { required: true, message: '请输入身份证号', trigger: 'blur' }
  ],
  isRetired: [
    { required: true, message: '请选择是否在职', trigger: 'change' }
  ],
  selectedCourses: [
    { required: true, message: '请选择至少一门课程', trigger: 'change' }
  ],
  agreementSigned: [
    { required: true, message: '请选择是否签订超龄协议', trigger: 'change' }
  ],
  familyAddress: [
    { required: true, message: '请输入现居住地址', trigger: 'blur' }
  ],
  emergencyContact: [
    { required: true, message: '请输入紧急联系人', trigger: 'blur' }
  ],
  emergencyPhone: [
    { required: true, message: '请输入紧急联系电话', trigger: 'blur' }
  ],
  idCardAddress: [
    { required: true, message: '请输入身份证地址', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' }
  ],
  semester: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ]
}

// 计算属性
const idCardFrontUrl = computed(() => {
  const frontSource = pendingPhotoData.value.idCardFront || formData.idCardFront
  if (!frontSource) return ''
  
  if (frontSource.startsWith('data:') || frontSource.startsWith('http')) {
    return frontSource
  }
  
  const { protocol, host } = window.location
  return `${protocol}//${host}${frontSource.startsWith('/') ? '' : '/'}${frontSource}`
})

const idCardBackUrl = computed(() => {
  const backSource = pendingPhotoData.value.idCardBack || formData.idCardBack
  if (!backSource) return ''
  
  if (backSource.startsWith('data:') || backSource.startsWith('http')) {
    return backSource
  }
  
  const { protocol, host } = window.location
  return `${protocol}//${host}${backSource.startsWith('/') ? '' : '/'}${backSource}`
})

const photoUrl = computed(() => {
  const photoSource = pendingPhotoData.value.photo || formData.photo
  if (!photoSource) return ''
  
  if (photoSource.startsWith('data:') || photoSource.startsWith('http')) {
    return photoSource
  }
  
  const { protocol, host } = window.location
  return `${protocol}//${host}${photoSource.startsWith('/') ? '' : '/'}${photoSource}`
})

// 处理保险开始日期变化，自动设置结束日期
const handleInsuranceStartDateChange = (date: Dayjs | null): void => {
  if (date) {
    formData.studyPeriodEnd = date.add(1, 'year')
    message.success('已自动设置保险结束日期为1年后')
  } else {
    formData.studyPeriodEnd = ''
  }
}

// 处理身份证读卡器数据读取
const handleIdCardDataRead = async (idCardData: IdCardData): Promise<void> => {
  formData.name = idCardData.name || ''
  
  if (idCardData.sex) {
    const genderMap: Record<string, string> = {
      '1': '男', '男': '男', 'M': '男', 'MALE': '男',
      '2': '女', '女': '女', 'F': '女', 'FEMALE': '女'
    }
    formData.gender = genderMap[idCardData.sex.toUpperCase()] || '男'
  }
  
  formData.idNumber = idCardData.certNo || ''
  formData.idCardAddress = idCardData.address || ''
  formData.ethnicity = idCardData.nation || ''
  
  // 出生日期处理 - 优先使用身份证号码提取，其次使用读卡器数据
  if (formData.idNumber) {
    const extractedBirthDate = extractBirthDateFromId(formData.idNumber)
    if (extractedBirthDate) {
      formData.birthDate = extractedBirthDate
      console.log('✅ 从身份证号码提取出生日期:', extractedBirthDate.format('YYYY-MM-DD'))
    }
  } else if (idCardData.birth) {
    try {
      const normalizedBirth = idCardData.birth.replace(/[^0-9]/g, '')
      const birthYear = normalizedBirth.substring(0, 4)
      const birthMonth = normalizedBirth.substring(4, 6)
      const birthDay = normalizedBirth.substring(6, 8)
      formData.birthDate = dayjs(`${birthYear}-${birthMonth}-${birthDay}`)
      console.log('✅ 从读卡器数据获取出生日期:', `${birthYear}-${birthMonth}-${birthDay}`)
    } catch (error) {
      console.error('解析出生日期失败:', error)
    }
  }
  
  // 身份证照片
  if (idCardData.imageFront) {
    pendingPhotoData.value.idCardFront = `data:image/jpeg;base64,${idCardData.imageFront}`
  }
  
  if (idCardData.imageBack) {
    pendingPhotoData.value.idCardBack = `data:image/jpeg;base64,${idCardData.imageBack}`
  }
  
  if (pendingPhotoData.value.photo || pendingPhotoData.value.idCardFront || pendingPhotoData.value.idCardBack) {
    message.info('身份证照片已准备就绪，将在提交表单时统一上传')
  }
}

// 处理读卡器错误
const handleReaderError = (error: string): void => {
  message.error(`读卡器错误: ${error}`)
}

// 处理照片上传
const handlePhotoUpload = async (file: File): Promise<boolean> => {
  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      pendingPhotoData.value.photo = e.target?.result as string
      message.success('照片暂存成功，将在提交时上传')
    }
    reader.readAsDataURL(file)
    return false
  } catch (error) {
    message.error('照片读取失败')
    return false
  }
}

// 处理身份证照片上传
const handleIdCardUpload = async (file: File, type: 'front' | 'back'): Promise<boolean> => {
  try {
    const uploadingMessage = message.loading(
      `正在上传${type === 'front' ? '身份证正面' : '身份证反面'}...`, 
      0
    )

    const response = await ApplicationService.uploadIdCardImage(file)
    uploadingMessage()
    
    if (response.code === 200) {
      if (type === 'front') {
        formData.idCardFront = response.data.url
      } else {
        formData.idCardBack = response.data.url
      }
      
      message.success(`身份证${type === 'front' ? '正面' : '反面'}上传成功`)
    } else {
      message.error(response.message || '上传失败')
    }
    
    return false
  } catch (error) {
    message.error('上传失败，请重试')
    return false
  }
}

// 预览身份证照片
const previewIdCard = (type: 'front' | 'back'): void => {
  if (type === 'front' && (formData.idCardFront || pendingPhotoData.value.idCardFront)) {
    previewImage.value = idCardFrontUrl.value
    previewTitle.value = '身份证正面'
    previewVisible.value = true
  } else if (type === 'back' && (formData.idCardBack || pendingPhotoData.value.idCardBack)) {
    previewImage.value = idCardBackUrl.value
    previewTitle.value = '身份证反面'
    previewVisible.value = true
  }
}

// 关闭预览
const handlePreviewCancel = (): void => {
  previewVisible.value = false
  previewImage.value = ''
  previewTitle.value = ''
}

// 清除身份证照片
const clearIdCardPhoto = (type: 'front' | 'back'): void => {
  if (type === 'front') {
    formData.idCardFront = ''
    idCardFrontFileList.value = []
    message.success('身份证正面照片已清除')
  } else if (type === 'back') {
    formData.idCardBack = ''
    idCardBackFileList.value = []
    message.success('身份证反面照片已清除')
  }
}

// 上传暂存的照片
const uploadPendingPhotos = async (): Promise<void> => {
  const uploadBase64Image = async (base64Data: string, type: string): Promise<string | null> => {
    try {
      const response = await fetch(base64Data)
      const blob = await response.blob()
      const file = new File([blob], `${type}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      const uploadResponse = await ApplicationService.uploadIdCardImage(file)
      return uploadResponse.code === 200 ? uploadResponse.data.url : null
    } catch (error) {
      console.error(`上传${type}失败:`, error)
      return null
    }
  }

  // 上传个人照片
  if (pendingPhotoData.value.photo && pendingPhotoData.value.photo.startsWith('data:')) {
    const photoUrl = await uploadBase64Image(pendingPhotoData.value.photo, 'photo')
    if (photoUrl) {
      formData.photo = photoUrl
    }
  }
  
  // 上传身份证正面
  if (pendingPhotoData.value.idCardFront && pendingPhotoData.value.idCardFront.startsWith('data:')) {
    const frontUrl = await uploadBase64Image(pendingPhotoData.value.idCardFront, 'front')
    if (frontUrl) {
      formData.idCardFront = frontUrl
    }
  }
  
  // 上传身份证反面
  if (pendingPhotoData.value.idCardBack && pendingPhotoData.value.idCardBack.startsWith('data:')) {
    const backUrl = await uploadBase64Image(pendingPhotoData.value.idCardBack, 'back')
    if (backUrl) {
      formData.idCardBack = backUrl
    }
  }
}

// 处理表单提交
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // 先上传暂存的照片
    await uploadPendingPhotos()

    // 转换日期格式
    const submitData = {
      ...formData,
      birthDate: formData.birthDate ? dayjs(formData.birthDate).format('YYYY-MM-DD') : '',
      studyPeriodStart: formData.studyPeriodStart ? dayjs(formData.studyPeriodStart).format('YYYY-MM-DD') : '',
      studyPeriodEnd: formData.studyPeriodEnd ? dayjs(formData.studyPeriodEnd).format('YYYY-MM-DD') : '',
      applicationDate: new Date().toISOString(),
      status: 'approved' // 直接设为已通过
    }

    // 直接调用学生添加接口
    const response = await StudentService.createStudent(submitData)
    
    if (response.code === 200 || response.code === 201) {
      message.success('学生添加成功！')
      handleReset()
      modalVisible.value = false
      emit('success')
    } else {
      message.error(response.message || '学生添加失败')
    }
  } catch (error: any) {
    console.error('添加学生失败:', error)
    
    let errorMessage = '学生添加失败，请重试'
    
    if (error.response && error.response.data) {
      const errorData = error.response.data
      if (errorData.message) {
        errorMessage = errorData.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    message.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 处理表单提交失败
const handleSubmitFailed = (errorInfo: any): void => {
  console.error('表单验证失败:', errorInfo)
  message.error('请检查表单填写是否完整')
}

// 重置表单
const handleReset = (): void => {
  formRef.value?.resetFields()
  
  // 重置表单数据
  Object.assign(formData, {
    name: '',
    gender: '男',
    birthDate: '',
    ethnicity: '',
    healthStatus: '',
    educationLevel: '',
    politicalStatus: '',
    phone: '',
    idNumber: '',
    idCardAddress: '',
    contactPhone: '',
    idCardFront: '',
    idCardBack: '',
    isRetired: false,
    insuranceCompany: '',
    retirementCategory: '',
    semester: '',
    selectedCourses: [],
    studyPeriodStart: '',
    studyPeriodEnd: '',
    studentId: '',
    agreementSigned: false,
    familyAddress: '',
    familyPhone: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: '',
    applicationDate: '',
    status: 'approved' as const,
    photo: '',
    remarks: ''
  })
  
  // 清除文件上传列表
  idCardFrontFileList.value = []
  idCardBackFileList.value = []
  fileList.value = []
  
  // 清除暂存照片数据
  pendingPhotoData.value = {
    photo: '',
    idCardFront: '',
    idCardBack: ''
  }
  
  // 重置其他状态
  submitting.value = false
  previewVisible.value = false
  previewImage.value = ''
  previewTitle.value = ''
}

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

// 取消操作
const handleCancel = (): void => {
  modalVisible.value = false
}

// 获取学期列表
const fetchSemesters = async (): Promise<void> => {
  try {
    semestersLoading.value = true
    const response = await CourseService.getSemesters()
    semesterOptions.value = response.data?.map((semester: string) => ({
      label: semester,
      value: semester
    })) || []
    
    // 设置默认学期
    if (semesterOptions.value.length > 0) {
      const currentYear = new Date().getFullYear()
      const currentSemester = `${currentYear}年秋季`
      const defaultSemester = semesterOptions.value.find(s => s.value === currentSemester)
      if (defaultSemester) {
        formData.semester = defaultSemester.value
      } else {
        formData.semester = semesterOptions.value[0].value
      }
    }
  } catch (error) {
    console.error('获取学期列表失败:', error)
  } finally {
    semestersLoading.value = false
  }
}

// 获取课程列表
const fetchCourses = async (): Promise<void> => {
  try {
    coursesLoading.value = true
    const response = await CourseService.getCourses({
      page: 1,
      pageSize: 100,
      status: 'PUBLISHED'
    })
    courseOptions.value = (response.data?.list || []).map((course: any) => ({
      label: course.name,
      value: course.id
    }))
  } catch (error) {
    console.error('获取课程列表失败:', error)
  } finally {
    coursesLoading.value = false
  }
}

// 监听弹窗打开状态
watch(modalVisible, (newValue) => {
  if (newValue) {
    // 弹窗打开时获取数据
    fetchSemesters()
    fetchCourses()
  } else {
    // 弹窗关闭时重置表单
    handleReset()
  }
})
</script>

<style scoped>
.student-add-modal .ant-modal-body {
  max-height: 80vh;
  overflow-y: auto;
}

/* 上传组件样式 */
.id-card-uploader, .avatar-uploader {
  width: 100%;
}

.id-card-upload-area, .upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.id-card-upload-area:hover, .upload-area:hover {
  border-color: #40a9ff;
}

.id-card-image, .uploaded-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
}

.preview-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-add-modal .ant-modal {
    width: 95% !important;
    margin: 10px auto;
  }
}
</style>
