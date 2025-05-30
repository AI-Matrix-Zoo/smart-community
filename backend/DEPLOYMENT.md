# 智慧小区生活平台 - 部署指南

本文档详细介绍如何将智慧小区生活平台后端API部署到Render平台。

## 📋 部署前准备

### 1. 代码准备
确保你的代码已经推送到GitHub仓库，并且包含以下文件：
- `render.yaml` - Render部署配置
- `package.json` - 项目依赖
- `Dockerfile` - 容器配置（可选）
- `.env.example` - 环境变量示例

### 2. 环境要求
- Node.js 18+
- npm 或 yarn
- Git

## 🚀 Render平台部署

### 方法一：使用render.yaml自动部署（推荐）

1. **准备GitHub仓库**
   ```bash
   # 确保代码已推送到GitHub
   git add .
   git commit -m "准备部署到Render"
   git push origin main
   ```

2. **在Render创建服务**
   - 访问 [Render Dashboard](https://dashboard.render.com/)
   - 点击 "New +" → "Web Service"
   - 连接你的GitHub仓库
   - 选择包含后端代码的仓库

3. **配置检测**
   Render会自动检测到`render.yaml`文件并使用其中的配置：
   ```yaml
   services:
     - type: web
       name: smart-community-backend
       env: node
       plan: free
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: JWT_SECRET
           generateValue: true
         # ... 其他环境变量
   ```

4. **部署启动**
   - 点击 "Create Web Service"
   - Render会自动开始构建和部署过程
   - 等待部署完成（通常需要5-10分钟）

### 方法二：手动配置部署

如果你选择手动配置而不使用`render.yaml`：

1. **基本设置**
   - Service Name: `smart-community-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **环境变量配置**
   在Render控制台的Environment页面添加：
   ```
   NODE_ENV=production
   JWT_SECRET=[自动生成或自定义]
   JWT_EXPIRES_IN=7d
   DB_PATH=./data/community.db
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   LOG_LEVEL=info
   ```

3. **持久化存储**
   - 添加Disk存储
   - Name: `data`
   - Mount Path: `/app/data`
   - Size: 1GB

## 🔧 环境变量说明

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| NODE_ENV | 是 | production | 运行环境 |
| JWT_SECRET | 是 | - | JWT签名密钥（建议使用Render自动生成） |
| JWT_EXPIRES_IN | 否 | 7d | JWT过期时间 |
| DB_PATH | 否 | ./data/community.db | SQLite数据库路径 |
| UPLOAD_DIR | 否 | ./uploads | 文件上传目录 |
| MAX_FILE_SIZE | 否 | 5242880 | 最大文件大小（5MB） |
| LOG_LEVEL | 否 | info | 日志级别 |

## 📊 部署后验证

### 1. 健康检查
部署完成后，访问健康检查端点：
```
https://your-service-name.onrender.com/health
```

应该返回：
```json
{
  "success": true,
  "message": "智慧小区生活平台后端服务运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. API端点测试
测试主要API端点：

**获取公告列表**
```bash
curl https://your-service-name.onrender.com/api/announcements
```

**用户登录（测试端点响应）**
```bash
curl -X POST https://your-service-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"password123"}'
```

### 3. 使用管理脚本测试
如果在本地，可以使用管理脚本测试：
```bash
# 设置API基础URL
export API_BASE_URL=https://your-service-name.onrender.com

# 运行API测试
./manage.sh test-api
```

## 🔄 前端配置

部署后端后，需要更新前端配置以连接到新的API：

### 1. 更新前端环境变量
在前端项目的`.env.production`文件中：
```
VITE_API_BASE_URL=https://your-service-name.onrender.com/api
```

### 2. 前端部署配置
使用提供的`frontend/render.yaml`配置：
```yaml
services:
  - type: static_site
    name: smart-community-frontend
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://smart-community-backend.onrender.com/api
```

## 🛠️ 常见问题解决

### 1. 构建失败
**问题**: npm install 或 npm run build 失败
**解决方案**:
- 检查`package.json`中的依赖版本
- 确保Node.js版本兼容（推荐18+）
- 查看构建日志中的具体错误信息

### 2. 服务启动失败
**问题**: 服务部署成功但无法访问
**解决方案**:
- 检查环境变量配置
- 确保`PORT`环境变量未被覆盖（Render会自动设置）
- 查看服务日志

### 3. 数据库问题
**问题**: SQLite数据库相关错误
**解决方案**:
- 确保持久化磁盘已正确配置
- 检查`DB_PATH`环境变量
- 重启服务以重新初始化数据库

### 4. CORS错误
**问题**: 前端无法访问API
**解决方案**:
- 更新后端CORS配置
- 确保前端域名在允许列表中
- 检查API URL是否正确

## 📈 性能优化

### 1. 免费计划限制
Render免费计划有以下限制：
- 15分钟无活动后服务会休眠
- 每月750小时运行时间
- 有限的CPU和内存资源

### 2. 优化建议
- 使用CDN加速静态资源
- 实现API响应缓存
- 优化数据库查询
- 考虑升级到付费计划以获得更好性能

## 🔐 安全配置

### 1. 环境变量安全
- 使用Render的自动生成功能创建JWT_SECRET
- 不要在代码中硬编码敏感信息
- 定期轮换密钥

### 2. API安全
- 启用HTTPS（Render默认提供）
- 实现请求频率限制
- 验证所有输入数据
- 使用强密码策略

## 📝 维护和监控

### 1. 日志监控
- 在Render控制台查看实时日志
- 设置日志级别为适当值
- 监控错误和异常

### 2. 数据备份
- 定期备份SQLite数据库
- 使用版本控制管理代码
- 考虑实现自动备份策略

### 3. 更新部署
```bash
# 更新代码
git add .
git commit -m "更新功能"
git push origin main

# Render会自动重新部署
```

## 🆘 故障排除

### 查看日志
1. 在Render控制台进入你的服务
2. 点击"Logs"标签
3. 查看实时日志输出

### 重启服务
1. 在Render控制台进入你的服务
2. 点击"Manual Deploy"
3. 选择"Clear build cache & deploy"

### 联系支持
如果遇到无法解决的问题：
- 查看Render官方文档
- 访问Render社区论坛
- 联系Render技术支持

---

## 📞 技术支持

如果在部署过程中遇到问题，可以：
1. 查看本项目的GitHub Issues
2. 参考Render官方文档
3. 联系项目维护者

祝你部署成功！🎉 