# VAKVIC Database — Setup Guide

## Quick Start

### 1. Install PostgreSQL

**Mac:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/WSL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Open psql as superuser
sudo -u postgres psql    # Linux
psql postgres             # Mac

# Run these SQL commands:
CREATE USER vakvic_admin WITH PASSWORD 'your_password_here';
CREATE DATABASE vakvic_db OWNER vakvic_admin;
GRANT ALL PRIVILEGES ON DATABASE vakvic_db TO vakvic_admin;

# For UUID extension (needed by schema)
\c vakvic_db
GRANT CREATE ON SCHEMA public TO vakvic_admin;
\q
```

### 3. Run the Schema

```bash
psql -U vakvic_admin -d vakvic_db -f 001_schema.sql
psql -U vakvic_admin -d vakvic_db -f 002_seed_assets.sql
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual password
```

### 5. Seed Historical Prices

```bash
pip install yfinance psycopg2-binary pandas python-dotenv
python seed_historical_prices.py           # Fetch all assets (5 years)
python seed_historical_prices.py --check   # Verify what's in the DB
```

## Files

| File | Purpose |
|------|---------|
| `001_schema.sql` | Tables, indexes, views, triggers |
| `002_seed_assets.sql` | Master asset list (30 instruments) |
| `003_common_queries.sql` | Reference queries for all team members |
| `seed_historical_prices.py` | yfinance → PostgreSQL ingestion script |
| `.env.example` | Database connection config template |

## Schema Overview

```
assets ──────────< historical_prices
   │                    
   ├──────────< predictions
   │                    
   ├──────────< asset_metrics
   │                    
   ├──< comparisons (asset_id_1, asset_id_2)
   │                    
   └──────────< portfolio_allocations >──────── portfolios >── users
                                                                  │
                                                            watchlist
```

## For Team Members

- **Koushik (Backend):** See `003_common_queries.sql` for all the SQL you'll need in your Express service layer. Use `pg` npm package to run these.
- **Venkat/Vivardhan (ML):** Section 3 of `003_common_queries.sql` has your training data queries. You can also query directly from Python using psycopg2 or pandas `read_sql()`.
- **Frontend team:** You don't touch the DB directly — everything goes through Koushik's Express APIs.
