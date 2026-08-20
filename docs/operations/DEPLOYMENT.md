# Production deployment

## Architecture

```text
Browser
  ↓ :80 / :443
Caddy (TLS via Let's Encrypt when DOMAIN is a real hostname)
  ├── /*            → frontend (nginx static: landing/login/register/prototype)
  └── /auth|/tenants|/campaigns|/health*|/support → backend (Fastify :3000)
                ↓
         PostgreSQL 16  (volume postgres_data)
         Redis 7        (volume redis_data; reserved for future queues)
```

This repository is a **monorepo**: Fastify API + static cabinet HTML.
Marketing site on GitHub Pages (`public/`) is separate and optional.
Private lead-relay repo (`ai-collector-back`) is not required to run the product stack.

---

## Local Development

```bash
cp -n .env.example .env
docker compose -f docker-compose.dev.yml up -d
npm ci
npm run db:generate
npm run db:migrate    # or npm run db:push for throwaway local schemas
npm run dev           # API :3000
npm run dev:ui        # cabinet gateway :8080 (proxies API, injects API origin)
```

Checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

---

## Environment Variables

See [`.env.example`](../../.env.example).

Production **required**:

| Variable | Notes |
|----------|--------|
| `DOMAIN` | Public hostname, e.g. `cabinet.example.com` |
| `ACME_EMAIL` | Let's Encrypt contact |
| `POSTGRES_PASSWORD` | Strong random password |
| `JWT_SECRET` | ≥32 chars, unique (reserved for future token signing) |
| `CREDENTIALS_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `CORS_ORIGINS` | Public origin, e.g. `https://cabinet.example.com` |

Recommended:

| Variable | Example |
|----------|---------|
| `POSTGRES_USER` | `ai_collector` |
| `POSTGRES_DB` | `ai_collector` |
| `LIVE_CALLS_ENABLED` | `false` until legal/DPA gates pass |

Never commit `.env`.

---

## Server Requirements

- Ubuntu 22.04/24.04 VPS
- 2 vCPU / 2–4 GB RAM minimum for MVP
- Docker Engine + Docker Compose plugin
- DNS A/AAAA record for `DOMAIN` → server IP
- Ports 80 and 443 open

---

## First Deployment (clean Ubuntu VPS)

### 1. Deploy user + SSH

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Disable password auth only after key login works (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).

### 2. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
# re-login as deploy
```

### 4. Clone + configure

```bash
sudo mkdir -p /opt/ai-collector
sudo chown deploy:deploy /opt/ai-collector
cd /opt/ai-collector
git clone https://github.com/IvanLushnikov/ai-collector.git .
cp .env.example .env
chmod 600 .env
```

Edit `.env` (example):

```bash
DOMAIN=cabinet.example.com
ACME_EMAIL=admin@example.com
POSTGRES_USER=ai_collector
POSTGRES_PASSWORD='(openssl rand -base64 32)'
POSTGRES_DB=ai_collector
JWT_SECRET='(openssl rand -base64 48)'
CREDENTIALS_ENCRYPTION_KEY='(openssl rand -hex 32)'
CORS_ORIGINS=https://cabinet.example.com
NODE_ENV=production
LIVE_CALLS_ENABLED=false
```

### 5. DNS

Point `cabinet.example.com` A/AAAA records to the VPS. Wait for propagation.

### 6. Deploy

```bash
cd /opt/ai-collector
./scripts/deploy.sh
```

This builds images, starts Postgres/Redis, runs migrations, starts backend/frontend/proxy, and checks `/health/ready`.

### 7. Verify

```bash
curl -fsS https://cabinet.example.com/health/live
curl -fsS https://cabinet.example.com/health/ready
curl -fsSI https://cabinet.example.com/landing.html
docker compose ps
docker compose logs -f --tail=100 backend
```

Open `https://cabinet.example.com/register.html` and create an organization.

---

## Updating Production

```bash
cd /opt/ai-collector
git fetch origin
git pull --ff-only origin main
./scripts/deploy.sh
```

Images are tagged with the short git SHA (`IMAGE_TAG`). Previous tags remain on the host until pruned.

---

## Database Migrations

```bash
docker compose run --rm migrate
# or via deploy.sh (runs automatically)
```

Mechanism:

1. `prisma db push` against `src/db/prisma/schema.prisma`
2. **Without** `--accept-data-loss` — refuses automatic destructive resets

Hand-written SQL under `src/db/migrations/` is a historical archive and is **not** replayed in production (early UUID vs later TEXT id drift).

---

## Logs

```bash
docker compose logs -f --tail=200
docker compose logs -f backend
docker compose logs -f proxy
```

Backend uses Fastify JSON logs (stdout). Sensitive fields are masked via logging helpers.

---

## Healthchecks

| Path | Meaning |
|------|---------|
| `GET /health` / `/health/live` / `/healthz` | Process up |
| `GET /health/ready` | Database reachable |

Compose marks `backend` healthy only when `/health/ready` succeeds.

---

## Backup

```bash
./scripts/backup-db.sh
# files in ./backups/*.sql.gz — copy off-server daily
```

Suggested cron (as `deploy`):

```cron
15 2 * * * cd /opt/ai-collector && ./scripts/backup-db.sh && rsync -az backups/ backup-host:/var/backups/ai-collector/
```

Retention default: 14 days (`BACKUP_RETENTION_DAYS`).

---

## Rollback

If a new deploy misbehaves and the previous image tag is still local:

```bash
docker images 'ai-collector-*'
IMAGE_TAG=<previous-sha> ./scripts/rollback.sh
```

If images were pruned, check out the previous git revision and run `./scripts/deploy.sh`.

Database roll-forward migrations are not auto-reverted — restore from `backups/` if a schema change must be undone:

```bash
gunzip -c backups/ai_collector_YYYYMMDD.sql.gz | docker compose exec -T postgres psql -U ai_collector -d ai_collector
```

---

## Monitoring baseline

Without a heavy observability stack:

1. `docker compose ps` — restart loops
2. `curl /health/ready` — API + DB
3. `docker compose logs` — application errors
4. `df -h` — disk (Postgres + backups)
5. Optional: Uptime Kuma / external HTTP check on `/health/ready`

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| 502 from Caddy | `docker compose logs backend`; `/health/ready` |
| TLS fails | DNS, ports 80/443, `ACME_EMAIL`, `DOMAIN` |
| Login cookie missing | HTTPS required in production (`Secure` cookies); `CORS_ORIGINS` must match public origin |
| Migrate fails | `docker compose logs migrate`; inspect destructive schema diffs manually |
| Disk full | prune old images `docker image prune`; rotate backups |

---

## Security notes

- Postgres and Redis ports are **not** published on the host in production compose
- Only Caddy exposes 80/443
- Production rejects wildcard CORS and default `JWT_SECRET`
- Header-based auth (`X-User-Role`) is disabled when `NODE_ENV=production`
- CSRF Origin checks apply to cookie sessions in production
