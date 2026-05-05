import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import { parsePositiveInteger } from '../../utils/validators.js';
import * as watchlistService from './watchlist.service.js';

/** GET /api/v1/watchlist */
export const getWatchlist = catchAsync(async (req, res) => {
  const watchlist = await watchlistService.getWatchlist(req.user.userId);
  res.json({ watchlist });
});

/** POST /api/v1/watchlist */
export const addToWatchlist = catchAsync(async (req, res) => {
  const assetId = parsePositiveInteger(req.body?.assetId);
  if (!assetId) {
    throw new AppError('Valid assetId is required', 400, 'VALIDATION_ERROR');
  }
  const asset = await watchlistService.getAssetById(assetId);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'NOT_FOUND');
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
  const assetId = parsePositiveInteger(req.params.assetId);
  if (!assetId) {
    throw new AppError('Invalid asset ID', 400, 'VALIDATION_ERROR');
  }
  const already = await watchlistService.isInWatchlist(req.user.userId, assetId);
  if (!already) {
    throw new AppError('Asset not found in watchlist', 404, 'NOT_FOUND');
  }
  await watchlistService.removeFromWatchlist(req.user.userId, assetId);
  res.json({ message: 'Asset removed from watchlist' });
});
