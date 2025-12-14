"""Full test - register, login, create note"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Step 1: Register new user
print("1. Register new user...")
register_data = {
    "username": "newuser",
    "email": "newuser@test.com",
    "password": "password123"
}
r = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
print(f"   Status: {r.status_code}")
if r.status_code == 201:
    user = r.json()
    print(f"   ✓ User registered: {user['username']}")
elif r.status_code == 400:
    print(f"   User may already exist, trying login...")
else:
    print(f"   Error: {r.text}")
    exit(1)

# Step 2: Login
print("\n2. Login...")
login_data = {"username": "newuser", "password": "password123"}
r = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
print(f"   Status: {r.status_code}")
if r.status_code != 200:
    print(f"   Error: {r.text}")
    exit(1)

tokens = r.json()
token = tokens["access_token"]
print(f"   ✓ Got token")

# Step 3: Create note
print("\n3. Create note...")
headers = {"Authorization": f"Bearer {token}"}
note_data = {"title": "My First Note", "content": "This is my first secure note!"}
r = requests.post(f"{BASE_URL}/api/notes", json=note_data, headers=headers)
print(f"   Status: {r.status_code}")
if r.status_code == 201:
    note = r.json()
    print(f"   ✓ Note created: {note['title']}")
    print(f"   Content: {note['content']}")
else:
    print(f"   ✗ Error: {r.text}")

# Step 4: Get notes
print("\n4. Get notes...")
r = requests.get(f"{BASE_URL}/api/notes", headers=headers)
print(f"   Status: {r.status_code}")
if r.status_code == 200:
    notes = r.json()
    print(f"   ✓ Found {len(notes)} notes")
    for note in notes:
        print(f"      - {note['title']}")
else:
    print(f"   ✗ Error: {r.text}")

print("\n✓ All tests completed!")

















