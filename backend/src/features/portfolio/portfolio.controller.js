import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import * as portfolioService from './portfolio.service.js';

const VALID_RISK = ['Low', 'Medium', 'High'];

/** POST /api/v1/portfolio/optimize [protected] */
export const optimizePortfolio = catchAsync(async (req, res) => {
  const { capital_inr, risk_tolerance, time_horizon } = req.body ?? {};

  if (capital_inr === undefined || risk_tolerance === undefined || time_horizon === undefined) {
    throw new AppError('capital_inr, risk_tolerance, and time_horizon are required', 400, 'VALIDATION_ERROR');
  }
  if (typeof capital_inr !== 'number' || capital_inr <= 0) {
    throw new AppError('capital_inr must be a positive number', 400, 'VALIDATION_ERROR');
  }
  if (!VALID_RISK.includes(risk_tolerance)) {
    throw new AppError(
      `risk_tolerance must be one of ${VALID_RISK.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }
  if (!Number.isInteger(time_horizon) || time_horizon <= 0) {
    throw new AppError('time_horizon must be a positive integer', 400, 'VALIDATION_ERROR');
  }

  const portfolio = await portfolioService.optimizePortfolio(
    req.user.userId,
    capital_inr,
    risk_tolerance,
    time_horizon
  );

  res.status(201).json({ portfolio });
});

/** GET /api/v1/portfolio/history [protected] */
export const getHistory = catchAsync(async (req, res) => {
  const portfolios = await portfolioService.getHistory(req.user.userId);
  res.json({ portfolios });
});

/** GET /api/v1/portfolio/:id [protected] */
export const getPortfolio = catchAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    throw new AppError('Invalid portfolio ID', 400, 'VALIDATION_ERROR');
  }
  const portfolio = await portfolioService.getPortfolio(id, req.user.userId);
  res.json({ portfolio });
});
