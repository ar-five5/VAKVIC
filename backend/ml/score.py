import argparse
import json
import math
import sys
from datetime import date, timedelta

import numpy as np

from db import get_connection, get_cursor


def fetch_closes(conn, asset_id, days=365):
    cutoff = date.today() - timedelta(days=days)
    with get_cursor(conn) as cur:
        cur.execute(
            '''SELECT date, close FROM asset_prices
               WHERE asset_id = %s AND date >= %s
               ORDER BY date ASC''',
            (asset_id, cutoff)
        )
        rows = cur.fetchall()
    return [float(r['close']) for r in rows]


def compute_max_drawdown(closes):
    peak = closes[0]
    max_dd = 0.0
    for price in closes:
        if price > peak:
            peak = price
        dd = (peak - price) / peak if peak > 0 else 0.0
        if dd > max_dd:
            max_dd = dd
    return -max_dd


def score_asset(conn, asset_id):
    closes = fetch_closes(conn, asset_id)
    if len(closes) < 30:
        return {'asset_id': asset_id, 'status': 'skipped', 'reason': 'insufficient data'}

    arr = np.array(closes)
    arr = arr[~(np.isnan(arr) | (arr <= 0))]
    if len(arr) < 30:
        return {'asset_id': asset_id, 'status': 'skipped', 'reason': 'insufficient clean data'}
    daily_returns = np.diff(arr) / arr[:-1]

    annualized_vol = daily_returns.std() * math.sqrt(252)
    annualized_return = (1 + daily_returns.mean()) ** 252 - 1
    sharpe = (annualized_return - 0.065) / annualized_vol if annualized_vol > 0 else 0.0

    last30 = arr[-30:]
    slope = np.polyfit(range(30), last30, 1)[0]
    trend_strength = float(np.tanh(slope / (last30.mean() or 1) * 30))
    trend_strength = max(-1.0, min(1.0, trend_strength))

    max_drawdown = compute_max_drawdown(closes)

    vol_score = max(0.0, 100.0 - annualized_vol * 200)
    sharpe_score = min(100.0, max(0.0, (sharpe + 1) * 33.3))
    trend_score = (trend_strength + 1) * 50
    drawdown_score = max(0.0, 100.0 + max_drawdown * 100)

    suitability = (
        vol_score * 0.25
        + sharpe_score * 0.35
        + trend_score * 0.25
        + drawdown_score * 0.15
    )

    upsert_metrics(conn, asset_id, {
        'annualized_vol': float(annualized_vol),
        'annualized_return': float(annualized_return),
        'sharpe': float(sharpe),
        'trend_strength': float(trend_strength),
        'max_drawdown': float(max_drawdown),
        'vol_score': float(vol_score),
        'sharpe_score': float(sharpe_score),
        'trend_score': float(trend_score),
        'drawdown_score': float(drawdown_score),
        'suitability_score': float(suitability),
    })

    return {
        'asset_id': asset_id,
        'status': 'ok',
        'suitability_score': round(suitability, 2),
        'sharpe': round(sharpe, 4),
        'annualized_vol': round(annualized_vol, 4),
        'annualized_return': round(annualized_return, 4),
        'trend_strength': round(trend_strength, 4),
        'max_drawdown': round(max_drawdown, 4),
    }


def upsert_metrics(conn, asset_id, m):
    with get_cursor(conn) as cur:
        cur.execute(
            '''INSERT INTO asset_metrics
               (asset_id, suitability_score, volatility, sharpe_ratio,
                trend_strength, max_drawdown, computed_at)
               VALUES (%s, %s, %s, %s, %s, %s, NOW())
               ON CONFLICT (asset_id) DO UPDATE SET
                 suitability_score = EXCLUDED.suitability_score,
                 volatility        = EXCLUDED.volatility,
                 sharpe_ratio      = EXCLUDED.sharpe_ratio,
                 trend_strength    = EXCLUDED.trend_strength,
                 max_drawdown      = EXCLUDED.max_drawdown,
                 computed_at       = EXCLUDED.computed_at''',
            (
                asset_id,
                m['suitability_score'],
                m['annualized_vol'],
                m['sharpe'],
                m['trend_strength'],
                m['max_drawdown'],
            )
        )
    conn.commit()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--asset_ids', required=True, help='Comma-separated asset IDs')
    args = parser.parse_args()

    asset_ids = [int(x.strip()) for x in args.asset_ids.split(',')]

    conn = get_connection()
    try:
        scored = []
        for asset_id in asset_ids:
            result = score_asset(conn, asset_id)
            scored.append(result)

        print(json.dumps({'success': True, 'scored': scored}))
    finally:
        conn.close()


if __name__ == '__main__':
    main()
