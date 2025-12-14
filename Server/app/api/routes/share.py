from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging
import traceback
from cryptography.exceptions import InvalidTag
from app.database import get_db
from app.models import Note, User, SharedNote
from app.schemas import (
    ShareNoteRequest, UpdateSharePermissionRequest,
    SharedNoteResponse, NoteResponse
)
from app.security import (
    decrypt_user_key, encrypt_note_data, decrypt_note_data,
    encrypt_user_key, settings
)
from app.api.deps import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


def get_user_encryption_key(user: User) -> bytes:
    """Get and decrypt user's encryption key"""
    from app.security import get_master_key_bytes
    
    logger.debug(f"get_user_encryption_key: user_id={user.id}, username={user.username}")
    logger.debug(f"encryption_key_encrypted exists: {user.encryption_key_encrypted is not None}, length: {len(user.encryption_key_encrypted) if user.encryption_key_encrypted else 0}")
    
    try:
        master_key = get_master_key_bytes()
        logger.debug(f"Master key retrieved: length={len(master_key)}")
        decrypted_key = decrypt_user_key(user.encryption_key_encrypted, master_key)
        logger.debug(f"User key decrypted successfully: user_id={user.id}, key_length={len(decrypted_key)}")
        return decrypted_key
    except InvalidTag as e:
        logger.error(f"InvalidTag in get_user_encryption_key: user_id={user.id}, username={user.username}")
        logger.error(f"encryption_key_encrypted preview: {user.encryption_key_encrypted[:100] if user.encryption_key_encrypted else 'None'}...")
        # Re-raise InvalidTag as-is so it can be caught specifically
        raise
    except ValueError as e:
        logger.error(f"ValueError in get_user_encryption_key: user_id={user.id}, error={str(e)}")
        # Re-raise ValueError with user context
        raise ValueError(f"User {user.id} ({user.username}): {str(e)}")
    except Exception as e:
        logger.error(f"Exception in get_user_encryption_key: user_id={user.id}, error={str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Wrap other exceptions
        raise Exception(f"User {user.id} ({user.username}): Failed to decrypt encryption key - {str(e)}")


@router.post("/{note_id}/share", response_model=SharedNoteResponse, status_code=status.HTTP_201_CREATED)
async def share_note(
    note_id: int,
    share_data: ShareNoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a note with another user"""
    logger.info(f"Share note request: note_id={note_id}, owner_id={current_user.id}, recipient_username={share_data.recipient_username}, permission={share_data.permission}")
    
    try:
        # Check note ownership
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id,
            Note.is_deleted == False
        ).first()
        
        if not note:
            logger.warning(f"Note not found: note_id={note_id}, owner_id={current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        logger.debug(f"Note found: note_id={note_id}, is_shared={note.is_shared}, category_id={note.category_id}")
        
        # Find recipient
        recipient = db.query(User).filter(
            User.username == share_data.recipient_username,
            User.is_active == True
        ).first()
        
        if not recipient:
            logger.warning(f"Recipient user not found: username={share_data.recipient_username}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.debug(f"Recipient found: recipient_id={recipient.id}, username={recipient.username}, is_active={recipient.is_active}")
        
        if recipient.id == current_user.id:
            logger.warning(f"Cannot share with self: user_id={current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot share note with yourself"
            )
        
        # Check if already shared
        existing = db.query(SharedNote).filter(
            SharedNote.original_note_id == note_id,
            SharedNote.recipient_id == recipient.id
        ).first()
        
        if existing:
            logger.warning(f"Note already shared: note_id={note_id}, recipient_id={recipient.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note already shared with this user"
            )
        
        # Get encryption keys
        logger.debug(f"Getting encryption key for owner: user_id={current_user.id}, username={current_user.username}")
        try:
            owner_key = get_user_encryption_key(current_user)
            logger.debug(f"Owner encryption key retrieved successfully: user_id={current_user.id}, key_length={len(owner_key)}")
        except InvalidTag as e:
            logger.error(f"InvalidTag error when decrypting owner key: user_id={current_user.id}, username={current_user.username}, error={str(e)}")
            logger.error(f"Owner encryption_key_encrypted length: {len(current_user.encryption_key_encrypted) if current_user.encryption_key_encrypted else 0}")
            logger.error("=" * 80)
            logger.error("CRITICAL: InvalidTag when decrypting owner encryption key")
            logger.error("This usually means:")
            logger.error("  1. MASTER_KEY has changed since the user was created")
            logger.error("  2. The user's encryption key was encrypted with a different master key")
            logger.error("  3. The .env file is missing or MASTER_KEY is not set (new key generated each restart)")
            logger.error("=" * 80)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Owner user's encryption key cannot be decrypted. This usually means the MASTER_KEY has changed since the user was created. Please ensure MASTER_KEY in .env file matches the key used when the user was registered. User ID: {current_user.id}, Username: {current_user.username}"
            )
        except (ValueError, Exception) as e:
            logger.error(f"Error decrypting owner encryption key: user_id={current_user.id}, error={str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to decrypt owner encryption key: {str(e)}"
            )
        
        logger.debug(f"Getting encryption key for recipient: user_id={recipient.id}, username={recipient.username}")
        try:
            recipient_key = get_user_encryption_key(recipient)
            logger.debug(f"Recipient encryption key retrieved successfully: user_id={recipient.id}, key_length={len(recipient_key)}")
        except InvalidTag as e:
            logger.error(f"InvalidTag error when decrypting recipient key: user_id={recipient.id}, username={recipient.username}, error={str(e)}")
            logger.error(f"Recipient encryption_key_encrypted length: {len(recipient.encryption_key_encrypted) if recipient.encryption_key_encrypted else 0}")
            logger.error(f"Recipient encryption_key_encrypted preview: {recipient.encryption_key_encrypted[:50] if recipient.encryption_key_encrypted else 'None'}...")
            logger.error("=" * 80)
            logger.error("CRITICAL: InvalidTag when decrypting user encryption key")
            logger.error("This usually means:")
            logger.error("  1. MASTER_KEY has changed since the user was created")
            logger.error("  2. The user's encryption key was encrypted with a different master key")
            logger.error("  3. The .env file is missing or MASTER_KEY is not set (new key generated each restart)")
            logger.error("=" * 80)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Recipient user's encryption key cannot be decrypted. This usually means the MASTER_KEY has changed since the user was created. Please ensure MASTER_KEY in .env file matches the key used when the user was registered. User ID: {recipient.id}, Username: {recipient.username}"
            )
        except (ValueError, Exception) as e:
            logger.error(f"Error decrypting recipient encryption key: user_id={recipient.id}, error={str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to decrypt recipient encryption key: {str(e)}"
            )
        
        # Decrypt note using owner's key
        logger.debug(f"Decrypting note data: note_id={note_id}")
        try:
            title = decrypt_note_data(note.title_encrypted, note.title_nonce, note.title_tag, owner_key)
            content = decrypt_note_data(note.content_encrypted, note.content_nonce, note.content_tag, owner_key)
            logger.debug(f"Note decrypted successfully: note_id={note_id}, title_length={len(title)}, content_length={len(content)}")
        except InvalidTag as e:
            logger.error(f"InvalidTag error when decrypting note: note_id={note_id}, error={str(e)}")
            logger.error(f"Note encryption data lengths: title_encrypted={len(note.title_encrypted)}, title_nonce={len(note.title_nonce)}, title_tag={len(note.title_tag)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt note data: Invalid encryption tag. The note may be corrupted."
            )
        except (ValueError, Exception) as e:
            logger.error(f"Error decrypting note data: note_id={note_id}, error={str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to decrypt note data: {str(e)}"
            )
        
        # Encrypt note using recipient's key
        logger.debug(f"Encrypting note data for recipient: recipient_id={recipient.id}")
        try:
            title_encrypted, title_nonce, title_tag = encrypt_note_data(title, recipient_key)
            content_encrypted, content_nonce, content_tag = encrypt_note_data(content, recipient_key)
            logger.debug(f"Note encrypted successfully for recipient: recipient_id={recipient.id}")
        except Exception as e:
            logger.error(f"Error encrypting note data for recipient: recipient_id={recipient.id}, error={str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to encrypt note data for recipient: {str(e)}"
            )
        
        # Create shared note copy
        logger.debug(f"Creating shared note copy: note_id={note_id}, recipient_id={recipient.id}")
        shared_note = Note(
            user_id=recipient.id,
            title_encrypted=title_encrypted,
            title_nonce=title_nonce,
            title_tag=title_tag,
            content_encrypted=content_encrypted,
            content_nonce=content_nonce,
            content_tag=content_tag,
            category_id=note.category_id,  # Copy category reference
            is_shared=True,
            original_note_id=note_id
        )
        db.add(shared_note)
        db.flush()  # Get shared_note.id
        logger.debug(f"Shared note created: shared_note_id={shared_note.id}")
        
        # Mark original note as shared
        note.is_shared = True
        
        # Create shared_note record
        shared_record = SharedNote(
            original_note_id=note_id,
            shared_note_id=shared_note.id,
            owner_id=current_user.id,
            recipient_id=recipient.id,
            permission=share_data.permission
        )
        db.add(shared_record)
        
        # Copy tags to shared note
        from app.models import NoteTag
        original_tags = db.query(NoteTag).filter(NoteTag.note_id == note_id).all()
        logger.debug(f"Copying tags: note_id={note_id}, tag_count={len(original_tags)}")
        for note_tag in original_tags:
            db.add(NoteTag(note_id=shared_note.id, tag_id=note_tag.tag_id))
        
        db.commit()
        db.refresh(shared_record)
        
        logger.info(f"Note shared successfully: note_id={note_id}, shared_note_id={shared_note.id}, owner_id={current_user.id}, recipient_id={recipient.id}, permission={share_data.permission}")
        return shared_record
        
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error in share_note: note_id={note_id}, error={str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while sharing the note: {str(e)}"
        )


@router.get("/shared", response_model=list[NoteResponse])
async def get_shared_notes(
    permission: Optional[str] = Query(None, description="Filter by permission: 'read' or 'write'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notes shared with current user"""
    # Validate permission if provided
    if permission and permission not in ["read", "write"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Permission must be 'read' or 'write'"
        )
    
    query = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_shared == True,
        Note.is_deleted == False
    )
    
    # Filter by permission if provided
    if permission:
        shared_records = db.query(SharedNote).filter(
            SharedNote.recipient_id == current_user.id,
            SharedNote.permission == permission
        ).all()
        shared_note_ids = [sr.shared_note_id for sr in shared_records]
        query = query.filter(Note.id.in_(shared_note_ids))
    
    notes = query.all()
    
    # Decrypt notes
    user_key = get_user_encryption_key(current_user)
    decrypted_notes = []
    
    for note in notes:
        try:
            title = decrypt_note_data(note.title_encrypted, note.title_nonce, note.title_tag, user_key)
            content = decrypt_note_data(note.content_encrypted, note.content_nonce, note.content_tag, user_key)
            
            # Get owner info from shared_notes
            shared_record = db.query(SharedNote).filter(
                SharedNote.shared_note_id == note.id
            ).first()
            
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
        except Exception:
            continue
    
    return decrypted_notes


@router.get("/shared-by-me", response_model=list[SharedNoteResponse])
async def get_shared_by_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notes that current user has shared"""
    shared_records = db.query(SharedNote).filter(
        SharedNote.owner_id == current_user.id
    ).all()
    
    return shared_records


@router.put("/{note_id}/share/{recipient_id}")
async def update_share_permission(
    note_id: int,
    recipient_id: int,
    permission_data: UpdateSharePermissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update share permission"""
    # Check note ownership
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Find shared note record
    shared_record = db.query(SharedNote).filter(
        SharedNote.original_note_id == note_id,
        SharedNote.recipient_id == recipient_id,
        SharedNote.owner_id == current_user.id
    ).first()
    
    if not shared_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared note not found"
        )
    
    shared_record.permission = permission_data.permission
    db.commit()
    db.refresh(shared_record)
    
    return shared_record


@router.delete("/{note_id}/share/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unshare_note(
    note_id: int,
    recipient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unshare a note"""
    # Check note ownership
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Find shared note record
    shared_record = db.query(SharedNote).filter(
        SharedNote.original_note_id == note_id,
        SharedNote.recipient_id == recipient_id,
        SharedNote.owner_id == current_user.id
    ).first()
    
    if not shared_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared note not found"
        )
    
    # Delete shared note copy
    shared_note = db.query(Note).filter(Note.id == shared_record.shared_note_id).first()
    if shared_note:
        db.delete(shared_note)
    
    # Delete shared record
    db.delete(shared_record)
    
    # Check if note is still shared with others
    remaining_shares = db.query(SharedNote).filter(
        SharedNote.original_note_id == note_id
    ).count()
    
    if remaining_shares == 0:
        note.is_shared = False
    
    db.commit()
    
    return None


