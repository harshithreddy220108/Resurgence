import sys
sys.path.append('d:\\Resurgence')
from backend import database, models

db = next(database.get_db())

# Add a high bid (willing to pay 20 cents)
bid = models.EnergyListing(
    user_id=2,
    offer_type="buy",
    kwh_amount=10.0,
    price_per_kwh=0.20,
    status="open"
)
# Add a low ask (willing to sell for 5 cents)
ask = models.EnergyListing(
    user_id=1, 
    offer_type="sell",
    kwh_amount=10.0,
    price_per_kwh=0.05,
    status="open"
)

db.add(bid)
db.add(ask)
db.commit()
print("Successfully injected crossing buy/sell orders into the SQLite ledger.")
