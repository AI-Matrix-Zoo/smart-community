import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User } from '../types';
import { loginUser as apiLogin, logoutUser as apiLogout, getCurrentUser as apiGetCurrentUser, registerUser as apiRegisterUser, RegistrationData } from '../services/dataService';
import { useNavigate } from 'react-router-dom';


interface AuthContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  login: (phone: string, password: string) => Promise<boolean>; // Changed username to phone
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<{success: boolean; message?: string; user?: User | null}>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = apiGetCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoadingAuth(false);
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<boolean> => {
    setIsLoadingAuth(true);
    try {
      const user = await apiLogin(phone, password);
      if (user) {
        setCurrentUser(user);
        setIsLoadingAuth(false);
        return true;
      } else {
        setCurrentUser(null);
        setIsLoadingAuth(false);
        return false;
      }
    } catch (error) {
      console.error("Login failed:", error);
      setCurrentUser(null);
      setIsLoadingAuth(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoadingAuth(true);
    await apiLogout();
    setCurrentUser(null);
    setIsLoadingAuth(false);
    navigate('/login'); 
  }, [navigate]);

  const register = useCallback(async (data: RegistrationData): Promise<{success: boolean; message?: string; user?: User | null}> => {
    setIsLoadingAuth(true);
    try {
      const result = await apiRegisterUser(data);
      // Optionally auto-login after successful registration
      if (result.success && result.user) {
        // setCurrentUser(result.user); // Or call login if you want to re-verify and set CURRENT_USER_KEY
        // For now, just return success, LoginPage/RegisterPage can navigate or prompt login
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