import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './features/auth/auth.routes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/v1/auth', authRoutes);

app.use(errorHandler);

export default app;
