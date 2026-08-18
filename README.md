# Kampus

Math practice that pays. An ADHD-first math app for homeschooled kids (grades 3–8): every correct answer earns **Kredits** (in-app currency for the shop, pets, and the lemonade-stand business sim); finishing runs and effort milestones earn **Tickets** toward real-world rewards a parent defines, capped at roughly $5/week.

Two things live in this repo:

1. **The live v1 app** — `index.html`, a single self-contained file, deployed on GitHub Pages. This is what's in daily use; it stays stable and untouched while v2 is built.
2. **The v2 monorepo** — a React rebuild on the Claude Design component library, headed for a multi-family pilot (accounts, sync, parent dashboard). See `docs/KAMPUS_BUILD_PLAN.md` for the full architecture and phase plan.

## Repo layout

| Path | What it is |
|---|---|
| `index.html` | The complete v1 app (markup, styles, logic, embedded illustrations). Open in any browser — no install, no server. |
| `packages/engine` | The math brain as pure ES modules: ~60 problem generators with teach steps, grade 3–8 curriculum pools, adaptive tier logic, economy math. Fully unit-tested. |
| `packages/curriculum` | Common Core (CCSS) skill taxonomy + major-work coverage reporting. The tests document the known curriculum gaps the build plan addresses. |
| `packages/ui` | The React component library from the design handoff (plain JSX, zero dependencies, inline-styled from `tokens.js`). See its README for the architecture contract; `CHANGES.md` for local divergences. |
| `apps/web` | The v2 React app (Vite). Currently a working vertical slice: Home → world → full quiz round with teach mode, streaks, and Kredit earnings, persisted locally. |
| `docs/` | Product docs: design spec, style guide, curriculum & engagement plan, build plan. |
| `tests/` | v1's end-to-end Playwright suite (still runs against `index.html`). |

## Develop

```bash
npm install          # workspace install (Node 20+)
npm test             # engine + curriculum unit tests (Vitest)
npm run dev          # v2 app dev server (Vite)
npm run build        # v2 production build
npm run test:e2e     # v1 end-to-end suite (needs Playwright browsers)
```

No environment variables yet; Phase 2 (Supabase backend) introduces them and will document each here.

## Testing philosophy

The engine is pure functions, so the heavy testing is headless and fast: a 10,800-problem fuzz across every grade × topic × tier runs in under a second. The curriculum package's tests double as living documentation of coverage gaps — when a gap is filled, its test changes.

## Docs

- `docs/KAMPUS_BUILD_PLAN.md` — architecture, data model, phases (the v2 roadmap)
- `docs/KAMPUS_CURRICULUM_PLAN.md` — per-grade lesson map, real-world wraps, reward-economy design, with sources
- `docs/DESIGN_SPEC.md` / `docs/STYLE_GUIDE.md` — the 10-screen product spec and design tokens
