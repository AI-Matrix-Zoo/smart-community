# 智慧小区生活平台

一个现代化的智慧小区生活服务平台，提供建议反馈、二手市场、公告管理等功能。采用前后端分离架构，支持多角色权限管理。

## 🏗️ 项目架构

```
智慧小区生活平台/
├── frontend/          # 前端项目 (React + TypeScript + Vite)
├── backend/           # 后端项目 (Node.js + TypeScript + Express)
├── manage.sh          # 全栈项目管理脚本
└── README.md          # 项目说明文档
```

## ✨ 功能特性

### 🔐 用户认证系统
- 手机号注册/登录
- JWT token认证
- 多角色权限管理（用户/物业/管理员）

### 💡 建议反馈系统
- 居民提交建议
- 物业/管理员处理建议
- 实时状态更新和进度跟踪

### 🛒 二手市场
- 发布二手物品
- 浏览和搜索物品
- 联系卖家功能

### 📢 公告管理
- 物业/管理员发布公告
- 公告编辑和删除
- 按时间排序显示

### 👥 用户管理
- 用户信息管理
- 角色权限分配
- 用户数据统计

## 🚀 快速开始

### 使用一键管理脚本（推荐）

```bash
# 显示帮助信息
./manage.sh help

# 交互式菜单
./manage.sh

# 常用命令
./manage.sh install    # 安装所有依赖
./manage.sh build      # 构建所有项目
./manage.sh dev        # 启动开发环境
./manage.sh start      # 启动生产环境
./manage.sh status     # 查看服务状态
```

### 手动启动

1. **安装依赖**
   ```bash
   # 后端依赖
   cd backend && npm install
   
   # 前端依赖
   cd ../frontend && npm install
   ```

2. **启动开发环境**
   ```bash
   # 启动后端 (端口: 3001)
   cd backend && npm run dev &
   
   # 启动前端 (端口: 5173)
   cd frontend && npm run dev
   ```

3. **访问应用**
   - 前端: http://localhost:5173
   - 后端API: http://localhost:3001

## 🚀 部署指南

### 本地开发环境

#### 快速启动
```bash
# 使用管理脚本一键启动
./manage.sh quick-start

# 或者使用测试脚本
./test-services.sh
```

#### 手动启动
```bash
# 启动后端
cd backend && npm install && npm start &

# 启动前端
cd frontend && npm install && npm run dev &
```

### 生产环境部署

#### Render平台部署（推荐）

1. **准备部署**
   ```bash
   # 运行部署准备脚本
   ./prepare-deploy.sh
   ```

2. **推送代码到Git仓库**
   ```bash
   git add .
   git commit -m "准备部署到Render"
   git push origin main
   ```

3. **在Render创建服务**
   - 后端服务：Web Service
   - 前端服务：Static Site
   
   详细步骤请查看：[部署指南](DEPLOYMENT_GUIDE.md)

4. **验证部署**
   - 后端健康检查：`https://your-backend.onrender.com/api/health`
   - 前端访问：`https://your-frontend.onrender.com`

#### 其他部署平台
- **Vercel**: 适合前端静态网站部署
- **Heroku**: 适合全栈应用部署
- **Netlify**: 适合前端部署
- **Railway**: 适合后端API部署

### 环境变量配置

#### 后端环境变量
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-domain.com
```

#### 前端环境变量
```bash
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_APP_TITLE=智慧小区生活平台
VITE_NODE_ENV=production
```

## 🛠️ 技术栈

### 前端技术
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **React Router** - 客户端路由
- **Context API** - 状态管理

### 后端技术
- **Node.js** - JavaScript运行时
- **TypeScript** - 类型安全开发
- **Express.js** - Web应用框架
- **SQLite** - 轻量级数据库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **Joi** - 数据验证

## 📁 项目结构

### 前端结构
```
frontend/
├── src/
│   ├── components/     # 可复用组件
│   ├── contexts/       # React Context
│   ├── services/       # API服务
│   └── types.ts        # TypeScript类型定义
├── package.json
└── vite.config.ts
```

### 后端结构
```
backend/
├── src/
│   ├── routes/         # API路由
│   ├── middleware/     # 中间件
│   ├── config/         # 配置文件
│   └── types/          # 类型定义
├── data/               # SQLite数据库
├── manage.sh           # 后端管理脚本
└── package.json
```

## 🔧 管理脚本功能

### 开发相关
- `install` - 安装所有依赖
- `build` - 构建所有项目
- `dev` - 启动开发环境（前后端同时启动）
- `start` - 启动生产环境

### 服务管理
- `stop` - 停止所有服务
- `status` - 查看服务状态
- `logs` - 查看服务日志

### 测试和部署
- `test` - 运行测试
- `deploy` - 部署管理
- `manage` - 项目管理（清理、更新等）

## 🌐 部署指南

### Render平台部署

1. **后端部署**
   - 使用 `backend/render.yaml` 配置
   - 自动检测并部署Node.js应用
   - 配置环境变量和持久化存储

2. **前端部署**
   - 使用 `render-frontend.yaml` 配置
   - 静态站点部署
   - 自动构建和发布

详细部署步骤请参考：
- [后端部署指南](./backend/DEPLOYMENT.md)
- [前端部署指南](./frontend/DEPLOYMENT.md)

### Docker部署

```bash
# 构建后端镜像
cd backend && docker build -t smart-community-backend .

# 构建前端镜像
cd frontend && docker build -t smart-community-frontend .

# 使用docker-compose启动
docker-compose up -d
```

## 🧪 测试

### API测试
```bash
# 使用管理脚本
./manage.sh test

# 或手动测试
cd backend && node test-api.js
```

### 前端测试
```bash
cd frontend && npm test
```

## 📊 数据库设计

### 主要数据表
- **users** - 用户信息
- **suggestions** - 建议反馈
- **suggestion_progress** - 建议处理进度
- **market_items** - 二手市场物品
- **announcements** - 公告信息

## 🔐 安全特性

- JWT token认证
- 密码bcrypt加密
- 角色权限控制
- 输入数据验证
- CORS跨域保护

## 🎯 开发规范

- TypeScript严格模式
- ESLint代码检查
- Prettier代码格式化
- Git提交规范
- API RESTful设计

## 📈 性能优化

- Vite快速构建
- 代码分割和懒加载
- 静态资源优化
- 数据库查询优化
- 缓存策略

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 📝 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完整的前后端功能
- 部署配置和文档

## 📞 技术支持

- 项目文档: [README.md](./README.md)
- 后端文档: [backend/README.md](./backend/README.md)
- 前端文档: [frontend/README.md](./frontend/README.md)
- 部署指南: [DEPLOYMENT.md](./backend/DEPLOYMENT.md)

## 📄 许可证

MIT License

---

## 🎉 快速体验

```bash
# 克隆项目
git clone <repository-url>
cd 智慧小区生活平台

# 一键启动
./manage.sh install
./manage.sh dev

# 访问应用
open http://localhost:5173
```

祝您使用愉快！ 🏠✨
