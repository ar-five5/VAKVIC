import 'dotenv/config';
import { pool } from './pool.js';
import { seedStarterData } from './starterData.js';
import { logger } from '../utils/logger.js';

const { seededAssets, seededPrices } = await seedStarterData();

logger.info(`Seeded ${seededAssets} new asset(s) and ${seededPrices} starter price row(s). Existing rows skipped.`);
await pool.end();
