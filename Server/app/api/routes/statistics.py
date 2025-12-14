from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional
from datetime import datetime, timedelta, date
from app.database import get_db
from app.models import Todo, Note, User, Category, Tag
from app.api.deps import get_current_user
from app.security import decrypt_user_key, decrypt_note_data, get_master_key_bytes
from pydantic import BaseModel
from typing import List, Dict, Union

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


class StatisticsResponse(BaseModel):
    # Notes statistics
    total_notes: int
    total_notes_this_week: int
    total_notes_this_month: int
    favorite_notes: int
    shared_notes: int
    
    # Todos statistics
    total_todos: int
    completed_todos: int
    pending_todos: int
    in_progress_todos: int
    completion_rate: float
    total_todos_this_week: int
    total_todos_this_month: int
    completed_todos_this_week: int
    completed_todos_this_month: int
    
    # Priority distribution
    todos_by_priority: Dict[str, int]
    
    # Category distribution
    notes_by_category: Dict[str, int]
    todos_by_category: Dict[str, int]
    
    # Activity over time
    notes_created_last_7_days: List[Dict[str, Union[str, int]]]
    todos_completed_last_7_days: List[Dict[str, Union[str, int]]]
    
    # Recent activity
    recent_notes_count: int
    recent_todos_count: int


@router.get("/dashboard", response_model=StatisticsResponse)
async def get_dashboard_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive statistics for dashboard
    """
    now = datetime.now()
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Notes statistics
    total_notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_deleted == False
    ).count()
    
    notes_this_week = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_deleted == False,
        Note.created_at >= datetime.combine(week_ago, datetime.min.time())
    ).count()
    
    notes_this_month = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_deleted == False,
        Note.created_at >= datetime.combine(month_ago, datetime.min.time())
    ).count()
    
    favorite_notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_deleted == False,
        Note.is_favorite == True
    ).count()
    
    shared_notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_deleted == False,
        Note.is_shared == True
    ).count()
    
    # Todos statistics
    total_todos = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False
    ).count()
    
    completed_todos = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.is_completed == True
    ).count()
    
    pending_todos = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.status == "pending",
        Todo.is_completed == False
    ).count()
    
    in_progress_todos = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.status == "in_progress",
        Todo.is_completed == False
    ).count()
    
    completion_rate = (completed_todos / total_todos * 100) if total_todos > 0 else 0.0
    
    todos_this_week = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.created_at >= datetime.combine(week_ago, datetime.min.time())
    ).count()
    
    todos_this_month = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.created_at >= datetime.combine(month_ago, datetime.min.time())
    ).count()
    
    completed_todos_this_week = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.is_completed == True,
        Todo.completed_at >= datetime.combine(week_ago, datetime.min.time())
    ).count()
    
    completed_todos_this_month = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.is_completed == True,
        Todo.completed_at >= datetime.combine(month_ago, datetime.min.time())
    ).count()
    
    # Priority distribution
    todos_by_priority = {
        "low": db.query(Todo).filter(
            Todo.user_id == current_user.id,
            Todo.is_deleted == False,
            Todo.priority == "low"
        ).count(),
        "medium": db.query(Todo).filter(
            Todo.user_id == current_user.id,
            Todo.is_deleted == False,
            Todo.priority == "medium"
        ).count(),
        "high": db.query(Todo).filter(
            Todo.user_id == current_user.id,
            Todo.is_deleted == False,
            Todo.priority == "high"
        ).count(),
        "urgent": db.query(Todo).filter(
            Todo.user_id == current_user.id,
            Todo.is_deleted == False,
            Todo.priority == "urgent"
        ).count(),
    }
    
    # Category distribution for notes
    notes_by_category = {}
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    for category in categories:
        count = db.query(Note).filter(
            Note.user_id == current_user.id,
            Note.is_deleted == False,
            Note.category_id == category.id
        ).count()
        if count > 0:
            notes_by_category[category.name] = count
    
    # Category distribution for todos
    todos_by_category = {}
    for category in categories:
        count = db.query(Todo).filter(
            Todo.user_id == current_user.id,
            Todo.is_deleted == False,
            Todo.category_id == category.id
        ).count()
        if count > 0:
            todos_by_category[category.name] = count
    
    # Activity over last 7 days
    notes_created_last_7_days = []
    todos_completed_last_7_days = []
    
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        notes_count = db.query(Note).filter(
            Note.user_id == current_user.id,
            Note.is_deleted == False,
            Note.created_at >= day_start,
            Note.created_at <= day_end
        ).count()
        
        todos_count = db.query(Todo).filter(
            Todo.user_id == current_user.id,
            Todo.is_deleted == False,
            Todo.is_completed == True,
            Todo.completed_at >= day_start,
            Todo.completed_at <= day_end
        ).count()
        
        notes_created_last_7_days.append({
            "date": day.isoformat(),
            "count": notes_count
        })
        
        todos_completed_last_7_days.append({
            "date": day.isoformat(),
            "count": todos_count
        })
    
    # Recent activity (last 24 hours)
    yesterday = now - timedelta(days=1)
    recent_notes_count = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_deleted == False,
        Note.created_at >= yesterday
    ).count()
    
    recent_todos_count = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.is_deleted == False,
        Todo.created_at >= yesterday
    ).count()
    
    return StatisticsResponse(
        total_notes=total_notes,
        total_notes_this_week=notes_this_week,
        total_notes_this_month=notes_this_month,
        favorite_notes=favorite_notes,
        shared_notes=shared_notes,
        total_todos=total_todos,
        completed_todos=completed_todos,
        pending_todos=pending_todos,
        in_progress_todos=in_progress_todos,
        completion_rate=round(completion_rate, 2),
        total_todos_this_week=todos_this_week,
        total_todos_this_month=todos_this_month,
        completed_todos_this_week=completed_todos_this_week,
        completed_todos_this_month=completed_todos_this_month,
        todos_by_priority=todos_by_priority,
        notes_by_category=notes_by_category,
        todos_by_category=todos_by_category,
        notes_created_last_7_days=notes_created_last_7_days,
        todos_completed_last_7_days=todos_completed_last_7_days,
        recent_notes_count=recent_notes_count,
        recent_todos_count=recent_todos_count,
    )

