from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # nullable for existing seed users
    wallet_address = Column(String, unique=True, index=True, nullable=True)
    role = Column(String, default="both")  # buyer, seller, both
    is_admin = Column(Boolean, default=False)

    # physical attributes
    panel_capacity_kw = Column(Float, default=0.0)
    battery_capacity_kwh = Column(Float, default=0.0)
    base_consumption_kwh = Column(Float, default=0.0)

    location_lat = Column(Float, default=30.2672)
    location_lng = Column(Float, default=-97.7431)

    # relationships
    wallet = relationship("Wallet", back_populates="owner", uselist=False)
    listings = relationship("EnergyListing", back_populates="owner")

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    energy_credits = Column(Float, default=100.0)
    kwh_available = Column(Float, default=0.0)
    kwh_consumed = Column(Float, default=0.0)
    total_earned = Column(Float, default=0.0)
    total_spent = Column(Float, default=0.0)
    co2_offset_kg = Column(Float, default=0.0)

    owner = relationship("User", back_populates="wallet")

class EnergyListing(Base):
    __tablename__ = "energy_listings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    offer_type = Column(String)  # "buy" or "sell"
    kwh_amount = Column(Float)
    price_per_kwh = Column(Float)
    status = Column(String, default="open")  # open, matched, canceled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="listings")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(String, ForeignKey("users.id"))
    seller_id = Column(String, ForeignKey("users.id"))
    listing_id = Column(Integer, ForeignKey("energy_listings.id"), nullable=True)
    kwh_amount = Column(Float)
    price_per_kwh = Column(Float)
    total_value = Column(Float)
    co2_saved_kg = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SolarForecast(Base):
    __tablename__ = "solar_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(DateTime)
    predicted_generation_kwh = Column(Float)
    weather_condition = Column(String)
