const AppError = require('../utils/AppError');
const { currencyName } = require('../utils/money');
const { toIsoDate, DAY_MS } = require('../utils/date');

const REFERENCE_BASE = 'USD';
const SNAPSHOT_RETENTION_DAYS = 60;

/**
 * Owns live exchange-rate retrieval: SQLite-backed caching with TTL, stale fallback
 * when the provider is unreachable, and de-duplication of concurrent fetches.
 */
function createRateService({ provider, rateCacheRepository, ttlMs, now = () => Date.now() }) {
  const inFlight = new Map();

  async function fetchAndStore(base) {
    const result = await provider.getLatestRates(base);
    const fetchedAt = now();
    const entry = { ...result, base, fetchedAt };
    rateCacheRepository.save(
      entry,
      toIsoDate(new Date(fetchedAt)),
      toIsoDate(new Date(fetchedAt - SNAPSHOT_RETENTION_DAYS * DAY_MS))
    );
    return entry;
  }

  function fetchDeduplicated(base) {
    if (!inFlight.has(base)) {
      const promise = fetchAndStore(base).finally(() => inFlight.delete(base));
      inFlight.set(base, promise);
    }
    return inFlight.get(base);
  }

  function toResult(entry, stale) {
    return {
      base: entry.base,
      rates: entry.rates,
      provider: entry.provider,
      providerUpdatedAt: entry.providerUpdatedAt,
      fetchedAt: new Date(entry.fetchedAt).toISOString(),
      stale,
    };
  }

  async function getRatesForBase(base) {
    const cached = rateCacheRepository.getLatest(base);
    if (cached && now() - cached.fetchedAt < ttlMs) {
      return toResult(cached, false);
    }

    try {
      return toResult(await fetchDeduplicated(base), false);
    } catch (err) {
      // Serve stale data rather than failing when the provider is down.
      if (cached && err.statusCode !== 400) return toResult(cached, true);
      throw err;
    }
  }

  async function getSupportedCodes() {
    const { rates } = await getRatesForBase(REFERENCE_BASE);
    return new Set(Object.keys(rates));
  }

  async function assertSupported(...codes) {
    const supported = await getSupportedCodes();
    const unsupported = codes.filter((code) => !supported.has(code));
    if (unsupported.length) {
      throw AppError.badRequest(`Unsupported currency: ${unsupported.join(', ')}`);
    }
  }

  async function listCurrencies() {
    const { rates, providerUpdatedAt, stale } = await getRatesForBase(REFERENCE_BASE);
    const currencies = Object.keys(rates)
      .sort()
      .map((code) => ({ code, name: currencyName(code) }));
    return { currencies, providerUpdatedAt, stale };
  }

  async function getRate(from, to) {
    const result = await getRatesForBase(from);
    const rate = from === to ? 1 : result.rates[to];
    if (typeof rate !== 'number') {
      throw AppError.badRequest(`Unsupported currency: ${to}`);
    }
    return { rate, meta: result };
  }

  return { getRatesForBase, getRate, listCurrencies, assertSupported };
}

module.exports = { createRateService };
