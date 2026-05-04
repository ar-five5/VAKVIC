import {
  getAllAssets as dbGetAll,
  getAssetById as dbGetById,
  searchAssets as dbSearch,
  getPriceHistory as dbGetPrices,
} from '../../db/helpers/assets.helper.js';

/** Thin service layer — exists so future ML enrichment has a home without touching controllers. */

export const getAllAssets = () => dbGetAll();

export const getAssetById = (assetId) => dbGetById(assetId);

export const searchAssets = (q, assetClass) => dbSearch(q, assetClass);

export const getPriceHistory = (assetId, from, to) => dbGetPrices(assetId, from, to);
