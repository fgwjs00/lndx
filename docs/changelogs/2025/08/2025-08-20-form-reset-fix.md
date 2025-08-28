# 2025-08-20 表单重置修复

## 问题描述
报名提交成功后，表单数据被清除了，但身份证照片仍然显示在页面上。

## 问题分析
- `handleReset()` 方法清除了 `formData` 中的图片字段
- 但没有清除 `pendingPhotoData` 中的暂存照片数据
- 前端显示逻辑优先显示 `pendingPhotoData` 中的照片

## 修复方案

### 1. 增强 handleReset 方法
```typescript
const handleReset = (): void => {
  // ... 原有逻辑 ...
  
  // 🔥 清除暂存照片数据
  pendingPhotoData.value = {
    photo: '',
    idCardFront: '',
    idCardBack: ''
  }
  
  // ... 其他重置逻辑 ...
}
```

### 2. 移除冗余函数
- 移除了独立的 `clearPendingPhotos()` 函数
- `handleReset()` 现在统一处理所有重置逻辑

## 文件修改
- `frontend/src/views/Registration.vue`

## 测试验证
✅ 报名提交成功后所有照片应该被清除
✅ 重置按钮应该清除所有照片
✅ 身份证读取后照片应该正常显示

## 影响范围
- 报名表单重置功能
- 照片显示逻辑
- 用户体验优化

## 版本
v2.4.1
