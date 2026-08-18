# Handoff: Kampus — homeschool math app

## Overview
Kampus is a kid-facing math practice app (grades 3–8) with a real-life-math framing: money, deals, temperatures, plans. Kids answer multiple-choice questions in themed "worlds", earn Kredits on a streak multiplier, spend Kredits in a shop, earn parent-managed reward tickets, run a simulated lemonade stand, and level up grades by passing a 20-question grade test. A separate "Grown-ups" area handles placement, progress analytics, and ticket approvals.

## About the Design Files
The files in this bundle are **design references created in HTML** — an interactive prototype showing intended look and behavior, not production code to ship. The task is to **recreate these designs in the target codebase's environment** (React, Vue, SwiftUI, native, etc.) using its established patterns — or, if no codebase exists yet, choose the most appropriate framework and implement the designs there. Open `Kampus.dc.html` in a browser to interact with the full prototype.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final intent. Recreate pixel-perfectly using the codebase's component library. All exact values are in `STYLE_GUIDE.md` and `ASSETS.md`.

## Screens / Views

### 1. Onboarding (3 steps, full-screen overlay)
- Centered column, 520px max width, left-aligned text, `mmPop` entrance.
- Step 0 — Welcome: Party blob illustration (170px), kicker "KAMPUS · THE CAMPUS OF LIFE", 52px display "Hey. This is Kampus.", body paragraph, primary button "Bet".
- Step 1 — Grade pick: 70×70px grade buttons (3–8), selected = ink fill/white text. Picking advances.
- Step 2 — Avatar pick: 104×104px blob buttons (Thinker, Magic, Skating, Explore); selected = gold tint bg + gold border. "Let's go" finishes.

### 2. Home
- Layout: horizontal sticky top nav (brand left, centered nav items, week/Kredit/avatar cluster right) + centered main (max 1060px, 30/32px padding).
- Headline (46px): weekly coin earnings, or "Nothing earned yet. Lock in."
- **Grade strip**: 6-column grid of grade cards (3–8). Each shows grade number, status mark (green check = passed / none = current / padlock = locked), status label (PASSED / CURRENT / LOCKED), a 5px progress bar (passed = 100% green; current = tier progress, ink fill on translucent track; locked = empty), and a detail line ("test passed" / "test ready" or "N/4 worlds ready" / "after grade N−1"). Current card has dark ink `#23252B` background with lime progress bar (lime fill is reserved for the lemonade-stand card); locked cards at 45% opacity.
- **Jump back in** card: last world blob (84px), world name (24px/800), "Tier N · skill", green PLAY button with a speech-bubble tail (CSS `::after` triangle).
- **World tiles**: 2×2 grid. White card, tinted image well (`color-mix(in oklab, worldColor 24%, white)`, 150px tall) with a white chip ("01 · TIER 2") and centered 96px blob; below: world name 21px/800, three 9px tier dots (gold = earned), lowercase skill label.
- **Grade test callout** (gold tint): Winner blob, "Grade N test unlocked", requirements line, outlined "See the test" button.
- Right rail (320px): tickets/piggy card (count, weekly line, gold progress bar to next reward, "Rewards →"), Lemonade stand card ("Open →"), Recent runs list (color dot, world, score/Kredits meta) with empty state (Coffee blob).

### 3. Play (full-screen, chrome hidden)
- Top bar: ✕ quit, slim progress bar tinted world color, coin chip (pulses `mmChip` on gain).
- Center column (max 660px): world blob mascot (size varies by grade band: 132/100/76px; `mmBounce` on correct; "+N" coin float `mmFloat` and 6 colored confetti dots `mmDrop`), streak line "BOSS · 8 STREAK · ×2" colored by streak level, "N more to X" subline, world chip, question text (62/54/46px by band), helper buttons "Teach me · ½ Kredits" (gold tint; pulses `mmPulse` after 25s idle) and "Read it" (speech synthesis).
- **Teach panel** (gold tint): numbered steps revealed one at a time (previous steps dim to 45% / scale .92), optional SVG visual (fraction bar or number line with animated arc, `mmDraw` .9s), "Next step" + "Got it, close". Opening halves the round's future coin gains; question/answers dim to 45% while open.
- Answers: 2×2 grid of white choice buttons. Correct = green tint bg + green border; wrong pick = red tint + red border with the correct one highlighted green. Wrong shows a banner "Not this one — it's actually X" + "Next →" (Enter also advances). Keys 1–4 answer.

### 4. End of round (full-screen)
- Blob (Party if ≥80% accuracy, else world blob), 56px headline ("Clean run. W." / "On fire." / "Round done."), 3 stat cards (Kredits earned / accuracy / best combo), optional "+1 ticket" gold banner for sharp rounds (≥80%), buttons "Run it back" (primary) + "Home".

### 5. Grade test intro
- Target blob, "Grade N test" 44px, explainer paragraph (20 questions, 16 to pass, no hints, failing costs nothing), 4 tinted world cards with tier badges, "Start the test" primary + "+3 tickets if you pass".

### 6. Grade test result (full-screen)
- Pass: Winner blob, "Grade N unlocked.", body with score, "See new worlds". Fail: Thinker blob, "Not yet. No stress.", practice guidance, "Run it back". Both offer "Home".

### 7. Shop
- Header with Shopping blob. 3 tab pills (Upgrades / Pets / Themes). 3-column grid of framed item cards: frame = green if owned, else neutral; inner white card with icon, tag pill ("+20% COINS" lime / "THEME" pink), name, price button (ink = affordable, muted = not, green tint "Owned").

### 8. Rewards
- Left: big ticket count card with gold progress bar + "how to earn" fee table (5 rules). Right: "spend on" redeem list (gold Redeem when affordable), "waiting for grown-up" pending list (gold tint rows) with Timer-blob empty state.

### 9. My Stand (lemonade business)
- Left card: price-per-cup segmented pick ($1/$2/$3), cups-to-make pick (10/20/30), forecast line with dot (Sunny gold / Cloudy gray), "Open the stand" primary.
- Right: results card — headline ("Profit. W." / "Broke even." / "Lost money. Happens."), ledger rows (sold, demand, revenue, cost, profit ± colored), "the math" numbered breakdown (gold tint), "Bank it · +N Kredits" (gold button, profit ×10) and "Tweak and retry". Empty state: Vision blob.

### 10. Grown-ups
- Two columns. Left: grade placement buttons (52px), accuracy bars per world (tinted by world color), suggested focus rows (skills <70% acc with ≥6 tries), skills table (skill / tries / hints / acc; acc <70% in red). Right: ticket admin (balance, weekly cap 10, redemption approvals with "✓ Given" / "Refund", reward menu with costs, "1 ticket ≈ 50¢"), recent rounds, settings (sound toggle, read-aloud voice preview, destructive full reset). Footer link "← Back to the kid side".

## Interactions & Behavior
- Navigation: sidebar (Play / My Stand / Shop / Rewards / Grown-ups) with colored dot per item; active = `#EEEBE3` fill, weight 800. Play/end/test-result screens hide all chrome.
- Kredits: gain = round((8 + 4·tier) × streakMultiplier × (1 + gearBonus%)); halved (ceil) if Teach was opened that question. Streak multiplier: ×1.5 at 3, ×2 at 6, ×3 at 10. Streak titles: STARTER/INTERN(2)/PRO(4)/MANAGER(6)/BOSS(8)/CEO(10)/LEGEND(13).
- Correct answer: 1s celebration (bounce, float, confetti, chip pop) then auto-advance. Wrong: streak resets, banner + manual advance.
- Rounds: 12 questions per world round; sharp round (≥80%) = +1 ticket. Grade test: 20 questions across all worlds, 16 to pass → grade +1, +3 tickets.
- Shop: buying deducts Kredits; gear bonus = highest owned gear + sum of pets.
- Rewards: redeeming moves tickets into a "waiting" queue; a grown-up marks Given or Refunds (tickets returned).
- Lemonade stand: demand = base{$1:36, $2:22, $3:12} × (Sunny 1.2 / Cloudy 0.8); sold = min(made, demand); cost = made × $0.50; banking profit pays profit×10 Kredits, once.
- Idle nudge: after 25s without input mid-question, the Teach button pulses.
- Keyboard: 1–4 pick answers, Enter advances after a wrong answer.
- Read-aloud: SpeechSynthesis, prefers "Natural"/"Google US"/"Samantha" voices; "−" read as "negative".
- All state persists (prototype uses localStorage key `mm-proto-v2`; production should use real persistence). In-flight rounds are not persisted — reload returns Home.

## State Management
- Profile: grade (3–8), avatar, onboarded flag.
- Economy: gems (Kredits), tickets, weekTickets (cap 10), weekGems, playDays.
- Ownership: gearOwned[], petsOwned[], themesOwned[].
- Progress: tiers per world (1–3), lastWorld, rounds history (last 5), testResult.
- Round (transient): worldIdx, test flag, qNum, total, correct, streak, best, gems, question order; feedback ('correct'|'wrong'), picked index, teachOpen/teachStep, halved flag, nudge flag.
- Redemptions: [{name, cost, status: 'waiting'|'given'}].
- Business: {price, made, forecast, result:{sold, demand, revenue, cost, profit, banked}}.
- Settings: sound.

## Design Tokens
See `STYLE_GUIDE.md` for the full palette, type scale, spacing, radii, shadows, and motion specs.

## Assets
- `blobs/*.svg` — character/illustration set (flat vector "blob" characters). Used ones are bundled; the full set lives in the source project. Key roles: Thinker/Magic/Skating/Explore = avatars; Ice_cream/Cash/Rain/Learning = world mascots; Party = celebration; Winner = test pass; Target = test intro; Savings = tickets; Startup = lemonade stand; Shopping = shop; Analytics = grown-ups; Timer/Coffee/Vision = empty states.
- Icons: small inline SVGs (coin, ticket, bulb, speaker, checkmark, padlock, logo flag) — 1.8–2px ink strokes with flat accent fills; specs in ASSETS.md.
- Font: Inter Tight (Google Fonts), weights 400–900.

## Files
- `Kampus.dc.html` — the full interactive prototype (all 10 screens; open in a browser).
- `support.js` — prototype runtime (required by the HTML; not part of the design).
- `blobs/` — illustration assets.
- `STYLE_GUIDE.md` — full token sheet, layout system, Kredit economy, ADHD rules, onboarding flow specs.
- `ASSETS.md` — complete illustration inventory (all 80 blobs, bundled in blobs/) and the inline-SVG icon set with usage rules.
