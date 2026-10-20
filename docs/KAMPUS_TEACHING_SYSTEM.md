# The Kampus Teaching System

*How Kampus teaches math: the lesson model, the method by grade and for ADHD, the full year for every grade, and the assessment system. Written as the master plan a math teacher would hand you — grounded in the strongest available evidence and in what's already built in the app.*

---

## Part 1 — The answers to your three questions

**What is the best lesson plan?** Not a worksheet and not a video: a short, fixed-shape daily session built from five moves — warm-up retrieval, one new idea taught explicitly, guided practice that fades support, mixed review of old material, and a two-question proof of mastery. Every element of that shape has strong evidence behind it (details in Part 2). The single most important and most-skipped ingredient is the **mixed review**: most practice apps drill today's skill and let last month's die. Spaced, interleaved retrieval is the most reliably replicated finding in learning science — Rohrer's classroom RCTs showed interleaved math practice beating blocked practice by large margins on delayed tests, which are the only tests that matter.

**What is the best way to teach it, by grade and for ADHD?** One method, three dials. The method — the same six moves the What Works Clearinghouse rates "strong evidence" across the board: systematic explicit instruction (show, guide, fade — never pure discovery for struggling learners), precise math language, concrete→visual→abstract representations, number lines as the spine from grade 3 negatives to grade 8 irrationals, *deliberately taught* word-problem schemas (not word problems as decoration), and short fluency bursts. The dials are grade band (how concrete, how long, how playful — Kampus's `band()` already does this visually; this plan extends it to pedagogy) and ADHD (shorter blocks, instant feedback, zero ambiguity about what to do next, effort-visible rewards — all already Kampus law).

**How should it be structured?** Year → unit → lesson → question. A 32-week teaching year (plus 4 flex weeks) of 6–8 units per grade, each unit = 8–12 lessons plus a quiz; each lesson = one skill in the five-move shape, 12–22 minutes by band; mastery is performance-based (you finish a lesson by demonstrating, not by sitting through it). Part 4 lays out all six grades week by week.

**What you missed** — the questions you didn't ask but needed to: Part 6. The two biggest: *retention* (nothing in your prompt covers how kids keep skills months later — that's the review engine) and *repair* (a grade-7 kid with grade-5 fraction holes — that's prerequisite chains and asymmetric placement, which Kampus's per-world tiers are uniquely good at).

---

## Part 2 — The daily lesson: one shape, five moves

Every Kampus lesson has the same anatomy. Sameness is a feature: for ADHD, a predictable ritual removes the "what am I supposed to do" tax that burns executive function before math even starts.

**1. Warm-up — retrieval, 4 questions (~2–3 min).** Not today's topic: four quick questions from *previously learned* skills, chosen by the review engine (one due-for-review, one from last week, one fluency fact, one old favorite for a guaranteed early win — the engine's "easier win" logic, made purposeful). This is spaced retrieval practice wearing a warm-up costume, and it means every single day touches old material.

**2. The new idea — one skill, taught, not assigned (~3–5 min).** The teach panel runs *first* for a new skill, free (no token, no cost — you can't owe money for a lesson you haven't had). Structure of every teach: the strategy named in one sentence → worked example with the visual (number line, bar, area grid) → the same example abstract → one "your turn" the kid does with the steps still visible. This is textbook explicit instruction: model, guide, fade. New-skill naming matters for ADHD: the lesson announces exactly one goal ("Today: what a discount does to a price") — never two.

**3. Guided practice — 6–8 questions with fading scaffolds.** First questions show the visual by default; middle questions offer it on tap; last questions are bare. Tier-1 always opens with the concrete/visual form (CRA is non-negotiable at every grade — grade 8 gets number lines for irrationals, not just grade 3 for addition). Wrong answers route to the strategy step, not just "try again."

**4. Mixed set — 4–6 questions, interleaved (~3 min).** Today's skill shuffled with 2–3 recent skills *in the same world*, so the kid must choose the strategy, not just repeat it. (Rohrer's key insight: blocked practice lets students skip the hardest step — deciding *which* math applies. Interleaving is harder in the moment and far better a month later. The payout engine softens the "harder in the moment": mixed-set questions pay a small bonus.)

**5. Prove it — 2 questions, clean (~1 min).** Two unassisted questions on today's skill. Both right → lesson complete, Kredits milestone, skill enters the review queue. Miss one → one more guided example, then two fresh proof questions. Never a wall, never "failed" — just "not yet, here's the step you're missing." Mastery is the exit condition, not time.

**Session length by band** (fits the existing session-length setting): grades 3–4 ≈ 12–15 min, 5–6 ≈ 15–18, 7–8 ≈ 18–22. One lesson per day, 4–5 days per week. A kid who wants more plays free-practice rounds, the Stand, or Blitz — the *lesson* stays short on purpose: stopping while it still feels good is an ADHD retention strategy.

**Fluency sprints (2×/week, replacing the warm-up those days).** The IES guide's sixth recommendation is timed fluency work — the one place the evidence asks for a clock. Kampus squares this with its no-timer law the same way it did Blitz: the sprint is a 90-second *self-race* ("beat your own 14 from Tuesday"), opt-out always available, pace shown as a dot filling, never a countdown klaxon. Facts ladder: G3 ×/÷ facts, G4 all four operations, G5 decimal/fraction equivalents, G6–8 integer ops and percent benchmarks.

---

## Part 3 — How to teach it: the band dials and the ADHD overlay

**Grades 3–4 (concrete band).** Everything starts with objects and pictures; abstract notation is the *last* step of a lesson, not the first. Lessons lean on the existing visuals (fraction bars, number-line taps, area grids) plus story contexts about things (brownies, cards, dimes). Language: short sentences, one clause. Praise effort loudly, every session. Fluency focus: multiplication facts are *the* grade 3–4 project — automaticity there is the strongest predictor of middle-school comfort.

**Grades 5–6 (representational band).** The bridge years: visuals still open every new idea, but lessons now explicitly connect representations ("this bar IS this division"). Word-problem schemas get taught by name (see below). Real-world contexts shift from objects to *systems* the kid runs — this is where the Lemonade Stand becomes curriculum (unit rates, averages of their own sales, dependent variables).

**Grades 7–8 (abstract band).** Visuals on demand rather than by default; contexts shift to money, plans, and the kid's own data — things with stakes. The tone of teach steps goes peer-like ("Compare the two orders — the difference IS the burger"). Multi-step problems become the norm, and lessons teach *planning* ("what do we find first?") as an explicit step, which is executive-function training disguised as math.

**The ADHD overlay (all bands — most already Kampus law, now pedagogy too):**
- One goal per lesson, announced. One question on screen. Zero decorative clutter during questions (focus mode).
- Feedback within one second, always with the *why* available (payout chips do the motivation half; the strategy step does the learning half).
- Help is never punished during lessons: teach is free on a lesson's new skill; Teach Tokens govern free-practice rounds only.
- Errors are information: the wrong-answer banner names the likely mistake ("looks like you added the denominators") — our distractors are built from real error patterns, so the app usually *knows* which mistake it was. This is the highest-value unbuilt feature of the whole system.
- Movement breaks: between lesson and free play, a 20-second "shake it out" card for the 3–4 band.
- **Word problems are taught, not sprung.** Schema-based instruction — teaching kids to recognize that problems come in families (total, difference, times-as-many, rate, percent-of) and to map each family to a diagram — is one of the best-evidenced interventions for students with attention and learning difficulties. Kampus teaches one schema at a time, names it, gives it an icon, and the wrong-answer help asks "which family is this?" before any arithmetic.

---

## Part 4 — The year, grade by grade

Framework: 36-week homeschool year = 32 teaching weeks + 4 flex (fall catch-up, winter break re-entry, spring review, year-end celebration). Unit order follows the EngageNY/Eureka sequence — the most widely used free, standards-aligned scope & sequence in the country — adapted to Kampus's four worlds. ~4 lessons/week + 1 flex/quiz day. Every unit ends with a **unit quiz**; the year ends with the existing **grade test** (redesigned in Part 5). Skills marked ★ need new generators (the build list).

### Grade 3 — "the multiplication year" (≈130 lessons)
| Wks | Unit | World | Core skills |
|---|---|---|---|
| 1–4 | Equal groups: meet × and ÷ | Trade Tycoon | equal groups ★, arrays/areaModel, × as repeated + ★, ÷ as sharing ★ |
| 5–8 | Fact fluency I (×2,5,10,3,4) | Trade Tycoon | multFact/divFact by family ★(family-sequenced), missing factor |
| 9–12 | Place value & big add/sub | Number Mine | addBig, subBig, rounding ★(3.NBT), two-step stories |
| 13–16 | Fact fluency II (×6,7,8,9) + patterns | Trade Tycoon | harder families, patternNext, distributive-as-trick ★ |
| 17–21 | Fractions as numbers | Fraction Factory | unit fractions, on the number line ★, equivalence, compare |
| 22–25 | Area & perimeter | Equation Lab | areaModel, perimeter ★, decompose rooms ★ |
| 26–28 | Time, money & measurement | Trade Tycoon | elapsed time ★, money word problems ★, grams/liters ★ |
| 29–32 | Data + year review | Stand | picture/bar graphs ★, mixed review, grade test |

### Grade 4 — "big numbers, equivalent fractions" (≈130 lessons)
| Wks | Unit | World | Core skills |
|---|---|---|---|
| 1–4 | Place value to 1M, add/sub | Number Mine | addBig/subBig large, rounding, comparisons |
| 5–9 | Multi-digit × and ÷ | Trade Tycoon | mulDigit, divRem, multCompare, factors/multiples ★ |
| 10–13 | Measurement & conversions | Weather Station | km/m, kg/g, time ★, unit word problems ★ |
| 14–18 | Fraction equivalence & ordering | Fraction Factory | eqFrac, cmpFrac, addSameDen, mixedImp |
| 19–22 | Fraction × whole, line plots | Fraction Factory | fracOfSet, ×whole ★, line plots ★ |
| 23–26 | Decimals meet money | Fraction Factory | decNotation, decCompare, +tenths/hundredths ★ |
| 27–29 | Angles & shapes | Equation Lab | angle measure ★, classify ★ |
| 30–32 | Year review + grade test | all | mixed, test |

### Grade 5 — "fractions and decimals get real" (≈130 lessons)
| Wks | Unit | World | Core skills |
|---|---|---|---|
| 1–4 | Place value & powers of ten | Decimal Depths | powTen, decimal place value ★, rounding decimals ★ |
| 5–9 | Decimal operations | Decimal Depths | decAdd, decMul, decDiv, money contexts |
| 10–14 | Fraction add/sub (unlike) | Fraction Factory | addUnlikeDen, subFrac, estimation ★ |
| 15–19 | Fraction × and ÷ | Fraction Factory | mulFrac, fracOfSet, unitFracDiv, scaling ★ |
| 20–23 | Volume & the coordinate plane | Equation Lab | volumeBox, coordinate graphing ★ |
| 24–27 | Expressions & order of operations | Equation Lab | orderOps(Paren), evalX, numerical patterns |
| 28–32 | Conversions, data + year review | Stand | conversions ★, line plots ★, test |

### Grade 6 — "ratios, negatives, the birth of algebra" (≈130 lessons)
| Wks | Unit | World | Core skills |
|---|---|---|---|
| 1–5 | Ratios & rates | Trade Tycoon | unitRate, simplifyRatio, ratioShare, tape diagrams ★ |
| 6–9 | Percent | Trade Tycoon | easyPct, pctOf, findWhole, frac2pct |
| 10–13 | Fraction ÷ fraction, decimal fluency | Fraction Factory | divFrac, decimal ops fluency, frac↔dec |
| 14–18 | Rational numbers | Weather Station | addInt, cmpInt, absVal, opposites, coordinate plane ★ |
| 19–24 | Expressions & equations | Equation Lab | evalX, oneStep±×, twoStep, depVar, exponents intro ★ |
| 25–27 | Area, surface area, volume | Equation Lab | triangles/composite ★, nets ★ |
| 28–32 | Statistics (the Stand unit) + review | Stand | meanMedian, variability ★, histograms ★, test |

### Grade 7 — "proportional reasoning everywhere" (≈130 lessons)
| Wks | Unit | World | Core skills |
|---|---|---|---|
| 1–5 | Proportional relationships | Trade Tycoon | propSolve, unit rate w/ fractions ★, graphs of prop. ★ |
| 6–10 | Rational number operations | Weather Station | subNeg, mulInt, divInt, mixedInt, doubleSub |
| 11–15 | Expressions & equations | Equation Lab | distrib, combineLike, twoStepNeg, inequalities ★ |
| 16–20 | Percent in the wild | Trade Tycoon | tipCalc, discountTax, simpleInterest, pctChange, markup ★, tax ★ |
| 21–24 | Statistics & sampling | Stand | sampling ★, comparing distributions ★ |
| 25–27 | Probability | Stand | probSimple, compound events ★ |
| 28–32 | Geometry + year review | Equation Lab | scale drawings ★, angle equations ★, circles ★, test |

### Grade 8 — "lines, functions, the leap" (≈130 lessons)
| Wks | Unit | World | Core skills |
|---|---|---|---|
| 1–4 | Exponents & scientific notation | Power Plant | powersG, sciNotG, exponent rules ★ |
| 5–9 | Linear equations | Equation Lab | multiStepG, x-both-sides ★, special cases ★ |
| 10–14 | Slope & linear relationships | Slope City | slope2G, y=mx+b ★, graphing lines ★ |
| 15–18 | Systems | Equation Lab | sysSolve, substitution ★, word systems ★ |
| 19–23 | Functions | Equation Lab | funcEval, funcRate, compare functions ★, linear vs non ★ |
| 24–26 | Pythagorean & irrationals | Power Plant | pythag, approxRoot, distance ★ |
| 27–29 | Bivariate data | Stand | scatter plots ★, trend lines ★ |
| 30–32 | Year review + grade test | all | mixed, test |

**Build math:** existing generators cover roughly 55% of the year maps; ★ items ≈ 55–60 new generators plus the lesson-teach scripts. That's the content backlog, and it's deliberately front-loaded toward your stepdaughter's band (grade 7–8 ★s first).

---

## Part 5 — Tests, quizzes, and mastery

**Three layers, three jobs:**

1. **The proof (every lesson, 2 questions).** Formative, invisible-as-a-test. Decides only one thing: does this skill enter the review queue as "learning" or does the lesson re-teach. Never graded, never shown as a score to the kid.
2. **The unit quiz (every 3–5 weeks, 10 questions).** 7 questions on the unit + 3 review from earlier units (interleaving even here). Mastery-based verdict, not a percentage: each *skill* in the quiz is marked solid / shaky / not yet. Shaky skills get injected back into warm-ups; "not yet" skills get a re-teach lesson. **Retakes are always available, always full credit** — the message is "the quiz tells us what to fix," never "you had one shot." For ADHD this converts test anxiety into a progress ritual. Quiz day pays a fixed Ticket (effort-based: for taking it, not for acing it).
3. **The grade test (existing, redesigned).** Still 20 questions, still gates the next grade — but now assembled as 2 questions per major-work cluster (so a pass certifies the standard, not luck), pass at 16/20 with no cluster completely missed ★. A miss produces a *repair plan* (the 2–3 units to revisit), not a fail screen. Passing builds a Campus district. Parents see the cluster map — which doubles as the state-reporting artifact.

**Placement (the start of every kid's year):** the adaptive placement from the build plan, run per world — 15 minutes that can place a kid "grade 6 in ratios, grade 4 in fractions." The year map then runs *per world at the placed grade*, which is the honest version of a school year no classroom can offer. Placement repeats lightweight in January (drift check).

**Prerequisite chains (the repair system):** every skill carries its prerequisites in the curriculum data (e.g., `addUnlikeDen ← {eqFrac, addSameDen}`). Two misses on a skill triggers a prerequisite probe — one question each on its prereqs — and if a prereq is the real hole, the app says so plainly ("This is actually an equivalent-fractions thing — 3-minute refresher?") and runs the micro-lesson. This is what makes a grade-7 kid with grade-5 holes fixable without humiliation.

---

## Part 6 — What you missed (the gaps I'm filling)

1. **Retention.** Your prompt covers teaching and testing but not *keeping*. The review engine is the answer: every mastered skill gets a due-date (1, 3, 7, 16, 35 days, then monthly — expanding on success, contracting on a miss), warm-ups and mixed sets draw from the due queue, and the parent report shows retention, not just completion. Without this, the app teaches a skill in October that's gone by February — this is where nearly every competitor quietly fails.
2. **Fluency as its own track.** Conceptual lessons don't automatize facts; the sprint ladder does. A grade-7 kid still finger-counting 7×8 drowns in equation lessons regardless of how good those lessons are.
3. **The parent's role, defined.** Mom is not the curriculum — the app is. Mom is the *ritual* (same time daily), the celebration, and the escalation path: each week the Grown-ups digest hands her at most ONE "sit together on this" suggestion with a 3-line script ("Ask her to explain the discount trick with the $60 sneakers"). Clear division of labor prevents both app-abdication and parent-hovering.
4. **Error-pattern feedback.** We already generate distractors from real misconceptions; the app should *say* the misconception when it's chosen. Cheap to build, huge teaching value.
5. **Writing/explaining math.** Once a week, a lesson ends with "explain your move to the mascot" via the existing read-aloud flipped around (kid speaks or types one sentence). Math language is a strong-evidence recommendation and the skill tests can't measure.
6. **A definition of "a school year," legally.** 130 lessons + 8 quizzes + 1 grade test + the term reports = a documentable homeschool math year in most states. That artifact is also the pilot's distribution hook.
7. **The January wall.** Motivation systems decay; plan for it: January brings a fresh pet, a Campus event ("winter fair"), and the parent digest proactively suggests a reward-menu refresh. Schedule novelty, don't hope for it.
8. **Calculator policy.** G3–5 none; G6+ calculator allowed *after* the fluency sprint threshold is met for that fact family — fluency first, then tools, matching how real classrooms handle it.

---

## Part 7 — From this plan to the product (implementation map)

1. **Curriculum data v2** (`packages/curriculum`): units with week ranges, lesson list per unit (skill id, teach script id, schema tag, prereq ids), review-interval constants. The year maps above become this file — content as data, editable without code.
2. **Lesson runner** (engine + QuizRound composition): the five-move session assembled from existing pieces — warm-up = review-queue draw; teach-first = existing teach panel, free; guided = tier-1 visuals w/ fading; mixed = interleaved pull; proof = forceTier clean questions. Mostly orchestration, not new UI.
3. **Review engine** (engine, pure): due-date scheduling per mastered skill + queue draw. ~100 lines + tests.
4. **Unit quiz + redesigned grade test** (engine spec + screens Claude Design is already doing).
5. **★ generators**: ~55 new, built unit-by-unit in year order, grade 7–8 first.
6. **Error-pattern messages**: add `why` strings to existing distractors incrementally.
7. **Prerequisite chains + probe flow.**
8. **Parent digest v2** (Phase 4, with the backend).

Sequence I recommend: review engine + lesson runner first (they make *existing* content twice as valuable), then ★ generators for grade 7, then quizzes.

---

## Sources

- What Works Clearinghouse / IES, [*Assisting Students Struggling with Mathematics* practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/26) — all six recommendations rated strong evidence.
- Rohrer et al., [IES-funded RCTs on interleaved mathematics practice](https://ies.ed.gov/use-work/awards/interleaved-mathematics-practice); overview: [Educational Psychology Review](https://link.springer.com/doi/10.1007/s10648-020-09516-2).
- Schema-based instruction meta-analysis for students with disabilities: [SBI/MSBI as evidence-based practice](https://avesis.omu.edu.tr/yayin/618e6bd9-7829-4ee7-bef3-ebdd9c13a922/are-schema-based-and-modified-schema-based-instruction-evidence-based-practices-for-students-with-disabilities-a-meta-analysis).
- EngageNY/Eureka Math module sequences (public domain scope & sequence), e.g. [module overviews](https://www.greenhills.org/academics/math-resources/grade-3/module-overviews).
- Prior Kampus research (docs/KAMPUS_CURRICULUM_PLAN.md): Achieve the Core major-work maps, Zearn lesson structure, Fryer incentive trials, token economies for ADHD, Monster Math ADHD design guide.
