#!/usr/bin/env bash
set -eo pipefail

echo "==> Auditing client bundle for leaked secrets..."

STATIC_DIR=".next/static"

if [ ! -d "$STATIC_DIR" ]; then
  echo "Error: $STATIC_DIR does not exist. Run 'npm run build' first."
  exit 1
fi

SECRETS_PATTERN="(^|[^A-Za-z0-9_])(DATABASE_URL|SUPABASE_SERVICE_ROLE|DIRECT_URL|TURNSTILE_SECRET_KEY|UPSTASH_REDIS_REST_TOKEN|EVENT_HASH_SALT)([^A-Za-z0-9_]|$)"

if grep -rE "$SECRETS_PATTERN" "$STATIC_DIR" 2>/dev/null; then
  echo "[SECURITY ERROR]: Secret keywords leaked into client bundle!"
  exit 1
fi

echo "[SECURITY CHECK PASSED]: Clean client bundle: zero sensitive variables or connection strings found in $STATIC_DIR"

