/**
 * 备份软删除学员数据脚本
 * 在永久删除前备份软删除学员的所有相关数据
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

/**
 * 备份软删除学员数据
 */
async function backupSoftDeletedStudents() {
  try {
    console.log('🔍 正在查找软删除的学员数据...\n')
    
    // 查找所有软删除的学员及其完整数据
    const softDeletedStudents = await prisma.student.findMany({
      where: {
        isActive: false
      },
      include: {
        enrollments: {
          include: {
            course: true
          }
        },
        attendances: {
          include: {
            course: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { name: 'asc' }
      ]
    })

    if (softDeletedStudents.length === 0) {
      console.log('✅ 没有找到软删除的学员数据需要备份')
      return
    }

    console.log(`📊 找到 ${softDeletedStudents.length} 个软删除学员，开始备份...\n`)

    // 创建备份目录
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // 生成备份文件名（包含时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupFileName = `soft-deleted-students-backup-${timestamp}.json`
    const backupFilePath = path.join(backupDir, backupFileName)

    // 准备备份数据
    const backupData = {
      backupInfo: {
        createdAt: new Date().toISOString(),
        description: '软删除学员数据备份',
        totalStudents: softDeletedStudents.length,
        totalEnrollments: softDeletedStudents.reduce((sum, s) => sum + (s.enrollments?.length || 0), 0),
        totalAttendances: softDeletedStudents.reduce((sum, s) => sum + (s.attendances?.length || 0), 0)
      },
      students: softDeletedStudents.map(student => ({
        // 学员基本信息
        student: {
          id: student.id,
          name: student.name,
          gender: student.gender,
          birthDate: student.birthDate,
          ethnicity: student.ethnicity,
          idNumber: student.idNumber,
          idCardAddress: student.idCardAddress,
          contactPhone: student.contactPhone,
          familyAddress: student.familyAddress,
          educationLevel: student.educationLevel,
          politicalStatus: student.politicalStatus,
          healthStatus: student.healthStatus,
          emergencyContact: student.emergencyContact,
          emergencyPhone: student.emergencyPhone,
          emergencyRelation: student.emergencyRelation,
          insuranceCompany: student.insuranceCompany,
          retirementCategory: student.retirementCategory,
          studyPeriodStart: student.studyPeriodStart,
          studyPeriodEnd: student.studyPeriodEnd,
          isRetired: student.isRetired,
          agreementSigned: student.agreementSigned,
          studentId: student.studentId,
          photo: student.photo,
          idCardFront: student.idCardFront,
          idCardBack: student.idCardBack,
          remarks: student.remarks,
          isActive: student.isActive,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        },
        // 报名记录
        enrollments: student.enrollments?.map(enrollment => ({
          id: enrollment.id,
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          status: enrollment.status,
          enrollmentDate: enrollment.enrollmentDate,
          approvedAt: enrollment.approvedAt,
          cancelReason: enrollment.cancelReason,
          cancelledAt: enrollment.cancelledAt,
          createdAt: enrollment.createdAt,
          updatedAt: enrollment.updatedAt,
          course: {
            id: enrollment.course.id,
            name: enrollment.course.name,
            description: enrollment.course.description,
            semester: enrollment.course.semester,
            level: enrollment.course.level,
            teacher: enrollment.course.teacher,
            maxStudents: enrollment.course.maxStudents,
            location: enrollment.course.location,
            startDate: enrollment.course.startDate,
            endDate: enrollment.course.endDate,
            status: enrollment.course.status
          }
        })) || [],
        // 考勤记录
        attendances: student.attendances?.map(attendance => ({
          id: attendance.id,
          studentId: attendance.studentId,
          courseId: attendance.courseId,
          attendanceDate: attendance.attendanceDate,
          status: attendance.status,
          remarks: attendance.remarks,
          createdAt: attendance.createdAt,
          updatedAt: attendance.updatedAt,
          course: {
            id: attendance.course.id,
            name: attendance.course.name,
            semester: attendance.course.semester,
            level: attendance.course.level
          }
        })) || []
      }))
    }

    // 写入备份文件
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')

    console.log('✅ 备份完成！')
    console.log()
    console.log('📂 备份文件信息:')
    console.log(`   文件路径: ${backupFilePath}`)
    console.log(`   文件大小: ${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB`)
    console.log()
    console.log('📊 备份数据统计:')
    console.log(`   学员数量: ${backupData.backupInfo.totalStudents}`)
    console.log(`   报名记录: ${backupData.backupInfo.totalEnrollments}`)
    console.log(`   考勤记录: ${backupData.backupInfo.totalAttendances}`)
    console.log()
    console.log('🔐 备份数据包含:')
    console.log('   ✓ 学员完整个人信息')
    console.log('   ✓ 所有报名记录及课程信息')
    console.log('   ✓ 所有考勤记录及课程信息')
    console.log('   ✓ 创建和更新时间戳')
    console.log()
    console.log('💡 提示: 请妥善保存此备份文件，以备数据恢复需要')

    return backupFilePath

  } catch (error) {
    console.error('❌ 备份软删除学员数据时出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  backupSoftDeletedStudents().catch(error => {
    console.error('备份脚本执行失败:', error)
    process.exit(1)
  })
}

module.exports = { backupSoftDeletedStudents }
