# Secure Notes App - Expo

Ứng dụng quản lý ghi chú bảo mật được xây dựng với React Native và Expo SDK 54.

## Tính năng

- ✅ Đăng ký tài khoản
- ✅ Đăng nhập
- ✅ Làm mới token tự động
- ✅ Đăng xuất

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Cấu hình API URL trong `app.config.js` hoặc tạo file `.env`:
```
API_URL=http://localhost:8000
API_BASE_URL=http://localhost:8000/api
```

3. Chạy ứng dụng:
```bash
npm start
```

Sau đó chọn platform (Android/iOS) hoặc quét QR code bằng Expo Go app.

## Cấu trúc dự án

```
src/
  ├── context/          # Context providers (AuthContext)
  ├── navigation/       # Navigation setup
  ├── screens/          # Screen components
  │   └── Auth/         # Authentication screens
  ├── services/         # API services
  ├── types/            # TypeScript types
  └── utils/            # Utility functions
```

## API Endpoints

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Làm mới token
- `POST /api/auth/logout` - Đăng xuất

Xem chi tiết trong `API_DOCUMENTATION.md`.

## Lưu ý

- Tokens được lưu trữ an toàn bằng Expo SecureStore
- Auto refresh token khi access token hết hạn
- Rate limiting: Đăng ký (3 req/hour), Đăng nhập (5 req/minute)

