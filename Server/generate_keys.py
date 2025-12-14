"""
Script to generate SECRET_KEY and MASTER_KEY for .env file
"""
import secrets

def generate_secret_key():
    """Generate a secure random secret key for JWT"""
    return secrets.token_urlsafe(32)

def generate_master_key():
    """Generate a 32-byte master key for AES-256 encryption"""
    # Generate 32 random bytes
    key_bytes = secrets.token_bytes(32)
    # Encode to base64 and take first 32 chars
    # This ensures when decoded and padded, we get exactly 32 bytes
    import base64
    return base64.b64encode(key_bytes).decode('utf-8')[:32]

if __name__ == "__main__":
    print("=" * 60)
    print("Secure Note - Key Generator")
    print("=" * 60)
    print()
    print("Add these to your .env file:")
    print()
    print(f"SECRET_KEY={generate_secret_key()}")
    print(f"MASTER_KEY={generate_master_key()}")
    print()
    print("=" * 60)
    print("IMPORTANT: Keep these keys secret and never commit them to git!")
    print("=" * 60)

