# 2025-08-20 课程统计数据修复

## 变更概述
修复课程管理页面中的统计数据硬编码问题，改为基于真实数据库数据进行动态计算。

## 主要问题
1. **分类统计硬编码**：使用固定的分类数组，不反映实际数据库分类
2. **教师统计错误**：使用不存在的`course.teachers`数组字段
3. **统计不准确**：基于前端数据计算而非数据库真实统计

## 技术修复

### 1. 分类统计动态化 (`frontend/src/views/Course.vue`)

#### 修复前（硬编码）
```typescript
const categories = [
  { key: 'music' as CourseCategory, name: '音乐' },
  { key: 'instrument' as CourseCategory, name: '器乐' },
  { key: 'art' as CourseCategory, name: '艺术' },
  { key: 'literature' as CourseCategory, name: '文学' },
  { key: 'practical' as CourseCategory, name: '实用技能' },
  { key: 'comprehensive' as CourseCategory, name: '综合' }
]
```

#### 修复后（动态计算）
```typescript
const categoryStats = computed(() => {
  // 从实际课程数据中获取所有分类
  const categoryMap = new Map()
  
  apiCourses.value.forEach(course => {
    const categoryName = course.category || '未分类'
    
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, {
        key: categoryName,
        name: categoryName,
        count: 0,
        enrolled: 0
      })
    }
    
    const category = categoryMap.get(categoryName)
    category.count += 1
    category.enrolled += (course.enrolled || 0)
  })
  
  // 按报名数排序
  return Array.from(categoryMap.values())
    .filter(category => category.count > 0)
    .sort((a, b) => b.enrolled - a.enrolled)
})
```

### 2. 教师统计字段修复 (`frontend/src/views/Course.vue`)

#### 修复前（错误字段）
```typescript
const uniqueTeachers = computed<number>(() => 
  new Set(
    apiCourses.value
      .flatMap(course => course.teachers || [])  // ❌ 错误：teachers字段不存在
      .map(teacher => teacher.name)
  ).size
)
```

#### 修复后（正确字段）
```typescript
const uniqueTeachers = computed<number>(() => 
  new Set(
    apiCourses.value
      .map(course => course.teacher)  // ✅ 正确：使用teacher字段
      .filter(Boolean) // 过滤掉null/undefined
  ).size
)
```

### 3. 教师工作量统计修复

#### 修复前
```typescript
const teacherStats = computed(() => {
  apiCourses.value.forEach(course => {
    const teacherList = course.teachers || []  // ❌ 错误字段
    teacherList.forEach(courseTeacher => {
      const teacherName = courseTeacher.name || courseTeacher.teacher?.realName || '未指定'
      // ...
    })
  })
})
```

#### 修复后
```typescript
const teacherStats = computed(() => {
  const teacherMap = new Map()
  
  apiCourses.value.forEach(course => {
    const teacherName = course.teacher || '未指定'  // ✅ 正确字段
    
    if (!teacherMap.has(teacherName)) {
      teacherMap.set(teacherName, {
        name: teacherName,
        courses: 0,
        students: 0
      })
    }
    
    const teacher = teacherMap.get(teacherName)
    teacher.courses += 1
    teacher.students += (course.enrolled || 0)
  })
  
  return Array.from(teacherMap.values())
    .filter(teacher => teacher.name !== '未指定') // 过滤未指定教师
    .sort((a, b) => b.students - a.students)
})
```

## 数据来源优化

### 1. 数据库字段对应
- **总课程数**：`courseStats.totalCourses` 或 `courses.length`
- **进行中课程**：状态为`PUBLISHED`的课程数
- **总报名数**：所有课程的`enrolled`字段累加
- **授课教师数**：去重后的`teacher`字段计数

### 2. 统计计算逻辑
- **分类统计**：动态遍历实际课程数据
- **教师统计**：基于真实的`teacher`字段
- **排序规则**：按报名数/学生数倒序

## 影响范围
- ✅ 课程管理页面统计卡片
- ✅ 分类统计图表
- ✅ 教师工作量统计
- ✅ 数据准确性提升

## 用户体验改进
1. **准确数据**：统计数据真实反映数据库状态
2. **动态更新**：新增课程/教师自动体现在统计中
3. **分类灵活**：支持任意数据库分类，不限于预设选项
4. **教师统计**：准确显示教师工作量分布

## 测试建议
1. 验证统计卡片数据与实际数据库一致
2. 检查分类统计是否反映真实分类
3. 确认教师工作量统计准确
4. 测试新增课程后统计数据更新

## 备注
- 移除了所有硬编码的分类和教师数据
- 统计计算基于实际API返回的course数据
- 保持了UI的响应式和交互体验
