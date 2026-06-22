# CANCELLED状态更新脚本使用说明

## 📋 脚本概述

`update-cancelled-to-rejected.js` 脚本用于批量将所有 `CANCELLED` 状态的报名记录更改为 `REJECTED` 状态，清理历史遗留数据。

## 🎯 使用背景

在2025年8月22日之前，系统在软删除学员时会将相关的报名记录状态设置为 `CANCELLED`。为了统一数据状态管理，现在需要将这些历史的 `CANCELLED` 记录更改为 `REJECTED` 状态。

## 🚀 使用方法

### 1. 试运行模式（推荐先执行）

```bash
# 进入后端目录
cd backend

# 试运行，查看将要更新的数据
node scripts/update-cancelled-to-rejected.js
```

**试运行模式特点**：
- ✅ 不会修改任何数据
- ✅ 显示详细的统计信息
- ✅ 列出所有将要更新的记录
- ✅ 安全预览更新操作

### 2. 实际执行模式

```bash
# 实际执行更新操作
node scripts/update-cancelled-to-rejected.js --execute

# 或使用简短参数
node scripts/update-cancelled-to-rejected.js -e
```

**实际执行模式特点**：
- ⚠️ 会实际修改数据库数据
- ✅ 执行完整的数据更新操作
- ✅ 提供更新结果验证
- ⚠️ 操作不可逆，请谨慎使用

## 📊 脚本功能

### 数据统计
- 统计所有 `CANCELLED` 状态的报名记录数量
- 按学员分组显示详细信息
- 按学期分布统计
- 区分活跃和非活跃学员

### 数据更新
- 将 `status` 从 `CANCELLED` 更改为 `REJECTED`
- 设置 `cancelReason` 为 "历史数据状态修正：由CANCELLED更改为REJECTED"
- 更新 `updatedAt` 时间戳

### 结果验证
- 验证更新后的记录数量
- 检查剩余的 `CANCELLED` 记录
- 确认新增的 `REJECTED` 记录

## 📋 输出示例

### 试运行输出
```
🔧 批量更新CANCELLED状态为REJECTED状态脚本
============================================================
⚠️  当前为试运行模式，不会实际修改数据

🔄 开始批量更新CANCELLED状态为REJECTED状态...
📋 运行模式: 试运行 (不会实际修改数据)

🔍 正在查询所有CANCELLED状态的报名记录...
📊 找到 4 条CANCELLED状态的报名记录

📈 统计信息:
   总记录数: 4
   涉及学员数: 1
   - 活跃学员: 1
   - 非活跃学员: 0

📅 按学期分布:
   2024年秋季: 4 条记录

👥 涉及的学员详情:
========================================================
| 序号 | 学员姓名     | 状态   | CANCELLED记录数 | 详细课程信息                                    |
========================================================
|    1 | 高利芳       | 活跃   |               4 | 葫芦丝班(2024年秋季), 声乐二年级(2024年秋季)    |
========================================================

🔍 试运行模式 - 以下是将要执行的更新操作:
   - 将所有CANCELLED状态更改为REJECTED状态
   - 设置cancelReason为"历史数据状态修正"
   - 更新updatedAt时间戳

💡 如需实际执行，请运行:
   node scripts/update-cancelled-to-rejected.js --execute
```

### 实际执行输出
```
🚨 当前为实际执行模式，将会修改数据库数据
⚠️  请确保已经备份重要数据！

⚠️  准备执行实际更新操作...
🔄 正在更新数据库记录...
✅ 更新完成！共更新了 4 条记录

🔍 更新验证:
   剩余CANCELLED记录: 0 条
   新增REJECTED记录: 4 条
✅ 数据更新验证成功！
```

## ⚠️ 注意事项

### 数据安全
1. **备份数据**：执行前请备份数据库
2. **不可逆操作**：更新操作无法撤销
3. **先试运行**：建议先执行试运行模式查看影响范围

### 业务影响
1. **状态语义变化**：`CANCELLED` → `REJECTED`
2. **历史记录保留**：原有的时间戳和基本信息保持不变
3. **标识更新原因**：在 `cancelReason` 字段中记录修改原因

### 系统兼容性
1. **前端显示**：确保前端能正确显示 `REJECTED` 状态
2. **报表统计**：更新后统计数据可能发生变化
3. **API接口**：相关API返回的状态会发生变化

## 🔍 验证方法

### 执行前验证
```sql
-- 查询当前CANCELLED状态的记录数
SELECT COUNT(*) FROM enrollments WHERE status = 'CANCELLED';

-- 查看具体的CANCELLED记录
SELECT 
  e.id,
  s.name as student_name,
  c.name as course_name,
  c.semester,
  e.status,
  e.enrollmentDate
FROM enrollments e
JOIN students s ON e.studentId = s.id
JOIN courses c ON e.courseId = c.id
WHERE e.status = 'CANCELLED'
ORDER BY s.name, c.semester;
```

### 执行后验证
```sql
-- 验证CANCELLED记录是否清空
SELECT COUNT(*) FROM enrollments WHERE status = 'CANCELLED';

-- 验证新增的REJECTED记录
SELECT COUNT(*) FROM enrollments 
WHERE status = 'REJECTED' 
AND cancelReason LIKE '%历史数据状态修正%';

-- 查看更新后的记录详情
SELECT 
  e.id,
  s.name as student_name,
  c.name as course_name,
  c.semester,
  e.status,
  e.cancelReason,
  e.updatedAt
FROM enrollments e
JOIN students s ON e.studentId = s.id
JOIN courses c ON e.courseId = c.id
WHERE e.cancelReason LIKE '%历史数据状态修正%'
ORDER BY e.updatedAt DESC;
```

## 🚨 紧急回滚

如果需要回滚操作（仅在执行后立即发现问题时）：

```sql
-- 紧急回滚SQL（仅限刚执行完毕时使用）
UPDATE enrollments 
SET 
  status = 'CANCELLED',
  cancelReason = NULL,
  updatedAt = NOW()
WHERE cancelReason = '历史数据状态修正：由CANCELLED更改为REJECTED';
```

## 📞 技术支持

如遇到问题，请：
1. 检查数据库连接
2. 确认Prisma配置正确
3. 查看脚本执行日志
4. 联系技术支持团队

---

**创建时间**: 2025-08-22  
**版本**: 1.0  
**维护者**: AI Assistant
