import requests
import sys

BASE_URL = "http://127.0.0.1:8000"
USER_ID = "demo-000"

endpoints_to_test = [
    {"name": "Root", "url": "/"},
    {"name": "All Users", "url": "/api/users"},
    {"name": "Single User", "url": f"/api/users/{USER_ID}"},
    {"name": "User by Email", "url": "/api/users/by-email/demo.google@gmail.com"},
    {"name": "User Wallet", "url": f"/api/wallets/{USER_ID}"},
    {"name": "Energy Listings", "url": "/api/listings"},
    {"name": "All Transactions", "url": "/api/transactions"},
    {"name": "User Transactions", "url": f"/api/transactions?user_id={USER_ID}"},
    {"name": "AI Solar Forecast", "url": f"/api/forecast/{USER_ID}"},
    {"name": "Geolocation AI Forecast", "url": f"/api/forecast/{USER_ID}?lat=31.1471&lng=75.3412"}
]

print("Starting Exhaustive Backend API Audit...")
errors_found = 0

for ep in endpoints_to_test:
    try:
        r = requests.get(BASE_URL + ep["url"], timeout=5)
        if r.status_code == 200:
            print(f"[OK] {ep['name']} ({ep['url']})")
        else:
            print(f"[FAIL] {ep['name']} returning {r.status_code}: {r.text}")
            errors_found += 1
    except requests.exceptions.RequestException as e:
        print(f"[CRASH] {ep['name']} failed to connect: {e}")
        errors_found += 1

sys.exit(errors_found)
