"""
backend/scripts/seed_admin.py

Idempotent admin user seeder. Creates the admin user if they don't already exist.
Run once after deploying to a fresh database:

    python -m backend.scripts.seed_admin
    # or from the project root with venv active:
    venv/Scripts/python backend/scripts/seed_admin.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal, engine
from backend import models
from backend.auth import hash_password
from backend.config import settings

def seed():
    # Ensure all tables exist
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(
            models.User.email == settings.admin_email
        ).first()

        if existing:
            print(f"✅ Admin user already exists: {settings.admin_email}")
            return

        admin = models.User(
            id="admin-001",
            name=settings.admin_name,
            email=settings.admin_email,
            hashed_password=hash_password(settings.admin_password),
            role="admin",
            is_admin=True,
            panel_capacity_kw=0.0,
            location_lat=30.2672,
            location_lng=-97.7431,
        )

        db.add(admin)
        db.commit()
        print(f"🌟 Admin user created: {settings.admin_email}")
        print(f"   Password: {settings.admin_password}")
        print(f"   ⚠️  Change this password after first login!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding admin: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
