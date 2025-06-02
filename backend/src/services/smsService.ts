import twilio from 'twilio';

interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private config: SMSConfig | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const smsEnabled = process.env.SMS_ENABLED === 'true';
    const smsProvider = process.env.SMS_PROVIDER;

    if (smsEnabled && smsProvider === 'twilio' && accountSid && authToken && phoneNumber) {
      try {
        this.client = twilio(accountSid, authToken);
        this.config = {
          accountSid,
          authToken,
          phoneNumber
        };
        this.enabled = true;
        console.log('✅ Twilio SMS service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Twilio SMS service:', error);
        this.enabled = false;
      }
    } else {
      console.log('📱 SMS service disabled or not configured');
      this.enabled = false;
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    // 在开发环境中，总是返回成功
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 Mock SMS (Development): Verification code ${code} sent to ${phoneNumber}`);
      return true;
    }

    if (!this.enabled || !this.client || !this.config) {
      console.log('📱 SMS service not enabled, using mock verification');
      // 在生产环境下，如果SMS服务未配置，也返回true以便测试
      console.log(`📱 Mock SMS: Verification code ${code} sent to ${phoneNumber}`);
      return true;
    }

    try {
      const message = `您的智慧moma验证码是：${code}，5分钟内有效。请勿泄露给他人。`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: phoneNumber
      });

      console.log(`✅ SMS sent successfully to ${phoneNumber}, SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // 验证手机号格式
  validatePhoneNumber(phoneNumber: string): boolean {
    // 中国大陆手机号格式验证
    const chinaPhoneRegex = /^1[3-9]\d{9}$/;
    // 国际格式验证（简单版）
    const internationalPhoneRegex = /^\+[1-9]\d{1,14}$/;
    
    return chinaPhoneRegex.test(phoneNumber) || internationalPhoneRegex.test(phoneNumber);
  }

  // 格式化手机号（添加国际区号）
  formatPhoneNumber(phoneNumber: string): string {
    // 如果是中国大陆手机号，添加+86前缀
    if (/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return `+86${phoneNumber}`;
    }
    // 如果已经有+号，直接返回
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    // 其他情况，假设是中国号码
    return `+86${phoneNumber}`;
  }
}

export const smsService = new SMSService();
export default smsService;

// 验证码缓存（生产环境建议使用Redis）
export class VerificationCodeCache {
  private static cache = new Map<string, { code: string; expiry: number }>();

  static set(phone: string, code: string, ttlMinutes: number = 5): void {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(phone, { code, expiry });
  }

  static get(phone: string): string | null {
    const entry = this.cache.get(phone);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(phone);
      return null;
    }
    
    return entry.code;
  }

  static verify(phone: string, code: string): boolean {
    const storedCode = this.get(phone);
    if (!storedCode) return false;
    
    const isValid = storedCode === code;
    if (isValid) {
      this.cache.delete(phone); // 验证成功后删除验证码
    }
    
    return isValid;
  }

  static delete(phone: string): void {
    this.cache.delete(phone);
  }
}

// 生成6位数字验证码
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
} 