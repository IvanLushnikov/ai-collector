# Журнал изменений agent skills

## 2026-08-20 — адаптация starter pack v1.0

- **Изменение:** starter pack v1.0 адаптирован под AI Collector как Layer 3 — проектные role-skills поверх существующих process-, product- и craft-слоёв.
- **Размещение:** Placement B — role-skills размещаются в общем каталоге `skills/<role>/SKILL.md`, а governance и шаблоны — в `docs/agents/`.
- **Оркестрация:** `team-orchestrator` опционален и включается только при неясном Owner или задаче на две и более зоны; обычные одно-зонные задачи продолжают текущий routing.
- **Причина:** добавить явные ownership, work contract, handoff и final gate, не создавая вторую параллельную систему инструкций.
- **Источник:** архив starter pack `ai_agent_team_starter_pack` v1.0, распакованный путь `/tmp/ai_agent_team_starter_pack/ai_agent_team_starter/`; исходные шаблоны — `13_templates/`.
- **Результат:** созданы governance-документы, четыре адаптированных шаблона и все 16 role-skills; Layer 3 routing добавлен в bootstrap-документы и каталог `skills/README.md`.
- **Валидация:** `npm run verify:skills` завершён успешно; presence, routing и allowlist согласованы с финальным набором Layer 3 ролей.
