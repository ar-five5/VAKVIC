import {
  getWatchlist as dbGet,
  addToWatchlist as dbAdd,
  removeFromWatchlist as dbRemove,
  isInWatchlist as dbExists,
} from '../../db/helpers/watchlist.helper.js';

export const getWatchlist = (userId) => dbGet(userId);

export const addToWatchlist = (userId, assetId) => dbAdd(userId, assetId);

export const removeFromWatchlist = (userId, assetId) => dbRemove(userId, assetId);

export const isInWatchlist = (userId, assetId) => dbExists(userId, assetId);
