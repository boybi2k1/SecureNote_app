# Tài liệu API - Secure Note System

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Xác thực (Authentication)](#xác-thực-authentication)
3. [Ghi chú (Notes)](#ghi-chú-notes)
4. [Danh mục (Categories)](#danh-mục-categories)
5. [Thẻ (Tags)](#thẻ-tags)
6. [Chia sẻ (Share)](#chia-sẻ-share)
7. [Người dùng (Users)](#người-dùng-users)
8. [Xử lý lỗi](#xử-lý-lỗi)
9. [Bảo mật](#bảo-mật)

---

## Tổng quan

### Base URL
```
http://localhost:8000
```

### Tài liệu tương tác
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

### Định dạng dữ liệu
- **Content-Type**: `application/json`
- **Response Format**: JSON

### Xác thực
Hầu hết các API yêu cầu xác thực bằng JWT Bearer Token. Thêm header sau vào request:
```
Authorization: Bearer <access_token>
```

### Rate Limiting
- **Đăng ký**: 3 requests/hour
- **Đăng nhập**: 5 requests/minute
- Các endpoint khác có thể có rate limiting tùy theo cấu hình

### Health Check
Kiểm tra trạng thái server:

**GET** `/health`

**Response:**
```json
{
  "status": "healthy"
}
```

---

## Xác thực (Authentication)

### 1. Đăng ký tài khoản

**POST** `/api/auth/register`

**Rate Limit**: 3 requests/hour

**Request Body:**
```json
{
  "username": "string",      // 3-50 ký tự
  "email": "string",          // Email hợp lệ
  "password": "string"        // Tối thiểu 8 ký tự
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Lỗi có thể xảy ra:**
- `400 Bad Request`: Username hoặc email đã tồn tại
- `429 Too Many Requests`: Vượt quá rate limit

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

---

### 2. Đăng nhập

**POST** `/api/auth/login`

**Rate Limit**: 5 requests/minute

**Request Body:**
```json
{
  "username": "string",       // Username hoặc email
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Lỗi có thể xảy ra:**
- `401 Unauthorized`: Sai username hoặc password
- `403 Forbidden`: Tài khoản bị vô hiệu hóa
- `429 Too Many Requests`: Vượt quá rate limit

**Thông tin token:**
- **Access Token**: Hết hạn sau 30 phút (mặc định)
- **Refresh Token**: Hết hạn sau 7 ngày (mặc định)

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

---

### 3. Làm mới token

**POST** `/api/auth/refresh`

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Lỗi có thể xảy ra:**
- `401 Unauthorized`: Refresh token không hợp lệ hoặc không tồn tại

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/auth/refresh" \
  -H "Authorization: Bearer <refresh_token>"
```

---

### 4. Đăng xuất

**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Lưu ý**: Endpoint này sẽ xóa tất cả refresh tokens của user, buộc phải đăng nhập lại.

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer <access_token>"
```

---

## Ghi chú (Notes)

Tất cả các endpoint notes yêu cầu xác thực.

### 1. Lấy danh sách ghi chú

**GET** `/api/notes`

**Query Parameters:**
- `category_id` (optional, integer): Lọc theo category
- `tag_ids` (optional, string): Lọc theo tags (comma-separated, ví dụ: "1,2,3")
- `favorite` (optional, boolean): Lọc theo favorite (true/false)
- `search` (optional, string): Tìm kiếm trong title và content
- `is_deleted` (optional, boolean, default: false): Lấy notes đã xóa

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "My Note",
    "content": "Note content here",
    "category_id": 1,
    "is_favorite": false,
    "is_deleted": false,
    "deleted_at": null,
    "is_shared": false,
    "original_note_id": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "tag_ids": [1, 2],
    "category": {
      "id": 1,
      "name": "Work",
      "color": "#3498db",
      "user_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "tags": [
      {
        "id": 1,
        "name": "important",
        "user_id": 1,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
]
```

**Ví dụ:**
```bash
# Lấy tất cả notes
curl -X GET "http://localhost:8000/api/notes" \
  -H "Authorization: Bearer <access_token>"

# Lọc theo category
curl -X GET "http://localhost:8000/api/notes?category_id=1" \
  -H "Authorization: Bearer <access_token>"

# Lọc theo tags
curl -X GET "http://localhost:8000/api/notes?tag_ids=1,2" \
  -H "Authorization: Bearer <access_token>"

# Tìm kiếm
curl -X GET "http://localhost:8000/api/notes?search=keyword" \
  -H "Authorization: Bearer <access_token>"

# Chỉ lấy favorite
curl -X GET "http://localhost:8000/api/notes?favorite=true" \
  -H "Authorization: Bearer <access_token>"
```

---

### 2. Lấy ghi chú theo ID

**GET** `/api/notes/{note_id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 1,
  "title": "My Note",
  "content": "Note content here",
  "category_id": 1,
  "is_favorite": false,
  "is_deleted": false,
  "deleted_at": null,
  "is_shared": false,
  "original_note_id": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "tag_ids": [1, 2],
  "category": {...},
  "tags": [...]
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note không tồn tại hoặc không thuộc về user

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/notes/1" \
  -H "Authorization: Bearer <access_token>"
```

---

### 3. Lấy notes trong thùng rác

**GET** `/api/notes/trash`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK): Tương tự như GET `/api/notes`, nhưng chỉ trả về notes có `is_deleted: true`

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/notes/trash" \
  -H "Authorization: Bearer <access_token>"
```

---

### 4. Tạo ghi chú mới

**POST** `/api/notes`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "string",          // 1-500 ký tự, bắt buộc
  "content": "string",         // Tối đa 100,000 ký tự, bắt buộc
  "category_id": 1,           // Optional, integer
  "tag_ids": [1, 2]            // Optional, array of integers
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": 1,
  "title": "My Note",
  "content": "Note content here",
  "category_id": 1,
  "is_favorite": false,
  "is_deleted": false,
  "deleted_at": null,
  "is_shared": false,
  "original_note_id": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "tag_ids": [1, 2],
  "category": {...},
  "tags": [...]
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Category hoặc tag không tồn tại
- `500 Internal Server Error`: Lỗi mã hóa

**Lưu ý**: Title và content được mã hóa bằng AES-256-GCM trước khi lưu vào database.

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/notes" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "This is encrypted content",
    "category_id": 1,
    "tag_ids": [1, 2]
  }'
```

---

### 5. Cập nhật ghi chú

**PUT** `/api/notes/{note_id}`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "string",           // Optional, 1-500 ký tự
  "content": "string",         // Optional, tối đa 100,000 ký tự
  "category_id": 1,            // Optional, integer (0 để xóa category)
  "tag_ids": [1, 2]            // Optional, array of integers
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Updated Title",
  "content": "Updated content",
  ...
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note không tồn tại hoặc đã bị xóa
- `403 Forbidden`: Note được chia sẻ nhưng không có quyền write
- `500 Internal Server Error`: Lỗi mã hóa

**Lưu ý**: 
- Chỉ cần gửi các trường muốn cập nhật
- Để xóa category, gửi `category_id: 0`
- Để xóa tất cả tags, gửi `tag_ids: []`

**Ví dụ:**
```bash
curl -X PUT "http://localhost:8000/api/notes/1" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content"
  }'
```

---

### 6. Xóa ghi chú (Soft Delete)

**DELETE** `/api/notes/{note_id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note không tồn tại

**Lưu ý**: Đây là soft delete, note sẽ được chuyển vào thùng rác (`is_deleted: true`). Để xóa vĩnh viễn, sử dụng endpoint `/api/notes/{note_id}/permanent`.

**Ví dụ:**
```bash
curl -X DELETE "http://localhost:8000/api/notes/1" \
  -H "Authorization: Bearer <access_token>"
```

---

### 7. Xóa vĩnh viễn ghi chú

**DELETE** `/api/notes/{note_id}/permanent`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note không tồn tại hoặc chưa ở trong thùng rác

**Lưu ý**: Thao tác này không thể hoàn tác. Chỉ có thể xóa notes đã ở trong thùng rác (`is_deleted: true`).

**Ví dụ:**
```bash
curl -X DELETE "http://localhost:8000/api/notes/1/permanent" \
  -H "Authorization: Bearer <access_token>"
```

---

### 8. Khôi phục ghi chú từ thùng rác

**POST** `/api/notes/{note_id}/restore`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 1,
  "title": "My Note",
  "content": "Note content here",
  "is_deleted": false,
  "deleted_at": null,
  ...
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note không tồn tại hoặc không ở trong thùng rác

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/notes/1/restore" \
  -H "Authorization: Bearer <access_token>"
```

---

### 9. Bật/tắt favorite

**POST** `/api/notes/{note_id}/favorite`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "is_favorite": true
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note không tồn tại hoặc đã bị xóa

**Lưu ý**: Endpoint này toggle trạng thái favorite (nếu đang false thì thành true, và ngược lại).

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/notes/1/favorite" \
  -H "Authorization: Bearer <access_token>"
```

---

## Danh mục (Categories)

Tất cả các endpoint categories yêu cầu xác thực.

### 1. Lấy danh sách categories

**GET** `/api/categories`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Work",
    "color": "#3498db",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/categories" \
  -H "Authorization: Bearer <access_token>"
```

---

### 2. Tạo category mới

**POST** `/api/categories`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string",           // 1-100 ký tự, bắt buộc
  "color": "#3498db"          // Hex color code (6 digits), optional, default: "#3498db"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Work",
  "color": "#3498db",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Lỗi có thể xảy ra:**
- `400 Bad Request`: Category với tên này đã tồn tại

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/categories" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work",
    "color": "#3498db"
  }'
```

---

### 3. Cập nhật category

**PUT** `/api/categories/{category_id}`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string",           // Optional, 1-100 ký tự
  "color": "#3498db"          // Optional, hex color code
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Updated Name",
  "color": "#e74c3c",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Category không tồn tại
- `400 Bad Request`: Tên category mới đã tồn tại

**Ví dụ:**
```bash
curl -X PUT "http://localhost:8000/api/categories/1" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "color": "#e74c3c"
  }'
```

---

### 4. Xóa category

**DELETE** `/api/categories/{category_id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

**Lỗi có thể xảy ra:**
- `404 Not Found`: Category không tồn tại

**Lưu ý**: Khi xóa category, tất cả notes thuộc category đó sẽ có `category_id` được set thành `null` (không bị xóa).

**Ví dụ:**
```bash
curl -X DELETE "http://localhost:8000/api/categories/1" \
  -H "Authorization: Bearer <access_token>"
```

---

## Thẻ (Tags)

Tất cả các endpoint tags yêu cầu xác thực.

### 1. Lấy danh sách tags

**GET** `/api/tags`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "important",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/tags" \
  -H "Authorization: Bearer <access_token>"
```

---

### 2. Tạo tag mới

**POST** `/api/tags`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string"            // 1-50 ký tự, bắt buộc
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": 1,
  "name": "important",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Lưu ý**: Nếu tag với tên này đã tồn tại, API sẽ trả về tag hiện có thay vì tạo mới (tránh duplicate).

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/tags" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "important"
  }'
```

---

### 3. Xóa tag

**DELETE** `/api/tags/{tag_id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

**Lỗi có thể xảy ra:**
- `404 Not Found`: Tag không tồn tại

**Lưu ý**: Khi xóa tag, tất cả quan hệ giữa tag và notes sẽ bị xóa tự động (CASCADE).

**Ví dụ:**
```bash
curl -X DELETE "http://localhost:8000/api/tags/1" \
  -H "Authorization: Bearer <access_token>"
```

---

### 4. Thêm tags vào note

**POST** `/api/tags/notes/{note_id}/tags`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tag_ids": [1, 2],          // Optional, array of integers
  "tag_id": 1                 // Optional, single integer (alternative to tag_ids)
}
```

**Response** (200 OK):
```json
{
  "message": "Tags added successfully"
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note hoặc tag không tồn tại
- `400 Bad Request`: Không có tag nào được cung cấp

**Lưu ý**: Có thể dùng `tag_ids` (array) hoặc `tag_id` (single). Nếu tag đã tồn tại trong note, sẽ bị bỏ qua.

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/tags/notes/1/tags" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_ids": [1, 2]
  }'
```

---

### 5. Xóa tag khỏi note

**DELETE** `/api/tags/notes/{note_id}/tags/{tag_id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note không tồn tại

**Ví dụ:**
```bash
curl -X DELETE "http://localhost:8000/api/tags/notes/1/tags/1" \
  -H "Authorization: Bearer <access_token>"
```

---

## Chia sẻ (Share)

Tất cả các endpoint share yêu cầu xác thực.

### 1. Chia sẻ note với user khác

**POST** `/api/notes/{note_id}/share`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipient_username": "string",    // 3-50 ký tự, bắt buộc
  "permission": "read"                // "read" hoặc "write", optional, default: "read"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "original_note_id": 1,
  "shared_note_id": 2,
  "owner_id": 1,
  "recipient_id": 3,
  "permission": "read",
  "shared_at": "2024-01-01T00:00:00Z"
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note hoặc user không tồn tại
- `400 Bad Request`: 
  - Không thể chia sẻ với chính mình
  - Note đã được chia sẻ với user này rồi

**Lưu ý**: 
- Note sẽ được mã hóa lại bằng key của recipient trước khi chia sẻ
- Tags sẽ được copy sang note được chia sẻ
- Permission: `read` (chỉ đọc) hoặc `write` (đọc và chỉnh sửa)

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/api/notes/1/share" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_username": "otheruser",
    "permission": "read"
  }'
```

---

### 2. Lấy danh sách notes được chia sẻ với mình

**GET** `/api/notes/shared`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `permission` (optional, string): Lọc theo permission ("read" hoặc "write")

**Response** (200 OK):
```json
[
  {
    "id": 2,
    "user_id": 3,
    "title": "Shared Note",
    "content": "Content here",
    "is_shared": true,
    "original_note_id": 1,
    ...
  }
]
```

**Ví dụ:**
```bash
# Lấy tất cả notes được chia sẻ
curl -X GET "http://localhost:8000/api/notes/shared" \
  -H "Authorization: Bearer <access_token>"

# Chỉ lấy notes có quyền write
curl -X GET "http://localhost:8000/api/notes/shared?permission=write" \
  -H "Authorization: Bearer <access_token>"
```

---

### 3. Lấy danh sách notes mình đã chia sẻ

**GET** `/api/notes/shared-by-me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "original_note_id": 1,
    "shared_note_id": 2,
    "owner_id": 1,
    "recipient_id": 3,
    "permission": "read",
    "shared_at": "2024-01-01T00:00:00Z"
  }
]
```

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/notes/shared-by-me" \
  -H "Authorization: Bearer <access_token>"
```

---

### 4. Cập nhật quyền chia sẻ

**PUT** `/api/notes/{note_id}/share/{recipient_id}`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "permission": "write"       // "read" hoặc "write", bắt buộc
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "original_note_id": 1,
  "shared_note_id": 2,
  "owner_id": 1,
  "recipient_id": 3,
  "permission": "write",
  "shared_at": "2024-01-01T00:00:00Z"
}
```

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note hoặc shared note không tồn tại

**Ví dụ:**
```bash
curl -X PUT "http://localhost:8000/api/notes/1/share/3" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission": "write"
  }'
```

---

### 5. Hủy chia sẻ note

**DELETE** `/api/notes/{note_id}/share/{recipient_id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

**Lỗi có thể xảy ra:**
- `404 Not Found`: Note hoặc shared note không tồn tại

**Lưu ý**: 
- Note copy của recipient sẽ bị xóa
- Nếu không còn ai được chia sẻ, `is_shared` của note gốc sẽ được set thành `false`

**Ví dụ:**
```bash
curl -X DELETE "http://localhost:8000/api/notes/1/share/3" \
  -H "Authorization: Bearer <access_token>"
```

---

## Người dùng (Users)

Tất cả các endpoint users yêu cầu xác thực.

### 1. Lấy thông tin user hiện tại

**GET** `/api/users/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/users/me" \
  -H "Authorization: Bearer <access_token>"
```

---

### 2. Cập nhật thông tin user

**PUT** `/api/users/me`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string",       // Optional, 3-50 ký tự
  "email": "string"           // Optional, email hợp lệ
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "newusername",
  "email": "newemail@example.com",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Lỗi có thể xảy ra:**
- `400 Bad Request`: Username hoặc email đã được sử dụng

**Ví dụ:**
```bash
curl -X PUT "http://localhost:8000/api/users/me" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "email": "newemail@example.com"
  }'
```

---

### 3. Đổi mật khẩu

**PUT** `/api/users/me/password`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "string",    // Bắt buộc
  "new_password": "string"         // Bắt buộc, tối thiểu 8 ký tự
}
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Lỗi có thể xảy ra:**
- `400 Bad Request`: Mật khẩu hiện tại không đúng

**Lưu ý**: Sau khi đổi mật khẩu, tất cả refresh tokens sẽ bị xóa, buộc phải đăng nhập lại.

**Ví dụ:**
```bash
curl -X PUT "http://localhost:8000/api/users/me/password" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "oldpass123",
    "new_password": "newpass123"
  }'
```

---

### 4. Lấy cài đặt user

**GET** `/api/users/me/settings`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "auto_lock_enabled": false,
  "session_timeout_minutes": 30,
  "theme": "light"
}
```

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/users/me/settings" \
  -H "Authorization: Bearer <access_token>"
```

---

### 5. Cập nhật cài đặt user

**PUT** `/api/users/me/settings`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "auto_lock_enabled": false,
  "session_timeout_minutes": 30,
  "theme": "light"
}
```

**Response** (200 OK):
```json
{
  "auto_lock_enabled": true,
  "session_timeout_minutes": 60,
  "theme": "dark"
}
```

**Lưu ý**: Hiện tại settings chỉ được trả về, chưa được lưu vào database (có thể implement sau).

**Ví dụ:**
```bash
curl -X PUT "http://localhost:8000/api/users/me/settings" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_lock_enabled": true,
    "session_timeout_minutes": 60,
    "theme": "dark"
  }'
```

---

### 6. Tìm kiếm users (để chia sẻ)

**GET** `/api/users/search`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `q` (required, string): Từ khóa tìm kiếm (tối thiểu 3 ký tự)

**Response** (200 OK):
```json
[
  {
    "username": "user1"
  },
  {
    "username": "user2"
  }
]
```

**Lưu ý**: 
- Chỉ tìm kiếm theo username
- Tối đa 10 kết quả
- Không bao gồm chính user hiện tại
- Chỉ trả về users đang active

**Ví dụ:**
```bash
curl -X GET "http://localhost:8000/api/users/search?q=test" \
  -H "Authorization: Bearer <access_token>"
```

---

## Xử lý lỗi

### Mã trạng thái HTTP

- **200 OK**: Request thành công
- **201 Created**: Tạo resource thành công
- **204 No Content**: Xóa thành công (không có response body)
- **400 Bad Request**: Dữ liệu request không hợp lệ
- **401 Unauthorized**: Chưa xác thực hoặc token không hợp lệ
- **403 Forbidden**: Không có quyền truy cập
- **404 Not Found**: Resource không tồn tại
- **429 Too Many Requests**: Vượt quá rate limit
- **500 Internal Server Error**: Lỗi server

### Định dạng lỗi

Tất cả lỗi trả về theo format:

```json
{
  "detail": "Error message here"
}
```

**Ví dụ:**
```json
{
  "detail": "Note not found"
}
```

### Các lỗi thường gặp

1. **401 Unauthorized**
   - Token hết hạn: Làm mới token bằng `/api/auth/refresh`
   - Token không hợp lệ: Đăng nhập lại để lấy token mới

2. **404 Not Found**
   - Kiểm tra ID có đúng không
   - Kiểm tra resource có thuộc về user hiện tại không

3. **400 Bad Request**
   - Kiểm tra format dữ liệu (JSON)
   - Kiểm tra validation rules (min/max length, pattern, etc.)

4. **429 Too Many Requests**
   - Đợi một lúc rồi thử lại
   - Giảm tần suất request

---

## Bảo mật

### Mã hóa

1. **Mật khẩu**: Được hash bằng bcrypt trước khi lưu vào database
2. **Notes**: Title và content được mã hóa bằng AES-256-GCM
3. **User Keys**: Mỗi user có một encryption key riêng, được mã hóa bằng master key

### JWT Tokens

- **Access Token**: Hết hạn sau 30 phút (mặc định)
- **Refresh Token**: Hết hạn sau 7 ngày (mặc định)
- **Algorithm**: HS256

### Rate Limiting

- Đăng ký: 3 requests/hour
- Đăng nhập: 5 requests/minute
- Các endpoint khác có thể có rate limiting tùy cấu hình

### Security Headers

Server tự động thêm các security headers:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (nếu dùng HTTPS)

### CORS

CORS được cấu hình để cho phép các origins được chỉ định trong `CORS_ORIGINS` (mặc định: `http://localhost:3000,*`).

### Best Practices

1. **Luôn sử dụng HTTPS trong production**
2. **Lưu trữ tokens an toàn** (không lưu trong localStorage nếu có XSS risk)
3. **Refresh token thường xuyên** để giảm rủi ro
4. **Không log sensitive data** (passwords, tokens, encryption keys)
5. **Validate input** ở cả client và server
6. **Sử dụng strong passwords** (tối thiểu 8 ký tự, khuyến nghị phức tạp hơn)

---

## Ví dụ workflow hoàn chỉnh

### 1. Đăng ký và tạo note

```bash
# 1. Đăng ký
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "securepass123"
  }'

# 2. Đăng nhập
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "securepass123"
  }'
# Lưu access_token từ response

# 3. Tạo category
curl -X POST "http://localhost:8000/api/categories" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work",
    "color": "#3498db"
  }'

# 4. Tạo tag
curl -X POST "http://localhost:8000/api/tags" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "important"
  }'

# 5. Tạo note
curl -X POST "http://localhost:8000/api/notes" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "This is my first encrypted note!",
    "category_id": 1,
    "tag_ids": [1]
  }'
```

### 2. Chia sẻ note

```bash
# 1. Tìm user để chia sẻ
curl -X GET "http://localhost:8000/api/users/search?q=other" \
  -H "Authorization: Bearer <access_token>"

# 2. Chia sẻ note
curl -X POST "http://localhost:8000/api/notes/1/share" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_username": "otheruser",
    "permission": "read"
  }'
```

### 3. Quản lý notes

```bash
# 1. Lấy tất cả notes
curl -X GET "http://localhost:8000/api/notes" \
  -H "Authorization: Bearer <access_token>"

# 2. Đánh dấu favorite
curl -X POST "http://localhost:8000/api/notes/1/favorite" \
  -H "Authorization: Bearer <access_token>"

# 3. Xóa note (vào thùng rác)
curl -X DELETE "http://localhost:8000/api/notes/1" \
  -H "Authorization: Bearer <access_token>"

# 4. Khôi phục note
curl -X POST "http://localhost:8000/api/notes/1/restore" \
  -H "Authorization: Bearer <access_token>"

# 5. Xóa vĩnh viễn
curl -X DELETE "http://localhost:8000/api/notes/1/permanent" \
  -H "Authorization: Bearer <access_token>"
```

---

## Ghi chú kỹ thuật

### Database Schema

- **users**: Thông tin user, encryption keys
- **notes**: Notes được mã hóa (title_encrypted, content_encrypted)
- **categories**: Categories của user
- **tags**: Tags của user
- **note_tags**: Quan hệ many-to-many giữa notes và tags
- **shared_notes**: Quan hệ chia sẻ notes
- **refresh_tokens**: Refresh tokens để quản lý session

### Encryption Flow

1. Khi đăng ký: Tạo user encryption key (32 bytes random)
2. User key được mã hóa bằng master key và lưu vào database
3. Khi tạo note: Mã hóa title và content bằng user key (AES-256-GCM)
4. Khi đọc note: Giải mã bằng user key
5. Khi chia sẻ: Giải mã bằng owner key, mã hóa lại bằng recipient key

### Token Refresh Flow

1. Client gửi refresh token trong header Authorization
2. Server verify refresh token
3. Server tạo access token và refresh token mới
4. Server cập nhật refresh token trong database
5. Client lưu tokens mới

---

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs của server
2. Xác minh token còn hợp lệ
3. Kiểm tra format request body
4. Tham khảo Swagger UI tại `/docs` để test trực tiếp

---

**Phiên bản**: 1.0.0  
**Cập nhật lần cuối**: 2024








