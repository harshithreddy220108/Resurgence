import requests

def test_user(user_id, name):
    try:
        r = requests.get(f'http://127.0.0.1:8000/api/forecast/{user_id}')
        res = r.json()
        print(f"\n--- {name} (UserId: {user_id}) ---")
        print(f"Panel Size: {res.get('panel_kw')} kW")
        print("Live Local Weather Features:")
        for k, v in res.get('weather_context', {}).items():
            print(f"  - {k}: {v}")
        print(f"AI Predicted Generation: {res.get('predicted_total_kwh')} kWh")
    except Exception as e:
        print(f"Error checking {user_id}: {e}")

if __name__ == "__main__":
    test_user('alex-123', 'Alex (Austin Core Coords)')
    test_user('de2e743d', 'Neighbor 8 (Edge Coords)')
