"""
Script để test API với debug chi tiết
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login():
    """Test login và lấy token"""
    print("=" * 60)
    print("1. Testing Login")
    print("=" * 60)
    
    # Thử login với user đã tồn tại
    data = {
        "username": "testuser",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        tokens = response.json()
        access_token = tokens["access_token"]
        print(f"✓ Login successful")
        print(f"Access token (first 50 chars): {access_token[:50]}...")
        
        # Test verify token
        print("\n2. Testing Token Verification")
        print("=" * 60)
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
        print(f"GET /api/users/me - Status: {response.status_code}")
        if response.status_code == 200:
            user = response.json()
            print(f"✓ Token valid! User: {user['username']}")
            return access_token
        else:
            print(f"✗ Token invalid: {response.text}")
            return None
    else:
        print(f"✗ Login failed: {response.text}")
        return None

def test_create_note(token):
    """Test create note"""
    print("\n3. Testing Create Note")
    print("=" * 60)
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "My First Secure Note",
        "content": "This is encrypted content that should be safe!"
    }
    response = requests.post(f"{BASE_URL}/api/notes", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        note = response.json()
        print(f"✓ Note created successfully!")
        print(f"  ID: {note['id']}")
        print(f"  Title: {note['title']}")
        print(f"  Content preview: {note['content'][:50]}...")
        return note
    else:
        print(f"✗ Failed to create note: {response.text}")
        return None

def test_get_notes(token):
    """Test get notes"""
    print("\n4. Testing Get Notes")
    print("=" * 60)
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/notes", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        notes = response.json()
        print(f"✓ Found {len(notes)} notes")
        for note in notes:
            print(f"  - {note['title']} (ID: {note['id']})")
        return notes
    else:
        print(f"✗ Failed to get notes: {response.text}")
        return []

def main():
    print("\n" + "=" * 60)
    print("Secure Note API - Detailed Test")
    print("=" * 60 + "\n")
    
    # Test login
    token = test_login()
    if not token:
        print("\n✗ Cannot continue without valid token")
        return
    
    # Test create note
    note = test_create_note(token)
    
    # Test get notes
    notes = test_get_notes(token)
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"✓ Login: OK")
    print(f"✓ Token verification: OK")
    if note:
        print(f"✓ Create note: OK (ID: {note['id']})")
    if notes:
        print(f"✓ Get notes: OK ({len(notes)} notes)")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("✗ Error: Cannot connect to server.")
        print("  Make sure server is running: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

















