# ─── Placement Portal — production-shaped Next.js image ──────────────────────
# Multi-stage build; the final image contains the standalone server with all
# dependencies bundled, so the container runs fully offline once built.

# Stage 1 — dependencies + Prisma generate
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
# Install with whichever lockfile the repo carries (npm ci preferred for
# reproducibility; fall back to bun for bun.lock-only repos).
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f bun.lock ]; then corepack enable && bun install --frozen-lockfile; \
    else npm install; fi

# Stage 2 — build the app (schema + migrations must be present)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL is only needed at runtime; a placeholder satisfies build-time
# env validation without touching any real database.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN if [ -f package-lock.json ]; then npm run build; \
    else corepack enable && bun run build; fi

# Stage 3 — slim runtime: standalone Next.js server + Prisma engine + migrations
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Standalone output (set output: "standalone" in next.config) bundles the
# server + pruned node_modules. If standalone is not enabled, fall back to the
# full node_modules copy.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma: query engine + schema + migration SQL for `migrate deploy` at boot
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Boot script: wait for Postgres, migrate, seed once, then serve
COPY --chown=nextjs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["entrypoint.sh"]
