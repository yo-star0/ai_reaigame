# syntax=docker/dockerfile:1.7
FROM node:22.22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

# -------- deps stage: copy manifests and install --------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter=@ai-reaigame/api... --prod=false

# -------- builder stage: copy source and build --------
FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @ai-reaigame/api exec prisma generate \
 && pnpm --filter @ai-reaigame/api run build

# -------- runner stage: minimal runtime --------
FROM node:22.22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/shared ./packages/shared
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
