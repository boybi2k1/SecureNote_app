import api from './api';
import { User } from '../types/auth.types';
import {
  UserSettings,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateSettingsRequest,
} from '../types/user.types';

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const response = await api.put<User>('/users/me', profileData);
    return response.data;
  },

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>('/users/me/password', passwordData);
    return response.data;
  },

  async getSettings(): Promise<UserSettings> {
    const response = await api.get<UserSettings>('/users/me/settings');
    return response.data;
  },

  async updateSettings(settings: UpdateSettingsRequest): Promise<UserSettings> {
    const response = await api.put<UserSettings>('/users/me/settings', settings);
    return response.data;
  },
};


