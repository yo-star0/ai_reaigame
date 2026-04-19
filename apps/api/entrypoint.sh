#!/bin/sh
set -e

echo "[entrypoint] prisma db push (sync schema directly)"
npx --no-install prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate

echo "[entrypoint] seeding characters (idempotent upsert)"
npx --no-install tsx prisma/seed.ts || echo "[entrypoint] seed failed, continuing without blocking startup"

echo "[entrypoint] starting api"
exec node dist/main.js
