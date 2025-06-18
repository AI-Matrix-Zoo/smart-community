# CORS问题诊断与解决方案

## 问题描述

手机端浏览器报告CORS错误：
```
Access to fetch at 'http://123.56.64.5:3000/api/market' from origin 'http://123.56.64.5' has been blocked by CORS policy: Method OPTIONS is not allowed by Access-Control-Allow-Methods in preflight response.
```

## 问题分析

### 1. 症状
- 浏览器发送OPTIONS预检请求
- 服务器返回的`Access-Control-Allow-Methods`头部不包含`OPTIONS`方法
- 实际返回：`Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE`
- 期望返回：`Access-Control-Allow-Methods: OPTIONS, GET, POST, PUT, DELETE, HEAD, PATCH`

### 2. 根本原因
尽管我们在自定义CORS中间件中设置了正确的头部，但是有其他中间件或库在覆盖我们的设置。

### 3. 调试过程

#### a) 自定义CORS中间件
```javascript
// 自定义CORS中间件 - 完全控制CORS头部
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // 允许的域名列表
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://123.56.64.5:5173',
    'http://123.56.64.5:5174',
    'http://123.56.64.5',
    'https://smart-community-frontend.onrender.com'
  ];

  // 检查origin是否被允许
  let allowOrigin = false;
  if (!origin) {
    allowOrigin = true;
    res.header('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes(origin) || origin.startsWith('http://123.56.64.5')) {
    allowOrigin = true;
    res.header('Access-Control-Allow-Origin', origin);
  }

  if (allowOrigin) {
    // 设置CORS头部
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, HEAD, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    console.log(`CORS: Origin ${origin || 'none'}, allowed: true`);
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
      console.log(`OPTIONS request for ${req.path} from origin: ${origin || 'none'}`);
      return res.status(204).end();
    }
  } else {
    console.log(`CORS: Origin ${origin}, blocked`);
  }
  
  next();
});
```

#### b) 测试结果
```bash
curl -s -H "Origin: http://123.56.64.5" -H "Access-Control-Request-Method: GET" -X OPTIONS "http://123.56.64.5:3000/api/market" -D - -o /dev/null | grep -i "access-control-allow-methods"
# 返回：Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

#### c) 问题定位
- 自定义CORS中间件设置了正确的头部
- 但是最终响应中缺少OPTIONS方法
- 表明有其他中间件在覆盖我们的设置

## 临时解决方案

### 方案1：在每个路由中显式处理OPTIONS

在每个API路由文件中添加OPTIONS处理：

```javascript
// 在 backend/src/routes/market.ts 中添加
router.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
});
```

### 方案2：使用通配符CORS（仅用于调试）

临时设置更宽松的CORS策略：

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});
```

### 方案3：检查中间件顺序

确保CORS中间件在所有其他中间件之前：

```javascript
const app = express();

// CORS中间件必须在最前面
app.use(corsMiddleware);

// 其他中间件
app.use(morgan('combined'));
app.use(express.json());
// ...
```

## 长期解决方案

### 1. 排查中间件冲突

需要逐一检查以下中间件：
- Express Router
- Morgan
- Helmet（已禁用）
- 自定义认证中间件
- 路由级别的中间件

### 2. 使用专业的CORS库

重新启用并正确配置cors库：

```javascript
import cors from 'cors';

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://123.56.64.5:5173',
      'http://123.56.64.5'
    ];
    
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://123.56.64.5')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
```

### 3. 调试工具

创建专门的CORS调试端点：

```javascript
app.all('/debug/cors', (req, res) => {
  console.log('CORS Debug:', {
    method: req.method,
    origin: req.headers.origin,
    headers: req.headers
  });
  
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  res.json({
    message: 'CORS debug endpoint',
    method: req.method,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});
```

## 当前状态

- 问题：OPTIONS方法未包含在Access-Control-Allow-Methods中
- 影响：手机端浏览器无法发送跨域请求
- 临时解决方案：需要实施上述方案之一
- 长期解决方案：需要深入排查中间件冲突

## 建议的下一步

1. **立即实施方案1**：在market路由中添加显式的OPTIONS处理
2. **测试验证**：使用手机端调试工具验证修复效果
3. **深入排查**：逐步排查中间件冲突的根本原因
4. **文档更新**：记录最终的解决方案

## 测试命令

```bash
# 测试CORS预检请求
curl -v -H "Origin: http://123.56.64.5" -H "Access-Control-Request-Method: GET" -X OPTIONS "http://123.56.64.5:3000/api/market"

# 检查Access-Control-Allow-Methods头部
curl -s -H "Origin: http://123.56.64.5" -H "Access-Control-Request-Method: GET" -X OPTIONS "http://123.56.64.5:3000/api/market" -D - -o /dev/null | grep -i "access-control-allow-methods"

# 测试实际的GET请求
curl -H "Origin: http://123.56.64.5" "http://123.56.64.5:3000/api/market"
``` 