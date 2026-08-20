# Laws of UX -- Diagnostic Flowcharts & Decision Trees

> Practical diagnostic tools for applying the Laws of UX at every level of
> design: components, pages, flows, redesigns, forms, mobile, performance,
> and visual emphasis. Use the flowcharts below as checklists and
> walkthroughs during design reviews, code reviews, and QA passes.

---

## 1. Component-Level Diagnostic

Use this when designing or reviewing a **single component**: button, form
field, card, modal, toggle, dropdown, tooltip, etc.

```
                    ┌─────────────────────────┐
                    │   START: Identify the    │
                    │   component under review │
                    └────────────┬────────────┘
                                 │
                                 ▼
              ┌──────────────────────────────────────┐
              │  Q1: Is it an interactive target?     │
              │  (button, link, input, toggle, etc.)  │
              └──────────┬───────────────┬───────────┘
                    YES  │               │  NO
                         ▼               ▼
         ┌───────────────────────┐  ┌───────────────────────────┐
         │  FITTS'S LAW CHECK    │  │  Skip to Q3               │
         │                       │  └─────────────┬─────────────┘
         │  - Min touch target:  │                │
         │    44x44 CSS px       │                │
         │    (48x48 on mobile)  │                │
         │  - Is target large    │                │
         │    enough relative    │                │
         │    to its distance    │                │
         │    from likely cursor │                │
         │    position?          │                │
         │  - Primary actions    │                │
         │    should be LARGER   │                │
         │    than secondary     │                │
         │  - Adequate spacing   │                │
         │    between adjacent   │                │
         │    targets? (min 8px) │                │
         └───────────┬──────────┘                │
                     │                            │
                     ▼                            │
         ┌───────────────────────┐                │
         │  Q2: Does tapping /   │                │
         │  clicking present     │                │
         │  CHOICES?             │                │
         └─────┬──────────┬─────┘                │
           YES │          │ NO                    │
               ▼          ▼                       │
  ┌─────────────────┐  ┌──────────────┐          │
  │  HICK'S LAW     │  │  Continue    │          │
  │  CHECK          │  │  to Q3       │          │
  │                 │  └──────┬───────┘          │
  │  - How many     │         │                   │
  │    options are  │         │                   │
  │    presented?   │         │                   │
  │  - > 4 items?   │         │                   │
  │    Consider     │         │                   │
  │    grouping or  │         │                   │
  │    progressive  │         │                   │
  │    disclosure   │         │                   │
  │  - > 7 items?   │         │                   │
  │    MUST group,  │         │                   │
  │    chunk, or    │         │                   │
  │    search/filter│         │                   │
  │  - Are choices  │         │                   │
  │    well-labeled │         │                   │
  │    and distinct?│         │                   │
  └────────┬────────┘         │                   │
           │                  │                   │
           ▼                  ▼                   ▼
         ┌──────────────────────────────────────────┐
         │  Q3: Does the component display           │
         │  information / data to the user?          │
         └──────────┬───────────────┬───────────────┘
                YES │               │ NO
                    ▼               ▼
     ┌────────────────────────┐  ┌──────────────────┐
     │  MILLER'S LAW CHECK    │  │  Continue to Q4   │
     │                        │  └────────┬─────────┘
     │  - Is content chunked  │           │
     │    into groups of      │           │
     │    5 +/- 2?            │           │
     │  - Are related items   │           │
     │    visually grouped?   │           │
     │    (Proximity)         │           │
     │  - Do groups have      │           │
     │    clear labels /      │           │
     │    headings?           │           │
     │  - Is cognitive load   │           │
     │    manageable at a     │           │
     │    glance?             │           │
     └───────────┬────────────┘           │
                 │                        │
                 ▼                        ▼
         ┌──────────────────────────────────────────┐
         │  Q4: Should this component STAND OUT      │
         │  from surrounding elements?               │
         └──────────┬───────────────┬───────────────┘
                YES │               │ NO
                    ▼               ▼
    ┌─────────────────────────┐  ┌──────────────────────┐
    │  VON RESTORFF EFFECT    │  │  AESTHETIC-USABILITY  │
    │  CHECK                  │  │  EFFECT CHECK         │
    │                         │  │                       │
    │  - Does it differ in    │  │  - Is the component   │
    │    color, size, shape,  │  │    visually polished?  │
    │    or motion from its   │  │  - Does it match the   │
    │    siblings?            │  │    design system?       │
    │  - Is it the ONLY       │  │  - Will users forgive  │
    │    distinctive element  │  │    minor usability      │
    │    on screen? (avoid    │  │    issues because it    │
    │    competing emphasis)  │  │    looks good?          │
    │  - Ensure distinction   │  │  - DANGER: Do not rely  │
    │    does NOT rely solely │  │    on aesthetics to     │
    │    on color (a11y)      │  │    mask real problems   │
    └────────────┬────────────┘  └──────────┬───────────┘
                 │                           │
                 ▼                           ▼
         ┌──────────────────────────────────────────┐
         │  Q5: Does this component relate to user   │
         │  expectations from OTHER products?        │
         └──────────┬───────────────┬───────────────┘
                YES │               │ NO / Unsure
                    ▼               ▼
    ┌─────────────────────────┐  ┌──────────────────────┐
    │  JAKOB'S LAW CHECK      │  │  DONE -- Component    │
    │                         │  │  passes diagnostic    │
    │  - Does the component   │  └──────────────────────┘
    │    behave the way users │
    │    expect based on      │
    │    similar products?    │
    │  - Standard patterns:   │
    │    hamburger = menu,    │
    │    heart = favorite,    │
    │    cart icon = shopping │
    │  - If deviating from    │
    │    convention, is there │
    │    a STRONG reason and  │
    │    clear affordance?    │
    └─────────────────────────┘
```

### Quick Reference Table -- Component Types

```
┌──────────────────┬──────────────────────────────────────────────────┐
│  Component       │  Primary Laws to Check                          │
├──────────────────┼──────────────────────────────────────────────────┤
│  Button / CTA    │  Fitts's Law, Von Restorff, Jakob's Law         │
│  Form Input      │  Fitts's Law, Postel's Law, Hick's Law          │
│  Dropdown/Select │  Hick's Law, Miller's Law, Fitts's Law          │
│  Card            │  Miller's Law, Aesthetic-Usability, Von Restorff │
│  Modal / Dialog  │  Hick's Law, Goal-Gradient, Fitts's Law         │
│  Navigation      │  Jakob's Law, Hick's Law, Miller's Law          │
│  Toggle / Switch │  Fitts's Law, Jakob's Law                       │
│  Tooltip         │  Fitts's Law (hover target), Tesler's Law       │
│  Progress Bar    │  Goal-Gradient Effect, Doherty Threshold        │
│  Data Table      │  Miller's Law, Hick's Law                       │
│  Search Bar      │  Fitts's Law, Postel's Law                      │
│  Icon            │  Jakob's Law, Von Restorff                      │
└──────────────────┴──────────────────────────────────────────────────┘
```

---

## 2. Page-Level Diagnostic

Use this when reviewing an **entire page or screen**: landing page, dashboard,
settings page, product listing, article page, etc.

```
                    ┌──────────────────────────┐
                    │  START: Identify the page │
                    │  and its primary purpose  │
                    └────────────┬─────────────┘
                                 │
                                 ▼
              ┌──────────────────────────────────────┐
              │  STEP 1: VISUAL HIERARCHY             │
              │  (Law of Common Region + Proximity)   │
              │                                       │
              │  Squint test: Can you identify the    │
              │  3 most important elements when the   │
              │  page is blurred?                     │
              └──────────┬───────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │ YES                 │ NO
              ▼                     ▼
   ┌──────────────────┐  ┌──────────────────────────┐
   │  Continue to      │  │  FIX: Adjust size,       │
   │  Step 2           │  │  weight, contrast,       │
   │                   │  │  whitespace to create     │
   └────────┬──────────┘  │  clear visual layers:     │
            │              │    1. Primary action/msg  │
            │              │    2. Supporting content  │
            │              │    3. Tertiary/chrome     │
            │              └──────────────────────────┘
            ▼
 ┌──────────────────────────────────────────────┐
 │  STEP 2: INFORMATION DENSITY                  │
 │  (Miller's Law)                               │
 │                                               │
 │  Count the number of distinct content groups  │
 │  visible above the fold.                      │
 └──────────┬────────────────────────────────────┘
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │  Groups above the fold:                       │
 │                                               │
 │  ┌─────────────┬──────────────────────────┐   │
 │  │  1-5 groups │  GOOD -- Manageable      │   │
 │  ├─────────────┼──────────────────────────┤   │
 │  │  6-9 groups │  CAUTION -- Verify each  │   │
 │  │             │  group is clearly bounded │   │
 │  ├─────────────┼──────────────────────────┤   │
 │  │  10+ groups │  DANGER -- Consolidate,  │   │
 │  │             │  collapse, or paginate   │   │
 │  └─────────────┴──────────────────────────┘   │
 └──────────┬────────────────────────────────────┘
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │  STEP 3: CTA PROMINENCE                      │
 │  (Von Restorff Effect)                        │
 │                                               │
 │  Identify the primary CTA on this page.       │
 │                                               │
 │  Does it pass all checks?                     │
 │  [ ] Visually distinct from ALL other elements│
 │  [ ] Only ONE primary CTA per viewport        │
 │  [ ] Contrast ratio >= 4.5:1 against bg      │
 │  [ ] Distinction uses MORE than color alone   │
 │  [ ] No competing visual "loudness" nearby    │
 │  [ ] Position follows F-pattern or Z-pattern  │
 │      reading flow                             │
 └──────────┬────────────────────────────────────┘
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │  STEP 4: NAVIGATION PLACEMENT                 │
 │  (Jakob's Law + Fitts's Law)                  │
 │                                               │
 │  ┌─────────────────────────────────────────┐  │
 │  │  Expected pattern:                      │  │
 │  │  ┌─────────────────────────────────┐    │  │
 │  │  │  LOGO   NAV-1  NAV-2  NAV-3  ☰ │    │  │
 │  │  ├─────────────────────────────────┤    │  │
 │  │  │                                 │    │  │
 │  │  │   [Primary Content Area]        │    │  │
 │  │  │                                 │    │  │
 │  │  │                                 │    │  │
 │  │  └─────────────────────────────────┘    │  │
 │  └─────────────────────────────────────────┘  │
 │                                               │
 │  Checks:                                      │
 │  [ ] Navigation is in a conventional location │
 │  [ ] User can reach nav from any scroll pos   │
 │  [ ] Key nav items are within the first 7     │
 │  [ ] Breadcrumbs provided for deep hierarchy  │
 └──────────┬────────────────────────────────────┘
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │  STEP 5: CONTENT GROUPING                     │
 │  (Gestalt: Proximity, Common Region,          │
 │   Similarity, Uniform Connectedness)          │
 │                                               │
 │  For each content section:                    │
 │  [ ] Related items are visually grouped       │
 │  [ ] Groups have clear boundaries (whitespace │
 │      OR borders OR background color)          │
 │  [ ] Similar items look similar (size, style) │
 │  [ ] Dissimilar items look different           │
 │  [ ] Connected elements share visual link     │
 │      (line, arrow, shared container)          │
 └──────────┬────────────────────────────────────┘
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │  STEP 6: COGNITIVE LOAD ASSESSMENT            │
 │  (Hick's Law)                                 │
 │                                               │
 │  Count user decisions required on this page:  │
 │                                               │
 │  ┌────────────────┬───────────────────────┐   │
 │  │  Decisions      │  Assessment           │   │
 │  ├────────────────┼───────────────────────┤   │
 │  │  0-1            │  FOCUSED -- Ideal for │   │
 │  │                 │  conversion pages     │   │
 │  ├────────────────┼───────────────────────┤   │
 │  │  2-3            │  MANAGEABLE -- OK for │   │
 │  │                 │  dashboards, hubs     │   │
 │  ├────────────────┼───────────────────────┤   │
 │  │  4-6            │  HEAVY -- Consider    │   │
 │  │                 │  progressive reveal   │   │
 │  ├────────────────┼───────────────────────┤   │
 │  │  7+             │  OVERLOADED -- Split  │   │
 │  │                 │  page or use wizard   │   │
 │  └────────────────┴───────────────────────┘   │
 └──────────┬────────────────────────────────────┘
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │  STEP 7: AESTHETIC-USABILITY CHECK            │
 │                                               │
 │  [ ] Page feels visually cohesive             │
 │  [ ] Consistent spacing rhythm                │
 │  [ ] Typography hierarchy is clear            │
 │  [ ] Color palette is constrained (2-3 hues)  │
 │  [ ] Aesthetic polish does NOT hide usability  │
 │      gaps (test with actual tasks)            │
 └──────────────────────────────────────────────┘
```

### Page Type Quick-Reference

```
┌──────────────────┬────────────────────────────────────────────────────┐
│  Page Type       │  Priority Laws                                     │
├──────────────────┼────────────────────────────────────────────────────┤
│  Landing Page    │  Von Restorff (CTA), Hick's (minimize choices),   │
│                  │  Aesthetic-Usability, Serial Position (hero + CTA) │
├──────────────────┼────────────────────────────────────────────────────┤
│  Dashboard       │  Miller's (chunking), Common Region (cards/panels),│
│                  │  Hick's (progressive disclosure)                   │
├──────────────────┼────────────────────────────────────────────────────┤
│  Product Listing │  Hick's (filters), Miller's (grid chunks),        │
│                  │  Von Restorff (featured items), Fitts's (cart btn) │
├──────────────────┼────────────────────────────────────────────────────┤
│  Settings        │  Tesler's (hide complexity), Miller's (categories),│
│                  │  Jakob's (standard toggle/input patterns)          │
├──────────────────┼────────────────────────────────────────────────────┤
│  Article / Blog  │  Serial Position (intro + conclusion emphasis),    │
│                  │  Miller's (section breaks), Aesthetic-Usability    │
├──────────────────┼────────────────────────────────────────────────────┤
│  Search Results  │  Hick's (filter facets), Miller's (10 results per │
│                  │  page), Jakob's (standard result layout)           │
└──────────────────┴────────────────────────────────────────────────────┘
```

---

## 3. Flow-Level Diagnostic

Use this when reviewing a **multi-step user flow**: onboarding, checkout,
signup, account creation, wizard, booking process, etc.

```
                    ┌────────────────────────────┐
                    │  START: Map the entire flow │
                    │  List every step/screen     │
                    └────────────┬───────────────┘
                                 │
                                 ▼
              ┌──────────────────────────────────────┐
              │  STEP 1: COUNT THE STEPS              │
              │  (Hick's Law + Goal-Gradient Effect)  │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  Total steps in the flow:             │
              │                                      │
              │  ┌───────────┬───────────────────┐   │
              │  │  1-3      │  LEAN -- Ideal    │   │
              │  ├───────────┼───────────────────┤   │
              │  │  4-6      │  ACCEPTABLE --    │   │
              │  │           │  Show progress    │   │
              │  ├───────────┼───────────────────┤   │
              │  │  7-10     │  HEAVY -- Can any │   │
              │  │           │  steps merge?     │   │
              │  ├───────────┼───────────────────┤   │
              │  │  11+      │  CRITICAL -- Must │   │
              │  │           │  redesign or split│   │
              │  │           │  into sub-flows   │   │
              │  └───────────┴───────────────────┘   │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  STEP 2: COMPLEXITY DISTRIBUTION      │
              │  (Tesler's Law)                       │
              │                                       │
              │  For each step, rate complexity 1-5:  │
              │                                       │
              │  Step 1: [___]                        │
              │  Step 2: [___]                        │
              │  Step 3: [___]                        │
              │  ...                                  │
              │                                       │
              │  Ideal Pattern:                       │
              │                                       │
              │    Complexity                         │
              │    5 │                                │
              │    4 │        ██                      │
              │    3 │     ██ ██ ██                   │
              │    2 │  ██ ██ ██ ██ ██               │
              │    1 │  ██ ██ ██ ██ ██ ██            │
              │      └───────────────────▶           │
              │       S1 S2 S3 S4 S5 S6  Steps      │
              │                                       │
              │  START simple, PEAK in middle,        │
              │  END simple. (Matches Peak-End Rule)  │
              │                                       │
              │  Anti-Pattern (front-loaded):         │
              │                                       │
              │    Complexity                         │
              │    5 │  ██                            │
              │    4 │  ██ ██                         │
              │    3 │  ██ ██ ██                      │
              │    2 │  ██ ██ ██ ██                   │
              │    1 │  ██ ██ ██ ██ ██ ██            │
              │      └───────────────────▶           │
              │       S1 S2 S3 S4 S5 S6              │
              │                                       │
              │  DANGER: Users abandon early if       │
              │  first steps are too demanding.       │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  STEP 3: PROGRESS INDICATION          │
              │  (Goal-Gradient Effect)               │
              │                                       │
              │  [ ] Progress bar or step indicator   │
              │      visible at all times?            │
              │  [ ] Shows current position AND       │
              │      total steps remaining?           │
              │  [ ] Consider "head start" technique: │
              │      start progress bar at 10-20%     │
              │      (e.g., "Step 1 of 5 -- 20%")    │
              │  [ ] Acceleration: do later steps     │
              │      feel faster or easier?           │
              │  [ ] Completion celebration exists?    │
              │      (confetti, checkmark, message)   │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  STEP 4: PEAK-END RULE AUDIT          │
              │                                       │
              │  Identify:                            │
              │  1. The PEAK moment (highest emotion, │
              │     either positive or negative)      │
              │  2. The END moment (final screen/step)│
              │                                       │
              │  ┌─────────────────────────────────┐  │
              │  │  Flow Emotional Map:            │  │
              │  │                                 │  │
              │  │  Positive │       *PEAK*        │  │
              │  │           │    *       *        │  │
              │  │           │  *           *END*  │  │
              │  │  Neutral  │*                    │  │
              │  │           │                     │  │
              │  │  Negative │                     │  │
              │  │           └─────────────────▶   │  │
              │  │            S1 S2 S3 S4 S5 S6   │  │
              │  └─────────────────────────────────┘  │
              │                                       │
              │  Questions:                           │
              │  [ ] Is the PEAK moment intentionally │
              │      designed to be positive?         │
              │  [ ] Is the END moment satisfying?    │
              │  [ ] Are negative peaks mitigated?    │
              │      (e.g., payment step softened     │
              │       with security reassurance)      │
              │  [ ] Does the flow end on a high note │
              │      (confirmation, thank you,        │
              │       next-steps guidance)?           │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  STEP 5: CHOICE ARCHITECTURE          │
              │  (Hick's Law per step)                │
              │                                       │
              │  For each step, count decisions:      │
              │                                       │
              │  ┌───────┬──────────┬─────────────┐  │
              │  │ Step  │ Choices  │ Assessment   │  │
              │  ├───────┼──────────┼─────────────┤  │
              │  │ S1    │  [  ]    │             │  │
              │  │ S2    │  [  ]    │             │  │
              │  │ S3    │  [  ]    │             │  │
              │  │ ...   │  [  ]    │             │  │
              │  └───────┴──────────┴─────────────┘  │
              │                                       │
              │  Target: 1-2 decisions per step.      │
              │  If any step has 4+, consider:        │
              │  - Splitting into sub-steps           │
              │  - Smart defaults                     │
              │  - Progressive disclosure             │
              │  - Removing non-essential fields      │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  STEP 6: BACK-TRACKING & ERROR        │
              │  RECOVERY                             │
              │  (Postel's Law + Tesler's Law)        │
              │                                       │
              │  [ ] Can user go back without losing  │
              │      entered data?                    │
              │  [ ] Can user save partial progress?  │
              │  [ ] Are errors shown inline and      │
              │      near the relevant field?         │
              │  [ ] Does the system accept flexible  │
              │      input formats? (phone, date)     │
              │  [ ] Is the "cost" of errors low?     │
              │      (undo available, not punitive)   │
              └──────────────────────────────────────┘
```

### Flow Pattern Templates

```
Onboarding Flow (Ideal Structure):
┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────────┐
│Welcome│──▶│ Easy  │──▶│ Core  │──▶│ Quick │──▶│ Success!  │
│ +Value│   │ Win   │   │ Setup │   │ Win   │   │ Dashboard │
│  Prop │   │(1 act)│   │(2-3   │   │(show  │   │  Tour     │
│       │   │       │   │fields)│   │result)│   │           │
└───────┘   └───────┘   └───────┘   └───────┘   └───────────┘
Complexity:  LOW         LOW         MED          LOW          LOW
Emotion:     Curious     Pleased     Focused      Delighted    Confident

Checkout Flow (Ideal Structure):
┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────────┐
│ Cart  │──▶│Shipping──▶│Payment│──▶│Review │──▶│Confirmation│
│Review │   │ Info  │   │ Info  │   │ Order │   │  + Track   │
└───────┘   └───────┘   └───────┘   └───────┘   └───────────┘
Complexity:  LOW         MED         MED          LOW          LOW
Emotion:     Excited     Neutral     Anxious      Reassured    Delighted
                                     ▲
                                     │
                              PEAK (negative) -- mitigate with:
                              - Security badges
                              - Money-back guarantee
                              - Saved payment option
```

---

## 4. Redesign Risk Assessment

Use this **before launching a redesign** to assess the risk of breaking
users' mental models. Grounded in **Jakob's Law**: users spend most of their
time on OTHER sites and bring those expectations to yours.

```
                    ┌──────────────────────────────┐
                    │  START: You are planning a    │
                    │  redesign. Assess the scope.  │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
              ┌──────────────────────────────────────┐
              │  Q1: What is being changed?           │
              │                                       │
              │  A) Visual refresh only (colors,      │
              │     typography, spacing, icons)        │
              │  B) Layout restructure (element       │
              │     positions, page structure)         │
              │  C) Navigation overhaul (menu         │
              │     structure, IA changes)             │
              │  D) Full redesign (all of the above   │
              │     + new interaction patterns)        │
              └──┬─────┬──────┬─────────┬────────────┘
                 A     B      C         D
                 │     │      │         │
                 ▼     ▼      ▼         ▼
              ┌─────┐┌─────┐┌─────┐ ┌──────┐
              │ LOW ││ MED ││HIGH │ │ VERY │
              │RISK ││RISK ││RISK │ │ HIGH │
              └──┬──┘└──┬──┘└──┬──┘ └──┬───┘
                 │      │      │       │
                 ▼      ▼      ▼       ▼
              ┌──────────────────────────────────────┐
              │  Q2: How established is your current  │
              │  user base?                           │
              │                                       │
              │  ┌─────────────────────────────────┐  │
              │  │ Users     │ Multiply risk by:   │  │
              │  ├───────────┼─────────────────────┤  │
              │  │ < 1,000   │ x0.5 (low inertia)  │  │
              │  │ 1K-100K   │ x1.0 (moderate)     │  │
              │  │ 100K-1M   │ x2.0 (significant)  │  │
              │  │ > 1M      │ x3.0 (massive)      │  │
              │  └───────────┴─────────────────────┘  │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  Q3: How much time do users spend     │
              │  in your product daily/weekly?        │
              │                                       │
              │  ┌─────────────────────────────────┐  │
              │  │ Usage          │ Risk modifier  │  │
              │  ├────────────────┼────────────────┤  │
              │  │ Occasional     │ x0.5           │  │
              │  │ (< 1x/week)   │ (low habit)    │  │
              │  ├────────────────┼────────────────┤  │
              │  │ Regular        │ x1.0           │  │
              │  │ (1-5x/week)   │ (moderate)     │  │
              │  ├────────────────┼────────────────┤  │
              │  │ Daily          │ x1.5           │  │
              │  │ (daily use)   │ (strong habit) │  │
              │  ├────────────────┼────────────────┤  │
              │  │ Power tool     │ x2.0           │  │
              │  │ (hours/day)   │ (deep muscle   │  │
              │  │               │  memory)        │  │
              │  └────────────────┴────────────────┘  │
              └──────────┬───────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────────────────┐
         │  CALCULATE RISK SCORE                          │
         │                                                │
         │  Risk = Base (A=1,B=2,C=3,D=4) x Users x Usage│
         │                                                │
         │  ┌───────────┬────────────────────────────┐    │
         │  │ Score     │ Rollout Strategy            │    │
         │  ├───────────┼────────────────────────────┤    │
         │  │ 0-2       │ BIG BANG -- Ship it.       │    │
         │  │           │ Low risk, just launch.     │    │
         │  ├───────────┼────────────────────────────┤    │
         │  │ 3-5       │ SOFT LAUNCH -- Beta opt-in │    │
         │  │           │ with easy rollback.        │    │
         │  ├───────────┼────────────────────────────┤    │
         │  │ 6-9       │ GRADUAL MIGRATION --       │    │
         │  │           │ A/B test, % rollout,       │    │
         │  │           │ offer "classic" mode.      │    │
         │  ├───────────┼────────────────────────────┤    │
         │  │ 10+       │ PHASED TRANSITION --       │    │
         │  │           │ Multi-month migration,     │    │
         │  │           │ parallel versions, guided  │    │
         │  │           │ tours, extensive user      │    │
         │  │           │ education campaign.        │    │
         │  └───────────┴────────────────────────────┘    │
         └──────────────┬────────────────────────────────┘
                        │
                        ▼
         ┌───────────────────────────────────────────────┐
         │  WHAT TO PRESERVE vs. WHAT TO CHANGE          │
         │                                                │
         │  ┌─────────────────────────────────────────┐   │
         │  │  ALWAYS PRESERVE    │  SAFE TO CHANGE    │   │
         │  │  (High mental       │  (Low mental       │   │
         │  │   model reliance)   │   model reliance)  │   │
         │  ├─────────────────────┼────────────────────┤   │
         │  │  - Primary nav      │  - Color palette   │   │
         │  │    structure        │  - Typography      │   │
         │  │  - Core workflow    │  - Iconography     │   │
         │  │    sequence         │    (if labeled)    │   │
         │  │  - Key shortcut     │  - Spacing/sizing  │   │
         │  │    behaviors        │  - Illustration    │   │
         │  │  - URL structure    │    style           │   │
         │  │  - Search behavior  │  - Card layouts    │   │
         │  │  - Login flow       │  - Empty states    │   │
         │  │  - Data location    │  - Footer content  │   │
         │  │    (where users     │  - Notification    │   │
         │  │     expect to find  │    styling         │   │
         │  │     things)         │  - Onboarding      │   │
         │  └─────────────────────┴────────────────────┘   │
         └─────────────────────────────────────────────────┘
```

### Redesign Transition Toolkit

```
┌──────────────────────────────────────────────────────────────┐
│  TRANSITION TECHNIQUES (by risk level)                        │
│                                                               │
│  LOW RISK (Score 0-2):                                        │
│  ├── Ship directly                                           │
│  ├── Add a "What's new" tooltip or banner                    │
│  └── Monitor analytics for 2 weeks                           │
│                                                               │
│  MEDIUM RISK (Score 3-5):                                     │
│  ├── Beta opt-in with feedback mechanism                     │
│  ├── "Try the new version" toggle                            │
│  ├── Guided walkthrough for major changes                    │
│  └── Revert option available for 30 days                     │
│                                                               │
│  HIGH RISK (Score 6-9):                                       │
│  ├── A/B test with 10% ──▶ 25% ──▶ 50% ──▶ 100% rollout    │
│  ├── "Classic" mode available for 90+ days                   │
│  ├── In-app interactive tutorials                            │
│  ├── Dedicated migration email campaign                      │
│  └── Support team briefed and prepared                       │
│                                                               │
│  VERY HIGH RISK (Score 10+):                                  │
│  ├── Parallel versions running simultaneously                │
│  ├── Migration assistant / setup wizard                      │
│  ├── User research sessions during rollout                   │
│  ├── Feature flags for individual component rollout          │
│  ├── Monthly "office hours" for user feedback                │
│  └── Rollback plan documented and tested                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Form Design Audit

A comprehensive diagnostic specifically for **forms**, combining multiple
Laws of UX into a single evaluation framework.

```
                    ┌─────────────────────────────┐
                    │  START: Identify the form    │
                    │  and its purpose             │
                    └────────────┬────────────────┘
                                 │
                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 1: FIELD COUNT AUDIT  (Hick's Law)              │
    │                                                         │
    │  Count total visible fields:                            │
    │                                                         │
    │  ┌────────────┬────────────────────────────────────┐   │
    │  │  Fields    │  Action                            │   │
    │  ├────────────┼────────────────────────────────────┤   │
    │  │  1-3       │  EXCELLENT. Ship it.               │   │
    │  ├────────────┼────────────────────────────────────┤   │
    │  │  4-6       │  GOOD. Verify all are essential.   │   │
    │  ├────────────┼────────────────────────────────────┤   │
    │  │  7-10      │  HEAVY. Group into sections.       │   │
    │  │            │  Use progressive disclosure.       │   │
    │  ├────────────┼────────────────────────────────────┤   │
    │  │  11-15     │  OVERLOADED. Split into steps      │   │
    │  │            │  or remove non-essential fields.    │   │
    │  ├────────────┼────────────────────────────────────┤   │
    │  │  16+       │  CRITICAL. Multi-step wizard       │   │
    │  │            │  required. Max 5-6 fields/step.    │   │
    │  └────────────┴────────────────────────────────────┘   │
    │                                                         │
    │  For each field, ask: "What happens if we remove this?" │
    │  If the answer is "nothing," remove it.                 │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 2: FIELD GROUPING  (Miller's Law)               │
    │                                                         │
    │  Group related fields together:                         │
    │                                                         │
    │  BEFORE (Ungrouped):           AFTER (Grouped):        │
    │  ┌─────────────────────┐       ┌─────────────────────┐ │
    │  │ First Name ________ │       │ Personal Info       │ │
    │  │ Email    __________ │       │ ┌─────┐ ┌────────┐ │ │
    │  │ Street   __________ │       │ │First│ │Last    │ │ │
    │  │ Last Name _________ │       │ └─────┘ └────────┘ │ │
    │  │ Phone    __________ │       │ Email ____________ │ │
    │  │ City     __________ │       │ Phone ____________ │ │
    │  │ Card #   __________ │       ├─────────────────────┤ │
    │  │ State    __________ │       │ Address             │ │
    │  │ Exp Date __________ │       │ Street ____________ │ │
    │  │ Zip      __________ │       │ ┌──────┐┌───┐┌───┐ │ │
    │  └─────────────────────┘       │ │City  ││ST ││Zip│ │ │
    │                                │ └──────┘└───┘└───┘ │ │
    │  10 ungrouped fields =         ├─────────────────────┤ │
    │  HIGH cognitive load           │ Payment             │ │
    │                                │ Card # ____________ │ │
    │                                │ ┌───────┐ ┌──────┐ │ │
    │                                │ │Exp    │ │CVC   │ │ │
    │                                │ └───────┘ └──────┘ │ │
    │                                └─────────────────────┘ │
    │                                                         │
    │                                3 groups, each with     │
    │                                3-4 fields = MANAGEABLE │
    │                                                         │
    │  Rules:                                                 │
    │  [ ] Max 5 fields per group (ideally 3-4)              │
    │  [ ] Each group has a clear label/heading              │
    │  [ ] Groups separated by whitespace or dividers        │
    │  [ ] Related fields on the same row where logical      │
    │      (City + State + Zip)                              │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 3: TARGET SIZING  (Fitts's Law)                 │
    │                                                         │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  Element        │ Min Size   │ Recommended       │  │
    │  ├──────────────────┼────────────┼───────────────────┤  │
    │  │  Text Input      │ 36px h     │ 44-48px h         │  │
    │  │  Submit Button   │ 44px h     │ 48-56px h         │  │
    │  │  Checkbox        │ 24x24px    │ 44x44px tap area  │  │
    │  │  Radio Button    │ 24x24px    │ 44x44px tap area  │  │
    │  │  Dropdown        │ 36px h     │ 44-48px h         │  │
    │  │  Link in form    │ n/a        │ 44px tap area     │  │
    │  └──────────────────┴────────────┴───────────────────┘  │
    │                                                         │
    │  Additional checks:                                     │
    │  [ ] Label is ABOVE the field (not beside -- better    │
    │      for scanning and mobile)                          │
    │  [ ] Submit button is full-width or clearly prominent  │
    │  [ ] Tap targets have >= 8px spacing between them      │
    │  [ ] Submit button is the most visually prominent      │
    │      element (Von Restorff)                            │
    │  [ ] Labels are clickable and focus the input          │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 4: INPUT FLEXIBILITY  (Postel's Law)            │
    │                                                         │
    │  "Be conservative in what you send, liberal in what    │
    │   you accept."                                          │
    │                                                         │
    │  For each field, check:                                 │
    │                                                         │
    │  ┌────────────────┬─────────────────────────────────┐  │
    │  │  Field Type    │  Flexibility Checks              │  │
    │  ├────────────────┼─────────────────────────────────┤  │
    │  │  Phone         │  Accept: (555) 123-4567,        │  │
    │  │                │  555-123-4567, 5551234567,       │  │
    │  │                │  +1 555 123 4567                 │  │
    │  │                │  Strip formatting on submit.     │  │
    │  ├────────────────┼─────────────────────────────────┤  │
    │  │  Date          │  Accept: 01/15/2025,            │  │
    │  │                │  1/15/25, Jan 15 2025,           │  │
    │  │                │  2025-01-15. Offer date picker   │  │
    │  │                │  AND free text.                  │  │
    │  ├────────────────┼─────────────────────────────────┤  │
    │  │  Email         │  Trim whitespace, allow mixed   │  │
    │  │                │  case, handle "+" aliases.       │  │
    │  ├────────────────┼─────────────────────────────────┤  │
    │  │  Name          │  Accept Unicode, hyphens,       │  │
    │  │                │  apostrophes, spaces, accents.  │  │
    │  │                │  No "invalid character" errors.  │  │
    │  ├────────────────┼─────────────────────────────────┤  │
    │  │  Currency      │  Accept: $50, 50.00, 50,        │  │
    │  │                │  $50.00. Strip symbols, parse.   │  │
    │  ├────────────────┼─────────────────────────────────┤  │
    │  │  Address       │  Autocomplete, accept varied    │  │
    │  │                │  formats, "Apt" vs "Apt." vs    │  │
    │  │                │  "#" vs "Unit".                  │  │
    │  ├────────────────┼─────────────────────────────────┤  │
    │  │  Credit Card   │  Accept spaces and dashes.      │  │
    │  │                │  Auto-detect card type.          │  │
    │  │                │  Format as user types.           │  │
    │  └────────────────┴─────────────────────────────────┘  │
    │                                                         │
    │  General Postel's Law Rules:                            │
    │  [ ] Never reject input for formatting reasons if you  │
    │      can programmatically fix it                       │
    │  [ ] Show the cleaned/formatted version back to user   │
    │  [ ] Validate on blur or submit, not on every keystroke│
    │  [ ] Error messages explain what IS accepted, not just │
    │      what was wrong                                    │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 5: SMART DEFAULTS & COMPLEXITY HIDING           │
    │  (Tesler's Law)                                        │
    │                                                         │
    │  Complexity cannot be eliminated, only moved. Move it  │
    │  FROM the user TO the system.                          │
    │                                                         │
    │  [ ] Pre-fill country based on IP geolocation          │
    │  [ ] Pre-fill city/state from zip code                 │
    │  [ ] Default to most common option in selects          │
    │  [ ] "Same as shipping" checkbox for billing           │
    │  [ ] Autosuggest / autocomplete where possible         │
    │  [ ] Auto-advance to next field when current is full   │
    │      (e.g., MM/YY in credit card expiry)               │
    │  [ ] Hide "advanced" or "optional" fields behind       │
    │      an expandable section                             │
    │  [ ] Social login / SSO to skip entire form            │
    │  [ ] Browser autofill supported (proper name, email,   │
    │      autocomplete attributes set)                      │
    └────────────────────────────────────────────────────────┘
```

### Form Scoring Rubric

```
┌──────────────────────────────────────────────────────────┐
│  FORM SCORE: Rate each dimension 1-5, sum for total      │
│                                                           │
│  ┌───────────────────────┬─────┬─────────────────────┐   │
│  │  Dimension            │Score│  Notes               │   │
│  ├───────────────────────┼─────┼─────────────────────┤   │
│  │  Field Count (Hick)   │ /5  │  Fewer = higher     │   │
│  │  Grouping (Miller)    │ /5  │  Chunked = higher   │   │
│  │  Target Size (Fitts)  │ /5  │  44px+ = higher     │   │
│  │  Flexibility (Postel) │ /5  │  Forgiving = higher │   │
│  │  Defaults (Tesler)    │ /5  │  Smarter = higher   │   │
│  ├───────────────────────┼─────┼─────────────────────┤   │
│  │  TOTAL                │ /25 │                     │   │
│  └───────────────────────┴─────┴─────────────────────┘   │
│                                                           │
│  20-25: Excellent   15-19: Good   10-14: Needs Work      │
│   5-9: Poor -- Major redesign needed                     │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Mobile-Specific Diagnostic

A flowchart for reviewing designs specifically on **mobile devices**, covering
thumb zones, touch targets, content reachability, and responsive behavior.

```
                    ┌──────────────────────────────┐
                    │  START: Load the screen on a  │
                    │  mobile device (or emulator)  │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 1: THUMB ZONE AUDIT  (Fitts's Law)             │
    │                                                         │
    │  Reference: Thumb Reachability Map                      │
    │  (Right-handed, one-handed use)                         │
    │                                                         │
    │  ┌──────────────────────────────┐                      │
    │  │  ┌────────────────────────┐  │                      │
    │  │  │ ░░░░░ HARD ░░░░░░░░░░ │  │  ░ = Hard to reach   │
    │  │  │ ░░░░░░░░░░░░░░░░░░░░░ │  │  ▒ = Stretch zone    │
    │  │  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░ │  │  █ = Easy / Natural  │
    │  │  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░ │  │                      │
    │  │  │ ██████████▒▒▒▒▒▒▒▒▒▒ │  │                      │
    │  │  │ ██████████████▒▒▒▒▒▒ │  │                      │
    │  │  │ ████████████████████ │  │                      │
    │  │  │ ██████████████████▒▒ │  │                      │
    │  │  │ ████████████████████ │  │                      │
    │  │  │ ████ NATURAL ██████ │  │                      │
    │  │  └────────────────────────┘  │                      │
    │  └──────────────────────────────┘                      │
    │                                                         │
    │  Checklist:                                             │
    │  [ ] Primary actions in NATURAL zone (bottom 1/3)?     │
    │  [ ] Destructive actions in HARD zone (top corners)?   │
    │  [ ] Frequently used controls within thumb reach?      │
    │  [ ] Bottom navigation bar for core nav?               │
    │  [ ] No critical actions behind top-left corner?       │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 2: TOUCH TARGET SIZING  (Fitts's Law)          │
    │                                                         │
    │  Minimum touch target sizes by platform:                │
    │                                                         │
    │  ┌─────────────┬──────────────┬──────────────────┐     │
    │  │  Platform   │  Minimum     │  Recommended     │     │
    │  ├─────────────┼──────────────┼──────────────────┤     │
    │  │  iOS (HIG)  │  44 x 44 pt  │  48 x 48 pt     │     │
    │  │  Android    │  48 x 48 dp  │  48 x 48 dp     │     │
    │  │  (Material) │              │                  │     │
    │  │  WCAG 2.5.8 │  24 x 24 px  │  44 x 44 px     │     │
    │  │  Web (gen)  │  44 x 44 px  │  48 x 48 px     │     │
    │  └─────────────┴──────────────┴──────────────────┘     │
    │                                                         │
    │  Common violations to check:                            │
    │  [ ] Small icon buttons (< 44px) without expanded      │
    │      tap area (use padding, not just icon size)        │
    │  [ ] Close (X) buttons on modals -- often too small    │
    │  [ ] Inline text links in paragraphs -- hard to tap    │
    │  [ ] Adjacent buttons with < 8px gap between them      │
    │  [ ] Checkbox / radio inputs at native size (16px)     │
    │  [ ] Pagination links (tiny numbers, no spacing)       │
    │  [ ] Stepper controls (+/- buttons)                    │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 3: CONTENT REACHABILITY                         │
    │  (Fitts's Law + Tesler's Law)                          │
    │                                                         │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  Mobile Screen Layout Assessment                 │  │
    │  │                                                  │  │
    │  │  ┌──────────────────────────┐                    │  │
    │  │  │  Status Bar             │  Fixed              │  │
    │  │  ├──────────────────────────┤                    │  │
    │  │  │  App Header / Nav Bar   │  Fixed or scroll    │  │
    │  │  ├──────────────────────────┤                    │  │
    │  │  │                          │                    │  │
    │  │  │   Scrollable Content     │  < Check priority  │  │
    │  │  │   Area                   │    of content      │  │
    │  │  │                          │    above fold      │  │
    │  │  │                          │                    │  │
    │  │  │                          │                    │  │
    │  │  ├──────────────────────────┤                    │  │
    │  │  │  Bottom Nav / Action Bar │  Fixed              │  │
    │  │  ├──────────────────────────┤                    │  │
    │  │  │  Home Indicator / Chin   │  System            │  │
    │  │  └──────────────────────────┘                    │  │
    │  └──────────────────────────────────────────────────┘  │
    │                                                         │
    │  [ ] Most important content visible above the fold     │
    │  [ ] Primary CTA visible without scrolling             │
    │  [ ] If content requires scroll, is there a visual cue │
    │      that more content exists below?                   │
    │  [ ] Fixed headers/footers do not consume > 20% of     │
    │      viewport height                                   │
    │  [ ] Sticky CTAs (e.g., "Add to Cart") for long pages  │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 4: RESPONSIVE BEHAVIOR  (Postel's Law)          │
    │                                                         │
    │  "Accept a wide range of screen sizes gracefully."      │
    │                                                         │
    │  Test at these breakpoints:                             │
    │  [ ] 320px  (iPhone SE / small Android)                │
    │  [ ] 375px  (iPhone standard)                          │
    │  [ ] 390px  (iPhone Pro)                               │
    │  [ ] 428px  (iPhone Pro Max / large Android)           │
    │  [ ] 768px  (iPad portrait / tablet)                   │
    │  [ ] Landscape orientation on all above                │
    │                                                         │
    │  At each breakpoint, verify:                            │
    │  [ ] No horizontal scroll                              │
    │  [ ] Text is readable without zooming (min 16px base)  │
    │  [ ] Images scale and do not overflow                  │
    │  [ ] Touch targets remain >= 44px                      │
    │  [ ] Nothing is hidden behind fixed elements           │
    │  [ ] Modals and overlays fit within viewport           │
    │  [ ] Inputs are not obscured by virtual keyboard       │
    │  [ ] Content doesn't jump when keyboard appears        │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 5: MOBILE INTERACTION PATTERNS                  │
    │  (Jakob's Law)                                          │
    │                                                         │
    │  Users expect mobile apps to behave like other mobile   │
    │  apps. Check for convention adherence:                  │
    │                                                         │
    │  [ ] Swipe gestures match platform conventions          │
    │  [ ] Pull-to-refresh on list/feed screens              │
    │  [ ] Back button / swipe-back works as expected        │
    │  [ ] Tab bar items: max 5, with icons + labels         │
    │  [ ] Long-press reveals contextual actions             │
    │  [ ] Haptic feedback for significant actions           │
    │  [ ] Sheet / bottom-drawer for secondary actions       │
    │  [ ] System share sheet used (not custom)              │
    └────────────────────────────────────────────────────────┘
```

### Mobile Thumb Zone Decision

```
┌─────────────────────────────────────────────────────┐
│  WHERE SHOULD THIS ELEMENT GO?                       │
│                                                      │
│  Is it the primary action?                           │
│  ├── YES ──▶ Bottom center (natural thumb zone)      │
│  │          Examples: FAB, sticky CTA, bottom nav    │
│  │                                                   │
│  └── NO ──▶ Is it used frequently?                   │
│             ├── YES ──▶ Bottom bar or easy-reach area │
│             │                                        │
│             └── NO ──▶ Is it destructive/dangerous?   │
│                        ├── YES ──▶ Top-left corner    │
│                        │          (hard to reach =    │
│                        │           hard to accident)  │
│                        │                              │
│                        └── NO ──▶ Standard position   │
│                                   based on context    │
│                                   and convention      │
└─────────────────────────────────────────────────────┘
```

---

## 7. Performance Perception Diagnostic

A decision tree for determining what to show users during **loading and
response states**, grounded in the **Doherty Threshold** (system responses
< 400ms feel instantaneous).

```
                    ┌──────────────────────────────┐
                    │  START: An action has been    │
                    │  triggered. How long until    │
                    │  the response is ready?       │
                    └────────────┬─────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │  Estimate the response time:        │
              └──┬──────┬───────┬───────┬───────┬──┘
                 │      │       │       │       │
                 ▼      ▼       ▼       ▼       ▼
           < 100ms  100-400ms 400ms-  1-5s    > 5s
                              1s
           │       │        │       │       │
           ▼       ▼        ▼       ▼       ▼
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
    │INSTANT   ││FAST      ││NOTICEABLE││SLOW      ││VERY SLOW │
    │          ││          ││          ││          ││          │
    │No loading││No loading││Show a    ││Show      ││Show      │
    │indicator ││indicator ││subtle    ││skeleton  ││progress  │
    │needed.   ││needed.   ││indicator:││screen or ││bar with  │
    │          ││          ││          ││spinner   ││estimated │
    │Update UI ││Update UI ││- Subtle  ││with      ││time.     │
    │immediate-││immediate-││  spinner ││content   ││          │
    │ly.       ││ly.       ││- Button  ││hints.    ││Or:       │
    │          ││          ││  state   ││          ││- Break   │
    │Optimistic││Optimistic││  change  ││Progress  ││  into    │
    │UI is     ││UI is     ││- Opacity ││indicator ││  stages  │
    │ideal.    ││ideal.    ││  pulse   ││if deter- ││- Show    │
    │          ││          ││          ││minate.   ││  partial │
    │Examples: ││Examples: ││Examples: ││          ││  results │
    │- Toggle  ││- Like    ││- Page    ││Examples: ││- Stream  │
    │- Check   ││  button  ││  load    ││- API call││  content │
    │- Local   ││- Add to  ││- Data    ││- Image   ││          │
    │  filter  ││  cart    ││  fetch   ││  upload  ││Examples: │
    │          ││- Bookmark││- Search  ││- Report  ││- File    │
    │          ││          ││  results ││  genera- ││  export  │
    │          ││          ││          ││  tion    ││- Bulk    │
    │          ││          ││          ││          ││  operation│
    └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
```

### Loading Pattern Decision Tree

```
                    ┌──────────────────────────────┐
                    │  What type of content is      │
                    │  being loaded?                 │
                    └──┬────────┬───────┬──────┬───┘
                       │        │       │      │
                       ▼        ▼       ▼      ▼
                    Text/    Images   Mixed   Action
                    Data              Layout  Result
                       │        │       │      │
                       ▼        ▼       ▼      ▼
              ┌────────────┐ ┌─────┐ ┌─────┐ ┌──────────┐
              │Use SKELETON│ │Use  │ │Use  │ │Use       │
              │SCREEN:     │ │BLUR-│ │SKELE│ │OPTIMISTIC│
              │            │ │UP / │ │TON +│ │UI:       │
              │Gray blocks │ │LQIP:│ │BLUR-│ │          │
              │mimicking   │ │     │ │UP:  │ │Show the  │
              │content     │ │Tiny │ │     │ │expected  │
              │layout.     │ │blur │ │Bones│ │result    │
              │            │ │thumb│ │for  │ │immediate-│
              │Keeps the   │ │that │ │text,│ │ly. Roll  │
              │perceived   │ │sharpens│blur│ │back if   │
              │structure   │ │to full│for │ │the action│
              │stable.     │ │image.│images│ │fails.    │
              │            │ │     │ │     │ │          │
              │DO: Match   │ │DO:  │ │DO:  │ │DO: Show  │
              │real layout.│ │Use  │ │Load │ │success   │
              │DON'T: Use  │ │domi-│ │text │ │state with│
              │uniform     │ │nant │ │first│ │subtle    │
              │rectangles. │ │color│ │then │ │"saving"  │
              │            │ │bg.  │ │img. │ │indicator.│
              └────────────┘ └─────┘ └─────┘ └──────────┘
```

### Timing Reference Table

```
┌──────────────────────────────────────────────────────────────────┐
│  DOHERTY THRESHOLD REFERENCE                                      │
│                                                                    │
│  ┌─────────────────┬──────────────────────────────────────────┐   │
│  │  Response Time   │  User Perception & Strategy              │   │
│  ├─────────────────┼──────────────────────────────────────────┤   │
│  │  0-100ms         │  INSTANT. No feedback needed.            │   │
│  │                  │  User feels in direct control.           │   │
│  ├─────────────────┼──────────────────────────────────────────┤   │
│  │  100-400ms       │  RESPONSIVE. Minor delay acceptable.     │   │
│  │                  │  Optimistic UI patterns work well here.  │   │
│  │                  │  This is the Doherty Threshold sweet     │   │
│  │                  │  spot for system response.               │   │
│  ├─────────────────┼──────────────────────────────────────────┤   │
│  │  400ms-1s        │  NOTICEABLE. User aware of delay.        │   │
│  │                  │  Show activity indicator (spinner,       │   │
│  │                  │  pulse, subtle animation).               │   │
│  ├─────────────────┼──────────────────────────────────────────┤   │
│  │  1-5s            │  SLOW. User may lose focus.              │   │
│  │                  │  Show skeleton screens or meaningful     │   │
│  │                  │  progress. Keep user engaged.            │   │
│  ├─────────────────┼──────────────────────────────────────────┤   │
│  │  5-10s           │  FRUSTRATING. Risk of abandonment.       │   │
│  │                  │  Show progress bar with estimate.        │   │
│  │                  │  Consider background processing with     │   │
│  │                  │  notification on completion.             │   │
│  ├─────────────────┼──────────────────────────────────────────┤   │
│  │  > 10s           │  BROKEN FEELING. High abandonment risk.  │   │
│  │                  │  Must provide: progress %, time est.,    │   │
│  │                  │  ability to do other tasks, or email     │   │
│  │                  │  notification when ready.                │   │
│  └─────────────────┴──────────────────────────────────────────┘   │
│                                                                    │
│  KEY STRATEGIES:                                                   │
│  - Preload: Fetch likely-next content before user requests it      │
│  - Optimistic UI: Show success immediately, sync in background     │
│  - Progressive: Show partial content as it arrives (streaming)     │
│  - Stagger: Animate content appearing to feel faster               │
│  - Strategic delay: For < 300ms operations, add a 300ms min        │
│    delay to avoid jarring flash of loading state                   │
│                                                                    │
│  ANTI-PATTERNS:                                                    │
│  - Full-page spinner blocking all interaction                      │
│  - Loading state that flashes for < 200ms (disorienting)           │
│  - No loading indicator for > 500ms operations                     │
│  - Progress bar that jumps from 0% to 99% then stalls             │
│  - "Almost done..." messages that appear at the start              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Contrast and Emphasis Audit

Based on the **Von Restorff Effect** (the isolation effect): items that are
visually distinct from their surroundings are more memorable and noticeable.
This audit ensures emphasis is applied correctly and accessibly.

```
                    ┌──────────────────────────────┐
                    │  START: Identify all elements │
                    │  intended to STAND OUT on     │
                    │  the current screen           │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 1: EMPHASIS INVENTORY                           │
    │                                                         │
    │  List every element that uses visual emphasis:          │
    │                                                         │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  #  │ Element          │ Emphasis Method         │  │
    │  ├─────┼──────────────────┼─────────────────────────┤  │
    │  │  1  │ ________________ │ _______________________ │  │
    │  │  2  │ ________________ │ _______________________ │  │
    │  │  3  │ ________________ │ _______________________ │  │
    │  │  4  │ ________________ │ _______________________ │  │
    │  │  5  │ ________________ │ _______________________ │  │
    │  └─────┴──────────────────┴─────────────────────────┘  │
    │                                                         │
    │  Emphasis methods include: bold color, large size,      │
    │  animation/motion, border/outline, shadow/elevation,    │
    │  badge/tag, icon, position (top/center), whitespace,    │
    │  contrasting shape.                                     │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 2: COMPETING EMPHASIS CHECK                     │
    │                                                         │
    │  Count emphasized elements per viewport:                │
    │                                                         │
    │  ┌────────────────┬────────────────────────────────┐   │
    │  │  Count         │  Assessment                    │   │
    │  ├────────────────┼────────────────────────────────┤   │
    │  │  1              │  IDEAL. Clear focal point.     │   │
    │  ├────────────────┼────────────────────────────────┤   │
    │  │  2              │  OK if they have clear         │   │
    │  │                 │  hierarchy (primary/secondary) │   │
    │  ├────────────────┼────────────────────────────────┤   │
    │  │  3              │  CAUTION. When everything is   │   │
    │  │                 │  bold, nothing is bold.        │   │
    │  ├────────────────┼────────────────────────────────┤   │
    │  │  4+             │  OVERLOAD. Competing emphasis  │   │
    │  │                 │  = no emphasis. Reduce to 1-2. │   │
    │  └────────────────┴────────────────────────────────┘   │
    │                                                         │
    │  Von Restorff Rule: The isolated item wins. If there   │
    │  are multiple "special" items, NONE are special.       │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 3: CTA DISTINCTION AUDIT                        │
    │                                                         │
    │  For the primary CTA, verify ALL of these:             │
    │                                                         │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  CHECK                              │ PASS? │    │  │
    │  ├──────────────────────────────────────┼────────┤    │  │
    │  │  Uses a FILLED style (not ghost/     │ [ ]    │    │  │
    │  │  outline) for primary action         │        │    │  │
    │  ├──────────────────────────────────────┼────────┤    │  │
    │  │  Color is unique on the page (not    │ [ ]    │    │  │
    │  │  shared by non-CTA elements)         │        │    │  │
    │  ├──────────────────────────────────────┼────────┤    │  │
    │  │  Size is larger than secondary       │ [ ]    │    │  │
    │  │  buttons                             │        │    │  │
    │  ├──────────────────────────────────────┼────────┤    │  │
    │  │  Has adequate whitespace around it   │ [ ]    │    │  │
    │  │  (breathing room)                    │        │    │  │
    │  ├──────────────────────────────────────┼────────┤    │  │
    │  │  Label is action-oriented verb       │ [ ]    │    │  │
    │  │  ("Get Started" not "Submit")        │        │    │  │
    │  ├──────────────────────────────────────┼────────┤    │  │
    │  │  Position follows natural eye flow   │ [ ]    │    │  │
    │  │  (F-pattern or Z-pattern endpoint)   │        │    │  │
    │  ├──────────────────────────────────────┼────────┤    │  │
    │  │  Only ONE primary CTA per viewport   │ [ ]    │    │  │
    │  │  (avoid competing primaries)         │        │    │  │
    │  └──────────────────────────────────────┴────────┘    │  │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 4: BANNER BLINDNESS RISK ASSESSMENT             │
    │                                                         │
    │  Users learn to ignore elements that LOOK like ads or   │
    │  persistent decorations. Check for:                     │
    │                                                         │
    │  ┌────────────────────────────────────────────┐        │
    │  │  Pattern                 │ Blindness Risk  │        │
    │  ├──────────────────────────┼─────────────────┤        │
    │  │  Full-width bar at top   │ HIGH            │        │
    │  │  of page                 │ (looks like ad) │        │
    │  ├──────────────────────────┼─────────────────┤        │
    │  │  Animated / flashing     │ HIGH            │        │
    │  │  banner                  │ (ad pattern)    │        │
    │  ├──────────────────────────┼─────────────────┤        │
    │  │  Right sidebar box       │ HIGH            │        │
    │  │  with image              │ (ad placement)  │        │
    │  ├──────────────────────────┼─────────────────┤        │
    │  │  Persistent dismissible  │ MEDIUM          │        │
    │  │  notification            │ (cookie banner  │        │
    │  │                          │  fatigue)       │        │
    │  ├──────────────────────────┼─────────────────┤        │
    │  │  Inline card within      │ LOW             │        │
    │  │  content flow            │ (feels native)  │        │
    │  ├──────────────────────────┼─────────────────┤        │
    │  │  Contextual tooltip or   │ LOW             │        │
    │  │  inline callout          │ (relevant)      │        │
    │  └──────────────────────────┴─────────────────┘        │
    │                                                         │
    │  If critical info is at HIGH risk:                      │
    │  - Move it inline with content                         │
    │  - Use contextual triggers (appear when relevant)      │
    │  - Integrate into the natural content flow             │
    │  - Use motion sparingly and purposefully               │
    └──────────────┬──────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────────────────────┐
    │  PHASE 5: ACCESSIBILITY -- COLOR CONTRAST AUDIT        │
    │                                                         │
    │  Von Restorff emphasis MUST be accessible. Distinction  │
    │  cannot rely on color alone.                            │
    │                                                         │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │  WCAG Contrast Requirements:                     │  │
    │  │                                                  │  │
    │  │  ┌──────────────────────┬────────┬────────────┐  │  │
    │  │  │  Element             │ AA     │ AAA        │  │  │
    │  │  ├──────────────────────┼────────┼────────────┤  │  │
    │  │  │  Normal text (<18px) │ 4.5:1  │ 7:1        │  │  │
    │  │  │  Large text (>=18px  │ 3:1    │ 4.5:1      │  │  │
    │  │  │   or 14px bold)     │        │            │  │  │
    │  │  │  UI Components /    │ 3:1    │ 3:1        │  │  │
    │  │  │   Graphics          │        │ (minimum)  │  │  │
    │  │  │  Focus indicators   │ 3:1    │ 3:1        │  │  │
    │  │  └──────────────────────┴────────┴────────────┘  │  │
    │  └──────────────────────────────────────────────────┘  │
    │                                                         │
    │  Beyond color -- check that emphasis also uses:         │
    │  [ ] SIZE difference (not just color)                  │
    │  [ ] WEIGHT difference (bold vs regular)               │
    │  [ ] SHAPE difference (filled vs outline, rounded vs   │
    │      sharp)                                            │
    │  [ ] POSITION (whitespace, alignment offset)           │
    │  [ ] ICON or visual indicator paired with color        │
    │  [ ] UNDERLINE on links (not just color change)        │
    │                                                         │
    │  Test: Convert the screen to grayscale.                 │
    │  Can you still identify the primary CTA?               │
    │  Can you still distinguish all emphasis levels?         │
    │  ├── YES ──▶ Passes non-color-reliance test            │
    │  └── NO  ──▶ Add non-color emphasis methods            │
    └────────────────────────────────────────────────────────┘
```

### Emphasis Hierarchy Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│  HOW MANY EMPHASIS LEVELS DO I NEED?                         │
│                                                              │
│  Typical page hierarchy:                                     │
│                                                              │
│  Level 1: PRIMARY ACTION (1 per viewport)                    │
│  │  - Filled button, bold color, largest size                │
│  │  - Example: "Sign Up Free", "Buy Now"                     │
│  │                                                           │
│  Level 2: SECONDARY ACTION (1-2 per viewport)                │
│  │  - Outline button or text link, muted color               │
│  │  - Example: "Learn More", "Compare Plans"                 │
│  │                                                           │
│  Level 3: SUPPORTING INFO (as needed)                        │
│  │  - Badges, tags, labels with subtle distinction           │
│  │  - Example: "New", "Popular", "Sale"                      │
│  │                                                           │
│  Level 4: BODY CONTENT (default)                             │
│  │  - No special emphasis, standard styling                  │
│  │  - Example: Paragraph text, data cells                    │
│  │                                                           │
│  Level 5: DE-EMPHASIZED (muted)                              │
│     - Reduced opacity, smaller size, lighter color           │
│     - Example: Timestamps, metadata, helper text             │
│                                                              │
│  RULE: Each level must be CLEARLY DISTINGUISHABLE from       │
│  the levels above and below it. If two levels look the same, │
│  merge them into one.                                        │
│                                                              │
│  Visual contrast stacking:                                   │
│                                                              │
│  L1: ████████████████████████████  (MAX contrast + size)     │
│  L2: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                              │
│  L3: ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                                   │
│  L4: ░░░░░░░░░░░░░░░░                                        │
│  L5: ····················        (MIN contrast + size)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick-Reference: Which Diagnostic to Use When

```
┌──────────────────────────────────────────────────────────────────┐
│  SITUATION                        │  USE DIAGNOSTIC              │
├───────────────────────────────────┼──────────────────────────────┤
│  Designing a new button, input,   │  1. Component-Level          │
│  card, modal, or widget           │                              │
├───────────────────────────────────┼──────────────────────────────┤
│  Reviewing a landing page,        │  2. Page-Level               │
│  dashboard, or settings screen    │                              │
├───────────────────────────────────┼──────────────────────────────┤
│  Designing onboarding, checkout,  │  3. Flow-Level               │
│  signup, or multi-step wizard     │                              │
├───────────────────────────────────┼──────────────────────────────┤
│  About to ship a redesign         │  4. Redesign Risk Assessment │
│  to existing users                │                              │
├───────────────────────────────────┼──────────────────────────────┤
│  Building or auditing any form    │  5. Form Design Audit        │
├───────────────────────────────────┼──────────────────────────────┤
│  Reviewing for mobile usability   │  6. Mobile-Specific          │
├───────────────────────────────────┼──────────────────────────────┤
│  Choosing loading/progress states │  7. Performance Perception   │
├───────────────────────────────────┼──────────────────────────────┤
│  Checking visual emphasis, CTAs,  │  8. Contrast & Emphasis      │
│  accessibility, banner blindness  │     Audit                    │
└───────────────────────────────────┴──────────────────────────────┘
```

---

## Laws of UX Cross-Reference Index

Every law referenced in these diagnostics, with where it appears:

```
┌────────────────────────┬─────────────────────────────────────────────┐
│  Law                   │  Diagnostics Where It Appears               │
├────────────────────────┼─────────────────────────────────────────────┤
│  Fitts's Law           │  1 (Component), 2 (Page), 5 (Form),        │
│                        │  6 (Mobile)                                 │
├────────────────────────┼─────────────────────────────────────────────┤
│  Hick's Law            │  1 (Component), 2 (Page), 3 (Flow),        │
│                        │  5 (Form)                                   │
├────────────────────────┼─────────────────────────────────────────────┤
│  Miller's Law          │  1 (Component), 2 (Page), 5 (Form)         │
├────────────────────────┼─────────────────────────────────────────────┤
│  Jakob's Law           │  1 (Component), 2 (Page), 4 (Redesign),    │
│                        │  6 (Mobile)                                 │
├────────────────────────┼─────────────────────────────────────────────┤
│  Von Restorff Effect   │  1 (Component), 2 (Page), 5 (Form),        │
│                        │  8 (Contrast & Emphasis)                    │
├────────────────────────┼─────────────────────────────────────────────┤
│  Postel's Law          │  3 (Flow), 5 (Form), 6 (Mobile)            │
├────────────────────────┼─────────────────────────────────────────────┤
│  Tesler's Law          │  3 (Flow), 5 (Form), 6 (Mobile)            │
├────────────────────────┼─────────────────────────────────────────────┤
│  Doherty Threshold     │  7 (Performance Perception)                 │
├────────────────────────┼─────────────────────────────────────────────┤
│  Peak-End Rule         │  3 (Flow)                                   │
├────────────────────────┼─────────────────────────────────────────────┤
│  Goal-Gradient Effect  │  3 (Flow)                                   │
├────────────────────────┼─────────────────────────────────────────────┤
│  Aesthetic-Usability   │  1 (Component), 2 (Page)                    │
│  Effect                │                                             │
├────────────────────────┼─────────────────────────────────────────────┤
│  Serial Position       │  2 (Page)                                   │
│  Effect                │                                             │
├────────────────────────┼─────────────────────────────────────────────┤
│  Gestalt: Proximity,   │  2 (Page), 5 (Form)                        │
│  Common Region,        │                                             │
│  Similarity, Uniform   │                                             │
│  Connectedness          │                                             │
└────────────────────────┴─────────────────────────────────────────────┘
```
