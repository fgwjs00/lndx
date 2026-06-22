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
            <p class="text-purple-200 text-xs">{{ getRoleName(authStore.userRole || UserRole.STUDENT) }}</p>
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
                  placeholder="将从身份证号码自动提取"
                  size="large"
                  style="width: 100%"
                  :disabled-date="disabledDate"
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
                  @input="handleIdNumberInput"
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
              <!-- 联系电话 -->
              <a-form-item label="联系电话" name="contactPhone" required>
                <a-input
                  v-model:value="formData.contactPhone"
                  placeholder="请输入本人联系电话"
                  size="large"
                  :maxlength="11"
                />
              </a-form-item>
              <!-- 身份证地址 -->
              <a-form-item label="身份证地址" name="idCardAddress" required>
                <a-textarea
                  v-model:value="formData.idCardAddress"
                  placeholder="请输入身份证上的地址"
                  :rows="2"
                  :maxlength="100"
                  show-count
                />
              </a-form-item>

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
                        @error="(e: Event) => console.log('❌ 图片加载失败 - 正面:', (e.target as HTMLImageElement)?.src)"
                        @load="(e: Event) => console.log('✅ 图片加载成功 - 正面:', (e.target as HTMLImageElement)?.src)"
                      />
                      <!-- 操作按钮 -->
                      <div class="absolute top-2 right-2 flex space-x-1">
                        <a-button
                          type="primary"
                          size="small"
                          @click.stop="triggerIdCardUpload('front')"
                          class="!px-2"
                          title="重新上传"
                        >
                          <i class="fas fa-upload text-xs"></i>
                        </a-button>
                        <a-button
                          danger
                          size="small"
                          @click.stop="clearIdCardPhoto('front')"
                          class="!px-2"
                          title="删除照片"
                        >
                          <i class="fas fa-trash text-xs"></i>
                        </a-button>
                      </div>
                    </div>
                    <div v-else class="id-card-placeholder">
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
                        @error="(e: Event) => console.log('❌ 图片加载失败 - 反面:', (e.target as HTMLImageElement)?.src)"
                        @load="(e: Event) => console.log('✅ 图片加载成功 - 反面:', (e.target as HTMLImageElement)?.src)"
                      />
                      <!-- 操作按钮 -->
                      <div class="absolute top-2 right-2 flex space-x-1">
                        <a-button
                          type="primary"
                          size="small"
                          @click.stop="triggerIdCardUpload('back')"
                          class="!px-2"
                          title="重新上传"
                        >
                          <i class="fas fa-upload text-xs"></i>
                        </a-button>
                        <a-button
                          danger
                          size="small"
                          @click.stop="clearIdCardPhoto('back')"
                          class="!px-2"
                          title="删除照片"
                        >
                          <i class="fas fa-trash text-xs"></i>
                        </a-button>
                      </div>
                    </div>
                    <div v-else class="id-card-placeholder">
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
          <div class="mb-8">
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <i class="fas fa-graduation-cap text-green-500 mr-3"></i>
                学籍信息
              </h2>
              <p class="text-gray-600">请填写学籍相关信息</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <!-- 学员证号 -->
               <a-form-item label="学员证号" name="studentId">
                <a-input
                  v-model:value="formData.studentId"
                  placeholder="自动生成或手动输入"
                  size="large"
                  :maxlength="20"
                />
              </a-form-item>

              <!-- 学期选择 -->
              <a-form-item label="学期" name="semester" required>
                <a-select
                  v-model:value="formData.semester"
                  placeholder="请选择学期"
                  size="large"
                  :options="semesterOptions"
                  :loading="semestersLoading"
                  @change="handleSemesterChange"
                >
                  <template #suffixIcon>
                    <i class="fas fa-calendar-alt text-gray-400"></i>
                  </template>
                </a-select>
              </a-form-item>

              <!-- 所报课程 -->
              <a-form-item label="所报课程" name="selectedCourses" required>
                <!-- 显示已报名课程信息 -->
                <div v-if="enrollmentLimits.currentEnrollments.length > 0" class="mb-3 p-3 bg-blue-50 rounded-lg">
                  <div class="text-sm font-medium text-blue-800 mb-2">
                    已报名课程（{{ enrollmentLimits.activeEnrollmentsCount }}/{{ enrollmentLimits.maxCoursesAllowed }}）
                  </div>
                  <div class="space-y-1">
                    <div
                      v-for="enrollment in enrollmentLimits.currentEnrollments"
                      :key="enrollment.id"
                      class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex justify-between items-center"
                    >
                      <span>{{ enrollment.course.name }} - {{ enrollment.course.level }}</span>
                      <span class="text-xs" :class="{
                        'text-orange-600': enrollment.status === 'PENDING',
                        'text-green-600': enrollment.status === 'APPROVED'
                      }">
                        {{ enrollment.status === 'PENDING' ? '待审核' : '已通过' }}
                      </span>
                    </div>
                  </div>
                </div>

                <a-select
                  v-model:value="formData.selectedCourses"
                  mode="multiple"
                  :placeholder="enrollmentLimits.remainingCourseSlots > 0
                    ? `还可以选择${enrollmentLimits.remainingCourseSlots}门课程`
                    : '已达到最大报名数量'"
                  size="large"
                  :options="courseOptions"
                  :loading="coursesLoading"
                  :max-tag-count="enrollmentLimits.remainingCourseSlots"
                  :disabled="!formData.semester || enrollmentLimits.remainingCourseSlots <= 0"
                  show-search
                  :filter-option="filterCourseOption"
                />
                <div v-if="formData.selectedCourses.length > 0" class="mt-2">
                  <div class="text-sm text-gray-600">
                    本次选择 {{ formData.selectedCourses.length }} 门课程
                    <span v-if="formData.selectedCourses.length >= enrollmentLimits.remainingCourseSlots" class="text-orange-500">
                      （已达本次最大选择数量）
                    </span>
                  </div>

                  <!-- 显示已选课程的详细信息 -->
                  <div class="mt-2 space-y-1">
                    <div
                      v-for="courseId in formData.selectedCourses"
                      :key="courseId"
                      class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex justify-between items-center"
                    >
                      <span>{{ findCourseBySelectionId(courseId)?.name || '未知课程' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 选择提示 -->
                <div class="mt-2 text-xs text-gray-500">
                  <i class="fas fa-info-circle mr-1"></i>
                  <span v-if="formData.semester && enrollmentLimits.policyDescription">
                    {{ enrollmentLimits.policyDescription }}
                  </span>
                  <span v-else>最多可选择2门不同时间段的课程，系统会自动过滤时间冲突的课程</span>
                </div>

                <!-- 跨学期报名信息 -->
                <div v-if="enrollmentLimits.semesterBreakdown.length > 0" class="mt-2 text-xs text-blue-600">
                  <i class="fas fa-calendar-alt mr-1"></i>
                  <span class="font-medium">跨学期报名统计：</span>
                  <div class="mt-1 space-y-1">
                    <div v-for="semester in enrollmentLimits.semesterBreakdown" :key="semester.semester" class="ml-2">
                      {{ semester.semester }}：{{ semester.count }}/{{ semester.limit }}门课程
                    </div>
                  </div>
                  <!-- 总报名数量提示 -->
                  <div class="mt-2 text-xs text-green-600">
                    <i class="fas fa-chart-bar mr-1"></i>
                    <span class="font-medium">总报名情况：</span>
                    当前学期已报名 {{ enrollmentLimits.activeEnrollmentsCount || 0 }} 门，总报名 {{ enrollmentLimits.totalEnrollments || 0 }} 门课程
                  </div>
                </div>

                <!-- 跨学期报名说明 -->
                <div v-if="enrollmentLimits.semesterBreakdown.length > 1" class="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  <i class="fas fa-lightbulb mr-1"></i>
                  <span class="font-medium">跨学期报名说明：</span>
                  <div class="mt-1 space-y-1">
                    <div>• 2024年秋季学期：总数限制为3门课程</div>
                    <div>• 其他学期（2025年等）：总数限制为2门课程</div>
                    <div>• 跨学期限制逻辑：</div>
                    <div class="ml-4">- 2024年已报名2门 → 2025年无法再报名（因为总限制2门）</div>
                    <div class="ml-4">- 2025年已报名2门 → 2024年还可以报名1门（因为总限制是3门）</div>
                  </div>
                </div>
              </a-form-item>

              <!-- 保险公司 -->
              <a-form-item label="保险公司" name="insuranceCompany">
                <a-select
                  v-model:value="formData.insuranceCompany"
                  placeholder="请选择保险公司"
                  size="large"
                  :options="insuranceCompanyOptions"
                />
              </a-form-item>

              <!-- 保险类别 -->
              <a-form-item label="保险类别" name="retirementCategory">
                <a-select
                  v-model:value="formData.retirementCategory"
                  placeholder="请选择保险类别"
                  size="large"
                  :options="retirementCategoryOptions"
                />
              </a-form-item>


              <!-- 保险有效期 -->
              <a-form-item label="保险有效期">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item name="studyPeriodStart" :style="{ marginBottom: 0 }">
                      <a-date-picker
                        v-model:value="formData.studyPeriodStart"
                        placeholder="开始日期"
                        size="large"
                        style="width: 100%"
                        format="YYYY-MM-DD"
                        @change="handleInsuranceStartDateChange"
                      />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item name="studyPeriodEnd" :style="{ marginBottom: 0 }">
                      <a-date-picker
                        v-model:value="formData.studyPeriodEnd"
                        placeholder="结束日期"
                        size="large"
                        style="width: 100%"
                        format="YYYY-MM-DD"
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form-item>

               <!-- 是否在职 -->
               <a-form-item label="是否在职" name="isRetired" required>
                <a-radio-group v-model:value="formData.isRetired" size="large">
                  <a-radio :value="false">在职</a-radio>
                  <a-radio :value="true">退休</a-radio>
                </a-radio-group>
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
                  placeholder="请输入紧急联系人电话"
                  size="large"
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
  </div>
</template>

<script setup lang="ts">
/**
 * 报名登记页面
 * @component Registration
 * @description 独立的报名登记页面，供老师和学生共享使用
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/store/auth'
import { getRoleName } from '@/utils/auth'
import { UserRole } from '@/types/auth'
import dayjs, { type Dayjs } from 'dayjs'
import { calculateAge, checkAgeRestriction, getAgeRestrictionHint } from '@/utils/ageUtils'

// 扩展报名表单数据接口
interface RegistrationFormData {
  name: string
  gender: '男' | '女'
  birthDate: string | Dayjs
  ethnicity: string
  healthStatus: string
  educationLevel: string
  politicalStatus: string
  phone: string
  idNumber: string
  idCardAddress: string
  contactPhone: string
  semester: string
  selectedCourses: string[]
  isRetired: boolean
  insuranceCompany: string
  retirementCategory: string
  studyPeriodStart: string | Dayjs
  studyPeriodEnd: string | Dayjs
  studentId: string
  agreementSigned: boolean
  familyAddress: string
  familyPhone: string
  emergencyContact: string
  emergencyPhone: string
  emergencyRelation: string
  major: string
  applicationDate: string
  status: 'pending' | 'approved' | 'rejected'
  photo: string
  remarks: string
}
import ApplicationService from '@/api/application'
import { CourseService } from '@/api/course'
import type { IdCardData } from '@/types'
import IdCardReader from '@/components/IdCardReader.vue'
import { getCrossSemesterEnrollmentLimits } from '@/utils/enrollmentConfig'
import { getAvatarUrl, getIdCardUrl } from '@/utils/imageUtils'

const authStore = useAuthStore()
const formRef = ref()
const submitting = ref<boolean>(false)
const semestersLoading = ref<boolean>(false)
const semesterOptions = ref<Array<{ label: string; value: string }>>([])
const coursesLoading = ref<boolean>(false)

// 暂存照片数据，避免重复上传
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

// 课程报名限制信息
const enrollmentLimits = reactive({
  activeEnrollmentsCount: 0,
  maxCoursesAllowed: 2,
  remainingCourseSlots: 2,
  currentEnrollments: [] as Array<{
    id: number
    status: string
    courseId: number
    course: {
      id: number
      name: string
      level: string
      semester: string
    }
  }>,
  semesterBreakdown: [] as Array<{ semester: string, count: number, limit: number }>,
  totalEnrollments: 0,
  policyDescription: ''
})

/**
 * 更新课程数量限制（支持跨学期）
 */
const updateEnrollmentLimits = (semester?: string): void => {
  if (!semester) return

  // 使用跨学期限制计算
  const limits = getCrossSemesterEnrollmentLimits(
    semester,
    enrollmentLimits.currentEnrollments.map(e => ({
      course: { semester: e.course.semester },
      status: e.status
    })),
    0 // 当前不新增课程，只计算现有状态
  )

  enrollmentLimits.maxCoursesAllowed = limits.semesterLimit
  enrollmentLimits.semesterBreakdown = limits.semesterBreakdown
  enrollmentLimits.totalEnrollments = limits.totalEnrollments
  enrollmentLimits.policyDescription = limits.policyDescription

  // 🔧 修复：根据学期确定总课程数量限制
  // 2024年秋季：总数限制为3门课程
  // 其他学期：总数限制为2门课程
  const totalLimit = (semester.includes('2024') && semester.includes('秋')) ? 3 : 2

  // 如果总报名数量已经达到学期限制，则不能再报名
  if (limits.totalEnrollments >= totalLimit) {
    enrollmentLimits.remainingCourseSlots = 0
  } else {
    // 🔧 修复：考虑总限制和学期限制的综合约束
    // 剩余槽位 = min(总限制剩余, 学期限制剩余)
    const totalRemaining = Math.max(0, totalLimit - limits.totalEnrollments)
    const semesterRemaining = Math.max(0, limits.semesterLimit - limits.currentTotal)
    enrollmentLimits.remainingCourseSlots = Math.min(totalRemaining, semesterRemaining)
  }

  // 计算当前学期的已报名数量
  const currentSemesterEnrollments = enrollmentLimits.currentEnrollments.filter(e =>
    e.course.semester === semester
  ).length
  enrollmentLimits.activeEnrollmentsCount = currentSemesterEnrollments

  console.log(`🔧 更新跨学期课程限制: [${semester}] -> 最多${limits.semesterLimit}门课程, 已报名${limits.currentTotal}门, 剩余${enrollmentLimits.remainingCourseSlots}门`)
  console.log(`📊 跨学期统计: 总报名${limits.totalEnrollments}门, 政策: ${limits.policyDescription}`)
  console.log(`📊 当前学期已报名: ${currentSemesterEnrollments}门`)

  // 🔧 调试：检查学期字符串匹配
  const includes2024 = semester.includes('2024')
  const includesAutumn = semester.includes('秋') || semester.includes('秋季')
  console.log(`🔍 调试学期匹配: 包含"2024"=${includes2024}, 包含"秋"=${includesAutumn}`)
}

// 表单数据
const formData = reactive<RegistrationFormData & {
  idCardFront: string
  idCardBack: string
}>({
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
  major: '',
  applicationDate: '',
  status: 'pending',
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

// 存储完整课程数据用于时间冲突检测
const availableCourses = ref<Array<{
  id: string | number
  classSectionId?: string | null
  classSectionCode?: string | null
  classSectionName?: string | null
  name: string
  description: string
  teacher: string
  capacity: number
  enrolled: number

  schedule: string
  timeSlots: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    period?: string
  }>
  startDate: string
  endDate: string
}>>([])

const courseOptions = ref<Array<{
  label: string
  value: string
  disabled?: boolean
  timeSlots?: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
  }>
}>>([])

// 课程选择过滤函数
const getCourseSelectionId = (course: { id: string | number; classSectionId?: string | null }): string => {
  return String(course.classSectionId || course.id)
}

const findCourseBySelectionId = (selectionId: string) => {
  return availableCourses.value?.find(course => getCourseSelectionId(course) === selectionId)
}

const getSelectedCourseIds = (): string[] => {
  return formData.selectedCourses.map(selectionId => {
    const course = findCourseBySelectionId(selectionId)
    return String(course?.id || selectionId)
  })
}

const getSelectedClassSectionIds = (): string[] => {
  return formData.selectedCourses
    .map(selectionId => findCourseBySelectionId(selectionId)?.classSectionId)
    .filter((classSectionId): classSectionId is string => Boolean(classSectionId))
}

const filterCourseOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 检查两个时间段是否冲突
const hasTimeConflict = (timeSlots1: Array<{dayOfWeek: number, startTime: string, endTime: string}>,
                        timeSlots2: Array<{dayOfWeek: number, startTime: string, endTime: string}>) => {
  if (!timeSlots1 || !timeSlots2 || timeSlots1.length === 0 || timeSlots2.length === 0) return false

  for (const slot1 of timeSlots1) {
    for (const slot2 of timeSlots2) {
      // 检查是否在同一天
      if (slot1.dayOfWeek === slot2.dayOfWeek) {
        // 检查时间是否重叠
        const start1 = slot1.startTime
        const end1 = slot1.endTime
        const start2 = slot2.startTime
        const end2 = slot2.endTime

        // 如果时间段有重叠，返回true
        if (start1 < end2 && start2 < end1) {
          return true
        }
      }
    }
  }
  return false
}



// 更新课程选项的可用状态
const updateCourseOptionsAvailability = () => {
  if (!availableCourses.value || availableCourses.value.length === 0) return

  // 计算学生年龄
  const studentAge = formData.birthDate ? calculateAge(formData.birthDate) : 0

  // 获取已选课程的时间段
  const selectedTimeSlots: Array<{dayOfWeek: number, startTime: string, endTime: string}> = []

  formData.selectedCourses.forEach(courseId => {
    const selectedCourse = findCourseBySelectionId(courseId)
    if (selectedCourse && selectedCourse.timeSlots) {
      selectedTimeSlots.push(...selectedCourse.timeSlots)
    }
  })

  // 更新课程选项
  courseOptions.value = (availableCourses.value || []).filter(course => {
    // 检查是否已经报名该课程
    const alreadyEnrolledSameCourse = enrollmentLimits.currentEnrollments.some(enrollment =>
      String(enrollment.courseId) === String(course.id)
    )

    // 检查是否已经报名同名课程的其他等级
    const alreadyEnrolledSameName = enrollmentLimits.currentEnrollments.some(enrollment =>
      enrollment.course.name === course.name && String(enrollment.courseId) !== String(course.id)
    )

    // 过滤掉已报名的课程
    return !alreadyEnrolledSameCourse && !alreadyEnrolledSameName
  }).map(course => {
    const isSelected = formData.selectedCourses.includes(getCourseSelectionId(course))
    let disabled = false
    let disabledReason = ''

    // 检查年龄限制
    if (!disabled && studentAge > 0) {
      const courseData = course as any
      const ageCheck = checkAgeRestriction(studentAge, {
        enabled: courseData.ageRestriction?.enabled || courseData.hasAgeRestriction,
        minAge: courseData.ageRestriction?.minAge || courseData.minAge,
        maxAge: courseData.ageRestriction?.maxAge || courseData.maxAge,
        description: courseData.ageRestriction?.description || courseData.ageDescription
      })

      if (!ageCheck.isEligible) {
        disabled = true
        disabledReason = '年龄不符'
      }
    }

    // 如果已选择达到剩余课程数量且当前课程未被选择，则禁用
    if (!disabled && formData.selectedCourses.length >= enrollmentLimits.remainingCourseSlots && !isSelected) {
      disabled = true
      disabledReason = `${formData.semester}学期最多${enrollmentLimits.remainingCourseSlots}门`
    }
    // 如果当前课程与已选课程时间冲突且未被选择，则禁用
    else if (!disabled && !isSelected && selectedTimeSlots.length > 0) {
      if (hasTimeConflict(course.timeSlots, selectedTimeSlots)) {
        disabled = true
        disabledReason = '时间冲突'
      }
    }
    // 如果课程已满员则禁用
    else if (!disabled && course.enrolled >= course.capacity) {
      disabled = true
      disabledReason = '已满员'
    }

    // 构建课程标签，显示容量信息
    const enrolled = course.enrolled || 0
    const capacity = course.capacity || 0
    const remainingSlots = capacity - enrolled

    let label = `${course.name} (${enrolled}/${capacity})`

    // 添加容量状态提示
    if (remainingSlots <= 0) {
      label += ` - 已满员`
    } else if (remainingSlots <= 3) {
      label += ` - 仅剩${remainingSlots}名额`
    }

    // 添加年龄限制提示
    const courseData = course as any
    const ageHint = getAgeRestrictionHint({
      enabled: courseData.ageRestriction?.enabled || courseData.hasAgeRestriction,
      minAge: courseData.ageRestriction?.minAge || courseData.minAge,
      maxAge: courseData.ageRestriction?.maxAge || courseData.maxAge
    })
    if (ageHint) {
      label += ` [${ageHint}]`
    }

    // 添加其他状态提示（时间冲突、选择限制等）
    if (disabledReason && disabledReason !== '已满员') {
      label += ` - ${disabledReason}`
    }

    return {
      label,
      value: getCourseSelectionId(course),
      disabled,
      timeSlots: course.timeSlots,
      ageRestriction: (course as any).ageRestriction || {
        enabled: (course as any).hasAgeRestriction,
        minAge: (course as any).minAge,
        maxAge: (course as any).maxAge,
        description: (course as any).ageDescription
      }
    }
  })
}

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
    // 保险类别现在是可选的
  ],
  selectedCourses: [
    { required: true, message: '请选择至少一门课程', trigger: 'change' },
    {
      type: 'array',
      min: 1,
      validator: (_rule: any, value: string[]) => {
        if (!value || value.length === 0) {
          return Promise.reject('请选择至少一门课程')
        }
        if (value.length > enrollmentLimits.remainingCourseSlots) {
          const semesterNote = formData.semester?.includes('2024') && formData.semester?.includes('秋') ? '（2024年秋季最多3门）' : '（最多2门）'
          return Promise.reject(`${formData.semester || '当前学期'}学期最多只能选择${enrollmentLimits.remainingCourseSlots}门课程${semesterNote}`)
        }
        return Promise.resolve()
      },
      trigger: 'change'
    }
  ],
  studyPeriodStart: [
    // 保险开始日期现在是可选的
  ],
  studyPeriodEnd: [
    // 保险结束日期现在是可选的
  ],
  agreementSigned: [
    { required: true, message: '请选择是否签订超龄协议', trigger: 'change' }
  ],
  familyAddress: [
    { required: true, message: '请输入现居住地址', trigger: 'blur' },
    { min: 5, max: 200, message: '地址长度在5-200个字符', trigger: 'blur' }
  ],
  emergencyContact: [
    { required: true, message: '请输入紧急联系人', trigger: 'blur' },
    { min: 2, max: 20, message: '联系人姓名长度在2-20个字符', trigger: 'blur' }
  ],
  emergencyPhone: [
    { required: true, message: '请输入紧急联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],

  idCardAddress: [
    { required: true, message: '请输入身份证地址', trigger: 'blur' },
    { min: 5, max: 100, message: '地址长度在5-100个字符', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
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
 * 处理身份证号实时输入
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

/**
 * 处理身份证号失焦
 */
const handleIdNumberBlur = async (): Promise<void> => {
  if (formData.idNumber && formData.idNumber.length === 18) {
    try {
      // 查询学员详细报名信息
      const response = await ApplicationService.getStudentEnrollments(formData.idNumber)

      if (response.data.exists) {
        // 学员存在，更新报名限制信息
        const studentData = response.data

        // 更新现有报名记录
        enrollmentLimits.currentEnrollments = studentData.enrollments.map((e: any) => ({
          id: e.id,
          status: e.status,
          courseId: e.course.id,
          course: {
            id: e.course.id,
            name: e.course.name,
            level: e.course.level,
            semester: e.course.semester || ''
          }
        }))

        // 更新报名限制（如果已选择学期）
        if (formData.semester) {
          updateEnrollmentLimits(formData.semester)
        }

        // 显示学员信息提示
        message.info(`发现学员：${studentData.student?.name || '未知'}，已报名${studentData.totalEnrollments}门课程`)

        // 如果有跨学期报名，显示详细信息
        if (studentData.semesterBreakdown.length > 1) {
          const semesterInfo = studentData.semesterBreakdown.map((s: any) =>
            `${s.semester}：${s.count}/${s.limit}门`
          ).join('，')
          message.info(`跨学期报名情况：${semesterInfo}`)
        }
      } else {
        // 新学员，清空现有报名记录
        enrollmentLimits.currentEnrollments = []
        enrollmentLimits.semesterBreakdown = []
        enrollmentLimits.totalEnrollments = 0
        enrollmentLimits.policyDescription = ''

        if (formData.semester) {
          updateEnrollmentLimits(formData.semester)
        }
      }
    } catch (error) {
      console.error('查询学员报名信息失败:', error)
      message.error('查询学员报名信息失败')
    }

    // 再次确认提取出生日期（防止输入过程中的遗漏）
    const birthDate = extractBirthDateFromId(formData.idNumber)
    if (birthDate && !formData.birthDate) {
      formData.birthDate = birthDate
      message.success('已从身份证号码自动填写出生日期')
    }
  }
}

/**
 * 处理保险开始日期变化，自动生成结束日期(1年后)
 */
const handleInsuranceStartDateChange = (date: Dayjs | null): void => {
  if (date) {
    // 自动设置结束日期为开始日期的1年后
    formData.studyPeriodEnd = date.add(1, 'year')
    message.success('已自动设置保险结束日期为1年后')
  } else {
    // 如果开始日期被清空，也清空结束日期
    formData.studyPeriodEnd = ''
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
    // 上传照片到服务器并获取URL
    const response = await ApplicationService.uploadIdCardImage(file)
    if (response.code === 200) {
      formData.photo = response.data.url
      message.success('照片上传成功')
      return true
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    console.error('照片上传失败:', error)
    message.error(`照片上传失败: ${error.message || '未知错误'}`)
    return false
  }
}

/**
 * 处理身份证照片上传
 */
const handleIdCardUpload = async (file: File, type: 'front' | 'back'): Promise<boolean> => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件')
    return false
  }

  // 验证文件大小
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过5MB')
    return false
  }

  try {
    // 显示上传中状态
    const uploadingMessage = message.loading(`正在上传身份证${type === 'front' ? '正面' : '反面'}...`, 0)

    // 调用后端上传接口
    const response = await ApplicationService.uploadIdCardImage(file)

    // 关闭loading消息
    uploadingMessage()

    if (response.code === 200) {
      console.log('🎯 上传成功，服务器返回数据:', response.data)
      console.log('📍 返回的URL:', response.data.url)

      // 保存文件URL到表单数据
      if (type === 'front') {
        formData.idCardFront = response.data.url
        console.log('✅ 正面照片URL已保存:', formData.idCardFront)
      } else {
        formData.idCardBack = response.data.url
        console.log('✅ 反面照片URL已保存:', formData.idCardBack)
      }

      message.success(`身份证${type === 'front' ? '正面' : '反面'}上传成功`)
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    console.error('身份证照片上传失败:', error)
    message.error(`身份证照片上传失败: ${error.message || '未知错误'}`)
  }

  return false // 阻止默认上传行为
}

/**
 * 预览身份证照片
 */
const previewIdCard = (type: 'front' | 'back'): void => {
  console.log('🔍 预览触发:', type)

  if (type === 'front' && (formData.idCardFront || pendingPhotoData.value.idCardFront)) {
    previewImage.value = idCardFrontUrl.value
    previewTitle.value = '身份证正面'
    previewVisible.value = true
    console.log('🖼️ 预览正面图片URL:', previewImage.value)
  } else if (type === 'back' && (formData.idCardBack || pendingPhotoData.value.idCardBack)) {
    previewImage.value = idCardBackUrl.value
    previewTitle.value = '身份证反面'
    previewVisible.value = true
    console.log('🖼️ 预览反面图片URL:', previewImage.value)
  }
}

/**
 * 关闭预览
 */
const handlePreviewCancel = (): void => {
  previewVisible.value = false
  previewImage.value = ''
  previewTitle.value = ''
}

/**
 * 触发身份证重新上传
 */
const triggerIdCardUpload = (type: 'front' | 'back'): void => {
  // 创建一个临时的 input 元素来触发文件选择
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      handleIdCardUpload(file, type)
    }
  }
  input.click()
}

/**
 * 清除身份证照片
 */
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

/**
 * 计算属性：安全处理身份证正面图片URL
 */
const idCardFrontUrl = computed(() => {
  // 优先显示暂存的身份证正面照片
  const frontSource = pendingPhotoData.value.idCardFront || formData.idCardFront
  if (!frontSource) return ''

  console.log('🔍 计算正面URL, 原值:', frontSource)
  console.log('📊 正面数据来源:', pendingPhotoData.value.idCardFront ? '暂存照片' : 'formData照片')

  // 使用统一的图片URL工具函数
  const fullURL = getIdCardUrl(frontSource, 'front')
  console.log('📝 拼接后的正面URL:', fullURL)
  return fullURL
})

/**
 * 计算属性：安全处理身份证反面图片URL
 */
const idCardBackUrl = computed(() => {
  // 优先显示暂存的身份证反面照片
  const backSource = pendingPhotoData.value.idCardBack || formData.idCardBack
  if (!backSource) return ''

  console.log('🔍 计算反面URL, 原值:', backSource)
  console.log('📊 反面数据来源:', pendingPhotoData.value.idCardBack ? '暂存照片' : 'formData照片')

  // 使用统一的图片URL工具函数
  const fullURL = getIdCardUrl(backSource, 'back')
  console.log('📝 拼接后的反面URL:', fullURL)
  return fullURL
})

/**
 * 计算属性：安全处理个人照片URL
 */
const photoUrl = computed(() => {
  // 优先显示暂存的照片数据
  const photoSource = pendingPhotoData.value.photo || formData.photo
  if (!photoSource) return ''

  console.log('🔍 计算照片URL, 原值:', photoSource)
  console.log('📊 数据来源:', pendingPhotoData.value.photo ? '暂存照片' : 'formData照片')

  // 使用统一的图片URL工具函数
  const fullURL = getAvatarUrl(photoSource)
  console.log('📝 拼接后的照片URL:', fullURL)
  return fullURL
})

/**
 * 将base64数据转换为File对象
 */
const base64ToFile = (base64Data: string, fileName: string, mimeType: string = 'image/jpeg'): File => {
  // 去除data:image/jpeg;base64,前缀
  const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '')

  // 将base64转换为字节数组
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  const byteArray = new Uint8Array(byteNumbers)

  // 创建File对象
  return new File([byteArray], fileName, { type: mimeType })
}

/**
 * 上传base64图片并返回服务器URL
 */
const uploadBase64Image = async (base64Data: string, type: 'front' | 'back' | 'photo'): Promise<string | null> => {
  try {
    // 显示上传状态
    const uploadingMessage = message.loading(
      `正在上传${type === 'front' ? '身份证正面' : type === 'back' ? '身份证反面' : '头像照片'}...`,
      0
    )

    // 转换为File对象
    const fileName = `${type === 'photo' ? 'photo' : 'idcard'}_${type}_${Date.now()}.jpg`
    const file = base64ToFile(base64Data, fileName)

    // 调用上传接口
    const response = await ApplicationService.uploadIdCardImage(file)

    // 关闭loading
    uploadingMessage()

    if (response.code === 200) {
      const successMsg = type === 'front' ? '身份证正面' : type === 'back' ? '身份证反面' : '头像照片'
      message.success(`${successMsg}上传成功`)
      return response.data.url
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    console.error('base64图片上传失败:', error)
    message.error(`图片上传失败: ${error.message || '未知错误'}`)
    return null
  }
}

/**
 * 处理表单提交
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value.validate()

    submitting.value = true

    // 添加调试信息
    console.log('📝 开始提交报名表单...')
    console.log('选择的学期:', formData.semester)
    console.log('选择的课程数量:', formData.selectedCourses.length)
    console.log('报名限制信息:', enrollmentLimits)
    console.log('🔍 调试信息:')
    console.log('  - 学期类型:', typeof formData.semester)
    console.log('  - 学期内容:', JSON.stringify(formData.semester))
    console.log('  - 课程ID列表:', formData.selectedCourses)

    // 在提交前先上传暂存的照片
    await uploadPendingPhotos()

    // 转换日期格式（保持前端字段名）
    const submitData = {
      ...formData,
      selectedCourses: getSelectedCourseIds(),
      selectedClassSections: getSelectedClassSectionIds(),
      birthDate: formData.birthDate ? dayjs(formData.birthDate).format('YYYY-MM-DD') : '',
      studyPeriodStart: formData.studyPeriodStart ? dayjs(formData.studyPeriodStart).format('YYYY-MM-DD') : '',
      studyPeriodEnd: formData.studyPeriodEnd ? dayjs(formData.studyPeriodEnd).format('YYYY-MM-DD') : '',
      applicationDate: new Date().toISOString(),
      status: 'pending' as const
    }

    // 提交报名申请（支持多门课程）- 使用V2版本支持年级管理
    const response = await ApplicationService.submitApplicationV2(submitData)

    if (response.code === 200) {
      message.success(response.message)
      // 🎉 成功后清除表单内容和暂存照片
      handleReset()
    } else if (response.code === 400) {
      // 特殊处理课程满员等业务错误
      message.error(response.message || '报名失败')
      // 重新加载课程列表以更新容量信息
      await loadAvailableCourses()
    } else {
      message.error(response.message || '报名提交失败')
    }
  } catch (error: any) {
    console.error('提交失败:', error)

    // 提取具体的错误信息
    let errorMessage = '报名提交失败，请重试'

    if (error.response && error.response.data) {
      const errorData = error.response.data

      // 处理ValidationError - 重复报名等业务错误
      if (errorData.message) {
        errorMessage = errorData.message
      }

      // 处理具体的验证错误
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        const fieldErrors = errorData.errors.map((err: any) => err.message).join('; ')
        errorMessage = `${errorData.message || '提交失败'}: ${fieldErrors}`
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    message.error(errorMessage)
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

  // 重置表单数据
  Object.assign(formData, {
    name: '',
    gender: '男' as '男' | '女',
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
    major: '',
    applicationDate: '',
    status: 'pending' as const,
    photo: '',
    remarks: ''
  })

  // 🔥 清除文件上传列表
  idCardFrontFileList.value = []
  idCardBackFileList.value = []
  fileList.value = []

  // 🔥 清除暂存照片数据
  pendingPhotoData.value = {
    photo: '',
    idCardFront: '',
    idCardBack: ''
  }

  // 🔥 重置其他状态
  submitting.value = false
  previewVisible.value = false
  previewImage.value = ''
  previewTitle.value = ''

  // 🔧 修复：清除报名限制相关信息，为下一个报名人提供清洁界面
  enrollmentLimits.activeEnrollmentsCount = 0
  enrollmentLimits.maxCoursesAllowed = 2
  enrollmentLimits.remainingCourseSlots = 2
  enrollmentLimits.currentEnrollments = []
  enrollmentLimits.semesterBreakdown = []
  enrollmentLimits.totalEnrollments = 0
  enrollmentLimits.policyDescription = ''

  console.log('✅ 表单已完全重置，包括暂存照片数据和报名限制信息')
}

/**
 * 处理身份证读卡器数据读取
 */
const handleIdCardDataRead = async (idCardData: IdCardData): Promise<void> => {
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

  // 身份证地址
  formData.idCardAddress = idCardData.address || ''

  // 现居住地址保持手工填写，不自动填充

  // 出生年月处理 - 优先使用身份证号码提取，其次使用读卡器数据
  if (formData.idNumber) {
    const extractedBirthDate = extractBirthDateFromId(formData.idNumber)
    if (extractedBirthDate) {
      formData.birthDate = extractedBirthDate
      console.log('✅ 从身份证号码提取出生日期:', extractedBirthDate.format('YYYY-MM-DD'))
    }
  } else if (idCardData.birth) {
    const birthDate = formatIdCardDate(idCardData.birth)
    if (birthDate) {
      formData.birthDate = dayjs(birthDate)
      console.log('✅ 从读卡器数据获取出生日期:', birthDate)
    }
  }

  // 先检查该身份证号是否已经存在
  if (formData.idNumber) {
    try {
      const checkResponse = await ApplicationService.checkIdNumberExists(formData.idNumber)
      if (checkResponse.data.exists && checkResponse.data.studentInfo) {
        // 学员已存在，自动填充已有信息
        const studentInfo = checkResponse.data.studentInfo

        // 更新报名限制信息
        enrollmentLimits.activeEnrollmentsCount = checkResponse.data.activeEnrollmentsCount || 0
        enrollmentLimits.currentEnrollments = (studentInfo.enrollments || []).map((e: any) => ({
          ...e,
          course: {
            ...e.course,
            semester: e.course.semester || ''
          }
        }))
        // 根据当前选择的学期动态更新课程限制
        updateEnrollmentLimits(formData.semester)

        // 显示报名状态信息
        const enrollmentInfo = enrollmentLimits.currentEnrollments.length > 0
          ? `，当前已报名${enrollmentLimits.activeEnrollmentsCount}门课程（${enrollmentLimits.currentEnrollments.map(e => e.course.name).join('、')}）`
          : ''

        message.success(`学员 ${studentInfo.name} 的信息已自动填充！还可以报名${enrollmentLimits.remainingCourseSlots}门课程${enrollmentInfo}`)

        // 自动填充表单数据（保留身份证照片，其他信息自动填充）
        formData.name = studentInfo.name || formData.name
        // 性别字段转换：确保是中文值
        if (studentInfo.gender) {
          if (studentInfo.gender === 'MALE' || studentInfo.gender === '男') {
            formData.gender = '男'
          } else if (studentInfo.gender === 'FEMALE' || studentInfo.gender === '女') {
            formData.gender = '女'
          } else {
            formData.gender = '男'
          }
        }
        if (studentInfo.birthDate) {
          formData.birthDate = dayjs(studentInfo.birthDate)
        }
        formData.ethnicity = studentInfo.ethnicity || formData.ethnicity
        formData.educationLevel = studentInfo.educationLevel || formData.educationLevel
        formData.politicalStatus = studentInfo.politicalStatus || formData.politicalStatus
        formData.contactPhone = studentInfo.contactPhone || formData.contactPhone
        formData.idCardAddress = studentInfo.idCardAddress || formData.idCardAddress
        formData.familyAddress = studentInfo.familyAddress || formData.familyAddress
        formData.healthStatus = studentInfo.healthStatus || formData.healthStatus

        // 如果已有照片，自动填充
        if (studentInfo.photo) {
          formData.photo = studentInfo.photo
        }
        if (studentInfo.idCardFront) {
          formData.idCardFront = studentInfo.idCardFront
        }
        if (studentInfo.idCardBack) {
          formData.idCardBack = studentInfo.idCardBack
        }

        // 🔧 修复：身份证读卡器读取后自动填充紧急联系人信息
        // 直接使用数据库中的值，如果为空则清空表单字段，避免数据串联
        formData.emergencyContact = studentInfo.emergencyContact || ''
        formData.emergencyPhone = studentInfo.emergencyPhone || ''
        formData.emergencyRelation = studentInfo.emergencyRelation || ''

        // 保险信息
        formData.insuranceCompany = studentInfo.insuranceCompany || formData.insuranceCompany
        formData.retirementCategory = studentInfo.retirementCategory || formData.retirementCategory
        if (studentInfo.studyPeriodStart) {
          formData.studyPeriodStart = dayjs(studentInfo.studyPeriodStart)
        }
        if (studentInfo.studyPeriodEnd) {
          formData.studyPeriodEnd = dayjs(studentInfo.studyPeriodEnd)
        }

        // 如果已达到报名限制，给出提示
        if (enrollmentLimits.remainingCourseSlots <= 0) {
          message.warning(`您已达到最大报名数量（${enrollmentLimits.maxCoursesAllowed}门），无法继续报名新课程`)
          return
        }

        // 允许继续选择课程进行二次报名
        return
      } else {
        // 重置报名限制信息（新学员）
        enrollmentLimits.activeEnrollmentsCount = 0
        enrollmentLimits.currentEnrollments = []
        // 根据当前选择的学期更新课程限制
        updateEnrollmentLimits(formData.semester)
      }
    } catch (error) {
      console.log('检查身份证号时出错，继续处理照片')
    }
  }

  // 新用户或检查失败时，暂存照片数据，等待提交时统一上传
  await processIdCardPhotos(idCardData)

  // 显示填充完成的消息
  message.success('身份证信息已填充完成')
}

/**
 * 处理身份证照片数据（延迟上传版本）
 */
const processIdCardPhotos = async (idCardData: any): Promise<void> => {
  // 身份证头像照片（从身份证芯片读取的头像）
  if (idCardData.base64Data) {
    // 暂存base64数据，等待提交时上传
    pendingPhotoData.value.photo = `data:image/jpeg;base64,${idCardData.base64Data}`
    console.log('暂存个人头像数据，将在表单提交时上传')
  }

  // 身份证正面完整照片（如果读卡器支持拍照功能）
  if (idCardData.imageFront) {
    pendingPhotoData.value.idCardFront = `data:image/jpeg;base64,${idCardData.imageFront}`
    console.log('暂存身份证正面照片，将在表单提交时上传')
  }

  // 身份证反面完整照片（如果读卡器支持拍照功能）
  if (idCardData.imageBack) {
    pendingPhotoData.value.idCardBack = `data:image/jpeg;base64,${idCardData.imageBack}`
    console.log('暂存身份证反面照片，将在表单提交时上传')
  }

  // 提示用户照片已准备好，将在提交时上传
  if (pendingPhotoData.value.photo || pendingPhotoData.value.idCardFront || pendingPhotoData.value.idCardBack) {
    message.info('身份证照片已准备就绪，将在提交表单时统一上传')
  }
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
 * 上传暂存的照片到服务器
 */
const uploadPendingPhotos = async (): Promise<void> => {
  console.log('🚀 开始批量上传暂存的照片...')

  // 上传个人照片
  if (pendingPhotoData.value.photo && pendingPhotoData.value.photo.startsWith('data:')) {
    console.log('📤 上传个人照片...')
    const photoUrl = await uploadBase64Image(pendingPhotoData.value.photo, 'photo')
    if (photoUrl) {
      formData.photo = photoUrl
      console.log('✅ 个人照片上传成功:', photoUrl)
    }
  }

  // 上传身份证正面
  if (pendingPhotoData.value.idCardFront && pendingPhotoData.value.idCardFront.startsWith('data:')) {
    console.log('📤 上传身份证正面...')
    const frontUrl = await uploadBase64Image(pendingPhotoData.value.idCardFront, 'front')
    if (frontUrl) {
      formData.idCardFront = frontUrl
      console.log('✅ 身份证正面上传成功:', frontUrl)
    }
  }

  // 上传身份证反面
  if (pendingPhotoData.value.idCardBack && pendingPhotoData.value.idCardBack.startsWith('data:')) {
    console.log('📤 上传身份证反面...')
    const backUrl = await uploadBase64Image(pendingPhotoData.value.idCardBack, 'back')
    if (backUrl) {
      formData.idCardBack = backUrl
      console.log('✅ 身份证反面上传成功:', backUrl)
    }
  }

  console.log('✅ 所有照片上传完成')
}

// clearPendingPhotos 函数已移除，因为 handleReset 现在直接清除 pendingPhotoData

/**
 * 获取当前年份学期
 */
const getCurrentYearSemester = (): string => {
  const currentYear = new Date().getFullYear()
  return `${currentYear}年秋季`
}

/**
 * 设置默认学期
 */
const setDefaultSemester = (): void => {
  const currentSemester = getCurrentYearSemester()
  const semesterValues = semesterOptions.value.map(option => option.value)

  if (semesterValues.includes(currentSemester)) {
    formData.semester = currentSemester
    console.log(`设置默认学期为: ${currentSemester}`)
    // 自动加载课程
    loadAvailableCourses()
  } else if (semesterOptions.value.length > 0) {
    formData.semester = semesterOptions.value[0].value
    console.log(`当年学期不存在，设置默认学期为: ${formData.semester}`)
    loadAvailableCourses()
  }
}

/**
 * 加载学期列表
 */
const loadSemesters = async (): Promise<void> => {
  try {
    semestersLoading.value = true
    const response = await CourseService.getSemesters()

    if (response.code === 200) {
      semesterOptions.value = response.data.map((semester: string) => ({
        label: semester,
        value: semester
      }))

      // 设置默认学期（优先当前年份学期）
      setDefaultSemester()
    }
  } catch (error) {
    console.error('获取学期列表失败:', error)
    message.error('获取学期列表失败')
    // 失败时设置默认学期选项
    const currentYear = new Date().getFullYear()
    semesterOptions.value = [
      { label: `${currentYear}年秋季`, value: `${currentYear}年秋季` },
      { label: `${currentYear-1}年秋季`, value: `${currentYear-1}年秋季` }
    ]
    setDefaultSemester()
  } finally {
    semestersLoading.value = false
  }
}

/**
 * 处理学期变更
 */
const handleSemesterChange = async (): Promise<void> => {
  // 清空已选课程
  formData.selectedCourses = []

  // 重新加载该学期的课程
  await loadAvailableCourses()
}

/**
 * 获取可报名课程
 */
const loadAvailableCourses = async (): Promise<void> => {
  if (!formData.semester) {
    availableCourses.value = []
    courseOptions.value = []
    return
  }

  try {
    coursesLoading.value = true
    // 根据学期查询课程
    const response = await CourseService.getPublicCourses({
      page: 1,
      pageSize: 100,
      semester: formData.semester
    })

    if (response.code === 200) {
      // 存储完整课程数据，使用后端API计算的正确容量信息
      availableCourses.value = response.data.list.map((course: any) => ({
        ...course,
        enrolled: course.enrolled || 0, // 使用后端计算的正确值 (PENDING + APPROVED)
        capacity: course.capacity || course.maxStudents || 0,
        // 确保年龄限制字段存在
        hasAgeRestriction: course.hasAgeRestriction || false,
        minAge: course.minAge || null,
        maxAge: course.maxAge || null,
        ageDescription: course.ageDescription || null
      }))

      // 初始化课程选项
      updateCourseOptionsAvailability()
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    message.error('获取课程列表失败')
  } finally {
    coursesLoading.value = false
  }
}

/**
 * 监听出生日期变化，重新验证课程年龄限制
 */
watch(() => formData.birthDate, () => {
  // 当出生日期变化时，重新检查课程可用性
  updateCourseOptionsAvailability()

  // 检查已选课程是否仍符合年龄要求
  if (formData.selectedCourses.length > 0 && formData.birthDate) {
    const studentAge = calculateAge(formData.birthDate)
    const invalidCourses: string[] = []

    formData.selectedCourses.forEach(courseId => {
      const course = findCourseBySelectionId(courseId)
      if (course) {
        const courseData = course as any
        const ageCheck = checkAgeRestriction(studentAge, {
          enabled: courseData.ageRestriction?.enabled || courseData.hasAgeRestriction,
          minAge: courseData.ageRestriction?.minAge || courseData.minAge,
          maxAge: courseData.ageRestriction?.maxAge || courseData.maxAge,
          description: courseData.ageRestriction?.description || courseData.ageDescription
        })

        if (!ageCheck.isEligible) {
          invalidCourses.push(courseId)
        }
      }
    })

    // 移除不符合年龄要求的课程
    if (invalidCourses.length > 0) {
      formData.selectedCourses = formData.selectedCourses.filter(id => !invalidCourses.includes(id))
      const courseNames = invalidCourses.map(id => {
        const course = findCourseBySelectionId(id)
        return course?.name || '未知课程'
      }).join('、')
      message.warning(`根据您的年龄，已自动移除不符合要求的课程：${courseNames}`)
    }
  }
})

/**
 * 监听学期选择变化，动态更新课程数量限制
 */
watch(() => formData.semester, (newSemester: string) => {
  updateEnrollmentLimits(newSemester)
  // 如果已选课程数量超过新限制，则清空选择
  if (formData.selectedCourses.length > enrollmentLimits.remainingCourseSlots) {
    formData.selectedCourses = []
    const semesterNote = enrollmentLimits.maxCoursesAllowed === 3 ? '（2024年秋季最多3门）' : '（最多2门）'
    message.warning(`学期变化，课程限制已更新${semesterNote}`)
  }
})

/**
 * 监听课程选择变化，限制最多选择剩余可报名课程数量并检查时间冲突
 */
watch(() => formData.selectedCourses, (newCourses: string[], oldCourses: string[]) => {
  // 限制最多选择剩余可报名课程数量
  const maxAllowed = enrollmentLimits.remainingCourseSlots
  if (newCourses.length > maxAllowed) {
    formData.selectedCourses = newCourses.slice(0, maxAllowed)
    const semesterNote = enrollmentLimits.maxCoursesAllowed === 3 ? '（2024年秋季最多3门）' : ''
    message.warning(`本次最多只能选择${maxAllowed}门课程${semesterNote}`)
    return
  }

  // 检查时间冲突（当添加新课程时）
  if (newCourses.length > oldCourses.length && newCourses.length > 1) {
    const newCourseId = newCourses.find(id => !oldCourses.includes(id))
    if (newCourseId) {
      // 检查新课程与所有已选课程的时间冲突
      const newCourse = findCourseBySelectionId(newCourseId)
      if (newCourse) {
        for (const existingCourseId of oldCourses) {
          const existingCourse = findCourseBySelectionId(existingCourseId)
          if (existingCourse && hasTimeConflict(newCourse.timeSlots, existingCourse.timeSlots)) {
            // 移除新添加的课程
            formData.selectedCourses = oldCourses
            message.error(`课程"${newCourse.name}"与已选课程"${existingCourse.name}"时间冲突，请选择不同时间段的课程`)
            return
          }
        }
      }
    }
  }

  // 检查新选课程的年龄限制
  if (newCourses.length > oldCourses.length && formData.birthDate) {
    const newCourseId = newCourses.find(id => !oldCourses.includes(id))
    if (newCourseId) {
      const course = findCourseBySelectionId(newCourseId)
      if (course) {
        const studentAge = calculateAge(formData.birthDate)
        const courseData = course as any
        const ageCheck = checkAgeRestriction(studentAge, {
          enabled: courseData.ageRestriction?.enabled || courseData.hasAgeRestriction,
          minAge: courseData.ageRestriction?.minAge || courseData.minAge,
          maxAge: courseData.ageRestriction?.maxAge || courseData.maxAge,
          description: courseData.ageRestriction?.description || courseData.ageDescription
        })

        if (!ageCheck.isEligible) {
          // 移除不符合年龄要求的课程
          formData.selectedCourses = oldCourses
          message.error(ageCheck.message || '您的年龄不符合该课程的报名要求')
          return
        }
      }
    }
  }

  // 更新课程选项的可用状态
  updateCourseOptionsAvailability()
}, { deep: true })

/**
 * 组件挂载时初始化
 */
onMounted((): void => {
  loadSemesters()
  // 🔧 初始化课程限制（使用默认值）
  updateEnrollmentLimits()
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

.id-card-uploader :deep(.ant-upload) {
  width: 200px;
  height: 120px;
}

.id-card-upload-area {
  width: 200px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
  background: #fafafa;
}

.id-card-upload-area:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.id-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.id-card-placeholder {
  text-align: center;
  padding: 10px;
}

.id-card-image {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.id-card-image:hover {
  transform: scale(1.05);
}

/* 身份证照片操作按钮样式 */
.id-card-upload-area .relative:hover .absolute {
  opacity: 1;
}

.id-card-upload-area .absolute {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.id-card-upload-area .absolute .ant-btn {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  background-color: rgba(255, 255, 255, 0.9);
}

.id-card-upload-area .absolute .ant-btn:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

.id-card-preview-modal .preview-image-container {
  text-align: center;
  padding: 20px;
}

.id-card-preview-modal .preview-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
