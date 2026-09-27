const { roundMoney, roundRate, formatMoney, currencyName } = require('../utils/money');

/**
 * Travel Budgeting: converts a single base amount into the major global currencies
 * simultaneously, optionally splitting it into a per-day budget.
 */
function createTravelBudgetService({ rateService, majorCurrencies, targetCount }) {
  function selectTargets(baseCurrency) {
    return majorCurrencies.filter((code) => code !== baseCurrency).slice(0, targetCount);
  }

  async function calculate({ baseCurrency, amount, tripDays }) {
    await rateService.assertSupported(baseCurrency);
    const ratesResult = await rateService.getRatesForBase(baseCurrency);
    const roundedAmount = roundMoney(amount, baseCurrency);

    const rows = selectTargets(baseCurrency)
      .filter((code) => typeof ratesResult.rates[code] === 'number')
      .map((code) => {
        const rate = ratesResult.rates[code];
        const convertedAmount = roundMoney(roundedAmount * rate, code);
        const dailyAmount = tripDays ? roundMoney((roundedAmount * rate) / tripDays, code) : null;
        return {
          currency: code,
          name: currencyName(code),
          rate: roundRate(rate),
          inverseRate: roundRate(1 / rate),
          convertedAmount,
          dailyAmount,
          formatted: {
            convertedAmount: formatMoney(convertedAmount, code),
            dailyAmount: dailyAmount === null ? null : formatMoney(dailyAmount, code),
          },
        };
      });

    const dailyBase = tripDays ? roundMoney(roundedAmount / tripDays, baseCurrency) : null;

    return {
      baseCurrency,
      baseCurrencyName: currencyName(baseCurrency),
      amount: roundedAmount,
      tripDays: tripDays || null,
      dailyAmount: dailyBase,
      formatted: {
        amount: formatMoney(roundedAmount, baseCurrency),
        dailyAmount: dailyBase === null ? null : formatMoney(dailyBase, baseCurrency),
      },
      conversions: rows,
      rateUpdatedAt: ratesResult.providerUpdatedAt,
      provider: ratesResult.provider,
      stale: ratesResult.stale,
    };
  }

  return { calculate };
}

module.exports = { createTravelBudgetService };
