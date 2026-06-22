<template>
  <div class="student-management">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">学生管理</h1>
          <p class="text-emerald-100">管理学生信息、学籍档案和相关数据</p>
        </div>
        <div class="text-6xl opacity-20">
          👨‍🎓
        </div>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-users text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ studentStats.totalStudents.toLocaleString() }}</h3>
            <p class="text-gray-500 text-sm">总学生数</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-check text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ studentStats.activeStudents.toLocaleString() }}</h3>
            <p class="text-gray-500 text-sm">已通过学生</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-plus text-yellow-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ studentStats.newStudentsThisMonth }}</h3>
            <p class="text-gray-500 text-sm">新增学生</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <i class="fas fa-user-clock text-yellow-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-800">{{ studentStats.newStudentsThisMonth }}</h3>
            <p class="text-gray-500 text-sm">本月新增</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作区域 -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <!-- 搜索框 -->
        <div class="relative flex-1 max-w-md">
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="搜索学生姓名或学号..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            v-model="searchQuery"
          />
        </div>
        
        <!-- 筛选和操作按钮 -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <!-- 筛选区域 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <select 
              v-model="selectedSemester"
              @change="handleFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
            >
              <option value="">所有学期</option>
              <option v-for="semester in availableSemesters" :key="semester" :value="semester">
                {{ semester }}
              </option>
            </select>
            
            <select 
              v-model="selectedMajor"
              @change="handleFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
            >
              <option value="">所有院系</option>
              <option v-for="major in availableMajors" :key="major" :value="major">
                {{ major }}
              </option>
            </select>
            
            <select 
              v-model="selectedPoliticalStatus"
              @change="handleFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
            >
              <option value="">所有政治面貌</option>
              <option v-for="status in availablePoliticalStatus" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
            
            <select 
              v-model="selectedGrade"
              @change="handleFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
            >
              <option value="">所有年级</option>
              <option v-for="grade in availableGrades" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
            
            <select 
              v-model="selectedCourse"
              @change="handleFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
            >
              <option value="">所有课程</option>
              <option v-for="course in availableCourses" :key="course.id" :value="course.id">
                {{ course.name }}
              </option>
            </select>
            
            <select 
              v-model="selectedStatus"
              @change="handleFilterChange"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
            >
              <option value="">所有状态</option>
              <option value="APPROVED">已通过</option>
              <option value="PENDING">待审核</option>
              <option value="REJECTED">已拒绝</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <!-- 添加学生按钮 - 只有学校管理员可见 -->
            <button 
              v-if="hasPermission('student:create')"
              @click="handleAddStudent"
              class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0"
            >
              <i class="fas fa-user-plus mr-2"></i>
              <span class="whitespace-nowrap">添加学生</span>
            </button>
            
            <!-- 批量导入按钮 - 只有学校管理员可见 -->
            <button 
              v-if="hasPermission('student:import')"
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
              <i class="fas fa-upload mr-2"></i>
              <span class="whitespace-nowrap">批量导入</span>
            </button>
            
            <!-- 导出数据按钮 - 只有学校管理员可见 -->
            <button 
              v-if="hasPermission('student:export')"
              @click="handleExportStudents"
              :disabled="loading"
              class="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center justify-center transition-colors min-w-0">
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
              <input type="checkbox" class="rounded mr-2">
              <span class="text-sm text-gray-600">全选</span>
            </label>
            <span class="text-sm text-gray-500">已选择 0 个学生</span>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-user-slash mr-2"></i>
              <span class="whitespace-nowrap">批量禁用</span>
            </button>
            
            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-user-check mr-2"></i>
              <span class="whitespace-nowrap">批量启用</span>
            </button>
            
            <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm">
              <i class="fas fa-trash mr-2"></i>
              <span class="whitespace-nowrap">批量删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 学生列表 -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">学生列表</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">
                <input type="checkbox" class="rounded">
              </th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学生信息</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">手机号</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">学期</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">院系</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">年级</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">政治面貌</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">报名课程</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold cursor-pointer hover:bg-gray-100" @click="toggleSort('enrollmentDate')">
                报名时间
                <i v-if="sortField === 'enrollmentDate'" 
                   :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"
                   class="ml-1 text-emerald-500"></i>
                <i v-else class="fas fa-sort ml-1 text-gray-400"></i>
              </th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">状态</th>
              <th class="text-left py-4 px-6 text-gray-600 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-6">
                <input type="checkbox" class="rounded">
              </td>
              <td class="py-4 px-6">
                <div>
                  <p class="font-semibold text-gray-800 text-lg">{{ student.name }}</p>
                  <p class="text-sm text-gray-500 font-mono">{{ student.idNumber || student.studentCode }}</p>
                </div>
              </td>
              <td class="py-4 px-6 text-gray-600">{{ student.contactPhone || student.phone || '未设置' }}</td>
              <td class="py-4 px-6 text-gray-600">{{ student.semester }}</td>
              <td class="py-4 px-6 text-gray-600">{{ student.major || '未设置' }}</td>
              <td class="py-4 px-6 text-gray-600">{{ getStudentGradeDisplay(student) }}</td>
              <td class="py-4 px-6 text-gray-600">{{ student.politicalStatus || '未设置' }}</td>
              <td class="py-4 px-6">
                <div class="space-y-1">
                  <div v-if="student.enrollments && student.enrollments.length > 0">
                    <span v-for="enrollment in student.enrollments" :key="enrollment.id" 
                          class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                      {{ getCourseDisplayName(enrollment.course) }}
                    </span>
                  </div>
                  <div v-else class="text-gray-400 text-sm">未报名</div>
                </div>
              </td>
              <td class="py-4 px-6">
                <div v-if="student.firstEnrollmentDate" class="text-gray-600">
                  <div class="text-sm">{{ formatDate(student.firstEnrollmentDate) }}</div>
                </div>
                <div v-else class="text-gray-400 text-sm">未报名</div>
              </td>
              <td class="py-4 px-6">
                <span 
                  :class="getStatusClass(student.status)"
                  class="px-3 py-1 rounded-full text-xs font-medium"
                >
                  {{ getStatusText(student.status) }}
                </span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <button 
                    @click="handleEditStudent(student)"
                    class="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center min-w-0" 
                    title="编辑"
                  >
                    <i class="fas fa-edit text-sm"></i>
                  </button>
                  <button 
                    @click="handleViewStudent(student)"
                    class="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center min-w-0" 
                    title="查看详情"
                  >
                    <i class="fas fa-eye text-sm"></i>
                  </button>

                  <button 
                    @click="handleDeleteStudent(student)"
                    class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center min-w-0" 
                    title="删除"
                  >
                    <i class="fas fa-trash text-sm"></i>
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
            显示 {{ (pagination.current - 1) * pagination.pageSize + 1 }}-{{ Math.min(pagination.current * pagination.pageSize, pagination.total) }} 条，共 {{ pagination.total }} 条记录
          </div>
          <a-pagination
            v-model:current="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :show-size-changer="true"
            :show-quick-jumper="true"
            :page-size-options="['10', '20', '50', '100']"
            :show-total="(total: number) => `共 ${total} 条记录`"
            :locale="{
              items_per_page: '条/页',
              jump_to: '跳至',
              jump_to_confirm: '确定',
              page: '页',
              prev_page: '上一页',
              next_page: '下一页',
              prev_5: '向前 5 页',
              next_5: '向后 5 页',
              prev_3: '向前 3 页',
              next_3: '向后 3 页'
            }"
            @change="handlePageChange"
            @show-size-change="handlePageChange"
            class="ant-pagination-custom"
          />
        </div>
      </div>
    </div>

    <!-- 学生详情查看弹窗 -->
    <StudentDetailModal 
      v-model:open="showDetailModal"
      :student="viewingStudent"
    />
    
    <!-- 学生编辑弹窗 -->
    <StudentEditModal 
      v-model:open="showEditModal"
      :student="editingStudent"
      @success="handleStudentUpdate"
    />
    
    <!-- 添加学生弹窗 -->
    <StudentAddModal 
      v-model:open="showAddModal"
      @success="handleStudentAdd"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 学生管理页面
 * @component Student
 * @description 学生信息的增删改查管理
 */
import { ref, computed, onMounted, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { StudentService, type Student } from '@/api/student'
import { CourseService } from '@/api/course'
import { useAuthStore } from '@/store/auth'
import StudentDetailModal from '@/components/StudentDetailModal.vue'
import StudentEditModal from '@/components/StudentEditModal.vue'
import StudentAddModal from '@/components/StudentAddModal.vue'

// 学生统计数据类型
interface StudentStats {
  totalStudents: number
  activeStudents: number      // 已通过学生
  inactiveStudents: number    // 待审核学生
  graduatedStudents: number   // 被拒绝学生（重用字段）
  newStudentsThisMonth: number
}

// 响应式数据
const authStore = useAuthStore()
const searchQuery = ref<string>('')
const selectedMajor = ref<string>('')
const selectedGrade = ref<string>('')
const selectedCourse = ref<string>('')
const selectedStatus = ref<string>('')
const selectedSemester = ref<string>('')
const selectedPoliticalStatus = ref<string>('')
const students = ref<Student[]>([])
const loading = ref<boolean>(false)
// 排序相关
const sortField = ref<string>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const availableMajors = ref<string[]>([])
const availableGrades = ref<string[]>(['一年级', '二年级', '三年级', '不分年级'])
const availableCourses = ref<Array<{id: string, name: string}>>([])
const availableSemesters = ref<string[]>([])
const availablePoliticalStatus = ref<string[]>([])
const studentStats = ref<StudentStats>({
  totalStudents: 0,
  activeStudents: 0,      // 已通过学生
  inactiveStudents: 0,    // 待审核学生
  graduatedStudents: 0,   // 被拒绝学生
  newStudentsThisMonth: 0
})
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

// 权限检查
const hasPermission = (permission: string): boolean => {
  const result = authStore.hasPermission(permission)
  // 调试信息
  console.log(`🔍 权限检查: ${permission} = ${result}`)
  console.log(`👤 当前用户权限:`, authStore.permissions)
  console.log(`👤 当前用户角色:`, authStore.user?.role)
  
  // 检查权限来源
  console.log(`🔍 权限来源分析:`)
  console.log(`   - localStorage权限:`, localStorage.getItem('permissions'))
  console.log(`   - authStore权限长度:`, authStore.permissions.length)
  console.log(`   - 是否使用模拟认证:`, typeof __MOCK_AUTH__ !== 'undefined' ? __MOCK_AUTH__ : import.meta.env.DEV)
  
  // 手动检查特定权限
  if (permission === 'student:create') {
    console.log(`🔍 手动检查 student:create:`)
    console.log(`   - 直接匹配: ${authStore.permissions.includes('student:create')}`)
    console.log(`   - 通配符匹配: ${authStore.permissions.includes('student:*')}`)
    console.log(`   - 超级管理员: ${authStore.permissions.includes('system:*')}`)
  }
  
  if (permission === 'student:export') {
    console.log(`🔍 手动检查 student:export:`)
    console.log(`   - 直接匹配: ${authStore.permissions.includes('student:export')}`)
    console.log(`   - 通配符匹配: ${authStore.permissions.includes('student:*')}`)
    console.log(`   - 超级管理员: ${authStore.permissions.includes('system:*')}`)
  }
  
  return result
}

// 表单相关
const showDetailModal = ref<boolean>(false)
const showEditModal = ref<boolean>(false)
const showAddModal = ref<boolean>(false)
const editingStudent = ref<Student | null>(null)
const viewingStudent = ref<Student | null>(null)

// API调用方法
/**
 * 获取学生列表
 */
const fetchStudents = async (): Promise<void> => {
  try {
    loading.value = true
    const params: any = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    }
    
    // 搜索关键词
    if (searchQuery.value && searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim()
    }
    
    // 院系筛选
    if (selectedMajor.value) {
      params.major = selectedMajor.value
    }
    
    // 政治面貌筛选
    // 政治面貌筛选 - 简单直接的实现
    if (selectedPoliticalStatus.value) {
      params.politicalStatus = selectedPoliticalStatus.value
      console.log('✅ 前端发送政治面貌参数:', selectedPoliticalStatus.value)
    }
    
    // 年级筛选
    if (selectedGrade.value) {
      params.currentGrade = selectedGrade.value
    }
    
    // 课程筛选
    if (selectedCourse.value) {
      params.courseId = selectedCourse.value
    }
    
    // 状态筛选
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    
    // 学期筛选
    if (selectedSemester.value) {
      params.semester = selectedSemester.value
    }
    
    // 排序参数
    if (sortField.value) {
      params.sortField = sortField.value
      params.sortOrder = sortOrder.value
    }

    const response = await StudentService.getStudents(params)
    students.value = response.data?.list || []
    pagination.value.total = response.data?.total || 0
    
    console.log('获取学生列表成功:', response.data)
    // 🔧 调试：检查报名时间字段
    if (students.value.length > 0) {
      const firstStudent = students.value[0]
      console.log('📅 第一个学生的时间字段调试:', {
        name: firstStudent.name,
        enrollmentDate: firstStudent.enrollmentDate,
        firstEnrollmentDate: firstStudent.firstEnrollmentDate,
        createdAt: firstStudent.createdAt,
        enrollments: firstStudent.enrollments?.map(e => ({
          courseId: e.courseId,
          courseName: e.course?.name,
          createdAt: e.createdAt
        }))
      })
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    message.error('获取学生列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 获取学生统计数据
 */
const fetchStudentStats = async (): Promise<void> => {
  try {
    const response = await StudentService.getStudentStats()
    studentStats.value = response.data
    console.log('获取学生统计成功:', response.data)
  } catch (error) {
    console.error('获取学生统计失败:', error)
    message.error('获取学生统计失败')
  }
}

/**
 * 获取院系列表
 */
const fetchMajors = async (): Promise<void> => {
  try {
    const response = await StudentService.getMajors()
    availableMajors.value = response.data || []
    console.log('获取院系列表成功:', response.data)
  } catch (error) {
    console.error('获取院系列表失败:', error)
    // 失败时使用默认院系选项
    availableMajors.value = ['音乐学院', '器乐学院', '艺术学院', '文学院', '技术学院', '综合学院']
  }
}

/**
 * 获取政治面貌选项列表
 */
const fetchPoliticalStatus = async (): Promise<void> => {
  try {
    const response = await StudentService.getPoliticalStatusOptions()
    availablePoliticalStatus.value = response.data || []
    console.log('✅ 获取政治面貌选项成功:', response.data)
  } catch (error) {
    console.error('❌ 获取政治面貌选项失败:', error)
    // 失败时使用默认政治面貌选项
    availablePoliticalStatus.value = ['群众', '团员', '中共党员', '民革党员', '民盟盟员', '民建会员', '民进会员', '农工党员', '致公党员', '九三学社社员', '台盟盟员', '无党派人士']
  }
}

/**
 * 获取课程列表
 */
const fetchCourses = async (): Promise<void> => {
  try {
    // 使用最大分页限制100来获取课程
    const response = await CourseService.getCourses({
      page: 1,
      pageSize: 100, // 修复：使用API允许的最大值100
      status: 'PUBLISHED'
    })
    availableCourses.value = (response.data?.list || []).map((course: any) => ({
      id: course.id,
      name: course.name
    }))
    console.log('获取课程列表成功:', availableCourses.value)
  } catch (error) {
    console.error('获取课程列表失败:', error)
    message.error('获取课程列表失败')
    // 设置空数组避免筛选框报错
    availableCourses.value = []
  }
}

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
  if (availableSemesters.value.includes(currentSemester)) {
    selectedSemester.value = currentSemester
    console.log(`设置默认学期为: ${currentSemester}`)
  } else if (availableSemesters.value.length > 0) {
    selectedSemester.value = availableSemesters.value[0]
    console.log(`当年学期不存在，设置默认学期为: ${selectedSemester.value}`)
  }
}

/**
 * 获取学期列表
 */
const fetchSemesters = async (): Promise<void> => {
  try {
    const response = await StudentService.getSemesters()
    availableSemesters.value = response.data || []
    console.log('获取学期列表成功:', response.data)
    setDefaultSemester()
  } catch (error) {
    console.error('获取学期列表失败:', error)
    // 失败时使用默认学期选项
    const currentYear = new Date().getFullYear()
    availableSemesters.value = [`${currentYear}年秋季`, `${currentYear-1}年秋季`, '2025年春季', '2024年秋季']
    setDefaultSemester()
  }
}

/**
 * 处理筛选条件变化
 */
const handleFilterChange = (): void => {
  // 政治面貌筛选日志已移除
  pagination.value.current = 1
  fetchStudents()
}

/**
 * 查看学生详情
 */
const handleViewStudent = async (student: Student): Promise<void> => {
  try {
    console.log('查看学生详情:', student.id)
    
    // 获取完整的学生详细信息
    const response = await StudentService.getStudentDetail(student.id)
    if (response.code === 200 && response.data) {
      viewingStudent.value = response.data
      showDetailModal.value = true
    } else {
      message.error('获取学生详情失败')
    }
  } catch (error) {
    console.error('查看学生详情失败:', error)
    message.error('获取学生详情失败')
  }
}

/**
 * 编辑学生信息
 */
const handleEditStudent = (student: Student): void => {
  console.log('编辑学生:', student.id)
  editingStudent.value = { ...student }
  showEditModal.value = true
}

/**
 * 删除学生
 */
const handleDeleteStudent = (student: Student): void => {
  console.log('删除学生:', student.id)
  
  // 显示确认对话框
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除学生"${student.name}"吗？此操作不可逆！`,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const response = await StudentService.deleteStudent(student.id)
        if (response.code === 200) {
          message.success('学生删除成功')
          fetchStudents() // 重新获取学生列表
          fetchStudentStats() // 重新获取统计数据
        } else {
          message.error(response.message || '删除学生失败')
        }
      } catch (error) {
        console.error('删除学生失败:', error)
        message.error('删除学生失败')
      }
    }
  })
}

/**
 * 处理学生信息更新
 */
const handleStudentUpdate = (): void => {
  showEditModal.value = false
  editingStudent.value = null
  fetchStudents() // 重新获取学生列表
  fetchStudentStats() // 重新获取统计数据
  message.success('学生信息更新成功')
}

/**
 * 打开添加学生弹窗
 */
const handleAddStudent = (): void => {
  showAddModal.value = true
}

/**
 * 处理添加学生成功
 */
const handleStudentAdd = (): void => {
  showAddModal.value = false
  
  // 清空所有筛选条件，确保新添加的学生能显示
  searchQuery.value = ''
  selectedMajor.value = ''
  selectedPoliticalStatus.value = ''
  selectedGrade.value = ''
  selectedCourse.value = ''
  selectedStatus.value = ''
  selectedSemester.value = ''
  
  // 重置分页到第一页
  pagination.value.current = 1
  
  fetchStudents() // 重新获取学生列表
  fetchStudentStats() // 重新获取统计数据
  message.success('学生添加成功！已清空筛选条件以显示新学生')
}

/**
 * 🔧 获取课程显示名称（包含年级信息）
 * @param course 课程对象
 * @returns 格式化的课程显示名称
 */
const getCourseDisplayName = (course: any): string => {
  if (!course) return '未知课程'
  
  const courseName = course.name || '未知课程'
  
  // 如果课程不需要年级管理，显示"不分班级"
  if (course.requiresGrades === false) {
    return `${courseName} (不分班级)`
  }
  
  // 如果课程需要年级管理，显示年级信息
  if (course.level) {
    return `${courseName} (${course.level})`
  }
  
  // 如果没有年级信息，显示课程名称
  return courseName
}

/**
 * 🔧 获取学生年级显示信息（智能判断）
 * @param student 学生对象
 * @returns 格式化的年级显示信息
 */
const getStudentGradeDisplay = (student: any): string => {
  if (!student) return '未设置'
  
  // 如果学生没有报名任何课程，显示未设置
  if (!student.enrollments || student.enrollments.length === 0) {
    return '未设置'
  }
  
  // 检查学生所报课程的情况
  const hasGradeCourses = student.enrollments.some((enrollment: any) => 
    enrollment.course?.requiresGrades === true
  )
  
  const hasNonGradeCourses = student.enrollments.some((enrollment: any) => 
    enrollment.course?.requiresGrades === false
  )
  
  // 如果学生只报了不分年级的课程，显示"不分年级"
  if (hasNonGradeCourses && !hasGradeCourses) {
    return '不分年级'
  }
  
  // 如果学生报了分年级的课程，显示对应的年级
  if (hasGradeCourses) {
    // 获取分年级课程的年级信息
    const gradeCourses = student.enrollments.filter((enrollment: any) => 
      enrollment.course?.requiresGrades === true
    )
    
    if (gradeCourses.length > 0) {
      // 如果所有分年级课程都是同一个年级，显示该年级
      const grades = [...new Set(gradeCourses.map((e: any) => e.course.level))]
      if (grades.length === 1) {
        return (grades[0] as string) || '未设置'
      } else {
        // 如果有多个年级，显示"混合年级"
        return '混合年级'
      }
    }
  }
  
  // 如果学生报了混合类型的课程，显示"混合年级"
  if (hasGradeCourses && hasNonGradeCourses) {
    return '混合年级'
  }
  
  // 默认情况
  return student.currentGrade || '未设置'
}

/**
 * 🔧 切换排序
 * @param field 排序字段
 */
const toggleSort = (field: string): void => {
  if (sortField.value === field) {
    // 如果是同一字段，切换排序方向
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 如果是新字段，设置为降序
    sortField.value = field
    sortOrder.value = 'desc'
  }
  
  // 重新获取数据
  fetchStudents()
}

/**
 * 🔧 格式化日期
 * @param dateString 日期字符串
 * @returns 格式化的日期
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '无效日期'
  }
}



/**
 * 🔧 导出学生数据
 */
const handleExportStudents = async (): Promise<void> => {
  try {
    console.log('🔄 开始导出学生数据...')
    message.loading('正在导出数据，请稍候...', 1)
    
    // 构建导出参数（使用当前的筛选条件）
    const exportParams: any = {}
    
    if (searchQuery.value) {
      exportParams.keyword = searchQuery.value
    }
    if (selectedMajor.value) {
      exportParams.major = selectedMajor.value
    }
    if (selectedPoliticalStatus.value) {
      exportParams.politicalStatus = selectedPoliticalStatus.value
    }
    if (selectedSemester.value) {
      exportParams.semester = selectedSemester.value
    }
    if (selectedStatus.value) {
      exportParams.status = selectedStatus.value
    }
    if (selectedCourse.value) {
      exportParams.courseId = selectedCourse.value
    }
    
    console.log('📋 导出参数:', exportParams)
    
    // 调用导出API
    const blob = await StudentService.exportStudents(exportParams)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 生成文件名
    const timestamp = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_')
    link.download = `学员数据导出_${timestamp}.csv`
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('✅ 学生数据导出完成')
    message.success('学生数据导出成功！')
    
  } catch (error) {
    console.error('导出学生数据失败:', error)
    message.error('导出失败，请重试')
  }
}

// 计算属性 - 过滤学生列表（服务端分页时不需要前端过滤）
const filteredStudents = computed<Student[]>(() => {
  return students.value
})

/**
 * 获取状态样式类（基于报名状态）
 */
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-600'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-600'
    case 'REJECTED':
      return 'bg-red-100 text-red-600'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * 获取状态文本（基于报名状态）
 */
const getStatusText = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return '已通过'
    case 'PENDING':
      return '待审核'
    case 'REJECTED':
      return '已拒绝'
    case 'CANCELLED':
      return '已取消'
    default:
      return '未知'
  }
}

/**
 * 处理分页变化
 */
const handlePageChange = async (page: number, pageSize: number): Promise<void> => {
  pagination.value.current = page
  pagination.value.pageSize = pageSize
  await fetchStudents()
}

// 这些函数已被删除，因为它们没有被使用
// 实际的删除、编辑功能在handleDeleteStudent、handleEditStudent中实现

// 监听器
watch(searchQuery, () => {
  pagination.value.current = 1
  fetchStudents()
})

watch(selectedSemester, () => {
  pagination.value.current = 1
  fetchStudents()
})

/**
 * 组件挂载时初始化数据
 */
onMounted((): void => {
  console.log('Student 组件已挂载')
  fetchStudentStats()     // 获取统计数据
  fetchMajors()           // 获取院系列表
  fetchPoliticalStatus()  // 获取政治面貌选项
  fetchCourses()          // 获取课程列表
  fetchSemesters()        // 获取学期列表
  fetchStudents()         // 获取学生列表
})
</script>

<style scoped>
.student-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 分页组件自定义样式 */

/* 响应式分页 */
@media (max-width: 768px) {
  .ant-pagination-custom :deep(.ant-pagination-options) {
    display: none !important;
  }
  
  .ant-pagination-custom :deep(.ant-pagination-simple-pager) {
    display: flex !important;
  }
}
</style>

