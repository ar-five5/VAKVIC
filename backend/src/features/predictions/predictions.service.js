import { query } from '../../db/pool.js';
import {
  getStaleOrMissing,
} from '../../db/helpers/predictions.helper.js';
import { runPython } from '../../utils/runPython.js';

const VALID_HORIZONS = [7, 14, 30, 90];

async function fetchAllPredictions(assetId, horizonDays) {
  const { rows } = await query(
    `SELECT * FROM predictions
     WHERE asset_id = $1 AND horizon_days = $2
     ORDER BY prediction_date ASC`,
    [assetId, horizonDays]
  );
  return rows;
}

export async function getPrediction(assetId, horizonDays) {
  const isStale = await getStaleOrMissing(assetId, horizonDays);

  if (isStale) {
    await runPython('predict.py', [
      '--asset_id', String(assetId),
      '--horizon', String(horizonDays),
    ]);
  }

  const predictions = await fetchAllPredictions(assetId, horizonDays);
  return {
    predictions,
    isStale,
    generatedAt: predictions[0]?.generated_at ?? null,
  };
}

export async function triggerPrediction(assetId, horizonDays) {
  const result = await runPython('predict.py', [
    '--asset_id', String(assetId),
    '--horizon', String(horizonDays),
  ]);
  return result;
}

export { VALID_HORIZONS };
