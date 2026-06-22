# 恢复 CANCELLED 状态脚本说明

## 📋 概述

此脚本用于恢复之前由 `update-cancelled-to-rejected.js` 脚本错误修改的报名状态。将原本的 `CANCELLED` 状态从 `REJECTED` 恢复回来。

## 🎯 使用场景

当您发现将 `CANCELLED` 状态改为 `REJECTED` 状态导致业务逻辑问题时，可以使用此脚本进行恢复。

## 📁 相关文件

- `restore-rejected-to-cancelled.js` - 恢复脚本
- `update-cancelled-to-rejected.js` - 原始修改脚本
- `README-restore-cancelled-status.md` - 本说明文档

## 🔧 使用方法

### 1. 试运行（推荐先执行）
```bash
cd backend
node scripts/restore-rejected-to-cancelled.js
```

### 2. 实际执行
```bash
cd backend
node scripts/restore-rejected-to-cancelled.js --execute
```

## 🔍 识别机制

脚本通过以下条件识别需要恢复的记录：
- `status = 'REJECTED'`
- `cancelReason = '历史数据状态修正'`

这确保只恢复由之前脚本修改的记录，不影响正常的 `REJECTED` 状态记录。

## 📊 恢复内容

### 修改前（错误状态）
```sql
status: 'REJECTED'
cancelReason: '历史数据状态修正'
```

### 修改后（恢复状态）
```sql
status: 'CANCELLED'
cancelReason: null
updatedAt: 当前时间
```

## ✅ 验证步骤

### 1. 执行前验证
```bash
# 查看需要恢复的记录数量
node scripts/restore-rejected-to-cancelled.js
```

### 2. 执行后验证
脚本会自动显示：
- 恢复的记录数量
- 当前 CANCELLED 状态记录总数
- 剩余未恢复的记录数（应为0）

### 3. 数据库验证
```sql
-- 查看 CANCELLED 状态记录
SELECT COUNT(*) FROM Enrollment WHERE status = 'CANCELLED';

-- 查看剩余的历史修正记录（应为0）
SELECT COUNT(*) FROM Enrollment 
WHERE status = 'REJECTED' AND cancelReason = '历史数据状态修正';
```

## 🚨 注意事项

### ⚠️ 安全提醒
1. **先试运行**: 务必先执行试运行模式查看影响范围
2. **数据备份**: 建议在执行前备份数据库
3. **业务停止**: 建议在业务低峰期执行

### 📝 状态含义
- **CANCELLED**: 因学员删除、系统原因等取消的报名
- **REJECTED**: 正常的报名申请被拒绝

### 🔄 可逆性
- 此脚本操作是可逆的
- 如需再次修改，可重新运行原始脚本

## 📈 执行示例

### 试运行输出示例
```
🔧 批量恢复REJECTED状态为CANCELLED状态脚本
============================================================
⚠️  当前为试运行模式，不会实际修改数据
💡 使用说明:
   - 试运行: node scripts/restore-rejected-to-cancelled.js
   - 实际执行: node scripts/restore-rejected-to-cancelled.js --execute

🔄 开始恢复REJECTED状态为CANCELLED状态...
📋 运行模式: 试运行 (不会实际修改数据)

🔍 正在查询需要恢复的REJECTED状态报名记录...
📊 找到 11 条需要恢复的REJECTED状态报名记录

📈 统计信息:
   总记录数: 11
   涉及学员数: 3
   - 活跃学员: 1
   - 非活跃学员: 2

📅 按学期分布:
   2025年秋季: 4 条记录
   2024年秋季: 7 条记录

👥 涉及的学员详情:
========================================================================================================================
| 序号 | 学员姓名     | 状态   | REJECTED记录数 | 详细课程信息                                    |
========================================================================================================================
|    1 | P301       | 非活跃    |               3 | 书法行书二年级(2025年秋季), 陈式太极(2024年秋季), 乒乓球四班(2024年秋 |
|    2 | 百安美居1      | 活跃     |               5 | 男声合唱团(2025年秋季), 乒乓球二年级(2024年秋季), 乒乓球一年级(2024年 |
|    3 | 苏麒1        | 非活跃    |               3 | 书法楷书一年级(2025年秋季), 书法行书二年级(2025年秋季), 乒乓球四班(202 |
========================================================================================================================

🔍 试运行模式 - 以下是将要执行的恢复操作:
   - 将所有标记为"历史数据状态修正"的REJECTED状态恢复为CANCELLED状态
   - 清除cancelReason字段（设为null）
   - 更新updatedAt时间戳

💡 如需实际执行，请运行:
   node scripts/restore-rejected-to-cancelled.js --execute
```

### 实际执行输出示例
```
🚀 开始执行恢复操作...

✅ 恢复完成！共恢复了 11 条记录

📊 恢复后验证:
   - 当前CANCELLED状态记录数: 11
   - 剩余待恢复的REJECTED记录数: 0

✅ 所有记录已成功恢复！
```

## 🛠️ 故障排除

### 问题1: 找不到需要恢复的记录
**原因**: 可能未执行过原始修改脚本，或记录已被恢复
**解决**: 检查数据库中是否存在 `cancelReason = '历史数据状态修正'` 的记录

### 问题2: 部分记录未恢复
**原因**: 数据库连接问题或权限不足
**解决**: 检查数据库连接和权限设置

### 问题3: 脚本执行失败
**原因**: 可能是数据库约束或其他业务逻辑冲突
**解决**: 查看错误日志，检查数据完整性

## 📞 技术支持

如果在执行过程中遇到问题，请：
1. 保存完整的错误日志
2. 记录执行的具体步骤
3. 提供数据库当前状态信息

## 🔄 相关操作

### 重新执行原始脚本（如需要）
```bash
cd backend
node scripts/update-cancelled-to-rejected.js --execute
```

### 查看所有状态脚本
```bash
ls backend/scripts/*cancelled* backend/scripts/*rejected*
```

---

**创建时间**: 2025-08-22  
**最后更新**: 2025-08-22  
**维护人员**: AI Assistant
