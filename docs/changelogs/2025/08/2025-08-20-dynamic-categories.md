# 2025-08-20 动态课程分类功能实现

## 变更概述
实现了课程分类筛选的动态化，从数据库动态获取分类选项，替代硬编码的分类数据。

## 主要功能
1. **动态分类数据源**：从Course表中获取所有唯一的分类值
2. **实时分类选项**：分类筛选器根据数据库实际分类动态显示
3. **自动排序**：分类按中文拼音顺序排列
4. **降级处理**：API失败时提供默认分类选项

## 技术实现

### 后端API新增 (`backend/src/routes/course.ts`)

#### 获取分类列表API
```typescript
/**
 * 获取可用分类列表
 * GET /api/courses/categories
 */
router.get('/categories', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // 获取所有不重复的课程分类
    const categories = await prisma.course.findMany({
      where: { 
        isActive: true, 
        NOT: { category: null }  // 修复Prisma语法
      },
      select: { category: true },
      distinct: ['category']
    })

    // 提取分类值并按中文拼音排序
    const categoryList = categories
      .map(item => item.category)
      .filter(Boolean)
      .sort((a, b) => a!.localeCompare(b!, 'zh-CN'))

    res.json({
      code: 200,
      message: '获取分类列表成功',
      data: categoryList
    })
  } catch (error) {
    console.error('获取分类列表失败:', error)
    throw new BusinessError('获取分类列表失败', 500, 'QUERY_ERROR')
  }
}))
```

#### Prisma查询语法修复
- **问题**：`category: { not: null }` 语法在Prisma中无效
- **解决**：使用正确的 `NOT: { category: null }` 语法
- **同时修复**：学期查询也应用了相同的语法修复

### 前端修改 (`frontend/src/views/Course.vue`)

#### 1. 添加分类筛选状态
```typescript
const availableCategories = ref<string[]>([])
```

#### 2. 动态分类筛选器UI
```vue
<!-- 动态分类筛选下拉框 -->
<select v-model="selectedCategory" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
  <option value="">所有分类</option>
  <option v-for="category in availableCategories" :key="category" :value="category">
    {{ category }}
  </option>
</select>
```

#### 3. 获取分类数据逻辑
```typescript
/**
 * 获取可用分类列表
 */
const fetchCategories = async (): Promise<void> => {
  try {
    const response = await CourseService.getCategories()
    availableCategories.value = response.data || []
    console.log('获取分类列表成功:', response.data)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    // 失败时使用默认分类选项
    availableCategories.value = ['音乐', '器乐', '艺术', '文学', '实用技术', '综合']
  }
}
```

### API服务层优化 (`frontend/src/api/course.ts`)

```typescript
/**
 * 获取课程分类列表 (动态获取)
 * @returns 分类列表
 */
static async getCategories(): Promise<ApiResponse<string[]>> {
  return request.get('/courses/categories')
}
```

## CSS错误修复
同时修复了Tailwind CSS错误：
- 将所有`bg-gray-300`替换为`bg-gray-200`（Tailwind 4.x兼容）
- 影响文件：Course.vue, CourseForm.vue, Analysis.vue, Dashboard.vue, CreateTeacherForm.vue, ChangePasswordModal.vue, SkeletonLoader.vue

## 数据流程

### 1. 分类数据来源
- **数据库查询**：从`Course`表中获取所有不重复的`category`值
- **自动排序**：按中文拼音顺序排列
- **自动过滤**：只显示有课程的分类

### 2. 筛选机制
- **前端筛选**：基于`filteredCourses`计算属性
- **后端筛选**：API支持category参数查询
- **实时更新**：监听器自动触发重新查询

## 使用说明

### 分类筛选使用
1. 在课程管理页面的分类筛选器中选择具体分类
2. 分类选项根据数据库实际分类动态显示
3. 系统自动筛选显示对应分类的课程
4. 新分类会自动出现在筛选选项中

### 管理建议
- 建议为课程设置规范的分类名称
- 避免分类名称重复或拼写错误
- 便于按分类进行课程管理和统计
- 分类数据与数据库保持同步

## 测试建议
1. 创建新课程时设置不同分类
2. 验证分类筛选器动态更新
3. 检查分类筛选功能正常工作
4. 确认API响应数据格式正确

## 影响范围
- ✅ 课程管理页面分类筛选器
- ✅ API服务层动态数据获取
- ✅ CSS兼容性问题修复
- ✅ 用户体验优化（真实数据）

## 备注
- 此功能实现后，课程分类完全基于数据库真实数据
- 与学期筛选功能保持一致的实现方式
- 提供了API失败时的降级处理机制
