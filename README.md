# 学生报名及档案管理系统

## 项目简介

本系统是一个面向学校/培训机构的现代化学生报名及档案管理平台，提供学生信息管理、课程管理、报名审核、数据分析等一站式服务。系统采用Vue 3 + Ant Design Vue构建，具有响应式设计、权限分级、数据可视化等特性。

## 技术栈

- **前端框架：** Vue 3 + Composition API
- **UI组件库：** Ant Design Vue 4.x
- **路由管理：** Vue Router 4.x
- **构建工具：** Vite 7.x
- **包管理器：** pnpm
- **开发语言：**TypeScript

## 功能特性

### 核心功能模块
- **控制面板：** 系统概览、关键数据统计、报名趋势分析
- **学生管理：** 学生档案的增删改查、信息搜索、批量操作
- **报名管理：** 报名记录查看、状态管理（待审核/已批准/已拒绝）
- **课程管理：** 课程信息维护、选课退课、课程统计
- **数据分析：** 报名趋势图表、学生分布统计、数据可视化
- **系统设置：** 用户管理、权限配置、系统参数设置

### 设计特点
- **现代化UI：** 采用Ant Design Vue组件库，界面简洁美观
- **响应式设计：** 适配PC、平板、手机等多种设备
- **权限分级：** 支持管理员、老师、普通用户三种角色权限
- **数据可视化：** 关键指标卡片展示，图表分析直观
- **交互体验：** 侧边栏导航、页面切换流畅、操作便捷

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- pnpm >= 8.0.0

### 安装依赖
```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install
```

### 开发运行
```bash
# 启动开发服务器
pnpm run dev

# 访问地址：http://localhost:5173 或 http://localhost:5174
```

### 生产构建
```bash
# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview
```

## 目录结构

```
lndx/
├─ frontend/                    # Vue前端项目
│  ├─ src/
│  │  ├─ views/                # 页面组件
│  │  │  ├─ Dashboard.vue      # 控制面板
│  │  │  ├─ Student.vue        # 学生管理
│  │  │  ├─ Course.vue         # 课程管理
│  │  │  ├─ Application.vue    # 报名管理
│  │  │  ├─ Analysis.vue       # 数据分析
│  │  │  └─ Setting.vue        # 系统设置
│  │  ├─ components/           # 业务组件
│  │  │  └─ BaseLayout.vue     # 基础布局
│  │  ├─ router/               # 路由配置
│  │  ├─ store/                # 状态管理
│  │  ├─ api/                  # 接口请求
│  │  ├─ assets/               # 静态资源
│  │  ├─ utils/                # 工具函数
│  │  ├─ App.vue               # 根组件
│  │  └─ main.js               # 入口文件
│  ├─ public/                  # 公共资源
│  ├─ package.json             # 依赖配置
│  └─ vite.config.js           # Vite配置
├─ docs/                       # 项目文档
│  └─ CHANGELOG.md             # 变更日志
└─ README.md                   # 项目说明
```

## 开发规范

### 代码注释
- 使用JSDoc注释规范
- 组件、函数、模块需添加详细注释
- 复杂逻辑需要内联注释说明

### 文档更新规则
- 每次代码变更后，必须更新docs/CHANGELOG.md文件记录变更内容
- 根据版本控制指南，定期创建新的版本文档
- 确保README.md始终反映最新的系统状态和功能

## 版本信息

- **当前版本：** v1.0.0-dev
- **最后更新：** 2025-01-05
- **开发状态：** 开发中

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues：[GitHub Issues](https://github.com/your-repo/issues)
- 邮箱：your-email@example.com
