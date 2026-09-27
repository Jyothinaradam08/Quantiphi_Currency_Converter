function mapRow(row) {
  return {
    id: row.id,
    from: row.from_currency,
    to: row.to_currency,
    amount: row.amount,
    rate: row.rate,
    convertedAmount: row.converted_amount,
    createdAt: row.created_at,
  };
}

function createConversionRepository(db) {
  const insertStmt = db.prepare(`
    INSERT INTO conversions (from_currency, to_currency, amount, rate, converted_amount)
    VALUES (@from, @to, @amount, @rate, @convertedAmount)
  `);
  const findByIdStmt = db.prepare('SELECT * FROM conversions WHERE id = ?');
  const listStmt = db.prepare('SELECT * FROM conversions ORDER BY id DESC LIMIT ?');
  const pruneStmt = db.prepare(`
    DELETE FROM conversions
    WHERE id NOT IN (SELECT id FROM conversions ORDER BY id DESC LIMIT ?)
  `);
  const deleteByIdStmt = db.prepare('DELETE FROM conversions WHERE id = ?');
  const clearStmt = db.prepare('DELETE FROM conversions');

  const insertAndPrune = db.transaction((record, maxRows) => {
    const { lastInsertRowid } = insertStmt.run(record);
    pruneStmt.run(maxRows);
    return lastInsertRowid;
  });

  return {
    create(record, maxRows) {
      const id = insertAndPrune(record, maxRows);
      return mapRow(findByIdStmt.get(id));
    },
    list(limit) {
      return listStmt.all(limit).map(mapRow);
    },
    deleteById(id) {
      return deleteByIdStmt.run(id).changes > 0;
    },
    clear() {
      return clearStmt.run().changes;
    },
  };
}

module.exports = { createConversionRepository };
