# Q-Trade — VPS Deployment Guide

## Prerequisites
- Ubuntu 22.04 VPS (2GB RAM minimum)
- Docker + Docker Compose installed
- A domain name pointing to your VPS IP

---

## 1. Clone & Configure

```bash
git clone https://github.com/youruser/q-trade.git
cd q-trade

# Create your production .env from the template
cp .env.example .env
nano .env
```

**Fill in these values in `.env`:**
```bash
DATABASE_URL=sqlite:///./data/qtrade.db
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<your strong admin password>
ADMIN_NAME=Platform Admin
```

Also set your domain in `nginx/default.conf` (replace `yourdomain.com`).

---

## 2. Build & Start

```bash
# Build and start both services (backend seeds admin automatically on first start)
docker compose up --build -d

# Check they're healthy
docker compose ps
docker compose logs backend --tail=50
```

---

## 3. Enable HTTPS with Let's Encrypt

```bash
# On the VPS host (not in Docker):
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Then uncomment the HTTPS block in nginx/default.conf
# and restart:
docker compose restart frontend
```

---

## 4. Verify Deployment

```bash
# Backend health
curl https://yourdomain.com/api/health

# Confirm docs are hidden in production
curl https://yourdomain.com/docs  # Should return 404

# Confirm frontend loads
curl -I https://yourdomain.com    # Should return 200
```

---

## 5. Admin Login

Navigate to `https://yourdomain.com/login` and log in with the credentials you set in `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## Maintenance

```bash
# View live logs
docker compose logs -f

# Restart after config change
docker compose restart

# Full rebuild after code changes
docker compose up --build -d

# Backup the SQLite database
docker compose exec backend sh -c "cp /app/data/qtrade.db /app/data/qtrade.backup.$(date +%Y%m%d).db"
```

---

## Architecture

```
User Browser
     │
     ▼
  nginx :80/:443
  ├── GET /          → serves React SPA (dist/)
  ├── GET /api/*     → proxy → FastAPI :8000
  └── GET /health.txt → "ok"
         │
         ▼
   FastAPI + Gunicorn (2 uvicorn workers)
         │
         ▼
   SQLite (/app/data/qtrade.db) — persisted via Docker volume
```
