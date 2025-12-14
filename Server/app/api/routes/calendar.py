from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models import Todo, Note, User
from app.schemas import TodoResponse
from app.api.deps import get_current_user
from app.security import decrypt_user_key, decrypt_note_data, get_master_key_bytes

router = APIRouter()


def get_user_encryption_key(user: User) -> bytes:
    """Get and decrypt user's encryption key"""
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


@router.get("/events")
async def get_calendar_events(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    include_todos: bool = Query(True, description="Include todos in events"),
    include_notes: bool = Query(False, description="Include notes in events"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get calendar events (todos and/or notes) for a date range.
    """
    # Parse dates
    start = None
    end = None
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )
    
    # Default to current month if not provided
    if not start:
        today = date.today()
        start = today.replace(day=1)
    if not end:
        if start:
            # Last day of start month
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = start.replace(month=start.month + 1, day=1) - timedelta(days=1)
        else:
            today = date.today()
            if today.month == 12:
                end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    
    events = []
    user_key = get_user_encryption_key(current_user)
    
    # Get todos with due_date in range
    if include_todos:
        todos_query = db.query(Todo).filter(
            Todo.user_id == current_user.id,
            Todo.is_deleted == False,
            Todo.due_date.isnot(None)
        )
        
        if start and end:
            todos_query = todos_query.filter(
                Todo.due_date >= datetime.combine(start, datetime.min.time()),
                Todo.due_date <= datetime.combine(end, datetime.max.time())
            )
        
        todos = todos_query.all()
        
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
                
                # Determine color based on priority
                color_map = {
                    "low": "#4CAF50",
                    "medium": "#FF9800",
                    "high": "#F44336",
                    "urgent": "#9C27B0"
                }
                color = color_map.get(todo.priority, "#2196F3")
                
                events.append({
                    "id": f"todo_{todo.id}",
                    "date": todo.due_date.isoformat() if todo.due_date else None,
                    "type": "todo",
                    "title": title,
                    "description": description,
                    "linked_id": todo.id,
                    "color": color,
                    "is_completed": todo.is_completed,
                    "priority": todo.priority,
                    "category": todo.category.name if todo.category else None,
                    "category_color": todo.category.color if todo.category else None,
                })
            except Exception as e:
                print(f"Error processing todo {todo.id}: {str(e)}")
                continue
    
    # Get notes created in range (optional)
    if include_notes:
        notes_query = db.query(Note).filter(
            Note.user_id == current_user.id,
            Note.is_deleted == False
        )
        
        if start and end:
            notes_query = notes_query.filter(
                Note.created_at >= datetime.combine(start, datetime.min.time()),
                Note.created_at <= datetime.combine(end, datetime.max.time())
            )
        
        notes = notes_query.all()
        
        for note in notes:
            try:
                title = decrypt_note_data(note.title_encrypted, note.title_nonce, note.title_tag, user_key)
                
                events.append({
                    "id": f"note_{note.id}",
                    "date": note.created_at.isoformat() if note.created_at else None,
                    "type": "note",
                    "title": title,
                    "description": None,
                    "linked_id": note.id,
                    "color": "#2196F3",
                    "is_completed": None,
                    "priority": None,
                    "category": note.category.name if note.category else None,
                    "category_color": note.category.color if note.category else None,
                })
            except Exception as e:
                print(f"Error processing note {note.id}: {str(e)}")
                continue
    
    # Sort by date
    events.sort(key=lambda x: x["date"] if x["date"] else "")
    
    return {
        "start_date": start.isoformat() if start else None,
        "end_date": end.isoformat() if end else None,
        "events": events,
        "count": len(events)
    }

