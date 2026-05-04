# VAKVIC
Value Analytics & Knowledge-driven Value Intelligence Core

A web-based financial analytics platform for the Indian market (NIFTY 50).

## Project Structure
```
vakvic/
├── frontend/     — React.js frontend (Vite)
├── backend/      — Express/Node.js REST API
│   ├── src/      — Feature-based source code
│   ├── ml/       — Python ML scripts
│   └── migrations/ — node-pg-migrate files
└── render.yaml   — Render deployment config
```

## Team
| Name       | Role              |
|------------|-------------------|
| Amogh      | Database Lead     |
| Venkat     | ML/DL             |
| Vivardhan  | ML/DL             |
| Vishwanath | UI/UX             |
| Charan     | UI/UX             |
| Koushik    | Backend           |

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 16

### Backend
```bash
cd backend
cp .env.example .env        # fill in your credentials
npm install
pip install -r requirements.txt
npm run migrate:up
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### ML Scripts (standalone)
```bash
cd backend
python ml/ingest.py --ticker RELIANCE.NS
python ml/score.py --asset_ids 1,2
python ml/predict.py --asset_id 1 --horizon 7
python ml/optimize.py --capital 500000 --risk Medium --horizon 12
```

## API Endpoints
Base URL: `http://localhost:3001/api/v1`

| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| GET    | /health                         | No   | Health check             |
| POST   | /auth/register                  | No   | Register user            |
| POST   | /auth/login                     | No   | Login, get JWT           |
| GET    | /assets                         | No   | List all assets          |
| GET    | /assets/search?q=               | No   | Search assets            |
| GET    | /assets/:id                     | No   | Asset detail             |
| GET    | /assets/:id/prices              | No   | Price history            |
| GET    | /predictions/:assetId?horizon=  | No   | Get predictions          |
| POST   | /predictions/trigger/:assetId   | Yes  | Trigger recalculation    |
| POST   | /comparisons                    | Yes  | Create comparison        |
| GET    | /comparisons/:id                | No   | Get comparison           |
| GET    | /comparisons/saved              | Yes  | User's saved comparisons |
| PATCH  | /comparisons/:id/save           | Yes  | Toggle saved             |
| POST   | /portfolio/optimize             | Yes  | Run portfolio optimizer  |
| GET    | /portfolio/history              | Yes  | User's portfolio history |
| GET    | /portfolio/:id                  | Yes  | Portfolio detail         |
| GET    | /watchlist                      | Yes  | Get watchlist            |
| POST   | /watchlist                      | Yes  | Add to watchlist         |
| DELETE | /watchlist/:assetId             | Yes  | Remove from watchlist    |
| GET    | /ingestion/status               | No   | Last ingestion status    |
| POST   | /ingestion/trigger              | Yes  | Trigger ingestion        |

## Deployment (Render)
See `render.yaml` at the repo root. Required env vars to set manually in the Render dashboard:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — random secure string
- `FRONTEND_URL` — your deployed frontend URL (set after first frontend deploy)
