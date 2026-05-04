import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { getStatus, triggerIngestion } from './ingestion.controller.js';

const router = Router();

router.get('/status', getStatus);
router.post('/trigger', protect, triggerIngestion);

export default router;
