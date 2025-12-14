from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(Text, nullable=False)
    encryption_key_encrypted = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    todos = relationship("Todo", back_populates="owner", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="owner", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="owner", cascade="all, delete-orphan")
    shared_notes_owned = relationship("SharedNote", foreign_keys="SharedNote.owner_id", back_populates="owner")
    shared_notes_received = relationship("SharedNote", foreign_keys="SharedNote.recipient_id", back_populates="recipient")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    color = Column(String(7), default="#3498db")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="categories")
    notes = relationship("Note", back_populates="category")
    todos = relationship("Todo", back_populates="category")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="tags")
    notes = relationship("Note", secondary="note_tags", back_populates="tags")
    todos = relationship("Todo", secondary="todo_tags", back_populates="tags")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Encrypted fields
    title_encrypted = Column(Text, nullable=False)
    title_nonce = Column(Text, nullable=False)
    title_tag = Column(Text, nullable=False)
    content_encrypted = Column(Text, nullable=False)
    content_nonce = Column(Text, nullable=False)
    content_tag = Column(Text, nullable=False)
    
    # Metadata
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    is_favorite = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_shared = Column(Boolean, default=False)
    original_note_id = Column(Integer, ForeignKey("notes.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="notes")
    category = relationship("Category", back_populates="notes")
    tags = relationship("Tag", secondary="note_tags", back_populates="notes")
    shared_notes_original = relationship("SharedNote", foreign_keys="SharedNote.original_note_id", back_populates="original_note")
    shared_notes_shared = relationship("SharedNote", foreign_keys="SharedNote.shared_note_id", back_populates="shared_note")


class NoteTag(Base):
    __tablename__ = "note_tags"
    
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)


class SharedNote(Base):
    __tablename__ = "shared_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    original_note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    shared_note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permission = Column(String(10), default="read")  # 'read' or 'write'
    shared_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    original_note = relationship("Note", foreign_keys=[original_note_id], back_populates="shared_notes_original")
    shared_note = relationship("Note", foreign_keys=[shared_note_id], back_populates="shared_notes_shared")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="shared_notes_owned")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="shared_notes_received")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(Text, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")


class Todo(Base):
    __tablename__ = "todos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Encrypted fields
    title_encrypted = Column(Text, nullable=False)
    title_nonce = Column(Text, nullable=False)
    title_tag = Column(Text, nullable=False)
    description_encrypted = Column(Text, nullable=True)
    description_nonce = Column(Text, nullable=True)
    description_tag = Column(Text, nullable=True)
    
    # Todo-specific fields
    status = Column(String(20), default="pending")  # pending, in_progress, completed
    priority = Column(String(10), default="medium")  # low, medium, high, urgent
    due_date = Column(DateTime(timezone=True), nullable=True)
    reminder_at = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    is_favorite = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_shared = Column(Boolean, default=False)
    
    # Link to note (optional)
    linked_note_id = Column(Integer, ForeignKey("notes.id", ondelete="SET NULL"), nullable=True)
    
    # Recurrence fields
    recurrence_pattern = Column(String(20), nullable=True)  # daily, weekly, monthly, yearly, custom
    recurrence_interval = Column(Integer, default=1)  # Every X days/weeks/months
    recurrence_end_date = Column(DateTime(timezone=True), nullable=True)  # End date for recurrence
    recurrence_count = Column(Integer, nullable=True)  # Number of occurrences
    parent_todo_id = Column(Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=True)  # Parent recurring template
    next_occurrence_date = Column(DateTime(timezone=True), nullable=True)  # When to create next instance
    is_recurring_template = Column(Boolean, default=False)  # Is this a recurring template
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="todos")
    category = relationship("Category", back_populates="todos")
    tags = relationship("Tag", secondary="todo_tags", back_populates="todos")
    subtasks = relationship("TodoItem", back_populates="todo", cascade="all, delete-orphan", order_by="TodoItem.order")
    parent_todo = relationship("Todo", remote_side=[id], backref="child_todos")  # Self-referential for recurring todos
    linked_note = relationship("Note", foreign_keys=[linked_note_id])
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class TodoItem(Base):
    __tablename__ = "todo_items"
    
    id = Column(Integer, primary_key=True, index=True)
    todo_id = Column(Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=False)
    
    # Encrypted
    title_encrypted = Column(Text, nullable=False)
    title_nonce = Column(Text, nullable=False)
    title_tag = Column(Text, nullable=False)
    
    is_completed = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    todo = relationship("Todo", back_populates="subtasks")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class TodoTag(Base):
    __tablename__ = "todo_tags"
    
    todo_id = Column(Integer, ForeignKey("todos.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)


















