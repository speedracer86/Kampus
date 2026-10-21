# Kampus — Full Inventory & Gap Report

*Everything that exists, the numbers per grade, how it maps to national standards, the
learning-science audit, and the honest list of what's missing before this is a real
homeschooling/tutoring product. Numbers below are computed from the live code, not
estimated. Date: Oct 20, 2026.*

---

## 1. Everything created so far

**Working software (in the repo, tested — 123 automated tests passing):**
- **The legacy v1 app** (`index.html`) — complete and usable today: play, teach mode
  with read-aloud, adaptive tiers, grade tests, shop/pets/themes, tickets + parent
  approvals, lemonade stand v1, parent dashboard, onboarding. This is what your
  stepdaughter can use right now.
- **The math engine** (`packages/engine`) — ~80 problem generators with step-by-step
  teach scripts and error-pattern distractors; grade 3–8 curriculum pools; adaptive
  tier logic (5-of-6 up / ≤2-of-6 down); Economy v2 (payout math, Teach Tokens,
  first-try bonus, opt-in Blitz); quiz adapter. Pure, headless, fuzz-tested
  (10,800-problem curriculum fuzz + 6,000-run generator fuzz per run of the suite).
- **The standards layer** (`packages/curriculum`) — all 79 skills tagged to Common
  Core codes, with coverage tests that FAIL if any grade's major work regresses.
- **The design system** (`packages/ui`) — your component library evolved through the
  owner-directed passes: frosted top nav with the Kredit bank, white sheet on neutral
  page, outline boxes, Instrument Serif numeral accent, grade chips, RecordsLedger,
  PracticeHeat contribution grid, CampusMap skyline, payout chips, token dots,
  age-adaptive `band()` dial, SideBar (reserved for parent side).
- **The v2 React app** (`apps/web`) — Home/dashboard + full play loop with Economy v2,
  built on the design system. Other screens still live in v1 only.
- **Infrastructure** — monorepo, CI on every push, GitHub repo + live deploy of v1
  (speedracer86.github.io/Kampus), CLAUDE.md conventions, 19 commits of history.

**Designs & plans (on paper, grounded in research, committed to docs/):**
- Build plan (Supabase backend, multi-family pilot, data model, phases)
- Curriculum & engagement plan (reward evidence: Fryer, token economies, ADHD design)
- **Teaching System** (this is the curriculum spine — details below)
- Business Sim v2 ("living business" with the start-grade policy)
- Claude Design brief (out for the remaining screens right now)

## 2. The numbers

**Built today (computed from code):** unique question generators per grade —
G3: 15 · G4: 23 · G5: 24 · G6: 27 · G7: 25 · G8: 21. 79 skills in the taxonomy
touching 68 distinct Common Core standards. Every generator has a teach script;
every skill has distractors built from real error patterns.

**The planned school year (per grade, from the Teaching System):**

| Per grade, per year | Count |
|---|---|
| Teaching weeks | 32 (+4 flex) |
| Units (business arcs) | 6–8 |
| Lessons | ~130 (one/day, 4–5 days/week, 12–22 min by band) |
| Lesson mastery proofs | ~130 (2 questions each, invisible-as-tests) |
| Fluency sprints | ~64 (2/week) |
| Unit quizzes | 6–8 (10 questions, mastery verdicts, unlimited retakes) |
| Grade test | 1 (20 questions, 2 per standards cluster) + business capstone week |
| Placement diagnostics | 1 at start + January drift check |

**Content gap to run those years:** existing generators cover roughly **55%** of the
six year maps. ~55 flagged (★) generators plus lesson teach-scripts remain to write —
the known content backlog, prioritized grades 7–8 first.

## 3. Standards alignment (the homeschool-compliance story)

> Policy (Teaching System Part 9): CCSS is the internal coverage engine, never the
> parent-facing brand. Copy says "covers everything your state expects." One named
> strategy per skill, standard algorithms honored, parents' own methods always valid.

- Alignment target: **Common Core State Standards (CCSS)** — the de facto national
  framework, used or closely mirrored by ~40 states. Sequencing follows
  **EngageNY/Eureka**, the most widely used free CCSS scope & sequence.
- Depth of alignment, enforced by code: every grade's complete **major work**
  (the clusters where 65–85% of the year should go, per Achieve the Core) is covered
  — 6/6, 6/6, 5/5, 6/6, 4/4, 6/6 clusters for grades 3→8 — and the test suite fails
  if that ever regresses. The redesigned grade test certifies 2 questions per cluster.
- Supporting/additional clusters (geometry, measurement, data) are partially covered;
  the year maps close them (they're most of the ★ backlog).
- Non-CCSS states (TX, VA, FL): content overlap is ~90%+; the term report should
  eventually offer those crosswalks (listed in gaps).
- The compliance artifact: the planned printable **term report** (skills practiced,
  mastery by cluster, time on task) — 130 lessons + 8 quizzes + grade test documents
  a legitimate homeschool math year in most states' terms.

## 4. Learning-science audit (are we teaching the best way?)

| Practice | Evidence | In Kampus |
|---|---|---|
| Explicit/systematic instruction | IES WWC: strong | Teach-first lessons, model→guide→fade (designed; teach panels built) |
| Concrete→visual→abstract | IES WWC: strong | Number lines, fraction bars, area grids (built in v1/engine; v2 rich-render pending) |
| Number lines throughout | IES WWC: strong | Built (tap-to-answer modes) |
| Taught word-problem schemas | IES WWC: strong; SBI meta-analysis for LD/ADHD | Designed (Part 3); contexts built |
| Timed fluency practice | IES WWC: strong | Designed as self-race sprints (ADHD-safe form) |
| Spaced retrieval + interleaving | Rohrer RCTs, large delayed-test gains | **Designed, not yet built — the review engine is the single highest-value unbuilt piece** |
| Mastery-based progression | Standard | Built (tiers, proofs designed) |
| Immediate feedback + legible rewards | ADHD literature, token economies | Built (Economy v2) |
| Effort-based real rewards, not output pay | Fryer RCTs | Built (tickets), test-pay fix pending |
| Untimed by default, focus mode, no punitive mechanics | ADHD design guidance | Built, enforced as law |

Verdict: the method is right and research-grounded. The biggest *science* gap between
design and build is retention (review engine) — everything else is content volume.

## 5. What's missing to be a real homeschooling/tutoring app

**Tier 1 — can't pilot without (in build order):**
1. **Review engine** (spaced retrieval scheduling) — designed, ~small build, huge value
2. **Lesson runner** (the five-move session orchestrating existing pieces)
3. **★ generators + teach scripts** to complete year maps (grade 7–8 first)
4. **Unit quizzes + redesigned grade test + placement diagnostic**
5. **Backend** (Supabase: parent accounts, kid PIN profiles, sync, COPPA-safe) —
   without it there are no families, only one browser
6. **Remaining v2 screens** (shop, rewards, stand, grown-ups, onboarding, tests) —
   awaiting Claude Design, then wiring
7. **Parent dashboard v2 + printable standards term report** (the compliance artifact
   is also the distribution hook)

**Tier 2 — real product, shortly after pilot:**
8. Business Sim v2 (the living business) · 9. Daily quests/themes wired ·
10. Read-aloud in v2 (library has `speak()`; wire + voice quality) · 11. Rich math
rendering in v2 (stacked fractions, CRA visuals — the known plainText tradeoff) ·
12. Phone layouts · 13. Weekly parent email digest · 14. Error-pattern feedback
messages ("looks like you added the denominators") · 15. Prerequisite-repair probes

**Tier 3 — "tutoring app" and scale:**
16. Tutor role (multi-student dashboard, assignments — data model already supports it)
· 17. Accessibility pass (dyslexia-friendly font option, contrast, reduced motion) ·
18. Non-CCSS state crosswalks (TX/VA/FL) · 19. Privacy policy/ToS for the pilot ·
20. **A practicing educator's review of the content — your wife, before any family
    outside yours sees it.** Standards alignment is necessary; a real homeschool
    teacher's sign-off is the validation that counts.

**The one-line status:** the machine that *teaches* is largely built and the method is
sound; what's missing is the machine that *remembers* (review engine), the machine
that *organizes the year* (lesson runner + quizzes + the other 45% of content), and
the machine that *holds families* (backend + parent reports).

## Curriculum bank gaps (found while wiring the runner, Phase B)

Recorded rather than fixed: the bank is owner-reviewed and PROMPT.md forbids re-authoring
its content. These are enrichment items, not blockers — the runner skips nothing.

- ~~**Grade 6, day 109 practises `meanMedian` with no lesson behind it.**~~ **Resolved
  by the bank owner (Oct 21):** the sequence builder now recognises hybrid final units —
  a skill appearing for the FIRST time in the year's last unit (grade 6's Stand unit
  introducing statistics) gets its real teach-first `new` day; only previously-taught
  skills are held to the refresh-never-re-teach rule. `meanMedian` now has a `new` day in
  unit 6-7, asserted by bank.test.js ("every skill in the year has a teach-first day
  SOMEWHERE"). The `KNOWN_GAPS` pin in `year-wiring.test.js` can drop to an empty list.
- For contrast and as the rule: grade 7, day 112 practises `areaModel` without a grade-7
  teach day, and that one is correct — `areaModel` is taught new in grades 3–6, and unit
  7-7 is explicitly "Geometry + the year in review". Review units refresh; they do not
  re-teach.
