# 智慧小区生活平台 - 部署指南

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
- 检查 `VITE_API_BASE_URL` 环境变量是否正确设置
- 确认后端服务正在运行且可访问
- 检查CORS配置是否允许前端域名

### 2. 认证问题

**症状**: 登录后立即退出，或API返回401错误

**解决方案**:
- 检查JWT密钥配置
- 确认认证令牌正确存储在localStorage
- 验证API请求头是否包含Authorization字段

### 3. 路由404错误

**症状**: 刷新页面或直接访问路由时显示404

**解决方案**:
- 确认SPA重定向规则已正确配置
- 检查 `frontend/public/_redirects` 文件
- 验证服务器配置支持SPA路由

### 4. 数据不同步

**症状**: 用户操作后数据没有实时更新

**解决方案**:
- 确认前端使用的是 `apiService` 而不是 `dataService`
- 检查后端API是否正确处理数据更新
- 验证数据库连接和操作

## 安全注意事项

1. **环境变量**: 不要在代码中硬编码敏感信息
2. **HTTPS**: 生产环境必须使用HTTPS
3. **CORS**: 正确配置CORS策略，不要使用通配符
4. **认证**: 使用强JWT密钥，设置合理的过期时间
5. **输入验证**: 前后端都要进行数据验证

## 监控和维护

1. **日志监控**: 设置应用日志和错误监控
2. **性能监控**: 监控API响应时间和前端加载速度
3. **定期更新**: 及时更新依赖包和安全补丁
4. **备份策略**: 定期备份数据库和重要配置

---

**更新时间**: 2024年12月  
**版本**: 1.0.0 