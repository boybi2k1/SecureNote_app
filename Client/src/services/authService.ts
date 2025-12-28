import axios from 'axios';
import api from './api';
import { storageService } from './storageService';
import { API_BASE_URL } from '../utils/constants';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthResponseWith2FA,
  RegisterResponse,
  User,
  TwoFactorSetup,
  Login2FARequest,
} from '../types/auth.types';

export const authService = {
  async login(username: string, password: string): Promise<AuthResponseWith2FA> {
    const request: LoginRequest = { username, password };
    const response = await api.post<AuthResponseWith2FA>('/auth/login', request);
    return response.data;
  },

  async loginWith2FA(loginData: Login2FARequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login/2fa', loginData);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Vẫn clear tokens dù API call có lỗi
      console.error('Logout API error:', error);
    } finally {
      await storageService.clearAll();
    }
  },

  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    // Sử dụng axios trực tiếp để tránh interceptor gây vòng lặp
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  // 2FA Methods
  async setup2FA(): Promise<TwoFactorSetup> {
    const response = await api.post<TwoFactorSetup>('/auth/2fa/setup');
    return response.data;
  },

  async setup2FANew(username: string, password: string): Promise<TwoFactorSetup> {
    const response = await api.post<TwoFactorSetup>('/auth/2fa/setup-new', { username, password });
    return response.data;
  },

  async enable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/enable', { code });
  },

  async enable2FANew(username: string, password: string, code: string): Promise<void> {
    await api.post('/auth/2fa/enable-new', { username, password, code });
  },

  async disable2FA(password: string): Promise<void> {
    await api.post('/auth/2fa/disable', { password });
  },

  // Biometric Methods
  async enableBiometric(): Promise<{ codes: string[] }> {
    const response = await api.put<{ codes: string[] }>('/auth/biometric/enable');
    return response.data;
  },

  async disableBiometric(): Promise<void> {
    await api.put('/auth/biometric/disable');
  },

  async loginWithBiometric(username: string, backupCode: string): Promise<AuthResponse> {
    const loginData: Login2FARequest = {
      username,
      password: '', // Not needed for biometric login
      backup_code: backupCode,
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:96',message:'Calling biometric login API',data:{username,backupCodeLength:backupCode.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    const response = await api.post<AuthResponse>('/auth/biometric/login', loginData);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:103',message:'Biometric login API response',data:{hasNewBackupCode:!!response.data.new_backup_code,newBackupCodeLength:response.data.new_backup_code?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    return response.data;
  },
};

