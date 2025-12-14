from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.models import Todo, TodoItem, User, Category, Tag, TodoTag, Note
from app.schemas import TodoCreate, TodoUpdate, TodoResponse, TodoItemCreate, TodoItemUpdate, TodoItemResponse
from app.security import (
    decrypt_user_key, encrypt_note_data, decrypt_note_data
)
from app.api.deps import get_current_user

router = APIRouter()


def get_user_encryption_key(user: User) -> bytes:
    """Get and decrypt user's encryption key"""
    from app.security import get_master_key_bytes
    from cryptography.exceptions import InvalidTag
    
    try:
        master_key = get_master_key_bytes()
        return decrypt_user_key(user.encryption_key_encrypted, master_key)
    except ValueError as e:
        raise ValueError(f"User {user.id} ({user.username}): {str(e)}")
    except InvalidTag as e:
        raise InvalidTag(f"User {user.id} ({user.username}): Encryption key decryption failed - invalid tag.")
    except Exception as e:
        raise Exception(f"User {user.id} ({user.username}): Failed to decrypt encryption key - {str(e)}")


@router.get("", response_model=List[TodoResponse])
async def get_todos(
    category_id: Optional[int] = None,
    tag_ids: Optional[str] = None,
    favorite: Optional[bool] = None,
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    is_deleted: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get todos with filters"""
    query = db.query(Todo).filter(Todo.user_id == current_user.id)
    
    # Filter by is_deleted
    query = query.filter(Todo.is_deleted == is_deleted)
    
    # Filter by category
    if category_id:
        query = query.filter(Todo.category_id == category_id)
    
    # Filter by favorite
    if favorite is not None:
        query = query.filter(Todo.is_favorite == favorite)
    
    # Filter by status
    if status_filter:
        query = query.filter(Todo.status == status_filter)
    
    # Filter by priority
    if priority:
        query = query.filter(Todo.priority == priority)
    
    # Filter by tags
    if tag_ids:
        tag_id_list = [int(tid) for tid in tag_ids.split(",") if tid.strip()]
        if tag_id_list:
            query = query.join(TodoTag).filter(TodoTag.tag_id.in_(tag_id_list))
    
    todos = query.all()
    
    # Decrypt todos
    try:
        user_key = get_user_encryption_key(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user encryption key: {str(e)}"
        )
    
    decrypted_todos = []
    
    for todo in todos:
        try:
            title = decrypt_note_data(todo.title_encrypted, todo.title_nonce, todo.title_tag, user_key)
            description = None
            if todo.description_encrypted:
                description = decrypt_note_data(
                    todo.description_encrypted, 
                    todo.description_nonce, 
                    todo.description_tag, 
                    user_key
                )
            
            # Decrypt subtasks
            subtasks = []
            for item in todo.subtasks:
                item_title = decrypt_note_data(item.title_encrypted, item.title_nonce, item.title_tag, user_key)
                subtasks.append(TodoItemResponse(
                    id=item.id,
                    todo_id=item.todo_id,
                    title=item_title,
                    is_completed=item.is_completed,
                    order=item.order,
                    created_at=item.created_at,
                    updated_at=item.updated_at
                ))
            
            # Filter by search keyword in plaintext
            if search:
                search_lower = search.lower()
                if search_lower not in title.lower() and (not description or search_lower not in description.lower()):
                    continue
            
            # Create response with decrypted data
            todo_dict = {
                "id": todo.id,
                "user_id": todo.user_id,
                "title": title,
                "description": description,
                "status": todo.status,
                "priority": todo.priority,
                "due_date": todo.due_date,
                "reminder_at": todo.reminder_at,
                "is_completed": todo.is_completed,
                "completed_at": todo.completed_at,
                "category_id": todo.category_id,
                "is_favorite": todo.is_favorite,
                "is_deleted": todo.is_deleted,
                "deleted_at": todo.deleted_at,
                "is_shared": todo.is_shared,
                "linked_note_id": todo.linked_note_id,
                "created_at": todo.created_at,
                "updated_at": todo.updated_at,
                "tag_ids": [tag.id for tag in todo.tags],
                "category": todo.category,
                "tags": todo.tags,
                "subtasks": subtasks
            }
            decrypted_todos.append(TodoResponse(**todo_dict))
        except Exception as e:
            import traceback
            print(f"Error decrypting todo {todo.id}: {str(e)}")
            traceback.print_exc()
            continue
    
    return decrypted_todos


@router.get("/trash", response_model=List[TodoResponse])
async def get_trash_todos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get deleted todos (trash)"""
    return await get_todos(is_deleted=True, current_user=current_user, db=db)


@router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get todo by ID"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    # Decrypt todo
    user_key = get_user_encryption_key(current_user)
    try:
        title = decrypt_note_data(todo.title_encrypted, todo.title_nonce, todo.title_tag, user_key)
        description = None
        if todo.description_encrypted:
            description = decrypt_note_data(
                todo.description_encrypted,
                todo.description_nonce,
                todo.description_tag,
                user_key
            )
        
        # Decrypt subtasks
        subtasks = []
        for item in todo.subtasks:
            item_title = decrypt_note_data(item.title_encrypted, item.title_nonce, item.title_tag, user_key)
            subtasks.append(TodoItemResponse(
                id=item.id,
                todo_id=item.todo_id,
                title=item_title,
                is_completed=item.is_completed,
                order=item.order,
                created_at=item.created_at,
                updated_at=item.updated_at
            ))
        
        todo_dict = {
            "id": todo.id,
            "user_id": todo.user_id,
            "title": title,
            "description": description,
            "status": todo.status,
            "priority": todo.priority,
            "due_date": todo.due_date,
            "reminder_at": todo.reminder_at,
            "is_completed": todo.is_completed,
            "completed_at": todo.completed_at,
            "category_id": todo.category_id,
            "is_favorite": todo.is_favorite,
            "is_deleted": todo.is_deleted,
            "deleted_at": todo.deleted_at,
            "is_shared": todo.is_shared,
            "linked_note_id": todo.linked_note_id,
            "created_at": todo.created_at,
            "updated_at": todo.updated_at,
            "tag_ids": [tag.id for tag in todo.tags],
            "category": todo.category,
            "tags": todo.tags,
            "subtasks": subtasks
        }
        return TodoResponse(**todo_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt todo"
        )


@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_data: TodoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new todo"""
    # Validate category if provided
    if todo_data.category_id:
        category = db.query(Category).filter(
            Category.id == todo_data.category_id,
            Category.user_id == current_user.id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Validate tags if provided
    if todo_data.tag_ids:
        tags = db.query(Tag).filter(
            Tag.id.in_(todo_data.tag_ids),
            Tag.user_id == current_user.id
        ).all()
        if len(tags) != len(todo_data.tag_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more tags not found"
            )
    
    # Validate linked note if provided
    if todo_data.linked_note_id:
        note = db.query(Note).filter(
            Note.id == todo_data.linked_note_id,
            Note.user_id == current_user.id
        ).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Linked note not found"
            )
    
    # Get user encryption key
    try:
        user_key = get_user_encryption_key(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user encryption key: {str(e)}"
        )
    
    # Encrypt todo data
    try:
        title_encrypted, title_nonce, title_tag = encrypt_note_data(todo_data.title, user_key)
        description_encrypted = None
        description_nonce = None
        description_tag = None
        if todo_data.description:
            description_encrypted, description_nonce, description_tag = encrypt_note_data(
                todo_data.description, user_key
            )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to encrypt todo: {str(e)}"
        )
    
    # Determine is_completed based on status
    is_completed = todo_data.status == "completed"
    completed_at = datetime.now() if is_completed else None
    
    # Create todo
    db_todo = Todo(
        user_id=current_user.id,
        title_encrypted=title_encrypted,
        title_nonce=title_nonce,
        title_tag=title_tag,
        description_encrypted=description_encrypted,
        description_nonce=description_nonce,
        description_tag=description_tag,
        status=todo_data.status,
        priority=todo_data.priority,
        due_date=todo_data.due_date,
        reminder_at=todo_data.reminder_at,
        is_completed=is_completed,
        completed_at=completed_at,
        category_id=todo_data.category_id,
        linked_note_id=todo_data.linked_note_id
    )
    db.add(db_todo)
    db.flush()
    
    # Add tags
    if todo_data.tag_ids:
        for tag_id in todo_data.tag_ids:
            db.add(TodoTag(todo_id=db_todo.id, tag_id=tag_id))
    
    db.commit()
    db.refresh(db_todo)
    
    # Return decrypted todo
    todo_dict = {
        "id": db_todo.id,
        "user_id": db_todo.user_id,
        "title": todo_data.title,
        "description": todo_data.description,
        "status": db_todo.status,
        "priority": db_todo.priority,
        "due_date": db_todo.due_date,
        "reminder_at": db_todo.reminder_at,
        "is_completed": db_todo.is_completed,
        "completed_at": db_todo.completed_at,
        "category_id": db_todo.category_id,
        "is_favorite": db_todo.is_favorite,
        "is_deleted": db_todo.is_deleted,
        "deleted_at": db_todo.deleted_at,
        "is_shared": db_todo.is_shared,
        "linked_note_id": db_todo.linked_note_id,
        "created_at": db_todo.created_at,
        "updated_at": db_todo.updated_at,
        "tag_ids": todo_data.tag_ids or [],
        "category": db_todo.category,
        "tags": db_todo.tags,
        "subtasks": []
    }
    return TodoResponse(**todo_dict)


@router.put("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id,
        Todo.is_deleted == False
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    user_key = get_user_encryption_key(current_user)
    
    # Decrypt current todo to get values if not provided
    current_title = decrypt_note_data(todo.title_encrypted, todo.title_nonce, todo.title_tag, user_key)
    current_description = None
    if todo.description_encrypted:
        current_description = decrypt_note_data(
            todo.description_encrypted,
            todo.description_nonce,
            todo.description_tag,
            user_key
        )
    
    # Update fields
    title = todo_update.title if todo_update.title is not None else current_title
    description = todo_update.description if todo_update.description is not None else current_description
    
    # Re-encrypt if title or description changed
    if todo_update.title is not None or todo_update.description is not None:
        title_encrypted, title_nonce, title_tag = encrypt_note_data(title, user_key)
        todo.title_encrypted = title_encrypted
        todo.title_nonce = title_nonce
        todo.title_tag = title_tag
        
        if todo_update.description is not None:
            if description:
                desc_encrypted, desc_nonce, desc_tag = encrypt_note_data(description, user_key)
                todo.description_encrypted = desc_encrypted
                todo.description_nonce = desc_nonce
                todo.description_tag = desc_tag
            else:
                todo.description_encrypted = None
                todo.description_nonce = None
                todo.description_tag = None
    
    # Update status and is_completed
    if todo_update.status is not None:
        todo.status = todo_update.status
        todo.is_completed = todo_update.status == "completed"
        if todo.is_completed and not todo.completed_at:
            todo.completed_at = datetime.now()
        elif not todo.is_completed:
            todo.completed_at = None
    
    # Update other fields
    if todo_update.priority is not None:
        todo.priority = todo_update.priority
    if todo_update.due_date is not None:
        todo.due_date = todo_update.due_date
    if todo_update.reminder_at is not None:
        todo.reminder_at = todo_update.reminder_at
    if todo_update.linked_note_id is not None:
        if todo_update.linked_note_id == 0:
            todo.linked_note_id = None
        else:
            note = db.query(Note).filter(
                Note.id == todo_update.linked_note_id,
                Note.user_id == current_user.id
            ).first()
            if not note:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Linked note not found"
                )
            todo.linked_note_id = todo_update.linked_note_id
    
    # Update category
    if todo_update.category_id is not None:
        if todo_update.category_id == 0:
            todo.category_id = None
        else:
            category = db.query(Category).filter(
                Category.id == todo_update.category_id,
                Category.user_id == current_user.id
            ).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            todo.category_id = todo_update.category_id
    
    # Update tags
    if todo_update.tag_ids is not None:
        db.query(TodoTag).filter(TodoTag.todo_id == todo_id).delete()
        if todo_update.tag_ids:
            tags = db.query(Tag).filter(
                Tag.id.in_(todo_update.tag_ids),
                Tag.user_id == current_user.id
            ).all()
            if len(tags) != len(todo_update.tag_ids):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="One or more tags not found"
                )
            for tag_id in todo_update.tag_ids:
                db.add(TodoTag(todo_id=todo_id, tag_id=tag_id))
    
    db.commit()
    db.refresh(todo)
    
    # Decrypt subtasks
    subtasks = []
    for item in todo.subtasks:
        item_title = decrypt_note_data(item.title_encrypted, item.title_nonce, item.title_tag, user_key)
        subtasks.append(TodoItemResponse(
            id=item.id,
            todo_id=item.todo_id,
            title=item_title,
            is_completed=item.is_completed,
            order=item.order,
            created_at=item.created_at,
            updated_at=item.updated_at
        ))
    
    # Return decrypted todo
    todo_dict = {
        "id": todo.id,
        "user_id": todo.user_id,
        "title": title,
        "description": description,
        "status": todo.status,
        "priority": todo.priority,
        "due_date": todo.due_date,
        "reminder_at": todo.reminder_at,
        "is_completed": todo.is_completed,
        "completed_at": todo.completed_at,
        "category_id": todo.category_id,
        "is_favorite": todo.is_favorite,
        "is_deleted": todo.is_deleted,
        "deleted_at": todo.deleted_at,
        "is_shared": todo.is_shared,
        "linked_note_id": todo.linked_note_id,
        "created_at": todo.created_at,
        "updated_at": todo.updated_at,
        "tag_ids": [tag.id for tag in todo.tags],
        "category": todo.category,
        "tags": todo.tags,
        "subtasks": subtasks
    }
    return TodoResponse(**todo_dict)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a todo (move to trash)"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    todo.is_deleted = True
    todo.deleted_at = datetime.now()
    db.commit()
    
    return None


@router.post("/{todo_id}/complete")
async def toggle_complete(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle complete status of a todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id,
        Todo.is_deleted == False
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    todo.is_completed = not todo.is_completed
    if todo.is_completed:
        todo.status = "completed"
        todo.completed_at = datetime.now()
    else:
        todo.status = "pending"
        todo.completed_at = None
    
    db.commit()
    
    return {"is_completed": todo.is_completed, "status": todo.status}


@router.post("/{todo_id}/favorite")
async def toggle_favorite(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status of a todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id,
        Todo.is_deleted == False
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    todo.is_favorite = not todo.is_favorite
    db.commit()
    
    return {"is_favorite": todo.is_favorite}


@router.post("/{todo_id}/restore", response_model=TodoResponse)
async def restore_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore a todo from trash"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id,
        Todo.is_deleted == True
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or not in trash"
        )
    
    todo.is_deleted = False
    todo.deleted_at = None
    db.commit()
    db.refresh(todo)
    
    # Return decrypted todo
    user_key = get_user_encryption_key(current_user)
    title = decrypt_note_data(todo.title_encrypted, todo.title_nonce, todo.title_tag, user_key)
    description = None
    if todo.description_encrypted:
        description = decrypt_note_data(
            todo.description_encrypted,
            todo.description_nonce,
            todo.description_tag,
            user_key
        )
    
    # Decrypt subtasks
    subtasks = []
    for item in todo.subtasks:
        item_title = decrypt_note_data(item.title_encrypted, item.title_nonce, item.title_tag, user_key)
        subtasks.append(TodoItemResponse(
            id=item.id,
            todo_id=item.todo_id,
            title=item_title,
            is_completed=item.is_completed,
            order=item.order,
            created_at=item.created_at,
            updated_at=item.updated_at
        ))
    
    todo_dict = {
        "id": todo.id,
        "user_id": todo.user_id,
        "title": title,
        "description": description,
        "status": todo.status,
        "priority": todo.priority,
        "due_date": todo.due_date,
        "reminder_at": todo.reminder_at,
        "is_completed": todo.is_completed,
        "completed_at": todo.completed_at,
        "category_id": todo.category_id,
        "is_favorite": todo.is_favorite,
        "is_deleted": todo.is_deleted,
        "deleted_at": todo.deleted_at,
        "is_shared": todo.is_shared,
        "linked_note_id": todo.linked_note_id,
        "created_at": todo.created_at,
        "updated_at": todo.updated_at,
        "tag_ids": [tag.id for tag in todo.tags],
        "category": todo.category,
        "tags": todo.tags,
        "subtasks": subtasks
    }
    return TodoResponse(**todo_dict)


@router.delete("/{todo_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanent_delete_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete a todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id,
        Todo.is_deleted == True
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or not in trash"
        )
    
    db.delete(todo)
    db.commit()
    
    return None


# Todo Items (Subtasks) Routes
@router.get("/{todo_id}/items", response_model=List[TodoItemResponse])
async def get_todo_items(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all subtasks for a todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    user_key = get_user_encryption_key(current_user)
    items = []
    
    for item in todo.subtasks:
        try:
            title = decrypt_note_data(item.title_encrypted, item.title_nonce, item.title_tag, user_key)
            items.append(TodoItemResponse(
                id=item.id,
                todo_id=item.todo_id,
                title=title,
                is_completed=item.is_completed,
                order=item.order,
                created_at=item.created_at,
                updated_at=item.updated_at
            ))
        except Exception as e:
            import traceback
            print(f"Error decrypting todo item {item.id}: {str(e)}")
            traceback.print_exc()
            continue
    
    return items


@router.post("/{todo_id}/items", response_model=TodoItemResponse, status_code=status.HTTP_201_CREATED)
async def create_todo_item(
    todo_id: int,
    item_data: TodoItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new subtask for a todo"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id,
        Todo.is_deleted == False
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    user_key = get_user_encryption_key(current_user)
    
    # Encrypt item data
    try:
        title_encrypted, title_nonce, title_tag = encrypt_note_data(item_data.title, user_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to encrypt todo item: {str(e)}"
        )
    
    # Get max order if not provided
    if item_data.order is None:
        max_order = db.query(TodoItem).filter(TodoItem.todo_id == todo_id).count()
        item_data.order = max_order
    
    # Create item
    db_item = TodoItem(
        todo_id=todo_id,
        title_encrypted=title_encrypted,
        title_nonce=title_nonce,
        title_tag=title_tag,
        order=item_data.order
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return TodoItemResponse(
        id=db_item.id,
        todo_id=db_item.todo_id,
        title=item_data.title,
        is_completed=db_item.is_completed,
        order=db_item.order,
        created_at=db_item.created_at,
        updated_at=db_item.updated_at
    )


@router.put("/{todo_id}/items/{item_id}", response_model=TodoItemResponse)
async def update_todo_item(
    todo_id: int,
    item_id: int,
    item_update: TodoItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a subtask"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    item = db.query(TodoItem).filter(
        TodoItem.id == item_id,
        TodoItem.todo_id == todo_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo item not found"
        )
    
    user_key = get_user_encryption_key(current_user)
    
    # Update title if provided
    if item_update.title is not None:
        title_encrypted, title_nonce, title_tag = encrypt_note_data(item_update.title, user_key)
        item.title_encrypted = title_encrypted
        item.title_nonce = title_nonce
        item.title_tag = title_tag
    
    # Update other fields
    if item_update.is_completed is not None:
        item.is_completed = item_update.is_completed
    if item_update.order is not None:
        item.order = item_update.order
    
    db.commit()
    db.refresh(item)
    
    # Decrypt for response
    title = decrypt_note_data(item.title_encrypted, item.title_nonce, item.title_tag, user_key)
    
    return TodoItemResponse(
        id=item.id,
        todo_id=item.todo_id,
        title=title,
        is_completed=item.is_completed,
        order=item.order,
        created_at=item.created_at,
        updated_at=item.updated_at
    )


@router.delete("/{todo_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo_item(
    todo_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a subtask"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    item = db.query(TodoItem).filter(
        TodoItem.id == item_id,
        TodoItem.todo_id == todo_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo item not found"
        )
    
    db.delete(item)
    db.commit()
    
    return None


@router.post("/{todo_id}/items/{item_id}/complete")
async def toggle_item_complete(
    todo_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle complete status of a subtask"""
    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()
    
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    
    item = db.query(TodoItem).filter(
        TodoItem.id == item_id,
        TodoItem.todo_id == todo_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo item not found"
        )
    
    item.is_completed = not item.is_completed
    db.commit()
    
    return {"is_completed": item.is_completed}

