import axios from 'axios';
import api from './api';
import { storageService } from './storageService';
import { API_BASE_URL } from '../utils/constants';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegisterResponse,
  User,
} from '../types/auth.types';

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const request: LoginRequest = { username, password };
    const response = await api.post<AuthResponse>('/auth/login', request);
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
};

