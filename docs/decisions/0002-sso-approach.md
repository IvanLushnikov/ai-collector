# Decision: SSO approach for MVP Lab and enterprise migration

Дата обновления: 21.08.2026  
Статус: принято; Phase 1 выровнен с фактическим cookie-auth в коде

## Решение для Controlled Pilot / MVP Lab (Phase 1)

1. **Канонический auth SoT — cookie-сессия** (`Session` + `POST /auth/login|register`, `GET /auth/me`). Tenant и роль берутся из аутентифицированного контекста (`request.authContext` / `request.actor`), не из браузерных «прав».
2. **Header identity** (`X-Tenant-Id` / `X-User-Role`) — только thin compatibility layer для local/dev/test при `ALLOW_HEADER_IDENTITY=true`. В **production запрещён** (env validation fail-closed).
3. Полноценный SSO (OIDC/SAML) **не внедряем** до этапа после pilot readiness.
4. **Role SoT:** при наличии записи `TenantMembership` её `roleName` первичен; `User.role` / `Session.roleName` — legacy mirror / snapshot для bootstrap, не второй независимый authorizer. Zone checks идут через `authorizeZone` / `authorizeCanonicalRoles` в `src/server/authz`.

## Почему не внедряем полноценный SSO сейчас

1. Приоритет — стабильный sandbox dial, compliance, audit и кабинет для ограниченного пилота.
2. SAML/OIDC потребуют IdP, секретов и отдельного security/ops контура.
3. Cookie + CSRF Origin уже закрывают browser mutualation path для кабинета.

## План перехода на enterprise-auth

### Этап 1 (сейчас)

- Cookie session как SoT; header identity только вне production.
- Нормализация claims в `request.actor` (`tenantId`, `userId`, `canonicalRole`).
- Все значимые actions пишут audit trail с `userId` из контекста.

### Этап 2 (после pilot readiness)

- OIDC через корпоративный IdP:
  - frontend получает access token;
  - backend валидирует JWT и мапит tenant/roles на тот же `request.actor`;
  - cookie session либо заменяется, либо становится session-bridge — отдельный ADR.

### Этап 3 (enterprise hardening)

- SAML как альтернатива для крупных клиентов.
- Per-tenant IdP-конфигурация и аудит смены интеграционных настроек.

## Поведенческие требования

- Любой входной `actor` должен иметь tenant context до бизнес-действий.
- Tenant isolation зависит только от аутентифицированного контекста (mismatch → `TENANT_SCOPE_MISMATCH`).
- Важные действия пишут audit с `userId` из контекста.
- Не создавать параллельный authorizer вне `src/server/authz`.

## Что поменяется на будущем шаге

- Источник `userId`/`roles` смещается с cookie/session (и optional headers) на OIDC/SAML claims.
- Удаление `ALLOW_HEADER_IDENTITY` после миграции клиентов.
- При необходимости — отдельная миграция `User.roleId` → только membership.
