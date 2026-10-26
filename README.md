# Kampus

Math practice that pays. An ADHD-first math app for homeschooled kids (grades 3–8): every correct answer earns **Kredits** (in-app currency for the shop, pets, and the lemonade-stand business sim); finishing runs and effort milestones earn **Tickets** toward real-world rewards a parent defines, capped at roughly $5/week.

Two things live in this repo:

1. **The live v1 app** — `index.html`, a single self-contained file, deployed on GitHub Pages. This is what's in daily use; it stays stable and untouched while v2 is built.
2. **The v2 monorepo** — a React rebuild on the Claude Design component library, headed for a multi-family pilot (accounts, sync, parent dashboard). See `docs/KAMPUS_BUILD_PLAN.md` for the full architecture and phase plan.

## Repo layout

| Path | What it is |
|---|---|
| `index.html` | The complete v1 app (markup, styles, logic, embedded illustrations). Open in any browser — no install, no server. |
| `packages/engine` | The math brain as pure ES modules: 79 problem generators (v1 set + Phase 1 expansion covering every grade's full major work), grade 3–8 curriculum pools, adaptive tier logic, the real-money ledger, assessment, review scheduling, the business sim. 373 unit tests. |
| `packages/curriculum` | The authored bank — Common Core skill taxonomy, 45 units, six 128-day sequences, Snags, teach panels and TeachStep data — plus major-work coverage reporting. Owner-reviewed: verify, never re-author. 47 unit tests. |
| `packages/ui` | The React component library (plain JSX, zero dependencies, inline-styled from `tokens.js`) at §0/§0a/§0b values: 78 blob illustrations, the five-move lesson, the four teach-step layouts, onboarding, assessments, Rewards, Grown-ups. See its README for the architecture contract; `CHANGES.md` for every divergence. |
| `apps/web` | The v2 React app (Vite): onboarding and the family doorway, Home with the week plan and grade stack, the five-move daily lesson, Inspection Day and the License, the business day, Rewards with the real-money receipt, and Grown-ups. Persisted locally, keyed by student. |
| `docs/` | Product docs: design spec, style guide, curriculum & engagement plan, build plan. |
| `tests/` | The browser suites: `test_webapp.mjs` drives the built v2 bundle (149 checks), `test_layouts.mjs` the teach layouts at two widths (18), `test_kampus.js` the v1 app. |

## Develop

```bash
npm install          # workspace install (Node 20+)
npm test             # 428 engine + curriculum unit tests (Vitest)
npm run dev          # v2 app dev server (Vite)
npm run build        # v2 production build
npm run test:webapp  # build, serve dist/, drive it in a real browser (57 checks)
npm run test:layouts # the four teach-step layouts, desktop + phone (18 checks)
npm run test:e2e     # v1 end-to-end suite (needs Playwright browsers)
```

No environment variables yet; Phase 2 (Supabase backend) introduces them and will document each here.

## Testing philosophy

The engine is pure functions, so the heavy testing is headless and fast: a 10,800-problem fuzz across every grade × topic × tier runs in under a second. The curriculum package's tests double as living documentation of standards coverage — they assert every grade's complete Common Core major work is covered, and fail on regression.

Unit tests are not enough here, and we know that empirically. Two bugs reached `main` that every vitest test was blind to by construction: generators resolved by `fn.name`, which the production bundle renames, so real lessons were empty while dev was green; and a screen that was never wired to the engine behind it. Both are only visible in the bundle a kid actually loads, so `tests/test_webapp.mjs` builds `apps/web`, serves `dist/` as a plain static host, and drives it with a real browser — no dev server, no HMR, no source maps doing us favours. CI runs it on every push.

Two sets of invariants are tests rather than intentions: the **ADHD laws** (untimed by default, no punitive mechanics, no streak display anywhere, nothing dies, absence never punished) and the **§5 rule** (a quiz or test can never hurt the business). They live in `packages/engine/test/adhd-laws.test.js` and `year-wiring.test.js`.

## Docs

- `docs/KAMPUS_BUILD_PLAN.md` — architecture, data model, phases (the v2 roadmap)
- `docs/KAMPUS_CURRICULUM_PLAN.md` — per-grade lesson map, real-world wraps, reward-economy design, with sources
- `docs/KAMPUS_TEACHING_SYSTEM.md` — the teaching system: daily lesson model, per-band pedagogy, six year-long scope & sequences, assessment + retention design
- `docs/KAMPUS_BUSINESS_SIM.md` — the living business: inventory, customers, reputation with a floor, and the lesson-enforcement loop
- `docs/KAMPUS_INVENTORY.md` — full inventory, per-grade numbers, standards alignment, learning-science audit, and the gap list to a real product
- `docs/DESIGN_TO_CODE_HANDOFF.md` — how Claude Design deliverables get integrated (drop in design-incoming/, paste the kickoff prompt into Claude Code)
- `docs/DESIGN_SPEC.md` / `docs/STYLE_GUIDE.md` — the 10-screen product spec and design tokens
