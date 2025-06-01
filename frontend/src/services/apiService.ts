import { 
  User, 
  MarketItem, 
  Suggestion, 
  SuggestionStatus, 
  SuggestionComment,
  Announcement
} from '../types';

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

const API_BASE_URL = getApiBaseUrl();

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// 获取认证令牌
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// 设置认证令牌
const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// 移除认证令牌
const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// 通用API请求函数
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'API请求失败');
  }

  return data.data as T;
};

// --- 认证API ---
export const loginUser = async (identifier: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    const data: ApiResponse<{ user: User; token: string }> = await response.json();
    
    if (data.success && data.data) {
      setAuthToken(data.data.token);
      return { success: true, user: data.data.user };
    }
    
    return { success: false, message: data.message || '登录失败' };
  } catch (error) {
    console.error('登录失败:', error);
    return { success: false, message: '登录失败，请检查网络连接' };
  }
};

export interface RegistrationData {
  phone?: string;
  email?: string;
  password: string;
  name: string;
  building: string;
  unit: string;
  room: string;
  verificationCode: string;
  verificationType: 'phone' | 'email';
}

export const registerUser = async (data: RegistrationData): Promise<{ success: boolean; message?: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<{ user: User; token: string }> = await response.json();
    
    if (result.success && result.data) {
      setAuthToken(result.data.token);
      return { success: true, user: result.data.user };
    }
    
    return { success: false, message: result.message };
  } catch (error) {
    console.error('注册失败:', error);
    return { success: false, message: '注册失败，请稍后重试' };
  }
};

export const logoutUser = async (): Promise<void> => {
  removeAuthToken();
  localStorage.removeItem('community_current_user');
};

export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('community_current_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// --- 市场物品API ---
export const getMarketItems = async (): Promise<MarketItem[]> => {
  try {
    return await apiRequest<MarketItem[]>('/market');
  } catch (error) {
    console.error('获取市场物品失败:', error);
    throw error;
  }
};

export const addMarketItem = async (itemData: Omit<MarketItem, 'id' | 'postedDate'>): Promise<MarketItem> => {
  try {
    return await apiRequest<MarketItem>('/market', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  } catch (error) {
    console.error('添加市场物品失败:', error);
    throw error;
  }
};

export const getMyMarketItems = async (): Promise<MarketItem[]> => {
  try {
    return await apiRequest<MarketItem[]>('/market/my-items');
  } catch (error) {
    console.error('获取我的物品失败:', error);
    throw error;
  }
};

export const deleteMarketItem = async (itemId: string): Promise<boolean> => {
  try {
    await apiRequest(`/market/${itemId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('删除物品失败:', error);
    return false;
  }
};

// --- 建议反馈API ---
export const getSuggestions = async (): Promise<Suggestion[]> => {
  try {
    return await apiRequest<Suggestion[]>('/suggestions');
  } catch (error) {
    console.error('获取建议列表失败:', error);
    throw error;
  }
};

export const addSuggestion = async (suggestion: { title: string; description: string; category: string }): Promise<Suggestion> => {
  try {
    return await apiRequest<Suggestion>('/suggestions', {
      method: 'POST',
      body: JSON.stringify(suggestion),
    });
  } catch (error) {
    console.error('提交建议失败:', error);
    throw error;
  }
};

export const updateSuggestionStatus = async (id: string, status: SuggestionStatus, progressUpdateText: string): Promise<boolean> => {
  try {
    await apiRequest(`/suggestions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, progressUpdateText }),
    });
    return true;
  } catch (error) {
    console.error('更新建议状态失败:', error);
    return false;
  }
};

export const addSuggestionProgress = async (id: string, updateText: string): Promise<boolean> => {
  try {
    await apiRequest(`/suggestions/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ updateText }),
    });
    return true;
  } catch (error) {
    console.error('添加进度更新失败:', error);
    return false;
  }
};

export const addSuggestionComment = async (id: string, content: string): Promise<SuggestionComment> => {
  try {
    return await apiRequest<SuggestionComment>(`/suggestions/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    throw error;
  }
};

export const toggleSuggestionLike = async (id: string): Promise<{ isLiked: boolean }> => {
  try {
    return await apiRequest<{ isLiked: boolean }>(`/suggestions/${id}/like`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    throw error;
  }
};

// --- 公告API ---
export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    return await apiRequest<Announcement[]>('/announcements');
  } catch (error) {
    console.error('获取公告列表失败:', error);
    throw error;
  }
};

export const addAnnouncement = async (content: string): Promise<Announcement> => {
  try {
    return await apiRequest<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error('添加公告失败:', error);
    throw error;
  }
};

export const updateAnnouncement = async (id: string, content: string): Promise<Announcement> => {
  try {
    return await apiRequest<Announcement>(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error('更新公告失败:', error);
    throw error;
  }
};

export const deleteAnnouncement = async (id: string): Promise<boolean> => {
  try {
    await apiRequest(`/announcements/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('删除公告失败:', error);
    return false;
  }
};

// --- 管理员API ---
export const adminGetAllUsers = async (): Promise<User[]> => {
  try {
    return await apiRequest<User[]>('/admin/users');
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
};

export const adminUpdateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    return await apiRequest<User>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
};

export const adminDeleteUser = async (userId: string): Promise<boolean> => {
  try {
    await apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('删除用户失败:', error);
    return false;
  }
};

export const adminDeleteMarketItem = async (itemId: string): Promise<boolean> => {
  try {
    await apiRequest(`/admin/market/${itemId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('删除市场物品失败:', error);
    return false;
  }
};

export const adminDeleteSuggestion = async (suggestionId: string): Promise<boolean> => {
  try {
    await apiRequest(`/admin/suggestions/${suggestionId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('删除建议失败:', error);
    return false;
  }
};

// --- 用户认证API ---
export const login = async (credentials: { identifier: string; password: string }): Promise<{ user: User; token: string }> => {
  try {
    return await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

export const register = async (userData: {
  email: string;
  password: string;
  name: string;
  building: string;
  unit: string;
  room: string;
  verificationCode: string;
  verificationType: string;
}): Promise<{ user: User; token: string }> => {
  try {
    return await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

export const sendVerificationCode = async (email: string): Promise<boolean> => {
  try {
    await apiRequest('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ identifier: email, type: 'email' }),
    });
    return true;
  } catch (error) {
    console.error('发送验证码失败:', error);
    return false;
  }
};

export const verifyCode = async (email: string, code: string): Promise<boolean> => {
  try {
    await apiRequest('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ identifier: email, code, type: 'email' }),
    });
    return true;
  } catch (error) {
    console.error('验证码验证失败:', error);
    return false;
  }
};

export const updateUserProfile = async (userData: {
  name?: string;
  building?: string;
  unit?: string;
  room?: string;
  password?: string;
}): Promise<User> => {
  try {
    return await apiRequest<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
}; 