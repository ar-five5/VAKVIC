import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { getPrediction, triggerPrediction } from './predictions.controller.js';

const router = Router();

// /trigger/:assetId must come before /:assetId
router.post('/trigger/:assetId', protect, triggerPrediction);
router.get('/:assetId', getPrediction);

export default router;
