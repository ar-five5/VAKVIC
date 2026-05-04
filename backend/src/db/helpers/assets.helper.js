import { query } from '../pool.js';

/** Return all assets ordered alphabetically by ticker symbol. */
export async function getAllAssets() {
  const { rows } = await query('SELECT * FROM assets ORDER BY ticker_symbol');
  return rows;
}

/** Return a single asset by ID, or null if not found. */
export async function getAssetById(assetId) {
  const { rows } = await query(
    'SELECT * FROM assets WHERE asset_id = $1',
    [assetId]
  );
  return rows[0] ?? null;
}

/** ILIKE search on ticker and name; optionally filter by asset_class. */
export async function searchAssets(q, assetClass) {
  const pattern = `%${q}%`;
  const { rows } = await query(
    `SELECT * FROM assets
     WHERE (ticker_symbol ILIKE $1 OR asset_name ILIKE $1)
       AND ($2::asset_class_enum IS NULL OR asset_class = $2)
     ORDER BY ticker_symbol`,
    [pattern, assetClass ?? null]
  );
  return rows;
}

/** Return OHLCV rows for an asset, optionally bounded by date range, ascending. */
export async function getPriceHistory(assetId, from, to) {
  const { rows } = await query(
    `SELECT * FROM asset_prices
     WHERE asset_id = $1
       AND ($2::date IS NULL OR date >= $2)
       AND ($3::date IS NULL OR date <= $3)
     ORDER BY date ASC`,
    [assetId, from ?? null, to ?? null]
  );
  return rows;
}
