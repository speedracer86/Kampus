# Kampus

Math practice that pays. An ADHD-first math app for homeschooled kids (grades 3–8), built as a single self-contained HTML file. Every correct answer earns **Kredits** (in-app currency for the shop, pets, and the lemonade-stand business sim); finishing runs and passing grade tests earns **Tickets** toward real-world rewards a parent defines, capped at roughly $5/week. Asking to be taught costs half the Kredits for that question — help is always worth taking, but knowing it yourself pays more.

## Run it

Open `index.html` in any modern browser. No install, no server, no internet needed after first load (Google Fonts is the only external fetch and the app works without it). Best read-aloud voices: Microsoft Edge ("Natural" voices), then Chrome, then Safari with an Enhanced voice installed.

Progress saves to the browser's localStorage, **per device per browser**. Clearing site data erases progress; the Grown-ups screen has an explicit reset. A save from the earlier "Math Miner" prototype is migrated automatically on first load.

## What's inside

| Path | What it is |
|---|---|
| `index.html` | The entire app: markup, styles, logic, and 25 embedded SVG blob illustrations (~230KB) |
| `docs/DESIGN_SPEC.md` | The 10-screen product spec from the Claude Design handoff |
| `docs/STYLE_GUIDE.md` | Design tokens: colors, type scale, motion, grade-band sizing rules |
| `tests/test_kampus.js` | Playwright suite: 10,800-problem generator fuzz plus end-to-end flows for every screen |

## Testing

```bash
npm install
node tests/test_kampus.js
# In a sandbox with a preinstalled Chromium:
# PW_CHROME=/path/to/chrome node tests/test_kampus.js
```

A clean run reports `FUZZ ISSUES: 0` and `ERRORS: 0`. The suite covers onboarding, a full round with a wrong answer and second-look retry, teach-confirm Kredit halving, focus mode, the session wind-down banner, shop purchases, reward redemption and parent approval, lemonade-stand economics, and a passing grade test.

## How the pieces fit (inside index.html)

- **State** (`S`, key `kampus_v1`) — one localStorage object: Kredits, Tickets, per-grade tiers and stats, owned gear/pets/themes, weekly earn/spend, stand ledger, settings.
- **Curriculum** — ~60 problem generators with step-by-step teach scripts, assembled per grade (3–8) × world × tier in `CURRICULUM`. Four fixed worlds: Fraction Factory, Trade Tycoon, Weather Station, Equation Lab.
- **Adaptive engine** — tiers move up (5 of last 6 right) or down (≤2 of 6) per world, per grade. Higher tiers pay more Kredits.
- **Grade gates** — a 20-question test unlocks the next grade; the home grade strip shows PASSED / CURRENT / LOCKED.
- **Teach economics** — "Teach me" shows one step at a time with read-aloud; taking it halves that question's Kredits.
- **Tickets** — milestone-only real-reward currency (finish runs, pass tests) with a weekly cap and a parent approval queue.
- **My Stand** — a once-a-day lemonade-stand sim: set a price, read the forecast, bank profit ×10 into Kredits.
- **ADHD rules** — untimed by default, focus mode dims everything but the question, one-step teach reveals, no punitive mechanics, second-look retry of missed questions at round end, optional daily session length with a gentle wind-down banner.
- **Grown-ups screen** — placement, accuracy by skill with hints, focus patterns, ticket administration, and settings (session length, focus mode, sound, voice).

## Config knobs parents actually use

All on the Grown-ups screen: reward menu and Ticket prices, weekly Ticket cap, daily session length, focus mode default, read-aloud voice, and full reset.

## Deploying

The app is a single static file — any static host works. For GitHub Pages: Settings → Pages → deploy from `main` branch root, then (optionally) add a `CNAME` file with your custom subdomain and a DNS CNAME record pointing at `<user>.github.io`.
