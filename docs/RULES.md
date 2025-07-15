# 学生报名及档案管理系统 - 开发规则

## 📋 总则

本文档规定了学生报名及档案管理系统的开发规范，所有参与开发的人员都必须严格遵守。

---

## 🎯 项目规范

### 项目结构规范
```
lndx/
├─ frontend/                    # Vue前端项目
│  ├─ src/
│  │  ├─ views/                # 页面组件 (PascalCase命名)
│  │  ├─ components/           # 业务组件 (PascalCase命名)
│  │  ├─ router/               # 路由配置
│  │  ├─ store/                # 状态管理
│  │  ├─ api/                  # 接口请求 (kebab-case命名)
│  │  ├─ assets/               # 静态资源
│  │  ├─ utils/                # 工具函数 (camelCase命名)
│  │  └─ styles/               # 样式文件 (可选)
├─ docs/                       # 项目文档
└─ README.md                   # 项目说明
```

### 命名规范
- **文件夹：** 使用 kebab-case（如：user-management）
- **Vue组件：** 使用 PascalCase（如：UserManagement.vue）
- **JavaScript文件：** 使用 camelCase（如：userService.js）
- **常量：** 使用 UPPER_SNAKE_CASE（如：API_BASE_URL）
- **变量/函数：** 使用 camelCase（如：getUserInfo）

---

## 💻 代码规范

### Vue组件规范
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
/**
 * 组件描述
 * @component ComponentName
 * @description 组件功能说明
 */
import { ref, computed } from 'vue'

// 响应式数据
const data = ref('')

// 计算属性
const computedValue = computed(() => {
  // 计算逻辑
})

// 方法
function handleClick() {
  // 处理逻辑
}
</script>

<style scoped>
/* 组件样式 */
</style>
```

### JavaScript代码规范
```javascript
/**
 * 函数功能描述
 * @param {string} param1 - 参数1描述
 * @param {number} param2 - 参数2描述
 * @returns {Promise<Object>} 返回值描述
 */
async function functionName(param1, param2) {
  // 函数实现
}

// 常量定义
const API_ENDPOINTS = {
  STUDENTS: '/api/students',
  COURSES: '/api/courses'
}

// 导出
export { functionName, API_ENDPOINTS }
```

### 注释规范
- **必须使用JSDoc注释**
- **组件必须包含@component和@description**
- **函数必须包含参数说明和返回值说明**
- **复杂逻辑必须添加内联注释**

---

## 🗂️ 文档规范

### 文档更新规则
1. **日常更新：** 每次代码变更后，必须更新对应日期的变更日志 `docs/changelogs/YYYY/MM/YYYY-MM-DD.md`
2. **版本发布：** 每个版本发布时，必须创建版本记录 `docs/releases/vX.Y.Z.md`
3. **功能性更新：** 新增功能时，必须更新`README.md`的功能说明
4. **结构性更新：** 项目结构变更时，必须更新目录结构说明
5. **定期维护：** 定期整理和归档过期文档到 `docs/archives/` 目录

### 新文档结构
```
docs/
├── CHANGELOG.md        # 主索引文件
├── README.md          # 文档管理说明
├── RULES.md           # 项目开发规范
├── changelogs/        # 按日期分类的变更日志
│   └── YYYY/MM/YYYY-MM-DD.md
├── releases/          # 版本发布记录
│   └── vX.Y.Z.md
└── archives/          # 归档文档
    └── old-changelog.md
```

### 日期变更日志格式
```markdown
# YYYY-MM-DD 开发日志

## 📋 今日概述
- 主要工作内容概述

## 🎨 UI/功能变更
- 具体变更内容

## 🔧 技术改进
- 技术层面的改进

## 📊 开发统计
- 开发数据统计

## 🔮 下一步计划
- 优化描述

### 重大变更 💥
- 变更描述
```

---

## 🔧 技术规范

### 前端技术栈
- **框架：** Vue 3 + Composition API（强制）
- **UI库：** Ant Design Vue 4.x（强制）
- **路由：** Vue Router 4.x（强制）
- **构建：** Vite 7.x（强制）
- **包管理：** pnpm（强制）

### 依赖管理规范
```bash
# 安装生产依赖
pnpm add package-name

# 安装开发依赖
pnpm add -D package-name

# 禁止使用npm或yarn
```

### 组件使用规范
```vue
<!-- 正确：使用Ant Design Vue组件 -->
<a-button type="primary" @click="handleClick">
  <template #icon><PlusOutlined /></template>
  添加学生
</a-button>

<!-- 错误：自定义按钮组件 -->
<custom-button>添加学生</custom-button>
```

---

## 🌐 API规范

### 接口命名规范
```javascript
// API文件结构
src/api/
├─ student.js          # 学生相关接口
├─ course.js           # 课程相关接口
├─ application.js      # 报名相关接口
└─ index.js            # 统一导出

// 接口函数命名
export const getStudentList = () => {}      // 获取列表
export const getStudentDetail = (id) => {}  // 获取详情
export const createStudent = (data) => {}   // 创建
export const updateStudent = (id, data) => {} // 更新
export const deleteStudent = (id) => {}     // 删除
```

### 请求/响应格式
```javascript
// 统一响应格式
{
  "code": 200,
  "message": "success",
  "data": {
    // 具体数据
  }
}

// 分页响应格式
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## 🎨 UI/UX规范

### 设计原则
- **一致性：** 保持整个系统的视觉和交互一致
- **简洁性：** 界面简洁明了，避免冗余元素
- **可访问性：** 支持键盘导航和屏幕阅读器
- **响应式：** 适配桌面、平板、手机等设备

### 颜色规范
```css
:root {
  --primary-color: #1890ff;      /* 主色调 */
  --success-color: #52c41a;      /* 成功色 */
  --warning-color: #faad14;      /* 警告色 */
  --error-color: #f5222d;        /* 错误色 */
  --text-color: #000000d9;       /* 主文本色 */
  --text-color-secondary: #00000073; /* 次文本色 */
}
```

### 间距规范
- **页面边距：** 24px
- **卡片间距：** 16px
- **表单间距：** 16px
- **按钮间距：** 8px

---

## 🔐 权限规范

### 角色定义
```javascript
const USER_ROLES = {
  ADMIN: 'admin',           // 管理员：全部权限
  TEACHER: 'teacher',       // 老师：管理所带学生和课程
  STUDENT: 'student'        // 学生：查看个人信息和报名
}
```

### 权限控制
```javascript
// 路由权限控制
{
  path: '/student',
  component: Student,
  meta: {
    title: '学生管理',
    roles: ['admin', 'teacher']  // 允许访问的角色
  }
}

// 组件权限控制
<a-button v-if="hasPermission('student:create')">
  添加学生
</a-button>
```

---

## 📊 性能规范

### 代码分割
```javascript
// 路由懒加载
const Dashboard = () => import('../views/Dashboard.vue')

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() => 
  import('./HeavyComponent.vue')
)
```

### 优化要求
- **首屏加载时间：** < 2秒
- **页面切换时间：** < 500ms
- **API响应时间：** < 1秒
- **内存使用：** 合理控制，避免内存泄漏

---

## 🧪 测试规范

### 测试分类
- **单元测试：** 工具函数、业务逻辑
- **组件测试：** Vue组件功能
- **集成测试：** 页面功能流程
- **E2E测试：** 完整用户流程

### 测试覆盖率要求
- **工具函数：** 100%
- **业务组件：** ≥ 80%
- **页面组件：** ≥ 60%

---

## 🔄 版本控制规范

### Git分支规范
```bash
main              # 主分支，用于生产环境
develop          # 开发分支，用于集成测试
feature/xxx      # 功能分支，开发新功能
hotfix/xxx       # 热修复分支，修复紧急问题
```

### 提交信息规范
```bash
feat: 新增学生管理功能
fix: 修复课程列表分页问题
docs: 更新README文档
style: 调整按钮样式
refactor: 重构用户权限逻辑
test: 添加学生服务单元测试
chore: 更新依赖版本
```

---

## 🚀 部署规范

### 环境配置
```bash
# 开发环境
pnpm run dev

# 测试环境
pnpm run build:test

# 生产环境
pnpm run build
```

### 部署检查清单
- [ ] 代码构建无错误
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 版本号已更新
- [ ] 性能指标达标

---

## ⚠️ 禁止事项

### 严格禁止
- ❌ 直接在main分支提交代码
- ❌ 提交未经测试的代码
- ❌ 使用console.log进行调试（生产环境）
- ❌ 硬编码配置信息
- ❌ 忽略ESLint警告
- ❌ 不写注释的复杂逻辑
- ❌ 使用已废弃的API

### 代码质量要求
- ✅ 所有函数必须有JSDoc注释
- ✅ 所有组件必须有props验证
- ✅ 所有异步操作必须有错误处理
- ✅ 所有用户输入必须验证
- ✅ 所有接口调用必须有loading状态

---

## 📞 问题反馈

如有规范相关问题，请通过以下方式反馈：
- 项目Issues：技术问题和bug报告
- 团队会议：规范讨论和改进建议
- 代码审查：代码质量问题

---

**最后更新：** 2025-01-05  
**版本：** v1.0.0  
**适用范围：** 学生报名及档案管理系统全体开发人员 