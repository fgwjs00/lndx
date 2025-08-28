# 2025-08-20 课程状态显示修复和学员名单功能实现

## 问题描述

1. **课程状态显示错误**: 所有课程状态都显示为"未知"
2. **学员名单功能缺失**: 点击查看眼睛图标没有实际功能

## 问题分析

### 状态显示问题
- `getStatusText()` 和 `getStatusClass()` 函数仍在使用旧的状态值：`'active'`, `'pending'`, `'completed'`
- 但数据库中的课程状态已更新为：`'DRAFT'`, `'PUBLISHED'`, `'SUSPENDED'`, `'CANCELLED'`
- 导致状态映射失败，显示为"未知"

### 学员名单功能
- `showStudentList()` 函数只显示"功能开发中"消息
- 缺少实际的数据获取和UI展示逻辑

## 修复方案

### 1. 更新状态映射函数

```typescript
const getStatusText = (status: string): string => {
  switch (status) {
    case 'DRAFT':
      return '草稿'
    case 'PUBLISHED':
      return '已发布'
    case 'SUSPENDED':
      return '暂停'
    case 'CANCELLED':
      return '已取消'
    default:
      return '未知'
  }
}

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'PUBLISHED':
      return 'bg-green-100 text-green-600'
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-600'
    case 'SUSPENDED':
      return 'bg-orange-100 text-orange-600'
    case 'CANCELLED':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
```

### 2. 实现学员名单查看功能

#### 数据结构定义
```typescript
const showStudentListModal = ref<boolean>(false)
const currentCourseStudents = ref<{
  courseName: string
  students: Array<{
    studentName: string
    studentCode: string
    phone: string
    applicationDate: string
    enrollmentCode: string
  }>
  total: number
}>({
  courseName: '',
  students: [],
  total: 0
})
```

#### API集成
```typescript
const showStudentList = async (course: Course): Promise<void> => {
  try {
    // 获取该课程已通过审核的报名学员
    const response = await ApplicationService.getApplicationList(1, 100, '', 'APPROVED', course.id)
    
    if (response.code === 200 && response.data.list) {
      const studentList = response.data.list.map(app => ({
        studentName: app.studentInfo?.name || '未知',
        studentCode: app.studentInfo?.studentCode || '',
        phone: app.studentInfo?.phone || '',
        applicationDate: app.applicationDate,
        enrollmentCode: app.enrollmentCode
      }))
      
      showStudentListModal.value = true
      currentCourseStudents.value = {
        courseName: course.name,
        students: studentList,
        total: response.data.total || 0
      }
    } else {
      message.warning(`暂无"${course.name}"的报名学员`)
    }
  } catch (error) {
    console.error('获取学员名单失败:', error)
    message.error('获取学员名单失败')
  }
}
```

#### 模态框UI
- 添加了完整的学员名单表格显示
- 包含学员姓名、编号、电话、报名编号、报名日期
- 响应式设计，支持滚动查看
- 空状态提示

### 3. 依赖导入
```typescript
import { ApplicationService } from '@/api/application'
```

## 状态值对应关系

| 数据库枚举值 | 显示文本 | 样式类 |
|-------------|----------|--------|
| DRAFT | 草稿 | 黄色背景 |
| PUBLISHED | 已发布 | 绿色背景 |
| SUSPENDED | 暂停 | 橙色背景 |
| CANCELLED | 已取消 | 红色背景 |

## 文件修改

- `frontend/src/views/Course.vue`
  - 更新 `getStatusText()` 和 `getStatusClass()` 函数
  - 实现 `showStudentList()` 功能
  - 添加学员名单模态框UI
  - 导入 `ApplicationService`

## 功能特性

✅ **课程状态正确显示**: 草稿、已发布、暂停、已取消
✅ **学员名单查看**: 点击眼睛图标可查看该课程的学员列表
✅ **数据实时获取**: 从真实API获取最新的学员报名数据
✅ **用户体验优化**: 空状态提示、加载错误处理
✅ **响应式设计**: 适配不同屏幕尺寸

## 测试验证

1. ✅ 课程列表中状态应正确显示（不再是"未知"）
2. ✅ 点击查看图标应弹出学员名单模态框
3. ✅ 学员名单应显示已通过审核的学员信息
4. ✅ 无学员课程应显示空状态提示

## 影响范围

- 课程管理页面状态显示
- 课程学员名单查看功能
- 用户界面交互体验

## 版本
v2.4.3
