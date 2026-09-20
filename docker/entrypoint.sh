#!/bin/sh
# ─── Container entrypoint: wait for DB → migrate → seed → serve ─────────────
set -e

echo "⏳ Waiting for PostgreSQL to become healthy…"
until node -e "
  const net = require('net');
  const url = new URL(process.env.DATABASE_URL);
  const sock = net.connect(
    Number(url.port || 5432),
    url.hostname
  );
  sock.on('connect', () => process.exit(0));
  sock.on('error', () => process.exit(1));
  setTimeout(() => process.exit(1), 2000);
" 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL reachable."

echo "🚧 Applying migrations (prisma migrate deploy)…"
./node_modules/prisma/build/index.js migrate deploy
echo "✅ Schema up to date."

if [ "$SEED_ON_BOOT" != "false" ]; then
  echo "🌱 Seeding offline demo data (idempotent)…"
  ./node_modules/prisma/build/index.js db seed || echo "ℹ️  Seed skipped/failed — continuing (database may already be populated)."
fi

echo "🚀 Starting Placement Portal on http://localhost:3000"
exec node server.js
