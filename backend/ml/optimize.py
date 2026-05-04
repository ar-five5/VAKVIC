import argparse
import json
import math
import sys
from datetime import date, timedelta

import numpy as np
from scipy.optimize import minimize

from db import get_connection, get_cursor

RISK_PROFILES = ['Low', 'Medium', 'High']
RISK_FREE_RATE = 0.065


def fetch_price_data(conn):
    cutoff = date.today() - timedelta(days=365)
    with get_cursor(conn) as cur:
        cur.execute(
            '''SELECT a.asset_id, a.ticker_symbol, a.asset_name,
                      ap.date, ap.close
               FROM assets a
               JOIN asset_prices ap ON ap.asset_id = a.asset_id
               WHERE ap.date >= %s
               ORDER BY a.asset_id, ap.date ASC''',
            (cutoff,)
        )
        return cur.fetchall()


def build_returns_matrix(rows):
    from collections import defaultdict
    import pandas as pd

    grouped = defaultdict(list)
    meta = {}
    for r in rows:
        aid = r['asset_id']
        grouped[aid].append((r['date'], float(r['close'])))
        meta[aid] = {'ticker': r['ticker_symbol'], 'name': r['asset_name']}

    series = {}
    for aid, price_rows in grouped.items():
        if len(price_rows) < 30:
            continue
        dates = [d for d, _ in price_rows]
        closes = [c for _, c in price_rows]
        s = pd.Series(closes, index=pd.to_datetime(dates))
        series[aid] = s

    if len(series) < 2:
        return None, None, None

    df = pd.DataFrame(series)
    df = df.dropna()
    returns = df.pct_change().dropna()
    if returns.empty or len(returns) < 2:
        return None, None, None
    return returns, meta, list(series.keys())


def objective_min_variance(w, sigma):
    return w @ sigma @ w


def objective_max_sharpe(w, mu, sigma):
    port_return = w @ mu
    port_vol = math.sqrt(w @ sigma @ w)
    return -((port_return - RISK_FREE_RATE) / port_vol) if port_vol > 0 else 0.0


def objective_max_return(w, mu):
    return -(w @ mu)


def optimize_portfolio(returns, asset_ids, risk):
    mu = returns.mean().values * 252
    sigma = returns.cov().values * 252
    n = len(asset_ids)
    w0 = np.ones(n) / n

    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    bounds = [(0.0, 1.0)] * n

    if risk == 'Low':
        result = minimize(
            objective_min_variance, w0,
            args=(sigma,), method='SLSQP',
            bounds=bounds, constraints=constraints
        )
    elif risk == 'Medium':
        result = minimize(
            objective_max_sharpe, w0,
            args=(mu, sigma), method='SLSQP',
            bounds=bounds, constraints=constraints
        )
    else:
        result = minimize(
            objective_max_return, w0,
            args=(mu,), method='SLSQP',
            bounds=bounds, constraints=constraints
        )

    if not result.success:
        print(f'WARNING: Optimization did not converge ({result.message}), using equal-weight allocation', file=sys.stderr)
        return w0, mu, sigma

    return result.x, mu, sigma


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--capital', type=float, required=True)
    parser.add_argument('--risk', required=True, choices=RISK_PROFILES)
    parser.add_argument('--horizon', type=int, default=12, help='Horizon in months (informational)')
    args = parser.parse_args()

    if args.capital <= 0:
        print(json.dumps({'success': False, 'error': 'Capital must be positive'}))
        sys.exit(1)

    conn = get_connection()
    try:
        rows = fetch_price_data(conn)
    finally:
        conn.close()

    returns, meta, asset_ids = build_returns_matrix(rows)
    if returns is None:
        print(json.dumps({'success': False, 'error': 'Insufficient price history for optimization'}))
        sys.exit(1)

    try:
        weights, mu, sigma = optimize_portfolio(returns, asset_ids, args.risk)
    except ValueError as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)

    expected_return = float(weights @ mu)
    expected_volatility = math.sqrt(float(weights @ sigma @ weights))
    sharpe = (expected_return - RISK_FREE_RATE) / expected_volatility if expected_volatility > 0 else 0.0

    allocations = []
    for i, aid in enumerate(asset_ids):
        w = float(weights[i])
        allocations.append({
            'asset_id': aid,
            'ticker': meta[aid]['ticker'],
            'name': meta[aid]['name'],
            'weight': round(w, 4),
            'amount': round(w * args.capital, 2),
        })

    allocations.sort(key=lambda x: x['weight'], reverse=True)

    print(json.dumps({
        'success': True,
        'risk_profile': args.risk,
        'capital': args.capital,
        'horizon_months': args.horizon,
        'expected_annual_return': round(expected_return, 4),
        'expected_annual_volatility': round(expected_volatility, 4),
        'sharpe_ratio': round(sharpe, 4),
        'allocations': allocations,
    }, indent=2))


if __name__ == '__main__':
    main()
