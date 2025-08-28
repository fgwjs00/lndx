/**
 * 检查所有学员数据和状态
 * 查找数据库有但学生管理中看不到的学员记录
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllStudents() {
  try {
    console.log('🔍 开始检查所有学员数据和状态...\n');
    
    // 1. 查询所有学生记录
    console.log('📊 1. 查询所有学生记录 (student表)');
    console.log('='.repeat(60));
    
    const allStudents = await prisma.student.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        enrollments: {
          include: {
            course: true
          }
        }
      }
    });
    
    console.log(`✅ 数据库中总学生记录: ${allStudents.length} 条`);
    
    // 按状态分类统计
    const studentsWithEnrollments = allStudents.filter(s => s.enrollments && s.enrollments.length > 0);
    const studentsWithoutEnrollments = allStudents.filter(s => !s.enrollments || s.enrollments.length === 0);
    
    console.log(`👤 有选课记录的学生: ${studentsWithEnrollments.length} 条`);
    console.log(`⚠️  无选课记录的学生: ${studentsWithoutEnrollments.length} 条`);
    
    console.log('\n最近创建的学生 (前10条):');
    allStudents.slice(0, 10).forEach((student, index) => {
      const enrollmentCount = student.enrollments ? student.enrollments.length : 0;
      const latestEnrollment = student.enrollments && student.enrollments.length > 0 
        ? student.enrollments[student.enrollments.length - 1] 
        : null;
      
      console.log(`${index + 1}. ${student.name} (${student.studentCode || '无编号'}) - ${student.contactPhone || student.phone || '无手机'} - 学期: ${student.semester || '无'} - 选课: ${enrollmentCount}门 ${latestEnrollment ? `(最新: ${latestEnrollment.status})` : ''} - 创建: ${student.createdAt.toLocaleString('zh-CN')}`);
    });
    
    if (studentsWithoutEnrollments.length > 0) {
      console.log('\n⚠️  无选课记录的学生列表:');
      studentsWithoutEnrollments.slice(0, 20).forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.studentCode || '无编号'}) - ${student.contactPhone || student.phone || '无手机'} - 身份证: ${student.idNumber || '无'} - 创建: ${student.createdAt.toLocaleString('zh-CN')}`);
      });
      if (studentsWithoutEnrollments.length > 20) {
        console.log(`... 还有 ${studentsWithoutEnrollments.length - 20} 条记录`);
      }
    }
    
    // 2. 跳过申请记录查询 (该表不存在于当前schema)
    console.log('\n📊 2. 申请记录查询已跳过 (application表不存在于当前数据库schema)');
    console.log('='.repeat(60));
    console.log('ℹ️  当前数据库使用Student表直接管理学生信息，无独立的申请审核流程');
    
    // 3. 查询所有选课记录
    console.log('\n📊 3. 查询所有选课记录 (enrollment表)');
    console.log('='.repeat(60));
    
    const allEnrollments = await prisma.enrollment.findMany({
      include: {
        student: true,
        course: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ 数据库中总选课记录: ${allEnrollments.length} 条`);
    
    // 按状态统计选课记录
    const approvedEnrollments = allEnrollments.filter(e => e.status === 'APPROVED');
    const pendingEnrollments = allEnrollments.filter(e => e.status === 'PENDING');
    const rejectedEnrollments = allEnrollments.filter(e => e.status === 'REJECTED');
    
    console.log(`✅ 已通过选课: ${approvedEnrollments.length} 条`);
    console.log(`⏳ 待审核选课: ${pendingEnrollments.length} 条`);
    console.log(`❌ 已拒绝选课: ${rejectedEnrollments.length} 条`);
    
    console.log('\n最近的选课记录 (前10条):');
    allEnrollments.slice(0, 10).forEach((enrollment, index) => {
      console.log(`${index + 1}. ${enrollment.student?.name || '未知'} (${enrollment.student?.studentCode || '无编号'}) - 课程: ${enrollment.course?.name || '未知'} - 学期: ${enrollment.course?.semester || '无'} - 状态: ${enrollment.status} - 创建: ${enrollment.createdAt.toLocaleString('zh-CN')}`);
    });
    
    // 4. 🔍 核心问题检查: 数据库有但学生管理中看不到的学员
    console.log('\n🔍 4. 核心问题检查: 为什么有些学员在学生管理中看不到？');
    console.log('='.repeat(60));
    
    // 直接分析学生记录，不依赖application表
    console.log('分析: 学生管理页面通常只显示有APPROVED状态选课记录的学生');
    console.log('因此，没有选课记录或只有非APPROVED状态选课的学生可能看不到');
    
    // 检查有学生记录但选课状态不是APPROVED的情况
    console.log('\n🔍 检查学生的选课状态分布:');
    const studentEnrollmentStatus = {};
    allStudents.forEach(student => {
      const enrollments = student.enrollments || [];
      if (enrollments.length === 0) {
        studentEnrollmentStatus['无选课'] = (studentEnrollmentStatus['无选课'] || 0) + 1;
      } else {
        const statuses = [...new Set(enrollments.map(e => e.status))];
        const statusKey = statuses.join(',');
        studentEnrollmentStatus[statusKey] = (studentEnrollmentStatus[statusKey] || 0) + 1;
      }
    });
    
    console.log('学生选课状态分布:');
    Object.entries(studentEnrollmentStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 个学生`);
    });
    
    // 检查只有PENDING或REJECTED状态选课的学生
    const studentsWithOnlyNonApprovedEnrollments = allStudents.filter(student => {
      const enrollments = student.enrollments || [];
      if (enrollments.length === 0) return false;
      return enrollments.every(e => e.status !== 'APPROVED');
    });
    
    if (studentsWithOnlyNonApprovedEnrollments.length > 0) {
      console.log(`\n⚠️  有 ${studentsWithOnlyNonApprovedEnrollments.length} 个学生只有待审核或已拒绝的选课记录 (可能在学生管理中看不到):`);
      studentsWithOnlyNonApprovedEnrollments.slice(0, 10).forEach((student, index) => {
        const enrollmentStatuses = student.enrollments.map(e => e.status).join(',');
        console.log(`${index + 1}. ${student.name} (${student.studentCode || '无编号'}) - 选课状态: ${enrollmentStatuses} - 学期: ${student.semester || '无'}`);
      });
      if (studentsWithOnlyNonApprovedEnrollments.length > 10) {
        console.log(`... 还有 ${studentsWithOnlyNonApprovedEnrollments.length - 10} 个学生`);
      }
    }
    
    // 5. 学生数据完整性检查
    console.log('\n🔍 5. 学生数据完整性检查');
    console.log('='.repeat(60));
    
    // 检查缺失关键字段的学生
    const studentsWithMissingFields = [];
    allStudents.forEach(student => {
      const issues = [];
      if (!student.name || student.name.trim() === '') issues.push('姓名为空');
      if (!student.contactPhone && !student.phone) issues.push('无联系方式');
      if (!student.idNumber) issues.push('无身份证号');
      if (!student.semester) issues.push('无学期信息');
      
      if (issues.length > 0) {
        studentsWithMissingFields.push({ student, issues });
      }
    });
    
    if (studentsWithMissingFields.length > 0) {
      console.log(`⚠️  发现 ${studentsWithMissingFields.length} 个学生存在数据不完整问题:`);
      studentsWithMissingFields.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ${item.student.name || '未知姓名'} (${item.student.studentCode || '无编号'}) - 问题: ${item.issues.join(', ')} - 创建: ${item.student.createdAt.toLocaleString('zh-CN')}`);
      });
      if (studentsWithMissingFields.length > 10) {
        console.log(`... 还有 ${studentsWithMissingFields.length - 10} 个学生存在数据问题`);
      }
    } else {
      console.log('✅ 所有学生的关键数据字段都完整');
    }
    
    // 6. 检查学生管理API的查询逻辑
    console.log('\n🔍 6. 模拟学生管理页面的查询逻辑');
    console.log('='.repeat(60));
    
    // 模拟学生管理页面的查询: 只查询有APPROVED选课记录的学生
    const studentsInManagement = await prisma.student.findMany({
      where: {
        enrollments: {
          some: {
            status: 'APPROVED'
          }
        }
      },
      include: {
        enrollments: {
          where: {
            status: 'APPROVED'
          },
          include: {
            course: true
          }
        }
      }
    });
    
    console.log(`📋 学生管理页面应该显示的学生数量: ${studentsInManagement.length} 个`);
    console.log(`📊 数据库中总学生数量: ${allStudents.length} 个`);
    console.log(`⚠️  差异: ${allStudents.length - studentsInManagement.length} 个学生在学生管理中看不到`);
    
    // 分析看不到的学生原因
    const invisibleStudents = allStudents.filter(student => 
      !studentsInManagement.some(mgmtStudent => mgmtStudent.id === student.id)
    );
    
    console.log('\n分析看不到的学生原因:');
    const reasonStats = {
      '无选课记录': 0,
      '只有待审核选课': 0,
      '只有已拒绝选课': 0,
      '混合状态选课': 0
    };
    
    invisibleStudents.forEach(student => {
      const enrollments = student.enrollments || [];
      if (enrollments.length === 0) {
        reasonStats['无选课记录']++;
      } else {
        const statuses = enrollments.map(e => e.status);
        const hasApproved = statuses.includes('APPROVED');
        const hasPending = statuses.includes('PENDING');
        const hasRejected = statuses.includes('REJECTED');
        
        if (!hasApproved) {
          if (hasPending && !hasRejected) {
            reasonStats['只有待审核选课']++;
          } else if (hasRejected && !hasPending) {
            reasonStats['只有已拒绝选课']++;
          } else {
            reasonStats['混合状态选课']++;
          }
        }
      }
    });
    
    Object.entries(reasonStats).forEach(([reason, count]) => {
      if (count > 0) {
        console.log(`  ${reason}: ${count} 个学生`);
      }
    });
    
    // 7. 检查重复数据
    console.log('\n🔍 7. 检查重复数据');
    console.log('='.repeat(60));
    
    // 检查重复的身份证号
    const allIdNumbers = allStudents.map(s => s.idNumber).filter(Boolean);
    const duplicateIds = [...new Set(allIdNumbers.filter((id, index) => allIdNumbers.indexOf(id) !== index))];
    
    if (duplicateIds.length > 0) {
      console.log(`⚠️  发现重复身份证号: ${duplicateIds.length} 个`);
      for (const idNumber of duplicateIds.slice(0, 5)) {
        const duplicateStudents = allStudents.filter(s => s.idNumber === idNumber);
        console.log(`  身份证 ${idNumber}: ${duplicateStudents.map(s => `${s.name}(${s.studentCode || '无编号'})`).join(', ')}`);
      }
    }
    
    // 检查重复的手机号 (检查所有手机号字段)
    const allPhones = [];
    allStudents.forEach(s => {
      if (s.contactPhone) allPhones.push(s.contactPhone);
      if (s.phone && s.phone !== s.contactPhone) allPhones.push(s.phone);
    });
    const duplicatePhones = [...new Set(allPhones.filter((phone, index) => allPhones.indexOf(phone) !== index))];
    
    if (duplicatePhones.length > 0) {
      console.log(`⚠️  发现重复手机号: ${duplicatePhones.length} 个`);
      for (const phone of duplicatePhones.slice(0, 5)) {
        const duplicateStudents = allStudents.filter(s => s.contactPhone === phone || s.phone === phone);
        console.log(`  手机号 ${phone}: ${duplicateStudents.map(s => `${s.name}(${s.studentCode || '无编号'})`).join(', ')}`);
      }
    }
    
    if (duplicateIds.length === 0 && duplicatePhones.length === 0) {
      console.log('✅ 没有发现重复的身份证号或手机号');
    }
    
    // 8. 数据统计汇总
    console.log('\n📈 8. 完整数据统计汇总');
    console.log('='.repeat(60));
    console.log(`👤 学生记录总数: ${allStudents.length} 条`);
    console.log(`  - 有选课记录: ${studentsWithEnrollments.length} 条`);
    console.log(`  - 无选课记录: ${studentsWithoutEnrollments.length} 条`);
    console.log(`  - 数据不完整: ${studentsWithMissingFields.length} 条`);
    console.log(`📚 选课记录总数: ${allEnrollments.length} 条`);
    console.log(`  - 已通过: ${approvedEnrollments.length} 条`);
    console.log(`  - 待审核: ${pendingEnrollments.length} 条`);
    console.log(`  - 已拒绝: ${rejectedEnrollments.length} 条`);
    console.log(`🖥️  学生管理页面应显示: ${studentsInManagement.length} 个学生`);
    console.log(`❓ 在数据库但管理页面看不到: ${allStudents.length - studentsInManagement.length} 个学生`);
    
    console.log('\n🏁 检查完成！');
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行检查
checkAllStudents();
