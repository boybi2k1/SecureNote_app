export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  two_factor_enabled?: boolean;
  biometric_enabled?: boolean;
}

export interface LoginRequest {
  username: string; // Username hoặc email
  password: string;
}

export interface RegisterRequest {
  username: string; // 3-50 ký tự
  email: string; // Email hợp lệ
  password: string; // Tối thiểu 8 ký tự
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface TwoFactorSetup {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface Login2FARequest {
  username: string;
  password: string;
  code?: string;
  backup_code?: string;
}

export interface AuthResponseWith2FA extends AuthResponse {
  requires_2fa?: boolean;
  message?: string;
}

