# Kế Hoạch Xây Dựng App Expo - Secure Notes
## Từng Bước, Từng Màn Hình

Dựa trên tài liệu API và server hiện tại, kế hoạch này chia nhỏ việc xây dựng app thành các bước cụ thể, từng màn hình một.

---

## 📋 Tổng Quan

**Mục tiêu**: Xây dựng app Expo đầy đủ chức năng quản lý secure notes
**Platform**: Android only
**Framework**: Expo SDK 50.0.0
**Thời gian ước tính**: 12-16 ngày

---

## 🎯 GIAI ĐOẠN 1: Setup & Foundation (1-2 ngày)

### Bước 1.1: Kiểm tra và cài đặt dependencies
**Thời gian**: 30 phút

- [ ] Kiểm tra `package.json` có đầy đủ dependencies
- [ ] Chạy `npm install` hoặc `yarn install`
- [ ] Kiểm tra Expo CLI: `npx expo --version`
- [ ] Kiểm tra TypeScript: `npx tsc --version`

**Dependencies cần có:**
- expo@50.0.0
- react@18.2.0, react-native@0.73.6
- @react-navigation/native@6.1.9, @react-navigation/stack@6.3.20
- axios@1.6.8
- expo-secure-store@12.8.1
- @react-native-async-storage/async-storage@1.23.1

### Bước 1.2: Cấu hình môi trường
**Thời gian**: 30 phút

- [ ] Tạo file `.env` trong `client/`:
  ```env
  API_URL=http://localhost:8000
  API_BASE_URL=http://localhost:8000/api
  ```
- [ ] Kiểm tra `app.config.js` có đọc được env variables
- [ ] Kiểm tra `utils/constants.ts` có đúng API_BASE_URL
- [ ] Test kết nối server: `curl http://localhost:8000/health`

### Bước 1.3: Kiểm tra cấu trúc thư mục
**Thời gian**: 15 phút

- [ ] Kiểm tra các thư mục đã có:
  - `src/services/` - API services
  - `src/types/` - TypeScript types
  - `src/context/` - Context providers
  - `src/screens/` - Screen components
  - `src/components/` - Reusable components
  - `src/navigation/` - Navigation setup
  - `src/utils/` - Utility functions

### Bước 1.4: Kiểm tra và hoàn thiện Types
**Thời gian**: 1 giờ

- [ ] Kiểm tra `types/auth.types.ts`:
  - [ ] User interface
  - [ ] LoginRequest, RegisterRequest
  - [ ] AuthResponse
- [ ] Kiểm tra `types/note.types.ts`:
  - [ ] Note interface (đầy đủ fields từ API)
  - [ ] CreateNoteDto, UpdateNoteDto
  - [ ] NoteFilters
- [ ] Kiểm tra `types/category.types.ts`
- [ ] Kiểm tra `types/tag.types.ts`
- [ ] Kiểm tra `types/share.types.ts`
- [ ] Kiểm tra `types/user.types.ts`
- [ ] Kiểm tra `types/api.types.ts` (ApiError, ApiResponse)

**Lưu ý**: So sánh với API documentation để đảm bảo types khớp với response từ server.

---

## 🔐 GIAI ĐOẠN 2: Authentication (1-2 ngày)

### Bước 2.1: Storage Service (Expo SecureStore)
**Thời gian**: 1 giờ
**File**: `src/services/storageService.ts`

- [ ] Implement `storeTokens(accessToken, refreshToken)`
  - [ ] Sử dụng `expo-secure-store.setItemAsync()`
  - [ ] Lưu access_token và refresh_token riêng biệt
- [ ] Implement `getTokens()`
  - [ ] Lấy tokens từ SecureStore
  - [ ] Return `{accessToken, refreshToken}` hoặc `null`
- [ ] Implement `clearTokens()`
  - [ ] Xóa tokens khỏi SecureStore
- [ ] Implement `storeUserData(user)` (AsyncStorage cho non-sensitive)
- [ ] Implement `getUserData()`
- [ ] Implement `clearUserData()`

**Test**: 
```typescript
// Test trong console hoặc test file
await storageService.storeTokens('test_access', 'test_refresh');
const tokens = await storageService.getTokens();
console.log(tokens); // Should show {accessToken: 'test_access', refreshToken: 'test_refresh'}
```

### Bước 2.2: API Service Base (Axios Configuration)
**Thời gian**: 1.5 giờ
**File**: `src/services/api.ts`

- [ ] Kiểm tra axios instance đã có baseURL đúng chưa
- [ ] Kiểm tra request interceptor:
  - [ ] Thêm Authorization header: `Bearer {access_token}`
  - [ ] Lấy token từ storageService
- [ ] Kiểm tra response interceptor:
  - [ ] Handle 401: auto refresh token
  - [ ] Queue failed requests khi đang refresh
  - [ ] Handle errors: parse `error.detail` từ server
  - [ ] Handle rate limiting (429)
- [ ] Test với Postman hoặc curl để verify

### Bước 2.3: Auth Service
**Thời gian**: 1 giờ
**File**: `src/services/authService.ts`

- [ ] Implement `login(username, password)`
  - [ ] POST `/api/auth/login`
  - [ ] Return `{access_token, refresh_token, token_type}`
  - [ ] Handle rate limiting (5 requests/minute)
- [ ] Implement `register(userData)`
  - [ ] POST `/api/auth/register`
  - [ ] Return user data
  - [ ] Handle rate limiting (3 requests/hour)
- [ ] Implement `logout()`
  - [ ] POST `/api/auth/logout` (với access token)
  - [ ] Clear tokens từ storage
- [ ] Implement `refreshAccessToken(refreshToken)`
  - [ ] POST `/api/auth/refresh` với header `Authorization: Bearer {refresh_token}`
  - [ ] Return tokens mới
- [ ] Implement `getCurrentUser()`
  - [ ] GET `/api/users/me`

**Test**: Test từng function với server thật.

### Bước 2.4: Validation Utils
**Thời gian**: 30 phút
**File**: `src/utils/validation.ts`

- [ ] Implement `validateEmail(email)`
- [ ] Implement `validatePassword(password)` - min 8, max 100
- [ ] Implement `validateUsername(username)` - 3-50 chars
- [ ] Implement `validateNoteTitle(title)` - 1-500 chars
- [ ] Implement `validateNoteContent(content)` - max 100,000 chars
- [ ] Implement `validateCategoryColor(color)` - hex format #RRGGBB

### Bước 2.5: Auth Context
**Thời gian**: 1.5 giờ
**File**: `src/context/AuthContext.tsx`

- [ ] Tạo AuthContext với:
  - [ ] `user: User | null`
  - [ ] `isAuthenticated: boolean`
  - [ ] `loading: boolean`
- [ ] Implement `login(username, password)`
  - [ ] Gọi authService.login()
  - [ ] Lưu tokens vào storage
  - [ ] Fetch user info và update state
- [ ] Implement `register(username, email, password)`
  - [ ] Gọi authService.register()
  - [ ] Auto login sau khi register
- [ ] Implement `logout()`
  - [ ] Gọi authService.logout()
  - [ ] Clear tokens và user data
  - [ ] Reset state
- [ ] Implement `checkAuth()` - auto login khi app start
  - [ ] Kiểm tra tokens trong storage
  - [ ] Nếu có token: fetch user info
  - [ ] Nếu token hết hạn: thử refresh
  - [ ] Nếu refresh fail: logout
- [ ] Export `useAuth()` hook

**Test**: Test context trong App.tsx

### Bước 2.6: Login Screen
**Thời gian**: 2 giờ
**File**: `src/screens/Auth/LoginScreen.tsx`

- [ ] Tạo form với:
  - [ ] TextInput cho username/email
  - [ ] TextInput cho password (secureTextEntry)
  - [ ] Button "Đăng nhập"
  - [ ] Link "Chưa có tài khoản? Đăng ký"
- [ ] State management:
  - [ ] `username`, `password`
  - [ ] `loading`, `error`
- [ ] Validation:
  - [ ] Validate username không rỗng
  - [ ] Validate password không rỗng
- [ ] Handle submit:
  - [ ] Gọi `login()` từ AuthContext
  - [ ] Show loading state
  - [ ] Handle errors:
    - [ ] 401: "Sai username hoặc password"
    - [ ] 403: "Tài khoản bị vô hiệu hóa"
    - [ ] 429: "Vượt quá số lần đăng nhập. Vui lòng thử lại sau."
    - [ ] 500: "Lỗi server. Vui lòng thử lại."
  - [ ] Navigate đến NotesListScreen khi thành công
- [ ] UI cơ bản (không cần đẹp, chỉ cần đủ chức năng)

**Test**: 
- [ ] Test login với user hợp lệ
- [ ] Test login với user không hợp lệ
- [ ] Test rate limiting

### Bước 2.7: Register Screen
**Thời gian**: 2 giờ
**File**: `src/screens/Auth/RegisterScreen.tsx`

- [ ] Tạo form với:
  - [ ] TextInput cho username
  - [ ] TextInput cho email
  - [ ] TextInput cho password (secureTextEntry)
  - [ ] TextInput cho confirm password (secureTextEntry)
  - [ ] Button "Đăng ký"
  - [ ] Link "Đã có tài khoản? Đăng nhập"
- [ ] State management:
  - [ ] `username`, `email`, `password`, `confirmPassword`
  - [ ] `loading`, `error`
- [ ] Validation:
  - [ ] Username: 3-50 ký tự
  - [ ] Email: đúng format
  - [ ] Password: tối thiểu 8 ký tự
  - [ ] Confirm password: khớp với password
- [ ] Handle submit:
  - [ ] Gọi `register()` từ AuthContext
  - [ ] Show loading state
  - [ ] Handle errors:
    - [ ] 400: Hiển thị `error.detail` từ server
    - [ ] 429: "Vượt quá số lần đăng ký. Vui lòng thử lại sau 1 giờ."
  - [ ] Auto login và navigate đến NotesListScreen khi thành công
- [ ] UI cơ bản

**Test**: 
- [ ] Test register với data hợp lệ
- [ ] Test register với username/email đã tồn tại
- [ ] Test validation

### Bước 2.8: Auth Navigator
**Thời gian**: 30 phút
**File**: `src/navigation/AuthNavigator.tsx`

- [ ] Tạo Stack Navigator với:
  - [ ] LoginScreen (default)
  - [ ] RegisterScreen
- [ ] Navigation options cơ bản

### Bước 2.9: App.tsx - Integration
**Thời gian**: 30 phút
**File**: `src/App.tsx`

- [ ] Kiểm tra App.tsx đã có:
  - [ ] AuthProvider wrap toàn bộ app
  - [ ] Conditional rendering: AuthNavigator hoặc AppNavigator
  - [ ] Loading state khi check auth
- [ ] Test flow:
  - [ ] App start → check auth → show Login hoặc NotesList
  - [ ] Login thành công → navigate đến NotesList
  - [ ] Logout → navigate về Login

**✅ Hoàn thành Giai đoạn 2**: Có thể đăng nhập, đăng ký, và auto login.

---

## 📝 GIAI ĐOẠN 3: Core Notes Features (3-4 ngày)

### Bước 3.1: Notes Service
**Thời gian**: 2 giờ
**File**: `src/services/notesService.ts`

- [ ] Implement `getNotes(filters?)`
  - [ ] GET `/api/notes` với query params
  - [ ] Convert `tag_ids` array thành comma-separated string: `tag_ids.join(',')`
  - [ ] Query params: `category_id`, `tag_ids`, `favorite`, `search`, `is_deleted`
  - [ ] Return `Note[]`
- [ ] Implement `getNoteById(id)`
  - [ ] GET `/api/notes/{id}`
  - [ ] Return `Note`
- [ ] Implement `createNote(note)`
  - [ ] POST `/api/notes`
  - [ ] Body: `{title, content, category_id?, tag_ids?[]}`
  - [ ] Return `Note`
- [ ] Implement `updateNote(id, note)`
  - [ ] PUT `/api/notes/{id}`
  - [ ] Body: `{title?, content?, category_id?, tag_ids?[]}`
  - [ ] **Lưu ý**: Gửi `category_id: 0` hoặc `null` để remove category
  - [ ] Return `Note`
- [ ] Implement `deleteNote(id)`
  - [ ] DELETE `/api/notes/{id}` (soft delete)
  - [ ] Return void (204 response)
- [ ] Implement `toggleFavorite(noteId)`
  - [ ] POST `/api/notes/{id}/favorite`
  - [ ] Return `{is_favorite: boolean}`
- [ ] Implement `restoreNote(noteId)`
  - [ ] POST `/api/notes/{id}/restore`
  - [ ] Return `Note`
- [ ] Implement `permanentDeleteNote(noteId)`
  - [ ] DELETE `/api/notes/{id}/permanent`
  - [ ] Return void (204 response)
- [ ] Implement `getTrashNotes()`
  - [ ] GET `/api/notes/trash`
  - [ ] Return `Note[]`

**Test**: Test từng function với server.

### Bước 3.2: Notes Context
**Thời gian**: 2 giờ
**File**: `src/context/NotesContext.tsx`

- [ ] Tạo NotesContext với:
  - [ ] `notes: Note[]`
  - [ ] `loading: boolean`
  - [ ] `error: string | null`
- [ ] Implement `fetchNotes(filters?)`
  - [ ] Gọi notesService.getNotes()
  - [ ] Update state
  - [ ] Handle errors
- [ ] Implement `createNote(note)`
  - [ ] Gọi notesService.createNote()
  - [ ] Add note vào state
  - [ ] Return created note
- [ ] Implement `updateNote(id, note)`
  - [ ] Gọi notesService.updateNote()
  - [ ] Update note trong state
  - [ ] Return updated note
- [ ] Implement `deleteNote(id)`
  - [ ] Gọi notesService.deleteNote()
  - [ ] Remove note khỏi state (hoặc mark as deleted)
- [ ] Implement `toggleFavorite(id)`
  - [ ] Gọi notesService.toggleFavorite()
  - [ ] Update `is_favorite` trong state
- [ ] Implement `restoreNote(id)`
  - [ ] Gọi notesService.restoreNote()
  - [ ] Update note trong state
- [ ] Implement `permanentDeleteNote(id)`
  - [ ] Gọi notesService.permanentDeleteNote()
  - [ ] Remove note khỏi state
- [ ] Implement `getNoteById(id)`
  - [ ] Tìm note trong state hoặc fetch từ server
- [ ] Export `useNotes()` hook

### Bước 3.3: NoteCard Component
**Thời gian**: 1 giờ
**File**: `src/components/NoteCard.tsx`

- [ ] Tạo component hiển thị:
  - [ ] Title (truncate nếu quá dài)
  - [ ] Preview content (1-2 dòng)
  - [ ] Category badge (nếu có) với color
  - [ ] Tags (chips)
  - [ ] Favorite icon (nếu is_favorite)
  - [ ] Shared badge (nếu is_shared)
  - [ ] Last modified date
- [ ] Props: `note: Note`, `onPress: () => void`
- [ ] Style cơ bản

### Bước 3.4: NotesListScreen - Basic
**Thời gian**: 3 giờ
**File**: `src/screens/Notes/NotesListScreen.tsx`

- [ ] Tạo screen với:
  - [ ] Header: "Ghi chú" + Button "Thêm mới"
  - [ ] FlatList hiển thị notes
  - [ ] Pull to refresh
  - [ ] Loading state
  - [ ] Empty state (khi không có notes)
- [ ] Use NotesContext:
  - [ ] Fetch notes khi screen mount
  - [ ] Display notes từ context
- [ ] Navigation:
  - [ ] Tap note → navigate đến NoteDetailScreen
  - [ ] Button "Thêm mới" → navigate đến NoteEditScreen (create mode)
- [ ] Basic UI

**Test**: 
- [ ] Hiển thị danh sách notes
- [ ] Pull to refresh
- [ ] Navigate đến detail/edit

### Bước 3.5: NoteDetailScreen
**Thời gian**: 2 giờ
**File**: `src/screens/Notes/NoteDetailScreen.tsx`

- [ ] Tạo screen hiển thị:
  - [ ] Title
  - [ ] Content (ScrollView)
  - [ ] Category (nếu có)
  - [ ] Tags
  - [ ] Favorite status
  - [ ] Created/Updated date
  - [ ] Shared status (nếu có)
- [ ] Actions:
  - [ ] Button "Chỉnh sửa" → navigate đến NoteEditScreen (edit mode)
  - [ ] Button "Xóa" → confirmation dialog → delete note
  - [ ] Button "Yêu thích" → toggle favorite
  - [ ] Button "Chia sẻ" → navigate đến ShareNoteScreen
- [ ] Fetch note từ API nếu chưa có trong context
- [ ] Handle loading và error states

**Test**: 
- [ ] Hiển thị note detail
- [ ] Edit, delete, favorite actions

### Bước 3.6: NoteEditScreen - Basic (chưa có category/tags)
**Thời gian**: 2 giờ
**File**: `src/screens/Notes/NoteEditScreen.tsx`

- [ ] Tạo form với:
  - [ ] TextInput cho title
  - [ ] TextInput (multiline) cho content
  - [ ] Character count cho title (1-500) và content (max 100,000)
  - [ ] Button "Lưu"
  - [ ] Button "Hủy"
- [ ] State management:
  - [ ] `title`, `content`
  - [ ] `loading`, `error`
- [ ] Validation:
  - [ ] Title: 1-500 ký tự
  - [ ] Content: max 100,000 ký tự
- [ ] Handle submit:
  - [ ] Nếu create mode: gọi `createNote()`
  - [ ] Nếu edit mode: gọi `updateNote()`
  - [ ] Navigate back sau khi thành công
- [ ] Handle cancel: navigate back

**Test**: 
- [ ] Tạo note mới
- [ ] Chỉnh sửa note
- [ ] Validation

**✅ Hoàn thành Bước 3.6**: Có thể tạo và chỉnh sửa notes cơ bản (chưa có category/tags).

---

## 🏷️ GIAI ĐOẠN 4: Categories & Tags (2 ngày)

### Bước 4.1: Categories Service
**Thời gian**: 1 giờ
**File**: `src/services/categoriesService.ts`

- [ ] Implement `getCategories()`
  - [ ] GET `/api/categories`
  - [ ] Return `Category[]`
- [ ] Implement `createCategory(category)`
  - [ ] POST `/api/categories`
  - [ ] Body: `{name, color}` (color: #RRGGBB hex)
  - [ ] Return `Category`
- [ ] Implement `updateCategory(id, category)`
  - [ ] PUT `/api/categories/{id}`
  - [ ] Body: `{name?, color?}`
  - [ ] Return `Category`
- [ ] Implement `deleteCategory(id)`
  - [ ] DELETE `/api/categories/{id}`
  - [ ] Return void (204 response)

### Bước 4.2: Categories Context
**Thời gian**: 1 giờ
**File**: `src/context/CategoriesContext.tsx`

- [ ] Tạo CategoriesContext với:
  - [ ] `categories: Category[]`
  - [ ] `loading: boolean`
- [ ] Implement `fetchCategories()`
- [ ] Implement `createCategory(category)`
- [ ] Implement `updateCategory(id, category)`
- [ ] Implement `deleteCategory(id)`
- [ ] Implement `getCategoryById(id)`
- [ ] Export `useCategories()` hook

### Bước 4.3: Tags Service
**Thời gian**: 1 giờ
**File**: `src/services/tagsService.ts`

- [ ] Implement `getTags()`
  - [ ] GET `/api/tags`
  - [ ] Return `Tag[]`
- [ ] Implement `createTag(tag)`
  - [ ] POST `/api/tags`
  - [ ] Body: `{name}`
  - [ ] **Lưu ý**: Server tự động return existing tag nếu name đã tồn tại
  - [ ] Return `Tag`
- [ ] Implement `deleteTag(id)`
  - [ ] DELETE `/api/tags/{id}`
  - [ ] Return void (204 response)
- [ ] Implement `addTagsToNote(noteId, tagIds)`
  - [ ] POST `/api/tags/notes/{id}/tags`
  - [ ] Body: `{tag_ids: []}` hoặc `{tag_id: number}`
- [ ] Implement `removeTagFromNote(noteId, tagId)`
  - [ ] DELETE `/api/tags/notes/{id}/tags/{tag_id}`
  - [ ] Return void (204 response)

### Bước 4.4: Tags Context
**Thời gian**: 1 giờ
**File**: `src/context/TagsContext.tsx`

- [ ] Tạo TagsContext với:
  - [ ] `tags: Tag[]`
  - [ ] `loading: boolean`
- [ ] Implement `fetchTags()`
- [ ] Implement `createTag(tag)`
- [ ] Implement `deleteTag(id)`
- [ ] Implement `getTagById(id)`
- [ ] Export `useTags()` hook

### Bước 4.5: CategoryPicker Component
**Thời gian**: 1.5 giờ
**File**: `src/components/CategoryPicker.tsx`

- [ ] Tạo component với:
  - [ ] Dropdown/Picker để chọn category
  - [ ] Option "Không có danh mục" (value: null)
  - [ ] Hiển thị category color
- [ ] Props: `selectedCategoryId`, `onSelect: (categoryId: number | null) => void`
- [ ] Fetch categories từ CategoriesContext

### Bước 4.6: TagInput Component
**Thời gian**: 2 giờ
**File**: `src/components/TagInput.tsx`

- [ ] Tạo component với:
  - [ ] TextInput để nhập tag name
  - [ ] Autocomplete từ existing tags (khi gõ)
  - [ ] Hiển thị selected tags dưới dạng chips
  - [ ] Có thể xóa tag (tap X trên chip)
- [ ] Logic:
  - [ ] Khi nhập và Enter: tạo tag mới hoặc chọn tag existing
  - [ ] Server tự động return existing tag nếu name đã tồn tại
  - [ ] Không cho phép duplicate tags trong list
- [ ] Props: `selectedTags: Tag[]`, `onTagsChange: (tags: Tag[]) => void`

### Bước 4.7: NoteEditScreen - Add Category & Tags
**Thời gian**: 1.5 giờ
**File**: `src/screens/Notes/NoteEditScreen.tsx` (update)

- [ ] Thêm CategoryPicker vào form
- [ ] Thêm TagInput vào form
- [ ] Update state: `categoryId`, `selectedTags`
- [ ] Update submit logic:
  - [ ] Gửi `category_id` trong create/update
  - [ ] Gửi `tag_ids: []` trong create/update
  - [ ] **Lưu ý**: Để remove category, gửi `category_id: 0` hoặc `null`
- [ ] Load existing category và tags khi edit mode

**Test**: 
- [ ] Tạo note với category và tags
- [ ] Chỉnh sửa category và tags
- [ ] Remove category

### Bước 4.8: CategoriesScreen
**Thời gian**: 2 giờ
**File**: `src/screens/Categories/CategoriesScreen.tsx`

- [ ] Tạo screen với:
  - [ ] Header: "Danh mục" + Button "Thêm mới"
  - [ ] FlatList hiển thị categories
  - [ ] Mỗi item hiển thị: name, color badge
- [ ] Actions:
  - [ ] Tap category → filter notes (navigate đến NotesListScreen với filter)
  - [ ] Long press hoặc button → Edit/Delete
  - [ ] Button "Thêm mới" → navigate đến CategoryEditScreen (create mode)
- [ ] Use CategoriesContext

### Bước 4.9: CategoryEditScreen
**Thời gian**: 1.5 giờ
**File**: `src/screens/Categories/CategoryEditScreen.tsx`

- [ ] Tạo form với:
  - [ ] TextInput cho name
  - [ ] TextInput hoặc ColorPicker cho color (#RRGGBB)
  - [ ] Button "Lưu"
  - [ ] Button "Xóa" (chỉ khi edit mode)
- [ ] Validation:
  - [ ] Name: 1-100 ký tự
  - [ ] Color: hex format #RRGGBB
- [ ] Handle submit:
  - [ ] Create hoặc update category
  - [ ] Navigate back
- [ ] Handle delete:
  - [ ] Confirmation dialog
  - [ ] Delete category
  - [ ] Navigate back

**✅ Hoàn thành Giai đoạn 4**: Có thể quản lý categories và tags, thêm vào notes.

---

## 🔍 GIAI ĐOẠN 5: Search & Filter (1 ngày)

### Bước 5.1: SearchBar Component
**Thời gian**: 1 giờ
**File**: `src/components/SearchBar.tsx`

- [ ] Tạo component với:
  - [ ] TextInput
  - [ ] Clear button (X)
- [ ] Debounce search (300-500ms)
- [ ] Props: `onSearch: (query: string) => void`, `placeholder`

### Bước 5.2: FilterBar Component
**Thời gian**: 2 giờ
**File**: `src/components/FilterBar.tsx`

- [ ] Tạo component với:
  - [ ] Category filter (dropdown)
  - [ ] Tags filter (multi-select)
  - [ ] Favorite toggle
  - [ ] Clear filters button
- [ ] Props: `filters: NoteFilters`, `onFiltersChange: (filters: NoteFilters) => void`
- [ ] Fetch categories và tags từ contexts

### Bước 5.3: NotesListScreen - Add Search & Filter
**Thời gian**: 2 giờ
**File**: `src/screens/Notes/NotesListScreen.tsx` (update)

- [ ] Thêm SearchBar vào header
- [ ] Thêm FilterBar (có thể là modal hoặc expandable)
- [ ] Update `fetchNotes()` với filters:
  - [ ] `search` query
  - [ ] `category_id`
  - [ ] `tag_ids` (convert array to comma-separated string)
  - [ ] `favorite`
- [ ] Update filters khi user thay đổi
- [ ] Clear filters functionality

**Test**: 
- [ ] Search notes
- [ ] Filter by category
- [ ] Filter by tags
- [ ] Filter by favorite
- [ ] Combine multiple filters

**✅ Hoàn thành Giai đoạn 5**: Có thể tìm kiếm và lọc notes.

---

## 🗑️ GIAI ĐOẠN 6: Trash & Restore (1 ngày)

### Bước 6.1: TrashScreen
**Thời gian**: 2 giờ
**File**: `src/screens/Notes/TrashScreen.tsx`

- [ ] Tạo screen tương tự NotesListScreen
- [ ] Fetch notes với `is_deleted: true`
- [ ] Hiển thị notes đã xóa
- [ ] Actions cho mỗi note:
  - [ ] Button "Khôi phục" → restore note
  - [ ] Button "Xóa vĩnh viễn" → confirmation → permanent delete
- [ ] Empty state khi không có notes trong trash
- [ ] Button "Dọn sạch thùng rác" (optional) - xóa tất cả

**Test**: 
- [ ] Hiển thị trash notes
- [ ] Restore note
- [ ] Permanent delete note

### Bước 6.2: Update NotesListScreen - Add Trash Tab
**Thời gian**: 1 giờ
**File**: `src/screens/Notes/NotesListScreen.tsx` (update)

- [ ] Thêm tabs: "Tất cả", "Yêu thích", "Thùng rác"
- [ ] Tab "Thùng rác" → navigate đến TrashScreen hoặc filter `is_deleted: true`
- [ ] Tab "Yêu thích" → filter `favorite: true`

**✅ Hoàn thành Giai đoạn 6**: Có thể quản lý thùng rác và khôi phục notes.

---

## 🔗 GIAI ĐOẠN 7: Share Notes (2-3 ngày)

### Bước 7.1: Share Service
**Thời gian**: 1.5 giờ
**File**: `src/services/shareService.ts`

- [ ] Implement `shareNote(noteId, recipientUsername, permission)`
  - [ ] POST `/api/notes/{id}/share`
  - [ ] Body: `{recipient_username, permission: "read" | "write"}`
  - [ ] Return `SharedNote`
- [ ] Implement `unshareNote(noteId, recipientId)`
  - [ ] DELETE `/api/notes/{id}/share/{recipient_id}`
  - [ ] Return void (204 response)
- [ ] Implement `updateSharePermission(noteId, recipientId, permission)`
  - [ ] PUT `/api/notes/{id}/share/{recipient_id}`
  - [ ] Body: `{permission: "read" | "write"}`
  - [ ] Return `SharedNote`
- [ ] Implement `getSharedNotes(permission?)`
  - [ ] GET `/api/notes/shared?permission=read|write`
  - [ ] Return `Note[]`
- [ ] Implement `getSharedByMe()`
  - [ ] GET `/api/notes/shared-by-me`
  - [ ] Return `SharedNote[]`
- [ ] Implement `searchUsers(query)`
  - [ ] GET `/api/users/search?q={username}`
  - [ ] **Lưu ý**: Query phải có tối thiểu 3 ký tự
  - [ ] Return `UserSearchResult[]`

### Bước 7.2: UserSearchInput Component
**Thời gian**: 2 giờ
**File**: `src/components/UserSearchInput.tsx`

- [ ] Tạo component với:
  - [ ] TextInput để nhập username
  - [ ] Autocomplete dropdown từ API
  - [ ] Debounce search (300-500ms)
- [ ] Logic:
  - [ ] Chỉ search khi input >= 3 ký tự
  - [ ] Hiển thị loading khi đang search
  - [ ] Hiển thị list users
  - [ ] Select user khi tap
- [ ] Props: `onUserSelect: (username: string) => void`, `excludeUsers?: string[]`

### Bước 7.3: ShareNoteScreen
**Thời gian**: 3 giờ
**File**: `src/screens/Notes/ShareNoteScreen.tsx`

- [ ] Tạo screen với:
  - [ ] Header: "Chia sẻ ghi chú"
  - [ ] UserSearchInput để tìm user
  - [ ] Permission selector (Read-only / Read-write)
  - [ ] Button "Chia sẻ"
  - [ ] List users đã share (từ getSharedByMe)
- [ ] Actions:
  - [ ] Share với user mới
  - [ ] Unshare (tap X hoặc button)
  - [ ] Change permission (dropdown hoặc toggle)
- [ ] Handle errors:
  - [ ] 400: "Không thể chia sẻ với chính mình" hoặc "Đã chia sẻ với user này"
  - [ ] 404: "User không tồn tại"
- [ ] Refresh list sau khi share/unshare

**Test**: 
- [ ] Search và share với user
- [ ] Unshare
- [ ] Change permission

### Bước 7.4: SharedNotesScreen
**Thời gian**: 2 giờ
**File**: `src/screens/Notes/SharedNotesScreen.tsx`

- [ ] Tạo screen tương tự NotesListScreen
- [ ] Fetch notes từ `getSharedNotes()`
- [ ] Hiển thị:
  - [ ] Note info (title, content, etc.)
  - [ ] Owner name
  - [ ] Permission (Read/Write badge)
- [ ] Actions:
  - [ ] Tap note → navigate đến NoteDetailScreen
  - [ ] Nếu write permission: có thể edit
  - [ ] Nếu read-only: chỉ xem được

### Bước 7.5: Update NotesListScreen - Add Shared Tabs
**Thời gian**: 1 giờ
**File**: `src/screens/Notes/NotesListScreen.tsx` (update)

- [ ] Thêm tab "Chia sẻ với tôi" → navigate đến SharedNotesScreen
- [ ] Thêm tab "Tôi đã chia sẻ" → hiển thị notes từ getSharedByMe (optional)

### Bước 7.6: Update NoteDetailScreen - Share Button
**Thời gian**: 30 phút
**File**: `src/screens/Notes/NoteDetailScreen.tsx` (update)

- [ ] Thêm button "Chia sẻ" (nếu note chưa được share hoặc là owner)
- [ ] Navigate đến ShareNoteScreen khi tap

**✅ Hoàn thành Giai đoạn 7**: Có thể chia sẻ notes với users khác, quản lý permissions.

---

## ⚙️ GIAI ĐOẠN 8: Settings & Profile (1-2 ngày)

### Bước 8.1: User Service
**Thời gian**: 1 giờ
**File**: `src/services/userService.ts`

- [ ] Implement `getCurrentUser()`
  - [ ] GET `/api/users/me`
  - [ ] Return `User`
- [ ] Implement `updateProfile(userData)`
  - [ ] PUT `/api/users/me`
  - [ ] Body: `{username?, email?}`
  - [ ] Return `User`
- [ ] Implement `changePassword(currentPassword, newPassword)`
  - [ ] PUT `/api/users/me/password`
  - [ ] Body: `{current_password, new_password}`
  - [ ] Return `{message: string}`
- [ ] Implement `getSettings()`
  - [ ] GET `/api/users/me/settings`
  - [ ] Return `UserSettings`
- [ ] Implement `updateSettings(settings)`
  - [ ] PUT `/api/users/me/settings`
  - [ ] Body: `{auto_lock_enabled?, session_timeout_minutes?, theme?}`
  - [ ] Return `UserSettings`

### Bước 8.2: SettingsScreen
**Thời gian**: 1.5 giờ
**File**: `src/screens/Settings/SettingsScreen.tsx`

- [ ] Tạo screen với:
  - [ ] Section "Hồ sơ":
    - [ ] Hiển thị username, email
    - [ ] Button "Chỉnh sửa" → navigate đến ProfileScreen
  - [ ] Section "Bảo mật":
    - [ ] Button "Đổi mật khẩu" → navigate đến ChangePasswordScreen
  - [ ] Section "Cài đặt":
    - [ ] Toggle "Tự động khóa" (auto_lock_enabled)
    - [ ] Input "Thời gian phiên" (session_timeout_minutes)
    - [ ] Select "Giao diện" (theme: light/dark)
  - [ ] Button "Đăng xuất" → logout
- [ ] Fetch và hiển thị settings từ API
- [ ] Save settings khi thay đổi

### Bước 8.3: ProfileScreen
**Thời gian**: 1.5 giờ
**File**: `src/screens/Settings/ProfileScreen.tsx`

- [ ] Tạo form với:
  - [ ] TextInput cho username (editable)
  - [ ] TextInput cho email (editable)
  - [ ] Display created_at (read-only)
  - [ ] Button "Lưu"
  - [ ] Button "Hủy"
- [ ] Validation:
  - [ ] Username: 3-50 ký tự
  - [ ] Email: đúng format
- [ ] Handle submit:
  - [ ] Gọi `updateProfile()`
  - [ ] Update user trong AuthContext
  - [ ] Navigate back
- [ ] Handle errors:
  - [ ] 400: "Username hoặc email đã được sử dụng"

### Bước 8.4: ChangePasswordScreen
**Thời gian**: 1.5 giờ
**File**: `src/screens/Settings/ChangePasswordScreen.tsx`

- [ ] Tạo form với:
  - [ ] TextInput cho current password (secureTextEntry)
  - [ ] TextInput cho new password (secureTextEntry)
  - [ ] TextInput cho confirm new password (secureTextEntry)
  - [ ] Button "Đổi mật khẩu"
  - [ ] Button "Hủy"
- [ ] Validation:
  - [ ] Current password không rỗng
  - [ ] New password: tối thiểu 8 ký tự
  - [ ] Confirm password khớp với new password
- [ ] Handle submit:
  - [ ] Gọi `changePassword()`
  - [ ] Show success message
  - [ ] **Lưu ý**: Sau khi đổi password, tất cả refresh tokens bị invalidate
  - [ ] Logout và navigate đến LoginScreen (yêu cầu re-login)
- [ ] Handle errors:
  - [ ] 400: "Mật khẩu hiện tại không đúng"

### Bước 8.5: Update AppNavigator - Add Settings
**Thời gian**: 30 phút
**File**: `src/navigation/AppNavigator.tsx` (update)

- [ ] Thêm SettingsScreen vào navigation
- [ ] Thêm button Settings trong header hoặc bottom tabs

**✅ Hoàn thành Giai đoạn 8**: Có thể quản lý profile, đổi mật khẩu, và settings.

---

## 🎨 GIAI ĐOẠN 9: Polish & Error Handling (1-2 ngày)

### Bước 9.1: Error Handling - Global
**Thời gian**: 2 giờ

- [ ] Tạo ErrorBoundary component
- [ ] Handle network errors (timeout, no connection)
- [ ] Handle API errors consistently:
  - [ ] 400: Bad Request - hiển thị `error.detail`
  - [ ] 401: Unauthorized - auto refresh hoặc logout
  - [ ] 403: Forbidden - hiển thị message
  - [ ] 404: Not Found - hiển thị message
  - [ ] 429: Rate Limit - hiển thị message với thời gian đợi
  - [ ] 500: Server Error - hiển thị message
- [ ] Toast/Alert để hiển thị errors

### Bước 9.2: Loading States
**Thời gian**: 1 giờ

- [ ] Kiểm tra tất cả screens có loading state
- [ ] LoadingSpinner component hoạt động đúng
- [ ] Disable buttons khi đang loading

### Bước 9.3: Empty States
**Thời gian**: 1 giờ

- [ ] Empty state cho NotesListScreen (không có notes)
- [ ] Empty state cho TrashScreen
- [ ] Empty state cho SharedNotesScreen
- [ ] Empty state cho CategoriesScreen
- [ ] Empty state cho search results

### Bước 9.4: Confirmation Dialogs
**Thời gian**: 1 giờ

- [ ] Confirmation dialog trước khi delete note
- [ ] Confirmation dialog trước khi permanent delete
- [ ] Confirmation dialog trước khi delete category
- [ ] Confirmation dialog trước khi logout

### Bước 9.5: Navigation Improvements
**Thời gian**: 1 giờ

- [ ] Kiểm tra tất cả navigation flows
- [ ] Back button behavior đúng
- [ ] Deep linking (optional)

### Bước 9.6: Performance Optimization
**Thời gian**: 1 giờ

- [ ] Memoization cho expensive components
- [ ] Debounce cho search và filter
- [ ] Optimize FlatList rendering (keyExtractor, getItemLayout nếu có thể)

**✅ Hoàn thành Giai đoạn 9**: App đã hoàn chỉnh với error handling và UX tốt.

---

## 🧪 GIAI ĐOẠN 10: Testing & Bug Fixes (1-2 ngày)

### Bước 10.1: Manual Testing - Authentication
**Thời gian**: 1 giờ

- [ ] Test đăng ký với data hợp lệ
- [ ] Test đăng ký với data không hợp lệ
- [ ] Test đăng nhập với credentials đúng
- [ ] Test đăng nhập với credentials sai
- [ ] Test rate limiting (đăng ký 3 lần, đăng nhập 5 lần)
- [ ] Test auto login khi app start
- [ ] Test logout
- [ ] Test token refresh

### Bước 10.2: Manual Testing - Notes CRUD
**Thời gian**: 1 giờ

- [ ] Test tạo note (có và không có category/tags)
- [ ] Test chỉnh sửa note
- [ ] Test xóa note (soft delete)
- [ ] Test khôi phục note
- [ ] Test xóa vĩnh viễn note
- [ ] Test toggle favorite
- [ ] Test validation (title/content length)

### Bước 10.3: Manual Testing - Categories & Tags
**Thời gian**: 1 giờ

- [ ] Test tạo category
- [ ] Test chỉnh sửa category
- [ ] Test xóa category
- [ ] Test tạo tag
- [ ] Test xóa tag
- [ ] Test thêm category/tags vào note
- [ ] Test remove category từ note

### Bước 10.4: Manual Testing - Search & Filter
**Thời gian**: 1 giờ

- [ ] Test search notes
- [ ] Test filter by category
- [ ] Test filter by tags
- [ ] Test filter by favorite
- [ ] Test combine multiple filters
- [ ] Test clear filters

### Bước 10.5: Manual Testing - Share
**Thời gian**: 1 giờ

- [ ] Test share note với user
- [ ] Test unshare note
- [ ] Test change permission
- [ ] Test view shared notes
- [ ] Test edit shared note (với write permission)
- [ ] Test edit shared note (với read-only - should fail)
- [ ] Test user search (với query < 3 ký tự)

### Bước 10.6: Manual Testing - Settings
**Thời gian**: 30 phút

- [ ] Test update profile
- [ ] Test change password
- [ ] Test update settings
- [ ] Test logout từ settings

### Bước 10.7: Bug Fixes
**Thời gian**: 2-4 giờ

- [ ] Fix các bugs phát hiện trong testing
- [ ] Test lại các chức năng đã fix

**✅ Hoàn thành Giai đoạn 10**: App đã được test kỹ và sẵn sàng cho production.

---

## 📦 GIAI ĐOẠN 11: Build & Deployment (1 ngày)

### Bước 11.1: Production Configuration
**Thời gian**: 1 giờ

- [ ] Update `app.config.js` với production API URL
- [ ] Update version trong `app.json`
- [ ] Kiểm tra icon và splash screen
- [ ] Kiểm tra permissions trong AndroidManifest

### Bước 11.2: Build APK/AAB
**Thời gian**: 2 giờ

- [ ] Setup EAS Build (nếu chưa có)
  ```bash
  npm install -g eas-cli
  eas login
  eas build:configure
  ```
- [ ] Build Android APK:
  ```bash
  eas build --platform android --profile preview
  ```
- [ ] Build Android AAB (cho Play Store):
  ```bash
  eas build --platform android --profile production
  ```
- [ ] Test APK trên device thật

### Bước 11.3: Documentation
**Thời gian**: 1 giờ

- [ ] Update README.md với:
  - [ ] Hướng dẫn cài đặt
  - [ ] Hướng dẫn build
  - [ ] Cấu trúc dự án
  - [ ] Environment variables
- [ ] Tạo CHANGELOG.md (optional)

**✅ Hoàn thành toàn bộ dự án**: App đã sẵn sàng để deploy!

---

## 📊 Tổng Kết

### Checklist Tổng Quan

- [ ] **Giai đoạn 1**: Setup & Foundation
- [ ] **Giai đoạn 2**: Authentication
- [ ] **Giai đoạn 3**: Core Notes Features
- [ ] **Giai đoạn 4**: Categories & Tags
- [ ] **Giai đoạn 5**: Search & Filter
- [ ] **Giai đoạn 6**: Trash & Restore
- [ ] **Giai đoạn 7**: Share Notes
- [ ] **Giai đoạn 8**: Settings & Profile
- [ ] **Giai đoạn 9**: Polish & Error Handling
- [ ] **Giai đoạn 10**: Testing & Bug Fixes
- [ ] **Giai đoạn 11**: Build & Deployment

### Thời Gian Ước Tính

- **Tối thiểu**: 12 ngày (làm full-time, tập trung)
- **Thực tế**: 14-16 ngày (bao gồm testing và bug fixes)
- **An toàn**: 18-20 ngày (nếu có vấn đề phát sinh)

### Lưu Ý Quan Trọng

1. **Làm từng bước một**: Không bỏ qua bước nào, đảm bảo mỗi bước hoạt động trước khi chuyển sang bước tiếp theo.
2. **Test thường xuyên**: Test mỗi chức năng ngay sau khi implement.
3. **Tham khảo API Documentation**: Luôn kiểm tra API documentation để đảm bảo request/response format đúng.
4. **Error Handling**: Luôn handle errors và hiển thị messages rõ ràng cho user.
5. **UI tối thiểu**: Không cần UI đẹp, chỉ cần đủ chức năng và dễ sử dụng.

---

## 🚀 Bắt Đầu

Bắt đầu từ **Giai đoạn 1 - Bước 1.1** và làm tuần tự từng bước!

Chúc bạn thành công! 🎉


