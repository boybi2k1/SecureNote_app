# Kế Hoạch Xây Dựng Server - Secure Note System

## Tổng Quan
Xây dựng backend API sử dụng FastAPI và SQLite để quản lý secure notes với các cơ chế bảo mật nâng cao.

## Công Nghệ
- **Framework**: FastAPI (Python 3.9+)
- **Database**: SQLite với SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **Encryption**: AES-256 (sử dụng thư viện cryptography)

## Kiến Trúc Server

### Cấu Trúc Thư Mục
```
server/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point với Swagger UI
│   ├── config.py               # Cấu hình (database, JWT secret, etc.)
│   ├── database.py             # SQLite connection & session
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── security.py             # Security utilities (hashing, JWT, encryption)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependencies (auth, rate limiting)
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py         # Authentication endpoints
│   │       ├── notes.py        # Notes CRUD endpoints
│   │       ├── categories.py   # Categories endpoints
│   │       ├── tags.py         # Tags endpoints
│   │       ├── share.py        # Share notes endpoints
│   │       └── users.py        # User settings endpoints
│   └── middleware/
│       ├── __init__.py
│       ├── rate_limit.py       # Rate limiting middleware
│       └── security_headers.py # Security headers middleware
├── requirements.txt
└── README.md
```

## Cơ Chế Bảo Mật

### 1. Mã Hóa Dữ Liệu (Data Encryption) - AES-256
- **Mục đích**: Mã hóa toàn bộ nội dung notes (title và content) trước khi lưu vào database
- **Cơ chế**: 
  - **Sử dụng AES-256 (Advanced Encryption Standard)** với mode **GCM (Galois/Counter Mode)**
  - GCM được chọn vì cung cấp authenticated encryption (vừa encrypt vừa authenticate)
  - Key size: 256 bits (32 bytes)
  - IV/Nonce: 96 bits (12 bytes) cho GCM mode, random cho mỗi lần encrypt
  - Authentication Tag: 128 bits (16 bytes) - GCM tự động tạo tag để verify integrity
  - Mỗi user có encryption key riêng (256-bit), được mã hóa bằng master key
  - Key derivation từ user password sử dụng PBKDF2-HMAC-SHA256 (nếu cần)
  - **QUAN TRỌNG**: Cả title và content của note đều phải được mã hóa bằng AES-256
  - Dữ liệu chỉ được decrypt khi user đã authenticated và request note của chính họ
- **Triển khai**:
  - Module `security.py`: 
    - Functions `encrypt_note_content_aes256()`, `decrypt_note_content_aes256()`
    - Functions `encrypt_note_title_aes256()`, `decrypt_note_title_aes256()`
    - Function `get_user_encryption_key()` - decrypt user's key từ database
    - Function `generate_aes_key()` - tạo 256-bit key cho user mới
    - Sử dụng `cryptography.hazmat.primitives.ciphers.aead.AESGCM` từ cryptography library
    - AESGCM cung cấp authenticated encryption, không cần padding như CBC
  - Encryption key được lưu trong database (encrypted bằng master key với AES-256)
  - Khi tạo/update note: 
    - Generate random nonce (12 bytes) cho mỗi field
    - Encrypt title và content bằng AES-256-GCM với user's key và nonce
    - Lưu nonce và authentication tag cùng với encrypted data
  - Khi đọc note: 
    - Lấy nonce, tag và encrypted data từ database
    - Decrypt và verify title và content bằng AES-256-GCM với user's key, nonce và tag
  - Database chỉ lưu encrypted data + IV, không bao giờ lưu plaintext

### 2. Xác Thực JWT (JWT Authentication)
- **Mục đích**: Secure authentication không cần session storage
- **Cơ chế**:
  - **Algorithm**: HS256 (HMAC-SHA256) - symmetric key algorithm
  - Access token (short-lived: 30 phút)
  - Refresh token (long-lived: 7 ngày)
  - Token chứa user ID và permissions
  - Sử dụng `python-jose` library để encode/decode JWT
- **Triển khai**:
  - Endpoint `/api/auth/login` - trả về access + refresh token
  - Endpoint `/api/auth/refresh` - refresh access token
  - Dependency `get_current_user()` để verify token trong protected routes
  - Blacklist token khi logout (optional, lưu trong database)

### 3. Password Hashing (Bcrypt)
- **Mục đích**: Bảo vệ mật khẩu ngay cả khi database bị lộ
- **Cơ chế**:
  - **Sử dụng Bcrypt** với salt tự động (bcrypt tự động generate salt)
  - Work factor (cost factor): 12-15 rounds (recommended: 12)
  - Bcrypt tự động handle salt generation và storage trong hash string
  - Hash format: `$2b$12$...` (algorithm, cost, salt+hash)
- **Triển khai**:
  - Function `hash_password(password: str) -> str` trong `security.py`
    - Sử dụng `bcrypt.hashpw()` với cost factor = 12
    - Return bcrypt hash string
  - Function `verify_password(plain_password: str, hashed_password: str) -> bool`
    - Sử dụng `bcrypt.checkpw()` để verify
    - Return True nếu password đúng, False nếu sai
  - Không bao giờ lưu plaintext password trong database
  - Hash được lưu trực tiếp trong `users.hashed_password` field

### 4. Rate Limiting
- **Mục đích**: Ngăn chặn brute force attacks và DDoS
- **Cơ chế**:
  - Giới hạn số requests per IP/user
  - Sử dụng sliding window hoặc token bucket
  - Stricter limits cho login/register endpoints
- **Triển khai**:
  - Middleware `rate_limit.py`
  - **Sử dụng `slowapi`** - đơn giản, phù hợp cho dự án nhỏ, không cần Redis
  - Redis chỉ cần khi scale lớn (multiple servers)
  - Limits:
    - Login: 5 attempts/minute
    - Register: 3 attempts/hour
    - API calls: 100 requests/minute per user
    - General: 200 requests/minute per IP

### 5. Input Validation & SQL Injection Prevention
- **Mục đích**: Ngăn chặn injection attacks và invalid data
- **Cơ chế**:
  - Pydantic schemas cho validation
  - SQLAlchemy ORM (parameterized queries tự động)
  - Sanitization cho user input
- **Triển khai**:
  - Schemas trong `schemas.py` với validators
  - Max length cho title/content
  - XSS prevention (sanitize HTML nếu cho phép)
  - Type checking strict

### 6. CORS & Security Headers (Bonus)
- **CORS**: Chỉ cho phép domain của React Native app
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security` (nếu dùng HTTPS)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    encryption_key_encrypted TEXT NOT NULL,  -- User's encryption key (encrypted)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Notes Table
```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title_encrypted TEXT NOT NULL,           -- AES-256 encrypted title
    title_nonce TEXT NOT NULL,                -- Nonce for title encryption (base64, 12 bytes)
    title_tag TEXT NOT NULL,                  -- Authentication tag for title (base64, 16 bytes)
    content_encrypted TEXT NOT NULL,          -- AES-256-GCM encrypted content
    content_nonce TEXT NOT NULL,              -- Nonce for content encryption (base64, 12 bytes)
    content_tag TEXT NOT NULL,                -- Authentication tag for content (base64, 16 bytes)
    category_id INTEGER,                      -- Category của note
    is_favorite BOOLEAN DEFAULT FALSE,        -- Đánh dấu favorite
    is_deleted BOOLEAN DEFAULT FALSE,         -- Soft delete flag
    deleted_at TIMESTAMP,                     -- Thời gian xóa
    is_shared BOOLEAN DEFAULT FALSE,          -- Note được share
    original_note_id INTEGER,                 -- ID của note gốc (nếu là shared copy)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (original_note_id) REFERENCES notes(id) ON DELETE SET NULL
);
```

### Categories Table
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color VARCHAR(7) DEFAULT '#3498db',  -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);
```

### Tags Table
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);
```

### Note-Tag Junction Table (Many-to-Many)
```sql
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### Shared Notes Table
```sql
CREATE TABLE shared_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_note_id INTEGER NOT NULL,        -- Note của owner
    shared_note_id INTEGER NOT NULL,          -- Bản copy cho recipient
    owner_id INTEGER NOT NULL,                -- User share note
    recipient_id INTEGER NOT NULL,            -- User nhận note
    permission VARCHAR(10) DEFAULT 'read',     -- 'read' hoặc 'write'
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(original_note_id, recipient_id)    -- Mỗi user chỉ nhận 1 lần
);
```

### Refresh Tokens Table (Optional)
```sql
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Documentation (Swagger/OpenAPI)

### Swagger UI Integration
- **Mục đích**: Cung cấp interactive API documentation để test API endpoints
- **Cơ chế**:
  - FastAPI tự động generate OpenAPI schema từ code
  - Swagger UI có sẵn tại `/docs` endpoint
  - ReDoc documentation tại `/redoc` endpoint
  - Có thể test API trực tiếp từ browser
- **Triển khai**:
  - Configure trong `main.py`:
    - Title, version, description cho API
    - Tags và descriptions cho từng endpoint
    - Response models và examples
    - Security schemes (Bearer JWT) để test authenticated endpoints
  - Thêm metadata cho mỗi endpoint:
    - Summary, description
    - Request/response examples
    - Error responses documentation
  - Enable "Authorize" button trong Swagger UI để test với JWT token
- **Access URLs**:
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`
  - OpenAPI JSON: `http://localhost:8000/openapi.json`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập, trả về tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidate refresh token)

### Notes (Protected - cần JWT)
- `GET /api/notes` - Lấy danh sách notes của user
  - Query params: `?category_id={id}&tag_ids={1,2,3}&favorite={true/false}&search={keyword}&is_deleted={false}`
- `GET /api/notes/{note_id}` - Lấy chi tiết một note
- `POST /api/notes` - Tạo note mới (với category_id, tag_ids[])
- `PUT /api/notes/{note_id}` - Cập nhật note
- `DELETE /api/notes/{note_id}` - Soft delete note (set is_deleted=true)
- `POST /api/notes/{note_id}/favorite` - Toggle favorite status
- `POST /api/notes/{note_id}/restore` - Khôi phục note từ trash
- `DELETE /api/notes/{note_id}/permanent` - Xóa vĩnh viễn
- `GET /api/notes/trash` - Lấy danh sách notes đã xóa

### Categories (Protected)
- `GET /api/categories` - Lấy danh sách categories của user
- `POST /api/categories` - Tạo category mới
- `PUT /api/categories/{category_id}` - Cập nhật category
- `DELETE /api/categories/{category_id}` - Xóa category

### Tags (Protected)
- `GET /api/tags` - Lấy danh sách tags của user
- `POST /api/tags` - Tạo tag mới
- `DELETE /api/tags/{tag_id}` - Xóa tag
- `POST /api/notes/{note_id}/tags` - Thêm tags vào note
  - Body: `{ "tag_ids": [1, 2, 3] }` hoặc `{ "tag_id": 1 }` (single tag)
- `DELETE /api/notes/{note_id}/tags/{tag_id}` - Xóa tag khỏi note

### Share Notes (Protected)
- `POST /api/notes/{note_id}/share` - Share note với user khác
  - Body: `{ "recipient_username": "user2", "permission": "read" | "write" }`
- `GET /api/notes/shared` - Lấy danh sách notes được share với user hiện tại
  - Query params: `?permission=read|write`
- `GET /api/notes/shared-by-me` - Lấy danh sách notes mà user đã share
- `PUT /api/notes/{note_id}/share/{recipient_id}` - Cập nhật permission
- `DELETE /api/notes/{note_id}/share/{recipient_id}` - Unshare note
- `GET /api/users/search?q={username}` - Tìm user để share

### User Settings (Protected)
- `GET /api/users/me` - Lấy thông tin user hiện tại
- `PUT /api/users/me` - Cập nhật profile (username, email)
- `PUT /api/users/me/password` - Đổi mật khẩu
  - Body: `{ "current_password": "...", "new_password": "..." }`
- `GET /api/users/me/settings` - Lấy user settings
- `PUT /api/users/me/settings` - Cập nhật user settings

## Luồng Xử Lý

### Đăng Ký
1. Validate input (username, email, password)
2. Check username/email đã tồn tại
3. Hash password
4. Generate encryption key cho user
5. Encrypt encryption key bằng master key
6. Lưu user vào database
7. Trả về success

### Đăng Nhập
1. Validate input
2. Tìm user theo username/email
3. Verify password
4. Generate access token và refresh token
5. Lưu refresh token (optional)
6. Trả về tokens

### Tạo Note
1. Verify JWT token
2. Validate input (title, content)
3. Decrypt user's encryption key từ database (sử dụng master key)
4. Generate random nonce (12 bytes) cho title và content
5. **Mã hóa note title bằng AES-256-GCM** với user's encryption key và title nonce
6. **Mã hóa note content bằng AES-256-GCM** với user's encryption key và content nonce
7. Lưu encrypted title + title nonce + title tag và encrypted content + content nonce + content tag vào database
8. Trả về note ID (không trả về plaintext)

### Đọc Note
1. Verify JWT token
2. Lấy note từ database (check ownership - user_id phải khớp hoặc is_shared=true)
3. Decrypt user's encryption key từ database (sử dụng master key)
4. Lấy title nonce, title tag và content nonce, content tag từ database
5. **Giải mã và verify note title bằng AES-256-GCM** với user's encryption key, title nonce và title tag
6. **Giải mã và verify note content bằng AES-256-GCM** với user's encryption key, content nonce và content tag
7. Trả về plaintext title và content cho client (kèm category, tags, is_favorite)

### Tạo Category
1. Verify JWT token
2. Validate input (name, color)
3. Check category name đã tồn tại (trong user's categories)
4. Lưu category vào database
5. Trả về category info

### Tạo Tag
1. Verify JWT token
2. Validate input (name)
3. Check tag name đã tồn tại (trong user's tags)
4. Lưu tag vào database (hoặc return existing tag)
5. Trả về tag info

### Tạo Note với Category và Tags
1. Verify JWT token
2. Validate input (title, content, category_id, tag_ids[])
3. Decrypt user's encryption key
4. Encrypt title và content bằng AES-256-GCM
5. Lưu note vào database với category_id
6. Tạo relationships trong note_tags table
7. Trả về note ID

### Soft Delete Note
1. Verify JWT token
2. Check note ownership
3. Set is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
4. Không xóa thực sự khỏi database
5. Trả về success

### Restore Note
1. Verify JWT token
2. Check note ownership và is_deleted = TRUE
3. Set is_deleted = FALSE, deleted_at = NULL
4. Trả về note info

### Permanent Delete Note
1. Verify JWT token
2. Check note ownership và is_deleted = TRUE
3. Xóa thực sự khỏi database (CASCADE sẽ xóa note_tags, shared_notes)
4. Trả về success

### Search Notes
1. Verify JWT token
2. Parse query parameters (search, category_id, tag_ids[], favorite, is_deleted)
3. Build SQL query với filters:
   - Filter by category_id (nếu có)
   - Filter by tags (JOIN với note_tags table, WHERE tag_id IN tag_ids[])
   - Filter by favorite (is_favorite = true/false)
   - Filter by is_deleted (is_deleted = true/false)
4. Lấy notes từ database với filters
5. Decrypt notes bằng user's encryption key
6. Filter notes theo search keyword trong plaintext (nếu có):
   - Search trong decrypted title và content
7. Trả về filtered notes list (kèm category, tags)

### Share Note
1. Verify JWT token (owner)
2. Validate input (recipient_username, permission)
3. Tìm recipient user theo username
4. Check note ownership (user_id phải khớp với owner)
5. Check note chưa được share với recipient này
6. Decrypt note bằng owner's encryption key:
   - Decrypt title và content
7. Encrypt lại bằng recipient's encryption key:
   - Generate new nonce cho title và content
   - Encrypt title và content bằng AES-256-GCM với recipient's key
8. Tạo bản copy note trong database:
   - user_id = recipient_id
   - is_shared = TRUE
   - original_note_id = original_note_id
   - Encrypted data với recipient's key
9. Tạo record trong shared_notes table
10. Trả về shared_note_id

### Update Shared Note (nếu permission = write)
1. Verify JWT token (recipient)
2. Check note ownership (user_id = recipient_id) và is_shared = TRUE
3. Check permission = 'write'
4. Validate input (title, content)
5. Encrypt bằng recipient's key
6. Update note trong database (chỉ update shared copy)

### Unshare Note
1. Verify JWT token (owner)
2. Check note ownership
3. Tìm shared_note record
4. Xóa shared note copy (shared_note_id)
5. Xóa shared_note record
6. Trả về success

### Đổi Mật Khẩu
1. Verify JWT token
2. Validate input (current_password, new_password)
3. Verify current password
4. Hash new password bằng Bcrypt
5. Update hashed_password trong database
6. Invalidate tất cả refresh tokens (force re-login)
7. Trả về success

### Cập Nhật Profile
1. Verify JWT token
2. Validate input (username, email)
3. Check username/email đã tồn tại (nếu thay đổi)
4. Update user info
5. Trả về updated user info

## Security Considerations

### Share Note Security
- **Encryption**: Mỗi user chỉ có thể decrypt notes của chính họ
  - Khi share, note được decrypt bằng owner's key và encrypt lại bằng recipient's key
  - Mỗi user có encryption key riêng, không thể truy cập key của user khác
- **Permission Control**: 
  - Read-only: recipient chỉ xem được, không thể edit
  - Write: recipient có thể edit (chỉ edit bản copy, không ảnh hưởng original)
  - Owner luôn có full control
- **Validation**:
  - Chỉ owner mới có thể share/unshare
  - Không thể share với chính mình
  - Validate recipient tồn tại
  - Check note ownership trước khi share
- **Privacy**:
  - User search chỉ trả về username (không trả về email, id)
  - Không expose encryption keys
  - Recipient không thể xem owner's other notes
- **Data Isolation**:
  - Shared note copy được lưu riêng với user_id = recipient
  - Original note và shared copy độc lập về encryption
  - Unshare sẽ xóa shared copy, không ảnh hưởng original

## Cấu Hình

### Environment Variables
```env
SECRET_KEY=<random-secret-for-jwt>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MASTER_KEY=<master-key-for-encrypting-user-keys>
DATABASE_URL=sqlite:///./secure_notes.db
CORS_ORIGINS=http://localhost:3000,*
```

## Dependencies (requirements.txt)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4          # Bcrypt cho password hashing
python-multipart==0.0.6
cryptography==41.0.7            # AES-256 encryption
slowapi==0.1.9
bcrypt==4.1.2                    # Bcrypt library (có thể dùng trực tiếp thay vì passlib)
# Swagger/OpenAPI được tích hợp sẵn trong FastAPI, không cần thêm package
```

## Testing Plan
- **Swagger UI Testing**: Test tất cả endpoints trực tiếp từ browser
  - Test authentication flow (register, login)
  - Test protected endpoints với JWT token
  - Verify encryption/decryption hoạt động đúng
  - Test categories, tags, favorites, trash, search, share
- Unit tests cho security functions
- Integration tests cho API endpoints
- Security tests: 
  - SQL injection, XSS, brute force
  - Share note security (permission control)
  - Encryption key isolation giữa users
- Performance tests: rate limiting, search với nhiều notes

## Deployment Considerations
- Sử dụng HTTPS trong production
- Secure storage cho SECRET_KEY và MASTER_KEY
- Database backup strategy
- Logging và monitoring
- Error handling (không expose sensitive info)

