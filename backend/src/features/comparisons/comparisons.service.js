import {
  saveComparison,
  getComparisonById,
  getUserSavedComparisons,
  toggleSaved as dbToggleSaved,
} from '../../db/helpers/comparisons.helper.js';
import { getMetricsByAssetId } from '../../db/helpers/metrics.helper.js';
import { getAssetById } from '../../db/helpers/assets.helper.js';
import { runPython } from '../../utils/runPython.js';
import AppError from '../../utils/AppError.js';

async function enrichAssets(assetIds) {
  const entries = await Promise.all(
    assetIds.map(async (assetId) => {
      const [asset, metrics] = await Promise.all([
        getAssetById(assetId),
        getMetricsByAssetId(assetId),
      ]);
      return {
        assetId,
        ticker: asset?.ticker_symbol ?? null,
        name: asset?.asset_name ?? null,
        metrics,
        suitabilityScore: metrics?.suitability_score ?? null,
      };
    })
  );
  return entries;
}

export async function createComparison(userId, assetIds) {
  const metricsResults = await Promise.all(
    assetIds.map((id) => getMetricsByAssetId(id))
  );
  const missingIds = assetIds.filter((_, i) => !metricsResults[i]);

  if (missingIds.length > 0) {
    await runPython('score.py', ['--asset_ids', missingIds.join(',')]);
  }

  const comparison = await saveComparison(userId, assetIds);
  const assets = await enrichAssets(assetIds);

  return {
    comparisonId: comparison.comparison_id,
    assets,
    createdAt: comparison.created_at,
  };
}

export async function getComparison(comparisonId) {
  const comparison = await getComparisonById(comparisonId);
  if (!comparison) {
    throw new AppError('Comparison not found', 404, 'NOT_FOUND');
  }
  const assets = await enrichAssets(comparison.asset_ids);
  return { ...comparison, assets };
}

export async function getSavedComparisons(userId) {
  return getUserSavedComparisons(userId);
}

export async function toggleSaved(comparisonId, userId) {
  const comparison = await dbToggleSaved(comparisonId, userId);
  if (!comparison) {
    throw new AppError('Comparison not found or not owned by user', 404, 'NOT_FOUND');
  }
  return comparison;
}
