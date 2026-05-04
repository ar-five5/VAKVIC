import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import {
  optimizePortfolio,
  getHistory,
  getPortfolio,
} from './portfolio.controller.js';

const router = Router();

router.use(protect);

// /optimize and /history must come before /:id
router.post('/optimize', optimizePortfolio);
router.get('/history', getHistory);
router.get('/:id', getPortfolio);

export default router;
