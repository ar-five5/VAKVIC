import { get } from './client.js';

export const getAssets = () => get('/assets');
export const searchAssets = (q, assetClass) =>
  get(`/assets/search?q=${encodeURIComponent(q)}${assetClass ? `&class=${assetClass}` : ''}`);
export const getAssetPrices = (id, from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return get(`/assets/${id}/prices${query ? `?${query}` : ''}`);
};
export const getPrices = (id) => getAssetPrices(id);
