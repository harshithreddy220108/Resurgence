import os
import sys
import random
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend import models, database

def seed_market_data():
    print("Seeding SQLite with EnergyListings and Transactions...")
    
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    
    try:
        # Get user IDs to attach to
        users = db.query(models.User).all()
        buyers = [u for u in users if u.role in ["buyer", "both"]]
        sellers = [u for u in users if u.role in ["seller", "both"]]
        
        if not buyers or not sellers:
            print("Not enough users to seed market.")
            return

        # 1. Clear existing listings and transactions
        db.query(models.EnergyListing).delete()
        db.query(models.Transaction).delete()
        
        # 2. Seed Bids (Buy offers)
        bids = [
            (3.5, 0.115), (6.0, 0.112), (2.0, 0.110), (8.5, 0.108), (1.5, 0.105)
        ]
        for idx, (kwh, price) in enumerate(bids):
            buyer = buyers[idx % len(buyers)]
            listing = models.EnergyListing(
                user_id=buyer.id,
                offer_type="buy",
                kwh_amount=kwh,
                price_per_kwh=price,
                status="open",
                created_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 60))
            )
            db.add(listing)
            
        # 3. Seed Asks (Sell offers)
        asks = [
            (4.0, 0.118), (5.5, 0.120), (7.0, 0.123), (2.5, 0.126), (10.0, 0.130)
        ]
        for idx, (kwh, price) in enumerate(asks):
            seller = sellers[idx % len(sellers)]
            listing = models.EnergyListing(
                user_id=seller.id,
                offer_type="sell",
                kwh_amount=kwh,
                price_per_kwh=price,
                status="open",
                created_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 60))
            )
            db.add(listing)
            
        # 4. Seed Recent Transactions
        trades = [
            (3.0, 0.119), (2.0, 0.117), (5.0, 0.120), (1.5, 0.116), (4.0, 0.122)
        ]
        
        # Make one trade explicitly involve alex-123 to show up in UserDashboard
        alex = db.query(models.User).filter(models.User.email == "alex@neighborhood.com").first()
        
        for idx, (kwh, price) in enumerate(trades):
            seller = sellers[idx % len(sellers)]
            buyer = buyers[idx % len(buyers)]
            
            # Ensure alex is involved in the first one
            if idx == 0 and alex:
                seller = alex

            if seller.id == buyer.id:  # Prevent trading with self
                continue

            # Create the matched listing first
            matched_listing = models.EnergyListing(
                user_id=seller.id,
                offer_type="sell",
                kwh_amount=kwh,
                price_per_kwh=price,
                status="matched",
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))
            )
            db.add(matched_listing)
            db.flush() # get ID

            tx = models.Transaction(
                buyer_id=buyer.id,
                seller_id=seller.id,
                listing_id=matched_listing.id,
                kwh_amount=kwh,
                price_per_kwh=price,
                total_value=kwh * price,
                co2_saved_kg=kwh * 0.4, # approx 0.4kg CO2 per kWh
                created_at=matched_listing.created_at + timedelta(minutes=5)
            )
            db.add(tx)

        db.commit()
        print("Market data successfully seeded!")
        
    except Exception as e:
        print(f"Error seeding market: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_market_data()
