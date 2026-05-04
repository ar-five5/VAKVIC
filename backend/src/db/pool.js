import 'dotenv/config';
import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export function query(text, params) {
  return pool.query(text, params);
}

pool.query('SELECT NOW()')
  .then((res) => logger.info('DB connected:', res.rows[0].now))
  .catch((err) => logger.error('DB connection failed:', err.message));
