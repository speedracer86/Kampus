# Math Miner — Full Project Brief
*Complete context document, v1 · August 2026. Written so a designer (or design tool) can pick this up cold.*

---

## 1 · What this is

**Math Miner** is a math-practice game for homeschooled kids in grades 3–8, designed ADHD-first. It began as a custom tool for one specific user — the builder's 13-year-old stepdaughter, who has severe ADHD and is homeschooled by her stepmom — and may later open to other homeschool families (pilot: 5–10 families from the family's homeschool network; success gate = strangers' kids still playing voluntarily in week 3).

It is currently a **single self-contained HTML file** (~150KB, no backend, no network needed after load): runs in any browser, saves progress to localStorage per device, uses the browser's Web Speech API for read-aloud. Illustrations are embedded SVGs. Planned deployment: static hosting (Netlify/Vercel) for the pilot; accounts/sync only if cross-device becomes a felt need (COPPA applies the moment other kids use it — parent-owned accounts, no child PII).

## 2 · The learner

- 13-year-old girl, severe ADHD, homeschooled. Plays Roblox; fluent in simulator-game economies (earn → buy boosts → earn faster).
- ADHD implications built in: steep delayed-reward discounting (needs immediate feedback + token economy), distractibility (needs minimal screens), time-pressure anxiety (untimed by default), needs chunked instruction and effort-based (not perfection-based) rewards.
- Younger/older siblings possible later → grade-adaptive design bands (see §8).

## 3 · Core loop

1. Pick a **world** (topic) → answer multiple-choice math problems one at a time.
2. Each correct answer: her world's **blob mascot bounces and bursts pastel droplets** (the "mining" moment), floating `+N` gem gain, streak builds.
3. **Streaks** upgrade a label (STONE → AMETHYST → TOPAZ → EMERALD → RUBY → DIAMOND → RAINBOW at 0/2/4/6/8/10/13) and multiply gems: 3-streak ×1.5, 6 ×2, 10 ×3. One wrong answer resets streak; the right answer is shown, no other penalty.
4. Round ends (Chill: 12 questions; Blitz: 90 seconds) → end screen with gems mined, accuracy, best combo, dry-voiced headline ("clean run." / "on fire." / "round done.").
5. Gems buy **gear, pets, themes** in the shop (permanent % boosts to future gem earnings — the simulator-economy hook).

**Modes:** Chill (default — no clock, progress bar fills per question) and Blitz (opt-in, 90s, color-shift warning only, no ticking sounds ever).

## 4 · Learning system

- **6 grades (3–8), each with 4 worlds** (topic slots, renamed per grade):
  - *frac slot*: Fraction Factory (all grades) — fractions → decimals → percents by grade
  - *ratio slot*: Trade Tycoon (3–7) / Slope City (8) — facts & money → ratios/percents → proportions/percent change → slope
  - *int slot*: Number Mine (3–4, multi-digit arithmetic) / Decimal Depths (5) / Frozen Obby (6–7, negative numbers) / Power Plant (8, exponents/roots/scientific notation)
  - *alg slot*: Puzzle Lab (3–4, mystery numbers & patterns) / Equation Lab (5–8, order of operations → one/two-step equations → x on both sides)
- **3 difficulty tiers per world**, auto-adaptive: 5 of last 6 right → tier up (toast + ticket); ≤2 of 6 → silent tier down. 20% of problems sample one tier down ("easy wins").
- **~60 problem generators**, each producing: question, 4 choices with error-pattern distractors (never equal in value to the answer), a skill tag, and **teach steps**.
- **Teach me** (💡): pauses the clock, keeps the streak, halves that question's gems, reveals **one step at a time** (prior steps shrink/dim), first step always states the strategy. Steps include **CRA representational visuals**: number lines with jump arrows (integers), fraction bars (comparing/adding/equivalence). **Read-aloud** (🔊) on both question and steps — browser TTS, auto-picks the best voice (Edge "Natural" > Google > Apple Enhanced), voice picker in parent settings. Hints don't count toward tier changes; hint counts per skill are tracked for the parent.
- **Focus dimming:** when the teach panel opens, answers and mascot drop to ~45% opacity.
- **Idle nudge:** 25s without input → Teach-me button pulses + gentle toast.
- **Grade progression:** grades above her top one are **locked**. Reaching Tier 2 in all 4 worlds unlocks the **Grade Test**: 20 questions across all topics at tier 2–3, no hints (read-aloud allowed as accommodation), 16/20 to pass. Pass → trophy, next grade unlocks + becomes current, +3 bonus tickets. Fail → zero penalty, names the weak worlds ("practice Frozen Obby & Equation Lab, then run it back"), retry button. Parent can place/skip any grade from the dashboard.

## 5 · Economy (two currencies, deliberately separated)

- **💎 Gems** — earned per correct answer (base 8 + 4×tier, × streak multiplier × gear bonus). Spent in the **shop**: Gear (Starter Pick → Quantum Drill, +10%…+75% gems), Pets (emoji companions, +5%…+30% gems, cheer on combos, become her avatar), Themes (Paper free · Peach 300 · **Midnight dark mode 800** · Blossom 1200 · Mint 2000). Purely virtual.
- **🎟️ Tickets** — real-world reward currency, earned **only from effort milestones**, never per answer (grind-proof): daily session (10+ answers, 60%+) +1 · sharp round (12+, 80%+) +1 · tier-up +1 (max 2/day) · 5 play-days in a week +3 · grade test pass +3 (bypasses cap). Weekly cap default 10 (parent-set). Tier-up & sharp-round tickets only count at her **top grade** (no easy-grade farming).
- **Piggy bank** (Savings blob illustration): shows ticket balance + progress bar to the next affordable reward ("3 more to '$5 treat'"). Lives on the Rewards screen and (desktop) the home screen.
- **Redemption:** kid taps Redeem → "waiting for grown-up" → parent marks ✓ Given or refunds. Parent defines the reward menu (defaults: 30 min screen time 3🎟️ · pick the movie 4🎟️ · $5 treat/Robux 10🎟️). Rule of thumb: 1 ticket ≈ 50¢.

## 6 · Parent ("Grown-ups") dashboard

Reached via a quiet link; not PIN-gated. Contains: grade placement buttons (with pass/test history per grade) · per-topic accuracy bars for the current grade + tier levels · "Suggested focus" (skills <70% with 6+ attempts, hint-leaning skills flagged) · full skill table (tries, hints, accuracy) · recent rounds log · ticket admin (balance, weekly cap input, reward menu editor, redemption approvals, earnings ledger) · sound toggle, read-aloud voice picker with preview, full reset.

## 7 · Design system (style guide v5 exists as separate artifact)

**Palette** — warm paper `#F7F5F1`, white surfaces, ink `#23252B`, line `#E5E2DA`; pastels: periwinkle `#8F97DE`, peach `#F4BE93`, sage `#7CBF8B`, sky `#5E9FE0`, pink `#F0AFCE`, coral `#EE8A55`, citron `#D9DE62`; semantic: success `#58B372`, error `#E4766C` (errors only), reward gold `#E8C94F`; teach-panel cream `#FBF3E4`. **Midnight dark theme** flips neutrals (`#17181B` bg, `#232527` surfaces), pastels stay.

**Type** — Inter Tight w/ system fallback. Big tight editorial headlines (staccato, lowercase in celebrations), plain body, tiny uppercase letterspaced micro-labels for wayfinding. Hierarchy from type, never boxes.

**Illustration** — user-supplied blob character SVG pack (80 files, ~3KB each, black linework + flat pastel fills; **license unverified — check before public release**). Cast: Ice cream = Fraction Factory · Cash = Trade Tycoon · Jumping = Frozen Obby · Learning = Equation Lab · Thinker = default avatar · Savings = piggy bank · Winner = test pass · Party = celebrations · Analytics = parent · Shopping = shop. The world blob is the thing she "mines."

**Components** — flat cards (no glass), 16–20px radius, 1px lines, soft shadows · dot-chips (status dot + label) · speech-bubble green PLAY button (tail) · dashed **route path** with circular grade nodes (sage=passed, ink=current, dimmed lock=locked) · flooded pastel card thumbs with corner chip ("01 · TIER 2") · tinted frame cards for tiers (colored frame + white nested card + pastel skill tags) · soft pill list rows with trailing meta · outlined gold step-number circles · drawn SVG marks instead of emoji in all chrome (lock, gem diamond, bulb, speaker) · grade hero module (grades as completion cards: white passed / flooded current / dimmed locked) · sidebar level-up CTA card (peach, mirrors grade-test state) · piggy widget.

**Layout** — Mobile (<1000px): single column, max 520px; topbar (avatar, wordmark, streak chip, gem chip with green "+" that opens shop); route path; "jump back in" card; 2×2 world tiles; test card; shop/rewards buttons. Desktop (≥1000px): labeled **sidebar** (Play/Shop/Rewards/Grown-ups + level-up CTA bottom-left), **grade hero module** replaces route path, home piggy widget. Play screen both sizes: close ✕, progress bar, gem chip / blob mascot + streak label / dot-chip prompt + big equation / teach-me & read-it chips / cream teach panel / 2×2 answers.

## 8 · ADHD rules (binding) & voice

**Rules:** untimed by default; one primary action per screen; focus dimming; one teach step at a time; progress always visibly filling; reward effort never perfection; no punitive mechanics; purposeful motion only (nothing loops while she thinks); CRA visuals in teaching; no ticking/rush sounds; 25s-idle re-engagement nudge.

**Voice (Gen Z calibrated):** understated > enthusiastic. Lowercase celebration copy ("clean run. 12 for 12." / "tier 3 unlocked" / "run it back"), buttons ≤4 words, max one exclamation per screen, wrong-answer copy neutral & useful ("not this one — look:"), **never** forced slang, never "GREAT JOB!!!", never anything a teacher would put on a poster. Enthusiasm is expressed by the blob and animation, not punctuation.

**Grade-adaptive bands** (body class, driven by parent's grade setting): 3–4 "big & warm" (type +20%, mascot 120px, bigger buttons) · 5–6 baseline · 7–8 "tighter & cooler" (type −10%, mascot 72px, Midnight theme is the expected choice, drier copy, her own stats surfaced).

## 9 · Current state & next steps

**Built and tested** (14,400-problem fuzz suite + full E2E flows pass): everything above is live in `math_miner.html` v10. Style guide v5 is its own artifact.
**Next:** show the daughter (the real test) → static deploy for pilot → verify illustration license → possible later: typed-answer mode, per-concept manipulatives, accounts/sync (COPPA-aware), Figma component library.

**Open questions for design work:** app icon/logotype; mascot poses for celebration moments (current SVGs are single-pose); empty states; onboarding (first-run) flow; sound design beyond current synth beeps.
