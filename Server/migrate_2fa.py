"""
Migration script to add 2FA fields to users table
Run this script to update existing database with 2FA support
"""
import sqlite3
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import User
from sqlalchemy import inspect, text

def migrate_database():
    """Add 2FA columns to users table if they don't exist"""
    print("Starting 2FA migration...")
    
    # Get database URL from config
    from app.config import settings
    db_url = settings.DATABASE_URL
    
    if not db_url.startswith("sqlite"):
        print(f"Warning: This migration script is designed for SQLite. Database URL: {db_url}")
        print("Please run manual migration for your database type.")
        return
    
    # Extract database file path
    db_path = db_url.replace("sqlite:///", "")
    
    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        print("Creating new database with 2FA support...")
        Base.metadata.create_all(bind=engine)
        print("Database created successfully!")
        return
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        migrations = []
        
        if "two_factor_secret" not in columns:
            migrations.append("ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(32)")
            print("  - Adding two_factor_secret column...")
        
        if "two_factor_enabled" not in columns:
            migrations.append("ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0")
            print("  - Adding two_factor_enabled column...")
        
        if "two_factor_backup_codes" not in columns:
            migrations.append("ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT")
            print("  - Adding two_factor_backup_codes column...")
        
        if "biometric_enabled" not in columns:
            migrations.append("ALTER TABLE users ADD COLUMN biometric_enabled BOOLEAN DEFAULT 0")
            print("  - Adding biometric_enabled column...")
        
        if not migrations:
            print("All 2FA columns already exist. No migration needed.")
            conn.close()
            return
        
        # Execute migrations
        for migration in migrations:
            cursor.execute(migration)
        
        # Create index on two_factor_enabled for better query performance
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled)")
            print("  - Creating index on two_factor_enabled...")
        except sqlite3.OperationalError as e:
            if "already exists" not in str(e).lower():
                print(f"  - Warning: Could not create index: {e}")
        
        conn.commit()
        print(f"\nSuccessfully applied {len(migrations)} migration(s)!")
        print("Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\nError during migration: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

