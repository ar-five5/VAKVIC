import { get, post } from './client.js';

export const optimizePortfolio = (capital_inr, risk_tolerance, time_horizon) =>
  post('/portfolio/optimize', { capital_inr, risk_tolerance, time_horizon });
export const getPortfolioHistory = () => get('/portfolio/history');
