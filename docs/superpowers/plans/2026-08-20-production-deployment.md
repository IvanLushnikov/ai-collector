# Production deployment readiness — implementation plan

## Goal

Make `ai-collector` clonable onto a fresh Ubuntu VPS and runnable via Docker Compose with HTTPS, healthchecks, migrations, logs, update/rollback — without breaking local `npm run dev` + `docker-compose.dev.yml`.

## Architecture (target)

```text
Browser
  ↓ :80/:443
Caddy (reverse proxy, TLS)
  ├── static HTML (frontend container)
  └── /auth|/tenants|/campaigns|/health*|/healthz|/support → backend:3000
                ↓
         PostgreSQL 16 (volume)
         Redis 7 (volume; reserved for queues)
```

Note: this monorepo contains both API and cabinet UI. Private `ai-collector-back` (lead-relay/Telegram) is out of scope for this environment.

## File map

| File | Responsibility |
|------|----------------|
| `src/server/app.ts` | trustProxy, `/health`, `/health/live`, `/health/ready` |
| `src/server/index.ts` | graceful shutdown |
| `src/server/middleware/*` | skip health on tenant/rate-limit |
| `src/config/env.ts` | TRUST_PROXY, stronger prod JWT_SECRET |
| `scripts/db-migrate.mjs` | ordered SQL migrate tracker |
| `Dockerfile` | multi-stage API image |
| `frontend/Dockerfile` + nginx | static product UI |
| `deploy/Caddyfile` | proxy + TLS |
| `docker-compose.yml` | production stack |
| `docker-compose.dev.yml` | local PG+Redis only |
| `scripts/deploy.sh`, `backup-db.sh`, `rollback.sh` | ops |
| `docs/operations/DEPLOYMENT.md` | server bootstrap + runbook |
| `.github/workflows/ci.yml` | add `build` |

## Constraints

- Do not change API contracts or business logic.
- No `db push --accept-data-loss` in production paths.
- No secrets in git.
- No Redis/workers as required runtime if not wired (Redis stays for future/local).
