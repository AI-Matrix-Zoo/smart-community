import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@smart-community.com',
        to: email,
        subject: '智慧小区 - 邮箱验证码',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏠 智慧小区</h1>
                <p style="color: #666; margin: 10px 0 0 0;">邮箱验证码</p>
              </div>
              
              <div style="margin-bottom: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">您好！</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  您正在注册智慧小区账户，请使用以下验证码完成注册：
                </p>
              </div>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; margin: 30px 0; border-radius: 8px;">
                <div style="color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  ⚠️ <strong>重要提醒：</strong>
                </p>
                <ul style="color: #92400e; margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
                  <li>验证码有效期为 <strong>5分钟</strong>，请及时使用</li>
                  <li>验证码仅用于本次注册，请勿泄露给他人</li>
                  <li>如果您没有申请此验证码，请忽略此邮件</li>
                </ul>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                  此邮件由智慧小区系统自动发送，请勿回复<br>
                  发送时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                </p>
              </div>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ 邮箱验证码已发送到: ${email}`);
      return true;
    } catch (error) {
      console.error('❌ 邮箱验证码发送失败:', error);
      return false;
    }
  }

  /**
   * 测试邮箱连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ 邮箱服务连接测试成功');
      return true;
    } catch (error) {
      console.error('❌ 邮箱服务连接测试失败:', error);
      return false;
    }
  }
}

// 模拟邮箱服务（开发环境）
export class MockEmailService {
  static async sendVerificationCode(email: string, code: string): Promise<boolean> {
    console.log(`📧 [模拟邮箱] 发送验证码到 ${email}: ${code}`);
    console.log(`📧 [模拟邮箱] 邮件内容预览:`);
    console.log(`   收件人: ${email}`);
    console.log(`   主题: 智慧moma - 邮箱验证码`);
    console.log(`   验证码: ${code}`);
    console.log(`   有效期: 5分钟`);
    return true;
  }
}

// 统一的邮箱服务接口
export class UnifiedEmailService {
  private static instance: UnifiedEmailService;
  private realEmailService: EmailService | null = null;
  private isRealEmailEnabled: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.initializationPromise = this.initializeEmailService();
  }

  static getInstance(): UnifiedEmailService {
    if (!UnifiedEmailService.instance) {
      UnifiedEmailService.instance = new UnifiedEmailService();
    }
    return UnifiedEmailService.instance;
  }

  private async initializeEmailService(): Promise<void> {
    // 检查是否配置了真实邮箱服务
    const emailHost = process.env.EMAIL_HOST;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailEnabled = process.env.EMAIL_ENABLED === 'true';

    if (emailEnabled && emailHost && emailUser && emailPass) {
      try {
        this.realEmailService = new EmailService({
          host: emailHost,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
        
        console.log('📧 正在测试邮箱服务连接...');
        
        // 同步等待连接测试结果
        const connectionSuccess = await this.realEmailService.testConnection();
        
        if (connectionSuccess) {
          this.isRealEmailEnabled = true;
          console.log('📧 真实邮箱服务已启用');
        } else {
          console.log('📧 邮箱连接测试失败，将使用模拟服务');
          this.isRealEmailEnabled = false;
        }
      } catch (error) {
        console.error('📧 邮箱服务初始化失败，使用模拟服务:', error);
        this.isRealEmailEnabled = false;
      }
    } else {
      console.log('📧 使用模拟邮箱服务（开发环境）');
      this.isRealEmailEnabled = false;
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    // 确保初始化完成
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    
    if (this.isRealEmailEnabled && this.realEmailService) {
      return await this.realEmailService.sendVerificationCode(email, code);
    } else {
      return await MockEmailService.sendVerificationCode(email, code);
    }
  }

  isRealEmailServiceEnabled(): boolean {
    return this.isRealEmailEnabled;
  }
}

// 导出统一的邮箱服务实例
export const emailService = UnifiedEmailService.getInstance(); 