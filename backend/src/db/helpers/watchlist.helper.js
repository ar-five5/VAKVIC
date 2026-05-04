import { query } from '../pool.js';

/** Return watchlist rows joined with asset info and latest close price. */
export async function getWatchlist(userId) {
  const { rows } = await query(
    `SELECT w.watchlist_id, w.added_at, a.*,
       latest.close AS latest_close
     FROM watchlist w
     JOIN assets a ON a.asset_id = w.asset_id
     LEFT JOIN LATERAL (
       SELECT close FROM asset_prices
       WHERE asset_id = a.asset_id
       ORDER BY date DESC
       LIMIT 1
     ) latest ON TRUE
     WHERE w.user_id = $1
     ORDER BY w.added_at DESC`,
    [userId]
  );
  return rows;
}

/** Add an asset to the user's watchlist (unique constraint enforced by DB). */
export async function addToWatchlist(userId, assetId) {
  const { rows } = await query(
    'INSERT INTO watchlist (user_id, asset_id) VALUES ($1, $2) RETURNING *',
    [userId, assetId]
  );
  return rows[0];
}

/** Remove an asset from the user's watchlist. */
export async function removeFromWatchlist(userId, assetId) {
  await query(
    'DELETE FROM watchlist WHERE user_id = $1 AND asset_id = $2',
    [userId, assetId]
  );
}

/** Return true if the asset is in the user's watchlist. */
export async function isInWatchlist(userId, assetId) {
  const { rows } = await query(
    'SELECT EXISTS(SELECT 1 FROM watchlist WHERE user_id = $1 AND asset_id = $2) AS found',
    [userId, assetId]
  );
  return rows[0].found;
}
