#!/bin/sh
set -e

echo "[entrypoint] running prisma migrate deploy"
npx --no-install prisma migrate deploy --schema=./prisma/schema.prisma

echo "[entrypoint] seeding characters (idempotent upsert)"
node -e "require('tsx/cjs').register(); require('./prisma/seed.ts');" || true

echo "[entrypoint] starting api"
exec node dist/main.js
