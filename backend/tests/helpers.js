const { createDatabase } = require('../src/db/connection');
const { createContainer } = require('../src/container');
const { createApp } = require('../src/app');

const USD_RATES = { USD: 1, EUR: 0.9, GBP: 0.8, JPY: 150, CNY: 7.2, AUD: 1.5, INR: 83, VND: 25000 };

function ratesFor(base) {
  const baseInUsd = USD_RATES[base];
  return Object.fromEntries(
    Object.entries(USD_RATES).map(([code, rate]) => [code, rate / baseInUsd])
  );
}

function createFakeRateProvider() {
  const provider = {
    calls: 0,
    fail: false,
    async getLatestRates(base) {
      provider.calls += 1;
      if (provider.fail) {
        const err = new Error('provider down');
        err.statusCode = 502;
        throw err;
      }
      return {
        base,
        rates: ratesFor(base),
        provider: 'fake',
        providerUpdatedAt: '2026-09-27T00:00:00.000Z',
      };
    },
  };
  return provider;
}

function createFakeHistoricalProvider() {
  return {
    name: 'fake-history',
    async supportsPair(base, quote) {
      return base !== 'VND' && quote !== 'VND';
    },
    async getTimeSeries() {
      return [
        { date: '2026-09-01', rate: 0.9 },
        { date: '2026-09-02', rate: 0.95 },
        { date: '2026-09-03', rate: 0.85 },
        { date: '2026-09-04', rate: 0.99 },
      ];
    },
  };
}

function buildTestApp() {
  const rateProvider = createFakeRateProvider();
  const { db, services } = createContainer({
    db: createDatabase(':memory:'),
    rateProvider,
    historicalProvider: createFakeHistoricalProvider(),
  });
  return { app: createApp({ services, logRequests: false }), db, rateProvider };
}

module.exports = { buildTestApp };
