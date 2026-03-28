import os
import sys
import uuid
import pandas as pd
import random
from datetime import datetime, timezone

# Add the parent directory to the path so we can import backend packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend import models, database

# Community center location approximation (Austin, TX style for sunny climate demo)
BASE_LAT = 30.2672
BASE_LNG = -97.7431

def generate_houses_csv(output_path: str, num_houses: int = 15):
    """Generates a CSV of simulated houses representing users in the microgrid."""
    print(f"Generating {num_houses} mock houses...")
    data = []
    
    # Pre-configure the explicit users from the frontend mock data to match UI exactly
    core_users = [
        {"id": "demo-000", "name": "Demo Google User", "email": "demo.google@gmail.com", "role": "both", "lat": 30.2675, "lng": -97.7431},
        {"id": "alex-123", "name": "Alex Johnson", "email": "alex@neighborhood.com", "role": "both", "lat": 30.2675, "lng": -97.7430},
        {"id": "maria-456", "name": "Maria Chen", "email": "maria@neighborhood.com", "role": "buyer", "lat": 30.2680, "lng": -97.7425},
        {"id": "jamal-789", "name": "James Park", "email": "james@neighborhood.com", "role": "seller", "lat": 30.2670, "lng": -97.7440},
        {"id": "sarah-321", "name": "Sarah Lee", "email": "sarah@neighborhood.com", "role": "buyer", "lat": 30.2665, "lng": -97.7435},
        {"id": "david-654", "name": "David Kim", "email": "david@neighborhood.com", "role": "both", "lat": 30.2685, "lng": -97.7420},
        {"id": "emily-987", "name": "Emily Wong", "email": "emily@neighborhood.com", "role": "seller", "lat": 30.2660, "lng": -97.7445},
        {"id": "admin-111", "name": "Admin User", "email": "admin@neighborhood.com", "role": "both", "is_admin": True, "lat": BASE_LAT, "lng": BASE_LNG},
    ]

    # Generate additional random houses to hit num_houses target
    roles = ["buyer", "seller", "both"]
    
    for i in range(num_houses):
        if i < len(core_users):
            u = core_users[i]
            user_id = u["id"]
            name = u["name"]
            email = u["email"]
            role = u["role"]
            is_admin = u.get("is_admin", False)
            lat = u["lat"]
            lng = u["lng"]
        else:
            user_id = str(uuid.uuid4())[:8]
            name = f"Neighbor {i}"
            email = f"neighbor{i}@neighborhood.com"
            role = random.choice(roles)
            is_admin = False
            # jitter location slightly
            lat = BASE_LAT + random.uniform(-0.02, 0.02)
            lng = BASE_LNG + random.uniform(-0.02, 0.02)

        # Panel logic: buyers usually have 0 or small panels, sellers have larger
        if role == "buyer":
            panel_kw = round(random.uniform(0, 3.0), 1) if random.random() > 0.5 else 0.0
        elif role == "seller":
            panel_kw = round(random.uniform(6.0, 12.0), 1)
        else:
            panel_kw = round(random.uniform(4.0, 8.0), 1)

        data.append({
            "user_id": user_id,
            "name": name,
            "email": email,
            "wallet_address": f"0x{uuid.uuid4().hex[:32]}",
            "role": role,
            "is_admin": is_admin,
            "panel_capacity_kw": panel_kw,
            "battery_capacity_kwh": round(panel_kw * random.uniform(0.5, 1.5), 1) if panel_kw > 0 else 0.0,
            "base_consumption_kwh": round(random.uniform(15.0, 45.0), 1),
            "location_lat": lat,
            "location_lng": lng
        })

    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"Saved generated data to {output_path}")
    return df

def populate_sqlite_from_csv(csv_path: str):
    """Reads the CSV and populates the SQLite database using SQLAlchemy."""
    print("Populating SQLite database from CSV...")
    df = pd.read_csv(csv_path)
    
    # Initialize DB (creates tables if they don't exist)
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()

    try:
        # Clear existing users for a fresh start (cascade handles the rest usually, but let's be explicitly safe or just add new)
        db.query(models.User).delete()
        db.query(models.Wallet).delete()
        db.commit()

        for _, row in df.iterrows():
            user = models.User(
                id=row["user_id"],
                name=row["name"],
                email=row["email"],
                wallet_address=row["wallet_address"],
                role=row["role"],
                is_admin=row["is_admin"],
                panel_capacity_kw=row["panel_capacity_kw"],
                battery_capacity_kwh=row["battery_capacity_kwh"],
                base_consumption_kwh=row["base_consumption_kwh"],
                location_lat=row["location_lat"],
                location_lng=row["location_lng"]
            )
            db.add(user)
            
            # create initial wallet
            wallet = models.Wallet(
                user_id=row["user_id"],
                energy_credits=round(random.uniform(50.0, 500.0), 2),
                kwh_available=round(random.uniform(0.0, 50.0), 1) if row["role"] in ["seller", "both"] else 0.0,
                kwh_consumed=round(random.uniform(10.0, 200.0), 1),
                total_earned=round(random.uniform(0.0, 1500.0), 2),
                total_spent=round(random.uniform(0.0, 500.0), 2)
            )
            db.add(wallet)
            
        db.commit()
        print("Successfully seeded SQLite database with virtual neighborhood!")
    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    csv_file = os.path.join(os.path.dirname(__file__), "houses.csv")
    generate_houses_csv(csv_file, num_houses=15)
    populate_sqlite_from_csv(csv_file)
