import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './features/auth/auth.routes.js';
import assetRoutes from './features/assets/assets.routes.js';
import watchlistRoutes from './features/watchlist/watchlist.routes.js';
import predictionRoutes from './features/predictions/predictions.routes.js';
import comparisonRoutes from './features/comparisons/comparisons.routes.js';
import portfolioRoutes from './features/portfolio/portfolio.routes.js';
import ingestionRoutes from './features/ingestion/ingestion.routes.js';
import { getLastRun } from './features/ingestion/ingestion.store.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, mlLimiter } from './middleware/rateLimiter.js';
import { pool } from './db/pool.js';

const app = express();

const normalizeFrontendOrigins = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .flatMap((origin) => {
      if (/^https?:\/\//i.test(origin)) return [origin];
      return [`https://${origin}`, `http://${origin}`];
    });
};

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? normalizeFrontendOrigins(process.env.FRONTEND_URL)
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
    ];

const isLocalDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(apiLimiter);

app.get('/api/v1/health', async (req, res) => {
  let database = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch {
    database = 'error';
  }
  res.json({ status: 'ok', timestamp: new Date(), database, ingestion: getLastRun() });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/predictions', mlLimiter, predictionRoutes);
app.use('/api/v1/comparisons', mlLimiter, comparisonRoutes);
app.use('/api/v1/portfolio', mlLimiter, portfolioRoutes);
app.use('/api/v1/ingestion', ingestionRoutes);

app.use(errorHandler);

export default app;
