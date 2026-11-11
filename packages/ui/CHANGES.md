# Local changes to the design handoff

This package is the component library delivered from Claude Design ("Home schooling app design" handoff), kept as close to verbatim as possible. Divergences from the delivered files, and why:

- **Removed trailing `module.exports = {...}` lines from every `.jsx` file.** The files are ESM (they use `export function` throughout); the CommonJS lines were a gallery-bundling artifact and break ESM imports under Vite (`module` is undefined in the browser).

Everything else — styling, component behavior, the architecture contract in README.md — is untouched. Per the library's own rules: compose, don't restyle.

## v2 "Modern" pass — owner-directed redesign (Oct 2026)

Shastri asked for an Apple-style modernization: more depth and polish, same warm
palette, illustrations, and playfulness. This supersedes the original "compose,
don't restyle" rule for the changes below; everything else stays handoff-verbatim.

- `tokens.js`: radii up (10/14/20/999 — continuous, pill-friendly), layered soft
  shadows (`card`/`float`/`btn`), frosted-chrome tokens (`glass`, `hairline`,
  `glassBlur`), spring motion curves (`spring`, `motion.lift`), display tracking −.035em.
- `primitives.jsx`: Button is a pill; primary/ink lift on hover with shadow;
  outline variant became an Apple-style gray fill (borderless). Card and Chip are
  borderless — elevation separates surfaces, not strokes.
- `app.jsx`: NavBar is frosted glass (backdrop blur + hairline); nav items and the
  Kredit balance are pills; WorldTile lifts on hover (translate + float shadow)
  instead of darkening its border.
- `quiz.jsx`: answer tiles, quit button, coin chip, and end-of-round stat cards are
  borderless with soft elevation; feedback states still ring in green/red.

### Age-adaptive illustration dial (same pass, follow-up)

Pre-teen feedback: the big mascots and saturated tints read "little kid." Instead of
removing the illustrations (they carry the brand and help younger kids), illustration
presence now scales with the grade band via `band(grade)`, which gained Home-surface
knobs: `title`, `wellH`, `wellBlob`, `tint`, `jumpBlob`, `standBlob`, `standFlood`.
Grades 3-4 keep big friendly blobs, 24% world tints, and the flooded lime stand card;
grades 7-8 get 48px accent blobs, 9% tints, a 36px headline, a compact neutral stand
card, and a smaller play mascot. `HomeScreen` takes a `grade` prop; `WorldTile` takes
`wellH`/`wellBlob`/`tintPct`; `worldTint(c, pct)` accepts a percent.

## Economy v2 in QuizRound (Oct 2026)

Owner-directed reward rework (see docs/KAMPUS_CURRICULUM_PLAN.md §4 for the evidence):
- **Teach Tokens**: 3 per run. A token buys the teach panel at full pay — help is a
  budget to spend strategically, not a fine. After tokens: the original half-pay.
  Token dots live in the play HUD.
- **First-try bonus** (+5): answers on the second-look retry pass still pay, just
  without the bonus — fewer tries earns more, visibly.
- **Opt-in Blitz** (`blitz` prop): fast answers (<8s) pay ×1.5. Never the default —
  untimed remains the ADHD-safe baseline; the kid chooses Blitz per round.
- **Payout breakdown chips**: every gain shows why (×2 streak / ×1.5 blitz /
  +5 first try / token used / halved · help) as tag pills under a large +N.
- EndOfRound: dot row of the run (green = correct) + first-try stat card.
- Formula mirrors @kampus/engine `payout.js`, the tested source of truth.
- `round_end` payload adds `firstTries` and `tokensUsed`; `answer` adds
  `firstTry`, `fast`, `tokenUsed`.

Design direction (owner references, Oct 2026): huge numerals as heroes, tag pills
for metadata, dot-matrix progress, tone-on-tone nesting, ink pills + one accent.
Applied here first; rolls through remaining surfaces in Phase 3.

### Dashboard in the reference language (same pass)

- Ground lightened (#F7F5F1 → #FAF9F6); frosted nav slightly brighter.
- Content locked to 1080px, centered (NavBar inner + HomeScreen).
- Hero is a mixed-weight sentence: muted base, values in bold ink
  ("You've earned **356 Kredits** this week.").
- `KreditsWeekCard` and the tickets card lead with huge numerals.
- New `PracticeHeat` (home.jsx): contribution-grid of the last 10 weeks,
  fed by `data.practiceDays` ({'YYYY-MM-DD': runCount}).

### ShareWillow-inspired shell (owner reference, Oct 2026)

Top nav kept (owner's call after trying a sidebar), with the reference's soul:
cream page (`color.sidebar` #F7F2E6), the app floating as a white content sheet
(28px radius, hairline edge), **outline boxes** — `Card` and `WorldTile` now use
hairline borders with no shadow (hover lift keeps its float shadow) — and the
bank prominent top-right: green bold Kredit balance plus a "+N this week" chip.
A `SideBar` component was built during the exploration and stays in app.jsx,
unused by the kid shell; candidate for the Grown-ups side in Phase 4.

### Tasky-inspired pass (owner reference, Oct 2026)

- **Serif display accent**: Instrument Serif (`font.display`), used ONLY for hero
  numerals and emphasized hero values (italic) — grade-chip digits, week/tickets/
  practice numerals, RecordsLedger. Inter Tight remains the UI font everywhere else.
- **RecordsLedger** (app.jsx): Tasky "Your records" bands — big serif numeral left,
  label right, one tint per row. HomeScreen renders it from `data.records` in place
  of the separate tickets + week cards (which remain for data without records).

## §0 pass — STYLE_GUIDE "0. Locked direction" (3b, 2026-10-19)

The design deliverable's §0 is the binding visual spec and supersedes both the v2
"Modern" pass above and the list in `docs/DESIGN_TO_CODE_HANDOFF.md`. Step 1 of the
integration build applies it to the token layer only; the screens follow in later steps.

- **Ground is `#F5F7F9`** (blue-grey, was `#FAF9F6` cream). `apps/web/index.html`
  body background matches.
- **Instrument Serif is retired.** Removed `font.display` and dropped the font from
  the stylesheet link. Its six call sites (balances, grade numerals, record counts,
  greeting emphasis) now use the §0 display-numeral style: Inter Tight **300**,
  `letter-spacing:-.045em`, `font-variant-numeric: tabular-nums` — exposed as
  `type.numeral` and the `numeral(size)` helper. Inter Tight 300 added to the link.
- **IBM Plex Mono loaded** for exactly one future surface, the Rewards receipt
  (`font.mono`). It is the only non-Inter-Tight face in the app.
- **New §0 colors**: `rule #EEECE7` (in-sheet section rule), `locked #E6EAEE` with
  `disabledText`, `todo #D9DEE4`, `fill`/`track`, `held #FBF6E4`, `loss #C2463B`
  (money lost — deliberately distinct from the `red #E4766C` wrong-answer ring),
  `savingTint`, `navRule`/`vRule`, and `muted rgba(35,37,43,.55)`. `goldDeep` moved
  to `#8A6D1C`. Legacy keys are kept and labelled, because the v1 app still renders
  from them.
- **Grade purple ramp**: `gradePurple` (`#C7B8F0 #B3A0EA #9E87E2 #8A6FD9`) +
  `graduation #6E4FCC`, with `purpleFor(i)`. Passed grades never use world colors.
- **Shape**: `radius.sheet 28` / `gradeCard 20` / `dayCell 16`; `shadow.sheet` is
  `none` — the white sheet has no shadow and no border. Added `shadow.stackTop`,
  `stackTopGold` and `stackEdge` for the overlapping grade stack.
- **`layout`** carries the §0 desktop frame (`340px | 1fr`, gap 48, pad 48).
- **Money helpers**: `money()`, `signed()` (Kredits always render with `$`) and
  `dollars(cents)` for the real-reward ledger, which is integer cents and always
  shows two decimals.
- **`primitives.jsx`**: disabled buttons are a solid `#E6EAEE` fill with 45% ink text
  (no bordered ghost); `gold` is the real `#E8C94F`; added a `held` variant and
  `PillLabel` (the white pill label that sits above a numeral). `Card` gained a
  `sheet` variant (radius 28, no shadow, no border); **`dashed` now renders a solid
  ground fill** because §0 bans dashed outlines outside the receipt. `Chip` is a
  borderless pill. `Toggle` off-state is `todo`, on-state `greenDeep`.

Not yet §0: Home still uses the pre-§0 layout (records ledger, world grid, right
rail). That is Step 5 (Home Grade Stack), which replaces it wholesale.

## Step 2 — the shared Question component (§0 4d / 4f)

New `src/question.jsx`, the one question surface used by the daily lesson, free-practice
missions, unit quizzes and the grade test. Per the handoff's wiring contract it is
controlled: the caller owns picked/help/tokens/payout and the component reports intent.

- Contract: `{text, givens[{k,v}], find, family, answers[4], correct, hint, show,
  teachSteps[], scaffold?, scaffoldLevel?}`. `context` ('lesson' | 'mission' | 'quiz' |
  'test') decides help: all four in lesson and mission, **Read it only in quiz and test**
  (`HELP_BY_CONTEXT`).
- Desktop 4d: left "What you know" ruled givens (15/700 label, 40px/300 value, Find at 45%
  ink) + ink family chip + the 2×2 NEED HELP pill grid with right-aligned costs; right a
  white r28 sheet with the 40px/600 prompt and 2×2 answers (numbered key discs, 34px light
  numerals). Correct `#EAF6EE`/`#58B372`, wrong `#FBEDEC`/`#E4766C`.
- Phone 4f: givens collapse to a 3-column strip on ground, the help grid moves inside the
  sheet under the answers (`track` pills, 44px), help box `#F2F4F6`, and answering is
  pick-then-**Check** with the button full-width at the foot.
- Teach is gated exactly as §0 words it — "Spend a Teach Token? N left this run. A token
  keeps full pay. Save them for the hard ones." with "I'll try first" / "Use a token"
  ("Teach me anyway" at 0). Teach is free during a lesson's new skill (`teachFree`).
- Wrong answers read "Not yet. Here's the step: …" and offer the hint, never a fail state.
- `PayoutLine` exported for reuse: 44px/300 green `+$N` plus the breakdown pills.

`QuizRound` now renders choice questions through `Question` while keeping its own state
machine, Economy v2 math and event payloads unchanged (`answer`, `teach_open`,
`round_end`, `again`) — the free-response modes (number line, fraction, money,
thermometer) still use their own widgets. Its content column widens to 1180px for choice
questions so the §0 desktop grid has room.

Also moved `useWidth` and `speak` into `primitives.jsx` so `question.jsx` can use them
without an import cycle; `quiz.jsx` re-exports `speak`, so `@kampus/ui/quiz` is unchanged
for consumers. Added the `./question` package export.

## Step 4 — the Daily Lesson (§0 7a / 7b)

`src/lesson.jsx` and `src/interactives.jsx`.

- `DailyLesson` runs the five moves in order — Warm-up (drawn from the review queue),
  New idea (the teach phase), Guided (fading scaffolds), Mixed (interleaved), Prove it
  (no help). Questions reuse `Question` at `context="lesson"`. No timer anywhere.
- `LessonSpine` is the §0 top bar: five labelled columns, one 6px segment per question
  (done green, current ink, todo `todo`), clickable to jump back, with the "+$N today"
  green pill, the three-dot Teach Tokens pill and "Untimed".
- `TeachSteps` is the cheat-sheet frame: the left column's steps each write their
  takeaway as a note line once solved, so the column ends as a five-line cheat sheet;
  the right sheet shows one step with Back / Next and a "Read it to me" pill.
  **Every interactive step gates Next** — reading is not enough.
- `interactives.jsx` holds the three hands-on steps: `ShadeBar` (20 blocks at 5%, ink
  under / green exact / red over), `SplitTheBill` ($48 → ten $4.80 discs → double-tap to
  cut one into $2.40 halves → collect exactly 15%), and `SpotTheMistake` (tap the wrong
  line: "Found it", or "Checks out" on a line that is actually right). `INTERACTIVES`
  lets a lesson name its interactive as data.
- `ReteachView` is the §0 New idea / re-teach view (kicker, title, lede, three ruled
  rows, last value green). Prove-it misses branch into it, then two fresh questions.
- `LessonDone` shows the two tiles — Kredits today, and the real reward as
  "Waiting on a grown-up".

Two fixes made while verifying this step:

- **Fast Refresh was broken by Step 2.** Re-exporting `speak` from `quiz.jsx` (a
  component module) made Vite fall back to a full page reload on every edit, losing app
  state each time. `useWidth` and `speak` now live in `src/util.jsx`, which exports no
  components. The `.jsx` extension is load-bearing: `vite.config.js` injects React into
  `.jsx` only, so a `.js` file holding a hook builds clean and then throws
  "React is not defined" at runtime. `speak` is no longer re-exported from
  `@kampus/ui/quiz` — import it from `@kampus/ui/util`.
- **`buildLesson()` ran on every App render**, re-rolling every question mid-lesson
  because the generators are random. It is memoized per grade/topic/tier/attempt now.

## Step 5 — Home (§0 3b / 3a, with the Brief v4 retrofit)

New `src/home-stack.jsx`. The pre-§0 `home.jsx` `HomeScreen` is left in place for the
gallery and as reference; `apps/web` now renders `HomeStack`.

- §0 frame: `340px | 1fr`, column-gap 48, page padding 48, everything on ground with
  exactly one white sheet.
- Left: the two-line greeting (values in ink, the rest muted) bottom-aligned with the
  stat block, over the **grade stack** — overlapping bands (`margin-top:-14px`) with the
  §0 edge treatment, passed grades deepening along the purple ramp, current in ink with
  lime unit dots, locked in `#E6EAEE`, and grade 8 masked into the ground over 48px. Only
  the bottom card is fully rounded. Opening a passed grade grows its padding and pushes
  the stack down, revealing **"Test 19/20"** and an ink `+$N` chip — a score, never a
  letter grade or a percentage.
- Right: `Bank` / `Kredits this week` as white pill labels over 44px/300 numerals split by
  a 1.5px rule, green when up and `loss` red with `−$` when down, plus the Today/Week pill
  switch. Then the sheet: **Today's lesson** standing out by scale not fill (kicker, world
  chip, "~20 min · no timer", 34px title, the five labelled move segments, 96px ink Start),
  then **Free practice** rows, then the lime stand band.
- Progress counts **units**, not runs: "unit 3 of 7 · 38 of 130 lessons · grade test opens
  after unit 7".
- **Blitz is opt-in per row** and never on by default: the pill toggles ground → ink
  "⚡ Blitz on" and the row's meta gains "×1.5 under 8s"; starting the round is a separate
  tap on the play button.
- The stand band is gated by the lesson — "Class first, then the register opens." with the
  55%-white "Opens after the lesson" pill until today's lesson is done.
- Week view: a 7-column calendar of run cards with today as an ink "+ Next run" tile.

`NavBar` moved to the §0 app frame too: it sits on the ground under a 1.5px
`rgba(35,37,43,.12)` rule instead of a frosted card, Kredits render with a `$`, and the
avatar is a 38px world-colour disc with an ink initial — §0 explicitly bans the blob
illustration in the nav.

## Removal of the pre-§0 components

With §0's replacements in place, the superseded components were deleted rather than left
to rot beside them. Removed: `Gallery.jsx` and `gallery-preview.jsx` (the old showcase and
its generated bundle, imported by nothing), `home.jsx` (`HomeScreen`, `PracticeHeat`),
`flows.jsx` (`StudentOnboarding`, `RewardsPanel`, `ShopGrid`), `parent.jsx` (the Modernist
Grown-ups surfaces and P-primitives), `gamify.jsx` (`DailyQuests`, `CampusMap`), and the
pre-§0 Home components inside `app.jsx` (`GradeCard`, `WorldTile`, `KreditsWeekCard`,
`TeachConfirm`, `SideBar`, `GradeChips`, `RecordsLedger`). `app.jsx` is now just the app
frame: `NavBar`.

`PinGate` was the one piece worth keeping — Step 8 restyles it and §0 never drew a PIN
gate — so it moved to its own `pin-gate.jsx` and the rest of `home.jsx` went with the
others. Package exports dropped `./flows`, `./parent`, `./home` and `./gamify`, and gained
`./pin-gate`.

What they covered, and what covers it now: Home → `home-stack.jsx`; the question surface →
`question.jsx`; teaching → `lesson.jsx` + `interactives.jsx`. Rewards, Grown-ups and the
business are §0 rebuilds in Steps 7–9, not ports of `flows.jsx`/`parent.jsx`. Onboarding,
the shop, daily quests and the campus page are all on the handoff's explicit
"not designed yet — do not build" list, so nothing replaces `gamify.jsx` or `flows.jsx`'s
onboarding today.

Kept deliberately: `index.html` (the v1 app families use at mykampus.ai — a shipping
product, not an old design) and `quiz.jsx` (free-practice runs still use `QuizRound`, and
the mission screen is not one of the ten build steps).

## Step 6 — unit quiz and grade test (§0 8a/8b, 10a/10b)

`src/assessment.jsx`, on the new `packages/engine/src/assessment.js`.

- `AssessmentIntro` — the shared intro of plain rule rows (Questions · Timer None ·
  Help Read it only · Reward · Retake), with the test's copy reading "Covers everything
  your state expects for grade N". Never "Common Core".
- `AssessmentRunner` — the question map (5 columns on desktop, a 10-wide strip on phone;
  answered cells fill ink, the current one takes a 2px ring), Back/Next, and the last
  button that reads **"Go to blank"** while anything is unanswered and only then
  "Hand it in". Nothing is marked right or wrong until the paper goes in: the runner
  holds `Question`'s `feedback` at `null` and passes the new `selected` prop so a pick
  shows without revealing anything.
- `UnitQuizResults` — a verdict per skill with its dots and next-step line, the tally by
  verdict, and "$1.00 For taking it".
- `GradeTestResults` — the two check rows (16+ right · every cluster has one right), then
  either the ink district card or a **repair plan**, plus the 5×2 cluster grid. There is
  no fail state anywhere in the component.
- `VerdictPill` is the only way a result is ever stated: Solid / Shaky / Not yet.

`Question` gained a `selected` prop so a quiz can show the chosen answer without feedback.

Two defects caught by running it rather than reading it:

- **Assessment questions rendered with no answers.** The engine speaks
  `choices`/`answerIndex` and `Question` speaks `answers`/`correct`; the lesson had its own
  adapter, so the gap only showed up here. Rather than add a third adapter,
  `withQuestionProps()` in the engine now emits both shapes, forces `mode: 'choice'` (a
  quiz never shows a free-response widget), and derives `hint`/`show`/`teachSteps`. A test
  pins the contract.
- **The repair plan listed the same unit twice**, because a world's core and stretch
  clusters shared a label. Stretch clusters are now "… · the harder ones", with a test
  asserting every cluster label is distinct — two identical rows in a repair plan are
  indistinguishable from a bug.

## Step 7 — Rewards (§0 9a / 9c)

`src/rewards.jsx`, on the new `packages/engine/src/earnings.js`. Tickets are retired;
the currency is real money in integer cents, always printed with two decimals.

- **`Receipt`** is the left column and the one surface in the app set in **IBM Plex Mono**,
  and the one place §0 allows dashed rules. It prints in §0's order: centered KAMPUS BANK
  header with the receipt number, EARNED THIS WEEK as `day · desc · +$x`, Subtotal, the
  "Weekly limit $5.00 · $x left" line, HELD FOR ASKS (or "Nothing held"), AVAILABLE with
  the 34px total, SAVING FOR with a ten-cell `■□` bar and "$x to go", then
  "Paid for effort. Never for scores." It ends in a torn-paper edge built from two
  gradients on a 14px period. Below it, on the ground, the "How you earn" list.
- **The sheet** is the wishlist: the two-tone headline, the store-link paste pill, then
  From stores / At home / Waiting on a grown-up, split by `rule`.
- `StoreRow` carries the progress bar (available ÷ price) and "$x to go" / "You have
  enough"; `HomeRow` is the grown-up's own offers. Button states follow §0 exactly —
  Ask for it (ink), Asked ✓ (`held`), Save for it, Saving ✓ (`savingTint`), and a
  disabled "Need $x more".
- **Asking holds the money**: available drops at once, a held line appears on the receipt,
  and a `held`-tinted row with Cancel appears under Waiting.

The engine module is where the rules actually live:

- `RATES` pays for **effort only** — lesson 50c, unit quiz 100c, grade test 150c, five-day
  streak 50c. There is no parameter anywhere that could carry a score, and a test asserts
  that passing one changes nothing.
- The **weekly cap** ($5.00 default; a grown-up may set $3/$5/$8) trims the last award to
  whatever is left rather than overshooting, and never claws back an earlier row.
- `ask` / `approve` / `cancelAsk` model the hold, and `receiptModel` returns the receipt
  already ordered so the component formats but decides nothing.

## Step 8 — Grown-ups (§0 11a / 11b)

`src/parents.jsx`, behind the carried-over `PinGate`. Three tabs, with the weekly limit
bar and "Paid for effort. Never for scores." always visible beside them.

- **Approvals** — Earned rows (label, day, 32px green amount) with §0's Hold / Approve
  pair, and **"Over limit"** disabled when approving that row would pass the cap. Closed
  rows keep their place with an Approved / On hold tag and an Undo. Asks get Not now /
  Say yes. The footer's "Approve all earned" approves oldest-first and stops cleanly at
  the cap.
- **Progress** — three ground stat tiles over per-world rows (dot · name · current unit ·
  placement · verdict pill, reusing `VerdictPill` so the vocabulary stays Solid / Shaky /
  Not yet everywhere).
- **Settings** — the §0 controls, now actually wired: Weekly limit $3/$5/$8 and Lesson
  length 12/17/22 as segmented pills, and toggles for Allow Blitz, Fluency sprints and
  Shop vacation mode.

### The ledger gained an approval step

§0's approvals queue only makes sense if an earning is provisional until a grown-up says
yes, so `earnings.js` changed shape (this supersedes part of Step 7):

- `award()` records the **full rate immediately as `pending`** and no longer applies the
  cap. A capped-out week never shrinks what the kid actually did.
- The **cap binds at approval**: `approveEarning()` refuses — without changing anything —
  when a row would pass it, which is what drives the "Over limit" button. `wouldExceedCap()`
  exposes that to the UI, and `approveAllEarned()` walks the queue and stops at the cap.
- `availableCents()` counts **approved** earnings only, so the Rewards receipt shows what
  a grown-up has actually okayed. `receiptModel()` gained `waitingOnGrownUp`.
- `deferEarning()` / `undoEarning()` back the Hold and Undo buttons; both are reversible
  and neither destroys a row.

## The pilot-ready campaign (Phases A–D)

Driven by `PROMPT.md`, with precedence `KAMPUS_PLAY_SYSTEM.md` > `BUSINESS_CLEANUP.md` >
`START_HERE.md` > the older docs. §0 stayed binding for every visual throughout.

- **`question.jsx`** gained `selected` (show a pick without revealing right or wrong, for
  quizzes) and `snag` (the "no pay, just a look" variant, which also suppresses the help
  stack — having the move is precisely what she lacks).
- **`lesson.jsx`** gained the Snag phase before the teach panel, and now plays the real
  128-day sequence rather than demo content.
- **`home-stack.jsx`** gained the care-loop feed under the greeting, the stand's
  build-out thumbnail on the lime band, and an assessment-day variant that does not draw
  a five-move spine for a quiz.
- **`assessment.jsx`** is Inspection Day and the License, assembled from the bank's own
  `quizSkills()`.
- **New: `business.jsx`** — the Living Business, revealed one system per open day per
  BUSINESS_CLEANUP. Karla as a strip rather than a modal, an Ask Karla pill, and the six
  declutter rules (one event strip, a sentence not a stat row, three stock columns until
  drift, promos as a pill row, the ladder behind a Grow pill).
- **`parents.jsx`** gained the business-coach and sound toggles.
- **`quiz.jsx`** lost its running streak chain, and **`parents.jsx`** lost the parent's
  "N-day streak" — PLAY_SYSTEM §4 bans the chain that can break, and showing a parent one
  only moves the guilt. The multiplier still pays; it reads as an earning in the payout
  pills.

Engine modules added: `sources.js` (the three-source rule), `skill-index.js`
(`problemsForSkill`), `assessment.js`, `earnings.js`, `review.js`, `business-types.js`,
`seasons.js`, `care.js`, `market.js`, `field.js`, `metrics.js`.

## Round 3 (ROUND3.md, Oct 2026)

Twelve items, in order. §0 stayed binding; §0a (onboarding) and §0b (polish) are
additive layers on it, and both arrived in this round. Precedence unchanged.

**Items 1–7** are recorded above and in git: the production-lesson fix and
`docs/PRODUCT_AUDIT.md`, the world rename behind one string table (B1 Task 0), one
`Shell` owning the nav (B1), the lesson completion guard (B4), the grade stack's
placed-vs-passed states (Task 3), the wishlist tiles and the preview Worker scaffold
(Task 4), and the week plan from the real 128-day sequence (Task 2).

**Item 8 · Onboarding (§0a).**
- **New: `pin-pad.jsx`** — the one PIN pad, used in all four places a PIN is asked for.
  No lockouts and no countdowns, per the ADHD laws: a wrong PIN clears the dots, says so
  once, and lets her try again.
- **New: `onboarding.jsx`** — `ParentSetup` (13a–13r), `StudentFirstRun` (14a–14h) and
  `Doorway` (15a–15f) on one §0a frame. The magic-link step is a local mock and says so
  on the screen; Supabase auth is Phase 2.
- **`pin-gate.jsx`** now wraps `PinPad` instead of drawing its own keypad. It runs in
  'set' mode the first time through, because §0a gives setup no step for a grown-ups PIN
  and the kid's own unlock PIN must not open the grown-up side.
- **Blobs: `Coffee.svg`, `Invoice.svg` and `Talk.svg` are gone.** All three referenced
  `st0/st1/st2` with no `<style>` block, so every shape fell back to black, and the
  deliverable's copies are byte-identical. The colours are not recoverable and §1.1 says
  never recolor, so they were dropped rather than guessed at. `Target-2.svg` added; the
  set is 78. See `docs/ASSETS.md`.

**Item 9 · Teach steps (§0b Task 1, split).**
- **New: `teach-layouts.jsx`** — `WalkLayout`, `FaceoffLayout`, `LineLayout`, `BarLayout`,
  plus `TakeawayBand`, `NotesCounter` and `VoiceRow`. A step is data; the runner picks the
  component by `layout`. Every layout shows the hint on a wrong pick and never locks.
- **`lesson.jsx`** `TeachSteps` gained `{stepIdx, solved[], notes[]}`, the takeaway band,
  the 4-cell notes counter beside the cheat-sheet kicker, and the voice band — which comes
  from the grade (a: 3–4 auto-reads, b: 5–6 disc only, c: 7–8 the pill), not from a
  setting. The older prompt/body step shape still renders, so un-upgraded panels work.
- Authoring was split per ROUND3 and stayed split: four authored reference skills
  (`eqFrac` → bar, `unitRate` → faceoff, `addInt` → line, `twoStep` → walk) in
  `packages/curriculum/src/teach-steps.js`, and every other panel converted mechanically
  from its authored `{do, ex}` pairs. A test asserts the converter never paraphrases.

**Item 10 · `SnagReveal` (AUDIT B7).** A Snag whose answer is not a plain number now
renders as the scene, the question, and "Show me what it was". Six of the 45 authored
Snags were being fed through numeric distractor generation, which put the answer among
bare integers where she could win it by shape. `snagChoices` moved to
`packages/engine/src/snag.js` and returns `[]` for anything it cannot shape honestly.

**Two deliberate deviations from §0a/§0b**, both caught in a rendered screenshot and
both resolved in favour of §0, which outranks them:
- The doorway's profile tiles are **white**, not the `#F5F7F9` §0a names. That value is
  also the page ground, so on the real page the tiles were invisible. §0's own rule —
  ground stays paper, cards stay white — settles it.
- The face-off cards pad their inner edge past the 48px "or" disc, which overlaps both
  cards by 24px. Without it the right card's count and price started underneath the disc.

**Items 11–12 · The suites.** `tests/test_webapp.mjs` drives the built bundle (57 checks,
including the onboarding happy path, the five-move lesson, the business day, the week view
and the teach layouts); `tests/test_layouts.mjs` renders the four layouts at 1280 and 390
(18 checks). Both run in CI. 376 unit tests.

### After the sweep: the Task 0 condition was not actually met

"Grep for a retired world name returns zero hits" passed while six of them were still
in both copies of `GRADE_WORLDS` — unread by the React app, overwritten at load by the
legacy one. Removing them exposed the real problem: the bank names a world on every
unit, fourteen units still use the pre-rename names, and `worldForUnit` looked them up
against the string table and fell through to a fractions default. The lesson runner
keys the adaptive tier on that, so **236 of 768 lesson days were reading and writing
the fractions tier whatever they were teaching**.

`packages/engine/src/unit-world.js` now does the translation, mapped off the per-grade
world map the engine shipped before the rename rather than guessed at. The bank keeps
its own wording, as the do-not-re-author rule requires. The grep check is rescoped to
the surfaces that render and is a test now, not a claim.

### Placement check (Oct 2026)

**New: `placement.jsx`** — `PlacementIntro`, `PlacementRunner`, `PlacementResult`.

Deliberately not built on `AssessmentRunner`. That component shows the whole paper
with a question map, blanks and a hand-in, which is right for Inspection Day and
wrong here: a placement check is adaptive, so the next question depends on the last
answer and there is nothing to jump back to. A map she could not use would be a lie
about how the screen works.

The screen shows no score, no right/wrong mark, no tally and no money, because the
check must never read as an exam. Help is capped at "Read it": a hint would tell us
she can do work she cannot yet do alone, which is the one thing this screen is for.
The progress bar never moves backwards — a settled topic shortens the check, and a
bar that lost ground would read as a penalty.

The adaptive state machine is `packages/engine/src/placement.js`; the component
renders one question and reports one answer, per the zero-dependency contract.

## Teach depth: "Show me another one" (owner directive, Oct 2026)

Play-testing verdict from the family: the lessons are thin — one worked example per
skill, and the re-teach after a missed prove-it replayed the very panel she had just
not understood. "Teach more than once" lands as three changes:

- **`TeachSteps` grows on request.** `teach.more` carries a second worked example
  (same strategy, fresh surface) and, for the ten classic wall skills, a plan-B
  REPRESENTATION — the bar when symbols failed, money when the bar did. A
  `Show me another one` outline button on the final step splices them in before the
  Try it, which stays last and still gates the mission. Never auto-shown: a kid who
  got it the first time is not made to sit through a second telling.
- **Re-teach shows new work.** `ReteachView` now receives the second example
  (kicker `Same idea, new numbers`) rather than the original panel; the old panel
  remains the fallback for any skill without one.
- **Event:** `teach_more { count }` when the extra example is opened, so the pilot
  report can say which skills needed a second telling.

Data lives in `packages/curriculum/src/teach-depth.js` (SECOND_EXAMPLES for all 79
skills, PLAN_B for 10); the seam work is in `apps/web/src/year.js`.

### Full-sequence teach coverage, and the crash it found (Oct 23)

`tests/test_webapp.mjs` now walks a whole authored teach sequence to "Start the
mission" for one grade per band (3, 6, 8), solving every layout the way a kid would
— walks by tapping every row, line/bar/faceoff by the real answer, which the test
gets from the bank through `year.js` rather than by reading the page. Each check is
named by the skill, so a bank patch that breaks a step points at itself.

It immediately found a crash on the most common path in the product. `DailyLesson`
holds `phase` and `at` as separate state, and `finishMove` advanced `at` while
leaving `phase` to a `useEffect` that runs after render. That left one render with
`at` on the next move and `phase` still `teach`, so `TeachSteps` dereferenced an
undefined `teach` and threw — unmounting the entire app. **Clicking "Start the
mission" blanked the screen for every kid, on every lesson with a New idea.**

Fixed at source (`finishMove` sets the phase in the same batch) and guarded in
`TeachSteps` (`teach?.steps` / `teach?.more`). Either fix alone prevents the blank,
so the suite cannot tell them apart; both are kept, and the e2e fails on a blank
screen if both are reverted.

### Business moments reach the screen (Oct 23)

**New: `MomentCard` in `business.jsx`.** `makeMoment` has always generated the
math a customer in the line actually asks for — from her price, her stock, today's
market, which PLAY_SYSTEM §2 calls the crown jewel of the three-source rule — and
`customersForDay` has always attached up to three per day. No screen ever asked
them.

A customer carrying a moment now stops the line until it is answered, and the card
renders above the queue: under it, a 26-customer day put the question that stopped
everything below the fold. "Serve the rest" serves everyone up to that customer and
then asks, so the fast path stays useful without letting the math be skipped in one
tap.

It is a question, not a gate. A wrong answer shows the working and the customer is
served anyway — the §5 rule has to hold for questions standing inside the business
— and it pays nothing, because serving the line is the job and the profit is the
reward.

### Assessments end to end, and a resumable paper (Oct 26)

`AssessmentRunner` takes `initialAnswers` / `initialAt` / `onProgress`, so the app
can persist a paper in progress. An untimed twenty-question test is exactly the
thing a kid walks away from, and a reload used to throw away every answer and drop
her back at the intro.

The suite now sits both papers start to finish — Inspection Day and the License,
the pass and the miss — reading correctness from the paper the app stored so a run
can be driven to either outcome deliberately. It found three things: the repair
plan scheduled nothing, passing the License skipped the first lesson of the new
grade, and the §5 rule had never been checked on these screens at all.

### The money path, driven end to end (Oct 26)

`AssessmentRunner` aside, nothing here changed: the money path was already right,
and the point of this pass was to prove it against the built bundle rather than
against the engine alone. Effort earns a pending row at the full rate, a grown-up
approves it behind the PIN, the weekly cap binds at APPROVAL (an over-cap row reads
"Over limit" and is refused without changing anything), Hold and Undo are both
reversible, "Approve all" stops cleanly at the cap, and the receipt counts only
what was okayed.

### The weekly pilot report (Nov 2026)

**New: `report.jsx`** — the artifact a pilot family receives, rendered in Grown-ups
under "This week". Parent-facing, one column, big figures, readable on a phone and
croppable to the card for sharing.

The ADHD laws decided most of the design, because a weekly summary to a parent is
the likeliest place for a streak or a deficit to creep in. Show-up days are a count
with **no denominator** — "3 out of 7" on a Wednesday is four days missed, stated
as arithmetic. A quiet week says where she is and that nothing was lost. Nothing on
the page scores the kid: no percentage, no accuracy, no grade. The one health line
("we're restocking a lesson") is worded so it can only read as a fault of ours.

The component formats and decides nothing; `apps/web/src/report.js` folds the
figures out of `weeklyRollup` / `returnRate` / `lessonReadiness`.


## Teach me: reveal, not prose — and the markup leak (Nov 2026)

The owner's play-test found two things on the warm-up help panel. Literal
`<b>18</b>` on screen: 106 engine teach strings carry v1-era `<b>` markup that
the legacy app rendered via innerHTML and React printed as text — `rich()` in
`question.jsx` now renders the marked spans as emphasis and drops any other
stray tag. And the panel itself dumped every teach line at once, a numbered
wall of prose at the exact moment an overloaded kid asked for help.
`TeachReveal` replaces the `<ol>`: lines arrive one tap at a time, the same
move as the walk layout, with the answer-carrying last line emphasised in
green. Keyed by question so a new question starts the reveal over.

## The second example is the default, not an option (Nov 2026)

Owner verdict on the "Show me another one" button: an opt-in affordance asks
for exactly the executive function an ADHD kid is short on — recognising she
needs more and requesting it — so the kid who needed the second example most
was the least likely to tap it. Decided: the system decides, not the kid.

- The second worked example now sits IN the teach sequence by default, spliced
  in by the seam (year.js) before the Try it. No button; `TeachSteps` is static
  again.
- The plan-B representation fires automatically on the one struggle signal we
  trust — the re-teach after a missed prove-it shows it (`Another way to see
  it`) instead of re-showing the second example the kid has now already seen.
  Skills without a plan B re-show the second example; the original panel stays
  the last fallback.
- `teach_more` is no longer emitted (nothing is opt-in to measure).

### Cues drive the math (Nov 2026)

`useCue` in teach-layouts dispatches a `{name, nonce}` pair — the nonce so the same
cue twice running fires twice. `row.N` reveals that walk row, `bar.*` and `line.*`
drive the existing bar and line transitions, `card.N` spotlights without picking,
`prompt`/`takeaway` highlight what they name. Cues are triggers into transitions
that already existed; none of them is a new renderer.

Karla's demonstration is held apart from the kid's answer. The first version drove
the real state and fired `onSolve`, which enabled Next while she sat listening —
audio granting progress, which breaks the law as surely as audio blocking it. The
bar now tints a `demo` that her first tap clears, and the line draws the hop and
marks the landing without setting `picked`.

On a `tryIt` step the state-changing cues are dropped: the check stays hers.


### The re-teach panel gets the plumbing for a voice (Nov 2026)

`ReteachView` is the last teaching surface with no voice, and the one the kid
reaches at the lowest moment in the lesson — she has just missed the prove-it.
Owner's decision: voice it. The scripts arrive with the tranche-3 bank patch, so
what landed here is everything that does not depend on them.

- `ReteachView` takes `voice`, `muted` and `onEvent`, and renders `SayItShowIt`
  when `teach.speakLines` exists. With no script it renders exactly as before —
  no voice row, no highlight.
- `row.N` highlights that row; `prompt` highlights the title. A cue here
  **highlights, it does not reveal.** The rows are a reference she is reading
  after a miss; hiding four of them to reveal them one at a time takes
  information away at the worst possible moment — the opposite of what the panel
  is for.
- Nothing on this panel can be solved, so the gating law is about `onContinue`:
  no cue, clip or audio state touches it. The button is live from first paint,
  during playback, and after Quiet.


## The setup frames center in the viewport (Nov 2026)

Owner catch on beta: the onboarding and placement frames pinned to the top of
the window and left a sea of ground below — fine at laptop heights, unbalanced
on anything tall. All four full-height frames (SetupFrame and the three
placement screens) now center their composition vertically on desktop. Phones
stay top-aligned: centering a tall flow on a small screen pushes the first
field off balance and fights the keyboard.

## 2⁶ was reading as 26 (Nov 2026)

Owner catch on a grade-8 warm-up: the engine writes exponents as v1-era
`<sup>` markup, and the React side either stripped it (`rich()` — so
2<sup>6</sup> displayed as 26, which changes the MATH) or rendered the raw
tags (the question h2, the quiz paper). `rich()` now raises `<sup>` spans
properly and is applied to question text in both the lesson and the paper;
`plainSpeech()` feeds the voice, saying "2 to the 6" — never "twenty-six".
Spec guards both tags from leaking as text.

### The script is the hero while she speaks (Nov 2026)

The say-it-show-it display had drifted from the approved demo: the spoken script
sat above the math as small grey rows, which reads as a caption — something to
skip. For a kid with auditory processing delays who rushes reading, the line
being said has to be the biggest thing on screen while it is being said.

- The current line renders at the prompt's own scale (one `headlineSize` now
  feeds both the `h2` and the script, because two expressions for "the prompt's
  size" drifted apart the moment the hero line arrived — 34px against the h2's
  40). Lines already said settle to reading size above it; lines still to come
  are held faint so the block does not jump as each one arrives. When she stops,
  the whole script settles and the step gets the screen back.
- Within the current line the highlight sweeps word by word, each word's slice
  of the clip proportional to its length (letters + 1, so a one-letter word is
  not given a zero-width slice).
- **The sweep is driven by the clip's own clock**, not by a timer. `audio-bus`
  exposes `progress()`, and the component reads `currentTime` each frame. That
  is what makes `Slower` slow the sweep and the voice together: playbackRate
  changes how fast currentTime advances, so there is nothing to keep in
  agreement. A timer would have had to be told, and would have drifted.
- Two timing sources, one shape. `sweepPlan()` returns proportional fractions
  today and will return exact per-word times the moment the manifest carries
  them — timings whose word count does not match the line are refused rather
  than stretched over it.
- Reduced motion holds the whole line instead of sweeping. A word-by-word crawl
  is precisely the movement that setting is asking us not to make.

Laws unchanged and asserted: nothing in the path touches `solved` or Next, and
the spec checks Next is still gated by the step with the hero script running.

### The markup sweep: fractions were broken on screen (Nov 2026)

Ordered after the `<sup>` catch — grep every string the engine emits for v1
markup vocabulary and either migrate it through `rich()` or report it clean. It
was not clean. Three classes, and one of them was live and wrong in front of
kids:

- **Stacked fractions, 17 skills.** `<span class="fr">…` had no handler, and the
  app's own seam flattened every tag to a space before the string ever reached
  `rich()`. A grade-4 equivalent-fractions question was being shown as
  **"3 5 = ? 15"** where the question is "3/5 = ?/15". Nothing errored; the
  number was simply wrong on screen, in the lesson the owner's family re-tests on.
- **`&nbsp;`**, 4 skills — five literal characters wherever the flattener did not
  reach it.
- **`<br>`**, 4 skills — dropped entirely, joining two sentences: "…for $12.What's
  one cup?"

`rich()` now understands the whole vocabulary (bold, superscript, stacked
fraction, line break, entities) and `plainSpeech()` speaks all of it — a fraction
is "1 over 3", never "13". Answer buttons go through `rich()` too; they carry the
same markup and were rendering their own tags.

The lesson that generalises: **stripping a tag does not leave a gap, it joins
what was either side of it.** 2<sup>6</sup> became 26, and 1/3 became 13. A guard
that only looks for raw markup on screen can never catch this, because flattening
removes the markup — it just takes the maths with it. So the new check looks for
the fraction bar itself, and restoring the flattener fails it with "4 6 = ? 18".

### The question screens join the product (Nov 2026)

The teach phase got the redesign and the voice; the warm-up, guided, mixed and
prove screens were still the old app — and they are the first thing every kid
sees. Owner's call: the same treatment, not a lesser one.

- **The question speaks, and sweeps.** `useSpokenLine` in say-it-show-it owns one
  spoken line with the sweep following whatever timing it can get: exact per-word
  times from the manifest or the voice cache, the clip's own clock otherwise, and
  — when there is no clip at all — the browser voice's `boundary` events, which
  report the character the voice has reached. Not a timer: a real position in the
  sentence. The bottom of the chain is silence, not breakage.
- **`rich()` can sweep.** It had to: the question carries fractions, exponents
  and bold, so sweeping plain words would have undone the markup fix. A markup
  token counts as one word, `richWords()` returns the list in render order, and
  without a sweep the output is exactly what it was.
- **Karla hosts every move.** One spoken line when a move opens, from the bank's
  new `moveIntros` kind. The kinds are discovered, so the pipeline needed nothing
  — except a prefix: `more` and `moveIntros` both wanted "m", and the collision
  guard caught it rather than letting one overwrite the other's clips.
- **The card got the world's colour**, a hairline on the sheet and on the chosen
  answer, and answers press under a tap. The press is a scale, not a colour: this
  card already uses colour for right, wrong and chosen, and a fourth meaning
  would make the three that matter harder to read.
- **Teach me is a mini-walk** — the result in numeral type, the move beside it,
  one row per tap. The rows are derived from the engine's own sentences, and a
  step with no result stays prose rather than having a phrase forced into the
  numeral column.

Two things the work found rather than added. The manifest arrives after the
first render, so the host spoke in the browser voice on every cold load and was
cut off by the clip a moment later — it waits for the manifest to SETTLE now
(null means not yet, an object means answered). And a voice that reports no word
boundaries at all would have left the whole question in unreached grey for the
length of the sentence; no sweep is the normal rendering until one actually
starts.

### Hope reads everywhere (Nov 2026)

The question screens already spoke; the ASSESSMENTS did not. Owner's call: a
self-learning kid has no adult beside her to be the reader, and that is most
true on a paper — the screen where a reading difficulty is most easily mistaken
for a maths one. So Inspection Day, the grade test and placement now read the
question with the same sweep as a lesson.

- `AssessmentRunner`, `PlacementRunner` and `QuizRound` forward the voice
  contract to `Question`; the mission screen, which renders its own prompt
  rather than a `Question`, got the same `useSpokenLine` + `rich(text, {word})`
  treatment it was missing.
- **The question only.** On a paper there is no hint to read and no step to
  walk: reading the question is an accommodation, reading the way to the answer
  would be sitting the test for her. The spec asserts no swept word exists
  anywhere outside the prompt.
- Band policy, scoring and gating are untouched, and the spec checks every
  answer stays tappable while she is being read to.

### Three defects from the owner's play-test (Nov 2026)

All three were found by eyes on beta, which means the specs were blind to all
three. Each now has one.

**The Snag was silent** — the one question surface with no reader, and the first
beat of a new idea, met before anything has been taught. It reads now: Karla's
intro, the scene and the question as ONE beat in one voice. That meant folding
the move host into the screen (it had its own face and its own clip) and
teaching `rich()` an `offset`, so a single sweep can cross from one element into
the next.

**The mission screen was the same bug three times over.** The world's mascot
floated above the card while Question's disc sat inside it; the question was
stuck in the not-yet-reached grey; and the sweep never moved. One cause: two
readers on one surface, each calling `speechSynthesis.cancel()` on the other,
leaving a hook that believed it was still talking with the sweep parked on word
one. A choice question is read by Question, so the mascot stands down — one
face, in the slot the lesson uses.

Two hardening changes came out of it:

- **The speech engine's own flag is the truth.** `onend` does not always arrive
  — a cancelled utterance, a voice that never starts — and when it does not, the
  text stays greyed forever. The hook polls `speechSynthesis.speaking` and
  releases when it says it has stopped.
- **The pale grey belongs inside the line being read**, not across the screen.
  A thirty-word beat left the question greyed for the ten seconds it took to
  read everything before it.

**Hope was too fast.** Fixed at playback, not by regenerating a word: bands a
and b read at 0.9, band c at 1.0, and Slower drops to 0.75 and is REMEMBERED for
that kid on every surface (`settings.voiceRate`). The sweep rides the clip's
clock, so it stays in step at any rate — and the CI stub now honours `u.rate`,
because a stub that ignored it would let "Slower slows both" pass against a
product that slowed neither.

### Readers take turns (Nov 2026)

On a band-a move two readers arrive together: Karla introduces the move and the
question reads itself. Both fired on mount, so whoever went second cut the first
off mid-word. Nothing stranded — the engine's own flag is polled — but a kid
with auditory processing delays who loses half a sentence has lost the sentence.

- `util.jsx` counts active utterances. `speechSynthesis.speaking` is the truth
  about sound coming out, but it is false in the gap between queueing an
  utterance and the voice starting — exactly the window two readers land in.
  `onend`/`onerror` are wired whether or not the caller asked for them, and
  `hushSpeech()` forces the count to zero so a dropped cancel event cannot leak
  it upward forever.
- `whenVoiceQuiet()` serves waiters ONE AT A TIME, in arrival order. Polling
  alone was not enough: two readers mounting in the same commit schedule their
  first poll for the same tick and both see a quiet product, because neither has
  started yet. It is a wait, never a gate — the cap means a stuck flag costs a
  pause and not the read, and the spec checks every answer stays live throughout.
- **A reader may only stop the voice it started.** This was the real defect
  underneath. `stop()` hushed globally, so when the move host's effect tore down
  — which it does the moment the clip manifest settles — it silenced the
  question mid-sentence and zeroed the shared count. The host then fired into an
  apparently quiet product at 109ms. The voice has an owner now.

Found by tracing, not by reasoning: the first four explanations were wrong, and
the trace (`question fires at 49ms · host queues at 57ms · host fires at 109ms`)
named the cause in one run.

### Play-test round two (Nov 2026)

**A blocked read is an invitation, never a lie.** On a freshly loaded page Chrome
refuses both `speechSynthesis.speak()` and `audio.play()` until the kid has
touched something. The companion sat on "Reading it to you…" and read nothing.
Now `not-allowed` and a rejected `audio.play()` settle the hook at once — label
back to "Tap me to hear it", nothing swept — and the block is CONVERTED: one
page-level `pointerdown` listener re-fires the pending read on her first tap
anywhere, through the same turn-taking queue. She should not have to find the
disc. One listener, most recent read only, withdrawn when it fires or when its
screen goes.

**Practice teaches.** The ask the generators author — `Q('Which is bigger?', …)`
— was dropped between the engine and the screen, so a kid saw "1/6 or 1/2" and
no question. It is carried now through every seam (practice, lesson, papers) and
rendered with the maths as ONE heading, spoken as one read with one sweep across
both. And a miss opens the worked steps free: the miss has already cost the
streak and the first-try bonus, and charging a token for the lesson that follows
it is a fine on learning. Asking for "Teach me" before answering still costs —
help stays a budget.

**The Snag's dead column.** Question rendered its desktop grid with an empty
340px left column — a Snag has no givens and no help stack — so the sheet
floated right of a hole. The column only exists when it holds something.

One thing the walk-through caught that the spec did not: opening the walk on a
miss opened it TWICE on a choice question, once in Question's help column and
once in this component's own teach strip. One panel per surface.

### The sweep on a real voice, and a trace for the field (Nov 2026)

**Chrome's network voices fire no boundary events.** Only `localService` voices
report where they are in a sentence, and the word sweep was built on exactly
that — so on the owner's browser a question was read aloud with every word left
in the not-yet-reached grey. Every spec passed, because the stub always fired
boundaries. Two changes, both inside the "two timing sources, one shape"
contract:

- `speak()` prefers local voices. Not for quality: they are the only ones that
  report boundaries, and they start without a network round trip.
- A THIRD timing source. When a voice has started and said nothing about itself
  for half a second, the sweep is driven from the clock through the same
  proportional plan the clip path uses without per-word times. A boundary
  arriving at any point takes over. The spec's stub starts and ends and never
  reports anything in between; the sweep must still move.

**The browser voice never armed the invitation.** Only the clip path did, so
every surface reading through the browser voice — the Snag's folded line, any
question without a cached clip — went silent on a blocked page with no way
back. That is the owner's live finding (a): a trusted tap that brought nothing
back. The blocked-read spec now runs on the Snag, where there is one reader and
"the read she was promised" is unambiguous; removing the fix fails it.

**`?voicetrace=1`** logs every queue claim, autoplay attempt, failure reason and
invitation arm/fire/withdraw. Off by default, costing one regex. Four defects in
this path have existed only on real pages, and the one that was traced was named
in a single run.

### The voice bar: one reader, one place, every surface (§0c, Nov 2026)

A design packet came back with four new binding sections (§0c–§0f) and a new
screen file. This entry is §0c's **voice bar** only; the rest of §0c (the Teach
me and re-teach redesigns, the worked animation stage) and §0d–§0f are not
built.

**What was wrong.** The voice had arrived on every surface one surface at a
time, and each had grown its own chrome: band a's companion row above the h2,
band c's "Read it" pill inside the help grid, the Again / Slower / Quiet outline
buttons under the teach script, the Snag's own disc row, and `VoiceRow` standing
in wherever the bank had no script. Five chromes, at four different left edges,
inside one white sheet — which is why the quiz surface visibly reflowed while it
was being read (the owner's play-test, defect 2).

**What there is now.** One `VoiceBar`, rendered as the FIRST ROW of the sheet on
every screen that reads: the question, the Snag, the teach step, the re-teach,
the quiz paper, the placement check. 48px reader disc (44 on phone), the state
label, then Slower and Quiet. The band is a tweak and not a layout: grades 3–6
get her face on a world-coloured disc and grades 7–8 an ink glyph; the idle line
and the prompt size change with it; nothing else moves between grade 3 and 8.

- **Again is gone as a button.** The disc replays the line, and carries
  `aria-label` plus `data-voice-play` so a kid and a spec reach for one handle.
- **Quiet is the sound setting**, not a per-sheet flag. It writes through
  `onMuted` to `settings.sound`, so one tap means it everywhere and tomorrow; a
  surface rendered without the callback (the layouts gallery) keeps a local one.
- **Read it left the help grid.** Help is three full-width pills in one column
  on desktop, three in a row on phone. A quiz and a test now carry no help list
  at all, which is what they always meant.
- **The sheet lost its 3px world lid**, and a plain answer lost its 1.5px rule —
  a `#F5F7F9` tile, so the three borders that mean something (right, wrong,
  chosen) are the only borders.
- `SayItShowIt` became `useScript`, which returns the `bar` and the `script` for
  the SHEET to place: the bar at the sheet's own top edge (padding 0), the
  script down in its padded body. The composed component is gone with it —
  keeping a second, subtly different way to render the same two things is how
  five chromes happened in the first place.
- `VoiceRow` is deleted.
- Every sheet's body padding now matches the bar's: 40 on desktop, 16 on phone.
  The first cut left the teach body at 32 and the bar at 40, which is §0c's own
  complaint (the reader and the prompt at different left edges) reproduced while
  fixing it. Caught by measuring the rendered page, not by a spec.

**Two things the specs taught here, both the same shape — a check that reaches
for the wrong handle:**

- The walk driver solves a layout by clicking buttons with no text. The reader's
  disc has no text either, so the driver started tapping Quiet and the teach
  flow stopped progressing. Both the harness and the specs now exclude
  `[data-voice-bar]` structurally rather than by naming its buttons.
- The band checks read the bar's state label, which says "Hope is reading"
  whenever a clip happens to be playing — so they passed or failed on timing.
  They read `data-voice-band` and `data-voice-disc` now, which is what §0c
  actually fixes per grade. The companion check for "no Again" was worse: it
  searched the page text, and the bank's own second worked example is kickered
  AGAIN, so it was failing on content. It looks for a BUTTON called Again.

**And one the review caught in my own diff.** The bar says "Quiet. Tap to hear
it." — and that tap did nothing. The tap that turns Quiet off is the same tap
that asks for the line, and React has not re-rendered in between, so `play()`
read the `muted` of the render the tap happened in and refused. Two taps, with
the screen having promised one. That is round two's ruling — a blocked read is
an invitation, never a lie — reintroduced on every surface at once, by the
change that was meant to make the reader honest. Both play paths take a `force`
for that gesture now, and the spec clears `played` immediately before the tap so
it fails on a second-tap product too.

**The dead half-second at the start of every network-voice read.** Chasing a
spec that failed here and passed on the previous commit, the live trace read
`5, -1, -1, -1, -1, -1, -1, 0, 0, 0…`: a stale word from the previous read, then
NOTHING held for 560ms, then the sweep. That is `boundaryWatch` — the clock
waits half a second before taking over so a boundary voice gets first refusal —
and on exactly the voices the clock exists for, every read opened with a beat of
fully-grey text. `speak()` gained an `onStart`, and the first word is held the
moment she begins; a boundary replaces it immediately, and so does the clock's
first tick. Measured live, the dead window went from ~560ms to ~160ms.

Found by reproducing the spec's page by hand rather than by reading the failure
twice. The spec had been failing for a reason adjacent to the one it names.

Mutation-checked: removing the bar from the question sheet fails eleven checks
across the question, Inspection Day, the Snag and the mission.

### The placement check: four searches, not one long test (§0e, Nov 2026)

**The runner (34b / 27d).** What stood here was a single progress bar — one
stripe filling up, which is the shape of a test, and the one shape a placement
check must not have. In its place a floating bar above the sheet carries Exit,
the four worlds and Untimed, and nothing else: there is no nav on this screen by
design, because placement runs during first-run setup and the only way out is
Exit.

Each world shows a dot in its colour, its name, and one of three states —
*Looking now* (ink ring on the dot, ink segment), *Found ✓* (green), *Up next*
(dimmed). A kid who stalls can see that two of these are already done and that
this is four short searches rather than one unbroken climb. On a phone the bar
changes SHAPE rather than shrinking: four 5px segments plus one named chip,
because four 14px dots with names beside them do not fit 390px and squeezing
them is how a bar becomes unreadable instead of becoming phone.

**The result (28a / 28d).** The normal top bar returns — the check is over and
she is in the product again. The grade sits on the GROUND at 200px rather than
inside the sheet, because it is a fact about her year and not a result the sheet
is reporting, with "That is where your lessons begin, not a mark." beside it.
The sheet does the one genuinely nice thing this screen can say: it names the
world she is already ahead in, then rules four rows — disc, world name over its
plain-maths area, an "Ahead" or "Starts earlier" tag, her grade.

Three decisions worth keeping:

- **`placementTopics(state)` lives in the engine**, not the component. It is a
  reading of the state machine, and the component may not know how settling
  works. Five unit tests, including that a settled world never goes back to
  looking and that a finished check leaves no world lit.
- **A kid level across all four has no world to be ahead in.** §0e specifies
  only the headline that names the strongest world; when every world matches,
  "You're already ahead in The Kitchen" would be the first thing this screen
  says being untrue. It reads "You start level across all four." instead, and a
  spec pins it: mutating the headline to always name a world fails.
- **`Question` gained a `footer` slot.** "Not sure? Pick the one you think is
  closest" was sitting out on the ground below the sheet; §0e puts it in the
  sheet's footer row, on the voice bar's own left edge. §0c's 24a wants the same
  slot, so it is shared rather than special.

`world` in `tokens.js` gained `area` (Fractions · Ratios and money · Negatives ·
Equations) — one string table, as Task 0 established.

**A guard that earned its keep.** The voice spec identified the placement runner
by `/FINDING YOUR LEVEL|of 24/`, and §0e removed both: the bar is gone and the
title is phone-only. Rather than skip, the spec failed — it was written with an
`else` that reports "placement was reachable to check: false" instead of passing
vacuously. It looks for the four world cells now, which is what the runner is on
every width.

**A truth the redraw lost and the walk-through found.** The footer reads
"Everything below Grade N is yours to review whenever you like." — and Kampus
starts at grade 3, so for a kid placed at the floor there is nothing below her
and no shelf to review. The code before the redraw knew this and branched; mine
did not, and said it to her on the first screen after the check. It branches
again, and a `floor` panel in the gallery pins it.

All four new UI guards are mutation-checked: inventing a world for a level kid,
dropping the Ahead/Starts-earlier tags, never switching to the phone shape, and
promising the floor a review shelf — each fails its own check.

### The weekly report: what she did, on the tab that opens (§0d, Nov 2026)

**The frame.** "This week" is the first tab and the one Grown-ups opens on. A
parent should land on what she DID, not on a queue of things waiting on them —
Approvals is the one screen in this product that can read as a bill. The limit
bar is relabelled "Weekly limit", and the kid's meta line drops "days played":
a streak by another name, and showing a parent one moves the guilt rather than
removing it. `daysPlayed` left the data contract too, rather than staying as a
field the frame quietly ignores.

**The sheet.** Three sections split by hairlines. The figures sit in a
three-column grid with vertical rules between them, so the row reads as one
statement about her week instead of three cards floated apart. Money puts "Open
Approvals →" in the third column, and it switches tabs. "Where she is" gained
one dot per unit — a shape she is somewhere inside, rather than a bar measuring
how much is missing. The footer names a CALENDAR week: `weekKey` is an epoch
week count in the 2900s and means nothing to a parent, so the seam now derives
`weekNumber` (ISO week of year) and `range` (Monday to today, never Monday to
Sunday — that would promise days which have not happened).

**Phone.** Four stacked rows pushed the week below the fold, so the tabs became
one segmented control; a Lock pill sits beside her name, because the grown-ups
side should not stay open because nobody found the door.

**A mistake made three times, now guarded.** `·` inside a JSX TEXT node is
not an escape — JSX text is not a string literal — so it renders as six literal
characters. It reached a screen three times in one session (the placement
result's apostrophe, this report's separators twice) and is invisible to every
check that reads the words either side of it. `text()` in the harness scans
every screen any spec visits, and the run reports the leak with its line:
`· in: This week · Oct 12 to Oct 15`.

**And a helper that was passing on its own nav.** Ten approvals checks failed
when the opening tab changed — correctly, because they were reading a different
screen. But `intoGrownUps` had returned true on `/Approvals|Earned|Nothing
waiting/`, and "Approvals" is still a LABEL in the nav: the helper would have
gone on reporting success for a caller reading the wrong tab. It takes a tab
name now and checks the tab's own content. Mutating it to stop clicking
reproduces all ten failures.

**And a spec that slept instead of waiting.** `a miss opens the worked steps by
itself` passed alone and failed in the full run, where all eight specs drive
eight browsers at once: its fixed 500/1500/600ms waits were not enough, so the
second click landed on an already-answered question and nothing opened. The
check then reported "a miss opens nothing" — a true sentence about a screen that
was never missed on. It waits on the "Not yet" mark and on the next question's
heading changing now, not on the clock.

Mutation-checked: every unit dot current, the footer printing the epoch key, and
the phone keeping four stacked rows each fail their own check.

### The counter: open day is one person at a time (§0f, Nov 2026)

What stood here was a LIST — served/missed/left counters, the whole queue as
rows, "Serve next" and "Serve the rest" underneath. The day was a thing she
processed. The counter is the day as she would live it: one person in front of
her, the one-cup receipt beside her, and the maths being the job rather than a
quiz laid over the top of it.

**Open day is its own screen.** Not a tab inside the business frame: the phase
tabs, the bank, the reputation column and the Karla strip all leave, because the
counter is one person waiting to be served and everything else is competing for
the same look. Prep and the ledger keep the frame they had.

- **The receipt** is the whole economics of her stand on one slip — what a cup
  sells for, what it costs to make, what she keeps, what is on the shelf. Square
  corners and a torn foot, in the mono the Rewards receipt uses, so it reads as
  paper rather than as another card. The line this customer depends on takes a
  gold marker; one at a time.
- **Attention rules**: the numbers in what they said repeat as pills so she is
  not holding them in her head, a "Hear them" pill plays the line and nothing
  waits on it, and the payment lands beside Sales today the moment she serves.
- **Progress, not a crowd**: one dot per customer and "Customer 3 of 14". No
  waiting count, no timer, and "No rush. The line waits."
- The seam gained `receipt`, `counter`, `takings` and `lastPaid`; `RECIPE` and
  the market's prices belong to the engine, so the component takes none of it.

**Where the drawing and the bank disagree.** §0f draws four PRICE keys and
writes the footer for a price answer ("Rang up $9.00. Ava is served."). The
bank's business moments are not all that shape — some are judgements whose
answers are sentences — and rendering those literally produced display numerals
reading "can't tell without more info", "It comes to yes — $0.49/cup", and
"Tom paid that and ARE served". Each now takes the shape of its own content:
numbers get the numerals and four columns, prose gets prose and three; the
footer has a sentence for each case; a step with no `=` takes the whole row
instead of leaving an empty numeral slot. **Making the drawing literally true
would mean rewriting the business-moment bank, which is the owner's call, not a
redraw.**

**Not built**: 43c, Karla's swap — it is the market's offer flow rather than the
counter's, and §0f leaves "the swap she cannot cover" undrawn. Phone is not in
§0f either; the receipt goes BELOW the counter there, because above it would
push the person asking off the screen.

**The specs had to be restated, not retuned.** Eight checks were written against
the list. "Serve the rest cannot skip past an open moment" became **there is no
way to serve past an open question** — the same law from the other side, since
the only button on the counter answers it. "The moment is above the queue, not
below the fold" became **the question is the biggest thing on the counter**,
measured rather than positional. And a new one carries §0f's central claim,
which nothing checked before: **the counter shows only the counter**.

`workTheLine` replaces "Serve the rest" in the harness. It walks the day one
customer at a time and reports how many questions it met — a day that skipped
the maths would otherwise look exactly like a day that had none.

Mutation-checked: putting the bank back on the counter, offering a button that
serves past an open question, and marking every dot current each fail their own
check.

### The worked animation stage (§0c, Nov 2026)

A teach row says what happened to a number. The stage SHOWS it happening — once,
to one number, with the arithmetic visible as a move rather than as a result.
Three moves cover the money walk §0c draws:

- **hop** — the decimal point travels one place over .6s on the spring, an ink
  arc with an arrowhead drawing above it; the point turns green and the spare
  trailing zero fades. `$64.00` becomes `$6.40`. The money mark is not a digit
  and does not move.
- **split** — one 240px bar opens into two halves, and the half she is not using
  greys to `#E6EAEE` rather than vanishing: it is still hers, she just is not
  spending it.
- **join** — two bars close the gap between them and turn green.

Three laws, each with a check that fails without it:

- **Nothing waits on it.** The stage is never on the path to solving a step:
  Next does not consult it, the row it illustrates is already revealed, and a
  step with no `stage` renders exactly as it did before stages existed.
- **One move at a time, on one number** — the stage follows the newest revealed
  row, so there is never a second thing moving for the eye to choose between.
- **Reduced motion HOLDS instead of moving**: the move shown already made, the
  readout already there, and no transitions left running. The mutation that
  turns this off is caught by 7 live transitions and a readout at opacity 0.

The readout arrives WITH the landing rather than before it, because the number
is the consequence of what she just watched.

**The data is the bank's.** A step carries `stage` and the component draws it;
nothing in the component invents numbers for a skill. The three worked examples
live in the test fixture — authoring stage data per skill is bank work, the same
split Task 1 made for `TeachStep`. §0c says as much: "Other skills need their own
stage. Not drawn yet."

**Still outstanding from §0c**: the Teach-me sheet takeover (25a) — moving Teach
me out of the help box into the sheet, with the question at 24/600 and the walk
rows under the stage. That is a structural change to where Teach me lives rather
than a wiring job, so it is left whole rather than half-done.

### CI: a mirror outage is not a failing commit — and retrying it was wrong

`playwright install-deps` fetches apt packages and cannot be cached the way the
browser binary above it is. Two runs of a green commit failed on "Temporary
failure resolving archive.ubuntu.com" in one afternoon — the kind of red that
teaches people to ignore red.

The first fix was to retry three times, and it was the wrong one. The step does
not FAIL when DNS is down, it TIMES OUT — about ten minutes of apt retrying on
its own — so three attempts turned an eleven-minute red into a thirty-minute
one, and the run had to be cancelled by hand. The evidence was there to read
before writing it: two failures ten minutes apart, both total resolution
failure, which is a sustained outage and not a blip.

So: ask DNS first, and fail in a second with the reason. A mirror outage now
says so in one line and costs nothing; a genuinely missing dependency still
breaks the build.

### Teach me takes the sheet (§0c 25a, Nov 2026)

It used to open as a box under the help grid, in the 340px left column — the
working for a question set in a third of the width of the question, beside a
question that stayed the biggest thing on screen. If she has asked to be taught,
the teaching is the screen.

So the sheet's body is replaced: a kicker that says what it cost ("Teach me ·
token used, full pay"), the question restated small because she is still
answering it, the stage where the bank authored one, and the walk a line at a
time. The lines still to come are SLOTS rather than nothing, so she can count
them — "three more" is a different feeling from an unknown number of taps.

**A miss may not take the sheet.** A miss opens the walk free (no punitive
mechanics; it has already cost her the streak), but 25a is about ASKING. If a
miss swapped the sheet, "Not yet. Here's the step" and the answers would vanish
behind working she never requested — the correction disappearing at the moment
she needs it. The takeover is for an asked teach only; a miss keeps the question
with the walk beside it, as before.

**No voice bar here.** 25a draws none, the screen does not read, and a reader
with nothing to read is a control that lies. The voice comes back with the
question, which the spec checks on the way out.

`TeachReveal` is deleted — keeping a second, subtly different walk is exactly
how the five voice chromes happened.

**A guard of mine that the mutation caught.** "A miss keeps the question" was
written as `!/Not yet/.test(text) || (rows && answers)`, and the mutation that
lets the sheet eat the miss ALSO removes the "Not yet" bar — so it passed by
destroying the evidence it looked for. Both facts are required now, with no
escape hatch: the walk opened AND the question is still there. A run that never
produced a miss fails too, which is correct — a spec that cannot reach what it
claims to test has not tested it.

**And the same spec, fixed twice.** "A miss opens the worked steps by itself"
failed in the full run and passed alone, twice. The first fix replaced its fixed
sleeps with proper waits but left the assumption underneath: "not marked within
2500ms, so it must have been right" — which under eight concurrent browsers is
just a slow page, so the driver went and clicked an answer on a question that
had already been answered. It waits for the screen to RESOLVE now, either way,
and reads which way it went; a miss marks, a hit moves the question on, and
neither is inferred from elapsed time. It also carries a new check — "a miss was
actually reached" — so a driver that cannot produce one fails loudly instead of
quietly testing nothing. Two consecutive full runs, 291/291 each.
