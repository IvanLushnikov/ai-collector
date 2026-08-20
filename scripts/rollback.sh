#!/usr/bin/env bash
# Roll back application containers to a previously built image tag.
# Database volumes are never touched.
#
# Usage:
#   IMAGE_TAG=<previous-git-sha> ./scripts/rollback.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${IMAGE_TAG:-}" ]]; then
  echo "Usage: IMAGE_TAG=<previous-sha> $0" >&2
  echo "List local images: docker images 'ai-collector-*'" >&2
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.yml)
export IMAGE_TAG

echo "==> Rolling back to IMAGE_TAG=${IMAGE_TAG}"
"${COMPOSE[@]}" up -d backend frontend proxy

echo "==> Waiting for health"
attempts=0
until "${COMPOSE[@]}" exec -T backend node -e "fetch('http://127.0.0.1:3000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  attempts=$((attempts + 1))
  if (( attempts > 30 )); then
    echo "Rollback health check failed" >&2
    "${COMPOSE[@]}" logs --tail=80 backend || true
    exit 1
  fi
  sleep 3
done

echo "Rollback OK (IMAGE_TAG=${IMAGE_TAG})"
"${COMPOSE[@]}" ps
