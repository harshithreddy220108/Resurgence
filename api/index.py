import sys
import os

# Add project root for Vercel
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.scripts.seed_admin import seed

# Auto-seed the database for the demo
try:
    seed()
except Exception:
    pass


