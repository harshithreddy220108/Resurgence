import os
import sys
import time
import uuid
import logging
from datetime import timedelta
from typing import Optional, Literal, Any
from contextlib import asynccontextmanager

# Add project root to sys.path for direct execution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from pydantic import BaseModel, Field, field_validator

from backend import models, database
from backend.config import settings
from backend.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_user_optional, require_admin
)
from backend.ai import weather, solar_regression, quantum_optimizer

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S"
)
logger = logging.getLogger("qtrade")

# ── DB Init ───────────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=database.engine)

# ── App startup time ──────────────────────────────────────────────────────────
_start_time = time.time()

# ── In-memory job store for async QAOA ───────────────────────────────────────
_optimize_jobs: dict[str, dict] = {}

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Q-Trade API",
    description="Production-ready backend for the P2P Energy Trading Platform",
    version="2.0.0",
    docs_url=settings.docs_url,
    redoc_url=settings.redoc_url,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Global exception handler: hide stack traces in production ─────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.is_production:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    raise exc

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic request/response schemas
# ─────────────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5)
    password: str = Field(min_length=8)
    panel_capacity_kw: float = Field(default=0.0, ge=0, le=500)
    location_lat: float = Field(default=30.2672)
    location_lng: float = Field(default=-97.7431)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        import re
        pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email address")
        return v.lower()

class ListingCreate(BaseModel):
    offer_type: Literal["buy", "sell"]
    kwh_amount: float = Field(gt=0, le=100)
    price_per_kwh: float = Field(gt=0.001, le=2.0)

# ─────────────────────────────────────────────────────────────────────────────
# Root + Health
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Q-Trade API v2.0 — production hardened"}

@app.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    try:
        db.execute(models.User.__table__.select().limit(1))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    return {
        "status": "ok",
        "db": db_status,
        "version": "2.0.0",
        "uptime_s": round(time.time() - _start_time, 1),
        "environment": settings.environment,
    }

# ─────────────────────────────────────────────────────────────────────────────
# Auth Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = str(uuid.uuid4())
    new_user = models.User(
        id=user_id,
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="both",
        panel_capacity_kw=body.panel_capacity_kw,
        location_lat=body.location_lat,
        location_lng=body.location_lng,
    )
    wallet = models.Wallet(user_id=user_id, energy_credits=100.0)
    db.add(new_user)
    db.add(wallet)
    db.commit()
    db.refresh(new_user)
    logger.info(f"New user registered: {body.email}")
    token = create_access_token({"sub": user_id})
    return {"access_token": token, "token_type": "bearer", "user_id": user_id, "name": body.name}

@app.post("/api/auth/login")
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.id})
    logger.info(f"User logged in: {user.email}")
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "name": user.name, "is_admin": user.is_admin}

@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_admin": current_user.is_admin,
        "panel_capacity_kw": current_user.panel_capacity_kw,
    }

# ─────────────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/users")
def get_users(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_admin)
):
    return db.query(models.User).offset(skip).limit(limit).all()

@app.get("/api/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/users/by-email/{email}")
def get_user_by_email(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ─────────────────────────────────────────────────────────────────────────────
# Wallets
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/wallets/{user_id}")
def get_wallet(
    user_id: str,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    # Allow public read for now (dashboard needs it before full auth integration)
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet

# ─────────────────────────────────────────────────────────────────────────────
# Listings
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/listings")
def get_listings(status: Optional[str] = "open", db: Session = Depends(database.get_db)):
    query = db.query(models.EnergyListing)
    if status:
        query = query.filter(models.EnergyListing.status == status)
    listings = query.order_by(desc(models.EnergyListing.created_at)).all()
    return [
        {
            "id": l.id,
            "offer_type": l.offer_type,
            "kwh": l.kwh_amount,
            "price": l.price_per_kwh,
            "status": l.status,
            "time": l.created_at.strftime("%H:%M") if l.created_at else "00:00",
            "neighbor": l.owner.name if l.owner else "Network"
        }
        for l in listings
    ]

@app.post("/api/listings", status_code=201)
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    # Accept authenticated user; fall back to a default seed user for backward compatibility
    if current_user:
        user_id = current_user.id
    else:
        # For unauthenticated requests (legacy frontend), use first available user
        first_user = db.query(models.User).first()
        user_id = first_user.id if first_user else "unknown"

    db_listing = models.EnergyListing(
        user_id=user_id,
        offer_type=listing.offer_type,
        kwh_amount=listing.kwh_amount,
        price_per_kwh=listing.price_per_kwh,
        status="open"
    )
    db.add(db_listing)
    db.commit()
    logger.info(f"Listing created: {listing.offer_type} {listing.kwh_amount}kWh @ ${listing.price_per_kwh} by user {user_id}")
    return {"status": "success", "id": db_listing.id}

@app.delete("/api/listings/{listing_id}")
def cancel_listing(
    listing_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    listing = db.query(models.EnergyListing).filter(models.EnergyListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not your listing")
    listing.status = "canceled"
    db.commit()
    return {"status": "canceled"}

# ─────────────────────────────────────────────────────────────────────────────
# Transactions
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/transactions")
def get_transactions(
    user_id: Optional[str] = None,
    limit: int = 50,
    since_id: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Transaction)
    if user_id:
        query = query.filter(
            or_(models.Transaction.buyer_id == user_id, models.Transaction.seller_id == user_id)
        )
    if since_id is not None:
        query = query.filter(models.Transaction.id > since_id)
    txs = query.order_by(desc(models.Transaction.created_at)).limit(limit).all()

    res = []
    for t in txs:
        buyer = db.query(models.User).filter(models.User.id == t.buyer_id).first()
        seller = db.query(models.User).filter(models.User.id == t.seller_id).first()
        created = t.created_at
        res.append({
            "id": t.id,
            "kwh_amount": t.kwh_amount,
            "price_per_kwh": t.price_per_kwh,
            "total_value": t.total_value,
            "co2_saved_kg": t.co2_saved_kg,
            "created_at": created.isoformat() if created else None,
            "date": created.strftime("%b %d") if created else "—",
            "time": created.strftime("%H:%M") if created else "00:00",
            "buyer_id": t.buyer_id,
            "seller_id": t.seller_id,
            "buyer": buyer.name if buyer else "Network",
            "seller": seller.name if seller else "Network",
            "kwh": t.kwh_amount,
            "price": t.price_per_kwh,
            "status": "completed",
            "trend": "up",
        })
    return res

# ─────────────────────────────────────────────────────────────────────────────
# AI Forecast
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/forecast/{user_id}")
def get_solar_forecast(
    user_id: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    panel_kw = user.panel_capacity_kw
    if panel_kw <= 0:
        return {"predicted_kwh": 0.0, "panel_kw": 0.0, "weather": {"condition": "N/A"}}

    fetch_lat = lat if lat is not None else user.location_lat
    fetch_lng = lng if lng is not None else user.location_lng

    live_weather = weather.fetch_daily_weather(lat=fetch_lat, lng=fetch_lng)
    predicted_kwh = solar_regression.predict_generation(panel_kw, live_weather)

    curve_weights = [0.02, 0.06, 0.12, 0.17, 0.22, 0.25, 0.26, 0.25, 0.22, 0.17, 0.12, 0.06, 0.02]
    total_weight = sum(curve_weights)
    hourly_forecast: list[dict[str, Any]] = [{"time": "05:00", "kwh": 0.0}]
    for i, w in enumerate(curve_weights):
        hourly_forecast.append({"time": f"{6 + i:02d}:00", "kwh": round((w / total_weight) * predicted_kwh, 2)})
    hourly_forecast.append({"time": "19:00", "kwh": 0.0})

    return {
        "user_id": user_id,
        "panel_kw": panel_kw,
        "predicted_total_kwh": predicted_kwh,
        "hourly_curve": hourly_forecast,
        "weather_context": live_weather,
    }

@app.get("/api/forecast/weekly/{user_id}")
def get_weekly_forecast(
    user_id: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    panel_kw = user.panel_capacity_kw
    fetch_lat = lat if lat is not None else user.location_lat
    fetch_lng = lng if lng is not None else user.location_lng

    import requests as _req
    from datetime import date as _date, timedelta as _td
    days = []
    try:
        r = _req.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": fetch_lat, "longitude": fetch_lng,
                "daily": ["temperature_2m_max", "weather_code", "sunshine_duration", "uv_index_max"],
                "timezone": "auto", "forecast_days": 7
            }, timeout=10
        )
        r.raise_for_status()
        data = r.json().get("daily", {})
        wc_map = {0:"Clear",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",45:"Foggy",51:"Drizzle",61:"Rain",80:"Showers",95:"Thunderstorms"}
        icon_map = {0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",51:"🌦",61:"🌧",80:"🌦",95:"⛈"}
        today = _date.today()
        for i in range(7):
            d = today + _td(days=i)
            wc = data.get("weather_code", [2]*7)[i]
            sunshine_h = data.get("sunshine_duration", [36000]*7)[i] / 3600
            predicted = round(panel_kw * sunshine_h * 0.85, 1)
            days.append({
                "day": "Today" if i == 0 else d.strftime("%a"),
                "date": d.strftime("%b %d"),
                "weather": wc_map.get(wc, "Variable"),
                "icon": icon_map.get(wc, "🌤"),
                "temp": round(data.get("temperature_2m_max", [28]*7)[i]),
                "uv": round(data.get("uv_index_max", [5]*7)[i]),
                "predicted": predicted,
                "accuracy": max(70, 94 - i * 3)
            })
    except Exception as e:
        logger.warning(f"Weekly forecast API failed: {e}")
        today = _date.today()
        for i in range(7):
            d = today + _td(days=i)
            days.append({"day": "Today" if i==0 else d.strftime("%a"), "date": d.strftime("%b %d"),
                         "weather": "Variable", "icon": "🌤", "temp": 28, "uv": 5,
                         "predicted": round(panel_kw * 10 * 0.85, 1), "accuracy": max(70, 94-i*3)})
    return {"days": days, "panel_kw": panel_kw}

# ─────────────────────────────────────────────────────────────────────────────
# Quantum Optimization (async background task)
# ─────────────────────────────────────────────────────────────────────────────

def _run_qaoa_task(job_id: str, bids_data: list, asks_data: list, users_dict: dict, db_url: str):
    """Runs in a background thread — does NOT receive a live DB session."""
    import time as _time
    from backend.database import SessionLocal
    t0 = _time.time()
    _optimize_jobs[job_id]["status"] = "running"
    db = SessionLocal()
    try:
        matched_pairs = quantum_optimizer.run_qaoa_matching(bids_data, asks_data, users_dict)
        transactions_created = []

        for (bid_dict, ask_dict) in matched_pairs:
            matched_kwh = min(bid_dict["kwh_amount"], ask_dict["kwh_amount"])
            clearing_price = round((bid_dict["price_per_kwh"] + ask_dict["price_per_kwh"]) / 2.0, 3)
            total_value = round(matched_kwh * clearing_price, 4)
            co2_saved = round(matched_kwh * 0.4, 4)

            tx = models.Transaction(
                buyer_id=bid_dict["user_id"], seller_id=ask_dict["user_id"],
                listing_id=ask_dict["id"], kwh_amount=matched_kwh,
                price_per_kwh=clearing_price, total_value=total_value, co2_saved_kg=co2_saved
            )
            db.add(tx)

            for lid, new_status in [(bid_dict["id"], "matched"), (ask_dict["id"], "matched")]:
                row = db.query(models.EnergyListing).filter(models.EnergyListing.id == lid).first()
                if row:
                    row.status = new_status

            buyer_w = db.query(models.Wallet).filter(models.Wallet.user_id == bid_dict["user_id"]).first()
            seller_w = db.query(models.Wallet).filter(models.Wallet.user_id == ask_dict["user_id"]).first()
            if buyer_w:
                buyer_w.total_spent += total_value
                buyer_w.energy_credits = max(0, buyer_w.energy_credits - total_value)
                buyer_w.kwh_consumed += matched_kwh
                buyer_w.co2_offset_kg += co2_saved
            if seller_w:
                seller_w.total_earned += total_value
                seller_w.energy_credits += total_value
                seller_w.kwh_available = max(0.0, seller_w.kwh_available - matched_kwh)

            transactions_created.append({
                "buyer": bid_dict["user_id"], "seller": ask_dict["user_id"],
                "kwh": matched_kwh, "price": clearing_price
            })

        db.commit()
        elapsed = round(_time.time() - t0, 2)
        logger.info(f"QAOA job {job_id}: {len(matched_pairs)} pairs matched in {elapsed}s")
        _optimize_jobs[job_id] = {
            "status": "done", "matched_pairs": len(matched_pairs),
            "transactions": transactions_created, "elapsed_s": elapsed
        }
    except Exception as e:
        logger.error(f"QAOA job {job_id} failed: {e}")
        _optimize_jobs[job_id] = {"status": "error", "detail": str(e)}
    finally:
        db.close()

@app.post("/api/market/optimize")
@limiter.limit("5/minute")
def optimize_market(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
):
    open_bids = db.query(models.EnergyListing).filter(
        models.EnergyListing.offer_type == "buy", models.EnergyListing.status == "open"
    ).all()
    open_asks = db.query(models.EnergyListing).filter(
        models.EnergyListing.offer_type == "sell", models.EnergyListing.status == "open"
    ).all()

    if not open_bids or not open_asks:
        return {"status": "no_pairs_available", "matched_pairs": 0, "transactions": []}

    users = db.query(models.User).all()
    users_dict = {u.id: u for u in users}

    def clean(l):
        return {"id": l.id, "user_id": l.user_id, "kwh_amount": l.kwh_amount,
                "price_per_kwh": l.price_per_kwh, "offer_type": l.offer_type}

    bids_data = [clean(b) for b in open_bids]
    asks_data = [clean(a) for a in open_asks]

    job_id = str(uuid.uuid4())
    _optimize_jobs[job_id] = {"status": "queued"}
    background_tasks.add_task(
        _run_qaoa_task, job_id, bids_data, asks_data, users_dict, settings.database_url
    )
    logger.info(f"QAOA job {job_id} queued: {len(bids_data)} bids × {len(asks_data)} asks")

    # Also run synchronously to return immediate results (background keeps DB in sync)
    matched_pairs = quantum_optimizer.run_qaoa_matching(bids_data, asks_data, users_dict)
    transactions_created = []
    for (bid_dict, ask_dict) in matched_pairs:
        matched_kwh = min(bid_dict["kwh_amount"], ask_dict["kwh_amount"])
        clearing_price = round((bid_dict["price_per_kwh"] + ask_dict["price_per_kwh"]) / 2.0, 3)
        total_value = round(matched_kwh * clearing_price, 4)
        co2_saved = round(matched_kwh * 0.4, 4)

        tx = models.Transaction(
            buyer_id=bid_dict["user_id"], seller_id=ask_dict["user_id"],
            listing_id=ask_dict["id"], kwh_amount=matched_kwh,
            price_per_kwh=clearing_price, total_value=total_value, co2_saved_kg=co2_saved
        )
        db.add(tx)
        for lid in [bid_dict["id"], ask_dict["id"]]:
            row = db.query(models.EnergyListing).filter(models.EnergyListing.id == lid).first()
            if row:
                row.status = "matched"
        buyer_w = db.query(models.Wallet).filter(models.Wallet.user_id == bid_dict["user_id"]).first()
        seller_w = db.query(models.Wallet).filter(models.Wallet.user_id == ask_dict["user_id"]).first()
        if buyer_w:
            buyer_w.total_spent += total_value
            buyer_w.energy_credits = max(0, buyer_w.energy_credits - total_value)
            buyer_w.kwh_consumed += matched_kwh
            buyer_w.co2_offset_kg += co2_saved
        if seller_w:
            seller_w.total_earned += total_value
            seller_w.energy_credits += total_value
            seller_w.kwh_available = max(0.0, seller_w.kwh_available - matched_kwh)
        transactions_created.append({"buyer": bid_dict["user_id"], "seller": ask_dict["user_id"],
                                      "kwh": matched_kwh, "price": clearing_price})
    db.commit()
    return {
        "status": "success",
        "matched_pairs": len(matched_pairs),
        "transactions": transactions_created,
        "job_id": job_id,
    }

@app.get("/api/market/optimize/{job_id}")
def get_optimize_status(job_id: str):
    job = _optimize_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )


