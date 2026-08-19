# AI Collector — публичный сайт

Публичный лендинг пилота. Публикуется через GitHub Pages из папки `public/`.

Сайт: https://ivanlushnikov.github.io/ai-collector/

Форма заявки не содержит секретов: браузер отправляет данные на Cloudflare Worker (`lead-relay`), который делает `repository_dispatch` в приватный репозиторий `IvanLushnikov/ai-collector-back`. Telegram-токены живут только в секретах приватного репозитория.

Инструкция: [docs/operations/github-pages-setup.md](./docs/operations/github-pages-setup.md)
