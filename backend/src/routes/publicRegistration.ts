import { Router, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { uploadLimiter } from '@/middleware/rateLimiter'

const router = Router()

const INSURANCE_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000
const ALLOWED_INSURANCE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
])

function validateInsuranceUploadMimeType(file: Express.Multer.File): boolean {
  return ALLOWED_INSURANCE_MIME_TYPES.has(file.mimetype)
}

const insuranceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'insurances')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `insurance_${crypto.randomUUID()}${ext}`)
  }
})

const insuranceUpload = multer({
  storage: insuranceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (validateInsuranceUploadMimeType(file)) {
      return cb(null, true)
    }

    return cb(new Error('只能上传 JPG、PNG、WEBP 或 PDF 格式的保险凭证'))
  }
})

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

function getSemesterYear(value: string): number {
  const match = value.match(/(\d{4})/)
  return match ? Number(match[1]) : 0
}

function getSemesterRank(value: string): number {
  if (value.includes('春')) return 1
  if (value.includes('夏')) return 2
  if (value.includes('秋')) return 3
  if (value.includes('冬')) return 4
  return 0
}

function sortSemestersDesc(left: string, right: string): number {
  const yearDiff = getSemesterYear(right) - getSemesterYear(left)
  if (yearDiff !== 0) {
    return yearDiff
  }

  return getSemesterRank(right) - getSemesterRank(left)
}

async function hasPhase2EnrollmentTables(): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.academic_years') IS NOT NULL
      AND to_regclass('public.semesters') IS NOT NULL AS "exists"
  `

  return Boolean(rows[0]?.exists)
}

async function hasPhase2ClassSectionTables(): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.academic_years') IS NOT NULL
      AND to_regclass('public.semesters') IS NOT NULL
      AND to_regclass('public.class_sections') IS NOT NULL
      AND to_regclass('public.rosters') IS NOT NULL
      AND to_regclass('public.roster_members') IS NOT NULL AS "exists"
  `

  return Boolean(rows[0]?.exists)
}

async function getLegacyPublicSemesters(): Promise<string[]> {
  const semesters = await prisma.course.findMany({
    where: {
      isActive: true,
      status: 'PUBLISHED',
      semester: {
        not: null
      }
    },
    select: {
      semester: true
    },
    distinct: ['semester']
  })

  return semesters
    .map(item => item.semester)
    .filter((semester): semester is string => Boolean(semester && semester.trim()))
    .sort(sortSemestersDesc)
}

async function getPhase2PublicSemesters(): Promise<string[]> {
  if (!await hasPhase2EnrollmentTables()) {
    return []
  }

  const rows = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT s.name
    FROM "semesters" s
    INNER JOIN "academic_years" ay ON ay.id = s."academicYearId"
    WHERE s."isActive" = TRUE
      AND s."isEnrollmentOpen" = TRUE
      AND ay."isActive" = TRUE
    ORDER BY ay."startsAt" DESC, s."startsAt" DESC NULLS LAST, s.name DESC
  `

  return rows
    .map(item => item.name)
    .filter((semester): semester is string => Boolean(semester && semester.trim()))
}

interface PublicCourseQuery {
  semester?: unknown
  category?: unknown
  keyword?: unknown
  page?: unknown
  pageSize?: unknown
}

interface PublicCoursePage {
  list: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function courseMatchesPublicFilters(course: any, query: PublicCourseQuery): boolean {
  if (query.semester) {
    const semester = String(query.semester)
    if (course.semester !== semester && course.semesterCode !== semester) {
      return false
    }
  }

  if (query.category && course.category !== String(query.category)) {
    return false
  }

  if (query.keyword) {
    const text = String(query.keyword).toLowerCase()
    const haystack = [course.name, course.category, course.level]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(text)) {
      return false
    }
  }

  return true
}

function paginatePublicCourses(courses: any[], query: PublicCourseQuery): PublicCoursePage {
  const pageNum = parsePositiveInt(query.page, 1, 100000)
  const pageSizeNum = parsePositiveInt(query.pageSize, 100, 200)
  const total = courses.length
  const list = courses.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum)

  return {
    list,
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages: Math.ceil(total / pageSizeNum)
  }
}

async function getPhase2PublicCourses(query: PublicCourseQuery): Promise<PublicCoursePage | null> {
  if (!await hasPhase2ClassSectionTables()) {
    return null
  }

  const rows = await prisma.$queryRaw<Array<any>>`
    SELECT
      cs.id AS "classSectionId",
      cs.code AS "classSectionCode",
      cs.name AS "classSectionName",
      cs.capacity AS capacity,
      cs."timeSlots" AS "sectionTimeSlots",
      c.id AS id,
      c."courseCode" AS "courseCode",
      c.name AS name,
      c.description AS description,
      c.category AS category,
      c.level AS level,
      c.duration AS duration,
      c."maxStudents" AS "maxStudents",
      c."timeSlots" AS "courseTimeSlots",
      s.name AS semester,
      s.code AS "semesterCode",
      c.teacher AS teacher,
      c.location AS location,
      c."hasAgeRestriction" AS "hasAgeRestriction",
      c."minAge" AS "minAge",
      c."maxAge" AS "maxAge",
      c."ageDescription" AS "ageDescription",
      c."requiresGrades" AS "requiresGrades",
      c."gradeDescription" AS "gradeDescription",
      COALESCE(COUNT(rm.id), 0)::int AS enrolled
    FROM "class_sections" cs
    INNER JOIN "courses" c ON c.id = cs."courseId"
    INNER JOIN "semesters" s ON s.id = cs."semesterId"
    INNER JOIN "academic_years" ay ON ay.id = cs."academicYearId"
    LEFT JOIN "rosters" r ON r."classSectionId" = cs.id AND r."semesterId" = cs."semesterId"
    LEFT JOIN "roster_members" rm ON rm."rosterId" = r.id AND rm.status = 'ACTIVE'
    WHERE cs."isActive" = TRUE
      AND cs.status = 'PUBLISHED'
      AND c."isActive" = TRUE
      AND c.status = 'PUBLISHED'
      AND s."isActive" = TRUE
      AND s."isEnrollmentOpen" = TRUE
      AND ay."isActive" = TRUE
    GROUP BY
      cs.id,
      s.id,
      ay.id,
      c.id
    ORDER BY s."startsAt" DESC NULLS LAST, c.name ASC
  `

  const courses = rows
    .map(course => {
      const capacity = Number(course.capacity ?? course.maxStudents ?? 0)
      const enrolled = Number(course.enrolled || 0)

      return {
        id: course.id,
        classSectionId: course.classSectionId,
        classSectionCode: course.classSectionCode,
        classSectionName: course.classSectionName,
        courseCode: course.courseCode,
        name: course.name,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        maxStudents: capacity,
        capacity,
        enrolled,
        remaining: Math.max(capacity - enrolled, 0),
        timeSlots: course.sectionTimeSlots || course.courseTimeSlots,
        semester: course.semester,
        semesterCode: course.semesterCode,
        teacher: course.teacher,
        location: course.location,
        hasAgeRestriction: course.hasAgeRestriction,
        minAge: course.minAge,
        maxAge: course.maxAge,
        ageDescription: course.ageDescription,
        requiresGrades: course.requiresGrades,
        gradeDescription: course.gradeDescription
      }
    })
    .filter(course => courseMatchesPublicFilters(course, query))

  if (courses.length === 0) {
    return null
  }

  return paginatePublicCourses(courses, query)
}

async function getLegacyPublicCourses(query: PublicCourseQuery): Promise<PublicCoursePage> {
  const pageNum = parsePositiveInt(query.page, 1, 100000)
  const pageSizeNum = parsePositiveInt(query.pageSize, 100, 200)
  const where: any = {
    isActive: true,
    status: 'PUBLISHED'
  }

  if (query.semester) {
    where.semester = String(query.semester)
  }

  if (query.category) {
    where.category = String(query.category)
  }

  if (query.keyword) {
    const text = String(query.keyword)
    where.OR = [
      { name: { contains: text, mode: 'insensitive' } },
      { category: { contains: text, mode: 'insensitive' } },
      { level: { contains: text, mode: 'insensitive' } }
    ]
  }

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      select: {
        id: true,
        courseCode: true,
        name: true,
        description: true,
        category: true,
        level: true,
        duration: true,
        maxStudents: true,
        timeSlots: true,
        semester: true,
        teacher: true,
        location: true,
        hasAgeRestriction: true,
        minAge: true,
        maxAge: true,
        ageDescription: true,
        requiresGrades: true,
        gradeDescription: true,
        enrollments: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED']
            }
          },
          select: {
            id: true
          }
        }
      },
      orderBy: [
        { semester: 'desc' },
        { name: 'asc' }
      ],
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum
    })
  ])

  const list = courses.map(course => ({
    id: course.id,
    classSectionId: null,
    courseCode: course.courseCode,
    name: course.name,
    description: course.description,
    category: course.category,
    level: course.level,
    duration: course.duration,
    maxStudents: course.maxStudents,
    capacity: course.maxStudents,
    enrolled: course.enrollments.length,
    remaining: Math.max(course.maxStudents - course.enrollments.length, 0),
    timeSlots: course.timeSlots,
    semester: course.semester,
    teacher: course.teacher,
    location: course.location,
    hasAgeRestriction: course.hasAgeRestriction,
    minAge: course.minAge,
    maxAge: course.maxAge,
    ageDescription: course.ageDescription,
    requiresGrades: course.requiresGrades,
    gradeDescription: course.gradeDescription
  }))

  return {
    list,
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages: Math.ceil(total / pageSizeNum)
  }
}

router.get('/insurance-requirement', asyncHandler(async (req: Request, res: Response) => {
  const semester = String(req.query.semester || '').trim()

  if (!semester) {
    throw new ValidationError('请选择学期')
  }

  if (!await hasPhase2EnrollmentTables()) {
    return res.json({
      code: 200,
      message: '保险要求尚未配置',
      data: null
    })
  }

  const requirements = await prisma.$queryRaw<Array<{
    academicYearId: string
    academicYearCode: string
    academicYearName: string
    semesterId: string
    semesterCode: string
    semesterName: string
    requiredInsuranceStart: Date
    requiredInsuranceEnd: Date
    enrollmentStartsAt: Date | null
    enrollmentEndsAt: Date | null
    isEnrollmentOpen: boolean
  }>>`
    SELECT
      ay.id AS "academicYearId",
      ay.code AS "academicYearCode",
      ay.name AS "academicYearName",
      s.id AS "semesterId",
      s.code AS "semesterCode",
      s.name AS "semesterName",
      ay."requiredInsuranceStart" AS "requiredInsuranceStart",
      ay."requiredInsuranceEnd" AS "requiredInsuranceEnd",
      ay."enrollmentStartsAt" AS "enrollmentStartsAt",
      ay."enrollmentEndsAt" AS "enrollmentEndsAt",
      s."isEnrollmentOpen" AS "isEnrollmentOpen"
    FROM "semesters" s
    INNER JOIN "academic_years" ay ON ay.id = s."academicYearId"
    WHERE s.name = ${semester} OR s.code = ${semester}
    LIMIT 1
  `

  const requirement = requirements[0]
  return res.json({
    code: 200,
    message: '保险要求查询成功',
    data: requirement
      ? {
          ...requirement,
          requiredInsuranceStart: requirement.requiredInsuranceStart.toISOString().slice(0, 10),
          requiredInsuranceEnd: requirement.requiredInsuranceEnd.toISOString().slice(0, 10),
          enrollmentStartsAt: requirement.enrollmentStartsAt?.toISOString() || null,
          enrollmentEndsAt: requirement.enrollmentEndsAt?.toISOString() || null
        }
      : null
  })
}))

router.post('/insurance-upload', uploadLimiter, insuranceUpload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('请上传保险凭证文件')
  }

  const filePath = `/uploads/insurances/${req.file.filename}`
  const fileUpload = await prisma.fileUpload.create({
    data: {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileType: 'INSURANCE',
      uploadedBy: null,
      isTemp: true,
      expiresAt: new Date(Date.now() + INSURANCE_UPLOAD_TTL_MS),
      metadata: {
        source: 'public-registration'
      }
    }
  })

  res.json({
    code: 200,
    message: '保险凭证上传成功',
    data: {
      fileId: fileUpload.id,
      url: fileUpload.filePath,
      fileName: fileUpload.fileName,
      originalName: fileUpload.originalName,
      fileSize: fileUpload.fileSize,
      mimeType: fileUpload.mimeType
    }
  })
}))

router.get('/semesters', asyncHandler(async (_req: Request, res: Response) => {
  const phase2Semesters = await getPhase2PublicSemesters()
  const list = phase2Semesters.length > 0 ? phase2Semesters : await getLegacyPublicSemesters()

  res.json({
    code: 200,
    message: '公开报名学期查询成功',
    data: list
  })
}))

router.get('/courses', asyncHandler(async (req: Request, res: Response) => {
  try {
    const phase2Courses = await getPhase2PublicCourses(req.query)
    const data = phase2Courses || await getLegacyPublicCourses(req.query)

    res.json({
      code: 200,
      message: '公开报名课程查询成功',
      data
    })
  } catch (error) {
    throw new BusinessError('公开报名课程查询失败', 500, 'PUBLIC_COURSE_QUERY_ERROR')
  }
}))

export default router
