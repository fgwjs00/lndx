import request from './request'

export interface InsuranceRequirement {
  academicYearId: string
  academicYearCode: string
  academicYearName: string
  semesterId: string
  semesterCode: string
  semesterName: string
  requiredInsuranceStart: string
  requiredInsuranceEnd: string
  enrollmentStartsAt?: string | null
  enrollmentEndsAt?: string | null
  isEnrollmentOpen?: boolean
}

export interface InsuranceUploadResult {
  fileId: string
  url: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
}

export interface InsuranceRecord {
  id: string
  studentId: string
  studentName: string
  studentCode: string
  idNumber: string
  contactPhone: string
  academicYearId: string
  academicYearName: string
  company: string
  category?: string | null
  coverageStart: string
  coverageEnd: string
  attachmentFileId?: string | null
  attachmentUrl?: string | null
  attachmentName?: string | null
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  reviewedBy?: string | null
  reviewedAt?: string | null
  remarks?: string | null
  createdAt: string
  updatedAt: string
}

export interface InsuranceListParams {
  page?: number
  pageSize?: number
  reviewStatus?: string
  academicYearId?: string
  keyword?: string
}

export interface InsuranceListResult {
  list: InsuranceRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const InsuranceService = {
  getInsuranceRequirement(semester: string) {
    return request.get<InsuranceRequirement | null>('/public-registration/insurance-requirement', { semester })
  },

  uploadInsuranceAttachment(file: File, contactPhone: string) {
    return request.upload<InsuranceUploadResult>(
      '/public-registration/insurance-upload',
      file,
      undefined,
      { contactPhone }
    )
  },

  getInsuranceList(params: InsuranceListParams = {}) {
    return request.get<InsuranceListResult>('/insurances', params)
  },

  reviewInsurance(id: string, status: 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'PENDING', remarks?: string) {
    return request.patch<InsuranceRecord>(`/insurances/${id}/review`, { status, remarks })
  }
}
