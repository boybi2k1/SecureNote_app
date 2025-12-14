"""
Script to reset database - delete all data and recreate tables
WARNING: This will delete ALL data in the database!
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine, Base
from app.models import User, Note, Category, Tag, NoteTag, SharedNote, RefreshToken
from app.config import settings

def reset_database():
    """Delete all tables and recreate them"""
    print("=" * 80)
    print("WARNING: This will delete ALL data in the database!")
    print("=" * 80)
    
    response = input("Are you sure you want to continue? (yes/no): ")
    if response.lower() != 'yes':
        print("Cancelled. Database unchanged.")
        return
    
    print("\nClosing database connections...")
    engine.dispose()
    
    # Try to delete database file if using SQLite
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_path and os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"Deleted database file: {db_path}")
        except Exception as e:
            print(f"Warning: Could not delete database file: {e}")
            print("Will try to drop tables instead...")
            Base.metadata.drop_all(bind=engine)
    else:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("\n✓ Database reset successfully!")
    print("All tables have been recreated. You can now register new users.")
    print(f"\nCurrent MASTER_KEY length: {len(settings.MASTER_KEY)} characters")
    if len(settings.MASTER_KEY) == 44:
        print("✓ MASTER_KEY is valid (44 chars base64)")
    else:
        print("⚠ WARNING: MASTER_KEY length is not 44 characters!")

if __name__ == "__main__":
    reset_database()

