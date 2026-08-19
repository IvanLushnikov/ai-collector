# ИИ-коллектор Маркетинговый Лендинг Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить корневой `index.html` на рабочий статический B2B-лендинг “ИИ-коллектор” с sticky CTA “Назначить демо” и модалкой формы без бэкенда.

**Architecture:** Один статический HTML-файл. В нём встроены inline-стили (CSS variables + enterprise-палитра) и небольшой inline-JS для: открытия модалки из всех CTA, имитации отправки формы и отображения success-сообщения, а также поведения FAQ. Все секции — в одном документе.

**Tech Stack:** HTML5 + inline CSS (CSS variables) + inline JS (без внешних библиотек).

**Spec:** `docs/superpowers/specs/2026-08-19-ii-collector-marketing-landing-prototype-design.md`

## Global Constraints
- Не трогать `prototype.html`, правки только в `index.html`.
- CTA везде с одинаковым текстом: “Назначить демо”.
- Sticky CTA: “dock” внизу экрана; не перекрывает контент (должен быть предусмотрен отступ снизу равный высоте sticky).
- Модалка “Назначить демо” без бэкенда: поля `Имя`, `Компания`, `Email`, `Телефон` + кнопка “Отправить”; после клика показать “Спасибо, мы свяжемся с вами в ближайшее время.”
- Визуальный стиль: enterprise/B2B, спокойная сетка, аккуратная типографика; запрещены AI-градиенты/glow/glassmorphism как основа; без Lorem ipsum.
- Русский текст естественный; “передача специалисту / требует проверки”, “проверка ограничений / ограничения”.

---

## Task Structure

### Task 1: Каркас лендинга + CSS tokens + базовые компоненты

**Files:**
- Modify: `/Users/ivanlusnikov/ai-collector/index.html`

**Interfaces:**
- Consumes: требования из spec.
- Produces: отрисовываемый каркас страницы со всеми обязательными секциями (структурно) и готовыми стилями для кнопок/контейнера/типографики.

- [ ] **Step 1: Проверить текущую страницу**
  - Manual check: открыть текущий `index.html` в браузере и убедиться, что это не маркетинговый лендинг.

- [ ] **Step 2: Вставить новый HTML-скелет**
  - В `index.html` заменить содержимое `<body>` на единый документ с:
    - `header` (бренд + навигационные якоря + кнопка CTA в hero-верхней зоне),
    - `main` с секциями в следующем порядке:
      1. Hero
      2. Как это работает
      3. Почему нам можно доверять
      4. Преимущества
      5. Кому подходит
      6. FAQ
      7. Финальный CTA
    - `footer` минимальный (если нужно) без дополнительных CTA.
  - В `header` и в hero предусмотреть кнопки CTA (markup-тег должен иметь единый селектор, например `data-cta="demo"`).

  **Минимальный пример селекторов для CTA (для JS wiring на следующих задачах):**
  ```html
  <button class="btn btn-primary" data-cta="demo" type="button">Назначить демо</button>
  ```

- [ ] **Step 3: Добавить CSS variables и базовые стили**
  - В `<style>` внутри `<head>` определить `:root` с токенами (цвета/spacing/typography).
  - Сделать компоненты: `btn`, контейнер `container`, базовые стили для `section`, заголовков и абзацев.
  - Предусмотреть enterprise-плотность: умеренные размеры шрифтов, аккуратные `gap`.

  **Минимальный пример token-структуры (реализация должна использовать эти имена):**
  ```css
  :root{
    --bg:#f6f8fb;
    --surface:#ffffff;
    --ink:#111827;
    --muted:#5b6777;
    --line:#d8e0ea;
    --accent:#1b66d1;
    --accent-2:#0f4faa;
    --shadow:0 10px 30px rgba(17,24,39,.06);
    --radius:14px;
    --container:1100px;
    --space-1:8px;
    --space-2:12px;
    --space-3:18px;
    --space-4:26px;
    --space-5:40px;
  }
  ```

- [ ] **Step 4: Проверить верстку (без sticky и модалки)**
  - Manual check: все обязательные секции видимы и читаемы, тексты соответствуют spec (без placeholder’ов).

- [ ] **Step 5: Commit**
  ```bash
  git add index.html
  git commit -m "feat: landing scaffold for ИИ-коллектор"
  ```

### Task 2: Sticky CTA (не перекрывает контент) + адаптация под mobile

**Files:**
- Modify: `/Users/ivanlusnikov/ai-collector/index.html`

**Interfaces:**
- Consumes: наличие sticky-слота в DOM или возможность его добавить.
- Produces: фиксированная CTA-кнопка снизу экрана с корректным offset на mobile и desktop.

- [ ] **Step 1: Подтвердить, что sticky CTA отсутствует**
  - Manual check: убедиться, что кнопки только в секциях/hero.

- [ ] **Step 2: Добавить sticky CTA markup**
  - Добавить контейнер в конец body (до модалки или после — но с понятным z-index):
  ```html
  <div class="sticky-cta" aria-hidden="false">
    <button class="btn btn-primary sticky-btn" data-cta="demo" type="button">Назначить демо</button>
  </div>
  ```

- [ ] **Step 3: Реализовать “не перекрывает контент”**
  - Задать CSS переменную высоты sticky:
    - `--sticky-cta-height` (например 64px desktop, 72px mobile).
  - Добавить `padding-bottom: var(--sticky-cta-height)` к `body` или основному контейнеру `main`.

  **Минимальный пример CSS логики:**
  ```css
  :root{ --sticky-cta-height:72px; }
  body{ padding-bottom:var(--sticky-cta-height); }
  .sticky-cta{
    position:fixed; left:0; right:0; bottom:0;
    height:var(--sticky-cta-height);
    display:flex; align-items:center; justify-content:center;
    background:rgba(246,248,251,.92);
    backdrop-filter: none;
    border-top:1px solid var(--line);
    z-index:50;
  }
  .sticky-btn{ width: min(560px, calc(100% - 24px)); }
  ```

- [ ] **Step 4: Responsive проверки**
  - Manual check:
    - mobile: кнопка не перекрывает последний блок (за счёт padding-bottom),
    - desktop: кнопка визуально не доминирует и не мешает.

- [ ] **Step 5: Commit**
  ```bash
  git add index.html
  git commit -m "feat: add sticky CTA for Назначить демо"
  ```

### Task 3: Модалка “Назначить демо” + локальная имитация отправки

**Files:**
- Modify: `/Users/ivanlusnikov/ai-collector/index.html`

**Interfaces:**
- Consumes: CTA-кнопки с `data-cta="demo"`.
- Produces: модальное окно, открывающееся по клику, закрывающееся по Esc/overlay, поля валидируются (минимально) и показывается success-сообщение.

- [ ] **Step 1: Подтвердить текущий клик не открывает форму**
  - Manual check: нажать любые “Назначить демо” — убедиться, что пока ничего не происходит (стадия до JS).

- [ ] **Step 2: Добавить разметку модалки**
  - Добавить в `body`:
  ```html
  <div class="modal-overlay" id="demoModalOverlay" hidden>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="demoModalTitle">
      <button type="button" class="modal-close" aria-label="Закрыть" id="demoModalCloseBtn">×</button>
      <h2 id="demoModalTitle">Назначить демо</h2>
      <p class="modal-subtitle">Оставьте контакты — мы свяжемся, чтобы показать управляемый сценарий.</p>

      <form id="demoForm" class="modal-form">
        <label>
          <span>Имя</span>
          <input name="name" type="text" autocomplete="name" required />
        </label>
        <label>
          <span>Компания</span>
          <input name="company" type="text" autocomplete="organization" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autocomplete="email" required />
        </label>
        <label>
          <span>Телефон</span>
          <input name="phone" type="tel" autocomplete="tel" required />
        </label>

        <button type="submit" class="btn btn-primary">Отправить</button>
        <div class="form-success" id="demoSuccess" hidden>Спасибо, мы свяжемся с вами в ближайшее время.</div>
      </form>
    </div>
  </div>
  ```

- [ ] **Step 3: Реализовать JS открытие/закрытие модалки + wiring CTA**
  - Добавить inline JS в конец файла:
  - Логика:
    - найти все `[data-cta="demo"]` и повесить click → открыть модалку;
    - открыть: убрать `hidden`, запомнить `document.activeElement`, фокус на первый input;
    - закрыть: вернуть фокус на origin element, прятать overlay;
    - закрытие по `Esc`;
    - закрытие по клику на overlay (если клик не внутри modal).

  **Минимальный JS-скелет (без placeholders):**
  ```js
  const overlay = document.getElementById('demoModalOverlay');
  const form = document.getElementById('demoForm');
  const closeBtn = document.getElementById('demoModalCloseBtn');
  const success = document.getElementById('demoSuccess');
  let lastActive = null;

  function openModal(){
    lastActive = document.activeElement;
    overlay.hidden = false;
    success.hidden = true;
    form.reset();
    const firstInput = form.querySelector('input');
    firstInput && firstInput.focus();
  }

  function closeModal(){
    overlay.hidden = true;
    if (lastActive && typeof lastActive.focus === 'function') lastActive.focus();
  }

  document.querySelectorAll('[data-cta="demo"]').forEach(btn=>{
    btn.addEventListener('click', ()=>openModal());
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e)=>{
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && overlay && !overlay.hidden) closeModal();
  });
  ```

- [ ] **Step 4: Реализовать обработчик submit без бэкенда**
  - На `submit`:
    - `e.preventDefault()`
    - показать success-сообщение
    - отключить кнопку отправки или показать “Отправка…” (опционально, без дополнительных текстов если проще).

  **Минимальный обработчик:**
  ```js
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    success.hidden = false;
  });
  ```

- [ ] **Step 5: Компоновать модалку поверх sticky**
  - CSS: `z-index` модалки выше `z-index` sticky (например sticky 50, modal 80).

- [ ] **Step 6: Commit**
  ```bash
  git add index.html
  git commit -m "feat: demo modal form with local success state"
  ```

### Task 4: FAQ accordion (доступность + единый UX)

**Files:**
- Modify: `/Users/ivanlusnikov/ai-collector/index.html`

**Interfaces:**
- Consumes: разметку FAQ блока.
- Produces: раскрывающиеся ответы, работоспособные на mobile и доступные с клавиатуры.

- [ ] **Step 1: Проверить наличие FAQ без поведения**
  - Manual check: на текущей версии FAQ ответы не раскрываются/не читаются.

- [ ] **Step 2: Реализовать accordion через `<details><summary>`**
  - В HTML FAQ секции использовать:
  ```html
  <details>
    <summary>Что будет на демо “ИИ-коллектора”?</summary>
    <p>...</p>
  </details>
  ```

- [ ] **Step 3: Проверить доступность**
  - Manual check:
    - Tab до summary,
    - Enter/Space раскрывает,
    - текст читаемый на mobile.

- [ ] **Step 4: Commit**
  ```bash
  git add index.html
  git commit -m "feat: FAQ accordion"
  ```

### Task 5: Финальная полировка, responsive и ручная верификация “готово”

**Files:**
- Modify: `/Users/ivanlusnikov/ai-collector/index.html`

**Interfaces:**
- Consumes: всё реализовано.
- Produces: страница соответствует критериям “готово” из spec.

- [ ] **Step 1: Проверка sticky не перекрывает контент**
  - Manual check: добраться до финального CTA — заголовок/текст видны, кнопка видна.

- [ ] **Step 2: Проверка всех CTA**
  - Manual check:
    - hero CTA открывает модалку,
    - CTA внутри секции открывает модалку,
    - sticky CTA открывает модалку,
    - финальный CTA открывает модалку.

- [ ] **Step 3: Проверка модалки**
  - Manual check:
    - заполнить форму и отправить: показывается success message,
    - Esc закрывает,
    - overlay-клик закрывает.

- [ ] **Step 4: Визуальная проверка стиля**
  - Manual check:
    - нет градиентов/glow/glass,
    - строгая иерархия,
    - нет “Lorem ipsum”.

- [ ] **Step 5: Commit**
  ```bash
  git add index.html
  git commit -m "chore: finalize marketing landing prototype styles and UX"
  ```

---

## Execution Handoff
Plan complete and saved to `docs/superpowers/plans/2026-08-19-ii-collector-marketing-landing-prototype-implementation-plan.md`. Two execution options:
1) Subagent-Driven (recommended) - dispatch a fresh subagent per task
2) Inline Execution - implement tasks in this session

Какой подход выбираешь?

