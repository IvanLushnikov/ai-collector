# Object storage (Lab)

Контракт хранения записей и расшифровок звонков.

## Порт

`src/storage/object-store.ts`: `put` / `get`.

- `put({ tenantId, kind: recording|transcript, bytes, contentType })` → `{ url }`
- `get(url)` → объект или `null`
- Ключ всегда с префиксом tenant. Вендор (S3/Lockbox) в этой задаче не выбирается.

## Fake

`src/storage/fake-object-store.ts` пишет `sandbox://{kind}/{tenantId}/{hint}` в память. Сети нет, AWS SDK нет.

Live-провайдер позже подменит fake тем же портом.
