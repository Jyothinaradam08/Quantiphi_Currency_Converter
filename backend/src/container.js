const config = require('./config');
const { createDatabase } = require('./db/connection');
const { createExchangeRateApiProvider } = require('./providers/exchangeRateApiProvider');
const { createHistoricalRateProvider } = require('./providers/historicalRateProvider');
const { createConversionRepository } = require('./repositories/conversionRepository');
const { createFavoriteRepository } = require('./repositories/favoriteRepository');
const { createRateCacheRepository } = require('./repositories/rateCacheRepository');
const { createTrendCacheRepository } = require('./repositories/trendCacheRepository');
const { createRateService } = require('./services/rateService');
const { createConversionService } = require('./services/conversionService');
const { createTrendService } = require('./services/trendService');
const { createFavoriteService } = require('./services/favoriteService');
const { createTravelBudgetService } = require('./services/travelBudgetService');

/**
 * Composition root: wires infrastructure → repositories → services.
 * Any dependency can be overridden (tests inject an in-memory DB and fake providers).
 */
function createContainer(overrides = {}) {
  const db = overrides.db || createDatabase(config.db.path);

  const rateProvider =
    overrides.rateProvider ||
    createExchangeRateApiProvider({ ...config.exchangeRateApi, timeoutMs: config.httpTimeoutMs });
  const historicalProvider =
    overrides.historicalProvider ||
    createHistoricalRateProvider({ ...config.historicalApi, timeoutMs: config.httpTimeoutMs });

  const conversionRepository = createConversionRepository(db);
  const favoriteRepository = createFavoriteRepository(db);
  const rateCacheRepository = createRateCacheRepository(db);
  const trendCacheRepository = createTrendCacheRepository(db);

  const rateService = createRateService({
    provider: rateProvider,
    rateCacheRepository,
    ttlMs: config.cache.latestRatesTtlMs,
  });

  const services = {
    rateService,
    conversionService: createConversionService({
      rateService,
      conversionRepository,
      favoriteRepository,
      historyMaxRows: config.history.maxRows,
    }),
    trendService: createTrendService({
      historicalProvider,
      rateService,
      rateCacheRepository,
      trendCacheRepository,
      ttlMs: config.cache.trendTtlMs,
      defaultDays: config.business.trendDays,
    }),
    favoriteService: createFavoriteService({
      favoriteRepository,
      rateService,
      maxFavorites: config.business.maxFavorites,
    }),
    travelBudgetService: createTravelBudgetService({
      rateService,
      majorCurrencies: config.business.travelBudgetCurrencies,
      targetCount: config.business.travelBudgetTargetCount,
    }),
  };

  return { db, services };
}

module.exports = { createContainer };
