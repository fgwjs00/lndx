import request from './request'
import type { ApiResponse } from '@/types'

export type AttendanceStatusApi = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
export type AttendanceMethodApi = 'FACE_RECOGNITION' | 'MANUAL' | 'QR_CODE' | 'CARD'

export interface AttendanceQuery {
  page?: number
  pageSize?: number
  status?: AttendanceStatusApi
  courseId?: string
  studentId?: string
  startDate?: string
  endDate?: string
}

export interface AttendanceStudentDto {
  id: string
  studentCode: string
  name: string
  contactPhone: string
}

export interface AttendanceCourseDto {
  id: string
  name: string
  category?: string
  level?: string
  semester?: string
}

export interface AttendanceRecordResponse {
  id: string
  studentId: string
  courseId: string
  attendanceDate: string
  status: AttendanceStatusApi
  method: AttendanceMethodApi
  checkInTime?: string | null
  isLate: boolean
  lateMinutes?: number | null
  faceScore?: number | null
  locationData?: unknown
  remarks?: string | null
  createdAt: string
  updatedAt: string
  student?: AttendanceStudentDto
  course?: AttendanceCourseDto
}

export interface AttendanceListResult {
  list: AttendanceRecordResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface SaveAttendancePayload {
  studentId: string
  courseId: string
  classSectionId?: string
  attendanceDate?: string
  status?: AttendanceStatusApi
  remarks?: string
}

export class AttendanceService {
  static getAttendanceRecords(params: AttendanceQuery = {}): Promise<ApiResponse<AttendanceListResult>> {
    return request.get<AttendanceListResult>('/attendance', params)
  }

  static saveAttendanceRecord(data: SaveAttendancePayload): Promise<ApiResponse<AttendanceRecordResponse>> {
    return request.post<AttendanceRecordResponse>('/attendance', data)
  }
}
