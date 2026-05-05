# VAKVIC

Value Analytics and Knowledge-driven Value Intelligence Core.

VAKVIC is a full-stack financial analytics platform for Indian-market assets. It combines a React dashboard, an Express REST API, PostgreSQL persistence, and Python ML scripts for market-data ingestion, predictions, asset scoring, comparison, and portfolio optimization.

## What It Does

- Tracks Indian-market assets with seeded starter coverage for NIFTY-style equities.
- Provides historical price data and searchable asset metadata.
- Generates price predictions for configurable horizons.
- Scores and compares assets across suitability, volatility, Sharpe ratio, trend strength, and drawdown.
- Builds optimized INR portfolios based on capital, risk tolerance, and time horizon.
- Supports authenticated user watchlists, saved comparisons, and portfolio history.
- Includes Render Blueprint deployment configuration for backend, frontend, and Postgres.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite |
| Backend | Node.js 18, Express |
| Database | PostgreSQL, node-pg-migrate |
| ML | Python, pandas, numpy, scikit-learn, yfinance |
| Auth | JWT, bcrypt |
| Deploy | Render Blueprint, Docker |

## Repository Structure

```text
VAKVIC/
|-- backend/
|   |-- server.js
|   |-- src/
|   |   |-- db/
|   |   |-- features/
|   |   |-- middleware/
|   |   `-- utils/
|   |-- ml/
|   |-- migrations/
|   |-- Dockerfile
|   |-- package.json
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   `-- App.jsx
|   |-- vite.config.js
|   `-- package.json
|-- render.yaml
`-- README.md
```

## Prerequisites

- Node.js 18 or newer
- Python 3.9 or newer
- PostgreSQL 16 or compatible
- npm

On Windows, make sure `python` resolves to Python 3. On Linux or Docker, the included Dockerfile creates a `python` symlink to `python3`.

## Environment Variables

Backend: copy `backend/.env.example` to `backend/.env`.

```env
DATABASE_URL=postgresql://user:password@localhost:5432/vakvic_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
PORT=3001
PYTHON_PATH=python
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
INGEST_ON_START=false
```

Frontend: copy `frontend/.env.example` to `frontend/.env`.

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Do not commit real `.env` files. They are ignored by `.gitignore`.

## Local Development

### 1. Install Backend Dependencies

```bash
cd backend
cp .env.example .env
npm install
pip install -r requirements.txt
```

### 2. Configure the Database

Create a local PostgreSQL database, then set `DATABASE_URL` in `backend/.env`.

Run migrations and seed starter assets plus starter price history:

```bash
npm run migrate:up
npm run seed
```

### 3. Start the Backend

```bash
npm run dev
```

The API runs at:

```text
http://localhost:3001/api/v1
```

Health check:

```text
GET http://localhost:3001/api/v1/health
```

### 4. Start the Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The Vite app runs at:

```text
http://localhost:5173
```

## Useful Commands

Backend:

```bash
npm run dev
npm run start
npm run migrate:up
npm run migrate:down
npm run seed
```

Frontend:

```bash
npm run dev
npm run build
```

Python ML scripts, run from `backend/`:

```bash
python ml/ingest.py --ticker RELIANCE.NS
python ml/score.py --asset_ids 1,2
python ml/predict.py --asset_id 1 --horizon 7
python ml/optimize.py --capital 500000 --risk Medium --horizon 12
```

## API Overview

Base path:

```text
/api/v1
```

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | No | API and database health |
| POST | `/auth/register` | No | Register a user and return a JWT |
| POST | `/auth/login` | No | Login and return a JWT |
| GET | `/assets` | No | List assets |
| GET | `/assets/search?q=reliance` | No | Search assets |
| GET | `/assets/:id` | No | Get one asset |
| GET | `/assets/:id/prices` | No | Get price history |
| GET | `/watchlist` | Yes | Get the current user's watchlist |
| POST | `/watchlist` | Yes | Add an asset to the watchlist |
| DELETE | `/watchlist/:assetId` | Yes | Remove an asset from the watchlist |
| GET | `/predictions/:assetId?horizon=7` | No | Get predictions, generating them if stale |
| POST | `/predictions/trigger/:assetId` | Yes | Force prediction generation |
| POST | `/comparisons` | Yes | Compare selected assets |
| GET | `/comparisons/:id` | No | Get one comparison |
| GET | `/comparisons/saved` | Yes | Get saved comparisons |
| PATCH | `/comparisons/:id/save` | Yes | Toggle saved state |
| POST | `/portfolio/optimize` | Yes | Generate an optimized portfolio |
| GET | `/portfolio/history` | Yes | Get portfolio history |
| GET | `/portfolio/:id` | Yes | Get one portfolio |
| GET | `/ingestion/status` | No | Get last ingestion status |
| POST | `/ingestion/trigger` | Yes | Trigger market-data ingestion |

Authenticated routes require:

```http
Authorization: Bearer <jwt>
```

## Key Request and Response Shapes

Login response:

```json
{
  "message": "Login successful",
  "token": "jwt",
  "user": {
    "userId": 1,
    "email": "user@example.com"
  }
}
```

Prediction response:

```json
{
  "assetId": 1,
  "horizon": 7,
  "predictions": [
    {
      "prediction_date": "2026-05-05T18:30:00.000Z",
      "predicted_close": "3398.6300",
      "confidence_lower": "3330.6600",
      "confidence_upper": "3466.6000",
      "horizon_days": 7
    }
  ],
  "isStale": false,
  "generatedAt": "2026-05-05T06:58:17.988Z"
}
```

Comparison response includes both a backward-compatible nested object and a top-level frontend-friendly shape:

```json
{
  "comparisonId": 1,
  "assets": [
    {
      "asset_id": 1,
      "ticker_symbol": "RELIANCE.NS",
      "asset_name": "Reliance Industries",
      "suitability_score": 86.81,
      "volatility": 0.0142,
      "sharpe_ratio": 3.9823,
      "trend_strength": 0.0334,
      "max_drawdown": -0.0262
    }
  ]
}
```

Portfolio response includes both a nested portfolio and top-level allocation fields:

```json
{
  "portfolio_id": 1,
  "expected_return": 0.1145,
  "expected_volatility": 0.0004,
  "allocations": [
    {
      "asset_id": 1,
      "ticker": "RELIANCE.NS",
      "asset_name": "Reliance Industries",
      "allocation_pct": 42.93,
      "amount_inr": 214642.65
    }
  ]
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| 400 | Invalid request input |
| 401 | Missing or invalid authentication |
| 403 | Forbidden or blocked by CORS |
| 404 | Resource not found |
| 409 | Duplicate or conflicting request |
| 422 | ML/data validation failure |
| 429 | Rate limit exceeded |
| 500 | Server configuration or database failure |
| 502 | Unexpected Python/ML process failure |
| 504 | Python/ML process timeout |

## Database and Seed Data

Migrations create the core schema:

- users
- assets
- asset_prices
- predictions
- asset_metrics
- watchlists
- asset_comparisons
- portfolios
- portfolio_assets

The seed script inserts starter assets and deterministic starter price history. This keeps prediction, comparison, and portfolio flows usable immediately after a fresh deploy, before live ingestion runs.

## ML Flow

Prediction:

```text
Frontend -> GET /predictions/:assetId?horizon=7
Backend -> checks staleness
Backend -> runs ml/predict.py if needed
Python -> writes predictions to PostgreSQL
Backend -> returns predictions array
Frontend -> maps predictions to chart data
```

Comparison:

```text
Frontend -> POST /comparisons { "asset_ids": [1, 2] }
Backend -> checks metrics
Backend -> runs ml/score.py if needed
Python -> writes asset_metrics
Backend -> saves comparison
Frontend -> maps flat asset metrics to chart data
```

Portfolio:

```text
Frontend -> POST /portfolio/optimize
Backend -> runs ml/optimize.py
Python -> prints JSON allocations
Backend -> saves portfolio and allocations
Frontend -> maps allocations to pie chart data
```

## Rate Limiting

- Global API limiter applies to all API routes.
- Auth limiter applies to register/login routes.
- ML limiter applies to prediction, comparison, portfolio, and protected ingestion-trigger routes.

The auth limiter blocks rapid repeated login attempts with `429`.

## Deployment on Render

This repository includes a Render Blueprint at `render.yaml`.

It provisions:

- `vakvic-db`, PostgreSQL
- `vakvic-backend`, Docker web service
- `vakvic-frontend`, static web service

Deployment flow:

1. Push the repository to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render builds the backend using `backend/Dockerfile`.
4. The backend starts with `npm run migrate:up && npm run seed && node server.js`.
5. Render builds the frontend from `frontend/` and serves `frontend/dist`.

Important production environment behavior:

- `NODE_ENV=production`
- `FRONTEND_URL` is supplied from the frontend service URL.
- CORS allows only the configured frontend URL in production.
- `VITE_API_BASE_URL` is supplied from the backend service URL.
- `PYTHON_PATH=python` is valid in the Docker image.
- `INGEST_ON_START=true` can trigger ingestion after the API boots.

Render's free Postgres plan is useful for demos. Use a paid database before treating this as long-lived production infrastructure.

## Production Readiness Notes

The current pre-deploy audit verified:

- Frontend build passes.
- Backend JavaScript syntax checks pass.
- Python compile checks pass.
- Fresh migration and seed flow works.
- Health endpoint returns database connectivity.
- Auth, assets, watchlist, prediction, comparison, portfolio, ingestion, and rate-limit smoke tests pass.
- `.env` and `node_modules` are ignored and not tracked.
- No password hashes are returned in user-facing responses.
- No real secrets are committed.

## Team

| Name | Role |
| --- | --- |
| Amogh | Database |
| Venkat | ML/DL |
| Vivardhan | ML/DL |
| Vishwanath | UI/UX |
| Charan | UI/UX |
| Koushik | Backend |
