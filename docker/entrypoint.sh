#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

if [[ -z "${APPLICATION_SECRET:-}" ]]; then
  echo "ERROR: APPLICATION_SECRET is not set."
  exit 1
fi

APP_BIN="/app/stage/bin/soccercardclashweb-backend"
if [[ ! -f "$APP_BIN" ]]; then
  echo "ERROR: $APP_BIN not found. Contents of /app/stage/bin:"
  ls -la /app/stage/bin || true
  exit 1
fi

chmod +x "$APP_BIN" || true

echo "Starting Play app: $APP_BIN on port $PORT"
exec "$APP_BIN" \
  -Dplay.server.http.port="$PORT" \
  -Dplay.server.http.address="0.0.0.0" \
  -Dplay.http.secret.key="$APPLICATION_SECRET"
