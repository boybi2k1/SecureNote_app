# Secure Note System

Hệ thống quản lý ghi chú bảo mật với mã hóa AES-256-GCM, sử dụng mô hình client-server.

## Cấu trúc Dự án

```
v5/
├── server/          # Backend API (FastAPI + SQLite)
├── client/          # Mobile App (React Native Android)
├── server-plan.md   # Kế hoạch chi tiết cho server
└── client-plan.md   # Kế hoạch chi tiết cho client
```

## Tính năng

### Server (FastAPI)
- ✅ Authentication với JWT (access + refresh tokens)
- ✅ Mã hóa notes bằng AES-256-GCM
- ✅ Password hashing với Bcrypt
- ✅ Rate limiting
- ✅ Security headers
- ✅ Swagger UI documentation
- ✅ Categories & Tags
- ✅ Favorites
- ✅ Trash/Soft delete
- ✅ Search nâng cao
- ✅ Share notes với encryption
- ✅ User settings

### Client (React Native)
- ✅ Authentication (Login/Register)
- ✅ Notes CRUD
- ✅ Categories & Tags management
- ✅ Favorites
- ✅ Trash management
- ✅ Search
- ✅ Share notes
- ✅ User settings (Profile, Change Password)
- ✅ Secure storage với Keychain
- ✅ Token auto-refresh

## Cơ chế Bảo mật

### Server
1. **AES-256-GCM Encryption**: Mã hóa title và content của notes
2. **Bcrypt Password Hashing**: Bảo vệ mật khẩu
3. **JWT Authentication**: Access token (30 phút) + Refresh token (7 ngày)
4. **Rate Limiting**: Chống brute force và DDoS
5. **Input Validation**: Pydantic schemas
6. **SQL Injection Prevention**: SQLAlchemy ORM

### Client
1. **Secure Storage**: React Native Keychain
2. **Token Management**: Auto-refresh khi hết hạn
3. **SSL Pinning**: Chống MITM attacks
4. **Biometric Authentication**: Fingerprint/Face ID
5. **HTTPS Only**: Chỉ cho phép HTTPS connections
6. **Input Validation**: Client-side validation

## Cài đặt và Chạy

### Server

```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Cập nhật .env với SECRET_KEY và MASTER_KEY
uvicorn app.main:app --reload
```

Server chạy tại: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`

### Client

```bash
cd client
npm install
# Cập nhật API_BASE_URL trong src/utils/constants.ts
npm run android
```

## Database Schema

- **users**: Thông tin user và encryption key
- **notes**: Notes được mã hóa (title, content)
- **categories**: Categories của user
- **tags**: Tags của user
- **note_tags**: Many-to-many relationship
- **shared_notes**: Tracking sharing relationships
- **refresh_tokens**: Refresh tokens

## API Endpoints

Xem chi tiết tại: `http://localhost:8000/docs`

## Lưu ý

1. **MASTER_KEY**: Phải là chính xác 32 bytes (256 bits) cho AES-256
2. **SECRET_KEY**: Nên dùng random string dài ít nhất 32 ký tự
3. **Production**: Sử dụng HTTPS, secure storage cho keys
4. **Database**: SQLite phù hợp cho development, nên dùng PostgreSQL cho production

## License

Dự án cho môn học An toàn Bảo mật


















