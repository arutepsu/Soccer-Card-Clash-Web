#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

if [[ -z "${APPLICATION_SECRET:-}" ]]; then
  echo "ERROR: APPLICATION_SECRET is not set."
  exit 1
fi

BIN_DIR="/app/stage/bin"
if [[ ! -d "$BIN_DIR" ]]; then
  echo "ERROR: $BIN_DIR not found."
  ls -la /app/stage || true
  exit 1
fi

APP_BIN="$(find "$BIN_DIR" -maxdepth 1 -type f -not -name "*.bat" | head -n 1)"

if [[ -z "$APP_BIN" || ! -f "$APP_BIN" ]]; then
  echo "ERROR: No app binary found in $BIN_DIR. Contents:"
  ls -la "$BIN_DIR" || true
  exit 1
fi

chmod +x "$APP_BIN" || true

rm -f /app/stage/RUNNING_PID || true

echo "Starting Play app: $APP_BIN on port $PORT"
exec "$APP_BIN" \
  -Dconfig.resource=application-prod.conf \
  -Dplay.server.http.port="$PORT" \
  -Dplay.server.http.address="0.0.0.0" \
  -Dplay.http.secret.key="$APPLICATION_SECRET"

