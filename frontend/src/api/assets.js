import { get } from './client.js';

export const getAssets = () => get('/assets');
export const searchAssets = (q, assetClass) =>
  get(`/assets/search?q=${encodeURIComponent(q)}${assetClass ? `&class=${assetClass}` : ''}`);
export const getAssetPrices = (id, from, to) =>
  get(`/assets/${id}/prices${from ? `?from=${from}&to=${to}` : ''}`);
export const getPrices = (id) => getAssetPrices(id);
