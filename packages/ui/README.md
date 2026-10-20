# Kampus React component library

Zero-dependency React components, inline-styled from `tokens.js`. Written as plain ESM + JSX — drop into any React build (Vite, Next, CRA) or transpile standalone. No CSS files, no Tailwind, no styled-components.

## Files
- `tokens.js` — every design token, at §0 values: colors, the grade purple ramp, world palette, type scale (including the `numeral()` display-numeral helper), radii, shadows, motion, grade-band sizing `band(grade)`, and the `$` money helpers.
- `primitives.jsx` — `Button`, `Card` (incl. the §0 `sheet` variant), `Kicker`, `Chip`, `PillLabel`, `ProgressBar`, `Toggle`, `Segmented`, `TierDots`, `KreditCoin`, `TicketIcon`, `Logo`, `Blob`, and the form elements.
- `util.jsx` — `useWidth` and `speak`. Non-component exports live here on purpose: React Fast Refresh only works on modules whose exports are all components. The `.jsx` extension is load-bearing (see its header).
- `app.jsx` — the app frame: `NavBar` (on ground, 1.5px rule, `$` Kredits, 38px initial avatar).
- `question.jsx` — `Question`, the one question surface shared by the lesson, missions, the unit quiz and the grade test (§0 4d/4f), plus `PayoutLine` and `HELP_BY_CONTEXT`.
- `lesson.jsx` — `DailyLesson` (the five-move runner) with `LessonSpine`, `TeachSteps` (the cheat-sheet teach frame), `ReteachView` and `LessonDone`.
- `interactives.jsx` — the three hands-on lesson steps: `ShadeBar`, `SplitTheBill`, `SpotTheMistake`, registered in `INTERACTIVES`.
- `home-stack.jsx` — `HomeStack` (§0 Home) with `GradeStack`, `StatPair`, `TodaysLesson`, `PracticeRow` and `StandBand`.
- `quiz.jsx` — `QuizRound` (free-practice runs, Economy v2) with `EndOfRound`, `TeachPanel` and the free-response answer modes.
- `pin-gate.jsx` — `PinGate`, the kid/parent boundary. Step 8 restyles it; §0 never drew one.

## Architecture contract (settled with the designer)
- **Fully working components**: game logic (streak multipliers ×1.5/×2/×3 at 3/6/10, Kredit gain `round((8+4·tier)·mult·(1+gear%))`, teach halving, second-look retry) lives inside `QuizRound`. Backend does NOT reimplement it.
- **Backend feeds questions**: `QuizRound` takes a `questions` array — `{text, mode: 'choice'|'numline'|'fraction'|'money'|'thermo', choices?, answerIndex?, vis?, teach: string[]}`. Money/thermometer are UI-only modes; generators are backend's job.
- **Single event bus**: every stateful component takes `onEvent(type, payload)`. No other side channels, no localStorage — persistence is fully the backend's job.
- **Read-aloud is built in** (browser SpeechSynthesis via `speak()`); no hook needed.
- **§0 is the binding visual spec** (`design-incoming/design_handoff_kampus/STYLE_GUIDE.md`). It supersedes the v1 "Modernist" parent styling and the v2 Modern pass; the pre-§0 components that embodied those were removed once their §0 replacements landed.

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
3. `Blob` needs a `dir` prop pointing at the `blobs/` folder; see `../ASSETS.md` for role assignments and sizes. Never recolor blobs.
4. Compose, don't restyle: pass `style` for layout (margins, widths) only, not to change component look. Look changes go in the component + STYLE_GUIDE.
5. Grade-band sizing: use `band(grade)` from tokens for any Play-screen surface.
6. States that matter: `Button disabled` = unaffordable; locked things get `opacity: .45`; keyboard focus ring is `2px solid` green, offset 2.
7. Full behavior spec (economy math, ADHD rules, flows) lives in `../STYLE_GUIDE.md` and `../README.md`.

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

Note: `primitives.jsx`/`app.jsx` use `module.exports` alongside ESM exports so they also load in the design-preview environment; keep or strip the last line to taste in your build.
