Thứ tự triển khai
Phase 1: Foundation & Authentication (đã hoàn thành)
Storage Service
API Service với auto refresh token
Auth Service (login, register, logout, refresh)
Auth Context
Login & Register Screens
Phase 2: Core Notes - CRUD cơ bản (ưu tiên cao)
Thứ tự:
Types cho Notes
src/types/note.types.ts (Note, CreateNoteDto, UpdateNoteDto, NoteFilters)
Notes Service
getNotes(filters?) - GET /api/notes
getNoteById(id) - GET /api/notes/{id}
createNote(note) - POST /api/notes
updateNote(id, note) - PUT /api/notes/{id}
deleteNote(id) - DELETE /api/notes/{id}
Notes Context
State management cho notes
Functions: fetchNotes, createNote, updateNote, deleteNote
NotesListScreen
Hiển thị danh sách notes
Pull to refresh
Navigate đến detail/edit
NoteDetailScreen
Hiển thị chi tiết note
Actions: Edit, Delete, Favorite
NoteEditScreen (Create & Update)
Form: title, content
Validation
Save/Cancel
Phase 3: Categories & Tags (phụ thuộc Notes)
Thứ tự:
Types cho Categories & Tags
src/types/category.types.ts
src/types/tag.types.ts
Categories Service
getCategories() - GET /api/categories
createCategory() - POST /api/categories
updateCategory() - PUT /api/categories/{id}
deleteCategory() - DELETE /api/categories/{id}
Tags Service
getTags() - GET /api/tags
createTag() - POST /api/tags
deleteTag() - DELETE /api/tags/{id}
addTagsToNote() - POST /api/tags/notes/{id}/tags
removeTagFromNote() - DELETE /api/tags/notes/{id}/tags/{id}
Categories & Tags Contexts
State management riêng cho mỗi loại
CategoryPicker Component
Dropdown chọn category
TagInput Component
Input với autocomplete
Hiển thị selected tags
Cập nhật NoteEditScreen
Thêm CategoryPicker
Thêm TagInput
Gửi category_id và tag_ids khi create/update
CategoriesScreen
Danh sách categories
CRUD categories
Phase 4: Search & Filter (nâng cao Notes)
Thứ tự:
SearchBar Component
TextInput với debounce
Clear button
FilterBar Component
Category filter
Tags filter (multi-select)
Favorite toggle
Clear filters
Cập nhật NotesListScreen
Thêm SearchBar
Thêm FilterBar
Apply filters khi search/filter
Phase 5: Trash & Restore (mở rộng Notes)
Thứ tự:
Cập nhật Notes Service
getTrashNotes() - GET /api/notes/trash
restoreNote(id) - POST /api/notes/{id}/restore
permanentDeleteNote(id) - DELETE /api/notes/{id}/permanent
Cập nhật Notes Context
Functions: restoreNote, permanentDeleteNote
TrashScreen
Hiển thị notes đã xóa
Actions: Restore, Permanent Delete
Cập nhật NotesListScreen
Tab "Thùng rác" → navigate đến TrashScreen
Tab "Yêu thích" → filter favorite
Cập nhật NoteDetailScreen
Toggle favorite - POST /api/notes/{id}/favorite
Phase 6: Share Notes (phụ thuộc Notes & Users)
Thứ tự:
Types cho Share
src/types/share.types.ts (SharedNote, ShareRequest, Permission)
Share Service
shareNote() - POST /api/notes/{id}/share
getSharedNotes() - GET /api/notes/shared
getSharedByMe() - GET /api/notes/shared-by-me
updateSharePermission() - PUT /api/notes/{id}/share/{id}
unshareNote() - DELETE /api/notes/{id}/share/{id}
searchUsers() - GET /api/users/search?q=keyword
UserSearchInput Component
Autocomplete search users
Debounce
ShareNoteScreen
Search user để share
Permission selector (read/write)
List users đã share
Actions: Share, Unshare, Change permission
SharedNotesScreen
Hiển thị notes được chia sẻ
Hiển thị permission
Cập nhật NotesListScreen
Tab "Chia sẻ với tôi"
Tab "Tôi đã chia sẻ"
Cập nhật NoteDetailScreen
Button "Chia sẻ" → navigate đến ShareNoteScreen
Phase 7: User Management & Settings
Thứ tự:
Types cho User
src/types/user.types.ts (UserSettings, UpdateProfileRequest, ChangePasswordRequest)
User Service
getCurrentUser() - GET /api/users/me (đã có)
updateProfile() - PUT /api/users/me
changePassword() - PUT /api/users/me/password
getSettings() - GET /api/users/me/settings
updateSettings() - PUT /api/users/me/settings
ProfileScreen
Form: username, email
Save/Cancel
ChangePasswordScreen
Form: current password, new password, confirm
Validation
Logout sau khi đổi password
SettingsScreen
Hiển thị profile info
Button "Chỉnh sửa profile"
Button "Đổi mật khẩu"
Settings: auto lock, session timeout, theme
Button "Đăng xuất"
Cập nhật AppNavigator
Thêm SettingsScreen vào navigation
Button Settings trong header/bottom tabs
Phase 8: Polish & Error Handling
Thứ tự:
Error Handling
ErrorBoundary component
Global error handler
Toast/Alert cho errors
Loading States
LoadingSpinner component
Disable buttons khi loading
Empty States
Empty state cho tất cả screens
Confirmation Dialogs
Delete confirmation
Permanent delete confirmation
Logout confirmation
Performance Optimization
Memoization
Debounce cho search/filter
Optimize FlatList