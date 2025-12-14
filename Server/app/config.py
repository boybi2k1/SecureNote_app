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
    GEMINI_API_KEY: str = ""
    
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
            print("=" * 80)
            print("ERROR: MASTER_KEY is not set in .env file!")
            print("=" * 80)
            print("")
            print("MASTER_KEY is required and must be set in .env file.")
            print("This key is used to encrypt/decrypt user encryption keys.")
            print("")
            print("SOLUTION:")
            print("  1. Create a .env file in the Server directory")
            print("  2. Run: python create_env.py")
            print("     OR manually add: MASTER_KEY=<your-32-byte-key>")
            print("  3. The MASTER_KEY must be exactly 32 bytes (44 chars base64)")
            print("  4. Keep the same MASTER_KEY across all server restarts")
            print("")
            print("IMPORTANT:")
            print("  - If you change MASTER_KEY, all existing users will lose access")
            print("  - Backup your .env file in a secure location")
            print("=" * 80)
            raise ValueError(
                "MASTER_KEY is not set in .env file. "
                "Please create .env file with MASTER_KEY. "
                "Run 'python create_env.py' to generate one."
            )
        
        # MASTER_KEY will be handled by get_master_key_bytes() in security.py
        # It can be stored as base64-encoded string or raw string
        # The helper function will decode it properly to 32 bytes


settings = Settings()

