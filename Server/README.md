# Secure Note Server

Backend API cho hệ thống Secure Note sử dụng FastAPI và SQLite.

## Cài đặt

1. Tạo virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

3. Tạo file `.env` (tùy chọn - nếu không có sẽ tự động generate cho development):
```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

4. Cập nhật các giá trị trong `.env` (QUAN TRỌNG cho production):
- `SECRET_KEY`: Random secret key cho JWT (ít nhất 32 ký tự)
  - Có thể generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `MASTER_KEY`: Master key để encrypt user keys (chính xác 32 bytes)
  - Có thể generate: `python -c "import secrets; print(secrets.token_urlsafe(32)[:32])"`
- `DATABASE_URL`: URL database (mặc định: sqlite:///./secure_notes.db)

**Lưu ý**: Nếu không tạo `.env`, server sẽ tự động generate keys cho development, nhưng KHÔNG an toàn cho production!

## Chạy server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server sẽ chạy tại: `http://localhost:8000`

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Cấu trúc

```
server/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── security.py          # Security utilities
│   ├── api/
│   │   ├── deps.py          # Dependencies
│   │   └── routes/          # API routes
│   └── middleware/         # Middleware
└── requirements.txt
```

## Security Features

- AES-256-GCM encryption cho notes
- Bcrypt password hashing
- JWT authentication
- Rate limiting
- Security headers
- CORS protection
