# 智慧小区生活平台 - 项目结构

本文档详细描述了项目的目录结构和文件组织方式。

## 📁 根目录结构

```
智慧小区生活平台/
├── frontend/                   # 前端项目目录
├── backend/                    # 后端项目目录
├── manage.sh                   # 全栈项目管理脚本
├── README.md                   # 项目总体说明文档
├── PROJECT_STRUCTURE.md        # 项目结构文档（本文件）
├── .gitignore                  # Git忽略文件配置
├── final_review_gate.py        # 交互式审查脚本
└── metadata.json               # 项目元数据
```

## 🎨 前端项目结构

```
frontend/
├── src/                        # 源代码目录
│   ├── components/             # 可复用组件
│   │   ├── common/             # 通用组件
│   │   ├── forms/              # 表单组件
│   │   └── layout/             # 布局组件
│   ├── contexts/               # React Context
│   │   ├── AuthContext.tsx     # 认证上下文
│   │   └── ThemeContext.tsx    # 主题上下文
│   ├── pages/                  # 页面组件
│   │   ├── admin/              # 管理员页面
│   │   │   └── AdminDashboardPage.tsx
│   │   ├── HomePage.tsx        # 首页
│   │   ├── LoginPage.tsx       # 登录页
│   │   ├── RegisterPage.tsx    # 注册页
│   │   ├── MarketPage.tsx      # 二手市场页
│   │   └── SuggestionsPage.tsx # 建议反馈页
│   ├── services/               # API服务
│   │   ├── api.ts              # API客户端
│   │   ├── auth.ts             # 认证服务
│   │   ├── suggestions.ts      # 建议服务
│   │   ├── market.ts           # 市场服务
│   │   └── announcements.ts    # 公告服务
│   ├── types.ts                # TypeScript类型定义
│   ├── App.tsx                 # 主应用组件
│   └── index.tsx               # 应用入口
├── public/                     # 静态资源
├── index.html                  # HTML模板
├── package.json                # 项目依赖配置
├── tsconfig.json               # TypeScript配置
├── vite.config.ts              # Vite构建配置
├── tailwind.config.js          # Tailwind CSS配置
├── render.yaml                 # Render前端部署配置
├── DEPLOYMENT.md               # 前端部署指南
└── README.md                   # 前端项目说明
```

## ⚙️ 后端项目结构

```
backend/
├── src/                        # 源代码目录
│   ├── routes/                 # API路由
│   │   ├── auth.ts             # 认证路由
│   │   ├── suggestions.ts      # 建议反馈路由
│   │   ├── market.ts           # 二手市场路由
│   │   ├── announcements.ts    # 公告管理路由
│   │   └── admin.ts            # 管理员路由
│   ├── middleware/             # 中间件
│   │   └── auth.ts             # 认证中间件
│   ├── config/                 # 配置文件
│   │   └── database.ts         # 数据库配置
│   ├── types/                  # 类型定义
│   │   └── index.ts            # 主要类型定义
│   └── index.ts                # 应用入口
├── data/                       # 数据存储
│   └── community.db            # SQLite数据库文件
├── dist/                       # 编译输出目录
├── package.json                # 项目依赖配置
├── tsconfig.json               # TypeScript配置
├── Dockerfile                  # Docker容器配置
├── render.yaml                 # Render后端部署配置
├── manage.sh                   # 后端管理脚本
├── test-api.js                 # API测试脚本
├── DEPLOYMENT.md               # 后端部署指南
└── README.md                   # 后端项目说明
```

## 🔧 配置文件说明

### 根目录配置文件

| 文件名 | 用途 | 说明 |
|--------|------|------|
| `manage.sh` | 全栈项目管理 | 一键管理前后端项目的脚本 |
| `.gitignore` | Git配置 | 指定Git忽略的文件和目录 |
| `metadata.json` | 项目元数据 | 项目基本信息配置 |
| `final_review_gate.py` | 开发工具 | 交互式代码审查脚本 |

### 前端配置文件

| 文件名 | 用途 | 说明 |
|--------|------|------|
| `package.json` | 依赖管理 | npm包依赖和脚本配置 |
| `tsconfig.json` | TypeScript配置 | TypeScript编译选项 |
| `vite.config.ts` | 构建配置 | Vite构建工具配置 |
| `tailwind.config.js` | 样式配置 | Tailwind CSS配置 |
| `render.yaml` | 部署配置 | Render平台前端部署配置 |

### 后端配置文件

| 文件名 | 用途 | 说明 |
|--------|------|------|
| `package.json` | 依赖管理 | npm包依赖和脚本配置 |
| `tsconfig.json` | TypeScript配置 | TypeScript编译选项 |
| `Dockerfile` | 容器配置 | Docker镜像构建配置 |
| `render.yaml` | 部署配置 | Render平台后端部署配置 |

## 📊 数据存储结构

### SQLite数据库表

```
data/community.db
├── users                       # 用户表
├── suggestions                 # 建议反馈表
├── suggestion_progress         # 建议进度表
├── market_items                # 二手市场物品表
└── announcements               # 公告表
```

## 🚀 部署文件组织

### Render平台部署

- **后端部署**: `backend/render.yaml`
- **前端部署**: `frontend/render.yaml`

### Docker部署

- **后端镜像**: `backend/Dockerfile`
- **前端镜像**: 可选，通常使用静态部署

## 📝 文档组织

### 项目级文档
- `README.md` - 项目总体介绍
- `PROJECT_STRUCTURE.md` - 项目结构说明（本文件）

### 前端文档
- `frontend/README.md` - 前端项目说明
- `frontend/DEPLOYMENT.md` - 前端部署指南

### 后端文档
- `backend/README.md` - 后端项目说明
- `backend/DEPLOYMENT.md` - 后端部署指南

## 🛠️ 开发工具

### 管理脚本
- **根目录**: `manage.sh` - 全栈项目管理
- **后端**: `backend/manage.sh` - 后端专用管理
- **测试**: `backend/test-api.js` - API测试脚本

### 开发辅助
- `final_review_gate.py` - 交互式代码审查工具

## 📋 最佳实践

### 目录命名规范
- 使用小写字母和连字符
- 功能相关的文件放在同一目录
- 配置文件放在项目根目录

### 文件组织原则
1. **分离关注点**: 前端和后端完全分离
2. **功能聚合**: 相关功能的文件放在一起
3. **配置集中**: 配置文件放在对应项目根目录
4. **文档就近**: 文档放在相关代码附近

### 部署配置管理
- 每个部署平台有独立的配置文件
- 环境变量统一管理
- 部署脚本自动化

## 🔄 项目维护

### 添加新功能
1. 前端: 在 `frontend/src/` 对应目录添加文件
2. 后端: 在 `backend/src/` 对应目录添加文件
3. 更新相关文档

### 配置修改
1. 开发配置: 修改对应的配置文件
2. 部署配置: 更新 `render.yaml` 或 `Dockerfile`
3. 测试配置修改是否生效

### 文档更新
1. 功能变更: 更新对应的 README.md
2. 结构变更: 更新本文件
3. 部署变更: 更新 DEPLOYMENT.md

---

这个项目结构设计遵循了现代全栈开发的最佳实践，确保了代码的可维护性和可扩展性。 