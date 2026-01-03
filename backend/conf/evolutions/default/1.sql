# --- !Ups

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  subject text NOT NULL,
  email text,
  nickname text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- needed for ON CONFLICT (provider, subject)
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_subject_uq
  ON users(provider, subject);

-- optional: enforce unique nickname (your updateNickname catches conflict)
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_uq
  ON users(nickname)
  WHERE nickname IS NOT NULL;

# --- !Downs

DROP TABLE IF EXISTS users;
