import { get, post, patch } from './client.js';

export const createComparison = (assetIds) => post('/comparisons', { asset_ids: assetIds });
export const getSavedComparisons = () => get('/comparisons/saved');
export const toggleSaved = (id) => patch(`/comparisons/${id}/save`);
