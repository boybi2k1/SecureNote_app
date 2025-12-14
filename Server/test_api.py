"""
Script để test các API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_register():
    """Test register endpoint"""
    print("Testing /api/auth/register endpoint...")
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print(f"User created: {response.json()}")
        return response.json()
    else:
        print(f"Error: {response.text}")
    print()
    return None

def test_login():
    """Test login endpoint"""
    print("Testing /api/auth/login endpoint...")
    data = {
        "username": "testuser",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        tokens = response.json()
        print(f"Login successful! Access token: {tokens['access_token'][:50]}...")
        return tokens
    else:
        print(f"Error: {response.text}")
    print()
    return None

def test_get_notes(token):
    """Test get notes endpoint"""
    print("Testing /api/notes endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/notes", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        notes = response.json()
        print(f"Found {len(notes)} notes")
        return notes
    else:
        print(f"Error: {response.text}")
        print(f"Token used: {token[:50]}...")
    print()
    return []

def test_create_note(token):
    """Test create note endpoint"""
    print("Testing POST /api/notes endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Test Note",
        "content": "This is a test note content"
    }
    response = requests.post(f"{BASE_URL}/api/notes", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        note = response.json()
        print(f"Note created: ID={note['id']}, Title={note['title']}")
        return note
    else:
        print(f"Error: {response.text}")
    print()
    return None

def main():
    print("=" * 60)
    print("Testing Secure Note API")
    print("=" * 60)
    print()
    
    # Test health
    test_health()
    
    # Test register
    user = test_register()
    
    # Test login
    tokens = test_login()
    if not tokens:
        print("Login failed, cannot continue tests")
        return
    
    access_token = tokens["access_token"]
    
    # Test get notes (should be empty)
    notes1 = test_get_notes(access_token)
    
    # Test create note
    note = test_create_note(access_token)
    
    # Test get notes again (should have 1 note)
    notes2 = test_get_notes(access_token)
    
    if note:
        print(f"✓ Successfully created and retrieved note: {note['title']}")
    
    print("=" * 60)
    print("Tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to server. Make sure server is running on http://localhost:8000")
    except Exception as e:
        print(f"Error: {e}")

