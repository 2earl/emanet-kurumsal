-- Emanet Kurumsal: sign-in, API keys and webhooks. Cases live in emanet-core; this database
-- holds only what the creditors' app itself needs. Times are Unix seconds.

-- A sign-in with login in progress: at most 10 minutes, used once. Only an HMAC of the
-- browser's cookie is stored.
CREATE TABLE signin_tx (
  id_hash       TEXT PRIMARY KEY,
  state         TEXT NOT NULL,
  pkce_verifier TEXT NOT NULL,
  return_to     TEXT,
  second_factor INTEGER NOT NULL DEFAULT 0,
  expires_at    INTEGER NOT NULL
) STRICT;

-- Sessions: 8 h idle, 7 days absolute. Only an HMAC of the cookie is stored.
CREATE TABLE web_sessions (
  id_hash      TEXT PRIMARY KEY,
  uid          TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  aal2_at      INTEGER -- when login last verified the second factor for this sign-in
) STRICT;
CREATE INDEX web_sessions_uid ON web_sessions (uid);

-- API keys, per login organization. The key is shown once; only its HMAC is kept.
CREATE TABLE api_keys (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL,
  name         TEXT NOT NULL,
  prefix       TEXT NOT NULL UNIQUE, -- the visible part, to tell keys apart
  hash         TEXT NOT NULL UNIQUE,
  scopes       TEXT NOT NULL,        -- JSON array of 'cases:read', 'cases:write', 'events:read'
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  last_used_at INTEGER,
  expires_at   INTEGER,
  revoked_at   INTEGER
) STRICT;
CREATE INDEX api_keys_org ON api_keys (org_id);

-- Where a creditor wants events sent. The signing secret is encrypted with WEBHOOK_KEY.
CREATE TABLE webhooks (
  id                   TEXT PRIMARY KEY,
  org_id               TEXT NOT NULL,
  url                  TEXT NOT NULL,
  events               TEXT NOT NULL, -- JSON array of event types
  secret_enc           TEXT NOT NULL,
  created_by           TEXT NOT NULL,
  created_at           INTEGER NOT NULL,
  disabled_at          INTEGER,
  consecutive_failures INTEGER NOT NULL DEFAULT 0
) STRICT;
CREATE INDEX webhooks_org ON webhooks (org_id);

-- Where the sender stopped reading each organization's events from emanet-core.
CREATE TABLE event_cursors (
  org_id     TEXT PRIMARY KEY,
  cursor     TEXT,
  updated_at INTEGER NOT NULL
) STRICT;

-- One event for one webhook: queued, retried with backoff for a day, then given up.
CREATE TABLE deliveries (
  id              TEXT PRIMARY KEY,
  webhook_id      TEXT NOT NULL REFERENCES webhooks (id) ON DELETE CASCADE,
  event_id        TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_status     INTEGER,
  next_attempt_at INTEGER NOT NULL,
  created_at      INTEGER NOT NULL,
  delivered_at    INTEGER,
  UNIQUE (webhook_id, event_id)
) STRICT;
CREATE INDEX deliveries_due ON deliveries (status, next_attempt_at);
CREATE INDEX deliveries_webhook ON deliveries (webhook_id, created_at);

-- A CSV upload checked and waiting for the person to confirm the import: one hour.
CREATE TABLE uploads (
  id         TEXT PRIMARY KEY,
  org_id     TEXT NOT NULL,
  uid        TEXT NOT NULL,
  cases      TEXT NOT NULL, -- JSON array of case inputs
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;
