/**
 * 报名申请路由 V2版本
 * @description 支持年级管理的报名申请处理
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import Joi from 'joi'
import { authMiddleware } from '../middleware/auth'
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

const router = Router()
const prisma = new PrismaClient()

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
  semester: Joi.string().required().messages({
    'any.required': '学期为必填项'
  }),
  selectedCourses: Joi.array().items(Joi.string()).min(1).max(2).required().messages({
    'array.min': '请选择至少一门课程',
    'array.max': '最多只能选择2门课程',
    'any.required': '课程选择为必填项'
  }),
  
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

/**
 * 提交报名申请 V2版本（支持年级管理）
 * POST /api/applications-v2
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    console.log('🎯 收到V2报名申请:', req.body)
    
    // 验证输入数据
    const { error, value: applicationData } = applicationV2Schema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    console.log('✅ 数据验证通过')
    
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
                  level: true
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
        console.log(`🔍 找到现有学生: ${existingStudent.name}`)
        
        // 检查现有学生的报名冲突
        const activeEnrollments = existingStudent.enrollments.filter((e: any) => 
          e.status === 'PENDING' || e.status === 'APPROVED'
        )
        
        // 🔧 动态检查课程数量限制（根据学期确定）
        // 获取所选课程的学期信息来确定限制
        let maxCoursesAllowed = 2 // 默认限制
        if (applicationData.selectedCourses.length > 0) {
          // 查询第一门所选课程的学期信息
          const firstSelectedCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { semester: true }
          })
          if (firstSelectedCourse?.semester) {
            maxCoursesAllowed = getMaxCoursesForSemester(firstSelectedCourse.semester)
          }
        }
        
        // 使用动态限制进行验证
        if (activeEnrollments.length + applicationData.selectedCourses.length > maxCoursesAllowed) {
          const semesterNote = maxCoursesAllowed === 3 ? '（2024年秋季特殊政策：最多3门）' : ''
          throw new ValidationError(`您最多只能同时报名${maxCoursesAllowed}门课程${semesterNote}，当前已有${activeEnrollments.length}门课程，无法再报名${applicationData.selectedCourses.length}门`)
        }
        
        for (const courseId of applicationData.selectedCourses) {
          const targetCourse = await tx.course.findUnique({
            where: { id: courseId },
            include: {
              enrollments: {
                where: { status: { in: ['PENDING', 'APPROVED'] } },
                select: { id: true }
              }
            }
          })
          
          if (!targetCourse) continue
          
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
          
          // 2. 检查是否已报名该课程且被拒绝（不能重新报名被拒绝的同一门课程）
          const hasRejectedEnrollment = existingStudent.enrollments.some((enrollment: any) => 
            enrollment.courseId === courseId &&
            enrollment.status === 'REJECTED'
          )
          
          if (hasRejectedEnrollment) {
            throw new ValidationError(`课程"${targetCourse.name}"已被拒绝，无法重新报名。您可以选择报名其他课程`)
          }
          
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
            ...applicationData,
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
            ...applicationData,
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
          ...applicationData,
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
        const studentCode = await generateStudentCode(applicationData.semester)
        
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
          ...applicationData,
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
      
      // 为每个课程创建报名记录
      const enrollments = []
      const enrolledCourseNames = [] // 新增：保存成功报名的课程名称
      
      for (const courseId of applicationData.selectedCourses) {
        const targetCourse = await tx.course.findUnique({
          where: { id: courseId },
          include: {
            enrollments: {
              where: { status: { in: ['PENDING', 'APPROVED'] } },
              select: { id: true }
            }
          }
        })
        
        if (!targetCourse) {
          console.log(`⚠️ 课程${courseId}不存在，跳过`)
          continue
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
            status: { in: ['PENDING', 'APPROVED', 'REJECTED'] }
          }
        })
        
        if (existingEnrollment) {
          if (existingEnrollment.status === 'REJECTED') {
            console.log(`⚠️ 学生${student.name}的课程${targetCourse.name}已被拒绝，无法重新报名同一课程`)
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
      
      return { student, enrollments, enrolledCourseNames, isNewStudent, isRecoveredStudent }
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
    
    // 检查是否有课程成功报名
    if (result.enrollments.length === 0) {
      return res.json({
        success: false,
        code: 400,
        data: {
          student: result.student,
          enrollments: result.enrollments,
          actionType
        },
        message: `报名失败：所选课程均已满员或不符合条件，请重新选择其他课程`
      })
    }
    
    // 获取成功报名的课程名称
    const courseNames = result.enrolledCourseNames?.join('、') || '未知课程'
    
    res.json({
      success: true,
      code: 200,
      data: {
        student: result.student,
        enrollments: result.enrollments,
        actionType
      },
      message: `${actionType}成功！已为 ${result.student.name} 报名 ${result.enrollments.length} 门课程：${courseNames}`
    })
    
  } catch (error) {
    console.error('V2报名申请处理失败:', error)
    return next(error)
  }
})

/**
 * 匿名报名申请 V2版本（支持年级管理）
 * POST /api/applications-v2/anonymous
 */
router.post('/anonymous', async (req, res, next) => {
  try {
    console.log('🎯 收到V2匿名报名申请:', req.body)
    
    // 验证输入数据
    const { error, value: applicationData } = applicationV2Schema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }
    
    console.log('✅ 数据验证通过')
    
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
                  level: true
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
        console.log(`🔍 找到现有学生: ${existingStudent.name}`)
        
        // 检查现有学生的报名冲突
        const activeEnrollments = existingStudent.enrollments.filter((e: any) => 
          e.status === 'PENDING' || e.status === 'APPROVED'
        )
        
        // 🔧 动态检查课程数量限制（根据学期确定）
        // 获取所选课程的学期信息来确定限制
        let maxCoursesAllowed = 2 // 默认限制
        if (applicationData.selectedCourses.length > 0) {
          // 查询第一门所选课程的学期信息
          const firstSelectedCourse = await tx.course.findUnique({
            where: { id: applicationData.selectedCourses[0] },
            select: { semester: true }
          })
          if (firstSelectedCourse?.semester) {
            maxCoursesAllowed = getMaxCoursesForSemester(firstSelectedCourse.semester)
          }
        }
        
        // 使用动态限制进行验证
        if (activeEnrollments.length + applicationData.selectedCourses.length > maxCoursesAllowed) {
          const semesterNote = maxCoursesAllowed === 3 ? '（2024年秋季特殊政策：最多3门）' : ''
          throw new ValidationError(`您最多只能同时报名${maxCoursesAllowed}门课程${semesterNote}，当前已有${activeEnrollments.length}门课程，无法再报名${applicationData.selectedCourses.length}门`)
        }
        
        for (const courseId of applicationData.selectedCourses) {
          const targetCourse = await tx.course.findUnique({
            where: { id: courseId },
            include: {
              enrollments: {
                where: { status: { in: ['PENDING', 'APPROVED'] } },
                select: { id: true }
              }
            }
          })
          
          if (!targetCourse) continue
          
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
          
          // 2. 检查是否已报名该课程且被拒绝（不能重新报名被拒绝的同一门课程）
          const hasRejectedEnrollment = existingStudent.enrollments.some((enrollment: any) => 
            enrollment.courseId === courseId &&
            enrollment.status === 'REJECTED'
          )
          
          if (hasRejectedEnrollment) {
            throw new ValidationError(`课程"${targetCourse.name}"已被拒绝，无法重新报名。您可以选择报名其他课程`)
          }
          
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
          ...applicationData,
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
        
        student = await tx.student.update({
          where: { id: existingStudent.id },
          data: updateData
        })
        
      } else if (deletedStudent) {
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
          ...applicationData,
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
        
        const studentCode = await generateStudentCode(applicationData.semester)
        
        // 直接使用前端字段名（无需映射）
        const newStudentData = {
          ...applicationData,
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
      
      // 为每个课程创建报名记录
      const enrollments = []
      const enrolledCourseNames = [] // 新增：保存成功报名的课程名称
      
      for (const courseId of applicationData.selectedCourses) {
        const targetCourse = await tx.course.findUnique({
          where: { id: courseId },
          include: {
            enrollments: {
              where: { status: { in: ['PENDING', 'APPROVED'] } },
              select: { id: true }
            }
          }
        })
        
        if (!targetCourse) {
          console.log(`⚠️ 课程${courseId}不存在，跳过`)
          continue
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
            status: { in: ['PENDING', 'APPROVED', 'REJECTED'] }
          }
        })
        
        if (existingEnrollment) {
          if (existingEnrollment.status === 'REJECTED') {
            console.log(`⚠️ 学生${student.name}的课程${targetCourse.name}已被拒绝，无法重新报名同一课程`)
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
      
      return { student, enrollments, enrolledCourseNames, isNewStudent, isRecoveredStudent }
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
    
    // 检查是否有课程成功报名
    if (result.enrollments.length === 0) {
      return res.json({
        success: false,
        code: 400,
        data: {
          student: result.student,
          enrollments: result.enrollments,
          actionType
        },
        message: `报名失败：所选课程均已满员或不符合条件，请重新选择其他课程`
      })
    }
    
    // 获取成功报名的课程名称
    const courseNames = result.enrolledCourseNames?.join('、') || '未知课程'
    
    res.json({
      success: true,
      code: 200,
      data: {
        student: result.student,
        enrollments: result.enrollments,
        actionType
      },
      message: `${actionType}成功！已为 ${result.student.name} 报名 ${result.enrollments.length} 门课程：${courseNames}`
    })
    
  } catch (error) {
    console.error('V2匿名报名申请处理失败:', error)
    return next(error)
  }
})

export default router