const AppError = require('../utils/AppError');
const { getJson } = require('../utils/httpClient');

/**
 * Adapter for ExchangeRate-API (https://www.exchangerate-api.com).
 * Uses the authenticated v6 endpoint when an API key is configured, otherwise
 * the free open-access endpoint which exposes the same data set (updated daily).
 */
function createExchangeRateApiProvider({ key, baseUrl, openBaseUrl, timeoutMs }) {
  const buildUrl = (base) =>
    key
      ? `${baseUrl}/${encodeURIComponent(key)}/latest/${encodeURIComponent(base)}`
      : `${openBaseUrl}/latest/${encodeURIComponent(base)}`;

  async function getLatestRates(base) {
    let body;
    try {
      body = await getJson(buildUrl(base), { timeoutMs });
    } catch (err) {
      const errorType = err.upstreamBody && err.upstreamBody['error-type'];
      if (errorType) throw mapProviderError(errorType, base);
      throw err;
    }

    if (!body || body.result !== 'success') {
      throw mapProviderError(body && body['error-type'], base);
    }

    const rates = body.conversion_rates || body.rates;
    if (!rates || typeof rates !== 'object') {
      throw AppError.upstream('Exchange rate provider returned an unexpected payload');
    }

    return {
      base: body.base_code || base,
      rates,
      provider: 'exchangerate-api.com',
      providerUpdatedAt: body.time_last_update_utc
        ? new Date(body.time_last_update_utc).toISOString()
        : null,
    };
  }

  return { getLatestRates };
}

function mapProviderError(errorType, base) {
  switch (errorType) {
    case 'unsupported-code':
      return AppError.badRequest(`Currency "${base}" is not supported`);
    case 'invalid-key':
    case 'inactive-account':
      return AppError.upstream('Exchange rate API key is invalid or inactive');
    case 'quota-reached':
      return AppError.upstream('Exchange rate API quota reached');
    default:
      return AppError.upstream(`Exchange rate provider error${errorType ? `: ${errorType}` : ''}`);
  }
}

module.exports = { createExchangeRateApiProvider };
