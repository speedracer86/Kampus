# Math Miner

An ADHD-first math practice game for homeschooled kids (grades 3–8), built as a single self-contained HTML file. Solve problems → your world's blob mascot bounces and bursts → earn gems for the shop and effort-based tickets toward real-world rewards your parent defines. Includes step-by-step "teach me" explanations with read-aloud, adaptive difficulty, grade tests that gate progression, and a parent dashboard.

## Run it

Open `index.html` in any modern browser. That's it — no install, no server, no internet needed after load. Best read-aloud voices: Microsoft Edge ("Natural" voices), then Chrome, then Safari with an Enhanced voice installed.

Progress saves automatically to the browser's localStorage, **per device per browser**. Clearing site data erases progress (the parent dashboard also has an explicit reset).

## Files

| File | What it is |
|---|---|
| `index.html` | The entire game: markup, styles, logic, and embedded SVG illustrations (~150KB) |
| `style_guide.html` | Brand & UI design system with desktop mockups — the design source of truth |
| `math_miner_brief.md` | Full project context brief for designers/collaborators |
| `test_game.js` | Playwright test suite: 14,400-problem generator fuzz + end-to-end flows |
| `light_style.css`, `illos_const.js`, `new_style.css` | Build inputs already spliced into the game file (kept for reference) |
| `illos/SVG/` | The blob illustration pack (80 SVGs) — **license unverified; confirm before public release** |

## Testing

```bash
npm install playwright   # uses the preinstalled Chromium at /opt/pw-browsers
node test_game.js        # fuzzes every generator at every grade/tier + plays full rounds
```

A run is clean when it reports `FUZZ ISSUES (0)` and `CONSOLE ERRORS (0)`.

## How the pieces fit (inside index.html)

- **State** (`S`) — one localStorage object: currency, tickets, per-grade tiers/stats, owned items, settings.
- **Curriculum** — ~60 problem generators with teach steps, assembled per grade (3–8) × world × tier in `CURRICULUM`.
- **Adaptive engine** — tiers move up/down from the last 6 answers per world, per grade.
- **Game loop** — Chill (12 questions) / Blitz (90s) rounds, streak multipliers, gem economy.
- **Tickets** — milestone-only real-reward currency with weekly cap and parent approval flow.
- **Screens** — home, play, end, shop, rewards (piggy bank), grade test, parent dashboard; desktop ≥1000px adds a sidebar, grade hero module, and level-up CTA.

## Config knobs parents actually use

All in the **for grown-ups** screen inside the app: grade placement, weekly ticket cap, reward menu, read-aloud voice, sound, full reset.
