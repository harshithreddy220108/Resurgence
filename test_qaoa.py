import requests
import json

print("TRIGGERING IBM QISKIT QAOA SIMULATION ON Q-TRADE NETWORK...")
try:
    res = requests.post("http://127.0.0.1:8000/api/market/optimize", timeout=60)
    data = res.json()
    print(f"Status Code: {res.status_code}")
    print("Optimization Result Payload:\n", json.dumps(data, indent=2))
except Exception as e:
    print("Failed to trigger optimization:", e)
