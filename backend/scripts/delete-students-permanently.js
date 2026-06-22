/**
 * 永久删除学员脚本
 * 用于彻底删除指定的软删除学员及其所有相关数据
 * 
 * 使用方法:
 * node scripts/delete-students-permanently.js <学员ID1> <学员ID2> ...
 * 
 * 示例:
 * node scripts/delete-students-permanently.js uuid1 uuid2 uuid3
 */

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

// 创建命令行交互接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

/**
 * 询问用户确认
 */
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim())
    })
  })
}

/**
 * 验证学员ID格式（UUID）
 */
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * 永久删除指定学员
 */
async function deleteStudentsPermanently(studentIds) {
  try {
    console.log('🔍 正在验证要删除的学员...\n')
    
    // 验证学员ID格式
    const invalidIds = studentIds.filter(id => !isValidUUID(id))
    if (invalidIds.length > 0) {
      console.error('❌ 以下学员ID格式无效:')
      invalidIds.forEach(id => console.error(`   ${id}`))
      process.exit(1)
    }
    
    // 查找指定的学员（只查找软删除的）
    const studentsToDelete = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        isActive: false  // 只能删除软删除的学员
      },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                name: true,
                semester: true,
                level: true
              }
            }
          }
        },
        attendances: {
          select: {
            id: true,
            attendanceDate: true,
            course: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // 检查是否找到所有指定的学员
    const foundIds = studentsToDelete.map(s => s.id)
    const notFoundIds = studentIds.filter(id => !foundIds.includes(id))
    
    if (notFoundIds.length > 0) {
      console.error('❌ 以下学员ID未找到或不是软删除状态:')
      notFoundIds.forEach(id => console.error(`   ${id}`))
      
      if (studentsToDelete.length === 0) {
        console.error('\n没有找到可删除的学员，退出操作')
        process.exit(1)
      }
      
      console.log('\n⚠️  将继续删除找到的学员...\n')
    }

    if (studentsToDelete.length === 0) {
      console.log('✅ 没有找到符合条件的学员')
      return
    }

    // 显示要删除的学员信息
    console.log(`📋 即将永久删除以下 ${studentsToDelete.length} 个学员:\n`)
    console.log('=' .repeat(100))
    console.log('| 序号 | 学员ID                               | 姓名     | 身份证号           | 报名数 | 考勤数 |')
    console.log('=' .repeat(100))

    let totalEnrollments = 0
    let totalAttendances = 0

    studentsToDelete.forEach((student, index) => {
      const enrollmentCount = student.enrollments?.length || 0
      const attendanceCount = student.attendances?.length || 0
      totalEnrollments += enrollmentCount
      totalAttendances += attendanceCount
      
      console.log(`| ${String(index + 1).padStart(4)} | ${student.id} | ${student.name.padEnd(8)} | ${student.idNumber.padEnd(18)} | ${String(enrollmentCount).padStart(6)} | ${String(attendanceCount).padStart(6)} |`)
    })
    
    console.log('=' .repeat(100))
    console.log()

    // 显示详细的删除影响
    console.log('🗑️  删除影响:')
    console.log(`   将删除 ${studentsToDelete.length} 个学员记录`)
    console.log(`   将删除 ${totalEnrollments} 个报名记录`)
    console.log(`   将删除 ${totalAttendances} 个考勤记录`)
    console.log()

    // 显示每个学员的详细信息
    console.log('📋 详细信息:')
    studentsToDelete.forEach((student, index) => {
      console.log(`\n${index + 1}. ${student.name} (${student.id})`)
      console.log(`   身份证号: ${student.idNumber}`)
      console.log(`   联系电话: ${student.contactPhone || '无'}`)
      
      if (student.enrollments && student.enrollments.length > 0) {
        console.log(`   报名课程 (${student.enrollments.length}门):`)
        student.enrollments.forEach((enrollment, idx) => {
          console.log(`     ${idx + 1}) ${enrollment.course.name} - ${enrollment.course.level || '无等级'} (${enrollment.course.semester}) [${enrollment.status}]`)
        })
      }
      
      if (student.attendances && student.attendances.length > 0) {
        console.log(`   考勤记录: ${student.attendances.length} 条`)
      }
    })

    console.log('\n⚠️  警告: 此操作将永久删除以上数据，无法恢复！')
    console.log('⚠️  建议在执行前先备份数据库！')
    
    // 第一次确认
    const firstConfirm = await askConfirmation('\n确定要永久删除这些学员吗？(输入 yes 确认): ')
    if (firstConfirm !== 'yes') {
      console.log('❌ 操作已取消')
      process.exit(0)
    }

    // 第二次确认
    const secondConfirm = await askConfirmation('\n⚠️  最后确认：这将永久删除数据且无法恢复！确定继续吗？(输入 DELETE 确认): ')
    if (secondConfirm !== 'delete') {
      console.log('❌ 操作已取消')
      process.exit(0)
    }

    console.log('\n🗑️  开始执行永久删除操作...\n')

    // 使用事务执行删除操作
    const result = await prisma.$transaction(async (tx) => {
      const deletionResults = []

      for (const student of studentsToDelete) {
        console.log(`正在删除学员: ${student.name} (${student.id})...`)
        
        // 1. 删除考勤记录
        const deletedAttendances = await tx.attendance.deleteMany({
          where: { studentId: student.id }
        })
        console.log(`  ✅ 删除考勤记录: ${deletedAttendances.count} 条`)

        // 2. 删除报名记录
        const deletedEnrollments = await tx.enrollment.deleteMany({
          where: { studentId: student.id }
        })
        console.log(`  ✅ 删除报名记录: ${deletedEnrollments.count} 条`)

        // 3. 删除学员记录
        const deletedStudent = await tx.student.delete({
          where: { id: student.id }
        })
        console.log(`  ✅ 删除学员记录: ${deletedStudent.name}`)

        deletionResults.push({
          studentId: student.id,
          studentName: student.name,
          deletedAttendances: deletedAttendances.count,
          deletedEnrollments: deletedEnrollments.count
        })
      }

      return deletionResults
    })

    console.log('\n🎉 删除操作完成！')
    console.log('\n📊 删除结果汇总:')
    console.log('=' .repeat(80))
    console.log('| 学员姓名 | 学员ID                               | 报名数 | 考勤数 |')
    console.log('=' .repeat(80))
    
    result.forEach(item => {
      console.log(`| ${item.studentName.padEnd(8)} | ${item.studentId} | ${String(item.deletedEnrollments).padStart(6)} | ${String(item.deletedAttendances).padStart(6)} |`)
    })
    
    console.log('=' .repeat(80))
    console.log(`总计删除: ${result.length} 个学员, ${result.reduce((sum, r) => sum + r.deletedEnrollments, 0)} 个报名, ${result.reduce((sum, r) => sum + r.deletedAttendances, 0)} 个考勤记录`)
    console.log()
    
    console.log('✅ 所有指定学员已永久删除')

  } catch (error) {
    console.error('❌ 删除学员时出错:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('❌ 请提供要删除的学员ID')
    console.log('\n使用方法:')
    console.log('  node scripts/delete-students-permanently.js <学员ID1> <学员ID2> ...')
    console.log('\n示例:')
    console.log('  node scripts/delete-students-permanently.js uuid1 uuid2 uuid3')
    console.log('\n提示: 先运行 find-soft-deleted-students.js 查看可删除的学员')
    process.exit(1)
  }

  console.log('🗑️  永久删除学员脚本')
  console.log('=' .repeat(50))
  console.log(`要删除的学员ID数量: ${args.length}`)
  console.log(`学员ID列表: ${args.join(', ')}`)
  console.log()

  await deleteStudentsPermanently(args)
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })
}

module.exports = { deleteStudentsPermanently }
