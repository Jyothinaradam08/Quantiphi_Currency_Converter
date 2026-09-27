const AppError = require('../utils/AppError');

/**
 * Validates and normalises request parts against Zod schemas.
 * Parsed values are exposed on `req.validated` (Express 5 makes `req.query` read-only).
 */
function validate(shape) {
  return (req, _res, next) => {
    req.validated = req.validated || {};
    const issues = [];

    for (const part of ['params', 'query', 'body']) {
      if (!shape[part]) continue;
      const result = shape[part].safeParse(req[part] ?? {});
      if (result.success) {
        req.validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ field: issue.path.join('.') || part, message: issue.message });
        }
      }
    }

    if (issues.length) {
      return next(AppError.badRequest(issues[0].message, issues));
    }
    return next();
  };
}

module.exports = validate;
