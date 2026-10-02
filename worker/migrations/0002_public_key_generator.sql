ALTER TABLE access_keys ADD COLUMN owner_token_hash TEXT;
ALTER TABLE access_keys ADD COLUMN owner_expires_at INTEGER;

CREATE INDEX access_keys_owner_idx ON access_keys(owner_token_hash, owner_expires_at);

INSERT OR IGNORE INTO accounts (id, email, password_salt, password_hash, created_at, disabled_at)
VALUES ('site-key-generator', 'website-key-generator@service.invalid', 'reserved', 'reserved', 1, 1);