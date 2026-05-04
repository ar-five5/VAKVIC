# VAKVIC ML Layer

Standalone Python scripts for data ingestion, scoring, prediction, and portfolio optimization.
Each script reads/writes the PostgreSQL DB and prints JSON to stdout.

## Prerequisites

Python 3.11+ required. Install dependencies from the backend directory:

```bash
pip install -r requirements.txt
```

TensorFlow (for real LSTM predictions) must be installed separately if not already present:

```bash
pip install tensorflow
```

## Environment Setup

Scripts load `backend/.env` automatically. No extra setup needed when running from the
`backend/` directory. The `.env` must contain:

```
DATABASE_URL=postgresql://user:password@localhost:5432/vakvic_db
```

## Running Scripts

All commands are run from the `backend/` directory.

### ingest.py — Download price history from Yahoo Finance

```bash
# Ingest a single ticker
python ml/ingest.py --ticker RELIANCE.NS

# Ingest all seeded assets
python ml/ingest.py
```

Output: `{"success": true, "processed": 1, "results": [{"ticker": "...", "status": "ok", "rows": 2500}]}`

Re-running is safe — uses `ON CONFLICT DO NOTHING` and skips if data is already current.

### score.py — Compute suitability scores

```bash
python ml/score.py --asset_ids 1,2,3
```

Output: JSON with `suitability_score` (0–100), Sharpe ratio, volatility, trend strength, and max drawdown per asset.
Writes results to `asset_metrics` table (upsert).

### predict.py — Generate price predictions

```bash
python ml/predict.py --asset_id 1 --horizon 7
python ml/predict.py --asset_id 1 --horizon 30
```

Valid horizons: `7`, `14`, `30`, `90` (days).

**Stub mode**: When no `.h5` model file is found in `ml/models/`, the script falls back to a
random-walk simulation and prints a warning to stderr. Stub predictions are clearly marked with
`"stub_mode": true` in the output. Place trained models at `ml/models/{asset_id}_lstm.h5` or
`ml/models/default_lstm.h5` to enable real inference.

Writes predictions to the `predictions` table (upsert on asset + date + horizon).

### optimize.py — Markowitz portfolio optimization

```bash
python ml/optimize.py --capital 500000 --risk Medium --horizon 12
python ml/optimize.py --capital 100000 --risk Low --horizon 6
python ml/optimize.py --capital 250000 --risk High --horizon 24
```

Risk profiles: `Low` (min variance), `Medium` (max Sharpe), `High` (max return).

**Note**: `optimize.py` does NOT write to the database. The caller (Express service) is
responsible for any persistence of the allocation result.

## Models Directory

`ml/models/` is a placeholder for trained LSTM model files (`.h5`). The directory ships empty.
`predict.py` searches for models in this order:
1. `ml/models/{asset_id}_lstm.h5`
2. `ml/models/default_lstm.h5`
3. Any `.h5` file anywhere under the repo root
