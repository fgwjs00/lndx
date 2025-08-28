# 报名记录过滤已删除学生修复

**日期：** 2025-08-22  
**类型：** 错误修复  
**影响范围：** 报名管理、数据显示一致性  

## 问题描述

用户反馈删除学生后，报名记录列表中仍然显示已删除学生的报名信息，造成数据显示不一致。

### 问题表现
- 学生已被软删除（`isActive: false`）
- 学生相关的报名记录状态已正确更新为 `CANCELLED`
- 但前端报名列表仍然显示这些记录
- 统计数据包含已删除学生的报名记录

### 根本原因
报名记录查询API（`GET /api/applications` 和 `GET /api/applications/statistics`）直接查询 `enrollment` 表，没有过滤掉已删除学生的记录。

## 解决方案

### 1. 报名列表查询修复
在 `GET /api/applications` 端点中添加学生活跃状态过滤：

**修复前：**
```typescript
// 直接查询所有报名记录
const enrollments = await prisma.enrollment.findMany({
  where,  // 没有过滤学生状态
  include: { student: true, course: true }
})
```

**修复后：**
```typescript
// 只查询活跃学生的报名记录
where.student = {
  ...where.student,
  isActive: true  // 只显示活跃学生的报名记录
}

const enrollments = await prisma.enrollment.findMany({
  where,
  include: { student: true, course: true }
})
```

### 2. 报名统计数据修复
在 `GET /api/applications/statistics` 端点中添加相同的过滤逻辑：

**修复前：**
```typescript
// 统计所有报名记录
const totalEnrollments = await prisma.enrollment.count()
const pending = await prisma.enrollment.count({ where: { status: 'PENDING' } })
// ... 其他状态统计
```

**修复后：**
```typescript
// 只统计活跃学生的报名记录
const activeStudentCondition = {
  student: { isActive: true }
}

const totalEnrollments = await prisma.enrollment.count({
  where: activeStudentCondition
})
const pending = await prisma.enrollment.count({ 
  where: { status: 'PENDING', ...activeStudentCondition } 
})
// ... 其他状态统计都加入相同过滤条件
```

### 3. 关键字搜索兼容性
确保在关键字搜索功能中，学生过滤条件与现有的OR查询逻辑正确合并：

```typescript
// 关键词搜索
if (keyword && typeof keyword === 'string') {
  where.OR = [
    {
      student: {
        realName: { contains: keyword.trim(), mode: 'insensitive' }
      }
    },
    {
      enrollmentCode: { contains: keyword.trim(), mode: 'insensitive' }
    },
    {
      student: {
        idCardNumber: { contains: keyword.trim(), mode: 'insensitive' }
      }
    }
  ]
}

// 后续添加学生活跃状态过滤
where.student = {
  ...where.student,  // 保留现有的学生搜索条件
  isActive: true     // 添加活跃状态过滤
}
```

## 技术实现

### 查询逻辑优化
- **保持数据完整性**：已删除学生的报名记录仍保存在数据库中，但不在前端显示
- **统计准确性**：统计数据只计算活跃学生的报名情况
- **搜索一致性**：关键字搜索也只在活跃学生范围内进行

### 数据库查询优化
使用 Prisma 的关系查询过滤：
```prisma
enrollment {
  student {
    isActive: true
  }
}
```

这样可以利用数据库的关系查询优化，避免N+1查询问题。

## 业务逻辑

### 显示策略
| 学生状态 | 报名记录状态 | 显示策略 |
|---------|------------|---------|
| `isActive: true` | 任何状态 | ✅ 正常显示 |
| `isActive: false` | 任何状态 | ❌ 不显示（过滤掉） |

### 数据保留策略
- **软删除学生**：`isActive: false`，数据保留
- **报名记录状态**：自动更新为 `CANCELLED`
- **前端显示**：不显示已删除学生的任何报名记录
- **数据审计**：所有数据在数据库中保留，可用于审计

## 影响评估

### 正面影响
- ✅ 数据显示一致性得到保证
- ✅ 避免用户困惑（看到已删除学生的报名）
- ✅ 统计数据更准确反映当前状态
- ✅ 提升用户体验

### 兼容性
- ✅ 向后兼容，不影响现有数据
- ✅ 前端无需修改，透明处理
- ✅ 保持完整的数据审计能力

### 性能考虑
- 查询增加关系过滤条件，性能影响微乎其微
- 利用数据库索引优化，实际上可能提升查询性能
- 减少前端显示的数据量，页面渲染更快

## 测试验证

### 测试场景
- [ ] 删除学生后，报名列表不显示该学生记录
- [ ] 统计数据正确反映活跃学生的报名情况
- [ ] 关键字搜索不返回已删除学生的记录
- [ ] 已删除学生的数据仍在数据库中保留
- [ ] 删除学生前后的报名状态变化正确

### 数据验证
```sql
-- 验证已删除学生的报名记录状态
SELECT s.realName, s.isActive, e.status, e.cancelReason 
FROM students s 
JOIN enrollments e ON s.id = e.studentId 
WHERE s.isActive = false;
```

## 后续优化建议

1. **管理员特殊视图**：为管理员提供查看所有记录（包括已删除学生）的特殊权限
2. **数据归档**：定期将已删除学生的数据归档到历史表
3. **恢复功能**：提供学生恢复功能，同时恢复相关报名记录状态
4. **审计日志**：详细记录所有删除和恢复操作
