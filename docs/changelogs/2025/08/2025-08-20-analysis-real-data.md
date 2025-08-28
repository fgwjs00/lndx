# 2025-08-20 统计分析页面真实数据改造

## 变更概述
将统计分析页面从硬编码数据改造为使用真实数据库数据，提供准确的系统统计信息。

## 主要功能
1. **系统统计概览**：报名成功率、活跃学生数、已通过报名数、平均年龄
2. **热门课程排行**：基于实际报名数据的课程排行榜
3. **月度统计**：本月新增学生、课程报名、完成学业、退学率
4. **系统状态监控**：数据库连接、服务器负载、在线用户、运行时间

## 技术实现

### 后端API新增 (`backend/src/routes/analysis.ts`)

#### 1. 系统统计概览API
```typescript
/**
 * 获取系统统计概览
 * GET /api/analysis/overview
 */
router.get('/overview', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // 并行查询基础统计数据
  const [
    totalStudents,
    totalCourses,
    totalEnrollments,
    approvedEnrollments,
    pendingEnrollments,
    rejectedEnrollments,
    activeTeachers
  ] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.course.count({ where: { isActive: true } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: 'APPROVED' } }),
    prisma.enrollment.count({ where: { status: 'PENDING' } }),
    prisma.enrollment.count({ where: { status: 'REJECTED' } }),
    prisma.teacher.count({ where: { isActive: true } })
  ])

  // 计算成功率和平均年龄
  const successRate = totalEnrollments > 0 ? 
    Math.round((approvedEnrollments / totalEnrollments) * 100 * 10) / 10 : 0
}))
```

#### 2. 热门课程排行API
```typescript
/**
 * 获取热门课程排行
 * GET /api/analysis/popular-courses
 */
router.get('/popular-courses', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      enrollments: { where: { status: 'APPROVED' } }
    }
  })

  // 计算报名数和成功率，按学生数排序
  const popularCourses = courses
    .map(course => ({
      id: course.id,
      name: course.name,
      category: course.category,
      students: course.enrollments.length,
      rate: Math.round((course.enrollments.length / Math.max(course.enrollments.length, 1)) * 100),
      maxStudents: course.maxStudents
    }))
    .filter(course => course.students > 0)
    .sort((a, b) => b.students - a.students)
    .slice(0, limit)
}))
```

#### 3. 月度统计API
```typescript
/**
 * 获取月度统计数据
 * GET /api/analysis/monthly-stats
 */
router.get('/monthly-stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // 查询本月数据
  const [newStudents, newEnrollments, graduatedStudents, rejectedEnrollments] = await Promise.all([
    prisma.student.count({ where: { isActive: true, createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.enrollment.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.enrollment.count({ where: { status: 'APPROVED', approvedAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.enrollment.count({ where: { status: 'REJECTED', createdAt: { gte: startOfMonth, lte: endOfMonth } } })
  ])
}))
```

#### 4. 系统状态监控API
```typescript
/**
 * 获取系统状态信息
 * GET /api/analysis/system-status
 */
router.get('/system-status', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // 检查数据库连接状态
  let dbStatus = 'normal'
  try {
    await prisma.$queryRaw`SELECT 1`
    dbStatus = 'normal'
  } catch {
    dbStatus = 'error'
  }

  // 获取活跃用户数（30分钟内登录）
  const recentActiveUsers = await prisma.user.count({
    where: {
      isActive: true,
      lastLoginAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }
    }
  })
}))
```

### 前端API服务层 (`frontend/src/api/analysis.ts`)

#### AnalysisService类
```typescript
export class AnalysisService {
  static async getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
    return request.get('/analysis/overview')
  }

  static async getPopularCourses(limit: number = 5): Promise<ApiResponse<PopularCourse[]>> {
    return request.get(`/analysis/popular-courses?limit=${limit}`)
  }

  static async getMonthlyStats(): Promise<ApiResponse<MonthlyStats>> {
    return request.get('/analysis/monthly-stats')
  }

  static async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return request.get('/analysis/system-status')
  }
}
```

### 前端页面改造 (`frontend/src/views/Analysis.vue`)

#### 1. 响应式数据替换
```typescript
// ❌ 移除硬编码数据
const popularCourses = ref<PopularCourse[]>([
  { id: 1, name: '高等数学', students: 456, rate: 95 },
  // ...
])

// ✅ 使用真实API数据
const overviewStats = ref<OverviewStats>({ /* 初始值 */ })
const popularCourses = ref<PopularCourse[]>([])
const monthlyStats = ref<MonthlyStats>({ /* 初始值 */ })
const systemStatus = ref<SystemStatus>({ /* 初始值 */ })
```

#### 2. 数据绑定更新
```vue
<!-- 报名成功率 -->
<h3 class="text-2xl font-bold text-gray-800">{{ overviewStats.successRate }}%</h3>

<!-- 活跃学生数 -->
<h3 class="text-2xl font-bold text-gray-800">{{ overviewStats.totalStudents.toLocaleString() }}</h3>

<!-- 平均年龄 -->
<h3 class="text-2xl font-bold text-gray-800">{{ overviewStats.averageAge }}</h3>

<!-- 月度统计 -->
<span class="font-bold text-gray-800">+{{ monthlyStats.newStudents }}</span>
<span class="font-bold text-gray-800">+{{ monthlyStats.newEnrollments }}</span>
<span class="font-bold text-gray-800">{{ monthlyStats.dropoutRate }}%</span>
```

#### 3. 热门课程增强显示
```vue
<div class="flex-1">
  <p class="font-medium text-gray-800">{{ course.name }}</p>
  <p class="text-sm text-gray-500">{{ course.students }} 人报名 / {{ course.maxStudents }} 人上限</p>
  <p class="text-xs text-gray-400" v-if="course.category">{{ course.category }}</p>
</div>
```

#### 4. 系统状态动态显示
```vue
<!-- 数据库状态 -->
<span :class="{
  'px-2 py-1 rounded-full text-xs font-medium': true,
  'bg-green-100 text-green-600': systemStatus.dbStatus === 'normal',
  'bg-red-100 text-red-600': systemStatus.dbStatus === 'error'
}">{{ systemStatus.dbStatus === 'normal' ? '正常' : '错误' }}</span>

<!-- 运行时间 -->
<span class="font-bold text-gray-800">{{ systemStatus.uptimeHours }}小时</span>
```

## 路由注册 (`backend/src/index.ts`)

```typescript
import analysisRoutes from '@/routes/analysis'
// ...
app.use(`${apiPrefix}/analysis`, authMiddleware, analysisRoutes)
```

## 数据计算逻辑

### 1. 报名成功率计算
- **公式**：(已通过报名数 ÷ 总报名数) × 100
- **精度**：保留一位小数

### 2. 热门课程排名
- **排序依据**：实际报名学生数（已通过状态）
- **显示信息**：课程名、分类、报名数/上限、成功率

### 3. 月度统计范围
- **时间范围**：当前月1日00:00 - 月末23:59
- **数据来源**：Student表、Enrollment表的createdAt/approvedAt字段

### 4. 系统状态监控
- **数据库状态**：通过执行`SELECT 1`测试连接
- **在线用户**：30分钟内有lastLoginAt记录的用户
- **运行时间**：process.uptime()转换为小时

## 使用说明

### 数据更新机制
1. 页面加载时自动获取所有统计数据
2. 使用并行API调用提高加载速度
3. API失败时显示错误提示，不影响其他数据

### 数据准确性
- 所有数据基于数据库实时查询
- 统计范围明确（如月度统计的时间范围）
- 计算逻辑透明可追溯

## 影响范围
- ✅ 统计分析页面完全数据驱动
- ✅ 新增4个分析API端点
- ✅ 移除所有硬编码模拟数据
- ✅ 增强热门课程显示信息
- ✅ 动态系统状态监控

## 备注
- 图表功能标记为"开发中"，保留UI占位
- 系统负载暂时硬编码为"中等"，可后续集成监控
- 在线用户统计基于登录时间，可根据需求调整统计规则
