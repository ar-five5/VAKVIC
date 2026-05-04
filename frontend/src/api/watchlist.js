import { get, post, del } from './client.js';

export const getWatchlist = () => get('/watchlist');
export const addToWatchlist = (assetId) => post('/watchlist', { assetId });
export const removeFromWatchlist = (assetId) => del(`/watchlist/${assetId}`);
