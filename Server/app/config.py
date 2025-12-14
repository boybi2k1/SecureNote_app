try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from typing import List
import os
import secrets


class Settings(BaseSettings):
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    MASTER_KEY: str = ""  # 32 bytes for AES-256
    DATABASE_URL: str = "sqlite:///./secure_notes.db"
    CORS_ORIGINS: str = "http://localhost:3000,*"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Generate default values for development if not set
        if not self.SECRET_KEY:
            self.SECRET_KEY = secrets.token_urlsafe(32)
            print("WARNING: SECRET_KEY not set in .env, using generated key for development")
        
        if not self.MASTER_KEY:
            # Generate 32 bytes (256 bits) for AES-256
            import base64
            key_bytes = secrets.token_bytes(32)
            # Encode to base64 (44 chars) - full encoding for better compatibility
            self.MASTER_KEY = base64.b64encode(key_bytes).decode('utf-8')
            print("=" * 80)
            print("CRITICAL WARNING: MASTER_KEY not set in .env file!")
            print("A new master key has been generated for this session.")
            print("This means:")
            print("  - All existing user encryption keys CANNOT be decrypted")
            print("  - Users will NOT be able to access their encrypted notes")
            print("  - This master key will change on every server restart")
            print("")
            print("SOLUTION:")
            print("  1. Create a .env file in the server directory")
            print("  2. Add: MASTER_KEY=<your-fixed-32-byte-key>")
            print("  3. Use the same MASTER_KEY that was used when users were created")
            print("  4. Or recreate all users with the new master key")
            print("=" * 80)
        
        # MASTER_KEY will be handled by get_master_key_bytes() in security.py
        # It can be stored as base64-encoded string or raw string
        # The helper function will decode it properly to 32 bytes


settings = Settings()

