PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  disabled_at INTEGER
);

CREATE TABLE web_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX web_sessions_account_idx ON web_sessions(account_id, expires_at);

CREATE TABLE access_keys (
  key_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'used', 'expired', 'revoked')),
  used_at INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at INTEGER,
  client_version TEXT,
  exchange_id TEXT,
  revoked_at INTEGER
);

CREATE INDEX access_keys_account_idx ON access_keys(account_id, created_at DESC);
CREATE INDEX access_keys_expiration_idx ON access_keys(status, expires_at);

CREATE TABLE tool_sessions (
  token_hash TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL REFERENCES access_keys(key_hash) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  request_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER
);

CREATE INDEX tool_sessions_account_idx ON tool_sessions(account_id, expires_at);

CREATE TABLE rate_limits (
  bucket_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  PRIMARY KEY(bucket_key, window_start)
);