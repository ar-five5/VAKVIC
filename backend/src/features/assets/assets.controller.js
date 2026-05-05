import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import { isValidIsoDate, parsePositiveInteger, VALID_ASSET_CLASSES } from '../../utils/validators.js';
import * as assetsService from './assets.service.js';

/** GET /api/v1/assets */
export const getAllAssets = catchAsync(async (req, res) => {
  const assets = await assetsService.getAllAssets();
  res.json({ assets });
});

/** GET /api/v1/assets/search?q=&class= */
export const searchAssets = catchAsync(async (req, res) => {
  const { q, class: assetClass } = req.query;
  if (typeof q !== 'string' || q.trim() === '') {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }
  if (assetClass && !VALID_ASSET_CLASSES.includes(assetClass)) {
    throw new AppError(
      `class must be one of ${VALID_ASSET_CLASSES.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }
  const assets = await assetsService.searchAssets(q.trim(), assetClass || undefined);
  res.json({ assets });
});

/** GET /api/v1/assets/:id */
export const getAssetById = catchAsync(async (req, res) => {
  const assetId = parsePositiveInteger(req.params.id);
  if (!assetId) {
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
  const assetId = parsePositiveInteger(req.params.id);
  if (!assetId) {
    throw new AppError('Invalid asset ID', 400, 'VALIDATION_ERROR');
  }
  const { from, to } = req.query;
  if (from && !isValidIsoDate(from)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }
  if (to && !isValidIsoDate(to)) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }
  if (from && to && from > to) {
    throw new AppError('from must be before or equal to to', 400, 'VALIDATION_ERROR');
  }
  const asset = await assetsService.getAssetById(assetId);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'NOT_FOUND');
  }
  const prices = await assetsService.getPriceHistory(assetId, from || null, to || null);
  res.json({ assetId, prices });
});
