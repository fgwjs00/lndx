/**
 * 快速筛查政治面貌统计脚本
 * 用于快速查看数据库中各政治面貌的学生数量
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function queryPoliticalStatus() {
  try {
    console.log('🔍 开始查询政治面貌统计...\n');

    // 查询所有活跃学生的政治面貌统计
    const politicalStatusStats = await prisma.student.groupBy({
      by: ['politicalStatus'],
      where: {
        isActive: true,
        politicalStatus: {
          not: null,
          not: ''
        }
      },
      _count: {
        politicalStatus: true
      },
      orderBy: {
        _count: {
          politicalStatus: 'desc'
        }
      }
    });

    console.log('📊 政治面貌统计结果:');
    console.log('='.repeat(50));
    
    let totalCount = 0;
    let partyMemberCount = 0;

    politicalStatusStats.forEach((stat, index) => {
      const status = stat.politicalStatus;
      const count = stat._count.politicalStatus;
      totalCount += count;
      
      // 统计中共党员相关
      if (status && (status.includes('中共党员') || status.includes('党员'))) {
        partyMemberCount += count;
        console.log(`${index + 1}. ${status}: ${count} 人 ⭐ (中共党员相关)`);
      } else {
        console.log(`${index + 1}. ${status}: ${count} 人`);
      }
    });

    console.log('='.repeat(50));
    console.log(`📈 总计: ${totalCount} 人`);
    console.log(`🎯 中共党员总数: ${partyMemberCount} 人`);
    console.log(`📊 中共党员占比: ${((partyMemberCount / totalCount) * 100).toFixed(1)}%`);

    console.log('\n🔍 详细中共党员列表:');
    console.log('-'.repeat(50));

    // 查询所有中共党员的详细信息
    const partyMembers = await prisma.student.findMany({
      where: {
        isActive: true,
        politicalStatus: {
          contains: '中共'
        }
      },
      select: {
        name: true,
        studentCode: true,
        politicalStatus: true,
        major: true,
        semester: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (partyMembers.length > 0) {
      partyMembers.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.studentCode})`);
        console.log(`   政治面貌: ${student.politicalStatus}`);
        console.log(`   专业: ${student.major || '未设置'}`);
        console.log(`   学期: ${student.semester}`);
        console.log(`   入学时间: ${student.createdAt.toLocaleDateString('zh-CN')}`);
        console.log('');
      });
    } else {
      console.log('❌ 未找到中共党员记录');
    }

    // 额外查询：包含"党员"关键字的所有政治面貌
    console.log('\n🔍 包含"党员"关键字的所有学生:');
    console.log('-'.repeat(50));

    const allPartyMembers = await prisma.student.findMany({
      where: {
        isActive: true,
        politicalStatus: {
          contains: '党员'
        }
      },
      select: {
        name: true,
        studentCode: true,
        politicalStatus: true,
        major: true
      },
      orderBy: {
        politicalStatus: 'asc'
      }
    });

    if (allPartyMembers.length > 0) {
      allPartyMembers.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.studentCode}) - ${student.politicalStatus}`);
      });
    } else {
      console.log('❌ 未找到包含"党员"的记录');
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行查询
queryPoliticalStatus();
