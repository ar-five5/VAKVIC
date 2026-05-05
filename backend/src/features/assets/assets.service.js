import {
  getAllAssets as dbGetAll,
  getAssetById as dbGetById,
  searchAssets as dbSearch,
  getPriceHistory as dbGetPrices,
} from '../../db/helpers/assets.helper.js';
import {
  canUseFallbackData,
  getFallbackAssetById,
  getFallbackAssets,
  getFallbackPriceHistory,
  logFallback,
  searchFallbackAssets,
} from '../../db/fallbackData.js';

/** Thin service layer — exists so future ML enrichment has a home without touching controllers. */

const withFallback = async (area, dbOperation, fallbackOperation) => {
  try {
    const result = await dbOperation();
    if (Array.isArray(result) && result.length === 0 && canUseFallbackData()) {
      logFallback(area);
      return fallbackOperation();
    }
    return result;
  } catch (err) {
    if (!canUseFallbackData(err)) throw err;
    logFallback(area, err);
    return fallbackOperation();
  }
};

export const getAllAssets = () => withFallback(
  'assets',
  () => dbGetAll(),
  () => getFallbackAssets()
);

export const getAssetById = async (assetId) => {
  const asset = await withFallback(
    'assets',
    () => dbGetById(assetId),
    () => getFallbackAssetById(assetId)
  );
  return asset ?? (canUseFallbackData() ? getFallbackAssetById(assetId) : null);
};

export const searchAssets = (q, assetClass) => withFallback(
  'assets',
  () => dbSearch(q, assetClass),
  () => searchFallbackAssets(q, assetClass)
);

export const getPriceHistory = (assetId, from, to) => withFallback(
  'price history',
  () => dbGetPrices(assetId, from, to),
  () => getFallbackPriceHistory(assetId, from, to)
);
