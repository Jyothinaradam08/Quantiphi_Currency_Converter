function mapRow(row) {
  return {
    id: row.id,
    from: row.from_currency,
    to: row.to_currency,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

function createFavoriteRepository(db) {
  const listStmt = db.prepare(`
    SELECT * FROM favorites
    ORDER BY usage_count DESC, COALESCE(last_used_at, created_at) DESC, id DESC
  `);
  const findByIdStmt = db.prepare('SELECT * FROM favorites WHERE id = ?');
  const findByPairStmt = db.prepare(
    'SELECT * FROM favorites WHERE from_currency = ? AND to_currency = ?'
  );
  const countStmt = db.prepare('SELECT COUNT(*) AS total FROM favorites');
  const insertStmt = db.prepare(
    'INSERT INTO favorites (from_currency, to_currency) VALUES (?, ?)'
  );
  const deleteStmt = db.prepare('DELETE FROM favorites WHERE id = ?');
  const recordUsageStmt = db.prepare(`
    UPDATE favorites
    SET usage_count = usage_count + 1,
        last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE from_currency = ? AND to_currency = ?
  `);

  return {
    list() {
      return listStmt.all().map(mapRow);
    },
    findById(id) {
      const row = findByIdStmt.get(id);
      return row ? mapRow(row) : null;
    },
    findByPair(from, to) {
      const row = findByPairStmt.get(from, to);
      return row ? mapRow(row) : null;
    },
    count() {
      return countStmt.get().total;
    },
    create(from, to) {
      const { lastInsertRowid } = insertStmt.run(from, to);
      return mapRow(findByIdStmt.get(lastInsertRowid));
    },
    deleteById(id) {
      return deleteStmt.run(id).changes > 0;
    },
    recordUsage(from, to) {
      return recordUsageStmt.run(from, to).changes > 0;
    },
  };
}

module.exports = { createFavoriteRepository };
