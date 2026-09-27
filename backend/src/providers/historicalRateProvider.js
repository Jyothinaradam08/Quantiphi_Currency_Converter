const { getJson } = require('../utils/httpClient');

/**
 * Adapter for the Frankfurter time-series API (ECB reference rates, free, no key).
 * ExchangeRate-API only offers history on paid plans, so trends are sourced here.
 * Covers ~30 major currencies; publishing days only (no weekends/holidays).
 */
function createHistoricalRateProvider({ baseUrl, timeoutMs }) {
  let supportedCache = null;

  async function getSupportedCurrencies() {
    if (!supportedCache) {
      const body = await getJson(`${baseUrl}/currencies`, { timeoutMs });
      supportedCache = new Set(Object.keys(body || {}));
    }
    return supportedCache;
  }

  async function supportsPair(base, quote) {
    try {
      const supported = await getSupportedCurrencies();
      return supported.has(base) && supported.has(quote);
    } catch {
      return false;
    }
  }

  /** @returns {Promise<Array<{date: string, rate: number}>>} sorted ascending by date */
  async function getTimeSeries(base, quote, startDate, endDate) {
    const url =
      `${baseUrl}/${startDate}..${endDate}` +
      `?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`;
    const body = await getJson(url, { timeoutMs });

    return Object.entries(body.rates || {})
      .map(([date, rates]) => ({ date, rate: rates[quote] }))
      .filter((point) => typeof point.rate === 'number')
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return { name: 'frankfurter.dev (ECB)', supportsPair, getTimeSeries };
}

module.exports = { createHistoricalRateProvider };
