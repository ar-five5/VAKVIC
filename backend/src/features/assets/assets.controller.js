import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import * as assetsService from './assets.service.js';

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str));
}

/** GET /api/v1/assets */
export const getAllAssets = catchAsync(async (req, res) => {
  const assets = await assetsService.getAllAssets();
  res.json({ assets });
});

/** GET /api/v1/assets/search?q=&class= */
export const searchAssets = catchAsync(async (req, res) => {
  const { q, class: assetClass } = req.query;
  if (!q || q.trim() === '') {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }
  const assets = await assetsService.searchAssets(q.trim(), assetClass || undefined);
  res.json({ assets });
});

/** GET /api/v1/assets/:id */
export const getAssetById = catchAsync(async (req, res) => {
  const assetId = parseInt(req.params.id, 10);
  if (isNaN(assetId)) {
    throw new AppError('Invalid asset ID', 400, 'VALIDATION_ERROR');
  }
  const asset = await assetsService.getAssetById(assetId);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'NOT_FOUND');
  }
  res.json({ asset });
});

/** GET /api/v1/assets/:id/prices?from=YYYY-MM-DD&to=YYYY-MM-DD */
export const getPriceHistory = catchAsync(async (req, res) => {
  const assetId = parseInt(req.params.id, 10);
  if (isNaN(assetId)) {
    throw new AppError('Invalid asset ID', 400, 'VALIDATION_ERROR');
  }
  const { from, to } = req.query;
  if (from && !isValidDate(from)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }
  if (to && !isValidDate(to)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }
  const prices = await assetsService.getPriceHistory(assetId, from || null, to || null);
  res.json({ assetId, prices });
});
