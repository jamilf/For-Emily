# Experience Audit — Emily's Study Sanctuary

A candid expert-panel review (cognitive neuroscience/ADHD, learning science, UX research, game &
immersion design, and a blunt product critic), speaking in one honest voice. This is a **read-only
analysis**: no application code was changed in this pass. It is grounded in the actual codebase with
file references, scored with justification, and ends with prioritised, integration-ready
recommendations.

A note on evidence: claims below name a mechanism and flag the **strength of evidence**. No
citations, studies, or statistics are fabricated. Where I'm uncertain I say so. I explicitly avoid
debunked or overstated claims — learning styles, left/right-brain, and the idea that the **25/5
Pomodoro ratio is established science** (it is not; it is one productivity convention among many).

---

## Headline (the honest version)

The bones are genuinely good, and the *gift* quality is rare. The core focus loop is a
textbook-correct answer to the hardest ADHD problem — task initiation — and the re-entry experience
is unusually kind. **But the app rewards time and presence, not learning**, the two real learning
loops (the focus timer and the flashcards) never talk to each other, and the world has begun to
**sprawl into ~22 surfaces** — many of which are different cosmetic *viewers* of the same underlying
metric (trees grown). For an ADHD user, that sprawl is not free: it is decision load and a pleasant
browsing surface that can quietly compete with studying.

**The central tension:** a reward-rich world built to *support* studying is one or two design
decisions away from becoming a comfortable place to *avoid* it. The current design mostly avoids the
trap where it matters most (you cannot grow the grove by fiddling with menus — only real focus
sessions and real reviews move it), but it is drifting at the edges.

---

## Phase 1 — The real loops, traced as Emily (with friction)

### Starting a focus session — **1 tap.** (Excellent.)
- The timer is the always-visible hero, never behind a modal (`src/App.jsx:166`,
  `src/components/PomodoroTimer.jsx:254-493`). Default 25/5 is hardcoded (`PomodoroTimer.jsx:20`).
- One tap on **Start** runs the timer and *immediately* spawns a growing seedling
  (`PomodoroTimer.jsx:392-398, 196-201`). The optional "What's the one thing?" intention field
  (`PomodoroTimer.jsx:286-302`) adds a second tap only if she chooses.
- On completion, a tree is harvested into `emily.garden`, the session is logged, stats update, and a
  reflection modal opens (`PomodoroTimer.jsx:87-117, 96-103`). Tab-away > 10s withers the seedling —
  a gentle, restartable, non-shaming check that *some* real attention happened (`:124-143`).
- **Friction: essentially none.** This is the single best thing in the app.

### Reviewing flashcards — **2 taps** to studying, real retrieval practice. (Strong, but siloed.)
- A **Leitner** box system: `BOX_DAYS = [0,1,3,7,16,35]`, ratings `again/hard/good/easy`
  (`src/data/flashcards.js:1-21, 60-102`). `again` resurfaces today and increments a `struggling`
  counter; `good` advances a box; `easy` jumps two and doubles aggressively.
- **Active recall is real**: the prompt is hidden, "try to answer from memory first…", revealed on
  flip (`Flashcards.jsx:527-540`). **Interleaving** via shuffle (default on) with a struggling-first
  bias (`Flashcards.jsx:424-432`, `scheduler.js:103`).
- Stats live in `emily.flashcardStats` (`correct/total`, streak; `flashcards.js:163-196`).
- **The gap:** flashcards are **fully independent** from focus sessions. The two loops share no UI,
  no reward, no narrative. This is the biggest structural miss in the app.

### Returning after a break — **0 taps**, warm, non-shaming. (Excellent.)
- Re-entry is classified by local-day gap (`story.js:238-256`); a 3+ day gap blooms a one-per-day
  **comeback gift** ("while you were away, a wildflower opened all on its own…"; `story.js:427-449`,
  `ComebackMoment.jsx`). Otherwise an `aria-live` sprite greeting that never steals focus
  (`SpriteGreeting.jsx:40-48`). At most one ambient announcement shows (`App.jsx:232-266`).
- A missed day "quietly restarts the streak — it is never framed as broken"
  (`PomodoroTimer.jsx:154-155`). This is exactly right for ADHD shame cycles.

### Surface area — **~22 entry points.** (The problem.)
Header Toolbar carries ~11 buttons (Focus, Flashcards, Journal, Constellations, Quests, Story,
Guide, Sync, + Seasons, Themes); the Dock adds Mixer/Flashcards/Zen; the Garden adds Almanac,
Spirits, Memory Grove; plus always-on Timer, Meter, Garden, Brain Dump, and the Firefly Calendar.
Many are **derived viewers of the same growth data**.

### First run — no onboarding, only empty states + an on-demand Guide.
A new user sees the timer (ready), the header line "Pick one thing, start the timer, and let the
rest wait", and gentle empty states ("Your garden is empty for now. Finish a focus session and a
tree shows up here."; `FocusGarden.jsx:50-65`). The Guide (`GuideModal.jsx`) covers 18+ features in
a warm voice ("There is no wrong way to be here, Emily."). For a 1-tap start this is fine; for ~22
surfaces it leaves discovery to chance.

---

## Phase 2 — Scores (1–5, differentiated)

### 1. Study & learning efficacy — **3 / 5**
**Strengths.** The flashcard engine does the two things that matter most, and both rest on **strong
evidence**: the **testing effect / retrieval practice** (retrieving strengthens memory more than
restudy) and the **spacing effect** (distributed practice beats massing). Active recall is enforced
by the hidden-answer flip; interleaving exists by default.
**Weaknesses / risks.** (a) The *celebrated* reward currency is **time-on-task** — minutes,
sessions, trees — which is a **weak proxy for learning**; you can complete a 25-minute tree without
learning anything, and rewarding minutes can incentivise presence over genuine focus. (b) The focus
loop and the flashcard loop are **siloed** — the app's emotional payoff (the grove) is decoupled
from its strongest learning mechanism (retrieval). (c) **No metacognitive feedback on retention** —
she sees activity (streak/minutes) but never "what am I actually remembering?" Leitner is also
cruder than a modern scheduler (e.g. SM-2-style), though that is a minor point next to the
integration gap.
**Biggest opportunity.** Tie a slice of grove reward to **retrieval success**, and invite a few
cards at the end of a focus session — fuse the two loops.

### 2. Immersion & world — **4 / 5**
**Strengths.** Genuinely cohesive and clearly *made for her*: one pixel-art language, a single
palette and Pixelify Sans, a living day/night background, generative focus music, scene parallax,
and a companion with a real voice. The soot-sprite letters and Grove Story give the world warmth few
study apps attempt.
**Weaknesses / risks.** Thematic **fragmentation**: Story, Letters, Seasons, Themes, Spirits,
Constellations, Almanac, Memory Grove, Journal, and Quests are *many* overlapping systems narrating
the same growth. Immersion that requires browsing eight menus stops supporting focus and starts
competing with it.
**Biggest opportunity.** One companion-led "Grove" surface that absorbs the derived viewers.

### 3. User experience — **3 / 5**
**Strengths.** The 1-tap start, the always-visible timer, the non-shaming tone, strong reduced-motion
and `aria-live` accessibility, and good empty states.
**Weaknesses / risks.** **~22 entry points and an 11-button toolbar** are a lot of extraneous choice
for an ADHD user; **cognitive load theory** (extraneous load taxes limited working memory — a
**well-established** principle) predicts this costs focus and decisions. (The popular "choice
overload" effect is **contested/suggestive**, so I lean on cognitive load, not on a hard claim that
more options reduce action.) There is **no guided first run**, and the no-tabs, everything-is-a-button
model makes discovery uneven. Several features are near-duplicates (see below).
**Biggest opportunity.** Cut and merge top-level surfaces; add a tiny, skippable first-run nudge.

### 4. Neuroscience of focus & productivity — **4 / 5**
**Strengths.** This is where the app quietly shines. **Immediate, visible reward** — the tree grows
*during* the session — directly addresses **delay discounting in ADHD** (a steeper preference for
immediate over delayed reward; **moderate-to-strong** support in the ADHD literature). Novelty and
curiosity (letters, comeback blooms, unlockables) are delivered **without dark patterns** — no FOMO,
no punitive streaks. **Externalised working memory** (Brain Dump) and a visible clock (timer +
Firefly Calendar) are sound **executive-function scaffolds**. The nature aesthetic plausibly supports
**attention restoration** via soft fascination (Attention Restoration Theory; **moderate** evidence).
The self-compassionate framing (no broken streaks) is well-aligned with evidence that **reduced shame
sustains effort** (moderate).
**Weaknesses / risks.** **Flow's challenge–skill balance is essentially unsupported** — the session
is a fixed 25/5 regardless of task difficulty or current capacity, and **25/5 is treated as a default
truth when it has no strong empirical basis**. **Break quality** is just a countdown, not restorative
by design. The intention field is a missed **implementation-intention** ("if-then" planning, a
**strong**-evidence task-initiation aid) — right now it's a free-text note, not a plan.
**Biggest opportunity.** Let session length match the task (challenge–skill + planning), and make
breaks actually restorative.

### 5. Cross-cutting — coherence & emotional resonance — **4 / 5**
Split honestly: **emotional resonance ≈ 5** (this feels like a love letter; the companion, the
voice, the comeback kindness are treasures Emily could keep for months), **coherence ≈ 3** (the
surface area is starting to sprawl). Averaged to 4, with the tension named: the *meaning* is
outstanding; the *organisation* is drifting. A single spine would let the resonance carry the whole
thing instead of leaking across 22 doors.

---

## The steelman: is this pleasant procrastination?

**The case for "yes."** The app is dense with rewards that *feel* productive but are not studying:
browsing the Grove Almanac, arranging the Memory Grove, reading letters, switching Scene Themes,
admiring Constellations. For a novelty-seeking ADHD brain, this is a near-perfect procrastination
surface — it scratches the dopamine itch with motion that looks like work. The more such surfaces
exist, the more attention they can absorb from the studying they're meant to serve.

**The case for "no," and the honest verdict.** The app's primary defence is strong and deliberate:
**the reward currency is gated behind real effort.** Trees grow only from completed focus sessions;
most unlocks key off `grown`, `activeDays`, `streak`, `reviews`, `reflections` — all earned, never
bought by menu-fiddling (`grove.js` SPECIES rules, `story.js` storyMetrics). You cannot inflate the
grove by decorating it. That single decision is what keeps the app on the right side of the line.

**Verdict:** the *earning* of rewards is well-protected; the *spending/browsing* surface is where the
risk lives, and it is growing. The fix is not to remove warmth — it is to **consolidate the browsing
surfaces** so the world stays rich but stops offering eight separate detours. This is the audit's
central recommendation.

---

## Phase 3 — Synthesis & the unifying spine

**Proposed spine: "You and the sprite tend one grove that grows from real focus and real recall."**
The companion relationship is already the most resonant thread; make it the through-line everything
ladders to.

How each system maps to the spine:

| System | Verdict | Why |
|---|---|---|
| Pomodoro timer | **Connect (core)** | The grove's engine. Keep at 1 tap. |
| Flashcards | **Connect — and fuse** | The retrieval engine; currently orphaned from the grove. |
| Brain Dump | **Connect** | Externalised working memory; a genuine EF aid. |
| Focus Meter / Firefly Calendar | **Merge** | Two views of the same time-series; pick one canonical. |
| Grove Story / Letters / Greetings / Comeback | **Connect (the voice)** | This *is* the companion. Keep central. |
| Almanac / Spirits / Memory Grove / Seasons / Themes / Constellations / Journal | **Merge into one "Grove" guide** | All are derived viewers of the same growth metric. |
| Focus Quests | **Cut or merge** | Daily objectives risk becoming a to-do list / streak pressure, against the ethos. |

**The two or three changes that would most improve the experience:**
1. **Fuse the learning loops** — tie part of the grove's reward to retrieval, and offer end-of-session
   card review.
2. **Collapse the ~8 derived viewers** into one companion-led Grove surface (the big simplification).
3. **Let the session fit the task** — optional session length + turn the intention into an if-then
   plan; make breaks restorative.

---

## Phase 4 — Recommendations (prioritised, integration-ready)

Each reuses existing systems and respects the non-negotiables (additive `emily.*`, idempotent
migrations, WCAG AA + reduced motion, no new deps, non-shaming, single source of truth).

### R1 — Fuse the loops: reward retrieval, not just minutes  · NOW · impact High · effort Med
- **Problem.** The celebrated currency is time-on-task; the strongest learning mechanism (retrieval)
  is siloed and uncelebrated.
- **Evidence.** Testing effect / retrieval practice (**strong**) and spacing (**strong**). Mechanism:
  retrieval reconsolidates and strengthens memory traces more than restudy.
- **Reuse.** `emily.flashcardStats` (`correct/total`), `recordReview`, and the grove unlock engine
  (`grove.js reconcile`) which **already has a `reviews` metric**. Extend reward to retrieval (e.g. a
  varietal or a sprite letter for "cards recalled"), and add an optional "review a few cards?" prompt
  on the post-session reflection screen — closing the loop while completion dopamine is high.
- **Risks / implies.** Do **not** gate the primary tree on cards (protect the 1-tap, no-shame start).
  Implies merging the two loops in UI and narrative.

### R2 — Collapse the derived viewers into one "Grove" guide  · NOW · impact High · effort Low–Med · **(the simplify/cut rec)**
- **Problem.** ~22 entry points, an 11-button toolbar; extraneous cognitive load for an ADHD user, and
  the browsing surface that fuels the procrastination risk.
- **Evidence.** Cognitive load theory — extraneous load taxes limited working memory (**well-
  established**). (I deliberately do **not** lean on "choice overload," which is **contested**.)
- **Reuse.** Almanac, Spirits, Memory Grove, Seasons, Themes, Constellations, Journal are all already
  derived from `storyMetrics`/`groveMetrics` — **no data change**, pure information architecture: one
  companion-led surface with sections, replacing 7–8 top-level buttons.
- **Risks / implies.** Cuts toolbar buttons; needs careful section design so nothing feels buried.
  Highest coherence-per-effort in the whole list.

### R3 — Let the session fit the task (and retire 25/5 as gospel)  · NEXT · impact Med · effort Low
- **Problem.** Fixed 25/5 ignores challenge–skill balance and current capacity, and 25/5 has no strong
  empirical basis.
- **Evidence.** Flow conditions — clear goals, immediate feedback, **challenge–skill match**
  (Csikszentmihalyi; **theoretical/moderate**). The 25/5 ratio specifically: **not established
  science** (myth flag).
- **Reuse.** The intention field already exists; add an optional, remembered duration (e.g. 15 / 25 /
  45) chosen alongside "the one thing", so effort matches the task. Doubles as a planning/EF aid.
- **Risks / implies.** Keep 25 the **default** and the choice optional — never add taps to the 1-tap
  start.

### R4 — Show retention, not just activity (close the metacognition gap)  · NEXT · impact Med · effort Low–Med
- **Problem.** Feedback is all activity (minutes/streak/trees); none on what she's actually retaining.
- **Evidence.** Metacognitive monitoring + feedback improves self-regulated learning (**moderate–
  strong**).
- **Reuse.** `flashcardStats` and the Leitner **box distribution** already encode mastery vs
  struggling. Surface it in the companion's voice ("you've moved 12 cards toward mastery; three tricky
  ones are coming back around") — honest, non-shaming, no new data.

### R5 — Make breaks restorative, not just a countdown  · LATER · impact Med · effort Low
- **Problem.** The 5-minute break is an empty timer; break quality matters for sustained attention.
- **Evidence.** Attention Restoration Theory / soft fascination (**moderate**); micro-breaks aid
  vigilance (**moderate**). The Guide already mentions 20-20-20 for eyes — good, underused.
- **Reuse.** The living scene, parallax, and audio already exist. In break mode, foreground the scene
  and offer one gentle restorative line (look far away, breathe) — **no tasks**, no pressure.

### R6 — Audit "Focus Quests" for pressure  · LATER · impact Low–Med · effort Low · **(a cut candidate)**
- **Problem.** Daily objectives can drift toward a to-do list and implicit daily-login pressure, in
  tension with the no-shame ethos.
- **Action.** Decide whether Quests earn their place or fold into the companion's gentle, optional
  suggestions inside the Grove surface. Bias toward cutting.

### Impact vs effort

```
        LOW EFFORT            HIGH EFFORT
HIGH    R2 (simplify)         R1 (fuse loops)
IMPACT  R3 (session sizing)
        ----------------------------------------
LOW     R5, R6                R4 (lean low/med)
IMPACT
```

### Sequence
- **Now:** R2 (collapse the viewers) and R1 (retrieval-linked reward + end-of-session review).
- **Next:** R3 (session sizing + if-then intention) and R4 (retention feedback).
- **Later:** R5 (restorative breaks) and R6 (Quests audit/cut).

Bias throughout: **deepen meaning and coherence, not feature count.** The app does not need more; it
needs its strongest threads — the companion, real focus, real recall — pulled into one line.

---

## What is genuinely excellent (specific, earned praise)
- **1-tap start with a tree growing in real time** — the correct answer to ADHD task initiation and
  delay discounting, executed cleanly.
- **The re-entry experience** — comeback gifts and a streak that never "breaks". Quietly kind, and
  rare.
- **Reward gated behind real effort** — the one decision that keeps a reward-rich app honest.
- **The companion's voice and the made-for-her craft** — this reads as a gift, not a template.

These are worth protecting as everything else gets simplified around them.
