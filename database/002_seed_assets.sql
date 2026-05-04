-- ============================================================
-- VAKVIC Seed Data — Asset Master List
-- Run after 001_schema.sql
-- Usage: psql -U vakvic_admin -d vakvic_db -f 002_seed_assets.sql
-- ============================================================

-- ============================================================
-- US STOCKS (Large Cap, well-known, good yfinance coverage)
-- ============================================================
INSERT INTO assets (symbol, name, asset_type, sector, exchange, currency) VALUES
('AAPL',    'Apple Inc.',                   'stock', 'Technology',       'NASDAQ', 'USD'),
('MSFT',    'Microsoft Corporation',        'stock', 'Technology',       'NASDAQ', 'USD'),
('GOOGL',   'Alphabet Inc.',               'stock', 'Technology',       'NASDAQ', 'USD'),
('AMZN',    'Amazon.com Inc.',             'stock', 'Consumer Cyclical', 'NASDAQ', 'USD'),
('TSLA',    'Tesla Inc.',                   'stock', 'Automotive',       'NASDAQ', 'USD'),
('NVDA',    'NVIDIA Corporation',           'stock', 'Technology',       'NASDAQ', 'USD'),
('META',    'Meta Platforms Inc.',          'stock', 'Technology',       'NASDAQ', 'USD'),
('JPM',     'JPMorgan Chase & Co.',        'stock', 'Financial',        'NYSE',   'USD'),
('JNJ',     'Johnson & Johnson',           'stock', 'Healthcare',       'NYSE',   'USD'),
('V',       'Visa Inc.',                    'stock', 'Financial',        'NYSE',   'USD');

-- ============================================================
-- INDIAN STOCKS (NSE — append .NS for yfinance)
-- ============================================================
INSERT INTO assets (symbol, name, asset_type, sector, exchange, currency) VALUES
('RELIANCE.NS',  'Reliance Industries Ltd.',    'stock', 'Energy',       'NSE', 'INR'),
('TCS.NS',       'Tata Consultancy Services',   'stock', 'Technology',   'NSE', 'INR'),
('INFY.NS',      'Infosys Ltd.',                'stock', 'Technology',   'NSE', 'INR'),
('HDFCBANK.NS',  'HDFC Bank Ltd.',              'stock', 'Financial',    'NSE', 'INR'),
('WIPRO.NS',     'Wipro Ltd.',                  'stock', 'Technology',   'NSE', 'INR');

-- ============================================================
-- ETFs (good for portfolio diversification)
-- ============================================================
INSERT INTO assets (symbol, name, asset_type, sector, exchange, currency) VALUES
('SPY',     'SPDR S&P 500 ETF Trust',             'etf', 'Broad Market',  'NYSE',   'USD'),
('QQQ',     'Invesco QQQ Trust',                   'etf', 'Technology',    'NASDAQ', 'USD'),
('VTI',     'Vanguard Total Stock Market ETF',     'etf', 'Broad Market',  'NYSE',   'USD'),
('IWM',     'iShares Russell 2000 ETF',            'etf', 'Small Cap',     'NYSE',   'USD');

-- ============================================================
-- BONDS / FIXED INCOME ETFs
-- ============================================================
INSERT INTO assets (symbol, name, asset_type, sector, exchange, currency) VALUES
('BND',     'Vanguard Total Bond Market ETF',      'bond', 'Fixed Income',  'NYSE', 'USD'),
('AGG',     'iShares Core US Aggregate Bond ETF',  'bond', 'Fixed Income',  'NYSE', 'USD'),
('TLT',     'iShares 20+ Year Treasury Bond ETF',  'bond', 'Fixed Income',  'NYSE', 'USD');

-- ============================================================
-- COMMODITIES
-- ============================================================
INSERT INTO assets (symbol, name, asset_type, sector, exchange, currency) VALUES
('GC=F',    'Gold Futures',                 'commodity_gold',   'Commodities', 'COMEX', 'USD'),
('SI=F',    'Silver Futures',               'commodity_silver', 'Commodities', 'COMEX', 'USD'),
('GLD',     'SPDR Gold Shares ETF',         'commodity_gold',   'Commodities', 'NYSE',  'USD'),
('SLV',     'iShares Silver Trust ETF',     'commodity_silver', 'Commodities', 'NYSE',  'USD');

-- ============================================================
-- MUTUAL FUNDS (yfinance supports these tickers)
-- ============================================================
INSERT INTO assets (symbol, name, asset_type, sector, exchange, currency) VALUES
('VFIAX',   'Vanguard 500 Index Fund',             'mutual_fund', 'Broad Market',  NULL, 'USD'),
('FXAIX',   'Fidelity 500 Index Fund',             'mutual_fund', 'Broad Market',  NULL, 'USD'),
('VTSAX',   'Vanguard Total Stock Market Index',   'mutual_fund', 'Broad Market',  NULL, 'USD');

-- ============================================================
-- Verify
-- ============================================================
SELECT asset_type, COUNT(*) as count FROM assets GROUP BY asset_type ORDER BY count DESC;
