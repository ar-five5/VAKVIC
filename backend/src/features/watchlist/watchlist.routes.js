import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from './watchlist.controller.js';

const router = Router();

router.use(protect);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:assetId', removeFromWatchlist);

export default router;
