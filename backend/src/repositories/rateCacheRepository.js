function createRateCacheRepository(db) {
  const getLatestStmt = db.prepare('SELECT * FROM rate_cache WHERE base_currency = ?');
  const upsertLatestStmt = db.prepare(`
    INSERT INTO rate_cache (base_currency, rates_json, provider, provider_updated_at, fetched_at)
    VALUES (@base, @ratesJson, @provider, @providerUpdatedAt, @fetchedAt)
    ON CONFLICT (base_currency) DO UPDATE SET
      rates_json = excluded.rates_json,
      provider = excluded.provider,
      provider_updated_at = excluded.provider_updated_at,
      fetched_at = excluded.fetched_at
  `);
  const upsertSnapshotStmt = db.prepare(`
    INSERT INTO rate_snapshots (base_currency, snapshot_date, rates_json)
    VALUES (?, ?, ?)
    ON CONFLICT (base_currency, snapshot_date) DO UPDATE SET rates_json = excluded.rates_json
  `);
  const snapshotsStmt = db.prepare(`
    SELECT snapshot_date, rates_json FROM rate_snapshots
    WHERE base_currency = ? AND snapshot_date >= ?
    ORDER BY snapshot_date ASC
  `);
  const pruneSnapshotsStmt = db.prepare('DELETE FROM rate_snapshots WHERE snapshot_date < ?');

  const saveTx = db.transaction((entry, snapshotDate, pruneBefore) => {
    const ratesJson = JSON.stringify(entry.rates);
    upsertLatestStmt.run({ ...entry, ratesJson });
    upsertSnapshotStmt.run(entry.base, snapshotDate, ratesJson);
    pruneSnapshotsStmt.run(pruneBefore);
  });

  return {
    getLatest(base) {
      const row = getLatestStmt.get(base);
      if (!row) return null;
      return {
        base: row.base_currency,
        rates: JSON.parse(row.rates_json),
        provider: row.provider,
        providerUpdatedAt: row.provider_updated_at,
        fetchedAt: row.fetched_at,
      };
    },
    save(entry, snapshotDate, pruneBefore) {
      saveTx(entry, snapshotDate, pruneBefore);
    },
    getSnapshotsSince(base, sinceDate) {
      return snapshotsStmt.all(base, sinceDate).map((row) => ({
        date: row.snapshot_date,
        rates: JSON.parse(row.rates_json),
      }));
    },
  };
}

module.exports = { createRateCacheRepository };
