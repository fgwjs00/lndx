<template>
    <div class="attendance-page min-h-screen bg-gray-50">
      <!-- 页面头部 -->
      <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">学员签到管理</h1>
            <p class="text-sm text-gray-600 mt-1">基于人脸识别的智能签到系统</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm text-gray-500">今日日期</p>
              <p class="font-semibold text-gray-800">{{ currentDate }}</p>
            </div>
            <button
              @click="showCreateSession = true"
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
            >
              <i class="fas fa-plus mr-2"></i>
              创建签到会话
            </button>
          </div>
        </div>
      </div>
  
      <!-- 主要内容区域 -->
      <div class="p-6">
        <!-- 签到会话选择 -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-calendar-check mr-2 text-blue-500"></i>
            选择签到会话
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="session in todaySessions"
              :key="session.id"
              @click="selectSession(session)"
              class="session-card p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
              :class="{ 'border-blue-500 bg-blue-50': selectedSession?.id === session.id }"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-gray-800">{{ session.courseName }}</h3>
                <span 
                  :class="getSessionStatusClass(session.status)"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ getSessionStatusText(session.status) }}
                </span>
              </div>
              <div class="space-y-1 text-sm text-gray-600">
                <p><i class="fas fa-user-tie mr-2"></i>{{ session.teacher }}</p>
                <p><i class="fas fa-clock mr-2"></i>{{ session.startTime }} - {{ session.endTime }}</p>
                <p><i class="fas fa-map-marker-alt mr-2"></i>{{ session.location }}</p>
                <div class="flex items-center justify-between mt-2">
                  <span><i class="fas fa-users mr-2"></i>{{ session.presentCount }}/{{ session.totalStudents }}</span>
                  <div class="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div 
                      class="bg-green-500 h-2 rounded-full transition-all duration-300"
                      :style="{ width: (session.presentCount / session.totalStudents * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <div v-if="todaySessions.length === 0" class="text-center py-8 text-gray-500">
            <i class="fas fa-calendar-times text-4xl mb-4"></i>
            <p class="text-lg">今日暂无课程安排</p>
            <p class="text-sm">请联系管理员创建签到会话</p>
          </div>
        </div>
  
        <!-- 签到操作区域 -->
        <div v-if="selectedSession" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 人脸识别签到 -->
          <div class="space-y-6">
            <FaceRecognition
              :course-id="selectedSession.courseId"
              :session-id="selectedSession.id"
              @recognition-success="handleRecognitionSuccess"
              @attendance-confirmed="handleAttendanceConfirmed"
            />
          </div>
  
          <!-- 签到状态和手动操作 -->
          <div class="space-y-6">
            <!-- 签到统计 -->
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">
                <i class="fas fa-chart-pie mr-2 text-green-500"></i>
                签到统计
              </h3>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="stat-card bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-green-600">{{ selectedSession.presentCount }}</div>
                  <div class="text-sm text-green-700">已签到</div>
                </div>
                <div class="stat-card bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-red-600">{{ selectedSession.absentCount }}</div>
                  <div class="text-sm text-red-700">未签到</div>
                </div>
                <div class="stat-card bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-yellow-600">{{ selectedSession.lateCount }}</div>
                  <div class="text-sm text-yellow-700">迟到</div>
                </div>
                <div class="stat-card bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ selectedSession.leaveCount }}</div>
                  <div class="text-sm text-blue-700">请假</div>
                </div>
              </div>
  
              <!-- 签到率 -->
              <div class="mt-4">
                <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>签到率</span>
                  <span>{{ Math.round(selectedSession.presentCount / selectedSession.totalStudents * 100) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    class="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                    :style="{ width: (selectedSession.presentCount / selectedSession.totalStudents * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
  
            <!-- 手动签到 -->
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">
                <i class="fas fa-hand-paper mr-2 text-orange-500"></i>
                手动签到
              </h3>
              
              <div class="space-y-4">
                <a-select
                  v-model:value="manualStudentId"
                  placeholder="选择学员"
                  class="w-full"
                  show-search
                  :filter-option="filterStudentOption"
                >
                  <a-select-option 
                    v-for="student in availableStudents" 
                    :key="student.id" 
                    :value="student.id"
                  >
                    {{ student.name }} ({{ student.studentId }})
                  </a-select-option>
                </a-select>
  
                <a-select
                  v-model:value="manualStatus"
                  placeholder="选择状态"
                  class="w-full"
                >
                  <a-select-option value="present">正常签到</a-select-option>
                  <a-select-option value="late">迟到</a-select-option>
                  <a-select-option value="leave">请假</a-select-option>
                </a-select>
  
                <a-textarea
                  v-model:value="manualRemarks"
                  placeholder="备注信息（可选）"
                  :rows="2"
                />
  
                <button
                  @click="handleManualAttendance"
                  :disabled="!manualStudentId || !manualStatus"
                  class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i class="fas fa-check mr-2"></i>
                  确认签到
                </button>
              </div>
            </div>
  
            <!-- 快速操作 -->
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">
                <i class="fas fa-bolt mr-2 text-purple-500"></i>
                快速操作
              </h3>
              
              <div class="grid grid-cols-2 gap-3">
                <button
                  @click="markAllAbsent"
                  class="p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  <i class="fas fa-user-times mb-1"></i>
                  <div>标记缺席</div>
                </button>
                <button
                  @click="exportAttendance"
                  class="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  <i class="fas fa-download mb-1"></i>
                  <div>导出记录</div>
                </button>
                <button
                  @click="showAttendanceHistory"
                  class="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <i class="fas fa-history mb-1"></i>
                  <div>历史记录</div>
                </button>
                <button
                  @click="finishSession"
                  class="p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                  <i class="fas fa-flag-checkered mb-1"></i>
                  <div>结束会话</div>
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 实时签到记录 -->
        <div v-if="selectedSession" class="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-list mr-2 text-indigo-500"></i>
            实时签到记录
          </h3>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-gray-600 font-semibold">学员</th>
                  <th class="text-left py-3 px-4 text-gray-600 font-semibold">签到时间</th>
                  <th class="text-left py-3 px-4 text-gray-600 font-semibold">状态</th>
                  <th class="text-left py-3 px-4 text-gray-600 font-semibold">方式</th>
                  <th class="text-left py-3 px-4 text-gray-600 font-semibold">置信度</th>
                  <th class="text-left py-3 px-4 text-gray-600 font-semibold">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="record in recentAttendanceRecords" 
                  :key="record.id"
                  class="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td class="py-3 px-4">
                    <div class="flex items-center">
                      <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span class="text-white text-sm font-medium">
                          {{ record.studentName.charAt(0) }}
                        </span>
                      </div>
                      <span class="font-medium">{{ record.studentName }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ record.checkInTime || '-' }}</td>
                  <td class="py-3 px-4">
                    <span 
                      :class="getAttendanceStatusClass(record.status)"
                      class="px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ getAttendanceStatusText(record.status) }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="text-sm text-gray-600">{{ getMethodText(record.method) }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <span v-if="record.faceConfidence" class="text-sm text-gray-600">
                      {{ (record.faceConfidence * 100).toFixed(1) }}%
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600">{{ record.remarks || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  
      <!-- 创建签到会话弹窗 -->
      <a-modal
        v-model:open="showCreateSession"
        title="创建签到会话"
        :width="600"
        @ok="createAttendanceSession"
        @cancel="showCreateSession = false"
      >
        <div class="space-y-4">
          <a-form-item label="选择课程">
            <a-select
              v-model:value="newSession.courseId"
              placeholder="请选择课程"
              class="w-full"
            >
              <a-select-option 
                v-for="course in availableCourses" 
                :key="course.id" 
                :value="course.id"
              >
                {{ course.name }} - {{ course.teacher }}
              </a-select-option>
            </a-select>
          </a-form-item>
  
          <a-form-item label="上课日期">
            <a-date-picker
              v-model:value="newSession.classDate"
              class="w-full"
              :disabled-date="disabledDate"
            />
          </a-form-item>
  
          <div class="grid grid-cols-2 gap-4">
            <a-form-item label="开始时间">
              <a-time-picker
                v-model:value="newSession.startTime"
                format="HH:mm"
                class="w-full"
              />
            </a-form-item>
  
            <a-form-item label="结束时间">
              <a-time-picker
                v-model:value="newSession.endTime"
                format="HH:mm"
                class="w-full"
              />
            </a-form-item>
          </div>
        </div>
      </a-modal>
    </div>
  </template>
  
  <script setup lang="ts">
  /**
   * 学员签到管理页面
   * @component Attendance
   * @description 基于人脸识别的学员签到系统
   */
  import { ref, computed, onMounted } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import dayjs from 'dayjs'
  import FaceRecognition from '@/components/FaceRecognition.vue'
  import type { 
    AttendanceSession, 
    AttendanceRecord, 
    Course, 
    FaceRecognitionResult,
    AttendanceStatus,
    AttendanceMethod
  } from '@/types/index'
  
  // 响应式数据
  const currentDate = ref<string>(dayjs().format('YYYY年MM月DD日'))
  const selectedSession = ref<AttendanceSession | null>(null)
  const showCreateSession = ref<boolean>(false)
  const manualStudentId = ref<number>()
  const manualStatus = ref<AttendanceStatus>()
  const manualRemarks = ref<string>('')
  
  // 新建会话数据
  const newSession = ref({
    courseId: undefined as number | undefined,
    classDate: dayjs(),
    startTime: dayjs(),
    endTime: dayjs()
  })
  
  // 模拟数据
  const attendanceSessions = ref<AttendanceSession[]>([
    {
      id: 1,
      courseId: 1,
      courseName: '二人台',
      teacher: '刘爱兰',
      classDate: dayjs().format('YYYY-MM-DD'),
      startTime: '08:30',
      endTime: '10:30',
      location: '音乐教室1',
      totalStudents: 25,
      presentCount: 18,
      absentCount: 5,
      lateCount: 2,
      leaveCount: 0,
      status: 'active',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: 2,
      courseId: 2,
      courseName: '声乐一年级',
      teacher: '杨秀清',
      classDate: dayjs().format('YYYY-MM-DD'),
      startTime: '15:00',
      endTime: '17:00',
      location: '音乐教室2',
      totalStudents: 32,
      presentCount: 28,
      absentCount: 3,
      lateCount: 1,
      leaveCount: 0,
      status: 'pending',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  ])
  
  const attendanceRecords = ref<AttendanceRecord[]>([
    {
      id: 1,
      studentId: 1,
      studentName: '张三',
      courseId: 1,
      courseName: '二人台',
      classDate: dayjs().format('YYYY-MM-DD'),
      classTime: '08:30-10:30',
      status: 'present',
      method: 'face_recognition',
      checkInTime: '08:25',
      faceConfidence: 0.92,
      location: '音乐教室1',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  ])
  
  const availableCourses = ref<Course[]>([
    {
      id: 1, name: '二人台', courseId: 'MUS001', description: '传统二人台表演艺术',
      category: 'music', level: 'intermediate', teacher: '刘爱兰', teacherId: 1, credits: 2,
      capacity: 30, enrolled: 25, location: '音乐教室1', fee: 200, semester: '2024秋季',
      timeSlots: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:30', period: 'morning' }],
      startDate: '2024-09-01', endDate: '2024-12-30', status: 'active',
      ageRestriction: { enabled: false, minAge: undefined, maxAge: undefined, description: '' },
      createdAt: '2024-08-15', updatedAt: '2024-08-15'
    }
  ])
  
  const mockStudents = ref([
    { id: 1, name: '张三', studentId: 'S001' },
    { id: 2, name: '李四', studentId: 'S002' },
    { id: 3, name: '王五', studentId: 'S003' },
    { id: 4, name: '赵六', studentId: 'S004' }
  ])
  
  // 计算属性
  const todaySessions = computed(() => {
    return attendanceSessions.value.filter(session => 
      session.classDate === dayjs().format('YYYY-MM-DD')
    )
  })
  
  const availableStudents = computed(() => {
    if (!selectedSession.value) return []
    
    // 返回还未签到的学员
    const signedStudentIds = attendanceRecords.value
      .filter(record => 
        record.courseId === selectedSession.value?.courseId &&
        record.classDate === selectedSession.value?.classDate &&
        record.status !== 'absent'
      )
      .map(record => record.studentId)
    
    return mockStudents.value.filter(student => 
      !signedStudentIds.includes(student.id)
    )
  })
  
  const recentAttendanceRecords = computed(() => {
    if (!selectedSession.value) return []
    
    return attendanceRecords.value
      .filter(record => 
        record.courseId === selectedSession.value?.courseId &&
        record.classDate === selectedSession.value?.classDate
      )
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  })
  
  /**
   * 选择签到会话
   */
  const selectSession = (session: AttendanceSession): void => {
    selectedSession.value = session
    
    // 如果会话是待开始状态，自动激活
    if (session.status === 'pending') {
      session.status = 'active'
      message.success(`已激活课程"${session.courseName}"的签到会话`)
    }
  }
  
  /**
   * 处理人脸识别成功
   */
  const handleRecognitionSuccess = (result: FaceRecognitionResult): void => {
    console.log('人脸识别成功:', result)
  }
  
  /**
   * 处理签到确认
   */
  const handleAttendanceConfirmed = (data: { studentId: number, confidence: number }): void => {
    if (!selectedSession.value) return
    
    const student = mockStudents.value.find(s => s.id === data.studentId)
    if (!student) return
    
    // 检查是否已经签到
    const existingRecord = attendanceRecords.value.find(record =>
      record.studentId === data.studentId &&
      record.courseId === selectedSession.value?.courseId &&
      record.classDate === selectedSession.value?.classDate
    )
    
    if (existingRecord) {
      message.warning('该学员已经签到过了')
      return
    }
    
    // 创建签到记录
    const newRecord: AttendanceRecord = {
      id: Date.now(),
      studentId: data.studentId,
      studentName: student.name,
      courseId: selectedSession.value.courseId,
      courseName: selectedSession.value.courseName,
      classDate: selectedSession.value.classDate,
      classTime: `${selectedSession.value.startTime}-${selectedSession.value.endTime}`,
      status: 'present',
      method: 'face_recognition',
      checkInTime: dayjs().format('HH:mm'),
      faceConfidence: data.confidence,
      location: selectedSession.value.location,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    
    attendanceRecords.value.unshift(newRecord)
    
    // 更新会话统计
    selectedSession.value.presentCount++
    selectedSession.value.absentCount = Math.max(0, selectedSession.value.absentCount - 1)
    
    message.success(`${student.name} 签到成功！`)
  }
  
  /**
   * 手动签到
   */
  const handleManualAttendance = (): void => {
    if (!selectedSession.value || !manualStudentId.value || !manualStatus.value) return
    
    const student = mockStudents.value.find(s => s.id === manualStudentId.value)
    if (!student) return
    
    // 检查是否已经签到
    const existingRecord = attendanceRecords.value.find(record =>
      record.studentId === manualStudentId.value &&
      record.courseId === selectedSession.value?.courseId &&
      record.classDate === selectedSession.value?.classDate
    )
    
    if (existingRecord) {
      message.warning('该学员已经签到过了')
      return
    }
    
    // 创建签到记录
    const newRecord: AttendanceRecord = {
      id: Date.now(),
      studentId: manualStudentId.value,
      studentName: student.name,
      courseId: selectedSession.value.courseId,
      courseName: selectedSession.value.courseName,
      classDate: selectedSession.value.classDate,
      classTime: `${selectedSession.value.startTime}-${selectedSession.value.endTime}`,
      status: manualStatus.value,
      method: 'manual',
      checkInTime: manualStatus.value === 'present' || manualStatus.value === 'late' 
        ? dayjs().format('HH:mm') : undefined,
      location: selectedSession.value.location,
      remarks: manualRemarks.value || undefined,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    
    attendanceRecords.value.unshift(newRecord)
    
    // 更新会话统计
    if (manualStatus.value === 'present') {
      selectedSession.value.presentCount++
    } else if (manualStatus.value === 'late') {
      selectedSession.value.lateCount++
    } else if (manualStatus.value === 'leave') {
      selectedSession.value.leaveCount++
    }
    
    // 重置表单
    manualStudentId.value = undefined
    manualStatus.value = undefined
    manualRemarks.value = ''
    
    message.success(`${student.name} ${getAttendanceStatusText(manualStatus.value)} 记录已添加`)
  }
  
  /**
   * 创建签到会话
   */
  const createAttendanceSession = (): void => {
    if (!newSession.value.courseId || !newSession.value.classDate) {
      message.error('请填写完整信息')
      return
    }
    
    const course = availableCourses.value.find(c => c.id === newSession.value.courseId)
    if (!course) return
    
    const session: AttendanceSession = {
      id: Date.now(),
      courseId: newSession.value.courseId,
      courseName: course.name,
      teacher: course.teacher,
      classDate: newSession.value.classDate.format('YYYY-MM-DD'),
      startTime: newSession.value.startTime.format('HH:mm'),
      endTime: newSession.value.endTime.format('HH:mm'),
      location: course.location,
      totalStudents: course.enrolled,
      presentCount: 0,
      absentCount: course.enrolled,
      lateCount: 0,
      leaveCount: 0,
      status: 'pending',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    
    attendanceSessions.value.push(session)
    showCreateSession.value = false
    
    // 重置表单
    newSession.value = {
      courseId: undefined,
      classDate: dayjs(),
      startTime: dayjs(),
      endTime: dayjs()
    }
    
    message.success('签到会话创建成功')
  }
  
  /**
   * 学员选项过滤
   */
  const filterStudentOption = (input: string, option: any): boolean => {
    const student = mockStudents.value.find(s => s.id === option.value)
    if (!student) return false
    
    return student.name.toLowerCase().includes(input.toLowerCase()) ||
           student.studentId.toLowerCase().includes(input.toLowerCase())
  }
  
  /**
   * 禁用日期
   */
  const disabledDate = (current: dayjs.Dayjs): boolean => {
    return current && current < dayjs().startOf('day')
  }
  
  /**
   * 标记所有未签到学员为缺席
   */
  const markAllAbsent = (): void => {
    if (!selectedSession.value) return
    
    Modal.confirm({
      title: '确认操作',
      content: '确定要将所有未签到的学员标记为缺席吗？',
      onOk: () => {
        // 实现标记缺席逻辑
        message.success('已标记未签到学员为缺席')
      }
    })
  }
  
  /**
   * 导出签到记录
   */
  const exportAttendance = (): void => {
    if (!selectedSession.value) return
    
    // 实现导出逻辑
    message.success('签到记录导出成功')
  }
  
  /**
   * 显示历史记录
   */
  const showAttendanceHistory = (): void => {
    // 实现历史记录查看
    message.info('历史记录功能开发中')
  }
  
  /**
   * 结束签到会话
   */
  const finishSession = (): void => {
    if (!selectedSession.value) return
    
    Modal.confirm({
      title: '确认结束会话',
      content: '确定要结束当前签到会话吗？结束后将无法继续签到。',
      onOk: () => {
        if (selectedSession.value) {
          selectedSession.value.status = 'completed'
          message.success('签到会话已结束')
        }
      }
    })
  }
  
  // 状态样式和文本函数
  const getSessionStatusClass = (status: string): string => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700'
    }
    return classes[status as keyof typeof classes] || classes.pending
  }
  
  const getSessionStatusText = (status: string): string => {
    const texts = {
      pending: '待开始',
      active: '进行中',
      completed: '已结束'
    }
    return texts[status as keyof typeof texts] || '未知'
  }
  
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
  .attendance-page {
    min-height: 100vh;
  }
  
  .session-card {
    transition: all 0.2s ease;
  }
  
  .session-card:hover {
    transform: translateY(-2px);
  }
  
  .stat-card {
    transition: all 0.2s ease;
  }
  
  .stat-card:hover {
    transform: scale(1.05);
  }
  </style>