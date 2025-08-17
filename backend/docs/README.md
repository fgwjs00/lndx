# 后端文档管理系统

## 📖 文档管理说明

本目录包含学生报名及档案管理系统后端的所有更新文档和变更记录。

## 🗂️ 目录结构

```
docs/
├── CHANGELOG.md              # 🏠 主索引文件 - 快速查看最新变更
├── README.md                # 📋 本文件 - 文档管理说明
├── changelogs/              # 📅 日常变更记录
│   └── YYYY/MM/             # 按年月分类
│       └── YYYY-MM-DD.md    # 具体日期的变更记录
├── releases/                # 🚀 版本发布记录
│   └── vX.Y.Z.md           # 版本发布说明
└── archives/                # 📦 归档文档
    └── old-docs/           # 历史版本文档
```

## 📝 文档创建规范

### 1. 日常变更记录 (changelogs/)

每天有代码变更时，在对应日期创建变更记录：

**文件路径**: `changelogs/YYYY/MM/YYYY-MM-DD.md`

**文件模板**:
```markdown
# 后端系统变更记录 - YYYY-MM-DD

## 📊 变更概述
- 变更类型：[功能新增/问题修复/性能优化/重构/文档更新]
- 影响范围：[API/数据库/配置/依赖]
- 优先级：[🔥紧急/⭐重要/📝常规]

## 🔄 详细变更

### ✅ 新增功能
- 功能描述

### 🔧 问题修复  
- 问题描述和解决方案

### 📈 性能优化
- 优化内容和效果

## 🧪 测试验证
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] API文档更新

## 📋 相关链接
- PR: #xxx
- Issue: #xxx
- 相关文档: [链接]
```

### 2. 版本发布记录 (releases/)

重大版本发布时创建版本记录：

**文件路径**: `releases/vX.Y.Z.md`

**版本号规范**:
- `v1.0.0`: 正式版本
- `v1.0.0-beta`: 测试版本  
- `v1.0.0-alpha`: 内测版本

### 3. 归档管理 (archives/)

- 过时的文档移动到archives目录
- 保持主目录的整洁性
- 重要历史文档仍可查阅

## 🔄 文档更新流程

### 日常开发流程
1. **代码变更** → 完成功能开发
2. **记录变更** → 在对应日期文件记录变更
3. **更新主索引** → 更新CHANGELOG.md主文件
4. **提交代码** → 提交时包含文档更新

### 版本发布流程
1. **准备发布** → 整理版本变更内容
2. **创建发布记录** → 在releases目录创建版本文件
3. **更新主索引** → 更新版本发布记录表
4. **版本标记** → Git打tag标记版本

## 🛠️ 维护工具

### 创建今日变更记录
```bash
# PowerShell
$date = Get-Date -Format "yyyy-MM-dd"
$year = Get-Date -Format "yyyy"  
$month = Get-Date -Format "MM"
$dir = "docs\changelogs\$year\$month"
New-Item -ItemType Directory -Path $dir -Force
New-Item -ItemType File -Path "$dir\$date.md"
```

### 快速查看最近变更
```bash
# 查看最近5天的变更文件
Get-ChildItem docs\changelogs -Recurse -Filter "*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

## 📋 文档质量标准

### ✅ 好的变更记录
- 清晰的变更描述
- 包含影响范围分析
- 有测试验证结果
- 提供相关链接

### ❌ 避免的问题
- 过于简单的描述 ("修复bug")
- 缺少测试验证
- 没有关联相关问题
- 格式不一致

## 🔗 相关链接

- [项目主README](../README.md) - 项目基本信息
- [开发规范](.cursorrules) - 代码开发规范
- [API文档](http://localhost:3000/api/docs) - 在线API文档
- [数据库迁移文档](../DATABASE_MIGRATION.md) - 数据库相关文档

---

**维护说明**：本文档管理系统帮助团队更好地跟踪项目变更，保持开发透明度，便于问题排查和版本管理。

**更新频率**：
- 日常变更记录：每次代码变更后及时更新
- 主索引文件：每周整理一次
- 版本发布记录：版本发布时创建
- 文档清理：每月进行一次归档整理

