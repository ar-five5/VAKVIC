import {
  savePortfolio,
  savePortfolioAssets,
  getPortfolioHistory,
  getPortfolioById,
} from '../../db/helpers/portfolio.helper.js';
import { runPython } from '../../utils/runPython.js';
import AppError from '../../utils/AppError.js';

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

function shapeAllocation(row, source = {}) {
  const allocationPct = toNumber(row.allocation_pct);
  const amountInr = toNumber(row.amount_inr);
  return {
    id: row.id,
    portfolio_id: row.portfolio_id,
    asset_id: row.asset_id,
    assetId: row.asset_id,
    ticker: source.ticker ?? row.ticker ?? null,
    asset_name: source.asset_name ?? source.name ?? row.asset_name ?? null,
    assetName: source.asset_name ?? source.name ?? row.asset_name ?? null,
    allocation_pct: allocationPct,
    allocationPct,
    amount_inr: amountInr,
    amountInr,
  };
}

function shapePortfolio(row, allocations = []) {
  const expectedReturn = toNumber(row.expected_return);
  const expectedVolatility = toNumber(row.expected_volatility);
  const capitalInr = toNumber(row.capital_inr);
  return {
    ...row,
    capital_inr: capitalInr,
    portfolio_id: row.portfolio_id,
    portfolioId: row.portfolio_id,
    capitalInr,
    riskTolerance: row.risk_tolerance,
    timeHorizon: row.time_horizon,
    expected_return: expectedReturn,
    expected_volatility: expectedVolatility,
    expectedReturn,
    expectedVolatility,
    allocations,
    assets: allocations,
  };
}

export async function optimizePortfolio(userId, capitalInr, riskTolerance, timeHorizon) {
  const result = await runPython('optimize.py', [
    '--capital', String(capitalInr),
    '--risk', riskTolerance,
    '--horizon', String(timeHorizon),
  ]);

  if (!result.success) {
    throw new AppError(result.error || 'Optimization failed', 422, 'OPTIMIZATION_ERROR');
  }
  if (!Array.isArray(result.allocations) || result.allocations.length === 0) {
    throw new AppError('Optimization returned no allocations', 422, 'OPTIMIZATION_ERROR');
  }

  const portfolio = await savePortfolio(
    userId,
    capitalInr,
    riskTolerance,
    timeHorizon,
    result.expected_annual_return,
    result.expected_annual_volatility
  );

  const portfolioId = portfolio.portfolio_id;

  const assetRows = result.allocations.map((a) => ({
    assetId: a.asset_id,
    allocationPct: parseFloat((a.weight * 100).toFixed(4)),
    amountInr: a.amount,
  }));

  const savedAllocations = await savePortfolioAssets(portfolioId, assetRows);
  const allocationMeta = new Map(result.allocations.map((a) => [a.asset_id, a]));
  const allocations = savedAllocations.map((row) =>
    shapeAllocation(row, allocationMeta.get(row.asset_id))
  );

  return shapePortfolio(portfolio, allocations);
}

export async function getHistory(userId) {
  return getPortfolioHistory(userId);
}

export async function getPortfolio(portfolioId, userId) {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio || portfolio.user_id !== userId) {
    throw new AppError('Portfolio not found', 404, 'NOT_FOUND');
  }
  const allocations = Array.isArray(portfolio.allocations)
    ? portfolio.allocations.map((allocation) => shapeAllocation(allocation))
    : [];
  return shapePortfolio(portfolio, allocations);
}
