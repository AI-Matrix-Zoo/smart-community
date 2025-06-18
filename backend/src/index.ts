import dotenv from 'dotenv';
import path from 'path';
import net from 'net';

// 首先加载环境变量
dotenv.config();

import express from 'express';
// import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// 导入路由
import authRoutes from './routes/auth';
import suggestionRoutes from './routes/suggestions';
import marketRoutes from './routes/market';
import announcementRoutes from './routes/announcements';
import adminRoutes from './routes/admin';
import debugRoutes from './routes/debug';

// 导入数据库配置
import './config/database';

const app = express();

// 智能端口检测和管理
const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    server.on('error', () => {
      resolve(false);
    });
  });
};

const findAvailablePort = async (preferredPort: number): Promise<number> => {
  // 检查首选端口
  if (await checkPortAvailable(preferredPort)) {
    return preferredPort;
  }
  
  // 如果首选端口不可用，尝试其他端口
  const alternativePorts = [3001, 3002, 3003, 3004, 3005];
  for (const port of alternativePorts) {
    if (await checkPortAvailable(port)) {
      console.log(`⚠️  端口 ${preferredPort} 被占用，使用替代端口 ${port}`);
      return port;
    }
  }
  
  // 如果所有预设端口都被占用，随机选择一个端口
  for (let i = 0; i < 10; i++) {
    const randomPort = Math.floor(Math.random() * (9999 - 3000) + 3000);
    if (await checkPortAvailable(randomPort)) {
      console.log(`⚠️  预设端口都被占用，使用随机端口 ${randomPort}`);
      return randomPort;
    }
  }
  
  throw new Error('无法找到可用端口');
};

// 根据环境确定首选端口
const getPreferredPort = (): number => {
  // 优先使用环境变量中的端口
  if (process.env.PORT) {
    return Number(process.env.PORT);
  }
  
  // 根据NODE_ENV确定默认端口
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 3001 : 3000;
};

// 中间件
// 临时禁用Helmet来排除安全策略干扰
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   contentSecurityPolicy: false, // 临时禁用CSP以排除问题
//   crossOriginOpenerPolicy: false, // 禁用COOP以避免HTTP环境下的警告
// }));

// 自定义CORS中间件 - 更宽松的配置用于外部访问
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // 检查是否是生产环境且配置了允许所有来源
  const allowAllOrigins = process.env.FRONTEND_URL === '*' || process.env.NODE_ENV === 'development';
  
  if (allowAllOrigins) {
    // 允许所有来源
    res.header('Access-Control-Allow-Origin', origin || '*');
    console.log(`CORS: Origin ${origin || 'none'}, allowed: true (all origins allowed)`);
  } else {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://123.56.64.5:5173',
      'http://123.56.64.5:5174',
      'http://123.56.64.5',
      'https://smart-community-frontend.onrender.com',
      'http://www.moma.uno',
      'https://www.moma.uno',
      'http://moma.uno',
      'https://moma.uno'
    ];

    // 检查origin是否被允许
    let allowOrigin = false;
    if (!origin) {
      // 没有origin头部，允许访问（如移动应用、Postman）
      allowOrigin = true;
      res.header('Access-Control-Allow-Origin', '*');
    } else if (allowedOrigins.includes(origin) || origin.startsWith('http://123.56.64.5')) {
      allowOrigin = true;
      res.header('Access-Control-Allow-Origin', origin);
    }

    if (!allowOrigin) {
      console.log(`CORS: Origin ${origin}, blocked`);
      // 对于被阻止的origin，返回403错误
      return res.status(403).json({
        success: false,
        message: 'CORS policy: Origin not allowed'
      });
    }
    
    console.log(`CORS: Origin ${origin || 'none'}, allowed: true`);
  }

  // 设置CORS头部
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log(`OPTIONS request for ${req.path} from origin: ${origin || 'none'}`);
    return res.status(204).end();
  }
  
  // 继续处理请求
  return next();
});

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务（用于上传的图片等）
app.use('/uploads', (req, res, next) => {
  // 设置CORS头
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // 为PDF文件设置特定的头
  if (req.path.toLowerCase().endsWith('.pdf')) {
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', 'inline'); // 允许在浏览器中预览
    res.header('X-Frame-Options', 'SAMEORIGIN'); // 允许在iframe中显示
    res.header('X-Content-Type-Options', 'nosniff');
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 简单的测试端点
app.get('/test', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin
  });
});

app.options('/test', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.status(204).end();
});

// CORS测试端点
app.get('/cors-test', (req, res) => {
  console.log('CORS测试端点被访问，Origin:', req.headers.origin);
  res.json({ 
    message: 'CORS test endpoint',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.options('/cors-test', (req, res) => {
  console.log('CORS测试端点OPTIONS请求，Origin:', req.headers.origin);
  res.status(204).end();
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/debug', debugRoutes);

// 临时调试端点 - 检查邮箱配置
app.get('/debug/email-config', (req, res) => {
  res.json({
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_ENABLED: process.env.EMAIL_ENABLED,
    EMAIL_SECURE: process.env.EMAIL_SECURE
  });
});

// API健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '智慧moma生活平台API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    const preferredPort = getPreferredPort();
    const availablePort = await findAvailablePort(preferredPort);
    
    app.listen(availablePort, '0.0.0.0', () => {
      console.log(`🚀 智慧moma生活平台后端服务启动成功`);
      console.log(`📍 本地地址: http://localhost:${availablePort}`);
      console.log(`📍 公网地址: http://123.56.64.5:${availablePort}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 健康检查: http://localhost:${availablePort}/health`);
      
      // 如果使用的不是首选端口，给出提示
      if (availablePort !== preferredPort) {
        console.log(`⚠️  注意：首选端口 ${preferredPort} 被占用，当前使用端口 ${availablePort}`);
        console.log(`💡 建议：请检查并停止占用端口 ${preferredPort} 的进程，或更新前端配置以使用新端口`);
      }
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

export default app; 