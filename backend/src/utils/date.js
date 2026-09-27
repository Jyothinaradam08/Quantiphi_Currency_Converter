const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns YYYY-MM-DD in UTC. */
function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function dateRange(days, now = new Date()) {
  const end = new Date(now.getTime());
  const start = new Date(now.getTime() - days * DAY_MS);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

module.exports = { DAY_MS, toIsoDate, dateRange };
