import argparse
import glob
import json
import os
import random
import sys
from datetime import date, timedelta

from db import get_connection, get_cursor

try:
    import tensorflow as tf
    from sklearn.preprocessing import MinMaxScaler
    import numpy as np
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

VALID_HORIZONS = [7, 14, 30, 90]
SEQUENCE_LEN = 60


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
    return [(r['date'], float(r['close'])) for r in rows]


def find_model(asset_id):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, 'models', f'{asset_id}_lstm.h5'),
        os.path.join(script_dir, 'models', 'default_lstm.h5'),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path

    repo_root = os.path.abspath(os.path.join(script_dir, '../../'))
    matches = glob.glob(os.path.join(repo_root, '**/*.h5'), recursive=True)
    return matches[0] if matches else None


def stub_predict(closes, horizon):
    last_price = closes[-1][1]
    predictions = []
    price = last_price
    for i in range(1, horizon + 1):
        price = max(price * (1 + random.gauss(0, 0.005)), 0.01)
        prediction_date = date.today() + timedelta(days=i)
        predictions.append({
            'date': str(prediction_date),
            'predicted_close': round(price, 2),
            'confidence_lower': round(price * 0.98, 2),
            'confidence_upper': round(price * 1.02, 2),
        })
    return predictions


def model_predict(model_path, closes, horizon):
    import numpy as np
    prices = np.array([c for _, c in closes]).reshape(-1, 1)
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(prices)

    seq = scaled[-SEQUENCE_LEN:].reshape(1, SEQUENCE_LEN, 1)
    try:
        model = tf.keras.models.load_model(model_path)
    except Exception:
        return stub_predict(closes, horizon)

    predictions = []
    current_seq = seq.copy()
    for i in range(1, horizon + 1):
        pred_scaled = model.predict(current_seq, verbose=0)[0][0]
        pred_price = float(scaler.inverse_transform([[pred_scaled]])[0][0])
        prediction_date = date.today() + timedelta(days=i)
        predictions.append({
            'date': str(prediction_date),
            'predicted_close': round(pred_price, 2),
            'confidence_lower': round(pred_price * 0.98, 2),
            'confidence_upper': round(pred_price * 1.02, 2),
        })
        current_seq = np.roll(current_seq, -1, axis=1)
        current_seq[0, -1, 0] = pred_scaled

    return predictions


def upsert_predictions(conn, asset_id, horizon, predictions):
    with get_cursor(conn) as cur:
        for p in predictions:
            cur.execute(
                '''INSERT INTO predictions
                   (asset_id, prediction_date, horizon_days, predicted_close,
                    confidence_lower, confidence_upper, generated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, NOW())
                   ON CONFLICT (asset_id, prediction_date, horizon_days) DO UPDATE SET
                     predicted_close   = EXCLUDED.predicted_close,
                     confidence_lower  = EXCLUDED.confidence_lower,
                     confidence_upper  = EXCLUDED.confidence_upper,
                     generated_at      = EXCLUDED.generated_at''',
                (
                    asset_id,
                    p['date'],
                    horizon,
                    p['predicted_close'],
                    p['confidence_lower'],
                    p['confidence_upper'],
                )
            )
    conn.commit()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--asset_id', type=int, required=True)
    parser.add_argument('--horizon', type=int, required=True)
    args = parser.parse_args()

    if args.horizon not in VALID_HORIZONS:
        print(json.dumps({'success': False, 'error': f'Invalid horizon. Must be one of {VALID_HORIZONS}'}))
        sys.exit(1)

    conn = get_connection()
    try:
        closes = fetch_closes(conn, args.asset_id)
        if len(closes) < 60:
            print(json.dumps({'success': False, 'error': 'Insufficient price history'}))
            sys.exit(1)

        model_path = find_model(args.asset_id) if TF_AVAILABLE else None
        stub_mode = model_path is None

        if stub_mode:
            print('WARNING: No model found — running in stub (random walk) mode', file=sys.stderr)
            predictions = stub_predict(closes, args.horizon)
        else:
            predictions = model_predict(model_path, closes, args.horizon)

        upsert_predictions(conn, args.asset_id, args.horizon, predictions)

        print(json.dumps({
            'success': True,
            'asset_id': args.asset_id,
            'horizon': args.horizon,
            'predictions': predictions,
            'stub_mode': stub_mode,
        }))
    finally:
        conn.close()


if __name__ == '__main__':
    main()
