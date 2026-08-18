# Kampus React component library

Zero-dependency React components, inline-styled from `tokens.js`. Written as plain ESM + JSX — drop into any React build (Vite, Next, CRA) or transpile standalone. No CSS files, no Tailwind, no styled-components.

## Run the gallery

```bash
npm install
npm run dev      # http://localhost:5173 — live render of every component
npm run build    # production bundle into ui/dist/
```

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/` | The component library itself (files below) |
| `src/main.jsx` | Mounts `Gallery` into `index.html` |
| `public/blobs/` | All 80 blob SVGs, served at `/blobs/*.svg` — the default `blobDir` |
| `vite.config.js` | `jsxInject` puts React in scope so library files keep using bare `React.useState` |

The library files use bare `React.useState` with no React import, matching the design handoff. Rather than edit nine files, `vite.config.js` injects `import React from 'react'` into every `.jsx`. Any other bundler needs the same shim (or React on `window`). The handoff's trailing `module.exports` lines were stripped per the note below; the ESM `export`s are the interface.

## Files (`src/lib/`)
- `tokens.js` — every design token: colors, world palette + `worldTint()`, type scale, radii, shadow, motion, grade-band sizing `band(grade)`, streak colors, confetti.
- `primitives.jsx` — `Button` (primary/ink/outline/gold/ghost/destructive, sm/md/lg), `Card` (white/tint/dashed-empty), `Kicker`, `Chip`, `ProgressBar` (single or stacked segments), `Toggle`, `Segmented`, `TierDots`, `KreditCoin`, `TicketIcon`, `Logo`, `Blob`, and form elements `TextField`, `RadioGroup`, `Checkbox`, `Select`, `Stepper`.
- `app.jsx` — `NavBar` (horizontal sticky nav with centered items + week/Kredit/avatar cluster), `GradeCard` (passed/current/locked with progress + detail), `WorldTile`, `KreditsWeekCard` (earned-vs-spent bar), `TeachConfirm` (the think-first cost gate).
- `quiz.jsx` — the working game: `QuizRound` (streaks, Kredit math, teach economics, focus mode, second-look retry, celebration), `EndOfRound`, `TeachPanel` (step reveal + read-aloud), answer modes `NumberLine`, `FractionPieces`, `MoneyCounter`, `Thermometer`, and `speak()` (built-in browser read-aloud).
- `flows.jsx` — `StudentOnboarding` (3 steps), `RewardsPanel` (balance, redeem, pending), `ShopGrid` (tabs + affordability states).
- `parent.jsx` — **Grown-ups surfaces, Modernist structure in Kampus colors** (square corners, 2px rules, flush-left buttons): structural primitives `PRule/PKicker/PSection/PButton/PTable/PStatBar`, plus `ParentAnalytics`, `TicketAdmin`, `ParentSettings`, `ParentOnboarding` (4 steps).
- `home.jsx` — `HomeScreen` (the composed kid dashboard, responsive: two-column ≥900px, single column below, 3-up grade strip + 1-up worlds on phones) and `PinGate` (4-digit parent gate — a kid-stopper, not security).
- `gamify.jsx` — gamification: `DailyQuests` (2/day, Kredit-paying, claim buttons; `compact` for tight spots), `QuestChip` (Play-HUD progress pill), `CampusMap` (skyline SVG — grade passes build districts, next-only silhouette, `teaser` variant for Home), `CampusPage` (full map page). Backend owns quest rotation/progress and unlock state.
- `gallery-preview.jsx` — auto-generated single-file bundle of all of the above for the live gallery page; regenerate, don't hand-edit.

## Architecture contract (settled with the designer)
- **Fully working components**: game logic (streak multipliers ×1.5/×2/×3 at 3/6/10, Kredit gain `round((8+4·tier)·mult·(1+gear%))`, teach halving, second-look retry) lives inside `QuizRound`. Backend does NOT reimplement it.
- **Backend feeds questions**: `QuizRound` takes a `questions` array — `{text, mode: 'choice'|'numline'|'fraction'|'money'|'thermo', choices?, answerIndex?, vis?, teach: string[]}`. Money/thermometer are UI-only modes; generators are backend's job.
- **Single event bus**: every stateful component takes `onEvent(type, payload)`. No other side channels, no localStorage — persistence is fully the backend's job.
- **Read-aloud is built in** (browser SpeechSynthesis via `speak()`); no hook needed.
- **The Modernist boundary**: everything behind the Grown-ups nav (settings, analytics, ticket admin, parent onboarding) uses `parent.jsx` — square corners, 2px ink rules, flush-left labels — but Kampus's warm palette, never red. Kid side never uses P-components.

## Event table
| Component | Events (type → payload) |
| --- | --- |
| `QuizRound` | `answer` → `{right, gain?, streak?, halved?}` · `teach_open` → `{}` · `round_end` → `{kredits, correct, asked, acc, best, fixed, comeback}` · `again` → `{}` |
| `StudentOnboarding` | `onboarded` → `{grade, avatar}` |
| `ParentOnboarding` | `done` / `later` → `{grade, sessionMins, focusMode, menu}` |
| `RewardsPanel` | `redeem` → menu item |
| `ShopGrid` | `buy` → item |
| `TicketAdmin` | `approve` / `refund` → pending item · `menu_change` → updated item |
| `HomeScreen` | `play` / `quick6` / `world` / `test` / `stand` / `rewards` → context payload |
| `PinGate` | (callbacks: `onPass`, `onCancel`) |
| `DailyQuests` | `quest_claim` → quest |
| `CampusMap`/`CampusPage` | `open_map` → `{}` |
| `ParentSettings` | `grade` → n · `session` → mins · `focus` / `sound` → bool · `voice_test` · `reset` |

## Rules for consumers (Claude Code: follow these)
1. Never hardcode a hex — import from `tokens.js`. If a color isn't there, it doesn't belong in the UI.
2. Inter Tight everywhere (the single app font — parent side included); load weights 400–900 once at app root.
3. `Blob` needs a `dir` prop pointing at the `blobs/` folder; see `../docs/ASSETS.md` for role assignments and sizes. Never recolor blobs.
4. Compose, don't restyle: pass `style` for layout (margins, widths) only, not to change component look. Look changes go in the component + STYLE_GUIDE.
5. Grade-band sizing: use `band(grade)` from tokens for any Play-screen surface.
6. States that matter: `Button disabled` = unaffordable; locked things get `opacity: .45`; keyboard focus ring is `2px solid` green, offset 2.
7. Full behavior spec (economy math, ADHD rules, flows) lives in `../docs/STYLE_GUIDE.md` and `../docs/DESIGN_SPEC.md`.

## Example
```jsx
import { color } from './tokens.js';
import { Button, Card, Kicker } from './primitives.jsx';
import { NavBar, GradeCard } from './app.jsx';

<NavBar
  items={[
    { id: 'play', label: 'Play', dot: color.green },
    { id: 'stand', label: 'My Stand', dot: color.lime },
    { id: 'shop', label: 'Shop', dot: '#8F97DE' },
    { id: 'rewards', label: 'Rewards', dot: color.gold },
    { id: 'parents', label: 'Grown-ups', dot: color.textFaint },
  ]}
  active="play" weekLabel="Week 1 · 3 days" kredits="128" avatar="Thinker" blobDir="blobs/"
  onNav={go} onShop={() => go('shop')}
/>
<GradeCard grade={4} status="current" pct={42} detail="2/4 worlds ready" />
<Button variant="primary" size="lg">Run it back</Button>
```

Note: the handoff shipped `module.exports` tails alongside the ESM exports so the files would also load in the design-preview environment. They are stripped here — Vite is ESM-only and `module` is undefined at runtime. `gallery-preview.jsx` is the auto-generated single-file bundle for that preview environment; it is kept for reference, is not imported by this app, and should be regenerated rather than hand-edited.
