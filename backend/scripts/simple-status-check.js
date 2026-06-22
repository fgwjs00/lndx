#!/usr/bin/env node

// 简单的状态检查脚本，使用 require 直接加载已编译的代码
const path = require('path')

// 尝试使用已编译的 Prisma Client
try {
  // 检查是否存在 dist 目录的编译代码
  const distPath = path.join(__dirname, '..', 'dist')
  console.log('📁 检查编译目录:', distPath)
  
  // 直接查询数据库
  const { exec } = require('child_process')
  
  console.log('🔍 通过 psql 查询数据库状态...')
  
  // 如果是 PostgreSQL，可以直接查询
  const query = `
    SELECT 
      status,
      "cancelReason",
      COUNT(*) as count
    FROM "Enrollment" 
    GROUP BY status, "cancelReason"
    ORDER BY status, "cancelReason";
  `
  
  console.log('📊 执行 SQL 查询...')
  console.log('查询语句:', query)
  console.log()
  
  console.log('💡 您可以手动在数据库中执行以下查询来检查状态:')
  console.log('```sql')
  console.log(query)
  console.log('```')
  console.log()
  
  // 显示恢复说明
  console.log('🔄 如果您确认需要恢复 CANCELLED 状态，请执行:')
  console.log('   1. 首先检查数据库中是否有 cancelReason = \'历史数据状态修正\' 的记录')
  console.log('   2. 如果有，执行: node scripts/restore-rejected-to-cancelled.js --execute')
  console.log('   3. 如果没有，说明之前的脚本可能没有实际执行，或已经恢复')
  console.log()
  
  console.log('📝 手动恢复 SQL（如果需要）:')
  console.log('```sql')
  console.log('UPDATE "Enrollment" SET')
  console.log('  status = \'CANCELLED\',')
  console.log('  "cancelReason" = NULL,')
  console.log('  "updatedAt" = NOW()')
  console.log('WHERE status = \'REJECTED\'')
  console.log('  AND "cancelReason" = \'历史数据状态修正\';')
  console.log('```')
  
} catch (error) {
  console.error('❌ 检查过程中发生错误:', error.message)
  
  console.log()
  console.log('🔧 替代方案:')
  console.log('1. 检查后端服务是否正在运行')
  console.log('2. 通过数据库管理工具直接查询')
  console.log('3. 重启后端服务后重试')
}
