# Ключевые screen patterns MVP

## 1. Список кампаний

Главный вопрос: `Что происходит с моими кампаниями и где требуется внимание?`

Минимум:

- title;
- create CTA;
- filters;
- table;
- status;
- volume/progress;
- risk indicator;
- key result;
- last activity.

Первый сортировочный приоритет может быть связан с риском/активностью, если это соответствует продукту.

## 2. Создание кампании

Главный вопрос: `Что нужно настроить, чтобы безопасно подготовить ограниченный запуск?`

Не показывай сразу production-level настройки.

Разделы:

- основные данные;
- база;
- сценарий;
- параметры звонка;
- controlled pilot limits;
- readiness.

## 3. Импорт

Главный вопрос: `Какие данные готовы, а какие помешают запуску?`

После upload пользователь должен получить quality report, а не просто success toast.

## 4. Readiness

Главный вопрос: `Почему эту кампанию можно или нельзя запускать?`

Используй checklist с группами:

- данные;
- настройки;
- интеграции;
- compliance;
- logging;
- handoff;
- permissions.

Каждый блокирующий пункт ведет к исправлению.

## 5. Controlled launch dialog/screen

Главный вопрос: `Что именно сейчас будет запущено и какие ограничения действуют?`

Покажи:

- campaign;
- scope;
- planned time;
- readiness summary;
- key constraints;
- stop/review behavior;
- destructive/irreversible consequences, если есть.

## 6. Мониторинг

Главный вопрос: `Можно ли кампании безопасно продолжать работу?`

Порядок:

1. Risk banner, если есть.
2. Campaign status + primary control.
3. Progress.
4. Operational health.
5. Business outcome.
6. Recent issues.
7. Calls/review tabs.

## 7. Decision detail

Главный вопрос: `Почему система разрешила/запретила действие?`

Структура:

- result;
- action;
- timestamp;
- reason summary;
- applied checks;
- related object;
- subsequent event;
- technical details collapsed.

## 8. Review queue

Главный вопрос: `Что требует человеческого решения сейчас?`

Поля:

- priority/severity;
- reason;
- campaign;
- debtor/call;
- created time;
- status;
- assignee, если существует;
- due date только если продукт ее задает.

## 9. Call detail

Главный вопрос: `Что произошло в этой попытке и почему?`

Верх:

- technical status;
- business outcome;
- compliance decision;
- risk/review.

Ниже:

- timeline;
- recording/transcript;
- QA;
- diagnostics.

## 10. Report

Главный вопрос: `Что доказал pilot и где остаются риски?`

Разделяй:

- объем и прогресс;
- outcomes;
- compliance/risk;
- handoff;
- quality;
- event completeness.

Не делай «красивый dashboard» основной целью отчета.
