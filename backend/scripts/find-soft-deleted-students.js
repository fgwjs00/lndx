/**
 * 查找学员脚本
 * 用于查找数据库中的学员信息
 * 支持通过名字或身份证号搜索
 * 支持查询所有学员或仅软删除学员
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findStudents(searchTerm = null, onlyDeleted = false) {
  try {
    let whereCondition = {}
    
    // 根据查询类型设置基础条件
    if (onlyDeleted) {
      whereCondition.isActive = false  // 仅软删除学员
    }
    // 如果不指定onlyDeleted，则查询所有学员（包括活跃和软删除的）
    
    // 如果提供了搜索条件，添加名字或身份证号的模糊匹配
    if (searchTerm) {
      const searchCondition = {
        OR: [
          {
            name: {
              contains: searchTerm
            }
          },
          {
            idNumber: {
              contains: searchTerm
            }
          }
        ]
      }
      
      if (onlyDeleted) {
        console.log(`🔍 正在查找软删除的学员 (搜索: "${searchTerm}")...\n`)
        whereCondition = {
          isActive: false,
          ...searchCondition
        }
      } else {
        console.log(`🔍 正在查找所有学员 (搜索: "${searchTerm}")...\n`)
        whereCondition = searchCondition
      }
    } else {
      if (onlyDeleted) {
        console.log('🔍 正在查找所有软删除的学员...\n')
      } else {
        console.log('🔍 正在查找所有学员...\n')
      }
    }
    
    // 查找学员
    const students = await prisma.student.findMany({
      where: whereCondition,
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
            attendanceDate: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },  // 按更新时间倒序
        { name: 'asc' }         // 同时间按姓名正序
      ]
    })

    if (students.length === 0) {
      if (searchTerm) {
        const studentType = onlyDeleted ? '软删除学员' : '学员'
        console.log(`❌ 没有找到匹配 "${searchTerm}" 的${studentType}`)
        console.log('💡 建议:')
        console.log('   1. 检查搜索条件是否正确')
        console.log('   2. 尝试使用部分姓名或身份证号')
        if (onlyDeleted) {
          console.log('   3. 运行 "node find-soft-deleted-students.js --deleted" 查看所有软删除学员')
          console.log('   4. 运行 "node find-soft-deleted-students.js" 查看所有学员')
        } else {
          console.log('   3. 运行 "node find-soft-deleted-students.js" 查看所有学员')
        }
      } else {
        const studentType = onlyDeleted ? '软删除的学员' : '学员'
        console.log(`✅ 没有找到${studentType}`)
      }
      return
    }

    const studentType = onlyDeleted ? '软删除的学员' : '学员'
    console.log(`📊 找到 ${students.length} 个${studentType}:\n`)
    console.log('=' .repeat(130))
    console.log('| 序号 | 学员ID                               | 姓名     | 身份证号           | 联系电话     | 状态 | 报名数 | 考勤数 | 更新时间          |')
    console.log('=' .repeat(130))

    students.forEach((student, index) => {
      const enrollmentCount = student.enrollments?.length || 0
      const attendanceCount = student.attendances?.length || 0
      const updatedAt = student.updatedAt ? student.updatedAt.toLocaleString('zh-CN') : '未知'
      const status = student.isActive ? '正常' : '已删除'
      
      console.log(`| ${String(index + 1).padStart(4)} | ${student.id} | ${student.name.padEnd(8)} | ${student.idNumber.padEnd(18)} | ${(student.contactPhone || '无').padEnd(11)} | ${status.padEnd(4)} | ${String(enrollmentCount).padStart(6)} | ${String(attendanceCount).padStart(6)} | ${updatedAt} |`)
    })
    
    console.log('=' .repeat(130))
    console.log()

    // 显示详细信息
    console.log('📋 详细信息:\n')
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      const status = student.isActive ? '正常' : '已删除'
      console.log(`${i + 1}. 学员: ${student.name} (${student.id}) [${status}]`)
      console.log(`   身份证号: ${student.idNumber}`)
      console.log(`   联系电话: ${student.contactPhone || '无'}`)
      console.log(`   现居住地址: ${student.familyAddress || '无'}`)
      console.log(`   更新时间: ${student.updatedAt ? student.updatedAt.toLocaleString('zh-CN') : '未知'}`)
      
      if (student.enrollments && student.enrollments.length > 0) {
        console.log(`   报名课程 (${student.enrollments.length}门):`)
        student.enrollments.forEach((enrollment, idx) => {
          console.log(`     ${idx + 1}) ${enrollment.course.name} - ${enrollment.course.level || '无等级'} (${enrollment.course.semester}) [${enrollment.status}]`)
        })
      } else {
        console.log(`   报名课程: 无`)
      }
      
      if (student.attendances && student.attendances.length > 0) {
        console.log(`   考勤记录: ${student.attendances.length} 条`)
      } else {
        console.log(`   考勤记录: 无`)
      }
      
      console.log()
    }

    // 统计信息
    const totalEnrollments = students.reduce((sum, student) => sum + (student.enrollments?.length || 0), 0)
    const totalAttendances = students.reduce((sum, student) => sum + (student.attendances?.length || 0), 0)
    const activeStudents = students.filter(s => s.isActive).length
    const deletedStudents = students.filter(s => !s.isActive).length
    
    console.log('📈 统计信息:')
    if (onlyDeleted) {
      console.log(`   软删除学员总数: ${students.length}`)
    } else {
      console.log(`   学员总数: ${students.length}`)
      console.log(`   正常学员: ${activeStudents}`)
      console.log(`   软删除学员: ${deletedStudents}`)
    }
    console.log(`   相关报名记录总数: ${totalEnrollments}`)
    console.log(`   相关考勤记录总数: ${totalAttendances}`)
    console.log()
    
    if (onlyDeleted || deletedStudents > 0) {
      console.log('⚠️  注意事项:')
      console.log('   1. 软删除学员已被标记为 (isActive = false)')
      console.log('   2. 完全删除将永久移除学员及所有相关数据')
      console.log('   3. 删除后无法恢复，请谨慎操作')
      console.log('   4. 建议先备份相关数据')
      console.log()
    }
    
    console.log('🔧 下一步操作:')
    console.log('   1. 查看所有学员: node scripts/find-soft-deleted-students.js')
    console.log('   2. 查看软删除学员: node scripts/find-soft-deleted-students.js --deleted')
    console.log('   3. 搜索学员: node scripts/find-soft-deleted-students.js <姓名或身份证号>')
    console.log('   4. 搜索软删除学员: node scripts/find-soft-deleted-students.js <姓名或身份证号> --deleted')
    if (deletedStudents > 0) {
      console.log('   5. 备份数据(推荐): node scripts/backup-soft-deleted-students.js')
      console.log('   6. 永久删除学员: node scripts/delete-students-permanently.js <学员ID1> <学员ID2> ...')
    }
    console.log()

  } catch (error) {
    console.error('❌ 查找软删除学员时出错:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  // 获取命令行参数
  const args = process.argv.slice(2)
  let searchTerm = null
  let onlyDeleted = false
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--deleted') {
      onlyDeleted = true
    } else if (!searchTerm) {
      searchTerm = args[i]
    }
  }
  
  if (searchTerm) {
    const scope = onlyDeleted ? '软删除学员' : '所有学员'
    console.log(`📝 使用搜索条件: "${searchTerm}" (范围: ${scope})`)
    console.log('💡 提示: 支持姓名或身份证号的模糊匹配\n')
  } else {
    const scope = onlyDeleted ? '所有软删除学员' : '所有学员'
    console.log(`💡 查询范围: ${scope}`)
    console.log('💡 使用说明:')
    console.log('   - node find-soft-deleted-students.js                    # 查看所有学员')
    console.log('   - node find-soft-deleted-students.js --deleted         # 查看软删除学员')
    console.log('   - node find-soft-deleted-students.js 张三              # 搜索学员')
    console.log('   - node find-soft-deleted-students.js 张三 --deleted    # 搜索软删除学员')
    console.log()
  }
  
  findStudents(searchTerm, onlyDeleted)
}

module.exports = { findStudents }
