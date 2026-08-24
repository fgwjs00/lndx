<template>
  <div class="mobile-registration min-h-screen">
    <header class="mobile-app-bar sticky top-0 z-50">
      <div class="flex items-center justify-between px-4 py-3">
        <button type="button" aria-label="返回上一页" @click="handleBack" class="m3-back-button">
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
          <span>返回</span>
        </button>
        <h1 class="m3-app-title">学员报名</h1>
        <span class="m3-app-bar-spacer" aria-hidden="true"></span>
      </div>
    </header>

    <section class="m3-progress-card mx-4 mt-4" aria-labelledby="registration-step-title">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="m3-overline">报名进度 · 第 {{ currentStep }} 步，共 {{ totalSteps }} 步</div>
          <h2 id="registration-step-title" class="m3-page-title">{{ currentStepMeta.title }}</h2>
          <p class="m3-page-description">{{ currentStepMeta.description }}</p>
        </div>
        <output class="m3-selection-count" aria-live="polite">
          <span>已选课程</span>
          <strong>{{ formData.selectedCourses.length }}/2</strong>
        </output>
      </div>

      <ol class="m3-stepper" aria-label="报名步骤">
        <li
          v-for="step in stepLabels"
          :key="step.index"
          :class="[
            'm3-stepper-item',
            currentStep === step.index
              ? 'is-current'
              : currentStep > step.index
                ? 'is-complete'
                : ''
          ]"
        >
          <span class="m3-stepper-number">{{ step.index }}</span>
          <span class="m3-stepper-label">{{ step.shortTitle }}</span>
        </li>
      </ol>
    </section>

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
        <section class="m3-form-card">
          <h2 class="m3-section-title">基本信息</h2>
          <p class="m3-section-description">请按身份证信息填写，联系电话用于接收学校通知。</p>

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
            <div class="mt-1 text-xs text-gray-500">
              <i class="fas fa-id-card mr-1 text-blue-500"></i>出生日期将根据身份证号码自动填写
            </div>
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

          <a-form-item name="contactPhone" label="报名手机号" class="mb-4">
            <a-input
              v-model:value="formData.contactPhone"
              placeholder="请输入用于接收报名通知的手机号"
              inputmode="tel"
              autocomplete="tel"
              size="large"
              class="rounded-lg"
            />
            <div class="m3-helper-text">无需短信验证码，学校将通过此号码联系您。</div>
          </a-form-item>

          <section class="m3-identity-materials" aria-labelledby="identity-materials-title">
            <h3 id="identity-materials-title" class="m3-subsection-title">身份材料</h3>
            <p class="m3-subsection-description">请拍摄清晰照片。身份证四角、姓名和号码都要完整可见。</p>

            <a-form-item name="photoFileId" label="本人近期照片" class="mb-4">
              <label class="m3-document-upload" :class="{ 'is-uploading': loading.profilePhotoUpload }">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="user"
                  :disabled="loading.profilePhotoUpload"
                  @change="handleProfilePhotoChange"
                />
                <span class="m3-document-upload-action">
                  <i class="fas fa-camera" aria-hidden="true"></i>
                  {{ loading.profilePhotoUpload ? '本人照片上传中...' : '拍照或选择本人照片' }}
                </span>
              </label>
              <div v-if="formData.photoFileName" class="m3-upload-success">已上传：{{ formData.photoFileName }}</div>
              <div v-if="identityPreviewUrls.photo" class="m3-upload-preview">
                <a-image
                  :src="identityPreviewUrls.photo"
                  alt="本人近期照片预览"
                  class="m3-upload-preview-image is-profile-photo"
                />
                <div class="m3-upload-preview-caption">
                  <i class="fas fa-magnifying-glass-plus" aria-hidden="true"></i>
                  照片预览，点击图片可查看大图
                </div>
              </div>
              <div class="m3-helper-text">正面、免冠、近期照片，支持 JPG、PNG、WEBP，大小不超过 5MB。</div>
            </a-form-item>

            <a-form-item name="idCardFrontFileId" label="身份证正面照片" class="mb-4">
              <label class="m3-document-upload" :class="{ 'is-uploading': loading.idCardFrontUpload }">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  :disabled="loading.idCardFrontUpload"
                  @change="handleIdCardFrontChange"
                />
                <span class="m3-document-upload-action">
                  <i class="fas fa-id-card" aria-hidden="true"></i>
                  {{ loading.idCardFrontUpload ? '身份证正面上传中...' : '拍照或选择身份证正面' }}
                </span>
              </label>
              <div v-if="formData.idCardFrontFileName" class="m3-upload-success">已上传：{{ formData.idCardFrontFileName }}</div>
              <div v-if="identityPreviewUrls.idCardFront" class="m3-upload-preview">
                <a-image
                  :src="identityPreviewUrls.idCardFront"
                  alt="身份证正面照片预览"
                  class="m3-upload-preview-image"
                />
                <div class="m3-upload-preview-caption">
                  <i class="fas fa-magnifying-glass-plus" aria-hidden="true"></i>
                  正面照片预览，点击图片可查看大图
                </div>
              </div>
            </a-form-item>

            <a-form-item name="idCardBackFileId" label="身份证背面照片" class="mb-0">
              <label class="m3-document-upload" :class="{ 'is-uploading': loading.idCardBackUpload }">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  :disabled="loading.idCardBackUpload"
                  @change="handleIdCardBackChange"
                />
                <span class="m3-document-upload-action">
                  <i class="fas fa-id-card" aria-hidden="true"></i>
                  {{ loading.idCardBackUpload ? '身份证背面上传中...' : '拍照或选择身份证背面' }}
                </span>
              </label>
              <div v-if="formData.idCardBackFileName" class="m3-upload-success">已上传：{{ formData.idCardBackFileName }}</div>
              <div v-if="identityPreviewUrls.idCardBack" class="m3-upload-preview">
                <a-image
                  :src="identityPreviewUrls.idCardBack"
                  alt="身份证背面照片预览"
                  class="m3-upload-preview-image"
                />
                <div class="m3-upload-preview-caption">
                  <i class="fas fa-magnifying-glass-plus" aria-hidden="true"></i>
                  背面照片预览，点击图片可查看大图
                </div>
              </div>
            </a-form-item>
          </section>

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
          <a-form-item name="healthStatus" label="健康状况" class="mb-4">
            <a-select
              v-model:value="formData.healthStatus"
              placeholder="请选择健康状况"
              size="large"
              class="w-full"
              :options="healthStatusOptions"
            />
          </a-form-item>

          <a-form-item name="educationLevel" label="文化程度" class="mb-4">
            <a-select
              v-model:value="formData.educationLevel"
              placeholder="请选择文化程度"
              size="large"
              class="w-full"
              :options="educationLevelOptions"
            />
          </a-form-item>

          <a-form-item name="politicalStatus" label="政治面貌" class="mb-4">
            <a-select
              v-model:value="formData.politicalStatus"
              placeholder="请选择政治面貌"
              size="large"
              class="w-full"
              :options="politicalStatusOptions"
            />
          </a-form-item>

          <a-form-item name="isRetired" label="工作状态" class="mb-0">
            <a-radio-group v-model:value="formData.isRetired" size="large" class="w-full">
              <a-radio :value="false" class="block mb-2">在职</a-radio>
              <a-radio :value="true" class="block">退休</a-radio>
            </a-radio-group>
          </a-form-item>
        </section>
      </div>

      <!-- 步骤2：保险信息 -->
      <div v-show="currentStep === 2" class="p-4 space-y-4">
        <section class="m3-form-card">
          <h2 class="m3-section-title">保险信息</h2>
          <p class="m3-section-description">请先填写保险资料；下一步选择学期后可核对对应保险年度。</p>

          <!-- 保险公司 -->
          <a-form-item name="insuranceCompany" label="保险公司" class="mb-4">
            <a-select
              v-model:value="formData.insuranceCompany"
              placeholder="请选择保险公司"
              size="large"
              class="w-full"
              :options="insuranceCompanyOptions"
            />
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

          <div class="grid gap-3 sm:grid-cols-2 mt-5">
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

          <a-form-item name="insuranceAttachmentFileId" label="保险凭证" class="mb-4">
            <div class="m3-file-upload">
              <input
                type="file"
                accept="image/*,.pdf"
                :disabled="loading.insuranceUpload"
                @change="handleInsuranceFileChange"
                class="block w-full text-sm text-gray-700"
              />
              <div v-if="loading.insuranceUpload" class="mt-2 text-sm text-blue-600">保险凭证上传中...</div>
              <div v-if="formData.insuranceAttachmentName" class="mt-2 text-sm text-green-700">
                已上传：{{ formData.insuranceAttachmentName }}
              </div>
              <div class="mt-2 text-xs text-gray-500">支持图片或 PDF，大小不超过 10MB。</div>
            </div>
          </a-form-item>

          <a-form-item name="agreementSigned" label="超龄协议" class="mb-0">
            <a-radio-group v-model:value="formData.agreementSigned" size="large">
              <a-radio :value="true" class="block mb-2">已签订超龄协议</a-radio>
              <a-radio :value="false" class="block">无需签订</a-radio>
            </a-radio-group>
          </a-form-item>
        </section>
      </div>

      <!-- 步骤3：课程选择 -->
      <div v-show="currentStep === 3" class="p-4 space-y-4">
        <section class="m3-form-card">
          <h2 class="m3-section-title">选择课程</h2>
          <p class="m3-section-description">可选一至两门课程，课程时间不能冲突。</p>

          <a-form-item name="semester" label="报名学期" class="mb-4">
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

          <div v-if="insuranceRequirement" class="m3-insurance-notice mb-4">
            所填保险有效期需覆盖 {{ insuranceRequirement.requiredInsuranceStart }} 至 {{ insuranceRequirement.requiredInsuranceEnd }}；日期不符请返回上一步修改。
          </div>

          <div v-if="formData.semester" class="course-discovery mb-4" aria-label="选择课程大类或搜索课程">
            <section class="m3-category-picker" aria-labelledby="course-category-title">
              <h3 id="course-category-title" class="m3-choice-title">先选择课程大类</h3>
              <p class="m3-filter-help">点选一个大类后，只会显示这一类课程。</p>
              <div class="m3-category-grid" role="group" aria-label="课程大类">
                <button
                  v-for="filter in courseCategoryFilters"
                  :key="filter.name"
                  type="button"
                  :aria-pressed="activeCourseCategory === filter.name"
                  :class="['m3-category-tile', { 'is-selected': activeCourseCategory === filter.name }]"
                  @click="selectCourseCategory(filter.name)"
                >
                  <span class="m3-category-tile-title">{{ filter.name }}</span>
                  <span class="m3-category-tile-count">{{ filter.count }}门课程</span>
                </button>
              </div>
            </section>

            <div class="m3-direct-search">
              <label class="m3-search-label" for="course-search">知道课程名称？可直接搜索</label>
              <a-input
                id="course-search"
                v-model:value="courseSearchQuery"
                placeholder="例如：手机、书法、摄影"
                size="large"
                allow-clear
                class="m3-course-search"
              >
                <template #prefix>
                  <i class="fas fa-search" aria-hidden="true"></i>
                </template>
              </a-input>
            </div>
          </div>

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
            <div v-else class="space-y-4">
              <div class="m3-selection-summary">
                {{ selectedCourseSummary }}
              </div>
              <p v-if="!courseSearchQuery.trim() && !activeCourseCategory" class="m3-course-guidance">
                请先点选上方的一个课程大类。知道课程名称时，也可以直接搜索。
              </p>
              <template v-else>
                <p class="m3-results-title">{{ courseResultTitle }}</p>
                <button
                  type="button"
                  :aria-pressed="formData.selectedCourses.includes(getCourseSelectionId(course))"
                  v-for="course in visibleCourses"
                  :key="getCourseSelectionId(course)"
                  :class="[
                   'course-card',
                   formData.selectedCourses.includes(getCourseSelectionId(course))
                     ? 'is-selected'
                     : ''
                  ]"
                  @click="handleCourseSelect(getCourseSelectionId(course))"
                >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="font-medium text-gray-900">{{ course.name }}</h3>
                      <span class="m3-course-category">{{ course.category || '未分类' }}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ course.description }}</p>
                    <div class="flex items-center mt-2 text-xs text-gray-500">
                      <span class="mr-3">
                        <i class="fas fa-clock mr-1"></i>{{ getCourseDuration(course) }}学时
                      </span>
                      <span class="mr-3">
                        <i class="fas fa-calendar mr-1"></i>{{ formatCourseTimeSlots(course) }}
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
                        formData.selectedCourses.includes(getCourseSelectionId(course))
                          ? 'fa-check-circle text-blue-500'
                          : 'fa-circle text-gray-300'
                      ]"
                    ></i>
                  </div>
                </div>
                </button>
                <p v-if="visibleCourses.length === 0" class="m3-empty-courses">
                  没有找到相关课程，请换一个名称搜索，或重新选择课程大类。
                </p>
              </template>
            </div>
          </a-form-item>

        </section>
      </div>

      <!-- 步骤4：联系信息 -->
      <div v-show="currentStep === 4" class="p-4 space-y-4">
        <section class="m3-form-card">
          <h2 class="m3-section-title">联系信息</h2>
          <p class="m3-section-description">填写一位方便联系的家人或紧急联系人。</p>

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
        </section>
      </div>

      <!-- 步骤5：本人确认与手写签名 -->
      <div v-show="currentStep === 5" class="p-4 space-y-4">
        <section class="m3-form-card">
          <h2 class="m3-section-title">本人确认与签名</h2>
          <p class="m3-section-description">请核对报名信息，再由学员本人用手指签写姓名。</p>

          <div class="m3-signature-summary" aria-label="待确认报名信息">
            <div>
              <span>报名学员</span>
              <strong>{{ formData.name || '未填写' }}</strong>
            </div>
            <div>
              <span>报名学期</span>
              <strong>{{ formData.semester || '未选择' }}</strong>
            </div>
            <div class="is-full-width">
              <span>所选课程</span>
              <strong>{{ selectedCourseNames || '未选择' }}</strong>
            </div>
          </div>

          <div class="m3-signature-declaration">
            本人确认以上资料真实、准确，并同意学校按照报名和学籍管理需要使用所提交的资料。
          </div>

          <a-form-item name="signatureCaptured" label="本人手写签名" class="mb-0">
            <HandwrittenSignaturePad
              ref="signaturePadRef"
              @change="handleSignatureChange"
            />
            <div class="m3-helper-text">请本人在框内签写姓名；写错可点击“清除重签”。</div>
          </a-form-item>
        </section>
      </div>
    </a-form>

    <!-- 底部操作按钮 -->
    <div class="sticky-action-bar fixed bottom-0 left-0 right-0 z-40">
      <div class="m3-action-context">
        {{ currentStep === 3 ? selectedCourseSummary : currentStepMeta.description }}
      </div>
      <div class="flex gap-3">
        <a-button
          v-if="currentStep > 1"
          @click="prevStep"
          size="large"
          class="m3-secondary-action flex-1"
        >
          上一步
        </a-button>
        <a-button
          v-if="currentStep < totalSteps"
          @click="nextStep"
          type="primary"
          size="large"
          class="m3-primary-action flex-1"
        >
          下一步
        </a-button>
        <a-button
          v-if="currentStep === totalSteps"
          @click="handleSubmit"
          type="primary"
          size="large"
          :loading="loading.submit"
          class="m3-primary-action flex-1"
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
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ApplicationService } from '@/api/application'
import { CourseService } from '@/api/course'
import { InsuranceService } from '@/api/insurance'
import type { PublicRegistrationCourse } from '@/api/course'
import { calculateAge, checkAgeRestriction, getAgeRestrictionHint } from '@/utils/ageUtils'
import HandwrittenSignaturePad from '@/components/HandwrittenSignaturePad.vue'

// 路由实例
const router = useRouter()

// 表单引用
const formRef = ref()
const signaturePadRef = ref<{ clear: () => void } | null>(null)
const signatureBlob = ref<Blob | null>(null)

// 步骤控制
const currentStep = ref<number>(1)
const totalSteps = ref<number>(5)
const stepLabels = [
  { index: 1, shortTitle: '身份', title: '填写学员信息', description: '核对姓名、身份证号和基础健康信息' },
  { index: 2, shortTitle: '保险', title: '填写保险信息', description: '填写保险资料并上传凭证' },
  { index: 3, shortTitle: '选课', title: '选择报名课程', description: '先选择学期，再按类别选择课程' },
  { index: 4, shortTitle: '联系', title: '确认联系方式', description: '留下常用电话和紧急联系人' },
  { index: 5, shortTitle: '签名', title: '本人确认签名', description: '请学员本人核对资料并手写签名' }
]
const currentStepMeta = computed(() => {
  return stepLabels.find(step => step.index === currentStep.value) || stepLabels[0]
})

// 加载状态
const loading = reactive({
  semesters: false,
  courses: false,
  insuranceUpload: false,
  profilePhotoUpload: false,
  idCardFrontUpload: false,
  idCardBackUpload: false,
  signatureUpload: false,
  submit: false
})

// 学期选项
const semesterOptions = ref<Array<{ label: string; value: string }>>([]);

// 可用课程
const availableCourses = ref<PublicRegistrationCourse[]>([])
const courseSearchQuery = ref('')
const activeCourseCategory = ref('')

const groupedAvailableCourses = computed(() => {
  const groups = new Map<string, PublicRegistrationCourse[]>()

  availableCourses.value.forEach(course => {
    const category = String(course.category || '未分类').trim() || '未分类'
    if (!groups.has(category)) {
      groups.set(category, [])
    }
    groups.get(category)!.push(course)
  })

  return Array.from(groups.entries()).map(([category, courses]) => ({
    category,
    courses
  }))
})

const courseCategoryFilters = computed(() => {
  return groupedAvailableCourses.value.map(group => ({ name: group.category, count: group.courses.length }))
})

const courseMatchesSearch = (course: PublicRegistrationCourse, keyword: string): boolean => {
  if (!keyword) {
    return true
  }

  const searchableText = [
    course.name,
    course.description,
    course.category,
    course.location,
    course.teacher
  ].filter(Boolean).join(' ').toLowerCase()

  return searchableText.includes(keyword)
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日'
}

const getCourseDuration = (course: PublicRegistrationCourse): number => {
  return Number.isFinite(course.duration) ? Number(course.duration) : 0
}

const formatCourseTimeSlots = (course: PublicRegistrationCourse): string => {
  if (!Array.isArray(course.timeSlots) || course.timeSlots.length === 0) {
    return '时间待定'
  }

  return course.timeSlots
    .slice(0, 2)
    .map(slot => {
      const weekday = WEEKDAY_LABELS[Number(slot.dayOfWeek)] || '时间待定'
      if (!slot.startTime || !slot.endTime) {
        return weekday
      }
      return `${weekday} ${slot.startTime}-${slot.endTime}`
    })
    .join('；')
}

const visibleCourses = computed(() => {
  const keyword = courseSearchQuery.value.trim().toLowerCase()
  if (keyword) {
    return availableCourses.value.filter(course => courseMatchesSearch(course, keyword))
  }

  if (!activeCourseCategory.value) {
    return []
  }

  return availableCourses.value.filter(course => {
    const category = String(course.category || '未分类').trim() || '未分类'
    return category === activeCourseCategory.value
  })
})

const courseResultTitle = computed(() => {
  const keyword = courseSearchQuery.value.trim()
  if (keyword) {
    return `搜索“${keyword}”的课程`
  }

  return `${activeCourseCategory.value}课程`
})

const syncCourseCategorySelection = (): void => {
  const categories = groupedAvailableCourses.value.map(group => group.category)
  if (activeCourseCategory.value && !categories.includes(activeCourseCategory.value)) {
    activeCourseCategory.value = ''
  }
}

const selectCourseCategory = (category: string): void => {
  activeCourseCategory.value = category
  courseSearchQuery.value = ''
}

const getCourseSelectionId = (course: PublicRegistrationCourse): string => {
  return String(course.classSectionId || course.id)
}

const findCourseBySelectionId = (selectionId: string): PublicRegistrationCourse | undefined => {
  return availableCourses.value.find(course => getCourseSelectionId(course) === selectionId)
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

const insuranceRequirement = ref<any>(null)

// 表单数据
const formData = reactive({
  // 基本信息
  name: '',
  gender: '',
  birthDate: null as Dayjs | null,
  idNumber: '',
  contactPhone: '',
  ethnicity: '',
  healthStatus: '',
  photoFileId: '',
  photoFileName: '',
  idCardFrontFileId: '',
  idCardFrontFileName: '',
  idCardBackFileId: '',
  idCardBackFileName: '',

  // 教育和工作信息
  educationLevel: '',
  politicalStatus: '',
  isRetired: false,
  insuranceCompany: '',
  retirementCategory: '',

  // 学期选择
  semester: '',

  // 课程选择
  selectedCourses: [] as string[],
  studyPeriodStart: null as Dayjs | null,
  studyPeriodEnd: null as Dayjs | null,
  insuranceAttachmentFileId: '',
  insuranceAttachmentName: '',
  agreementSigned: false,
  signatureFileId: '',
  signatureCaptured: false,

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

const selectedCourseObjects = computed(() => {
  return formData.selectedCourses
    .map(selectionId => findCourseBySelectionId(selectionId))
    .filter((course): course is PublicRegistrationCourse => Boolean(course))
})

const selectedCourseSummary = computed(() => {
  if (selectedCourseObjects.value.length === 0) {
    return '还未选择课程，最多可选2门'
  }

  const names = selectedCourseObjects.value.map(course => course.name).join('、')
  return `已选 ${selectedCourseObjects.value.length}/2 门：${names}`
})

const selectedCourseNames = computed(() => {
  return selectedCourseObjects.value.map(course => course.name).join('、')
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
  contactPhone: [
    { required: true, message: '请输入报名手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  photoFileId: [
    { required: true, message: '请上传本人近期照片', trigger: 'change' }
  ],
  idCardFrontFileId: [
    { required: true, message: '请上传身份证正面照片', trigger: 'change' }
  ],
  idCardBackFileId: [
    { required: true, message: '请上传身份证背面照片', trigger: 'change' }
  ],
  isRetired: [
    { required: true, message: '请选择工作状态', trigger: 'change' }
  ],
  insuranceCompany: [
    { required: true, message: '请选择保险公司', trigger: 'change' }
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
  insuranceAttachmentFileId: [
    { required: true, message: '请上传保险凭证', trigger: 'change' }
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
  ],
  signatureCaptured: [
    {
      validator: async (_rule: unknown, value: boolean) => {
        if (!value) {
          throw new Error('请由学员本人完成手写签名')
        }
      },
      trigger: 'change'
    }
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

const insuranceCompanyOptions = [
  { value: '中国人寿', label: '中国人寿' },
  { value: '中国平安', label: '中国平安' },
  { value: '中国太保', label: '中国太保' },
  { value: '中国人保', label: '中国人保' },
  { value: '泰康保险', label: '泰康保险' },
  { value: '太平保险', label: '太平保险' },
  { value: '其他', label: '其他' }
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
const isCourseAgeEligible = (course: PublicRegistrationCourse): boolean => {
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
    const course = findCourseBySelectionId(courseId)
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
      fieldsToValidate.push(
        'name',
        'gender',
        'birthDate',
        'idNumber',
        'contactPhone',
        'photoFileId',
        'idCardFrontFileId',
        'idCardBackFileId',
        'ethnicity',
        'healthStatus',
        'educationLevel',
        'politicalStatus',
        'isRetired'
      )
      break
    case 2:
      fieldsToValidate.push(
        'insuranceCompany',
        'retirementCategory',
        'studyPeriodStart',
        'studyPeriodEnd',
        'insuranceAttachmentFileId',
        'agreementSigned'
      )
      break
    case 3:
      fieldsToValidate.push('semester', 'selectedCourses')
      break
    case 4:
      fieldsToValidate.push('familyAddress', 'familyPhone', 'emergencyContact', 'emergencyPhone')
      break
    case 5:
      fieldsToValidate.push('signatureCaptured')
      break
  }

  await formRef.value?.validateFields(fieldsToValidate)
}

const handleSignatureChange = (blob: Blob | null): void => {
  signatureBlob.value = blob
  formData.signatureCaptured = Boolean(blob)
  formData.signatureFileId = ''
  void formRef.value?.validateFields(['signatureCaptured']).catch(() => undefined)
}

const resetSignature = (): void => {
  signatureBlob.value = null
  formData.signatureFileId = ''
  formData.signatureCaptured = false
  signaturePadRef.value?.clear()
}

const ensureSignatureUploaded = async (): Promise<string> => {
  if (formData.signatureFileId) {
    return formData.signatureFileId
  }

  if (!signatureBlob.value) {
    throw new Error('请由学员本人完成手写签名')
  }

  if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
    throw new Error('请先填写正确的报名手机号')
  }

  try {
    loading.signatureUpload = true
    const signatureFile = new File(
      [signatureBlob.value],
      `registration-signature-${Date.now()}.png`,
      { type: 'image/png' }
    )
    const response = await ApplicationService.uploadPublicRegistrationSignature(
      signatureFile,
      formData.contactPhone
    )
    if (response.code !== 200 || !response.data?.fileId) {
      throw new Error(response.message || '手写签名保存失败')
    }

    formData.signatureFileId = response.data.fileId
    return formData.signatureFileId
  } finally {
    loading.signatureUpload = false
  }
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
      contactPhone: formData.contactPhone,
      ethnicity: formData.ethnicity,
      healthStatus: formData.healthStatus,
      educationLevel: formData.educationLevel,
      politicalStatus: formData.politicalStatus,
      isRetired: formData.isRetired,
      photoFileId: formData.photoFileId,
      idCardFrontFileId: formData.idCardFrontFileId,
      idCardBackFileId: formData.idCardBackFileId,
      insuranceCompany: formData.insuranceCompany,
      retirementCategory: formData.retirementCategory,
      semester: formData.semester,
      selectedCourses: getSelectedCourseIds(),
      selectedClassSections: getSelectedClassSectionIds(),
      studyPeriodStart: formData.studyPeriodStart?.format('YYYY-MM-DD'),
      studyPeriodEnd: formData.studyPeriodEnd?.format('YYYY-MM-DD'),
      insuranceAttachmentFileId: formData.insuranceAttachmentFileId,
      signatureFileId: await ensureSignatureUploaded(),
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
    message.error(error?.message || '提交失败，请检查表单信息')
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
    const response = await CourseService.getPublicSemesters()

    if (response.code === 200) {
      semesterOptions.value = response.data.map((semester: string) => ({
        label: semester,
        value: semester
      }))

      // 如果只有一个学期，自动选择
      if (semesterOptions.value.length === 1) {
        formData.semester = semesterOptions.value[0].value
        await loadInsuranceRequirement()
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
  activeCourseCategory.value = ''
  courseSearchQuery.value = ''
  formData.insuranceAttachmentFileId = ''
  formData.insuranceAttachmentName = ''

  // 重新加载该学期的保险要求和课程
  await loadInsuranceRequirement()
  await loadCourses()
}

/**
 * 加载当前学期保险要求
 */
const loadInsuranceRequirement = async (): Promise<void> => {
  if (!formData.semester) {
    insuranceRequirement.value = null
    return
  }

  try {
    const response = await InsuranceService.getInsuranceRequirement(formData.semester)
    if (response.code === 200) {
      insuranceRequirement.value = response.data
    }
  } catch (error: any) {
    console.error('加载保险要求失败:', error)
    insuranceRequirement.value = null
    message.warning('保险要求加载失败，请稍后重试')
  }
}

type IdentityUploadTarget = 'photo' | 'idCardFront' | 'idCardBack'

const identityPreviewUrls = reactive<Record<IdentityUploadTarget, string>>({
  photo: '',
  idCardFront: '',
  idCardBack: ''
})

const clearIdentityPreview = (target: IdentityUploadTarget): void => {
  const previewUrl = identityPreviewUrls[target]
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl)
    identityPreviewUrls[target] = ''
  }
}

const setIdentityPreview = (target: IdentityUploadTarget, file: File): void => {
  clearIdentityPreview(target)
  identityPreviewUrls[target] = URL.createObjectURL(file)
}

const IDENTITY_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])

const identityUploadConfig = {
  photo: {
    documentType: 'PROFILE_PHOTO' as const,
    label: '本人照片',
    loadingKey: 'profilePhotoUpload' as const,
    fileIdKey: 'photoFileId' as const,
    fileNameKey: 'photoFileName' as const
  },
  idCardFront: {
    documentType: 'ID_CARD_FRONT' as const,
    label: '身份证正面照片',
    loadingKey: 'idCardFrontUpload' as const,
    fileIdKey: 'idCardFrontFileId' as const,
    fileNameKey: 'idCardFrontFileName' as const
  },
  idCardBack: {
    documentType: 'ID_CARD_BACK' as const,
    label: '身份证背面照片',
    loadingKey: 'idCardBackUpload' as const,
    fileIdKey: 'idCardBackFileId' as const,
    fileNameKey: 'idCardBackFileName' as const
  }
}

const resetIdentityDocuments = (): void => {
  formData.photoFileId = ''
  formData.photoFileName = ''
  formData.idCardFrontFileId = ''
  formData.idCardFrontFileName = ''
  formData.idCardBackFileId = ''
  formData.idCardBackFileName = ''
  clearIdentityPreview('photo')
  clearIdentityPreview('idCardFront')
  clearIdentityPreview('idCardBack')
}

const handleIdentityFileChange = async (event: Event, target: IdentityUploadTarget): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const config = identityUploadConfig[target]
  if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
    input.value = ''
    message.warning('请先填写正确的报名手机号，再上传照片')
    return
  }

  if (!IDENTITY_IMAGE_MIME_TYPES.has(file.type)) {
    input.value = ''
    message.error('仅支持 JPG、PNG 或 WEBP 格式的照片')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    input.value = ''
    message.error('照片大小不能超过 5MB')
    return
  }

  try {
    loading[config.loadingKey] = true
    const response = await ApplicationService.uploadPublicIdentityDocument(
      file,
      formData.contactPhone,
      config.documentType
    )
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || `${config.label}上传失败`)
    }

    formData[config.fileIdKey] = response.data.fileId
    formData[config.fileNameKey] = response.data.originalName || response.data.fileName
    setIdentityPreview(target, file)
    input.value = ''
    message.success(`${config.label}上传成功`)
    await formRef.value?.validateFields([config.fileIdKey]).catch(() => undefined)
  } catch (error: any) {
    formData[config.fileIdKey] = ''
    formData[config.fileNameKey] = ''
    input.value = ''
    message.error(error?.message || `${config.label}上传失败`)
  } finally {
    loading[config.loadingKey] = false
  }
}

const handleProfilePhotoChange = (event: Event): Promise<void> => handleIdentityFileChange(event, 'photo')
const handleIdCardFrontChange = (event: Event): Promise<void> => handleIdentityFileChange(event, 'idCardFront')
const handleIdCardBackChange = (event: Event): Promise<void> => handleIdentityFileChange(event, 'idCardBack')

/**
 * 上传保险凭证
 */
const handleInsuranceFileChange = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  try {
    loading.insuranceUpload = true
    const response = await InsuranceService.uploadInsuranceAttachment(
      file,
      formData.contactPhone
    )
    if (response.code === 200 && response.data) {
      formData.insuranceAttachmentFileId = response.data.fileId
      formData.insuranceAttachmentName = response.data.originalName || response.data.fileName
      message.success('保险凭证上传成功')
      await formRef.value?.validateFields(['insuranceAttachmentFileId']).catch(() => undefined)
    } else {
      throw new Error(response.message || '保险凭证上传失败')
    }
  } catch (error: any) {
    console.error('保险凭证上传失败:', error)
    formData.insuranceAttachmentFileId = ''
    formData.insuranceAttachmentName = ''
    input.value = ''
    message.error(error?.message || '保险凭证上传失败')
  } finally {
    loading.insuranceUpload = false
  }
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
    const response = await CourseService.getPublicCourses({
      page: 1,
      pageSize: 100,
      semester: formData.semester
    })

    if (response.code === 200) {
      availableCourses.value = response.data.list || []
      syncCourseCategorySelection()
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
    const invalidCourses: string[] = []

    formData.selectedCourses.forEach(courseId => {
      const course = findCourseBySelectionId(courseId)
      if (course && !isCourseAgeEligible(course)) {
        invalidCourses.push(courseId)
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

watch(() => formData.contactPhone, (phone, previousPhone) => {
  if (phone === previousPhone) {
    return
  }

  formData.insuranceAttachmentFileId = ''
  formData.insuranceAttachmentName = ''
  resetIdentityDocuments()
  if (formData.signatureCaptured || formData.signatureFileId) {
    resetSignature()
  }

  if (!formData.familyPhone) {
    formData.familyPhone = phone
  }
})

const signatureContext = computed(() => JSON.stringify({
  name: formData.name,
  idNumber: formData.idNumber,
  semester: formData.semester,
  selectedCourses: formData.selectedCourses,
  familyAddress: formData.familyAddress,
  familyPhone: formData.familyPhone,
  emergencyContact: formData.emergencyContact,
  emergencyPhone: formData.emergencyPhone
}))

watch(signatureContext, (value, previousValue) => {
  if (previousValue && value !== previousValue && formData.signatureCaptured) {
    resetSignature()
    message.info('报名信息已修改，请在最后一步重新签名')
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

onBeforeUnmount(() => {
  clearIdentityPreview('photo')
  clearIdentityPreview('idCardFront')
  clearIdentityPreview('idCardBack')
})
</script>

<style scoped>
/* 移动端优化样式 */
.mobile-registration {
  max-width: 100%;
  overscroll-behavior: auto;
  padding-bottom: calc(132px + env(safe-area-inset-bottom));
}

.mobile-registration-hero {
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.98)),
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 36%);
}

.course-category {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.course-card {
  min-height: 132px;
  -webkit-tap-highlight-color: transparent;
}

.sticky-action-bar {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
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

/* Material 3 surfaces and elder-friendly form controls. */
.mobile-registration {
  --m3-primary: #2a5f9e;
  --m3-on-primary: #ffffff;
  --m3-primary-container: #d8e7ff;
  --m3-on-primary-container: #123253;
  --m3-secondary-container: #c1f0e1;
  --m3-surface: #ffffff;
  --m3-outline: #747780;
  --m3-on-surface: #1b1b20;
  --m3-on-surface-variant: #484a52;
  background: #f7f8fc;
  color: var(--m3-on-surface);
  font-family: "Microsoft YaHei", "PingFang SC", ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0;
}

.mobile-app-bar {
  background: var(--m3-surface);
  border-bottom: 1px solid #dfe2eb;
  box-shadow: 0 1px 2px rgba(27, 27, 32, 0.08);
}

.m3-back-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--m3-on-surface);
  display: inline-flex;
  font-size: 17px;
  font-weight: 700;
  gap: 8px;
  min-height: 48px;
  padding: 0 6px;
}

.m3-app-title {
  color: var(--m3-on-surface);
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  margin: 0;
}

.m3-app-bar-spacer {
  min-width: 58px;
}

.m3-progress-card,
.m3-form-card {
  background: var(--m3-surface);
  border: 1px solid #dfe2eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(27, 27, 32, 0.06);
}

.m3-progress-card,
.m3-form-card {
  padding: 20px;
}

.m3-overline {
  color: var(--m3-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.m3-page-title,
.m3-section-title {
  color: var(--m3-on-surface);
  font-size: 23px;
  font-weight: 700;
  line-height: 31px;
  margin: 8px 0 0;
}

.m3-section-title {
  margin: 0;
}

.m3-page-description,
.m3-section-description,
.m3-helper-text,
.m3-filter-help {
  color: var(--m3-on-surface-variant);
  font-size: 16px;
  line-height: 24px;
  margin: 6px 0 0;
}

.m3-selection-count {
  align-items: flex-end;
  background: var(--m3-secondary-container);
  border-radius: 8px;
  color: #183f36;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 2px;
  min-width: 76px;
  padding: 10px 12px;
}

.m3-selection-count span {
  font-size: 13px;
  font-weight: 700;
}

.m3-selection-count strong {
  font-size: 21px;
  line-height: 26px;
}

.m3-stepper {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  list-style: none;
  margin: 20px 0 0;
  padding: 0;
}

.m3-stepper-item {
  align-items: center;
  color: var(--m3-on-surface-variant);
  display: flex;
  flex-direction: column;
  font-size: 14px;
  font-weight: 700;
  gap: 6px;
  min-width: 0;
}

.m3-stepper-number {
  align-items: center;
  background: #e0e2ea;
  border-radius: 50%;
  color: #3e4149;
  display: flex;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.m3-stepper-item.is-current,
.m3-stepper-item.is-complete {
  color: var(--m3-primary);
}

.m3-stepper-item.is-current .m3-stepper-number {
  background: var(--m3-primary);
  color: var(--m3-on-primary);
}

.m3-stepper-item.is-complete .m3-stepper-number {
  background: var(--m3-primary-container);
  color: var(--m3-on-primary-container);
}

.m3-stepper-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-discovery {
  border-bottom: 1px solid #dfe2eb;
  padding-bottom: 16px;
}

.m3-category-picker {
  margin: 0;
}

.m3-choice-title,
.m3-search-label,
.m3-results-title {
  color: var(--m3-on-surface);
  display: block;
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
  margin: 0;
}

.m3-filter-help {
  color: var(--m3-on-surface-variant);
  font-size: 16px;
  line-height: 24px;
  margin: 6px 0 12px;
}

.m3-category-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.m3-category-tile {
  align-items: flex-start;
  background: #ffffff;
  border: 1px solid #c5c7d0;
  border-radius: 8px;
  color: var(--m3-on-surface);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 76px;
  padding: 12px;
  text-align: left;
  transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.m3-category-tile-title {
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
}

.m3-category-tile-count {
  color: var(--m3-on-surface-variant);
  font-size: 15px;
  line-height: 22px;
  margin-top: 2px;
}

.m3-category-tile.is-selected {
  background: var(--m3-primary-container);
  border-color: var(--m3-primary);
  box-shadow: inset 4px 0 0 var(--m3-primary);
}

.m3-category-tile.is-selected .m3-category-tile-count {
  color: var(--m3-on-primary-container);
}

.m3-direct-search {
  border-top: 1px solid #dfe2eb;
  margin-top: 16px;
  padding-top: 16px;
}

.m3-search-label {
  margin-bottom: 8px;
}

.m3-selection-summary,
.m3-insurance-notice,
.m3-action-context {
  background: var(--m3-primary-container);
  border-left: 4px solid var(--m3-primary);
  border-radius: 8px;
  color: var(--m3-on-primary-container);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  padding: 12px 14px;
}

.m3-course-guidance {
  color: var(--m3-on-surface-variant);
  font-size: 17px;
  line-height: 26px;
  margin: 0;
  padding: 20px 8px;
  text-align: center;
}

.m3-results-title {
  margin: 0 0 8px;
}

.m3-course-category {
  background: #edf1f8;
  border-radius: 6px;
  color: #3f4655;
  flex: 0 0 auto;
  font-size: 14px;
  line-height: 20px;
  padding: 2px 6px;
}

.course-card {
  background: #fff;
  border: 0;
  border-top: 1px solid #e4e6ee;
  color: var(--m3-on-surface);
  cursor: pointer;
  display: block;
  min-height: 144px;
  padding: 16px 14px;
  text-align: left;
  transition: background-color 180ms ease, box-shadow 180ms ease;
  width: 100%;
}

.course-card.is-selected {
  background: #eaf2ff;
  box-shadow: inset 4px 0 0 var(--m3-primary);
}

.m3-empty-courses {
  color: var(--m3-on-surface-variant);
  font-size: 17px;
  line-height: 26px;
  padding: 36px 16px;
  text-align: center;
}

.sticky-action-bar {
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #dfe2eb;
  box-shadow: 0 -2px 8px rgba(27, 27, 32, 0.08);
  left: 0;
  position: fixed;
  right: 0;
  padding: 12px 16px max(16px, env(safe-area-inset-bottom));
}

.m3-action-context {
  margin-bottom: 12px;
}

.mobile-registration :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.mobile-registration :deep(.ant-form-item-label > label) {
  color: var(--m3-on-surface);
  font-size: 17px;
  font-weight: 700;
  height: auto;
  line-height: 24px;
}

.mobile-registration :deep(.ant-form-item-explain-error) {
  font-size: 15px;
  line-height: 22px;
  margin-top: 6px;
}

.mobile-registration :deep(.ant-radio-wrapper) {
  border-color: #8c8f98;
  font-size: 17px;
  min-height: 52px;
  padding: 13px 16px;
}

.mobile-registration :deep(.ant-radio-wrapper-checked) {
  background-color: var(--m3-primary-container);
  border-color: var(--m3-primary);
}

.mobile-registration :deep(.ant-select-selector),
.mobile-registration :deep(.ant-picker),
.mobile-registration :deep(.ant-input),
.mobile-registration :deep(.ant-input-affix-wrapper) {
  border-color: #8c8f98 !important;
  font-size: 18px !important;
  min-height: 56px;
}

.mobile-registration :deep(.ant-select-focused .ant-select-selector),
.mobile-registration :deep(.ant-picker-focused),
.mobile-registration :deep(.ant-input:focus),
.mobile-registration :deep(.ant-input-affix-wrapper-focused) {
  border-color: var(--m3-primary) !important;
  box-shadow: 0 0 0 3px rgba(42, 95, 158, 0.18) !important;
}

.mobile-registration :deep(.ant-btn) {
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  min-height: 56px;
}

.mobile-registration :deep(.ant-btn-primary) {
  background-color: var(--m3-primary);
  border-color: var(--m3-primary);
}

.m3-identity-materials {
  border-top: 1px solid #e2e4ec;
  margin: 4px 0 20px;
  padding-top: 20px;
}

.m3-signature-summary {
  background: #f3f5fa;
  border-radius: 8px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 20px 0 16px;
  padding: 16px;
}

.m3-signature-summary div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.m3-signature-summary .is-full-width {
  grid-column: 1 / -1;
}

.m3-signature-summary span {
  color: var(--m3-on-surface-variant);
  font-size: 15px;
  line-height: 22px;
}

.m3-signature-summary strong {
  color: var(--m3-on-surface);
  font-size: 18px;
  line-height: 26px;
  overflow-wrap: anywhere;
}

.m3-signature-declaration {
  background: var(--m3-primary-container);
  border-left: 4px solid var(--m3-primary);
  border-radius: 8px;
  color: var(--m3-on-primary-container);
  font-size: 17px;
  line-height: 27px;
  margin-bottom: 20px;
  padding: 14px 16px;
}

.m3-subsection-title {
  color: var(--m3-on-surface);
  font-size: 19px;
  font-weight: 700;
  line-height: 28px;
  margin: 0 0 4px;
}

.m3-subsection-description {
  color: var(--m3-on-surface-variant);
  font-size: 16px;
  line-height: 24px;
  margin: 0 0 16px;
}

.m3-document-upload {
  align-items: center;
  background: #f8f9fc;
  border: 2px dashed #7d8595;
  border-radius: 8px;
  color: var(--m3-primary);
  cursor: pointer;
  display: flex;
  min-height: 68px;
  padding: 10px 14px;
}

.m3-document-upload:hover,
.m3-document-upload:focus-within {
  background: #eef4ff;
  border-color: var(--m3-primary);
}

.m3-document-upload.is-uploading {
  color: #52606f;
  cursor: wait;
}

.m3-document-upload input[type='file'] {
  height: 1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  width: 1px;
}

.m3-document-upload-action {
  align-items: center;
  display: flex;
  font-size: 17px;
  font-weight: 700;
  gap: 12px;
  line-height: 24px;
}

.m3-document-upload-action i {
  font-size: 22px;
}

.m3-upload-success {
  color: #166534;
  font-size: 16px;
  line-height: 24px;
  margin-top: 8px;
  overflow-wrap: anywhere;
}

.m3-upload-preview {
  background: #f8f9fc;
  border: 1px solid #c8ccd6;
  border-radius: 8px;
  margin-top: 10px;
  overflow: hidden;
}

.m3-upload-preview :deep(.ant-image) {
  background: #fff;
  display: block;
  width: 100%;
}

.m3-upload-preview :deep(.m3-upload-preview-image) {
  display: block;
  height: 190px;
  object-fit: contain;
  width: 100%;
}

.m3-upload-preview :deep(.m3-upload-preview-image.is-profile-photo) {
  height: 240px;
}

.m3-upload-preview-caption {
  align-items: center;
  color: var(--m3-primary);
  display: flex;
  font-size: 16px;
  font-weight: 700;
  gap: 8px;
  line-height: 24px;
  min-height: 48px;
  padding: 10px 12px;
}

.m3-file-upload {
  background: #f8f9fc;
  border: 2px dashed #8c8f98;
  border-radius: 8px;
  padding: 16px;
}

.m3-file-upload :deep(input[type='file']) {
  font-size: 16px;
  line-height: 24px;
}

.m3-back-button:focus-visible,
.m3-category-tile:focus-visible,
.course-card:focus-visible,
.m3-document-upload:focus-within {
  outline: 3px solid #1f6feb;
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .m3-progress-card,
  .m3-form-card {
    border-radius: 8px;
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-registration *,
  .mobile-registration *::before,
  .mobile-registration *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
