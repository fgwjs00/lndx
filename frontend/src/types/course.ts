export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'CANCELLED'

export interface CourseTimeSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  period: 'morning' | 'afternoon'
  classroom?: string
}

export interface Course {
  id: string
  classSectionId?: string | null
  classSectionCode?: string | null
  classSectionName?: string | null
  rosterId?: string | null
  rosterStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null
  courseCode?: string | null
  code?: string | null
  name: string
  description?: string | null
  category: string
  level: string
  duration?: number
  maxStudents: number
  capacity: number
  enrolled: number
  teacher?: string | null
  location: string
  semester: string
  timeSlots: CourseTimeSlot[]
  status: CourseStatus
  tags?: string[]
  createdAt: string
  updatedAt?: string | null
  hasAgeRestriction?: boolean
  minAge?: number | null
  maxAge?: number | null
  ageDescription?: string | null
  requiresGrades?: boolean
  gradeDescription?: string | null
  teachers?: Array<{
    id: string
    name: string
    isMain: boolean
    specialties?: unknown
  }>
}
