# BÁO CÁO MÔN HỌC  
## AN TOÀN VÀ BẢO MẬT TRONG PHÁT TRIỂN PHẦN MỀM DI ĐỘNG

**Đề tài:** Ứng dụng ghi chú bảo mật  

**Giảng viên hướng dẫn:** TS. Thái Thị Thanh Vân  

**Sinh viên thực hiện:**  
- Nguyễn Hữu Phước – CT050439  
- Trần Văn Hiệp – CT050415  
- Nguyễn Năng Minh – CT060426  

**Lớp:** L02  
**Năm:** 2025  

---

## MỤC LỤC
- Danh mục hình vẽ  
- Danh mục bảng biểu  
- Lời nói đầu  
- Lời cảm ơn  
- Chương 1. Giới thiệu đề tài  
- Chương 2. Phân tích thiết kế hệ thống  
- Chương 3. Cơ chế bảo mật  
- Chương 4. Kết quả thực nghiệm  
- Kết luận  
- Tài liệu tham khảo  

---

## DANH MỤC HÌNH VẼ
(Liệt kê danh sách hình và số trang)

---

## DANH MỤC BẢNG BIỂU
(Liệt kê danh sách bảng và số trang)

---

## LỜI NÓI ĐẦU
(Trình bày bối cảnh, lý do thực hiện đề tài, ý nghĩa thực tiễn)

---

## LỜI CẢM ƠN
(Lời cảm ơn giảng viên hướng dẫn và các cá nhân liên quan)

---

# CHƯƠNG 1. GIỚI THIỆU ĐỀ TÀI

## 1.1 Tổng quan đề tài

## 1.2 Lý do chọn đề tài

## 1.3 Mục tiêu của hệ thống

## 1.4 Yêu cầu giao diện

## 1.5 Yêu cầu hệ thống
### 1.5.1 Yêu cầu chức năng
- Đối với người dùng:
  - Quản lý tài khoản (đăng ký, đăng nhập, đăng xuất)
  - Quản lý ghi chú (tạo, xem, chỉnh sửa, xóa, tìm kiếm)
  - Quản lý công việc (todos) với các tính năng lặp lại
  - Tổ chức ghi chú (phân loại, thẻ)
  - Chia sẻ ghi chú với người dùng khác
  - Xem thống kê và báo cáo
  - Sao lưu và khôi phục dữ liệu  

### 1.5.2 Yêu cầu phi chức năng
- Hiệu năng  
- Giao diện  
- Khả năng mở rộng  
- Tính ổn định  
- Tính bảo mật  

## 1.6 Các công nghệ sử dụng
### 1.6.1 Môi trường phát triển
- Visual Studio Code  
- Git (quản lý phiên bản)

### 1.6.2 Backend
- **Python 3.x**: Ngôn ngữ lập trình chính
- **FastAPI**: Framework web hiện đại, hiệu năng cao
- **SQLAlchemy**: ORM cho quản lý cơ sở dữ liệu
- **Pydantic**: Validation và serialization dữ liệu
- **Uvicorn**: ASGI server
- **Cryptography**: Thư viện mã hóa (AES-256-GCM)
- **PyJWT**: Xử lý JWT tokens
- **Passlib/Bcrypt**: Hash mật khẩu
- **PyOTP**: Tạo và xác thực TOTP codes
- **QRCode**: Tạo QR code cho 2FA
- **SlowAPI**: Rate limiting
- **Google Generative AI**: OCR và xử lý ảnh

### 1.6.3 Frontend
- **React Native**: Framework phát triển ứng dụng di động đa nền tảng
- **Expo**: Công cụ và dịch vụ cho React Native

### 1.6.4 Cơ sở dữ liệu
- **SQLite**: Cơ sở dữ liệu quan hệ nhẹ, phù hợp cho ứng dụng di động

## 1.7 Tổng quan về an toàn và bảo mật thông tin
### 1.7.1 Khái niệm an toàn và bảo mật  
### 1.7.2 Tầm quan trọng của an toàn và bảo mật  
### 1.7.3 Các nguyên tắc bảo mật cốt lõi (CIA, Authentication, Non-repudiation)

---

# CHƯƠNG 2. PHÂN TÍCH THIẾT KẾ HỆ THỐNG

## 2.1 Biểu đồ Use Case
### 2.1.1 Biểu đồ Use Case tổng quát

## 2.2 Đặc tả Use Case
- Use Case đăng nhập  
- Use Case đăng ký  
- Use Case tìm kiếm ghi chú  
- Use Case xem danh sách ghi chú  
- Use Case đăng xuất  
- Use Case tạo ghi chú mới  
- Use Case chỉnh sửa ghi chú  
- Use Case xóa ghi chú  
- Use Case phân loại ghi chú (thư mục/tag)  
- Use Case mã hóa/giải mã ghi chú  
- Use Case sao lưu và khôi phục  
- Use Case chỉnh sửa thông tin cá nhân  

## 2.3 Biểu đồ tuần tự
- Đăng nhập  
- Đăng ký  
- Tìm kiếm ghi chú  
- Xem danh sách ghi chú  
- Tạo ghi chú mới  
- Chỉnh sửa ghi chú  
- Xóa ghi chú  
- Mã hóa/giải mã ghi chú  
- Phân loại ghi chú  
- Sao lưu dữ liệu  
- Khôi phục dữ liệu  
- Chỉnh sửa thông tin cá nhân  

## 2.4 Thiết kế cơ sở dữ liệu
### 2.4.1 Sơ đồ kết nối các bảng  
### 2.4.2 Cấu trúc bảng
- Bảng `users` (người dùng)  
- Bảng `notes` (ghi chú)  
- Bảng `categories` (phân loại/thư mục)  
- Bảng `tags` (thẻ)  
- Bảng `note_tags` (liên kết ghi chú - thẻ)  
- Bảng `todos` (công việc)  
- Bảng `todo_items` (mục công việc)  
- Bảng `todo_tags` (liên kết công việc - thẻ)  
- Bảng `shared_notes` (ghi chú được chia sẻ)  
- Bảng `refresh_tokens` (token làm mới)  

---

# CHƯƠNG 3. CƠ CHẾ BẢO MẬT

## 3.1 Cơ chế bảo mật JWT
### 3.1.1 Giới thiệu JWT  
### 3.1.2 Ưu điểm và nhược điểm  
### 3.1.3 Quy trình triển khai JWT  
### 3.1.4 Ví dụ JWT  

## 3.2 Bảo mật mã hóa AES
### 3.2.1 AES là gì  
### 3.2.2 Cách hoạt động  
### 3.2.3 Cách triển khai  

## 3.3 TOTP/2FA (Two-Factor Authentication)
### 3.3.1 Khái niệm TOTP và 2FA  
### 3.3.2 Cách hoạt động  
### 3.3.3 Quy trình triển khai TOTP  
### 3.3.4 Backup codes  

## 3.4 Hash mật khẩu
### 3.4.1 Khái niệm Hash  
### 3.4.2 Ứng dụng Hash trong bảo mật (bcrypt)  
### 3.4.3 Cách triển khai  

## 3.5 Xác thực sinh trắc học (Biometric Authentication)
### 3.5.1 Giới thiệu  
### 3.5.2 Cách hoạt động (vân tay/Face ID)  
### 3.5.3 Ưu điểm và hạn chế  
### 3.5.4 Cách tích hợp  

## 3.6 Rate Limiting (Giới hạn tần suất)
### 3.6.1 Khái niệm Rate Limiting  
### 3.6.2 Tầm quan trọng trong bảo mật  
### 3.6.3 Cách triển khai  

## 3.7 Security Headers
### 3.7.1 Giới thiệu Security Headers  
### 3.7.2 Các header bảo mật được sử dụng  
### 3.7.3 Cách triển khai  

---

# CHƯƠNG 4. KẾT QUẢ THỰC NGHIỆM

## 4.1 Một số giao diện của ứng dụng
- Giao diện đăng nhập  
- Giao diện đăng ký  
- Giao diện trang chủ (dashboard)  
- Giao diện tìm kiếm ghi chú  
- Giao diện danh sách ghi chú  
- Giao diện tạo/chỉnh sửa ghi chú  
- Giao diện xem chi tiết ghi chú  
- Giao diện quản lý công việc (todos)  
- Giao diện quản lý phân loại/thư mục  
- Giao diện chia sẻ ghi chú  
- Giao diện cài đặt bảo mật  
- Giao diện thống kê  

## 4.2 Thực nghiệm các cơ chế bảo mật
- Hash mật khẩu (bcrypt)  
- Mã hóa AES-256-GCM  
- TOTP/2FA (xác thực hai yếu tố)  
- JWT (access token và refresh token)  
- Xác thực sinh trắc học (Biometric)  
- Rate Limiting  
- Security Headers  

---

# KẾT LUẬN
(Đánh giá kết quả đạt được, hạn chế và hướng phát triển)

---

# TÀI LIỆU THAM KHẢO
(Danh sách sách, bài báo, website, tài liệu học thuật)
