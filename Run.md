# Hướng dẫn chạy Server và Client

## Chạy Server
Mở PowerShell hoặc Command Prompt và di chuyển vào thư mục Server:
```powershell
cd Server
```
Tạo virtual environment (nếu chưa có):
                    python -m venv venv
Kích hoạt virtual environment:
                    .\venv\Scripts\Activate.ps1
```
Cài đặt dependencies:
pip install -r requirements.txt
```
Tạo file .env (nếu chưa có):
- Cách 1: Tự động tạo (khuyến nghị cho development):
  ```powershell
  python create_env.py
  ```
- Cách 2: Copy từ file mẫu và chỉnh sửa:
  ```powershell
  copy env.example .env
  ```

Chạy migration 2FA (nếu database đã có dữ liệu cũ):
```powershell
python migrate_2fa.py
```

Chạy server:
cd Server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server sẽ chạy tại: `http://localhost:8000`

---

## Chạy Client (React Native - Expo)

**Bước 1:** Di chuyển vào thư mục Client:
```powershell
cd Client
```

**Bước 2:** Cài đặt dependencies (nếu chưa cài):
```powershell
npm install
```

**Bước 3:** Cấu hình API URL trong `app.config.js`:
- Nếu chạy trên Android Emulator: dùng `http://10.0.2.2:8000`
- Nếu chạy trên thiết bị thật: dùng IP máy tính của bạn (ví dụ: `http://192.168.1.100:8000`)
- Nếu chạy trên iOS Simulator: dùng `http://localhost:8000`

**Bước 4:** Chạy ứng dụng:
```powershell
npm start
```

Sau đó:
- Nhấn `a` để mở trên Android emulator
- Nhấn `i` để mở trên iOS simulator  
- Quét QR code bằng Expo Go app trên điện thoại thật

---

## Chạy Android Emulator (nếu cần)

```powershell
cd C:\Users\boybi\AppData\Local\Android\Sdk\emulator
.\emulator.exe -avd Medium_Phone_API_36.1
```

---

## Lưu ý

- Đảm bảo server đang chạy trước khi start client
- Nếu dùng Android emulator, trong `app.config.js` đổi `localhost` thành `10.0.2.2`
- Nếu dùng thiết bị thật, cần thay `localhost` bằng IP máy tính của bạn
