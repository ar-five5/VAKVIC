/** Custom error with HTTP status code and machine-readable error code. */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default AppError;
