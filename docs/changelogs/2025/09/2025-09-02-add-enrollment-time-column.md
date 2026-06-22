# 2025-09-02 学生管理页面添加报名时间列和排序功能

## 功能描述
在学生管理页面的学生列表中添加报名时间列，并支持按报名时间排序。

## 修改内容

### 1. 后端API增强
- **文件**: `backend/src/routes/student.ts`
- **修改内容**:
  1. **添加排序参数支持**:
     - 在API参数中添加 `sortField` 和 `sortOrder` 参数
     - 支持按 `createdAt`、`name`、`enrollmentDate`、`firstEnrollmentDate` 字段排序
  
  2. **修复报名时间计算逻辑**:
     - 单独查询所有学生的完整报名记录以获取准确的最早报名时间
     - 使用 `enrollmentTimeMap` 映射每个学生的最早报名时间
     - 确保查询包含所有状态的报名记录（`PENDING`、`APPROVED`、`REJECTED`、`CANCELLED`）
  
  3. **添加应用层排序**:
     - 当按报名时间排序时，在应用层对 `formattedStudents` 进行排序
     - 支持升序和降序排列

### 2. 前端界面增强
- **文件**: `frontend/src/views/Student.vue`
- **修改内容**:
  1. **添加报名时间列**:
     - 在表格中添加"报名时间"列
     - 显示格式化的日期（年-月-日）和时间（时:分）
     - 支持点击列标题进行排序
  
  2. **添加排序功能**:
     - 添加排序相关的响应式变量：`sortField`、`sortOrder`
     - 实现 `toggleSort` 函数支持排序切换
     - 在API请求中传递排序参数
  
  3. **添加日期格式化函数**:
     - `formatDate`: 格式化日期为中文格式（年-月-日）
     - 移除时间显示，只显示日期部分

### 3. 类型定义更新
- **文件**: `frontend/src/types/models.ts`
- **修改内容**: 在 `Student` 接口中添加 `firstEnrollmentDate` 字段

## 技术实现

### 后端报名时间计算逻辑
```typescript
// 查询所有学生的完整报名记录
const allEnrollments = await prisma.enrollment.findMany({
  where: {
    studentId: { in: studentIds },
    status: { in: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }
  },
  select: { studentId: true, createdAt: true },
  orderBy: { createdAt: 'asc' }
})

// 构建最早报名时间映射
const enrollmentTimeMap = new Map<string, Date>()
allEnrollments.forEach(enrollment => {
  const studentId = enrollment.studentId
  const currentEarliest = enrollmentTimeMap.get(studentId)
  if (!currentEarliest || enrollment.createdAt < currentEarliest) {
    enrollmentTimeMap.set(studentId, enrollment.createdAt)
  }
})

// 使用映射中的最早报名时间
firstEnrollmentDate: enrollmentTimeMap.get(student.id) || student.createdAt
```

### 前端排序功能
```typescript
// 排序切换逻辑
const toggleSort = (field: string): void => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
  fetchStudents()
}

// 日期格式化
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  })
}
```

### 前端表格显示
```vue
<!-- 报名时间列标题 -->
<th class="cursor-pointer hover:bg-gray-100" @click="toggleSort('enrollmentDate')">
  报名时间
  <i v-if="sortField === 'enrollmentDate'" 
     :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"
     class="ml-1 text-emerald-500"></i>
  <i v-else class="fas fa-sort ml-1 text-gray-400"></i>
</th>

<!-- 报名时间数据显示 -->
<td class="py-4 px-6">
  <div v-if="student.firstEnrollmentDate" class="text-gray-600">
    <div class="text-sm">{{ formatDate(student.firstEnrollmentDate) }}</div>
  </div>
  <div v-else class="text-gray-400 text-sm">未报名</div>
</td>
```

## 解决的问题
1. ✅ **修复报名时间显示错误**: 之前因为查询条件限制，无法获取完整的报名记录
2. ✅ **添加报名时间列**: 学生列表现在显示最早报名日期（年-月-日格式）
3. ✅ **实现排序功能**: 支持按报名时间升序/降序排列
4. ✅ **优化用户体验**: 提供直观的排序指示器和悬停效果
5. ✅ **简化时间显示**: 只显示日期，不显示具体时间，符合用户需求

## 测试要点
1. 验证报名时间正确显示为日期格式（YYYY-MM-DD）
2. 验证排序功能正常工作（点击列标题可切换排序）
3. 验证日期格式化为中文格式
4. 验证包含所有状态的报名记录都被考虑在内
5. 验证没有显示具体时间，只显示日期

## 相关文件
- `backend/src/routes/student.ts` - 后端API修改
- `frontend/src/views/Student.vue` - 前端界面修改  
- `frontend/src/types/models.ts` - 类型定义更新

## 版本信息
- 修改日期: 2025-09-02
- 修改人: AI Assistant
- 功能版本: v2.4.x+
