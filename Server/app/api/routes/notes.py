from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from app.database import get_db
from app.models import Note, User, Category, Tag, NoteTag
from app.schemas import NoteCreate, NoteUpdate, NoteResponse
from app.security import (
    decrypt_user_key, encrypt_note_data, decrypt_note_data, settings
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
        # Re-raise ValueError with user context
        raise ValueError(f"User {user.id} ({user.username}): {str(e)}")
    except InvalidTag as e:
        # Re-raise InvalidTag with user context
        raise InvalidTag(f"User {user.id} ({user.username}): Encryption key decryption failed - invalid tag. This usually means the master key has changed or the user's key is corrupted.")
    except Exception as e:
        # Wrap other exceptions
        raise Exception(f"User {user.id} ({user.username}): Failed to decrypt encryption key - {str(e)}")


@router.get("", response_model=List[NoteResponse])
async def get_notes(
    category_id: Optional[int] = None,
    tag_ids: Optional[str] = None,  # Comma-separated string
    favorite: Optional[bool] = None,
    search: Optional[str] = None,
    is_deleted: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notes with filters"""
    query = db.query(Note).filter(Note.user_id == current_user.id)
    
    # Filter by is_deleted
    query = query.filter(Note.is_deleted == is_deleted)
    
    # Filter by category
    if category_id:
        query = query.filter(Note.category_id == category_id)
    
    # Filter by favorite
    if favorite is not None:
        query = query.filter(Note.is_favorite == favorite)
    
    # Filter by tags
    if tag_ids:
        tag_id_list = [int(tid) for tid in tag_ids.split(",") if tid.strip()]
        if tag_id_list:
            query = query.join(NoteTag).filter(NoteTag.tag_id.in_(tag_id_list))
    
    notes = query.all()
    
    # Decrypt notes
    try:
        user_key = get_user_encryption_key(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user encryption key: {str(e)}"
        )
    
    decrypted_notes = []
    
    for note in notes:
        try:
            title = decrypt_note_data(note.title_encrypted, note.title_nonce, note.title_tag, user_key)
            content = decrypt_note_data(note.content_encrypted, note.content_nonce, note.content_tag, user_key)
            
            # Filter by search keyword in plaintext
            if search:
                search_lower = search.lower()
                if search_lower not in title.lower() and search_lower not in content.lower():
                    continue
            
            # Create response with decrypted data
            note_dict = {
                "id": note.id,
                "user_id": note.user_id,
                "title": title,
                "content": content,
                "category_id": note.category_id,
                "is_favorite": note.is_favorite,
                "is_deleted": note.is_deleted,
                "deleted_at": note.deleted_at,
                "is_shared": note.is_shared,
                "original_note_id": note.original_note_id,
                "created_at": note.created_at,
                "updated_at": note.updated_at,
                "tag_ids": [tag.id for tag in note.tags],
                "category": note.category,
                "tags": note.tags
            }
            decrypted_notes.append(NoteResponse(**note_dict))
        except Exception as e:
            # Skip notes that can't be decrypted
            import traceback
            print(f"Error decrypting note {note.id}: {str(e)}")
            traceback.print_exc()
            continue
    
    return decrypted_notes


@router.get("/trash", response_model=List[NoteResponse])
async def get_trash_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get deleted notes (trash)"""
    return await get_notes(is_deleted=True, current_user=current_user, db=db)


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get note by ID"""
    note = db.query(Note).filter(
        Note.id == note_id,
        or_(
            Note.user_id == current_user.id,
            and_(Note.is_shared == True, Note.user_id == current_user.id)
        )
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Decrypt note
    user_key = get_user_encryption_key(current_user)
    try:
        title = decrypt_note_data(note.title_encrypted, note.title_nonce, note.title_tag, user_key)
        content = decrypt_note_data(note.content_encrypted, note.content_nonce, note.content_tag, user_key)
        
        note_dict = {
            "id": note.id,
            "user_id": note.user_id,
            "title": title,
            "content": content,
            "category_id": note.category_id,
            "is_favorite": note.is_favorite,
            "is_deleted": note.is_deleted,
            "deleted_at": note.deleted_at,
            "is_shared": note.is_shared,
            "original_note_id": note.original_note_id,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
            "tag_ids": [tag.id for tag in note.tags],
            "category": note.category,
            "tags": note.tags
        }
        return NoteResponse(**note_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt note"
        )


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new note"""
    # Validate category if provided
    if note_data.category_id:
        category = db.query(Category).filter(
            Category.id == note_data.category_id,
            Category.user_id == current_user.id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Validate tags if provided
    if note_data.tag_ids:
        tags = db.query(Tag).filter(
            Tag.id.in_(note_data.tag_ids),
            Tag.user_id == current_user.id
        ).all()
        if len(tags) != len(note_data.tag_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more tags not found"
            )
    
    # Get user encryption key
    try:
        user_key = get_user_encryption_key(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user encryption key: {str(e)}"
        )
    
    # Encrypt note data
    try:
        title_encrypted, title_nonce, title_tag = encrypt_note_data(note_data.title, user_key)
        content_encrypted, content_nonce, content_tag = encrypt_note_data(note_data.content, user_key)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to encrypt note: {str(e)}"
        )
    
    # Create note
    db_note = Note(
        user_id=current_user.id,
        title_encrypted=title_encrypted,
        title_nonce=title_nonce,
        title_tag=title_tag,
        content_encrypted=content_encrypted,
        content_nonce=content_nonce,
        content_tag=content_tag,
        category_id=note_data.category_id
    )
    db.add(db_note)
    db.flush()  # Get note ID
    
    # Add tags
    if note_data.tag_ids:
        for tag_id in note_data.tag_ids:
            db.add(NoteTag(note_id=db_note.id, tag_id=tag_id))
    
    db.commit()
    db.refresh(db_note)
    
    # Return decrypted note
    note_dict = {
        "id": db_note.id,
        "user_id": db_note.user_id,
        "title": note_data.title,
        "content": note_data.content,
        "category_id": db_note.category_id,
        "is_favorite": db_note.is_favorite,
        "is_deleted": db_note.is_deleted,
        "deleted_at": db_note.deleted_at,
        "is_shared": db_note.is_shared,
        "original_note_id": db_note.original_note_id,
        "created_at": db_note.created_at,
        "updated_at": db_note.updated_at,
        "tag_ids": note_data.tag_ids or [],
        "category": db_note.category,
        "tags": db_note.tags
    }
    return NoteResponse(**note_dict)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a note"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
        Note.is_deleted == False
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Check if note is shared and user has write permission
    if note.is_shared:
        # Check permission in shared_notes table
        from app.models import SharedNote
        shared = db.query(SharedNote).filter(
            SharedNote.shared_note_id == note_id,
            SharedNote.recipient_id == current_user.id
        ).first()
        if shared and shared.permission != "write":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No write permission for this shared note"
            )
    
    user_key = get_user_encryption_key(current_user)
    
    # Decrypt current note to get values if not provided
    current_title = decrypt_note_data(note.title_encrypted, note.title_nonce, note.title_tag, user_key)
    current_content = decrypt_note_data(note.content_encrypted, note.content_nonce, note.content_tag, user_key)
    
    # Update fields
    title = note_update.title if note_update.title is not None else current_title
    content = note_update.content if note_update.content is not None else current_content
    
    # Re-encrypt if title or content changed
    if note_update.title is not None or note_update.content is not None:
        title_encrypted, title_nonce, title_tag = encrypt_note_data(title, user_key)
        content_encrypted, content_nonce, content_tag = encrypt_note_data(content, user_key)
        
        note.title_encrypted = title_encrypted
        note.title_nonce = title_nonce
        note.title_tag = title_tag
        note.content_encrypted = content_encrypted
        note.content_nonce = content_nonce
        note.content_tag = content_tag
    
    # Update category
    if note_update.category_id is not None:
        if note_update.category_id == 0:  # Remove category
            note.category_id = None
        else:
            category = db.query(Category).filter(
                Category.id == note_update.category_id,
                Category.user_id == current_user.id
            ).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            note.category_id = note_update.category_id
    
    # Update tags
    if note_update.tag_ids is not None:
        # Remove existing tags
        db.query(NoteTag).filter(NoteTag.note_id == note_id).delete()
        # Add new tags
        if note_update.tag_ids:
            tags = db.query(Tag).filter(
                Tag.id.in_(note_update.tag_ids),
                Tag.user_id == current_user.id
            ).all()
            if len(tags) != len(note_update.tag_ids):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="One or more tags not found"
                )
            for tag_id in note_update.tag_ids:
                db.add(NoteTag(note_id=note_id, tag_id=tag_id))
    
    db.commit()
    db.refresh(note)
    
    # Return decrypted note
    note_dict = {
        "id": note.id,
        "user_id": note.user_id,
        "title": title,
        "content": content,
        "category_id": note.category_id,
        "is_favorite": note.is_favorite,
        "is_deleted": note.is_deleted,
        "deleted_at": note.deleted_at,
        "is_shared": note.is_shared,
        "original_note_id": note.original_note_id,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
        "tag_ids": [tag.id for tag in note.tags],
        "category": note.category,
        "tags": note.tags
    }
    return NoteResponse(**note_dict)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a note (move to trash)"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    from datetime import datetime
    note.is_deleted = True
    note.deleted_at = datetime.now()
    db.commit()
    
    return None


@router.post("/{note_id}/favorite")
async def toggle_favorite(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status of a note"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
        Note.is_deleted == False
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    note.is_favorite = not note.is_favorite
    db.commit()
    
    return {"is_favorite": note.is_favorite}


@router.post("/{note_id}/restore", response_model=NoteResponse)
async def restore_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore a note from trash"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
        Note.is_deleted == True
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found or not in trash"
        )
    
    note.is_deleted = False
    note.deleted_at = None
    db.commit()
    db.refresh(note)
    
    # Return decrypted note
    user_key = get_user_encryption_key(current_user)
    title = decrypt_note_data(note.title_encrypted, note.title_nonce, note.title_tag, user_key)
    content = decrypt_note_data(note.content_encrypted, note.content_nonce, note.content_tag, user_key)
    
    note_dict = {
        "id": note.id,
        "user_id": note.user_id,
        "title": title,
        "content": content,
        "category_id": note.category_id,
        "is_favorite": note.is_favorite,
        "is_deleted": note.is_deleted,
        "deleted_at": note.deleted_at,
        "is_shared": note.is_shared,
        "original_note_id": note.original_note_id,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
        "tag_ids": [tag.id for tag in note.tags],
        "category": note.category,
        "tags": note.tags
    }
    return NoteResponse(**note_dict)


@router.delete("/{note_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanent_delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete a note"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
        Note.is_deleted == True
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found or not in trash"
        )
    
    db.delete(note)
    db.commit()
    
    return None

