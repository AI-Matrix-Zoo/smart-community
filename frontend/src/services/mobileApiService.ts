import { MarketItem, Announcement, Suggestion } from '../types';

// 移动端API配置
const MOBILE_API_CONFIG = {
  timeout: 15000, // 15秒超时
  retryAttempts: 3,
  retryDelay: 1000, // 1秒重试延迟
  enableLogging: true,
  enableOfflineCache: true
};

// 获取API基础地址
const getApiBaseUrl = (): string => {
  // 在开发环境中，使用localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // 生产环境使用相对路径
  return '';
};

// 日志记录函数
const logApiCall = (method: string, url: string, status: 'start' | 'success' | 'error', data?: any) => {
  if (!MOBILE_API_CONFIG.enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    method,
    url,
    status,
    data,
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown'
  };
  
  console.log(`[MobileAPI] ${status.toUpperCase()}:`, logData);
  
  // 保存到本地存储用于调试
  try {
    const logs = JSON.parse(localStorage.getItem('mobile_api_logs') || '[]');
    logs.push(logData);
    // 只保留最近100条日志
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    localStorage.setItem('mobile_api_logs', JSON.stringify(logs));
  } catch (error) {
    console.warn('Failed to save API log:', error);
  }
};

// 网络状态检查
const checkNetworkStatus = (): boolean => {
  return navigator.onLine;
};

// 超时Promise包装器
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`请求超时 (${timeoutMs}ms)`)), timeoutMs);
    })
  ]);
};

// 重试机制
const withRetry = async <T>(
  operation: () => Promise<T>,
  attempts: number = MOBILE_API_CONFIG.retryAttempts,
  delay: number = MOBILE_API_CONFIG.retryDelay
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (attempts <= 1) {
      throw error;
    }
    
    console.log(`API请求失败，${delay}ms后重试，剩余尝试次数: ${attempts - 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(operation, attempts - 1, delay * 1.5); // 指数退避
  }
};

// 通用API请求函数
const mobileApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const method = options.method || 'GET';
  
  logApiCall(method, url, 'start');
  
  // 检查网络状态
  if (!checkNetworkStatus()) {
    throw new Error('网络连接不可用，请检查您的网络设置');
  }
  
  // 设置默认headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'X-Requested-With': 'XMLHttpRequest', // 标识为AJAX请求
    ...(options.headers as Record<string, string>),
  };
  
  // 添加认证token
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const requestOptions: RequestInit = {
    ...options,
    headers,
    // 移动端优化设置
    mode: 'cors',
    credentials: 'omit', // 移动端不发送cookies
    cache: 'no-cache',
  };
  
  try {
    const response = await withTimeout(
      withRetry(async () => {
        const res = await fetch(url, requestOptions);
        
        // 检查响应状态
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
        }
        
        return res;
      }),
      MOBILE_API_CONFIG.timeout
    );
    
    const data = await response.json();
    
    logApiCall(method, url, 'success', { status: response.status, dataLength: JSON.stringify(data).length });
    
    if (!data.success) {
      throw new Error(data.message || 'API请求失败');
    }
    
    return data.data as T;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logApiCall(method, url, 'error', { error: errorMessage });
    
    // 增强错误信息
    if (errorMessage.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络设置或稍后重试');
    } else if (errorMessage.includes('timeout')) {
      throw new Error('请求超时，请检查网络连接或稍后重试');
    } else {
      throw new Error(`API请求失败: ${errorMessage}`);
    }
  }
};

// 缓存管理
class MobileCache {
  private static readonly CACHE_PREFIX = 'mobile_cache_';
  private static readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟过期
  
  static set(key: string, data: any): void {
    if (!MOBILE_API_CONFIG.enableOfflineCache) return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_EXPIRY
      };
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }
  
  static get(key: string): any | null {
    if (!MOBILE_API_CONFIG.enableOfflineCache) return null;
    
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      if (Date.now() > cacheData.expiry) {
        this.remove(key);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }
  
  static remove(key: string): void {
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }
  
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

// 移动端优化的API函数

// 获取市场物品
export const getMobileMarketItems = async (): Promise<MarketItem[]> => {
  const cacheKey = 'market_items';
  
  // 尝试从缓存获取
  const cached = MobileCache.get(cacheKey);
  if (cached && navigator.onLine) {
    console.log('使用缓存的市场数据');
    // 异步更新缓存
    mobileApiRequest<MarketItem[]>('/api/market')
      .then(data => MobileCache.set(cacheKey, data))
      .catch(error => console.warn('后台更新市场数据失败:', error));
    return cached;
  }
  
  try {
    const data = await mobileApiRequest<MarketItem[]>('/api/market');
    MobileCache.set(cacheKey, data);
    return data;
  } catch (error) {
    // 如果网络请求失败，尝试返回缓存数据
    const fallbackData = MobileCache.get(cacheKey);
    if (fallbackData) {
      console.warn('网络请求失败，使用缓存数据:', error);
      return fallbackData;
    }
    throw error;
  }
};

// 获取公告
export const getMobileAnnouncements = async (): Promise<Announcement[]> => {
  const cacheKey = 'announcements';
  
  // 尝试从缓存获取
  const cached = MobileCache.get(cacheKey);
  if (cached && navigator.onLine) {
    console.log('使用缓存的公告数据');
    // 异步更新缓存
    mobileApiRequest<Announcement[]>('/api/announcements')
      .then(data => MobileCache.set(cacheKey, data))
      .catch(error => console.warn('后台更新公告数据失败:', error));
    return cached;
  }
  
  try {
    const data = await mobileApiRequest<Announcement[]>('/api/announcements');
    MobileCache.set(cacheKey, data);
    return data;
  } catch (error) {
    // 如果网络请求失败，尝试返回缓存数据
    const fallbackData = MobileCache.get(cacheKey);
    if (fallbackData) {
      console.warn('网络请求失败，使用缓存数据:', error);
      return fallbackData;
    }
    throw error;
  }
};

// 获取建议
export const getMobileSuggestions = async (): Promise<Suggestion[]> => {
  const cacheKey = 'suggestions';
  
  try {
    const data = await mobileApiRequest<Suggestion[]>('/api/suggestions');
    MobileCache.set(cacheKey, data);
    return data;
  } catch (error) {
    // 如果网络请求失败，尝试返回缓存数据
    const fallbackData = MobileCache.get(cacheKey);
    if (fallbackData) {
      console.warn('网络请求失败，使用缓存数据:', error);
      return fallbackData;
    }
    throw error;
  }
};

// 健康检查
export const mobileHealthCheck = async (): Promise<{ success: boolean; message: string }> => {
  try {
    return await mobileApiRequest<{ success: boolean; message: string }>('/api/health');
  } catch (error) {
    throw error;
  }
};

// 网络诊断工具
export const runMobileDiagnostic = async (): Promise<{
  networkStatus: boolean;
  apiHealth: boolean;
  marketAPI: boolean;
  announcementsAPI: boolean;
  suggestionsAPI: boolean;
  responseTime: number;
  errors: string[];
}> => {
  const startTime = Date.now();
  const errors: string[] = [];
  let apiHealth = false;
  let marketAPI = false;
  let announcementsAPI = false;
  let suggestionsAPI = false;
  
  // 检查网络状态
  const networkStatus = checkNetworkStatus();
  if (!networkStatus) {
    errors.push('设备显示离线状态');
  }
  
  // 健康检查
  try {
    await mobileHealthCheck();
    apiHealth = true;
  } catch (error) {
    errors.push(`健康检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  
  // 市场API测试
  try {
    await getMobileMarketItems();
    marketAPI = true;
  } catch (error) {
    errors.push(`市场API失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  
  // 公告API测试
  try {
    await getMobileAnnouncements();
    announcementsAPI = true;
  } catch (error) {
    errors.push(`公告API失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  
  // 建议API测试
  try {
    await getMobileSuggestions();
    suggestionsAPI = true;
  } catch (error) {
    errors.push(`建议API失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  
  const responseTime = Date.now() - startTime;
  
  return {
    networkStatus,
    apiHealth,
    marketAPI,
    announcementsAPI,
    suggestionsAPI,
    responseTime,
    errors
  };
};

// 清理缓存和日志
export const clearMobileCache = (): void => {
  MobileCache.clear();
  localStorage.removeItem('mobile_api_logs');
  console.log('移动端缓存和日志已清理');
};

// 获取API日志
export const getMobileApiLogs = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('mobile_api_logs') || '[]');
  } catch (error) {
    console.warn('Failed to get API logs:', error);
    return [];
  }
};

// 导出配置供调试使用
export const getMobileApiConfig = () => MOBILE_API_CONFIG;

// 更新配置
export const updateMobileApiConfig = (newConfig: Partial<typeof MOBILE_API_CONFIG>): void => {
  Object.assign(MOBILE_API_CONFIG, newConfig);
  console.log('移动端API配置已更新:', MOBILE_API_CONFIG);
}; 