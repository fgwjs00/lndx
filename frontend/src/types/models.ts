/**
 * 数据模型类型定义
 * @description 与后端Prisma模型完全匹配的类型定义
 */

import type { Course } from './course'

// 用户角色枚举 - 匹配后端
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

// 学生状态枚举 - 匹配后端
export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  SUSPENDED = 'SUSPENDED'
}

// 课程状态枚举 - 匹配后端Prisma schema
export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED'
}

// 报名状态枚举 - 匹配后端
export enum EnrollmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// 用户模型 - 完全匹配后端Prisma模型
export interface User {
  id: string                    // cuid
  phone: string                 // 唯一
  email?: string | null         // 可选，唯一
  realName: string             // 真实姓名
  avatar?: string | null        // 头像URL，可选
  role: UserRole               // 角色枚举
  isActive: boolean            // 是否激活，默认true
  lastLoginAt?: string | null  // 最后登录时间，ISO字符串
  createdAt: string            // 创建时间，ISO字符串
  updatedAt?: string | null    // 更新时间，ISO字符串

  // 关联字段（可选，根据查询需要）
  studentProfile?: Student | null
  teacherProfile?: Teacher | null
}

// 学生模型 - 匹配后端实际返回数据
export interface Student {
  id: string
  userId?: string | null
  studentId: string             // 学号 (也叫studentCode)
  studentCode: string           // 学号代码
  name: string                  // 姓名
  realName: string              // 真实姓名（兼容旧字段）
  gender: string
  birthDate?: string | null
  idNumber: string              // 身份证号
  idCard?: string | null        // 兼容旧字段
  phone?: string | null
  contactPhone?: string         // 联系电话
  email?: string | null
  address?: string | null
  currentAddress?: string       // 现住址
  emergencyContact?: string | null
  emergencyPhone?: string | null
  status: StudentStatus
  enrollmentDate?: string | null
  graduationDate?: string | null
  notes?: string | null
  classSectionId?: string | null
  classSectionCode?: string | null
  rosterId?: string | null
  rosterStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null
  createdAt: string
  updatedAt?: string | null
  createdById?: string | null

  // 头像和证件照片
  photo?: string | null         // 头像
  idCardFront?: string | null   // 身份证正面
  idCardBack?: string | null    // 身份证反面

  // 院系和年级信息
  major?: string | null         // 院系
  currentGrade?: string | null  // 年级
  semester?: string | null      // 学期

  // 政治面貌
  politicalStatus?: string | null // 政治面貌

  // 保险信息
  insuranceCompany?: string | null    // 保险公司
  retirementCategory?: string | null  // 保险类别
  studyPeriodStart?: string | null    // 保险开始日期
  studyPeriodEnd?: string | null      // 保险结束日期

  // 报名时间相关字段
  firstEnrollmentDate?: string | null  // 最早报名时间

  // 关联字段
  user?: User | null
  createdBy?: User | null
  enrollments?: Enrollment[]
  attendances?: Attendance[]
}

// 教师模型 - 匹配后端
export interface Teacher {
  id: string
  userId?: string | null
  teacherId: string            // 工号
  realName: string
  gender: string
  birthDate?: string | null
  phone?: string | null
  email?: string | null
  specialties: any             // JSON类型，专业领域数组
  qualification?: string | null
  experience?: number | null   // 教学经验年数
  joinDate?: string | null
  status: string               // 教师状态
  notes?: string | null
  createdAt: string
  updatedAt?: string | null
  createdById?: string | null

  // 关联字段
  user?: User | null
  createdBy?: User | null
  courses?: Course[]
}

// 报名模型 - 匹配后端实际返回数据
export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  enrollmentDate: string
  status: EnrollmentStatus
  notes?: string | null
  createdAt: string
  updatedAt?: string | null
  createdById?: string | null

  // 保险相关字段
  insuranceStart?: string | null    // 保险开始时间
  insuranceEnd?: string | null      // 保险结束时间
  remarks?: string | null           // 备注

  // 关联字段
  student?: Student | null
  course?: Course | null
  createdBy?: User | null
}

// 出勤模型 - 匹配后端
export interface Attendance {
  id: string
  studentId: string
  courseId: string
  attendanceDate: string       // 出勤日期
  status: string               // 出勤状态
  notes?: string | null
  createdAt: string
  updatedAt?: string | null

  // 关联字段
  student?: Student | null
  course?: Course | null
}

// 系统设置模型 - 匹配后端
export interface SystemSettings {
  id: string
  settingKey: string           // 设置键，唯一
  settingValue: any            // JSON类型，设置值
  description?: string | null
  createdAt: string
  updatedAt?: string | null
}

// 操作日志模型 - 匹配后端
export interface OperationLog {
  id: string
  userId?: string | null
  action: string               // 操作类型
  targetType?: string | null   // 目标类型
  targetId?: string | null     // 目标ID
  oldData?: any | null         // JSON类型，操作前数据
  newData?: any | null         // JSON类型，操作后数据
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string

  // 关联字段
  user?: User | null
}

// API请求类型
export interface UserQuery {
  page?: number
  pageSize?: number
  keyword?: string
  role?: UserRole
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StudentQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: StudentStatus
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface EnrollmentQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: EnrollmentStatus
  studentId?: string
  courseId?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

// 创建/更新请求类型
export interface CreateUserRequest {
  phone: string
  email?: string
  realName: string
  password?: string
  role: UserRole
}

export interface UpdateUserRequest {
  email?: string
  realName?: string
  avatar?: string
  isActive?: boolean
}

export interface CreateStudentRequest {
  name: string
  contactPhone: string
  idNumber: string
  studentId?: string
  realName?: string
  gender: string
  birthDate?: string
  idCard?: string
  phone?: string
  email?: string
  address?: string
  currentAddress?: string
  idCardAddress?: string
  idCardFront?: string
  idCardBack?: string
  ethnicity?: string
  healthStatus?: string
  educationLevel?: string
  politicalStatus?: string
  insuranceCompany?: string
  retirementCategory?: string
  studyPeriodStart?: string
  studyPeriodEnd?: string
  familyAddress?: string
  familyPhone?: string
  emergencyContact?: string
  emergencyPhone?: string
  emergencyRelation?: string
  semester?: string
  major?: string
  selectedCourses?: string[]
  photo?: string
  status?: string
  enrollmentDate?: string
  notes?: string
  remarks?: string
}

export interface UpdateStudentRequest {
  realName?: string
  gender?: string
  birthDate?: string
  idCard?: string
  phone?: string
  email?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  status?: StudentStatus
  graduationDate?: string
  notes?: string
}

// 统计信息类型
export interface UserStatistics {
  totalUsers: number
  activeUsers: number
  usersByRole: Record<UserRole, number>
  recentRegistrations: number
}

export interface StudentStatistics {
  totalStudents: number
  activeStudents: number
  graduatedStudents: number
  suspendedStudents: number
  recentEnrollments: number
}

// 角色权限相关
export const ROLE_HIERARCHY = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.SCHOOL_ADMIN]: 3,
  [UserRole.TEACHER]: 2,
  [UserRole.STUDENT]: 1
}

export const ROLE_LABELS = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.SCHOOL_ADMIN]: '学校管理员',
  [UserRole.TEACHER]: '教师',
  [UserRole.STUDENT]: '学生'
}

export const STATUS_LABELS = {
  user: {
    active: '正常',
    inactive: '禁用'
  },
  student: {
    [StudentStatus.ACTIVE]: '在读',
    [StudentStatus.INACTIVE]: '暂停',
    [StudentStatus.GRADUATED]: '毕业',
    [StudentStatus.SUSPENDED]: '退学'
  },
  course: {
    [CourseStatus.DRAFT]: '草稿',
    [CourseStatus.PUBLISHED]: '已发布',
    [CourseStatus.SUSPENDED]: '暂停',
    [CourseStatus.CANCELLED]: '已取消'
  },
  enrollment: {
    [EnrollmentStatus.PENDING]: '待审核',
    [EnrollmentStatus.APPROVED]: '已通过',
    [EnrollmentStatus.REJECTED]: '已拒绝',
    [EnrollmentStatus.CANCELLED]: '已取消'
  }
}
