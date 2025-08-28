<template>
  <div class="grade-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">学生年级管理</h1>
          <p class="text-indigo-100">管理学生年级升级、毕业归档和学习周期</p>
        </div>
        <div class="text-6xl opacity-20">
          🎓
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-graduate text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.activeStudents || 0 }}</h3>
            <p class="text-gray-500 text-sm">在读学生</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-level-up-alt text-orange-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.upgradeNeeded || 0 }}</h3>
            <p class="text-gray-500 text-sm">待升级学生</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-graduation-cap text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.graduationNeeded || 0 }}</h3>
            <p class="text-gray-500 text-sm">待毕业学生</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-trophy text-purple-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.graduatedStudents || 0 }}</h3>
            <p class="text-gray-500 text-sm">已毕业学生</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作面板 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h3 class="text-xl font-semibold text-gray-800">年级管理操作</h3>
          <p class="text-gray-600 mt-1">当前学期：{{ statistics.currentSemester || '2025年度' }}</p>
        </div>
        
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <button 
            @click="handleBatchUpgrade"
            :disabled="!statistics.upgradeNeeded && !statistics.graduationNeeded || upgradeLoading"
            class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <i v-if="!upgradeLoading" class="fas fa-level-up-alt"></i>
            <i v-else class="fas fa-spinner fa-spin"></i>
            批量升级年级 ({{ (statistics.upgradeNeeded || 0) + (statistics.graduationNeeded || 0) }})
          </button>
          
          <button 
            @click="handleRefreshData"
            :disabled="loading"
            class="bg-white text-indigo-600 px-6 py-3 rounded-full border-2 border-indigo-200 hover:bg-indigo-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <i v-if="!loading" class="fas fa-sync-alt"></i>
            <i v-else class="fas fa-spinner fa-spin"></i>
            刷新数据
          </button>
        </div>
      </div>
    </div>

    <!-- 学生列表 -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <i class="fas fa-table text-indigo-600"></i>
              学生年级详情
            </h3>
            <p class="text-gray-600 mt-1">管理和查看学生年级信息</p>
          </div>
          
          <!-- 筛选器 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <select 
              v-model="selectedGradeFilter"
              @change="handleGradeFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
            >
              <option value="">所有年级</option>
              <option value="一年级">一年级</option>
              <option value="二年级">二年级</option>
              <option value="三年级">三年级</option>
            </select>
            
            <select 
              v-model="selectedStatusFilter"
              @change="handleStatusFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
            >
              <option value="">所有状态</option>
              <option value="IN_PROGRESS">在读</option>
              <option value="GRADUATED">已毕业</option>
            </select>
          </div>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredStudents"
        :loading="loading"
        :pagination="{
          total: filteredStudents.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number, range: number[]) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
        }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'currentGrade'">
            <a-tag :color="getGradeTagColor(record.currentGrade)">
              {{ record.currentGrade || '未分配' }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'graduationStatus'">
            <a-tag :color="getStatusTagColor(record.graduationStatus)">
              {{ getStatusText(record.graduationStatus) }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'enrollmentInfo'">
            <div class="enrollment-info">
              <div>{{ record.enrollmentYear }}年入学</div>
              <div class="semester-info">{{ record.enrollmentSemester }}</div>
            </div>
          </template>
          
          <template v-if="column.key === 'actions'">
            <div class="flex gap-2">
              <button 
                @click="handleManualGraduation(record)"
                :disabled="record.graduationStatus === 'GRADUATED'"
                class="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <i class="fas fa-graduation-cap"></i>
                毕业
              </button>
              <button 
                @click="handleViewDetails(record)"
                class="bg-indigo-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-indigo-600 transition-colors flex items-center gap-1"
              >
                <i class="fas fa-eye"></i>
                详情
              </button>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 手动毕业对话框 -->
    <a-modal
      v-model:open="graduationModalVisible"
      title="设置学生毕业"
      :confirm-loading="graduationLoading"
      @ok="handleConfirmGraduation"
    >
      <div v-if="selectedStudent">
        <p style="margin-bottom: 16px;">确认将学生 <strong>{{ selectedStudent.name }}</strong> 设置为毕业状态？</p>
        
        <a-form layout="vertical">
          <a-form-item label="毕业日期">
            <a-date-picker
              v-model:value="graduationForm.graduationDate"
              style="width: 100%"
              placeholder="选择毕业日期"
            />
          </a-form-item>
          
          <a-form-item label="备注">
            <a-textarea
              v-model:value="graduationForm.remarks"
              placeholder="请输入毕业备注信息..."
              :rows="3"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 学生年级管理页面（简化版）
 * @component GradeManagementSimple
 * @description 管理学生年级升级、毕业归档和学习周期
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import request from '@/api/request'
import type { Student } from '@/types/models'

// 接口定义
interface GradeStatistics {
  currentSemester: string
  activeStudents: number
  graduatedStudents: number
  upgradeNeeded: number
  graduationNeeded: number
}

interface GradeManagementStudent extends Student {
  currentGrade?: string
  enrollmentYear?: number
  enrollmentSemester?: string
  graduationStatus?: string
  graduationDate?: string
  academicStatus?: string
}

// 响应式数据
const loading = ref<boolean>(false)
const upgradeLoading = ref<boolean>(false)
const graduationLoading = ref<boolean>(false)
const statistics = ref<Partial<GradeStatistics>>({})
const students = ref<GradeManagementStudent[]>([])
const selectedGradeFilter = ref<string>()
const selectedStatusFilter = ref<string>()

// 对话框状态
const graduationModalVisible = ref<boolean>(false)
const selectedStudent = ref<GradeManagementStudent | null>(null)

// 毕业表单
const graduationForm = reactive({
  graduationDate: null as Dayjs | null,
  remarks: ''
})

// 表格列定义
const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 100
  },
  {
    title: '学号',
    dataIndex: 'studentCode',
    key: 'studentCode',
    width: 120
  },
  {
    title: '当前年级',
    key: 'currentGrade',
    width: 100,
    align: 'center'
  },
  {
    title: '学籍状态',
    key: 'graduationStatus',
    width: 100,
    align: 'center'
  },
  {
    title: '入学信息',
    key: 'enrollmentInfo',
    width: 120
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
    width: 60,
    align: 'center'
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center'
  }
]

// 计算属性
const filteredStudents = computed(() => {
  let result = students.value
  
  if (selectedGradeFilter.value) {
    result = result.filter(student => student.currentGrade === selectedGradeFilter.value)
  }
  
  if (selectedStatusFilter.value) {
    result = result.filter(student => student.graduationStatus === selectedStatusFilter.value)
  }
  
  return result
})

// 方法
const loadStatistics = async (): Promise<void> => {
  try {
    const response = await request.get('/grade-management/statistics')
    statistics.value = response.data || {}
    console.log('年级统计数据:', statistics.value)
  } catch (error) {
    console.error('获取年级统计失败:', error)
    message.error('获取年级统计失败')
  }
}

const loadStudents = async (): Promise<void> => {
  try {
    const response = await request.get('/students?page=1&pageSize=100&includeGradeInfo=true')
    const data = response.data as { list?: GradeManagementStudent[] }
    students.value = data?.list || []
    console.log('学生数据:', students.value)
  } catch (error) {
    console.error('获取学生列表失败:', error)
    message.error('获取学生列表失败')
  }
}

const handleRefreshData = async (): Promise<void> => {
  loading.value = true
  try {
    await Promise.all([loadStatistics(), loadStudents()])
    message.success('数据刷新成功')
  } catch (error) {
    message.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const handleBatchUpgrade = async (): Promise<void> => {
  if (!statistics.value.upgradeNeeded && !statistics.value.graduationNeeded) {
    message.info('当前没有需要升级的学生')
    return
  }

  upgradeLoading.value = true
  try {
    const response = await request.post('/grade-management/upgrade-students', {})
    const data = response.data as { totalProcessed?: number }
    
    message.success(`成功处理 ${data?.totalProcessed || 0} 名学生的年级变更`)
    console.log('升级结果:', response.data)
    
    // 刷新数据
    await handleRefreshData()
  } catch (error: any) {
    console.error('批量升级失败:', error)
    message.error('批量升级失败')
  } finally {
    upgradeLoading.value = false
  }
}

const handleManualGraduation = (student: GradeManagementStudent): void => {
  selectedStudent.value = student
  graduationForm.graduationDate = dayjs()
  graduationForm.remarks = ''
  graduationModalVisible.value = true
}

const handleConfirmGraduation = async (): Promise<void> => {
  if (!selectedStudent.value) return

  graduationLoading.value = true
  try {
    await request.post(`/grade-management/graduate/${selectedStudent.value.id}`, {
      graduationDate: graduationForm.graduationDate?.toISOString(),
      remarks: graduationForm.remarks
    })
    
    message.success(`学生 ${selectedStudent.value.name} 已成功毕业`)
    graduationModalVisible.value = false
    
    // 刷新数据
    await handleRefreshData()
  } catch (error: any) {
    console.error('设置毕业失败:', error)
    message.error('设置毕业失败')
  } finally {
    graduationLoading.value = false
  }
}

const handleViewDetails = (student: GradeManagementStudent): void => {
  selectedStudent.value = student
}

const handleGradeFilterChange = (): void => {
  console.log('年级筛选变更:', selectedGradeFilter.value)
}

const handleStatusFilterChange = (): void => {
  console.log('状态筛选变更:', selectedStatusFilter.value)
}

// 工具方法
const getGradeTagColor = (grade: string): string => {
  const colorMap: Record<string, string> = {
    '一年级': 'blue',
    '二年级': 'green',
    '三年级': 'orange',
    '未分配': 'default'
  }
  return colorMap[grade] || 'default'
}

const getStatusTagColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'IN_PROGRESS': 'processing',
    'GRADUATED': 'success',
    'ARCHIVED': 'default'
  }
  return colorMap[status] || 'default'
}

const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    'IN_PROGRESS': '在读',
    'GRADUATED': '已毕业',
    'ARCHIVED': '已归档'
  }
  return textMap[status] || status
}

// 生命周期
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadStatistics(), loadStudents()])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.grade-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* 渐变色 */
.bg-gradient-to-r {
  background: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-indigo-500 {
  --tw-gradient-from: #6366f1;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(99, 102, 241, 0));
}

.to-purple-600 {
  --tw-gradient-to: #9333ea;
}

.from-indigo-50 {
  --tw-gradient-from: #eef2ff;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(238, 242, 255, 0));
}

.to-purple-50 {
  --tw-gradient-to: #faf5ff;
}

/* 表格内容样式 */
.enrollment-info {
  font-size: 14px;
}

.semester-info {
  color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grade-management {
    padding: 16px;
  }
}
</style>
