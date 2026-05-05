import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import { parsePositiveInteger } from '../../utils/validators.js';
import * as predictionsService from './predictions.service.js';
import { VALID_HORIZONS } from './predictions.service.js';

/** GET /api/v1/predictions/:assetId?horizon=7 */
export const getPrediction = catchAsync(async (req, res) => {
  const assetId = parsePositiveInteger(req.params.assetId);
  if (!assetId) {
    throw new AppError('Invalid asset ID', 400, 'VALIDATION_ERROR');
  }

  const horizon = req.query.horizon !== undefined
    ? parseInt(req.query.horizon, 10)
    : 7;

  if (!VALID_HORIZONS.includes(horizon)) {
    throw new AppError(
      `Invalid horizon. Must be one of ${VALID_HORIZONS.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  const { predictions, isStale, generatedAt } =
    await predictionsService.getPrediction(assetId, horizon);

  res.json({ assetId, horizon, predictions, isStale, generatedAt });
});

/** POST /api/v1/predictions/trigger/:assetId [protected] */
export const triggerPrediction = catchAsync(async (req, res) => {
  const assetId = parsePositiveInteger(req.params.assetId);
  if (!assetId) {
    throw new AppError('Invalid asset ID', 400, 'VALIDATION_ERROR');
  }

  const horizon = req.body?.horizon !== undefined
    ? parseInt(req.body.horizon, 10)
    : 7;

  if (!VALID_HORIZONS.includes(horizon)) {
    throw new AppError(
      `Invalid horizon. Must be one of ${VALID_HORIZONS.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  const result = await predictionsService.triggerPrediction(assetId, horizon);
  res.status(202).json({ message: 'Prediction triggered', result });
});
