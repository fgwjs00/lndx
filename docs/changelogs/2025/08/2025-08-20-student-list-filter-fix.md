# 2025-08-20 学员名单课程筛选修复

## 问题描述
学员名单功能存在严重bug：点击任意课程的"学员名单"按钮，都会显示所有已通过报名的学员，而不是该课程的学员。

例如：王嘉帅只报名了"民族舞蹈基础班"，但在其他课程（如"流行声乐基础班"）的学员名单中也能看到他。

## 根本原因
前端调用API的参数格式错误，导致课程ID筛选条件没有生效。

### 1. API调用参数错误 (`frontend/src/views/Course.vue`)

#### 修复前
```typescript
// ❌ 错误：传递多个独立参数
const response = await ApplicationService.getApplicationList(1, 100, '', 'APPROVED', course.id)
```

#### 修复后
```typescript
// ✅ 正确：传递filters对象
const response = await ApplicationService.getApplicationList({
  courseId: course.id,   // 关键：按课程ID筛选
  status: 'APPROVED',    // 只显示已通过的报名
  page: 1,
  pageSize: 100          // 获取更多数据
})
```

### 2. SearchFilters类型缺失courseId字段 (`frontend/src/types/index.ts`)

#### 修复前
```typescript
export interface SearchFilters {
  keyword?: string
  status?: string
  dateRange?: [string, string]
  category?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

#### 修复后
```typescript
export interface SearchFilters {
  keyword?: string
  status?: string
  dateRange?: [string, string]
  category?: string
  courseId?: string          // 课程ID筛选
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

## 后端API筛选逻辑
后端在`backend/src/routes/application.ts`中已经有正确的courseId筛选逻辑：

```typescript
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, keyword, status, courseId } = req.query
  
  const where: any = {}
  
  // 课程筛选 - 这个逻辑是正确的
  if (courseId && typeof courseId === 'string') {
    where.courseId = courseId  // ✅ 按课程ID筛选报名记录
  }
  
  // 查询报名记录
  const enrollments = await prisma.enrollment.findMany({
    where,  // 应用courseId筛选条件
    include: {
      student: true,
      course: true
    }
  })
})
```

## 修复验证

### 调试日志
在showStudentList函数中添加了详细的调试日志：

```typescript
console.log('查询课程学员名单:', { courseId: course.id, courseName: course.name })
console.log('学员名单查询结果:', response)
console.log('格式化的学员列表:', studentList)
```

### 预期行为
1. **点击"民族舞蹈基础班"学员名单** → 只显示王嘉帅
2. **点击"流行声乐基础班"学员名单** → 显示该课程的实际学员（不包括王嘉帅）
3. **点击其他课程学员名单** → 只显示对应课程的学员

## 数据流验证

### 1. 前端请求
```javascript
// 点击民族舞蹈基础班时
GET /api/applications?courseId=course123&status=APPROVED&page=1&pageSize=100
```

### 2. 后端查询
```sql
-- 只查询指定课程的报名记录
SELECT * FROM enrollment 
WHERE courseId = 'course123' 
  AND status = 'APPROVED'
  AND isActive = true
```

### 3. 响应数据
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "studentInfo": { "name": "王嘉帅", "studentCode": "S2025002" },
        "courseInfo": { "name": "民族舞蹈基础班" },
        "enrollmentCode": "2025082001"
      }
    ],
    "total": 1
  }
}
```

## 影响范围
- ✅ 修复学员名单课程筛选bug
- ✅ 确保每个课程只显示自己的学员
- ✅ 增强API调用的类型安全性
- ✅ 添加详细调试日志便于问题排查

## 测试建议
1. **功能测试**：逐个点击不同课程的学员名单，确认显示正确
2. **数据验证**：检查浏览器控制台的调试日志
3. **边界测试**：测试没有学员的课程、单个学员的课程
4. **状态测试**：确认只显示已通过(APPROVED)状态的学员

## 备注
- 后端courseId筛选逻辑本身是正确的
- 问题完全在于前端API调用参数格式错误
- 修复后学员名单将严格按课程显示，不会出现跨课程显示的情况
