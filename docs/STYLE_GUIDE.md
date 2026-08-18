# Kampus Style Guide

Design reference for implementing Kampus (kid-facing homeschool math app, grades 3–8) in a production codebase. Everything here reflects the HTML prototype `Kampus.dc.html` as of 2026-08-17. Values are exact — treat them as tokens.

Character: warm paper ground, dark ink, flat candy-toned accents. No gradients, no photos, no heavy shadows — hierarchy comes from type weight, tint fills, and 1px borders. Friendly but not babyish. Built ADHD-first: no question timers, no fail penalties, minimal clutter while a question is live.

---

## 1. Color tokens

### 1.1 Core neutrals
| Token | Value | Use |
| --- | --- | --- |
| `ground` | `#F7F5F1` | App background, nav bar bg, disabled fills, inset rows |
| `surface` | `#FFFFFF` | Cards, buttons, inputs, chips |
| `ink` | `#23252B` | Primary text, solid dark buttons, selected states, current-grade card bg, SVG strokes |
| `ink-hover` | `#3A3D45` | Dark button hover |
| `text-secondary` | `#5D5A52` | Body copy |
| `text-muted` | `#8A8578` | Kickers, captions, meta |
| `text-faint` | `#B5B0A4` | Disabled text, lowercase skill labels |
| `border` | `#E5E2DA` | Default 1px border |
| `border-faint` | `#F1EEE6` | Table/settings row rules |
| `track` | `#ECE9E1` | Progress tracks, empty tier dots, shop frames |
| `track-off` | `#D8D4C9` | Toggle off |
| `fill-hover` | `#EEEBE3` | Nav item hover + active fill |
| `on-ink-muted` | `rgba(255,255,255,.72)` | Secondary text on ink cards |
| `on-ink-track` | `rgba(255,255,255,.22)` | Progress track on ink cards |

### 1.2 Semantic accents
| Role | Base | Hover / deep | Tint | Tint border | Use |
| --- | --- | --- | --- | --- | --- |
| Primary / success (green) | `#58B372` | hover `#4AA263`, deep text `#2E7C46` | `#EAF6EE` | `#58B372` | Primary CTAs, correct answers, owned, focus ring, "earned" bar |
| Kredit / gold | `#E8C94F` | deep `#A8862A`, mid `#D9B96A`, alt `#D9A93F` | `#FBF3E4` | `#E8D9B8` | Kredit coin, tickets, Teach panel + confirm, callouts, tier dots |
| Error / red | `#E4766C` | — | `#FBEDEC` | `#E4766C` | Wrong answers, losses, "spent" bar, destructive |
| Lime | `#D9DE62` | deep text `#5B5E1F`, body `#4A4D1E` | — | — | **Reserved for the lemonade-stand feature card** + "+N% Kredits" tags + progress fill on ink cards |
| Brand orange | `#EE8A55` | deep text `#7C4A1D` | peach `#F4BE93` | — | Logo flag, week chip dot, focus rows, BOSS streak, number-line arc |

### 1.3 World colors
Tints always `color-mix(in oklab, <color> 24%, white)`.
The Kitchen `#F0AFCE` (Ice_cream.svg) · The Store `#F4BE93` (Cash.svg) · The Trip `#5E9FE0` (Rain.svg) · The Build `#8F97DE` (Learning.svg).

### 1.4 Misc palettes
Streak titles: STARTER `#8A8578` · INTERN/LEGEND `#8F97DE` · PRO `#D9A93F` · MANAGER `#58B372` · BOSS `#EE8A55` · CEO `#5E9FE0`.
Confetti: `#8F97DE #F4BE93 #7CBF8B #F0AFCE #5E9FE0 #D9DE62`.
Shop themes: Paper `#F7F5F1`, Peach `#F4BE93`, Midnight `#17181B`, Blossom `#F0AFCE`, Mint `#7CBF8B`.

### 1.5 Rules
- Ground stays paper; cards stay white; one accent per surface. Full-bleed color only on: lemonade-stand card (lime), current-grade card (ink), grade-test callout (gold tint).
- Green = go/correct/yours. Gold = currency/help/celebration. Red = feedback only. Lime = the stand.
- No pure black/gray; all neutrals are warm.

---

## 2. Typography
**Inter Tight** (Google Fonts), 400–900, antialiased. One family everywhere.

| Style | Size / weight | Tracking / leading | Use |
| --- | --- | --- | --- |
| Display | 52–56px / 800 | −0.03em, lh 1.02 | Onboarding hero, end-of-round |
| H1 | 40–46px / 800 | −0.03em, lh 1.05 | Screen titles |
| Question | 46 / 54 / 62px / 800 by grade band (7–8 / 5–6 / 3–4) | −0.02em, lh 1.15, `text-wrap: pretty` | Play question |
| H2 | 30px / 800 | −0.02em | Stand result headline |
| Card title | 21–24px / 800 | −0.02em | World names, feature cards |
| Stat | 26–52px / 800 | lh 1 | Kredit/ticket counts |
| Body | 15–18px / 400–600 | lh 1.45–1.55 | Paragraphs |
| UI label | 13.5–15px / 600–700 | — | Buttons, rows, nav |
| Kicker | 11–12px / 700–800 | +0.14–0.16em UPPERCASE | Section labels |
| Meta | 12–13.5px / 500–600 | — | Captions, hints |

Grade-band scaling (Play): 3–4 → mascot 132px / question 62px / answer 26px, pad 24px; 5–6 → 100/54/22/20; 7–8 → 76/46/20/16.

---

## 3. Layout

### 3.1 App frame — horizontal top nav
One sticky bar (`position: sticky; top: 0; z-index: 10`), background `ground`, 1px bottom border, padding `12px clamp(14px, 2.5vw, 32px)`, `flex-wrap: wrap; row-gap: 6px` as narrow-width fallback:
- **Left**: logo (pennant SVG 26px + "Kampus" 19px/800), margin-right `clamp(8px, 1.5vw, 22px)`.
- **Center** (flex:1 spacers on both sides): nav items — Play, My Stand, Shop, Rewards, Grown-ups. Each: 8px colored dot + label, 14.5px, padding 10px 14px, radius 6px, `white-space: nowrap`; hover/active fill `#EEEBE3`, active weight 800. Dots: Play `#58B372`, My Stand `#D9DE62`, Shop `#8F97DE`, Rewards `#E8C94F`, Grown-ups `#B5B0A4`.
- **Right cluster** (gap 10): week chip (white, orange dot, nowrap), Kredit balance button (white; K-coin icon + count + green 20px "+" disc; opens Shop), avatar chip 36px (white bg, 1px border, r6, 3px padding).
Play / end-of-round / test-result screens hide the nav entirely (full-screen overlays).

### 3.2 Content
Screens center under the bar: `max-width` 1060px (Home, Shop, Grown-ups), 1000px (My Stand), 900px (Rewards), 760px (Test intro); `margin: 0 auto`, padding 30px 32px 48px.
Home grid: `1fr 320px` gap 24. Grade strip `repeat(6, 1fr)` gap 10. World tiles `1fr 1fr` gap 14. Play column max 660px centered.

### 3.3 Spacing / radius / elevation
Base 4px; steps 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32. Radius: 6px small controls/rows · 8px buttons/chips/wells · 10px large cards · 99px dots/toggles/circles. Corners are always rounded — this is not a sharp system. Elevation: only `0 1px 3px rgba(35,37,43,.04)` on white content cards; empty states `1px dashed #E5E2DA`; everything else flat.

---

## 4. Motion
| Name | Spec | Trigger |
| --- | --- | --- |
| Pop | scale .8→1.04→1 + fade, .25–.35s ease | Panel/screen entrances, banners |
| Bounce | jump −18px + squash/stretch, .7s | Mascot on correct |
| Poke | rotate −8°→7°→−3°→0, .5s (two alternating identical keyframes to retrigger) | Mascot tapped |
| Float | rise 44px + fade, 1s ease-out | "+N" Kredit gain |
| Drop | 6 confetti dots scatter + shrink, .8s | Correct answer |
| Chip | scale 1→1.14→1, .5s | Kredit counter on gain |
| Pulse | gold shadow ring 0→9px, 1.2s ∞ | Teach button after 25s idle |
| Draw | stroke-dashoffset→0, .9s ease | Number-line arc in Teach |
Progress bars `width .4s ease`; HUD fade `opacity .3s`; toggle knob `left .2s`. Motion is celebration-only — nothing moves while the kid is thinking except what they poke.

---

## 5. Interaction states
- Hover: outlined controls → ink border; green → `#4AA263`; ink → `#3A3D45`; gold → `brightness(.96)`; ghost text muted → ink.
- Keyboard focus: `outline: 2px solid #58B372; outline-offset: 2px`.
- Selected (segmented/grade picks): ink fill, white text. Disabled/unaffordable: `#B5B0A4` on ground, not-allowed. Locked: 45% opacity.
- Answer feedback: correct = `#EAF6EE` + `#58B372` border; wrong pick = `#FBEDEC` + `#E4766C` border with correct simultaneously green.
- Keyboard: 1–4 answer (choice mode only), Enter advances after wrong.

---

## 6. Kredit economy (display rules)
- Currency is **Kredits** (branded "Kampus Kredit"); icon = gold coin with 800-weight "K" in `#A8862A`. Real-world rewards are **tickets** (gold notched-rect icon), parent-approved, 10/week cap, 1 ≈ 50¢.
- Gain per correct: `round((8 + 4·tier) × streakMult × (1 + gearBonus%))`; streakMult ×1.5 at 3, ×2 at 6, ×3 at 10. Format ≥1000 as `1.2k`.
- **Teach costs half.** Button reads "Teach me · costs half". First tap opens a gold confirm: *"Help costs half a Kredit. Thinking is free. Solo this pays ~N, with help ~M."* — dark **"I'll try first"** is the primary, outlined gold "Teach me anyway" secondary. Confirming halves that question's payout (ceil) and dims the question to 45% while open.
- **Kredits this week card** (Home right rail): stacked horizontal bar on `#ECE9E1` — green `#58B372` earned segment vs red `#E4766C` spent segment (spent = forgone Teach halves + shop purchases); legend `+N earned` (green deep) / `−M spent` (red); hint line: "Your week starts here." / "All brain, no help. Clean." / "Spent = help + shop. Thinking is free." / "Help and shopping are eating your Kredits."

---

## 7. Iconography
Inline SVG, 24 viewBox at 14–18px, 1.8–2px `#23252B` strokes, round caps/joins, flat accent fills. Kredit coin (see §6), ticket, pennant logo (ink pole + `#EE8A55` flag), bulb (Teach), speaker (Read it), check `#58B372` 3px, padlock `#8A8578`, ✕ close. No emoji in chrome (shop pets/themes are the only emoji surface).

---

## 8. Illustration set ("blobs")
Flat vector characters — rounded blob people doing activities; corals/golds/blues/greens with ink details; transparent background. Render via `<img>`, `object-fit: contain`. Never recolor, crop, or outline.

**Usage:** one blob per surface, always paired with text. Sizes: onboarding hero 150–170px; screen headers 82px; Play mascot 76–132px (grade band, pokeable); cards 54–96px; empty states 60–80px at 80–85% opacity. Blobs overhang the text block's left edge by −6 to −18px.

**Role assignments:** avatars `Thinker, Magic, Skating, Explore` · world mascots `Ice_cream, Cash, Rain, Learning` · celebration `Party`, test pass `Winner` · tickets `Savings` · stand `Startup` · shop `Shopping` · Grown-ups `Analytics` · test intro `Target` · empty states `Timer` (nothing pending), `Coffee` (no runs), `Vision` (no stand result).

**Full inventory (80, for future screens):** Access, Accounting, Analytics, Artboard, Attract, Badminton, Basketball, Bill, Bowling, Boxing, Card, Cash, Coach, Coffee, Cyclist, Discount, Drone, Eating, Emailing, Explore, Finance, Finance-1, Football, Fortune, Gardening, Golf, Growth, Hunting, Hydration, Ice_cream, Idea, Investment, Investor, Invoice, Invoice-1, Jumping, Kettlebell, Laptop, Learning, Lifter, Love, Magic, Marketing, Networking, Note, Painting, Party, Passive, Photography, Ping-pong, Pitch, Plants, Play, Pull-up, Rain, Runner, Savings, Savings-1, Security, Selfie, Settings, Shopping, Singing, Skating, Startup, Strategy, Surfing, Swimmer, Talk, Target, Tasks, Thinker, Timer, Transfer, Vault, Vision, Volleyball, Winner, Work, Writing. Pick semantically (`Idea` hints, `Coach` parent tips, `Growth` progress).

---

## 9. Voice & copy
Short, lowercase-leaning kickers, mildly slangy, never cringe: "Bet", "Run it back", "Lock in", "Profit. W.", "Comeback. Respect.", "Not yet. No stress.", "Thinking is free." Failure is always cost-free and said so. Numbers concrete ("16 to pass", "1 ticket ≈ 50¢"). Parent-facing copy (Grown-ups) is plain adult prose, no slang.

---

## 10. ADHD-first design rules (binding)
1. **Never time a question.** Only timer: optional grown-up-set session length (Off/10/15/20 min) → quiet "N min left" chip in Play; at zero a gentle non-blocking gold banner: "That's your math for today. Finish this one, then go move around." + "Done for now".
2. **Focus mode** (default on, Grown-ups toggle): Kredit chip + streak line fade to 0 while a question is live; return on correct.
3. **Hands-on first (CRA):** number-line questions answer by tapping the tick where you land (START marked blue, wrong tap red, correct green); Teach always shows the representational visual (fraction bar / animated number-line arc).
4. **Fidget outlet:** pokeable mascot; celebration per answer.
5. **Low stakes:** wrong costs nothing, resets streak only, and returns once at round end as "second look"; end screen celebrates comebacks ("Comeback. Respect.") and fixes ("Fixed N from earlier…").
6. **Small commitments:** Quick 6 rounds beside the standard 12 (no ticket eligibility).
7. **Think-first economics:** the Teach confirm (§6) makes not-thinking visibly expensive; the weekly earned/spent bar reinforces it.

---

## 11. Onboarding flows
Shared skeleton: full-screen `ground` overlay, centered left-aligned column (max 520px, 92vw), Pop entrance per step, kicker step counter, no back buttons, no text entry.

### 11.1 Student (3 steps — built)
**0 Welcome:** `Party.svg` 170px · kicker "KAMPUS · THE CAMPUS OF LIFE" · 52px "Hey. This is Kampus." · body: "Real-life math — money, deals, temperatures, plans. Earn Kampus Kredits, cash them in for real rewards. No timers unless you want one." · primary **"Bet"**.
**1 Grade:** kicker "STEP 1 OF 2" · "What grade?" · "A grown-up can change this later. No test to get in." · 70×70 buttons 3–8 (selected ink/white); pick advances.
**2 Avatar:** kicker "STEP 2 OF 2" · "Pick your blob." · "Pets you buy later can take over this job." · 104×104 blob buttons (selected gold tint + `#E8C94F` border) · **"Let's go"** → Home.

### 11.2 Parent (4 steps — spec, to build)
Entry: first tap on Grown-ups nav item. Adult tone, body 16px.
**0 What this is:** `Coach.svg` 150px · kicker "GROWN-UPS SETUP · 2 MINUTES" · 48px "Your kid plays. You steer." · body: "Kampus is self-paced math with a real-world reward loop. Kredits are in-game; tickets are real — you hand them out. Nothing here is visible to your kid." · primary **"Set it up"** · ghost "Later" (defaults apply).
**1 Placement:** kicker "STEP 1 OF 3" · "Confirm the grade." · "They picked grade N. Grades level up by test — 20 questions, 16 to pass, failing costs nothing." · 52×52 grade buttons · **"Looks right"**.
**2 Pace:** "Set the pace." · white card rows: Session length segmented Off/10m/15m/20m ("Times the session, never the kid — a gentle wind-down, no cutoffs.") + Focus mode toggle, default on ("Hides Kredits and streak while a question is up.") · **"Next"**.
**3 Rewards:** "Set the reward menu." · "Tickets cap at 10 a week. Rule of thumb: 1 ticket ≈ 50¢." · editable rows (30 min screen time · 3, Pick the movie · 4, $5 treat / 500 Kredits · 10) with steppers · **"Done — hand it back"** → Grown-ups dashboard.
Rules: never kid slang; every step states its default so "Later" is safe; redemptions always need parent approval.
