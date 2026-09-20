# Placement Portal — Production Deployment Guide (Vercel + Neon/Supabase)

> Target shape: **Next.js App Router** frontend + API on **Vercel**, **PostgreSQL**
> on **Neon** or **Supabase**, Prisma as the ORM. This guide covers environment
> configuration, build pipeline scripts, serverless connection pooling, and a
> go-live checklist. (The architecture overview lives in `docs/ARCHITECTURE.md`.)

---

## Table of Contents

1. [Environment Configuration (`.env.example`)](#1-environment-configuration)
2. [Prisma Production Build Scripts](#2-prisma-production-build-scripts)
3. [Connection Pooling for Serverless](#3-connection-pooling-for-serverless)
4. [Step-by-Step Deployment](#4-step-by-step-deployment)
5. [Go-Live Checklist](#5-go-live-checklist)
6. [Post-Deploy Verification](#6-post-deploy-verification)

---

## 1. Environment Configuration

> ⚠️ The Freebuff sandbox manages secrets through its Keys/API keys UI and blocks
> `.env` file writes, so the template lives here. **Copy the block below into a
> `.env.example` file in your Next.js repo root** and fill values in Vercel →
> Project → Settings → Environment Variables — never commit a filled `.env`.

```bash
# ─────────────────────────────────────────────────────────────────────────────
# Placement Portal — Production Environment Template (.env.example)
# ─────────────────────────────────────────────────────────────────────────────

# ─── Database (Neon / Supabase PostgreSQL) ───────────────────────────────────
# Runtime connection — goes through the connection pooler (Neon pooler /
# Supabase PgBouncer, port 6543). connection_limit=1 is CRITICAL for
# serverless: each serverless function instance gets exactly one connection.
DATABASE_URL="postgresql://user:password@ep-cool-name-pooler.region.aws.neon.tech/placement_db?sslmode=require&pgbouncer=true&connect_timeout=15&connection_limit=1"

# Migration connection — DIRECT (bypasses the pooler; Prisma migrate needs
# it). Neon: the non-pooler endpoint. Supabase: port 5432 session URI.
DIRECT_URL="postgresql://user:password@ep-cool-name.region.aws.neon.tech/placement_db?sslmode=require"

# ─── Auth ────────────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="generate-a-32-byte-random-base64-secret"
# Canonical deployment URL — no trailing slash:
NEXTAUTH_URL="https://placement-portal.vercel.app"

# ─── Email transport (Resend — interview invites, status notifications) ─────
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="Placement Portal <no-reply@yourdomain.edu.in>"

# ─── Runtime ─────────────────────────────────────────────────────────────────
# Vercel sets NODE_ENV=production automatically; declare only for local use.
NODE_ENV="production"
```

**Vercel variable scoping:** add `DATABASE_URL`, `DIRECT_URL`,
`NEXTAUTH_SECRET`, `RESEND_API_KEY` to **Production + Preview**; `NEXTAUTH_URL`
differs per environment (set the Preview value to your `*.vercel.app` preview
URL). Generate a *distinct* `NEXTAUTH_SECRET` per environment.

---

## 2. Prisma Production Build Scripts

Add the following to `package.json` of the Next.js deployment repo. Vercel runs
`npm run build` (or `bun run build`) for every deployment, so the database
schema is migrated **as part of the build** — no manual SSH migrations.

```jsonc
// package.json (Next.js deployment repo)
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",

    // Database lifecycle
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",

    // Quality gates (run before pushing to the deploy branch)
    "test": "vitest run",
    "test:e2e": "playwright test",
    "typecheck": "tsc -b --noEmit"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

**Why each stage of the build command:**

| Stage | Purpose | Failure mode if omitted |
|---|---|---|
| `prisma generate` | Regenerates the typed client from `schema.prisma` inside the Vercel build container (node_modules isn't reused) | `@prisma/client did not initialize yet` at build time |
| `prisma migrate deploy` | Applies all pending migrations **in order, non-interactively** — safe for production | Schema drift → runtime SQL errors on new queries |
| `next build` | Compiles/optimizes the app with the fresh client | — |

**Notes:**
- `migrate deploy` never runs destructive resets or prompts — that's why it's
  build-safe. Interactive `migrate dev` is local-only.
- If Vercel's build caches `node_modules/.prisma`, add
  `"postinstall": "prisma generate"` as a belt-and-braces hook.
- The **live sandbox build stays untouched**: the Vite/Convex `build` script in
  this repo is separate; the scripts above belong to the Next.js deployment repo.

---

## 3. Connection Pooling for Serverless

### The problem

Vercel serverless functions scale to **N concurrent instances under load**.
Each instance creates its own Prisma Client → its own PostgreSQL connection.
With the default pool (up to `num_cpus * 2 + 1` connections per instance),
a traffic spike (results day) exhausts Neon/Supabase's connection cap and every
request starts failing with `Too many database connections` — connection
exhaustion.

### The fix — three layers

**Layer 1 — External pooler (transport):** route every runtime connection
through Neon's pooler endpoint or Supabase's PgBouncer (port 6543, transaction
mode). The pooler multiplexes thousands of logical connections over a handful
of physical ones.

**Layer 2 — Per-instance limit (Prisma URL):** `connection_limit=1` in
`DATABASE_URL` caps each function instance at exactly one connection.
100 concurrent instances → 100 pooled logical connections, which the pooler
absorbs easily.

**Layer 3 — Singleton client (application):** never instantiate Prisma Client
per request/module reload. Hot-reload and serverless route isolation would
multiply clients. Use the standard singleton:

```ts
// src/lib/prisma.ts — serverless-safe Prisma singleton
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Optional explicit tuning — the URL params usually suffice:
    // datasources: { db: { url: process.env.DATABASE_URL } },
    log: process.env.NODE_ENV === "development" ? ["query", "warn"] : ["warn"],
  });

// Persist across hot-reloads (dev) and route-instance reuse (prod)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Recommended URL parameters (already in the `.env.example`):**

| Param | Value | Why |
|---|---|---|
| `pgbouncer=true` | required | Tells Prisma to use transaction-mode-compatible behavior (no prepared-statement reuse) |
| `connection_limit` | `1` | One connection per serverless instance |
| `connect_timeout` | `15` | Fail fast instead of piling up on a saturated pooler |
| `sslmode=require` | required | Both Neon and Supabase enforce TLS |

**Neon autosuspend note:** cold starts wake the database (~500ms). If p95
latency matters on read-heavy public pages, enable Neon's "Compute from 0 →
always-on" or add a Vercel cron ping during placement week.

### Architectural equivalence in this codebase

The live sandbox runs on Convex, which removes the class of problem entirely —
functions execute against the Convex backend's managed connection fabric, so
there is no per-instance Prisma client at all. The singleton pattern above is
the direct equivalent for the Prisma/Vercel shape. The Prisma concurrency
trade-offs (hot-reload singletons, transactional slot booking) are documented
in `docs/ARCHITECTURE.md` §Tech Stack Rationale.

---

## 4. Step-by-Step Deployment

1. **Create the database**
   - Neon: create project → copy **pooled** and **direct** connection strings.
   - Supabase: create project → Settings → Database → copy **Connection pooling**
     (6543) and **Direct** (5432) URIs; set the DB password somewhere safe.
2. **Run the baseline migration locally** against the direct URL:
   `npx prisma migrate dev --name init` (creates `prisma/migrations/`).
3. **Seed** reference/demo data if desired: `npx prisma db seed`.
4. **Push the repo to GitHub** (Prisma schema, migrations folder, seed script included).
5. **Vercel → New Project → import the repo** → framework auto-detects Next.js.
6. **Environment variables:** add everything from §1 (Production + Preview scopes).
7. **Deploy.** The build runs `prisma generate && prisma migrate deploy && next build`
   — watch the build log for the migration steps completing.
8. **Set `NEXTAUTH_URL`** to the final production domain (or add the custom domain
   first, then update the variable and redeploy).
9. **Resend:** verify your sending domain, then confirm `RESEND_FROM_EMAIL`
   matches a verified identity.

---

## 5. Go-Live Checklist

- [ ] `NEXTAUTH_SECRET` is a fresh 32-byte random value (not the example string)
- [ ] `NEXTAUTH_URL` matches the exact production origin (scheme included, no trailing slash)
- [ ] `DATABASE_URL` uses the **pooler** host/port; `DIRECT_URL` uses the direct one
- [ ] `connection_limit=1` and `pgbouncer=true` present in the runtime URL
- [ ] `prisma/migrations/` committed; build log shows `migrate deploy` applying cleanly
- [ ] Sign-in works on the deployed domain (cookies require HTTPS + correct URL)
- [ ] Role-guard redirects verified on production (student deep-linking `/tpo/*` bounces)
- [ ] 1-click apply + TPO stage change round-trip against the production DB
- [ ] Interview slot booking generates a Meet link and dispatches an email via Resend
- [ ] Reports PDF/CSV export works from the deployed origin (browser print pipeline)
- [ ] Error boundaries and 404 render on production (try an invalid drive ID)
- [ ] `bun run test` (60/60) and `bun run test:e2e` green pre-deploy

---

## 6. Post-Deploy Verification

```bash
# 1. Schema parity — no drift between migrations and the live database:
npx prisma migrate status

# 2. Smoke the production API surface (should return 200/401, never 500):
curl -s -o /dev/null -w "%{http_code}\n" https://placement-portal.vercel.app/api/health

# 3. Load sanity on the pooler — run a burst of applies from a test script
#    and watch Neon/Supabase connection count stay flat (pooler absorbing).

# 4. Monitor: Vercel Analytics (function duration/errors) + Neon/Supabase
#    connection metrics. Alert on: connection count near cap, 5xx spike,
#    migration failure on deploy.
```

**Rollback plan:** Vercel → Deployments → previous build → **Promote to
Production** (instant). Migrations are forward-only; for a schema-level rollback,
`prisma migrate resolve --rolled-back <migration>` plus a corrective forward
migration — never hand-edit production tables.
