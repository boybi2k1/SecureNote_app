from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RefreshToken
from app.schemas import (
    UserResponse, UserUpdate, ChangePasswordRequest,
    UserSettings, UserSettingsResponse, UserSearchResponse
)
from app.security import hash_password, verify_password
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    # Check if username is being changed and already exists
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_update.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = user_update.username
    
    # Check if email is being changed and already exists
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
        current_user.email = user_update.email
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_hashed_password = hash_password(password_data.new_password)
    current_user.hashed_password = new_hashed_password
    
    # Invalidate all refresh tokens (force re-login)
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).delete()
    
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/me/settings", response_model=UserSettingsResponse)
async def get_user_settings(current_user: User = Depends(get_current_user)):
    """Get user settings"""
    # For now, return default settings
    # In future, can store in database
    return UserSettings()


@router.put("/me/settings", response_model=UserSettingsResponse)
async def update_user_settings(
    settings: UserSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    # For now, just return the settings
    # In future, can store in database
    return settings


@router.get("/search", response_model=list[UserSearchResponse])
async def search_users(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users by username (for sharing)"""
    if len(q) < 3:
        return []
    
    users = db.query(User).filter(
        User.username.ilike(f"%{q}%"),
        User.id != current_user.id,
        User.is_active == True
    ).limit(10).all()
    
    return [UserSearchResponse(username=user.username) for user in users]


















