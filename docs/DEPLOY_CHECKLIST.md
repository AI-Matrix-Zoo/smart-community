# 部署清单

## ✅ 准备工作完成
- [x] 项目结构检查通过
- [x] 本地构建测试通过
- [x] Git仓库状态正常

## 📋 部署步骤

### 1. 推送代码到Git仓库
```bash
git add .
git commit -m "准备部署到Render"
git push origin main
```

### 2. 在Render创建后端服务
- 服务类型: Web Service
- 名称: smart-community-backend
- 环境: Node
- 构建命令: `cd backend && npm install && npm run build`
- 启动命令: `cd backend && npm start`
- 健康检查: `/api/health`

### 3. 配置后端环境变量
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://smart-community-frontend.onrender.com
```

### 4. 在Render创建前端服务
- 服务类型: Static Site
- 名称: smart-community-frontend
- 构建命令: `cd frontend && npm install && npm run build`
- 发布目录: `frontend/dist`

### 5. 配置前端环境变量
```
VITE_API_BASE_URL=https://smart-community-backend.onrender.com
VITE_APP_TITLE=智慧小区生活平台
VITE_NODE_ENV=production
```

### 6. 验证部署
- [ ] 后端健康检查通过
- [ ] 前端页面正常加载
- [ ] 用户注册登录功能正常
- [ ] API调用正常

## 📞 需要帮助？
查看详细部署指南: DEPLOYMENT_GUIDE.md
