const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
const fractionDigitCache = new Map();

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Exchange rates keep 6 significant digits so tiny rates (e.g. VND→USD) stay meaningful. */
function roundRate(rate) {
  return Number(rate.toPrecision(6));
}

function fractionDigits(currency) {
  if (!fractionDigitCache.has(currency)) {
    let digits = 2;
    try {
      digits = new Intl.NumberFormat('en', { style: 'currency', currency })
        .resolvedOptions().maximumFractionDigits;
    } catch {
      // Unknown to ICU: keep the 2-decimal default.
    }
    fractionDigitCache.set(currency, digits);
  }
  return fractionDigitCache.get(currency);
}

function roundMoney(amount, currency) {
  return roundTo(amount, fractionDigits(currency));
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: fractionDigits(currency),
    }).format(amount);
  } catch {
    return `${amount.toFixed(fractionDigits(currency))} ${currency}`;
  }
}

function currencyName(code) {
  try {
    const name = displayNames.of(code);
    return name && name !== code ? name : code;
  } catch {
    return code;
  }
}

module.exports = { roundTo, roundRate, roundMoney, formatMoney, currencyName, fractionDigits };
