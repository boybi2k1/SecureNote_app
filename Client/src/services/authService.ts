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
  async enableBiometric(): Promise<void> {
    await api.put('/auth/biometric/enable');
  },

  async disableBiometric(): Promise<void> {
    await api.put('/auth/biometric/disable');
  },
};

