/**
 * 系统核心数据类型定义
 * @description 定义学生报名及档案管理系统的所有数据类型
 */

// 基础响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应类型
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 导出认证相关类型
export * from './auth'

// 用户角色类型 (保持兼容)
export type UserRole = 'admin' | 'teacher' | 'student'

// 用户状态类型 (保持兼容)
export type UserStatus = 'active' | 'inactive' | 'suspended'

// 用户信息类型
export interface User {
  id: number
  username: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  avatar?: string
  createdAt: string
  updatedAt: string
}

// 学员基本信息类型（基于提供的报名表）
export interface StudentInfo {
  id?: number
  // 基本信息
  name: string              // 姓名
  gender: '男' | '女'        // 性别
  birthDate: string         // 出生年月
  ethnicity: string         // 民族
  healthStatus: string      // 健康状况
  educationLevel: string    // 文化程度
  photo?: string           // 照片
  politicalStatus: string   // 政治面貌
  idNumber: string         // 身份证号
  isRetired: boolean       // 是否在职
  retirementCategory: string // 保险类别
  major: string            // 所报专业
  studyPeriod: string      // 保险有效期
  studentId?: string       // 学员证号
  agreementSigned: boolean  // 是否签订超龄协议
  familyAddress: string    // 家庭住址
  familyPhone: string      // 联系电话
  emergencyContact: string  // 家属姓名
  emergencyPhone: string   // 联系电话
  // 系统字段
  applicationDate: string   // 报名时间
  status: 'pending' | 'approved' | 'rejected' // 审核状态
  remarks?: string         // 备注
  createdAt: string
  updatedAt: string
}

// 课程状态类型
export type CourseStatus = 'active' | 'pending' | 'completed' | 'cancelled'

// 课程分类类型
export type CourseCategory = 'music' | 'instrument' | 'art' | 'literature' | 'practical' | 'comprehensive'

// 课程级别类型
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'grade1' | 'grade2' | 'grade3' | 'foundation' | 'improvement' | 'senior'

// 时间段类型
export interface TimeSlot {
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7  // 1-7 对应周一到周日
  startTime: string                       // 格式: "08:30"
  endTime: string                         // 格式: "10:30"
  period: 'morning' | 'afternoon' | 'evening' // 时段
}

// 年龄限制类型
export interface AgeRestriction {
  enabled: boolean         // 是否启用年龄限制
  minAge?: number         // 最小年龄（可选）
  maxAge?: number         // 最大年龄（可选）
  description?: string    // 年龄限制说明
}

// 签到状态类型
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave'

// 签到方式类型
export type AttendanceMethod = 'face_recognition' | 'manual' | 'qr_code' | 'card'

// 签到记录类型
export interface AttendanceRecord {
  id: number
  studentId: number         // 学员ID
  studentName: string       // 学员姓名
  courseId: number          // 课程ID
  courseName: string        // 课程名称
  classDate: string         // 上课日期
  classTime: string         // 上课时间
  status: AttendanceStatus  // 签到状态
  method: AttendanceMethod  // 签到方式
  checkInTime?: string      // 签到时间
  faceConfidence?: number   // 人脸识别置信度
  location?: string         // 签到地点
  remarks?: string          // 备注
  createdAt: string
  updatedAt: string
}

// 课程签到会话类型
export interface AttendanceSession {
  id: number
  courseId: number          // 课程ID
  courseName: string        // 课程名称
  teacher: string           // 授课教师
  classDate: string         // 上课日期
  startTime: string         // 开始时间
  endTime: string           // 结束时间
  location: string          // 上课地点
  totalStudents: number     // 应到人数
  presentCount: number      // 实到人数
  absentCount: number       // 缺席人数
  lateCount: number         // 迟到人数
  leaveCount: number        // 请假人数
  status: 'pending' | 'active' | 'completed' // 签到状态
  createdAt: string
  updatedAt: string
}

// 人脸识别结果类型
export interface FaceRecognitionResult {
  success: boolean
  confidence: number        // 识别置信度
  studentId?: number        // 识别出的学员ID
  studentName?: string      // 学员姓名
  error?: string           // 错误信息
}

// 课程信息类型
export interface Course {
  id: number
  name: string             // 课程名称
  courseId: string         // 课程编号
  description: string      // 课程描述
  category: CourseCategory // 课程分类
  level: CourseLevel       // 课程级别
  teacher: string          // 授课教师
  teacherId?: number       // 教师ID
  credits: number          // 学分
  capacity: number         // 容量
  enrolled: number         // 已报名人数
  timeSlots: TimeSlot[]    // 上课时间段（支持多个时间段）
  location: string         // 上课地点
  startDate: string        // 开课日期
  endDate: string          // 结课日期
  status: CourseStatus     // 课程状态
  fee: number             // 课程费用
  requirements?: string    // 报名要求
  materials?: string       // 教材信息
  semester: string         // 学期（如2024秋季）
  ageRestriction: AgeRestriction // 年龄限制
  createdAt: string
  updatedAt: string
}

// 报名申请状态类型
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 报名申请类型
export interface Application {
  id: number
  studentId: number        // 学员ID
  courseId: number         // 课程ID
  applicationId: string    // 申请编号
  studentInfo: StudentInfo // 学员信息
  courseInfo: Course       // 课程信息
  applicationDate: string  // 申请时间
  status: ApplicationStatus // 申请状态
  reviewerId?: number      // 审核人ID
  reviewerName?: string    // 审核人姓名
  reviewDate?: string      // 审核时间
  reviewComments?: string  // 审核意见
  paymentStatus: 'unpaid' | 'paid' | 'refunded' // 缴费状态
  paymentDate?: string     // 缴费时间
  createdAt: string
  updatedAt: string
}

// 教师信息类型
export interface Teacher {
  id: number
  name: string             // 姓名
  teacherId: string        // 工号
  email: string            // 邮箱
  phone: string            // 电话
  department: string       // 所属部门
  title: string            // 职称
  specialization: string   // 专业领域
  experience: number       // 教学经验（年）
  courses: Course[]        // 所授课程
  students: StudentInfo[]  // 所带学员
  status: UserStatus       // 状态
  avatar?: string          // 头像
  biography?: string       // 个人简介
  createdAt: string
  updatedAt: string
}

// 系统设置类型
export interface SystemSettings {
  id: number
  siteName: string         // 站点名称
  siteDescription: string  // 站点描述
  contactEmail: string     // 联系邮箱
  contactPhone: string     // 联系电话
  registrationEnabled: boolean // 是否开放报名
  maxStudentsPerCourse: number // 每课程最大学员数
  semesterStartDate: string    // 学期开始日期
  semesterEndDate: string      // 学期结束日期
  autoApproval: boolean        // 自动审核
  emailNotifications: boolean  // 邮件通知
  smsNotifications: boolean    // 短信通知
  backupEnabled: boolean       // 自动备份
  maintenanceMode: boolean     // 维护模式
  createdAt: string
  updatedAt: string
}

// 统计数据类型
export interface Statistics {
  totalStudents: number        // 总学员数
  activeStudents: number       // 在读学员数
  totalCourses: number         // 总课程数
  activeCourses: number        // 开课中课程数
  totalApplications: number    // 总申请数
  pendingApplications: number  // 待审核申请数
  approvedApplications: number // 已批准申请数
  rejectedApplications: number // 已拒绝申请数
  monthlyRegistrations: number // 本月报名数
  registrationRate: number     // 报名成功率
  popularCourses: PopularCourse[] // 热门课程
}

// 热门课程类型
export interface PopularCourse {
  id: number
  name: string
  students: number
  rate: number
}

// 表单验证规则类型
export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  message: string
}

// 表单字段类型
export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string | number }>
  rules?: ValidationRule[]
}

// 搜索筛选类型
export interface SearchFilters {
  keyword?: string
  status?: string
  dateRange?: [string, string]
  category?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 文件上传类型
export interface FileUpload {
  id: string
  name: string
  size: number
  type: string
  url: string
  status: 'uploading' | 'success' | 'error'
  progress: number
}

// 权限类型
export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

// 角色权限类型
export interface RolePermission {
  role: UserRole
  permissions: Permission[]
}

// 所有类型已通过 export interface 和 export type 直接导出

// 身份证读卡器相关类型定义
export interface IdCardData {
  name: string                    // 姓名
  sex: string                     // 性别
  nation: string                  // 民族
  birth: string                   // 出生日期
  address: string                 // 住址
  certNo: string                  // 身份证号
  department: string              // 签发机关
  effectData: string              // 有效期开始
  expire: string                  // 有效期结束
  UID?: string                    // 身份证物理ID
  base64Data?: string             // 身份证头像base64
  imageFront?: string             // 身份证正面照片base64
  imageBack?: string              // 身份证反面照片base64
}

export interface IdCardReaderMessage {
  fun: string                     // 功能名称
  rCode: string                   // 返回码
  errMsg: string                  // 错误信息
  [key: string]: any              // 其他动态字段
}

export interface IdCardReaderConfig {
  host: string                    // WebSocket地址
  autoConnect: boolean            // 是否自动连接
  reconnectInterval: number       // 重连间隔（毫秒）
  maxReconnectAttempts: number    // 最大重连次数
}

export interface IdCardReaderState {
  connected: boolean              // 连接状态
  reading: boolean                // 读卡状态
  autoReading: boolean            // 自动读卡状态
  deviceInfo: string              // 设备信息
  lastError: string               // 最后错误信息
  reconnectAttempts: number       // 重连尝试次数
} 
