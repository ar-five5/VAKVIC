import catchAsync from '../../utils/catchAsync.js';
import { getLastRun } from './ingestion.store.js';
import { runIngestion } from './ingestion.service.js';
import { logger } from '../../utils/logger.js';

export const getStatus = catchAsync(async (req, res) => {
  res.json({ ingestion: getLastRun() });
});

export const triggerIngestion = catchAsync(async (req, res) => {
  runIngestion().catch((err) =>
    logger.error('Manual trigger failed:', err.message)
  );
  res.status(202).json({
    message: 'Ingestion triggered',
    startedAt: new Date().toISOString(),
  });
});
