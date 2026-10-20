# Kampus — pilot-ready campaign prompt (paste this into Claude Code)

Read fully, in this order, before writing any code: CLAUDE.md ·
design-incoming/START_HERE.md · design-incoming/BUSINESS_CLEANUP.md ·
docs/KAMPUS_PLAY_SYSTEM.md · docs/KAMPUS_TEACHING_SYSTEM.md (Parts 2, 5, 6, 8) ·
docs/KAMPUS_BUSINESS_SIM.md · docs/DEPLOYMENT.md (store contract).
Precedence where they conflict: KAMPUS_PLAY_SYSTEM.md wins, then BUSINESS_CLEANUP.md,
then START_HERE.md, then the older docs. STYLE_GUIDE §0 in design-incoming/ remains
binding for all visuals. Two invariants get enforced with tests, not intentions: the
ADHD laws (untimed default, no punitive mechanics, nothing dies, absence never
punished, no streak display) and the §5 rule (a quiz or test can never hurt the
business — no reputation loss, no closure, nothing taken).

MISSION: finish the app to pilot-ready. Definition of done: a student placed in any
grade 3–8 can run a full year — 128 sequenced lessons across her grade's units, a
unit quiz after each unit, the grade test at year end with repair plan — and run the
Living Business with the Play System loops, all on the §0 design, all tests green.

## PHASE A — the curriculum bank (SHIPPED IN THIS DROP — verify, don't author)

The authored curriculum bank arrives with this drop in `packages/curriculum`:
`units.js` (45 units, week maps, gap lists), `lessons.js` (128-day sequences per
grade; review units refresh, never re-teach), `snags.js` (45 banded Snag scenes),
`teach.js` (~70 strategy-first teach panels), `quizSkills()` (unit + review mix),
plus `test/bank.test.js` (answers verified computationally) and
`scripts/audit-curriculum.mjs` → `docs/audit/GRADE_*.md`. It is owner-reviewed.
**Do not re-author or "improve" bank content.** If a lesson needs something the
bank lacks, add it to the gap list in KAMPUS_INVENTORY.md.

A1. Verify: `npm test` green including bank.test.js; read the test to learn the
    data shapes before wiring anything.
A2. Generator source tags + costume audit per PLAY_SYSTEM §2: every generator
    declares world|life|gym; strip fake stories (they become gym); convert the
    strongest percent/ratio/stats generators to world by feeding them biz state.
    Test: no untagged generator ships.
    ALSO — generator answer accuracy (owner priority): add golden-answer tests
    per generator — ≥3 cases each with a seeded RNG, the expected answer
    hand-computed in the test (the pattern of curriculum's bank-verify.test.js:
    independent re-derivation, never comparing the generator to itself) — plus
    domain invariants where they exist (change returned sums to the amount paid;
    a discounted price is below the original; a mean lies between min and max).
A3. Per-skill problem API: the runner needs `problemsForSkill(skillKey, tier)` in
    the engine — map taxonomy keys to generators (R covers 39; route the rest to
    their GEN/expansion entries). Test: every skill used in units.js resolves to a
    working generator.

## PHASE B — the runner runs the real year

B1. Wire Daily Lesson to `lessonsFor(grade)`: store keeps lessonPointer per
    student; 'new' days open with the unit's snag (first day) and the skill's
    teach panel from `teachFor()`; warm-ups draw from the review engine's due
    queue; guided days scaffold and fade; mixed days interleave the unit's
    skills; prove-it advances the pointer. Home's "Today's lesson" and unit
    progress read from the sequence (`yearShape`, `unitSpan`).
B2. Quizzes/tests on the sequence: 'quiz' days assemble from `quizSkills()`
    (Inspection Day framing, stand closed that morning, fixed $1.00); the 'test'
    day is the License (passing builds the campus district and unlocks the next
    grade). Repair plan feeds the review queue and schedules re-teach days.

## PHASE C — the business becomes the Play System

C1. BUSINESS_TYPES per PLAY_SYSTEM §3: goods types first (lemonade, cookie,
    sticker, bake, craft), then one service type (pet care — bookings/hours
    replace inventory/spoilage), resale and digital for band c. Kid picks and
    names the business; same math objectives per band across types, asserted by
    test. freshBiz(grade, typeId, name).
C2. Living Business screen per BUSINESS_CLEANUP: Opening Week (one unlock per open
    day, band-mapped), Karla strips (new persona, add to PERSONAS), Ask Karla with
    coachTip(), declutter rules, register gated by today's lesson. Engine additions:
    unlocks(), opening state, starter kit for all bands, yesterdayPrices drift
    arrows, bag-of-12 (band c, after 3 purchases), promo skill gates, ladder gates.
C3. Care loop + growth loop per PLAY_SYSTEM §4: "while you were away" feed (2–3
    warm lines) on Home under the greeting; stand build-out thumbnail on the stand
    band (placeholder art from the blob pack until the design round); seasons table
    in the engine with the first season's demand shifts and one special order.
C4. NPC trading: Karla's market posts swap offers generated from live prices —
    accept/decline is a ratio question. No kid-to-kid anything.

## PHASE D — the grown-up side and the glue

D1. Grown-ups screen (START_HERE step 8, artboards 11a/11b): approvals on the real
    earnings ledger, progress per world with verdicts, settings {weekly cap $3/$5/$8,
    lesson length, allow Blitz, fluency sprints, vacation mode, business coach
    on/off, sound on/off}. PIN gate restyled per §0.
D2. Field assignments thin slice per PLAY_SYSTEM §7: one weekly mission, parent
    enters 2–3 real numbers, pays normal effort dollars. Receipt photos later.
D3. Measurement per PLAY_SYSTEM §8.8: define the event names now and write a weekly
    rollup (lessons completed, snag→lesson completion, stand-open rate, quiz
    retakes) so the pilot produces data from day one.
D4. Sweep: CHANGES.md entries, README + CLAUDE.md counts updated, regenerate
    docs/audit via scripts/audit-curriculum.mjs if the bank changed, headless
    screenshot of every screen, full `npm test && npm run build` green.

OUT OF SCOPE — do not build: onboarding screens (design round in flight), placement
UI, Market Day UI, shop, native apps. Leave clean seams where they'll attach.

WORKING STYLE: commit per numbered item, push after every phase so main on GitHub is
always current (deploys are wired to it). Never leave main red. When a doc conflict
forces a judgment call, follow the precedence order and record the call in the
commit message and CHANGES.md. Where a bank lesson's skill lacks a generator (the
`gaps` lists), the sequence skips nothing — those are future enrichment, tracked in
KAMPUS_INVENTORY.md, never blockers. Delete this PROMPT.md in the final sweep commit.
