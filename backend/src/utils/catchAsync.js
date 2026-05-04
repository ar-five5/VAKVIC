/** Wraps async route handlers to forward errors to the Express error handler. */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
