# 课程管理字段更新

**日期：** 2025-08-22  
**类型：** 功能优化  
**影响范围：** 课程管理、用户界面  

## 功能描述

对课程管理系统的字段概念进行优化，将"分类"更改为"院系"，将"级别"更改为"年级"，并简化年级选项为三个标准年级。

## 主要变更

### 1. 字段概念更新
- **分类** → **院系**：更符合教育机构的组织架构
- **级别** → **年级**：更直观的学习阶段划分

### 2. 年级选项简化
- 移除复杂的级别选项（入门、中级、高级、基础、提高等）
- 统一为三个标准年级：
  - 一年级
  - 二年级  
  - 三年级

### 3. 院系分类优化
- 音乐类 → 音乐系
- 器乐类 → （合并到音乐系）
- 艺术类 → 艺术系
- 文学类 → 文学系
- 实用技能 → 技能系
- 新增：体育系
- 综合类 → 综合系

## 技术实现

### 前端类型定义更新

#### 1. API接口类型 (frontend/src/api/course.ts)
```typescript
export interface Course {
  // ... 其他字段
  category: string // 院系
  level: '一年级' | '二年级' | '三年级' // 年级
  // ... 其他字段
}

export interface CreateCourseRequest {
  // ... 其他字段
  category: string // 院系
  level: '一年级' | '二年级' | '三年级' // 年级
  // ... 其他字段
}

export interface UpdateCourseRequest {
  // ... 其他字段
  category?: string // 院系
  level?: '一年级' | '二年级' | '三年级' // 年级
  // ... 其他字段
}
```

### 用户界面更新

#### 1. 课程管理页面 (frontend/src/views/Course.vue)

**文本更新：**
- "所有分类" → "所有院系"
- "所有级别" → "所有年级"
- "分类" → "院系"
- "级别" → "年级"
- "课程级别" → "课程年级"
- "分类统计" → "院系统计"

**年级选项更新：**
```vue
<select v-model="selectedLevel">
  <option value="">所有年级</option>
  <option value="一年级">一年级</option>
  <option value="二年级">二年级</option>
  <option value="三年级">三年级</option>
</select>
```

**getLevelText函数优化：**
```typescript
const getLevelText = (level: any): string => {
  const texts = {
    // 新的年级选项（优先）
    '一年级': '一年级',
    '二年级': '二年级',
    '三年级': '三年级',
    // 向后兼容老数据
    grade1: '一年级',
    grade2: '二年级', 
    grade3: '三年级',
    // ... 其他兼容选项
  }
  return texts[level] || level || '未知'
}
```

#### 2. 课程表单组件 (frontend/src/components/CourseForm.vue)

**标签更新：**
- "课程分类" → "所属院系"
- "课程级别" → "年级"

**院系选项更新：**
```vue
<a-form-item label="所属院系" name="category">
  <a-select placeholder="请选择所属院系">
    <a-select-option value="music">音乐系</a-select-option>
    <a-select-option value="art">艺术系</a-select-option>
    <a-select-option value="literature">文学系</a-select-option>
    <a-select-option value="sports">体育系</a-select-option>
    <a-select-option value="skills">技能系</a-select-option>
    <a-select-option value="comprehensive">综合系</a-select-option>
  </a-select>
</a-form-item>
```

**年级选项更新：**
```vue
<a-form-item label="年级" name="level">
  <a-select placeholder="请选择年级">
    <a-select-option value="一年级">一年级</a-select-option>
    <a-select-option value="二年级">二年级</a-select-option>
    <a-select-option value="三年级">三年级</a-select-option>
  </a-select>
</a-form-item>
```

**验证规则更新：**
```typescript
const formRules = {
  category: [
    { required: true, message: '请选择所属院系', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  // ... 其他规则
}
```

### 数据处理优化

#### 1. CSV导出更新
```typescript
const headers = ['课程名称', '院系', '年级', '教师', '上课时间', '地点', '容量', '已报名', '状态']
```

#### 2. 向后兼容性
- 保留对老数据格式的支持
- `getLevelText`函数能正确处理新旧格式
- 数据库字段保持不变，仅前端展示优化

## 用户体验改进

### 1. 概念更清晰
- "院系"比"分类"更符合教育管理习惯
- "年级"比"级别"更直观易懂

### 2. 选项简化
- 年级选项从多种复杂级别简化为三个标准年级
- 减少用户选择时的困惑

### 3. 界面一致性
- 所有相关页面和组件的文本保持一致
- 选项命名规范统一

## 兼容性考虑

### 1. 数据兼容
- 数据库结构无需变更
- 现有数据继续有效
- 新数据使用新的年级格式

### 2. 功能兼容
- 查询、筛选功能正常工作
- 统计分析功能保持不变
- 导入导出功能适配新格式

## 测试建议

### 功能测试
- [ ] 课程创建/编辑时年级和院系选择正常
- [ ] 课程列表筛选功能工作正确
- [ ] 课程详情显示正确的年级和院系信息
- [ ] 统计分析页面数据显示正确
- [ ] CSV导出包含正确的字段名

### 兼容性测试
- [ ] 老数据的年级显示正确
- [ ] 新老数据混合时界面显示正常
- [ ] 搜索和筛选对新老格式都有效

### 用户界面测试
- [ ] 所有相关页面的文本已更新
- [ ] 表单验证消息正确显示
- [ ] 移动端界面适配正常
