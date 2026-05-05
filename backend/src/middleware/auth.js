import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/** Verifies JWT from `Authorization: Bearer <token>` and attaches payload to req.user. */
export const protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401, 'UNAUTHORIZED');
  }
  const token = header.slice(7).trim();
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500, 'CONFIGURATION_ERROR');
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
  next();
});
