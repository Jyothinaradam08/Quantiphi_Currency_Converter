const AppError = require('../utils/AppError');
const { roundMoney, roundRate, formatMoney } = require('../utils/money');

function decorate(record) {
  return {
    ...record,
    formatted: {
      amount: formatMoney(record.amount, record.from),
      convertedAmount: formatMoney(record.convertedAmount, record.to),
    },
  };
}

function createConversionService({
  rateService,
  conversionRepository,
  favoriteRepository,
  historyMaxRows,
}) {
  async function quote({ from, to, amount }) {
    await rateService.assertSupported(from, to);
    const { rate, meta } = await rateService.getRate(from, to);
    const normalizedAmount = roundMoney(amount, from);

    return decorate({
      from,
      to,
      amount: normalizedAmount,
      rate: roundRate(rate),
      inverseRate: roundRate(1 / rate),
      convertedAmount: roundMoney(normalizedAmount * rate, to),
      rateUpdatedAt: meta.providerUpdatedAt,
      provider: meta.provider,
      stale: meta.stale,
    });
  }

  /** Performs a conversion and persists it to history; also bumps favorite usage. */
  async function convertAndRecord(input) {
    const result = await quote(input);
    const saved = conversionRepository.create(
      {
        from: result.from,
        to: result.to,
        amount: result.amount,
        rate: result.rate,
        convertedAmount: result.convertedAmount,
      },
      historyMaxRows
    );
    favoriteRepository.recordUsage(result.from, result.to);
    return { ...result, id: saved.id, createdAt: saved.createdAt };
  }

  function listHistory(limit) {
    return conversionRepository.list(limit).map(decorate);
  }

  function deleteHistoryItem(id) {
    if (!conversionRepository.deleteById(id)) {
      throw AppError.notFound('Conversion not found');
    }
  }

  function clearHistory() {
    return { deleted: conversionRepository.clear() };
  }

  return { quote, convertAndRecord, listHistory, deleteHistoryItem, clearHistory };
}

module.exports = { createConversionService };
