<template>
  <div class="attendance-page min-h-screen bg-gray-50">
    <section class="border-b border-gray-200 bg-white px-6 py-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">&#32771;&#21220;&#35760;&#24405;</h1>
          <p class="mt-1 text-sm text-gray-600">&#26597;&#30475;&#23398;&#21592;&#35838;&#31243;&#31614;&#21040;&#35760;&#24405;&#21644;&#20986;&#21220;&#32479;&#35745;</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right text-sm">
            <div class="text-gray-500">&#24403;&#21069;&#26085;&#26399;</div>
            <div class="font-semibold text-gray-900">{{ currentDate }}</div>
          </div>
          <a-button type="primary" :disabled="attendanceRows.length === 0" @click="exportRecords">
            <template #icon><DownloadOutlined /></template>
            &#23548;&#20986;
          </a-button>
        </div>
      </div>
    </section>

    <main class="space-y-5 p-6">
      <section class="bg-white p-5 shadow-sm">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700">&#26085;&#26399;&#33539;&#22260;</span>
            <a-range-picker
              v-model:value="dateRange"
              class="w-full"
              format="YYYY-MM-DD"
              :placeholder="['开始日期', '结束日期']"
              @change="handleFilterChange"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700">&#35838;&#31243;</span>
            <a-select
              v-model:value="selectedCourseId"
              class="w-full"
              allow-clear
              show-search
              option-filter-prop="label"
              :loading="loadingCourses"
              placeholder="&#35838;&#31243;"
              @change="handleFilterChange"
            >
              <a-select-option
                v-for="course in availableCourses"
                :key="course.id"
                :value="course.id"
                :label="course.name"
              >
                {{ course.name }}
              </a-select-option>
            </a-select>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700">&#29366;&#24577;</span>
            <a-select
              v-model:value="selectedStatus"
              class="w-full"
              allow-clear
              placeholder="&#29366;&#24577;"
              @change="handleFilterChange"
            >
              <a-select-option value="PRESENT">&#24050;&#31614;&#21040;</a-select-option>
              <a-select-option value="ABSENT">&#32570;&#21220;</a-select-option>
              <a-select-option value="LATE">&#36831;&#21040;</a-select-option>
              <a-select-option value="LEAVE">&#35831;&#20551;</a-select-option>
            </a-select>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700">学员编号</span>
            <a-input
              v-model:value="studentIdFilter"
              placeholder="请输入学员编号"
              allow-clear
              @press-enter="searchRecords"
            />
          </label>

          <div class="flex items-end justify-end gap-2">
            <a-button @click="resetFilters">&#37325;&#32622;</a-button>
            <a-button type="primary" :loading="loadingRecords" @click="searchRecords">&#26597;&#35810;</a-button>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="bg-white p-5 shadow-sm">
          <div class="text-sm text-gray-500">&#24050;&#31614;&#21040;</div>
          <div class="mt-2 text-2xl font-bold text-green-600">{{ statistics.totalPresent }}</div>
        </div>
        <div class="bg-white p-5 shadow-sm">
          <div class="text-sm text-gray-500">&#32570;&#21220;</div>
          <div class="mt-2 text-2xl font-bold text-red-600">{{ statistics.totalAbsent }}</div>
        </div>
        <div class="bg-white p-5 shadow-sm">
          <div class="text-sm text-gray-500">&#36831;&#21040;</div>
          <div class="mt-2 text-2xl font-bold text-yellow-600">{{ statistics.totalLate }}</div>
        </div>
        <div class="bg-white p-5 shadow-sm">
          <div class="text-sm text-gray-500">&#24403;&#39029;&#20986;&#21220;&#29575;</div>
          <div class="mt-2 text-2xl font-bold text-blue-600">{{ statistics.attendanceRate }}%</div>
        </div>
      </section>

      <section class="bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 class="text-lg font-semibold text-gray-900">&#35760;&#24405;&#21015;&#34920;</h2>
          <div class="text-sm text-gray-600">&#20849; {{ attendanceTotal }} &#26465;</div>
        </div>

        <a-table
          :columns="columns"
          :data-source="attendanceRows"
          :loading="loadingRecords"
          :pagination="false"
          row-key="id"
          size="middle"
          :scroll="{ x: 1100 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'student'">
              <div class="font-medium text-gray-900">{{ record.studentName }}</div>
              <div class="text-xs text-gray-500">{{ record.studentCode || record.studentId }}</div>
            </template>
            <template v-else-if="column.key === 'status'">
              <span :class="getAttendanceStatusClass(record.status)" class="inline-flex rounded px-2 py-1 text-xs font-medium">
                {{ getAttendanceStatusText(record.status) }}
              </span>
            </template>
            <template v-else-if="column.key === 'method'">
              {{ getMethodText(record.method) }}
            </template>
            <template v-else-if="column.key === 'faceScore'">
              {{ record.faceScore === null ? '-' : `${(record.faceScore * 100).toFixed(1)}%` }}
            </template>
          </template>
        </a-table>

        <div class="flex justify-end border-t border-gray-200 px-5 py-4">
          <a-pagination
            v-model:current="currentPage"
            v-model:page-size="pageSize"
            :total="attendanceTotal"
            :show-size-changer="true"
            :page-size-options="['10', '20', '50', '100']"
            @change="handlePageChange"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { DownloadOutlined } from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { AttendanceService, type AttendanceMethodApi, type AttendanceQuery, type AttendanceRecordResponse, type AttendanceStatusApi } from '@/api/attendance'
import { CourseService, type Course } from '@/api/course'

interface AttendanceRow {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  courseId: string
  courseName: string
  classDate: string
  checkInTime: string
  status: AttendanceStatusApi
  method: AttendanceMethodApi
  faceScore: number | null
  remarks: string
}

const currentDate = ref(dayjs().format('YYYY-MM-DD'))
const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const selectedCourseId = ref<string | undefined>(undefined)
const selectedStatus = ref<AttendanceStatusApi | undefined>(undefined)
const studentIdFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const attendanceRows = ref<AttendanceRow[]>([])
const attendanceTotal = ref(0)
const availableCourses = ref<Array<Course>>([])
const loadingRecords = ref(false)
const loadingCourses = ref(false)

const columns = [
  { title: '\u5b66\u5458', key: 'student', width: 180 },
  { title: '\u8bfe\u7a0b', dataIndex: 'courseName', key: 'courseName', width: 220 },
  { title: '\u65e5\u671f', dataIndex: 'classDate', key: 'classDate', width: 130 },
  { title: '\u7b7e\u5230\u65f6\u95f4', dataIndex: 'checkInTime', key: 'checkInTime', width: 120 },
  { title: '\u72b6\u6001', key: 'status', width: 120 },
  { title: '\u65b9\u5f0f', key: 'method', width: 140 },
  { title: '\u4eba\u8138\u7f6e\u4fe1\u5ea6', key: 'faceScore', width: 120 },
  { title: '\u5907\u6ce8', dataIndex: 'remarks', key: 'remarks', width: 220 }
]

const statistics = computed(() => {
  const totalPresent = attendanceRows.value.filter(row => row.status === 'PRESENT').length
  const totalAbsent = attendanceRows.value.filter(row => row.status === 'ABSENT').length
  const totalLate = attendanceRows.value.filter(row => row.status === 'LATE').length
  const totalLeave = attendanceRows.value.filter(row => row.status === 'LEAVE').length
  const total = attendanceRows.value.length

  return {
    totalPresent,
    totalAbsent,
    totalLate,
    totalLeave,
    attendanceRate: total > 0 ? Math.round(((totalPresent + totalLate + totalLeave) / total) * 100) : 0
  }
})

const toRow = (record: AttendanceRecordResponse): AttendanceRow => ({
  id: record.id,
  studentId: record.studentId,
  studentCode: record.student?.studentCode || '',
  studentName: record.student?.name || record.studentId,
  courseId: record.courseId,
  courseName: record.course?.name || record.courseId,
  classDate: dayjs(record.attendanceDate).format('YYYY-MM-DD'),
  checkInTime: record.checkInTime ? dayjs(record.checkInTime).format('HH:mm') : '-',
  status: record.status,
  method: record.method,
  faceScore: record.faceScore ?? null,
  remarks: record.remarks || ''
})

const buildQuery = (): AttendanceQuery => {
  const query: AttendanceQuery = {
    page: currentPage.value,
    pageSize: pageSize.value,
    status: selectedStatus.value,
    courseId: selectedCourseId.value,
    studentId: studentIdFilter.value.trim() || undefined
  }

  if (dateRange.value) {
    query.startDate = dateRange.value[0].format('YYYY-MM-DD')
    query.endDate = dateRange.value[1].format('YYYY-MM-DD')
  }

  return query
}

const loadAttendanceRecords = async (): Promise<void> => {
  loadingRecords.value = true
  try {
    const response = await AttendanceService.getAttendanceRecords(buildQuery())
    attendanceRows.value = response.data.list.map(toRow)
    attendanceTotal.value = response.data.pagination.total
  } catch (error: any) {
    message.error(error?.message || '加载考勤记录失败')
  } finally {
    loadingRecords.value = false
  }
}

const loadCourses = async (): Promise<void> => {
  loadingCourses.value = true
  try {
    const response = await CourseService.getCourses({ page: 1, pageSize: 100, status: 'PUBLISHED' })
    availableCourses.value = response.data.list
  } catch (error: any) {
    message.error(error?.message || '加载课程列表失败')
  } finally {
    loadingCourses.value = false
  }
}

const handleFilterChange = (): void => {
  currentPage.value = 1
}

const searchRecords = (): void => {
  currentPage.value = 1
  loadAttendanceRecords()
}

const resetFilters = (): void => {
  dateRange.value = null
  selectedCourseId.value = undefined
  selectedStatus.value = undefined
  studentIdFilter.value = ''
  currentPage.value = 1
  loadAttendanceRecords()
}

const handlePageChange = (page: number, size: number): void => {
  currentPage.value = page
  pageSize.value = size
  loadAttendanceRecords()
}

const exportRecords = (): void => {
  if (attendanceRows.value.length === 0) {
    message.warning('暂无考勤记录可导出')
    return
  }

  const headers = ['学员', '学员编号', '课程', '日期', '签到时间', '状态', '方式', '人脸置信度', '备注']
  const csvContent = [
    headers.join(','),
    ...attendanceRows.value.map(row => [
      row.studentName,
      row.studentCode,
      row.courseName,
      row.classDate,
      row.checkInTime,
      getAttendanceStatusText(row.status),
      getMethodText(row.method),
      row.faceScore === null ? '' : `${(row.faceScore * 100).toFixed(1)}%`,
      row.remarks
    ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `考勤记录_${dayjs().format('YYYY-MM-DD')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const getAttendanceStatusClass = (status: AttendanceStatusApi): string => {
  const classes: Record<AttendanceStatusApi, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    LEAVE: 'bg-blue-100 text-blue-700'
  }
  return classes[status]
}

const getAttendanceStatusText = (status: AttendanceStatusApi): string => {
  const texts: Record<AttendanceStatusApi, string> = {
    PRESENT: '\u5df2\u7b7e\u5230',
    ABSENT: '\u7f3a\u52e4',
    LATE: '\u8fdf\u5230',
    LEAVE: '\u8bf7\u5047'
  }
  return texts[status]
}

const getMethodText = (method: AttendanceMethodApi): string => {
  const texts: Record<AttendanceMethodApi, string> = {
    FACE_RECOGNITION: '\u4eba\u8138\u8bc6\u522b',
    MANUAL: '\u624b\u52a8\u5f55\u5165',
    QR_CODE: '\u4e8c\u7ef4\u7801',
    CARD: '\u5237\u5361'
  }
  return texts[method]
}

onMounted(() => {
  loadCourses()
  loadAttendanceRecords()
})
</script>

<style scoped>
.attendance-page :deep(.ant-table-thead > tr > th) {
  background: #f9fafb;
}
</style>
