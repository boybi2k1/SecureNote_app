## 2.2 Đặc tả Use Case

### Use Case UC1: Đăng nhập

**Mô tả:** Người dùng đăng nhập vào hệ thống với xác thực hai yếu tố (2FA) hoặc bằng sinh trắc học.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã có tài khoản và đã thiết lập 2FA

**Luồng sự kiện chính - Đăng nhập với 2FA:**
1. Người dùng chọn "Đăng nhập"
2. Hệ thống hiển thị form đăng nhập
3. Người dùng nhập username/email và mật khẩu
4. Hệ thống xác thực thông tin đăng nhập
5. Hệ thống kiểm tra 2FA đã được bật
6. Hệ thống yêu cầu mã 2FA
7. Người dùng nhập mã 2FA từ ứng dụng authenticator
8. Hệ thống xác thực mã 2FA
9. Hệ thống tạo JWT access token và refresh token
10. Hệ thống lưu refresh token vào database
11. Hệ thống chuyển người dùng đến trang chủ

**Luồng sự kiện chính - Đăng nhập bằng sinh trắc học:**
1. Người dùng chọn "Đăng nhập bằng vân tay/Face ID"
2. Hệ thống yêu cầu xác thực sinh trắc học
3. Người dùng xác thực bằng vân tay/Face ID
4. Hệ thống lấy backup code đã lưu từ secure storage
5. Hệ thống gửi backup code kèm username đến server
6. Hệ thống xác thực backup code
7. Hệ thống tạo JWT tokens
8. Hệ thống chuyển người dùng đến trang chủ

**Luồng sự kiện thay thế:**
- 4a. Thông tin đăng nhập sai: Hệ thống thông báo lỗi, yêu cầu nhập lại
- 5a. 2FA chưa được bật: Hệ thống yêu cầu thiết lập 2FA trước
- 8a. Mã 2FA sai: Hệ thống thông báo lỗi, cho phép nhập lại hoặc sử dụng backup code
- 8b. Người dùng sử dụng backup code: Hệ thống xác thực và xóa backup code đã dùng
- 3a. Xác thực sinh trắc học thất bại: Hệ thống thông báo lỗi, yêu cầu thử lại
- 6a. Backup code không hợp lệ: Hệ thống thông báo lỗi, yêu cầu đăng nhập lại

**Điều kiện sau:** Người dùng đã đăng nhập, có quyền truy cập hệ thống

---

### Use Case UC2: Đăng ký

**Mô tả:** Người dùng mới đăng ký tài khoản trong hệ thống.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng chưa có tài khoản

**Luồng sự kiện chính:**
1. Người dùng chọn "Đăng ký"
2. Hệ thống hiển thị form đăng ký
3. Người dùng nhập thông tin:
   - Tên đăng nhập (username)
   - Email
   - Mật khẩu
   - Xác nhận mật khẩu
4. Hệ thống kiểm tra tính hợp lệ:
   - Username chưa tồn tại
   - Email chưa được sử dụng
   - Mật khẩu đáp ứng yêu cầu
5. Hệ thống hash mật khẩu bằng bcrypt
6. Hệ thống tạo khóa mã hóa AES-256 cho người dùng
7. Hệ thống mã hóa khóa người dùng bằng master key
8. Hệ thống tạo tài khoản mới
9. Hệ thống thông báo đăng ký thành công

**Luồng sự kiện thay thế:**
- 4a. Username đã tồn tại: Hệ thống thông báo lỗi, yêu cầu chọn username khác
- 4b. Email đã được sử dụng: Hệ thống thông báo lỗi, yêu cầu sử dụng email khác
- 4c. Mật khẩu không đáp ứng yêu cầu: Hệ thống thông báo yêu cầu mật khẩu

**Điều kiện sau:** Người dùng đã có tài khoản, cần thiết lập 2FA để sử dụng

---

### Use Case UC3: Tìm kiếm ghi chú

**Mô tả:** Người dùng tìm kiếm ghi chú theo từ khóa.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập

**Luồng sự kiện chính:**
1. Người dùng nhập từ khóa vào ô tìm kiếm
2. Hệ thống lấy danh sách ghi chú của người dùng
3. Hệ thống giải mã tiêu đề và nội dung của từng ghi chú
4. Hệ thống tìm kiếm từ khóa trong tiêu đề và nội dung đã giải mã
5. Hệ thống hiển thị kết quả tìm kiếm

**Luồng sự kiện thay thế:**
- 1a. Từ khóa rỗng: Hệ thống hiển thị tất cả ghi chú
- 3a. Lỗi giải mã: Hệ thống bỏ qua ghi chú đó

**Điều kiện sau:** Người dùng đã xem kết quả tìm kiếm

---

### Use Case UC4: Xem danh sách ghi chú

**Mô tả:** Người dùng xem danh sách tất cả ghi chú của mình.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập

**Luồng sự kiện chính:**
1. Người dùng truy cập trang chủ
2. Hệ thống lấy danh sách ghi chú của người dùng từ database
3. Hệ thống lấy khóa mã hóa của người dùng
4. Hệ thống giải mã tiêu đề của từng ghi chú
5. Hệ thống hiển thị danh sách ghi chú với tiêu đề đã giải mã
6. Người dùng có thể lọc theo phân loại, thẻ, yêu thích
7. Người dùng có thể tìm kiếm trong danh sách

**Luồng sự kiện thay thế:**
- 4a. Lỗi giải mã: Hệ thống bỏ qua ghi chú đó, hiển thị cảnh báo

**Điều kiện sau:** Người dùng đã xem danh sách ghi chú

---

### Use Case UC5: Đăng xuất

**Mô tả:** Người dùng đăng xuất khỏi hệ thống.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập

**Luồng sự kiện chính:**
1. Người dùng chọn "Đăng xuất"
2. Hệ thống xóa tất cả refresh token của người dùng
3. Hệ thống xóa access token khỏi client
4. Hệ thống chuyển người dùng đến trang đăng nhập

**Điều kiện sau:** Người dùng đã đăng xuất, không còn quyền truy cập

---

### Use Case UC6: Tạo ghi chú mới

**Mô tả:** Người dùng tạo một ghi chú mới với nội dung được mã hóa. Có thể tạo từ văn bản hoặc từ ảnh (OCR).

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập

**Luồng sự kiện chính:**
1. Người dùng chọn "Tạo ghi chú mới"
2. Hệ thống hiển thị form tạo ghi chú
3. Người dùng có thể:
   - Nhập tiêu đề và nội dung trực tiếp, hoặc
   - Chọn ảnh để trích xuất văn bản bằng OCR
4. Nếu chọn OCR:
   - Người dùng chọn ảnh từ thiết bị
   - Hệ thống kiểm tra định dạng và kích thước ảnh (tối đa 10MB)
   - Hệ thống gửi ảnh đến OCR service
   - OCR service trích xuất văn bản từ ảnh
   - Hệ thống sử dụng AI để tạo tiêu đề từ nội dung
   - Hệ thống hiển thị tiêu đề và nội dung đã trích xuất
5. Người dùng có thể chỉnh sửa tiêu đề và nội dung
6. Người dùng có thể chọn phân loại (category) và thẻ (tags)
7. Người dùng chọn "Lưu"
8. Hệ thống lấy khóa mã hóa của người dùng
9. Hệ thống mã hóa tiêu đề bằng AES-256-GCM
10. Hệ thống mã hóa nội dung bằng AES-256-GCM
11. Hệ thống lưu ghi chú đã mã hóa vào database
12. Hệ thống thông báo tạo ghi chú thành công

**Luồng sự kiện thay thế:**
- 3a. Người dùng không nhập tiêu đề: Hệ thống yêu cầu nhập tiêu đề
- 4a. Ảnh không hợp lệ: Hệ thống thông báo lỗi, yêu cầu chọn ảnh khác
- 4b. Ảnh quá lớn: Hệ thống thông báo lỗi, yêu cầu chọn ảnh nhỏ hơn
- 4c. Lỗi OCR: Hệ thống thông báo lỗi, yêu cầu thử lại
- 9a. Lỗi mã hóa: Hệ thống thông báo lỗi, yêu cầu thử lại

**Điều kiện sau:** Ghi chú mới đã được tạo và mã hóa trong database

---

### Use Case UC7: Chỉnh sửa ghi chú

**Mô tả:** Người dùng chỉnh sửa nội dung của một ghi chú đã tồn tại.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập, ghi chú tồn tại và người dùng có quyền chỉnh sửa

**Luồng sự kiện chính:**
1. Người dùng chọn ghi chú cần chỉnh sửa
2. Người dùng chọn "Chỉnh sửa"
3. Hệ thống giải mã và hiển thị nội dung hiện tại
4. Người dùng chỉnh sửa tiêu đề và/hoặc nội dung
5. Người dùng có thể thay đổi phân loại và thẻ
6. Người dùng chọn "Lưu"
7. Hệ thống mã hóa lại tiêu đề và nội dung mới
8. Hệ thống cập nhật ghi chú trong database
9. Hệ thống cập nhật thời gian chỉnh sửa
10. Hệ thống thông báo cập nhật thành công

**Luồng sự kiện thay thế:**
- 2a. Người dùng không có quyền chỉnh sửa: Hệ thống từ chối, chỉ cho phép xem
- 7a. Lỗi mã hóa: Hệ thống thông báo lỗi, yêu cầu thử lại

**Điều kiện sau:** Ghi chú đã được cập nhật với nội dung mới đã mã hóa

---

### Use Case UC8: Xóa ghi chú

**Mô tả:** Người dùng xóa một ghi chú (soft delete - chuyển vào thùng rác) hoặc xóa vĩnh viễn.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập, ghi chú tồn tại và người dùng sở hữu

**Luồng sự kiện chính - Xóa vào thùng rác:**
1. Người dùng chọn ghi chú cần xóa
2. Người dùng chọn "Xóa"
3. Hệ thống yêu cầu xác nhận
4. Người dùng xác nhận xóa
5. Hệ thống đánh dấu ghi chú là đã xóa (is_deleted = true)
6. Hệ thống lưu thời gian xóa (deleted_at)
7. Hệ thống chuyển ghi chú vào thùng rác
8. Hệ thống thông báo xóa thành công

**Luồng sự kiện chính - Xóa vĩnh viễn:**
1. Người dùng truy cập thùng rác
2. Người dùng chọn ghi chú cần xóa vĩnh viễn
3. Người dùng chọn "Xóa vĩnh viễn"
4. Hệ thống yêu cầu xác nhận (cảnh báo không thể khôi phục)
5. Người dùng xác nhận
6. Hệ thống xóa vĩnh viễn ghi chú khỏi database
7. Hệ thống xóa các bản ghi liên quan (tags, shared_notes)
8. Hệ thống thông báo xóa vĩnh viễn thành công

**Luồng sự kiện thay thế:**
- 3a. Người dùng hủy: Hệ thống không xóa, quay lại màn hình trước
- 4a. Người dùng hủy (xóa vĩnh viễn): Hệ thống không xóa, quay lại màn hình trước

**Điều kiện sau:** Ghi chú đã được chuyển vào thùng rác hoặc xóa vĩnh viễn

---

### Use Case UC9: Phân loại ghi chú (thư mục/tag)

**Mô tả:** Người dùng tổ chức ghi chú bằng cách sử dụng phân loại (category) và thẻ (tag).

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập

**Luồng sự kiện chính:**
1. Người dùng tạo phân loại hoặc thẻ mới
2. Người dùng gắn phân loại/thẻ vào ghi chú khi tạo hoặc chỉnh sửa
3. Hệ thống lưu thông tin phân loại/thẻ vào database
4. Người dùng có thể lọc ghi chú theo phân loại hoặc thẻ
5. Người dùng có thể quản lý (chỉnh sửa, xóa) phân loại và thẻ

**Điều kiện sau:** Ghi chú đã được tổ chức bằng phân loại và thẻ

---

### Use Case UC10: Mã hóa/giải mã ghi chú

**Mô tả:** Hệ thống tự động mã hóa và giải mã ghi chú để đảm bảo bảo mật.

**Actor:** Hệ thống (tự động)

**Điều kiện tiên quyết:** Người dùng đã đăng nhập, có khóa mã hóa

**Luồng sự kiện chính:**
1. Khi tạo/chỉnh sửa ghi chú:
   - Hệ thống lấy khóa mã hóa của người dùng
   - Hệ thống mã hóa tiêu đề và nội dung bằng AES-256-GCM
   - Hệ thống lưu dữ liệu đã mã hóa vào database
2. Khi xem ghi chú:
   - Hệ thống lấy khóa mã hóa của người dùng
   - Hệ thống giải mã tiêu đề và nội dung
   - Hệ thống hiển thị dữ liệu đã giải mã cho người dùng

**Luồng sự kiện thay thế:**
- 1a. Lỗi mã hóa: Hệ thống thông báo lỗi, không lưu ghi chú
- 2a. Lỗi giải mã: Hệ thống thông báo lỗi, không thể hiển thị ghi chú

**Điều kiện sau:** Ghi chú đã được mã hóa khi lưu và giải mã khi hiển thị

---

### Use Case UC11: Sao lưu và khôi phục

**Mô tả:** Người dùng sao lưu dữ liệu ghi chú và khôi phục khi cần thiết. Có thể khôi phục ghi chú từ thùng rác.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập

**Luồng sự kiện chính - Sao lưu:**
1. Người dùng chọn "Sao lưu dữ liệu"
2. Hệ thống lấy tất cả ghi chú của người dùng
3. Hệ thống giải mã dữ liệu bằng khóa của người dùng
4. Hệ thống tạo file sao lưu (JSON hoặc định dạng khác)
5. Hệ thống mã hóa file sao lưu
6. Người dùng tải file sao lưu về thiết bị
7. Hệ thống lưu thông tin sao lưu vào database

**Luồng sự kiện chính - Khôi phục từ file:**
1. Người dùng chọn "Khôi phục dữ liệu"
2. Người dùng chọn file sao lưu từ thiết bị
3. Hệ thống giải mã file sao lưu
4. Hệ thống kiểm tra tính hợp lệ của file
5. Hệ thống mã hóa lại dữ liệu bằng khóa hiện tại của người dùng
6. Hệ thống khôi phục ghi chú vào database
7. Hệ thống thông báo khôi phục thành công

**Luồng sự kiện chính - Khôi phục từ thùng rác:**
1. Người dùng truy cập thùng rác
2. Người dùng chọn ghi chú cần khôi phục
3. Người dùng chọn "Khôi phục"
4. Hệ thống đánh dấu ghi chú là chưa xóa (is_deleted = false)
5. Hệ thống xóa thời gian xóa (deleted_at = null)
6. Hệ thống chuyển ghi chú về danh sách chính
7. Hệ thống thông báo khôi phục thành công

**Luồng sự kiện thay thế:**
- 3a. Lỗi giải mã file sao lưu: Hệ thống thông báo lỗi, file không hợp lệ
- 4a. File sao lưu không hợp lệ: Hệ thống thông báo lỗi, yêu cầu chọn file khác
- 5a. Lỗi mã hóa: Hệ thống thông báo lỗi, không thể khôi phục

**Điều kiện sau:** Dữ liệu đã được sao lưu hoặc khôi phục thành công

---

### Use Case UC12: Chỉnh sửa thông tin cá nhân

**Mô tả:** Người dùng cập nhật thông tin cá nhân (username, email), đổi mật khẩu và cài đặt bảo mật.

**Actor:** Người dùng

**Điều kiện tiên quyết:** Người dùng đã đăng nhập

**Luồng sự kiện chính - Cập nhật thông tin:**
1. Người dùng truy cập màn hình "Hồ sơ"
2. Người dùng chọn "Chỉnh sửa"
3. Người dùng cập nhật thông tin (username, email)
4. Hệ thống kiểm tra tính hợp lệ (username/email chưa được sử dụng)
5. Hệ thống cập nhật thông tin trong database
6. Hệ thống thông báo cập nhật thành công

**Luồng sự kiện chính - Đổi mật khẩu:**
1. Người dùng truy cập màn hình "Cài đặt bảo mật"
2. Người dùng chọn "Đổi mật khẩu"
3. Người dùng nhập mật khẩu hiện tại
4. Người dùng nhập mật khẩu mới
5. Người dùng xác nhận mật khẩu mới
6. Hệ thống xác thực mật khẩu hiện tại
7. Hệ thống kiểm tra mật khẩu mới đáp ứng yêu cầu
8. Hệ thống hash mật khẩu mới bằng bcrypt
9. Hệ thống cập nhật mật khẩu trong database
10. Hệ thống xóa tất cả refresh token (invalidate all tokens)
11. Hệ thống thông báo đổi mật khẩu thành công

**Luồng sự kiện chính - Cài đặt bảo mật:**
1. Người dùng truy cập màn hình "Cài đặt bảo mật"
2. Người dùng có thể:
   - Thiết lập/bật/tắt 2FA
   - Bật/tắt đăng nhập sinh trắc học
   - Xem backup codes
3. Người dùng chọn tùy chọn cần thay đổi
4. Hệ thống xác thực (nếu cần mật khẩu)
5. Hệ thống cập nhật cài đặt
6. Hệ thống thông báo cập nhật thành công

**Luồng sự kiện thay thế:**
- 4a. Username/email đã tồn tại: Hệ thống thông báo lỗi, yêu cầu chọn giá trị khác
- 6a. Mật khẩu hiện tại sai: Hệ thống thông báo lỗi, yêu cầu nhập lại
- 7a. Mật khẩu mới không đáp ứng yêu cầu: Hệ thống thông báo yêu cầu mật khẩu

**Điều kiện sau:** Thông tin cá nhân, mật khẩu hoặc cài đặt bảo mật đã được cập nhật

