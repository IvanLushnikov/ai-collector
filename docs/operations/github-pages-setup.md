# GitHub Pages + Telegram Leads: настройка

Публичный сайт (`public/`) публикуется через GitHub Pages.

**Publish SoT:** только содержимое `public/`. Корневые `index.html` / `login.html` / `register.html` / `landing.html` — **legacy/dev mirrors** (не Pages root); не править их «вместо» `public/` для деплоя сайта. Расхождение root↔`public/` для login/register/index — известный quarantine: канон для сайта всегда `public/`. Рабочий кабинет для локальной разработки — корневой `prototype.html`; перед Pages-релевантным изменением кабинета синхронизируйте `public/prototype.html`.

Заявки с лид-формы пересылаются в Telegram через relay + GitHub Actions — без хранения Telegram-токена в браузере или репозитории.

## Архитектура

```
Браузер (GitHub Pages)
  → POST JSON → Cloudflare Worker (lead-relay)
    → POST repository_dispatch → GitHub API
      → GitHub Actions workflow (lead-telegram.yml)
        → Telegram Bot API
```

---

## 1. Включить GitHub Pages

1. Откройте **Settings → Pages** в репозитории.
2. В разделе **Source** выберите **GitHub Actions** (не `Deploy from a branch`).
3. Сохраните. При следующем push в `main` (при наличии изменений в `public/`) workflow `.github/workflows/pages.yml` задеплоит сайт.

Сайт будет доступен по адресу:
```
https://ivanlushnikov.github.io/ai-collector/
```

---

## 2. Настроить Telegram-бот

1. Создайте бота через [@BotFather](https://t.me/BotFather) командой `/newbot`.
2. Скопируйте **Bot Token** (формат `1234567890:ABC-...`).
3. Добавьте бота в нужный чат/группу и дайте ему право отправлять сообщения.
4. Получите `TELEGRAM_CHAT_ID`:
   - для личного чата с ботом: отправьте боту любое сообщение и вызовите `https://api.telegram.org/bot<TOKEN>/getUpdates`, найдите `chat.id`;
   - для группы: добавьте бота, отправьте сообщение, вызовите тот же endpoint.

---

## 3. Добавить GitHub Secrets и Variables

В **Settings → Secrets and variables → Actions** репозитория:

### Secrets (конфиденциальные значения)

| Название               | Значение                                  |
|------------------------|-------------------------------------------|
| `TELEGRAM_BOT_TOKEN`   | Токен от @BotFather                       |
| `TELEGRAM_CHAT_ID`     | ID чата (число, может быть отрицательным) |

### Variables (незасекреченные, видимы в логах)

| Название          | Значение                                          |
|-------------------|---------------------------------------------------|
| `LEAD_RELAY_URL`  | URL задеплоенного Cloudflare Worker (см. шаг 4)  |

---

## 4. Задеплоить Cloudflare Worker (relay)

Relay-скрипт находится в `scripts/lead-relay/worker.js`.

### Предварительные требования
- аккаунт Cloudflare (бесплатный tier достаточен для лид-объёмов)
- Node.js и Wrangler: `npm install -g wrangler`

### Шаги

```bash
cd scripts/lead-relay

# Авторизация в Cloudflare
wrangler login

# Установить secrets (вводятся интерактивно)
wrangler secret put GITHUB_DISPATCH_TOKEN   # fine-grained PAT (см. ниже)
wrangler secret put GITHUB_OWNER            # IvanLushnikov
wrangler secret put GITHUB_REPO             # ai-collector
wrangler secret put ALLOWED_ORIGIN          # https://ivanlushnikov.github.io

# Деплой
wrangler deploy
```

После деплоя скопируйте URL Worker (например `https://lead-relay.<subdomain>.workers.dev`) и добавьте его в GitHub Variables как `LEAD_RELAY_URL`.

### Создать fine-grained PAT для dispatch

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. **Repository access**: только `ai-collector`.
3. **Permissions → Repository permissions → Contents**: `Read and write` (необходимо для `repository_dispatch`).
4. Скопируйте токен и добавьте в Cloudflare Worker секрет `GITHUB_DISPATCH_TOKEN`.

> Этот токен не даёт доступа к коду, только позволяет создавать dispatch-события.

---

## 5. Проверить работу

### Тест лид-формы

1. Откройте `https://ivanlushnikov.github.io/ai-collector/`.
2. Заполните форму и нажмите «Отправить заявку».
3. Убедитесь, что появился зелёный success-баннер.
4. В GitHub → **Actions** должен появиться запуск `Lead → Telegram`.
5. В Telegram-чате должно прийти сообщение с данными заявки.

### Ручной тест dispatch (без браузера)

```bash
curl -X POST \
  https://api.github.com/repos/IvanLushnikov/ai-collector/dispatches \
  -H "Authorization: Bearer <GITHUB_DISPATCH_TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{
    "event_type": "lead_submitted",
    "client_payload": {
      "organization": "Тестовая МФО",
      "name": "Иван Иванов",
      "email": "test@example.com",
      "role": "management",
      "segment": "mfo",
      "request": "Хотим обсудить пилот"
    }
  }'
```

---

## Безопасность

- **Telegram bot token** хранится только в GitHub Secrets, в браузер и в HTML не попадает.
- **GitHub PAT** хранится только в Cloudflare Worker secrets, в репозиторий не попадает.
- Relay проверяет `Origin` запроса — только разрешённый домен Pages.
- Honeypot-поле фильтрует простых ботов на уровне relay.
- `client_payload` Actions-логов не выводит ПДн (`run` печатает эскейпленный markdown, но не сырые данные).

---

## Структура новых файлов

```
public/                          # Публичный сайт (GitHub Pages)
  index.html                     # Лендинг с лид-формой
  privacy.html                   # Политика конфиденциальности (обновлена под лид-форму)
  terms.html                     # Условия использования

scripts/lead-relay/
  worker.js                      # Cloudflare Worker: relay браузер → GitHub dispatch
  wrangler.toml                  # Конфигурация деплоя

.github/workflows/
  pages.yml                      # Деплой GitHub Pages из public/
  lead-telegram.yml              # repository_dispatch → sendMessage в Telegram
```
