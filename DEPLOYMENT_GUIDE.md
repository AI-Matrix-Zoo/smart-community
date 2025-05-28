# 智慧小区生活平台 - Render 部署指南

## 📋 部署概述

本项目采用前后端分离架构，需要在Render上部署两个独立的服务：
- **后端服务**: Node.js API服务
- **前端服务**: 静态网站

## 🚀 部署步骤

### 准备工作

1. **确保代码已推送到Git仓库**（GitHub、GitLab等）
2. **注册Render账号**：访问 [render.com](https://render.com) 并注册
3. **连接Git仓库**：在Render控制台中连接你的Git仓库

### 方案一：使用配置文件部署（推荐）

#### 1. 后端服务部署

1. 在Render控制台点击 "New +" → "Web Service"
2. 连接你的Git仓库
3. 配置服务：
   - **Name**: `smart-community-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free`

4. 设置环境变量：
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=https://smart-community-frontend.onrender.com
   ```

5. 高级设置：
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: `Yes`

#### 2. 前端服务部署

1. 在Render控制台点击 "New +" → "Static Site"
2. 连接同一个Git仓库
3. 配置服务：
   - **Name**: `smart-community-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. 设置环境变量：
   ```
   VITE_API_BASE_URL=https://smart-community-backend.onrender.com
   VITE_APP_TITLE=智慧小区生活平台
   VITE_NODE_ENV=production
   ```

5. 高级设置：
   - **Auto-Deploy**: `Yes`
   - **Headers**: 添加安全头部（可选）
   - **Redirects**: 配置SPA路由重定向

### 方案二：手动创建服务

如果不使用配置文件，可以按照以下步骤手动创建：

#### 后端服务
```bash
# 1. 创建Web Service
# 2. 选择仓库和分支
# 3. 设置Root Directory为空（使用整个仓库）
# 4. 配置构建和启动命令
Build Command: cd backend && npm install && npm run build
Start Command: cd backend && npm start
```

#### 前端服务
```bash
# 1. 创建Static Site
# 2. 选择仓库和分支
# 3. 设置Root Directory为 frontend
# 4. 配置构建命令
Build Command: npm install && npm run build
Publish Directory: dist
```

## 🔧 配置文件说明

### 后端配置 (render.yaml)
```yaml
services:
  - type: web
    name: smart-community-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://smart-community-frontend.onrender.com
    healthCheckPath: /api/health
```

### 前端配置 (frontend/render.yaml)
```yaml
services:
  - type: web
    name: smart-community-frontend
    env: static
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://smart-community-backend.onrender.com
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

## 🌐 环境变量配置

### 后端环境变量
| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `10000` |
| `JWT_SECRET` | JWT密钥 | `your-secret-key` |
| `FRONTEND_URL` | 前端URL | `https://your-frontend.onrender.com` |

### 前端环境变量
| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端API地址 | `https://your-backend.onrender.com` |
| `VITE_APP_TITLE` | 应用标题 | `智慧小区生活平台` |
| `VITE_NODE_ENV` | 环境标识 | `production` |

## 📝 部署注意事项

### 1. 服务启动顺序
- **先部署后端服务**，获得后端URL
- **再部署前端服务**，使用后端URL配置环境变量

### 2. 域名配置
- 后端服务URL格式：`https://service-name.onrender.com`
- 前端服务URL格式：`https://site-name.onrender.com`
- 确保前后端的环境变量中使用正确的URL

### 3. 免费计划限制
- **冷启动**：免费服务在无活动15分钟后会休眠
- **构建时间**：免费计划有构建时间限制
- **带宽**：每月100GB免费带宽

### 4. 数据库考虑
- 当前使用SQLite，数据存储在容器中
- 生产环境建议使用外部数据库（PostgreSQL等）
- Render提供免费的PostgreSQL数据库

## 🔍 部署验证

### 1. 后端服务检查
```bash
# 健康检查
curl https://your-backend.onrender.com/api/health

# 预期响应
{
  "success": true,
  "message": "智慧小区生活平台API服务运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. 前端服务检查
- 访问前端URL，确保页面正常加载
- 测试用户注册和登录功能
- 验证API调用是否正常

### 3. 功能测试
- 用户认证功能
- 建议反馈功能
- 二手市场功能
- 公告管理功能
- 管理员后台功能

## 🛠️ 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 检查package.json中的scripts
# 确保构建命令正确
# 检查依赖版本兼容性
```

#### 2. 服务无法启动
```bash
# 检查环境变量配置
# 查看Render日志
# 验证启动命令
```

#### 3. CORS错误
```bash
# 确保后端CORS配置包含前端域名
# 检查FRONTEND_URL环境变量
```

#### 4. API调用失败
```bash
# 验证VITE_API_BASE_URL配置
# 检查网络连接
# 查看浏览器控制台错误
```

### 日志查看
- 在Render控制台的服务页面查看实时日志
- 使用日志过滤功能定位问题

## 🔄 持续部署

### 自动部署
- 推送到主分支自动触发部署
- 可以在Render控制台暂停自动部署

### 手动部署
- 在Render控制台点击"Manual Deploy"
- 选择特定的commit进行部署

## 📊 监控和维护

### 1. 服务监控
- 使用Render内置的监控功能
- 设置健康检查端点
- 配置告警通知

### 2. 性能优化
- 启用Gzip压缩
- 配置CDN（付费功能）
- 优化构建产物大小

### 3. 安全配置
- 使用HTTPS（Render自动提供）
- 配置安全头部
- 定期更新依赖

## 🎯 生产环境建议

### 1. 数据库升级
```bash
# 使用PostgreSQL替代SQLite
# 配置数据库连接
# 实现数据迁移脚本
```

### 2. 文件存储
```bash
# 使用云存储服务（AWS S3等）
# 配置文件上传功能
# 实现图片压缩和优化
```

### 3. 缓存策略
```bash
# 实现Redis缓存
# 配置CDN缓存
# 优化API响应时间
```

### 4. 监控和日志
```bash
# 集成APM工具
# 配置错误追踪
# 实现业务指标监控
```

## 📞 支持和帮助

- **Render文档**: https://render.com/docs
- **项目仓库**: 查看README和Issues
- **社区支持**: Render社区论坛

---

🎉 **部署完成后，你的智慧小区生活平台就可以在线访问了！** 