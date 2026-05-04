import {
  savePortfolio,
  savePortfolioAssets,
  getPortfolioHistory,
  getPortfolioById,
} from '../../db/helpers/portfolio.helper.js';
import { runPython } from '../../utils/runPython.js';
import AppError from '../../utils/AppError.js';

export async function optimizePortfolio(userId, capitalInr, riskTolerance, timeHorizon) {
  const result = await runPython('optimize.py', [
    '--capital', String(capitalInr),
    '--risk', riskTolerance,
    '--horizon', String(timeHorizon),
  ]);

  if (!result.success) {
    throw new AppError(result.error || 'Optimization failed', 422, 'OPTIMIZATION_ERROR');
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

  const allocations = await savePortfolioAssets(portfolioId, assetRows);

  return {
    portfolioId,
    capitalInr,
    riskTolerance,
    timeHorizon,
    expectedReturn: result.expected_annual_return,
    expectedVolatility: result.expected_annual_volatility,
    allocations,
  };
}

export async function getHistory(userId) {
  return getPortfolioHistory(userId);
}

export async function getPortfolio(portfolioId, userId) {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio || portfolio.user_id !== userId) {
    throw new AppError('Portfolio not found', 404, 'NOT_FOUND');
  }
  return portfolio;
}
