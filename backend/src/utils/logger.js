export const logger = {
  info: (...args) => {
    if (process.env.NODE_ENV !== 'test') console.log('[INFO]', ...args);
  },
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => {
    if (process.env.NODE_ENV !== 'test') console.warn('[WARN]', ...args);
  },
};
