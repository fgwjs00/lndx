/**
 * 控制面板API服务
 * @description 提供控制面板相关的API调用功能
 */

import request from './request'
import { ApiResponse } from '@/types'

/**
 * 控制面板统计数据类型
 */
export interface DashboardStats {
  students: {
    total: number
    active: number
    thisMonth: number
  }
  courses: {
    total: number
    active: number
  }
  applications: {
    total: number
    pending: number
    approved: number
    rejected: number
    thisMonth: number
    thisWeek: number
  }
  enrollments: {
    active: number
  }
}

/**
 * 系统状态数据类型
 */
export interface SystemStatus {
  database: {
    status: string
    responseTime: string
    connections: number
  }
  server: {
    uptime: number
    cpu: any
    memory: any
    disk: string
  }
  services: {
    authentication: string
    fileStorage: string
    emailService: string
    backup: string
  }
  statistics: {
    totalStudents: number
    totalCourses: number
    totalApplications: number
    lastUpdated: string
  }
}

/**
 * 最近活动数据类型
 */
export interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  status: string
  avatar: string
  time: string
  metadata: {
    studentName: string
    courseName: string
    category: string
    phone: string
  }
}

/**
 * 课程分类统计数据类型
 */
export interface CategoryStats {
  category: string
  courseCount: number
  enrollmentCount: number
}

/**
 * 控制面板API服务类
 */
export class DashboardService {
  /**
   * 获取控制面板概览统计数据
   * @returns 概览统计数据
   */
  static async getOverviewStats(): Promise<ApiResponse<DashboardStats>> {
    return request.get<DashboardStats>('/analysis/overview')
  }

  /**
   * 获取系统状态信息
   * @returns 系统状态信息
   */
  static async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return request.get<SystemStatus>('/analysis/system-status')
  }

  /**
   * 获取最近活动记录
   * @param limit 限制数量，默认10条
   * @returns 最近活动记录
   */
  static async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    return request.get<RecentActivity[]>(`/analysis/recent-activities?limit=${limit}`)
  }

  /**
   * 获取课程分类统计
   * @returns 课程分类统计数据
   */
  static async getCategoryStats(): Promise<ApiResponse<CategoryStats[]>> {
    return request.get<CategoryStats[]>('/analysis/course-categories-stats')
  }

  /**
   * 获取月度统计数据
   * @returns 月度统计数据
   */
  static async getMonthlyStats(): Promise<ApiResponse<any>> {
    return request.get<any>('/analysis/monthly-stats')
  }

  /**
   * 获取热门课程数据
   * @param limit 限制数量，默认5条
   * @returns 热门课程数据
   */
  static async getPopularCourses(limit: number = 5): Promise<ApiResponse<any[]>> {
    return request.get<any[]>(`/analysis/popular-courses?limit=${limit}`)
  }
}

export default DashboardService
