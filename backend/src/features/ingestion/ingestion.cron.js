import cron from 'node-cron';
import { runIngestion } from './ingestion.service.js';
import { logger } from '../../utils/logger.js';

export const startIngestionCron = () => {
  cron.schedule('30 12 * * 1-5', async () => {
    logger.info('[Cron] Daily ingestion job fired');
    try {
      await runIngestion();
    } catch (err) {
      logger.error('[Cron] Ingestion job failed:', err.message);
    }
  }, { timezone: 'UTC' });

  logger.info('[Cron] Daily ingestion scheduled — 12:30 UTC (Mon-Fri)');
};
