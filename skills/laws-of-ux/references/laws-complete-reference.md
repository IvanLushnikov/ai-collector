# Laws of UX -- Complete Reference

> Based on "Laws of UX" by Jon Yablonski (2nd Edition)
> 10 psychological principles for building better digital products

---

## 1. Jakob's Law

**Users spend most of their time on other sites, and they prefer your site to work the same way as all the other sites they already know.**

### Psychology Origins

- **Who:** Jakob Nielsen, usability expert and co-founder of Nielsen Norman Group.
- **When:** 2000.
- **Publication:** "End of Web Design," Nielsen Norman Group, July 22, 2000.
- **Scientific basis:** The law is grounded in the psychological concept of **mental models** -- internal representations people build from cumulative experience that they apply to new situations. Users carry expectations formed across hundreds of other sites and apps. When a new product aligns with those expectations, cognitive load drops and users can focus on their goals instead of figuring out the interface.
- **Supporting reference:** Jakob Nielsen, "Mental Models," Nielsen Norman Group, October 17, 2010.

### Key Formula or Model

No mathematical formula. The model is conceptual:

```
User's Mental Model  <-->  Your Design
       |                        |
  (formed by all          (should align
   prior experience)       with expectations)
       |                        |
       +--- GAP = friction, confusion, abandonment
       +--- MATCH = productivity, satisfaction, conversion
```

### Core Concepts for Designers

**Mental Models:** A mental model is what users think they know about how a system works. They form these models from every prior interaction -- other apps, websites, physical products. When your design matches their model, they can transfer knowledge instantly. When it doesn't, they must learn from scratch.

**Familiarity reduces cognitive load.** Every bit of mental energy users save on learning your interface is energy they can spend on achieving their goals. Navigation placement, form layouts, checkout flows, icon meanings -- all of these carry expectations.

**Not all friction is bad.** Sometimes friction is intentional and necessary (e.g., confirmation dialogs before destructive actions). The target is *extraneous* friction -- friction that adds no value.

**Affordance:** The relationship between an interactive element and the user regarding what actions are possible. Clear affordance comes from mapping digital controls to physical-world counterparts users already understand.

### Real-World Design Examples

**Snapchat 2018 Redesign (Failure):**
- WHAT: Snapchat launched a massive overhaul that combined watching stories and communicating with friends in the same place, dramatically changing the app's familiar structure. No gradual rollout, no opt-in period.
- WHY IT MATTERS: Users revolted on Twitter. Many migrated to Instagram. Ad views dropped, revenue fell, user count shrank. CEO Evan Spiegel had hoped the redesign would attract advertisers, but the mental model mismatch caused a backlash so severe it damaged the business.
- LESSON: Sudden, sweeping redesigns that violate established mental models are extremely risky.

**YouTube 2017 Redesign (Success):**
- WHAT: Google allowed desktop users to opt in to a new Material Design UI. Users could preview it, submit feedback, and revert to the old version whenever they wanted.
- WHY IT MATTERS: The mental model mismatch was mitigated by giving users control over the transition timeline. Adoption happened organically as users became comfortable.
- LESSON: Gradual rollouts with opt-in mechanisms respect mental models.

**Etsy (Ecommerce Conventions):**
- Leverages familiar patterns: product cards, cart icon, multi-step checkout. Users transfer accumulated ecommerce knowledge seamlessly.

**Apple Vision Pro (Spatial Computing):**
- Uses familiar components (sidebars, tabs, search fields, windows) to introduce entirely new spatial computing technology. Builds on existing mental models to ease adoption of a novel platform.

### Actionable Design Guidelines

**Do:**
- Start with common patterns and conventions; depart only when there is a compelling reason
- Leverage design systems to maintain consistency
- Use gradual rollouts with opt-in when redesigning (YouTube model)
- Test unconventional designs with users to ensure they understand how things work
- Use user personas grounded in real research to understand your audience's mental models

**Don't:**
- Launch sweeping redesigns without transition support (Snapchat model)
- Assume your mental model matches the user's -- use research methods to close the gap
- Break conventions in strategic areas (navigation, search, checkout) without rigorous testing

### Key Consideration: The "Sameness" Pitfall

Jakob's Law does NOT argue that everything should look the same. Pervasive sameness comes from framework popularity, platform maturity, copying competitors, and lack of creativity. Innovation has its place. The guidance is: **start with conventions, break them intentionally when it improves the experience, and always test.**

If all websites were completely different, users could never rely on prior experience. Conventions emerge from necessity. But within that constraint, there is ample room for differentiation and creativity.

### Connections to Other Laws

- **Miller's Law:** Both address cognitive load reduction -- Jakob's through familiarity, Miller's through chunking
- **Aesthetic-Usability Effect:** Familiar things feel easier to use, connecting familiarity to perceived usability
- **Tesler's Law:** There is a minimum complexity in any system; conventions reduce complexity users must face
- **Fitts's Law:** Physical-world affordance concepts (shape coding) bridge physical and digital controls

---

## 2. Fitts's Law

**The time to acquire a target is a function of the distance to and size of the target.**

### Psychology Origins

- **Who:** Paul Fitts, American psychologist and pioneer of human factors engineering.
- **When:** 1954.
- **Publication:** "The Information Capacity of the Human Motor System in Controlling the Amplitude of Movement," *Journal of Experimental Psychology* 47, no. 6 (1954): 381-91.
- **The experiment:** Fitts studied rapid aimed movements and predicted that the time required to move to a target area is a function of the ratio between distance to the target and the width of the target.
- **WWII backstory:** In a 22-month period, the Air Force reported 457 crashes attributed to "pilot error." Fitts was assigned to diagnose the cause. He noticed crash data was NOT random. With colleague **Alphonse Chapanis**, he interviewed pilots and discovered that most crashes resulted from pilots confusing flap and landing gear controls -- which looked identical. Chapanis devised **shape coding** (distinct shapes for different controls so pilots could distinguish them by feel). This investigation birthed the discipline of **human factors engineering** -- the premise that machines should be designed for human limitations, not the other way around.

### Key Formula

```
ID = log2(2D / W)
```

Where:
- **ID** = Index of Difficulty (bits)
- **D** = distance from starting point to center of the target
- **W** = width (tolerance) of the target

As D increases -> difficulty increases (target is farther away)
As W increases -> difficulty decreases (target is larger)

### Core Concepts for Designers

**Three derived guidelines:**
1. Touch targets should be large enough for easy, accurate selection
2. Touch targets should have ample space between them
3. Touch targets should be placed in easily reachable areas

**Touch target minimum sizes:**

```
+---------------------------------------+-------------+
| Standard                              | Min Size    |
+---------------------------------------+-------------+
| Apple (spatial/visionOS)              | 60 x 60 pt  |
| Apple (touch/iOS)                     | 44 x 44 pt  |
| Google Material Design                | 48 x 48 dp  |
| WCAG (Web Content Accessibility)      | 44 x 44 px  |
| Nielsen Norman Group                  | 1 x 1 cm    |
+---------------------------------------+-------------+
```

These are MINIMUMS. Exceed them when possible.

**Spacing:** MIT Touch Lab found the average adult fingertip is 16-20mm in diameter. Google recommends at least **8dp of spacing** between touch targets.

**Thumb zones on mobile:**

```
    +---------------------------+
    |  HARD    |  OK   | HARD   |  <-- Top: hard to reach
    |          |       |        |      with one hand
    +----------+-------+--------+
    |          |       |        |
    |   OK     | EASY  |  OK    |  <-- Center: highest
    |          |       |        |      accuracy, preferred
    +----------+-------+--------+      viewing area
    |          |       |        |
    |   EASY   | EASY  | EASY   |  <-- Bottom: natural
    |          |       |        |      thumb resting zone
    +---------------------------+
```

Key finding (Steven Hoober): People prefer to **view and touch the center** of the smartphone screen. Accuracy is highest there. They do NOT scan upper-left to lower-right as on desktop.

**Infinite targets:** Screen edges act as natural walls for the cursor -- you can't overshoot. This is why desktop OS app bars sit at the bottom and menus at the top.

### Real-World Design Examples

**LinkedIn iOS App (Failure):**
- WHAT: The connection request confirmation screen places "accept" and "deny" actions close together on the right side of a dialog.
- WHY IT MATTERS: The actions are so close that users must switch to two hands to avoid accidentally tapping the wrong one. This violates Fitts's Law by placing opposing actions with insufficient spacing.

**Form Label Association (Best Practice):**
- Associating a text `<label>` element with an `<input>` in HTML expands the clickable surface area. Clicking the label focuses the input. This is native HTML behavior that directly applies Fitts's Law.

**Tesla Model 3 Infotainment:**
- Almost all vehicle controls are on a 15-inch touchscreen with no haptic feedback. Drivers must divert attention from the road to operate controls. Fitts's Law is critically important here -- target sizing and placement directly affect safety.

**Apple CarPlay:**
- Follows Fitts's Law by providing ample spacing between interactive elements, mitigating accidental selection in a driving context.

**iPhone Reachability:**
- Introduced with the larger iPhone 6/6 Plus. A gesture brings items at the top of the screen down to the lower half. Directly addresses the thumb zone problem.

### Actionable Design Guidelines

**Do:**
- Exceed minimum touch target sizes whenever possible
- Place primary actions in easily reachable areas (center or bottom on mobile)
- Associate text labels with form inputs to expand selectable area
- Place submit buttons near the last form field (minimize travel distance)
- Use infinite targets (place frequent controls at screen edges on desktop)
- Round interactive elements for eye-tracking input (visionOS)

**Don't:**
- Place opposing actions (accept/deny, save/delete) too close together
- Put critical controls in hard-to-reach corners of mobile screens
- Ignore that small targets feel less usable even when users avoid errors -- perception matters

### Key Consideration: Small Targets Damage Perception

Even when users manage to accurately select a small touch target without errors, the experience of having to be precise adds to the **perception** that the interface is less usable. Adequate sizing is not just about error prevention -- it signals quality.

### Connections to Other Laws

- **Jakob's Law:** The cockpit shape-coding story is fundamentally about mental models -- identical controls for different functions violated expectations
- **Hick's Law:** Target acquisition time + decision time compound total interaction time
- **Tesler's Law:** Irreducible difficulty in selection exists, but designers can minimize it
- **Doherty Threshold:** If target acquisition pushes interaction time beyond 400ms, productivity suffers

---

## 3. Miller's Law

**The average person can keep only 7 (plus or minus 2) items in their working memory.**

### Psychology Origins

- **Who:** George A. Miller, cognitive psychologist and professor at Harvard University's Department of Psychology.
- **When:** 1956.
- **Publication:** "The Magical Number Seven, Plus or Minus Two: Some Limits on Our Capacity for Processing Information," *Psychological Review* 63, no. 2 (1956): 81-97.
- **The study:** Miller observed that memory span in young adults was approximately limited to 7, regardless of whether the stimuli were letters, words, or numbers -- items with vastly different amounts of information. He concluded that "bits" (basic units of information) don't affect memory span as much as the number of **chunks** being memorized.
- **Miller's own caveat:** He used "the magical number seven" rhetorically and was surprised by its frequent misinterpretation as a hard limit.
- **Later research:**
  - **Nelson Cowan (2001):** "The Magical Number 4 in Short-Term Memory: A Reconsideration of Mental Storage Capacity," *Behavioral and Brain Sciences* 24, no. 1: 87-114. Suggested the average limit is closer to **4 items**.
  - **Wei Ji Ma, Masud Husain, and Paul M. Bays (2014):** Argued against measuring capacity as a fixed number of elements altogether.
- **Broader significance:** Miller pioneered the information-processing model of the human mind. His work helped move psychology beyond behaviorism and laid the groundwork for **cognitive load theory** (later formalized by John Sweller, 1988).

### Key Formula or Model

No strict formula. The conceptual model is:

```
Working Memory = limited "buffer space" (~4-7 slots)

Raw information:   9 1 6 5 5 5 1 2 1 2  (10 digits, overflows buffer)
                        |
                    CHUNKING
                        |
Chunked:           (916) 555-1212         (3 chunks, fits easily)
```

Chunking does NOT impose a hard limit on what to display. It is a method for **organizing** content so the brain can process it more efficiently.

### Core Concepts for Designers

**Cognitive load** is the amount of mental resources needed to understand and interact with an interface. Think of it like phone memory: run too many apps and performance degrades. Our brains work similarly -- when incoming information exceeds available working memory, tasks become harder, details get missed, and users feel overwhelmed.

**Chunking** is the central design technique. Apply it by:
- Grouping related content together
- Using color, scale, dividers, and spacing to make groups visually distinct
- Creating clear hierarchy with headings and subheadings

**The "7 items in navigation" myth:** Miller's Law is frequently misapplied to claim navigation menus must be limited to 7 items. This is wrong. Navigation menus are **visible and persistent** -- users don't need to memorize them. As long as the menu is well-organized, users can scan it effectively regardless of item count.

### Real-World Design Examples

**Phone Number Chunking:**
```
BEFORE (unchunked):   9165551212
AFTER (chunked):      (916) 555-1212
```

**Wall of Text vs. Formatted Content:**
- Wikipedia article without formatting: a dense wall of text that is hard to scan and process
- Same content with headings, subheadings, whitespace, reduced line length, underlined links, and highlighted keywords: dramatically easier to parse

**Bloomberg (2023):** Dense financial information made scannable through chunking -- content grouped into distinctive modules, separated by rules, with clear hierarchy. Users skimming headlines can quickly decide which story deserves their attention.

**Nike.com (2023):**
- Product listings: image, title, price, product type, and color count are chunked by proximity
- Navigation menu: well beyond 7 links, but easy to scan thanks to clear categorization, whitespace, and vertical dividers between sub-groups. Directly disproves the "7 items" myth.

**Google Docs Toolbar:** Related actions grouped together within the toolbar, with visual separators between groups. Chunking turns a complex feature set into a scannable, usable toolbar.

### ASCII Diagram: Chunking Before/After

```
BEFORE (wall of text):              AFTER (chunked):
+----------------------------+      +----------------------------+
| Text text text text text   |      | ## Section Heading         |
| text text text text text   |      |                            |
| text text text text text   |      | Short paragraph with key   |
| text text text text text   |      | terms **highlighted**.      |
| text text text text text   |      |                            |
| text text text text text   |      | -------------------------  |
| text text text text text   |      |                            |
| text text text text text   |      | ## Another Section         |
| text text text text text   |      |                            |
| text text text text text   |      | Concise paragraph. Links   |
| text text text text text   |      | are [underlined].          |
+----------------------------+      +----------------------------+
  Cognitive load: HIGH                Cognitive load: LOW
  Scannable: NO                       Scannable: YES
```

### Actionable Design Guidelines

**Do:**
- Organize content into smaller chunks with visual grouping (color, scale, dividers, spacing)
- Structure content with clear hierarchy (headings, subheadings, whitespace)
- Remember that short-term memory capacity varies per individual and context
- Use chunking for dense information displays (dashboards, financial data, product listings)

**Don't:**
- Use "the magical number seven" to justify arbitrary limits on navigation or other visible UI elements
- Confuse chunking with imposing a hard cap on displayed items
- Present walls of unformatted text

### Key Consideration: Chunking Is Not Limiting

The most common misapplication of Miller's Law is treating "7 +/- 2" as a design constraint (e.g., "we can only have 7 navigation links"). Chunking is about **organizing** information, not **restricting** it. Visible, persistent elements don't need to be memorized. Use Hick's Law (not Miller's) when thinking about limiting choices.

### Connections to Other Laws

- **Hick's Law:** Complementary but distinct. Miller's is about organizing info for working memory (chunking); Hick's is about decision time vs. number of choices. Both share the foundational concept of cognitive load.
- **Postel's Law:** Both address reducing mental burden on users -- Miller's through organization, Postel's through flexible input acceptance.

---

## 4. Hick's Law

**The time it takes to make a decision increases with the number and complexity of choices available.**

### Psychology Origins

- **Who:** Psychologists William Edmund Hick and Ray Hyman.
- **When:** 1952.
- **The experiment:** They examined the relationship between the number of stimuli present and an individual's reaction time to any given stimulus.
- **Finding:** Increasing the number of choices logarithmically increases decision time.

### Key Formula

```
RT = a + b log2(n)
```

Where:
- **RT** = Response Time (decision time)
- **n**  = number of stimuli (choices) present
- **a**  = time NOT related to decision making (e.g., motor response)
- **b**  = empirical constant based on cognitive processing time per option

As n doubles, RT increases by a fixed amount (logarithmic, not linear).

### Core Concepts for Designers

**The core principle:** Complex or busy interfaces result in longer decision times. Users must process all available options before choosing the most relevant one. Redundancy and excessiveness create confusion.

**Paradox of Choice:** American psychologist **Barry Schwartz** (2004, *The Paradox of Choice*) popularized the observation that more choice leads to choice overload, not happiness. He was inspired by the **Jam Experiment** (Sheena Iyengar and Mark Lepper, 2000):
- Shoppers at an upscale market saw a display of **24 varieties** of gourmet jam. On another day, shoppers saw **6 varieties**.
- The larger display attracted more attention.
- But shoppers who saw the larger display were **one-tenth as likely to purchase** compared to those who saw the smaller display.
- More options = more attention but dramatically less action.

**Progressive Disclosure:** Show the right choices at the right time rather than all choices at once. Google Search shows filter options (images, videos, news) only *after* the user begins searching -- not before.

**Oversimplification danger:** Reducing to the point of abstraction removes necessary cues. If users can't tell what actions are available, cognitive load actually *increases*. Icons without text labels are a common culprit -- truly universal icons are rare.

### Real-World Design Examples

**Netflix -- 18-Minute Decision Paralysis:**
- WHAT: Netflix found customers took an average of **18 minutes** to find something to watch, paralyzed by the quantity of options.
- WHAT THEY DID: Introduced "Trending Now" and "Popular on Netflix" categories -- using **social proof** to give weight to specific options and break the decision deadlock.
- WHY IT MATTERS: A textbook application of Hick's Law. Rather than reducing the catalog, Netflix reduced *perceived* choice complexity by highlighting curated subsets.

**TV Remote Controls vs. Smart TV Remotes:**
- Traditional remotes accumulated buttons as features grew, eventually requiring muscle memory or significant mental processing.
- "Grandparent-friendly remotes" appeared online -- grandkids taped over everything except essential buttons.
- Modern smart TV remotes (Apple, 2023) strip controls to only what's necessary, transferring complexity to the on-screen interface where it can be organized and progressively disclosed.

**Notion Onboarding (2023):**
- New users get an easy-to-follow checklist. This mimics how people learn: by doing, building on what they know. A risk-free environment avoids overwhelming users with endless possibilities.

**Facebook iOS App (Failure) vs. X/Twitter (Success):**
- Facebook's icon-only navigation illustrates oversimplification -- icons without text labels make meaning ambiguous.
- X/Twitter pairs icons with text labels, providing clarity through contextual cues.

### ASCII Diagram: Progressive Disclosure

```
STAGE 1 (initial):         STAGE 2 (after search):

+---------------------+    +---------------------+
|  [Search...       ] |    |  All | Images | Video|
|                     |    |  News | Maps | More  |
|                     |    +---------------------+
|                     |    |  Result 1            |
|  Simple. Focused.   |    |  Result 2            |
|  One action.        |    |  Result 3            |
+---------------------+    +---------------------+

Choices presented only     Filters appear AFTER
when relevant.             user has expressed intent.
```

### Actionable Design Guidelines

**Do:**
- Minimize choices when response times are critical
- Break complex tasks into smaller steps
- Highlight recommended options (social proof, "most popular" badges)
- Use progressive disclosure: right choices at the right time
- Add text labels to icons, especially for navigation and critical actions
- Use card sorting to understand users' mental models for information architecture

**Don't:**
- Simplify to the point of abstraction -- if users can't tell what's available, you've gone too far
- Rely solely on iconography for critical actions (universal icons are rare)
- Assume more choices = better experience (the jam experiment proves otherwise)
- Present all options simultaneously when a staged approach would reduce overwhelm

### Key Consideration: The Oversimplification Trap

The danger of Hick's Law is taking it too far. When an interface has been simplified to the point of abstraction, it's no longer clear what actions are available, what the next steps are, or where to find information. The visual information has been reduced to make the interface *seem* less complex, but the lack of cues actually *increases* cognitive load. The goal is elegant simplification, not aggressive minimalism.

### Connections to Other Laws

- **Miller's Law:** Share the concept of cognitive load. Miller's addresses organizing information; Hick's addresses reducing the number and complexity of choices. Miller's is sometimes incorrectly cited to justify limiting options -- that rationale properly belongs to Hick's.
- **Tesler's Law:** When you simplify the interface (Hick's), the complexity transfers elsewhere (Tesler's). Smart TV remotes reduce remote complexity but increase on-screen UI complexity.

---

## 5. Postel's Law

**Be conservative in what you do, be liberal in what you accept from others.**

### Psychology Origins

- **Who:** Jon Postel, American computer scientist and key contributor to internet protocols.
- **When:** 1981.
- **Publication:** RFC 793 (the Transmission Control Protocol specification).
- **Original statement:** "TCP implementations will follow a general principle of robustness: be conservative in what you do, be liberal in what you accept from others."
- **Original context:** A network engineering principle. Programs that send data should conform strictly to specifications. Programs that receive data should accept and parse nonconformant input as long as the meaning is clear. This fault tolerance helped ensure reliable communication across the early internet.
- **Extension to software:** Declarative languages like HTML and CSS exhibit this principle -- if the browser doesn't understand something, it ignores it and moves on. This flexibility led to their dominance on the web.
- **Extension to UX:** The philosophy applies to how we handle user input and system output. Humans are inconsistent, distracted, error-prone, and emotional. Systems should accommodate this reality.

### Key Formula or Model

No mathematical formula. The model is a two-sided principle:

```
+-------------------------------+-------------------------------+
| INPUT (be liberal)            | OUTPUT (be conservative)      |
+-------------------------------+-------------------------------+
| Accept varied formats         | Deliver reliable, accessible  |
| Handle cultural differences   | experiences across all        |
| Support multiple input methods| devices, screen sizes, and    |
| (keyboard, touch, voice,     | assistive technologies        |
| assistive tech)               |                               |
| Tolerate imperfect data       | Provide clear, purposeful     |
| Anticipate edge cases         | feedback and guidance          |
+-------------------------------+-------------------------------+
```

### Core Concepts for Designers

**The human condition in UX:** People don't behave like machines. They are inconsistent, distracted, error-prone, and driven by emotion. They expect products to understand them and be forgiving. They expect to feel in control and are annoyed when asked for more information than necessary.

**Decision fatigue in forms:** The more fields you require, the more cognitive energy users spend, leading to deterioration in decision quality and reduced form completion rates.

**Responsive web design (Ethan Marcotte, 2010):** Fluid grids, flexible images, and media queries create sites that adapt to any screen size. This is the "liberal in what you accept" principle applied to device diversity.

**Progressive enhancement (Steve Champeon and Nick Finck, 2003):** Core content available to all. Style and interaction layers added as capabilities are detected. Contrast with "graceful degradation" which starts with the advanced experience and falls back.

**Design resiliency:** English words can expand up to **300%** when translated into Italian. Text orientation varies (LTR, RTL, vertical). Users customize font sizes. Resilient designs account for all of these variations.

### Real-World Design Examples

**Form Design Failures:**
- WHAT: Strict formatting rules that reject hyphenated names, names with spaces, names with few letters, or addresses that don't conform to a specific country's format.
- WHY IT MATTERS: Telling someone their name is "wrong" or "not accepted" causes significant damage to their experience. Cultural variations in name order (given name first vs. family name first) create confusion when forms assume Western conventions.

**Apple Face ID (2023):**
- Accepts varying human biometric input (face angles, lighting conditions, aging) with minimal user effort. Translates messy biological input into a clean authentication signal. Exemplifies "liberal in what you accept."

**Amazon.com Font Size Adaptation:**
- Amazon's header navigation responds to custom font size settings by reorganizing quick links and removing lower-priority links as font size increases. A concrete example of design resiliency.

**Design Systems (IBM Carbon, Salesforce Lightning, Shopify Polaris):**
- Liberal input: accept design contributions, content, code, strategy, opinions, and criticism from a diverse team.
- Conservative output: produce clear, purposeful guidelines, components, patterns, and principles.
- This is Postel's Law applied at the organizational level.

### Actionable Design Guidelines

**Do:**
- Only ask for information that is absolutely necessary
- Handle cultural variations in form fields (name order, address format, hyphenated names)
- Provide humane, respectful error messages -- never say a name is "wrong"
- Design for responsive contexts (watch to TV)
- Plan for internationalization: text expansion (up to 300%), RTL/LTR, vertical text
- Account for user font size customization
- Embrace progressive enhancement: core content for all, enhancements layered on detected capabilities

**Don't:**
- Assume users will provide perfectly formatted input
- Design only for your native language
- Require more information than necessary
- Use overly restrictive form validation
- Assume anything about where users are, how they work, or what technology they use

### Key Consideration: Predict, Don't Assume

The mantra is: **"We can predict but must not assume."** Predict that users will have diverse devices, languages, accessibility needs, and input behaviors. But never assume a specific configuration. Build systems that gracefully handle whatever comes in.

### Connections to Other Laws

- **Miller's Law:** Both address reducing mental burden -- Miller's through organization, Postel's through flexible input acceptance
- **Hick's Law:** Decision fatigue in forms parallels Hick's focus on choice complexity. Asking only for what's necessary is a form of choice reduction.
- **Tesler's Law:** Postel's liberal acceptance requires the system to absorb complexity (Tesler's principle) so users don't have to

---

## 6. Peak-End Rule

**People judge an experience largely based on how they felt at its peak (the most emotionally intense point) and at its end, rather than on the total sum or average of every moment of the experience.**

### Psychology Origins

- **Who:** Daniel Kahneman, Barbara L. Fredrickson, Charles A. Schreiber, and Donald A. Redelmeier.
- **When:** 1993.
- **Publication:** "When More Pain Is Preferred to Less: Adding a Better End," *Psychological Science* 4, no. 6 (1993): 401-5.
- **The cold water experiment:** Participants submerged a hand in 14 degrees C water for 60 seconds (Trial 1). In Trial 2, they submerged the other hand for 60 seconds at 14 degrees C, then kept it submerged for an additional 30 seconds as water warmed to 15 degrees C. When asked which trial to repeat, participants chose Trial 2 -- the *longer* exposure -- because the slightly warmer ending created a better final memory.
- **Colonoscopy study (1996):** Kahneman and Redelmeier found patients evaluated discomfort based on the intensity at the worst moment and the final moment, regardless of procedure length or total pain variation. Published in *Pain* 66, no. 1 (1996): 3-8.
- **Colonoscopy follow-up (2003):** Redelmeier, Katz, and Kahneman randomly divided patients: one group got a normal colonoscopy; the other got the same procedure plus 3 extra minutes with the scope tip left in (no inflation/suction). The second group rated the experience as less unpleasant and was **more likely to return for subsequent procedures**. A less painful ending improved the memory of the entire experience. *Pain* 104, no. 1-2 (2003): 187-94.
- **Classification:** The peak-end rule is a **memory bias** (a type of cognitive bias). We remember representative snapshots, not comprehensive timelines.

### Key Formula or Model

```
Remembered Experience =/= Sum of all moments

Remembered Experience ~ Average of (Peak Emotion + End Emotion)

   Positive Peak (+)                    Positive End (+)
        |                                    |
   [----*---------*------*-------*-----------*]
        ^         ^      ^       ^           ^
        Peak     valley  valley  valley      End
        moment

   These two points ----^                    ^---- disproportionately
   define the memory                         define the memory
```

### Core Concepts for Designers

**Memory bias:** We do not recall the sum of how we felt during an experience. We recall the average of how we felt at peak emotional moments and at the end. Our memories are snapshots, not timelines.

**Negativity bias:** Humans register negative events more readily and dwell on them longer. Negative peaks are especially dangerous -- they are remembered more vividly than positive ones and can define a user's entire impression.

**Recency effect:** Items near the end of a sequence are easiest to recall, explaining the "end" component of the rule.

**Idleness aversion:** People dislike feeling like nothing is happening. Address with animations, progress indicators, and informational content during wait states.

**Operational transparency:** Showing users the inner workings of a system (e.g., "matching you with a driver" with a map animation) builds trust and reduces negative perception of wait times.

**Goal gradient effect:** People increase effort as they approach a goal. Show progress through clear steps so users feel continuous momentum.

### Real-World Design Examples

**Spotify Wrapped:**
- WHAT: Annual year-end feature showing users their listening stats, top artists, most-played songs, personalized "audio auras," and community rankings.
- WHY IT MATTERS: The end of the year is naturally reflective. Spotify creates a deliberately positive peak through deep personalization. Users introspect, feel connected to their identity through music, and share with others. This is a textbook creation of a memorable positive peak.

**Uber Express POOL (Wait Time Management):**
- WHAT: Waiting was inherent to the Express POOL model and could easily become a negative peak.
- WHAT THEY DID: Applied three behavioral science concepts:
  - *Idleness aversion:* Animations keep users informed and entertained
  - *Operational transparency:* Shows ETA and how it's calculated
  - *Goal gradient effect:* Each step clearly explained so users feel continuous progress
- RESULT: Reduced post-request cancellation rate. Concepts integrated into all Uber services.

**Duolingo (Gamified Milestones):**
- Levels, streaks, and celebrations create positive peaks at learning milestones. Legendary Level challenges reward users with new interface themes. Brand character through illustration, animation, and humor reinforces achievement.

**Mailchimp (Password Validation):**
- Real-time validation during account creation prevents the frustration of discovering errors after submission. Mitigates a potential negative peak during the crucial onboarding moment.

**404 Error Pages (Dribbble, Spotify, Pixar, GitHub):**
- Turn a negative moment into brand-building humor. Caveat: humor must be appropriate to context -- don't make a negative experience worse.

### Actionable Design Guidelines

**Do:**
- Identify the most emotionally intense points in the user journey and design to make them positive
- Ensure the final interaction leaves a lasting good impression
- Use personalization to create memorable peak moments (Spotify model)
- Address wait times with idleness aversion, operational transparency, and goal gradient cues (Uber model)
- Use journey mapping to visualize emotional peaks and valleys across the experience
- Mitigate negative peaks proactively (prevent errors rather than recover from them)

**Don't:**
- Ignore the ending of an experience -- it disproportionately shapes the user's overall memory
- Underestimate the power of negative peaks -- humans dwell on negatives more than positives
- Use humor inappropriately during genuinely frustrating moments

### Key Consideration: Negativity Bias Amplifies Bad Peaks

People register negative events more readily and dwell on them. A single frustrating moment (a confusing error, a lost form submission, a failed payment) can define a user's entire memory of your product -- regardless of how smooth every other moment was. Prevention is more effective than recovery.

### Connections to Other Laws

- **Jakob's Law:** Journey mapping uses personas (from Ch1) to establish the lens of the experience
- **Aesthetic-Usability Effect:** Both involve System 1 cognitive processing. The visceral aesthetic response and peak-end memory encoding both operate at the automatic, emotional level
- **Von Restorff Effect:** Peak-end concerns which *moments* are remembered; Von Restorff concerns which *items* are remembered. Both leverage memory encoding biases.

---

## 7. Aesthetic-Usability Effect

**Users often perceive aesthetically pleasing design as design that is more usable.**

### Psychology Origins

- **Who:** Masaaki Kurosu and Kaori Kashimura, Hitachi Design Center.
- **When:** 1995.
- **Publication:** "Apparent Usability vs. Inherent Usability," *CHI '95: Conference Companion on Human Factors in Computing Systems* (1995): 292-93.
- **The experiment:** Tested 26 ATM interface layout patterns with 252 participants. Each rated designs for both functionality and aesthetics on a 10-point scale. Result: participants' perception of usability was strongly influenced by perceived attractiveness. **Apparent usability correlated more with apparent beauty than with actual ease of use.**
- **Corroborating study:** Noam Tractinsky, Adi S. Katz, and Dror Ikar, "What Is Beautiful Is Usable," *Interacting with Computers* 13, no. 2 (2000): 127-45. Confirmed the effect.
- **Neuropsychological basis:** F. Gregory Ashby, Alice M. Isen, and And U. Turken (1999) established that aesthetically pleasing design creates a positive brain response that leads people to believe the design actually works better. *Psychological Review* 106, no. 3: 529-50.
- **50-millisecond finding:** Lindgaard, Fernandes, Dudek, and Brown (2006) showed people form an opinion about a website within **50 milliseconds**, with visual appeal as the primary factor. That opinion rarely changes with more time. *Behaviour and Information Technology* 25, no. 2: 115-26.

### Key Formula or Model

No mathematical formula. The conceptual model involves Kahneman's dual-process theory:

```
SYSTEM 1 (Fast, automatic)          SYSTEM 2 (Slow, deliberate)
- Operates in milliseconds          - Activated when System 1
- No voluntary control                struggles
- Forms first impressions           - Complex problem solving
- Visceral aesthetic response        - Focused attention, analysis
- "This looks good" -> "This        - Can override System 1 but
  must work well"                     requires effort
      |
      v
  50ms: Opinion formed
  Visual appeal = primary factor
  Rarely changes with more time
```

### Core Concepts for Designers

**Apparent usability vs. inherent usability:**
- *Inherent usability* = how well a design actually functions (objective)
- *Apparent usability* = how easy to use a design appears (subjective)
- Key finding: apparent usability correlates more with beauty than with actual ease of use

**First impressions are formed in 50 milliseconds.** Visual appeal is the primary factor. These impressions rarely change. This means visual design quality is not optional -- it's a critical determinant of how users perceive your product.

**Beauty creates tolerance.** Users are more forgiving of minor usability issues when the overall design is aesthetically pleasing. Good visual design buys you forgiveness.

**Beauty creates better performance.** The Sonderegger and Sauer study (2010) tested 60 adolescents on two functionally identical mobile phone simulations -- one attractive, one unattractive. The attractive phone received higher usability ratings AND led to **faster task completion times**. Beauty doesn't just change perception; it changes actual behavior.

### Real-World Design Examples

**Braun (Dieter Rams):**
- WHAT: Under design director Dieter Rams, guided by Bauhaus "form follows function." The Braun SK4 record player ("Snow White's Coffin") pioneered a new industrial design language where every detail had a functional purpose. The plexiglass cover wasn't just beautiful -- it solved the rattling observed with metal covers.
- WHY IT MATTERS: Braun demonstrated that functional minimalism and aesthetic beauty are not opposing forces. Products that are both beautiful and functional create lasting impressions. Braun influenced generations of designers.

**Apple (Continuing Braun's Legacy):**
- iPod echoes Braun T3 pocket radio. iPhone echoes Braun ET44 calculator. iMac echoes Braun LE1 loudspeaker.
- Apple's interfaces have usability issues, but people are more likely to overlook them due to the pleasing aesthetic. The aesthetic-usability effect is a competitive advantage.

**Sonderegger and Sauer Mobile Phone Study (Usability Testing Warning):**
- Two functionally identical phone simulations, different only in visual attractiveness.
- 60 adolescent participants.
- Attractive phone: higher usability ratings AND faster task completion.
- Implication: **beauty can mask usability problems in testing.** If your prototype is too polished, testers may not identify real issues.

### Actionable Design Guidelines

**Do:**
- Invest in visual design quality -- first impressions form in 50ms and rarely change
- Understand that good visual design buys forgiveness for minor usability shortcomings
- During usability testing, watch what users **do**, not just what they **say** -- performance and subjective ratings often diverge
- Synthesize usability test data as a group to avoid single-perspective bias
- Test with real representative users, not your own team

**Don't:**
- Use beauty as a substitute for actual usability
- Assume that because testers rated your product highly, it has no usability issues -- aesthetics may be masking problems
- Ship a polished-looking product without rigorous usability testing
- Ignore visual design because "only functionality matters" -- the science shows otherwise

### Key Consideration: Beauty Masking Usability in Testing

This is the most dangerous pitfall of the aesthetic-usability effect. Because beautiful designs receive higher usability ratings and faster task completion times, **usability test results can be skewed by visual polish**. Participants are more forgiving and less likely to report issues. Mitigation: ask questions that lead participants beyond aesthetics; observe behavior closely; compare self-reported ratings with actual task performance.

### Connections to Other Laws

- **Peak-End Rule:** Both involve System 1 processing. The visceral aesthetic response and peak-end memory encoding both operate at the automatic, emotional level (Kahneman's framework connects them)
- **Jakob's Law:** Familiar designs feel easier to use, reinforcing the aesthetic-usability effect
- **Miller's Law:** Cognitive processing capacity underlies both -- System 1 handles aesthetic judgment, System 2 handles complex analysis

---

## 8. Von Restorff Effect

**When multiple similar objects are present, the one that differs from the rest is most likely to be remembered.**

### Psychology Origins

- **Who:** Hedwig von Restorff, German psychiatrist and pediatrician.
- **When:** 1933.
- **Publication:** "Uber die Wirkung von Bereichsbildungen im Spurenfeld" (On the effect of domain formations in the trace field), *Psychologische Forschung* 18 (1933): 299-342.
- **The experiment:** Von Restorff used the **isolation paradigm**: participants presented with a list of categorically similar items best remembered ones that were distinctly different. Memory is improved for items that are visually or conceptually isolated from surrounding items.
- **Corroborating research:** Shelley E. Taylor and Susan T. Fiske (1978), "Salience, Attention, and Attribution," in *Advances in Experimental Social Psychology* 11: 249-88. Found that people are drawn to salient, novel, surprising, or distinctive stimuli.
- **Evolutionary basis:** Mark P. Mattson (2014) argued humans possess superior pattern processing capabilities compared to other species. *Frontiers in Neuroscience* 8: 265. Our ability to spot small differences was essential for survival and remains active in how we process interfaces.

### Key Formula or Model

No mathematical formula. The model is about strategic contrast:

```
   Similar   Similar   Similar   DIFFERENT   Similar   Similar
   [  A  ]   [  A  ]   [  A  ]   [  B  ]    [  A  ]   [  A  ]
                                     ^
                                     |
                              MOST REMEMBERED
                              (isolation effect)

Visual properties that create contrast:
  1. COLOR     -- different hue or saturation
  2. SHAPE     -- different form
  3. SIZE      -- larger or smaller than surroundings
  4. POSITION  -- placed in a strategic location
  5. MOTION    -- animation (with accessibility caveats)
  6. NEGATIVE SPACE -- whitespace isolation
```

### Core Concepts for Designers

**Selective attention:** At any moment, we're subjected to a plethora of sensory information. We focus on what's relevant and filter out the rest. This is a survival instinct. In interfaces, we must guide what users focus on.

**Recognition over recall:** It's easier to identify something when you see it than to retrieve it from memory without cues. The Von Restorff effect aids recognition by making important elements visually distinct.

**Banner blindness:** People ignore elements that look like ads. This is robust across three decades of research (Kara Pernice, Nielsen Norman Group, 2018). Critical warning: when visually differentiating content, you might accidentally make it look like an ad, causing users to ignore it.

**Change blindness:** People fail to notice significant changes when visual cues are weak or attention is focused elsewhere (Raluca Budiu, Nielsen Norman Group, 2018). If users need to notice a change, explicitly draw their attention to it.

**Accessibility considerations:**
- **Color contrast:** WCAG requires at least **4.5:1** ratio for normal text, **3:1** for large text (18pt+) or bold (14pt+)
- **Don't rely solely on color:** Use strokes, patterns, and shape for people with color vision deficiency
- **Motion sensitivity:** People with vestibular disorders, epilepsy, or migraine sensitivities can be harmed by motion-based contrast. Benign paroxysmal positional vertigo (BPPV) and labyrinthitis can cause dizziness, nausea, and headaches from screen motion.

### Real-World Design Examples

**Pricing Tables (Notion):**
```
+------------+  +================+  +------------+
|   Free     |  ||    Plus     ||  | Business   |
|            |  || "Most Popular"||  |            |
|  $0/mo     |  ||   $8/mo     ||  |  $15/mo    |
|            |  ||             ||  |            |
| [Get       |  || [GET        ||  | [Get       |
|  started]  |  || STARTED]    ||  |  started]  |
+------------+  +================+  +------------+
                       ^
  Multiple visual cues:
  - Darker button color
  - "Most popular" badge adds height
  - Positioned near center of display
```

**Confirmation Modals (Destructive Actions):**
```
POOR (no contrast):                 GOOD (with contrast):
+-------------------------+        +-------------------------+
| Delete your account?    |        | [!] Delete your account?|
|                         |        |                         |
| [Cancel]    [Delete]    |        | [Cancel]   [DELETE]     |
+-------------------------+        +-------------------------+
  Both buttons look the same.        Destructive action is
  Easy to hit the wrong one.         visually emphasized.
                                     Warning icon added.
```

**Google Material Design FAB (Floating Action Button):**
- Circular (distinct shape), floating above content (position), visually weighted (size)
- Consistency across Google products creates a recognizable pattern (also an example of Jakob's Law)

**iOS Notification Badges:**
- Red dots on app icons use color contrast to signal required attention. Effective "for better or worse" -- they grab attention but can also be intrusive.

**News Websites (Bloomberg, NYT, ProPublica, Boston Globe):**
- Featured articles use scale to break out of implied column layouts, drawing reader attention through size contrast.

### Actionable Design Guidelines

**Do:**
- Make important information or key actions visually distinctive
- Use multiple contrast properties together (color + shape + position) for maximum effect
- Ensure WCAG color contrast ratios (4.5:1 for text, 3:1 for large/bold text)
- Provide additional visual cues beyond color (strokes, patterns, shape) for accessibility
- Use focus indicators (thick-weight outlines) for keyboard navigation
- Emphasize destructive actions in confirmation dialogs with visual weight and warning icons

**Don't:**
- Rely exclusively on color to communicate contrast (excludes color-blind users)
- Use excessive emphasis -- too many emphasized items compete and dilute each other
- Make content look like advertisements (triggers banner blindness)
- Use motion for contrast without considering vestibular disorders and motion sensitivity
- Emphasize everything -- "the only thing worse than no contrast is way too much of it"

### Key Consideration: Too Much Contrast Defeats Itself

Overusing emphasis has two failure modes:
1. **Dilution:** When everything is emphasized, nothing stands out. Items compete with each other.
2. **Banner blindness:** Heavily emphasized content may be mistaken for ads and ignored entirely.

Contrast is a finite resource. Use it strategically on what truly matters.

### Connections to Other Laws

- **Jakob's Law:** Users instinctively look for familiar patterns (navigation, search, buttons) in common locations. The FAB's consistency across Google products is both Von Restorff (visual distinction) and Jakob's (familiar pattern).
- **Miller's Law:** Selective attention and working memory are both limited resources
- **Aesthetic-Usability Effect:** Both concern visual design influencing perception and behavior, from different angles (overall beauty vs. strategic contrast)
- **Peak-End Rule:** Peak-end concerns which *moments* are remembered; Von Restorff concerns which *items* are remembered. Both exploit memory encoding biases.

---

## 9. Tesler's Law

**For any system there is a certain amount of complexity that cannot be reduced.**

Also known as the **Law of Conservation of Complexity**.

### Psychology Origins

- **Who:** Larry Tesler, computer scientist at Xerox PARC and later Apple.
- **When:** Mid-1980s.
- **Context:** Tesler was helping develop the language of interaction design -- principles, standards, and best practices for interactive systems. This work was key to the development of the desktop computer and desktop publishing.
- **How it happened:** While working on the Mac app object-oriented framework at Apple, Tesler created an intermediate "generic application" that let developers build their own apps by modifying it. He defined the Law of Conservation of Complexity to sell this idea to Apple management and independent software vendors. The express purpose: establish standards in mass-market software and reduce complexity for customers.
- **Tesler's core reasoning:** "If a million users each waste a minute a day dealing with complexity that an engineer could have eliminated in a week by making the software a little more complex, you are penalizing the user to make the engineer's job easier."

### Key Formula or Model

No mathematical formula. The model is about **complexity transfer**:

```
Total Complexity = CONSTANT (for a given process)

It can only be TRANSFERRED, not eliminated:

Option A:                           Option B:
+------------------+                +------------------+
| USER bears it    |                | SYSTEM bears it  |
|                  |                |                  |
| Complex forms    |                | Auto-fill, smart |
| Manual data entry|                | defaults, AI     |
| Learning curves  |                | suggestions      |
| Configuration    |                | Progressive      |
|                  |                | disclosure        |
| = frustration,   |                |                  |
|   confusion,     |                | = design/dev     |
|   abandonment    |                |   effort          |
+------------------+                +------------------+

     BAD                                 GOOD
```

### Core Concepts for Designers

**Conservation, not elimination:** Complexity doesn't disappear. When you simplify something for the user, you are moving the complexity to the design/development side. The question is always: who should bear the burden?

**Complexity bias:** Our tendency to favor complex solutions over simple ones, because complexity feels more sophisticated. Demonstrated by Farris and Revlin (1989, *Memory & Cognition*): participants given the rule "list three ascending numbers" consistently guessed more complex rules. When you're drawn to a complex solution, it's often a sign you don't understand the problem well enough.

**Paradox of the Active User (Mary Beth Rosson and John Carroll, 1987, IBM User Interface Institute):** Users never read manuals. They start using software immediately, motivated to complete tasks right away rather than investing upfront learning time. This is a paradox because they'd save time long-term by learning first. Design implication: don't build for an idealized, rational user. Provide contextual guidance throughout the experience (tooltips, inline help) instead of relying on documentation.

**Progressive disclosure:** Display only important actions or content by default. Make additional features easily accessible through dropdowns, accordions, toggles, or secondary screens. This reduces clutter, confusion, and cognitive load.

**Intent-based interaction (AI):** Natural language interfaces represent a new paradigm where users describe outcomes rather than issuing commands through a GUI. The complexity of the system is completely abstracted. This democratizes access to sophisticated features -- users who know *what* they want but not *how* to do it can simply describe their goal.

### Real-World Design Examples

**Gmail -- Auto-Population and Smart Features:**
- WHAT: Email requires two pieces of info: sender (you) and recipient. Gmail pre-populates the sender (it knows your address) and suggests recipients as you type (from contacts and prior emails). Smart Compose suggests words/phrases to finish sentences. Smart Reply suggests quick responses based on email content.
- WHY IT MATTERS: The complexity isn't gone -- it's absorbed by the system. Each feature required significant engineering effort, but the user's experience is dramatically simpler.

**Ecommerce Checkout -- Address Inheritance:**
- "Shipping address same as billing" checkbox. One simple toggle eliminates duplicate data entry. The complexity of implementing this feature is absorbed by engineers.

**Apple Pay:**
- Once set up, users can purchase items with a single verification. No need to enter card numbers, addresses, or any additional info. The customer's experience approaches zero complexity; the system absorbs everything.

**Amazon Go Stores:**
- WHAT: Walk in, grab items, walk out. No scanning, no checkout lines, no in-store payment. Receipt arrives later; Amazon account is charged.
- WHY IT MATTERS: This is perhaps the most extreme example of Tesler's Law. Machine learning, computer vision, and AI provide near-zero user complexity at the cost of massive system-side engineering complexity.

**Mixpanel Spark -- Natural Language Analytics:**
- Users conduct data analysis by asking questions in natural language. The analytical complexity is completely abstracted. Users who know what they want to learn but don't know how to use analytical tools can simply ask.

**Stripe Navigation -- Progressive Disclosure:**
- Hovering over a nav item reveals a dropdown of links. Simple default interface; depth available on demand.

### Actionable Design Guidelines

**Do:**
- Ensure the system absorbs as much irreducible complexity as possible
- Use progressive disclosure to show only what's needed by default
- Provide contextual guidance (tooltips, inline help) rather than relying on manuals
- Consider AI/natural language interfaces for complex products
- When drawn to a complex solution, pause -- you may need to understand the problem better

**Don't:**
- Simplify interfaces to the point of abstraction (removing necessary functionality)
- Design for an idealized, rational user who reads documentation
- Penalize millions of users to save engineering effort ("if a million users each waste a minute...")
- Assume that removing UI elements equals reducing complexity -- you may just be hiding it poorly

### Key Consideration: Complexity Bias in Designers

The biggest pitfall is the designer's own complexity bias. We tend to favor intricate solutions because complexity feels sophisticated. When you find yourself gravitating toward a complex solution, it's a signal that you may not have enough information about the actual problem. Spend more time with the problem. Observe users. Deepen your understanding. Simple solutions that work require deeper understanding than complex solutions that don't.

### Connections to Other Laws

- **Hick's Law:** When you simplify the interface (Hick's), the complexity must go somewhere (Tesler's). Smart TV remotes → on-screen menus is a direct example.
- **Miller's Law:** Progressive disclosure reduces cognitive load (Miller's) by hiding non-essential info (Tesler's complexity transfer)
- **Doherty Threshold:** Both address user experience of friction. Tesler's focuses on what complexity; Doherty focuses on temporal complexity (response time).
- **Peak-End Rule:** Complexity bias is a cognitive bias, connecting to the broader cognitive bias framework introduced in Ch6.

---

## 10. Doherty Threshold

**Productivity soars when a computer and its users interact at a pace (<400 ms) that ensures that neither has to wait on the other.**

### Psychology Origins

- **Who:** Walter J. Doherty and Ahrvind J. Thadani, IBM.
- **When:** 1982.
- **Publication:** "The Economic Value of Rapid Response Time," *IBM Systems Journal*.
- **Prior standard:** In early desktop computing, **2 seconds** was considered acceptable response time, reasoning that users needed time to think about their next action.
- **What they found:** Doherty and Thadani challenged this by demonstrating that "productivity increases in more than direct proportion to a decrease in response time" when the threshold drops below 400ms. The relationship is **disproportionate** -- small reductions in response time yield outsized productivity gains.
- **Their claim:** "When a computer and its users interact at a pace that ensures that neither has to wait on the other, productivity soars, the cost of the work done on the computer tumbles, employees get more satisfaction from their work, and its quality tends to improve."

### Key Formula or Model

No formal formula, but there is a clear perception hierarchy:

```
Response Time    |  User Perception
-----------------+------------------------------------------------
< 100ms          |  INSTANTANEOUS. Feels like direct manipulation.
100-300ms        |  Delay begins to be perceptible. User feels
                 |  slightly less in control.
< 400ms          |  DOHERTY THRESHOLD. Productivity soars.
                 |  Neither user nor system waits on the other.
~1,000ms (1s)    |  Attention wanders. Working memory starts losing
                 |  task-relevant info. Cognitive load increases.
~10,000ms (10s)  |  ATTENTION LIMIT. User wants to do other things.
                 |  Anything beyond this requires progress indicators
                 |  with time estimates.

    Productivity
         ^
         |         ***
         |       **   *
         |     **      *
         |   **         *
         |  *            ***
         | *                 ****
         |*                      ****___________
         +----------------------------------------> Response Time
         0    400ms    1s     2s     5s    10s+

    "Productivity increases in MORE than direct
     proportion to a decrease in response time"
```

### Core Concepts for Designers

**Performance is a design feature.** Speed is often dismissed as a technical concern, but it is an essential design feature core to good user experiences. Emotions turn to frustration when users face slow processing, lack of feedback, or excessive load times.

**Page weight is growing:** Average desktop page weight went from 634 KB (2010-2011) to over 2,286 KB (2023). Mobile went from 260 KB to 2,007 KB. Heavier pages = longer load times = worse experiences.

**Perceived performance:** When actual processing exceeds 400ms (and you can't speed it up), you can still provide feedback to create the *perception* of faster performance. Techniques include skeleton screens, blur-up images, progress bars, and optimistic UI patterns.

**Flow state (Mihaly Csikszentmihalyi, 1970):** A mental state of energized focus, full involvement, and enjoyment during an activity. Flow occurs when difficulty balances with skill. People in flow are **up to 5x more productive** (Gold and Ciorciari, 2020). Maintaining sub-400ms response times helps users stay in flow. Slow responses break it by introducing frustration and cognitive overhead.

**Strategic friction (when too fast is bad):**
1. **Missed changes:** A change too fast may be completely missed
2. **Comprehension failure:** Speed that doesn't allow mental processing
3. **Mistrust:** If a "security scan" completes instantly, users may doubt its thoroughness

Purposefully adding delay can increase perceived value and trust. Confirmation modals activate **System 2 thinking** (deliberate, evaluative), reducing errors.

**Optimistic UI:** Show the result of an action immediately (assume success) while processing happens in the background. Roll back only if the action fails. Instagram uses this for comments -- they appear instantly even though posting is still in progress.

### Real-World Design Examples

**Instagram -- Skeleton Screens:**
- WHAT: When content loads, Instagram displays placeholder blocks in the shape of content that will appear. Blocks are progressively replaced with actual text and images.
- WHY IT MATTERS: Reduces the impression of waiting. Prevents the jarring experience of content jumping around as adjacent material loads. Makes the site *feel* faster even if actual load time is unchanged.

```
SKELETON SCREEN:                  LOADED:
+---------------------------+     +---------------------------+
| [====] [===========]     |     | [@user] Just posted!      |
| +---------------------+  |     | +---------------------+   |
| |                     |  |     | |                     |   |
| |   [ grey block ]    |  |     | |   [actual image]    |   |
| |                     |  |     | |                     |   |
| +---------------------+  |     | +---------------------+   |
| [====] [====] [====]     |     | [heart] [comment] [share] |
| [====================]   |     | 1,234 likes               |
+---------------------------+     +---------------------------+
```

**Unsplash -- "Blur Up" Technique:**
1. Load a tiny version of the image
2. Scale it up in the target space
3. Apply Gaussian blur to hide pixelation
4. When the full image loads, fade it in behind the blurred version
- Benefits: faster perceived load, prevents page jumping

**Progress Bars:**
- Research (Brad Myers, 1985) shows that simply *seeing* a progress bar makes wait times more tolerable, regardless of accuracy.
- For waits exceeding 10 seconds, augment with time estimates and task descriptions.

**Gmail Loading Animation:**
- Animated logo + simple progress bar during app load. Creates perception of shorter wait time.

**Instagram -- Optimistic UI for Comments:**
- Comments appear immediately after posting, before server confirmation. Processing happens in background. Error shown only if posting fails. Perception: instant response.

**Google Privacy Checkup -- Strategic Delay:**
- Account privacy scan adds time beyond what's technically needed to instill trust that the scan is thorough. More time = perceived thoroughness.

### Actionable Design Guidelines

**Do:**
- Provide system feedback within 400ms to maintain productivity and flow
- Use skeleton screens, blur-up techniques, and progress bars to improve perceived performance
- Consider optimistic UI patterns for actions that almost always succeed
- Show time estimates and task descriptions for waits exceeding 10 seconds
- Treat speed as an essential design feature, not just a technical concern
- Design for flow: provide feedback, optimize responsiveness, remove unnecessary friction

**Don't:**
- Ignore page weight -- monitor and optimize asset sizes
- Assume that actual speed improvements are the only way to improve perceived performance
- Make responses too fast when trust, comprehension, or noticeability matter
- Let waits exceeding 1 second pass without any visual feedback
- Treat performance optimization as solely an engineering concern

### Key Consideration: When Fast Is Wrong

Most response time problems involve slowness, but too-fast responses can also fail:
- A security scan that completes instantly feels untrustworthy
- A change that happens too quickly may go unnoticed (change blindness)
- A confirmation that flashes and disappears may not register

Strategic friction -- deliberate delays, confirmation modals, animated transitions -- can increase perceived value, build trust, and prevent errors. The goal is not always "fastest possible" but "appropriate pace."

### Connections to Other Laws

- **Aesthetic-Usability Effect:** System 2 thinking (from Ch7) is referenced in the friction discussion. Confirmation modals activate deliberate evaluation.
- **Miller's Law:** Delays beyond 1 second cause working memory to lose task-relevant information, connecting to working memory limits
- **Tesler's Law:** Both address user experience of friction. Tesler's focuses on *what* complexity; Doherty focuses on *temporal* complexity.
- **Peak-End Rule:** Slow response times can create negative emotional peaks that define the user's memory of the experience
- **Jakob's Law:** Users' expectations about response time are shaped by experiences with other systems

---

## Quick Reference Matrix

```
+---------------------------+------------------+----------------------------------+
| Law                       | Core Domain      | Key Number / Principle           |
+---------------------------+------------------+----------------------------------+
| 1. Jakob's Law            | Mental models    | Users expect your site to work   |
|                           |                  | like others they know            |
+---------------------------+------------------+----------------------------------+
| 2. Fitts's Law            | Motor behavior   | ID = log2(2D/W)                  |
|                           |                  | Bigger + closer = easier         |
+---------------------------+------------------+----------------------------------+
| 3. Miller's Law           | Working memory   | ~7 +/- 2 chunks (revised to ~4) |
|                           |                  | Chunk, don't limit               |
+---------------------------+------------------+----------------------------------+
| 4. Hick's Law             | Decision time    | RT = a + b log2(n)              |
|                           |                  | More choices = slower decisions   |
+---------------------------+------------------+----------------------------------+
| 5. Postel's Law           | System robustness| Liberal input, conservative      |
|                           |                  | output                           |
+---------------------------+------------------+----------------------------------+
| 6. Peak-End Rule          | Memory/emotion   | Peak + End = remembered          |
|                           |                  | experience                       |
+---------------------------+------------------+----------------------------------+
| 7. Aesthetic-Usability    | Perception       | Beautiful = perceived as usable  |
|                           |                  | (50ms first impression)          |
+---------------------------+------------------+----------------------------------+
| 8. Von Restorff Effect    | Attention/memory | The different one gets           |
|                           |                  | remembered                       |
+---------------------------+------------------+----------------------------------+
| 9. Tesler's Law           | Complexity       | Complexity is conserved, not     |
|                           |                  | eliminated -- only transferred   |
+---------------------------+------------------+----------------------------------+
| 10. Doherty Threshold     | Response time    | < 400ms = productivity soars     |
|                           |                  | (disproportionate gains)         |
+---------------------------+------------------+----------------------------------+
```

---

## Cross-Law Connections Map

```
Cognitive Load is the thread connecting most laws:

  Miller's (organize) --+
                        |
  Hick's (reduce)   ---+---> COGNITIVE LOAD <---+--- Doherty (speed)
                        |                        |
  Jakob's (familiar) --+                        +--- Tesler's (transfer)
                                                 |
                                                 +--- Postel's (forgive)

Memory & Perception cluster:

  Peak-End Rule (which MOMENTS remembered)
       |
       +--- Von Restorff (which ITEMS remembered)
       |
       +--- Aesthetic-Usability (first IMPRESSIONS formed)
             |
             +--- All three involve System 1 (automatic) processing
```

**Shared foundation:** All 10 laws share the premise that technology should adapt to humans -- not the reverse. This principle, born from Fitts and Chapanis's WWII cockpit investigation, is the philosophical bedrock of human-centered design.
