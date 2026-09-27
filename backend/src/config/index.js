const path = require('path');
require('dotenv').config({ quiet: true });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const backendRoot = path.resolve(__dirname, '..', '..');

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 5000),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  db: {
    path: path.resolve(backendRoot, process.env.DB_PATH || './data/currency.db'),
  },

  exchangeRateApi: {
    key: (process.env.EXCHANGE_RATE_API_KEY || '').trim(),
    baseUrl: process.env.EXCHANGE_RATE_API_BASE_URL || 'https://v6.exchangerate-api.com/v6',
    openBaseUrl: process.env.EXCHANGE_RATE_OPEN_API_BASE_URL || 'https://open.er-api.com/v6',
  },

  historicalApi: {
    baseUrl: process.env.HISTORICAL_API_BASE_URL || 'https://api.frankfurter.dev/v1',
  },

  cache: {
    latestRatesTtlMs: toInt(process.env.LATEST_RATES_TTL_MINUTES, 60) * 60 * 1000,
    trendTtlMs: toInt(process.env.TREND_TTL_MINUTES, 360) * 60 * 1000,
  },

  history: {
    maxRows: toInt(process.env.HISTORY_MAX_ROWS, 100),
  },

  httpTimeoutMs: toInt(process.env.HTTP_TIMEOUT_MS, 8000),

  business: {
    trendDays: 30,
    // Ordered by priority; the first five that differ from the base currency are used.
    travelBudgetCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF'],
    travelBudgetTargetCount: 5,
    maxAmount: 1_000_000_000_000,
    maxFavorites: 50,
  },
});

module.exports = config;
