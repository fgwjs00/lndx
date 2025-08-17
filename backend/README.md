# 学生报名及档案管理系统 - 后端服务

基于 Node.js + Express + TypeScript + Prisma + PostgreSQL 构建的后端API服务。

## 功能特性

- 🔐 四级权限认证系统（超级管理员/学校管理员/教师/学生）
- 📊 完整的学生档案管理
- 📚 课程管理和报名系统
- 📝 智能考勤签到（支持人脸识别）
- 📱 短信验证码服务
- 📄 身份证识别和文件上传
- 🔍 操作日志记录
- 🛡️ API限流和安全防护

## 技术栈

- **框架**: Express.js 4.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL 15 + Prisma ORM 5.x
- **缓存**: Redis 7.x
- **认证**: JWT
- **日志**: Winston
- **验证**: Joi
- **搜索**: PostgreSQL全文搜索 + Elasticsearch (可选)
- **文档**: Swagger + JSDoc
- **监控**: Grafana + Prometheus (可选)

## 项目结构

```
backend/
├── src/
│   ├── controllers/     # 控制器
│   ├── services/        # 业务服务层
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由定义
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript类型
│   ├── config/          # 配置文件
│   └── index.ts         # 应用入口
├── prisma/
│   ├── schema.prisma    # 数据库模型
│   └── migrations/      # 数据库迁移
├── logs/                # 日志文件
└── uploads/             # 上传文件
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 环境配置

复制环境变量模板：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置PostgreSQL数据库连接：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/lndx_db?schema=public"
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 3. PostgreSQL数据库设置

**方式一：使用本地PostgreSQL**
```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE lndx_db;"

# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 运行种子数据
npm run prisma:seed

# (可选) 查看数据库
npm run prisma:studio
```

**方式二：使用Docker Compose**
```bash
# 启动PostgreSQL + Redis + 监控服务
docker compose -f docker-compose-postgresql.yml up -d

# 运行迁移和种子数据
npm run prisma:migrate
npm run prisma:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## API文档

启动服务后，访问 http://localhost:3000/api/docs 查看完整的API文档。

## PostgreSQL 优势特性

本系统已迁移至PostgreSQL，享受以下增强功能：

### 🔍 强大的全文搜索
```sql
-- 中文学生姓名搜索
SELECT * FROM students 
WHERE to_tsvector('simple', real_name) @@ to_tsquery('simple', '张三');
```

### 📊 原生数组类型
```typescript
// 教师专业特长查询
const teachers = await prisma.teacher.findMany({
  where: { specialties: { has: '舞蹈' } }
})
```

### 📈 窗口函数统计
```sql
-- 学生出勤趋势分析
SELECT student_id, attendance_date,
  COUNT(*) OVER (
    PARTITION BY student_id 
    ORDER BY attendance_date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as week_attendance
FROM attendances;
```

### 💾 JSONB数据类型
```typescript
// 课程时间表存储和查询
const courses = await prisma.course.findMany({
  where: {
    timeSlots: {
      path: ['0', 'period'],
      equals: 'morning'
    }
  }
})
```

## 主要API端点

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/send-sms` - 发送短信验证码
- `POST /api/auth/verify-sms` - 验证短信验证码

### 用户管理
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取用户详情
- `PATCH /api/users/:id/status` - 更新用户状态
- `PATCH /api/users/:id/role` - 更新用户角色

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生档案
- `GET /api/students/:id` - 获取学生详情
- `PUT /api/students/:id` - 更新学生信息

### 课程管理
- `GET /api/courses` - 获取课程列表
- `POST /api/courses` - 创建课程
- `GET /api/courses/:id` - 获取课程详情
- `PUT /api/courses/:id` - 更新课程信息

### 报名管理
- `GET /api/enrollments` - 获取报名列表
- `POST /api/enrollments` - 学生报名
- `PATCH /api/enrollments/:id/approve` - 审核报名

### 考勤管理
- `GET /api/attendance` - 获取考勤记录
- `POST /api/attendance` - 创建签到记录
- `POST /api/attendance/face-recognition` - 人脸识别签到

### 文件上传
- `POST /api/upload/id-card` - 身份证识别
- `POST /api/upload/avatar` - 头像上传

## 权限系统

系统采用四级权限控制：

1. **超级管理员 (SUPER_ADMIN)**: 系统最高权限，可管理所有功能
2. **学校管理员 (SCHOOL_ADMIN)**: 学校级管理权限，可管理本校用户和数据
3. **教师 (TEACHER)**: 教学相关权限，可管理学生和课程
4. **学生 (STUDENT)**: 基础权限，只能查看和更新个人信息

## 开发规范

### 代码规范
- 使用 TypeScript 严格模式
- 所有函数必须有类型注解和JSDoc注释
- 使用 Prisma 进行数据库操作
- 统一错误处理和响应格式

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 环境变量说明

```env
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# PostgreSQL数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 短信配置
SMS_ACCESS_KEY_ID=your_sms_key
SMS_ACCESS_KEY_SECRET=your_sms_secret

# 其他配置...
```

## 部署说明

### Docker部署

```bash
# 构建镜像
docker build -t lndx-backend .

# 运行容器
docker run -d -p 3000:3000 --env-file .env lndx-backend
```

### PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确认数据库服务已启动
   - 检查网络连接

2. **依赖安装失败**
   - 清除缓存: `npm cache clean --force`
   - 删除 node_modules 重新安装

3. **Prisma相关问题**
   - 重新生成客户端: `npm run prisma:generate`
   - 检查schema.prisma语法

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
