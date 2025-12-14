# Hướng dẫn sửa lỗi Backend Routing

## Vấn đề

Endpoint `/api/notes/shared` trả về lỗi 422 vì backend đang match route `/notes/{note_id}` trước `/notes/shared`, khiến "shared" bị hiểu là `note_id` và cố parse thành integer.

## Nguyên nhân

Trong FastAPI, thứ tự định nghĩa route rất quan trọng. Route có tham số (`{note_id}`) đang được định nghĩa trước route cụ thể (`shared`), nên FastAPI match route có tham số trước.

## Cách sửa

### Bước 1: Tìm file định nghĩa routes

Tìm file chứa các route notes, thường là:
- `routes/notes.py`
- `api/routes/notes.py`
- `app/routers/notes.py`
- hoặc file tương tự

### Bước 2: Sắp xếp lại thứ tự routes

**QUAN TRỌNG**: Định nghĩa các route cụ thể TRƯỚC route có tham số.

#### ❌ SAI (thứ tự hiện tại):
```python
@router.get("/notes/{note_id}")
async def get_note(note_id: int):
    ...

@router.get("/notes/shared")  # Route này không bao giờ được match!
async def get_shared_notes():
    ...

@router.get("/notes/trash")
async def get_trash_notes():
    ...
```

#### ✅ ĐÚNG (thứ tự cần sửa):
```python
# 1. Định nghĩa các route cụ thể TRƯỚC
@router.get("/notes/shared")
async def get_shared_notes():
    ...

@router.get("/notes/shared-by-me")
async def get_shared_by_me():
    ...

@router.get("/notes/trash")
async def get_trash_notes():
    ...

# 2. Định nghĩa route có tham số SAU CÙNG
@router.get("/notes/{note_id}")
async def get_note(note_id: int):
    ...
```

### Bước 3: Kiểm tra tất cả routes

Đảm bảo TẤT CẢ các route cụ thể đều được định nghĩa trước route có tham số:
- `/notes/shared` ✅
- `/notes/shared-by-me` ✅
- `/notes/trash` ✅
- `/notes/{note_id}/share` ✅ (có tham số nhưng có path phụ)
- `/notes/{note_id}` ❌ (phải ở cuối)

### Bước 4: Test lại

Sau khi sửa, test lại:
```bash
curl -X GET "http://localhost:8000/api/notes/shared" \
  -H "Authorization: Bearer <token>"
```

Kết quả mong đợi: `200 OK` thay vì `422 Unprocessable Entity`

## Lưu ý

- FastAPI match routes theo thứ tự từ trên xuống dưới
- Route cụ thể phải được định nghĩa trước route có tham số
- Route có tham số nên được đặt ở cuối cùng
- Sau khi sửa, restart server để áp dụng thay đổi

## Ví dụ đầy đủ

```python
from fastapi import APIRouter, Depends
from typing import List

router = APIRouter(prefix="/notes", tags=["notes"])

# ✅ Các route cụ thể - ĐỊNH NGHĨA TRƯỚC
@router.get("/shared")
async def get_shared_notes():
    """Lấy danh sách notes được chia sẻ"""
    ...

@router.get("/shared-by-me")
async def get_shared_by_me():
    """Lấy danh sách notes mình đã chia sẻ"""
    ...

@router.get("/trash")
async def get_trash_notes():
    """Lấy danh sách notes đã xóa"""
    ...

# ✅ Route có path phụ - vẫn OK vì có thêm path sau {note_id}
@router.post("/{note_id}/share")
async def share_note(note_id: int):
    ...

@router.post("/{note_id}/favorite")
async def toggle_favorite(note_id: int):
    ...

@router.post("/{note_id}/restore")
async def restore_note(note_id: int):
    ...

# ❌ Route có tham số - PHẢI Ở CUỐI CÙNG
@router.get("/{note_id}")
async def get_note(note_id: int):
    """Lấy note theo ID"""
    ...

@router.put("/{note_id}")
async def update_note(note_id: int):
    ...

@router.delete("/{note_id}")
async def delete_note(note_id: int):
    ...
```



