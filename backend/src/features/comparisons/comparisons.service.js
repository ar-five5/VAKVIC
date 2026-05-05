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

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

function shapeAsset(asset, metrics) {
  const shapedMetrics = {
    suitability_score: toNumber(metrics?.suitability_score),
    volatility: toNumber(metrics?.volatility),
    sharpe_ratio: toNumber(metrics?.sharpe_ratio),
    trend_strength: toNumber(metrics?.trend_strength),
    max_drawdown: toNumber(metrics?.max_drawdown),
  };

  return {
    asset_id: asset.asset_id,
    assetId: asset.asset_id,
    ticker_symbol: asset.ticker_symbol,
    ticker: asset.ticker_symbol,
    asset_name: asset.asset_name,
    name: asset.asset_name,
    suitability_score: shapedMetrics.suitability_score,
    suitabilityScore: shapedMetrics.suitability_score,
    volatility: shapedMetrics.volatility,
    sharpe_ratio: shapedMetrics.sharpe_ratio,
    trend_strength: shapedMetrics.trend_strength,
    max_drawdown: shapedMetrics.max_drawdown,
    metrics: shapedMetrics,
  };
}

function shapeComparison(row, assets = []) {
  return {
    comparison_id: row.comparison_id,
    comparisonId: row.comparison_id,
    asset_ids: row.asset_ids,
    assetIds: row.asset_ids,
    saved: row.saved,
    created_at: row.created_at,
    createdAt: row.created_at,
    assets,
  };
}

async function enrichAssets(assetIds) {
  const entries = await Promise.all(
    assetIds.map(async (assetId) => {
      const [asset, metrics] = await Promise.all([
        getAssetById(assetId),
        getMetricsByAssetId(assetId),
      ]);
      if (!asset) {
        throw new AppError(`Asset not found: ${assetId}`, 404, 'NOT_FOUND');
      }
      return shapeAsset(asset, metrics);
    })
  );
  return entries;
}

async function ensureAssetsExist(assetIds) {
  const assets = await Promise.all(assetIds.map((id) => getAssetById(id)));
  const missingId = assetIds.find((_, index) => !assets[index]);
  if (missingId) {
    throw new AppError(`Asset not found: ${missingId}`, 404, 'NOT_FOUND');
  }
}

async function ensureMetrics(assetIds) {
  const metricsResults = await Promise.all(
    assetIds.map((id) => getMetricsByAssetId(id))
  );
  const missingIds = assetIds.filter((_, i) => !metricsResults[i]);

  if (missingIds.length > 0) {
    await runPython('score.py', ['--asset_ids', missingIds.join(',')]);
  }

  const refreshedMetrics = await Promise.all(
    assetIds.map((id) => getMetricsByAssetId(id))
  );
  const stillMissing = assetIds.filter((_, i) => !refreshedMetrics[i]);
  if (stillMissing.length > 0) {
    throw new AppError(
      `Insufficient price history to score asset(s): ${stillMissing.join(', ')}`,
      422,
      'ML_DATA_NOT_READY'
    );
  }
}

export async function createComparison(userId, assetIds) {
  await ensureAssetsExist(assetIds);
  await ensureMetrics(assetIds);

  const comparison = await saveComparison(userId, assetIds);
  const assets = await enrichAssets(assetIds);

  return shapeComparison(comparison, assets);
}

export async function getComparison(comparisonId) {
  const comparison = await getComparisonById(comparisonId);
  if (!comparison) {
    throw new AppError('Comparison not found', 404, 'NOT_FOUND');
  }
  const assets = await enrichAssets(comparison.asset_ids);
  return shapeComparison(comparison, assets);
}

export async function getSavedComparisons(userId) {
  const comparisons = await getUserSavedComparisons(userId);
  return Promise.all(
    comparisons.map(async (comparison) => {
      const assets = await enrichAssets(comparison.asset_ids);
      return shapeComparison(comparison, assets);
    })
  );
}

export async function toggleSaved(comparisonId, userId) {
  const comparison = await dbToggleSaved(comparisonId, userId);
  if (!comparison) {
    throw new AppError('Comparison not found or not owned by user', 404, 'NOT_FOUND');
  }
  const assets = await enrichAssets(comparison.asset_ids);
  return shapeComparison(comparison, assets);
}
