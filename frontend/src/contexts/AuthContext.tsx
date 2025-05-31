import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User } from '../types';
import { loginUser as apiLogin, logoutUser as apiLogout, getCurrentUser as apiGetCurrentUser, registerUser as apiRegisterUser, RegistrationData } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

// Helper to set current user to localStorage
const setCurrentUserToStorage = (user: User | null) => {
  if (user) {
    localStorage.setItem('community_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('community_current_user');
  }
};

interface LoginRequest {
  identifier: string;
  password: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  login: (loginData: LoginRequest) => Promise<{success: boolean; message?: string; user?: User | null}>;
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<{success: boolean; message?: string; user?: User | null}>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = apiGetCurrentUser(); // This now correctly reads from localStorage if set by login
    if (user) {
      setCurrentUser(user);
    }
    setIsLoadingAuth(false);
  }, []);

  const login = useCallback(async (loginData: LoginRequest): Promise<{success: boolean; message?: string; user?: User | null}> => {
    setIsLoadingAuth(true);
    try {
      const result = await apiLogin(loginData.identifier, loginData.password); // apiLogin in apiService handles setAuthToken
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setCurrentUserToStorage(result.user); // Save user to localStorage
        setIsLoadingAuth(false);
        return { success: true, user: result.user };
      } else {
        setCurrentUser(null);
        setCurrentUserToStorage(null); // Clear user from localStorage
        setIsLoadingAuth(false);
        return { success: false, message: result.message || '登录失败' };
      }
    } catch (error) {
      console.error("Login failed:", error);
      setCurrentUser(null);
      setCurrentUserToStorage(null); // Clear user from localStorage
      setIsLoadingAuth(false);
      return { success: false, message: '登录过程中发生错误' };
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoadingAuth(true);
    await apiLogout(); // apiLogout in apiService handles removeAuthToken
    setCurrentUser(null);
    setCurrentUserToStorage(null); // Clear user from localStorage
    setIsLoadingAuth(false);
    navigate('/login'); 
  }, [navigate]);

  const register = useCallback(async (data: RegistrationData): Promise<{success: boolean; message?: string; user?: User | null}> => {
    setIsLoadingAuth(true);
    try {
      const result = await apiRegisterUser(data); // apiRegisterUser in apiService handles setAuthToken
      if (result.success && result.user) {
        // After successful registration, we can choose to auto-login or prompt the user to login.
        // For now, let's set the current user and store them, similar to login.
        setCurrentUser(result.user);
        setCurrentUserToStorage(result.user);
      }
      setIsLoadingAuth(false);
      return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '注册过程中发生未知错误。';
        console.error("Registration failed:", error);
        setIsLoadingAuth(false);
        return { success: false, message: errorMessage };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuth, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

// 添加useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};