# Hướng dẫn Reset Database

## Tình huống
Khi MASTER_KEY thay đổi, tất cả encryption keys của users cũ không thể decrypt được. Cần reset database để bắt đầu lại.

## Các bước thực hiện

### Bước 1: Dừng server
Dừng server uvicorn đang chạy (Ctrl+C trong terminal đang chạy server)

### Bước 2: Reset database
Chạy script reset database:

```bash
cd server
python reset_database.py
```

Script sẽ:
- Xóa tất cả tables trong database
- Tạo lại tất cả tables (trống)
- Cho phép bạn đăng ký users mới

### Bước 3: Khởi động lại server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Bước 4: Đăng ký users mới
Sử dụng API để đăng ký users mới. Tất cả users mới sẽ sử dụng MASTER_KEY mới từ file `.env`.

## Lưu ý quan trọng

⚠️ **WARNING**: Reset database sẽ xóa TẤT CẢ dữ liệu:
- Tất cả users
- Tất cả notes
- Tất cả categories và tags
- Tất cả shared notes

Sau khi reset, bạn cần:
1. Đăng ký lại tất cả users
2. Tạo lại tất cả notes, categories, tags

## Kiểm tra MASTER_KEY

Để kiểm tra MASTER_KEY hiện tại:

```bash
python -c "from app.config import settings; print(f'MASTER_KEY length: {len(settings.MASTER_KEY)}')"
```

MASTER_KEY phải có độ dài 44 ký tự (base64 đầy đủ).

