# Cấu hình API URL

## Vấn đề Network Error

Khi gặp lỗi "network error" hoặc "cannot connect to server", có thể do:

1. **Android Emulator**: Không thể dùng `localhost`, phải dùng `10.0.2.2`
2. **iOS Simulator**: Có thể dùng `localhost`
3. **Thiết bị thật**: Phải dùng IP máy tính (không phải localhost)

## Giải pháp tự động

App đã được cấu hình để tự động detect platform:
- **Android**: `http://10.0.2.2:8000/api`
- **iOS**: `http://localhost:8000/api`
- **Web**: `http://localhost:8000/api`

## Cấu hình thủ công (nếu cần)

### Cách 1: Sửa trong `app.config.js`

```javascript
extra: {
  apiUrl: "http://YOUR_IP:8000",
  apiBaseUrl: "http://YOUR_IP:8000/api",
}
```

### Cách 2: Dùng Environment Variables

Tạo file `.env` (không commit vào git):

```
API_URL=http://192.168.1.100:8000
API_BASE_URL=http://192.168.1.100:8000/api
```

### Cách 3: Tìm IP máy tính

**Windows:**
```bash
ipconfig
# Tìm IPv4 Address (ví dụ: 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# Hoặc
ip addr show
```

## Kiểm tra Server

Đảm bảo server đang chạy:

```bash
# Test từ terminal
curl http://localhost:8000/health

# Hoặc mở browser
http://localhost:8000/docs
```

## Debug

Trong development mode, app sẽ log API configuration khi start:
- Platform (android/ios/web)
- API_BASE_URL
- API_URL

Xem trong console/logs của Expo.

