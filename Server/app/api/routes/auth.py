from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from app.database import get_db
from app.models import User, RefreshToken
from app.schemas import (
    UserCreate, UserResponse, Token, LoginRequest, ChangePasswordRequest,
    TwoFactorSetupResponse, TwoFactorVerifyRequest, TwoFactorEnableRequest,
    TwoFactorEnableNewRequest, Login2FARequest, BackupCodesResponse, Disable2FARequest
)
from app.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    verify_token, generate_aes_key, encrypt_user_key, decrypt_user_key,
    generate_totp_secret, generate_totp_qr_code, verify_totp_code,
    generate_backup_codes, hash_backup_codes, verify_backup_code,
    settings
)
from app.api.deps import get_current_user
from app.middleware.rate_limit import limiter
from fastapi import Request

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Generate encryption key for user
    user_key = generate_aes_key()
    from app.security import get_master_key_bytes
    master_key = get_master_key_bytes()
    
    encrypted_key = encrypt_user_key(user_key, master_key)
    
    # Create user
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        encryption_key_encrypted=encrypted_key,
        two_factor_enabled=False  # Will be enabled after setup
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login - returns tokens or requires_2fa flag"""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Check if 2FA is enabled - MANDATORY for all users
    if not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="2FA is required. Please setup 2FA first."
        )
    
    # Return requires_2fa flag - user must provide 2FA code
    return {
        "requires_2fa": True,
        "message": "2FA code required"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    token = credentials.credentials
    payload = verify_token(token, token_type="refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Check if refresh token exists in database
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.user_id == user_id
    ).first()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Update refresh token in database
    db_token.token = new_refresh_token
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout - invalidate refresh tokens"""
    # Delete all refresh tokens for user
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).delete()
    db.commit()
    
    return {"message": "Logged out successfully"}


# 2FA Endpoints
@router.post("/2fa/setup-new", response_model=TwoFactorSetupResponse)
@limiter.limit("5/hour")
async def setup_2fa_new(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Setup 2FA for new users (no auth required, verify with username/password)"""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    # Generate TOTP secret
    secret = generate_totp_secret()
    
    # Generate QR code URL
    qr_code_url = generate_totp_qr_code(secret, user.username)
    
    # Generate backup codes
    backup_codes = generate_backup_codes(10)
    
    # Store secret temporarily (will be enabled after verification)
    user.two_factor_secret = secret
    user.two_factor_backup_codes = hash_backup_codes(backup_codes)
    db.commit()
    
    return {
        "secret": secret,
        "qr_code_url": qr_code_url,
        "backup_codes": backup_codes
    }


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
@limiter.limit("5/hour")
async def setup_2fa(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Setup 2FA - generate secret and QR code (for authenticated users)"""
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    # Generate TOTP secret
    secret = generate_totp_secret()
    
    # Generate QR code URL
    qr_code_url = generate_totp_qr_code(secret, current_user.username)
    
    # Generate backup codes
    backup_codes = generate_backup_codes(10)
    
    # Store secret temporarily (will be enabled after verification)
    current_user.two_factor_secret = secret
    current_user.two_factor_backup_codes = hash_backup_codes(backup_codes)
    db.commit()
    
    return {
        "secret": secret,
        "qr_code_url": qr_code_url,
        "backup_codes": backup_codes
    }


@router.post("/2fa/enable-new")
@limiter.limit("5/minute")
async def enable_2fa_new(
    request: Request,
    enable_data: TwoFactorEnableNewRequest,
    db: Session = Depends(get_db)
):
    """Enable 2FA for new users (no auth required)"""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == enable_data.username) | (User.email == enable_data.username)
    ).first()
    
    if not user or not verify_password(enable_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not set up. Please call /auth/2fa/setup-new first"
        )
    
    if user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    # Verify the code
    if not verify_totp_code(user.two_factor_secret, enable_data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code"
        )
    
    # Enable 2FA
    user.two_factor_enabled = True
    db.commit()
    
    return {"message": "2FA enabled successfully"}


@router.post("/2fa/enable")
@limiter.limit("5/minute")
async def enable_2fa(
    request: Request,
    enable_data: TwoFactorEnableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable 2FA after verifying first code (for authenticated users)"""
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not set up. Please call /auth/2fa/setup first"
        )
    
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    # Verify the code
    if not verify_totp_code(current_user.two_factor_secret, enable_data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code"
        )
    
    # Enable 2FA
    current_user.two_factor_enabled = True
    db.commit()
    
    return {"message": "2FA enabled successfully"}


@router.post("/login/2fa", response_model=Token)
@limiter.limit("5/minute")
async def login_with_2fa(
    request: Request,
    login_data: Login2FARequest,
    db: Session = Depends(get_db)
):
    """Login with 2FA code or backup code"""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    if not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account"
        )
    
    # Verify 2FA code or backup code
    verified = False
    updated_backup_codes = user.two_factor_backup_codes
    
    if login_data.code:
        # Verify TOTP code
        if not user.two_factor_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="2FA secret not found"
            )
        verified = verify_totp_code(user.two_factor_secret, login_data.code)
    elif login_data.backup_code:
        # Verify backup code
        if not user.two_factor_backup_codes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No backup codes available"
            )
        verified, updated_backup_codes = verify_backup_code(
            login_data.backup_code,
            user.two_factor_backup_codes
        )
        if verified:
            # Update backup codes (remove used one)
            user.two_factor_backup_codes = updated_backup_codes
            db.commit()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either code or backup_code is required"
        )
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code or backup code"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Store refresh token
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/2fa/backup-codes", response_model=BackupCodesResponse)
async def get_backup_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get backup codes (only when 2FA is enabled)"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    # Backup codes are only shown once during setup
    # If user needs new codes, they should regenerate
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Backup codes are only shown during initial setup. Please disable and re-enable 2FA to get new codes."
    )


@router.post("/2fa/disable")
@limiter.limit("5/hour")
async def disable_2fa(
    request: Request,
    disable_data: Disable2FARequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA (requires password)"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    # Verify password
    if not verify_password(disable_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Disable 2FA
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.two_factor_backup_codes = None
    db.commit()
    
    return {"message": "2FA disabled successfully"}


# Biometric Endpoints
@router.put("/biometric/enable")
async def enable_biometric(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable biometric login"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA must be enabled before enabling biometric login"
        )
    
    current_user.biometric_enabled = True
    db.commit()
    
    return {"message": "Biometric login enabled"}


@router.put("/biometric/disable")
async def disable_biometric(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable biometric login"""
    current_user.biometric_enabled = False
    db.commit()
    
    return {"message": "Biometric login disabled"}
