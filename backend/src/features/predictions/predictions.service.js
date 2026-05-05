import { query } from '../../db/pool.js';
import {
  getStaleOrMissing,
} from '../../db/helpers/predictions.helper.js';
import { getAssetById } from '../../db/helpers/assets.helper.js';
import { runPython } from '../../utils/runPython.js';
import AppError from '../../utils/AppError.js';
import {
  canUseFallbackData,
  getFallbackAssetById,
  getFallbackPredictions,
  logFallback,
} from '../../db/fallbackData.js';

const VALID_HORIZONS = [7, 14, 30, 90];

async function fetchAllPredictions(assetId, horizonDays) {
  const { rows } = await query(
    `SELECT * FROM predictions
     WHERE asset_id = $1 AND horizon_days = $2
     ORDER BY prediction_date ASC`,
    [assetId, horizonDays]
  );
  return rows;
}

const shouldUsePredictionFallback = (err) => {
  const isExpectedClientError = err instanceof AppError
    && ['NOT_FOUND', 'VALIDATION_ERROR'].includes(err.code);
  return !isExpectedClientError && canUseFallbackData(err);
};

export async function getPrediction(assetId, horizonDays) {
  try {
    const asset = await getAssetById(assetId);
    if (!asset) {
      const fallbackAsset = canUseFallbackData() ? getFallbackAssetById(assetId) : null;
      if (!fallbackAsset) {
        throw new AppError('Asset not found', 404, 'NOT_FOUND');
      }
      logFallback('predictions');
      const fallbackPredictions = getFallbackPredictions(assetId, horizonDays);
      return {
        predictions: fallbackPredictions,
        isStale: false,
        generatedAt: fallbackPredictions[fallbackPredictions.length - 1]?.generated_at ?? null,
      };
    }

    const isStale = await getStaleOrMissing(assetId, horizonDays);

    if (isStale) {
      await runPython('predict.py', [
        '--asset_id', String(assetId),
        '--horizon', String(horizonDays),
      ]);
    }

    const predictions = await fetchAllPredictions(assetId, horizonDays);
    if (predictions.length === 0 && canUseFallbackData()) {
      logFallback('predictions');
      const fallbackPredictions = getFallbackPredictions(assetId, horizonDays);
      return {
        predictions: fallbackPredictions,
        isStale: false,
        generatedAt: fallbackPredictions[fallbackPredictions.length - 1]?.generated_at ?? null,
      };
    }

    return {
      predictions,
      isStale,
      generatedAt: predictions[predictions.length - 1]?.generated_at ?? null,
    };
  } catch (err) {
    if (!shouldUsePredictionFallback(err)) throw err;
    const fallbackAsset = getFallbackAssetById(assetId);
    if (!fallbackAsset) {
      throw new AppError('Asset not found', 404, 'NOT_FOUND');
    }
    logFallback('predictions', err);
    const fallbackPredictions = getFallbackPredictions(assetId, horizonDays);
    return {
      predictions: fallbackPredictions,
      isStale: false,
      generatedAt: fallbackPredictions[fallbackPredictions.length - 1]?.generated_at ?? null,
    };
  }
}

export async function triggerPrediction(assetId, horizonDays) {
  try {
    const asset = await getAssetById(assetId);
    if (!asset) {
      const fallbackAsset = canUseFallbackData() ? getFallbackAssetById(assetId) : null;
      if (!fallbackAsset) {
        throw new AppError('Asset not found', 404, 'NOT_FOUND');
      }
      logFallback('predictions');
      return {
        success: true,
        fallback: true,
        predictions: getFallbackPredictions(assetId, horizonDays),
      };
    }

    const result = await runPython('predict.py', [
      '--asset_id', String(assetId),
      '--horizon', String(horizonDays),
    ]);
    return result;
  } catch (err) {
    if (!shouldUsePredictionFallback(err)) throw err;
    const fallbackAsset = getFallbackAssetById(assetId);
    if (!fallbackAsset) {
      throw new AppError('Asset not found', 404, 'NOT_FOUND');
    }
    logFallback('predictions', err);
    return {
      success: true,
      fallback: true,
      predictions: getFallbackPredictions(assetId, horizonDays),
    };
  }
}

export { VALID_HORIZONS };
