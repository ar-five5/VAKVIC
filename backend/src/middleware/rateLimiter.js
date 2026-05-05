import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again in 15 minutes' } },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' } },
  standardHeaders: true,
  legacyHeaders: false
});

export const mlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many ML requests, wait a moment' } },
  standardHeaders: true,
  legacyHeaders: false
});
