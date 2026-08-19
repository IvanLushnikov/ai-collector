#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

if command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo pg_ctlcluster 16 main start >/dev/null 2>&1 || true
fi

if command -v pg_isready >/dev/null 2>&1 && pg_isready -h localhost >/dev/null 2>&1; then
  if ! PGPASSWORD=postgres psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='ai_collector'" | grep -q 1; then
    sudo -u postgres createdb ai_collector >/dev/null 2>&1 || true
  fi
  npm run db:migrate >/dev/null
fi

echo "cloud-dev-start: dependencies ready"
