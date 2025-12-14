import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Lấy config từ expo-constants (SDK 54 compatible)
const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

// Tự động detect platform và sử dụng đúng URL
// Ưu tiên config từ app.config.js, sau đó mới detect platform
const getBaseUrl = () => {
  // Nếu có config từ app.config.js, dùng nó (ưu tiên cao nhất)
  if (extra.apiBaseUrl) {
    return extra.apiBaseUrl;
  }
  
  // Tự động detect platform nếu không có config
  if (Platform.OS === 'android') {
    // Android emulator hoặc thiết bị thật - dùng IP máy tính
    return 'http://192.130.38.105:8000/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator
    return 'http://localhost:8000/api';
  } else {
    // Web hoặc platform khác
    return 'http://localhost:8000/api';
  }
};

const getApiUrl = () => {
  // Nếu có config từ app.config.js, dùng nó (ưu tiên cao nhất)
  if (extra.apiUrl) {
    return extra.apiUrl;
  }
  
  // Tự động detect platform nếu không có config
  if (Platform.OS === 'android') {
    // Android emulator hoặc thiết bị thật - dùng IP máy tính
    return 'http://192.130.38.105:8000';
  } else if (Platform.OS === 'ios') {
    // iOS simulator
    return 'http://localhost:8000';
  } else {
    // Web hoặc platform khác
    return 'http://localhost:8000';
  }
};

export const API_BASE_URL = getBaseUrl();
export const API_URL = getApiUrl();

// Log để debug (chỉ trong development)
if (__DEV__) {
  console.log('API Configuration:', {
    platform: Platform.OS,
    API_BASE_URL,
    API_URL,
  });
}

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

