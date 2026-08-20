# Ethics and Dark Patterns in UX Design

> **Source:** Chapter 12, "With Power Comes Responsibility"
> **Book:** Jon Yablonski, *Laws of UX*, 2nd edition (O'Reilly, 2024)

---

## Overview

The same psychological principles that create intuitive, human-centered products can
be weaponized to exploit human vulnerabilities for commercial gain. This chapter is
the ethical counterweight to everything else in the book. It establishes a scientific
foundation for how behavior shaping works, catalogues seven specific manipulation
methods used in digital products, examines dark patterns and unintended consequences,
and provides a framework for ethical design practice.

**Core thesis:** "Ethics must be an integral part of the design process, because
without this check and balance, there may be no one advocating for the end user
within the companies and organizations creating technology."

---

## 1. The Science of Behavior Shaping

### B.F. Skinner and Operant Conditioning

B.F. Skinner -- American psychologist, behaviorist, author, inventor, and social
philosopher -- studied how behaviors could be learned and modified by creating an
association between a particular behavior and a consequence. This process is called
**operant conditioning**. Using a laboratory apparatus known as the **Skinner box**,
he studied how animal behavior could be shaped by teaching subjects to perform
desired actions in response to specific stimuli in an isolated environment.

#### Three Reinforcement Types

```
POSITIVE REINFORCEMENT
+--------------------------------------------------+
| Skinner Box                                      |
|                                                  |
|   [Rat] --presses--> [Lever] --dispenses--> [Food Pellet]  |
|                                                  |
|   Result: Rat learns to go straight to the       |
|   lever each time it is placed in the box.       |
|   Behavior INCREASES.                            |
+--------------------------------------------------+

NEGATIVE REINFORCEMENT
+--------------------------------------------------+
| Skinner Box                                      |
|                                                  |
|   [Rat] + [Electric Current]                     |
|      |                                           |
|      +--presses--> [Lever] --turns off--> [Current]  |
|                                                  |
|   Result: Rat learns to press lever immediately  |
|   to avoid pain. Behavior INCREASES.             |
+--------------------------------------------------+

VARIABLE REINFORCEMENT (the critical finding)
+--------------------------------------------------+
| Skinner Box                                      |
|                                                  |
|   [Rat] --presses--> [Lever] --sometimes--> [Food]  |
|                           |                      |
|                           +--sometimes--> [Nothing]  |
|                                                  |
|   Pattern is UNPREDICTABLE.                      |
|   Result: Rat presses lever COMPULSIVELY and     |
|   continues longest without any reward at all.   |
+--------------------------------------------------+
```

#### The Critical Finding: Variable Reinforcement

Skinner discovered that different reinforcement schedules produce dramatically
different behavioral responses:

| Schedule               | Behavior Pattern                                    |
|------------------------|-----------------------------------------------------|
| Every time (fixed)     | Animal presses lever only when hungry                |
| Too infrequent         | Animal stops pressing lever altogether               |
| **Variable / random**  | **Animal presses lever compulsively and persists longest without reward** |

**Key insight:** Behavior can most effectively be shaped by reinforcing it at
variable times, as opposed to every time or not frequently enough. Too much or
too little reinforcement leads to loss of interest, but random reinforcement leads
to impulsive, repeated behavior.

> "The rats' behavior could most effectively be shaped by reinforcing it at variable
> times, as opposed to every time or not frequently enough. Too much or too little
> reinforcement led to the animals losing interest, but random reinforcement led to
> impulsive, repeated behavior."

### Slot Machines as Modern Skinner Boxes

Drawing from Natasha Dow Schull's *Addiction by Design* (2012), Yablonski connects
Skinner's research to modern casino slot machines. Slot machines are a modern-day
Skinner box: gamblers pay to pull a lever and are occasionally, unpredictably
rewarded for doing so.

```
THE CASINO FEEDBACK LOOP (from Schull, "Addiction by Design")
+------------------------------------------------------------------+
|                                                                  |
|  [Player] --pulls lever--> [Slot Machine]                        |
|     ^                          |                                 |
|     |                    Variable reward                         |
|     |                    (sometimes win,                         |
|     |                     usually lose)                          |
|     |                          |                                 |
|     +----- dopamine hit -------+                                 |
|                                                                  |
|  Meanwhile, behind the scenes:                                   |
|                                                                  |
|  [Data System] records all player activity                       |
|       |                                                          |
|       +--> Creates RISK PROFILE for each player                  |
|       |    (how much they can lose and still feel satisfied)      |
|       |                                                          |
|       +--> Calculates algorithmic "PAIN POINT"                   |
|       |                                                          |
|       +--> When player approaches pain point:                    |
|            Dispatches "LUCK AMBASSADOR" who provides:            |
|            - Meal coupons                                        |
|            - Show tickets                                        |
|            - Gambling vouchers                                   |
|            - Other incentives                                    |
|            (to supplement holding power of the machine)          |
+------------------------------------------------------------------+
```

Schull describes how slot machines are designed to mesmerize people into a state of
**"continuous productivity"** to extract maximum value through a continual feedback
loop. The entire system -- machine design, data tracking, and human intervention via
luck ambassadors -- is a stimulus-response loop optimized to keep people in front of
machines, repeatedly pulling levers and spending money.

### References

| Author(s) | Work | Year |
|---|---|---|
| B.F. Skinner | *The Behavior of Organisms* | 1938 |
| Ferster & Skinner | *Schedules of Reinforcement* | 1957 |
| Natasha Dow Schull | *Addiction by Design* | 2012 |

---

## 2. Seven Manipulation Methods in Digital Products

These are the seven specific ways technology products use psychological principles
to shape user behavior. Each method has legitimate uses, but each can also be
weaponized. Designers must understand all seven to audit their own products.

---

### Method 1: Intermittent Variable Rewards

**What it is:** Digital platforms deliver unpredictable rewards -- sometimes
valuable, sometimes not -- to create compulsive checking behavior. This is the
direct digital descendant of Skinner's variable reinforcement schedule.

**How it works psychologically:** The brain releases dopamine not when a reward is
received, but when a reward is *anticipated*. Variable delivery means the user
never knows when the next reward will come, creating a persistent urge to check.
Studies show the average person interacts with their smartphone over 2,500 times a
day, with some reaching 5,400 times -- amounting to two to four hours daily
(Winnick & Zolna, dscout, 2016).

**Product example from the book:** Pull-to-refresh on Instagram. The physical
gesture mirrors pulling a slot machine lever. The content returned is variable --
sometimes exciting new posts, sometimes nothing noteworthy.

```
PULL-TO-REFRESH AS SLOT MACHINE
+---------------------------+       +---------------------------+
|  Instagram Feed           |       |  Slot Machine             |
|                           |       |                           |
|  +---------------------+ |       |  +---------------------+ |
|  |                     | |       |  |  [7] [BAR] [cherry] | |
|  |  (pull down)        | |       |  |                     | |
|  |       |             | |       |  |  (pull lever)       | |
|  |       v             | |       |  |       |             | |
|  |  [loading spinner]  | |       |  |       v             | |
|  |                     | |       |  |  [spinning reels]   | |
|  +---------------------+ |       |  +---------------------+ |
|                           |       |                           |
|  Result: Maybe new likes  |       |  Result: Maybe a payout  |
|  and comments... maybe    |       |  ... maybe nothing.      |
|  nothing new.             |       |                           |
+---------------------------+       +---------------------------+

  Same variable reward loop. Same compulsive repetition.
```

**How to audit for it in your product:**
- Identify every place where the user checks for new content or status updates
- Ask: Does this interaction deliver unpredictable rewards?
- Ask: Are notifications designed to create anticipation rather than inform?
- Ask: Could we batch notifications or show a predictable summary instead?
- Ask: Is the pull-to-refresh pattern necessary, or could content auto-update?

---

### Method 2: Infinite Loops

**What it is:** Autoplay videos and infinite scrolling feeds that remove the
natural stopping points where a user would consciously decide to continue or leave.

**How it works psychologically:** Without an explicit decision point (a page
boundary, an "end" state, a "play next" button), passive consumption continues
uninterrupted. The user never encounters a moment where they must actively choose
to keep going. Ads are interspersed with looping content, so more time on site
equals more ads viewed -- significantly more effective at generating revenue than
static ad placements.

**Product example from the book:** YouTube autoplaying the next video. The user
takes no action; the next video begins automatically. The decision point that would
otherwise be an opportunity to disengage is removed entirely.

```
INFINITE LOOP PATTERN (Autoplay)

  With stopping point:              Without stopping point:
  +--------------------+            +--------------------+
  | Video A            |            | Video A            |
  | [===========>    ] |            | [===========>    ] |
  +--------------------+            +--------------------+
  | "Play next video?" |            | 3... 2... 1...     |
  | [Yes]    [No]      | <-- USER   +--------------------+
  +--------------------+   DECIDES  | Video B (autoplay) |
                                    | [=>               ] |
                                    +--------------------+
                                    | 3... 2... 1...     |
                                    +--------------------+
                                    | Video C (autoplay) |
                                    | [=>               ] |
                                    +--------------------+
                                    | ... (forever)      |

  Decision point = exit opportunity. Removing it = infinite loop.
```

**How to audit for it in your product:**
- Map every content consumption flow: Where does it end?
- Ask: Does the user ever encounter a natural stopping point?
- Ask: Is autoplay on by default? Can users turn it off easily?
- Ask: Does infinite scroll serve the user's goal, or does it serve engagement metrics?
- Ask: Would pagination or finite content sets better respect the user's time?

---

### Method 3: Social Affirmation

**What it is:** Feedback mechanisms (likes, comments, reactions, follower counts)
that provide social validation and trigger dopamine responses.

**How it works psychologically:** Humans are inherently social creatures. The drive
to fulfill core needs for self-worth and integrity extends to social media (Toma &
Hancock, 2013: "Self-Affirmation Underlies Facebook Use"). Each like or positive
comment temporarily satisfies the desire for approval and belonging. This social
affirmation delivers **dopamine** -- the chemical produced by our brains that plays
a key role in motivating behavior. The cycle becomes self-reinforcing: post content,
receive social validation, feel reward, post more content.

**Product example from the book:** Facebook's "like" button, introduced in 2009 and
now ubiquitous across social media platforms.

```
SOCIAL AFFIRMATION FEEDBACK LOOP

  +-------------+       +----------------+       +-------------+
  |  User posts |------>|  Others react  |------>|  Dopamine   |
  |  content    |       |  (likes,       |       |  reward     |
  |             |       |   comments)    |       |             |
  +-------------+       +----------------+       +------+------+
        ^                                               |
        |                                               |
        +----------- desire to repeat --------------------+

  +-----------------------------------------------+
  |  Notification Badge: [3 new likes]             |
  |  +-----------------------------------------+  |
  |  | Your photo received:                    |  |
  |  |   [heart] 47 likes                      |  |
  |  |   [speech] 12 comments                  |  |
  |  |   [share] 3 shares                      |  |
  |  +-----------------------------------------+  |
  |  Each number = social scorecard = self-worth   |
  +-----------------------------------------------+
```

**How to audit for it in your product:**
- Identify all social validation metrics visible to users (likes, counts, rankings)
- Ask: Are visible counts necessary for the user's goal, or do they create anxiety?
- Ask: Could we remove or de-emphasize public metrics without losing functionality?
- Ask: Do notifications about social responses create compulsive checking?
- Ask: Have we considered hiding like/follower counts (as Instagram has tested)?

---

### Method 4: Personalization

**What it is:** Machine learning algorithms that tailor content feeds, product
recommendations, and experiences to individual users based on collected behavioral
data.

**How it works psychologically:** Social media platforms collect data signals from
every user interaction and feed them back into algorithms that improve themselves,
creating a feedback loop of random reinforcement. The cycle: more time interacting
increases algorithmic quality, which produces more relevant content, which leads to
more time on the platform, which generates more data signals and more ads viewed.

**Product example from the book:** TikTok, which utilizes its interface to capture
data signals in the form of user interaction to personalize content recommendations
engineered to keep users on the platform longer.

**Downsides of personalization identified in the book:**
- It can lure users deep into an addictive rabbit hole of increasingly extreme content
- It can expose users to information reinforcing their preexisting beliefs and biases
  (commonly referred to as a **filter bubble**)
- Research suggests this content consumption pattern can lead to significant decreases
  in attention span and working memory

```
PERSONALIZATION FEEDBACK LOOP

  +----------+     +------------+     +-----------+     +----------+
  |  User    |---->| Algorithm  |---->| Curated   |---->| More     |
  |  watches |     | learns     |     | feed      |     | time on  |
  |  content |     | preferences|     | (more     |     | platform |
  |          |     |            |     |  relevant)|     |          |
  +----------+     +------------+     +-----------+     +----+-----+
       ^                                                     |
       |                                                     |
       +------------------ more data signals ----------------+

  FILTER BUBBLE FORMATION:

  Real world:  [A] [B] [C] [D] [E] [F] [G] ... diverse viewpoints

  After personalization:
  +----------------------------------+
  | Your Feed:                       |
  |  [A] [A'] [A''] [A'''] [A'''']  |
  |                                  |
  |  Only content that confirms      |
  |  what you already believe.       |
  +----------------------------------+
```

**How to audit for it in your product:**
- Map how your recommendation algorithm works end to end
- Ask: Does personalization serve the user's long-term interests or just engagement?
- Ask: Can users see and control what data informs their recommendations?
- Ask: Are we creating filter bubbles that narrow users' worldview?
- Ask: Do we surface diverse content, or only maximize click-through probability?
- Ask: Is there an "off" switch for algorithmic recommendations?

---

### Method 5: Defaults

**What it is:** Pre-selected settings and options that steer user behavior because
most people never change them.

**How it works psychologically:** Default settings have incredible power to steer
decisions, even when people are unaware of what is being decided for them. A 2011
study by Dinner, Johnson, Goldstein, and Liu ("Partitioning Default Effects: Why
People Choose Not to Choose") found that default options often lead people to
rationalize their acceptance and actively reject alternatives. Defaults exploit
cognitive inertia and status quo bias.

**Product example from the book:** Facebook's default privacy settings. A 2011
study found that Facebook's default privacy settings matched users' expectations
only 37% of the time, leading to content and personal information being visible to
more people than users expected.

```
DEFAULTS: WHAT USERS EXPECT vs. WHAT THEY GET

  User's Mental Model:               Actual Default Setting:
  +---------------------------+      +---------------------------+
  | My posts visible to:      |      | My posts visible to:      |
  |  [x] Friends              |      |  [x] Public (everyone)    |
  |  [ ] Friends of friends   |      |  [ ] Friends of friends   |
  |  [ ] Public               |      |  [ ] Friends only         |
  +---------------------------+      +---------------------------+

  Study finding: defaults matched expectations only 37% of the time.

  DEFAULT AUDIT CHECKLIST:
  +-------------------------------------------+
  | Setting              | Serves  | Serves   |
  |                      | User?   | Business?|
  +----------------------+---------+----------+
  | Privacy: Public      |   NO    |   YES    |
  | Data sharing: On     |   NO    |   YES    |
  | Notifications: All   |   NO    |   YES    |
  | Location tracking:On |   NO    |   YES    |
  +----------------------+---------+----------+
  If the answer is only "Serves Business" -->
  the default is likely exploitative.
  +-------------------------------------------+
```

**How to audit for it in your product:**
- List every default setting in your product
- For each default, ask: Does this serve the user's interest or the business's?
- Ask: Would a reasonable user expect this default if they knew about it?
- Ask: Are opt-out mechanisms clearly presented and easy to use?
- Ask: Have we tested whether our defaults match user expectations?

---

### Method 6: (Lack of) Friction

**What it is:** Systematically removing obstacles, steps, and decision points from
user flows to make actions as effortless as possible -- especially actions that
generate revenue.

**How it works psychologically:** The easier and more convenient an action is made,
the more likely people will perform it and form a habit around it. By removing the
cognitive effort required to make a conscious decision, companies bypass the user's
deliberative thinking and enable impulsive behavior.

**Product example from the book:** Amazon Dash buttons -- small electronic devices
that enabled customers to order frequently used products by pressing a single
physical button, without visiting the website or app. (Since deprecated in favor of
digital-only versions.) The example illustrates how far companies will go to remove
obstacles and shape purchasing behavior.

```
FRICTION REMOVAL PROGRESSION

  Traditional:
  [Need item] -> [Go to store] -> [Find item] -> [Compare] -> [Buy]
      5 decision points, multiple friction moments

  E-commerce:
  [Need item] -> [Search site] -> [Add to cart] -> [Checkout] -> [Buy]
      4 decision points

  One-click:
  [Need item] -> [Click "Buy Now"]
      1 decision point

  Dash Button:
  [Press button]
      0 decision points (the button is pre-configured)

  +----------------------------------------------------+
  |  Less friction = more purchases = more revenue      |
  |  BUT ALSO:                                          |
  |  Less friction = less deliberation = less control   |
  |  for the user over their own spending behavior.     |
  +----------------------------------------------------+
```

**How to audit for it in your product:**
- Map every user flow and identify where friction has been removed
- For each removed friction point, ask: Was this friction protecting the user?
- Ask: Does frictionless behavior here enable compulsive or regretful actions?
- Ask: Would a confirmation step, cooling-off period, or summary screen help?
- Ask: Are we removing friction to help the user, or to boost conversion metrics?

---

### Method 7: Reciprocity

**What it is:** Leveraging the deeply ingrained human social norm of repaying
gestures from others to drive engagement on platforms.

**How it works psychologically:** Reciprocation -- the tendency to repay the
gestures of others -- is a strong impulse shared by humans. It is a social norm we
value and rely on as a species. Technology platforms tap into this impulse by
creating social obligations that users feel compelled to fulfill, generating return
visits and increased time on site.

**Product example from the book:** LinkedIn uses reciprocity to keep users coming
back to accept connection requests, respond to direct messages, or endorse skills.
When someone sends a connection invitation, they may not have actively chosen to do
so -- they may simply be responding to a platform-generated list of suggested
contacts. But the recipient feels a social obligation to accept and reciprocate.
Both people end up spending more time on the platform, generating more profit for
LinkedIn.

```
RECIPROCITY TRAP

  Platform-initiated:                    User-perceived:
  +---------------------------+          +---------------------------+
  | LinkedIn suggests:        |          | "Sarah wants to           |
  | "Connect with Sarah?"     |          |  connect with me!"        |
  | [Connect]                 |          |                           |
  +---------------------------+          | "I should accept and      |
         |                               |  endorse her back..."     |
         v                               +---------------------------+
  +---------------------------+                    |
  | Sarah receives:           |                    v
  | "John connected with you" |          +---------------------------+
  | "Endorse John back?"      |          | Both users now:           |
  +---------------------------+          | - Accepted obligation     |
         |                               | - Spent time on platform  |
         v                               | - Generated engagement    |
  +---------------------------+          | - Viewed ads              |
  | Cycle continues...        |          +---------------------------+
  | Messages, endorsements,   |
  | connection suggestions... |          Winner: LinkedIn
  +---------------------------+
```

**How to audit for it in your product:**
- Identify all features that create social obligations between users
- Ask: Are connection/invitation features initiated by genuine user intent?
- Ask: Does the platform manufacture social obligations to drive engagement?
- Ask: Can users easily decline without social penalty or guilt?
- Ask: Are "suggested contacts" or "people you may know" serving users or metrics?

---

## 3. Dark Patterns

### Definition

Dark patterns are ways technology can be used to influence behavior by making people
perform actions they did not intend to, for the sake of increasing engagement or
convincing users to complete tasks not in their best interest. Examples include:
making a larger purchase, sharing unnecessary personal information, or accepting
marketing communications.

Yablonski notes these deceptive techniques "can be found all over the internet" and
that the methods are "constantly increasing in sophistication and accuracy, while
the psychological hardware we share as humans remains the same."

### The Princeton / University of Chicago Study (2019)

Researchers from Princeton University and the University of Chicago conducted a
large-scale study analyzing approximately **11,000 shopping websites** looking for
evidence of dark patterns.

**Findings:**
- They identified **1,818 instances of dark patterns**
- More popular sites in the sample were **more likely** to feature dark patterns
- The study demonstrates that dark patterns are pervasive, systematic, and correlated
  with site popularity

**Study authors:** Arunesh Mathur, Gunes Acar, Michael J. Friedman, Elena Lucherini,
Jonathan Mayer, Marshini Chetty, and Arvind Narayanan (2019).

### Instagram Forced Action Example

The book highlights Instagram's **forced action pattern**: providing no alternative
option but to allow access to private data in order to proceed. The user is not
given an opt-out or alternative path; they must grant access to continue using the
feature.

```
FORCED ACTION PATTERN (Instagram example)

  +----------------------------------+
  |  Instagram                       |
  |                                  |
  |  To use this feature, allow      |
  |  access to your contacts.        |
  |                                  |
  |  +----------------------------+  |
  |  |      [Allow Access]        |  |
  |  +----------------------------+  |
  |                                  |
  |  (No "Skip" or "No thanks"       |
  |   option provided.)              |
  |                                  |
  |  User MUST grant access to       |
  |  proceed. No alternative path.   |
  +----------------------------------+
```

### Common Dark Pattern Types to Watch For

Based on the book's discussion and the Princeton/UChicago study:

| Pattern              | Description                                                |
|----------------------|------------------------------------------------------------|
| Forced Action        | Requiring users to perform an unrelated action to proceed  |
| Hidden Costs         | Revealing additional charges late in the checkout flow     |
| Misdirection         | Drawing attention away from important information          |
| Confirmshaming       | Guilting users into opting in ("No, I don't want to save money") |
| Sneaking             | Adding items to cart or changing selections without consent |
| Obstruction          | Making cancellation or opt-out deliberately difficult      |
| Social Proof (fake)  | Manufacturing urgency or popularity ("3 others viewing!")  |

---

## 4. Unintended Consequences

### The Core Problem

Companies seldom set out to create harmful products and services. Yet the harm
created by unintended consequences is **not excusable just because it was
unintended by the creators**. Yablonski is explicit on this point:

> "The harm created by these examples and countless others is not excusable just
> because it was unintended by the creators."

### Documented Examples from the Book

#### Facebook Like Button (2009) --> Addictive Feedback Loop

Facebook probably did not intend for the like button to become an addictive
feedback mechanism providing small dopamine hits of social affirmation, causing
users to return repeatedly to measure their self-worth.

```
INTENDED:                           ACTUAL:
+-----------------------+           +-----------------------+
| Simple way to express |           | Addictive feedback    |
| appreciation for a    |   --->    | mechanism providing   |
| friend's post.        |           | dopamine hits of      |
|                       |           | social affirmation.   |
| "That's nice!"        |           | Users return to       |
|                       |           | measure self-worth.   |
+-----------------------+           +-----------------------+
```

#### Facebook Infinite Scrolling --> Mindless Hours

Facebook probably did not intend for people to spend hours mindlessly scrolling
through news feeds.

#### Snapchat Filters --> Body Dysmorphia and Cosmetic Surgery

Snapchat probably did not intend for filters to change how people see themselves
or present themselves to others, or to drive some users to pursue cosmetic surgery
to recreate the look provided by filters.

#### Snapchat Disappearing Messages --> Predator Tool

Snapchat surely did not intend for the disappearing message feature to be used for
sexual harassment or to become a haven for sexual predators.

```
UNINTENDED CONSEQUENCES PATTERN

  [Feature designed for X] --at scale--> [Used for harmful Y]

  Like button     --at scale--> Addictive self-worth metric
  Infinite scroll --at scale--> Hours of mindless consumption
  Beauty filters  --at scale--> Body dysmorphia, cosmetic surgery
  Disappearing msgs --at scale--> Sexual harassment tool
```

### Research Citations on Technology's Negative Effects

| Study | Authors | Year | Key Finding |
|---|---|---|---|
| "Brain Drain" | Ward, Duke, Gneezy & Bos | 2017 | The mere presence of smartphones reduces available cognitive capacity, even when devices are turned off |
| "No More FOMO" | Hunt, Marx, Lipson & Young | 2018 | Links between social media use and increases in depression and loneliness in young adults; limiting social media decreases both |
| Adolescent depression/suicide study | Twenge, Joiner, Rogers & Martin | 2017 | Rise in suicide-related outcomes among adolescents linked to increased new media screen time after 2010 |

> "The mere presence of our smartphones reduces our available cognitive capacity,
> even when the devices are turned off." -- Ward et al., 2017

### The Ethical Imperative

Yablonski articulates the core tension directly:

> "When did 'daily active users' or 'time on site' become a more meaningful metric
> than whether a product is actually helping people achieve their goals or
> facilitating meaningful connections?"

**The misalignment:** The corporate goals of the business and the human goals of
the end user are seldom aligned, and more often than not, designers are a conduit
between them.

**The call to action:** "No longer is 'moving fast and breaking things' an
acceptable means of building technology -- instead, we must slow down and be
intentional with the technology we create and consider how it's impacting people's
lives."

---

## 5. The Ethical Design Framework

Yablonski outlines four practices for ethical, intentional design. These are not
abstract ideals -- they are concrete changes to how teams operate.

---

### Practice 1: Think Beyond the Happy Path

Teams that "move fast and break things" tend to focus exclusively on idealized
scenarios around idealized users that provide the path of least resistance. These
"happy paths" are devoid of use cases for when things go wrong outside of simple
technical errors. Failure to anticipate long-term consequences in favor of
short-term gain often leads to negligent and sometimes harmful outcomes.

> "Technology that scales without considering scenarios that stray from the happy
> path become ticking time bombs that leave the people existing outside these
> idealized scenarios vulnerable."

**Recommended approach:** Change the definition of the **minimum viable product
(MVP)** to focus on nonideal scenarios first, as opposed to the path of least
resistance. By placing edge cases at the center of thinking, teams create more
resilient products and services that consider the most vulnerable cases by default.

```
TRADITIONAL MVP vs. ETHICAL MVP

  Traditional MVP:
  +-------------------------------------------+
  |  Focus: Happy path first                  |
  |  [Ideal user] -> [Ideal flow] -> [Success]|
  |                                           |
  |  Edge cases: "We'll handle those later"   |
  +-------------------------------------------+

  Ethical MVP:
  +-------------------------------------------+
  |  Focus: Edge cases and vulnerable users   |
  |  [Vulnerable user] -> [Stress case] ->    |
  |      [Protected outcome]                  |
  |                                           |
  |  Happy path: Naturally covered because    |
  |  it's a subset of the broader design.     |
  +-------------------------------------------+
```

---

### Practice 2: Diversify Teams and Thinking

Homogeneous teams often have difficulty identifying blind spots that exist outside
their shared life experiences. This leads to less-resilient products and services
with disastrous results when things go wrong.

**Recommended actions:**
- Ensure teams are as diverse as possible -- comprising different genders, races,
  ages, and backgrounds -- to bring a broader spectrum of human experience into the
  design process from the outset
- Ensure personas derived from target audience research are not exclusively focused
  on user segments considered essential for an MVP; the more diverse the audience
  you design for, the more likely you will catch blind spots before they become
  bigger problems

---

### Practice 3: Look Beyond Data

Quantitative data tells us how quickly people perform tasks, what they look at, and
how they interact with the system. What it does **not** tell us is **why** users
behave a certain way or **how** the product is impacting their lives.

**Recommended approach:** Get out from behind a screen, talk with users, and use
qualitative research to inform how the design evolves in an impactful way.

```
QUANTITATIVE vs. QUALITATIVE

  Quantitative Data:                 Qualitative Research:
  +---------------------------+      +---------------------------+
  | WHAT users do:            |      | WHY users do it:          |
  | - Click rates             |      | - Motivations             |
  | - Time on page            |      | - Frustrations            |
  | - Conversion %            |      | - Emotional impact        |
  | - Scroll depth            |      | - Life consequences       |
  | - Session length          |      | - Unmet needs             |
  +---------------------------+      +---------------------------+
  | Tells you the WHAT        |      | Tells you the WHY and     |
  | and HOW MUCH.             |      | HOW IT AFFECTS LIVES.     |
  +---------------------------+      +---------------------------+

  BOTH are required for ethical design.
```

---

### Practice 4: Embrace Friction

Yablonski references Steve Jobs's description of the personal computer as a
"bicycle for the mind" -- a tool to expand capabilities and improve lives. He notes
that while this vision has been achieved in many ways, something else has also
occurred: instead of enhancing human abilities, technology has become a vehicle for
extracting attention, monetizing personal information, and exploiting psychological
vulnerabilities.

> "We've been made to think that any friction within a user journey is negative and
> should be eliminated wherever possible, to the point that frictionless has become
> synonymous with good user experience. But friction can also be a valuable tool
> when used appropriately."

**Legitimate purposes for friction:**

| Purpose                          | Example                                         |
|----------------------------------|-------------------------------------------------|
| Preventing errors                | "Are you sure?" confirmation dialogs             |
| Enhancing security               | Two-factor authentication                        |
| Avoiding unintentional actions   | Undo windows before permanent deletion           |
| Building credibility             | Verification steps that signal trustworthiness   |
| Promoting critical thought       | Summaries before purchase completion              |
| Encouraging moderation           | Screen time warnings and usage dashboards        |
| Preventing abuse                 | Rate limiting, cooldown periods                  |
| Protecting privacy               | Granular permission requests with explanations   |
| Steering toward healthier habits | "You've been scrolling for 30 minutes" prompts   |
| Long-term vs. short-term thinking| Spending summaries before one-click purchases    |

```
FRICTION AS PROTECTION

  WITHOUT ethical friction:
  [Impulse] ---------> [Action] ---------> [Regret]
            (instant)           (too late)

  WITH ethical friction:
  [Impulse] --> [Pause] --> [Reflect] --> [Informed Decision]
                  ^
                  |
            Friction point:
            confirmation, summary,
            cooldown, warning
```

---

### Ethics Audit Checklist (ASCII)

```
+====================================================================+
|                    ETHICS AUDIT CHECKLIST                            |
|              (Based on Laws of UX, Chapter 12)                      |
+====================================================================+
|                                                                     |
|  BEHAVIOR SHAPING AUDIT                              YES  NO  N/A  |
|  -------------------------------------------------------+---+---+  |
|  1. Does our product use variable/random rewards?    [ ] [ ] [ ]   |
|  2. Are there infinite loops (autoplay, inf. scroll)?[ ] [ ] [ ]   |
|  3. Do we display social validation metrics          [ ] [ ] [ ]   |
|     (likes, counts, rankings)?                                      |
|  4. Does personalization create filter bubbles?      [ ] [ ] [ ]   |
|  5. Do default settings serve the user's interest?   [ ] [ ] [ ]   |
|  6. Have we removed friction that protected users?   [ ] [ ] [ ]   |
|  7. Do features create artificial social obligations?[ ] [ ] [ ]   |
|                                                                     |
|  DARK PATTERN AUDIT                                                 |
|  -------------------------------------------------------+---+---+  |
|  8. Are there forced actions with no opt-out?        [ ] [ ] [ ]   |
|  9. Are costs/consequences hidden until late?        [ ] [ ] [ ]   |
|  10. Is cancellation harder than signup?             [ ] [ ] [ ]   |
|  11. Do we use confirmshaming language?              [ ] [ ] [ ]   |
|  12. Are items/options added without user consent?   [ ] [ ] [ ]   |
|                                                                     |
|  UNINTENDED CONSEQUENCES AUDIT                                      |
|  -------------------------------------------------------+---+---+  |
|  13. Have we stress-tested beyond the happy path?    [ ] [ ] [ ]   |
|  14. Have we considered vulnerable user populations? [ ] [ ] [ ]   |
|  15. Could any feature be weaponized for harm?       [ ] [ ] [ ]   |
|  16. Have we consulted diverse team perspectives?    [ ] [ ] [ ]   |
|  17. Have we done qualitative user research on       [ ] [ ] [ ]   |
|      how the product impacts people's lives?                        |
|                                                                     |
|  FRICTION & PROTECTION AUDIT                                        |
|  -------------------------------------------------------+---+---+  |
|  18. Have we added friction where it protects users? [ ] [ ] [ ]   |
|  19. Do confirmation steps exist for irreversible    [ ] [ ] [ ]   |
|      actions?                                                       |
|  20. Are there usage/screen time awareness tools?    [ ] [ ] [ ]   |
|  21. Can users easily control notification frequency?[ ] [ ] [ ]   |
|                                                                     |
|  METRICS ALIGNMENT AUDIT                                            |
|  -------------------------------------------------------+---+---+  |
|  22. Do our success metrics measure user well-being? [ ] [ ] [ ]   |
|  23. Is "time on site" balanced against "goal        [ ] [ ] [ ]   |
|      completion"?                                                   |
|  24. Are we measuring whether users achieve their    [ ] [ ] [ ]   |
|      own goals, not just our business goals?                        |
|                                                                     |
|  SCORING:                                                           |
|  - Any "YES" on items 1-7: Review for exploitative behavior        |
|  - Any "YES" on items 8-12: Likely a dark pattern -- fix it        |
|  - Any "NO" on items 13-24: Gap in ethical practice -- address it  |
|                                                                     |
+====================================================================+
```

---

## 6. Product Ethics Audit Template

This template combines all sections above into a single actionable tool for design
review sessions. Use it during design critiques, sprint planning, or product
retrospectives.

```
+====================================================================+
|                                                                     |
|              PRODUCT ETHICS AUDIT TEMPLATE                          |
|              Laws of UX -- Chapter 12 Framework                     |
|                                                                     |
|  Product/Feature: ___________________________                       |
|  Date: ___________  Reviewer(s): _____________                      |
|  Sprint/Release: ____________________________                       |
|                                                                     |
+====================================================================+

SECTION A: MANIPULATION METHOD SCAN
====================================================================
For each method, indicate if it is PRESENT, whether it is JUSTIFIED,
and what MITIGATION is in place.

+------------------------------------------------------------------+
| Method                  | Present? | Justified? | Mitigation     |
|                         | (Y/N)    | (Y/N)      |                |
+-------------------------+----------+------------+----------------+
| 1. Variable Rewards     |          |            |                |
|    (pull-to-refresh,    |          |            |                |
|     notification badges)|          |            |                |
+-------------------------+----------+------------+----------------+
| 2. Infinite Loops       |          |            |                |
|    (autoplay, infinite  |          |            |                |
|     scroll)             |          |            |                |
+-------------------------+----------+------------+----------------+
| 3. Social Affirmation   |          |            |                |
|    (likes, counts,      |          |            |                |
|     public metrics)     |          |            |                |
+-------------------------+----------+------------+----------------+
| 4. Personalization      |          |            |                |
|    (algorithmic feeds,  |          |            |                |
|     recommendations)    |          |            |                |
+-------------------------+----------+------------+----------------+
| 5. Defaults             |          |            |                |
|    (pre-selected opts,  |          |            |                |
|     privacy settings)   |          |            |                |
+-------------------------+----------+------------+----------------+
| 6. Friction Removal     |          |            |                |
|    (one-click actions,  |          |            |                |
|     skipped confirm.)   |          |            |                |
+-------------------------+----------+------------+----------------+
| 7. Reciprocity          |          |            |                |
|    (connection reqs,    |          |            |                |
|     manufactured oblig.)|          |            |                |
+-------------------------+----------+------------+----------------+

For any method marked PRESENT + NOT JUSTIFIED:
Action item: ________________________________________________
Owner: ________________  Due date: ______________


SECTION B: DARK PATTERN CHECK
====================================================================
Check each pattern. If found, it must be fixed before release.

[ ] Forced Action -- User must perform unrelated action to proceed
    Found where? _______________________________________________

[ ] Hidden Costs -- Charges revealed late in checkout/flow
    Found where? _______________________________________________

[ ] Misdirection -- Attention drawn away from important info
    Found where? _______________________________________________

[ ] Confirmshaming -- Guilt-based opt-in language
    Found where? _______________________________________________

[ ] Sneaking -- Items/options added without consent
    Found where? _______________________________________________

[ ] Obstruction -- Cancellation/opt-out made deliberately hard
    Found where? _______________________________________________

[ ] Fake Social Proof -- Manufactured urgency or popularity
    Found where? _______________________________________________

DARK PATTERN VERDICT:  [ ] CLEAR   [ ] ISSUES FOUND (must resolve)


SECTION C: UNINTENDED CONSEQUENCES ANALYSIS
====================================================================
For each question, write a brief response.

1. BEYOND THE HAPPY PATH
   What happens when this feature is used by someone in crisis,
   by a child, by an abuser, or by someone with a disability?
   ___________________________________________________________
   ___________________________________________________________

2. MISUSE POTENTIAL
   How could this feature be weaponized for harassment, fraud,
   manipulation, or harm?
   ___________________________________________________________
   ___________________________________________________________

3. SCALE EFFECTS
   What happens when millions of people use this feature daily?
   What emergent behaviors might arise?
   ___________________________________________________________
   ___________________________________________________________

4. PSYCHOLOGICAL IMPACT
   Could this feature:
   [ ] Reduce cognitive capacity (Ward 2017)?
   [ ] Increase depression or loneliness (Hunt 2018)?
   [ ] Negatively affect adolescent mental health (Twenge 2017)?
   [ ] Create compulsive checking behavior?
   [ ] Damage self-image or self-worth?

   If any box is checked, describe mitigation:
   ___________________________________________________________
   ___________________________________________________________


SECTION D: ETHICAL DESIGN PRACTICES CHECK
====================================================================

[ ] HAPPY PATH EXPANDED
    We have defined and tested nonideal scenarios, not just the
    path of least resistance. Edge cases are at the center of
    our MVP definition.

[ ] DIVERSE PERSPECTIVES
    Our team includes diverse genders, races, ages, and
    backgrounds. Our personas include non-MVP user segments and
    vulnerable populations.

[ ] QUALITATIVE RESEARCH
    We have conducted qualitative research (interviews,
    contextual inquiry, diary studies) to understand WHY users
    behave as they do and HOW the product impacts their lives,
    not just WHAT they click.

[ ] PROTECTIVE FRICTION
    We have intentionally added friction where it protects
    users: confirmation dialogs, cooling-off periods, usage
    awareness tools, granular permissions, spending summaries.


SECTION E: METRICS ALIGNMENT
====================================================================

List your top 3 success metrics for this feature:

1. ___________________________________________________________
2. ___________________________________________________________
3. ___________________________________________________________

For each metric, answer:
- Does this metric measure user well-being or business extraction?
- Could optimizing this metric harm users?
- Is there a balancing metric that measures user goal achievement?

THE KEY QUESTION (from Yablonski):
"When did 'daily active users' or 'time on site' become a more
meaningful metric than whether a product is actually helping people
achieve their goals or facilitating meaningful connections?"

[ ] Our metrics are aligned with user well-being
[ ] Our metrics need rebalancing (describe action plan below)
    ___________________________________________________________
    ___________________________________________________________


SECTION F: FINAL SIGN-OFF
====================================================================

Overall Ethics Assessment:

[ ] GREEN  -- No ethical concerns identified
[ ] YELLOW -- Minor concerns identified, mitigations in place
[ ] RED    -- Significant concerns, must resolve before release

Unresolved items requiring follow-up:
1. ___________________________________________________________
2. ___________________________________________________________
3. ___________________________________________________________

Signed: ___________________  Role: ___________________
Date:   ___________________

+====================================================================+
|  "We should build technology that augments the human experience     |
|   rather than replacing it with virtual interaction and rewards."   |
|                                            -- Jon Yablonski         |
+====================================================================+
```

---

## Key Quotes Reference

> "With power comes responsibility. While there's nothing inherently wrong with
> leveraging the insights from behavioral and cognitive psychology to help create
> better designs, it's critical that we consider how products and services have the
> potential to undermine the goals and objectives of the people using them."

> "The corporate goals of the business and the human goals of the end user are
> seldom aligned, and more often than not, designers are a conduit between them."

> "Ethics must be an integral part of the design process, because without this check
> and balance, there may be no one advocating for the end user within the companies
> and organizations creating technology."

> "No longer is 'moving fast and breaking things' an acceptable means of building
> technology -- instead, we must slow down and be intentional with the technology we
> create and consider how it's impacting people's lives."

> "Instead of technology enhancing our abilities as humans, it's become a vehicle for
> extracting our attention, monetizing our personal information, and exploiting our
> psychological vulnerabilities."

> "We should build technology that augments the human experience rather than replacing
> it with virtual interaction and rewards."

---

## Complete References from Chapter 12

| Author(s) | Work | Year | Key Finding |
|---|---|---|---|
| B.F. Skinner | *The Behavior of Organisms* | 1938 | Operant conditioning fundamentals |
| Ferster & Skinner | *Schedules of Reinforcement* | 1957 | Variable reinforcement is most effective |
| Natasha Dow Schull | *Addiction by Design* | 2012 | Slot machines as optimized Skinner boxes |
| Winnick & Zolna | "Putting a Finger on Our Phone Obsession" (dscout) | 2016 | 2,500-5,400 smartphone interactions per day |
| Liu, Gummadi, Krishnamurthy & Mislove | Facebook privacy settings study | 2011 | Defaults matched expectations only 37% of the time |
| Dinner, Johnson, Goldstein & Liu | "Partitioning Default Effects" | 2011 | People rationalize default acceptance |
| Toma & Hancock | "Self-Affirmation Underlies Facebook Use" | 2013 | Self-affirmation drives social media use |
| Ward, Duke, Gneezy & Bos | "Brain Drain" | 2017 | Smartphone presence reduces cognitive capacity |
| Hunt, Marx, Lipson & Young | "No More FOMO" | 2018 | Limiting social media decreases loneliness and depression |
| Twenge, Joiner, Rogers & Martin | Adolescent depression and suicide study | 2017 | Links between screen time and suicide-related outcomes |
| Mathur, Acar, Friedman, Lucherini, Mayer, Chetty & Narayanan | Dark patterns at scale | 2019 | 1,818 dark pattern instances across 11K shopping sites |
