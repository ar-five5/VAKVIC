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
import { seedStarterData } from '../../db/starterData.js';
import { logger } from '../../utils/logger.js';

/** Thin service layer — exists so future ML enrichment has a home without touching controllers. */

let seedAttempt = null;

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

const ensureStarterAssets = async () => {
  if (!seedAttempt) {
    seedAttempt = seedStarterData()
      .then((result) => {
        logger.info(
          `Starter data ensured: ${result.seededAssets} asset(s), ${result.seededPrices} price row(s) inserted`
        );
        return result;
      })
      .catch((err) => {
        seedAttempt = null;
        throw err;
      });
  }
  return seedAttempt;
};

export const getAllAssets = () => withFallback(
  'assets',
  async () => {
    let assets = await dbGetAll();
    if (assets.length === 0) {
      await ensureStarterAssets();
      assets = await dbGetAll();
    }
    return assets;
  },
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
