---
name: ui-ux-audit
description: "Mandatory audit-before-implement workflow for UI/UX changes in this repo. Read current cabinet/landing state first, check redundancy and compliance-first constraints, then propose gaps. Use before redesigns, layout changes, new screens, homepage/landing polish, or 'improve UI/UX' requests."
---

# UI/UX Audit (AI Collector)

Adapted from LobeHub `nicepkg-ai-workflow-ui-ux-audit` for this repository's static cabinet/landing layout.

## When to invoke

Before implementing UI/UX changes when the user mentions redesign, improve UI/UX, layout, homepage, landing, cabinet screens, visual polish, new sections, or interface cleanup.

**Order:**

1. This audit skill
2. `ru-ai-collector-product-design` for product surfaces
3. `russian-product-copy` for visible Russian text
4. Craft skills (`interface-design` / `frontend-design`) only after product rules
5. Implementation

## Critical rule

Read current state first. Do not invent parallel UI that duplicates existing flows.

## Step 1 — Read current state

Always inspect the relevant surfaces before recommendations:

```bash
# Operator cabinet (primary product UI)
Read: prototype.html

# Stakeholder / decision dashboard (internal)
Read: index.html

# Public landing (GitHub Pages)
Read: public/index.html
# and related public/* pages if present

# Terminology
Read: PRODUCT_LANGUAGE.md

# Product UX rules + review checklist
Read: skills/ru-ai-collector-product-design/SKILL.md
Read: skills/ru-ai-collector-product-design/references/review-checklist.md
```

Search for existing patterns before adding new ones:

- Grep for section ids, nav labels, status strings, modal titles
- Check whether the flow already exists under another name

## Step 2 — Audit checklist

### Redundancy

- [ ] Proposed UI already exists under another label or route
- [ ] New card/block duplicates an existing status strip or readiness block
- [ ] Extra CTA competes with the one primary action for the current campaign state

### Compliance-first product constraints

- [ ] Risk / stop / review remain more visible than vanity KPI
- [ ] Compliance decision is explained (outcome + reason), not hidden behind codes
- [ ] No UX that implies fully autonomous collection unless product scope says so
- [ ] Sandbox/demo affordances are not presented as production-ready

### Information architecture

- [ ] One job per section
- [ ] Status vocabulary matches `PRODUCT_LANGUAGE.md`
- [ ] Tables/forms keep operator next-action clear

### Visual clutter

- [ ] No decorative card grid that hides hierarchy
- [ ] No competing hero content on landing first viewport
- [ ] Density fits operator work, not marketing density, inside cabinet

## Step 3 — Report findings before coding

Present a short audit report:

1. **Current surfaces touched**
2. **What already covers the need**
3. **Genuine gaps**
4. **Recommended change (minimal)**
5. **Risks** (compliance, copy, a11y)

Wait for approval when the change is structural. Then implement only the approved gap.

## Anti-patterns for this repo

- Adding generic SaaS KPI card rows that outshine risk/readiness
- Introducing English-only UI labels in the operator cabinet
- Copying Next.js/app-router file assumptions from upstream marketplace skills
- Starting visual redesign before product flow audit

## Source

See [SOURCE.md](SOURCE.md).
