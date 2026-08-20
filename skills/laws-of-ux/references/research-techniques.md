# UX Research Techniques from Laws of UX

This reference documents all UX research techniques described across "Laws of UX" by Jon Yablonski. Each chapter pairs a psychological law with a practical research method. These are step-by-step techniques for understanding users, grounded in real-world application.

---

## Table of Contents

1. [User Personas](#user-personas) (Ch1 - Jakob's Law)
2. [Contextual Inquiry](#contextual-inquiry) (Ch2 - Fitts's Law)
3. [Card Sorting](#card-sorting) (Ch4 - Hick's Law)
4. [User Interviews](#user-interviews) (Ch5 - Postel's Law)
5. [Journey Mapping](#journey-mapping) (Ch6 - Peak-End Rule)
6. [Usability Testing](#usability-testing) (Ch7 - Aesthetic-Usability Effect)
7. [Eye Tracking](#eye-tracking) (Ch8 - Von Restorff Effect)
8. [Design Principles Workshop](#design-principles-workshop) (Ch11 - Applying Principles)

---

## User Personas

**From:** Chapter 1 (Jakob's Law)
**Purpose:** Eliminates the vagueness of "the user" by creating shared, research-grounded representations of specific audience segments. Fosters empathy and alignment across the team in ways that abstract user descriptions cannot. Surfaces mental models, needs, motivations, and behaviors that each team member would otherwise interpret differently.
**When to use:**
- When the team keeps saying "the user" but everyone pictures someone different
- When prioritizing features and you need a concrete reference for whose needs matter most
- When onboarding new team members who need to understand target audiences quickly
- Before design work begins, to anchor decisions in real user characteristics

**Process:**

1. **Conduct user research first.** Gather data from real users through interviews, surveys, contextual inquiries, or analytics. This is non-negotiable -- the entire value of personas depends on grounding them in reality.

2. **Identify patterns.** Analyze your research data to find clusters of users who share similar traits, behaviors, frustrations, and goals. Each cluster becomes the basis for one persona.

3. **Build the persona card.** Each persona contains three sections:

   - **Info:** Photo, memorable tagline, name, age, occupation. Creates a realistic representation of a specific group within the target audience. The data here should reflect the similarities shared by this group.

   - **Details:** A short bio creating a deeper narrative. Behavioral qualities. Frustrations specific to this group. Goals and motivations. Tasks the user performs while using the product. This section builds empathy and aligns focus on characteristics that impact what is being designed.

   - **Insights:** Frames the attitude of the user. Adds an additional layer of context providing further definition of the persona and their mindset. Often includes direct quotes from user research.

4. **Validate and share.** Review personas with the broader team, check them against the research data, and distribute them as shared artifacts.

**ASCII Diagram -- Persona Card Template:**

```
+----------------------------------------------------------+
|  [Photo]   PERSONA NAME                                  |
|            "Memorable tagline from research"              |
|            Age: __  |  Occupation: __________            |
|----------------------------------------------------------|
|  INFO                                                    |
|  Location: ________    Device: __________                |
|  Tech comfort: ____    Usage frequency: _____            |
|----------------------------------------------------------|
|  DETAILS                                                 |
|  Bio: Short narrative about this person's context        |
|                                                          |
|  Behaviors:  * _______________                           |
|              * _______________                            |
|                                                          |
|  Frustrations:  * _______________                        |
|                 * _______________                         |
|                                                          |
|  Goals:  * _______________                               |
|          * _______________                                |
|----------------------------------------------------------|
|  INSIGHTS                                                |
|  "Direct quote from user research that captures          |
|   this persona's attitude or mindset."                   |
|                                                          |
|  Mindset:  * _______________                             |
|            * _______________                              |
+----------------------------------------------------------+
```

**Pitfalls:**

- **The fictional persona trap.** This is the critical caveat from the book: details MUST be based on research conducted with real users. Completely fictional personas can guide the team in the same direction, but it might not be the right direction if it is not grounded in research from actual users. A persona built on assumptions risks steering the entire team toward solving the wrong problems.
- **Self-referential thinking.** Teams unconsciously design for themselves rather than for users. Personas exist specifically to counteract this -- but only if they are consulted regularly in design decisions.
- **Stale personas.** Personas created once and never updated become decorative artifacts. They must evolve as you learn more about users.
- **Too many personas.** If every segment gets a persona, none of them become memorable. Focus on the most significant segments.

**Connection to Laws:**

- **Jakob's Law:** Personas reveal users' mental models -- the accumulated expectations from other products. Understanding these mental models is the foundation for applying Jakob's Law (designing in alignment with what users already know). The chapter states that the task of shrinking the gap between designers' mental models and those of users is "one of the biggest challenges designers face," and personas are the primary tool for bridging that gap.
- **Miller's Law:** Persona details about tech comfort and usage patterns inform how to chunk content for different user segments.

---

## Contextual Inquiry

**From:** Chapter 2 (Fitts's Law)
**Purpose:** Uncovers hidden insights about observed participants' work that are not available through other research methods. Unlike user interviews, which rely on users' ability to recall and explain a process they are removed from at that moment, contextual inquiry allows for direct observation of the work as it happens, providing a more accurate and detailed understanding of processes, workarounds, and environmental constraints.
**When to use:**
- When you need to understand how people actually work, not how they say they work
- When investigating complex workflows with physical and digital components intertwined
- When existing research (surveys, interviews) leaves gaps in understanding the "how" and "why" behind user behavior
- When designing for contexts where environment and physical setup matter (workstations, cockpits, operating rooms, retail environments)

**Process:**

**Phase 1 -- Primer**

Ease the participant into the session. This phase sets the tone and establishes trust.

1. Introduce yourself and your role.
2. State the goals of the inquiry clearly and honestly.
3. Communicate what the participant can expect during the session -- what will happen, how long it will take, what you will be doing.
4. Let participants know their feedback is confidential.
5. Answer any questions the participant has before beginning.

**Phase 2 -- Contextual Interview**

This is the core of the inquiry. Transition by explicitly explaining what will happen and what you need from the participant.

1. Tell the user you will watch while they work and may interrupt to discuss interesting observations.
2. Let them know that if it is a bad time for interruption, they can communicate this.
3. Once the interview begins, follow a cycle of **watch and learn, then initiate discussion** when needed.
4. Stop the participant to discuss observations you want to explore further or clarify.
5. Ask **open-ended questions** that let the participant give details about why they took a certain action.
6. Focus on understanding underlying processes and external resources being used.
7. Discuss both standard steps and uncommon variations.
8. Confirm or correct your interpretations with the user, but avoid doing this too often as it may bias their future behaviors. Save deeper interpretive questions for Phase 3.

**Phase 3 -- Wrapping Up**

1. Ask any clarifying questions you deferred from Phase 2.
2. Review your notes and summarize your interpretation of the observed processes.
3. Present your understanding to the participant for final clarifications.
4. This is the opportunity for users to correct and clarify any misunderstandings about the observed processes.

**ASCII Diagram -- Contextual Inquiry Session Flow:**

```
PHASE 1: PRIMER             PHASE 2: CONTEXTUAL INTERVIEW          PHASE 3: WRAP-UP
+------------------+        +-----------------------------------+   +-----------------+
| Introduce self   |        |                                   |   | Ask deferred    |
| State goals      |------->|   +-------+       +-----------+   |-->| questions       |
| Set expectations |        |   |       |       |           |   |   |                 |
| Ensure           |        |   | WATCH |------>| DISCUSS   |   |   | Summarize your  |
|  confidentiality |        |   | & LEARN|<------| & CLARIFY |   |   | interpretation  |
| Answer questions |        |   |       |       |           |   |   |                 |
+------------------+        |   +-------+       +-----------+   |   | Get corrections |
                            |       ^               |           |   | and final       |
                            |       |    (repeat)    |           |   | clarifications  |
                            |       +----------------+           |   +-----------------+
                            +-----------------------------------+
```

**Pitfalls:**

- **Biasing through over-interpretation.** Asking participants to validate your interpretations too frequently during Phase 2 can change their subsequent behavior. They may start performing for you rather than working naturally.
- **Observer presence effect.** Your physical presence changes how people work. Minimize this by being as unobtrusive as possible and giving participants time to settle into their natural workflow.
- **Asking closed or leading questions.** Stick to open-ended questions: "Tell me about what you just did" rather than "Did you click that because you thought it would save?"
- **Skipping uncommon variations.** Standard workflows are easy to observe, but the edge cases and workarounds reveal the deepest insights. Actively probe for "what happens when things go differently."
- **Neglecting the environment.** Contextual inquiry is valuable precisely because it happens in situ. Note the physical setup, ambient conditions, interruptions, tools within reach, and anything else that shapes the work.

**Connection to Laws:**

- **Fitts's Law:** The technique is historically rooted in Fitts's Law itself. Paul Fitts and Alphonse Chapanis conducted what was essentially the first contextual inquiry during WWII when they investigated why pilots were crashing. Instead of accepting "pilot error," they observed pilots in context and discovered that identical flap and landing gear controls caused confusion under stress. Their solution -- shape coding (differentiating knobs by feel) -- came directly from contextual observation. This investigation gave birth to the entire field of human factors engineering and the principle that machines should be designed to account for human limitations, rather than assuming perfect conditions and rationality.
- **Jakob's Law:** Contextual inquiry reveals users' existing mental models in action, which directly informs how to apply Jakob's Law.

---

## Card Sorting

**From:** Chapter 4 (Hick's Law)
**Purpose:** Identifies users' expectations regarding information architecture by revealing how they naturally categorize and label content. This is the primary method for designing navigation and content structures that align with users' mental models rather than internal organizational structures.
**When to use:**
- When designing or redesigning information architecture (navigation, menus, content groupings)
- When the team disagrees about how to organize content and needs user data to resolve it
- When you suspect that internal jargon or organizational structure is leaking into the product's navigation
- When the number of content items has grown and you need to understand how users expect them grouped

**Process:**

There are four varieties: open vs. closed, moderated vs. unmoderated. The process below describes a **moderated open card sort** (the most common type):

**Step 1: Identify Topics**

Identify the topics that participants will organize. These should represent the main content within your information architecture, with each item written on an individual card (physical or digital).

**WARNING -- Labeling bias:** Avoid labeling topics with the same or similar words. If cards share terminology, participants will be biased toward grouping them together based on the label rather than on their understanding of the content. (Cited: Jakob Nielsen, "Card Sorting: Pushing Users Beyond Terminology Matches," Nielsen Norman Group, 2009.)

**Step 2: Organize Topics**

Have participants organize topics, one at a time, into groupings that make sense to them based on their own mental models.

- It is common (and recommended) to have participants **think out loud** during this phase. Their verbal reasoning provides valuable insight into thought processes that the final arrangement alone cannot reveal.
- Do not guide or suggest groupings. Let participants struggle if needed -- the struggle itself is data.

**Step 3: Name Categories**

Once topics are organized into groups, ask participants to name each group based on the term they think best describes it.

- This step is critical: it reveals each participant's mental model and helps determine what to label categories within your information architecture.
- Record the exact language participants use. User vocabulary often differs significantly from internal team vocabulary.

**Step 4: Debrief Participants (optional but recommended)**

Ask participants to explain their rationale for each grouping.

- This uncovers why each participant made their decisions.
- Identifies any difficulties they experienced during the sorting process.
- Gathers thoughts on any topics that remained unsorted (unsorted items are important data points -- they may indicate confusing labels or content that does not fit the user's mental model).

**Note on closed sorts:** In a closed card sort, the groups (categories) are predefined by the researcher. Participants only sort items into existing categories. Use closed sorts when you already have a proposed structure and want to validate it.

**ASCII Diagram -- Card Sorting Process and Variants:**

```
                        CARD SORTING

     +------------------+     +------------------+
     |   OPEN SORT      |     |   CLOSED SORT    |
     |                  |     |                  |
     | Participants     |     | Researcher       |
     | CREATE their     |     | DEFINES the      |
     | own categories   |     | categories       |
     +--------+---------+     +--------+---------+
              |                        |
              +----------+-------------+
                         |
              +----------v-----------+
              |  MODERATED?          |
              |                      |
              |  YES: Researcher     |
              |  observes, probes,   |
              |  asks follow-ups     |
              |                      |
              |  NO: Participants    |
              |  complete remotely,  |
              |  no observation      |
              +----------+-----------+
                         |
     STEP 1              v
     +-------------------------------------------+
     | IDENTIFY TOPICS                           |
     | Write each content item on a card         |
     | Avoid shared terminology across cards     |
     +-------------------------------------------+
              |
     STEP 2  v
     +-------------------------------------------+
     | ORGANIZE TOPICS                           |
     | Participants sort cards into groups        |
     | Think-aloud protocol encouraged            |
     +-------------------------------------------+
              |
     STEP 3  v
     +-------------------------------------------+
     | NAME CATEGORIES                           |
     | Participants label each group              |
     | Record exact user vocabulary               |
     +-------------------------------------------+
              |
     STEP 4  v
     +-------------------------------------------+
     | DEBRIEF (recommended)                     |
     | Explain rationale for groupings            |
     | Discuss unsorted items                     |
     | Surface difficulties encountered           |
     +-------------------------------------------+
```

**Pitfalls:**

- **Labeling bias.** The most explicitly warned-about pitfall in the book. If card labels share vocabulary, participants group by words rather than by meaning. This produces architectures that look logical on the surface but do not reflect genuine mental models.
- **Researcher influence in moderated sorts.** Facial expressions, body language, or verbal cues from the moderator can guide participants toward "correct" answers. Stay neutral.
- **Small sample sizes leading to false patterns.** Card sort results from a handful of participants can show patterns that do not generalize. Complement with larger unmoderated sorts when possible.
- **Ignoring unsorted cards.** Cards that participants cannot place are some of the most valuable data points. They indicate content that is confusing, poorly labeled, or does not fit users' mental models.
- **Assuming one sort solves architecture permanently.** Information architecture should be revisited as content and user needs evolve.

**Connection to Laws:**

- **Hick's Law:** Card sorting directly addresses the core problem Hick's Law identifies: the time to make a decision increases with the number and complexity of choices. If information architecture does not match users' expectations, every navigation decision becomes harder and slower. Card sorting ensures the structure reduces decision time by aligning with users' natural categorization.
- **Miller's Law:** The groupings that emerge from card sorting are natural "chunks" -- how users naturally bundle related information. This connects to Miller's Law's principle that organized chunks are easier to process than flat lists.
- **Jakob's Law:** The categories users create and the labels they assign reveal their mental models, which are shaped by their cumulative experience with other products (Jakob's Law).

---

## User Interviews

**From:** Chapter 5 (Postel's Law)
**Purpose:** A quick and effective method for collecting qualitative data in a one-on-one session. Interviews uncover what users think about a site, application, product, or process -- including what content is memorable, what is important, and ideas for improvement. Unlike surveys, interviews allow follow-up questions that explore unexpected insights. Unlike analytics, they reveal the "why" behind behavior.
**When to use:**
- Before design begins, to understand the problem space from the user's perspective
- To enrich a contextual inquiry study with additional verbal data
- At the end of a usability test, to collect verbal responses related to observed behaviors
- When you need to understand attitudes, beliefs, and mental models rather than behavior alone
- When exploring a new domain where you do not yet know enough to write a good survey

**Process:**

**Step 1: Define the Goal of the Interview**

What are you or your stakeholders hoping to learn? The goal must be concise and related to a specific aspect of users' behavior or attitudes.

- BAD goal: "Learn more about our users." (Too broad, too ambiguous. Will produce scattered, unfocused data.)
- GOOD goal: "Learn how doctors share patient medical history with fellow doctors, and where they feel there are challenges and opportunities." (Specific, actionable, will produce focused insights.)

**Step 2: Prepare Your Discussion Guide**

Prepare questions beforehand that focus around the goal. But treat this as a guide, not a rigid script.

- Do not be afraid to ask relevant follow-up questions based on participant responses.
- A natural, free-flowing conversation can lead to unexpected, fruitful insights.
- A general guide of themes to discuss can sometimes be more useful than a list of rigid questions.

**Step 3: Build Rapport with the Interviewee**

Make the interviewee feel comfortable before diving into substantive questions.

- Start by asking about themselves -- where they live, what they do, whether they have done anything like this before.
- Reassure them that there are no right or wrong answers.
- Address any questions they may have.
- Let them know the interview is in no way a test of their knowledge or abilities.
- People are more likely to open up and provide valuable information once they are relaxed and trust the interviewer.

**Step 4: Avoid Leading Questions**

The quality of your data depends entirely on the quality of your questions.

Examples of **BAD questions** (and why):
- "Do you like the new feature?" (Closed yes/no question. Also implies they should like it.)
- "Don't you think the navigation is confusing?" (Leading -- suggests the expected answer.)
- "How was your experience?" (Too vague to produce actionable insight.)

Examples of **GOOD questions** (and why):
- "Tell me about the last time you used [feature]." (Open-ended, asks for specific recall.)
- "What was going through your mind when you [observed action]?" (Explores thought process without suggesting an answer.)
- "How do you currently handle [task]?" (Understands existing behavior and workarounds.)
- "What, if anything, would you change about [process]?" (Open-ended, non-leading.)

Key framing: Open questions start with "what," "how," "when" -- or "tell me about X." Be mindful of how you frame questions -- how we ask can sometimes influence the response, which must be avoided for accurate data.

**ASCII Diagram -- Interview Flow:**

```
+-------------------+    +-------------------+    +-------------------+
|  1. DEFINE GOAL   |    |  2. PREPARE       |    |  3. BUILD         |
|                   |--->|   DISCUSSION      |--->|   RAPPORT         |
|  Specific, not    |    |   GUIDE           |    |                   |
|  "learn more      |    |                   |    |  About them first |
|  about users"     |    |  Themes > rigid   |    |  No right/wrong   |
|                   |    |  questions        |    |  Not a test       |
+-------------------+    +-------------------+    +--------+----------+
                                                           |
                                                           v
                                              +-------------------+
                                              |  4. CONDUCT       |
                                              |   INTERVIEW       |
                                              |                   |
                                              |  Open-ended Qs    |
                                              |  Follow-up freely |
                                              |  NEVER lead       |
                                              |                   |
                                              |  "Tell me about"  |
                                              |  "What..." "How..." |
                                              |  NOT "Do you..."  |
                                              |  NOT "Don't you   |
                                              |       think..."   |
                                              +-------------------+
```

**Pitfalls:**

- **Leading questions.** The single most emphasized pitfall. Leading questions contaminate your data. Once a participant has been led, the rest of their responses may be colored by the suggestion.
- **Closed questions.** Yes/no questions kill the conversation and produce thin data. Every question should invite elaboration.
- **Skipping rapport-building.** Jumping straight into substantive questions before the participant feels comfortable produces guarded, surface-level responses.
- **Goals that are too broad.** "Learn more about our users" will produce a scattered, unfocusable data set. Narrow the goal to a specific behavior, attitude, or process.
- **Rigid adherence to the script.** The discussion guide is a safety net, not a railroad track. The most valuable insights often come from unexpected follow-up questions. If a participant says something surprising, pursue it.
- **Interviewer bias.** Your facial expressions, tone, and reactions can signal approval or disapproval. Stay neutral and curious throughout.

**Connection to Laws:**

- **Postel's Law:** The chapter explicitly connects user interviews to Postel's Law -- "be liberal in what you accept from others." Interviews are about accepting the messy, complex, sometimes contradictory reality of how humans think and behave, and translating that understanding into design decisions. Just as Postel's Law asks systems to accept variable input gracefully, interviews ask researchers to accept variable human responses without forcing them into predetermined categories.
- **Jakob's Law:** Interviews surface users' mental models -- what they expect based on prior experience -- which is the foundation of Jakob's Law.
- **Hick's Law:** Interview data about decision-making processes helps designers understand where choice overload occurs, informing how to apply Hick's Law.

---

## Journey Mapping

**From:** Chapter 6 (Peak-End Rule)
**Purpose:** A qualitative exercise invaluable for visualizing how people use a product or service through the narrative of accomplishing a specific task or goal. Creates a design artifact that helps designers and stakeholders align to a common mental model, builds a deeper shared understanding of the customer experience, and identifies challenges and opportunities within an experience. Most critically, the emotional layer of a journey map makes the Peak-End Rule visible and actionable.
**When to use:**
- When the team needs a shared understanding of the end-to-end customer experience
- When you need to identify emotional peaks (positive and negative) across an experience
- When redesigning a flow and you need to understand where pain points and opportunities exist
- When multiple teams own different parts of a user journey and need alignment
- When stakeholders need a visual artifact to understand user experience issues

**Process:**

Journey maps should be tailored to the purposes and goals of the project and grounded in research conducted with real users. They contain three key sections:

**Section 1: LENS -- Establish the Perspective**

Define who this journey belongs to and what they are trying to do.

- **Persona:** The end user whose experience is being mapped. Should be predefined based on research on the target audience (see User Personas technique above).
- **Scenario:** The specific task or goal the journey map focuses on. May be real (for an existing product) or anticipated (for a product not yet launched).
- **Expectations:** What the persona expects from this scenario.
- **Example:** Jane (persona) is using a ride-share service app to order a ride (scenario) that she expects to arrive at her exact location in 10 minutes or less (expectation).

**Section 2: EXPERIENCE -- Map the Journey**

Illustrate the actions, mindset, and emotions of the end user across a timeline. Organized from top to bottom:

1. **High-level phases** organizing the experience into stages (e.g., Discovery, Onboarding, Core Use, Completion).
2. **Actions** defining the specific steps the user takes within each phase to accomplish their task.
3. **Mindset** layer providing a deeper view into what the customer is thinking during each phase -- general thoughts, pain points, questions, or motivations (sourced from research and user interviews).
4. **Emotional layer** represented as a continuous line mapped across the entire experience, capturing the emotional state of the persona. This layer is the most significant for the Peak-End Rule because it makes emotional peaks visible.

**Section 3: INSIGHTS -- Extract Takeaways**

Identify the important takeaways that surface from the mapped experience.

- **Opportunities:** A list of possible improvements to the overall experience.
- **Metrics:** Measurable indicators associated with improving the experience.
- **Ownership:** Details on which internal team owns each metric or opportunity.
- **Example:** Providing real-time information on the location of the vehicle after the ride is ordered can help reduce the pain point of waiting (opportunity). That feature will need to be designed and developed by the product team (ownership) and can be monitored according to post-ride ratings (metric).

**ASCII Diagram -- Journey Map Structure:**

```
+======================================================================+
|  LENS                                                                |
|  Persona: ___________    Scenario: _______________                   |
|  Expectations: ______________________________________________        |
+======================================================================+

|  EXPERIENCE                                                          |
|                                                                      |
|  PHASES:     | Discovery | Onboarding |  Core Use  | Completion |    |
|  ------------|-----------|------------|------------|------------|    |
|  ACTIONS:    | * _______ | * _______  | * _______  | * _______  |    |
|              | * _______ | * _______  | * _______  | * _______  |    |
|  ------------|-----------|------------|------------|------------|    |
|  MINDSET:    | "I need   | "How does  | "This is   | "Did it    |    |
|              |  to..."   |  this..."  |  taking.." |  work?"    |    |
|  ------------|-----------|------------|------------|------------|    |
|  EMOTION:    |           |     /\     |            |     /\     |    |
|              |    /\     |    /  \    |   \  /\    |    /  \    |    |
|  (continuous |   /  \    |   /    \   |    \/  \   |   /    \   |    |
|   line)      |  /    \   |  /      \  |        \  |  /      \  |    |
|              | /      \--|-/        \-|         \-|-/        \ |    |
|              |           |            |            |          \-|    |
|              |  NEGATIVE |   PEAK(+)  |  VALLEY   |  PEAK(+)   |    |
|              |           |            |            |   (END)    |    |
+======================================================================+

|  INSIGHTS                                                            |
|  Opportunities: * _____________________________________________      |
|                 * _____________________________________________      |
|  Metrics:       * _____________________________________________      |
|  Ownership:     * _____________________________________________      |
+======================================================================+
```

**Pitfalls:**

- **Not grounding in research.** Journey maps based on assumptions rather than real user data will visualize the team's mental model of the experience, not the user's. This defeats the entire purpose.
- **Neglecting the emotional layer.** The emotional line is not decoration -- it is the core mechanism for connecting the journey map to the Peak-End Rule. Without it, you cannot identify which moments disproportionately shape user perception.
- **Mapping too broadly.** A journey map that tries to cover everything covers nothing well. Pick a specific scenario with clear boundaries.
- **Treating it as a one-time exercise.** Journey maps should evolve as you gather more research data and as the product changes.
- **Ignoring the "end."** The Peak-End Rule tells us the final moments of an experience are disproportionately remembered. Pay particular attention to what happens in the Completion phase.
- **Negativity bias blindspot.** Humans register and dwell on negative events more readily than positive ones. This means a single negative peak can define the entire experience. The journey map should make these danger zones impossible to overlook.

**Connection to Laws:**

- **Peak-End Rule:** The journey map's emotional layer is the direct visualization of the Peak-End Rule. It makes visible the peaks (most emotionally intense points) and the end (final moments) that disproportionately determine how users remember the experience. The chapter states that we "remember each of our life experiences as a series of representative snapshots rather than a comprehensive timeline of events" -- and the emotional layer captures exactly those snapshots.
- **Jakob's Law:** The persona used in the Lens section should be grounded in mental model research (as described in Chapter 1).
- **Postel's Law:** The Mindset layer may reveal moments where the system fails to accept user input gracefully, connecting to Postel's robustness principle.

---

## Usability Testing

**From:** Chapter 7 (Aesthetic-Usability Effect)
**Purpose:** The definitive method for understanding how real users interact with a product. Reveals the gap between how a design is intended to work and how it actually works in practice. Uniquely important because it exposes issues that internal teams cannot see due to proximity bias ("we are not the user").
**When to use:**
- At any stage of design: from early prototypes to live products
- When the team needs evidence to resolve design disagreements
- When launching a new feature or significant redesign
- When analytics show user drop-off but do not explain why
- When you need to validate (or invalidate) assumptions about how users will interact with a design

**Process:**

**Phase 1 -- Planning the Test**

1. **Define the objectives.** Establish the goals of the test and what you are trying to learn. Is the goal to understand how well users comprehend a specific feature or workflow? Document objectives clearly.
2. **Write a test script.** Base it around tasks you want to see users perform. Think of these as prompts that initiate test participants to perform specific tasks that you can observe and learn from. Tasks can be very specific ("Find the return policy for this product") or open-ended ("You want to buy a birthday gift for a friend -- show me how you would do that").
3. **Recruit representative users.** Target and recruit users who represent the actual audience of the product or service you are building. Do NOT rely solely on usability data from your own team or company unless what you are designing is intended exclusively for them.

**Phase 2 -- Conducting the Test**

1. Ask participants to perform realistic tasks using a prototype or actual product.
2. **Remain neutral.** Help participants understand they are helping you test the design -- you are NOT testing them. This is critical for honest feedback.
3. Avoid priming participants with specific text found in the design (do not read navigation labels aloud before asking participants to find something).
4. **Listen intently and avoid biasing participants.** Do not react with approval, surprise, or disappointment to their actions.
5. **Ask participants to think out loud.** This helps you understand their behaviors, goals, thoughts, and motivations as they work through tasks.
6. **Measure both behavior AND opinion.** Record the speed and ease with which participants perform tasks in addition to what they say about it.

   **CRITICAL INSIGHT: "Watch what they DO, not what they SAY."** How well participants perform does not always match their subjective rating of a task. A participant may say a task was "easy" while struggling significantly, or may rate something poorly despite completing it quickly and accurately.

7. **Account for observer bias (Hawthorne Effect).** The mere act of being observed can influence participants to behave in ways they believe are expected of them. Mitigate this by emphasizing that the study tests the design, not the participant's abilities or knowledge, and that honest feedback will improve the design and will not be shared outside the study.

**Phase 3 -- Synthesizing the Data**

1. **Synthesize as a group.** Include everyone who participated directly in the sessions. Even better: involve the entire core project team to increase understanding, investment, and empathy. More perspectives when interpreting data avoids biases from a singular point of view.
2. **Establish structure.** Begin with a summary of goals and methodology. Document team members and roles, participant details, and data gathering methods.
3. **Extract quotes and observations.** Pull out participant statements and observed behaviors indicating goals, priorities, actions, motivations, pain points, habits, interactions, tools, or context.
4. **Group by themes.** Organize quotes and observations by themes or patterns that emerge. These themes inform insights and their implications for the design.
5. **Check against original questions.** Look back at the problem you started with and see if the patterns help answer the questions you asked.
6. **Avoid solutions during synthesis.** Focus on insights to understand context and user needs. Solutions come later.
7. **Avoid premature pattern identification.** Do not identify larger patterns before having gone through all the data and differentiating observations from their potential meaning.
8. **Document in a shareable format.** Succinctness is the most effective quality to aim for. Include research goals, methods, insights, and recommendations. Reinforce insights with specific examples from the research.
9. **Recognize when more research is needed.** Research often indicates what you should learn more about. This is a valid and valuable outcome.

**ASCII Diagram -- Usability Testing Process:**

```
PHASE 1: PLANNING          PHASE 2: CONDUCTING          PHASE 3: SYNTHESIZING
+--------------------+     +------------------------+   +------------------------+
| Define objectives  |     | Assign realistic tasks |   | Synthesize as a GROUP  |
|                    |     |                        |   |                        |
| Write test script  |---->| Remain NEUTRAL         |-->| Extract quotes &       |
| (task prompts)     |     |                        |   |   observations         |
|                    |     | Think-aloud protocol   |   |                        |
| Recruit            |     |                        |   | Group by themes        |
|  representative    |     | DO NOT prime with      |   |                        |
|  users             |     |   design text          |   | Check against          |
+--------------------+     |                        |   |   original questions   |
                           | WATCH what they DO     |   |                        |
                           |  not what they SAY     |   | NO SOLUTIONS yet --    |
                           |                        |   |   insights only        |
                           | Measure behavior AND   |   |                        |
                           |   opinion separately   |   | Document shareably     |
                           |                        |   +------------------------+
                           | Account for            |
                           |  Hawthorne Effect      |
                           +------------------------+

    KEY WARNING: BEAUTY MASKS USABILITY
    +----------------------------------------------------------+
    | Aesthetically pleasing designs cause participants to:     |
    | - Rate usability HIGHER than it actually is               |
    | - Complete tasks FASTER (positive affect on performance)  |
    | - FORGIVE usability issues they would otherwise flag      |
    |                                                          |
    | Mitigation: Ask questions that lead participants to look  |
    | BEYOND aesthetics. Watch behavior, not just listen to     |
    | subjective ratings.                                      |
    +----------------------------------------------------------+
```

**Pitfalls:**

- **The beauty-masking-usability pitfall.** This is the critical connection to the Aesthetic-Usability Effect. Research by Sonderegger and Sauer (2010) demonstrated that participants using a visually attractive interface rated usability higher AND completed tasks faster than those using a functionally identical but unattractive interface. Beautiful design literally masks usability issues during testing. Mitigation: ask questions that push participants beyond aesthetic impressions; measure behavior (task completion, errors, time) alongside subjective ratings.
- **Observer bias / Hawthorne Effect.** Being watched changes behavior. Participants may try to perform "correctly" rather than naturally. Emphasize repeatedly that you are testing the design, not them.
- **Recruiting non-representative users.** Testing with your own team members or company employees produces data that reflects expert knowledge, not user experience.
- **Priming participants.** Reading aloud text that appears in the interface gives away answers. Let participants discover navigation and content on their own.
- **Jumping to solutions during synthesis.** The synthesis phase is for understanding, not solving. Premature solutioning biases interpretation of remaining data.
- **Solo synthesis.** One person analyzing data introduces their individual biases. Group synthesis produces more reliable, multi-perspective insights.

**Connection to Laws:**

- **Aesthetic-Usability Effect:** The entire chapter frames usability testing as the essential counterweight to this effect. Because users perceive beautiful designs as more usable (even when they are not), usability testing is the only way to uncover issues that aesthetics hide. The chapter warns that "perceived aesthetic quality has the potential to mask usability issues" and that usability testing must be designed to counter this bias.
- **Jakob's Law:** Usability testing reveals whether users' mental models (formed from other products) align with the design being tested.
- **Fitts's Law:** Testing exposes whether touch targets are appropriately sized and positioned by observing actual selection behavior.
- **Hick's Law:** Testing reveals whether users experience decision paralysis or confusion when faced with choices in the interface.

---

## Eye Tracking

**From:** Chapter 8 (Von Restorff Effect)
**Purpose:** Measures and analyzes where users look and how they interact with digital interfaces or physical objects. Uses specialized hardware and software to provide objective data about user behavior, preferences, and cognitive processes -- including where users look, how they navigate visually, what they ignore, and their emotional responses. Provides data that is less prone to self-report biases and errors than interviews or surveys.
**When to use:**
- When you need to understand visual attention patterns on a page or screen
- When you want to validate whether important elements (CTAs, warnings, key content) are actually being seen
- When investigating banner blindness or change blindness issues
- When comparing two or more design variants to understand attention distribution
- When you need objective, quantitative data about visual behavior to complement qualitative methods

**Process:**

**Step 1: Define the Research Question**

Identify the specific research question or hypothesis the study aims to answer. Examples:
- "Do users notice the safety warning before proceeding to checkout?"
- "Which pricing option draws the most visual attention?"
- "Are users fixating on the navigation or scanning the page body first?"

**Step 2: Select the Participants**

Choose a sample that is representative of the target user group. Consider:
- Demographic characteristics matching your actual users
- Varying levels of familiarity with the product
- Sufficient sample size for the study type

**Step 3: Set Up the Equipment**

Set up eye-tracking hardware and software. Calibrate the system for each individual participant. Calibration is critical -- uncalibrated data is unreliable.

**Step 4: Develop the Stimuli**

Create the stimuli participants will interact with. These may be:
- Digital interfaces (websites, apps, prototypes)
- Physical objects (packaging, signage, retail displays)
- Static images or live interactive environments

Ensure the stimuli represent realistic usage conditions.

**Step 5: Conduct the Study**

Participants interact with the stimuli while their eye movements are recorded. The researcher should minimize interference -- let participants behave naturally.

**Step 6: Analyze the Data**

Analyze eye-tracking data to answer the research question. Common study types and their outputs:

- **Heat map:** Aggregated visualization showing where participants looked most (warm colors) and least (cool colors). Reveals attention distribution patterns.
- **Gaze plot:** Shows the sequence of fixations for individual participants -- the order in which they looked at elements. Reveals scan paths and navigation strategies.
- **Fixation duration:** How long participants looked at specific elements. Longer fixation can indicate interest, confusion, or difficulty.
- **Attentional bias:** Whether participants are systematically drawn to certain types of content or positions.
- **Comparative studies:** Side-by-side analysis of attention patterns across design variants.

**Step 7: Interpret the Results**

Draw conclusions about user behavior, preferences, and cognitive processes. Connect findings back to the original research question.

**ASCII Diagram -- Eye Tracking Study Types and Setup:**

```
EYE TRACKING STUDY PIPELINE

Step 1          Step 2          Step 3          Step 4
+----------+    +----------+    +----------+    +----------+
| Define   |--->| Select   |--->| Set up & |--->| Develop  |
| research |    | partici- |    | calibrate|    | stimuli  |
| question |    | pants    |    | equipment|    |          |
+----------+    +----------+    +----------+    +----------+
                                                     |
Step 7          Step 6          Step 5               |
+----------+    +----------+    +----------+         |
| Interpret|<---| Analyze  |<---| Conduct  |<--------+
| results  |    | data     |    | study    |
+----------+    +----------+    +----------+

COMMON OUTPUT TYPES:
+-------------------+--------------------------------------------+
| HEAT MAP          | Aggregated attention: where did people     |
|  [warm = seen]    | look most? What was ignored?               |
|  [cool = missed]  |                                            |
+-------------------+--------------------------------------------+
| GAZE PLOT         | Sequential fixations: in what ORDER        |
|  1 -> 2 -> 3 ->  | did they look at elements?                 |
+-------------------+--------------------------------------------+
| FIXATION DURATION | How LONG did they look at each element?    |
|  [short] [LONG]   | Long = interest OR confusion               |
+-------------------+--------------------------------------------+
| ATTENTIONAL BIAS  | Systematic preference: are they drawn to   |
|                   | certain positions or content types?         |
+-------------------+--------------------------------------------+
| COMPARATIVE       | Side-by-side: how do two designs differ    |
|  Design A vs B    | in attention patterns?                     |
+-------------------+--------------------------------------------+
```

**Pitfalls:**

- **Limited context.** Eye tracking tells you WHERE people looked, not WHY. A long fixation on an element could mean interest, confusion, or aesthetic appreciation. Always combine with other methods (interviews, think-aloud) for the "why."
- **Interference.** The equipment itself (especially head-mounted trackers) can change how participants behave. Modern remote trackers reduce this but do not eliminate it.
- **Limited sample size.** Eye tracking studies tend to have smaller participant pools due to equipment costs and session time. Be cautious about generalizing from small samples.
- **Limited stimuli.** If the stimuli do not represent realistic usage conditions, the data will not generalize to actual use.
- **Cultural differences.** Reading direction (left-to-right, right-to-left, top-to-bottom) and cultural norms around visual attention vary. Study results from one cultural context may not transfer to another.
- **Technical limitations.** Calibration drift, participant movement, glasses, and lighting conditions can all affect data quality.
- **Over-reliance.** The book explicitly warns: eye tracking should be used in conjunction with other research methods to gain a complete understanding of user behavior. It is one lens, not the whole picture. Limitations and potential sources of bias should be carefully considered and minimized.

**Connection to Laws:**

- **Von Restorff Effect:** Eye tracking is the primary empirical method for validating the Von Restorff Effect in your designs. It reveals whether the element you intended to make visually distinctive actually captures user attention. It can show whether your use of color, shape, size, position, or motion is effectively creating the contrast needed for an element to "stand out" from similar items. It also reveals banner blindness (users ignoring elements that resemble ads) and change blindness (users failing to notice changes), both of which are discussed extensively in the chapter.
- **Fitts's Law:** Gaze plot data shows the eye's "travel path," which can reveal whether target placement aligns with natural scan patterns.
- **Hick's Law:** Heat maps can reveal whether users are overwhelmed by too many options (scattered attention) or focused (concentrated attention on key elements).
- **Aesthetic-Usability Effect:** Eye tracking can show whether users spend more time looking at aesthetically pleasing elements, potentially overlooking functional ones.

---

## Design Principles Workshop

**From:** Chapter 11 (Applying Psychological Principles in Design)
**Purpose:** Transforms psychological principles from abstract knowledge into operational team standards. Solves two failure modes that plague growing design teams: (1) the bottleneck mode, where all decisions land on leadership who cannot keep up, and (2) the fragmentation mode, where individuals make inconsistent decisions without shared standards. The workshop produces a shared "North Star" that makes good design decisions faster, more consistent, and scientifically grounded.
**When to use:**
- When a design team is growing and decisions are becoming inconsistent
- When design leadership has become a bottleneck for decision-making
- When "good design" is a moving target within the team -- everyone defines it differently
- When you need to embed psychological principles into daily design practice, not just awareness
- When onboarding new team members who need a clear framework for decision-making

**Process:**

**Step 1: Identify the Team**

Keep participation open to anyone whose work will be directly affected by the principles. Also consider inviting:
- Design leadership
- Stakeholders outside the immediate design team (they bring a different and valuable perspective)

The more people involved, the easier it will be to ensure widespread adoption.

**Step 2: Align and Define**

Carve out dedicated time and create shared understanding of:
- What design principles are
- The purpose they serve
- The goals of this exercise
- Success criteria: what must each design principle meet to be valuable for the team?

**Step 3: Diverge**

Centered around idea generation.
- Each team member brainstorms as many design principles as they can for a defined amount of time (10-15 minutes recommended).
- Each idea goes on a separate sticky note.
- Quantity over quality at this stage -- do not self-censor.
- By the end, each participant should have a stack of ideas.

**Step 4: Converge (Dot Voting)**

Bring all ideas together and identify themes.
1. Participants share their ideas with the group.
2. Organize ideas according to themes that surface, with the help of a facilitator.
3. After sharing, use **dot voting** to prioritize: each person receives a finite number of adhesive dots (typically 5-10) and distributes them freely among themes. Multiple dots on a single theme are allowed if someone feels particularly strongly about it.

**Step 5: Refine and Apply**

- Consolidate overlapping themes where possible.
- Articulate each surviving principle clearly and concisely.
- Identify where and how the principles can be applied within the team and throughout the organization.

**Step 6: Circulate and Advocate**

Share the principles and advocate for adoption:
- Print posters for the workspace
- Create desktop wallpapers
- Add to notebooks and shared documentation
- Make them readily accessible and visible to all team members

Critical: team members who participated in the workshop must actively advocate for the principles both within and outside the team.

**The Goal -> Observation -> Rules Framework:**

Once principles are established, connect each one to psychology using this three-layer framework:

1. **Goal (Design Principle):** What the team wants to achieve.
2. **Observation (Psychological Law):** The psychological principle that validates and supports the goal.
3. **Rules (Guidelines):** Specific, prescriptive constraints that guide design decisions to meet the goal.

**Example A:**
- Goal: "Clarity over abundance of choice"
- Observation: Hick's Law -- "The time it takes to make a decision increases with the number and complexity of choices available."
- Rules: "Limit choices to no more than three items at a time." / "Provide brief explanations when useful, clear and no more than 80 characters."

**Example B:**
- Goal: "Familiarity over novelty"
- Observation: Jakob's Law -- "Users spend most of their time on other sites, and they prefer your site to work the same way."
- Rules: "Use common design patterns to reinforce familiarity." / "Avoid distracting the user with a flashy UI or quirky animations."

**ASCII Diagram -- Workshop Flow and Framework:**

```
WORKSHOP PROCESS:

Step 1        Step 2         Step 3         Step 4
IDENTIFY      ALIGN &        DIVERGE        CONVERGE
THE TEAM      DEFINE
+---------+   +---------+    +---------+    +------------------+
| Open to |   | What are|    | 10-15   |    | Share ideas      |
| anyone  |-->| design  |--->| minutes |--->| Group by themes  |
| affected|   | princi- |    | Solo    |    | DOT VOTE:        |
| Include |   | ples?   |    | brain-  |    | 5-10 dots each   |
| leaders |   | Success |    | storm   |    | Multiple on one  |
| & stake-|   | criteria|    | Sticky  |    | theme = OK       |
| holders |   |         |    | notes   |    |                  |
+---------+   +---------+    +---------+    +--------+---------+
                                                     |
                                            Step 5   v         Step 6
                                            REFINE &           CIRCULATE &
                                            APPLY              ADVOCATE
                                            +---------+        +-------------+
                                            | Consoli-|        | Posters     |
                                            | date    |------->| Wallpapers  |
                                            | Articu- |        | Docs        |
                                            | late    |        | Advocate    |
                                            | Apply   |        | internally  |
                                            +---------+        | & externally|
                                                               +-------------+

THE FRAMEWORK (applied to each principle):

+----------------------------------------------------------+
|                                                          |
|   GOAL (Design Principle)                                |
|   "Clarity over abundance of choice"                     |
|                                                          |
|       |                                                  |
|       | validated by                                     |
|       v                                                  |
|                                                          |
|   OBSERVATION (Psychological Law)                        |
|   Hick's Law: "Decision time increases with              |
|   the number and complexity of choices."                 |
|                                                          |
|       |                                                  |
|       | operationalized through                          |
|       v                                                  |
|                                                          |
|   RULES (Prescriptive Guidelines)                        |
|   * "Limit choices to no more than 3 at a time."        |
|   * "Explanations: clear, max 80 characters."            |
|                                                          |
+----------------------------------------------------------+
```

**Four Quality Tests for Design Principles:**

Every principle produced by the workshop should pass these tests:

1. **Not a truism.** The principle must be direct, clear, and actionable -- not bland and obvious. "Design should be intuitive" is a truism. It cannot help with decision-making because it is too vague and lacks a clear stance. Everyone agrees with it, so it differentiates nothing.

2. **Solves real questions.** The principle must clearly resolve real questions and drive actual design decisions. However, it should not be so scenario-specific that it only applies to one situation.

3. **Is opinionated.** The principle should have a focus and a sense of prioritization. It should push the team in the right direction and drive them to say "no" when necessary. "Clarity OVER abundance of choice" is opinionated because it establishes a trade-off.

4. **Is memorable.** Principles that are hard to remember are less likely to be used. They should feel relevant to the needs and ambitions of the team and the organization.

**Pitfalls:**

- **Producing truisms.** The most common failure mode. "Make it easy to use" or "Design should be beautiful" are truisms that everyone agrees with and nobody can act on. Test every principle: could a reasonable person disagree with it? If not, it is a truism.
- **Skipping the psychological connection.** Principles without the Observation layer (psychological law) lack scientific grounding. They become opinions rather than evidence-based standards.
- **Creating principles without rules.** Principles without prescriptive rules are aspirational but not operational. The rules are what make principles actionable in daily design decisions.
- **Workshop without follow-through.** The workshop is the beginning, not the end. Without active circulation and advocacy (Step 6), principles die in a shared document no one opens.
- **Excluding non-design stakeholders.** Principles created in a design silo will face resistance from engineering, product, and business teams who had no input. Include them.
- **Too many principles.** Like personas, if there are too many, none are memorable. Aim for a focused set that the team can actually internalize.

**Connection to Laws:**

- **All Laws:** This technique is the meta-method for applying every law in the book. The Goal -> Observation -> Rules framework explicitly maps each design principle to a psychological law (Jakob's Law, Fitts's Law, Hick's Law, etc.) and operationalizes it through prescriptive rules. The chapter demonstrates this with Hick's Law and Jakob's Law but states the process should be "repeated for each design principle" using the full set of psychological principles from the book.
- **Hick's Law:** Used as Example A ("Clarity over abundance of choice").
- **Jakob's Law:** Used as Example B ("Familiarity over novelty").

---

## Quick Reference: Technique Selection Guide

```
+---------------------------+-------------------------------------------+
| IF YOU NEED TO...         | USE THIS TECHNIQUE                        |
+---------------------------+-------------------------------------------+
| Understand who your       | User Personas (Ch1)                       |
| users are                 |                                           |
+---------------------------+-------------------------------------------+
| See how people actually   | Contextual Inquiry (Ch2)                  |
| work in their environment |                                           |
+---------------------------+-------------------------------------------+
| Design information        | Card Sorting (Ch4)                        |
| architecture              |                                           |
+---------------------------+-------------------------------------------+
| Understand user attitudes | User Interviews (Ch5)                     |
| and mental models         |                                           |
+---------------------------+-------------------------------------------+
| Map the end-to-end        | Journey Mapping (Ch6)                     |
| emotional experience      |                                           |
+---------------------------+-------------------------------------------+
| Test whether a design     | Usability Testing (Ch7)                   |
| actually works            |                                           |
+---------------------------+-------------------------------------------+
| Measure visual attention  | Eye Tracking (Ch8)                        |
| objectively               |                                           |
+---------------------------+-------------------------------------------+
| Embed psychology into     | Design Principles Workshop (Ch11)         |
| team decision-making      |                                           |
+---------------------------+-------------------------------------------+
```

---

*Reference compiled from "Laws of UX" by Jon Yablonski, 2nd Edition. Techniques extracted from Chapters 1, 2, 4, 5, 6, 7, 8, and 11.*
