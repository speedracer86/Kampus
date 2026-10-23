# Kampus

ADHD-first math practice for homeschooled kids (grades 3–8). Kids answer questions to earn
**Kredits** (in-app currency) and **Tickets** (parent-approved real-world rewards).

npm workspaces monorepo. `npm install` once at the root installs everything.

## Commands

```bash
npm install                   # root only — installs all workspaces
npm test                      # unit tests: 420 vitest tests (engine + curriculum)
npm run dev                   # apps/web at http://localhost:5173
npm run build                 # production build of apps/web
npm run test:webapp           # build apps/web, serve dist/, drive it: 85 checks
npm run test:layouts          # the four §0b teach layouts, desktop + phone: 18 checks
npm run test:e2e              # Playwright suite against the legacy index.html
open index.html               # run the legacy v1 app: no server, no build

npm test -w @kampus/engine    # scope to one workspace
```

GitHub work goes through the `gh` CLI (already authenticated) — not an MCP server.

## Verification (run after every edit)

```bash
npm test && npm run build
PW_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:webapp
```

All must be clean: 420 passing unit tests, build exits 0, 85/85 webapp checks. CI
(`.github/workflows/ci.yml`) runs all of it plus `test:layouts` on every push to `main`
and every PR, so a red run here is a red run there.

**`npm test` cannot see the class of bug that has twice reached main** — generators lost
to minification, and a screen never wired to its engine. Both were invisible to vitest by
construction and only showed up in the bundle a kid loads. If you touched `apps/web`,
`packages/ui`, or anything the bundle resolves by name, `test:webapp` is the suite that
matters.

**If you touched `index.html`**, also run the end-to-end suite:

```bash
PW_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:e2e
```

Clean run prints `FUZZ ISSUES: 0` and `ERRORS: 0` and exits 0. It fuzzes 10,800 generated
problems, then drives onboarding, a full round with a wrong answer and second-look retry,
teach-mode Kredit halving, focus mode, shop, rewards + parent approval, the lemonade stand,
and a passing grade test.

**Coverage gap:** `apps/web` has no vitest suite of its own — `tests/test_webapp.mjs`
covers it from the outside instead, against the built bundle. Logic that deserves unit
tests belongs in `packages/engine`, which is why `snagChoices` lives there and not in
`year.js`.

## Which doc wins

When the docs conflict, follow this order — it is the campaign's, and it is why some
older guidance is deliberately not followed:

1. `docs/KAMPUS_PLAY_SYSTEM.md` — the Snag, the three-source rule, business types, the
   four loops, the ADHD laws.
2. `design-incoming/BUSINESS_CLEANUP.md` — the Opening Week and Karla.
3. `design-incoming/START_HERE.md` — the original ten-step build.
4. The older docs (`KAMPUS_TEACHING_SYSTEM`, `KAMPUS_BUSINESS_SIM`).

`design-incoming/design_handoff_kampus/STYLE_GUIDE.md` **§0 stays binding for every
visual** regardless of the above.

Two sets of invariants are enforced by tests rather than intentions, in
`packages/engine/test/adhd-laws.test.js` and `year-wiring.test.js`:

- **The ADHD laws** — untimed by default, no punitive mechanics, no streak display
  anywhere, nothing dies, absence is never punished.
- **The §5 rule** — a quiz or test can never hurt the business: no reputation loss, no
  closure, nothing taken. A miss produces a repair plan.

## Architecture

- **Two live front ends, deliberately.** `index.html` is the complete v1 app that families
  use today (vanilla JS, no build). `apps/web` is the React rebuild and now carries the
  product: onboarding, the doorway, Home, the five-move lesson, Inspection Day and the
  License, the business day, Rewards and Grown-ups. **The shop is the one screen still
  only in `index.html`**, which is why it is absent from the nav rather than present and
  dead. Changing one front end does **not** change the other.
- **`packages/engine` is the math brain and is strictly pure.** Generators, adaptive tier
  rules, and economy math as ES modules with no DOM and no state of its own — callers own
  all state. This is what makes the whole thing testable headlessly; keep it that way.
- **`packages/ui` started as a design handoff and is now our evolving design system**
  (owner-directed v2 "Modern" pass, Oct 2026). Still: compose screens from it rather
  than styling in `apps/web`, and record every design change in `packages/ui/CHANGES.md`.
- **`packages/curriculum`** holds the Common Core skill taxonomy and major-work coverage
  reporting — the roadmap turns curriculum into data rather than code.
- **State** lives at the edges: `apps/web/src/store.js` and the legacy app's own `S`
  object (localStorage `kampus_v1`). The React store is keyed by student from day one —
  `load(studentId)` / `save(studentId, state)` / `append(studentId, event)` over
  `kampus_v1_<studentId>` — so swapping in Supabase changes that one file and no
  components. See `docs/DEPLOYMENT.md`; the shape is deliberately the server's shape.

### Core files

| Path | What it is |
|---|---|
| `packages/engine/src/` | All pure: generators, adaptive tiers, economy, assessment, earnings, review, business, seasons, market, field assignments, metrics |
| `packages/curriculum/src/` | The authored bank — 45 units, 128-day sequences, Snags, teach panels. Owner-reviewed: verify, never re-author |
| `apps/web/src/year.js` | The seam between the bank (what is taught) and the engine (the questions) |
| `packages/ui/src/tokens.js` | Every design token; the only legal source of color |
| `packages/ui/src/` | Component library, at §0/§0a/§0b values |
| `packages/ui/src/teach-layouts.jsx` | The four §0b teach-step layouts, the takeaway band, the voice row |
| `packages/ui/src/onboarding.jsx` | Parent setup, student first run, the doorway (§0a) |
| `packages/ui/src/pin-pad.jsx` | The one PIN pad, used in all four places a PIN is asked |
| `packages/curriculum/src/teach-steps.js` | TeachStep resolution: reference set → authored bank → mechanical walk (now only a safety net) |
| `packages/curriculum/src/teach-steps-bank.js` | The owner's authored TeachSteps for the other 75 skills |
| `packages/curriculum/src/teach-depth.js` | Second worked examples per skill + plan-B representations for the wall skills |
| `apps/web/src/App.jsx` | The app's routing and the wiring of engine ↔ component library |
| `apps/web/src/store.js` | Persistence surface (swap point for Supabase) |
| `index.html` | The legacy v1 app, still complete and shipping |
| `tests/test_kampus.js` | Playwright suite for the legacy app |
| `tests/test_webapp.mjs` | The suite that matters: the BUILT React bundle in a real browser |
| `tests/test_layouts.mjs` | The §0b layout gallery at 1280 and 390 |
| `docs/KAMPUS_BUILD_PLAN.md` | Where this is going: Supabase, multi-family, sync |
| `docs/DEPLOYMENT.md` | Stack, domains, Cloudflare Pages settings, the multi-tenant schema |
| `docs/STYLE_GUIDE.md` | Palette, type scale, motion, grade-band sizing |

## Code style

No linter or formatter is configured. **Match the surrounding code; don't reformat
untouched lines.**

- **Never hardcode a hex.** Import from `packages/ui/src/tokens.js`. If a color isn't
  there, it doesn't belong in the UI.
- Import across workspaces by package name and subpath: `@kampus/ui/tokens`,
  `@kampus/ui/quiz`, `@kampus/engine`. Never by relative path into another package.
- Keep `packages/engine` free of DOM, React, and stored state. If a function needs to
  remember something, it takes it as an argument and returns the update.
- `packages/ui`: inline `style` objects only — no CSS files, no Tailwind. Components take a
  single `onEvent(type, payload)` prop and never touch localStorage.
- Inter Tight is the only font, on both sides.
- `index.html`: 2-space indent, semicolons, compact single-line guards, plain globals over
  frameworks, `/* ===== banner ===== */` per section. Keep it dependency-free.

## Gotchas

- **`apps/web/public/` is generated and gitignored.** `scripts/sync-blobs.mjs` copies blobs
  from `packages/ui/blobs` on every `predev`/`prebuild`. Never hand-edit or commit it; add
  new illustrations to `packages/ui/blobs`.
- **World names live in ONE string table**, `packages/ui/src/tokens.js` `world`, keyed by
  worldId (`fractions`, `ratios`, `integers`, `equations`): **The Kitchen · The Market ·
  Outside · The Workshop**, owner-confirmed in ROUND3. Never hard-code a world name —
  import `world` or call `worldName(idOrTopic)`. The design deliverable's §1.3 and its
  own ASSETS still show two earlier namings from previous rounds; both are abandoned,
  so take world names from the table and not from the handoff. Topic codes (`frac`,
  `ratio`, `int`, `alg`) are internal and are not display names.
  Grepping the repo for a retired world name should return zero hits — that is the
  Task 0 done-condition and it stays true only if nothing quotes them, including docs.
- **A unit's `world` is bank vocabulary, not a display name.** The bank names a world on
  every unit and predates the rename, so fourteen of the 45 units say `Number Mine`,
  `Decimal Depths`, `Frozen Obby`, `Power Plant`, `Slope City` or `The Stand`. The engine's
  `unitTopic()` (`packages/engine/src/unit-world.js`) translates; **never look a unit's
  world up by name against the string table** — the seam used to, fell through to a `frac`
  default, and keyed 236 of 768 lesson days' adaptive tier on the wrong world.
- **The pre-§0 components are gone** — `Gallery.jsx`, `gallery-preview.jsx`, `home.jsx`,
  `flows.jsx`, `parent.jsx`, `gamify.jsx`, and the old Home pieces inside `app.jsx`. Their
  §0 replacements are `home-stack.jsx`, `question.jsx`, `lesson.jsx` and `interactives.jsx`;
  `pin-gate.jsx` is the one piece carried over. They live on two archive tags, not on
  any branch — `git show archive/pre-world-rename:packages/ui/src/home.jsx`, or
  `archive/pre-monorepo-ui` for the standalone `ui/` workspace that `packages/ui`
  replaced. Read from a tag rather than reviving a file.
- **Topic codes are not display names.** Internally: `frac`, `ratio`, `int`, `alg`.
- **Two different test runners.** Vitest for the packages, a plain Node + Playwright script
  for `test:e2e`. `npm test` does not run the e2e suite.
- **`PW_CHROME`** points Playwright at an existing Chromium instead of downloading one
  (~150MB). Without it, run `npx playwright install chromium` first.
- **`index.html` is hand-maintained, not generated** from the packages. There's no build
  that produces it — edit it directly and re-run `test:e2e`.
- **A generator resolved by `fn.name` dies under minification.** This shipped: the bundle
  renamed all 79 generator functions, so production lessons were empty while dev and
  vitest were green. `skill-index.js` now resolves through explicit registries and
  `esbuild keepNames: true` in `apps/web/vite.config.js` is load-bearing —
  `packages/engine/test/minification.test.js` bundles with and without it and fails if the
  fix is undone. **Never add a code path that looks a function up by its `.name`.**
- **Phase and move must advance in the same batch.** `DailyLesson` keeps `phase` and
  `at` as separate state. Advancing with `setAt` alone left one render where `at`
  pointed at the next move while `phase` was still `teach`, so `TeachSteps` got
  `undefined` and threw — which unmounted the whole app. Clicking "Start the mission"
  blanked the screen for every kid on every lesson with a New idea, and no test saw it
  because none had ever finished a teach phase. `finishMove` now calls
  `setPhase(phaseFor(moves[at + 1]))` next to `setAt`; the `useEffect` on `[at]` is a
  backstop, not the mechanism.
- **Key a step's layout component by the step, not by position.** Two consecutive
  steps of the same layout are the same component type, so React reuses the instance
  and the next step inherits the previous one's reveal state — arriving pre-revealed
  and, because its reveal effect never re-fires, permanently unsolvable with Next
  dead. `key={step.id ?? at}` in `lesson.jsx` is load-bearing.
- **A hook in a `.js` file builds clean and throws at runtime.** `jsxInject` supplies React
  to `.jsx` only, so a file using `React.useState` must be `.jsx`. The extension is
  load-bearing; this is why `util.js` is `util.jsx`.
- **Library files use bare `React.useState` with no import** — `apps/web/vite.config.js`
  injects React via `jsxInject`. Any other bundler needs the same shim.
- **Saves migrate.** The legacy app imports a `mathminer_v1` localStorage save on first load.
