/**
 * 数据分析API服务
 * @description 处理统计分析相关的API请求
 */

import request from './request'
import type { ApiResponse } from '@/types'

/**
 * 系统统计概览数据类型
 */
export interface OverviewStats {
  successRate: number        // 报名成功率
  totalStudents: number      // 活跃学生数
  totalGraduated: number     // 毕业学生数
  averageAge: number         // 平均年龄
  totalCourses: number       // 总课程数
  totalEnrollments: number   // 总报名数
  approvedEnrollments: number // 已通过报名数
  pendingEnrollments: number  // 待审核报名数
  rejectedEnrollments: number // 已拒绝报名数
  activeTeachers: number     // 活跃教师数
}

/**
 * 热门课程数据类型
 */
export interface PopularCourse {
  id: string
  name: string
  category: string | null
  students: number           // 已报名学生数
  rate: number              // 成功率百分比
  maxStudents: number       // 最大学生数
}

/**
 * 月度统计数据类型
 */
export interface MonthlyStats {
  newStudents: number       // 新增学生
  newEnrollments: number    // 新增报名
  graduatedStudents: number // 毕业学生
  dropoutRate: number       // 退学率
}

/**
 * 分类统计数据类型
 */
export interface CategoryStats {
  name: string              // 分类名称
  courses: number           // 课程数量
  students: number          // 学生数量
}

/**
 * 系统状态数据类型
 */
export interface SystemStatus {
  dbStatus: string          // 数据库状态
  serverLoad: string        // 服务器负载
  onlineUsers: number       // 在线用户数
  uptimeHours: number       // 运行时间(小时)
}

/**
 * 校区统计数据类型
 */
export interface CampusStats {
  location: string          // 教学点名称
  courseCount: number       // 课程数量
  studentCount: number      // 学生人数
  enrollmentCount: number   // 报名人次
  averageEnrollment: number // 平均报名数
}

/**
 * 专业统计数据类型
 */
export interface MajorStats {
  major: string            // 专业名称
  studentCount: number     // 学生人数
  enrollmentCount: number  // 报名人次
  averageEnrollment: number // 平均报名数
}

/**
 * 政治面貌统计数据类型
 */
export interface PoliticalStats {
  politicalStatus: string  // 政治面貌
  studentCount: number     // 学生人数
  percentage: number       // 占比
  isPartyMember: boolean   // 是否为党员
}

/**
 * 政治面貌统计响应数据类型
 */
export interface PoliticalStatsResponse {
  stats: PoliticalStats[]  // 详细统计
  summary: {
    totalStudents: number        // 总学生数
    partyMemberCount: number     // 党员总数
    partyMemberPercentage: number // 党员占比
  }
}

/**
 * 综合统计数据类型
 */
export interface ComprehensiveStats {
  totalStudents: number         // 总学生数
  totalEnrollments: number      // 总报名人次
  totalCourses: number          // 总课程数
  totalLocations: number        // 总教学点数
  avgEnrollmentPerStudent: number // 平均每人报名数
  avgEnrollmentPerCourse: number  // 平均每门课报名数
}

/**
 * 数据分析API服务类
 */
export class AnalysisService {
  /**
   * 获取系统统计概览
   * @returns 统计概览数据
   */
  static async getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
    return request.get('/analysis/overview')
  }

  /**
   * 获取热门课程排行
   * @param limit 返回数量限制，默认5个
   * @returns 热门课程列表
   */
  static async getPopularCourses(limit: number = 5): Promise<ApiResponse<PopularCourse[]>> {
    return request.get(`/analysis/popular-courses?limit=${limit}`)
  }

  /**
   * 获取月度统计数据
   * @returns 月度统计数据
   */
  static async getMonthlyStats(): Promise<ApiResponse<MonthlyStats>> {
    return request.get('/analysis/monthly-stats')
  }

  /**
   * 获取分类统计数据
   * @returns 分类统计数据
   */
  static async getCategoryStats(): Promise<ApiResponse<CategoryStats[]>> {
    return request.get('/analysis/category-stats')
  }

  /**
   * 获取系统状态信息
   * @returns 系统状态数据
   */
  static async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return request.get('/analysis/system-status')
  }

  /**
   * 获取校区统计数据
   * @returns 校区统计数据
   */
  static async getCampusStats(): Promise<ApiResponse<CampusStats[]>> {
    return request.get('/analysis/campus-stats')
  }

  /**
   * 获取专业统计数据
   * @returns 专业统计数据
   */
  static async getMajorStats(): Promise<ApiResponse<MajorStats[]>> {
    return request.get('/analysis/major-stats')
  }

  /**
   * 获取政治面貌统计数据
   * @returns 政治面貌统计数据
   */
  static async getPoliticalStats(): Promise<ApiResponse<PoliticalStatsResponse>> {
    return request.get('/analysis/political-stats')
  }

  /**
   * 获取综合统计数据
   * @returns 综合统计数据
   */
  static async getComprehensiveStats(): Promise<ApiResponse<ComprehensiveStats>> {
    return request.get('/analysis/comprehensive-stats')
  }
}

export default AnalysisService
