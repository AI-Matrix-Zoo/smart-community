# API 404错误修复指南

## 🚨 问题描述

部署到Render后，前端访问API时出现404错误：
- `Failed to load resource: the server responded with a status of 404`
- `获取公告列表失败: Error: API请求失败: 404`
- `登录失败: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`

## 🔍 问题分析

### 1. CORS配置问题
- 后端CORS配置只允许本地开发环境域名
- 没有包含Render前端域名 `https://smart-community-frontend.onrender.com`
- 导致跨域请求被阻止

### 2. API基础URL配置问题
- 前端在生产环境使用相对路径 `/api`
- 相对路径指向前端域名而不是后端域名
- 应该指向 `https://smart-community-backend.onrender.com/api`

## ✅ 解决方案

### 1. 修复后端CORS配置

更新 `backend/src/index.ts` 中的CORS配置：

```typescript
// CORS配置 - 支持开发和生产环境
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:5173',
      'http://192.168.1.7:5173',
      'https://smart-community-frontend.onrender.com',
      /^http:\/\/192\.168\.1\.\d+:5173$/,
      /^https:\/\/.*\.onrender\.com$/
    ];

    // 如果没有origin（比如移动应用或Postman），允许访问
    if (!origin) return callback(null, true);

    // 检查origin是否在允许列表中
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else {
        return allowedOrigin.test(origin);
      }
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

### 2. 修复前端API基础URL配置

更新 `frontend/src/services/apiService.ts` 中的API地址配置：

```typescript
// 根据环境自动切换API地址
const getApiBaseUrl = (): string => {
  // 在开发环境中，根据当前访问的主机名确定API地址
  if (import.meta.env.DEV) {
    const currentHost = window.location.hostname;
    
    // 如果是通过IP地址访问，使用相同的IP地址访问后端
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `http://${currentHost}:3000/api`;
    }
    
    // 默认使用localhost
    return 'http://localhost:3000/api';
  }
  
  // 在生产环境中，优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 生产环境默认使用Render后端域名
  return 'https://smart-community-backend.onrender.com/api';
};
```

## 🚀 部署步骤

### 1. 提交更改
```bash
git add .
git commit -m "fix: 修复API 404错误 - 更新CORS配置和API基础URL"
```

### 2. 推送到GitHub
```bash
git push origin main
```

### 3. 等待Render自动部署
- 后端服务会自动重新部署
- 前端静态站点会自动重新构建

## 🧪 验证修复

### 1. 检查CORS配置
```bash
# 测试CORS预检请求
curl -H "Origin: https://smart-community-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://smart-community-backend.onrender.com/api/health
```

### 2. 测试API连接
```bash
# 测试健康检查
curl https://smart-community-backend.onrender.com/api/health

# 测试公告API
curl https://smart-community-backend.onrender.com/api/announcements

# 测试登录API
curl -X POST https://smart-community-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"admin","password":"admin"}'
```

### 3. 前端功能测试
1. 访问 https://smart-community-frontend.onrender.com
2. 尝试登录（使用 `admin` / `admin`）
3. 检查首页公告是否正常加载
4. 测试其他功能（建议、二手市场等）

## 🔧 故障排除

### 如果仍然出现404错误：

1. **检查Render部署日志**
   - 后端服务：查看构建和运行日志
   - 前端服务：查看构建日志

2. **验证API路由**
   ```bash
   # 检查所有可用路由
   curl https://smart-community-backend.onrender.com/api/health
   ```

3. **检查网络请求**
   - 打开浏览器开发者工具
   - 查看Network标签页
   - 确认请求URL是否正确

4. **验证环境变量**
   - 在Render控制台检查环境变量设置
   - 确认 `VITE_API_BASE_URL` 是否正确配置

### 如果出现CORS错误：

1. **检查Origin头**
   ```bash
   # 查看请求的Origin
   curl -v https://smart-community-backend.onrender.com/api/health
   ```

2. **验证CORS配置**
   - 检查后端日志中的CORS相关信息
   - 确认前端域名是否在允许列表中

## 📋 预防措施

1. **环境变量配置**
   - 在Render前端服务中设置 `VITE_API_BASE_URL`
   - 值：`https://smart-community-backend.onrender.com/api`

2. **本地测试**
   - 在本地构建生产版本进行测试
   - 使用 `npm run build && npm run preview` 测试前端

3. **监控和日志**
   - 定期检查Render服务日志
   - 设置健康检查监控

## 🎯 成功标志

修复成功后，应该能够：
- ✅ 前端正常加载，无404错误
- ✅ 用户能够成功登录
- ✅ 公告列表正常显示
- ✅ 所有API功能正常工作
- ✅ 浏览器控制台无CORS错误 