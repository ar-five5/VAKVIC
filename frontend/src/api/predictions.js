import { get } from './client.js';

export const getPredictions = (assetId, horizon = 7) =>
  get(`/predictions/${assetId}?horizon=${horizon}`);
