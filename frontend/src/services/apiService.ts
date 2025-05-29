import { Suggestion, SuggestionStatus, MarketItem, User, Announcement } from '../types';

// 根据环境自动切换API地址
const getApiBaseUrl = (): string => {
  // 在开发环境中使用localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api';
  }
  
  // 在生产环境中，优先使用环境变量，否则使用相对路径
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 生产环境默认使用相对路径（假设前后端部署在同一域名下）
  return '/api';
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
export const loginUser = async (phone: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, password }),
    });

    const data: ApiResponse<{ user: User; token: string }> = await response.json();
    
    if (data.success && data.data) {
      setAuthToken(data.data.token);
      return data.data.user;
    }
    
    return null;
  } catch (error) {
    console.error('登录失败:', error);
    return null;
  }
};

export interface RegistrationData {
  phone: string;
  password: string;
  name: string;
  building: string;
  room: string;
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

// --- 建议反馈API ---
export const getSuggestions = async (): Promise<Suggestion[]> => {
  try {
    return await apiRequest<Suggestion[]>('/suggestions');
  } catch (error) {
    console.error('获取建议列表失败:', error);
    throw error;
  }
};

export const addSuggestion = async (suggestionData: { title: string; description: string; category: string }): Promise<Suggestion> => {
  try {
    return await apiRequest<Suggestion>('/suggestions', {
      method: 'POST',
      body: JSON.stringify(suggestionData),
    });
  } catch (error) {
    console.error('添加建议失败:', error);
    throw error;
  }
};

export const updateSuggestionStatus = async (id: string, status: SuggestionStatus, updateText: string): Promise<Suggestion> => {
  try {
    return await apiRequest<Suggestion>(`/suggestions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, updateText }),
    });
  } catch (error) {
    console.error('更新建议状态失败:', error);
    throw error;
  }
};

export const addSuggestionProgress = async (id: string, updateText: string): Promise<Suggestion> => {
  try {
    return await apiRequest<Suggestion>(`/suggestions/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ updateText }),
    });
  } catch (error) {
    console.error('添加建议进展失败:', error);
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