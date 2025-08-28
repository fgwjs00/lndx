# 报名登记页面添加学期选择功能

**日期：** 2025-08-22  
**类型：** 功能新增  
**影响范围：** 报名管理、用户体验  

## 功能描述

为报名登记页面（PC端和手机端）新增学期选择功能，用户现在需要先选择学期，然后才能选择对应学期的课程进行报名。

## 新增功能

### 1. 学期选择组件
- 在课程选择前新增学期选择下拉框
- 支持从后端动态获取可用学期列表
- 提供清晰的用户提示和加载状态

### 2. 学期联动过滤
- 选择学期后自动加载该学期的可报名课程
- 切换学期时自动清空已选课程，重新加载
- 未选择学期时禁用课程选择功能

### 3. 智能默认选择
- 当系统只有一个学期时，自动选择该学期
- 自动加载对应学期的课程列表

## 技术实现

### PC端报名页面 (Registration.vue)

#### 1. 表单数据扩展
```typescript
interface RegistrationFormData {
  // ...其他字段
  semester: string  // 新增学期字段
  selectedCourses: string[]
  // ...
}
```

#### 2. 状态管理
```typescript
// 学期相关状态
const semestersLoading = ref<boolean>(false)
const semesterOptions = ref<Array<{ label: string; value: string }>>([])

// 课程相关状态（扩展semester字段）
const availableCourses = ref<Array<{
  // ...其他字段
  semester: string  // 新增学期字段
}>
```

#### 3. 关键函数
- `loadSemesters()`: 获取学期列表
- `handleSemesterChange()`: 处理学期变更
- `loadAvailableCourses()`: 根据学期加载课程（修改）

#### 4. UI组件
```vue
<!-- 学期选择 -->
<a-form-item label="学期" name="semester" required>
  <a-select
    v-model:value="formData.semester"
    placeholder="请选择学期"
    :options="semesterOptions"
    :loading="semestersLoading"
    @change="handleSemesterChange"
  />
</a-form-item>

<!-- 课程选择（增加禁用逻辑） -->
<a-form-item label="所报课程" name="selectedCourses" required>
  <a-select
    v-model:value="formData.selectedCourses"
    placeholder="请先选择学期，再选择报名课程"
    :disabled="!formData.semester"
    :options="courseOptions"
  />
</a-form-item>
```

### 手机端报名页面 (MobileRegistration.vue)

#### 1. 表单数据扩展
```typescript
const formData = reactive({
  // ...其他字段
  semester: '',  // 新增学期字段
  selectedCourses: [] as string[],
  // ...
})
```

#### 2. 加载状态扩展
```typescript
const loading = reactive({
  semesters: false,  // 新增学期加载状态
  courses: false,
  submit: false
})
```

#### 3. UI优化
- 步骤3（课程选择）中首先显示学期选择
- 未选择学期时显示友好提示："请先选择学期"
- 选择学期后才显示课程列表

#### 4. 表单验证扩展
```typescript
const formRules = {
  // ...其他规则
  semester: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ],
  // ...
}
```

### 后端API集成

#### 1. 学期列表API
```typescript
// 调用现有API
CourseService.getSemesters()
```

#### 2. 课程查询API（扩展）
```typescript
// 根据学期查询课程
CourseService.getCourses({
  page: 1,
  pageSize: 100,
  status: 'PUBLISHED',
  semester: formData.semester  // 新增学期过滤
})
```

## 用户体验优化

### 1. 交互流程
1. 页面加载时自动获取学期列表
2. 用户选择学期
3. 系统自动加载该学期的可报名课程
4. 用户选择课程并继续报名流程

### 2. 状态提示
- 学期加载中显示加载状态
- 课程加载中显示加载状态  
- 未选择学期时禁用课程选择并显示提示

### 3. 智能默认
- 单学期时自动选择
- 学期变更时自动清空已选课程

## 验证规则更新

### PC端和手机端共同更新
- 新增学期必填验证
- 步骤验证中包含学期检查
- 表单提交前验证学期选择

## 兼容性

### 向后兼容
- 现有报名数据不受影响
- API保持向后兼容
- 数据库结构无需变更

### 前端兼容
- 保持原有的课程选择逻辑
- 增强而非替换现有功能
- 保持原有的UI风格和交互

## 错误处理

### 1. 网络错误
- 学期列表加载失败时显示错误提示
- 课程列表加载失败时显示错误提示
- 提供重试机制

### 2. 数据异常
- 无可用学期时的友好提示
- 学期下无课程时的提示
- 加载状态的正确显示和隐藏

## 性能考虑

### 1. 数据缓存
- 学期列表只在页面初始化时加载一次
- 避免重复请求相同学期的课程数据

### 2. 请求优化
- 使用适当的pageSize减少不必要的数据传输
- 只请求已发布状态的课程

## 测试建议

### 功能测试
- [ ] 学期列表正常加载
- [ ] 学期选择触发课程重新加载
- [ ] 单学期时自动选择
- [ ] 多学期切换功能正常
- [ ] 学期变更清空已选课程
- [ ] 表单验证包含学期检查

### 用户体验测试
- [ ] 加载状态显示正确
- [ ] 错误提示友好清晰
- [ ] 禁用状态和提示正确显示
- [ ] 移动端适配良好

### 兼容性测试
- [ ] 不同浏览器兼容性
- [ ] 移动设备兼容性
- [ ] 现有报名流程不受影响
