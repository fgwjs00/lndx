import { randomUUID } from 'crypto'
import { generateApplicationCode } from '../utils/codeGenerator'
import { BusinessError, ValidationError } from '../middleware/errorHandler'

type ReviewStatus = 'APPROVED' | 'REJECTED'

interface ReviewInput {
  id: string
  status: string
  comments?: string
  reviewerId: string
}

export interface Phase2ApplicationListFilters {
  keyword?: string
  status?: string
  courseId?: string
  department?: string
}

export interface Phase2PendingApplicationRow {
  id: string
  targetType: 'phase2Application'
  applicationId: string
  enrollmentCode: string
  studentInfo: {
    id: string
    name: string
    idNumber: string
    phone: string | null
    gender: string
    age: number
    major: string | null
    studentCode: string
    emergencyContact: string | null
    emergencyPhone: string | null
  }
  courseInfo: {
    id: string
    name: string
  }
  applicationDate: string
  status: 'PENDING'
  avatar: string
  idCardFront: string | null
  idCardBack: string | null
  insuranceStart: string | null
  insuranceEnd: string | null
  remarks: string | null
  enrollmentDate: Date
  isPhase2Only: true
}

export interface ApplicationReviewTarget {
  id: string
  targetType?: 'legacyEnrollment' | 'phase2Application'
}

export interface BatchReviewInput {
  targets: ApplicationReviewTarget[]
  status: string
  comments?: string
  reviewerId: string
}

export interface RosterManagementFilters {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  semesterId?: string
  courseId?: string
}

export interface RosterManagementRow {
  classSectionId: string
  classSectionCode: string
  classSectionName: string
  classSectionStatus: string
  courseId: string
  courseName: string
  major: string
  grade: string | null
  capacity: number
  semesterId: string
  semesterName: string
  academicYearId: string
  academicYearName: string
  rosterId: string | null
  rosterStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null
  snapshotAt: Date | null
  publishedAt: Date | null
  activeMemberCount: number
  pendingApplicationCount: number
}

export interface RosterMemberRow {
  memberId: string
  memberStatus: string
  joinedAt: Date
  leftAt: Date | null
  remarks: string | null
  classSectionId: string
  classSectionName: string
  classSectionCode: string
  rosterId: string
  rosterStatus: string
  studentId: string
  studentName: string
  studentCode: string
  idNumber: string
  contactPhone: string | null
  gender: string
  age: number
  major: string | null
  sourceEnrollmentId: string | null
  enrollmentCode: string | null
  insuranceStart: Date | null
  insuranceEnd: Date | null
  approvedAt: Date | null
  sourceEnrollmentMetadata: any
  reviewSnapshot: any
}

function normalizeReviewStatus(status: string): ReviewStatus {
  const normalizedStatus = String(status || '').toUpperCase()
  if (normalizedStatus !== 'APPROVED' && normalizedStatus !== 'REJECTED') {
    throw new ValidationError('Review status must be APPROVED or REJECTED')
  }
  return normalizedStatus
}

export async function hasPhase2ApplicationTables(tx: any): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.academic_years') IS NOT NULL
      AND to_regclass('public.semesters') IS NOT NULL
      AND to_regclass('public.class_sections') IS NOT NULL
      AND to_regclass('public.enrollment_applications') IS NOT NULL
      AND to_regclass('public.enrollment_application_choices') IS NOT NULL AS "exists"
  `

  return Boolean(rows[0]?.exists)
}

export async function hasRosterManagementTables(tx: any): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.academic_years') IS NOT NULL
      AND to_regclass('public.semesters') IS NOT NULL
      AND to_regclass('public.class_sections') IS NOT NULL
      AND to_regclass('public.rosters') IS NOT NULL
      AND to_regclass('public.roster_members') IS NOT NULL
      AND to_regclass('public.enrollment_applications') IS NOT NULL
      AND to_regclass('public.enrollment_application_choices') IS NOT NULL AS "exists"
  `

  return Boolean(rows[0]?.exists)
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(
    value
      .map(item => String(item || '').trim())
      .filter(Boolean)
  )]
}

function normalizeMetadata(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, any>
}

function normalizeMajorName(value: unknown): string {
  return String(value || '').trim()
}

function normalizeMajorKey(value: unknown): string {
  return normalizeMajorName(value).toLowerCase()
}

export const MAJOR_HISTORY_RULE_STARTS_AT = new Date('2026-09-01T00:00:00.000Z')

function inferMajorHistoryRuleStartFromSemester(value: unknown): Date | null {
  const text = normalizeMajorName(value).toLowerCase()
  const yearMatch = text.match(/(\d{4})/)
  if (!yearMatch) {
    return null
  }

  const year = Number(yearMatch[1])
  if (!Number.isFinite(year)) {
    return null
  }

  if (text.includes('spring') || text.includes('\u6625')) {
    return new Date(`${year}-03-01T00:00:00.000Z`)
  }
  if (text.includes('summer') || text.includes('\u590f')) {
    return new Date(`${year}-06-01T00:00:00.000Z`)
  }
  if (text.includes('autumn') || text.includes('fall') || text.includes('\u79cb')) {
    return new Date(`${year}-09-01T00:00:00.000Z`)
  }
  if (text.includes('winter') || text.includes('\u51ac')) {
    return new Date(`${year}-12-01T00:00:00.000Z`)
  }

  return new Date(`${year}-09-01T00:00:00.000Z`)
}

function isOnOrAfterMajorHistoryRuleStart(value: unknown): boolean {
  const date = value instanceof Date ? value : value ? new Date(String(value)) : null
  return Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() >= MAJOR_HISTORY_RULE_STARTS_AT.getTime())
}

export async function shouldEnforceHistoricalMajorRule(tx: any, applicationData: any): Promise<boolean> {
  const semester = normalizeMajorName(applicationData?.semester)
  if (!semester) {
    return false
  }

  if (await hasPhase2ApplicationTables(tx)) {
    const rows = await tx.$queryRaw<Array<{ name: string, code: string, startsAt: Date | null }>>`
      SELECT name, code, "startsAt"
      FROM "semesters"
      WHERE name = ${semester} OR code = ${semester}
      LIMIT 1
    `
    const row = rows[0]
    if (row?.startsAt) {
      return isOnOrAfterMajorHistoryRuleStart(row.startsAt)
    }

    const rowInferredStart = inferMajorHistoryRuleStartFromSemester(row?.name || row?.code)
    if (rowInferredStart) {
      return isOnOrAfterMajorHistoryRuleStart(rowInferredStart)
    }
  }

  const inferredStart = inferMajorHistoryRuleStartFromSemester(semester)
  return isOnOrAfterMajorHistoryRuleStart(inferredStart)
}

function uniqueMajorNames(rows: Array<{ major: string | null }>): string[] {
  const majorByKey = new Map<string, string>()
  for (const row of rows) {
    const major = normalizeMajorName(row.major)
    const key = normalizeMajorKey(major)
    if (major && !majorByKey.has(key)) {
      majorByKey.set(key, major)
    }
  }
  return Array.from(majorByKey.values())
}

export async function collectStudentHistoricalMajors(tx: any, studentId: string): Promise<string[]> {
  const id = normalizeMajorName(studentId)
  if (!id) {
    return []
  }

  const rows: Array<{ major: string | null }> = []

  const legacyRows = await tx.$queryRaw<Array<{ major: string | null }>>`
    SELECT DISTINCT NULLIF(c.category, '') AS major
    FROM "enrollments" e
    INNER JOIN "courses" c ON c.id = e."courseId"
    WHERE e."studentId" = ${studentId}
      AND e.status = 'APPROVED'
  `
  rows.push(...legacyRows)

  if (await hasPhase2ApplicationTables(tx)) {
    const phase2Rows = await tx.$queryRaw<Array<{ major: string | null }>>`
      SELECT DISTINCT COALESCE(NULLIF(cs.major, ''), NULLIF(c.category, '')) AS major
      FROM "enrollment_applications" ea
      INNER JOIN "enrollment_application_choices" eac ON eac."applicationId" = ea.id
      INNER JOIN "class_sections" cs ON cs.id = eac."classSectionId"
      INNER JOIN "courses" c ON c.id = cs."courseId"
      WHERE ea."studentId" = ${studentId}
        AND ea.status = 'APPROVED'
        AND eac.status = 'APPROVED'
    `
    rows.push(...phase2Rows)
  }

  if (await hasRosterManagementTables(tx)) {
    const rosterRows = await tx.$queryRaw<Array<{ major: string | null }>>`
      SELECT DISTINCT COALESCE(NULLIF(cs.major, ''), NULLIF(c.category, '')) AS major
      FROM "roster_members" rm
      INNER JOIN "class_sections" cs ON cs.id = rm."classSectionId"
      INNER JOIN "courses" c ON c.id = cs."courseId"
      WHERE rm."studentId" = ${studentId}
        AND rm.status IN ('ACTIVE', 'DROPPED', 'TRANSFERRED', 'GRADUATED')
    `
    rows.push(...rosterRows)
  }

  return uniqueMajorNames(rows)
}

async function resolveApplicationTargetMajors(tx: any, applicationData: any): Promise<Array<{ id: string, name: string, major: string | null }>> {
  const selectedClassSections = normalizeStringArray(applicationData.selectedClassSections)
  const semester = String(applicationData.semester || '').trim()

  if (selectedClassSections.length > 0 && await hasPhase2ApplicationTables(tx)) {
    return tx.$queryRaw<Array<{ id: string, name: string, major: string | null }>>`
      SELECT
        cs.id,
        COALESCE(cs.name, c.name) AS name,
        COALESCE(NULLIF(cs.major, ''), NULLIF(c.category, '')) AS major
      FROM "class_sections" cs
      INNER JOIN "courses" c ON c.id = cs."courseId"
      INNER JOIN "semesters" s ON s.id = cs."semesterId"
      WHERE cs.id = ANY(${selectedClassSections}::text[])
        AND (${semester} = '' OR s.name = ${semester} OR s.code = ${semester})
        AND cs."isActive" = TRUE
        AND cs.status = 'PUBLISHED'
        AND c."isActive" = TRUE
        AND c.status = 'PUBLISHED'
      ORDER BY array_position(${selectedClassSections}::text[], cs.id)
    `
  }

  const selectedCourses = normalizeStringArray(applicationData.selectedCourses)
  if (selectedCourses.length === 0) {
    return []
  }

  return tx.$queryRaw<Array<{ id: string, name: string, major: string | null }>>`
    SELECT
      c.id,
      c.name,
      NULLIF(c.category, '') AS major
    FROM "courses" c
    WHERE c.id = ANY(${selectedCourses}::text[])
      AND c."isActive" = TRUE
      AND c.status = 'PUBLISHED'
    ORDER BY array_position(${selectedCourses}::text[], c.id)
  `
}

export async function assertStudentHasNoHistoricalMajorConflict(tx: any, studentId: string, applicationData: any): Promise<void> {
  if (!await shouldEnforceHistoricalMajorRule(tx, applicationData)) {
    return
  }

  const historicalMajors = await collectStudentHistoricalMajors(tx, studentId)
  if (historicalMajors.length === 0) {
    return
  }

  const historicalMajorKeys = new Set(historicalMajors.map(major => normalizeMajorKey(major)))
  const targetMajors = await resolveApplicationTargetMajors(tx, applicationData)
  const conflict = targetMajors.find(target => historicalMajorKeys.has(normalizeMajorKey(target.major)))

  if (!conflict) {
    return
  }

  const major = normalizeMajorName(conflict.major) || '该专业'
  throw new ValidationError(`您已学过「${major}」，本次报名不能再次选择该专业，请选择其他未学过的专业。`)
}

async function resolveSemesterNameOrCode(tx: any, semesterReference: unknown): Promise<string> {
  const reference = normalizeMajorName(semesterReference)
  if (!reference || !await hasPhase2ApplicationTables(tx)) {
    return reference
  }

  const rows = await tx.$queryRaw<Array<{ name: string | null, code: string | null }>>`
    SELECT name, code
    FROM "semesters"
    WHERE id = ${reference} OR name = ${reference} OR code = ${reference}
    LIMIT 1
  `

  return normalizeMajorName(rows[0]?.name) || normalizeMajorName(rows[0]?.code) || reference
}

export async function assertStudentCanEnrollCoursesByHistoricalMajor(
  tx: any,
  studentId: string,
  semester: unknown,
  selectedCourses: unknown
): Promise<void> {
  await assertStudentHasNoHistoricalMajorConflict(tx, studentId, {
    semester,
    selectedCourses
  })
}

export async function assertStudentCanEnrollClassSectionsByHistoricalMajor(
  tx: any,
  studentId: string,
  semesterReference: unknown,
  selectedClassSections: unknown
): Promise<void> {
  const classSectionIds = normalizeStringArray(selectedClassSections)
  if (classSectionIds.length === 0) {
    return
  }

  const semester = await resolveSemesterNameOrCode(tx, semesterReference)
  await assertStudentHasNoHistoricalMajorConflict(tx, studentId, {
    semester,
    selectedClassSections: classSectionIds
  })
}

function buildReviewSnapshot(input: {
  enrollment: any
  status: ReviewStatus
  reviewerId: string
  reviewedAt: Date
  applicationId?: string
  classSectionId?: string
  classSectionCode?: string
}): Record<string, any> {
  return {
    status: input.status,
    reviewedAt: input.reviewedAt.toISOString(),
    reviewedBy: input.reviewerId,
    applicationId: input.applicationId || null,
    classSectionId: input.classSectionId || null,
    classSectionCode: input.classSectionCode || null,
    enrollmentId: input.enrollment.id,
    enrollmentCode: input.enrollment.enrollmentCode,
    studentId: input.enrollment.studentId,
    studentName: input.enrollment.student?.name || null,
    studentCode: input.enrollment.student?.studentCode || null,
    courseId: input.enrollment.courseId,
    courseName: input.enrollment.course?.name || null,
    courseCode: input.enrollment.course?.code || null,
    courseCategory: input.enrollment.course?.category || null,
    courseLevel: input.enrollment.course?.level || null,
    insuranceStart: input.enrollment.insuranceStart?.toISOString?.() || null,
    insuranceEnd: input.enrollment.insuranceEnd?.toISOString?.() || null
  }
}

async function assertClassSectionsCanAcceptRosterWrites(tx: any, choices: Array<{ classSectionId: string }>, status: ReviewStatus): Promise<void> {
  if (status !== 'APPROVED') {
    return
  }

  const classSectionIds = [...new Set(choices.map(choice => String(choice.classSectionId || '').trim()).filter(Boolean))]
  if (classSectionIds.length === 0) {
    return
  }

  const frozenRows = await tx.$queryRaw<Array<{ classSectionId: string, status: string }>>`
    SELECT "classSectionId", status::text
    FROM "rosters"
    WHERE "classSectionId" = ANY(${classSectionIds}::text[])
      AND status IN ('PUBLISHED'::"RosterStatus", 'ARCHIVED'::"RosterStatus")
  `

  if (frozenRows.length > 0) {
    throw new BusinessError('Roster is already frozen and cannot accept new members', 400, 'ROSTER_FROZEN')
  }
}

export async function getRosterManagementRows(
  tx: any,
  filters: RosterManagementFilters = {}
): Promise<{ list: RosterManagementRow[], total: number, page: number, pageSize: number }> {
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 10))

  if (!await hasRosterManagementTables(tx)) {
    return { list: [], total: 0, page, pageSize }
  }

  const rows = await tx.$queryRaw<Array<RosterManagementRow>>`
    SELECT
      cs.id AS "classSectionId",
      cs.code AS "classSectionCode",
      cs.name AS "classSectionName",
      cs.status::text AS "classSectionStatus",
      c.id AS "courseId",
      c.name AS "courseName",
      cs.major,
      cs.grade,
      cs.capacity,
      s.id AS "semesterId",
      s.name AS "semesterName",
      ay.id AS "academicYearId",
      ay.name AS "academicYearName",
      r.id AS "rosterId",
      r.status::text AS "rosterStatus",
      r."snapshotAt",
      r."publishedAt",
      COUNT(DISTINCT CASE WHEN rm.status = 'ACTIVE' THEN rm.id END)::int AS "activeMemberCount",
      COUNT(DISTINCT CASE WHEN ea.status = 'SUBMITTED' AND eac.status = 'PENDING' THEN eac.id END)::int AS "pendingApplicationCount"
    FROM "class_sections" cs
    INNER JOIN "courses" c ON c.id = cs."courseId"
    INNER JOIN "semesters" s ON s.id = cs."semesterId"
    INNER JOIN "academic_years" ay ON ay.id = cs."academicYearId"
    LEFT JOIN "rosters" r ON r."classSectionId" = cs.id AND r."semesterId" = cs."semesterId"
    LEFT JOIN "roster_members" rm ON rm."rosterId" = r.id
    LEFT JOIN "enrollment_application_choices" eac ON eac."classSectionId" = cs.id
    LEFT JOIN "enrollment_applications" ea ON ea.id = eac."applicationId"
    WHERE cs."isActive" = TRUE
    GROUP BY
      cs.id,
      cs.code,
      cs.name,
      cs.status,
      c.id,
      c.name,
      cs.major,
      cs.grade,
      cs.capacity,
      s.id,
      s.name,
      s."startsAt",
      ay.id,
      ay.name,
      r.id,
      r.status,
      r."snapshotAt",
      r."publishedAt"
    ORDER BY s."startsAt" DESC NULLS LAST, cs."createdAt" DESC
  `

  const keyword = normalizeOptionalText(filters.keyword)?.toLowerCase()
  const status = normalizeOptionalText(filters.status)?.toUpperCase()
  const semesterId = normalizeOptionalText(filters.semesterId)
  const courseId = normalizeOptionalText(filters.courseId)

  const filteredRows = rows
    .filter(row => !keyword
      || row.classSectionName.toLowerCase().includes(keyword)
      || row.classSectionCode.toLowerCase().includes(keyword)
      || row.courseName.toLowerCase().includes(keyword)
      || row.major.toLowerCase().includes(keyword))
    .filter(row => !status || (row.rosterStatus || 'DRAFT') === status)
    .filter(row => !semesterId || row.semesterId === semesterId)
    .filter(row => !courseId || row.courseId === courseId)

  return {
    list: filteredRows.slice((page - 1) * pageSize, page * pageSize),
    total: filteredRows.length,
    page,
    pageSize
  }
}

export async function getRosterMemberRows(tx: any, classSectionId: string): Promise<{ roster: RosterManagementRow | null, list: RosterMemberRow[] }> {
  if (!await hasRosterManagementTables(tx)) {
    return { roster: null, list: [] }
  }

  const rosterResult = await getRosterManagementRows(tx, { page: 1, pageSize: 1 })
  const rosterRows = await tx.$queryRaw<Array<RosterManagementRow>>`
    SELECT
      cs.id AS "classSectionId",
      cs.code AS "classSectionCode",
      cs.name AS "classSectionName",
      cs.status::text AS "classSectionStatus",
      c.id AS "courseId",
      c.name AS "courseName",
      cs.major,
      cs.grade,
      cs.capacity,
      s.id AS "semesterId",
      s.name AS "semesterName",
      ay.id AS "academicYearId",
      ay.name AS "academicYearName",
      r.id AS "rosterId",
      r.status::text AS "rosterStatus",
      r."snapshotAt",
      r."publishedAt",
      COUNT(DISTINCT CASE WHEN rm.status = 'ACTIVE' THEN rm.id END)::int AS "activeMemberCount",
      COUNT(DISTINCT CASE WHEN ea.status = 'SUBMITTED' AND eac.status = 'PENDING' THEN eac.id END)::int AS "pendingApplicationCount"
    FROM "class_sections" cs
    INNER JOIN "courses" c ON c.id = cs."courseId"
    INNER JOIN "semesters" s ON s.id = cs."semesterId"
    INNER JOIN "academic_years" ay ON ay.id = cs."academicYearId"
    LEFT JOIN "rosters" r ON r."classSectionId" = cs.id AND r."semesterId" = cs."semesterId"
    LEFT JOIN "roster_members" rm ON rm."rosterId" = r.id
    LEFT JOIN "enrollment_application_choices" eac ON eac."classSectionId" = cs.id
    LEFT JOIN "enrollment_applications" ea ON ea.id = eac."applicationId"
    WHERE cs.id = ${classSectionId}
    GROUP BY
      cs.id,
      cs.code,
      cs.name,
      cs.status,
      c.id,
      c.name,
      cs.major,
      cs.grade,
      cs.capacity,
      s.id,
      s.name,
      ay.id,
      ay.name,
      r.id,
      r.status,
      r."snapshotAt",
      r."publishedAt"
    LIMIT 1
  `
  const roster = rosterRows[0] || rosterResult.list.find(row => row.classSectionId === classSectionId) || null

  const rows = await tx.$queryRaw<Array<Omit<RosterMemberRow, 'reviewSnapshot'>>>`
    SELECT
      rm.id AS "memberId",
      rm.status::text AS "memberStatus",
      rm."joinedAt",
      rm."leftAt",
      rm.remarks,
      cs.id AS "classSectionId",
      cs.name AS "classSectionName",
      cs.code AS "classSectionCode",
      r.id AS "rosterId",
      r.status::text AS "rosterStatus",
      s.id AS "studentId",
      s.name AS "studentName",
      s."studentCode",
      s."idNumber",
      s."contactPhone",
      s.gender::text AS gender,
      s.age,
      s.major,
      e.id AS "sourceEnrollmentId",
      e."enrollmentCode",
      e."insuranceStart",
      e."insuranceEnd",
      e."approvedAt",
      e.metadata AS "sourceEnrollmentMetadata"
    FROM "roster_members" rm
    INNER JOIN "rosters" r ON r.id = rm."rosterId"
    INNER JOIN "class_sections" cs ON cs.id = rm."classSectionId"
    INNER JOIN "students" s ON s.id = rm."studentId"
    LEFT JOIN "enrollments" e ON e.id = rm."sourceEnrollmentId"
    WHERE rm."classSectionId" = ${classSectionId}
    ORDER BY rm."joinedAt" ASC, s.name ASC
  `

  return {
    roster,
    list: rows.map(row => {
      const metadata = normalizeMetadata(row.sourceEnrollmentMetadata)
      return {
        ...row,
        reviewSnapshot: metadata.reviewSnapshot || null
      }
    })
  }
}

export async function getPhase2PendingApplicationRows(
  tx: any,
  filters: Phase2ApplicationListFilters = {}
): Promise<Phase2PendingApplicationRow[]> {
  if (!await hasPhase2ApplicationTables(tx)) {
    return []
  }

  const requestedStatus = normalizeOptionalText(filters.status)?.toUpperCase()
  if (requestedStatus && requestedStatus !== 'PENDING') {
    return []
  }

  const rows = await tx.$queryRaw<Array<{
    id: string
    applicationCode: string
    submittedAt: Date
    remarks: string | null
    studentId: string
    studentName: string
    idNumber: string
    contactPhone: string | null
    gender: string
    age: number
    major: string | null
    studentCode: string
    emergencyContact: string | null
    emergencyPhone: string | null
    photo: string | null
    idCardFront: string | null
    idCardBack: string | null
    insuranceStart: Date | null
    insuranceEnd: Date | null
    courseIds: string[]
    courseNames: string
  }>>`
    SELECT
      ea.id,
      ea."applicationCode",
      ea."submittedAt",
      ea.remarks,
      s.id AS "studentId",
      s.name AS "studentName",
      s."idNumber",
      s."contactPhone",
      s.gender::text AS gender,
      s.age,
      s.major,
      s."studentCode",
      s."emergencyContact",
      s."emergencyPhone",
      s.photo,
      s."idCardFront",
      s."idCardBack",
      MIN(si."coverageStart") AS "insuranceStart",
      MAX(si."coverageEnd") AS "insuranceEnd",
      ARRAY_AGG(DISTINCT c.id) AS "courseIds",
      STRING_AGG(DISTINCT c.name, ' / ') AS "courseNames"
    FROM "enrollment_applications" ea
    INNER JOIN "students" s ON s.id = ea."studentId"
    INNER JOIN "enrollment_application_choices" eac ON eac."applicationId" = ea.id
    INNER JOIN "class_sections" cs ON cs.id = eac."classSectionId"
    INNER JOIN "courses" c ON c.id = cs."courseId"
    LEFT JOIN "student_insurances" si ON si.id = ea."insuranceId"
    WHERE ea.status = 'SUBMITTED'
      AND eac.status = 'PENDING'
      AND s."isActive" = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM "enrollments" e
        WHERE e."studentId" = ea."studentId"
          AND e."courseId" = cs."courseId"
          AND e.status = 'PENDING'
      )
    GROUP BY
      ea.id,
      ea."applicationCode",
      ea."submittedAt",
      ea.remarks,
      s.id,
      s.name,
      s."idNumber",
      s."contactPhone",
      s.gender,
      s.age,
      s.major,
      s."studentCode",
      s."emergencyContact",
      s."emergencyPhone",
      s.photo,
      s."idCardFront",
      s."idCardBack"
    ORDER BY ea."submittedAt" DESC
  `

  const keyword = normalizeOptionalText(filters.keyword)?.toLowerCase()
  const department = normalizeOptionalText(filters.department)
  const courseId = normalizeOptionalText(filters.courseId)

  return rows
    .filter(row => !keyword
      || row.studentName.toLowerCase().includes(keyword)
      || row.idNumber.toLowerCase().includes(keyword)
      || row.applicationCode.toLowerCase().includes(keyword))
    .filter(row => !department || row.major === department)
    .filter(row => !courseId || row.courseIds.includes(courseId))
    .map(row => ({
      id: row.id,
      targetType: 'phase2Application',
      applicationId: row.applicationCode,
      enrollmentCode: row.applicationCode,
      studentInfo: {
        id: row.studentId,
        name: row.studentName,
        idNumber: row.idNumber,
        phone: row.contactPhone,
        gender: row.gender,
        age: row.age,
        major: row.major,
        studentCode: row.studentCode,
        emergencyContact: row.emergencyContact,
        emergencyPhone: row.emergencyPhone
      },
      courseInfo: {
        id: row.courseIds[0],
        name: row.courseNames
      },
      applicationDate: row.submittedAt.toISOString().split('T')[0],
      status: 'PENDING',
      avatar: row.photo || '/uploads/id-cards/default-avatar.jpg',
      idCardFront: row.idCardFront,
      idCardBack: row.idCardBack,
      insuranceStart: row.insuranceStart?.toISOString().split('T')[0] || null,
      insuranceEnd: row.insuranceEnd?.toISOString().split('T')[0] || null,
      remarks: row.remarks,
      enrollmentDate: row.submittedAt,
      isPhase2Only: true
    }))
}

export async function createEnrollmentApplicationWithChoices(
  tx: any,
  studentId: string,
  applicationData: any,
  insuranceId: string | null,
  source: string
): Promise<string | null> {
  if (!await hasPhase2ApplicationTables(tx)) {
    return null
  }

  const semesterRows = await tx.$queryRaw<Array<{ id: string, academicYearId: string }>>`
    SELECT id, "academicYearId"
    FROM "semesters"
    WHERE name = ${applicationData.semester} OR code = ${applicationData.semester}
    LIMIT 1
  `

  const semester = semesterRows[0]
  if (!semester) {
    return null
  }

  const classSections = await resolveApplicationClassSections(tx, semester.id, applicationData)

  if (classSections.length === 0) {
    return null
  }

  const applicationId = randomUUID()
  const applicationCode = await generateApplicationCode()

  await tx.$executeRaw`
    INSERT INTO "enrollment_applications" (
      id,
      "applicationCode",
      "studentId",
      "academicYearId",
      "semesterId",
      "insuranceId",
      status,
      source,
      "submittedAt",
      remarks,
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${applicationId},
      ${applicationCode},
      ${studentId},
      ${semester.academicYearId},
      ${semester.id},
      ${insuranceId},
      'SUBMITTED'::"EnrollmentApplicationStatus",
      ${source},
      NOW(),
      ${applicationData.remarks || null},
      NOW(),
      NOW()
    )
  `

  let choiceOrder = 1
  for (const classSection of classSections) {
    await tx.$executeRaw`
      INSERT INTO "enrollment_application_choices" (
        id,
        "applicationId",
        "choiceOrder",
        "classSectionId",
        status,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        ${applicationId},
        ${choiceOrder},
        ${classSection.id},
        'PENDING'::"EnrollmentChoiceStatus",
        NOW(),
        NOW()
      )
    `
    choiceOrder += 1
  }

  return applicationId
}

async function resolveApplicationClassSections(
  tx: any,
  semesterId: string,
  applicationData: any
): Promise<Array<{ id: string, courseId: string }>> {
  const uniqueClassSectionIds = normalizeStringArray(applicationData.selectedClassSections)

  if (uniqueClassSectionIds.length > 0) {
    return tx.$queryRaw<Array<{ id: string, courseId: string }>>`
      SELECT cs.id, cs."courseId"
      FROM "class_sections" cs
      WHERE cs.id = ANY(${uniqueClassSectionIds}::text[])
        AND cs."semesterId" = ${semesterId}
        AND cs."isActive" = TRUE
        AND cs.status = 'PUBLISHED'
      ORDER BY array_position(${uniqueClassSectionIds}::text[], cs.id)
    `
  }

  const uniqueCourseIds = normalizeStringArray(applicationData.selectedCourses)
  if (uniqueCourseIds.length === 0) {
    return []
  }

  return tx.$queryRaw<Array<{ id: string, courseId: string }>>`
    SELECT id, "courseId"
    FROM "class_sections"
    WHERE "semesterId" = ${semesterId}
      AND "courseId" = ANY(${uniqueCourseIds}::text[])
      AND "isActive" = TRUE
      AND status = 'PUBLISHED'
    ORDER BY array_position(${uniqueCourseIds}::text[], "courseId")
  `
}

async function ensureRosterForClassSection(tx: any, classSection: any): Promise<any> {
  const existingRows = await tx.$queryRaw<Array<any>>`
    SELECT *
    FROM "rosters"
    WHERE "classSectionId" = ${classSection.id}
      AND "semesterId" = ${classSection.semesterId}
    LIMIT 1
  `
  const existingRoster = existingRows[0]

  if (existingRoster) {
    return existingRoster
  }

  const rosterId = randomUUID()
  const rosterCode = `${classSection.code}-roster`
  const rows = await tx.$queryRaw<Array<any>>`
    INSERT INTO "rosters" (
      id,
      code,
      "classSectionId",
      "semesterId",
      "academicYearId",
      status,
      "snapshotAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${rosterId},
      ${rosterCode},
      ${classSection.id},
      ${classSection.semesterId},
      ${classSection.academicYearId},
      'DRAFT'::"RosterStatus",
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING *
  `

  return rows[0]
}

async function addRosterMemberForChoice(tx: any, choice: any, studentId: string, sourceEnrollmentId: string | null, remarks?: string): Promise<void> {
  const roster = await ensureRosterForClassSection(tx, choice.classSection)
  if (roster.status === 'PUBLISHED' || roster.status === 'ARCHIVED') {
    throw new BusinessError('Roster is already frozen and cannot accept new members', 400, 'ROSTER_FROZEN')
  }

  const activeMemberRows = await tx.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM "roster_members"
    WHERE "rosterId" = ${roster.id}
      AND status = 'ACTIVE'
  `
  const activeMembers = Number(activeMemberRows[0]?.count || 0)
  const capacity = Number(choice.classSection.capacity) || 0
  if (capacity > 0 && activeMembers >= capacity) {
    throw new BusinessError('Class section capacity is full', 400, 'CLASS_SECTION_FULL')
  }

  await tx.$executeRaw`
    INSERT INTO "roster_members" (
      id,
      "rosterId",
      "classSectionId",
      "studentId",
      "sourceEnrollmentId",
      status,
      remarks,
      "joinedAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${roster.id},
      ${choice.classSectionId},
      ${studentId},
      ${sourceEnrollmentId},
      'ACTIVE'::"RosterMemberStatus",
      ${remarks || null},
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT ("rosterId", "studentId")
    DO UPDATE SET
      "classSectionId" = EXCLUDED."classSectionId",
      "sourceEnrollmentId" = EXCLUDED."sourceEnrollmentId",
      status = 'ACTIVE'::"RosterMemberStatus",
      "leftAt" = NULL,
      remarks = EXCLUDED.remarks,
      "updatedAt" = NOW()
  `
}

async function closeApplicationIfChoicesReviewed(tx: any, applicationId: string, input: ReviewInput): Promise<void> {
  const pendingChoiceRows = await tx.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM "enrollment_application_choices"
    WHERE "applicationId" = ${applicationId}
      AND status = 'PENDING'
  `
  const pendingChoices = Number(pendingChoiceRows[0]?.count || 0)

  if (pendingChoices > 0) {
    return
  }

  const approvedChoiceRows = await tx.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM "enrollment_application_choices"
    WHERE "applicationId" = ${applicationId}
      AND status = 'APPROVED'
  `
  const approvedChoices = Number(approvedChoiceRows[0]?.count || 0)
  const finalStatus = approvedChoices > 0 ? 'APPROVED' : 'REJECTED'

  await tx.$executeRaw`
    UPDATE "enrollment_applications"
    SET
      status = ${finalStatus}::"EnrollmentApplicationStatus",
      "reviewedAt" = NOW(),
      "reviewedBy" = ${input.reviewerId},
      remarks = ${input.comments || null},
      "updatedAt" = NOW()
    WHERE id = ${applicationId}
  `
}

async function syncPhase2ApplicationsForLegacyEnrollment(tx: any, enrollment: any, normalizedStatus: ReviewStatus, input: ReviewInput): Promise<void> {
  if (!await hasPhase2ApplicationTables(tx)) {
    return
  }

  const matchedChoices = await tx.$queryRaw<Array<any>>`
    SELECT
      ea.id AS "applicationId",
      eac.id,
      eac."classSectionId",
      cs.id AS "sectionId",
      cs.code,
      cs."semesterId",
      cs."academicYearId",
      cs."courseId",
      cs.capacity
    FROM "enrollment_applications" ea
    INNER JOIN "enrollment_application_choices" eac ON eac."applicationId" = ea.id
    INNER JOIN "class_sections" cs ON cs.id = eac."classSectionId"
    WHERE ea."studentId" = ${enrollment.studentId}
      AND ea.status = 'SUBMITTED'
      AND eac.status = 'PENDING'
      AND cs."courseId" = ${enrollment.courseId}
  `

  await assertClassSectionsCanAcceptRosterWrites(tx, matchedChoices, normalizedStatus)

  const touchedApplicationIds = new Set<string>()
  for (const row of matchedChoices) {
    const choice = {
      id: row.id,
      classSectionId: row.classSectionId,
      classSection: {
        id: row.sectionId,
        code: row.code,
        semesterId: row.semesterId,
        academicYearId: row.academicYearId,
        courseId: row.courseId,
        capacity: row.capacity
      }
    }
    touchedApplicationIds.add(row.applicationId)

    await tx.$executeRaw`
      UPDATE "enrollment_application_choices"
      SET
        status = ${normalizedStatus}::"EnrollmentChoiceStatus",
        "updatedAt" = NOW()
      WHERE id = ${choice.id}
    `

    if (normalizedStatus === 'APPROVED') {
      await addRosterMemberForChoice(tx, choice, enrollment.studentId, enrollment.id, input.comments)
    }
  }

  for (const applicationId of touchedApplicationIds) {
    await closeApplicationIfChoicesReviewed(tx, applicationId, input)
  }
}

export async function reviewLegacyEnrollment(tx: any, input: ReviewInput): Promise<any> {
  const normalizedStatus = normalizeReviewStatus(input.status)
  const reviewedAt = new Date()
  const enrollment = await tx.enrollment.findUnique({
    where: { id: input.id },
    include: {
      student: true,
      course: true
    }
  })

  if (!enrollment) {
    throw new BusinessError('Enrollment record not found', 404, 'ENROLLMENT_NOT_FOUND')
  }

  if (enrollment.status !== 'PENDING') {
    throw new BusinessError('Only pending enrollment records can be reviewed', 400, 'CANNOT_REVIEW_NON_PENDING')
  }

  const updatedEnrollment = await tx.enrollment.update({
    where: { id: input.id },
    data: {
      status: normalizedStatus,
      approvedAt: normalizedStatus === 'APPROVED' ? reviewedAt : null,
      approvedBy: normalizedStatus === 'APPROVED' ? input.reviewerId : null,
      remarks: input.comments || enrollment.remarks,
      metadata: {
        ...normalizeMetadata(enrollment.metadata),
        reviewSnapshot: buildReviewSnapshot({
          enrollment,
          status: normalizedStatus,
          reviewerId: input.reviewerId,
          reviewedAt
        })
      }
    },
    include: {
      student: true,
      course: true
    }
  })

  await syncPhase2ApplicationsForLegacyEnrollment(tx, updatedEnrollment, normalizedStatus, input)

  return updatedEnrollment
}

export async function reviewEnrollmentApplication(tx: any, input: ReviewInput): Promise<any> {
  const normalizedStatus = normalizeReviewStatus(input.status)
  const applicationRows = await tx.$queryRaw<Array<any>>`
    SELECT
      ea.id,
      ea."studentId",
      ea.status::text AS status,
      ea.remarks,
      eac.id AS "choiceId",
      eac."classSectionId",
      cs.id AS "sectionId",
      cs.code,
      cs."semesterId",
      cs."academicYearId",
      cs."courseId",
      cs.capacity
    FROM "enrollment_applications" ea
    LEFT JOIN "enrollment_application_choices" eac ON eac."applicationId" = ea.id
    LEFT JOIN "class_sections" cs ON cs.id = eac."classSectionId"
    WHERE ea.id = ${input.id}
    ORDER BY eac."choiceOrder" ASC
  `
  const application = applicationRows[0]

  if (!application) {
    throw new BusinessError('Enrollment application not found', 404, 'ENROLLMENT_APPLICATION_NOT_FOUND')
  }

  if (application.status !== 'SUBMITTED') {
    throw new BusinessError('Only submitted enrollment applications can be reviewed', 400, 'CANNOT_REVIEW_NON_PENDING')
  }

  if (normalizedStatus === 'APPROVED') {
    await assertStudentCanEnrollClassSectionsByHistoricalMajor(
      tx,
      application.studentId,
      application.semesterId,
      applicationRows.filter(row => row.choiceId).map(row => row.classSectionId)
    )
  }

  await assertClassSectionsCanAcceptRosterWrites(tx, applicationRows.filter(row => row.choiceId), normalizedStatus)

  const reviewedAt = new Date()
  const updatedApplicationRows = await tx.$queryRaw<Array<any>>`
    UPDATE "enrollment_applications"
    SET
      status = ${normalizedStatus}::"EnrollmentApplicationStatus",
      "reviewedAt" = ${reviewedAt},
      "reviewedBy" = ${input.reviewerId},
      remarks = ${input.comments || application.remarks},
      "updatedAt" = NOW()
    WHERE id = ${input.id}
    RETURNING *
  `
  const updatedApplication = updatedApplicationRows[0]

  await tx.$executeRaw`
    UPDATE "enrollment_application_choices"
    SET
      status = ${normalizedStatus}::"EnrollmentChoiceStatus",
      "updatedAt" = NOW()
    WHERE "applicationId" = ${input.id}
  `

  for (const row of applicationRows.filter(row => row.choiceId)) {
    const choice = {
      id: row.choiceId,
      classSectionId: row.classSectionId,
      classSection: {
        id: row.sectionId,
        code: row.code,
        semesterId: row.semesterId,
        academicYearId: row.academicYearId,
        courseId: row.courseId,
        capacity: row.capacity
      }
    }
    const legacyEnrollment = await tx.enrollment.findFirst({
      where: {
        studentId: application.studentId,
        courseId: choice.classSection.courseId,
        status: 'PENDING'
      },
      include: {
        student: true,
        course: true
      }
    })

    if (legacyEnrollment) {
      await tx.enrollment.update({
        where: { id: legacyEnrollment.id },
        data: {
          status: normalizedStatus,
          approvedAt: normalizedStatus === 'APPROVED' ? reviewedAt : null,
          approvedBy: normalizedStatus === 'APPROVED' ? input.reviewerId : null,
          remarks: input.comments || legacyEnrollment.remarks,
          metadata: {
            ...normalizeMetadata(legacyEnrollment.metadata),
            reviewSnapshot: buildReviewSnapshot({
              enrollment: legacyEnrollment,
              status: normalizedStatus,
              reviewerId: input.reviewerId,
              reviewedAt,
              applicationId: input.id,
              classSectionId: choice.classSection.id,
              classSectionCode: choice.classSection.code
            })
          }
        }
      })
    }

    if (normalizedStatus === 'APPROVED') {
      await addRosterMemberForChoice(tx, choice, application.studentId, legacyEnrollment?.id || null, input.comments)
    }
  }

  return updatedApplication
}

export async function batchReviewApplicationTargets(tx: any, input: BatchReviewInput): Promise<any[]> {
  const normalizedStatus = normalizeReviewStatus(input.status)
  if (!Array.isArray(input.targets) || input.targets.length === 0) {
    throw new ValidationError('Batch review targets are required')
  }

  const results = []
  const seenTargets = new Set<string>()

  for (const target of input.targets) {
    const id = String(target?.id || '').trim()
    if (!id) {
      throw new ValidationError('Batch review target id is required')
    }

    const targetType = target.targetType || 'legacyEnrollment'
    const targetKey = `${targetType}:${id}`
    if (seenTargets.has(targetKey)) {
      continue
    }
    seenTargets.add(targetKey)

    if (targetType === 'phase2Application') {
      results.push(await reviewEnrollmentApplication(tx, {
        id,
        status: normalizedStatus,
        comments: input.comments,
        reviewerId: input.reviewerId
      }))
      continue
    }

    results.push(await reviewLegacyEnrollment(tx, {
      id,
      status: normalizedStatus,
      comments: input.comments,
      reviewerId: input.reviewerId
    }))
  }

  return results
}

export async function freezeRosterSnapshot(tx: any, classSectionId: string): Promise<any> {
  const rosterRows = await tx.$queryRaw<Array<any>>`
    SELECT *
    FROM "rosters"
    WHERE "classSectionId" = ${classSectionId}
    LIMIT 1
  `
  const roster = rosterRows[0]

  if (!roster) {
    throw new BusinessError('Roster not found for class section', 404, 'ROSTER_NOT_FOUND')
  }

  if (roster.status === 'ARCHIVED') {
    throw new BusinessError('Archived roster cannot be frozen again', 400, 'ROSTER_ALREADY_ARCHIVED')
  }

  const pendingRows = await tx.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM "enrollment_application_choices" eac
    INNER JOIN "enrollment_applications" ea ON ea.id = eac."applicationId"
    WHERE eac."classSectionId" = ${classSectionId}
      AND ea.status = 'SUBMITTED'
  `
  if (Number(pendingRows[0]?.count || 0) > 0) {
    throw new BusinessError('Class section still has submitted applications', 400, 'PENDING_APPLICATIONS_EXIST')
  }

  const activeMemberRows = await tx.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM "roster_members"
    WHERE "rosterId" = ${roster.id}
      AND status = 'ACTIVE'
  `
  const activeMembers = Number(activeMemberRows[0]?.count || 0)

  const updatedRosterRows = await tx.$queryRaw<Array<any>>`
    UPDATE "rosters"
    SET
      status = 'PUBLISHED'::"RosterStatus",
      "snapshotAt" = NOW(),
      "publishedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE id = ${roster.id}
    RETURNING *
  `
  const updatedRoster = updatedRosterRows[0]

  return {
    roster: updatedRoster,
    activeMembers
  }
}
