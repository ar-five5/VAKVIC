import { Router } from 'express';
import { getAllAssets, searchAssets, getAssetById, getPriceHistory } from './assets.controller.js';

const router = Router();

router.get('/', getAllAssets);
router.get('/search', searchAssets);  // must be before /:id
router.get('/:id', getAssetById);
router.get('/:id/prices', getPriceHistory);

export default router;
