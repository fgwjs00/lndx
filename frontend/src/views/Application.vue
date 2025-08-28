<template>
  <div class="application-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">报名管理</h1>
          <p class="text-orange-100">管理学生报名申请、审核流程和报名统计</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-6xl opacity-20">
            📝
          </div>
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-file-alt text-orange-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.total }}</h3>
            <p class="text-gray-500 text-sm">总申请数</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-clock text-yellow-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.pending }}</h3>
            <p class="text-gray-500 text-sm">待审核</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-check text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.approved }}</h3>
            <p class="text-gray-500 text-sm">已批准</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-times text-red-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.rejected }}</h3>
            <p class="text-gray-500 text-sm">已拒绝</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作区域 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <!-- 搜索-->
        <div class="relative flex-1 max-w-md">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="搜索学生姓名或身份证号..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            v-model="searchQuery"
          />
        </div>
        
        <!-- 筛选和操作按钮 -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <!-- 筛选区-->
          <div class="flex flex-col sm:flex-row gap-3">
            <select 
              v-model="selectedStatus"
              @change="fetchApplications"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-0"
            >
              <option value="">所有状态</option>
              <option value="PENDING" selected>待审核</option>
              <option value="APPROVED">已批准</option>
              <option value="REJECTED">已拒绝</option>
            </select>
            
            <select 
              v-model="selectedDepartment"
              @change="fetchApplications"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-0"
            >
              <option value="">所有院系</option>
              <option v-for="department in availableDepartments" :key="department" :value="department">
                {{ department }}
              </option>
            </select>
            
            <select 
              v-model="selectedCourse"
              @change="fetchApplications"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-0"
            >
              <option value="">所有课程</option>
              <option v-for="course in availableCourses" :key="course.id" :value="course.id">
                {{ course.name }}
              </option>
            </select>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              @click="handleBatchReview"
              :disabled="selectedApplications.length === 0"
              class="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
            >
              <i class="fas fa-check mr-2"></i>
              <span class="whitespace-nowrap">批量审核</span>
            </button>
            
            <button 
              @click="handleExportData"
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
            >
              <i class="fas fa-download mr-2"></i>
              <span class="whitespace-nowrap">导出数据</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 批量操作区域 -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center">
              <input 
                type="checkbox" 
                class="rounded mr-2"
                :checked="isAllSelected"
                @change="handleSelectAll"
              >
              <span class="text-sm text-gray-600">全选</span>
            </label>
            <span class="text-sm text-gray-500">已选择 {{ selectedApplications.length }} 个申请</span>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button 
              @click="handleBatchApprove"
              :disabled="selectedApplications.length === 0"
              class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm"
            >
              <i class="fas fa-check mr-2"></i>
              <span class="whitespace-nowrap">批量批准</span>
            </button>
            
            <button 
              @click="handleBatchReject"
              :disabled="selectedApplications.length === 0"
              class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm"
            >
              <i class="fas fa-times mr-2"></i>
              <span class="whitespace-nowrap">批量拒绝</span>
            </button>
            
            <button 
              @click="handleSendNotification"
              :disabled="selectedApplications.length === 0"
              class="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm"
            >
              <i class="fas fa-envelope mr-2"></i>
              <span class="whitespace-nowrap">发送通知</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 报名申请列表 -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">报名申请列表</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">
                <input 
                  type="checkbox" 
                  class="rounded" 
                  :checked="isAllSelected"
                  @change="handleSelectAll"
                >
              </th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学生信息</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">身份证号码</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">院系</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">申请课程</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="application in filteredApplications" :key="application.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6">
                <input 
                  type="checkbox" 
                  class="rounded"
                  :checked="selectedApplications.includes(application.id)"
                  @change="handleSelectApplication(application.id)"
                >
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center">
                  <img :src="getAvatarUrl(application.avatar)" :alt="application.studentInfo?.name || application.studentName" class="w-12 h-12 rounded-full mr-3 object-cover border border-gray-300" @error="handleAvatarError($event)">
                  <div>
                    <p class="font-medium text-gray-800">{{ application.studentInfo?.name || application.studentName }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-gray-800 font-mono">{{ application.studentInfo?.idNumber || application.studentId }}</td>
              <td class="py-4 px-6 text-gray-600">{{ application.studentInfo?.major || application.major || '未设置' }}</td>
              <td class="py-4 px-6 text-gray-600">{{ application.courseInfo?.name || application.courseName }}</td>
              <td class="py-4 px-6">
                <span 
                  :class="getStatusClass(application.status)"
                  class="px-3 py-1 rounded-full text-xs font-medium"
                >
                  {{ getStatusText(application.status) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <button 
                    v-if="application.status.toUpperCase() === 'PENDING'"
                    @click="reviewApplication(application, 'approved')"
                    class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center min-w-0" 
                    title="批准"
                  >
                    <i class="fas fa-check text-sm"></i>
                  </button>
                  <button 
                    v-if="application.status.toUpperCase() === 'PENDING'"
                    @click="reviewApplication(application, 'rejected')"
                    class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center min-w-0" 
                    title="拒绝"
                  >
                    <i class="fas fa-times text-sm"></i>
                  </button>
                  <button 
                    @click="viewApplicationDetail(application)"
                    class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center min-w-0" 
                    title="查看详情"
                  >
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                  <button 
                    v-if="application.status.toUpperCase() === 'PENDING'"
                    @click="editApplication(application)"
                    class="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center min-w-0" 
                    title="编辑"
                  >
                    <i class="fas fa-edit text-sm"></i>
                  </button>

                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div class="p-6 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            显示 {{ (pagination.current - 1) * pagination.pageSize + 1 }}-{{ Math.min(pagination.current * pagination.pageSize, pagination.total) }} 条，共{{ pagination.total }} 条记录
          </div>
          <div class="flex items-center space-x-2">
            <button 
              @click="handlePageChange(pagination.current - 1, pagination.pageSize)"
              :disabled="pagination.current <= 1"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span class="px-3 py-1 bg-orange-500 text-white rounded">
              {{ pagination.current }}
            </span>
            <button 
              @click="handlePageChange(pagination.current + 1, pagination.pageSize)"
              :disabled="pagination.current * pagination.pageSize >= pagination.total"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 详情查看模态框 -->
    <ApplicationDetailModal
      v-model:open="detailModalVisible"
      :application="currentApplication"
      @approve="handleDetailApprove"
      @reject="handleDetailReject"
    />
    
    <!-- 编辑模态框 -->
    <ApplicationEditModal
      v-model:open="editModalVisible"
      :application="currentApplication"
      :available-courses="availableCourses"
      @save="handleEditSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 报名管理页面
 * @component Application
 * @description 学生报名申请的审核和管理
 */
import { ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ApplicationService } from '@/api/application'
import ApplicationDetailModal from '@/components/ApplicationDetailModal.vue'
import ApplicationEditModal from '@/components/ApplicationEditModal.vue'
import { getAvatarUrl, handleImageError } from '@/utils/imageUtils'

// 响应式数据
const searchQuery = ref<string>('')
const selectedStatus = ref<string>('PENDING') // 默认显示待审核
const selectedCourse = ref<string>('')
const selectedDepartment = ref<string>('')
const applications = ref<any[]>([])
const availableCourses = ref<any[]>([])
const availableDepartments = ref<string[]>([])
const selectedApplications = ref<string[]>([])
const loading = ref<boolean>(false)
const detailModalVisible = ref<boolean>(false)
const editModalVisible = ref<boolean>(false)
const currentApplication = ref<any>(null)
const statistics = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0
})
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

// 🔥 已移除模拟数据，现在只使用真实的数据库数据

// API调用方法
/**
 * 获取报名申请列表
 */
const fetchApplications = async (): Promise<void> => {
  try {
    loading.value = true
    const params: any = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    }
    
    // 添加状态筛选参数
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    
    // 添加院系筛选参数
    if (selectedDepartment.value) {
      params.department = selectedDepartment.value
    }
    
    // 添加课程筛选参数
    if (selectedCourse.value) {
      params.courseId = selectedCourse.value
    }
    
    // 添加搜索关键词
    if (searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim()
    }

    const response = await ApplicationService.getApplicationList(params)
    applications.value = response.data?.list || []
    pagination.value.total = response.data?.total || 0
    
    // 同时更新可用课程和院系列表
    await fetchAvailableCourses()
    await fetchAvailableDepartments()
    
    console.log('获取报名申请列表成功:', response.data)
  } catch (error) {
    console.error('获取报名申请列表失败:', error)
    message.error('获取报名申请列表失败')
    applications.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 获取报名统计数据
 */
const fetchStatistics = async (): Promise<void> => {
  try {
    const response = await ApplicationService.getApplicationStatistics()
    if (response.code === 200) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 使用默认数据
    statistics.value = { total: 0, pending: 0, approved: 0, rejected: 0 }
  }
}



/**
 * 审核报名申请
 */
const reviewApplication = async (application: any, status: 'approved' | 'rejected'): Promise<void> => {
  try {
    await ApplicationService.reviewApplication(application.id.toString(), status, '')
    const statusText = status === 'approved' ? '批准' : '拒绝'
    message.success(`${statusText}申请成功`)
    
    // 从选中列表中移除
    const index = selectedApplications.value.indexOf(application.id)
    if (index > -1) {
      selectedApplications.value.splice(index, 1)
    }
    
    await fetchApplications()
    await fetchStatistics()
  } catch (error) {
    console.error('审核申请失败:', error)
    message.error('审核申请失败')
  }
}

/**
 * 处理分页变化
 */
const handlePageChange = async (page: number, pageSize: number): Promise<void> => {
  pagination.value.current = page
  pagination.value.pageSize = pageSize
  await fetchApplications()
}

/**
 * 获取可用课程列表
 */
const fetchAvailableCourses = async (): Promise<void> => {
  try {
    // 这里应该调用课程API，暂时使用应用列表中的课程去重
    const courseSet = new Set()
    applications.value.forEach(app => {
      if (app.courseInfo?.name) {
        courseSet.add(JSON.stringify({
          id: app.courseInfo.id || app.courseId,
          name: app.courseInfo.name
        }))
      }
    })
    availableCourses.value = Array.from(courseSet).map(courseStr => JSON.parse(courseStr as string))
  } catch (error) {
    console.error('获取课程列表失败:', error)
  }
}

/**
 * 获取可用院系列表
 */
const fetchAvailableDepartments = async (): Promise<void> => {
  try {
    // 从申请列表中提取院系信息
    const departmentSet = new Set<string>()
    applications.value.forEach(app => {
      const department = app.studentInfo?.major || app.major
      if (department && department !== '未设置') {
        departmentSet.add(department)
      }
    })
    availableDepartments.value = Array.from(departmentSet)
  } catch (error) {
    console.error('获取院系列表失败:', error)
  }
}

/**
 * 处理头像图片加载错误
 */
const handleAvatarError = (event: Event): void => {
  handleImageError(event, 'avatar')
}



/**
 * 处理全选
 */
const handleSelectAll = (): void => {
  if (isAllSelected.value) {
    selectedApplications.value = []
  } else {
    selectedApplications.value = applications.value.map(app => app.id)
  }
}

/**
 * 处理单个选择
 */
const handleSelectApplication = (applicationId: string): void => {
  const index = selectedApplications.value.indexOf(applicationId)
  if (index > -1) {
    selectedApplications.value.splice(index, 1)
  } else {
    selectedApplications.value.push(applicationId)
  }
}

/**
 * 批量审核处理
 */
const handleBatchReview = (): void => {
  if (selectedApplications.value.length === 0) {
    message.warning('请先选择要审核的申请')
    return
  }
  // 这里可以打开批量审核对话框
  message.info('批量审核功能开发中...')
}

/**
 * 批量批准
 */
const handleBatchApprove = async (): Promise<void> => {
  if (selectedApplications.value.length === 0) {
    message.warning('请先选择要批准的申请')
    return
  }
  
  try {
    const promises = selectedApplications.value.map(id => 
      ApplicationService.reviewApplication(id, 'approved')
    )
    await Promise.all(promises)
    message.success(`成功批准 ${selectedApplications.value.length} 个申请`)
    selectedApplications.value = []
    await fetchApplications()
  } catch (error) {
    console.error('批量批准失败:', error)
    message.error('批量批准失败')
  }
}

/**
 * 批量拒绝
 */
const handleBatchReject = async (): Promise<void> => {
  if (selectedApplications.value.length === 0) {
    message.warning('请先选择要拒绝的申请')
    return
  }
  
  try {
    const promises = selectedApplications.value.map(id => 
      ApplicationService.reviewApplication(id, 'rejected')
    )
    await Promise.all(promises)
    message.success(`成功拒绝 ${selectedApplications.value.length} 个申请`)
    selectedApplications.value = []
    await fetchApplications()
  } catch (error) {
    console.error('批量拒绝失败:', error)
    message.error('批量拒绝失败')
  }
}

/**
 * 发送通知
 */
const handleSendNotification = (): void => {
  if (selectedApplications.value.length === 0) {
    message.warning('请先选择要发送通知的申请')
    return
  }
  message.info('通知功能开发中...')
}

/**
 * 导出数据
 */
const handleExportData = (): void => {
  try {
    const csvData = generateCSV(applications.value)
    downloadCSV(csvData, `报名申请数据_${new Date().toISOString().slice(0, 10)}.csv`)
    message.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  }
}

/**
 * 生成CSV数据
 */
const generateCSV = (data: any[]): string => {
  const headers = ['学生姓名', '身份证号', '院系', '申请课程', '状态', '备注']
  const rows = data.map(app => [
    app.studentInfo?.name || app.studentName,
    app.studentInfo?.idNumber || app.studentId,
    app.studentInfo?.major || app.major || '未设置',
    app.courseInfo?.name || app.courseName,
    getStatusText(app.status),
    app.remarks || ''
  ])
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')
}

/**
 * 下载CSV文件
 */
const downloadCSV = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 查看申请详情
 */
const viewApplicationDetail = (application: any): void => {
  currentApplication.value = application
  detailModalVisible.value = true
}

/**
 * 编辑申请
 */
const editApplication = (application: any): void => {
  currentApplication.value = application
  editModalVisible.value = true
}

/**
 * 处理详情模态框的审核操作
 */
const handleDetailApprove = async (application: any): Promise<void> => {
  await reviewApplication(application, 'approved')
  detailModalVisible.value = false
}

const handleDetailReject = async (application: any): Promise<void> => {
  await reviewApplication(application, 'rejected')
  detailModalVisible.value = false
}

/**
 * 处理编辑保存
 */
const handleEditSave = async (data: any): Promise<void> => {
  try {
    // 这里调用更新申请的API
    await ApplicationService.updateApplication(data.id, {
      courseId: data.courseId,
      insuranceStart: data.insuranceStart,
      insuranceEnd: data.insuranceEnd,
      remarks: data.remarks
    })
    
    message.success('申请信息更新成功')
    editModalVisible.value = false
    await fetchApplications()
    await fetchStatistics()
  } catch (error) {
    console.error('更新申请失败:', error)
    message.error('更新申请失败')
  }
}



// 监听筛选条件变化
watch([searchQuery, selectedStatus, selectedCourse, selectedDepartment], () => {
  // 重置到第一页并重新获取数据
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.value.current = 1
    fetchApplications()
  }, 300)
})

let searchTimer: NodeJS.Timeout

// 计算属性 - 现在主要用于前端展示，后端已做筛选
const filteredApplications = computed(() => {
  // 后端已经做了筛选，前端主要负责展示
  return applications.value
})

/**
 * 是否全选
 */
const isAllSelected = computed(() => {
  return applications.value.length > 0 && selectedApplications.value.length === applications.value.length
})

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  const normalizedStatus = status.toUpperCase()
  switch (normalizedStatus) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-600'
    case 'APPROVED':
      return 'bg-green-100 text-green-600'
    case 'REJECTED':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  const normalizedStatus = status.toUpperCase()
  switch (normalizedStatus) {
    case 'PENDING':
      return '待审核'
    case 'APPROVED':
      return '已批准'
    case 'REJECTED':
      return '已拒绝'
    default:
      return '未知'
  }
}

// 监听器
watch([searchQuery, selectedStatus], () => {
  pagination.value.current = 1
  fetchApplications()
}, { deep: true })

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Application 组件已挂载')
  fetchApplications()
  fetchStatistics()
})
</script>

<style scoped>
.application-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
