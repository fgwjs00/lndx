# 学生年级管理系统实现

## 日期：2025-08-22

## 变更概述
实现了完整的学生年级管理系统，支持年级升级、毕业归档和跨年级报名逻辑。

## 核心功能

### 1. 年级管理逻辑
- **学期制度**：每年只有一个学期（如：2024年度、2025年度）
- **年级升级**：每年自动升一年级（一年级 → 二年级 → 三年级）
- **毕业机制**：3年后自动毕业归档
- **重新学习**：毕业生可以重新报名开始新学习周期

### 2. 跨年级报名规则
- **向下兼容**：高年级学生可以报名低年级课程
  - 二年级学生 ✅ 可以报名一年级课程
  - 三年级学生 ✅ 可以报名一年级、二年级课程
- **向上限制**：低年级学生不能报名高年级课程
  - 一年级学生 ❌ 不能报名二年级、三年级课程
- **时间冲突检查**：确保所选课程时间不冲突
- **学期重复检查**：同一学期不能重复报名同一课程

### 3. 学生生命周期管理
```
入学 → 一年级 → 二年级 → 三年级 → 毕业 → (可重新报名)
```

## 技术实现

### 数据库架构变更
```sql
-- Student表新增字段
ALTER TABLE students ADD COLUMN currentGrade VARCHAR(10);           -- 当前年级
ALTER TABLE students ADD COLUMN enrollmentYear INTEGER;             -- 入学年份  
ALTER TABLE students ADD COLUMN enrollmentSemester VARCHAR(20);     -- 入学学期
ALTER TABLE students ADD COLUMN graduationStatus VARCHAR(20) DEFAULT 'IN_PROGRESS'; -- 毕业状态
ALTER TABLE students ADD COLUMN graduationDate TIMESTAMP;          -- 毕业时间
ALTER TABLE students ADD COLUMN academicStatus VARCHAR(20) DEFAULT 'ACTIVE';        -- 学籍状态
```

### 核心文件创建/修改

#### 后端文件
1. **`backend/src/utils/gradeManagement.ts`** - 年级管理核心工具库
   - `getCurrentSemester()`: 获取当前学期
   - `calculateCurrentGrade()`: 计算学生当前应在年级
   - `shouldGraduate()`: 判断是否应该毕业
   - `canEnrollCourse()`: 检查课程报名权限

2. **`backend/src/routes/gradeManagement.ts`** - 年级管理专用路由
   - `GET /statistics`: 获取年级统计信息
   - `POST /upgrade-students`: 批量升级学生年级
   - `POST /graduate/:studentId`: 手动设置学生毕业
   - `GET /upgrade-preview`: 获取升级预览

3. **`backend/src/routes/applicationV2.ts`** - 新版报名申请路由
   - `POST /api/applications-v2`: 支持年级管理的报名申请
   - `POST /api/applications-v2/anonymous`: 支持年级管理的匿名报名

4. **`backend/src/scripts/initGradeData.ts`** - 数据初始化脚本
   - 为现有学生设置年级信息
   - 根据创建时间推算入学年份和当前年级

#### 前端文件
1. **`frontend/src/views/GradeManagement.vue`** - 年级管理页面
   - 年级统计展示
   - 批量升级操作
   - 学生年级详情管理
   - 手动毕业设置

2. **`frontend/src/api/gradeManagement.ts`** - 年级管理API服务
   - 年级统计查询
   - 批量升级操作
   - 学生毕业设置

3. **`frontend/src/router/index.ts`** - 路由配置更新
   - 添加年级管理页面路由
   - 权限控制：SUPER_ADMIN, SCHOOL_ADMIN

## 业务场景示例

### 场景1：跨年度多课程报名
```
学生张三的学习历程：
2024年度（一年级）：报名"钢琴基础"
2025年度（二年级）：报名"音乐理论"（一年级课程，允许）+ "声乐进阶"（二年级课程）
2026年度（三年级）：报名"钢琴演奏"（三年级课程）
2027年度：自动毕业
```

### 场景2：毕业生重新学习
```
学生李四（2024年毕业）：
2025年度：使用相同身份证报名"绘画基础"
系统处理：重置为一年级，开始新学习周期
```

### 场景3：年级限制验证
```
一年级学生王五尝试报名二年级课程：
结果：❌ 报名失败
提示："该课程面向二年级学生，您当前是一年级，年级不够"
```

## API接口说明

### 年级管理API
- `GET /api/grade-management/statistics` - 获取年级统计
- `POST /api/grade-management/upgrade-students` - 批量升级
- `POST /api/grade-management/graduate/:id` - 手动毕业
- `GET /api/grade-management/upgrade-preview` - 升级预览

### 报名申请V2 API
- `POST /api/applications-v2` - PC端报名申请（支持年级管理）
- `POST /api/applications-v2/anonymous` - 移动端匿名报名（支持年级管理）

## 兼容性说明
- 保留原有的 `/api/applications` 路由，确保向后兼容
- 新功能使用 `/api/applications-v2` 路由
- 前端可以逐步迁移到V2版本

## 测试要点
1. **跨年级报名测试**：二年级学生报名一年级课程
2. **年级限制测试**：一年级学生报名二年级课程应被拒绝
3. **自动升级测试**：批量升级功能正常工作
4. **毕业功能测试**：手动和自动毕业功能
5. **重新报名测试**：毕业生使用相同身份证重新报名

## 已知问题
- 需要为现有学生数据执行一次性的年级信息初始化
- 前端年级管理页面需要与实际API接口联调测试

## 下一步工作
1. 完成前后端联调测试
2. 为现有数据执行年级信息初始化
3. 完善移动端年级显示和限制
4. 添加年级变更的通知功能
