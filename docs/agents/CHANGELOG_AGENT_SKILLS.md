# Журнал изменений agent skills

## 2026-08-20 — адаптация starter pack v1.0

- **Изменение:** starter pack v1.0 адаптирован под AI Collector как Layer 3 — проектные role-skills поверх существующих process-, product- и craft-слоёв.
- **Размещение:** Placement B — role-skills размещаются в общем каталоге `skills/<role>/SKILL.md`, а governance и шаблоны — в `docs/agents/`.
- **Оркестрация:** `team-orchestrator` опционален и включается только при неясном Owner или задаче на две и более зоны; обычные одно-зонные задачи продолжают текущий routing.
- **Причина:** добавить явные ownership, work contract, handoff и final gate, не создавая вторую параллельную систему инструкций.
- **Источник:** архив starter pack `ai_agent_team_starter_pack` v1.0, распакованный путь `/tmp/ai_agent_team_starter_pack/ai_agent_team_starter/`; исходные шаблоны — `13_templates/`.
- **Результат этой записи:** governance-документы и четыре адаптированных шаблона созданы; role-skills и изменения bootstrap/routing выполняются отдельными задачами.
- **Валидация:** presence check для `docs/agents/*.md` и `docs/agents/templates/*.md`; полный `verify:skills` ожидаемо остаётся красным до создания role-skills и атомарного обновления routing/allowlist.
