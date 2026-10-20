# Design → Code Handoff: assembling the complete packet

*How to combine what Claude Design returns with this repo so a Claude Code session
has everything it needs. The repo IS the packet — design output gets placed into it,
then Claude Code works from the repo alone.*

## The one rule

**This repo is the single source of truth.** Claude Design's output is raw material;
it becomes real by being placed into the repo, recorded, and tested. Never work from
a loose zip sitting next to the repo.

## Step-by-step (you, ~10 minutes)

1. **Download Claude Design's deliverable** (usually a zip with component `.jsx`
   files, possibly new SVG assets, HTML prototypes, and a README/spec).
2. **Unzip it into `design-incoming/` at the repo root.** This folder is gitignored
   scratch (add `design-incoming/` to `.gitignore` if it isn't). Don't sort or edit
   anything — Claude Code will do the triage.
3. **Open Claude Code in the repo** and paste the kickoff prompt below.
4. When Claude Code finishes: review the screens in the dev server (`npm run dev`),
   then `git push`.

## What Claude Code does with it (the prompt encodes this)

- **Triage** `design-incoming/`: new screens vs. updates to existing components vs.
  prototypes-for-reference vs. assets.
- **Integrate**: new/updated components go into `packages/ui/src/` under the house
  contract (plain JSX, inline styles from `tokens.js` only, single `onEvent`, no
  localStorage, React via jsxInject — see CLAUDE.md). New illustrations go to
  `packages/ui/blobs/`. Divergences from the delivered files get a line in
  `packages/ui/CHANGES.md` — same as every pass before.
- **Reconcile tokens**: if the designs introduce colors/sizes not in `tokens.js`,
  either add them as named tokens (if genuinely new) or map them to the nearest
  existing token (if near-duplicates). No hardcoded hex survives integration.
- **Wire**: connect each new screen in `apps/web/src/App.jsx` to the engine and
  store, following the existing Home/Play wiring pattern.
- **Verify**: `npm test && npm run build` green, plus a headless screenshot pass of
  each new screen (the repo's Playwright setup).
- **Record**: CHANGES.md entries + README updates per CLAUDE.md.

## The kickoff prompt (paste into Claude Code)

```
A Claude Design deliverable is unzipped in design-incoming/. Integrate it:

1. Read CLAUDE.md, packages/ui/CHANGES.md, and docs/DESIGN_TO_CODE_HANDOFF.md first.
2. Triage design-incoming/ (new screens / component updates / reference prototypes /
   assets) and tell me the plan before changing anything.
3. Integrate per the handoff doc: components into packages/ui/src under the house
   contract, assets into packages/ui/blobs, every divergence recorded in CHANGES.md,
   no hardcoded hex (reconcile against tokens.js).
4. Wire new screens into apps/web following the existing Home/Play pattern. The flows
   they implement are specified in docs/KAMPUS_TEACHING_SYSTEM.md (lesson, quizzes,
   tests, placement) and docs/KAMPUS_BUSINESS_SIM.md (the living business).
5. Verify: npm test && npm run build clean, plus screenshot each new screen headless.
6. Commit in logical chunks and push.

Design decisions already settled (do not relitigate): top nav, white sheet on neutral
page, outline boxes, Inter Tight + Instrument Serif (numerals/ink only), the age-dial
band() system, Economy v2 mechanics, and the copy policy in
docs/KAMPUS_TEACHING_SYSTEM.md Part 9 (never "Common Core" in facing copy).
```

## What's already in the repo for Claude Code to lean on

- `CLAUDE.md` — conventions, commands, verification gates, gotchas
- `docs/KAMPUS_TEACHING_SYSTEM.md` — lesson/quiz/test/placement flows (Parts 2, 5, 8, 9)
- `docs/KAMPUS_BUSINESS_SIM.md` — the living-business loop and start-grade policy
- `docs/KAMPUS_BUILD_PLAN.md` — the phase roadmap (backend next after screens)
- `docs/KAMPUS_INVENTORY.md` — what exists vs. what's missing, prioritized
- `packages/ui/CHANGES.md` — every design decision and why
- The engine, tests, and CI — the safety net for all of the above

## Sequencing note

If the design deliverable lands before the review engine and lesson runner exist,
integrate screens with stub data first (the components are stateless over props by
contract, so this is natural), and build the engines behind them next — that order
is already the plan in KAMPUS_INVENTORY.md Tier 1.
