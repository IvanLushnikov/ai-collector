# Landing + Web Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить публичный лендинг, email/password регистрацию и вход, cookie-сессию и переход в существующий `prototype.html` без поломки header-based tenant/RBAC.

**Architecture:** Cookie `ac_session` хранит сырой session token; в БД — `Session.tokenHash`. `authContextMiddleware` при валидной сессии выставляет `request.tenantContext` (`source: 'auth'`), `request.userRole` и `request.authContext`. `tenantContextMiddleware` и `roleMiddleware` уважают уже выставленный контекст и оставляют headers как fallback. Статические HTML + `dev-gateway` проксируют `/auth/*`.

**Tech Stack:** Fastify 4, Prisma/PostgreSQL, argon2, Vitest, static HTML, `scripts/dev-gateway.mjs`.

## Global Constraints

- Не ломать существующие endpoints и header-based тесты.
- `/auth/*` не требуют `X-Tenant-Id`.
- Саморегистрация создаёт tenant + user с ролью `owner`.
- UI copy: русский, спокойный тон, валидация рядом с полями (`PRODUCT_LANGUAGE.md`).
- TDD: failing test first.
- Коммиты только если явно попросит человек.

---

### Task 1: Schema, password, session helpers

**Files:**
- Modify: `src/db/prisma/schema.prisma`
- Create: `src/auth/password.ts`, `src/auth/session-token.ts`, `src/auth/cookie.ts`
- Test: `tests/auth/password.test.ts`, `tests/auth/session-token.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(hash: string, plain: string): Promise<boolean>`, `createSessionToken(): { raw: string; tokenHash: string }`, `SESSION_COOKIE_NAME = 'ac_session'`, `parseCookieHeader(header: string | undefined, name: string): string | null`, `buildSessionCookie(raw: string, maxAgeSec: number): string`, `buildExpiredSessionCookie(): string`

- [ ] Write failing password/token tests, then implement argon2 + sha256 token helpers.
- [ ] Add `User.passwordHash String?`, `Session` model, relations on `User`/`Tenant`. Schema applied via `prisma generate` (project uses `prisma db push`, no migration folder).

---

### Task 2: Auth API

**Files:**
- Create: `src/routes/auth.ts`
- Modify: `src/server/app.ts`, `src/server/middleware/tenant-context.ts`
- Test: `tests/auth/register-login.api.test.ts`

**Produces:** `registerAuthRoutes(app, deps)`, endpoints POST register/login/logout, GET /auth/me.

In-memory store in tests (no live DB). Cookie via `Set-Cookie`. Duplicate email → `409 EMAIL_ALREADY_EXISTS`. Bad password → `401 INVALID_CREDENTIALS`. tenant middleware skips `/auth`.

---

### Task 3: authContextMiddleware + RBAC/tenant fallback

**Files:**
- Create: `src/server/middleware/auth-context.ts`
- Modify: `src/server/middleware/rbac.ts`, `src/server/middleware/tenant-context.ts`, `src/server/app.ts`
- Test: `tests/auth/auth-context.middleware.test.ts`

Valid cookie sets tenant/role; missing cookie keeps header mode. `POST /campaigns` with cookie and without headers succeeds.

---

### Task 4: Gateway + static pages

**Files:**
- Modify: `scripts/dev-gateway.mjs`
- Create: `landing.html`, `register.html`, `login.html`, `privacy.html`, `terms.html`
- Test: `tests/landing-auth-pages.test.ts`

`/` → `/landing.html`. Proxy `/auth`. Forms call `/auth/register` and `/auth/login` with `credentials: 'include'`, redirect to `/prototype.html`.

---

### Task 5: prototype.html integration

**Files:**
- Modify: `prototype.html`
- Test: `tests/prototype-wizard-create.test.ts`, `tests/prototype-auth-session.test.ts`

On load: `GET /auth/me`; if not authenticated → `/login.html`. Runtime `currentAuth` fills `workspace.dataset.tenantId` and `X-User-Role`. Logout button. Helper `apiHeaders()`.

---

### Task 6: Backlog + verification

- Update `TECH_BACKLOG_1SP.md` (new done item T-244).
- Run targeted vitest files, then broader related tests.
