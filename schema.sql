-- ============================================================
-- Q-TRADE DATABASE SCHEMA (Supabase / PostgreSQL compatible)
-- Phase 1 — Initial Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'both')),
  lat           DECIMAL(9, 6),
  lng           DECIMAL(9, 6),
  avatar_initials TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WALLETS
-- Tracks energy credits balance per user
-- ============================================================
CREATE TABLE wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  energy_credits  DECIMAL(12, 4) DEFAULT 0.0,
  kwh_available   DECIMAL(10, 4) DEFAULT 0.0,
  kwh_consumed    DECIMAL(10, 4) DEFAULT 0.0,
  total_earned    DECIMAL(12, 4) DEFAULT 0.0,
  total_spent     DECIMAL(12, 4) DEFAULT 0.0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- ENERGY LISTINGS
-- Open buy/sell orders awaiting matching
-- ============================================================
CREATE TABLE energy_listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  kwh_amount      DECIMAL(10, 4) NOT NULL CHECK (kwh_amount > 0),
  price_per_kwh   DECIMAL(8, 4) NOT NULL CHECK (price_per_kwh > 0),
  availability    TEXT DEFAULT 'all_day',  -- e.g. 'morning', 'afternoon', 'all_day'
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'cancelled', 'expired')),
  listed_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day')
);

-- ============================================================
-- TRANSACTIONS
-- Finalized matched energy trades
-- ============================================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_sell_id UUID REFERENCES energy_listings(id),
  listing_buy_id  UUID REFERENCES energy_listings(id),
  seller_id       UUID NOT NULL REFERENCES users(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  kwh_traded      DECIMAL(10, 4) NOT NULL,
  price_per_kwh   DECIMAL(8, 4) NOT NULL,
  total_value     DECIMAL(12, 4) GENERATED ALWAYS AS (kwh_traded * price_per_kwh) STORED,
  distance_miles  DECIMAL(6, 3),
  co2_saved_kg    DECIMAL(8, 4),
  matched_by      TEXT DEFAULT 'qaoa_simulator',
  status          TEXT DEFAULT 'matched' CHECK (status IN ('matched', 'completed', 'disputed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOLAR FORECASTS
-- SunSync AI predictions per user per day
-- ============================================================
CREATE TABLE solar_forecasts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  forecast_date   DATE NOT NULL,
  peak_kwh        DECIMAL(8, 4),
  peak_hour       INTEGER CHECK (peak_hour BETWEEN 0 AND 23),
  total_kwh       DECIMAL(10, 4),
  sellable_kwh    DECIMAL(10, 4),
  weather_source  TEXT DEFAULT 'openweathermap',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, forecast_date)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_listings_user ON energy_listings(user_id);
CREATE INDEX idx_listings_status ON energy_listings(status);
CREATE INDEX idx_listings_type ON energy_listings(type);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_forecasts_user_date ON solar_forecasts(user_id, forecast_date);

-- ============================================================
-- SEED DATA (Demo — 6 mock users)
-- ============================================================

-- Users
INSERT INTO users (id, email, full_name, role, lat, lng, avatar_initials) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'alex.johnson@qtrade.com',  'Alex Johnson',  'both',   37.774929, -122.419418, 'AJ'),
  ('a0000001-0000-0000-0000-000000000002', 'maria.chen@qtrade.com',    'Maria Chen',    'buyer',  37.775812, -122.418903, 'MC'),
  ('a0000001-0000-0000-0000-000000000003', 'david.kim@qtrade.com',     'David Kim',     'seller', 37.773445, -122.420012, 'DK'),
  ('a0000001-0000-0000-0000-000000000004', 'sarah.lee@qtrade.com',     'Sarah Lee',     'buyer',  37.776230, -122.417654, 'SL'),
  ('a0000001-0000-0000-0000-000000000005', 'james.park@qtrade.com',    'James Park',    'seller', 37.772890, -122.421333, 'JP'),
  ('a0000001-0000-0000-0000-000000000006', 'emily.wong@qtrade.com',    'Emily Wong',    'both',   37.777510, -122.416789, 'EW');

-- Wallets
INSERT INTO wallets (user_id, energy_credits, kwh_available, kwh_consumed, total_earned, total_spent) VALUES
  ('a0000001-0000-0000-0000-000000000001', 248.5,  18.4, 142.3, 1204.80, 398.20),
  ('a0000001-0000-0000-0000-000000000002', 320.0,   0.0,  98.7,    0.00, 520.40),
  ('a0000001-0000-0000-0000-000000000003', 180.5,  24.1,  55.2, 2100.60,  89.30),
  ('a0000001-0000-0000-0000-000000000004',  95.0,   0.0,  40.8,    0.00, 210.10),
  ('a0000001-0000-0000-0000-000000000005', 410.0,  11.8,  22.4, 3450.90,  44.20),
  ('a0000001-0000-0000-0000-000000000006', 155.0,   9.3,  78.6,  820.30, 190.50);

-- Energy Listings
INSERT INTO energy_listings (user_id, type, kwh_amount, price_per_kwh, status) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'sell', 4.5, 0.12, 'pending'),
  ('a0000001-0000-0000-0000-000000000002', 'buy',  3.0, 0.13, 'pending'),
  ('a0000001-0000-0000-0000-000000000003', 'sell', 7.2, 0.10, 'matched'),
  ('a0000001-0000-0000-0000-000000000004', 'buy',  2.1, 0.11, 'matched'),
  ('a0000001-0000-0000-0000-000000000005', 'sell', 5.5, 0.09, 'pending'),
  ('a0000001-0000-0000-0000-000000000006', 'buy',  4.0, 0.12, 'pending');

-- Solar Forecasts (today)
INSERT INTO solar_forecasts (user_id, forecast_date, peak_kwh, peak_hour, total_kwh, sellable_kwh) VALUES
  ('a0000001-0000-0000-0000-000000000001', CURRENT_DATE, 5.4, 12, 39.8, 18.4),
  ('a0000001-0000-0000-0000-000000000003', CURRENT_DATE, 7.1, 13, 48.2, 24.1),
  ('a0000001-0000-0000-0000-000000000005', CURRENT_DATE, 3.8, 11, 28.6, 11.8),
  ('a0000001-0000-0000-0000-000000000006', CURRENT_DATE, 4.2, 12, 31.4,  9.3);
