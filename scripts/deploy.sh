#!/usr/bin/env bash
# Deploy / update AI Collector on a single VPS (Docker Compose).
# Does not delete volumes or wipe the database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml)
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"
export IMAGE_TAG

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example and fill production secrets first." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set in .env}"
: "${JWT_SECRET:?JWT_SECRET must be set in .env}"
: "${CREDENTIALS_ENCRYPTION_KEY:?CREDENTIALS_ENCRYPTION_KEY must be set in .env}"
: "${CORS_ORIGINS:?CORS_ORIGINS must be set in .env}"
: "${DOMAIN:?DOMAIN must be set in .env}"

echo "==> Pulling base images / building app images (tag=${IMAGE_TAG})"
"${COMPOSE[@]}" pull postgres redis proxy || true
"${COMPOSE[@]}" build backend frontend

echo "==> Ensuring postgres/redis are up"
"${COMPOSE[@]}" up -d postgres redis

echo "==> Running database migrations"
"${COMPOSE[@]}" run --rm migrate

echo "==> Starting application stack"
"${COMPOSE[@]}" up -d backend frontend proxy

echo "==> Waiting for backend health"
attempts=0
until curl -fsS "http://127.0.0.1/health/ready" >/dev/null 2>&1 \
  || curl -fsSk "https://127.0.0.1/health/ready" >/dev/null 2>&1 \
  || "${COMPOSE[@]}" exec -T backend node -e "fetch('http://127.0.0.1:3000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  attempts=$((attempts + 1))
  if (( attempts > 40 )); then
    echo "Health check failed. Recent logs:" >&2
    "${COMPOSE[@]}" logs --tail=80 backend proxy || true
    exit 1
  fi
  sleep 3
done

echo "Deploy OK (IMAGE_TAG=${IMAGE_TAG})"
"${COMPOSE[@]}" ps
