import { runPython } from '../../utils/runPython.js';
import { seedStarterData } from '../../db/starterData.js';
import { setRunning, setSuccess, setError } from './ingestion.store.js';
import { logger } from '../../utils/logger.js';

export const runIngestion = async () => {
  setRunning();
  logger.info('[Ingestion] Starting daily ingestion pipeline...');
  try {
    await seedStarterData();
    const result = await runPython('ingest.py', []);
    setSuccess(result);
    logger.info(`[Ingestion] Complete — ${result.processed} assets processed`);
    return result;
  } catch (err) {
    setError(err);
    logger.error('[Ingestion] Failed:', err.message);
    throw err;
  }
};
