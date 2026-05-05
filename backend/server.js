import 'dotenv/config';
import app from './src/app.js';
import './src/db/pool.js';
import { logger } from './src/utils/logger.js';
import { startIngestionCron } from './src/features/ingestion/ingestion.cron.js';
import { runIngestion } from './src/features/ingestion/ingestion.service.js';

const PORT = process.env.PORT || 3001;
const INGEST_ON_START = process.env.INGEST_ON_START === 'true';
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}

app.listen(PORT, () => {
  logger.info(`VAKVIC backend running on port ${PORT}`);
  startIngestionCron();
  if (INGEST_ON_START) {
    setTimeout(() => {
      runIngestion().catch((err) => {
        logger.error('[Startup] Ingestion failed:', err.message);
      });
    }, 2_000);
  }
});
