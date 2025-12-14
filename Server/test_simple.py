"""Simple test - login and create note in one go"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Step 1: Login
print("1. Login...")
login_data = {"username": "testuser", "password": "testpass123"}
r = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
print(f"   Status: {r.status_code}")
if r.status_code != 200:
    print(f"   Error: {r.text}")
    exit(1)

tokens = r.json()
token = tokens["access_token"]
print(f"   ✓ Got token: {token[:30]}...")

# Step 2: Get user info
print("\n2. Get user info...")
headers = {"Authorization": f"Bearer {token}"}
r = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
print(f"   Status: {r.status_code}")
if r.status_code == 200:
    user = r.json()
    print(f"   ✓ User: {user['username']}")
else:
    print(f"   ✗ Error: {r.text}")
    exit(1)

# Step 3: Create note
print("\n3. Create note...")
note_data = {"title": "Test Note", "content": "Test content"}
r = requests.post(f"{BASE_URL}/api/notes", json=note_data, headers=headers)
print(f"   Status: {r.status_code}")
if r.status_code == 201:
    note = r.json()
    print(f"   ✓ Note created: {note['title']}")
else:
    print(f"   ✗ Error: {r.text}")

# Step 4: Get notes
print("\n4. Get notes...")
r = requests.get(f"{BASE_URL}/api/notes", headers=headers)
print(f"   Status: {r.status_code}")
if r.status_code == 200:
    notes = r.json()
    print(f"   ✓ Found {len(notes)} notes")
else:
    print(f"   ✗ Error: {r.text}")

print("\n✓ All tests completed!")

















