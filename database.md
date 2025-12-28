# CẤU TRÚC CƠ SỞ DỮ LIỆU

<style>
.db-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 14px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 8px;
    overflow: hidden;
}

.db-table thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.db-table thead th {
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.5px;
}

.db-table tbody tr {
    border-bottom: 1px solid #e0e0e0;
    transition: background-color 0.2s;
}

.db-table tbody tr:nth-child(even) {
    background-color: #f8f9fa;
}

.db-table tbody tr:hover {
    background-color: #e3f2fd;
}

.db-table tbody tr:last-child {
    border-bottom: none;
}

.db-table td {
    padding: 12px 15px;
    vertical-align: top;
}

.db-table td:nth-child(1) {
    text-align: center;
    font-weight: 600;
    color: #667eea;
    width: 50px;
}

.db-table td:nth-child(2) {
    font-weight: 600;
    color: #2c3e50;
    font-family: 'Courier New', monospace;
}

.db-table td:nth-child(3) {
    color: #e74c3c;
    font-family: 'Courier New', monospace;
    font-weight: 500;
}

.db-table td:nth-child(4) {
    color: #34495e;
    line-height: 1.6;
}

.db-table .pk {
    background-color: #fff3cd;
    font-weight: 600;
}

.db-table .fk {
    background-color: #d1ecf1;
}

.db-table .unique {
    background-color: #d4edda;
}

.db-table .nullable {
    color: #6c757d;
    font-style: italic;
}

.table-caption {
    text-align: center;
    font-weight: 600;
    color: #667eea;
    margin-top: 10px;
    margin-bottom: 30px;
    font-size: 14px;
}

.table-description {
    color: #555;
    margin-bottom: 15px;
    line-height: 1.6;
    font-size: 15px;
}
</style>

## 2.2.2 Cấu trúc bảng

### 2.2.2.1 Bảng `users` (Người dùng)

<p class="table-description">Bảng này lưu trữ thông tin người dùng và các cài đặt bảo mật.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của người dùng (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="unique">
<td>2</td>
<td>username</td>
<td>VARCHAR(50)</td>
<td>Tên đăng nhập (UNIQUE, NOT NULL, INDEX)</td>
</tr>
<tr class="unique">
<td>3</td>
<td>email</td>
<td>VARCHAR(100)</td>
<td>Email (UNIQUE, NOT NULL, INDEX)</td>
</tr>
<tr>
<td>4</td>
<td>hashed_password</td>
<td>TEXT</td>
<td>Mật khẩu đã hash bằng bcrypt (NOT NULL)</td>
</tr>
<tr>
<td>5</td>
<td>encryption_key_encrypted</td>
<td>TEXT</td>
<td>Khóa mã hóa AES của người dùng, được mã hóa bằng master key (NOT NULL)</td>
</tr>
<tr class="nullable">
<td>6</td>
<td>two_factor_secret</td>
<td>VARCHAR(32)</td>
<td>Secret key cho TOTP/2FA (base32, NULL)</td>
</tr>
<tr>
<td>7</td>
<td>two_factor_enabled</td>
<td>BOOLEAN</td>
<td>Trạng thái bật/tắt 2FA (DEFAULT FALSE, INDEX)</td>
</tr>
<tr class="nullable">
<td>8</td>
<td>two_factor_backup_codes</td>
<td>TEXT</td>
<td>Backup codes đã hash bằng bcrypt (JSON array, NULL)</td>
</tr>
<tr>
<td>9</td>
<td>biometric_enabled</td>
<td>BOOLEAN</td>
<td>Trạng thái bật/tắt đăng nhập sinh trắc học (DEFAULT FALSE)</td>
</tr>
<tr>
<td>10</td>
<td>is_active</td>
<td>BOOLEAN</td>
<td>Trạng thái kích hoạt tài khoản (DEFAULT TRUE)</td>
</tr>
<tr>
<td>11</td>
<td>created_at</td>
<td>DATETIME</td>
<td>Thời gian tạo tài khoản (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.1 Bảng users</strong></p>

---

### 2.2.2.2 Bảng `notes` (Ghi chú)

<p class="table-description">Bảng này lưu trữ các ghi chú đã được mã hóa bằng AES-256-GCM.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của ghi chú (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="fk">
<td>2</td>
<td>user_id</td>
<td>INTEGER</td>
<td>ID người sở hữu ghi chú (FOREIGN KEY → users.id, NOT NULL)</td>
</tr>
<tr>
<td>3</td>
<td>title_encrypted</td>
<td>TEXT</td>
<td>Tiêu đề đã mã hóa bằng AES-256-GCM (NOT NULL)</td>
</tr>
<tr>
<td>4</td>
<td>title_nonce</td>
<td>TEXT</td>
<td>Nonce cho tiêu đề (NOT NULL)</td>
</tr>
<tr>
<td>5</td>
<td>title_tag</td>
<td>TEXT</td>
<td>Authentication tag cho tiêu đề (NOT NULL)</td>
</tr>
<tr>
<td>6</td>
<td>content_encrypted</td>
<td>TEXT</td>
<td>Nội dung đã mã hóa bằng AES-256-GCM (NOT NULL)</td>
</tr>
<tr>
<td>7</td>
<td>content_nonce</td>
<td>TEXT</td>
<td>Nonce cho nội dung (NOT NULL)</td>
</tr>
<tr>
<td>8</td>
<td>content_tag</td>
<td>TEXT</td>
<td>Authentication tag cho nội dung (NOT NULL)</td>
</tr>
<tr class="fk nullable">
<td>9</td>
<td>category_id</td>
<td>INTEGER</td>
<td>ID phân loại (FOREIGN KEY → categories.id, NULL)</td>
</tr>
<tr>
<td>10</td>
<td>is_favorite</td>
<td>BOOLEAN</td>
<td>Đánh dấu yêu thích (DEFAULT FALSE)</td>
</tr>
<tr>
<td>11</td>
<td>is_deleted</td>
<td>BOOLEAN</td>
<td>Trạng thái xóa (soft delete) (DEFAULT FALSE)</td>
</tr>
<tr class="nullable">
<td>12</td>
<td>deleted_at</td>
<td>DATETIME</td>
<td>Thời gian xóa (NULL)</td>
</tr>
<tr>
<td>13</td>
<td>is_shared</td>
<td>BOOLEAN</td>
<td>Trạng thái chia sẻ (DEFAULT FALSE)</td>
</tr>
<tr class="fk nullable">
<td>14</td>
<td>original_note_id</td>
<td>INTEGER</td>
<td>ID ghi chú gốc nếu là bản sao được chia sẻ (FOREIGN KEY → notes.id, NULL)</td>
</tr>
<tr>
<td>15</td>
<td>created_at</td>
<td>DATETIME</td>
<td>Thời gian tạo (NOT NULL, DEFAULT NOW())</td>
</tr>
<tr>
<td>16</td>
<td>updated_at</td>
<td>DATETIME</td>
<td>Thời gian cập nhật (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.2 Bảng notes</strong></p>

---

### 2.2.2.3 Bảng `categories` (Phân loại)

<p class="table-description">Bảng này lưu trữ các phân loại để tổ chức ghi chú và công việc.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của phân loại (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="fk">
<td>2</td>
<td>user_id</td>
<td>INTEGER</td>
<td>ID người sở hữu (FOREIGN KEY → users.id, NOT NULL)</td>
</tr>
<tr>
<td>3</td>
<td>name</td>
<td>TEXT</td>
<td>Tên phân loại (NOT NULL)</td>
</tr>
<tr>
<td>4</td>
<td>color</td>
<td>VARCHAR(7)</td>
<td>Màu hiển thị dạng hex (DEFAULT '#3498db')</td>
</tr>
<tr>
<td>5</td>
<td>created_at</td>
<td>DATETIME</td>
<td>Thời gian tạo (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.3 Bảng categories</strong></p>

---

### 2.2.2.4 Bảng `tags` (Thẻ)

<p class="table-description">Bảng này lưu trữ các thẻ để gắn vào ghi chú và công việc.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của thẻ (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="fk">
<td>2</td>
<td>user_id</td>
<td>INTEGER</td>
<td>ID người sở hữu (FOREIGN KEY → users.id, NOT NULL)</td>
</tr>
<tr>
<td>3</td>
<td>name</td>
<td>TEXT</td>
<td>Tên thẻ (NOT NULL)</td>
</tr>
<tr>
<td>4</td>
<td>created_at</td>
<td>DATETIME</td>
<td>Thời gian tạo (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.4 Bảng tags</strong></p>

---

### 2.2.2.5 Bảng `note_tags` (Liên kết Ghi chú - Thẻ)

<p class="table-description">Bảng trung gian để liên kết nhiều-nhiều giữa ghi chú và thẻ.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk fk">
<td>1</td>
<td>note_id</td>
<td>INTEGER</td>
<td>ID ghi chú (PRIMARY KEY, FOREIGN KEY → notes.id)</td>
</tr>
<tr class="pk fk">
<td>2</td>
<td>tag_id</td>
<td>INTEGER</td>
<td>ID thẻ (PRIMARY KEY, FOREIGN KEY → tags.id)</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.5 Bảng note_tags</strong></p>

---

### 2.2.2.6 Bảng `shared_notes` (Ghi chú được chia sẻ)

<p class="table-description">Bảng này lưu trữ thông tin về các ghi chú được chia sẻ giữa người dùng.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của bản ghi chia sẻ (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="fk">
<td>2</td>
<td>original_note_id</td>
<td>INTEGER</td>
<td>ID ghi chú gốc (FOREIGN KEY → notes.id, NOT NULL)</td>
</tr>
<tr class="fk">
<td>3</td>
<td>shared_note_id</td>
<td>INTEGER</td>
<td>ID bản sao ghi chú của người nhận (FOREIGN KEY → notes.id, NOT NULL)</td>
</tr>
<tr class="fk">
<td>4</td>
<td>owner_id</td>
<td>INTEGER</td>
<td>ID người sở hữu ghi chú gốc (FOREIGN KEY → users.id, NOT NULL)</td>
</tr>
<tr class="fk">
<td>5</td>
<td>recipient_id</td>
<td>INTEGER</td>
<td>ID người nhận ghi chú (FOREIGN KEY → users.id, NOT NULL)</td>
</tr>
<tr>
<td>6</td>
<td>permission</td>
<td>VARCHAR(10)</td>
<td>Quyền truy cập: 'read' (đọc) hoặc 'write' (đọc-ghi) (DEFAULT 'read')</td>
</tr>
<tr>
<td>7</td>
<td>shared_at</td>
<td>DATETIME</td>
<td>Thời gian chia sẻ (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.6 Bảng shared_notes</strong></p>

---

### 2.2.2.7 Bảng `refresh_tokens` (Token làm mới)

<p class="table-description">Bảng này lưu trữ các refresh token để làm mới access token.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của token (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="fk">
<td>2</td>
<td>user_id</td>
<td>INTEGER</td>
<td>ID người dùng (FOREIGN KEY → users.id, NOT NULL)</td>
</tr>
<tr class="unique">
<td>3</td>
<td>token</td>
<td>TEXT</td>
<td>Refresh token (UNIQUE, NOT NULL, INDEX)</td>
</tr>
<tr>
<td>4</td>
<td>expires_at</td>
<td>DATETIME</td>
<td>Thời gian hết hạn (NOT NULL)</td>
</tr>
<tr>
<td>5</td>
<td>created_at</td>
<td>DATETIME</td>
<td>Thời gian tạo (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.7 Bảng refresh_tokens</strong></p>

---

### 2.2.2.8 Bảng `todos` (Công việc)

<p class="table-description">Bảng này lưu trữ các công việc (todos) đã được mã hóa bằng AES-256-GCM.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của công việc (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="fk">
<td>2</td>
<td>user_id</td>
<td>INTEGER</td>
<td>ID người sở hữu (FOREIGN KEY → users.id, NOT NULL)</td>
</tr>
<tr>
<td>3</td>
<td>title_encrypted</td>
<td>TEXT</td>
<td>Tiêu đề đã mã hóa bằng AES-256-GCM (NOT NULL)</td>
</tr>
<tr>
<td>4</td>
<td>title_nonce</td>
<td>TEXT</td>
<td>Nonce cho tiêu đề (NOT NULL)</td>
</tr>
<tr>
<td>5</td>
<td>title_tag</td>
<td>TEXT</td>
<td>Authentication tag cho tiêu đề (NOT NULL)</td>
</tr>
<tr class="nullable">
<td>6</td>
<td>description_encrypted</td>
<td>TEXT</td>
<td>Mô tả đã mã hóa bằng AES-256-GCM (NULL)</td>
</tr>
<tr class="nullable">
<td>7</td>
<td>description_nonce</td>
<td>TEXT</td>
<td>Nonce cho mô tả (NULL)</td>
</tr>
<tr class="nullable">
<td>8</td>
<td>description_tag</td>
<td>TEXT</td>
<td>Authentication tag cho mô tả (NULL)</td>
</tr>
<tr>
<td>9</td>
<td>status</td>
<td>VARCHAR(20)</td>
<td>Trạng thái: 'pending', 'in_progress', 'completed' (DEFAULT 'pending')</td>
</tr>
<tr>
<td>10</td>
<td>priority</td>
<td>VARCHAR(10)</td>
<td>Độ ưu tiên: 'low', 'medium', 'high', 'urgent' (DEFAULT 'medium')</td>
</tr>
<tr class="nullable">
<td>11</td>
<td>due_date</td>
<td>DATETIME</td>
<td>Ngày đến hạn (NULL)</td>
</tr>
<tr class="nullable">
<td>12</td>
<td>reminder_at</td>
<td>DATETIME</td>
<td>Thời gian nhắc nhở (NULL)</td>
</tr>
<tr>
<td>13</td>
<td>is_completed</td>
<td>BOOLEAN</td>
<td>Trạng thái hoàn thành (DEFAULT FALSE)</td>
</tr>
<tr class="nullable">
<td>14</td>
<td>completed_at</td>
<td>DATETIME</td>
<td>Thời gian hoàn thành (NULL)</td>
</tr>
<tr class="fk nullable">
<td>15</td>
<td>category_id</td>
<td>INTEGER</td>
<td>ID phân loại (FOREIGN KEY → categories.id, NULL)</td>
</tr>
<tr>
<td>16</td>
<td>is_favorite</td>
<td>BOOLEAN</td>
<td>Đánh dấu yêu thích (DEFAULT FALSE)</td>
</tr>
<tr>
<td>17</td>
<td>is_deleted</td>
<td>BOOLEAN</td>
<td>Trạng thái xóa (soft delete) (DEFAULT FALSE)</td>
</tr>
<tr class="nullable">
<td>18</td>
<td>deleted_at</td>
<td>DATETIME</td>
<td>Thời gian xóa (NULL)</td>
</tr>
<tr>
<td>19</td>
<td>is_shared</td>
<td>BOOLEAN</td>
<td>Trạng thái chia sẻ (DEFAULT FALSE)</td>
</tr>
<tr class="fk nullable">
<td>20</td>
<td>linked_note_id</td>
<td>INTEGER</td>
<td>ID ghi chú liên kết (FOREIGN KEY → notes.id, NULL)</td>
</tr>
<tr class="nullable">
<td>21</td>
<td>recurrence_pattern</td>
<td>VARCHAR(20)</td>
<td>Mẫu lặp lại: 'daily', 'weekly', 'monthly', 'yearly', 'custom' (NULL)</td>
</tr>
<tr>
<td>22</td>
<td>recurrence_interval</td>
<td>INTEGER</td>
<td>Khoảng cách lặp lại (mỗi X ngày/tuần/tháng) (DEFAULT 1)</td>
</tr>
<tr class="nullable">
<td>23</td>
<td>recurrence_end_date</td>
<td>DATETIME</td>
<td>Ngày kết thúc lặp lại (NULL)</td>
</tr>
<tr class="nullable">
<td>24</td>
<td>recurrence_count</td>
<td>INTEGER</td>
<td>Số lần lặp lại (NULL)</td>
</tr>
<tr class="fk nullable">
<td>25</td>
<td>parent_todo_id</td>
<td>INTEGER</td>
<td>ID công việc cha (template lặp lại) (FOREIGN KEY → todos.id, NULL)</td>
</tr>
<tr class="nullable">
<td>26</td>
<td>next_occurrence_date</td>
<td>DATETIME</td>
<td>Ngày tạo lần lặp tiếp theo (NULL)</td>
</tr>
<tr>
<td>27</td>
<td>is_recurring_template</td>
<td>BOOLEAN</td>
<td>Có phải template lặp lại không (DEFAULT FALSE)</td>
</tr>
<tr>
<td>28</td>
<td>created_at</td>
<td>DATETIME</td>
<td>Thời gian tạo (NOT NULL, DEFAULT NOW())</td>
</tr>
<tr>
<td>29</td>
<td>updated_at</td>
<td>DATETIME</td>
<td>Thời gian cập nhật (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.8 Bảng todos</strong></p>

---

### 2.2.2.9 Bảng `todo_items` (Mục công việc)

<p class="table-description">Bảng này lưu trữ các mục công việc con (subtasks) trong một công việc.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk">
<td>1</td>
<td>id</td>
<td>INTEGER</td>
<td>Mã ID duy nhất của mục công việc (PRIMARY KEY, AUTO INCREMENT)</td>
</tr>
<tr class="fk">
<td>2</td>
<td>todo_id</td>
<td>INTEGER</td>
<td>ID công việc cha (FOREIGN KEY → todos.id, NOT NULL)</td>
</tr>
<tr>
<td>3</td>
<td>title_encrypted</td>
<td>TEXT</td>
<td>Tiêu đề đã mã hóa bằng AES-256-GCM (NOT NULL)</td>
</tr>
<tr>
<td>4</td>
<td>title_nonce</td>
<td>TEXT</td>
<td>Nonce cho tiêu đề (NOT NULL)</td>
</tr>
<tr>
<td>5</td>
<td>title_tag</td>
<td>TEXT</td>
<td>Authentication tag cho tiêu đề (NOT NULL)</td>
</tr>
<tr>
<td>6</td>
<td>is_completed</td>
<td>BOOLEAN</td>
<td>Trạng thái hoàn thành (DEFAULT FALSE)</td>
</tr>
<tr>
<td>7</td>
<td>order</td>
<td>INTEGER</td>
<td>Thứ tự hiển thị (DEFAULT 0)</td>
</tr>
<tr>
<td>8</td>
<td>created_at</td>
<td>DATETIME</td>
<td>Thời gian tạo (NOT NULL, DEFAULT NOW())</td>
</tr>
<tr>
<td>9</td>
<td>updated_at</td>
<td>DATETIME</td>
<td>Thời gian cập nhật (NOT NULL, DEFAULT NOW())</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.9 Bảng todo_items</strong></p>

---

### 2.2.2.10 Bảng `todo_tags` (Liên kết Công việc - Thẻ)

<p class="table-description">Bảng trung gian để liên kết nhiều-nhiều giữa công việc và thẻ.</p>

<table class="db-table">
<thead>
<tr>
<th>STT</th>
<th>Tên cột</th>
<th>Kiểu dữ liệu</th>
<th>Mô tả</th>
</tr>
</thead>
<tbody>
<tr class="pk fk">
<td>1</td>
<td>todo_id</td>
<td>INTEGER</td>
<td>ID công việc (PRIMARY KEY, FOREIGN KEY → todos.id)</td>
</tr>
<tr class="pk fk">
<td>2</td>
<td>tag_id</td>
<td>INTEGER</td>
<td>ID thẻ (PRIMARY KEY, FOREIGN KEY → tags.id)</td>
</tr>
</tbody>
</table>

<p class="table-caption"><strong>Bảng 2.10 Bảng todo_tags</strong></p>

---

## 2.2.3 Ràng buộc và Quan hệ

### Ràng buộc chính:

1. **Khóa chính (Primary Key):**
   - Tất cả các bảng đều có cột `id` làm PRIMARY KEY với AUTO INCREMENT
   - Các bảng trung gian (`note_tags`, `todo_tags`) sử dụng composite primary key

2. **Khóa ngoại (Foreign Key):**
   - `users.id` được tham chiếu bởi: `notes.user_id`, `todos.user_id`, `categories.user_id`, `tags.user_id`, `shared_notes.owner_id`, `shared_notes.recipient_id`, `refresh_tokens.user_id`
   - `notes.id` được tham chiếu bởi: `notes.original_note_id`, `shared_notes.original_note_id`, `shared_notes.shared_note_id`, `todos.linked_note_id`
   - `categories.id` được tham chiếu bởi: `notes.category_id`, `todos.category_id`
   - `tags.id` được tham chiếu bởi: `note_tags.tag_id`, `todo_tags.tag_id`
   - `todos.id` được tham chiếu bởi: `todo_items.todo_id`, `todos.parent_todo_id`, `todo_tags.todo_id`

3. **CASCADE DELETE:**
   - Khi xóa user → xóa tất cả notes, todos, categories, tags, refresh_tokens của user đó
   - Khi xóa note → xóa tất cả note_tags và shared_notes liên quan
   - Khi xóa todo → xóa tất cả todo_items và todo_tags liên quan
   - Khi xóa category hoặc tag → SET NULL cho các bản ghi liên quan (không xóa notes/todos)

4. **Ràng buộc duy nhất (UNIQUE):**
   - `users.username`: UNIQUE
   - `users.email`: UNIQUE
   - `refresh_tokens.token`: UNIQUE

5. **Index:**
   - `users.username`: INDEX
   - `users.email`: INDEX
   - `users.two_factor_enabled`: INDEX
   - `refresh_tokens.token`: INDEX
