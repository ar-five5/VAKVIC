/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  // ── Wipe legacy schema ─────────────────────────────────────────────────────
  pgm.sql('DROP VIEW IF EXISTS daily_returns, latest_prices CASCADE;');
  pgm.sql(`
    DROP TABLE IF EXISTS
      watchlist, portfolio_assets, portfolio_allocations, portfolios,
      asset_comparisons, comparisons, asset_metrics, predictions,
      asset_prices, historical_prices, users, assets
    CASCADE;
  `);
  pgm.sql('DROP TYPE IF EXISTS prediction_status, risk_level, asset_type, risk_tolerance_enum, asset_class_enum CASCADE;');
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at() CASCADE;');

  // ── Enums ──────────────────────────────────────────────────────────────────
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE asset_class_enum AS ENUM ('stock', 'ETF', 'bond', 'commodity');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  pgm.sql(`
    DO $$ BEGIN
      CREATE TYPE risk_tolerance_enum AS ENUM ('Low', 'Medium', 'High');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  // ── 1. users ───────────────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS users (
      user_id         SERIAL PRIMARY KEY,
      email           VARCHAR(255) UNIQUE NOT NULL,
      password_hash   VARCHAR(255) NOT NULL,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      last_login      TIMESTAMPTZ,
      failed_attempts INT DEFAULT 0,
      locked_until    TIMESTAMPTZ
    );
  `);

  // ── 2. assets ──────────────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS assets (
      asset_id      SERIAL PRIMARY KEY,
      ticker_symbol VARCHAR(20) UNIQUE NOT NULL,
      asset_name    VARCHAR(255) NOT NULL,
      asset_class   asset_class_enum NOT NULL,
      exchange      VARCHAR(100),
      currency      VARCHAR(10) DEFAULT 'INR',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ── 3. asset_prices ────────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS asset_prices (
      price_id       SERIAL PRIMARY KEY,
      asset_id       INT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      date           DATE NOT NULL,
      open           DECIMAL(15,4),
      high           DECIMAL(15,4),
      low            DECIMAL(15,4),
      close          DECIMAL(15,4),
      volume         BIGINT,
      adjusted_close DECIMAL(15,4),
      UNIQUE (asset_id, date)
    );
  `);

  // ── 4. predictions ─────────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS predictions (
      prediction_id    SERIAL PRIMARY KEY,
      asset_id         INT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      prediction_date  DATE NOT NULL,
      predicted_close  DECIMAL(15,4) NOT NULL,
      confidence_lower DECIMAL(15,4),
      confidence_upper DECIMAL(15,4),
      model_version    VARCHAR(50),
      generated_at     TIMESTAMPTZ DEFAULT NOW(),
      horizon_days     INT,
      UNIQUE (asset_id, prediction_date, horizon_days)
    );
  `);

  // ── 5. asset_metrics ───────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS asset_metrics (
      metric_id         SERIAL PRIMARY KEY,
      asset_id          INT NOT NULL UNIQUE REFERENCES assets(asset_id) ON DELETE CASCADE,
      volatility        DECIMAL(10,4),
      sharpe_ratio      DECIMAL(10,4),
      trend_strength    DECIMAL(10,4),
      max_drawdown      DECIMAL(10,4),
      suitability_score DECIMAL(5,2),
      computed_at       TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ── 6. asset_comparisons ───────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS asset_comparisons (
      comparison_id SERIAL PRIMARY KEY,
      user_id       INT REFERENCES users(user_id) ON DELETE SET NULL,
      asset_ids     INT[] NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      saved         BOOLEAN DEFAULT FALSE
    );
  `);

  // ── 7. portfolios ──────────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS portfolios (
      portfolio_id         SERIAL PRIMARY KEY,
      user_id              INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      capital_inr          DECIMAL(15,2) NOT NULL,
      risk_tolerance       risk_tolerance_enum NOT NULL,
      time_horizon         INT NOT NULL,
      expected_return      DECIMAL(10,4),
      expected_volatility  DECIMAL(10,4),
      created_at           TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ── 8. portfolio_assets ────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS portfolio_assets (
      id             SERIAL PRIMARY KEY,
      portfolio_id   INT NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
      asset_id       INT NOT NULL REFERENCES assets(asset_id),
      allocation_pct DECIMAL(5,2) NOT NULL,
      amount_inr     DECIMAL(15,2) NOT NULL
    );
  `);

  // ── 9. watchlist ───────────────────────────────────────────────────────────
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS watchlist (
      watchlist_id SERIAL PRIMARY KEY,
      user_id      INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      asset_id     INT NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
      added_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, asset_id)
    );
  `);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS watchlist CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS portfolio_assets CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS portfolios CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS asset_comparisons CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS asset_metrics CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS predictions CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS asset_prices CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS assets CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS users CASCADE;');
  pgm.sql('DROP TYPE IF EXISTS risk_tolerance_enum CASCADE;');
  pgm.sql('DROP TYPE IF EXISTS asset_class_enum CASCADE;');
};
