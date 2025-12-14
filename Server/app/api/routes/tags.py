from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import Tag, User, Note, NoteTag
from app.schemas import TagCreate, TagResponse
from app.api.deps import get_current_user

router = APIRouter()


class AddTagsRequest(BaseModel):
    tag_ids: Optional[List[int]] = None
    tag_id: Optional[int] = None  # For single tag


@router.get("", response_model=list[TagResponse])
async def get_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tags for current user"""
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).all()
    return tags


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tag or return existing one"""
    # Check if tag already exists
    existing = db.query(Tag).filter(
        Tag.user_id == current_user.id,
        Tag.name == tag_data.name
    ).first()
    
    if existing:
        return existing  # Return existing tag instead of creating duplicate
    
    db_tag = Tag(
        user_id=current_user.id,
        name=tag_data.name
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return db_tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a tag (will be removed from all notes via CASCADE)"""
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    db.delete(tag)
    db.commit()
    
    return None


@router.post("/notes/{note_id}/tags", status_code=status.HTTP_200_OK)
async def add_tags_to_note(
    note_id: int,
    request: AddTagsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add tags to a note"""
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
    
    # Determine tag IDs
    tag_ids = []
    if request.tag_ids:
        tag_ids = request.tag_ids
    elif request.tag_id:
        tag_ids = [request.tag_id]
    
    if not tag_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tags provided"
        )
    
    # Validate tags belong to user
    tags = db.query(Tag).filter(
        Tag.id.in_(tag_ids),
        Tag.user_id == current_user.id
    ).all()
    
    if len(tags) != len(tag_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more tags not found"
        )
    
    # Add tags (skip if already exists)
    for tag_id in tag_ids:
        existing = db.query(NoteTag).filter(
            NoteTag.note_id == note_id,
            NoteTag.tag_id == tag_id
        ).first()
        if not existing:
            db.add(NoteTag(note_id=note_id, tag_id=tag_id))
    
    db.commit()
    
    return {"message": "Tags added successfully"}


@router.delete("/notes/{note_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag_from_note(
    note_id: int,
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a tag from a note"""
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
    
    # Remove tag
    note_tag = db.query(NoteTag).filter(
        NoteTag.note_id == note_id,
        NoteTag.tag_id == tag_id
    ).first()
    
    if note_tag:
        db.delete(note_tag)
        db.commit()
    
    return None


















