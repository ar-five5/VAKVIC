import { query } from '../pool.js';

/** Return the metrics row for an asset, or null if none computed yet. */
export async function getMetricsByAssetId(assetId) {
  const { rows } = await query(
    'SELECT * FROM asset_metrics WHERE asset_id = $1',
    [assetId]
  );
  return rows[0] ?? null;
}

/** Upsert metrics for an asset (conflict on the unique asset_id column). */
export async function saveMetrics(
  assetId, volatility, sharpeRatio,
  trendStrength, maxDrawdown, suitabilityScore
) {
  const { rows } = await query(
    `INSERT INTO asset_metrics
       (asset_id, volatility, sharpe_ratio, trend_strength, max_drawdown, suitability_score)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (asset_id)
     DO UPDATE SET
       volatility        = EXCLUDED.volatility,
       sharpe_ratio      = EXCLUDED.sharpe_ratio,
       trend_strength    = EXCLUDED.trend_strength,
       max_drawdown      = EXCLUDED.max_drawdown,
       suitability_score = EXCLUDED.suitability_score,
       computed_at       = NOW()
     RETURNING *`,
    [assetId, volatility, sharpeRatio, trendStrength, maxDrawdown, suitabilityScore]
  );
  return rows[0];
}
