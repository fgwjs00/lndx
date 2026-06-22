# 2025-09-02 修复CANCELLED状态报名限制问题

## 问题描述
系统中存在 `CANCELLED` 状态的报名记录，导致学生无法重新报名相同课程，出现身份证号重复错误。

## 解决方案
修改报名限制逻辑，将 `CANCELLED` 状态视为与 `REJECTED` 状态相同，允许重新报名。

## 修改内容

### 1. 修改报名限制检查逻辑
- **文件**: `backend/src/routes/applicationV2.ts`
- **位置**: 第271行和第727行附近
- **修改**: 将检查 `REJECTED` 状态的逻辑扩展为检查 `REJECTED` 或 `CANCELLED` 状态
- **变更**: 注释掉抛出错误的代码，允许这两种状态重新报名

### 2. 修改现有报名记录处理逻辑
- **文件**: `backend/src/routes/applicationV2.ts`
- **位置**: 第529行和第925行附近
- **修改**: 将处理 `REJECTED` 状态的逻辑扩展为处理 `REJECTED` 或 `CANCELLED` 状态
- **变更**: 删除旧的报名记录，允许创建新的报名记录

### 3. 修改查询条件
- **文件**: `backend/src/routes/applicationV2.ts`
- **修改**: 在查询现有报名记录时包含 `CANCELLED` 状态
- **变更**: `status: { in: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }`

## 技术细节

### 修改前的问题
```typescript
// 只检查 REJECTED 状态
const hasRejectedEnrollment = existingStudent.enrollments.some((enrollment: any) => 
  enrollment.courseId === courseId &&
  enrollment.status === 'REJECTED'
)

if (hasRejectedEnrollment) {
  throw new ValidationError(`课程"${targetCourse.name}"已被拒绝，无法重新报名`)
}
```

### 修改后的解决方案
```typescript
// 检查 REJECTED 或 CANCELLED 状态，但允许重新报名
const hasRejectedOrCancelledEnrollment = existingStudent.enrollments.some((enrollment: any) => 
  enrollment.courseId === courseId &&
  (enrollment.status === 'REJECTED' || enrollment.status === 'CANCELLED')
)

// 注释掉错误抛出，允许重新报名
// if (hasRejectedOrCancelledEnrollment) {
//   throw new ValidationError(`课程已被拒绝或取消，无法重新报名`)
// }
```

### 报名记录处理逻辑
```typescript
if (existingEnrollment) {
  if (existingEnrollment.status === 'REJECTED' || existingEnrollment.status === 'CANCELLED') {
    // 删除旧记录，允许创建新记录
    await tx.enrollment.delete({
      where: { id: existingEnrollment.id }
    })
  }
}
```

## 影响范围
- ✅ 解决了 `CANCELLED` 状态课程无法重新报名的问题
- ✅ 解决了身份证号重复错误
- ✅ 保持了 `PENDING` 和 `APPROVED` 状态的原有限制逻辑
- ✅ 同时适用于认证用户和匿名用户的报名流程

## 测试验证
1. 具有 `CANCELLED` 状态报名记录的学生可以重新报名相同课程
2. 具有 `REJECTED` 状态报名记录的学生可以重新报名相同课程
3. 具有 `PENDING` 或 `APPROVED` 状态的报名记录仍然阻止重复报名
4. 身份证号重复错误得到解决

## 相关文件
- `backend/src/routes/applicationV2.ts` - 主要修改文件
- `docs/changelogs/2025/09/2025-09-02-fix-cancelled-enrollment-status.md` - 变更日志

## 版本信息
- 修改日期: 2025-09-02
- 修改人: AI Assistant
- 影响版本: v2.4.x+
