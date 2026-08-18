# Kampus

ADHD-first math practice for homeschooled kids (grades 3–8). Kids answer questions to earn
**Kredits** (in-app currency) and **Tickets** (parent-approved real-world rewards).

## Commands

```bash
# --- the app (repo root) ---
npm install                       # Playwright, for the test suite only
npx playwright install chromium   # once; skip if you set PW_CHROME (see Gotchas)
npm test                          # full suite — see Verification below
open index.html                   # run the app: no server, no build step

# --- the component library (separate npm project) ---
cd ui && npm install
cd ui && npm run dev              # gallery at http://localhost:5173
cd ui && npm run build            # type-free sanity check: catches broken imports/JSX
```

GitHub work goes through the `gh` CLI (already authenticated) — not an MCP server.

## Verification (run after every edit)

```bash
PW_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

Clean run prints `FUZZ ISSUES: 0` and `ERRORS: 0` and exits 0; it exits 1 on either.
The suite fuzzes 10,800 generated problems across every grade × topic × tier, then runs
end-to-end flows for onboarding, a full round with a wrong answer and second-look retry,
teach-mode Kredit halving, focus mode, the session banner, shop, rewards + parent approval,
the lemonade stand, and a passing grade test — collecting `pageerror`s throughout.

**It covers `index.html` only.** `ui/` has no test suite: verify it with `npm run build`
plus a look at the gallery in a browser.

## Architecture

- **Two independent tracks against one design system.** `index.html` is the shipping app;
  `ui/` is a React componentization of the same screens. **Neither imports the other** —
  a change in one does not propagate, so intentional changes must be made twice.
- **`index.html` is the whole app** (2,566 lines): `<style>` 11–363, markup to 482,
  `<script>` 483–2564. Vanilla JS, zero dependencies, no framework, no build. Navigate it
  by its `/* ===== section ===== */` banners.
- **State is two globals.** `S` = persistent (saved to localStorage `kampus_v1` via `store`
  + `save()`); `G` = transient round state, deliberately never persisted, so a reload
  returns Home. `freshState()` is the authoritative schema — add new fields there.
- **Content engine.** `makeProblem(topic, forceTier)` generates a problem with answer
  choices and teach steps; `CURRICULUM` assembles pools per grade × world × tier; an
  adaptive engine raises a tier on 5-of-6 correct and lowers it on ≤2-of-6.
- **Routing** is `go(name)` over the `SCREENS` map: nine `#scr-*` divs toggled with `.on`.

### Core files

| Path | What it is |
|---|---|
| `index.html` | The entire shipping app |
| `tests/test_kampus.js` | The Playwright suite (the feedback loop) |
| `ui/src/lib/tokens.js` | Every design token — the only legal source of color |
| `ui/src/lib/` | Component library; `Gallery.jsx` renders all of it |
| `docs/STYLE_GUIDE.md` | Palette, type scale, motion, grade-band sizing |
| `docs/DESIGN_SPEC.md` | The 10-screen product spec |
| `docs/ASSETS.md` | Blob illustration inventory + inline-SVG icon set |

## Code style

There is no linter or formatter in this repo. **Match the surrounding code; do not
reformat untouched lines.**

- `index.html`: 2-space indent, semicolons, compact single-line guards
  (`try{ ... }catch(e){ ... }` on one line), plain functions and globals over classes or
  modules, `/* ===== banner ===== */` to open a section. Keep it dependency-free.
- `ui/`: inline `style` objects only — no CSS files, no Tailwind, no styled-components.
- **Never hardcode a hex.** Import from `tokens.js`; if a color isn't there, it doesn't
  belong in the UI.
- Inter Tight is the only font, on both the kid and parent sides.
- Components take a single `onEvent(type, payload)` prop. No other side channels, and no
  localStorage inside components — persistence belongs to the caller.
- `ui/src/lib/parent.jsx` P-components (square corners, 2px rules) are for Grown-ups
  surfaces only; the kid side never uses them.

## Gotchas

- **Topic codes are not display names.** Internally: `frac`, `ratio`, `int`, `alg`. On
  screen: The Kitchen, The Store, The Trip, The Build. Mapping at `index.html:1541`.
- **`index.html` is hand-maintained, not generated.** There is no source to rebuild it
  from — edit it directly and re-run the suite.
- **Root and `ui/` are separate npm projects.** `npm test` only works from the root;
  `npm run dev` only from `ui/`.
- **`PW_CHROME`** points Playwright at an existing Chromium instead of downloading one
  (~150MB). Without it, run `npx playwright install chromium` first.
- **Saves migrate.** A legacy `mathminer_v1` localStorage save is imported on first load.
  Clearing site data erases progress; Grown-ups has an explicit reset.
- **`ui/src/lib/tokens.js` world names are stale** — still Fraction Factory / Trade Tycoon /
  Weather Station / Equation Lab, while `docs/STYLE_GUIDE.md` uses the current names. Known
  drift; fix the token map rather than hardcoding names at call sites.
- **`ui/src/lib/gallery-preview.jsx` is generated** for the design-preview environment and
  unused by the Vite app. Regenerate it; never hand-edit.
- **Library files use bare `React.useState` with no import** — `ui/vite.config.js` injects
  React via `jsxInject`. Any other bundler needs the same shim.
- `Blob` components need a `dir`/`blobDir` prop pointing at the blob SVGs (`/blobs/` here).
