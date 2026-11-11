# Kampus Style Guide

Design reference for implementing Kampus (kid-facing homeschool math app, grades 3–8) in a production codebase. Updated 2026-10-20 (Rewards → real dollars, receipt, store wishlist). Earlier update 2026-10-19: the locked look is **Home Grade Stack.dc.html → 3b**. Where §0 conflicts with later sections, §0 wins. Values are exact — treat them as tokens.

Character: cool blue-grey ground, one white sheet, dark ink, flat candy-toned accents. No gradients, no photos, no dashed borders — hierarchy comes from type weight, light display numerals, tint fills and thin rules.

---

## 0. Locked direction (3b, 2026-10-19)

**Ground & surfaces**
- Ground `#F5F7F9` (blue-grey). Nav sits on ground with a `1.5px solid rgba(35,37,43,.12)` bottom rule.
- One white sheet per screen (`#FFFFFF`, radius 28px, no shadow, no border). No cards nested inside it — sections inside are split by `1px solid #EEECE7` rules.
- Text on ground: ink `#23252B`; muted = `rgba(35,37,43,.55)`.

**Shape**
- Pills (999px) for nav items, chips, segmented options, CTAs. Round 52–68px play buttons on mission rows.
- Radius 28 sheet · grade cards 20px top corners only (square bottoms) · 16 day cells.
- Never dashed outlines. Locked/disabled = solid `#E6EAEE` fill, text `rgba(35,37,43,.45)`.

**Type** (Inter Tight)
- Display numerals: weight 300, `letter-spacing:-.045em`, tabular — balances (64px), percentages (64px), grade numbers (44px), day dates (30px).
- Greeting sentence: 32px/600, muted with the key values in ink. Break into two lines max.
- Kickers: 11px/800, `.16em`, uppercase.

**Desktop Home layout (1280)**
- Grid `340px | 1fr`, column-gap 48, page padding 48.
- Left column: row 1 = short greeting on ground, 28px/600, line-height 1.32, tracking −.025em: "Hi Talia, you have two quests & one mission open." (numbers spelled out, ampersand, values in ink, rest muted), 2 lines, bottom-aligned with the stat block; row 2 = grade stack floating on ground, grade 8 fading into ground over 48px.
- Right column: row 1 = two stats on ground split by a 1.5px `rgba(35,37,43,.14)` vertical rule: "Bank" / `$1,240` (ink) and "Kredits this week" / `+$356` — green `#2E7C46` when up, red `#C2463B` with `−$` when down. Labels are white pills (12.5px/700, padding 5/11) above 44px/300 numerals (block height matches the 2-line greeting)) + white Today/Week pill switch at right; row 2 = white sheet (the only white surface). Today view: day strip → readiness → missions → lemonade band. Week view: month header with ink ←/→ discs, 7-column calendar of run cards (`#F5F7F9` fill, world chip, green pay), today's slot is an ink "+ Next run" tile; lemonade band stays.

**Kredits**: always shown with `$` (`$1,240`, `+$356`).

**Grade stack**
- Overlapping bands (`margin-top:-14px`, edge treatment: `inset 0 .75px 0 rgba(255,255,255,.55)` top highlight + `0 -.5px 0 rgba(35,37,43,.10)` hairline + `0 -6px 16px rgba(35,37,43,.06)` shadow between cards. On the gold Teach card the highlight drops to `.5px rgba(255,255,255,.4)`. Top card has the highlight only; no shadow around the stack as a whole. Bottom card is fully rounded (20px).). Passed = one purple ramp that deepens per grade (3→6: `#C7B8F0 #B3A0EA #9E87E2 #8A6FD9`, no pale tints), building toward the graduated purple `#6E4FCC` reserved for finishing grade 8, current = ink with lime progress dots, locked = `#E6EAEE`.
- Hover/click a passed grade: its padding grows (`30px 20px 28px`, `.25s cubic-bezier(.32,.72,.33,1)`), pushing cards below down, and reveals "Final grade A" + ink "+$212" chips.

**Missions**: one world chip + plain meta line (`6 questions · ~54 Kredits`), title 20px/600, ink round Play button. Length options as pills (selected ink).

**Lemonade stand**: full-width lime `#D9DE62` band at the foot of the sheet, `Startup.svg` 48px, ink pill CTA "Open the stand →".

**Avatar**: 38px circle, world-color fill with ink initial (no blob illustration in the nav).

**Cut on purpose**: stats rows, inline icons in sentences, side rails, multiple chips per row, Untimed/Blitz switch on Home.

**Mission flow** (Mission & Grade.dc.html → 5a/5b)
- Top bar: Exit pill · three phase groups (Lesson 3 segs, Questions 6 segs, Results 1) — done green `#58B372`, current ink, todo `#E6EAEE` · "Focus mode on". No Kredits shown until Results.
- Lesson (2–3 min, 5 steps: Big idea → Shade it → Split the bill → Spot the mistake → Try it): left = "Cheat sheet" (lesson kicker reads "Kampus Class · 2–3 min"): a vertical step list (step titles 20px/700, 24px dots joined by a 1.5px line — done green ✓, current ink ring, upcoming 22% ink outline). Each solved step writes its takeaway as a 17px/400 note line (e.g. "10% → move the decimal one place left. $48 → $4.80"), so the column ends as a 5-line cheat sheet; tap a done row to revisit; right = sheet with 36px/600 prompt, a "Read it to me" pill (speech synthesis) above it on ground, Back / Next footer. Step 2 is a 20-block tap-to-shade bar (5% each; ink while under, green `#58B372` when exact, red `#E4766C` blocks + `#C2463B` readout when over). Split the bill: tap the $48 note to split into 10 green $4.80 discs, cut one into two $2.40 halves, tap discs to collect exactly 15% (selected ink; green when right, red when over). Spot the mistake: three lines of a friend's worked answer, tap the wrong one (green "Found it" / red "Checks out"). Each step gates Next until solved. Try it is an unpaid check gating "Start the mission →".
- Questions: help stack (Read it to me · Hint · Show me free, Teach me gold "costs half" with confirm) left; question 40px/600 + 2×2 answers (light 34px numerals, numbered key discs) right. Correct = `#EAF6EE` + `#58B372` border, wrong = `#FBEDEC` + `#E4766C`.
- Results: headline 40px/700 ("Clean run. No help." / "Profit. W." / "Comeback. Respect."); left result bands (Kredits earned green tint, First tries purple, Grade test ink); right sheet lists each question with ✓ first try or ↺ fixed it + pay; CTAs Run it back (ground) · Back to Today (ink).

**Grade page** (superseded by 6e report card, see Brief v4 retrofit below; 5c/5d kept for reference) — reached from the Grades nav item or a grade card
- Row 1 left: 120px light grade numeral + "Grade" kicker + status pill (In progress = ink, Passed = green tint). Row 1 right: "All grades" picker discs (passed = their purple, current white, locked `#E6EAEE`).
- Left stack in the purple ramp (`#DCD2F6 #C7B8F0 #B3A0EA #9E87E2`): current → Test readiness + disabled "Take the test · N runs to go", Kredits so far, Worlds unlocked, Trophy (dimmed). Passed → Test score + date, Final grade letter + $ earned, Worlds, Trophy + "View certificate".
- Right sheet: Skills (name, sub, 8px progress bar, n/10; complete = green) then Run history rows (date · title · world chip · score · green pay).

**My Stand** (My Stand.dc.html → 6a/6b)
- Row 1: left = Startup blob 64px + "Your business" kicker + "Talia's Lemonade" 28px/600; right = Bank and "Stand this week" stats (white pill labels, 44px/300, green for gains).
- Left: a weather card whose fill follows the condition (sunny `#F4A866`, partly cloudy `#9DC4EC`, rain `#AEB9C7`), with soft translucent CSS sun/cloud/rain shapes bleeding off the top-right, a 120px/300 temperature, 20px/600 condition, a one-line foot-traffic note, and a 4-day row (dow, color dot, temp). Tapping a day re-plans for it and changes likely buyers. Below: plain fact rows on ground split by 1.5px rules (Supplies 30¢, Yesterday +$34 green), 36px/300 values right-aligned. No tonal ramps of one color on stacked cards.
- Sheet (plan): price pills $0.75–$2.00 (selected ink), cups stepper (round ground buttons, 56px numeral), 3-column live estimate (buyers, sold, est. profit green/red), lime footer band with a plain-language tip + ink "Open for the day →".
- Sheet (result): headline 34px/700 + 72px profit numeral, ledger rows (sold, sales, supplies in red, leftovers), lime band: "$X profit × 10 = +$Y to your Bank" + one-line lesson + "Try another price".

**Rewards** (Rewards.dc.html → **9a**, locked 2026-10-20; component: `react/rewards.jsx`)
- Currency is **real dollars**, stored as integer cents, always shown with two decimals (`$4.50`, `$2.00`, never `$2`). Weekly earning cap **$5.00**. Earn: sharp round +$0.50, pass a grade test +$1.50, five-day streak +$0.50. Tickets are retired.
- Layout: grid `340px | 1fr`, gap 48, page padding 36/48. No greeting on ground; the headline lives inside the sheet.
- **Left = receipt** (kids learn to read a real one). White paper, square corners, no shadow, 10px zigzag bottom edge (two 135°/225° linear-gradients, 14px period). Set in **IBM Plex Mono** 13px/1.45 (the only non-Inter Tight surface). Order: centered header ("KAMPUS BANK" 15/700 +.14em · "Tom's money · receipt #0042" · date/time muted) → 1.5px dashed 30% ink rule → EARNED THIS WEEK (11.5/700 +.08em) lines `day · desc · +$x`, Subtotal bold, "Weekly limit $5.00 · $x left" muted → HELD FOR ASKS lines `name · −$x` or "Nothing held" → AVAILABLE + 34px/600 total, "Total in the bank" muted → SAVING FOR goal name + 10-cell ■□ bar + "$x to go" → "Keep it up, Tom." muted. Dashed rules are allowed only on the receipt.
- **Right = one white sheet**, top to bottom: headline 28px/600 two-tone ("Real rewards, *picked by you,* okayed by a grown-up.") · store-link paste pill (`#F5F7F9`, "Paste a link from Amazon, Target or any store" + ink "Add to wishlist") · **From stores** rows · **At home** rows · **Waiting on a grown-up**. Sections split by `1px #EEECE7`.
- Store row: grid `64px | 1fr | 170px | 128px`, gap 18, padding 16/32: 64px r16 product image (`#F5F7F9` until loaded) · name 18/600 + "Store · $x" 13.5 muted · 6px progress bar (`#EEF1F4` track, `#2E7C46` fill = available ÷ price) + "$x to go" / "You have enough" · button.
- At-home row (set by a grown-up): 52px blob disc on `#F5F7F9` · name 18/600 + sub 13.5 · 28px/300 price · button.
- Button states (pill, 14/700, min 128, label flush left): **Ask for it** ink/white · **Asked ✓** `#FBF6E4`/`#8A6D1C` · **Save for it** `#F5F7F9`/ink (sets the goal) · **Saving ✓** `#E3F3E6`/`#2E7C46` · **Need $x more** `#F5F7F9`/45% ink, disabled.
- Asking holds the money (Available drops, a held line appears on the receipt, a `#FBF6E4` row with Cancel appears under Waiting). A grown-up buys store items from the pasted link and approves home rewards.
- Explored and dropped: gold ticket card, piggy-bank illustration/fill gauge, black card, tabs (8a), wishlist grid (8b), bank statement (9b).

**Brief v4 retrofit (2026-10-20)** — functionality from uploads/kampus-design-brief-v4; visuals stay §0. Binding:
- Worlds renamed everywhere: The Kitchen `#F0AFCE` · The Market `#F4BE93` · Outside `#5E9FE0` · The Workshop `#8F97DE`. Chips use the full name.
- Home (3a/3b): greeting names today's lesson ("one lesson today, then the stand opens"). Progress counts units (7 dots, "unit 3 of 7 · 38 of 130 lessons · grade test opens after unit 7"), not runs. A **Today's lesson** row stands out by scale, not fill: white like the rest of the sheet, padding 30/32, "TODAY'S LESSON" kicker + world chip + "~20 min · no timer", 34px/600 one-goal title, a five-move spine (5 equal 6px segments labelled Warm-up · New idea · Guided · Mixed · Prove it; current ink, rest `#E6EAEE`), and a 96px ink round "Start" button (phone: 24px title, 64px button, unlabelled spine). It sits above **Free practice** (was Missions). Each practice row has an opt-in **Blitz** pill (ground → ink "⚡ Blitz on"; meta adds "×1.5 under 8s"). Lime stand band is gated: "Class first, then the register opens." + 55% white "Opens after the lesson" pill. Passed-grade hover chip reads "Test 19/20" (no letter grades).
- Teach Tokens (4a, 5a): 3 per free-practice run. Top bar shows a white pill "Teach Tokens" + three 9px dots (gold `#E8C94F` = left, empty = ink 1.5px ring) and an "Untimed" / ink "⚡ Blitz · ×1.5 under 8s" pill. Teach card shows the same dots + "N left" (→ "half pay" at 0). Confirm: "Spend a Teach Token? N left this run. A token keeps full pay. Save them for the hard ones." — ink "I'll try first" · outline "Use a token" ("Teach me anyway" at 0). Hints / Show me / Read stay free.
- Payout on a correct answer (footer of the sheet): 44px/300 green `+$N` + 16px/600 line + pills (12/700): ink "×1.5 streak"/"×1.5 blitz", green-tint "+5 first try", gold-tint "token used · full pay" / "half pay · help". Formula: ceil((base × streak × blitz + 5 first try) × ½ if help without token).
- Wrong answer copy: "Not yet. Here's the step: …" (the hint), then retry; retries never get the first-try bonus.
- Mission start (lesson step 5, after "Try it" is solved): Untimed / ⚡ Blitz segmented switch beside the Start button, Untimed preselected.
- Results band "Teach Tokens used N / 3" replaces "Grade 7 test N/10 runs".
- Grade page = **6e report card** (locked; 6g phone). Left: white square document — "Kampus School" kicker, "Report card" 24/600, term line, 2px ink rules, per-world rows (color dot · name + skill area · verdict pill **Solid** `#EAF6EE`/`#2E7C46`, **Shaky** `#FBF6E4`/`#8A6D1C`, **Not yet** `#EEF1F4`/60% ink), facts (Lessons done, Unit quizzes, Kredits earned), a ground note box, CTA ("Grade test opens after unit 7" disabled / ink "View certificate"). Never a percentage or letter grade.
- Rewards earning (effort only, never scores): Finish today's lesson +$0.50 · Take a unit quiz +$1.00 · Take the grade test +$1.50 · Five-day streak +$0.50. Receipt adds "Paid for effort. Never for scores." and a "How you earn" list on ground below it. Phone = 9c (compact receipt + sheet).
- My Stand (parked): register gated by the lesson ("Start today's lesson →" white pill until done, then ink "Open for the day →"), supplies paid from the Bank, Regulars row (reputation drifts, never zero).

**Question screen** (Home Grade Stack.dc.html → **4d** desktop, **4f** phone; locked 2026-10-20; 4a–4c, 4e kept for reference)
- Left column "What you know": givens as ruled rows (15/700 label, 40px/300 value; "Find" value at 45% ink) + Problem family row (ink chip). Below: "NEED HELP" kicker, 2×2 grid of pills — Read it · Hint · Show me (white, "Free") and Teach me (gold `#E8C94F`, "1 token" → "Half pay" at 0; "Free today" during a lesson's new skill). Cost sits right-aligned in each pill (12/700, 60% ink). Picked pill = ink/white. The chosen help opens in a white r20 box under the grid with a kicker naming it. **The token confirm is SUPERSEDED by §0c:** it is the sheet takeover's FIRST STATE, not a box in this column — the decision and the teaching it buys are one journey in one place. Hint and Show me still open here.
- Phone 4f: givens become a 3-column strip on ground; help grid moves inside the sheet under the answers (pills `#EEF1F4`, 44px tall), help box `#F2F4F6` beneath; feedback + full-width Check pinned at the bottom.

**Daily lesson** (Daily Lesson.dc.html → 7a desktop, 7b phone)
- Top bar spine: five equal columns (Warm-up · New idea · Guided · Mixed · Prove it), each a 13/800 label + 11.5 muted meta and one 6px segment per question (done `#58B372`, current ink, todo `#D9DEE4`). Click to jump. Right: "+$N today" green pill, Teach Tokens pill, Untimed. No timer anywhere.
- Questions reuse 4d. Guided adds a scaffold row inside the sheet (`#F5F7F9` r18, white "Lots of help" / "Some help" chip + 17/500 first step); it disappears for the last two.
- New idea / re-teach view: kicker, 40px title, 18px lede, three ruled step rows (40px/300 percent · 17/600 how · 40px/300 value, last green). Footer "Try one →" / "2 fresh ones →".
- Prove it miss: "Not yet. Here's the step: …" → "Go over it" → re-teach view → 2 fresh questions.
- Done: two `#F5F7F9` r20 tiles (Kredits today green 56px; Real reward $0.50 "Waiting on a grown-up"), footer "Run it again" + ink "Open the shop →". Left column lists the five moves with green ✓ discs.

**Unit quiz** (Unit Quiz.dc.html → 8a/8b) and **Grade test** (Grade Test.dc.html → 10a/10b)
- Shared: intro rule rows on the left (Questions, Timer None, Help Read it only, Reward, Retake); question map (5-col 44–48px r14 cells, answered = ink, current = 2px ink ring; phone 10-col strip under the sheet). No right/wrong shown until "Hand it in"; Back/Next, last button reads "Go to blank" while any are empty.
- Quiz results: per-skill rows (19/700 name + group, 14.5 next-step line, one 14px dot per question green/red, verdict pill). Verdicts Solid / Shaky / Not yet only — never a percentage. Left tally by verdict + "$1.00 For taking it".
- Grade test results: two check rows (16+ right · every cluster has one right). Pass → ink r22 card "The Grade 7 district is built." with four world buildings. Not yet → "Repair plan · N units" ruled rows (36px/300 index · unit name · reason · world chip). Both show a 5×2 cluster grid (`#F5F7F9` all right, `#FBF6E4` one missed, `#FBEDEC` both missed) and "$1.50 For taking it". Intro copy: "Covers everything your state expects for grade 7."

**Grown-ups** (Grown-ups.dc.html → 11a/11b)
- Left: kid name 28/600 + "Grade 7 · day N · streak"; tab rows Approvals (ink count badge) · Progress · Settings (active = white r16 fill, 800); weekly limit bar (`#2E7C46` on white, "$x of $5.00") + "Paid for effort. Never for scores."
- Approvals: Earned rows (name, sub, 32px/300 green amount, Hold outline + Approve ink; "Over limit" disabled when it would pass the cap) and Asks (Not now / Say yes). Closed rows show a tag + Undo. Footer "Approve all earned" stops at the cap.
- Progress: per-world rows (dot · name + current unit · placement grade · verdict pill), three `#F5F7F9` stat tiles.
- Settings: segmented pills (Weekly limit $3/$5/$8, Lesson length 12/17/22 min) and toggles (Allow Blitz, Fluency sprints, Shop vacation mode) — track `#2E7C46` on, `#D9DEE4` off.

**Living Business** (Living Business v2.dc.html → **12c** desktop / **12d** phone; built on `brief-v5/BUSINESS_DATA.json`. Supersedes 12a/12b and My Stand 6a/6b, kept for reference.) Product: lemonade, as in the engine.
- Nav item "Business". Row 1 left: Startup blob 56px + "YOUR BUSINESS · date" kicker + "Talia's Lemonade" 28/600. Right: Bank (44/300) | Yesterday profit (green) + Prep · Open day · Ledger phase pills (current ink).
- Left column on ground: **Reputation** 44/300 + white state pill (Quiet < 30 · Steady · Buzzing ≥ 70) + 8px bar (`#2E7C46`, `#E8C94F` when Quiet) + "Never below 10" note. **Regulars** ruled rows: 40px white disc with persona blob, name 15/700, note 13 muted, 5 affinity dots (green filled / white). **Growth ladder**: 24px dot step list — Starter Kit · Big Sign · Blender · Ad Campaign · Cookie Shop · Franchise · Empire; right-aligned gate text ("needs percents Solid", "needs systems", "loan · staff · grade 8").
- Closed (lime footer band): lesson gate "Class is out after today's lesson. Then the stand can open." + white "Start today's lesson →"; vacation "The stand is closed for a few days." (reputation and supplies frozen).
- Prep, top to bottom inside the sheet: optional event strips full-bleed — spoilage (`#F5F7F9`, "8 lemons went soft overnight · −$4.00" + "Show me the trick" white pill → planning lesson + "Later") and comeback (`#FBF6E4`, "Your regulars tried the park cart. Bring them back?" + ink "Run the sale" → green-tint "Running ✓"). **Stock and market** table, grid `1fr 110px 120px 168px`: name (+ Each / Bag of 12 segmented on lemons with green unit-cost line "$5.40 ÷ 12 = 45¢ each · 5¢ cheaper") · on hand 30/300 · today's price 16/700 + drift line (▼ green / ▲ `#8A6D1C` "Nc since yesterday") · stepper (40px `#F5F7F9` discs, 30/300 qty). Two-up row: Price per cup tiles $1.50–$3.00 (52px, `#F5F7F9`, selected ink) with margin line "price − cost = margin a cup"; Promo list (No promo · 25% off today "percents · unlocked" · 2 cups for $3.50 "needs systems", locked 45%). 4-col estimate (cost per cup · cups you can make · likely asked for · est. profit). Lime band: tip + ink "Buy $X and open →" (disabled `#E6EAEE` until ≥1 cup can be made and the Bank covers it).
- Open day: 3-col counters (Served green · Missed · Cups left). Queue rows: 40px `#F5F7F9` disc + blob, name 16/700, "Regular" pill, order muted, status pill (Next ink · Waiting `#F5F7F9` · Served `#EAF6EE`/`#2E7C46` · Sold out `#EEF1F4`/60% ink). Footer: feedback line + outline "Serve the rest" + ink "Serve next" → "Close the books →". No clock; one customer per tap.
- Moment (replaces the queue when due): persona disc + kicker "BUSINESS MOMENT · skill" + "Pays +$15 if you get it first try. Skipping is fine." · 32/600 question · 3 answer rows (numbered key discs; right = `#EAF6EE` + green ring, wrong = `#FBEDEC` + `#E4766C`) · steps box `#F5F7F9` after an answer · outline "Skip it" + "Check"/"Try again". Skip auto-resolves neutrally (no bulk order, no bonus).
- Ledger: kicker "LEDGER · date" + 34/700 headline + 72/300 profit numeral. 3 `#F5F7F9` count tiles (Served · Missed · Cups sold). Rows with math column: Revenue (green) · Cost of cups sold (red) · Spoilage (red) · Moment bonus · Supplies carried over · Reputation ± with which regulars were served / missed out. Lime band: "$X back to the Bank · profit $Y" + one-line lesson; "Planning lesson · 4 min" white pill when more than a third of customers were missed; ink "Plan tomorrow".
- Money: supplies are bought with Kredits from the Bank and revenue returns to it (no ×10). Recipe = 1 lemon + 1 sugar portion + 1 cup.

Friendly but not babyish. Built ADHD-first: no question timers, no fail penalties, minimal clutter while a question is live.

## 0a. Onboarding (added 2026-10-20)
Onboarding.dc.html → 13a–13r parent setup, 14a–14h student first run, 15a–15f doorways. Built strictly on §0 tokens; does not revise §0. Supersedes §11.

- Frame: desktop 1280×800, nav on ground (Kampus wordmark + white "Grown-ups setup" pill, or the 38px avatar disc in the student run), grid `340px | 1fr`, gap 48, padding 40/48/48. Left column on ground holds kicker · 40px/600 title · 17/500 muted sub. Right is the one white sheet (r28): body padding 40, footer `1px #EEECE7` rule with a muted note left and the ink CTA pill right (disabled `#E6EAEE` / 45% ink until the decision is made). Phone 390×844: kicker/title (28/600)/sub on ground, sheet inset 12px, full-width 56px CTA pinned below.
- Welcome (13a/13b): Party blob 150px + kicker "KAMPUS · THE CAMPUS OF LIFE" on the left; sheet carries "Hey. / This is Kampus." at 104px/600 (−.045em, two lines) + the v1 line rewritten for dollars ("Earn real money for the effort you put in." in ink). CTA "Bet. Set it up →"; text link "Already set up? Pick your profile" → 15a.
- Parent progress: desktop = eight-row step list in the left column (22px dots: done green ✓, current ink ring, todo 22% ring; current label 800); phone = eight 6px segments above the kicker.
- Text entry (email, first name only): one big `#F5F7F9` pill input (desktop 96px tall / 36px type; name 112px / 52px/600), focus = 2px ink inset ring, no borders or labels inside. Quiet line under the name: "We keep her first name. That's it."
- PIN pad (13i, 13o, 15c, 15e): four 26px dots (filled ink; empty 2px 22% ring; all green on match/save, all `#E4766C` on a miss) + status line + 3×4 keypad of 84px `#F5F7F9` circles (phone 76px), digits 34/300, "Delete" 14/700, blank bottom-left. Setting a PIN = type it, then "Once more"; mismatch resets with "Those didn't match. Start again." No lockouts, no countdowns.
- Where should she start (13k): two equal halves. Left = 3×2 grade tiles (r20, `#F5F7F9`, GRADE kicker, 44px/300 numeral; selected ink/white). Right = one tile the height of the grid: Target blob, "NOT SURE" kicker, "Let Kampus find her level." 26/600, one line on the 15-minute untimed check. Footer note switches to "Covers everything your state expects for grade N."
- Defaults (13m): the Grown-ups Settings controls exactly (segmented pills on `#EEF1F4`, 52×30 toggle `#2E7C46`/`#D9DEE4`). Footer note "Paid for effort. Never for scores."
- Hand it over (13q): 72px `#E6EAEE` disc + name, ruled summary rows (label 16/700, value 20/600 right).
- Student run: three 6px segments + avatar disc (96px desktop / 56px phone) that fills with the chosen world color. 14a "Hey Maya." 120px/600. 14c four 140px world discs with the ink initial; selected ring `0 0 0 5px #fff, 0 0 0 8px ink`. 14e placement: 48/600 title, ground pills (About 15 minutes · No timer · Doesn't pay or cost), four world rows with a 30/300 "?" grade, pride line in 18/600 ink. 14g: "You're starting at" muted + "Grade" 48/600 + 200px/300 numeral + state line, 128px ink round Start (no footer CTA) → Home 3b.
- Doorways: 15a three `#F5F7F9` r20 tiles (112px kid discs in their color; Grown-ups = white disc with Coach blob); phone = ruled rows with 72px discs. 15c kid PIN: her disc on the left, "Hi Maya. / Type your PIN.", "Not you? Switch". 15e: kicker GROWN-UPS, "Grown-ups only.", footer offers an email reset link to the masked address.

## 0b. Polish round (added 2026-10-21)
Polish.dc.html → 16a–16n teach steps, 17a/17b week plan, 18a/18b grade stack, 19a/19b wishlist tiles, 20a/20b world names. Additive; does not revise §0.

- **Teach steps** live inside the existing lesson frame (top spine, cheat-sheet column, white sheet, Back/Next footer; Next is disabled `#E6EAEE` until solved). Kicker "New idea · step N of 4 · <verb>" + 34/600 prompt (32 for long prompts; phone 22–24).
  - Worked walk: ruled rows, 40px/300 value + 17/600 how, result row green `#2E7C46`. Unrevealed rows are 56px r16 `#F5F7F9` slots; the next one reads "Tap for the next line". One row per tap, fading in.
  - Face-off: two `#F5F7F9` r24 cards (min 230px) split by a 48px ink "or" disc; kicker · 22/600 count · 72px/300 price · per-one line revealed on pick. Right = `#EAF6EE` + 2px green inset + white "Better buy ✓"; wrong = `#FBEDEC` + `#E4766C`, followed by a "Not yet. Here is the step: …" line.
  - Line: 2px ink line, 13 ticks (14px white rings), 0 in 800. Start = 26px `#5E9FE0` disc + "START". Tap a tick: green or red 26px disc; on right, a 6px green span shows the move with an "8 steps down" label, plus a 40/300 readout `5° − 8° = −3°`. Phone: the line runs vertically, hot at the top.
  - Bar: N equal 120px segments (gap 5, outer ends r18), unshaded `#EEF1F4`; shaded ink while under the target, green when exact, `#E4766C` when over; 64px/300 fraction readout.
  - Takeaway: solving opens a full-bleed `#EAF6EE` band above the footer ("For your notes" kicker + 22/600 note + ink "Write it down"). Writing fills one cell of the 4-cell Notes counter (12px r3, green/`#E6EAEE`) next to the cheat-sheet kicker and drops the note into the column on a `#EAF6EE` r12 highlight.
  - Voice: band a (grades 3–4) = companion row at the top of the sheet: 64px world-color disc + Singing blob, "Reading it to you…", a 5-bar ink waveform, Again (ink) · Slower · Quiet. Auto-reads each step; prompt grows to 40px. Band b = disc only. Band c = the existing "Read it to me" pill.
- **Week plan**: header kicker (This week / Next week / License week) + 24/600 range + green earned + ink ←/→ discs. 7 columns of 236px r16 cells: done `#F5F7F9` (title, world chip, "✓ +$0.50" green) · today ink (lime "TODAY" kicker, white Start pill) · upcoming white with 1.5px 12% inset ring · **Inspection Day** `#FBF6E4` + Security blob, `#8A6D1C` kicker · **The License** `#6E4FCC` + Winner blob, white text · rest days 8% ring, muted. "Coming up" ruled rows under the grid (44px tinted disc + blob); tapping the License row jumps to its week. Phone: one ruled row per day with the same fills.
- **Grade stack**: grades she placed past fold into one `#DCD2F6` card ("Earlier grades · Review anytime", range numeral e.g. `3–5`); tap opens per-grade rows with white Review pills. Above-current cards stay `#E6EAEE`, and the sub line says what earns them ("After the Grade 6 License"). Grade 3: no earlier card. Grade 8: last card is Graduation, which turns `#6E4FCC` after passing. Kid copy calls the grade test "the License" and the unit quiz "Inspection Day".
- **Wishlist tiles**: loading = shimmer on the tile + two text bars, then a miss after 4s. Photo on white. Miss = store tint (domain hash → confetti color at 24%) + 28/600 initial + 22px white glyph disc (toy/book/art/game/sport/other). Link-only = `#EEF1F4` + link glyph, "Something from domain" + "Add details".
- **World names (decided 2026-10-21)**: The Kitchen `#F0AFCE` (fractions) · The Market `#F4BE93` (ratios, rates, money) · Outside `#5E9FE0` (negatives, temperature) · The Workshop `#8F97DE` (equations). These replace the brief-v4 names everywhere, and the colors are unchanged. Reason: each one is a place she can stand in, readable at 8 and not embarrassing at 13.
- **Moment names (decided)**: the unit quiz is "Inspection Day" and the grade test is "the License" in kid copy. Both frame the test as something you earn and look forward to, which suits grades 7–8 without reading young. Grown-ups copy keeps "unit quiz" and "grade test".

---

## 0c. Voice and worked animation (added 2026-11-10)
Daily Lesson.dc.html → 24a voice, 25a Teach me, 25b re-teach (desktop); 26a–26c phone. Redrawn from packages/ui (question.jsx, say-it-show-it.jsx, lesson.jsx). Additive; where the shipped code differs, this wins.

- **Voice bar**: the first row of the white sheet on every screen that reads (question, Snag, re-teach, quiz paper). Padding 20/40 (phone 14/16), split from the body by `1px #EEECE7`. Left to right: 48px reader disc (phone 44) · state label 14.5/700 · spacer · Slower and Quiet pills (36px desktop, 44px phone; `#F5F7F9`, ink/white when on). Disc: grades 3–6 = world-colour disc with Singing.svg; grades 7–8 = ink disc with ▶ / ❚❚. Label: "Hope is reading" while playing; idle "Reads on its own. Tap to hear it again." (3–4, auto-reads) · "Tap to hear it." (5–6) · "Read it to me" (7–8); "Quiet. Tap to hear it." when muted. The companion row above the h2 and the Again / Slower / Quiet outline buttons under the script are removed.
- **Sweep**: unchanged from code — said ink, current word `#FFE9A8` (r8), ahead `#B9BBC1`; all ink when nothing is playing. Prompt 40px (7–8) / 44 (5–6) / 48 (3–4); phone 24 / 26 / 28.
- **Read it leaves the help grid.** Help is three full-width pills in one column on desktop (48px: Hint · Show me · Teach me gold), three in a row on phone.
- **Sheet**: no 3px world-colour top border. Answers are `#F5F7F9` r20 tiles with no rule border. Audio never gates: Check, Next and Continue are live throughout.
- **Teach me (25a)** opens in the sheet, not the help box: kicker "Teach me · token used, full pay" · the question at 24/600 · animation stage · walk rows (grid `150px | 1fr`, 40px/300 value, 17/600 how, last row green; unrevealed = 56px r16 `#F5F7F9` slots, next one reads "Tap for the next line") · footer "N of 3" + ink "Back to the question →".
- **Re-teach (25b)**: voice bar · kicker "Same idea, new numbers" · 40/600 title · lede · animation stage · full-bleed ruled rows (grid `120px | 1fr | auto`); the row being read takes a `#FBF6E4` band. Rows highlight, never hide. Footer note + ink "2 fresh ones →".
- **Animation stage**: `#F5F7F9` r20, padding 20/28, grid `auto | 1fr`, gap 32. Column 1 = the animation (372×102) with a white 40px "Watch again" pill under it, left-aligned. Column 2 = kicker "Step N · watch …" · 17/600 line · 15/600 green readout that fades in when the move lands. Phone: stacked (animation at 80%, text, 44px Watch again). One animation per number shown; the stage follows the newest revealed row (Teach me) or the voice cue (re-teach). Nothing waits on it.
  - *Decimal hop* (×10%): 72px/300 digits in 44px cells, `$64.00`. A 16px gap holds a 12px dot; the gap and dot travel one place left over .6s `cubic-bezier(.32,.72,.33,1)`, a 2px ink arc with arrowhead draws above, the dot turns `#2E7C46`, the spare trailing zero fades out → `$6.40`.
  - *Split* (half): a 240×72 ink bar labelled $6.40 opens a 12px gap into two 120px halves labelled $3.20; the second half drops to `#E6EAEE`.
  - *Join* (add): a 240px and a 120px ink bar close their 12px gap and turn `#2E7C46`, relabelled $9.60. Bar widths stay proportional to the amounts across steps.
- Other skills need their own stage (fractions and integers can reuse the bar and line teach layouts). Not drawn yet.

## 0d. Weekly report (added 2026-11-10)
Grown-ups.dc.html → **29a** desktop / **29d** phone (locked). Redrawn from packages/ui/src/report.jsx; figures come from apps/web/src/report.js. 29b, 29c and 30a kept for reference.

- A new first tab, **This week**, in the Grown-ups frame (same left column: name, tabs, weekly limit bar now labelled "Weekly limit"). Crumb on ground above the sheet: "This week · Nov 9 to Nov 12". The kid's meta line drops the streak.
- Sheet, three sections split by `1px #EEECE7`, padding 40 (first) / 26 40 28:
  1. Headline 34/600 "Here's Maya's week." + 16.5 line "What she did, not how well she did it. Nothing here is a score." Then a 3-column grid (gap 28, columns split by `1.5px #EEECE7` vertical rules, 28px inset): 64px/300 numeral · 15.5/700 label · 13.5/600 muted sub. Days she showed up ("so far this week") · lessons finished · days at the stand.
  2. Kicker MONEY. Same grid: "$1.50 you approved" (`#2E7C46`, "of a $5.00 weekly limit") · "$1.00 waiting on you" ("in Approvals") · ink "Open Approvals →" right-aligned in the third column.
  3. Kicker WHERE SHE IS. 25/600 "Grade 7 · unit 3 of 7" + 16 line "34 lessons into a 128-lesson year. Next up: Inspection Day." and seven 12px unit dots at right (done ink, current 2px ink ring, todo `#E6EAEE`).
- Footer: 14/600 muted "Kampus · week 46 · Nov 9 to Nov 12" + `#F5F7F9` "Share this week" pill.
- Rules carried from code: show-up days are a count with no denominator and no streak; nothing scores the kid (no percentage, accuracy or grade); no trend arrows or comparisons with last week. Quiet week: headline "A quiet week. Here's where Maya is.", line "Nothing was recorded this week. The year waits where she left it. Nothing expired, nothing was lost.", and section 1's grid is omitted. Restock line (only when a lesson is unplayable): `#F5F7F9` r16 box with Timer blob 34px, "We're restocking a lesson. That one is on us, not on her."
- Phone 29d: 24/600 name + meta, Lock pill, one white segmented control (four equal options, active ink), weekly limit bar, then the sheet with every figure as a ruled row (label + sub left, 40px/300 numeral right). Dock: white "Share" + ink "Open Approvals →".

## 0e. Placement check (added 2026-11-10)
Onboarding.dc.html → runner **34b** desktop / **27d** phone, result **28a** desktop / **28d** phone (locked). Redrawn from packages/ui/src/placement.jsx. The intro stays 14e. Other options (27a–c, 28b–c, 31a, 34a, 34c) kept for reference; the photo ground (32a, 32b) is parked.

- **No global menu.** Placement is a focus screen that runs during first-run setup; the only way out is Exit. Never a score, mark, tally, timer or money on either screen.
- **Runner (34b)**: plain `#F5F7F9` ground, one centred column 980px wide (150px side padding at 1280).
  - Floating bar: white, r28, padding 16/20, 40px from the top, 12px above the sheet, same width as the sheet. Left to right: "← Exit" pill (`#F5F7F9`) · four equal world cells · "Untimed" pill (`#F5F7F9`).
  - World cell: 14px dot in the world colour + name 14/800 + status 12.5/700, over a 6px r999 segment. Looking now = ink ring on the dot (2px white, 2px ink), ink segment. Found ✓ = status `#2E7C46`, segment `#58B372`. Up next = dot at 45%, name at 50% ink, segment `#D9DEE4`. No mascots.
  - Sheet: white r28. Voice bar first row (§0c) · prompt 48/600, line-height 1.2, max 900px · answers in a 2-column grid of `#F5F7F9` r20 tiles (28px white key disc + 34px/300 value) · footer 16/600 muted "Not sure? Pick the one you think is closest. Guessing costs nothing here." No Check button; a tap answers and advances.
  - Phone 27d: ✕ + "Finding your level" + Untimed pill, four 5px world segments under it, world chip + "Looking now", sheet with voice bar, 24/600 prompt, answers stacked one per row at 56px, ink "Next →" in the dock.
- **Result (28a)**: normal top bar returns (wordmark + avatar). Frame `340px | 1fr`.
  - Left, on ground: 18/600 muted "You're starting at" · "Grade" 48/600 · numeral 200px/300 · 15/600 muted "That is where your lessons begin, not a mark."
  - Sheet: kicker "Where each world starts you" · 34/600 headline naming the strongest world ("You're already ahead in The Market.") · four rows split by `1.5px #EEECE7`: 34px world disc · name 18/600 over area 13.5/600 muted · tag (ink "Ahead" above the start grade, `#F5F7F9` "Starts earlier" below it, none when level) · "Grade" 13/700 muted · 44px/300 numeral. Footer: 16/600 muted "Everything below Grade N is yours to review whenever you like." + ink "Let's go, Maya →".
  - Phone 28d: "You're starting at" + Grade and a 120px numeral on ground, sheet with the same rows (tag folded into the sub line), 56px ink CTA in the dock.

## 0f. The counter (Living Business, open day) (added 2026-11-10)
Living Business v2.dc.html → **43a** discount, **43b** plain order, **43c** Karla’s swap (locked, desktop; they replace 40a–42a). Built from packages/ui/src/business.jsx (MomentCard) and packages/engine/src/market.js, then simplified: she runs the counter; the math is the job, not a quiz laid over it. 35a–38a and 39a–c kept for reference. Recipe, prices and amounts in the artboards are placeholders.

- **One screen.** Normal top bar (Business active). Frame `340px | 1fr`, gap 48. Open day shows only the counter: no reputation, regulars, bank, phase tabs, served/missed counts or full queue. Those live on prep and on the ledger.
- **Header row.** Left, above the receipt: 11/800 uppercase kicker "Sales today" over the amount in IBM Plex Mono 34/600, `#2E7C46`. It rises as she serves. Right, above the sheet: 56px Startup blob + kicker "Your stand · open" + name 28/600.
- **Left = one-cup receipt**, same paper as the Rewards receipt (white, square corners, 10px zigzag bottom, IBM Plex Mono 13/1.45, dashed `1.5px rgba(35,37,43,.3)` dividers). Centred head: stand name 15/700 tracked · "One cup · today's prices" · date. Sections: SELLS FOR (1 cup) · COSTS TO MAKE (one line per ingredient, bold Subtotal) · YOU KEEP (34/600 amount, "Per cup, at full price.") · ON YOUR SHELF (lemons, sugar, cups you can pour; counts move as she serves). Amounts always in dollars with two decimals.
- **Right = the counter sheet** (white r28). Padding 40, gap 28: 56px customer disc + name 17/700 + sub 14/600 muted · what they say in their own words, 44/600 · kicker "Ring it up" · four price keys in one row (`#F5F7F9` r20, 34px/300). One tap answers. Right = key turns `#EAF6EE`/`#2E7C46`. Wrong = picked key `#FBECEA`/`#C2463B`, right key green, and the sum appears as ruled rows (17/600 step, 32px/300 value, last value green). Footer (1px rule): 16/600 line ("What does Ava pay?" → "Rang up $9.00. Ava is served." / "It comes to $9.00. Here's the sum. Ava paid that and is served.") + ink "Next customer →" once answered.
- **Rules kept from code:** a customer question pays nothing extra, takes one tap, never blocks the sale, and the customer is always served at the right price. No Skip, no Try again, no bonus.
- Under the sheet, on ground: progress, not a crowd. 14.5/700 "Customer 3 of 14" + one 10px dot per customer (served `#58B372`, current white with a 2.5px ink ring, to come `#D9DEE4`) + right-aligned 14.5/600 muted "No rush. The line waits." During Karla’s swap the label reads "2 of 14 served" and no dot is current. No faces, no waiting count, no timer.
- **Attention rules (43a–c):**
  - *Order chips.* When a customer’s request carries numbers, they repeat under the quote as `#F5F7F9` pills, 15/700 ("6 cups", "$2.00 each", "25% off"), so she does not hold them in her head.
  - *Receipt marks what matters now.* The receipt line this customer depends on takes a `#FFE9A8` r4 marker (the cup price for an order; lemons and sugar on the shelf for a swap). One marker set at a time.
  - *Hear it.* Right end of the customer row: 44px `#F5F7F9` pill with a 32px ink ▶ disc and "Hear Ava". Plays the customer’s line; nothing waits on it.
  - *Immediate payoff.* When a customer is served, a `#EAF6EE`/`#2E7C46` pill ("+$9.00", 13/800) appears beside Sales today.
  - Left out on purpose: hint button, timer, streak, celebration animation.
- Soft shadow on the two white surfaces, on this screen only for now: sheet `0 1px 2px rgba(35,37,43,.04), 0 10px 28px rgba(35,37,43,.06)`; receipt `drop-shadow(0 1px 1px rgba(35,37,43,.05)) drop-shadow(0 8px 14px rgba(35,37,43,.07))` so it follows the zigzag.
- Same screen, other situations (**43b** plain order, **43c** Karla’s swap): a plain order is one ruled sum row and an ink "Serve Marcus · $4.00"; Karla's swap is two `#F5F7F9` piles (64px count, price each, and what the pile is worth, shown before she decides) over two equal choice tiles, "Keep my lemons" and "Swap", and the shelf updates on a swap.
- Not drawn: phone, prep, ledger in this direction; the swap she cannot cover.

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
| Kredit / gold | `#E8C94F` | deep `#A8862A`, mid `#D9B96A`, alt `#D9A93F` | `#FBF3E4` | `#E8D9B8` | Kredit coin, held/pending rewards (`#FBF6E4` + `#8A6D1C`), Teach panel + confirm, callouts, tier dots |
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
**Inter Tight** (Google Fonts), 300–900, antialiased. Exception: the Rewards receipt uses **IBM Plex Mono** 400/600/700.

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
- Currency is **Kredits** (branded "Kampus Kredit"); icon = gold coin with 800-weight "K" in `#A8862A`. Real-world rewards are paid in **real dollars** (cents internally, two-decimal display), parent-approved, $5.00/week cap. See §0 Rewards.
- Gain per correct: `round((8 + 4·tier) × streakMult × (1 + gearBonus%))`; streakMult ×1.5 at 3, ×2 at 6, ×3 at 10. Format ≥1000 as `1.2k`.
- **Teach costs half.** Button reads "Teach me · costs half". First tap opens a gold confirm: *"Help costs half a Kredit. Thinking is free. Solo this pays ~N, with help ~M."* — dark **"I'll try first"** is the primary, outlined gold "Teach me anyway" secondary. Confirming halves that question's payout (ceil). **The 45% dim is SUPERSEDED by §0c:** Teach me takes the sheet now, so dimming the question dimmed the teaching itself — the owner read the result as "no new design, screen greys out". The teaching is distinguished by being a surface, not by everything else going pale, and a 45% wash is a readability cost on a screen built for kids who find reading the hard part.
- **Kredits this week card** (Home right rail): stacked horizontal bar on `#ECE9E1` — green `#58B372` earned segment vs red `#E4766C` spent segment (spent = forgone Teach halves + shop purchases); legend `+N earned` (green deep) / `−M spent` (red); hint line: "Your week starts here." / "All brain, no help. Clean." / "Spent = help + shop. Thinking is free." / "Help and shopping are eating your Kredits."

---

## 7. Iconography
Inline SVG, 24 viewBox at 14–18px, 1.8–2px `#23252B` strokes, round caps/joins, flat accent fills. Kredit coin (see §6), ticket, pennant logo (ink pole + `#EE8A55` flag), bulb (Teach), speaker (Read it), check `#58B372` 3px, padlock `#8A8578`, ✕ close. No emoji in chrome (shop pets/themes are the only emoji surface).

---

## 8. Illustration set ("blobs")
Flat vector characters — rounded blob people doing activities; corals/golds/blues/greens with ink details; transparent background. Render via `<img>`, `object-fit: contain`. Never recolor, crop, or outline.

**Usage:** one blob per surface, always paired with text. Sizes: onboarding hero 150–170px; screen headers 82px; Play mascot 76–132px (grade band, pokeable); cards 54–96px; empty states 60–80px at 80–85% opacity. Blobs overhang the text block's left edge by −6 to −18px.

**Role assignments:** avatars `Thinker, Magic, Skating, Explore` · world mascots `Ice_cream, Cash, Rain, Learning` · celebration `Party`, test pass `Winner` · savings `Savings` · stand `Startup` · shop `Shopping` · Grown-ups `Analytics` · test intro `Target` · empty states `Timer` (nothing pending), `Coffee` (no runs), `Vision` (no stand result).

**Full inventory (80, for future screens):** Access, Accounting, Analytics, Artboard, Attract, Badminton, Basketball, Bill, Bowling, Boxing, Card, Cash, Coach, Coffee, Cyclist, Discount, Drone, Eating, Emailing, Explore, Finance, Finance-1, Football, Fortune, Gardening, Golf, Growth, Hunting, Hydration, Ice_cream, Idea, Investment, Investor, Invoice, Invoice-1, Jumping, Kettlebell, Laptop, Learning, Lifter, Love, Magic, Marketing, Networking, Note, Painting, Party, Passive, Photography, Ping-pong, Pitch, Plants, Play, Pull-up, Rain, Runner, Savings, Savings-1, Security, Selfie, Settings, Shopping, Singing, Skating, Startup, Strategy, Surfing, Swimmer, Talk, Target, Tasks, Thinker, Timer, Transfer, Vault, Vision, Volleyball, Winner, Work, Writing. Pick semantically (`Idea` hints, `Coach` parent tips, `Growth` progress).

---

## 9. Voice & copy
Short, lowercase-leaning kickers, mildly slangy, never cringe: "Bet", "Run it back", "Lock in", "Profit. W.", "Comeback. Respect.", "Not yet. No stress.", "Thinking is free." Failure is always cost-free and said so. Numbers concrete ("16 to pass", "$2.50 to go"). Parent-facing copy (Grown-ups) is plain adult prose, no slang.

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

## 11. Onboarding flows (superseded by §0a, kept for reference)
Shared skeleton: full-screen `ground` overlay, centered left-aligned column (max 520px, 92vw), Pop entrance per step, kicker step counter, no back buttons, no text entry.

### 11.1 Student (3 steps — built)
**0 Welcome:** `Party.svg` 170px · kicker "KAMPUS · THE CAMPUS OF LIFE" · 52px "Hey. This is Kampus." · body: "Real-life math — money, deals, temperatures, plans. Earn Kampus Kredits, cash them in for real rewards. No timers unless you want one." · primary **"Bet"**.
**1 Grade:** kicker "STEP 1 OF 2" · "What grade?" · "A grown-up can change this later. No test to get in." · 70×70 buttons 3–8 (selected ink/white); pick advances.
**2 Avatar:** kicker "STEP 2 OF 2" · "Pick your blob." · "Pets you buy later can take over this job." · 104×104 blob buttons (selected gold tint + `#E8C94F` border) · **"Let's go"** → Home.

### 11.2 Parent (4 steps — spec, to build)
Entry: first tap on Grown-ups nav item. Adult tone, body 16px.
**0 What this is:** `Coach.svg` 150px · kicker "GROWN-UPS SETUP · 2 MINUTES" · 48px "Your kid plays. You steer." · body: "Kampus is self-paced math with a real-world reward loop. Kredits are in-game; reward money is real — you approve every purchase. Nothing here is visible to your kid." · primary **"Set it up"** · ghost "Later" (defaults apply).
**1 Placement:** kicker "STEP 1 OF 3" · "Confirm the grade." · "They picked grade N. Grades level up by test — 20 questions, 16 to pass, failing costs nothing." · 52×52 grade buttons · **"Looks right"**.
**2 Pace:** "Set the pace." · white card rows: Session length segmented Off/10m/15m/20m ("Times the session, never the kid — a gentle wind-down, no cutoffs.") + Focus mode toggle, default on ("Hides Kredits and streak while a question is up.") · **"Next"**.
**3 Rewards:** "Set the reward menu." · "Kids can earn up to $5.00 a week. They can also paste store links; you buy the item when they ask." · editable at-home rows in dollars (30 min screen time · $1.50, Pick the family movie · $2.00, Friend sleepover · $5.00) with $0.50 steppers · **"Done — hand it back"** → Grown-ups dashboard.
Rules: never kid slang; every step states its default so "Later" is safe; redemptions always need parent approval.
