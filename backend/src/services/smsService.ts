import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

export interface SmsConfig {
  accessKeyId: string;
  accessKeySecret: string;
  endpoint?: string;
}

export interface SendSmsParams {
  phoneNumber: string;
  signName: string;
  templateCode: string;
  templateParam?: string;
}

export class SmsService {
  private client: Dysmsapi20170525;

  constructor(config: SmsConfig) {
    const openApiConfig = new $OpenApi.Config({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
    });
    openApiConfig.endpoint = config.endpoint || 'dysmsapi.aliyuncs.com';
    this.client = new Dysmsapi20170525(openApiConfig);
  }

  /**
   * 发送短信验证码
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phoneNumber,
      signName: process.env.SMS_SIGN_NAME || '智慧小区',
      templateCode: process.env.SMS_TEMPLATE_CODE || 'SMS_123456789',
      templateParam: JSON.stringify({ code }),
    });

    const runtime = new $Util.RuntimeOptions({});
    
    try {
      const response = await this.client.sendSmsWithOptions(sendSmsRequest, runtime);
      console.log('SMS send response:', response.body);
      
      return response.body?.code === 'OK';
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  /**
   * 发送通知短信
   */
  async sendNotification(params: SendSmsParams): Promise<boolean> {
    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: params.phoneNumber,
      signName: params.signName,
      templateCode: params.templateCode,
      templateParam: params.templateParam,
    });

    const runtime = new $Util.RuntimeOptions({});
    
    try {
      const response = await this.client.sendSmsWithOptions(sendSmsRequest, runtime);
      console.log('SMS notification response:', response.body);
      
      return response.body?.code === 'OK';
    } catch (error) {
      console.error('SMS notification error:', error);
      return false;
    }
  }
}

// 创建短信服务实例
export const smsService = new SmsService({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || '',
});

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