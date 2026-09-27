const AppError = require('../utils/AppError');

function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    err = AppError.badRequest('Request body must be valid JSON');
  }

  const isKnown = err instanceof AppError;
  const statusCode = isKnown ? err.statusCode : 500;

  if (!isKnown || statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    error: {
      code: isKnown ? err.code : 'INTERNAL_ERROR',
      message: isKnown ? err.message : 'Something went wrong. Please try again.',
      ...(isKnown && err.details ? { details: err.details } : {}),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
