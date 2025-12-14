# Hướng dẫn nhanh - Secure Notes App

## Bước 1: Cài đặt dependencies

```bash
npm install
```

## Bước 2: Cấu hình API

Đảm bảo server API đang chạy tại `http://localhost:8000`

Nếu server chạy ở địa chỉ khác, sửa trong `app.config.js`:
```javascript
extra: {
  apiUrl: "http://YOUR_API_URL:8000",
  apiBaseUrl: "http://YOUR_API_URL:8000/api",
}
```

## Bước 3: Chạy ứng dụng

```bash
npm start
```

Sau đó:
- Nhấn `a` để mở trên Android emulator
- Nhấn `i` để mở trên iOS simulator
- Quét QR code bằng Expo Go app trên điện thoại thật

## Bước 4: Test đăng nhập

1. Mở app, bạn sẽ thấy màn hình đăng nhập
2. Nhấn "Đăng ký" để tạo tài khoản mới
3. Hoặc đăng nhập với tài khoản đã có

## Tính năng đã implement

✅ Đăng ký tài khoản
✅ Đăng nhập
✅ Auto refresh token khi access token hết hạn
✅ Đăng xuất
✅ Lưu trữ tokens an toàn bằng Expo SecureStore
✅ Auto login khi app khởi động lại

## Lưu ý

- Đảm bảo server API đang chạy trước khi start app
- Nếu dùng Android emulator, localhost sẽ là `10.0.2.2` thay vì `localhost`
- Nếu dùng thiết bị thật, cần thay `localhost` bằng IP máy tính của bạn

