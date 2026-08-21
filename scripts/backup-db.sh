#!/usr/bin/env bash
# PostgreSQL logical backup (MVP). Keeps local retention; copy off-server separately.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/ai_collector_${STAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

COMPOSE=(docker compose -f docker-compose.yml)
POSTGRES_USER="${POSTGRES_USER:-ai_collector}"
POSTGRES_DB="${POSTGRES_DB:-ai_collector}"

echo "==> Dumping ${POSTGRES_DB} → ${OUT}"
"${COMPOSE[@]}" exec -T postgres pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner --format=plain \
  | gzip -c > "${OUT}"

echo "==> Pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name 'ai_collector_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete || true

ls -lh "${OUT}"
echo "Copy this file off the server (scp/rsync/object storage)."
