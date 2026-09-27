const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const config = require('./config');
const { createApiRouter } = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp({ services, logRequests = config.env !== 'test' }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));
  if (logRequests) app.use(morgan('dev'));

  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 200, standardHeaders: 'draft-8', legacyHeaders: false }),
    createApiRouter(services)
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
