export interface UserSettings {
  auto_lock_enabled: boolean;
  session_timeout_minutes: number;
  theme: 'light' | 'dark';
}

export interface UpdateProfileRequest {
  username?: string; // Optional, 3-50 ký tự
  email?: string; // Optional, email hợp lệ
}

export interface ChangePasswordRequest {
  current_password: string; // Bắt buộc
  new_password: string; // Bắt buộc, tối thiểu 8 ký tự
}

export interface UpdateSettingsRequest {
  auto_lock_enabled?: boolean;
  session_timeout_minutes?: number;
  theme?: 'light' | 'dark';
}


