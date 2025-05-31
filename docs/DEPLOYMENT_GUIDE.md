# 智慧小区生活平台 - 部署指南

## 环境要求

- Node.js 18+
- npm 或 yarn
- PM2 (进程管理)
- Nginx (反向代理)

## 部署步骤

### 1. 克隆代码

```bash
git clone https://github.com/AI-Matrix-Zoo/smart-community.git
cd smart-community
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量文件
nano backend/.env
```

需要配置的关键变量：
- `JWT_SECRET`: JWT密钥（必须修改）
- `FRONTEND_URL`: 前端访问地址
- `EMAIL_*`: 邮箱服务配置
- `ALIBABA_CLOUD_*`: 阿里云短信服务（可选）

### 3. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 4. 构建前端

```bash
cd frontend
npm run build
```

### 5. 启动后端服务

```bash
cd backend
pm2 start ecosystem.config.js
```

### 6. 配置Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/smart-community/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. 重启服务

```bash
sudo systemctl reload nginx
pm2 restart all
```

## 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建前端
cd frontend
npm run build

# 复制到nginx目录（如果需要）
sudo cp -r dist/* /usr/share/nginx/html/

# 重启服务
pm2 restart all
sudo systemctl reload nginx
```

## 注意事项

1. **安全性**：
   - 修改默认的JWT密钥
   - 配置防火墙规则
   - 使用HTTPS（推荐）

2. **数据备份**：
   - 定期备份SQLite数据库文件
   - 备份上传的图片文件

3. **监控**：
   - 使用PM2监控后端服务状态
   - 配置日志轮转

## 故障排除

### 常见问题

1. **前端页面空白**：
   - 检查nginx配置
   - 确认前端构建成功
   - 查看浏览器控制台错误

2. **API请求失败**：
   - 检查后端服务状态：`pm2 status`
   - 查看后端日志：`pm2 logs`
   - 确认nginx代理配置

3. **邮箱验证失败**：
   - 检查邮箱服务配置
   - 确认邮箱密码正确
   - 查看后端日志

### 日志查看

```bash
# 查看PM2日志
pm2 logs

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 概述

本项目包含前端（React + TypeScript）和后端（Node.js + Express）两个部分，支持本地开发和生产环境部署。

## 环境配置

### API地址自动切换

前端会根据环境自动选择正确的API地址：

- **开发环境**: 自动使用 `http://localhost:3000/api`
- **生产环境**: 优先使用环境变量 `VITE_API_BASE_URL`，否则使用相对路径 `/api`

### 环境变量配置

#### 前端环境变量

在 `frontend/` 目录下创建 `.env.local` 文件（用于本地开发）：

```bash
# 可选：自定义API地址（通常不需要在开发环境设置）
# VITE_API_BASE_URL=http://localhost:3000/api

# 其他配置
VITE_APP_TITLE=智慧小区生活平台
```

#### 生产环境变量

在Render或其他云平台设置以下环境变量：

```bash
# 前端环境变量
VITE_API_BASE_URL=https://your-backend-domain.com/api

# 后端环境变量
NODE_ENV=production
PORT=3000
DATABASE_URL=your-database-connection-string
JWT_SECRET=your-jwt-secret-key
```

## 部署方案

### 方案1: 分离部署（推荐）

前端和后端分别部署到不同的服务：

#### 前端部署 (Render Static Site)

1. **仓库配置**:
   - 根目录: `frontend/`
   - 构建命令: `npm install && npm run build`
   - 发布目录: `dist`

2. **环境变量**:
   ```bash
   VITE_API_BASE_URL=https://smart-community-backend.onrender.com/api
   ```

3. **自动配置**:
   - SPA路由重定向已在 `frontend/render.yaml` 中配置
   - 缓存策略已优化

#### 后端部署 (Render Web Service)

1. **仓库配置**:
   - 根目录: `backend/`
   - 构建命令: `npm install`
   - 启动命令: `npm start`

2. **环境变量**:
   ```bash
   NODE_ENV=production
   PORT=3000
   # 其他数据库和认证配置
   ```

### 方案2: 同域部署

如果前后端部署在同一域名下（如使用反向代理）：

1. **前端配置**: 不设置 `VITE_API_BASE_URL`，使用默认的相对路径 `/api`
2. **反向代理配置**: 将 `/api/*` 请求代理到后端服务

## 本地开发

### 启动开发环境

```bash
# 使用管理脚本（推荐）
./manage.sh quick-start

# 或手动启动
# 终端1: 启动后端
cd backend && npm run dev

# 终端2: 启动前端
cd frontend && npm run dev
```

### 访问地址

- 前端: http://localhost:5173
- 后端: http://localhost:3000
- API健康检查: http://localhost:3000/api/health

## 验证部署

### 1. 检查API连接

访问前端应用，打开浏览器开发者工具：

1. **Network标签**: 检查API请求是否正确发送到后端
2. **Console标签**: 查看是否有CORS或网络错误
3. **Application标签**: 检查认证令牌是否正确存储

### 2. 功能测试

1. **用户注册/登录**: 测试认证功能
2. **数据同步**: 在不同设备/浏览器测试数据是否实时同步
3. **路由测试**: 刷新页面确保SPA路由正常工作

### 3. 性能检查

1. **加载速度**: 首次加载和后续导航速度
2. **缓存策略**: 静态资源是否正确缓存
3. **API响应时间**: 数据获取和提交的响应速度

## 常见问题

### 1. API请求失败

**症状**: 前端无法获取数据，控制台显示网络错误

**解决方案**:
- 检查 `