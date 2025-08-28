# 2025-08-20 课程管理学期筛选功能

## 功能描述
为课程管理系统添加按学期筛选的功能，允许用户按照不同学期（如2024年秋季、2025年春季等）来查看和管理课程。

## 新增功能

### 1. 学期筛选器
在课程管理页面的两个视图中都添加了学期筛选下拉框：
- **课程表视图**：在表格上方添加学期筛选
- **课程列表视图**：在筛选区域添加学期筛选

支持的学期选项：
- 2025年春季、夏季、秋季、冬季
- 2024年春季、夏季、秋季、冬季
- 所有学期（默认）

### 2. 动态标题显示
课程表视图的标题现在根据选择的学期动态变化：
- 选择学期时：显示"2025年秋季课程表"
- 未选择时：显示"所有学期课程表"

### 3. 学期信息展示
- **列表表格**：添加"学期"列显示每个课程的学期信息
- **课程详情**：在课程详情弹窗中显示学期信息

## 技术实现

### 后端API新增 (`backend/src/routes/course.ts`)

#### 1. 获取学期列表API
```typescript
/**
 * 获取可用学期列表
 * GET /api/courses/semesters
 */
router.get('/semesters', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // 获取所有不重复的学期
  const semesters = await prisma.course.findMany({
    where: { isActive: true, semester: { not: null } },
    select: { semester: true },
    distinct: ['semester']
  })

  // 提取学期值并排序（按年份和季节倒序）
  const semesterList = semesters
    .map(item => item.semester)
    .filter(Boolean)
    .sort((a, b) => {
      const getYear = (s: string) => parseInt(s.match(/(\d{4})年/)?.[1] || '0')
      const getSeason = (s: string) => {
        if (s.includes('春季')) return 1
        if (s.includes('夏季')) return 2
        if (s.includes('秋季')) return 3
        if (s.includes('冬季')) return 4
        return 0
      }
      
      const yearA = getYear(a!), yearB = getYear(b!)
      if (yearA !== yearB) return yearB - yearA // 年份倒序
      return getSeason(b!) - getSeason(a!) // 季节倒序
    })
}))
```

#### 2. 修复参数验证问题
- 移除了过于严格的`validatePaginationData`验证
- 改为直接解构查询参数并手动验证
- 支持semester参数的查询条件

### 前端修改 (`frontend/src/views/Course.vue`)

#### 1. 添加学期筛选状态
```typescript
const selectedSemester = ref<string>('')
const availableSemesters = ref<string[]>([])
```

#### 2. 动态学期筛选器UI
```vue
<!-- 动态学期筛选下拉框 -->
<select v-model="selectedSemester" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
  <option value="">所有学期</option>
  <option v-for="semester in availableSemesters" :key="semester" :value="semester">
    {{ semester }}
  </option>
</select>
```

#### 3. 获取学期数据逻辑
```typescript
/**
 * 获取可用学期列表
 */
const fetchSemesters = async (): Promise<void> => {
  try {
    const response = await CourseService.getSemesters()
    availableSemesters.value = response.data || []
  } catch (error) {
    // 失败时使用默认学期选项
    availableSemesters.value = ['2025年秋季', '2025年夏季', '2025年春季', '2024年秋季']
  }
}
```

### API服务层新增 (`frontend/src/api/course.ts`)

```typescript
/**
 * 获取可用学期列表
 * @returns 学期列表
 */
static async getSemesters(): Promise<ApiResponse<string[]>> {
  return request.get('/courses/semesters')
}
```

#### 3. 筛选逻辑更新
```typescript
// 在filteredCourses计算属性中添加学期筛选
if (selectedSemester.value) {
  result = result.filter(course => course.semester === selectedSemester.value)
}

// 在监听器中添加学期变化监听
watch([searchQuery, selectedCategory, selectedLevel, selectedSemester], () => {
  pagination.value.current = 1
  fetchCourses()
}, { deep: true })

// 在API调用中添加学期参数
if (selectedSemester.value && selectedSemester.value !== 'all') {
  params.semester = selectedSemester.value
}
```

#### 4. 表格显示优化
- 添加"学期"列到课程列表表格
- 在课程详情中显示学期信息
- 学期标签使用蓝紫色样式(`bg-indigo-100 text-indigo-600`)

### 后端修改 (`backend/src/routes/course.ts`)

#### 1. API参数支持
```typescript
const { 
  page = 1, 
  pageSize = 10, 
  keyword,
  category,
  level,
  status,
  semester,  // 🔥 新增学期参数
  teacherId,
  sortField = 'createdAt',
  sortOrder = 'desc'
} = value
```

#### 2. 查询条件支持
```typescript
if (semester) {
  where.semester = semester
}
```

### 数据规范化

#### 1. 学期格式统一
将现有课程的学期格式从"2025秋季"更新为"2025年秋季"：
```javascript
// 批量更新学期格式
- 民族舞蹈基础班: "2025秋季" → "2025年秋季"
- 流行声乐培训: "2025秋季" → "2025年秋季"  
- 钢琴入门班: "2025秋季" → "2025年秋季"
```

## CSS错误修复
修复了所有文件中的Tailwind CSS错误：
- 将`bg-slate-300`替换为`bg-gray-300`
- 影响文件：Course.vue, CourseForm.vue, ChangePasswordModal.vue, CreateTeacherForm.vue, Dashboard.vue, SkeletonLoader.vue, Analysis.vue

## 数据流程

### 1. 学期数据来源
- **数据库查询**：从`Course`表中获取所有不重复的`semester`值
- **动态排序**：按年份倒序、季节倒序排列
- **自动过滤**：只显示有课程的学期

### 2. 筛选机制
- **前端筛选**：基于`filteredCourses`计算属性
- **后端筛选**：API支持semester参数查询
- **实时更新**：监听器自动触发重新查询

## 使用说明

### 学期筛选使用
1. 在课程管理页面选择"课程表视图"或"课程列表"
2. 选择学期筛选器中的具体学期（动态加载）
3. 系统自动筛选显示对应学期的课程
4. 课程表标题会动态显示选择的学期

### 管理建议
- 建议按学期规划课程开设
- 每个学期可以开设不同级别的相同课程
- 便于按学期进行课程统计和分析
- 新学期会自动出现在筛选选项中

## 测试建议
1. 选择不同学期验证筛选效果
2. 验证课程表标题动态变化
3. 检查课程列表中学期列显示
4. 验证课程详情中学期信息显示

## 影响范围
- ✅ 课程管理页面筛选功能增强
- ✅ 课程表视图按学期展示
- ✅ 课程列表表格结构优化
- ✅ 后端API查询参数扩展
- ✅ 数据库学期字段规范化
- ✅ CSS兼容性问题修复

---
**开发日期**: 2025-08-20  
**版本**: v2.5.0  
**开发人员**: AI Assistant
