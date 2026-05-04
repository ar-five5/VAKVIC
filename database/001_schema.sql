-- ============================================================
-- VAKVIC Database Schema
-- Value Analytics & Knowledge-driven Value Intelligence Core
-- ============================================================
-- Run this file first to create all tables, indexes, and enums.
-- Usage: psql -U vakvic_admin -d vakvic_db -f 001_schema.sql
-- ============================================================

-- Clean slate (development only — remove in production)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- For password hashing

-- ============================================================
-- CUSTOM ENUM TYPES
-- ============================================================
CREATE TYPE asset_type AS ENUM (
    'stock',
    'mutual_fund',
    'etf',
    'bond',
    'commodity_gold',
    'commodity_silver'
);

CREATE TYPE risk_level AS ENUM (
    'low',
    'medium',
    'high'
);

CREATE TYPE prediction_status AS ENUM (
    'pending',
    'completed',
    'failed'
);

-- ============================================================
-- TABLE: assets
-- Master list of all financial instruments tracked
-- ============================================================
CREATE TABLE assets (
    asset_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol          VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    asset_type      asset_type NOT NULL,
    sector          VARCHAR(100),
    exchange        VARCHAR(50),
    currency        VARCHAR(10) DEFAULT 'USD',
    is_active       BOOLEAN DEFAULT TRUE,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: historical_prices
-- Daily OHLCV data — this will be your largest table
-- ============================================================
CREATE TABLE historical_prices (
    price_id        BIGSERIAL PRIMARY KEY,
    asset_id        UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    trade_date      DATE NOT NULL,
    open_price      NUMERIC(18, 6),
    high_price      NUMERIC(18, 6),
    low_price       NUMERIC(18, 6),
    close_price     NUMERIC(18, 6) NOT NULL,
    adj_close       NUMERIC(18, 6),
    volume          BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate entries for same asset on same date
    CONSTRAINT unique_asset_date UNIQUE (asset_id, trade_date)
);

-- Critical indexes for query performance
CREATE INDEX idx_prices_asset_id ON historical_prices(asset_id);
CREATE INDEX idx_prices_trade_date ON historical_prices(trade_date DESC);
CREATE INDEX idx_prices_asset_date ON historical_prices(asset_id, trade_date DESC);

-- ============================================================
-- TABLE: users
-- Basic user management (keep it simple for MVP)
-- ============================================================
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: predictions
-- Stores ML model prediction results
-- ============================================================
CREATE TABLE predictions (
    prediction_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id        UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    model_type      VARCHAR(50) NOT NULL DEFAULT 'LSTM',
    prediction_date DATE NOT NULL,           -- The date being predicted
    predicted_price NUMERIC(18, 6) NOT NULL,
    confidence      NUMERIC(5, 4),           -- 0.0000 to 1.0000
    status          prediction_status DEFAULT 'completed',
    input_window    INTEGER DEFAULT 60,      -- Number of past days used as input
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_asset ON predictions(asset_id, prediction_date DESC);
CREATE INDEX idx_predictions_user ON predictions(user_id);

-- ============================================================
-- TABLE: asset_metrics
-- Precomputed financial metrics for comparison feature
-- ============================================================
CREATE TABLE asset_metrics (
    metric_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id            UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    calculation_date    DATE NOT NULL,
    
    -- Return metrics
    daily_return_avg    NUMERIC(12, 8),
    annual_return       NUMERIC(12, 8),
    
    -- Risk metrics
    daily_volatility    NUMERIC(12, 8),
    annual_volatility   NUMERIC(12, 8),
    sharpe_ratio        NUMERIC(10, 6),
    max_drawdown        NUMERIC(10, 6),
    beta                NUMERIC(10, 6),
    
    -- ML-computed
    suitability_score   NUMERIC(5, 2),       -- 0-100 score from ML model
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_asset_metric_date UNIQUE (asset_id, calculation_date)
);

CREATE INDEX idx_metrics_asset ON asset_metrics(asset_id, calculation_date DESC);

-- ============================================================
-- TABLE: comparisons
-- Cached comparison results between two assets
-- ============================================================
CREATE TABLE comparisons (
    comparison_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(user_id) ON DELETE SET NULL,
    asset_id_1          UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    asset_id_2          UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    
    -- Scores
    suitability_score_1 NUMERIC(5, 2),
    suitability_score_2 NUMERIC(5, 2),
    
    -- Snapshot of key metrics at comparison time
    comparison_data     JSONB,               -- Flexible storage for full comparison details
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT different_assets CHECK (asset_id_1 != asset_id_2)
);

CREATE INDEX idx_comparisons_user ON comparisons(user_id);

-- ============================================================
-- TABLE: portfolios
-- User-created portfolio optimization requests
-- ============================================================
CREATE TABLE portfolios (
    portfolio_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name            VARCHAR(100) DEFAULT 'My Portfolio',
    capital         NUMERIC(18, 2) NOT NULL CHECK (capital > 0),
    risk_level      risk_level NOT NULL,
    time_horizon    INTEGER NOT NULL CHECK (time_horizon > 0),  -- in months
    
    -- Optimization results
    expected_return     NUMERIC(10, 6),
    portfolio_volatility NUMERIC(10, 6),
    sharpe_ratio        NUMERIC(10, 6),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- ============================================================
-- TABLE: portfolio_allocations
-- Individual asset allocations within an optimized portfolio
-- ============================================================
CREATE TABLE portfolio_allocations (
    allocation_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    weight          NUMERIC(6, 4) NOT NULL CHECK (weight >= 0 AND weight <= 1),  -- 0.0 to 1.0
    allocated_amount NUMERIC(18, 2),
    expected_return  NUMERIC(10, 6),
    
    CONSTRAINT unique_portfolio_asset UNIQUE (portfolio_id, asset_id)
);

CREATE INDEX idx_allocations_portfolio ON portfolio_allocations(portfolio_id);

-- ============================================================
-- TABLE: watchlist (bonus feature — easy to add)
-- ============================================================
CREATE TABLE watchlist (
    watchlist_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    added_at        TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_asset_watch UNIQUE (user_id, asset_id)
);

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER trigger_assets_updated
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_portfolios_updated
    BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Latest price for each asset (dashboard use)
CREATE VIEW latest_prices AS
SELECT DISTINCT ON (hp.asset_id)
    a.symbol,
    a.name,
    a.asset_type,
    hp.trade_date,
    hp.close_price,
    hp.adj_close,
    hp.volume,
    hp.open_price,
    hp.high_price,
    hp.low_price
FROM historical_prices hp
JOIN assets a ON a.asset_id = hp.asset_id
ORDER BY hp.asset_id, hp.trade_date DESC;

-- Daily returns view (used by ML team for calculations)
CREATE VIEW daily_returns AS
SELECT
    hp.asset_id,
    a.symbol,
    hp.trade_date,
    hp.close_price,
    LAG(hp.close_price) OVER (PARTITION BY hp.asset_id ORDER BY hp.trade_date) AS prev_close,
    CASE 
        WHEN LAG(hp.close_price) OVER (PARTITION BY hp.asset_id ORDER BY hp.trade_date) > 0 
        THEN (hp.close_price - LAG(hp.close_price) OVER (PARTITION BY hp.asset_id ORDER BY hp.trade_date)) 
             / LAG(hp.close_price) OVER (PARTITION BY hp.asset_id ORDER BY hp.trade_date)
        ELSE NULL
    END AS daily_return
FROM historical_prices hp
JOIN assets a ON a.asset_id = hp.asset_id
ORDER BY hp.asset_id, hp.trade_date;

-- ============================================================
-- DONE! Schema is ready.
-- Next: Run 002_seed_assets.sql to populate the assets table
-- Then: Run the Python seed script to fetch historical prices
-- ============================================================
