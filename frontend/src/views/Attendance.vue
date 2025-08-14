<template>
      <div class="attendance-records-page min-h-screen bg-gray-50">
    <!-- 页面头部 -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">签到记录</h1>
          <p class="text-sm text-gray-600 mt-1">学员课程签到记录查看与分析</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm text-gray-500">查询日期</p>
            <p class="font-semibold text-gray-800">{{ currentDate }}</p>
          </div>
          <button
            @click="exportRecords"
            class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <i class="fas fa-download mr-2"></i>
            导出记录
          </button>
        </div>
      </div>
    </div>
  
          <!-- 主要内容区域 -->
    <div class="p-6">
      <!-- 查询筛选区-->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="fas fa-search mr-2 text-blue-500"></i>
          查询筛选
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">日期范围</label>
            <a-range-picker
              v-model:value="dateRange"
              class="w-full"
              :placeholder="['开始日期', '结束日期']"
              format="YYYY-MM-DD"
              @change="handleDateRangeChange"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">课程</label>
            <a-select
              v-model:value="selectedCourseId"
              placeholder="请选择课程"
              class="w-full"
              allow-clear
              @change="handleCourseChange"
            >
              <a-select-option 
                v-for="course in availableCourses" 
                :key="course.id" 
                :value="course.id"
              >
                {{ course.name }} - {{ course.teacher }}
              </a-select-option>
            </a-select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">签到状态</label>
            <a-select
              v-model:value="selectedStatus"
              placeholder="请选择状态"
              class="w-full"
              allow-clear
              @change="handleStatusChange"
            >
              <a-select-option value="present">已签到</a-select-option>
              <a-select-option value="absent">缺席</a-select-option>
              <a-select-option value="late">迟到</a-select-option>
              <a-select-option value="leave">请假</a-select-option>
            </a-select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">学员姓名</label>
            <a-input
              v-model:value="searchStudentName"
              placeholder="输入学员姓名"
              class="w-full"
              @change="handleStudentNameSearch"
            >
              <template #prefix>
                <i class="fas fa-user text-gray-400"></i>
              </template>
            </a-input>
          </div>
        </div>
        
        <div class="flex justify-end mt-4 gap-3">
          <a-button @click="resetFilters">
            <i class="fas fa-undo mr-2"></i>
            重置筛选
          </a-button>
          <a-button type="primary" @click="searchRecords">
            <i class="fas fa-search mr-2"></i>
            查询记录
          </a-button>
        </div>
      </div>
  
              <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-2xl font-bold text-green-600">{{ statistics.totalPresent }}</div>
          <div class="text-sm text-gray-600">总签到数</div>
          <div class="mt-2">
            <i class="fas fa-check-circle text-green-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-2xl font-bold text-red-600">{{ statistics.totalAbsent }}</div>
          <div class="text-sm text-gray-600">总缺席数</div>
          <div class="mt-2">
            <i class="fas fa-times-circle text-red-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ statistics.totalLate }}</div>
          <div class="text-sm text-gray-600">总迟到数</div>
          <div class="mt-2">
            <i class="fas fa-clock text-yellow-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-2xl font-bold text-blue-600">{{ statistics.attendanceRate }}%</div>
          <div class="text-sm text-gray-600">签到率</div>
          <div class="mt-2">
            <i class="fas fa-chart-line text-blue-500"></i>
          </div>
        </div>
      </div>
  
              <!-- 签到记录表格 -->
      <div class="bg-white rounded-lg shadow-lg">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-list mr-2 text-indigo-500"></i>
              签到记录列表
            </h3>
            <div class="text-sm text-gray-600">
              共{{ filteredRecords.length }} 条记录
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">学员</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">课程</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">上课日期</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">课程时间</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">签到时间</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">状态</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">签到方式</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">置信度</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">地点</th>
                <th class="text-left py-3 px-6 text-gray-600 font-semibold">备注</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="record in paginatedRecords" 
                :key="record.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td class="py-4 px-6">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span class="text-white text-sm font-medium">
                        {{ record.studentName.charAt(0) }}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">{{ record.studentName }}</div>
                      <div class="text-sm text-gray-500">ID: {{ record.studentId }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="font-medium text-gray-900">{{ record.courseName }}</div>
                </td>
                <td class="py-4 px-6 text-gray-600">{{ record.classDate }}</td>
                <td class="py-4 px-6 text-gray-600">{{ record.classTime }}</td>
                <td class="py-4 px-6 text-gray-600">{{ record.checkInTime || '-' }}</td>
                <td class="py-4 px-6">
                  <span 
                    :class="getAttendanceStatusClass(record.status)"
                    class="px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {{ getAttendanceStatusText(record.status) }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span class="text-sm text-gray-600">{{ getMethodText(record.method) }}</span>
                </td>
                <td class="py-4 px-6">
                  <span v-if="record.faceConfidence" class="text-sm text-gray-600">
                    {{ (record.faceConfidence * 100).toFixed(1) }}%
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="py-4 px-6 text-sm text-gray-600">{{ record.location }}</td>
                <td class="py-4 px-6 text-sm text-gray-600">{{ record.remarks || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="p-6 border-t border-gray-200">
          <a-pagination
            v-model:current="currentPage"
            v-model:page-size="pageSize"
            :total="filteredRecords.length"
            :show-size-changer="true"
            :show-quick-jumper="true"
            :show-total="(total: number, range: [number, number]) => `共${total} 条记录`"
            :page-size-options="['10', '20', '50', '100']"
            :show-size-changer-text="['每页显示', '条']"
            :show-quick-jumper-text="['跳至', '页']"
            @change="handlePageChange"
          />
        </div>
      </div>
      </div>
  
      
    </div>
  </template>
  
  <script setup lang="ts">
/**
 * 签到记录页面
 * @component AttendanceRecords
 * @description 学员课程签到记录查看与分析系统
 */
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import type { 
  AttendanceRecord, 
  Course,
  AttendanceStatus,
  AttendanceMethod
} from '@/types/index'
  
  // 响应式数组
const currentDate = ref<string>(dayjs().format('YYYY年MM月DD日'))

// 查询筛选相关
const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const selectedCourseId = ref<number | undefined>(undefined)
const selectedStatus = ref<AttendanceStatus | undefined>(undefined)
const searchStudentName = ref<string>('')

// 分页相关
const currentPage = ref<number>(1)
const pageSize = ref<number>(20)
  
  // 模拟数据 - 签到记录
  
  const attendanceRecords = ref<AttendanceRecord[]>([
  {
    id: 1,
    studentId: 1,
    studentName: '张三',
    courseId: 1,
    courseName: '二人台表演艺术',
    classDate: dayjs().format('YYYY-MM-DD'),
    classTime: '08:30-10:30',
    status: 'present',
    method: 'face_recognition',
    checkInTime: '08:25',
    faceConfidence: 0.92,
    location: '音乐教室1',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 2,
    studentId: 2,
    studentName: '李四',
    courseId: 1,
    courseName: '二人台表演艺术',
    classDate: dayjs().format('YYYY-MM-DD'),
    classTime: '08:30-10:30',
    status: 'late',
    method: 'manual',
    checkInTime: '08:45',
    location: '音乐教室1',
    remarks: '路上堵车迟到',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 3,
    studentId: 3,
    studentName: '王五',
    courseId: 2,
    courseName: '声乐一年级',
    classDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    classTime: '15:00-17:00',
    status: 'absent',
    method: 'manual',
    location: '音乐教室2',
    remarks: '未到',
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 4,
    studentId: 4,
    studentName: '赵六',
    courseId: 2,
    courseName: '声乐一年级',
    classDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    classTime: '15:00-17:00',
    status: 'leave',
    method: 'manual',
    location: '音乐教室2',
    remarks: '事假',
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
  }
])
  
  const availableCourses = ref<Course[]>([
    {
      id: 1, name: '二人台表演艺术', courseId: 'MUS001', description: '传统二人台表演艺术',
      category: 'music', level: 'intermediate', teacher: '刘爱华', teacherId: 1, credits: 2,
      capacity: 30, enrolled: 25, location: '音乐教室1', fee: 200, semester: '2024秋季',
      timeSlots: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' }],
      startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
      ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
      createdAt: '2024-08-15', updatedAt: '2024-08-15'
    }
  ])
  
  
  
  // 计算属性
const filteredRecords = computed(() => {
  let records = attendanceRecords.value
  
  // 日期范围筛选
  if (dateRange.value) {
    const [startDate, endDate] = dateRange.value
    records = records.filter(record => {
      const recordDate = dayjs(record.classDate)
      return (recordDate.isAfter(startDate, 'day') || recordDate.isSame(startDate, 'day')) && 
             (recordDate.isBefore(endDate, 'day') || recordDate.isSame(endDate, 'day'))
    })
  }
  
  // 课程筛选
  if (selectedCourseId.value) {
    records = records.filter(record => record.courseId === selectedCourseId.value)
  }
  
  // 状态筛选
  if (selectedStatus.value) {
    records = records.filter(record => record.status === selectedStatus.value)
  }
  
  // 学员姓名筛选
  if (searchStudentName.value.trim()) {
    records = records.filter(record => 
      record.studentName.toLowerCase().includes(searchStudentName.value.toLowerCase())
    )
  }
  
  return records.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const statistics = computed(() => {
  const records = filteredRecords.value
  const totalPresent = records.filter(r => r.status === 'present').length
  const totalAbsent = records.filter(r => r.status === 'absent').length
  const totalLate = records.filter(r => r.status === 'late').length
  const totalLeave = records.filter(r => r.status === 'leave').length
  const total = records.length
  
  return {
    totalPresent,
    totalAbsent,
    totalLate,
    totalLeave,
    attendanceRate: total > 0 ? Math.round((totalPresent + totalLate + totalLeave) / total * 100) : 0
  }
})
  
  /**
 * 导出签到记录
 */
const exportRecords = (): void => {
  const records = filteredRecords.value
  if (records.length === 0) {
    message.warning('暂无记录可导出')
    return
  }
  
  // 构造CSV数据
  const headers = ['学员姓名', '学员ID', '课程名称', '上课日期', '课程时间', '签到时间', '状态', '签到方式', '置信度', '地点', '备注']
  const csvContent = [
    headers.join(','),
    ...records.map(record => [
      record.studentName,
      record.studentId,
      record.courseName,
      record.classDate,
      record.classTime,
      record.checkInTime || '',
      getAttendanceStatusText(record.status),
      getMethodText(record.method),
      record.faceConfidence ? `${(record.faceConfidence * 100).toFixed(1)}%` : '',
      record.location,
      record.remarks || ''
    ].join(','))
  ].join('\n')
  
  // 创建下载链接
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `签到记录_${dayjs().format('YYYY-MM-DD')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  message.success('签到记录导出成功')
}

/**
 * 处理日期范围变化
 */
const handleDateRangeChange = (): void => {
  currentPage.value = 1 // 重置到第一页
}

/**
 * 处理课程筛选变化
 */
const handleCourseChange = (): void => {
  currentPage.value = 1 // 重置到第一页
}

/**
 * 处理状态筛选变化
 */
const handleStatusChange = (): void => {
  currentPage.value = 1 // 重置到第一页
}

/**
 * 处理学员姓名搜索变化
 */
const handleStudentNameSearch = (): void => {
  currentPage.value = 1 // 重置到第一页
}

/**
 * 重置筛选条件
 */
const resetFilters = (): void => {
  dateRange.value = null
  selectedCourseId.value = undefined
  selectedStatus.value = undefined
  searchStudentName.value = ''
  currentPage.value = 1
  message.success('筛选条件已重置')
}

/**
 * 查询记录
 */
const searchRecords = (): void => {
  currentPage.value = 1
  message.success(`找到 ${filteredRecords.value.length} 条符合条件的记录`)
}

/**
 * 处理分页变化
 */
const handlePageChange = (page: number, size: number): void => {
  currentPage.value = page
  pageSize.value = size
}
  
  
  
  
  
  // 状态样式和文本函数
  
  const getAttendanceStatusClass = (status: AttendanceStatus): string => {
    const classes = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      leave: 'bg-blue-100 text-blue-700'
    }
    return classes[status] || classes.present
  }
  
  const getAttendanceStatusText = (status: AttendanceStatus): string => {
    const texts = {
      present: '已签到',
      absent: '缺席',
      late: '迟到',
      leave: '请假'
    }
    return texts[status] || '未知'
  }
  
  const getMethodText = (method: AttendanceMethod): string => {
    const texts = {
      face_recognition: '人脸识别',
      manual: '手动录入',
      qr_code: '二维码',
      card: '刷卡'
    }
    return texts[method] || '未知'
  }
  
  // 生命周期
  onMounted(() => {
    // 初始化数据
  })
  </script>
  
  <style scoped>
  .attendance-records-page {
  min-height: 100vh;
}
  </style>
