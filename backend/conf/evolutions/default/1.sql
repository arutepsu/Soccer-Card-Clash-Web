CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY,
  provider     TEXT NOT NULL,
  subject      TEXT NOT NULL,
  email        TEXT,
  nickname     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, subject),
  UNIQUE (nickname)
);

CREATE INDEX IF NOT EXISTS idx_users_provider_subject
  ON users (provider, subject);

DROP TABLE IF EXISTS users;
