#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

if [[ -z "${APPLICATION_SECRET:-}" ]]; then
  echo "ERROR: APPLICATION_SECRET is not set."
  exit 1
fi

BIN_DIR="/app/stage/bin"
if [[ ! -d "$BIN_DIR" ]]; then
  echo "ERROR: $BIN_DIR not found. Did stage build succeed?"
  ls -la /app/stage || true
  exit 1
fi

APP_BIN="$(find "$BIN_DIR" -maxdepth 1 -type f -perm -111 | head -n 1 || true)"
if [[ -z "$APP_BIN" ]]; then
  echo "ERROR: No executable found in $BIN_DIR"
  ls -la "$BIN_DIR"
  exit 1
fi

echo "Starting Play app: $APP_BIN on port $PORT"
exec "$APP_BIN" \
  -Dhttp.port="$PORT" \
  -Dhttp.address="0.0.0.0" \
  -Dplay.http.secret.key="$APPLICATION_SECRET"
