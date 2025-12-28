# Kịch bản trình bày - Ứng dụng Ghi chú Bảo mật

## 📋 Mở đầu (1 phút)

**Lời chào:**
- Chào thầy/cô và các bạn
- Giới thiệu nhóm 10
- Đề tài: Ứng dụng Ghi chú Bảo mật

**Tổng quan:**
- 7 cơ chế bảo mật đã triển khai
- Mã hóa end-to-end
- Xác thực đa yếu tố
- **"Hôm nay chúng em sẽ demo từng cơ chế bảo mật"**

---

## 🏗️ Kiến trúc hệ thống (30 giây)

**Nói:**
- Client (React Native) ↔ API Server (FastAPI) ↔ Database (SQLite)
- Tất cả dữ liệu mã hóa trước khi lưu
- Mỗi user có khóa mã hóa riêng

---

## 🔐 Demo 7 cơ chế bảo mật

### 1️⃣ Password Hashing + JWT (1 phút)

**Demo:**
- Mở app → Đăng ký tài khoản mới
- Mở database → Show password đã hash (bcrypt)
- Đăng nhập → Show JWT token

**Nói:**
- "Mật khẩu được hash bằng bcrypt, không lưu plaintext"
- "Sau khi đăng nhập, server trả về JWT token để xác thực"

---

### 2️⃣ AES-256-GCM Encryption (1 phút)

**Demo:**
- Tạo ghi chú mới: "Ghi chú bí mật"
- Mở database → Show ciphertext trong DB
- Mở lại app → Show plaintext (tự động giải mã)

**Nói:**
- "Trước khi lưu: plaintext"
- "Trong database: ciphertext (gAAAAABl...)"
- "Khi xem: tự động giải mã bằng key của user"

---

### 3️⃣ TOTP/2FA (1.5 phút)

**Demo:**
- Settings → Setup 2FA
- Show QR code
- Quét bằng Authenticator app
- Đăng xuất → Đăng nhập lại
- Nhập password → Nhập mã 2FA (6 số)

**Nói:**
- "Setup: Generate secret → QR code → Quét bằng Authenticator"
- "Login: Password + Mã 2FA từ Authenticator"
- "Bảo vệ với 2 yếu tố"

---

### 4️⃣ Biometric Authentication (1 phút)

**Demo:**
- Settings → Enable Biometric
- Đăng xuất → Chọn Biometric login
- Xác thực vân tay/Face ID
- Đăng nhập thành công

**Nói:**
- "Tiện lợi, nhanh chóng"
- "Backup code được mã hóa khi gửi lên server"

---

### 5️⃣ Rate Limiting (1 phút)

**Demo:**
- Đăng nhập sai password 5 lần liên tiếp
- Show response: 429 Too Many Requests

**Nói:**
- "Giới hạn: Login 5 lần/phút, Register 3 lần/giờ"
- "Chống brute force và spam"

---

### 6️⃣ Security Headers (30 giây)

**Demo:**
- Mở DevTools → Network tab
- Xem response headers

**Nói:**
- "Có các headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection"
- "Bảo vệ khỏi XSS, clickjacking, MIME sniffing"

---

### 7️⃣ Chia sẻ ghi chú (1 phút)

**Demo:**
- User A chia sẻ ghi chú với User B
- Show database: 2 bản ghi (owner + recipient)
- Mỗi bản mã hóa khác nhau

**Nói:**
- "Quy trình: Giải mã bằng key User A → Mã hóa lại bằng key User B"
- "Mỗi user chỉ giải mã được bản của mình"

---

## 📊 Tổng hợp (1 phút)

**Nói:**
- "Chúng em đã triển khai 7 cơ chế bảo mật:"
  1. Password Hashing (bcrypt)
  2. JWT Authentication
  3. AES-256-GCM Encryption
  4. TOTP/2FA
  5. Biometric Auth
  6. Rate Limiting
  7. Security Headers

**Defense in Depth:**
- 5 lớp bảo mật: Network → Auth → Authorization → Encryption → Rate Limiting
- "Nhiều lớp bảo vệ = An toàn hơn"

---

## ✅ Kết luận (30 giây)

**Nói:**
- "7 cơ chế bảo mật triển khai thành công"
- "Tuân thủ best practices và OWASP Top 10"
- "Ứng dụng thực tế, sẵn sàng demo"

---

## 🙏 Kết thúc

**Nói:**
- "Cảm ơn thầy/cô và các bạn đã lắng nghe"
- "Xin mời câu hỏi"

---

## 💡 Ghi chú khi trình bày

- **Giữ tốc độ:** Mỗi demo 1-1.5 phút
- **Nhấn mạnh:** "Mã hóa", "Bảo vệ", "An toàn"
- **Nếu lỗi demo:** Giải thích bằng code/slide
- **Tổng thời gian:** ~10-12 phút (không kể Q&A)

