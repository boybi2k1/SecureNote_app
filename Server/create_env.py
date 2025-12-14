"""Script to create .env file"""
import secrets
import base64
import os

# Check if .env already exists
if os.path.exists('.env'):
    print("=" * 80)
    print("WARNING: .env file already exists!")
    print("Creating a new .env will:")
    print("  - Generate a NEW MASTER_KEY")
    print("  - Make ALL existing user encryption keys INVALID")
    print("  - Users will NOT be able to decrypt their notes")
    print("")
    response = input("Do you want to continue? (yes/no): ")
    if response.lower() != 'yes':
        print("Cancelled. Existing .env file preserved.")
        exit(0)
    print("=" * 80)

secret_key = secrets.token_urlsafe(32)
master_key_bytes = secrets.token_bytes(32)
# Use full base64 encoded key (44 chars) for better compatibility
master_key = base64.b64encode(master_key_bytes).decode('utf-8')

env_content = f"""SECRET_KEY={secret_key}
MASTER_KEY={master_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=sqlite:///./secure_notes.db
CORS_ORIGINS=http://localhost:3000,*
"""

with open('.env', 'w', encoding='utf-8') as f:
    f.write(env_content)

print("=" * 80)
print("✓ .env file created successfully!")
print("=" * 80)
print()
print("IMPORTANT NOTES:")
print("  1. Keep this .env file SECRET and never commit it to git")
print("  2. The MASTER_KEY is used to encrypt/decrypt user encryption keys")
print("  3. If you change MASTER_KEY, all existing users will lose access to their notes")
print("  4. Backup this .env file in a secure location")
print()
print("Generated keys:")
print(f"  SECRET_KEY={secret_key}")
print(f"  MASTER_KEY={master_key}")
print("=" * 80)
















