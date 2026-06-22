/**
 * 报名申请路由 V2版本
 * @description 支持年级管理的报名申请处理
 */

import { Router } from 'express'
import { prisma } from '@/lib/prisma'
import Joi from 'joi'
import { randomUUID } from 'crypto'
import { authMiddleware, requireTeacher } from '../middleware/auth'
import { ValidationError, BusinessError } from '../middleware/errorHandler'
import { businessLogger } from '../utils/logger'
import {
  getCurrentSemester,
  calculateCurrentGrade,
  shouldGraduate,
  canEnrollCourse,
  canEnrollSameCourseInDifferentSemester
} from '../utils/gradeManagement'
import { generateApplicationCode } from '../utils/codeGenerator'
import { generateStudentCode } from '../utils/studentCodeGenerator'
import { validateCourseSelection, getMaxCoursesForSemester } from '../utils/enrollmentConfig'
import { validateEnrollmentApplication, validateInsuranceCoverage } from '../services/enrollmentPolicyService'
import {
  assertStudentHasNoHistoricalMajorConflict,
  createEnrollmentApplicationWithChoices,
  freezeRosterSnapshot,
  getRosterMemberRows,
  getRosterManagementRows,
  reviewEnrollmentApplication
} from '../services/enrollmentApplicationService'

const router = Router()

function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function buildRosterMembersCsv(rows: any[]): string {
  const headers = [
    '学号',
    '姓名',
    '身份证号',
    '联系电话',
    '性别',
    '年龄',
    '专业',
    '报名编号',
    '成员状态',
    '加入时间',
    '保险开始',
    '保险结束',
    '审核状态',
    '审核时间'
  ]

  const lines = rows.map(row => [
    row.studentCode,
    row.studentName,
    row.idNumber,
    row.contactPhone,
    row.gender,
    row.age,
    row.major,
    row.enrollmentCode,
    row.memberStatus,
    row.joinedAt,
    row.insuranceStart,
    row.insuranceEnd,
    row.reviewSnapshot?.status,
    row.reviewSnapshot?.reviewedAt
  ].map(escapeCsvValue).join(','))

  return `\uFEFF${[headers.map(escapeCsvValue).join(','), ...lines].join('\n')}`
}

// 验证schema
const applicationV2Schema = Joi.object({
  // 学生基本信息（使用前端字段名）
  name: Joi.string().required().messages({
    'string.empty': '请输入真实姓名',
    'any.required': '真实姓名为必填项'
  }),
  gender: Joi.string().valid('男', '女', 'MALE', 'FEMALE').required().messages({
    'any.only': '性别只能是男、女、MALE或FEMALE',
    'any.required': '性别为必填项'
  }),
  idNumber: Joi.string().pattern(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/).required().messages({
    'string.pattern.base': '身份证号格式不正确',
    'any.required': '身份证号为必填项'
  }),
  birthDate: Joi.string().isoDate().required().messages({
    'string.isoDate': '出生日期格式不正确',
    'any.required': '出生日期为必填项'
  }),
  contactPhone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '手机号格式不正确',
    'any.required': '联系电话为必填项'
  }),
  major: Joi.string().allow('').messages({
    'string.base': '专业必须是字符串'
  }),
  idCardAddress: Joi.string().allow('').messages({
    'string.base': '身份证地址必须是字符串'
  }),
  emergencyContact: Joi.string().allow('').messages({
    'string.base': '紧急联系人必须是字符串'
  }),
  emergencyPhone: Joi.string().allow('').messages({
    'string.base': '紧急联系人电话必须是字符串'
  }),

  // 工作信息
  isRetired: Joi.boolean().required().messages({
    'any.required': '工作状态为必填项'
  }),
  insuranceCompany: Joi.string().optional().allow('').messages({
    'string.base': '保险公司必须是字符串'
  }),
  retirementCategory: Joi.string().optional().allow('').messages({
    'string.base': '保险类别必须是字符串'
  }),

  // 课程信息
  insuranceAttachmentFileId: Joi.string().allow('', null).optional().messages({
    'string.base': '保险凭证文件ID必须是字符串'
  }),
  semester: Joi.string().required().messages({
    'any.required': '学期为必填项'
  }),
  selectedCourses: Joi.array().items(Joi.string()).optional().default([]).messages({
    'array.base': '课程选择必须是数组'
  }),
  selectedClassSections: Joi.array().items(Joi.string()).optional(),
  classSectionIds: Joi.array().items(Joi.string()).optional(),

  // 学习期间（保险信息为可选）
  studyPeriodStart: Joi.string().isoDate().allow('', null).optional().messages({
    'string.isoDate': '保险开始日期格式不正确'
  }),
  studyPeriodEnd: Joi.string().isoDate().allow('', null).optional().messages({
    'string.isoDate': '保险结束日期格式不正确'
  }),

  // 其他信息
  remarks: Joi.string().allow('').messages({
    'string.base': '备注必须是字符串'
  }),
  photo: Joi.string().allow('').messages({
    'string.base': '照片必须是字符串'
  }),

  // 前端发送的其他字段（允许存在但不强制验证）
  ethnicity: Joi.string().allow('').messages({
    'string.base': '民族必须是字符串'
  }),
  healthStatus: Joi.string().allow('').messages({
    'string.base': '健康状况必须是字符串'
  }),
  educationLevel: Joi.string().allow('').messages({
    'string.base': '学历必须是字符串'
  }),
  politicalStatus: Joi.string().allow('').messages({
    'string.base': '政治面貌必须是字符串'
  }),
  phone: Joi.string().allow('').messages({
    'string.base': '电话必须是字符串'
  }),
  idCardFront: Joi.string().allow('').messages({
    'string.base': '身份证正面照片必须是字符串'
  }),
  idCardBack: Joi.string().allow('').messages({
    'string.base': '身份证背面照片必须是字符串'
  }),
  familyAddress: Joi.string().allow('').messages({
    'string.base': '家庭地址必须是字符串'
  }),
  familyPhone: Joi.string().allow('').messages({
    'string.base': '家庭电话必须是字符串'
  }),
  emergencyRelation: Joi.string().allow('').messages({
    'string.base': '紧急联系人关系必须是字符串'
  }),
  agreementSigned: Joi.boolean().allow('').messages({
    'boolean.base': '协议签署状态必须是布尔值'
  }),
  studentId: Joi.string().allow('').messages({
    'string.base': '学生ID必须是字符串'
  }),
  applicationDate: Joi.string().allow('').messages({
    'string.base': '申请日期必须是字符串'
  }),
  status: Joi.string().allow('').messages({
    'string.base': '状态必须是字符串'
  })
})

function getStudentWritableApplicationData(applicationData: any): any {
  const { insuranceAttachmentFileId, ...studentData } = applicationData
  return studentData
}

function hasSuccessfulEnrollmentResult(result: { enrollments: any[], enrollmentApplicationId?: string | null }): boolean {
  return result.enrollments.length > 0 || Boolean(result.enrollmentApplicationId)
}

interface InsuranceRequirementRow {
  academicYearId: string
  requiredInsuranceStart: Date
  requiredInsuranceEnd: Date
}

async function hasInsuranceWorkflowTables(tx: any): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.academic_years') IS NOT NULL
      AND to_regclass('public.semesters') IS NOT NULL
      AND to_regclass('public.student_insurances') IS NOT NULL
      AND to_regclass('public.file_uploads') IS NOT NULL AS "exists"
  `

  return Boolean(rows[0]?.exists)
}

async function getInsuranceRequirementForSemester(tx: any, semester: string): Promise<InsuranceRequirementRow | null> {
  const hasTables = await hasInsuranceWorkflowTables(tx)
  if (!semester || !hasTables) {
    return null
  }

  const rows = await tx.$queryRaw<InsuranceRequirementRow[]>`
    SELECT
      ay.id AS "academicYearId",
      ay."requiredInsuranceStart" AS "requiredInsuranceStart",
      ay."requiredInsuranceEnd" AS "requiredInsuranceEnd"
    FROM "semesters" s
    INNER JOIN "academic_years" ay ON ay.id = s."academicYearId"
    WHERE s.name = ${semester} OR s.code = ${semester}
    LIMIT 1
  `

  return rows[0] || null
}

async function upsertStudentInsuranceForApplication(tx: any, studentId: string, applicationData: any): Promise<string | null> {
  const requirement = await getInsuranceRequirementForSemester(tx, applicationData.semester)
  if (!requirement) {
    return null
  }

  const insuranceCompany = String(applicationData.insuranceCompany || '').trim()
  const attachmentFileId = String(applicationData.insuranceAttachmentFileId || '').trim()
  const coverageStart = applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null
  const coverageEnd = applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null

  if (!insuranceCompany) {
    throw new ValidationError('请填写保险公司')
  }

  if (!attachmentFileId) {
    throw new ValidationError('请上传保险凭证')
  }

  const coverageResult = validateInsuranceCoverage({
    coverageStart,
    coverageEnd,
    requiredStart: requirement.requiredInsuranceStart,
    requiredEnd: requirement.requiredInsuranceEnd
  })

  if (!coverageResult.isValid) {
    throw new ValidationError(coverageResult.errors[0] || '保险有效期不符合报名要求')
  }

  const fileRows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "file_uploads"
    WHERE id = ${attachmentFileId}
      AND "fileType" = 'INSURANCE'
    LIMIT 1
  `

  if (fileRows.length === 0) {
    throw new ValidationError('保险凭证文件不存在，请重新上传')
  }

  await tx.fileUpload.update({
    where: { id: attachmentFileId },
    data: {
      isTemp: false,
      expiresAt: null
    }
  })

  const existingRows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "student_insurances"
    WHERE "studentId" = ${studentId}
      AND "academicYearId" = ${requirement.academicYearId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `

  const category = applicationData.retirementCategory ? String(applicationData.retirementCategory) : null
  if (existingRows[0]) {
    await tx.$executeRaw`
      UPDATE "student_insurances"
      SET
        company = ${insuranceCompany},
        category = ${category},
        "coverageStart" = ${coverageStart},
        "coverageEnd" = ${coverageEnd},
        "attachmentFileId" = ${attachmentFileId},
        "reviewStatus" = 'PENDING'::"InsuranceReviewStatus",
        "reviewedBy" = NULL,
        "reviewedAt" = NULL,
        remarks = NULL,
        "updatedAt" = NOW()
      WHERE id = ${existingRows[0].id}
    `

    return existingRows[0].id
  }

  const id = randomUUID()
  await tx.$executeRaw`
    INSERT INTO "student_insurances" (
      id,
      "studentId",
      "academicYearId",
      company,
      category,
      "coverageStart",
      "coverageEnd",
      "attachmentFileId",
      "reviewStatus",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${studentId},
      ${requirement.academicYearId},
      ${insuranceCompany},
      ${category},
      ${coverageStart},
      ${coverageEnd},
      ${attachmentFileId},
      'PENDING'::"InsuranceReviewStatus",
      NOW(),
      NOW()
    )
  `

  return id
}

async function validateSelectedCoursesPolicy(selectedCourseIds: string[]): Promise<void> {
  const uniqueCourseIds = [...new Set(selectedCourseIds)]
  const courses = await prisma.course.findMany({
    where: {
      id: { in: uniqueCourseIds },
      isActive: true,
      status: 'PUBLISHED'
    },
    select: {
      id: true,
      name: true,
      category: true,
      timeSlots: true
    }
  })

  const courseById = new Map(courses.map(course => [course.id, course]))
  const missingCourseIds = uniqueCourseIds.filter(courseId => !courseById.has(courseId))
  if (missingCourseIds.length > 0) {
    throw new ValidationError('课程不存在或已下架，请重新选择课程')
  }

  const policyResult = validateEnrollmentApplication({
    choices: selectedCourseIds.map(courseId => {
      const course = courseById.get(courseId)!
      return {
        id: course.id,
        name: course.name,
        major: course.category,
        timeSlots: course.timeSlots
      }
    })
  })

  if (!policyResult.isValid) {
    throw new ValidationError(policyResult.errors[0] || '报名课程选择不符合规则')
  }
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

async function normalizeApplicationSelectionInput(applicationData: any): Promise<any> {
  const selectedClassSections = normalizeStringArray(
    applicationData.selectedClassSections || applicationData.classSectionIds
  )
  const selectedCourses = normalizeStringArray(applicationData.selectedCourses)

  if (selectedClassSections.length === 0 && selectedCourses.length === 0) {
    throw new ValidationError('请选择至少一门课程')
  }

  if (selectedClassSections.length === 0) {
    return {
      ...applicationData,
      selectedCourses
    }
  }

  const rows = await prisma.$queryRaw<Array<{
    id: string
    courseId: string
  }>>`
    SELECT cs.id, cs."courseId"
    FROM "class_sections" cs
    INNER JOIN "semesters" s ON s.id = cs."semesterId"
    WHERE cs.id = ANY(${selectedClassSections}::text[])
      AND (s.name = ${applicationData.semester} OR s.code = ${applicationData.semester})
      AND cs."isActive" = TRUE
      AND cs.status = 'PUBLISHED'
    ORDER BY array_position(${selectedClassSections}::text[], cs.id)
  `

  if (rows.length !== selectedClassSections.length) {
    throw new ValidationError('所选班级不存在、未发布或不属于当前学期')
  }

  return {
    ...applicationData,
    selectedClassSections,
    selectedCourses: rows.map(row => row.courseId)
  }
}

async function validateSelectedClassSectionsPolicy(selectedClassSectionIds: string[], semester: string): Promise<void> {
  const uniqueClassSectionIds = normalizeStringArray(selectedClassSectionIds)
  const rows = await prisma.$queryRaw<Array<{
    id: string
    name: string
    category: string
    timeSlots: unknown
  }>>`
    SELECT
      cs.id,
      COALESCE(cs.name, c.name) AS name,
      c.category,
      COALESCE(cs."timeSlots", c."timeSlots") AS "timeSlots"
    FROM "class_sections" cs
    INNER JOIN "courses" c ON c.id = cs."courseId"
    INNER JOIN "semesters" s ON s.id = cs."semesterId"
    WHERE cs.id = ANY(${uniqueClassSectionIds}::text[])
      AND (s.name = ${semester} OR s.code = ${semester})
      AND cs."isActive" = TRUE
      AND cs.status = 'PUBLISHED'
      AND c."isActive" = TRUE
      AND c.status = 'PUBLISHED'
  `

  const sectionById = new Map(rows.map(section => [section.id, section]))
  const missingSectionIds = uniqueClassSectionIds.filter(sectionId => !sectionById.has(sectionId))
  if (missingSectionIds.length > 0) {
    throw new ValidationError('所选班级不存在、未发布或不属于当前学期')
  }

  const policyResult = validateEnrollmentApplication({
    choices: uniqueClassSectionIds.map(sectionId => {
      const section = sectionById.get(sectionId)!
      return {
        id: section.id,
        name: section.name,
        major: section.category,
        timeSlots: section.timeSlots
      }
    })
  })

  if (!policyResult.isValid) {
    throw new ValidationError(policyResult.errors[0] || '报名班级选择不符合规则')
  }
}

async function validateApplicationSelectionPolicy(applicationData: any): Promise<void> {
  const selectedClassSections = normalizeStringArray(applicationData.selectedClassSections)
  if (selectedClassSections.length > 0) {
    await validateSelectedClassSectionsPolicy(selectedClassSections, applicationData.semester)
    return
  }

  await validateSelectedCoursesPolicy(applicationData.selectedCourses)
}

/**
 * 提交报名申请 V2版本（支持年级管理）
 * POST /api/applications-v2
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const requestFields = Object.keys(req.body || {})
    const selectedCoursesCount = Array.isArray(req.body?.selectedCourses) ? req.body.selectedCourses.length : 0
    console.log('🎯 收到V2报名申请:', {
      fields: requestFields,
      selectedCoursesCount
    })

    // 验证输入数据
    const { error, value } = applicationV2Schema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    const applicationData = await normalizeApplicationSelectionInput(value)

    console.log('✅ 数据验证通过')
    await validateApplicationSelectionPolicy(applicationData)

    const currentSemester = getCurrentSemester()

    // 执行事务处理
    const result = await prisma.$transaction(async (tx) => {
      console.log('🔄 开始事务处理...')

            // 查找现有学生（包含所有字段）
      const existingStudent = await tx.student.findFirst({
        where: {
          idNumber: applicationData.idNumber,
          isActive: true
        },
        include: {
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  semester: true
                }
              }
            }
          }
        }
      })

      // 查找软删除的学生
      const deletedStudent = await tx.student.findFirst({
        where: {
          idNumber: applicationData.idNumber,
          isActive: false
        }
      })

      let student: any
      let isNewStudent = false
      let isRecoveredStudent = false

      if (existingStudent) {
        await assertStudentHasNoHistoricalMajorConflict(tx, existingStudent.id, applicationData)
        console.log(`🔍 找到现有学生: ${existingStudent.name}`)

        // 检查现有学生的报名冲突
        const activeEnrollments = existingStudent.enrollments.filter((e: any) =>
          e.status === 'PENDING' || e.status === 'APPROVED'
        )

        // 🔧 跨学期课程数量限制检查
        if (applicationData.selectedCourses.length > 0) {
          // 🔧 修复：使用用户选择的学期进行验证，而不是课程的学期
          // 用户选择"2024年秋季"就应该按照"2024年秋季"的政策进行验证
          const userSelectedSemester = applicationData.semester

          if (userSelectedSemester) {
            console.log(`🔍 开始跨学期课程数量限制检查:`)
            console.log(`  - 用户选择学期: ${userSelectedSemester}`)
            console.log(`  - 选择课程数量: ${applicationData.selectedCourses.length}`)
            console.log(`  - 现有活跃报名数量: ${activeEnrollments.length}`)

            // 调试现有报名记录的学期信息
            activeEnrollments.forEach((enrollment: any, index: number) => {
              console.log(`  - 现有报名${index + 1}: 课程ID=${enrollment.courseId}, 学期=${enrollment.course?.semester || 'undefined'}, 状态=${enrollment.status}`)
            })

            // 使用新的跨学期限制验证
            const validation = validateCourseSelection(
              userSelectedSemester,
              activeEnrollments.map((e: any) => ({
                course: { semester: e.course?.semester || '' },
                status: e.status
              })),
              applicationData.selectedCourses.length
            )

            if (!validation.isValid) {
              console.log(`❌ 跨学期课程数量验证失败: ${validation.message}`)
              throw new ValidationError(validation.message || '课程数量超出限制')
            }

            console.log(`✅ 跨学期课程数量验证通过: ${userSelectedSemester}学期，可报名${validation.maxAllowed}门课程`)
          }
        }

        for (const courseId of applicationData.selectedCourses) {
          const targetCourse = await tx.course.findFirst({
            where: {
              id: courseId,
              isActive: true,
              status: 'PUBLISHED'
            },
            include: {
              enrollments: {
                where: { status: { in: ['PENDING', 'APPROVED'] } },
                select: { id: true }
              }
            }
          })

          if (!targetCourse) {
            throw new ValidationError('课程不存在或已下架，请重新选择课程')
          }

          // 检查课程容量
          if (targetCourse.enrollments.length >= targetCourse.maxStudents) {
            throw new ValidationError(`课程"${targetCourse.name}"名额已满（${targetCourse.enrollments.length}/${targetCourse.maxStudents}）`)
          }

          // 1. 检查是否已报名该课程且状态为PENDING或APPROVED
          const hasActiveEnrollment = existingStudent.enrollments.some((enrollment: any) =>
            enrollment.courseId === courseId &&
            (enrollment.status === 'PENDING' || enrollment.status === 'APPROVED')
          )

          if (hasActiveEnrollment) {
            throw new ValidationError(`您已经报名过课程"${targetCourse.name}"，请等待审核结果`)
          }

                    // 2. 检查是否已报名该课程且被拒绝或取消（REJECTED和CANCELLED状态都允许重新报名）
          const hasRejectedOrCancelledEnrollment = existingStudent.enrollments.some((enrollment: any) =>
            enrollment.courseId === courseId &&
            (enrollment.status === 'REJECTED' || enrollment.status === 'CANCELLED')
          )

          // 注意：REJECTED和CANCELLED状态的课程都允许重新报名，所以这里不抛出错误
          // if (hasRejectedOrCancelledEnrollment) {
          //   throw new ValidationError(`课程"${targetCourse.name}"已被拒绝或取消，无法重新报名。您可以选择报名其他课程`)
          // }

          // 3. 检查是否已报名同一门课程的其他年级
          const hasSameCourseConflict = existingStudent.enrollments.some((enrollment: any) => {
            if (enrollment.course && enrollment.course.name === targetCourse.name &&
                (enrollment.status === 'PENDING' || enrollment.status === 'APPROVED')) {
              return true
            }
            return false
          })

          if (hasSameCourseConflict) {
            throw new ValidationError(`您已经报名过"${targetCourse.name}"的其他年级，不能重复报名`)
          }

          // 检查学生是否有任何通过审核的课程
          const hasApprovedCourses = existingStudent.enrollments.some((enrollment: any) =>
            enrollment.status === 'APPROVED'
          )

          // 年级权限检查
          const gradeCheck = canEnrollCourse(
            existingStudent.currentGrade,
            targetCourse.level,
            existingStudent.graduationStatus,
            targetCourse.requiresGrades,
            hasApprovedCourses
          )

          if (!gradeCheck.canEnroll) {
            throw new ValidationError(`报名失败: ${gradeCheck.reason}`)
          }
        }

        // 更新现有学生信息（暂时简化毕业生检查）
        const isGraduated = (existingStudent as any).graduationStatus === 'GRADUATED' ||
                           (existingStudent as any).graduationStatus === 'ARCHIVED'
        if (isGraduated) {
          // 根据第一门选择的课程获取院系信息
          let studentMajor = existingStudent.major || '未设置'
          if (applicationData.selectedCourses.length > 0) {
            const firstCourse = await tx.course.findUnique({
              where: { id: applicationData.selectedCourses[0] },
              select: { category: true, name: true }
            })
            if (firstCourse?.category) {
              studentMajor = firstCourse.category
              console.log(`📚 根据课程"${firstCourse.name}"设置毕业生重新学习院系为: ${studentMajor}`)
            }
          }

          // 毕业生重新开始学习周期（直接使用前端字段）
          const studentData = {
            ...getStudentWritableApplicationData(applicationData),
            major: studentMajor, // 根据课程设置院系
            gender: (applicationData.gender === '男' || applicationData.gender === 'MALE') ? 'MALE' as const : 'FEMALE' as const,
            birthDate: new Date(applicationData.birthDate),
            birthday: new Date(applicationData.birthDate),
            studyPeriodStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
            studyPeriodEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
            applicationDate: applicationData.applicationDate ? new Date(applicationData.applicationDate) : new Date(),
            currentGrade: '一年级',
            enrollmentYear: new Date().getFullYear(),
            enrollmentSemester: currentSemester,
            graduationStatus: 'IN_PROGRESS',
            academicStatus: 'ACTIVE',
            graduationDate: null,
            updatedAt: new Date()
          }

          student = await tx.student.update({
            where: { id: existingStudent.id },
            data: studentData
          })
          console.log('🔄 毕业生重新开始学习周期')
        } else {
          // 在读学生，检查年级升级（暂时简化）
          const studentEnrollmentSemester = (existingStudent as any).enrollmentSemester || currentSemester
          const expectedGrade = calculateCurrentGrade(studentEnrollmentSemester, currentSemester)
          const shouldGrad = shouldGraduate(studentEnrollmentSemester, currentSemester)

          // 根据第一门选择的课程获取院系信息
          let studentMajor = existingStudent.major || '未设置'
          if (applicationData.selectedCourses.length > 0) {
            const firstCourse = await tx.course.findUnique({
              where: { id: applicationData.selectedCourses[0] },
              select: { category: true, name: true }
            })
            if (firstCourse?.category) {
              studentMajor = firstCourse.category
              console.log(`📚 根据课程"${firstCourse.name}"更新现有学生院系为: ${studentMajor}`)
            }
          }

          // 直接使用前端字段名（无需映射）
          let updateData: any = {
            ...getStudentWritableApplicationData(applicationData),
            major: studentMajor, // 根据课程设置院系
            gender: (applicationData.gender === '男' || applicationData.gender === 'MALE') ? 'MALE' as const : 'FEMALE' as const,
            birthDate: new Date(applicationData.birthDate),
            birthday: new Date(applicationData.birthDate),
            studyPeriodStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
            studyPeriodEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
            applicationDate: applicationData.applicationDate ? new Date(applicationData.applicationDate) : new Date(),
            updatedAt: new Date()
          }

          if (shouldGrad) {
            updateData.graduationStatus = 'GRADUATED'
            updateData.academicStatus = 'GRADUATED'
            updateData.graduationDate = new Date()
          } else if (expectedGrade !== (existingStudent as any).currentGrade) {
            updateData.currentGrade = expectedGrade
          }

          student = await tx.student.update({
            where: { id: existingStudent.id },
            data: updateData
          })
          console.log('✅ 更新现有学生信息和年级')
        }

      } else if (deletedStudent) {
        await assertStudentHasNoHistoricalMajorConflict(tx, deletedStudent.id, applicationData)
        console.log(`🔄 恢复软删除学生: ${deletedStudent.name}`)

        // 恢复软删除的学生
        // 根据第一门选择的课程获取院系信息
        let studentMajor = deletedStudent.major || '未设置'
        if (applicationData.selectedCourses.length > 0) {
          const firstCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { category: true, name: true }
          })
          if (firstCourse?.category) {
            studentMajor = firstCourse.category
            console.log(`📚 根据课程"${firstCourse.name}"更新学生院系为: ${studentMajor}`)
          }
        }

        // 字段映射：前端字段名 → 数据库字段名
        const recoveryData = {
          ...getStudentWritableApplicationData(applicationData),
          major: studentMajor, // 根据课程设置院系
          currentAddress: applicationData.familyAddress || applicationData.idCardAddress, // 前端familyAddress → 数据库currentAddress
          emergencyRelation: applicationData.emergencyRelation || '紧急联系人', // 必填字段默认值
          gender: applicationData.gender === '男' ? 'MALE' as const : 'FEMALE' as const,
          birthDate: new Date(applicationData.birthDate),
          birthday: new Date(applicationData.birthDate),
          studyPeriodStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
          studyPeriodEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
          applicationDate: applicationData.applicationDate ? new Date(applicationData.applicationDate) : new Date(),
          isActive: true,
          currentGrade: '一年级',
          enrollmentYear: new Date().getFullYear(),
          enrollmentSemester: currentSemester,
          graduationStatus: 'IN_PROGRESS',
          academicStatus: 'ACTIVE',
          graduationDate: null,
          updatedAt: new Date()
        }

        student = await tx.student.update({
          where: { id: deletedStudent.id },
          data: recoveryData
        })
        isRecoveredStudent = true

      } else {
        console.log('➕ 创建新学生')

        // 🔧 创建新学生，传递学期参数生成编号
        const studentCode = await generateStudentCode(applicationData.semester, tx)

        // 根据第一门选择的课程获取院系信息
        let studentMajor = '未设置'
        if (applicationData.selectedCourses.length > 0) {
          const firstCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { category: true, name: true }
          })
          if (firstCourse?.category) {
            studentMajor = firstCourse.category
            console.log(`📚 根据课程"${firstCourse.name}"设置学生院系为: ${studentMajor}`)
          }
        }

        // 字段映射：前端字段名 → 数据库字段名
        const newStudentData = {
          ...getStudentWritableApplicationData(applicationData),
          major: studentMajor, // 根据课程设置院系
          currentAddress: applicationData.familyAddress || applicationData.idCardAddress, // 前端familyAddress → 数据库currentAddress
          emergencyRelation: applicationData.emergencyRelation || '紧急联系人', // 必填字段默认值
          gender: applicationData.gender === '男' ? 'MALE' as const : 'FEMALE' as const,
          birthDate: new Date(applicationData.birthDate),
          birthday: new Date(applicationData.birthDate),
          studyPeriodStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
          studyPeriodEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
          applicationDate: applicationData.applicationDate ? new Date(applicationData.applicationDate) : new Date(),
          studentCode,
          age: Math.floor((Date.now() - new Date(applicationData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          currentGrade: '一年级',
          enrollmentYear: new Date().getFullYear(),
          enrollmentSemester: currentSemester,
          graduationStatus: 'IN_PROGRESS',
          academicStatus: 'ACTIVE',
          createdBy: req.user!.id
        }

        student = await tx.student.create({
          data: newStudentData
        })
        isNewStudent = true
      }

      const insuranceId = await upsertStudentInsuranceForApplication(tx, student.id, applicationData)
      const enrollmentApplicationId = await createEnrollmentApplicationWithChoices(
        tx,
        student.id,
        applicationData,
        insuranceId,
        'ADMIN'
      )

      // 为每个课程创建报名记录
      const enrollments = []
      const enrolledCourseNames = [] // 新增：保存成功报名的课程名称

      for (const courseId of applicationData.selectedCourses) {
        const targetCourse = await tx.course.findFirst({
          where: {
            id: courseId,
            isActive: true,
            status: 'PUBLISHED'
          },
          include: {
            enrollments: {
              where: { status: { in: ['PENDING', 'APPROVED'] } },
              select: { id: true }
            }
          }
        })

        if (!targetCourse) {
          throw new ValidationError('课程不存在或已下架，请重新选择课程')
        }

        // 检查课程容量（创建enrollment前的最后检查）
        if (targetCourse.enrollments.length >= targetCourse.maxStudents) {
          console.log(`⚠️ 课程${targetCourse.name}名额已满，跳过`)
          continue
        }

        // 再次检查是否已经有该课程的报名记录
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            studentId: student.id,
            courseId: courseId,
status: { in: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }
          }
        })

        if (existingEnrollment) {
          if (existingEnrollment.status === 'REJECTED' || existingEnrollment.status === 'CANCELLED') {
            // 🔧 修复：REJECTED和CANCELLED状态都允许重新报名
            console.log(`✅ 学生${student.name}的课程${targetCourse.name}状态为${existingEnrollment.status}，已保留历史并记录Phase2申请`)
            continue
          } else {
            console.log(`⚠️ 学生${student.name}已报名课程${targetCourse.name}且状态为${existingEnrollment.status}，跳过重复报名`)
            continue
          }
        }

        const enrollment = await tx.enrollment.create({
          data: {
            enrollmentCode: await generateApplicationCode(),
            studentId: student.id,
            courseId: courseId,
            enrollmentDate: new Date(),
            status: 'PENDING',
            insuranceStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
            insuranceEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
            remarks: applicationData.remarks || '',
            createdBy: req.user!.id
          }
        })
        enrollments.push(enrollment)
        enrolledCourseNames.push(targetCourse.name) // 保存课程名称
      }

      return { student, enrollments, enrolledCourseNames, isNewStudent, isRecoveredStudent, enrollmentApplicationId }
    })

    // 记录操作日志
    businessLogger.userAction(req.user!.id, 'APPLICATION_SUBMIT_V2', {
      studentId: result.student.id,
      studentName: result.student.name,
      coursesCount: result.enrollments.length,
      semester: applicationData.semester,
      isNewStudent: result.isNewStudent,
      isRecoveredStudent: result.isRecoveredStudent,
      currentGrade: result.student.currentGrade
    })

    const actionType = result.isNewStudent ? '新学生注册' :
                      result.isRecoveredStudent ? '学生信息恢复' : '报名更新'

    if (!hasSuccessfulEnrollmentResult(result)) {
      return res.json({
        success: false,
        code: 400,
        data: {
          student: result.student,
          enrollments: result.enrollments,
          phase2ApplicationId: result.enrollmentApplicationId,
          actionType
        },
        message: `报名失败：所选课程均已满员或不符合条件，请重新选择其他课程`
      })
    }

    // 获取成功报名的课程名称
    const courseNames = result.enrolledCourseNames?.join('、') || '未知课程'
    const submittedChoicesCount = result.enrollments.length || normalizeStringArray(applicationData.selectedClassSections).length || applicationData.selectedCourses.length
    const hasLegacyEnrollmentRows = result.enrollments.length > 0

    res.json({
      success: true,
      code: 200,
      data: {
        student: result.student,
        enrollments: result.enrollments,
        phase2ApplicationId: result.enrollmentApplicationId,
        actionType
      },
      message: hasLegacyEnrollmentRows
        ? `${actionType}成功！已为 ${result.student.name} 报名 ${result.enrollments.length} 门课程：${courseNames}`
        : `${actionType}成功！已提交 ${submittedChoicesCount} 个班次申请，请等待审核`
    })

  } catch (error) {
    console.error('V2报名申请处理失败:', error)
    return next(error)
  }
})

router.post('/:id/review', authMiddleware, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, comments } = req.body || {}

    const application = await prisma.$transaction((tx) => reviewEnrollmentApplication(tx, {
      id,
      status,
      comments,
      reviewerId: req.user!.id
    }))

    businessLogger.userAction(req.user!.id, 'APPLICATION_V2_REVIEW', {
      applicationId: id,
      status,
      comments
    })

    res.json({
      code: 200,
      success: true,
      message: `Application ${String(status).toUpperCase() === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
      data: application
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/rosters/:classSectionId/freeze', authMiddleware, requireTeacher, async (req, res, next) => {
  try {
    const { classSectionId } = req.params
    const result = await prisma.$transaction((tx) => freezeRosterSnapshot(tx, classSectionId))

    businessLogger.userAction(req.user!.id, 'ROSTER_FREEZE', {
      classSectionId,
      rosterId: result.roster.id,
      activeMembers: result.activeMembers
    })

    res.json({
      code: 200,
      success: true,
      message: 'Roster frozen successfully',
      data: result
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/rosters', authMiddleware, requireTeacher, async (req, res, next) => {
  try {
    const { page, pageSize, keyword, status, semesterId, courseId } = req.query
    const result = await getRosterManagementRows(prisma, {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      keyword: typeof keyword === 'string' ? keyword : undefined,
      status: typeof status === 'string' ? status : undefined,
      semesterId: typeof semesterId === 'string' ? semesterId : undefined,
      courseId: typeof courseId === 'string' ? courseId : undefined
    })

    res.json({
      code: 200,
      success: true,
      message: 'Roster list loaded successfully',
      data: {
        list: result.list,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      }
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/rosters/:classSectionId/members', authMiddleware, requireTeacher, async (req, res, next) => {
  try {
    const { classSectionId } = req.params
    const result = await getRosterMemberRows(prisma, classSectionId)

    res.json({
      code: 200,
      success: true,
      message: 'Roster members loaded successfully',
      data: result
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/rosters/:classSectionId/export', authMiddleware, requireTeacher, async (req, res, next) => {
  try {
    const { classSectionId } = req.params
    const result = await getRosterMemberRows(prisma, classSectionId)
    const csv = buildRosterMembersCsv(result.list)
    const fileName = `${result.roster?.classSectionCode || classSectionId}_roster.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    res.send(csv)
  } catch (error) {
    return next(error)
  }
})

/**
 * 匿名报名申请 V2版本（支持年级管理）
 * POST /api/applications-v2/anonymous
 */
router.post('/anonymous', async (req, res, next) => {
  try {
    const isAnonymousApplication = true
    const requestFields = Object.keys(req.body || {})
    const selectedCoursesCount = Array.isArray(req.body?.selectedCourses) ? req.body.selectedCourses.length : 0
    console.log('🎯 收到V2匿名报名申请:', {
      fields: requestFields,
      selectedCoursesCount
    })

    // 验证输入数据
    const { error, value } = applicationV2Schema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    const applicationData = await normalizeApplicationSelectionInput(value)

    console.log('✅ 数据验证通过')
    await validateApplicationSelectionPolicy(applicationData)

    const currentSemester = getCurrentSemester()

    // 执行事务处理
    const result = await prisma.$transaction(async (tx) => {
      console.log('🔄 开始匿名事务处理...')

            // 查找现有学生（包含所有字段）
      const existingStudent = await tx.student.findFirst({
        where: {
          idNumber: applicationData.idNumber,
          isActive: true
        },
        include: {
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  semester: true
                }
              }
            }
          }
        }
      })

      // 查找软删除的学生
      const deletedStudent = await tx.student.findFirst({
        where: {
          idNumber: applicationData.idNumber,
          isActive: false
        }
      })

      let student: any
      let isNewStudent = false
      let isRecoveredStudent = false

      if (existingStudent) {
        await assertStudentHasNoHistoricalMajorConflict(tx, existingStudent.id, applicationData)
        console.log(`🔍 找到现有学生: ${existingStudent.name}`)

        // 检查现有学生的报名冲突
        const activeEnrollments = existingStudent.enrollments.filter((e: any) =>
          e.status === 'PENDING' || e.status === 'APPROVED'
        )

        // 🔧 跨学期课程数量限制检查
        if (applicationData.selectedCourses.length > 0) {
          // 🔧 修复：使用用户选择的学期进行验证，而不是课程的学期
          // 用户选择"2024年秋季"就应该按照"2024年秋季"的政策进行验证
          const userSelectedSemester = applicationData.semester

          if (userSelectedSemester) {
            // 使用新的跨学期限制验证
            const validation = validateCourseSelection(
              userSelectedSemester,
              activeEnrollments.map((e: any) => ({
                course: { semester: e.course?.semester || '' },
                status: e.status
              })),
              applicationData.selectedCourses.length
            )

            if (!validation.isValid) {
              throw new ValidationError(validation.message || '课程数量超出限制')
            }

            console.log(`✅ 跨学期课程数量验证通过: ${userSelectedSemester}学期，可报名${validation.maxAllowed}门课程`)
          }
        }

        for (const courseId of applicationData.selectedCourses) {
          const targetCourse = await tx.course.findFirst({
            where: {
              id: courseId,
              isActive: true,
              status: 'PUBLISHED'
            },
            include: {
              enrollments: {
                where: { status: { in: ['PENDING', 'APPROVED'] } },
                select: { id: true }
              }
            }
          })

          if (!targetCourse) {
            throw new ValidationError('课程不存在或已下架，请重新选择课程')
          }

          // 检查课程容量
          if (targetCourse.enrollments.length >= targetCourse.maxStudents) {
            throw new ValidationError(`课程"${targetCourse.name}"名额已满（${targetCourse.enrollments.length}/${targetCourse.maxStudents}）`)
          }

          // 1. 检查是否已报名该课程且状态为PENDING或APPROVED
          const hasActiveEnrollment = existingStudent.enrollments.some((enrollment: any) =>
            enrollment.courseId === courseId &&
            (enrollment.status === 'PENDING' || enrollment.status === 'APPROVED')
          )

          if (hasActiveEnrollment) {
            throw new ValidationError(`您已经报名过课程"${targetCourse.name}"，请等待审核结果`)
          }

                    // 2. 检查是否已报名该课程且被拒绝或取消（REJECTED和CANCELLED状态都允许重新报名）
          const hasRejectedOrCancelledEnrollment = existingStudent.enrollments.some((enrollment: any) =>
            enrollment.courseId === courseId &&
            (enrollment.status === 'REJECTED' || enrollment.status === 'CANCELLED')
          )

          // 注意：REJECTED和CANCELLED状态的课程都允许重新报名，所以这里不抛出错误
          // if (hasRejectedOrCancelledEnrollment) {
          //   throw new ValidationError(`课程"${targetCourse.name}"已被拒绝或取消，无法重新报名。您可以选择报名其他课程`)
          // }

          // 3. 检查是否已报名同一门课程的其他年级
          const hasSameCourseConflict = existingStudent.enrollments.some((enrollment: any) => {
            if (enrollment.course && enrollment.course.name === targetCourse.name &&
                (enrollment.status === 'PENDING' || enrollment.status === 'APPROVED')) {
              return true
            }
            return false
          })

          if (hasSameCourseConflict) {
            throw new ValidationError(`您已经报名过"${targetCourse.name}"的其他年级，不能重复报名`)
          }

          // 检查学生是否有任何通过审核的课程
          const hasApprovedCourses = existingStudent.enrollments.some((enrollment: any) =>
            enrollment.status === 'APPROVED'
          )

          // 年级权限检查
          const gradeCheck = canEnrollCourse(
            existingStudent.currentGrade,
            targetCourse.level,
            existingStudent.graduationStatus,
            targetCourse.requiresGrades,
            hasApprovedCourses
          )

          if (!gradeCheck.canEnroll) {
            throw new ValidationError(`报名失败: ${gradeCheck.reason}`)
          }
        }

        // 根据第一门选择的课程获取院系信息
        let studentMajor = existingStudent.major || '未设置'
        if (applicationData.selectedCourses.length > 0) {
          const firstCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { category: true, name: true }
          })
          if (firstCourse?.category) {
            studentMajor = firstCourse.category
            console.log(`📚 根据课程"${firstCourse.name}"更新现有学生院系为: ${studentMajor}`)
          }
        }

        // 字段映射：前端字段名 → 数据库字段名
        const updateData = {
          ...getStudentWritableApplicationData(applicationData),
          major: studentMajor, // 根据课程设置院系
          currentAddress: applicationData.familyAddress || applicationData.idCardAddress, // 前端familyAddress → 数据库currentAddress
          emergencyRelation: applicationData.emergencyRelation || '紧急联系人', // 必填字段默认值
          gender: applicationData.gender === '男' ? 'MALE' as const : 'FEMALE' as const,
          birthDate: new Date(applicationData.birthDate),
          birthday: new Date(applicationData.birthDate),
          studyPeriodStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
          studyPeriodEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
          applicationDate: applicationData.applicationDate ? new Date(applicationData.applicationDate) : new Date(),
          updatedAt: new Date()
        }

        if (existingStudent && !isAnonymousApplication) {
          student = await tx.student.update({
            where: { id: existingStudent.id },
            data: updateData
          })
        } else {
          student = existingStudent
        }

      } else if (deletedStudent) {
        await assertStudentHasNoHistoricalMajorConflict(tx, deletedStudent.id, applicationData)
        console.log(`🔄 恢复软删除学生: ${deletedStudent.name}`)

        // 恢复软删除的学生，创建一个默认的createdBy用户
        const systemUser = await tx.user.findFirst({
          where: { role: 'SUPER_ADMIN' }
        })

        // 根据第一门选择的课程获取院系信息
        let studentMajor = deletedStudent.major || '未设置'
        if (applicationData.selectedCourses.length > 0) {
          const firstCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { category: true, name: true }
          })
          if (firstCourse?.category) {
            studentMajor = firstCourse.category
            console.log(`📚 根据课程"${firstCourse.name}"设置恢复学生院系为: ${studentMajor}`)
          }
        }

        // 直接使用前端字段名（无需映射）
        const recoveryData = {
          ...getStudentWritableApplicationData(applicationData),
          major: studentMajor, // 根据课程设置院系
          gender: applicationData.gender === '男' ? 'MALE' as const : 'FEMALE' as const,
          birthDate: new Date(applicationData.birthDate),
          birthday: new Date(applicationData.birthDate),
          studyPeriodStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
          studyPeriodEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
          applicationDate: applicationData.applicationDate ? new Date(applicationData.applicationDate) : new Date(),
          isActive: true,
          currentGrade: '一年级',
          enrollmentYear: new Date().getFullYear(),
          enrollmentSemester: currentSemester,
          graduationStatus: 'IN_PROGRESS',
          academicStatus: 'ACTIVE',
          graduationDate: null,
          createdBy: systemUser?.id || deletedStudent.createdBy,
          updatedAt: new Date()
        }

        student = await tx.student.update({
          where: { id: deletedStudent.id },
          data: recoveryData
        })
        isRecoveredStudent = true

      } else {
        console.log('➕ 创建新学生（匿名）')

        // 为匿名注册创建默认的createdBy用户
        const systemUser = await tx.user.findFirst({
          where: { role: 'SUPER_ADMIN' }
        })

        if (!systemUser) {
          throw new BusinessError('系统用户不存在，无法处理匿名注册')
        }

        const studentCode = await generateStudentCode(applicationData.semester, tx)

        // 直接使用前端字段名（无需映射）
        const newStudentData = {
          ...getStudentWritableApplicationData(applicationData),
          currentAddress: applicationData.familyAddress || applicationData.idCardAddress,
          emergencyRelation: applicationData.emergencyRelation || '紧急联系人',
          gender: applicationData.gender === '男' ? 'MALE' as const : 'FEMALE' as const,
          birthDate: new Date(applicationData.birthDate),
          birthday: new Date(applicationData.birthDate),
          studyPeriodStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
          studyPeriodEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
          applicationDate: applicationData.applicationDate ? new Date(applicationData.applicationDate) : new Date(),
          studentCode,
          age: Math.floor((Date.now() - new Date(applicationData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          currentGrade: '一年级',
          enrollmentYear: new Date().getFullYear(),
          enrollmentSemester: currentSemester,
          graduationStatus: 'IN_PROGRESS',
          academicStatus: 'ACTIVE',
          createdBy: systemUser.id
        }

        student = await tx.student.create({
          data: newStudentData
        })
        isNewStudent = true
      }

      const insuranceId = await upsertStudentInsuranceForApplication(tx, student.id, applicationData)
      const enrollmentApplicationId = await createEnrollmentApplicationWithChoices(
        tx,
        student.id,
        applicationData,
        insuranceId,
        'SELF_SERVICE'
      )

      // 为每个课程创建报名记录
      const enrollments = []
      const enrolledCourseNames = [] // 新增：保存成功报名的课程名称

      for (const courseId of applicationData.selectedCourses) {
        const targetCourse = await tx.course.findFirst({
          where: {
            id: courseId,
            isActive: true,
            status: 'PUBLISHED'
          },
          include: {
            enrollments: {
              where: { status: { in: ['PENDING', 'APPROVED'] } },
              select: { id: true }
            }
          }
        })

        if (!targetCourse) {
          throw new ValidationError('课程不存在或已下架，请重新选择课程')
        }

        // 检查课程容量（创建enrollment前的最后检查）
        if (targetCourse.enrollments.length >= targetCourse.maxStudents) {
          console.log(`⚠️ 课程${targetCourse.name}名额已满，跳过`)
          continue
        }

        // 再次检查是否已经有该课程的报名记录
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            studentId: student.id,
            courseId: courseId,
status: { in: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }
          }
        })

        if (existingEnrollment) {
          if (existingEnrollment.status === 'REJECTED' || existingEnrollment.status === 'CANCELLED') {
            // 🔧 修复：REJECTED和CANCELLED状态都允许重新报名
            console.log(`✅ 学生${student.name}的课程${targetCourse.name}状态为${existingEnrollment.status}，已保留历史并记录Phase2申请`)
            continue
          } else {
            console.log(`⚠️ 学生${student.name}已报名课程${targetCourse.name}且状态为${existingEnrollment.status}，跳过重复报名`)
            continue
          }
        }

        const enrollment = await tx.enrollment.create({
          data: {
            enrollmentCode: await generateApplicationCode(),
            studentId: student.id,
            courseId: courseId,
            enrollmentDate: new Date(),
            status: 'PENDING',
            insuranceStart: applicationData.studyPeriodStart ? new Date(applicationData.studyPeriodStart) : null,
            insuranceEnd: applicationData.studyPeriodEnd ? new Date(applicationData.studyPeriodEnd) : null,
            remarks: applicationData.remarks || '',
            createdBy: student.createdBy
          }
        })
        enrollments.push(enrollment)
        enrolledCourseNames.push(targetCourse.name) // 保存课程名称
      }

      return { student, enrollments, enrolledCourseNames, isNewStudent, isRecoveredStudent, enrollmentApplicationId }
    })

    // 记录操作日志
    businessLogger.userAction('ANONYMOUS', 'ANONYMOUS_APPLICATION_SUBMIT_V2', {
      studentId: result.student.id,
      studentName: result.student.name,
      coursesCount: result.enrollments.length,
      semester: applicationData.semester,
      isNewStudent: result.isNewStudent,
      isRecoveredStudent: result.isRecoveredStudent,
      currentGrade: result.student.currentGrade
    })

    const actionType = result.isNewStudent ? '新学生注册' :
                      result.isRecoveredStudent ? '学生信息恢复' : '报名更新'

    if (!hasSuccessfulEnrollmentResult(result)) {
      return res.json({
        success: false,
        code: 400,
        data: {
          student: result.student,
          enrollments: result.enrollments,
          phase2ApplicationId: result.enrollmentApplicationId,
          actionType
        },
        message: `报名失败：所选课程均已满员或不符合条件，请重新选择其他课程`
      })
    }

    // 获取成功报名的课程名称
    const courseNames = result.enrolledCourseNames?.join('、') || '未知课程'
    const submittedChoicesCount = result.enrollments.length || normalizeStringArray(applicationData.selectedClassSections).length || applicationData.selectedCourses.length
    const hasLegacyEnrollmentRows = result.enrollments.length > 0

    res.json({
      success: true,
      code: 200,
      data: {
        student: result.student,
        enrollments: result.enrollments,
        phase2ApplicationId: result.enrollmentApplicationId,
        actionType
      },
      message: hasLegacyEnrollmentRows
        ? `${actionType}成功！已为 ${result.student.name} 报名 ${result.enrollments.length} 门课程：${courseNames}`
        : `${actionType}成功！已提交 ${submittedChoicesCount} 个班次申请，请等待审核`
    })

  } catch (error) {
    console.error('V2匿名报名申请处理失败:', error)
    return next(error)
  }
})

export default router
