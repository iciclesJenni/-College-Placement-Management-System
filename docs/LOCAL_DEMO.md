# Placement Portal — Offline Local Demo Guide

> Run the entire portal — database, app, seeded data — with **one command and zero
> internet** (after the one-time image build). Ideal for defense demos in labs with
> no connectivity.

---

## Prerequisites (install while you still have internet)

| Requirement | Version | Check |
|---|---|---|
| Docker Desktop / Engine | 24+ | `docker --version` |
| Docker Compose | v2 (bundled) | `docker compose version` |
| ~4 GB free RAM, ~3 GB disk | — | — |

Everything else (Node 20, PostgreSQL 16, Prisma engines, all npm dependencies) is
baked into the images — nothing is downloaded at demo time.

## One-Command Start

```bash
./run-demo.sh            # Linux / macOS
run-demo.bat             # Windows (double-click works too)
```

The script:
1. Builds the app image (cached after the first run — subsequent starts are seconds)
2. Starts **postgres** (waits for its health check) and **app** containers
3. Applies all Prisma migrations (`migrate deploy`) inside the container
4. Seeds the full demo dataset (`prisma/seed-local.ts`) — idempotent
5. Waits for `http://localhost:3000` to respond, opens your browser, and tails logs

**Flags:** `--reseed` (wipe volume + fresh data) · `--stop` (tear down, keep data) · `--no-seed` (skip seeding).

## What's inside the stack

| Container | Image | Purpose |
|---|---|---|
| `placement-postgres` | `postgres:16-alpine` | Database with `pg_isready` health check; data persists in the `placement_pgdata` volume across restarts |
| `placement-app` | built from `Dockerfile` | Multi-stage Next.js standalone build with Prisma engines + migrations bundled; entrypoint waits for DB → migrates → seeds → serves on `:3000` |

Both share an isolated `placement-net` bridge network; only ports **3000** (portal)
and **5432** (DB, for `prisma studio` debugging) are exposed.

## Seeded demo dataset (`prisma/seed-local.ts`)

Fully offline, deterministic (no randomness → identical every run):

- **26 students** across CSE / IT / ECE / MECH / CIVIL — CGPAs 6.8–9.4, backlog and
  verification variety, skills, resumes, GitHub/LinkedIn links
- **6 drives** across all tiers — Google Cloud ₹18, Amazon ₹22, ServiceNow ₹14.5
  (Super Dream) · Deloitte ₹7.6, TCS Digital ₹7.2 (Dream) · Accenture ₹5.5 (Core)
- **30+ applications** covering every stage: 3 offers (with the production
  offer→placed→drive-completed side-effects applied), live technical/HR interviews,
  assessments, shortlists, and rejections with feedback notes
- **5 interview slots** (booked + available) with generated Meet links
- **Analytics render non-zero immediately**: ~11.5% placement rate, a 3-band CTC
  distribution, and branch-wise rates for the TPO charts

Demo logins: `/auth` → 1-click **Student (Aditya Verma)**, **TPO (Dr. K. Srinivas Rao)**,
**Recruiter (Google Cloud)**.

## Manual control (when you don't want the script)

```bash
docker compose up -d --build                  # start everything
docker compose logs -f app                    # watch boot: migrate → seed → serve
docker compose exec app node_modules/prisma/build/index.js migrate deploy
docker compose exec app node_modules/prisma/build/index.js db seed
docker compose down                           # stop, keep data
docker compose down -v                        # stop + wipe the database volume
```

## Pre-demo rehearsal checklist

- [ ] `./run-demo.sh` completes to the banner (time it — cached boots land in ~30s)
- [ ] `/auth` 1-click logins swap roles correctly on `localhost:3000`
- [ ] TPO dashboard charts show the seeded placement % and CTC distribution
- [ ] Reboot the machine and re-run: volume persists, no re-seed surprises
- [ ] `--reseed` gives a clean dataset if the demo data gets mutated during rehearsal

## Troubleshooting

| Symptom | Fix |
|---|---|
| `port 3000/5432 already in use` | Stop the local service or change the host port mapping in `docker-compose.yml` (e.g. `"3001:3000"`). |
| App container restarts loop | `docker compose logs app` — almost always the DB wasn't healthy yet; the entrypoint retries, so `docker compose restart app` resolves it. |
| `db seed` errors on boot | Harmless on second runs (idempotent reset); check `SEED_ON_BOOT: "false"` in compose to silence. |
| First build is slow | One-time cost — `node_modules` and Prisma engines are cached in the image layers; all later builds are incremental. |
| Completely air-gapped machine | Build the images on a connected machine (`docker compose build` + `docker save`), transfer the tarballs, `docker load` on the target. |

> The live sandbox keeps running on Vite + Convex — this stack is the self-contained
> Postgres/Prisma deployment shape for offline demos and examiner machines.
