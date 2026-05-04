import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import * as watchlistService from './watchlist.service.js';

/** GET /api/v1/watchlist */
export const getWatchlist = catchAsync(async (req, res) => {
  const watchlist = await watchlistService.getWatchlist(req.user.userId);
  res.json({ watchlist });
});

/** POST /api/v1/watchlist */
export const addToWatchlist = catchAsync(async (req, res) => {
  const assetId = Number(req.body?.assetId);
  if (!Number.isFinite(assetId)) {
    throw new AppError('Valid assetId is required', 400, 'VALIDATION_ERROR');
  }
  const already = await watchlistService.isInWatchlist(req.user.userId, assetId);
  if (already) {
    throw new AppError('Asset already in watchlist', 409, 'DUPLICATE_ENTRY');
  }
  const item = await watchlistService.addToWatchlist(req.user.userId, assetId);
  res.status(201).json({ message: 'Asset added to watchlist', item });
});

/** DELETE /api/v1/watchlist/:assetId */
export const removeFromWatchlist = catchAsync(async (req, res) => {
  const assetId = parseInt(req.params.assetId, 10);
  if (isNaN(assetId)) {
    throw new AppError('Invalid asset ID', 400, 'VALIDATION_ERROR');
  }
  await watchlistService.removeFromWatchlist(req.user.userId, assetId);
  res.json({ message: 'Asset removed from watchlist' });
});
