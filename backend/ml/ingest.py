import argparse
import json
import sys
import time
from datetime import date, timedelta

import pandas as pd
import yfinance as yf

from db import get_connection, get_cursor


def fetch_asset_ids(conn, ticker=None):
    with get_cursor(conn) as cur:
        if ticker:
            cur.execute(
                'SELECT asset_id, ticker_symbol FROM assets WHERE ticker_symbol = %s',
                (ticker,)
            )
        else:
            cur.execute('SELECT asset_id, ticker_symbol FROM assets')
        return cur.fetchall()


def get_last_date(conn, asset_id):
    with get_cursor(conn) as cur:
        cur.execute(
            'SELECT MAX(date) AS max_date FROM asset_prices WHERE asset_id = %s',
            (asset_id,)
        )
        row = cur.fetchone()
        return row['max_date'] if row and row['max_date'] else None


def insert_prices(conn, asset_id, df):
    rows = []
    for idx, row in df.iterrows():
        if pd.isna(row['close']):
            continue
        rows.append((
            asset_id,
            idx.date() if hasattr(idx, 'date') else idx,
            float(row['open']) if not pd.isna(row['open']) else None,
            float(row['high']) if not pd.isna(row['high']) else None,
            float(row['low']) if not pd.isna(row['low']) else None,
            float(row['close']),
            int(row['volume']) if not pd.isna(row['volume']) else 0,
            float(row['adjusted_close']) if not pd.isna(row['adjusted_close']) else float(row['close']),
        ))

    if not rows:
        return 0

    with get_cursor(conn) as cur:
        cur.executemany(
            '''INSERT INTO asset_prices
               (asset_id, date, open, high, low, close, volume, adjusted_close)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (asset_id, date) DO NOTHING''',
            rows
        )
        count = cur.rowcount
    conn.commit()
    return count


def normalize_columns(df):
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ['_'.join(str(c) for c in col).strip().lower() for col in df.columns]
        ticker_suffix = df.columns[0].split('_', 1)[1] if '_' in df.columns[0] else ''
        rename = {}
        for col in df.columns:
            base = col.split('_')[0] if ticker_suffix else col
            rename[col] = base
        df = df.rename(columns=rename)
    else:
        df.columns = [c.lower() for c in df.columns]

    col_map = {
        'adj close': 'adjusted_close',
        'adj_close': 'adjusted_close',
    }
    df = df.rename(columns=col_map)

    for needed in ('open', 'high', 'low', 'close', 'volume'):
        if needed not in df.columns:
            raise ValueError(f'Missing column: {needed}')
    if 'adjusted_close' not in df.columns:
        df['adjusted_close'] = df['close']

    return df[['open', 'high', 'low', 'close', 'volume', 'adjusted_close']]


def ingest_asset(conn, asset_id, ticker):
    last_date = get_last_date(conn, asset_id)
    today = date.today()

    if last_date:
        start = last_date + timedelta(days=1)
    else:
        start = today - timedelta(days=365 * 10)

    if start >= today:
        return {'ticker': ticker, 'asset_id': asset_id, 'status': 'up_to_date'}

    for attempt in range(3):
        try:
            raw = yf.download(
                ticker, start=str(start), end=str(today),
                auto_adjust=False, progress=False
            )
            if raw.empty:
                return {'ticker': ticker, 'asset_id': asset_id, 'status': 'no_data', 'rows': 0}

            df = normalize_columns(raw)
            inserted = insert_prices(conn, asset_id, df)
            return {'ticker': ticker, 'asset_id': asset_id, 'status': 'ok', 'rows': inserted}
        except Exception as e:
            if attempt < 2:
                time.sleep(2 ** attempt)
            else:
                return {'ticker': ticker, 'asset_id': asset_id, 'status': 'error', 'error': str(e)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ticker', help='Single ticker to ingest (e.g. RELIANCE.NS)')
    args = parser.parse_args()

    conn = get_connection()
    try:
        assets = fetch_asset_ids(conn, args.ticker)
        if not assets:
            print(json.dumps({'success': False, 'error': f'Ticker not found: {args.ticker}'}))
            sys.exit(1)

        results = []
        for asset in assets:
            result = ingest_asset(conn, asset['asset_id'], asset['ticker_symbol'])
            results.append(result)

        print(json.dumps({'success': True, 'processed': len(results), 'results': results}))
    finally:
        conn.close()


if __name__ == '__main__':
    main()
