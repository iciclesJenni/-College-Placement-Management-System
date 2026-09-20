#!/usr/bin/env bash
# ─── Placement Portal — one-command offline demo launcher (Linux/macOS) ──────
# Usage:   ./run-demo.sh          (first run builds the image; later runs boot fast)
#          ./run-demo.sh --reseed wipe and re-seed the demo dataset
#          ./run-demo.sh --stop   tear the stack down
set -e

cd "$(dirname "$0")"

BOLD='\033[1m'; PURPLE='\033[0;35m'; GOLD='\033[0;33m'; NC='\033[0m'
step() { echo -e "${PURPLE}${BOLD}▸ $1${NC}"; }
info() { echo -e "${GOLD}  $1${NC}"; }

command -v docker >/dev/null 2>&1 || {
  echo "❌ Docker is required but not installed. Get it from https://docs.docker.com/get-docker/"; exit 1;
}
docker info >/dev/null 2>&1 || {
  echo "❌ Docker daemon is not running. Start Docker Desktop / the daemon first."; exit 1;
}

case "$1" in
  --stop)
    step "Stopping the demo stack…"
    docker compose down
    info "Stopped. Data volume preserved — next run keeps your dataset."
    exit 0 ;;
  --reseed)
    step "Resetting the database volume…"
    docker compose down -v ;;
esac

step "Building the app image (skipped if cached)…"
docker compose build --quiet app

step "Starting PostgreSQL + app containers…"
docker compose up -d

step "Waiting for the database health check…"
for i in $(seq 1 30); do
  status=$(docker inspect --format '{{.State.Health.Status}}' placement-postgres 2>/dev/null || echo "starting")
  [ "$status" = "healthy" ] && break
  printf "."; sleep 1
done
echo ""
[ "$status" = "healthy" ] || { echo "❌ Postgres failed to become healthy — check: docker compose logs postgres"; exit 1; }
info "PostgreSQL healthy."

step "Running migrations + seed inside the app container…"
docker compose exec -T app node_modules/prisma/build/index.js migrate deploy
if [ "$1" != "--no-seed" ]; then
  docker compose exec -T app node_modules/prisma/build/index.js db seed \
    || info "Seed skipped — database already populated."
fi

step "Waiting for the web server…"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "302" ] && break
  printf "."; sleep 1
done
echo ""

echo -e "${GOLD}${BOLD}"
cat <<'BANNER'
  ─────────────────────────────────────────────────────────────
   ✅  Placement Portal demo is live (fully offline)

       Portal      →  http://localhost:3000
       Demo logins →  /auth  (1-click Student / TPO / Recruiter)
       PostgreSQL  →  localhost:5432  (placement / placement_demo)

       Stop later:        ./run-demo.sh --stop
       Fresh dataset:     ./run-demo.sh --reseed
  ─────────────────────────────────────────────────────────────
BANNER
echo -e "${NC}"

# Open the browser automatically where possible
( command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3000 ) \
  || ( command -v open >/dev/null 2>&1 && open http://localhost:3000 ) \
  || info "Open http://localhost:3000 in your browser."

step "Streaming logs (Ctrl+C to detach — the stack keeps running)…"
docker compose logs -f app
