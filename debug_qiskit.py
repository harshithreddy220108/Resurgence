import sys
import logging
logging.basicConfig(level=logging.INFO)
sys.path.append('d:\\Resurgence')
from backend.ai.quantum_optimizer import run_qaoa_matching

bids = [{'id': 1, 'user_id': 'u1', 'kwh_amount': 5, 'price_per_kwh': 0.12}]
asks = [{'id': 2, 'user_id': 'u2', 'kwh_amount': 5, 'price_per_kwh': 0.10}]

class MockUser:
    def __init__(self, lat, lng):
        self.location_lat = lat
        self.location_lng = lng

users_dict = {
    'u1': MockUser(30.0, -97.0),
    'u2': MockUser(30.1, -97.1)
}

print("Starting native Qiskit QAOA simulation...")
matches = run_qaoa_matching(bids, asks, users_dict)
print("Output Matches:", len(matches))
