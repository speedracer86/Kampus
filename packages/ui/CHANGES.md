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
