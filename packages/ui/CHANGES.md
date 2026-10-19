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
