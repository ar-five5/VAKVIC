import AppError from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/** Global error handler — translates errors to a uniform JSON response. */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.code === '23505') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid reference to a related resource';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid JSON body';
  } else if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    code = 'CORS_NOT_ALLOWED';
    message = 'Origin is not allowed';
  }

  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(`${statusCode} ${code}: ${message}`);
  }

  const body = { error: { code, message } };
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    body.error.stack = err.stack;
  }
  res.status(statusCode).json(body);
}
