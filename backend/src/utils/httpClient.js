const AppError = require('./AppError');

/**
 * Minimal JSON GET helper on top of native fetch with a hard timeout.
 * Non-2xx responses are surfaced with their status so callers can decide how to react.
 */
async function getJson(url, { timeoutMs = 8000 } = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'timed out' : err.message;
    throw AppError.upstream(`Request to exchange rate provider failed: ${reason}`);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Some error responses are not JSON; body stays null.
  }

  if (!response.ok) {
    const error = AppError.upstream(`Provider responded with HTTP ${response.status}`);
    error.upstreamStatus = response.status;
    error.upstreamBody = body;
    throw error;
  }

  return body;
}

module.exports = { getJson };
