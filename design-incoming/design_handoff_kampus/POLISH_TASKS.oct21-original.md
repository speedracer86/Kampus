# Kampus: Polish round, task packet for Claude Code / Cowork (Oct 21 2026)

Hand this file plus the whole `design_handoff_kampus/` folder to Claude Code (implementation) or Cowork (planning and review). Repo: `speedracer86/Kampus` (main). UI lives in `packages/ui/src/`, logic in `packages/engine/`, curriculum in `packages/curriculum/`.

## Read first
1. `STYLE_GUIDE.md` **§0** (binding visual direction) and **§0b** (this round's specs).
2. `Polish.dc.html`: open it in a browser with `support.js` next to it. Artboards 16a–20b are clickable. "State & data per screen" at the bottom has the data shapes.
3. `README.md` → "Polish round" for the wiring summary.

The HTML files are **design references**, not production code. Rebuild them in the existing React app with `packages/ui/src/tokens.js` + `primitives.jsx`. Don't add new colors: every value is already in §0 or §0b.

## Rules that must survive implementation
- No timers on questions. Blitz is opt-in only.
- Wrong answers cost nothing. Copy: "Not yet. Here is the step: …"
- Real money is paid for effort only, never for scores.
- Never say "Common Core". Say "covers everything your state expects for grade N."
- Grade 7–8 is the band to nail. Nothing may read "for little kids".

---

## Task 0 · World rename (decided)
Fraction Factory → **The Kitchen** · Trade Tycoon → **The Market** · Weather Station → **Outside** · Equation Lab → **The Workshop**. The colors (`#F0AFCE #F4BE93 #5E9FE0 #8F97DE`) are unchanged.
- Make world names one string table keyed by worldId (`fractions`, `ratios`, `integers`, `equations`) and replace every hard-coded name.
- Grep the repo for the old names, including docs, tests and curriculum seed data.
- Re-read any sentence that used an old name as prose.
- Kid copy: unit quiz = "Inspection Day", grade test = "the License". Grown-ups copy keeps "unit quiz" and "grade test".
- **Done when** grep for the four old names returns 0 hits and tests pass.

## Task 1 · Teach steps (the big one)
Spec: §0b "Teach steps". Artboards: 16a/b walk · 16c/d face-off · 16e/f line · 16g/h bar · 16k/l takeaway · 16m/n voice.
- Add a `TeachStep` type to curriculum data:
  ```
  { layout: 'walk'|'faceoff'|'line'|'bar', prompt, speak?, hint, takeaway,
    walk?: { rows: [{ value, how, result? }] },
    faceoff?: { cards: [{ label, count, price, each }], answer, why },
    line?: { min, max, start, delta, answer, unit },
    bar?: { parts, target, context } }
  ```
- Build 4 layout components plus a `TakeawayBand`, rendered inside the existing lesson sheet. Next stays disabled until the step is solved.
- Lesson state gains `{ stepIdx, solved[], notes[] }`. "Write it down" appends to `notes[]` and highlights the new cheat-sheet line `#EAF6EE` for one beat.
- Author `TeachStep[]` for every skill. Start with one skill per world as the reference set, then fill the remaining ~70. Each skill needs 3–5 steps; the last is always "Try it" (unpaid check).
- Voice: the mode comes from the grade band. `a` = companion row that auto-reads on step open (Again, Slower at rate .8, Quiet mutes for the session). `b` = disc only. `c` = the existing "Read it to me" pill. Use `speechSynthesis`.
- **Done when** every skill has authored steps, all 4 layouts render on desktop and phone, and a wrong pick shows the hint without blocking.

## Task 2 · Week plan
Spec: §0b "Week plan". Artboards 17a (desktop) / 17b (phone).
- Derive `WeekDay{ date, dow, kind: lesson|quiz|test|rest, status: done|today|upcoming, lessonId?, title?, worldId?, earnedCents? }` from the 128-day sequence + calendar. Weekends and days the grown-up marks off are rest days. Quiz and test days come from unit structure.
- ←/→ pages through weeks. The "Coming up" list shows the next Inspection Day and the License with lessons-to-go; tapping one jumps to its week.
- **Done when** the past, current and future weeks render from real progress data with no empty dashes.

## Task 3 · Grade stack for placed students
Spec: §0b "Grade stack". Artboards 18a (4 states) / 18b (phone).
- Add `GradeState = 'placed'|'passed'|'current'|'locked'|'graduation'`. `placed` (below placement, no test taken) is **not** `passed`: no test chips, no purple ramp.
- Fold contiguous placed grades into one `#DCD2F6` "Earlier grades · Review anytime" card that expands to per-grade Review rows.
- Locked sub line: `After the Grade ${n-1} License`. Grade 3 has nothing below. Grade 8 ends with a Graduation card.
- **Done when** all four states in 18a match for grade 3, 6 and 8 test accounts.

## Task 4 · Wishlist tiles
Spec: §0b "Wishlist tiles". Artboards 19a / 19b.
- `WishItem{ url, domain, store, title?, priceCents?, imageUrl?, category?, fetch: 'pending'|'ok'|'miss' }`.
- Tile states: pending = shimmer; `imageUrl` = photo; no image but a store = tinted initial (`hash(domain) % 6` into the confetti set at 24%) + category glyph; neither = link tile with "Add details".
- A fetch still pending after 4 seconds resolves as a miss. Never render an empty gray square.
- **Done when** killing the preview service leaves every tile looking intentional.

## Also open from earlier rounds
- Onboarding (`Onboarding.dc.html`, §0a): grown-ups gate 13o uses the PIN pad. This matches `packages/ui/src/pin-gate.jsx`; restyle that component to §0a.
- The blob SVGs `Coffee.svg`, `Invoice.svg` and `Talk.svg` lost their style blocks in the repo (`packages/ui/blobs/`) too. Recolor them with inline fills the way `blobs/Target-2.svg` was fixed, or drop them.

## Suggested order
Task 0 → 3 → 4 → 2 → 1. The rename is mechanical, 3 and 4 are small, 2 needs curriculum data, and 1 needs authoring time.
