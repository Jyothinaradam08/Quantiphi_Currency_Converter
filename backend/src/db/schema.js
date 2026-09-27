/**
 * Idempotent schema definition. Each statement is safe to run on every boot.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS conversions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency    TEXT    NOT NULL,
    to_currency      TEXT    NOT NULL,
    amount           REAL    NOT NULL,
    rate             REAL    NOT NULL,
    converted_amount REAL    NOT NULL,
    created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions (created_at DESC);

  CREATE TABLE IF NOT EXISTS favorites (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency TEXT    NOT NULL,
    to_currency   TEXT    NOT NULL,
    usage_count   INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_used_at  TEXT,
    UNIQUE (from_currency, to_currency)
  );

  -- Latest rate table per base currency (short-lived cache of the live API response).
  CREATE TABLE IF NOT EXISTS rate_cache (
    base_currency       TEXT PRIMARY KEY,
    rates_json          TEXT NOT NULL,
    provider            TEXT NOT NULL,
    provider_updated_at TEXT,
    fetched_at          INTEGER NOT NULL
  );

  -- One snapshot per base currency per day; used as a fallback trend source.
  CREATE TABLE IF NOT EXISTS rate_snapshots (
    base_currency TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    rates_json    TEXT NOT NULL,
    PRIMARY KEY (base_currency, snapshot_date)
  );

  CREATE TABLE IF NOT EXISTS trend_cache (
    base_currency  TEXT    NOT NULL,
    quote_currency TEXT    NOT NULL,
    days           INTEGER NOT NULL,
    payload_json   TEXT    NOT NULL,
    fetched_at     INTEGER NOT NULL,
    PRIMARY KEY (base_currency, quote_currency, days)
  );
`;

module.exports = { SCHEMA };
