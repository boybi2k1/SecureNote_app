import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { storageService } from './storageService';
import { ApiError } from '../types/api.types';

// Tạo axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const tokens = await storageService.getTokens();
    if (tokens?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors và auto refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đang refresh, thêm vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await storageService.getTokens();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token');
        }

        // Gọi API refresh token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${tokens.refreshToken}`,
            },
          }
        );

        const { access_token, refresh_token } = response.data;
        await storageService.storeTokens(access_token, refresh_token);

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await storageService.clearAll();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Parse error message
    let errorMessage = 'Đã xảy ra lỗi không xác định';
    
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      // Handle network errors
      if (error.message.includes('Network Error') || error.message.includes('network')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n- Server đang chạy\n- Địa chỉ API đúng\n- Kết nối mạng';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Vui lòng thử lại.';
      } else {
        errorMessage = error.message;
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra server đang chạy.';
    }

    return Promise.reject({
      ...error,
      message: errorMessage,
    });
  }
);

export default api;

