import { Router, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'
import { asyncHandler, BusinessError, ValidationError } from '@/middleware/errorHandler'
import { requireTeacher } from '@/middleware/auth'

const router = Router()

const InsuranceReviewStatus = new Set(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

function assertReviewStatus(status: unknown): string {
  const value = String(status || '').trim().toUpperCase()
  if (!InsuranceReviewStatus.has(value)) {
    throw new ValidationError('保险审核状态无效')
  }

  return value
}

router.get('/', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1, 100000)
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
  const offset = (page - 1) * pageSize
  const reviewStatus = req.query.reviewStatus ? assertReviewStatus(req.query.reviewStatus) : null
  const academicYearId = req.query.academicYearId ? String(req.query.academicYearId).trim() : null
  const keyword = req.query.keyword ? String(req.query.keyword).trim() : null

  const [countRow] = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*) AS total
    FROM "student_insurances" si
    INNER JOIN "students" stu ON stu.id = si."studentId"
    INNER JOIN "academic_years" ay ON ay.id = si."academicYearId"
    WHERE (${reviewStatus}::text IS NULL OR si."reviewStatus"::text = ${reviewStatus})
      AND (${academicYearId}::text IS NULL OR si."academicYearId" = ${academicYearId})
      AND (
        ${keyword}::text IS NULL
        OR stu.name ILIKE '%' || ${keyword} || '%'
        OR stu."idNumber" ILIKE '%' || ${keyword} || '%'
        OR stu."contactPhone" ILIKE '%' || ${keyword} || '%'
        OR si.company ILIKE '%' || ${keyword} || '%'
      )
  `

  const list = await prisma.$queryRaw<Array<{
    id: string
    studentId: string
    studentName: string
    studentCode: string
    idNumber: string
    contactPhone: string
    academicYearId: string
    academicYearName: string
    company: string
    category: string | null
    coverageStart: Date
    coverageEnd: Date
    attachmentFileId: string | null
    attachmentUrl: string | null
    attachmentName: string | null
    reviewStatus: string
    reviewedBy: string | null
    reviewedAt: Date | null
    remarks: string | null
    createdAt: Date
    updatedAt: Date
  }>>`
    SELECT
      si.id,
      si."studentId",
      stu.name AS "studentName",
      stu."studentCode",
      stu."idNumber",
      stu."contactPhone",
      si."academicYearId",
      ay.name AS "academicYearName",
      si.company,
      si.category,
      si."coverageStart",
      si."coverageEnd",
      si."attachmentFileId",
      fu."filePath" AS "attachmentUrl",
      fu."originalName" AS "attachmentName",
      si."reviewStatus"::text AS "reviewStatus",
      si."reviewedBy",
      si."reviewedAt",
      si.remarks,
      si."createdAt",
      si."updatedAt"
    FROM "student_insurances" si
    INNER JOIN "students" stu ON stu.id = si."studentId"
    INNER JOIN "academic_years" ay ON ay.id = si."academicYearId"
    LEFT JOIN "file_uploads" fu ON fu.id = si."attachmentFileId"
    WHERE (${reviewStatus}::text IS NULL OR si."reviewStatus"::text = ${reviewStatus})
      AND (${academicYearId}::text IS NULL OR si."academicYearId" = ${academicYearId})
      AND (
        ${keyword}::text IS NULL
        OR stu.name ILIKE '%' || ${keyword} || '%'
        OR stu."idNumber" ILIKE '%' || ${keyword} || '%'
        OR stu."contactPhone" ILIKE '%' || ${keyword} || '%'
        OR si.company ILIKE '%' || ${keyword} || '%'
      )
    ORDER BY si."createdAt" DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `

  res.json({
    code: 200,
    message: '保险材料查询成功',
    data: {
      list,
      total: Number(countRow?.total || 0),
      page,
      pageSize,
      totalPages: Math.ceil(Number(countRow?.total || 0) / pageSize)
    }
  })
}))

router.patch('/:id/review', requireTeacher, asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id || '').trim()
  const status = assertReviewStatus(req.body.status)
  const remarks = req.body.remarks === undefined || req.body.remarks === null
    ? null
    : String(req.body.remarks)

  if (!id) {
    throw new ValidationError('保险记录ID不能为空')
  }

  const rows = await prisma.$queryRaw<Array<{
    id: string
    reviewStatus: string
    reviewedBy: string | null
    reviewedAt: Date | null
    remarks: string | null
  }>>`
    UPDATE "student_insurances"
    SET
      "reviewStatus" = ${status}::"InsuranceReviewStatus",
      "reviewedBy" = ${req.user!.id},
      "reviewedAt" = NOW(),
      "remarks" = ${remarks},
      "updatedAt" = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      "reviewStatus"::text AS "reviewStatus",
      "reviewedBy",
      "reviewedAt",
      remarks
  `

  if (rows.length === 0) {
    throw new BusinessError('保险记录不存在', 404, 'INSURANCE_NOT_FOUND')
  }

  res.json({
    code: 200,
    message: '保险审核状态已更新',
    data: rows[0]
  })
}))

export default router
