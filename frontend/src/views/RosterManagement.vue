<template>
  <div class="roster-management">
    <section class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">花名册管理</h1>
          <p class="mt-1 text-sm text-gray-500">按学期和班次查看花名册状态，确认无待审报名后冻结最终名单。</p>
        </div>
        <button
          @click="fetchRosters"
          class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <i class="fas fa-sync-alt mr-2 text-xs"></i>
          刷新
        </button>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-500">班次数</div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">{{ pagination.total }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-500">草稿花名册</div>
        <div class="mt-2 text-2xl font-semibold text-amber-600">{{ draftCount }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-500">已冻结</div>
        <div class="mt-2 text-2xl font-semibold text-green-600">{{ publishedCount }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-500">待审报名</div>
        <div class="mt-2 text-2xl font-semibold text-red-600">{{ pendingCount }}</div>
      </div>
    </section>

    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="filters.keyword"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="搜索课程、班次、编号或专业"
            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          v-model="filters.status"
          @change="handleSearch"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">已冻结</option>
          <option value="ARCHIVED">已归档</option>
        </select>
        <button
          @click="handleSearch"
          class="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
        >
          查询
        </button>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div v-if="loading" class="p-10 text-center text-gray-500">正在加载花名册...</div>
      <div v-else-if="rosters.length === 0" class="p-10 text-center text-gray-500">暂无花名册数据</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[980px]">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">班次</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">课程</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">学期</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">容量</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">正式成员</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">待审</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">状态</th>
              <th class="px-5 py-3 text-left text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="roster in rosters" :key="roster.classSectionId" class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-5 py-4">
                <div class="font-medium text-gray-900">{{ roster.classSectionName }}</div>
                <div class="mt-1 text-xs text-gray-500">{{ formatClassSectionCode(roster.classSectionCode) }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="font-medium text-gray-800">{{ roster.courseName }}</div>
                <div class="mt-1 text-xs text-gray-500">{{ roster.major }} {{ roster.grade || '' }}</div>
              </td>
              <td class="px-5 py-4 text-sm text-gray-700">
                <div>{{ roster.semesterName }}</div>
                <div class="mt-1 text-xs text-gray-500">{{ formatAcademicYearName(roster.academicYearName) }}</div>
              </td>
              <td class="px-5 py-4 text-sm text-gray-700">{{ roster.capacity }}</td>
              <td class="px-5 py-4 text-sm text-gray-700">{{ roster.activeMemberCount }}</td>
              <td class="px-5 py-4">
                <span :class="roster.pendingApplicationCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'" class="rounded-full px-2.5 py-1 text-xs font-medium">
                  {{ roster.pendingApplicationCount }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span :class="getRosterStatusClass(roster.rosterStatus)" class="rounded-full px-2.5 py-1 text-xs font-medium">
                  {{ getRosterStatusText(roster.rosterStatus) }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap gap-2">
                  <button
                    @click="handleViewMembers(roster)"
                    class="inline-flex items-center justify-center rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
                  >
                    <i class="fas fa-users mr-2 text-xs"></i>
                    成员
                  </button>
                  <button
                    @click="handleExport(roster)"
                    class="inline-flex items-center justify-center rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-200"
                  >
                    <i class="fas fa-download mr-2 text-xs"></i>
                    导出
                  </button>
                  <button
                    v-if="canManageRosters"
                    @click="handleFreeze(roster)"
                    :disabled="!canFreeze(roster)"
                    class="inline-flex items-center justify-center rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <i class="fas fa-lock mr-2 text-xs"></i>
                    冻结
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="border-t border-gray-200 p-5">
        <a-pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="handlePageChange"
          @show-size-change="handlePageSizeChange"
        />
      </div>
    </section>

    <a-modal
      v-model:open="membersVisible"
      title="花名册成员"
      width="980px"
      :footer="null"
    >
      <div v-if="selectedRoster" class="mb-4 rounded-lg bg-gray-50 p-4">
        <div class="font-medium text-gray-900">{{ selectedRoster.classSectionName }}</div>
        <div class="mt-1 text-sm text-gray-500">{{ selectedRoster.courseName }} · {{ selectedRoster.semesterName }}</div>
      </div>

      <div v-if="membersLoading" class="py-10 text-center text-gray-500">正在加载成员...</div>
      <div v-else-if="rosterMembers.length === 0" class="py-10 text-center text-gray-500">暂无正式成员</div>
      <div v-else class="max-h-[520px] overflow-auto">
        <table class="w-full min-w-[900px]">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">学员</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">联系方式</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">报名编号</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">保险</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">审核快照</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in rosterMembers" :key="member.memberId" class="border-t border-gray-100">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ member.studentName }}</div>
                <div class="mt-1 text-xs text-gray-500">{{ member.studentCode }} · {{ member.idNumber }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                <div>{{ member.contactPhone || '未填写' }}</div>
                <div class="mt-1 text-xs text-gray-500">{{ formatGender(member.gender) }} · {{ member.age }}岁</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ member.enrollmentCode || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">
                <div>{{ formatDate(member.insuranceStart) || '-' }}</div>
                <div class="mt-1 text-xs text-gray-500">至 {{ formatDate(member.insuranceEnd) || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                <div v-if="member.reviewSnapshot">
                  <div>{{ getSnapshotStatus(member.reviewSnapshot.status) }}</div>
                  <div class="mt-1 text-xs text-gray-500">{{ formatDateTime(member.reviewSnapshot.reviewedAt) }}</div>
                </div>
                <span v-else class="text-gray-400">无快照</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { CourseService, type RosterManagementRow, type RosterMemberRow } from '@/api/course'
import { formatAcademicYearName, formatClassSectionCode, formatGender } from '@/utils/displayFormatters'
import { useAuthStore } from '@/store/auth'

const loading = ref(false)
const rosters = ref<RosterManagementRow[]>([])
const membersVisible = ref(false)
const membersLoading = ref(false)
const rosterMembers = ref<RosterMemberRow[]>([])
const selectedRoster = ref<RosterManagementRow | null>(null)
const filters = reactive({
  keyword: '',
  status: ''
})
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})
const authStore = useAuthStore()
const canManageRosters = computed(() => authStore.isSuperAdmin || authStore.isSchoolAdmin)

const draftCount = computed(() => rosters.value.filter(row => (row.rosterStatus || 'DRAFT') === 'DRAFT').length)
const publishedCount = computed(() => rosters.value.filter(row => row.rosterStatus === 'PUBLISHED').length)
const pendingCount = computed(() => rosters.value.reduce((sum, row) => sum + Number(row.pendingApplicationCount || 0), 0))

const fetchRosters = async (): Promise<void> => {
  try {
    loading.value = true
    const response = await CourseService.getRosterManagementList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filters.keyword.trim() || undefined,
      status: filters.status || undefined
    })

    rosters.value = response.data?.list || []
    pagination.total = response.data?.total || 0
  } catch (error) {
    console.error('获取花名册列表失败:', error)
    message.error('获取花名册列表失败')
    rosters.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = async (): Promise<void> => {
  pagination.current = 1
  await fetchRosters()
}

const handlePageChange = async (page: number, pageSize: number): Promise<void> => {
  pagination.current = page
  pagination.pageSize = pageSize
  await fetchRosters()
}

const handlePageSizeChange = async (_current: number, size: number): Promise<void> => {
  pagination.current = 1
  pagination.pageSize = size
  await fetchRosters()
}

const canFreeze = (roster: RosterManagementRow): boolean => {
  return canManageRosters.value
    && Boolean(roster.rosterId)
    && (roster.rosterStatus || 'DRAFT') === 'DRAFT'
    && Number(roster.pendingApplicationCount || 0) === 0
}

const handleFreeze = async (roster: RosterManagementRow): Promise<void> => {
  if (!canFreeze(roster)) {
    message.warning('该班次仍有待审报名或花名册状态不允许冻结')
    return
  }

  Modal.confirm({
    title: '冻结花名册',
    content: `确认冻结「${roster.classSectionName}」花名册？冻结后该班次名单将作为本学期正式花名册。`,
    okText: '确认冻结',
    cancelText: '取消',
    async onOk() {
      try {
        await CourseService.freezeRosterSnapshot(roster.classSectionId)
        message.success('花名册已冻结')
        await fetchRosters()
      } catch (error) {
        console.error('冻结花名册失败:', error)
        message.error('冻结花名册失败')
      }
    }
  })
}

const handleViewMembers = async (roster: RosterManagementRow): Promise<void> => {
  selectedRoster.value = roster
  membersVisible.value = true
  membersLoading.value = true

  try {
    const response = await CourseService.getRosterMembers(roster.classSectionId)
    rosterMembers.value = response.data?.list || []
  } catch (error) {
    console.error('获取花名册成员失败:', error)
    message.error('获取花名册成员失败')
    rosterMembers.value = []
  } finally {
    membersLoading.value = false
  }
}

const handleExport = async (roster: RosterManagementRow): Promise<void> => {
  try {
    await CourseService.exportRosterMembers(
      roster.classSectionId,
      `${roster.classSectionCode}_花名册.csv`
    )
    message.success('花名册导出成功')
  } catch (error) {
    console.error('导出花名册失败:', error)
    message.error('导出花名册失败')
  }
}

const getRosterStatusText = (status?: string | null): string => {
  switch (status || 'DRAFT') {
    case 'PUBLISHED':
      return '已冻结'
    case 'ARCHIVED':
      return '已归档'
    default:
      return '草稿'
  }
}

const getRosterStatusClass = (status?: string | null): string => {
  switch (status || 'DRAFT') {
    case 'PUBLISHED':
      return 'bg-green-100 text-green-700'
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

const getSnapshotStatus = (status?: string): string => {
  return status === 'APPROVED' ? '已批准' : status === 'REJECTED' ? '已拒绝' : '未知'
}

const formatDate = (value?: string | null): string => {
  if (!value) return ''
  return String(value).split('T')[0]
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  fetchRosters()
})
</script>

<style scoped>
.roster-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
