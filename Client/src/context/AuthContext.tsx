import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterRequest } from '../types/auth.types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, twoFactorCode?: string, useBackupCode?: boolean) => Promise<any>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setup2FA: () => Promise<any>;
  enable2FA: (code: string) => Promise<void>;
  disable2FA: (password: string) => Promise<void>;
  enableBiometric: () => Promise<string>;
  disableBiometric: () => Promise<void>;
  loginWithBiometric: (username: string, backupCode: string) => Promise<void>;
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
  const login = async (username: string, password: string, twoFactorCode?: string, useBackupCode?: boolean) => {
    try {
      const response = await authService.login(username, password);
      
      // Check if 2FA is required
      if (response.requires_2fa) {
        if (!twoFactorCode) {
          // Return response with requires_2fa flag
          return response as any;
        }
        
        // Login with 2FA code
        const login2FAData = {
          username,
          password,
          ...(useBackupCode ? { backup_code: twoFactorCode } : { code: twoFactorCode }),
        };
        
        const authResponse = await authService.loginWith2FA(login2FAData);
        await storageService.storeTokens(authResponse.access_token, authResponse.refresh_token);
        
        const userData = await authService.getCurrentUser();
        setUser(userData);
        await storageService.storeUserData(userData);
        return authResponse;
      }
      
      // Normal login without 2FA
      await storageService.storeTokens(response.access_token, response.refresh_token);
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      await storageService.storeUserData(userData);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Đăng nhập thất bại';
      throw new Error(errorMessage);
    }
  };

  // Register
  const register = async (userData: RegisterRequest) => {
    try {
      await authService.register(userData);
      // Note: User must setup 2FA before they can login
      // Navigation to 2FA setup will be handled by RegisterScreen
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Đăng ký thất bại';
      throw new Error(errorMessage);
    }
  };

  // 2FA Methods
  const setup2FA = async () => {
    return await authService.setup2FA();
  };

  const enable2FA = async (code: string) => {
    await authService.enable2FA(code);
    // Refresh user data
    const userData = await authService.getCurrentUser();
    setUser(userData);
    await storageService.storeUserData(userData);
  };

  const disable2FA = async (password: string) => {
    await authService.disable2FA(password);
    // Refresh user data
    const userData = await authService.getCurrentUser();
    setUser(userData);
    await storageService.storeUserData(userData);
  };

  // Biometric Methods
  const enableBiometric = async () => {
    const result = await authService.enableBiometric();
    const userData = await authService.getCurrentUser();
    setUser(userData);
    await storageService.storeUserData(userData);
    // Return backup code to be saved
    return result.codes[0];
  };

  const loginWithBiometric = async (username: string, backupCode: string) => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:159',message:'Biometric login started',data:{username,backupCodeLength:backupCode.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      const authResponse = await authService.loginWithBiometric(username, backupCode);
      await storageService.storeTokens(authResponse.access_token, authResponse.refresh_token);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:165',message:'Login response received - backup code is reusable',data:{hasNewBackupCode:!!authResponse.new_backup_code},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // Backup code is now reusable - no need to update credential
      // The same backup code can be used for multiple logins
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      await storageService.storeUserData(userData);
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:175',message:'Biometric login error',data:{error:error.message,status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const errorMessage = error.response?.data?.detail || error.message || 'Đăng nhập vân tay thất bại';
      throw new Error(errorMessage);
    }
  };

  const disableBiometric = async () => {
    await authService.disableBiometric();
    const userData = await authService.getCurrentUser();
    setUser(userData);
    await storageService.storeUserData(userData);
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
    setup2FA,
    enable2FA,
    disable2FA,
    enableBiometric,
    disableBiometric,
    loginWithBiometric,
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

