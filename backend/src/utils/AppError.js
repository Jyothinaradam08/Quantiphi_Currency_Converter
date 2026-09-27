class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new AppError(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, { statusCode: 404, code: 'NOT_FOUND' });
  }

  static conflict(message) {
    return new AppError(message, { statusCode: 409, code: 'CONFLICT' });
  }

  static upstream(message = 'Exchange rate provider is unavailable', details) {
    return new AppError(message, { statusCode: 502, code: 'UPSTREAM_ERROR', details });
  }
}

module.exports = AppError;
