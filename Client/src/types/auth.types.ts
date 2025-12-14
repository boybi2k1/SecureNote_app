export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
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

