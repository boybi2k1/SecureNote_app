from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None


# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#3498db", pattern="^#[0-9A-Fa-f]{6}$")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Tag Schemas
class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Note Schemas
class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., max_length=100000)
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, max_length=100000)
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class NoteResponse(NoteBase):
    id: int
    user_id: int
    is_favorite: bool
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    is_shared: bool
    original_note_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    
    class Config:
        from_attributes = True


# Share Schemas
class ShareNoteRequest(BaseModel):
    recipient_username: str = Field(..., min_length=3, max_length=50)
    permission: str = Field(default="read", pattern="^(read|write)$")


class UpdateSharePermissionRequest(BaseModel):
    permission: str = Field(..., pattern="^(read|write)$")


class SharedNoteResponse(BaseModel):
    id: int
    original_note_id: int
    shared_note_id: int
    owner_id: int
    recipient_id: int
    permission: str
    shared_at: datetime
    owner: Optional[UserResponse] = None
    recipient: Optional[UserResponse] = None
    note: Optional[NoteResponse] = None
    
    class Config:
        from_attributes = True


# User Search
class UserSearchResponse(BaseModel):
    username: str


# Settings
class UserSettings(BaseModel):
    auto_lock_enabled: bool = False
    session_timeout_minutes: int = 30
    theme: str = "light"


class UserSettingsResponse(UserSettings):
    pass


# Todo Item Schemas
class TodoItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class TodoItemCreate(TodoItemBase):
    order: Optional[int] = 0


class TodoItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    is_completed: Optional[bool] = None
    order: Optional[int] = None


class TodoItemResponse(TodoItemBase):
    id: int
    todo_id: int
    is_completed: bool
    order: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Todo Schemas
class TodoBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=10000)
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    due_date: Optional[datetime] = None
    reminder_at: Optional[datetime] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []
    linked_note_id: Optional[int] = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=10000)
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    due_date: Optional[datetime] = None
    reminder_at: Optional[datetime] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None
    linked_note_id: Optional[int] = None


class TodoResponse(TodoBase):
    id: int
    user_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    is_favorite: bool
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    is_shared: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    subtasks: List[TodoItemResponse] = []
    
    class Config:
        from_attributes = True


