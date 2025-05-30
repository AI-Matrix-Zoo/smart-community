import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// 导入路由
import authRoutes from './routes/auth';
import suggestionRoutes from './routes/suggestions';
import marketRoutes from './routes/market';
import announcementRoutes from './routes/announcements';
import adminRoutes from './routes/admin';

// 导入数据库配置
import './config/database';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 中间件
app.use(helmet());

// CORS配置 - 支持开发和生产环境
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:5173',
      'http://192.168.1.7:5173',
      'http://123.56.64.5',
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
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于上传的图片等）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '智慧小区生活平台后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '智慧小区生活平台API服务运行正常',
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 智慧小区生活平台后端服务启动成功`);
  console.log(`📍 本地地址: http://localhost:${PORT}`);
  console.log(`📍 局域网地址: http://192.168.1.7:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});

export default app; 