#!/bin/sh
set -e

echo "[entrypoint] prisma db push (sync schema directly)"
npx --no-install prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate

echo "[entrypoint] seeding characters (idempotent upsert)"
node -e "require('tsx/cjs').register(); require('./prisma/seed.ts');" || true

echo "[entrypoint] starting api"
exec node dist/main.js
