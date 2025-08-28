# 2025-08-20 课程状态枚举修复

## 问题描述
课程更新时出现 `Invalid value for argument status. Expected CourseStatus.` 错误，前端发送的 `"active"` 状态值与后端Prisma schema中定义的 `CourseStatus` 枚举不匹配。

## 问题分析
- 后端 Prisma schema 定义：`CourseStatus { DRAFT, PUBLISHED, SUSPENDED, CANCELLED }`
- 前端发送的值：`"active"`, `"pending"`, `"completed"`, `"cancelled"`
- 前后端状态值定义不统一

## 修复方案

### 1. 统一前端类型定义
```typescript
// frontend/src/types/index.ts
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'CANCELLED'

// frontend/src/types/models.ts
export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED', 
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED'
}
```

### 2. 更新状态标签映射
```typescript
[CourseStatus.DRAFT]: '草稿',
[CourseStatus.PUBLISHED]: '已发布',
[CourseStatus.SUSPENDED]: '暂停',
[CourseStatus.CANCELLED]: '已取消',
```

### 3. 修复前端组件使用
- `CourseForm.vue`: 更新下拉选项值和默认值
- `Course.vue`: 修复 `activeCourses` 计算属性

## 状态值对应关系
| 前端旧值 | 新枚举值 | 中文标签 |
|---------|---------|---------|
| pending | DRAFT | 草稿 |
| active | PUBLISHED | 已发布 |
| completed | SUSPENDED | 暂停 |
| cancelled | CANCELLED | 已取消 |

## 文件修改
- `frontend/src/types/index.ts`
- `frontend/src/types/models.ts` 
- `frontend/src/components/CourseForm.vue`
- `frontend/src/views/Course.vue`

## 测试验证
✅ 课程创建应该使用正确的枚举值
✅ 课程更新应该不再报 `CourseStatus` 错误
✅ 状态筛选和显示应该正常工作

## 影响范围
- 课程管理表单
- 课程状态显示
- 课程筛选功能

## 版本
v2.4.2
