<template>
  <div class="space-y-4">
    <div class="bg-white border border-gray-200 rounded-lg px-5 py-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">保险审核</h1>
          <p class="mt-1 text-sm text-gray-500">审核学员自助报名提交的保险凭证和有效期。</p>
        </div>
        <a-button type="primary" :loading="loading" @click="loadInsurances">
          <i class="fas fa-sync-alt mr-2"></i>
          刷新
        </a-button>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg px-5 py-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <a-input
          v-model:value="filters.keyword"
          placeholder="姓名、身份证、电话或保险公司"
          allow-clear
          @press-enter="handleSearch"
        />
        <a-select
          v-model:value="filters.reviewStatus"
          placeholder="审核状态"
          allow-clear
          :options="reviewStatusOptions"
        />
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="handleReset">重置</a-button>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="records"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'student'">
            <div class="font-medium text-gray-900">{{ record.studentName }}</div>
            <div class="text-xs text-gray-500">{{ record.studentCode }} · {{ record.contactPhone }}</div>
          </template>

          <template v-else-if="column.key === 'academicYearName'">
            {{ formatAcademicYearName(record.academicYearName) }}
          </template>

          <template v-else-if="column.key === 'coverage'">
            <div>{{ formatDate(record.coverageStart) }}</div>
            <div class="text-xs text-gray-500">至 {{ formatDate(record.coverageEnd) }}</div>
          </template>

          <template v-else-if="column.key === 'attachment'">
            <a-button
              v-if="hasUsableAttachment(record)"
              type="link"
              class="p-0"
              @click="openAttachment(record.attachmentUrl || '')"
            >
              {{ formatAttachmentLabel(record) }}
            </a-button>
            <span v-else class="text-gray-400">未上传</span>
          </template>

          <template v-else-if="column.key === 'reviewStatus'">
            <a-tag :color="getStatusColor(record.reviewStatus)">
              {{ getStatusText(record.reviewStatus) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="flex flex-wrap gap-2">
              <a-button size="small" type="primary" @click="openReview(record, 'APPROVED')">通过</a-button>
              <a-button size="small" danger @click="openReview(record, 'REJECTED')">驳回</a-button>
              <a-button size="small" @click="openReview(record, 'EXPIRED')">过期</a-button>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:open="reviewModal.visible"
      :title="reviewModal.status === 'APPROVED' ? '通过保险审核' : '更新保险审核状态'"
      @ok="submitReview"
      :confirm-loading="reviewModal.submitting"
    >
      <a-form layout="vertical">
        <a-form-item label="审核状态">
          <a-tag :color="statusColor[reviewModal.status]">{{ statusText[reviewModal.status] }}</a-tag>
        </a-form-item>
        <a-form-item label="审核备注">
          <a-textarea
            v-model:value="reviewModal.remarks"
            :rows="4"
            placeholder="可填写驳回原因或审核说明"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { InsuranceService, type InsuranceRecord } from '@/api/insurance'
import { getImageUrl } from '@/utils/imageUtils'
import { formatAcademicYearName, formatAttachmentLabel, hasUsableAttachment } from '@/utils/displayFormatters'

type ReviewStatus = InsuranceRecord['reviewStatus']

const loading = ref(false)
const records = ref<InsuranceRecord[]>([])

const filters = reactive({
  keyword: '',
  reviewStatus: undefined as ReviewStatus | undefined
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const reviewModal = reactive({
  visible: false,
  submitting: false,
  id: '',
  status: 'APPROVED' as ReviewStatus,
  remarks: ''
})

const reviewStatusOptions = [
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'EXPIRED', label: '已过期' }
]

const statusText: Record<ReviewStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  EXPIRED: '已过期'
}

const statusColor: Record<ReviewStatus, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  EXPIRED: 'default'
}

const isReviewStatus = (value: unknown): value is ReviewStatus => {
  return typeof value === 'string' && value in statusText
}

const getStatusText = (value: unknown): string => {
  return isReviewStatus(value) ? statusText[value] : '未知状态'
}

const getStatusColor = (value: unknown): string => {
  return isReviewStatus(value) ? statusColor[value] : 'default'
}

const columns = [
  { title: '学员', key: 'student', width: 190 },
  { title: '学年', key: 'academicYearName', width: 140 },
  { title: '保险公司', dataIndex: 'company', key: 'company', width: 140 },
  { title: '保险类别', dataIndex: 'category', key: 'category', width: 120 },
  { title: '有效期', key: 'coverage', width: 150 },
  { title: '凭证', key: 'attachment', width: 160 },
  { title: '状态', key: 'reviewStatus', width: 100 },
  { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, customRender: ({ text }: { text: string }) => formatDateTime(text) },
  { title: '操作', key: 'action', fixed: 'right', width: 180 }
]

const formatDate = (value?: string | null): string => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('zh-CN')
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const loadInsurances = async (): Promise<void> => {
  try {
    loading.value = true
    const response = await InsuranceService.getInsuranceList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword,
      reviewStatus: filters.reviewStatus
    })

    if (response.code === 200) {
      records.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error: any) {
    console.error('加载保险审核列表失败:', error)
    message.error(error?.message || '加载保险审核列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (): void => {
  pagination.current = 1
  loadInsurances()
}

const handleReset = (): void => {
  filters.keyword = ''
  filters.reviewStatus = undefined
  pagination.current = 1
  loadInsurances()
}

const handleTableChange = (pager: any): void => {
  pagination.current = pager.current || 1
  pagination.pageSize = pager.pageSize || 20
  loadInsurances()
}

const openAttachment = (url: string): void => {
  window.open(getImageUrl(url), '_blank', 'noopener,noreferrer')
}

const openReview = (record: InsuranceRecord, status: ReviewStatus): void => {
  reviewModal.id = record.id
  reviewModal.status = status
  reviewModal.remarks = record.remarks || ''
  reviewModal.visible = true
}

const submitReview = async (): Promise<void> => {
  try {
    reviewModal.submitting = true
    await InsuranceService.reviewInsurance(reviewModal.id, reviewModal.status, reviewModal.remarks)
    message.success('保险审核状态已更新')
    reviewModal.visible = false
    await loadInsurances()
  } catch (error: any) {
    console.error('保险审核失败:', error)
    message.error(error?.message || '保险审核失败')
  } finally {
    reviewModal.submitting = false
  }
}

onMounted(() => {
  loadInsurances()
})
</script>
