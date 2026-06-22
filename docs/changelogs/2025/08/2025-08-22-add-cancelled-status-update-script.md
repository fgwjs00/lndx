# 添加CANCELLED状态批量更新脚本

**日期**: 2025-08-22  
**类型**: 工具脚本  
**影响范围**: 数据清理、历史数据管理

## 📋 需求背景

根据用户反馈，学员"高利芳"的报名记录中存在 `CANCELLED` 状态，这是由历史的软删除操作导致的遗留数据。为了统一数据状态管理和清理历史遗留问题，需要批量将所有 `CANCELLED` 状态更改为 `REJECTED` 状态。

### 问题分析
1. **历史遗留**：在2025年8月22日之前，系统软删除学员时会将报名状态设置为 `CANCELLED`
2. **数据不一致**：现在系统已改为物理删除报名记录，但历史数据仍存在 `CANCELLED` 状态
3. **用户困惑**：`CANCELLED` 状态在业务逻辑上容易与 `REJECTED` 混淆

## 🔧 解决方案

### 1. 创建批量更新脚本

**文件**: `backend/scripts/update-cancelled-to-rejected.js`

**功能特性**:
- ✅ 支持试运行模式，安全预览更新操作
- ✅ 详细的数据统计和分析
- ✅ 按学员和学期分组显示
- ✅ 完整的更新验证机制
- ✅ 安全的错误处理和数据库连接管理

**核心逻辑**:
```javascript
// 查询所有CANCELLED状态的报名记录
const cancelledEnrollments = await prisma.enrollment.findMany({
  where: { status: 'CANCELLED' },
  include: { student: true, course: true }
})

// 批量更新为REJECTED状态
const updateResult = await prisma.enrollment.updateMany({
  where: { status: 'CANCELLED' },
  data: {
    status: 'REJECTED',
    cancelReason: '历史数据状态修正：由CANCELLED更改为REJECTED',
    updatedAt: new Date()
  }
})
```

### 2. 使用方法

#### 试运行模式（推荐）
```bash
cd backend
node scripts/update-cancelled-to-rejected.js
```

#### 实际执行模式
```bash
cd backend
node scripts/update-cancelled-to-rejected.js --execute
```

### 3. 创建使用说明文档

**文件**: `backend/scripts/README-update-cancelled-status.md`

**内容包括**:
- 详细的使用说明
- 输出示例和解读
- 安全注意事项
- 数据验证方法
- 紧急回滚方案

## 📊 脚本特性

### 数据分析功能
1. **统计信息**:
   - 总记录数统计
   - 涉及学员数量（活跃/非活跃）
   - 按学期分布统计

2. **详细展示**:
   - 学员姓名和状态
   - 具体的课程信息
   - 报名时间和学期信息

### 安全保障机制
1. **试运行模式**: 默认不修改数据，仅显示预览
2. **数据验证**: 更新后验证记录数量的一致性
3. **错误处理**: 完善的异常捕获和数据库连接管理
4. **操作日志**: 详细的执行过程日志

### 数据更新策略
1. **状态更新**: `CANCELLED` → `REJECTED`
2. **原因标注**: 在 `cancelReason` 字段记录修改原因
3. **时间更新**: 更新 `updatedAt` 时间戳
4. **数据保留**: 保持其他字段不变

## 🎯 预期效果

### 数据一致性
- ✅ 消除历史遗留的 `CANCELLED` 状态
- ✅ 统一使用 `REJECTED` 状态表示被拒绝的报名
- ✅ 在 `cancelReason` 中保留状态变更的追踪信息

### 用户体验
- ✅ 清除用户对 `CANCELLED` 状态的困惑
- ✅ 统一的状态语义，便于理解和管理
- ✅ 保留历史数据的完整性和可追溯性

### 系统维护
- ✅ 简化状态管理逻辑
- ✅ 减少数据状态的复杂性
- ✅ 便于后续的数据分析和报表生成

## 📋 使用示例

### 高利芳学员的情况
**更新前**:
```
葫芦丝班 - 无等级 (2024年秋季) [CANCELLED]
声乐二年级 - 二年级 (2024年秋季) [CANCELLED]
```

**更新后**:
```
葫芦丝班 - 无等级 (2024年秋季) [REJECTED] (原因: 历史数据状态修正)
声乐二年级 - 二年级 (2024年秋季) [REJECTED] (原因: 历史数据状态修正)
```

## ⚠️ 注意事项

### 执行前准备
1. **数据备份**: 建议执行前备份 `enrollments` 表
2. **试运行**: 必须先执行试运行模式查看影响范围
3. **业务确认**: 确认更新不会影响正在进行的业务流程

### 执行后验证
1. **数据验证**: 检查更新的记录数量是否正确
2. **功能测试**: 验证前端显示和相关功能正常
3. **统计确认**: 检查报表和统计数据的变化

### 回滚方案
如需紧急回滚，可使用以下SQL：
```sql
UPDATE enrollments 
SET status = 'CANCELLED', cancelReason = NULL
WHERE cancelReason = '历史数据状态修正：由CANCELLED更改为REJECTED';
```

## 🚀 部署建议

### 执行时机
- 建议在业务低峰期执行
- 确保有足够时间进行验证
- 准备好回滚方案

### 执行步骤
1. 数据库备份
2. 试运行模式验证
3. 实际执行更新
4. 数据验证确认
5. 功能测试验证

## 📝 相关文档

- [学生删除级联处理修复](./2025-08-22-fix-student-deletion-cascade.md)
- [报名状态管理说明](../../PROJECT_SUMMARY.md#报名管理)
- [数据库维护脚本使用指南](../../../backend/scripts/README.md)

---

**创建人**: AI Assistant  
**审核状态**: 待审核  
**相关Issue**: CANCELLED状态历史数据清理
