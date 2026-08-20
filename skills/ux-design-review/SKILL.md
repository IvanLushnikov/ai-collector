---
name: ux-design-review
description: "Structured UX/UI design review for AI Collector. Use when asked for design review, UX review, UI critique, walkthrough of a screen/flow, or pre-merge review of frontend/HTML prototype changes. Combines product checklist, heuristics, accessibility, and Russian copy checks."
---

# UX / Design Review (AI Collector)

Orchestrates a design review. Do not invent a parallel review process.

## When to invoke

- «сделай UX review», «design review», «проверь интерфейс», «критика экрана»
- Before merging non-trivial cabinet/landing UI changes
- After implementing a design wave when verification needs a structured pass

## Review stack (read in order)

1. `skills/ru-ai-collector-product-design/references/review-checklist.md` — product truth
2. `skills/russian-product-copy/SKILL.md` + `PRODUCT_LANGUAGE.md` — Russian UI language
3. `skills/laws-of-ux/SKILL.md` — heuristic lens (Jakob, Hick, Fitts, Peak-End, …)
4. `skills/accessibility/SKILL.md` — WCAG basics for HTML cabinet/landing
5. If the surface is marketing/landing craft: `skills/frontend-design/SKILL.md`
6. If the surface is SaaS cabinet/tools craft: `skills/interface-design/SKILL.md`

For code quality of the same change, also use Superpowers `requesting-code-review` — design review does not replace code review.

## Output format

Write findings as:

### Critical

Blocks pilot safety, compliance clarity, wrong status semantics, or inaccessible primary actions.

### Important

Hurts operator speed, hierarchy, terminology, or creates avoidable confusion.

### Minor

Polish, spacing, secondary copy, non-blocking a11y.

For each finding: **where** → **problem** → **fix** → **evidence** (file/section).

## Pass criteria

Review passes only if:

- Product checklist has no open Critical items
- User-visible Russian terms match `PRODUCT_LANGUAGE.md`
- Primary action matches campaign/state semantics
- Risk/review/stop remain distinguishable from ordinary KPI noise

## Do not

- Prioritize generic “beautiful dashboard” patterns over compliance-first UX
- Accept English operator labels “for now” in cabinet
- Treat heuristic violations as more important than incorrect legal/compliance framing
