import { query } from '../pool.js';

/** Return the most recent prediction for a given asset and horizon, or null. */
export async function getPrediction(assetId, horizonDays) {
  const { rows } = await query(
    `SELECT * FROM predictions
     WHERE asset_id = $1 AND horizon_days = $2
     ORDER BY generated_at DESC
     LIMIT 1`,
    [assetId, horizonDays]
  );
  return rows[0] ?? null;
}

/** Upsert a prediction row (conflict on asset_id + prediction_date + horizon_days). */
export async function savePrediction(
  assetId, predictionDate, predictedClose,
  confidenceLower, confidenceUpper, modelVersion, horizonDays
) {
  const { rows } = await query(
    `INSERT INTO predictions
       (asset_id, prediction_date, predicted_close, confidence_lower,
        confidence_upper, model_version, horizon_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (asset_id, prediction_date, horizon_days)
     DO UPDATE SET
       predicted_close  = EXCLUDED.predicted_close,
       confidence_lower = EXCLUDED.confidence_lower,
       confidence_upper = EXCLUDED.confidence_upper,
       model_version    = EXCLUDED.model_version,
       generated_at     = NOW()
     RETURNING *`,
    [assetId, predictionDate, predictedClose, confidenceLower, confidenceUpper, modelVersion, horizonDays]
  );
  return rows[0];
}

/** Return true if no fresh prediction (within 24 h) exists for asset + horizon. */
export async function getStaleOrMissing(assetId, horizonDays) {
  const { rows } = await query(
    `SELECT EXISTS (
       SELECT 1 FROM predictions
       WHERE asset_id = $1
         AND horizon_days = $2
         AND generated_at >= NOW() - INTERVAL '24 hours'
     ) AS fresh`,
    [assetId, horizonDays]
  );
  return !rows[0].fresh;
}
