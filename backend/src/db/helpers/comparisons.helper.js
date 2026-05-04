import { query } from '../pool.js';

/** Insert a comparison record and return the new row. */
export async function saveComparison(userId, assetIds) {
  const { rows } = await query(
    'INSERT INTO asset_comparisons (user_id, asset_ids) VALUES ($1, $2) RETURNING *',
    [userId, assetIds]
  );
  return rows[0];
}

/** Return a single comparison by ID, or null if not found. */
export async function getComparisonById(comparisonId) {
  const { rows } = await query(
    'SELECT * FROM asset_comparisons WHERE comparison_id = $1',
    [comparisonId]
  );
  return rows[0] ?? null;
}

/** Return all saved comparisons for a user, newest first. */
export async function getUserSavedComparisons(userId) {
  const { rows } = await query(
    'SELECT * FROM asset_comparisons WHERE user_id = $1 AND saved = TRUE ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

/** Flip the saved flag on a comparison the user owns; returns null if not owner. */
export async function toggleSaved(comparisonId, userId) {
  const { rows, rowCount } = await query(
    `UPDATE asset_comparisons
     SET saved = NOT saved
     WHERE comparison_id = $1 AND user_id = $2
     RETURNING *`,
    [comparisonId, userId]
  );
  return rowCount === 0 ? null : rows[0];
}
