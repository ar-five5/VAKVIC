-- ============================================================
-- VAKVIC — Common Queries Reference
-- ============================================================
-- These are queries your team will use frequently.
-- Koushik: use these as the basis for your Express service layer.
-- Venkat/Vivardhan: use these to pull training data.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. ASSET QUERIES (Koushik's GET /api/assets)
-- ────────────────────────────────────────────────────────────

-- Get all assets with their latest price
SELECT 
    a.asset_id,
    a.symbol,
    a.name,
    a.asset_type,
    a.sector,
    a.currency,
    lp.close_price AS latest_price,
    lp.trade_date AS price_date
FROM assets a
LEFT JOIN latest_prices lp ON lp.symbol = a.symbol
WHERE a.is_active = TRUE
ORDER BY a.asset_type, a.symbol;

-- Search assets by name or symbol (for the search bar)
SELECT asset_id, symbol, name, asset_type
FROM assets
WHERE is_active = TRUE
  AND (symbol ILIKE '%search_term%' OR name ILIKE '%search_term%')
LIMIT 10;

-- Get assets grouped by type (for dropdown filters)
SELECT asset_type, json_agg(json_build_object(
    'asset_id', asset_id,
    'symbol', symbol,
    'name', name
) ORDER BY symbol) AS assets
FROM assets
WHERE is_active = TRUE
GROUP BY asset_type;


-- ────────────────────────────────────────────────────────────
-- 2. PRICE QUERIES (Koushik's GET /api/assets/:symbol/prices)
-- ────────────────────────────────────────────────────────────

-- Get historical prices for one asset (last N days)
SELECT trade_date, open_price, high_price, low_price, close_price, adj_close, volume
FROM historical_prices hp
JOIN assets a ON a.asset_id = hp.asset_id
WHERE a.symbol = 'AAPL'
ORDER BY trade_date DESC
LIMIT 365;  -- Last ~1 year

-- Get price data within a date range (for charts)
SELECT trade_date, close_price, volume
FROM historical_prices hp
JOIN assets a ON a.asset_id = hp.asset_id
WHERE a.symbol = 'AAPL'
  AND hp.trade_date BETWEEN '2024-01-01' AND '2025-12-31'
ORDER BY trade_date ASC;

-- Get latest price + change for an asset (dashboard cards)
SELECT 
    a.symbol,
    a.name,
    curr.close_price AS current_price,
    prev.close_price AS previous_price,
    (curr.close_price - prev.close_price) AS price_change,
    ROUND(((curr.close_price - prev.close_price) / prev.close_price * 100)::numeric, 2) AS change_percent
FROM assets a
JOIN historical_prices curr ON curr.asset_id = a.asset_id
JOIN historical_prices prev ON prev.asset_id = a.asset_id
WHERE a.symbol = 'AAPL'
  AND curr.trade_date = (SELECT MAX(trade_date) FROM historical_prices WHERE asset_id = a.asset_id)
  AND prev.trade_date = (SELECT MAX(trade_date) FROM historical_prices WHERE asset_id = a.asset_id AND trade_date < curr.trade_date)
;


-- ────────────────────────────────────────────────────────────
-- 3. ML TRAINING DATA (Venkat/Vivardhan)
-- ────────────────────────────────────────────────────────────

-- Pull clean training data for LSTM (close prices as time series)
SELECT trade_date, close_price
FROM historical_prices hp
JOIN assets a ON a.asset_id = hp.asset_id
WHERE a.symbol = 'AAPL'
  AND hp.close_price IS NOT NULL
ORDER BY trade_date ASC;

-- Pull data for multiple assets at once (portfolio optimization)
SELECT a.symbol, hp.trade_date, hp.close_price
FROM historical_prices hp
JOIN assets a ON a.asset_id = hp.asset_id
WHERE a.symbol IN ('AAPL', 'MSFT', 'GOOGL', 'JPM', 'BND', 'GLD')
  AND hp.close_price IS NOT NULL
ORDER BY a.symbol, hp.trade_date ASC;

-- Get daily returns for volatility/risk calculations
SELECT symbol, trade_date, daily_return
FROM daily_returns
WHERE symbol = 'AAPL'
  AND daily_return IS NOT NULL
ORDER BY trade_date ASC;


-- ────────────────────────────────────────────────────────────
-- 4. COMPARISON QUERIES
-- ────────────────────────────────────────────────────────────

-- Side-by-side price data for two assets (aligned by date)
SELECT 
    COALESCE(a1.trade_date, a2.trade_date) AS trade_date,
    a1.close_price AS asset_1_price,
    a2.close_price AS asset_2_price
FROM (
    SELECT hp.trade_date, hp.close_price 
    FROM historical_prices hp 
    JOIN assets a ON a.asset_id = hp.asset_id 
    WHERE a.symbol = 'AAPL'
) a1
FULL OUTER JOIN (
    SELECT hp.trade_date, hp.close_price 
    FROM historical_prices hp 
    JOIN assets a ON a.asset_id = hp.asset_id 
    WHERE a.symbol = 'MSFT'
) a2 ON a1.trade_date = a2.trade_date
ORDER BY trade_date ASC;

-- Quick stats for comparison cards
SELECT 
    a.symbol,
    a.name,
    COUNT(hp.price_id) AS data_points,
    MIN(hp.close_price) AS all_time_low,
    MAX(hp.close_price) AS all_time_high,
    AVG(hp.close_price)::NUMERIC(18,2) AS avg_price,
    (SELECT hp2.close_price FROM historical_prices hp2 WHERE hp2.asset_id = a.asset_id ORDER BY hp2.trade_date DESC LIMIT 1) AS latest_price
FROM assets a
JOIN historical_prices hp ON hp.asset_id = a.asset_id
WHERE a.symbol IN ('AAPL', 'MSFT')
GROUP BY a.asset_id, a.symbol, a.name;


-- ────────────────────────────────────────────────────────────
-- 5. PORTFOLIO QUERIES
-- ────────────────────────────────────────────────────────────

-- Save a new portfolio optimization result
-- (Koushik: use this in your POST /api/portfolio/optimize handler)
/*
WITH new_portfolio AS (
    INSERT INTO portfolios (user_id, capital, risk_level, time_horizon, expected_return, portfolio_volatility, sharpe_ratio)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING portfolio_id
)
INSERT INTO portfolio_allocations (portfolio_id, asset_id, weight, allocated_amount, expected_return)
SELECT 
    np.portfolio_id,
    a.asset_id,
    allocation.weight,
    allocation.weight * $2,  -- capital * weight
    allocation.expected_return
FROM new_portfolio np,
     LATERAL (VALUES 
        ('AAPL', 0.25, 0.12),
        ('MSFT', 0.20, 0.10),
        ('BND',  0.30, 0.04),
        ('GLD',  0.25, 0.06)
     ) AS allocation(symbol, weight, expected_return)
JOIN assets a ON a.symbol = allocation.symbol;
*/

-- Get a user's portfolio with allocations
SELECT 
    p.portfolio_id,
    p.capital,
    p.risk_level,
    p.time_horizon,
    p.expected_return AS portfolio_return,
    p.portfolio_volatility,
    p.sharpe_ratio,
    pa.weight,
    pa.allocated_amount,
    a.symbol,
    a.name,
    a.asset_type
FROM portfolios p
JOIN portfolio_allocations pa ON pa.portfolio_id = p.portfolio_id
JOIN assets a ON a.asset_id = pa.asset_id
WHERE p.user_id = 'some-user-uuid'
ORDER BY p.created_at DESC, pa.weight DESC;


-- ────────────────────────────────────────────────────────────
-- 6. ADMIN / MAINTENANCE
-- ────────────────────────────────────────────────────────────

-- Check data freshness (are we up to date?)
SELECT 
    a.symbol,
    MAX(hp.trade_date) AS latest_data,
    NOW()::DATE - MAX(hp.trade_date) AS days_stale
FROM assets a
JOIN historical_prices hp ON hp.asset_id = a.asset_id
GROUP BY a.symbol
ORDER BY days_stale DESC;

-- Database size
SELECT 
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
