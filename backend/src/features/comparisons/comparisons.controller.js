import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import * as comparisonsService from './comparisons.service.js';

/** POST /api/v1/comparisons [protected] */
export const createComparison = catchAsync(async (req, res) => {
  const { asset_ids } = req.body;

  if (
    !Array.isArray(asset_ids) ||
    asset_ids.length < 2 ||
    !asset_ids.every((id) => Number.isInteger(id) && id > 0)
  ) {
    throw new AppError(
      'asset_ids must be an array of 2 or more positive integers',
      400,
      'VALIDATION_ERROR'
    );
  }

  const userId = req.user.userId;
  const comparison = await comparisonsService.createComparison(userId, asset_ids);
  res.status(201).json({ comparison });
});

/** GET /api/v1/comparisons/:id */
export const getComparison = catchAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid comparison ID', 400, 'VALIDATION_ERROR');
  }
  const comparison = await comparisonsService.getComparison(id);
  res.json({ comparison });
});

/** GET /api/v1/comparisons/saved [protected] */
export const getSavedComparisons = catchAsync(async (req, res) => {
  const comparisons = await comparisonsService.getSavedComparisons(req.user.userId);
  res.json({ comparisons });
});

/** PATCH /api/v1/comparisons/:id/save [protected] */
export const toggleSaved = catchAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid comparison ID', 400, 'VALIDATION_ERROR');
  }
  const comparison = await comparisonsService.toggleSaved(id, req.user.userId);
  res.json({ comparison });
});
