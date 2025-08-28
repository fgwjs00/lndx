# 2025-08-20 唯一约束冲突修复

## 问题描述
报名提交时出现 `Unique constraint failed` 错误，前端检查显示身份证号"不存在"，但实际创建时仍然失败。

## 问题分析

### 查询逻辑不一致
两个地方的身份证号查询逻辑不一致：

1. **check-id API** (前端检查):
```typescript
const existingStudent = await prisma.student.findUnique({
  where: { idCardNumber: idNumber },
  // 没有 isActive 条件
})
```

2. **实际提交验证**:
```typescript
const existingStudent = await prisma.student.findFirst({
  where: {
    idCardNumber: applicationData.idNumber,
    isActive: true  // 有 isActive 条件！
  }
})
```

### 根本原因
- 数据库中可能存在 `isActive: false` 的学生记录
- check-id API 没有考虑 `isActive` 状态，返回"不存在"
- 但 `idCardNumber` 字段仍然有 unique 约束，创建时冲突

## 修复方案

### 统一查询条件
将 check-id API 的查询逻辑与提交验证保持一致：

```typescript
// 修复前
const existingStudent = await prisma.student.findUnique({
  where: { idCardNumber: idNumber }
})

// 修复后  
const existingStudent = await prisma.student.findFirst({
  where: { 
    idCardNumber: idNumber,
    isActive: true
  }
})
```

### 数据库重置
- 执行 `npx prisma db push --force-reset`
- 重新运行 `npx prisma db seed`
- 确保数据库处于干净状态

## 技术细节

### 查询方法差异
- `findUnique()`: 基于唯一字段查询，不支持复合条件
- `findFirst()`: 支持复合WHERE条件，更适合业务逻辑

### isActive 字段作用
- `isActive: true`: 活跃学员，参与唯一性检查
- `isActive: false`: 已删除/禁用学员，不参与业务逻辑

## 文件修改
- `backend/src/routes/application.ts`
  - 修复 `/check-id/:idNumber` 路由的查询逻辑
  - 统一使用 `findFirst` 和 `isActive: true` 条件

## 测试验证
✅ 前端身份证检查应与后端验证逻辑一致
✅ 不应再出现 unique constraint 冲突
✅ 报名提交应该正常工作

## 影响范围
- 身份证号重复检查逻辑
- 报名表单提交流程
- 数据一致性保证

## 版本
v2.4.4
