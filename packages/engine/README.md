# @kampus/engine

The game's math brain, UI-free. Ported from the v1 single-file app with behavior preserved — ~80 generators (the v1 set plus the Phase 1 expansion), adaptive rules, and economy math, now as pure ES modules the React app and (later) the backend both consume.

## What's here

| File | What it is |
|---|---|
| `src/util.js` | Shared helpers: RNG, fraction simplification, display formatting, number-line / fraction-bar SVG builders. Extracted verbatim from v1. |
| `src/generators.js` | The generator library. Each generator returns `{prompt, q, ans, wrongs, skill, steps}` with teach steps included. Registered by topic and tier in `GEN`. Extracted verbatim from v1. |
| `src/curriculum.js` | `R` (named generator refs), grade-parameterized factories, `GRADE_WORLDS` (per-grade world identities), and `CURRICULUM` (grade × topic × tier problem pools). Extracted verbatim from v1. |
| `src/adaptive.js` | `makeProblem(grade, topic, tier, opts)` — distractor value-filtering, choice shuffling, the 20% easier-win sprinkle — and `recordAnswer(recent, tier, correct)`, the 5-of-6-up / ≤2-of-6-down tier rule. Pure: callers own all state. |
| `src/economy.js` | Kredit formula, streak ladder and multipliers, shop catalog + `bonusPct`, ticket weekly-cap math. Server-side source of truth for validating ledgers (the UI's `QuizRound` computes display gains itself, per its architecture contract). |
| `src/expansion.js` | Phase 1 curriculum expansion: 20 context-first generators that close every major-work gap in grades 3-8 (decimals, volume, stats, percent applications, probability, functions, systems, Pythagorean). Registers itself into `CURRICULUM` on import. |
| `src/business.js` | The Living Business: inventory lots with capped spoilage, market drift, reputation with a floor + vacation freeze, persona regulars with memory, customer-queue generation, banded math moments from live sim state, day simulation + ledger. Pure tick functions (docs/KAMPUS_BUSINESS_SIM.md). |
| `src/quiz-adapter.js` | `toQuizQuestion(...)` — maps engine problems onto `@kampus/ui` QuizRound's question contract, including numline mode for integer tier-1 problems and `plainText()` flattening of fraction HTML. |

## Usage

```js
import { toQuizQuestion, recordAnswer, kreditsFor } from '@kampus/engine';

const q = toQuizQuestion(6, 'ratio', 2);        // feed to <QuizRound questions={[...]}/>
const next = recordAnswer(recent, tier, true);   // update adaptive state after an answer
```

## Testing

`npm test` — Vitest. 10,800-problem curriculum fuzz plus 6,000-run per-generator fuzz of the expansion (structural invariants: valid choices, no value-equal distractors, teach steps present, no fallback generator), plus adaptive, economy, and adapter contract tests.

## Known tradeoff

QuizRound renders question text as plain text, so `plainText()` flattens stacked-fraction HTML to `a/b` and drops inline CRA visuals from teach steps. Tracked for Phase 3: a blessed rich-content question mode in the component library brings them back.

## review.js — retention

`firstReview(skill, today)` schedules a newly mastered skill; `review(entry, correct, today)`
re-schedules it on the expanding ladder (1, 3, 7, 16, 35 days, then monthly), moving one
rung up on a correct review and one rung **down** — never to zero — on a miss.
`dueQueue(entries, today, {limit})` is what warm-ups and mixed sets draw from, weakest and
most overdue first; `retention(entries, today)` is the parent report's held/due/lapse
snapshot. Days are integers (`dayNumber(date)` at the edge) so nothing in here touches a
clock or a timezone. Spec: `docs/KAMPUS_TEACHING_SYSTEM.md` Part 6 #1, Part 7 #3.
