"""
VAKVIC -- ML Data Helper Functions
====================================
Helper utilities for the ML team to save model outputs to PostgreSQL
and retrieve training data as pandas DataFrames.

Prerequisites:
    pip install psycopg2-binary pandas python-dotenv

Usage:
    from ml_data_helpers import save_predictions, save_asset_metrics, get_training_data

    # Or run directly to see example usage
    python ml_data_helpers.py

Environment:
    Uses the same .env file as seed_historical_prices.py
"""

import os
import sys
import re
import datetime

import psycopg2
import pandas as pd
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME", "vakvic_db"),
    "user": os.getenv("DB_USER", "vakvic_admin"),
    "password": os.getenv("DB_PASSWORD", "password"),
}

# Valid columns in asset_metrics (excluding auto-managed: metric_id, asset_id,
# calculation_date, created_at)
VALID_METRIC_COLUMNS = {
    "daily_return_avg",
    "annual_return",
    "daily_volatility",
    "annual_volatility",
    "sharpe_ratio",
    "max_drawdown",
    "beta",
    "suitability_score",
}

# ── Database helpers ──────────────────────────────────────────

def get_connection():
    """Create and return a PostgreSQL connection."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        return conn
    except psycopg2.OperationalError as e:
        print(f"\n\u274c Cannot connect to database. Check your .env config.")
        print(f"   Error: {e}")
        print(f"\n   Expected config:")
        print(f"   Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print(f"   Database: {DB_CONFIG['dbname']}")
        print(f"   User: {DB_CONFIG['user']}")
        sys.exit(1)


def _lookup_asset_id(conn, symbol):
    """Look up asset_id from symbol. Returns UUID or None."""
    with conn.cursor() as cur:
        cur.execute("SELECT asset_id FROM assets WHERE symbol = %s", (symbol,))
        row = cur.fetchone()
        return row[0] if row else None


# ── ML Output Functions ──────────────────────────────────────

def save_predictions(symbol, predictions_list, model_type="LSTM", input_window=60, user_id=None):
    """
    Save ML model price predictions to the predictions table.

    Args:
        symbol:           Ticker symbol (e.g., 'AAPL')
        predictions_list: List of dicts with keys: prediction_date, predicted_price, confidence
        model_type:       Model identifier (default: 'LSTM')
        input_window:     Number of past days used as input features (default: 60)
        user_id:          Optional user UUID who triggered the prediction

    Returns:
        int: Number of predictions saved, or 0 on error.
    """
    conn = get_connection()
    try:
        asset_id = _lookup_asset_id(conn, symbol)
        if asset_id is None:
            print(f"\u274c Symbol '{symbol}' not found in assets table.")
            return 0

        rows = [
            (
                asset_id,
                user_id,
                model_type,
                p["prediction_date"],
                p["predicted_price"],
                p.get("confidence"),
                input_window,
            )
            for p in predictions_list
        ]

        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO predictions
                    (asset_id, user_id, model_type, prediction_date,
                     predicted_price, confidence, input_window)
                VALUES %s
                ON CONFLICT DO NOTHING
                """,
                rows,
                page_size=500,
            )

        conn.commit()
        print(f"\u2705 Saved {len(rows)} predictions for {symbol} (model={model_type})")
        return len(rows)

    except psycopg2.Error as e:
        conn.rollback()
        print(f"\u274c Error saving predictions for {symbol}: {e}")
        return 0
    finally:
        conn.close()


def save_asset_metrics(symbol, metrics_dict):
    """
    Upsert computed financial metrics for an asset.

    Args:
        symbol:       Ticker symbol (e.g., 'AAPL')
        metrics_dict: Dict mapping column names to numeric values, e.g.
                      {"sharpe_ratio": 1.45, "annual_volatility": 0.234}

    Returns:
        int: 1 if upserted successfully, 0 on error.
    """
    conn = get_connection()
    try:
        asset_id = _lookup_asset_id(conn, symbol)
        if asset_id is None:
            print(f"\u274c Symbol '{symbol}' not found in assets table.")
            return 0

        # Filter to valid columns only
        valid = {}
        for key, value in metrics_dict.items():
            if key in VALID_METRIC_COLUMNS:
                valid[key] = value
            else:
                print(f"\u26a0\ufe0f  Ignoring unknown metric column: '{key}'")

        if not valid:
            print(f"\u274c No valid metrics provided for {symbol}.")
            return 0

        calculation_date = datetime.date.today()
        columns = list(valid.keys())
        values = [valid[c] for c in columns]

        # Build the UPSERT query dynamically
        col_list = ", ".join(columns)
        placeholder_list = ", ".join(["%s"] * len(columns))
        update_clause = ", ".join(f"{c} = EXCLUDED.{c}" for c in columns)

        sql = f"""
            INSERT INTO asset_metrics (asset_id, calculation_date, {col_list})
            VALUES (%s, %s, {placeholder_list})
            ON CONFLICT (asset_id, calculation_date)
            DO UPDATE SET {update_clause}
        """

        params = [asset_id, calculation_date] + values

        with conn.cursor() as cur:
            cur.execute(sql, params)

        conn.commit()
        print(f"\u2705 Saved {len(valid)} metrics for {symbol} (date={calculation_date})")
        return 1

    except psycopg2.Error as e:
        conn.rollback()
        print(f"\u274c Error saving metrics for {symbol}: {e}")
        return 0
    finally:
        conn.close()


def save_portfolio(user_id, capital, risk_level, time_horizon, portfolio_results):
    """
    Save a portfolio optimization result with its allocations.

    Args:
        user_id:           UUID of the user
        capital:           Investment amount (must be > 0)
        risk_level:        One of 'low', 'medium', 'high'
        time_horizon:      Investment horizon in months (must be > 0)
        portfolio_results: Dict with keys: expected_return, portfolio_volatility,
                           sharpe_ratio, allocations (list of dicts with
                           symbol, weight, expected_return)

    Returns:
        str: portfolio_id UUID on success, None on error.
    """
    conn = get_connection()
    try:
        # Insert the portfolio record and get the new ID
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO portfolios
                    (user_id, capital, risk_level, time_horizon,
                     expected_return, portfolio_volatility, sharpe_ratio)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING portfolio_id
                """,
                (
                    user_id,
                    capital,
                    risk_level,
                    time_horizon,
                    portfolio_results.get("expected_return"),
                    portfolio_results.get("portfolio_volatility"),
                    portfolio_results.get("sharpe_ratio"),
                ),
            )
            portfolio_id = cur.fetchone()[0]

        # Build allocation rows
        allocations = portfolio_results.get("allocations", [])
        alloc_rows = []
        for alloc in allocations:
            asset_id = _lookup_asset_id(conn, alloc["symbol"])
            if asset_id is None:
                print(f"\u26a0\ufe0f  Skipping unknown symbol in allocation: '{alloc['symbol']}'")
                continue
            allocated_amount = round(float(alloc["weight"]) * float(capital), 2)
            alloc_rows.append((
                portfolio_id,
                asset_id,
                alloc["weight"],
                allocated_amount,
                alloc.get("expected_return"),
            ))

        if alloc_rows:
            with conn.cursor() as cur:
                execute_values(
                    cur,
                    """
                    INSERT INTO portfolio_allocations
                        (portfolio_id, asset_id, weight, allocated_amount, expected_return)
                    VALUES %s
                    ON CONFLICT (portfolio_id, asset_id) DO NOTHING
                    """,
                    alloc_rows,
                    page_size=100,
                )

        conn.commit()
        print(f"\u2705 Saved portfolio {portfolio_id} with {len(alloc_rows)} allocations "
              f"(capital={capital}, risk={risk_level})")
        return str(portfolio_id)

    except psycopg2.Error as e:
        conn.rollback()
        print(f"\u274c Error saving portfolio: {e}")
        return None
    finally:
        conn.close()


# ── Schema Utilities ─────────────────────────────────────────

def add_new_metric_column(column_name, data_type="NUMERIC(12, 8)"):
    """
    Add a new column to the asset_metrics table for additional ML features.

    Args:
        column_name: Column name (alphanumeric and underscores only)
        data_type:   PostgreSQL data type (default: 'NUMERIC(12, 8)')

    Returns:
        bool: True if column was added or already exists, False on error.
    """
    if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", column_name):
        print(f"\u274c Invalid column name: '{column_name}'. "
              f"Use only letters, digits, and underscores.")
        return False

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"ALTER TABLE asset_metrics ADD COLUMN IF NOT EXISTS {column_name} {data_type}"
            )

        conn.commit()
        VALID_METRIC_COLUMNS.add(column_name)
        print(f"\u2705 Column '{column_name}' ({data_type}) ready on asset_metrics table.")
        return True

    except psycopg2.Error as e:
        conn.rollback()
        print(f"\u274c Error adding column '{column_name}': {e}")
        return False
    finally:
        conn.close()


# ── Data Retrieval ───────────────────────────────────────────

def get_training_data(symbol, years=5):
    """
    Fetch historical price data as a pandas DataFrame for ML training.

    Args:
        symbol: Ticker symbol (e.g., 'AAPL')
        years:  How many years of history to retrieve (default: 5)

    Returns:
        pandas.DataFrame with columns [trade_date, close, volume],
        ordered by trade_date ascending. Empty DataFrame on error.
    """
    conn = get_connection()
    try:
        asset_id = _lookup_asset_id(conn, symbol)
        if asset_id is None:
            print(f"\u274c Symbol '{symbol}' not found in assets table.")
            return pd.DataFrame()

        cutoff_date = datetime.date.today() - datetime.timedelta(days=years * 365)

        df = pd.read_sql_query(
            """
            SELECT trade_date, close_price AS close, volume
            FROM historical_prices
            WHERE asset_id = %s
              AND trade_date >= %s
            ORDER BY trade_date ASC
            """,
            conn,
            params=(asset_id, cutoff_date),
        )

        print(f"\u2705 Loaded {len(df)} rows for {symbol} (from {cutoff_date})")
        return df

    except psycopg2.Error as e:
        print(f"\u274c Error fetching training data for {symbol}: {e}")
        return pd.DataFrame()
    finally:
        conn.close()


# ── Example usage (run directly) ─────────────────────────────

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  VAKVIC ML Data Helpers -- Example Usage")
    print("=" * 60 + "\n")
    print("  All example calls are commented out below.")
    print("  Uncomment the ones you need and run this file.\n")

    # ── Example: save_predictions ──────────────────────────────
    # save_predictions(
    #     symbol="AAPL",
    #     predictions_list=[
    #         {"prediction_date": "2026-02-20", "predicted_price": 245.67, "confidence": 0.82},
    #         {"prediction_date": "2026-02-21", "predicted_price": 247.30, "confidence": 0.79},
    #         {"prediction_date": "2026-02-22", "predicted_price": 244.15, "confidence": 0.75},
    #     ],
    #     model_type="LSTM",
    #     input_window=60,
    #     user_id=None,
    # )

    # ── Example: save_asset_metrics ────────────────────────────
    # save_asset_metrics(
    #     symbol="AAPL",
    #     metrics_dict={
    #         "daily_return_avg": 0.00045,
    #         "annual_return": 0.1134,
    #         "daily_volatility": 0.0189,
    #         "annual_volatility": 0.2998,
    #         "sharpe_ratio": 1.45,
    #         "max_drawdown": -0.2341,
    #         "beta": 1.12,
    #         "suitability_score": 78.50,
    #     },
    # )

    # ── Example: save_portfolio ────────────────────────────────
    # save_portfolio(
    #     user_id="some-user-uuid-here",  # Replace with a real user UUID
    #     capital=100000,
    #     risk_level="medium",
    #     time_horizon=12,
    #     portfolio_results={
    #         "expected_return": 0.0945,
    #         "portfolio_volatility": 0.1523,
    #         "sharpe_ratio": 1.87,
    #         "allocations": [
    #             {"symbol": "AAPL", "weight": 0.25, "expected_return": 0.12},
    #             {"symbol": "MSFT", "weight": 0.20, "expected_return": 0.10},
    #             {"symbol": "BND",  "weight": 0.30, "expected_return": 0.04},
    #             {"symbol": "GLD",  "weight": 0.25, "expected_return": 0.06},
    #         ],
    #     },
    # )

    # ── Example: add_new_metric_column ─────────────────────────
    # add_new_metric_column("sortino_ratio", "NUMERIC(10, 6)")

    # ── Example: get_training_data ─────────────────────────────
    # df = get_training_data("AAPL", years=3)
    # if not df.empty:
    #     print(df.head())
    #     print(f"Shape: {df.shape}")
