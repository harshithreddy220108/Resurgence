import sys
import os
import traceback

# Add project root for Vercel
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root not in sys.path:
    sys.path.insert(0, root)

try:
    from backend.main import app
    from backend.scripts.seed_admin import seed
    # Seed once on startup
    seed()
except Exception as e:
    # If it fails, we want to see why in the logs/browser
    print(f"ERROR STARTING API: {e}")
    traceback.print_exc()

# Vercel needs the 'app' variable to be available at the module level
from backend.main import app as handler
app = handler



