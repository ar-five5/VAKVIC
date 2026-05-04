"""
VAKVIC — Historical Price Data Ingestion Script
================================================
Fetches historical OHLCV data from Yahoo Finance and inserts into PostgreSQL.

Prerequisites:
    pip install yfinance psycopg2-binary pandas python-dotenv

Usage:
    python seed_historical_prices.py                    # Seed all assets, 5 years
    python seed_historical_prices.py --years 3          # Custom time range
    python seed_historical_prices.py --symbol AAPL      # Single asset only
    python seed_historical_prices.py --check             # Verify data counts

Environment:
    Create a .env file in /database with:
        DB_HOST=localhost
        DB_PORT=5432
        DB_NAME=vakvic_db
        DB_USER=vakvic_admin
        DB_PASSWORD=your_password_here
"""

import os
import sys
import argparse
import time
from datetime import datetime, timedelta

import yfinance as yf
import pandas as pd
import psycopg2
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

# ── Database helpers ──────────────────────────────────────────

def get_connection():
    """Create and return a PostgreSQL connection."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        return conn
    except psycopg2.OperationalError as e:
        print(f"\n❌ Cannot connect to database. Check your .env config.")
        print(f"   Error: {e}")
        print(f"\n   Expected config:")
        print(f"   Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print(f"   Database: {DB_CONFIG['dbname']}")
        print(f"   User: {DB_CONFIG['user']}")
        sys.exit(1)


def get_all_assets(conn):
    """Fetch all active assets from the database."""
    with conn.cursor() as cur:
        cur.execute("SELECT asset_id, symbol, name FROM assets WHERE is_active = TRUE ORDER BY symbol")
        return cur.fetchall()


def get_existing_dates(conn, asset_id):
    """Get set of dates already in DB for an asset (to avoid duplicates)."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT trade_date FROM historical_prices WHERE asset_id = %s",
            (asset_id,)
        )
        return {row[0] for row in cur.fetchall()}


def insert_prices(conn, asset_id, df, existing_dates):
    """
    Bulk insert price data into historical_prices table.
    Skips dates that already exist in the database.
    Returns the number of rows inserted.
    """
    rows = []
    for date_idx, row in df.iterrows():
        trade_date = date_idx.date() if hasattr(date_idx, 'date') else date_idx

        # Skip if we already have this date
        if trade_date in existing_dates:
            continue

        rows.append((
            asset_id,
            trade_date,
            safe_float(row.get("Open")),
            safe_float(row.get("High")),
            safe_float(row.get("Low")),
            safe_float(row.get("Close")),
            safe_float(row.get("Adj Close", row.get("Close"))),
            safe_int(row.get("Volume")),
        ))

    if not rows:
        return 0

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO historical_prices 
                (asset_id, trade_date, open_price, high_price, low_price, close_price, adj_close, volume)
            VALUES %s
            ON CONFLICT (asset_id, trade_date) DO NOTHING
            """,
            rows,
            page_size=500
        )
    conn.commit()
    return len(rows)


# ── Utility functions ─────────────────────────────────────────

def safe_float(val):
    """Convert to float, handling NaN and None."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if pd.isna(f) else round(f, 6)
    except (ValueError, TypeError):
        return None


def safe_int(val):
    """Convert to int, handling NaN and None."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if pd.isna(f) else int(f)
    except (ValueError, TypeError):
        return None


def fetch_yfinance_data(symbol, years=5):
    """
    Download historical data from Yahoo Finance.
    Returns a pandas DataFrame or None if failed.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years * 365)

    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))

        if df.empty:
            return None

        # yfinance sometimes returns columns with different cases
        # Standardize column names
        df.columns = [col.strip() for col in df.columns]

        return df

    except Exception as e:
        print(f"      ⚠ yfinance error: {e}")
        return None


# ── Main ingestion logic ──────────────────────────────────────

def seed_single_asset(conn, asset_id, symbol, name, years=5):
    """Fetch and insert data for a single asset."""
    print(f"   📥 Fetching {symbol} ({name})...", end=" ", flush=True)

    df = fetch_yfinance_data(symbol, years)
    if df is None or df.empty:
        print("❌ No data returned")
        return 0

    existing = get_existing_dates(conn, asset_id)
    inserted = insert_prices(conn, asset_id, df, existing)
    total = len(df)

    if inserted > 0:
        date_range = f"{df.index[0].strftime('%Y-%m-%d')} → {df.index[-1].strftime('%Y-%m-%d')}"
        print(f"✅ {inserted} new rows (of {total} fetched) | {date_range}")
    else:
        print(f"⏭ Already up to date ({total} rows in source, {len(existing)} in DB)")

    return inserted


def seed_all_assets(conn, years=5):
    """Fetch and insert data for all active assets."""
    assets = get_all_assets(conn)
    if not assets:
        print("❌ No assets found in database. Run 002_seed_assets.sql first!")
        return

    print(f"\n{'='*60}")
    print(f"  VAKVIC Data Ingestion — {len(assets)} assets, {years} years")
    print(f"{'='*60}\n")

    total_inserted = 0
    success_count = 0
    fail_count = 0

    for i, (asset_id, symbol, name) in enumerate(assets, 1):
        print(f"   [{i}/{len(assets)}]", end="")
        rows = seed_single_asset(conn, asset_id, symbol, name, years)

        if rows >= 0:
            total_inserted += rows
            success_count += 1
        else:
            fail_count += 1

        # Small delay to be nice to Yahoo Finance
        if i < len(assets):
            time.sleep(0.5)

    print(f"\n{'='*60}")
    print(f"  ✅ Done! {success_count} assets processed, {total_inserted} total rows inserted")
    if fail_count > 0:
        print(f"  ⚠ {fail_count} assets failed to fetch")
    print(f"{'='*60}\n")


def check_data(conn):
    """Print a summary of what's in the database."""
    print(f"\n{'='*60}")
    print(f"  VAKVIC Database Status")
    print(f"{'='*60}\n")

    with conn.cursor() as cur:
        # Asset counts by type
        cur.execute("""
            SELECT asset_type, COUNT(*) 
            FROM assets 
            WHERE is_active = TRUE 
            GROUP BY asset_type 
            ORDER BY count DESC
        """)
        print("   📊 Assets by type:")
        for row in cur.fetchall():
            print(f"      {row[0]:20s} → {row[1]} assets")

        # Price data summary
        cur.execute("""
            SELECT 
                a.symbol,
                a.name,
                COUNT(hp.price_id) as rows,
                MIN(hp.trade_date) as earliest,
                MAX(hp.trade_date) as latest,
                (SELECT hp2.close_price FROM historical_prices hp2 
                 WHERE hp2.asset_id = a.asset_id 
                 ORDER BY hp2.trade_date DESC LIMIT 1) as latest_price
            FROM assets a
            LEFT JOIN historical_prices hp ON hp.asset_id = a.asset_id
            WHERE a.is_active = TRUE
            GROUP BY a.asset_id, a.symbol, a.name
            ORDER BY rows DESC
        """)
        results = cur.fetchall()

        print(f"\n   📈 Historical price data:")
        print(f"      {'Symbol':<15} {'Name':<30} {'Rows':>6} {'From':>12} {'To':>12} {'Latest $':>10}")
        print(f"      {'─'*15} {'─'*30} {'─'*6} {'─'*12} {'─'*12} {'─'*10}")
        for row in results:
            symbol, name, rows, earliest, latest, price = row
            name_short = name[:28] + ".." if len(name) > 30 else name
            earliest_str = str(earliest) if earliest else "N/A"
            latest_str = str(latest) if latest else "N/A"
            price_str = f"{price:,.2f}" if price else "N/A"
            print(f"      {symbol:<15} {name_short:<30} {rows:>6} {earliest_str:>12} {latest_str:>12} {price_str:>10}")

        # Total rows
        cur.execute("SELECT COUNT(*) FROM historical_prices")
        total = cur.fetchone()[0]
        print(f"\n   📦 Total price records: {total:,}")

    print(f"\n{'='*60}\n")


# ── CLI ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="VAKVIC Historical Price Data Seeder")
    parser.add_argument("--years", type=int, default=5, help="Years of historical data to fetch (default: 5)")
    parser.add_argument("--symbol", type=str, help="Seed only this specific symbol")
    parser.add_argument("--check", action="store_true", help="Show database status without fetching")
    args = parser.parse_args()

    conn = get_connection()

    try:
        if args.check:
            check_data(conn)
        elif args.symbol:
            # Find the specific asset
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT asset_id, symbol, name FROM assets WHERE symbol = %s",
                    (args.symbol,)
                )
                result = cur.fetchone()
                if result:
                    seed_single_asset(conn, result[0], result[1], result[2], args.years)
                else:
                    print(f"❌ Symbol '{args.symbol}' not found in assets table")
        else:
            seed_all_assets(conn, args.years)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
