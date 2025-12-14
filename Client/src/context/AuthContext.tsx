import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterRequest } from '../types/auth.types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Kiểm tra authentication khi app start
  const checkAuth = async () => {
    try {
      setLoading(true);
      const tokens = await storageService.getTokens();
      
      if (!tokens) {
        setUser(null);
        return;
      }

      // Thử lấy thông tin user
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        await storageService.storeUserData(userData);
      } catch (error: any) {
        // Nếu token hết hạn, thử refresh
        if (error.response?.status === 401 && tokens.refreshToken) {
          try {
            const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
            await storageService.storeTokens(newTokens.access_token, newTokens.refresh_token);
            
            const userData = await authService.getCurrentUser();
            setUser(userData);
            await storageService.storeUserData(userData);
          } catch (refreshError) {
            // Refresh thất bại, logout
            await storageService.clearAll();
            setUser(null);
          }
        } else {
          // Lỗi khác, logout
          await storageService.clearAll();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Check auth error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      await storageService.storeTokens(response.access_token, response.refresh_token);
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      await storageService.storeUserData(userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Đăng nhập thất bại';
      throw new Error(errorMessage);
    }
  };

  // Register
  const register = async (userData: RegisterRequest) => {
    try {
      await authService.register(userData);
      // Auto login sau khi register
      await login(userData.username, userData.password);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Đăng ký thất bại';
      throw new Error(errorMessage);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      await storageService.clearAll();
    }
  };

  // Check auth khi component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

