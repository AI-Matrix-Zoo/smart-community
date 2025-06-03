# 智慧moma生活平台 - 项目文档

## 📋 项目概述

智慧moma生活平台是一个现代化的社区管理系统，提供业主、物业管理员和系统管理员的完整解决方案。

### 🏗️ 技术栈
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript + SQLite
- **认证**: JWT + bcrypt
- **通信**: RESTful API
- **部署**: PM2 + Nginx

### 🎯 主要功能
- 👥 用户管理（业主、物业、管理员）
- 📢 公告管理
- 🔧 报修服务
- 💰 费用管理
- 💬 投诉建议
- 📱 短信通知
- 📧 邮件服务

## 🚀 快速开始

### 方式一：一键启动（推荐新手）
```bash
# 克隆项目
git clone <项目地址>
cd 智慧小区生活平台

# 给脚本执行权限
chmod +x quick-start.sh

# 一键启动
./quick-start.sh
```

### 方式二：使用统一管理脚本
```bash
# 给脚本执行权限
chmod +x unified-manager.sh

# 安装依赖
./unified-manager.sh install

# 初始化配置
./unified-manager.sh init

# 启动开发环境
./unified-manager.sh dev
```

### 方式三：手动启动
```bash
# 安装依赖
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 启动后端
cd backend
npm run dev

# 启动前端（新终端）
cd frontend
npm run dev -- --port 5174
```

## 📜 脚本说明

### 🔧 统一管理脚本 (`unified-manager.sh`)
合并了原有的 `dev-manager.sh` 和 `manage.sh` 功能，提供完整的项目管理能力。

**主要特性**:
- ✅ 开发和生产环境统一管理
- ✅ 自动端口检测和释放
- ✅ 智能配置文件生成
- ✅ 增强的日志管理
- ✅ 服务状态监控

**常用命令**:
```bash
./unified-manager.sh help      # 查看帮助
./unified-manager.sh status    # 查看状态
./unified-manager.sh dev       # 启动开发环境
./unified-manager.sh dev-stop  # 停止开发环境
```

### 🚀 快速启动脚本 (`quick-start.sh`)
为新手提供的一键启动脚本，自动处理依赖安装和环境配置。

## 🔌 端口配置

### 开发环境
- **前端**: http://localhost:5174
- **后端**: http://localhost:3001
- **API**: http://localhost:3001/api
- **健康检查**: http://localhost:3001/health

### 生产环境
- **前端**: http://localhost:5173
- **后端**: http://localhost:3000
- **API**: http://localhost:3000/api

## 👥 演示账户

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 业主 | resident@example.com | password123 | 查看公告、报修、缴费、投诉 |
| 物业 | property@example.com | property123 | 处理报修、管理公告、查看投诉 |
| 管理员 | admin@example.com | admin123 | 全部功能、用户管理、系统设置 |

## 📁 项目结构

```
智慧小区生活平台/
├── backend/                 # 后端代码
│   ├── src/                # 源代码
│   ├── dist/               # 构建输出
│   ├── database/           # 开发数据库
│   ├── uploads/            # 文件上传
│   ├── .env                # 生产环境配置
│   ├── .env.development    # 开发环境配置
│   └── package.json
├── frontend/               # 前端代码
│   ├── src/               # 源代码
│   ├── dist/              # 构建输出
│   ├── .env.development   # 开发环境配置
│   ├── .env.production    # 生产环境配置
│   └── package.json
├── docs/                  # 项目文档
│   ├── 本地开发测试指南.md
│   ├── 脚本合并说明.md
│   └── README.md
├── logs/                  # 日志文件
├── scripts/               # 辅助脚本
├── unified-manager.sh     # 统一管理脚本
├── quick-start.sh         # 快速启动脚本
├── dev-manager.sh         # 开发环境管理（旧）
├── manage.sh              # 生产环境管理（旧）
└── README.md
```

## 🔧 环境要求

### 必需软件
- **Node.js**: 18.0+ (推荐 18.17.0 或更高)
- **npm**: 9.0+ (通常随 Node.js 安装)
- **Git**: 版本控制

### 可选软件
- **PM2**: 进程管理 (生产环境推荐)
- **VS Code**: 开发环境

### 系统兼容性
- ✅ macOS (推荐)
- ✅ Linux (Ubuntu/CentOS)
- ✅ Windows (WSL2 推荐)

## 🧪 测试指南

### 环境验证
```bash
# 检查项目状态
./unified-manager.sh status

# 检查服务是否正常
curl http://localhost:3001/health
curl http://localhost:5174
```

### API 测试
```bash
# 用户注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "phone": "13800138000",
    "role": "resident"
  }'

# 用户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 文档导航

- [本地开发测试指南](./docs/本地开发测试指南.md) - 详细的开发环境搭建和测试流程
- [脚本合并说明](./docs/脚本合并说明.md) - 新旧脚本对比和迁移指南

## ❓ 常见问题

### Q: 端口被占用怎么办？
A: 统一管理脚本会自动检测并释放被占用的端口。

### Q: 依赖安装失败？
A: 尝试清理缓存：`npm cache clean --force`，然后重新安装。

### Q: 前端无法访问后端？
A: 检查后端是否正常运行：`curl http://localhost:3001/health`

### Q: 数据库连接失败？
A: 检查数据库文件是否存在：`ls -la backend/database/`

## 🔄 开发流程

### 日常开发
1. 启动开发环境：`./unified-manager.sh dev`
2. 修改代码（支持热重载）
3. 测试功能
4. 提交代码

### 生产部署
1. 构建项目：`./unified-manager.sh build`
2. 部署服务：`./unified-manager.sh deploy`
3. 检查状态：`./unified-manager.sh status`

## 📞 技术支持

如果遇到问题：
1. 查看[常见问题](#常见问题)部分
2. 检查项目日志：`tail -f logs/*.log`
3. 查看项目状态：`./unified-manager.sh status`
4. 联系开发团队

## 📄 许可证

MIT License

---

**祝您使用愉快！** 🎉 