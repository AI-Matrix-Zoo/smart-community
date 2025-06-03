import express, { Request, Response } from 'express';
import { emailService } from '../services/emailService';

const router = express.Router();

// 邮箱服务配置检查
router.get('/email-config', (req: Request, res: Response) => {
  const config = {
    EMAIL_HOST: process.env.EMAIL_HOST || '未配置',
    EMAIL_PORT: process.env.EMAIL_PORT || '未配置',
    EMAIL_SECURE: process.env.EMAIL_SECURE || '未配置',
    EMAIL_USER: process.env.EMAIL_USER || '未配置',
    EMAIL_FROM: process.env.EMAIL_FROM || '未配置',
    EMAIL_ENABLED: process.env.EMAIL_ENABLED || '未配置',
    isRealEmailEnabled: emailService.isRealEmailServiceEnabled()
  };

  res.json({
    success: true,
    message: '邮箱服务配置信息',
    data: config
  });
});

// 邮箱服务连接测试
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        message: '请提供测试邮箱地址'
      });
      return;
    }

    // 生成测试验证码
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`🧪 开始测试邮箱发送: ${email}`);
    console.log(`🧪 测试验证码: ${testCode}`);
    
    const result = await emailService.sendVerificationCode(email, testCode);
    
    if (result) {
      res.json({
        success: true,
        message: '邮件发送测试成功',
        data: {
          email,
          testCode,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '邮件发送测试失败',
        data: {
          email,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('邮箱测试错误:', error);
    res.status(500).json({
      success: false,
      message: '邮箱测试发生错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 系统环境信息
router.get('/system-info', (req: Request, res: Response) => {
  const info = {
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  };

  res.json({
    success: true,
    message: '系统环境信息',
    data: info
  });
});

export default router; 