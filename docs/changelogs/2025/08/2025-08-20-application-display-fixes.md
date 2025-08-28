# 2025-08-20 申请详情显示修复

## 问题描述
用户反馈申请详情页面存在多个显示问题：
1. 性别显示为"MALE"而不是"男"
2. 年龄显示为"未填写"
3. 个人头像没有显示

## 问题分析

### 1. 性别显示问题
- **后端数据**：存储为枚举值 `MALE`/`FEMALE`
- **前端显示**：直接显示原始值，未转换为中文

### 2. 年龄计算问题
- **后端计算**：使用了错误的字段名 `applicationData.birthday`
- **实际字段**：应该使用 `applicationData.birthDate`

### 3. 头像显示问题
- **字段映射**：`avatar: enrollment.student.photo` 正确
- **数据保存**：创建学生时photo字段条件保存可能导致为空

## 修复内容

### 前端修复 (`frontend/src/components/ApplicationDetailModal.vue`)

#### 1. 添加性别文本转换函数
```typescript
/**
 * 性别文本转换
 */
const getGenderText = (gender?: string): string => {
  switch (gender) {
    case 'MALE':
      return '男'
    case 'FEMALE':  
      return '女'
    default:
      return '未填写'
  }
}
```

#### 2. 更新性别显示
```vue
<!-- 修复前 -->
<span class="text-gray-800">{{ application.studentInfo?.gender || '未填写' }}</span>

<!-- 修复后 -->
<span class="text-gray-800">{{ getGenderText(application.studentInfo?.gender) }}</span>
```

#### 3. 优化年龄显示
```vue
<!-- 修复前 -->
<span class="text-gray-800">{{ application.studentInfo?.age || '未填写' }}</span>

<!-- 修复后 -->
<span class="text-gray-800">{{ application.studentInfo?.age ? `${application.studentInfo.age}岁` : '未填写' }}</span>
```

### 后端修复 (`backend/src/routes/application.ts`)

#### 1. 修复年龄计算字段名
```typescript
// 修复前
age: calculateAge(applicationData.birthday) || 0,

// 修复后  
age: calculateAge(applicationData.birthDate) || 0,
```

#### 2. 确保头像字段正确保存
```typescript
// 修复前：条件保存
...(applicationData.photo ? { photo: applicationData.photo } : {}),

// 修复后：直接保存
photo: applicationData.photo || null,
```

## 技术说明
- 使用`calculateAge`函数正确计算出生日期到当前的年龄
- 前端增加性别枚举值到中文的转换逻辑
- 确保个人头像URL正确保存到数据库

## 测试建议
1. 重新提交一个新的报名申请
2. 在申请管理页面查看申请详情
3. 验证性别显示为"男"/"女"
4. 验证年龄显示为具体数字（如"33岁"）
5. 验证个人头像正确显示

## 影响范围
- ✅ 申请详情弹窗显示
- ✅ 数据库年龄字段计算
- ✅ 头像字段保存和显示

---
**修复日期**: 2025-08-20  
**版本**: v2.4.3  
**修复人员**: AI Assistant
