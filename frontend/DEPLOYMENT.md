# 智慧小区生活平台 - 前端部署指南

本文档详细介绍如何将智慧小区生活平台前端应用部署到各种平台。

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 2. 项目构建
```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

## 🚀 Render平台部署（推荐）

### 方法一：使用render.yaml自动部署

1. **准备配置文件**
   
   项目根目录的 `frontend/render.yaml` 已配置好：
   ```yaml
   services:
     - type: static_site
       name: smart-community-frontend
       buildCommand: npm install && npm run build
       staticPublishPath: ./dist
       envVars:
         - key: VITE_API_BASE_URL
           value: https://your-backend-url.onrender.com/api
   ```

2. **在Render创建静态站点**
   - 访问 [Render Dashboard](https://dashboard.render.com/)
   - 点击 "New +" → "Static Site"
   - 连接你的GitHub仓库
   - 选择前端目录或使用根目录配置

3. **配置环境变量**
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```

4. **部署启动**
   - Render会自动构建和部署
   - 等待部署完成（通常需要3-5分钟）

### 方法二：手动配置部署

1. **基本设置**
   - Site Name: `smart-community-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **环境变量配置**
   在Render控制台的Environment页面添加：
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```

## 🌐 其他部署平台

### Vercel部署

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署命令**
   ```bash
   # 登录Vercel
   vercel login
   
   # 部署
   vercel --prod
   ```

3. **环境变量配置**
   ```bash
   vercel env add VITE_API_BASE_URL
   # 输入: https://your-backend-url.onrender.com/api
   ```

### Netlify部署

1. **构建设置**
   - Build Command: `npm run build`
   - Publish Directory: `dist`

2. **环境变量**
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```

3. **重定向配置**
   
   创建 `public/_redirects` 文件：
   ```
   /*    /index.html   200
   ```

### GitHub Pages部署

1. **安装gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **配置package.json**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/repository-name"
   }
   ```

3. **部署命令**
   ```bash
   npm run build
   npm run deploy
   ```

## 🔧 环境变量配置

### 开发环境
创建 `.env.development` 文件：
```
VITE_API_BASE_URL=http://localhost:3001/api
```

### 生产环境
创建 `.env.production` 文件：
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

### 环境变量说明

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| VITE_API_BASE_URL | 后端API基础URL | https://api.example.com/api |

## 📦 Docker部署

### Dockerfile
```dockerfile
# 构建阶段
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 构建和运行
```bash
# 构建镜像
docker build -t smart-community-frontend .

# 运行容器
docker run -p 80:80 smart-community-frontend
```

## 🧪 部署后验证

### 1. 功能测试
- 访问首页
- 测试用户登录/注册
- 验证API连接
- 检查路由跳转

### 2. 性能测试
```bash
# 使用Lighthouse测试
npm install -g lighthouse
lighthouse https://your-site-url.com
```

### 3. 移动端适配
- 测试响应式设计
- 验证触摸交互
- 检查移动端性能

## 🛠️ 常见问题解决

### 1. 构建失败
**问题**: npm run build 失败
**解决方案**:
```bash
# 清除缓存
rm -rf node_modules package-lock.json
npm install

# 检查TypeScript错误
npm run type-check
```

### 2. API连接失败
**问题**: 前端无法连接后端API
**解决方案**:
- 检查 `VITE_API_BASE_URL` 环境变量
- 确认后端CORS配置
- 验证API端点是否正确

### 3. 路由404错误
**问题**: 刷新页面出现404
**解决方案**:
- 配置服务器重定向规则
- 确保SPA路由正确配置

### 4. 静态资源加载失败
**问题**: CSS/JS文件404
**解决方案**:
- 检查 `base` 配置在 `vite.config.ts`
- 确认构建输出目录正确

## 📈 性能优化

### 1. 构建优化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
})
```

### 2. 代码分割
```typescript
// 懒加载组件
const LazyComponent = lazy(() => import('./LazyComponent'));
```

### 3. 资源压缩
```bash
# 安装压缩插件
npm install --save-dev vite-plugin-compression
```

## 🔐 安全配置

### 1. CSP配置
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

### 2. HTTPS强制
```javascript
// 在生产环境强制HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

## 📊 监控和分析

### 1. 错误监控
```bash
# 安装Sentry
npm install @sentry/react @sentry/tracing
```

### 2. 性能分析
```bash
# 安装Web Vitals
npm install web-vitals
```

### 3. 用户分析
```bash
# 安装Google Analytics
npm install gtag
```

## 🔄 CI/CD配置

### GitHub Actions
创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Build
      run: |
        cd frontend
        npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
        
    - name: Deploy to Render
      # 配置部署步骤
```

## 📝 维护和更新

### 1. 依赖更新
```bash
# 检查过期依赖
npm outdated

# 更新依赖
npm update
```

### 2. 安全审计
```bash
# 安全检查
npm audit

# 修复安全问题
npm audit fix
```

### 3. 性能监控
- 定期运行Lighthouse测试
- 监控Core Web Vitals
- 分析用户行为数据

## 🆘 故障排除

### 查看构建日志
1. 在部署平台查看构建日志
2. 检查错误信息
3. 验证环境变量配置

### 本地调试
```bash
# 本地预览生产构建
npm run build
npm run preview
```

### 联系支持
如果遇到无法解决的问题：
- 查看平台官方文档
- 检查社区论坛
- 联系技术支持

---

## 📞 技术支持

- 前端项目文档: [README.md](./README.md)
- 后端部署指南: [../backend/DEPLOYMENT.md](../backend/DEPLOYMENT.md)
- 项目总体文档: [../README.md](../README.md)

祝您部署成功！🎉 