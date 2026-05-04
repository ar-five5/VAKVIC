/**
 * Migration: Initial VAKVIC Schema
 * Creates all extensions, enum types, tables, indexes, views, and triggers.
 * This is a baseline migration — the schema already exists in the database.
 */

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // ── Extensions ──────────────────────────────────────────
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  // ── Custom Enum Types ──────────────────────────────────
  pgm.sql(`
    CREATE TYPE asset_type AS ENUM (
      'stock', 'mutual_fund', 'etf', 'bond', 'commodity_gold', 'commodity_silver'
    );
  `);

  pgm.sql(`
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
  `);

  pgm.sql(`
    CREATE TYPE prediction_status AS ENUM ('pending', 'completed', 'failed');
  `);

  // ── Table: assets ──────────────────────────────────────
  pgm.sql(`
    CREATE TABLE assets (
      asset_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      symbol      VARCHAR(20) NOT NULL UNIQUE,
      name        VARCHAR(255) NOT NULL,
      asset_type  asset_type NOT NULL,
      sector      VARCHAR(100),
      exchange    VARCHAR(50),
      currency    VARCHAR(10) DEFAULT 'USD',
      is_active   BOOLEAN DEFAULT TRUE,
      description TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ── Table: historical_prices ───────────────────────────
  pgm.sql(`
    CREATE TABLE historical_prices (
      price_id    BIGSERIAL PRIMARY KEY,
      asset_id    UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      trade_date  DATE NOT NULL,
      open_price  NUMERIC(18, 6),
      high_price  NUMERIC(18, 6),
      low_price   NUMERIC(18, 6),
      close_price NUMERIC(18, 6) NOT NULL,
      adj_close   NUMERIC(18, 6),
      volume      BIGINT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_asset_date UNIQUE (asset_id, trade_date)
    );
  `);

  pgm.sql('CREATE INDEX idx_prices_asset_id ON historical_prices(asset_id);');
  pgm.sql('CREATE INDEX idx_prices_trade_date ON historical_prices(trade_date DESC);');
  pgm.sql('CREATE INDEX idx_prices_asset_date ON historical_prices(asset_id, trade_date DESC);');

  // ── Table: users ───────────────────────────────────────
  pgm.sql(`
    CREATE TABLE users (
      user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username      VARCHAR(50) NOT NULL UNIQUE,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(100),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ── Table: predictions ─────────────────────────────────
  pgm.sql(`
    CREATE TABLE predictions (
      prediction_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      asset_id        UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
      model_type      VARCHAR(50) NOT NULL DEFAULT 'LSTM',
      prediction_date DATE NOT NULL,
      predicted_price NUMERIC(18, 6) NOT NULL,
      confidence      NUMERIC(5, 4),
      status          prediction_status DEFAULT 'completed',
      input_window    INTEGER DEFAULT 60,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  pgm.sql('CREATE INDEX idx_predictions_asset ON predictions(asset_id, prediction_date DESC);');
  pgm.sql('CREATE INDEX idx_predictions_user ON predictions(user_id);');

  // ── Table: asset_metrics ───────────────────────────────
  pgm.sql(`
    CREATE TABLE asset_metrics (
      metric_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      asset_id          UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      calculation_date  DATE NOT NULL,
      daily_return_avg  NUMERIC(12, 8),
      annual_return     NUMERIC(12, 8),
      daily_volatility  NUMERIC(12, 8),
      annual_volatility NUMERIC(12, 8),
      sharpe_ratio      NUMERIC(10, 6),
      max_drawdown      NUMERIC(10, 6),
      beta              NUMERIC(10, 6),
      suitability_score NUMERIC(5, 2),
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_asset_metric_date UNIQUE (asset_id, calculation_date)
    );
  `);

  pgm.sql('CREATE INDEX idx_metrics_asset ON asset_metrics(asset_id, calculation_date DESC);');

  // ── Table: comparisons ─────────────────────────────────
  pgm.sql(`
    CREATE TABLE comparisons (
      comparison_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id             UUID REFERENCES users(user_id) ON DELETE SET NULL,
      asset_id_1          UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      asset_id_2          UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      suitability_score_1 NUMERIC(5, 2),
      suitability_score_2 NUMERIC(5, 2),
      comparison_data     JSONB,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT different_assets CHECK (asset_id_1 != asset_id_2)
    );
  `);

  pgm.sql('CREATE INDEX idx_comparisons_user ON comparisons(user_id);');

  // ── Table: portfolios ──────────────────────────────────
  pgm.sql(`
    CREATE TABLE portfolios (
      portfolio_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id              UUID REFERENCES users(user_id) ON DELETE CASCADE,
      name                 VARCHAR(100) DEFAULT 'My Portfolio',
      capital              NUMERIC(18, 2) NOT NULL CHECK (capital > 0),
      risk_level           risk_level NOT NULL,
      time_horizon         INTEGER NOT NULL CHECK (time_horizon > 0),
      expected_return      NUMERIC(10, 6),
      portfolio_volatility NUMERIC(10, 6),
      sharpe_ratio         NUMERIC(10, 6),
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  pgm.sql('CREATE INDEX idx_portfolios_user ON portfolios(user_id);');

  // ── Table: portfolio_allocations ───────────────────────
  pgm.sql(`
    CREATE TABLE portfolio_allocations (
      allocation_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      portfolio_id     UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
      asset_id         UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      weight           NUMERIC(6, 4) NOT NULL CHECK (weight >= 0 AND weight <= 1),
      allocated_amount NUMERIC(18, 2),
      expected_return  NUMERIC(10, 6),
      CONSTRAINT unique_portfolio_asset UNIQUE (portfolio_id, asset_id)
    );
  `);

  pgm.sql('CREATE INDEX idx_allocations_portfolio ON portfolio_allocations(portfolio_id);');

  // ── Table: watchlist ───────────────────────────────────
  pgm.sql(`
    CREATE TABLE watchlist (
      watchlist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      asset_id     UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      added_at     TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_user_asset_watch UNIQUE (user_id, asset_id)
    );
  `);

  // ── Function & Triggers ────────────────────────────────
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trigger_assets_updated
      BEFORE UPDATE ON assets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);

  pgm.sql(`
    CREATE TRIGGER trigger_users_updated
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);

  pgm.sql(`
    CREATE TRIGGER trigger_portfolios_updated
      BEFORE UPDATE ON portfolios
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);

  // ── Views ──────────────────────────────────────────────
  pgm.sql(`
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
  `);

  pgm.sql(`
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
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  // Drop in reverse order, respecting foreign key dependencies

  // Views first
  pgm.sql('DROP VIEW IF EXISTS daily_returns;');
  pgm.sql('DROP VIEW IF EXISTS latest_prices;');

  // Triggers
  pgm.sql('DROP TRIGGER IF EXISTS trigger_portfolios_updated ON portfolios;');
  pgm.sql('DROP TRIGGER IF EXISTS trigger_users_updated ON users;');
  pgm.sql('DROP TRIGGER IF EXISTS trigger_assets_updated ON assets;');
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at();');

  // Tables (reverse FK dependency order)
  pgm.sql('DROP TABLE IF EXISTS watchlist;');
  pgm.sql('DROP TABLE IF EXISTS portfolio_allocations;');
  pgm.sql('DROP TABLE IF EXISTS portfolios;');
  pgm.sql('DROP TABLE IF EXISTS comparisons;');
  pgm.sql('DROP TABLE IF EXISTS asset_metrics;');
  pgm.sql('DROP TABLE IF EXISTS predictions;');
  pgm.sql('DROP TABLE IF EXISTS users;');
  pgm.sql('DROP TABLE IF EXISTS historical_prices;');
  pgm.sql('DROP TABLE IF EXISTS assets;');

  // Enum types
  pgm.sql('DROP TYPE IF EXISTS prediction_status;');
  pgm.sql('DROP TYPE IF EXISTS risk_level;');
  pgm.sql('DROP TYPE IF EXISTS asset_type;');

  // Extensions
  pgm.sql('DROP EXTENSION IF EXISTS "pgcrypto";');
  pgm.sql('DROP EXTENSION IF EXISTS "uuid-ossp";');
};
