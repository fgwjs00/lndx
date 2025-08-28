# 2025-08-20 学生管理头像显示和学期筛选功能

## 变更概述
修复学生管理页面头像显示问题，并添加学期筛选功能，提升用户体验和数据管理效率。

## 问题分析

### 1. 头像显示问题
- **问题**：学生列表中头像不显示或显示错误
- **原因**：缺少图片URL处理逻辑和错误处理机制
- **影响**：用户无法直观识别学生信息

### 2. 学期筛选缺失
- **问题**：无法按学期筛选学生列表
- **原因**：缺少学期筛选选项和后端API支持
- **影响**：无法分学期管理学生数据

## 技术实现

### 1. 头像显示修复 (`frontend/src/views/Student.vue`)

#### 图片URL处理函数
```typescript
/**
 * 获取图片URL
 */
const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) {
    return '/default-avatar.png'
  }
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  return `http://localhost:3000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
}

/**
 * 处理图片加载错误
 */
const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  img.src = '/default-avatar.png'
}
```

#### 头像img标签优化
```vue
<img 
  :src="getImageUrl(student.avatar)" 
  :alt="student.name" 
  class="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
  @error="handleImageError($event)"
>
```

### 2. 学期筛选功能实现

#### 前端UI增强 (`frontend/src/views/Student.vue`)
```vue
<!-- 学期筛选下拉框 -->
<select 
  v-model="selectedSemester"
  @change="handleFilterChange"
  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
>
  <option value="">所有学期</option>
  <option v-for="semester in availableSemesters" :key="semester" :value="semester">
    {{ semester }}
  </option>
</select>
```

#### 学期数据获取
```typescript
const selectedSemester = ref<string>('')
const availableSemesters = ref<string[]>([])

/**
 * 获取学期列表
 */
const fetchSemesters = async (): Promise<void> => {
  try {
    const response = await StudentService.getSemesters()
    availableSemesters.value = response.data || []
    console.log('获取学期列表成功:', response.data)
  } catch (error) {
    console.error('获取学期列表失败:', error)
    // 失败时使用默认学期选项
    availableSemesters.value = ['2024年春季', '2024年秋季', '2025年春季', '2025年秋季']
  }
}
```

#### 查询参数扩展
```typescript
// 学期筛选
if (selectedSemester.value) {
  params.semester = selectedSemester.value
}
```

### 3. 后端API支持 (`backend/src/routes/student.ts`)

#### 学期列表API
```typescript
/**
 * 获取学期列表（基于课程学期）
 * GET /api/students/semesters
 */
router.get('/semesters', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 从Course表获取所有学期选项
    const semesters = await prisma.course.findMany({
      where: { isActive: true },
      select: { semester: true },
      distinct: ['semester']
    })

    const semesterList = semesters
      .map(item => item.semester)
      .filter(Boolean)
      .sort((a, b) => a!.localeCompare(b!, 'zh-CN'))

    res.json({
      code: 200,
      message: '获取学期列表成功',
      data: semesterList
    })
  } catch (error) {
    console.error('获取学期列表失败:', error)
    throw new BusinessError('获取学期列表失败', 500, 'QUERY_ERROR')
  }
}))
```

#### 学期筛选查询逻辑
```typescript
// 学期筛选 (基于课程学期)
if (req.query.semester && typeof req.query.semester === 'string') {
  if (!enrollmentWhere.course) {
    enrollmentWhere.course = { isActive: true }
  }
  enrollmentWhere.course.semester = req.query.semester
}
```

### 4. API服务层扩展 (`frontend/src/api/student.ts`)

```typescript
/**
 * 获取学期列表
 * @returns 学期列表
 */
static async getSemesters(): Promise<ApiResponse<string[]>> {
  return request.get('/students/semesters')
}
```

## 功能特性

### 1. 头像显示功能
- **智能URL处理**：支持相对路径和绝对路径
- **错误容错**：加载失败时自动显示默认头像
- **样式优化**：圆形头像，对象填充，边框装饰

### 2. 学期筛选功能
- **动态学期选项**：从数据库课程表获取真实学期数据
- **组合筛选**：学期可与专业、状态、关键词同时使用
- **实时筛选**：选择学期后立即更新学生列表

### 3. 筛选逻辑优化
- **多条件组合**：学期 + 专业 + 状态 + 关键词
- **后端筛选**：在数据库层面进行筛选，提高性能
- **关联查询**：通过Enrollment表关联Course表获取学期信息

## 数据库查询逻辑

### 学期筛选查询
```sql
-- 等效SQL查询逻辑
SELECT * FROM students 
WHERE isActive = true 
AND EXISTS (
  SELECT 1 FROM enrollments e
  JOIN courses c ON e.courseId = c.id
  WHERE e.studentId = students.id
  AND c.semester = '2025年秋季'
  AND c.isActive = true
)
```

### 组合筛选查询
```typescript
const enrollmentWhere = {
  status: 'APPROVED',           // 状态筛选
  course: {
    category: '音乐',           // 专业筛选
    semester: '2025年秋季',     // 学期筛选
    isActive: true
  }
}
```

## 用户界面优化

### 1. 头像显示
- **尺寸**：10x10 (40px圆形)
- **样式**：object-cover确保比例正确
- **边框**：淡灰色边框增强视觉效果
- **容错**：加载失败显示默认头像

### 2. 筛选布局
- **顺序**：学期 → 专业 → 状态
- **响应式**：移动端垂直排列，桌面端水平排列
- **交互**：选择后立即筛选，重置分页

### 3. 信息显示
- **联系方式**：显示手机号而非邮箱（Student模型无email字段）
- **专业班级**：基于学生实际报名的课程信息

## 影响范围
- ✅ 学生头像正确显示和容错处理
- ✅ 学期筛选功能完整实现
- ✅ 新增学期列表API端点
- ✅ 多条件组合筛选支持
- ✅ 筛选UI布局优化

## 测试建议
1. **头像测试**：验证有头像和无头像学生的显示效果
2. **学期筛选**：测试学期筛选功能和组合筛选
3. **图片容错**：测试损坏图片URL的容错机制
4. **响应式**：测试移动端和桌面端的筛选布局

## 备注
- 学期数据从课程表动态获取
- 头像支持相对路径和绝对路径
- 默认头像路径为 `/default-avatar.png`
- 保持与课程管理页面一致的筛选体验
