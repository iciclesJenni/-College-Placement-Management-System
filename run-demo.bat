@echo off
REM ─── Placement Portal — one-command offline demo launcher (Windows) ──────────
REM Usage:   run-demo.bat            (first run builds the image; later runs boot fast)
REM          run-demo.bat --reseed   wipe and re-seed the demo dataset
REM          run-demo.bat --stop     tear the stack down
setlocal enabledelayedexpansion
cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo ❌ Docker is required but not installed. Get Docker Desktop: https://docs.docker.com/get-docker/
  exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
  echo ❌ Docker daemon is not running. Start Docker Desktop first.
  exit /b 1
)

if "%1"=="--stop" (
  echo ▸ Stopping the demo stack…
  docker compose down
  echo   Stopped. Data volume preserved — next run keeps your dataset.
  exit /b 0
)
if "%1"=="--reseed" (
  echo ▸ Resetting the database volume…
  docker compose down -v
)

echo ▸ Building the app image ^(skipped if cached^)…
docker compose build app

echo ▸ Starting PostgreSQL + app containers…
docker compose up -d

echo ▸ Waiting for the database health check…
set /a tries=0
:waitdb
docker inspect --format "{{.State.Health.Status}}" placement-postgres 2>nul | findstr healthy >nul
if errorlevel 1 (
  set /a tries+=1
  if !tries! lss 30 (
    <nul set /p ="." & timeout /t 1 /nobreak >nul
    goto waitdb
  )
  echo ❌ Postgres failed to become healthy — check: docker compose logs postgres
  exit /b 1
)
echo   PostgreSQL healthy.

echo ▸ Running migrations + seed inside the app container…
docker compose exec -T app node_modules/prisma/build/index.js migrate deploy
if not "%1"=="--no-seed" (
  docker compose exec -T app node_modules/prisma/build/index.js db seed
  if errorlevel 1 echo   Seed skipped — database already populated.
)

echo ▸ Waiting for the web server…
set /a tries=0
:waitweb
curl -s -o nul -w "%%{http_code}" http://localhost:3000 2>nul | findstr /r "200 307 302" >nul
if errorlevel 1 (
  set /a tries+=1
  if !tries! lss 30 (
    <nul set /p ="." & timeout /t 1 /nobreak >nul
    goto waitweb
  )
)
echo.

echo ─────────────────────────────────────────────────────────────
echo   ✅  Placement Portal demo is live ^(fully offline^)
echo.
echo       Portal      →  http://localhost:3000
echo       Demo logins →  /auth  ^(1-click Student / TPO / Recruiter^)
echo       PostgreSQL  →  localhost:5432  ^(placement / placement_demo^)
echo.
echo       Stop later:        run-demo.bat --stop
echo       Fresh dataset:     run-demo.bat --reseed
echo ─────────────────────────────────────────────────────────────

start "" http://localhost:3000

echo ▸ Streaming app logs ^(Ctrl+C to detach — the stack keeps running^)…
docker compose logs -f app
