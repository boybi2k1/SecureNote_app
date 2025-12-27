from datetime import datetime, timedelta
from typing import Optional, List
import logging
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
import base64
import secrets
import json
import pyotp
import qrcode
from io import BytesIO
from app.config import settings

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_master_key_bytes() -> bytes:
    """
    Get master key as bytes (32 bytes for AES-256)
    Handles both base64-encoded and raw string formats
    """
    master_key_str = settings.MASTER_KEY
    
    if not master_key_str:
        logger.error("MASTER_KEY is empty! This will cause all encryption/decryption to fail.")
        raise ValueError("MASTER_KEY is not set. Please set it in .env file.")
    
    # Try to decode as base64 first
    try:
        # Add padding if needed for base64
        padding = 4 - (len(master_key_str) % 4)
        if padding != 4:
            master_key_str_padded = master_key_str + '=' * padding
        else:
            master_key_str_padded = master_key_str
        
        decoded = base64.b64decode(master_key_str_padded.encode('utf-8'))
        logger.debug(f"get_master_key_bytes: Decoded from base64, length={len(decoded)}")
        
        if len(decoded) >= 32:
            return decoded[:32]
        elif len(decoded) > 0:
            # Pad to 32 bytes if decoded length is less than 32
            logger.warning(f"get_master_key_bytes: Decoded key length ({len(decoded)}) < 32, padding to 32 bytes")
            return decoded.ljust(32, b'\x00')
        else:
            raise ValueError("Decoded master key is empty")
    except Exception as e:
        logger.warning(f"get_master_key_bytes: Base64 decode failed ({str(e)}), treating as raw string")
        # If not base64, treat as raw string
        master_bytes = master_key_str.encode('utf-8')
        if len(master_bytes) >= 32:
            return master_bytes[:32]
        else:
            logger.warning(f"get_master_key_bytes: Raw key length ({len(master_bytes)}) < 32, padding to 32 bytes")
            return master_bytes.ljust(32, b'\x00')


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def generate_aes_key() -> bytes:
    """Generate a random 256-bit (32 bytes) AES key"""
    return os.urandom(32)


def encrypt_user_key(user_key: bytes, master_key: bytes) -> str:
    """Encrypt user's encryption key using master key"""
    aesgcm = AESGCM(master_key)
    nonce = os.urandom(12)  # 96 bits for GCM
    encrypted = aesgcm.encrypt(nonce, user_key, None)
    # Store as base64: nonce (12 bytes) + encrypted (32 bytes + 16 bytes tag)
    combined = nonce + encrypted
    return base64.b64encode(combined).decode('utf-8')


def decrypt_user_key(encrypted_key: str, master_key: bytes) -> bytes:
    """Decrypt user's encryption key using master key"""
    from cryptography.exceptions import InvalidTag
    
    logger.debug(f"decrypt_user_key: encrypted_key_length={len(encrypted_key) if encrypted_key else 0}, master_key_length={len(master_key)}")
    
    try:
        # Validate input
        if not encrypted_key or not isinstance(encrypted_key, str):
            logger.error(f"decrypt_user_key: Invalid input - encrypted_key is None or not string")
            raise ValueError("Encrypted key must be a non-empty string")
        
        # Decode base64
        try:
            combined = base64.b64decode(encrypted_key.encode('utf-8'))
            logger.debug(f"decrypt_user_key: Base64 decoded, combined_length={len(combined)}")
        except Exception as e:
            logger.error(f"decrypt_user_key: Base64 decode error: {str(e)}")
            raise ValueError(f"Invalid base64 encoding: {str(e)}")
        
        # Validate minimum length (12 bytes nonce + at least 16 bytes encrypted data + 16 bytes tag = 44 bytes minimum)
        if len(combined) < 44:
            logger.error(f"decrypt_user_key: Encrypted key too short: {len(combined)} bytes (expected at least 44 bytes)")
            raise ValueError(f"Encrypted key too short: {len(combined)} bytes (expected at least 44 bytes)")
        
        nonce = combined[:12]
        encrypted = combined[12:]
        logger.debug(f"decrypt_user_key: nonce_length={len(nonce)}, encrypted_length={len(encrypted)}")
        
        # Validate encrypted data length (should be at least 32 bytes key + 16 bytes tag = 48 bytes)
        if len(encrypted) < 48:
            logger.error(f"decrypt_user_key: Encrypted data too short: {len(encrypted)} bytes (expected at least 48 bytes)")
            raise ValueError(f"Encrypted data too short: {len(encrypted)} bytes (expected at least 48 bytes)")
        
        aesgcm = AESGCM(master_key)
        logger.debug(f"decrypt_user_key: Attempting AES-GCM decrypt")
        decrypted = aesgcm.decrypt(nonce, encrypted, None)
        logger.debug(f"decrypt_user_key: Decrypt successful, decrypted_length={len(decrypted)}")
        return decrypted
    except InvalidTag as e:
        logger.error(f"decrypt_user_key: InvalidTag exception - encryption key decryption failed")
        logger.error(f"decrypt_user_key: encrypted_key preview: {encrypted_key[:100] if encrypted_key else 'None'}...")
        logger.error(f"decrypt_user_key: combined_length={len(combined) if 'combined' in locals() else 'N/A'}")
        # Re-raise InvalidTag as-is so it can be caught specifically
        raise
    except ValueError as e:
        logger.error(f"decrypt_user_key: ValueError: {str(e)}")
        # Re-raise ValueError as-is
        raise
    except Exception as e:
        logger.error(f"decrypt_user_key: Unexpected exception: {str(e)}")
        logger.error(f"decrypt_user_key: Exception type: {type(e).__name__}")
        # Wrap other exceptions with more context
        raise ValueError(f"Failed to decrypt user key: {str(e)}") from e


def encrypt_note_data(data: str, key: bytes) -> tuple[str, str, str]:
    """
    Encrypt note data (title or content) using AES-256-GCM
    Returns: (encrypted_data_base64, nonce_base64, tag_base64)
    """
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96 bits for GCM
    data_bytes = data.encode('utf-8')
    encrypted = aesgcm.encrypt(nonce, data_bytes, None)
    
    # encrypted contains: ciphertext + tag (16 bytes at the end)
    # For GCM, tag is appended automatically
    # Split ciphertext and tag
    if len(encrypted) < 16:
        raise ValueError("Encrypted data too short")
    encrypted_data = encrypted[:-16]  # Ciphertext without tag
    tag = encrypted[-16:]  # Authentication tag (16 bytes)
    
    return (
        base64.b64encode(encrypted_data).decode('utf-8'),
        base64.b64encode(nonce).decode('utf-8'),
        base64.b64encode(tag).decode('utf-8')
    )


def decrypt_note_data(encrypted_data: str, nonce: str, tag: str, key: bytes) -> str:
    """
    Decrypt note data using AES-256-GCM
    Returns: plaintext string
    """
    aesgcm = AESGCM(key)
    encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
    nonce_bytes = base64.b64decode(nonce.encode('utf-8'))
    tag_bytes = base64.b64decode(tag.encode('utf-8'))
    
    # Combine ciphertext and tag
    combined = encrypted_bytes + tag_bytes
    decrypted = aesgcm.decrypt(nonce_bytes, combined, None)
    return decrypted.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    # Ensure sub is string
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    # Ensure sub is string
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None


# 2FA TOTP Functions
def generate_totp_secret() -> str:
    """Generate a TOTP secret key (base32 encoded, 32 bytes)"""
    return pyotp.random_base32()


def generate_totp_qr_code(secret: str, username: str, issuer: str = "SecureNote") -> str:
    """
    Generate QR code URL for TOTP setup
    Returns: otpauth:// URL string that can be used to generate QR code
    """
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=username,
        issuer_name=issuer
    )
    return totp_uri


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """
    Verify TOTP code from authenticator app
    Args:
        secret: TOTP secret key (base32)
        code: 6-digit code from authenticator
        window: Time window for verification (default 1 = current and previous 30s window)
    Returns: True if code is valid
    """
    if not secret or not code:
        return False
    
    try:
        totp = pyotp.TOTP(secret)
        # Verify code with time window tolerance
        return totp.verify(code, valid_window=window)
    except Exception as e:
        logger.error(f"TOTP verification error: {str(e)}")
        return False


def generate_backup_codes(count: int = 10) -> List[str]:
    """
    Generate backup codes for 2FA
    Returns: List of 8-character alphanumeric codes
    """
    codes = []
    for _ in range(count):
        # Generate 8-character code: 4 bytes = 8 hex chars
        code = secrets.token_hex(4).upper()
        codes.append(code)
    return codes


def hash_backup_codes(codes: List[str]) -> str:
    """
    Hash backup codes using bcrypt before storing
    Returns: JSON string of hashed codes
    """
    hashed_codes = [hash_password(code) for code in codes]
    return json.dumps(hashed_codes)


def verify_backup_code(code: str, hashed_codes_json: str) -> tuple[bool, List[str]]:
    """
    Verify backup code against hashed codes
    Args:
        code: Backup code to verify
        hashed_codes_json: JSON string of hashed backup codes
    Returns: (is_valid, updated_hashed_codes_json) - tuple of bool and updated JSON
    """
    if not code or not hashed_codes_json:
        return False, hashed_codes_json
    
    try:
        hashed_codes = json.loads(hashed_codes_json)
        for i, hashed_code in enumerate(hashed_codes):
            if verify_password(code, hashed_code):
                # Remove used backup code
                hashed_codes.pop(i)
                return True, json.dumps(hashed_codes)
        return False, hashed_codes_json
    except Exception as e:
        logger.error(f"Backup code verification error: {str(e)}")
        return False, hashed_codes_json
