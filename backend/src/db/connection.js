const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { SCHEMA } = require('./schema');

/**
 * Opens (or creates) the SQLite database and applies the schema.
 * Pass ':memory:' for an ephemeral database (used by tests).
 */
function createDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

module.exports = { createDatabase };
