# Kampus

ADHD-first math practice for homeschooled kids (grades 3–8). Kids answer questions to earn
**Kredits** (in-app currency) and **Tickets** (parent-approved real-world rewards).

npm workspaces monorepo. `npm install` once at the root installs everything.

## Commands

```bash
npm install                   # root only — installs all workspaces
npm test                      # unit tests: 94 vitest tests (engine + curriculum)
npm run dev                   # apps/web at http://localhost:5173
npm run build                 # production build of apps/web
npm run test:e2e              # Playwright suite against the legacy index.html
open index.html               # run the legacy v1 app: no server, no build

npm test -w @kampus/engine    # scope to one workspace
```

GitHub work goes through the `gh` CLI (already authenticated) — not an MCP server.

## Verification (run after every edit)

```bash
npm test && npm run build
```

Both must be clean: 94 passing tests, build exits 0. CI (`.github/workflows/ci.yml`) runs
exactly this on every push to `main` and every PR, so a red run here is a red run there.

**If you touched `index.html`**, also run the end-to-end suite:

```bash
PW_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:e2e
```

Clean run prints `FUZZ ISSUES: 0` and `ERRORS: 0` and exits 0. It fuzzes 10,800 generated
problems, then drives onboarding, a full round with a wrong answer and second-look retry,
teach-mode Kredit halving, focus mode, shop, rewards + parent approval, the lemonade stand,
and a passing grade test.

**Coverage gap:** `apps/web` has no tests of its own. Verify it with `npm run build` plus a
look in the browser.

## Architecture

- **Two live front ends, deliberately.** `index.html` is the complete v1 app that families
  use today (vanilla JS, no build). `apps/web` is the React rebuild, currently a **Phase-0
  vertical slice** — Home → pick a world → quiz round → home, and nothing else. Screens
  absent there (shop, rewards, stand, grown-ups, onboarding, grade tests) still exist only
  in `index.html`. Changing one does **not** change the other.
- **`packages/engine` is the math brain and is strictly pure.** Generators, adaptive tier
  rules, and economy math as ES modules with no DOM and no state of its own — callers own
  all state. This is what makes the whole thing testable headlessly; keep it that way.
- **`packages/ui` is a design handoff, not our code.** Compose it, don't restyle it.
  Divergences from the delivered files get recorded in `packages/ui/CHANGES.md`.
- **`packages/curriculum`** holds the Common Core skill taxonomy and major-work coverage
  reporting — the roadmap turns curriculum into data rather than code.
- **State** lives at the edges: `apps/web/src/store.js` (localStorage `kampus_web_v0`,
  intentionally a tiny read/write surface so Phase 2 can swap in Supabase) and the legacy
  app's own `S` object (localStorage `kampus_v1`).

### Core files

| Path | What it is |
|---|---|
| `packages/engine/src/` | Generators, adaptive tiers, economy, quiz adapter — all pure |
| `packages/ui/src/tokens.js` | Every design token; the only legal source of color |
| `packages/ui/src/` | Component library; `Gallery.jsx` renders all of it |
| `apps/web/src/App.jsx` | The vertical slice wiring engine ↔ component library |
| `apps/web/src/store.js` | Persistence surface (swap point for Supabase) |
| `index.html` | The legacy v1 app, still complete and shipping |
| `tests/test_kampus.js` | Playwright suite for the legacy app |
| `docs/KAMPUS_BUILD_PLAN.md` | Where this is going: Supabase, multi-family, sync |
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
- `parent.jsx` P-components (square corners, 2px rules) are for Grown-ups surfaces only;
  the kid side never uses them.
- Inter Tight is the only font, on both sides.
- `index.html`: 2-space indent, semicolons, compact single-line guards, plain globals over
  frameworks, `/* ===== banner ===== */` per section. Keep it dependency-free.

## Gotchas

- **`apps/web/public/` is generated and gitignored.** `scripts/sync-blobs.mjs` copies blobs
  from `packages/ui/blobs` on every `predev`/`prebuild`. Never hand-edit or commit it; add
  new illustrations to `packages/ui/blobs`.
- **World identity is defined in three places** and they don't fully agree:
  `apps/web/src/worlds.js`, `packages/ui/src/tokens.js` (`world` map), and the engine's
  `GRADE_WORLDS`. `worlds.js` gives `alg` the `Idea` blob while `tokens.js` says `Learning`.
  Reconcile deliberately rather than patching one call site.
- **World names are The Kitchen / The Store / The Trip / The Build** (topics `frac` /
  `ratio` / `int` / `alg`), per the design handoff. The v1 names (Fraction Factory, Trade
  Tycoon, Weather Station, Equation Lab) are gone everywhere except
  `packages/ui/src/gallery-preview.jsx`, which is generated and unused.
- **`GRADE_WORLDS[grade][topic].name` is dead data.** The legacy app overwrites all of it
  from the `WORLD` map at `index.html:1549`, and `apps/web` reads only `.desc` from it —
  names there come from `worlds.js`. Its per-grade names (Number Mine, Frozen Obby, Slope
  City, Puzzle Lab) have never been user-visible. Don't rely on them; don't render them.
- **The world emoji in `GRADE_WORLDS` are never rendered.** Only pet and shop-item icons
  reach the screen.
- **Topic codes are not display names.** Internally: `frac`, `ratio`, `int`, `alg`.
- **Two different test runners.** Vitest for the packages, a plain Node + Playwright script
  for `test:e2e`. `npm test` does not run the e2e suite.
- **`PW_CHROME`** points Playwright at an existing Chromium instead of downloading one
  (~150MB). Without it, run `npx playwright install chromium` first.
- **`index.html` is hand-maintained, not generated** from the packages. There's no build
  that produces it — edit it directly and re-run `test:e2e`.
- **Library files use bare `React.useState` with no import** — `apps/web/vite.config.js`
  injects React via `jsxInject`. Any other bundler needs the same shim.
- **`packages/ui/src/gallery-preview.jsx` is generated.** Regenerate it; never hand-edit.
- **Saves migrate.** The legacy app imports a `mathminer_v1` localStorage save on first load.
