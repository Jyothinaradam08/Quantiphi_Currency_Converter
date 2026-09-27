const AppError = require('../utils/AppError');
const { roundRate, roundTo } = require('../utils/money');
const { dateRange } = require('../utils/date');

/** Summary statistics for a rate series; all trend analytics live server-side. */
function computeStats(points) {
  if (points.length < 2) return null;

  let min = points[0];
  let max = points[0];
  let sum = 0;
  for (const point of points) {
    if (point.rate < min.rate) min = point;
    if (point.rate > max.rate) max = point;
    sum += point.rate;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const change = last.rate - first.rate;
  const changePercent = first.rate ? (change / first.rate) * 100 : 0;
  const roundedPercent = roundTo(changePercent, 2);

  // Daily volatility: standard deviation of day-over-day % changes.
  const returns = [];
  for (let i = 1; i < points.length; i += 1) {
    returns.push((points[i].rate - points[i - 1].rate) / points[i - 1].rate);
  }
  const meanReturn = returns.reduce((acc, r) => acc + r, 0) / (returns.length || 1);
  const variance =
    returns.reduce((acc, r) => acc + (r - meanReturn) ** 2, 0) / (returns.length || 1);

  return {
    open: { date: first.date, rate: roundRate(first.rate) },
    close: { date: last.date, rate: roundRate(last.rate) },
    high: { date: max.date, rate: roundRate(max.rate) },
    low: { date: min.date, rate: roundRate(min.rate) },
    average: roundRate(sum / points.length),
    change: roundRate(change),
    changePercent: roundedPercent,
    direction: roundedPercent > 0 ? 'up' : roundedPercent < 0 ? 'down' : 'flat',
    volatilityPercent: roundTo(Math.sqrt(variance) * 100, 3),
  };
}

function createTrendService({
  historicalProvider,
  rateService,
  rateCacheRepository,
  trendCacheRepository,
  ttlMs,
  defaultDays,
  now = () => Date.now(),
}) {
  function fromSnapshots(from, to, startDate) {
    return rateCacheRepository
      .getSnapshotsSince(from, startDate)
      .map((snapshot) => ({ date: snapshot.date, rate: snapshot.rates[to] }))
      .filter((point) => typeof point.rate === 'number');
  }

  function buildPayload({ from, to, days, range, points, source }) {
    const rounded = points.map((p) => ({ date: p.date, rate: roundRate(p.rate) }));
    const available = rounded.length > 0;
    return {
      from,
      to,
      days,
      startDate: range.start,
      endDate: range.end,
      source,
      available,
      message: available
        ? rounded.length < 2
          ? 'Limited history available for this pair; more points will accumulate daily.'
          : null
        : 'Historical data is not available for this currency pair yet.',
      points: rounded,
      stats: computeStats(rounded),
    };
  }

  async function getTrend({ from, to, days = defaultDays }) {
    if (from === to) {
      throw AppError.badRequest('Source and target currencies must be different');
    }
    await rateService.assertSupported(from, to);

    const cached = trendCacheRepository.get(from, to, days);
    if (cached && now() - cached.fetchedAt < ttlMs) {
      return { ...cached.payload, cached: true };
    }

    const range = dateRange(days, new Date(now()));

    if (await historicalProvider.supportsPair(from, to)) {
      try {
        const points = await historicalProvider.getTimeSeries(from, to, range.start, range.end);
        const payload = buildPayload({
          from, to, days, range, points, source: historicalProvider.name,
        });
        trendCacheRepository.save(from, to, days, payload, now());
        return { ...payload, cached: false };
      } catch (err) {
        if (cached) return { ...cached.payload, cached: true, stale: true };
        // Fall through to locally accumulated snapshots.
      }
    }

    // Make sure today's snapshot exists before reading local history.
    await rateService.getRatesForBase(from);
    const payload = buildPayload({
      from, to, days, range,
      points: fromSnapshots(from, to, range.start),
      source: 'local snapshots (SQLite)',
    });
    return { ...payload, cached: false };
  }

  return { getTrend };
}

module.exports = { createTrendService, computeStats };
