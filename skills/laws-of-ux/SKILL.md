---
name: laws-of-ux
description: Apply the 10 Laws of UX from Jon Yablonski's book to design reviews, UI critiques, frontend development, wireframing, and product decisions. Triggers on any UX review, design critique, UI feedback, component design, layout decisions, accessibility checks, form design, navigation design, onboarding flows, pricing page design, checkout flows, or when the user asks to apply psychological principles to their interface. Also triggers when the user mentions any specific law by name (Jakob's Law, Fitts's Law, Miller's Law, Hick's Law, Postel's Law, Peak-End Rule, Aesthetic-Usability Effect, Von Restorff Effect, Tesler's Law, Doherty Threshold). Do NOT use for pure backend architecture with no user-facing component.
---

# Laws of UX

Apply cognitive and behavioral psychology to design decisions. Based on Jon Yablonski's "Laws of UX" (2nd ed., O'Reilly 2024) -- 10 laws grounded in decades of research that explain how humans perceive, process, and interact with interfaces.

These are guidelines, not rigid rules. They do not replace user research. They explain *why* people behave a certain way in general.

## Quick-reference: The 10 Laws

```
LAW                        CORE PRINCIPLE                           WHEN IT MATTERS MOST
─────────────────────────  ───────────────────────────────────────  ─────────────────────────────────
Jakob's Law                Users expect your site to work like      Redesigns, new products,
                           the other sites they already know        nav/layout decisions

Fitts's Law                Time to hit a target = f(distance,      Touch targets, buttons, mobile
                           size). Bigger + closer = faster          layouts, spatial UI

Miller's Law               Working memory holds ~4 chunks.          Content structure, info density,
                           Organize info into groups.               long forms, dashboards

Hick's Law                 Decision time increases with the         Menus, onboarding, settings,
                           number and complexity of choices          CTAs, feature discovery

Postel's Law               Accept variable input from humans,       Forms, error handling, i18n,
                           produce reliable output                  responsive design, a11y

Peak-End Rule              People judge experiences by the          Onboarding, checkout, error
                           emotional peak and the ending            states, empty states, 404s

Aesthetic-Usability        Beautiful design is perceived as         Visual polish, first impressions,
Effect                     more usable (50ms visceral response)     landing pages, usability tests

Von Restorff Effect        The item that differs from the rest      CTAs, pricing tables, alerts,
                           is remembered                            notifications, key actions

Tesler's Law               Complexity is conserved -- it can        Feature scoping, progressive
                           only be moved, not eliminated            disclosure, AI/NLP interfaces

Doherty Threshold          Productivity soars when response         Loading states, animations,
                           time < 400ms                             skeleton screens, optimistic UI
```

## Diagnostic: Which Laws Apply?

When reviewing a design or building a UI, run this decision tree:

```
START: What are you designing or reviewing?
│
├─ Navigation / Information Architecture?
│  ├─ Users confused by structure? ──────────── Jakob's Law (mental models)
│  ├─ Too many menu items? ──────────────────── Hick's Law (reduce choices)
│  └─ Content hard to scan? ─────────────────── Miller's Law (chunk it)
│
├─ Interactive Elements (buttons, forms, targets)?
│  ├─ Touch targets too small/close? ────────── Fitts's Law (size + spacing)
│  ├─ Form validation too strict? ───────────── Postel's Law (accept variable input)
│  ├─ Too many form fields? ─────────────────── Hick's Law + Postel's Law
│  └─ CTA doesn't stand out? ───────────────── Von Restorff Effect (isolate it)
│
├─ Loading / Performance / Feedback?
│  ├─ Slow response, no feedback? ───────────── Doherty Threshold (< 400ms)
│  ├─ Users abandoning mid-flow? ────────────── Peak-End Rule (fix the ending)
│  └─ Complex feature, steep learning curve? ── Tesler's Law (absorb complexity)
│
├─ Visual Design / Layout?
│  ├─ Everything looks the same? ────────────── Von Restorff (create contrast)
│  ├─ Looks "off" but works fine? ───────────── Aesthetic-Usability Effect
│  ├─ Wall of text, no hierarchy? ───────────── Miller's Law (chunk + group)
│  └─ Too minimal, users lost? ──────────────── Hick's Law (oversimplification warning)
│
├─ Redesign / Major Changes?
│  ├─ Users complaining after launch? ──────── Jakob's Law (mental model mismatch)
│  ├─ How to roll out safely? ──────────────── Jakob's Law (gradual opt-in)
│  └─ What to preserve vs. change? ─────────── Jakob's Law + user research
│
└─ Ethical Review?
   ├─ Infinite scroll / autoplay? ──────────── Ethics: infinite loops
   ├─ Dark patterns suspected? ─────────────── Ethics: dark patterns audit
   ├─ Addictive notification patterns? ─────── Ethics: variable rewards
   └─ Default settings favor business? ─────── Ethics: defaults manipulation
```

## Design Audit Checklist

Use when reviewing any interface. Score each applicable item.

```
CATEGORY          CHECK                                                    LAW
────────────────  ───────────────────────────────────────────────────────  ──────────────
Mental Models     [ ] Uses familiar patterns users already know            Jakob's
                  [ ] Navigation in expected locations                     Jakob's
                  [ ] Changes introduced gradually with opt-out            Jakob's

Touch Targets     [ ] Min 44x44 CSS px / 48x48 dp (mobile)               Fitts's
                  [ ] Min 8dp spacing between targets                     Fitts's
                  [ ] Primary actions in easy-reach zones                 Fitts's
                  [ ] Labels expand input hit areas (HTML for)            Fitts's

Content           [ ] Info chunked into visual groups                     Miller's
                  [ ] Clear hierarchy (headings, whitespace, dividers)    Miller's
                  [ ] No "wall of text" -- scannable layout               Miller's

Choices           [ ] Unnecessary options eliminated                      Hick's
                  [ ] Progressive disclosure for advanced features        Hick's
                  [ ] Icons have text labels (especially nav)             Hick's
                  [ ] Recommended option highlighted                      Hick's

Input Handling    [ ] Forms accept variable formats (names, phones)       Postel's
                  [ ] Error messages are humane, not accusatory           Postel's
                  [ ] Responsive across all screen sizes                  Postel's
                  [ ] Works with assistive technology                     Postel's

Experience        [ ] Positive ending to key flows                        Peak-End
                  [ ] Negative peaks mitigated (error prevention)         Peak-End
                  [ ] Celebratory moments at milestones                   Peak-End

Visual Quality    [ ] Polished aesthetic (50ms first impression)          Aesthetic
                  [ ] Consistent visual language                          Aesthetic
                  [ ] Beauty not masking usability issues in tests        Aesthetic

Emphasis          [ ] Primary CTA visually distinct                       Von Restorff
                  [ ] Contrast not overused (avoid banner blindness)      Von Restorff
                  [ ] Color contrast >= 4.5:1 (WCAG text)                Von Restorff
                  [ ] Not relying on color alone for meaning              Von Restorff

Complexity        [ ] System absorbs complexity, not the user             Tesler's
                  [ ] Not oversimplified to point of abstraction          Tesler's
                  [ ] Contextual help available (tooltips, guides)        Tesler's

Performance       [ ] Feedback within 400ms of user action                Doherty
                  [ ] Skeleton screens or progress indicators for waits   Doherty
                  [ ] Optimistic UI where appropriate                     Doherty

Ethics            [ ] No dark patterns (forced actions, trick questions)  Ethics
                  [ ] Defaults serve user interests                       Ethics
                  [ ] Friction exists where it protects users             Ethics
                  [ ] No infinite loops exploiting variable rewards       Ethics
```

## Applying Laws to Code

When writing frontend code, embed these laws directly:

### Touch Targets (Fitts's Law)
```css
/* Minimum touch targets */
.btn, .link, [role="button"] {
  min-height: 44px;    /* WCAG / Apple HIG */
  min-width: 44px;
  padding: 12px 16px;  /* generous padding */
}

/* Spacing between adjacent targets */
.action-group > * + * {
  margin-left: 8px;    /* Google Material minimum */
}

/* Expand form label hit area */
label { cursor: pointer; }  /* + use htmlFor */
```

### Chunking Content (Miller's Law)
```
BEFORE (wall of text):            AFTER (chunked):
┌──────────────────────────┐      ┌──────────────────────────┐
│ text text text text text │      │ ▎Section A               │
│ text text text text text │      │ │ grouped content        │
│ text text text text text │      │ │ related items          │
│ text text text text text │      │                          │
│ text text text text text │      │ ▎Section B               │
│ text text text text text │      │ │ grouped content        │
│ text text text text text │      │ │ related items          │
│ text text text text text │      │                          │
│ text text text text text │      │ ▎Section C               │
│ text text text text text │      │ │ grouped content        │
└──────────────────────────┘      └──────────────────────────┘
```

### Progressive Disclosure (Hick's Law + Tesler's Law)
```
LEVEL 1 (default view):          LEVEL 2 (expanded):
┌──────────────────────────┐      ┌──────────────────────────┐
│  Essential Action A      │      │  Essential Action A       │
│  Essential Action B      │      │  Essential Action B       │
│  [▼ More options]        │      │  [▲ Fewer options]        │
│                          │      │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
└──────────────────────────┘      │  Advanced Option C        │
                                  │  Advanced Option D        │
                                  │  Advanced Option E        │
                                  └──────────────────────────┘
```

### Response Time Thresholds (Doherty Threshold)
```
TIME          PERCEPTION              DESIGN RESPONSE
─────────     ─────────────────────   ──────────────────────────────────
< 100ms       Feels instant           No feedback needed
100-300ms     Delay perceptible       Subtle transition/animation
300ms-1s      Noticeable wait         Show spinner or loading indicator
1-10s         Attention wanders       Progress bar + description
> 10s         User may leave          Time estimate + allow background
```

### Von Restorff in Pricing Tables
```
┌─────────────┐  ┌─────────────────┐  ┌─────────────┐
│   Basic      │  │ ★ RECOMMENDED ★ │  │   Premium    │
│              │  │                 │  │              │
│   $9/mo      │  │    $19/mo       │  │   $49/mo     │
│              │  │                 │  │              │
│  Feature A   │  │  Feature A      │  │  Feature A   │
│  Feature B   │  │  Feature B      │  │  Feature B   │
│              │  │  Feature C      │  │  Feature C   │
│              │  │  Feature D      │  │  Feature D   │
│              │  │                 │  │  Feature E   │
│  [ Start ]   │  │  [■ GET PLUS ■] │  │  [ Start ]   │
│              │  │                 │  │              │
└─────────────┘  └─────────────────┘  └─────────────┘
                  ↑ Larger card
                  ↑ Contrasting CTA color
                  ↑ Badge/label ("Recommended")
                  ↑ Center position (Von Restorff + Fitts's)
```

## The Interconnection Map

The 10 laws form a web, not a list. Here's how they connect:

```
                    ┌─────────────────────────────────────┐
                    │         COGNITIVE LOAD               │
                    │   (the shared constraint beneath     │
                    │        all 10 laws)                   │
                    └──────────┬──────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐    ┌───────▼──────┐    ┌────────▼─────┐
   │ ORGANIZE    │    │ SIMPLIFY     │    │ RESPOND      │
   │             │    │              │    │              │
   │ Miller's    │    │ Hick's Law   │    │ Doherty      │
   │ (chunk)     │    │ (reduce)     │    │ Threshold    │
   │             │    │              │    │ (< 400ms)    │
   │ Jakob's     │    │ Tesler's     │    │              │
   │ (familiar)  │    │ (transfer    │    │ Peak-End     │
   │             │    │  complexity) │    │ (memory      │
   │ Von Restorff│    │              │    │  snapshots)  │
   │ (emphasize) │    │ Postel's     │    │              │
   │             │    │ (be flexible)│    │ Aesthetic-    │
   └─────────────┘    └──────────────┘    │ Usability    │
                                          │ (50ms judge) │
                                          └──────────────┘

   ──── Fitts's Law (motor behavior) cuts across all three ────
   ──── Ethics layer constrains all applications ──────────────
```

## Key Thresholds and Numbers

```
NUMBER        WHAT                                    SOURCE
───────────   ─────────────────────────────────────   ──────────────
44 x 44 px    Min touch target (WCAG/Apple)           Fitts's Law
48 x 48 dp    Min touch target (Google Material)      Fitts's Law
60 x 60 pt    Min touch target (spatial/visionOS)     Fitts's Law
8 dp          Min spacing between targets              Fitts's Law
16-20 mm      Average adult fingertip diameter         MIT Touch Lab
~4 chunks     Practical working memory limit           Cowan (2001)
4.5:1         WCAG color contrast ratio (normal text)  Von Restorff / a11y
3:1           WCAG color contrast ratio (large text)   Von Restorff / a11y
50 ms         Time to form first visual impression     Aesthetic-Usability
400 ms        Doherty Threshold for productivity       Doherty Threshold
1 s           Attention starts wandering               Miller (1968)
10 s          Limit of focused attention while waiting Miller (1968)
300%          Max text expansion (English → Italian)   Postel's Law / i18n
37%           Facebook defaults matched expectations   Ethics chapter
18 min        Avg Netflix time to choose (pre-fix)     Hick's Law
```

## Resources

For deep reference on any specific law, read:
- `references/laws-complete-reference.md` -- All 10 laws with origins, experiments, examples, guidelines
- `references/diagnostic-flowcharts.md` -- Expanded decision trees and audit flows
- `references/ethics-and-dark-patterns.md` -- Behavior shaping, dark patterns, ethical design
- `references/research-techniques.md` -- User personas, contextual inquiry, card sorting, journey mapping, usability testing, eye tracking
