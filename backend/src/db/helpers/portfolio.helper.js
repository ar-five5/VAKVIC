import { query } from '../pool.js';

/** Insert a portfolio record and return the new row. */
export async function savePortfolio(
  userId, capitalInr, riskTolerance,
  timeHorizon, expectedReturn, expectedVolatility
) {
  const { rows } = await query(
    `INSERT INTO portfolios
       (user_id, capital_inr, risk_tolerance, time_horizon, expected_return, expected_volatility)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, capitalInr, riskTolerance, timeHorizon, expectedReturn, expectedVolatility]
  );
  return rows[0];
}

/** Bulk-insert portfolio asset allocations in a single statement. */
export async function savePortfolioAssets(portfolioId, assets) {
  const portfolioIds = assets.map(() => portfolioId);
  const assetIds     = assets.map((a) => a.assetId);
  const allocations  = assets.map((a) => a.allocationPct);
  const amounts      = assets.map((a) => a.amountInr);

  const { rows } = await query(
    `INSERT INTO portfolio_assets (portfolio_id, asset_id, allocation_pct, amount_inr)
     SELECT * FROM unnest(
       $1::int[], $2::int[], $3::numeric[], $4::numeric[]
     ) AS t(portfolio_id, asset_id, allocation_pct, amount_inr)
     RETURNING *`,
    [portfolioIds, assetIds, allocations, amounts]
  );
  return rows;
}

/** Return all portfolios for a user, newest first. */
export async function getPortfolioHistory(userId) {
  const { rows } = await query(
    'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

/** Return a portfolio with its asset allocations as an embedded array. */
export async function getPortfolioById(portfolioId) {
  const { rows } = await query(
    `SELECT p.*,
       (SELECT json_agg(pa ORDER BY pa.id)
        FROM portfolio_assets pa
        WHERE pa.portfolio_id = p.portfolio_id) AS assets
     FROM portfolios p
     WHERE p.portfolio_id = $1`,
    [portfolioId]
  );
  return rows[0] ?? null;
}
