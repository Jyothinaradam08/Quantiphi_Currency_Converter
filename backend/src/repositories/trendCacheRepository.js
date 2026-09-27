function createTrendCacheRepository(db) {
  const getStmt = db.prepare(`
    SELECT payload_json, fetched_at FROM trend_cache
    WHERE base_currency = ? AND quote_currency = ? AND days = ?
  `);
  const upsertStmt = db.prepare(`
    INSERT INTO trend_cache (base_currency, quote_currency, days, payload_json, fetched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (base_currency, quote_currency, days) DO UPDATE SET
      payload_json = excluded.payload_json,
      fetched_at = excluded.fetched_at
  `);

  return {
    get(base, quote, days) {
      const row = getStmt.get(base, quote, days);
      return row ? { payload: JSON.parse(row.payload_json), fetchedAt: row.fetched_at } : null;
    },
    save(base, quote, days, payload, fetchedAt) {
      upsertStmt.run(base, quote, days, JSON.stringify(payload), fetchedAt);
    },
  };
}

module.exports = { createTrendCacheRepository };
