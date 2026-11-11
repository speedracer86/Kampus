# Handoff: Kampus — design packet (Oct 21 2026)

> **Start here for the current round:** `POLISH_TASKS.md` lists the tasks for Claude Code / Cowork, in order, each with done-when checks.

## Overview
Kampus is an ADHD-first math app for homeschooled kids, grades 3–8, designed first for the grade 7–8 band. A kid does one **daily lesson** (five moves), practices in four worlds, takes unit quizzes and grade tests, and runs a **Living Business** that opens only after the lesson. Kredits are the in-app currency. Real-world rewards are **real dollars**, paid for effort only, capped at $5.00/week and approved by a grown-up.

This packet holds the **visual design** (HTML prototypes + style guide). Functionality comes from the owner's briefs (v4/v5: `KAMPUS_TEACHING_SYSTEM.md`, `KAMPUS_BUSINESS_SIM.md`, the engine). The job is to combine the two: rebuild these screens in the app's codebase, driven by the real engine.

## About the design files
Every `.dc.html` file is a **design reference created in HTML**: a working prototype that shows the intended look and behavior. It is not production code. Recreate the screens in the target codebase (the existing React app on `@kampus/engine`), using its patterns and the existing `tokens.js` / primitives, and update their values to match `STYLE_GUIDE.md` §0. Prototype logic (demand numbers, sample questions, payouts) is **stand-in data**. Wherever the engine has a real function or payload, use that.

Open any file in a browser (keep `support.js` next to it). Each file shows labelled artboards (`3b`, `7a`, …) and is clickable. `Component Library.dc.html` shows every locked screen in one place.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii and copy are final intent. Exact values: `STYLE_GUIDE.md` **§0 (binding)**. §1–§11 of the style guide and `react/` describe the older warm-paper prototype; where they disagree with §0, §0 wins.

## Source of truth, in order
1. `STYLE_GUIDE.md` §0: the visual direction and the spec for every screen.
2. The `.dc.html` prototypes: layout, states and copy, as rendered.
3. The owner's v4/v5 briefs + engine: behavior, data shapes, economy rules.
4. Visual instructions in the briefs (serif numerals, hairline outline cards, cream page, frosted nav) are **superseded** by §0. Use the briefs for functionality only.

## Screens
| Id | Screen | File | Status |
| --- | --- | --- | --- |
| 3b / 3a | Home (desktop / phone) | Home Grade Stack.dc.html | Locked |
| 4d / 4f | Question | Home Grade Stack.dc.html | Locked (4a–4c, 4e are explorations) |
| 7a / 7b | Daily lesson, five moves | Daily Lesson.dc.html | Locked |
| 5a / 5b | Mission (free practice run) | Mission & Grade.dc.html | Locked |
| 8a / 8b | Unit quiz + verdicts | Unit Quiz.dc.html | Locked |
| 10a / 10b | Grade test + pass / repair plan | Grade Test.dc.html | Locked |
| 6e / 6g | Report card | Mission & Grade.dc.html | Locked |
| 9a / 9c | Rewards (receipt, wishlist) | Rewards.dc.html | Locked |
| 11a / 11b | Grown-ups | Grown-ups.dc.html | Locked (PIN gate not drawn) |
| 13a–13r, 14a–14h, 15a–15f | Onboarding: welcome, parent setup, student first run, doorways + PIN pads | Onboarding.dc.html | New, for review |
| 16a–16n, 17a–20b | Polish round: teach-step layouts + voice, week plan, grade stack for placed students, wishlist tile states, world-name proposal | Polish.dc.html | New, for review |
| 12c / 12d | Living Business | Living Business v2.dc.html | Current; owner still editing |
| 12a / 12b, 6a / 6b | Earlier business drafts | Living Business.dc.html, My Stand.dc.html | Reference only |

Screen-by-screen specs (layout, sizes, colors, states, copy) are in `STYLE_GUIDE.md` §0 under each screen's name.

## Rules the build must keep
- Worlds: The Kitchen `#F0AFCE` · The Market `#F4BE93` · Outside `#5E9FE0` · The Workshop `#8F97DE`.
- Untimed everywhere. Blitz (×1.5 under 8s) is opt-in per round and never the default. Fluency sprints have no countdown.
- Per-answer Kredits: ceil((base(tier) × streak ×1.5/×2/×3 × blitz × gear% + 5 first try) × ½ if Teach was used without a token). Every gain shows its breakdown as pills.
- Teach Tokens: 3 per run at full pay, half pay after. Teach is free during a lesson's new skill.
- Real dollars, effort only: lesson +$0.50 · unit quiz +$1.00 · grade test +$1.50 · five-day streak +$0.50. Weekly cap $5.00 (grown-up can set $3/$5/$8). Never pay for accuracy or scores.
- Quiz and test results never show a percentage. Unit quiz: Solid / Shaky / Not yet per skill. Grade test: pass = 16/20 and no cluster fully missed → campus district builds. A miss gives a 2–3 unit repair plan, never a fail screen.
- Business: the register opens only after today's lesson. Reputation never drops below 10 and a quiet stand always gets a comeback offer. Vacation mode (grown-up toggle) freezes drift.
- Copy: never "Common Core". Say "covers everything your state expects for grade N."

## State & data per screen (for wiring)
- **Home**: grade + placement per world, today's lesson (unit, title, move progress 0–5), free-practice list, week Kredits, Bank, business gate (lesson done?).
- **Question (shared by lesson, mission, quiz, test)**: question {text, givens[{k,v}], find, family, answers[4], correct, hint, show, teachSteps[], scaffold?, scaffoldLevel?}. Help availability by context: all four in lesson/mission, Read it only in quiz/test. Token count. Payout result {amount, pills[]}.
- **Daily lesson**: moves[5] with question lists (warm-up from the review queue, guided with fading scaffolds, mixed interleaved, prove-it + fresh pair), teach content for the new idea, run Kredits, streak, tokens. Events: answer, teach_used, move_complete, reteach, lesson_complete.
- **Unit quiz**: 10 questions tagged {skill, group: unit|review}, answers map. Result per skill → verdict + next step (Shaky feeds warm-ups, Not yet adds a lesson).
- **Grade test**: 20 questions tagged {cluster, world}. Result {score, perCluster[2], passed, repairPlan[{unit, world, reason}], district}.
- **Rewards / Grown-ups**: earnings[{id, label, day, cents, status}], asks[{id, item, cents, status}], weekly cap, approved total; progress per world {grade, unit, verdict}; settings {cap, lessonLength, allowBlitz, sprints, vacation}.
- **Living Business**: `brief-v5/BUSINESS_DATA.json` is the contract: bizState (stock lots, marketPrices, reputation, regulars[{id, affinity}], vacation, ledger[]), queue[{persona, name, blob, order.cups, isRegular}], momentSample (question + steps), dayResult {served, missed, cupsSold, revenue, cost, profit}, spoilageEvent, comebackPromo. Prototype-only additions to confirm against the engine: yesterday's prices for drift arrows, bag-of-12 lemon price, promo list with skill gates, ladder rung gates.

- **Polish round** (Polish.dc.html). Data shapes are drawn on the canvas under "State & data per screen". In short: `TeachStep{layout: walk|faceoff|line|bar, prompt, hint, takeaway, …}` with lesson state `{stepIdx, solved[], notes[]}`; `WeekDay{date, kind: lesson|quiz|test|rest, status, lessonId, worldId, earnedCents}`; `GradeState` adds `placed` (distinct from `passed`); `WishItem.fetch: pending|ok|miss` with a 4s timeout; world names are a string table keyed by worldId (owner picks before anything ships).

- **Onboarding** (Onboarding.dc.html). Account model: the parent authenticates by email magic link; a student is a profile inside the family with first name + 4-digit PIN only.
  - 13a Welcome → `cta:start_setup` (to 13c) or `cta:pick_profile` (to 15a).
  - 13c Email: {email}. Sends the magic link. 13e Check email: resend. Link opened → `family_created{email}`.
  - 13g First name: {name} (letters, ≤20). 13i Kid PIN: {pin} entered twice, must match. 13k Start: {grade 3–8 | placement}. On 13k Next → `student_added{name, pin, grade|placement}` (placement queues the per-world check).
  - 13m Defaults → `settings{capCents: 300|500|800, lessonLength: 12|17|22, allowBlitz}`. Defaults $5.00 · 17 min · Blitz allowed (each round still starts Untimed).
  - 13o Grown-ups PIN: {parentPin} entered twice (needed by the 15e gate; not in the brief's event list, confirm). 13q Hand it over: read-only summary.
  - 14a Hello → 14c Color: {avatarColor ∈ the four world colors} → 14e (placement queued: start check) or 14g (grade N: Start → Home 3b).
  - 15a Profiles → `profile_selected{studentId | parent}`. 15c Kid PIN / 15e Grown-ups gate → `pin_ok` on match. Misses never lock or count down; after 3 the copy points to a grown-up (kid) or an email reset link (parent).

Components are stateless where possible and report up via `onEvent(type, payload)`. No localStorage in components.

## Not designed yet (from brief v5)
Fluency sprint · placement diagnostic · campus page · shop · daily quests · Grown-ups session-length dial + parent bridge notes · Business Day + capstone week · review-queue cues. Build these in the §0 language later, or send them back for design.

## Editing after handoff
Once this is in the repo, design changes come back as new versions of these files plus a §0 update. Pull, diff the `.dc.html` / `STYLE_GUIDE.md` changes, and apply them to the components. Keep artboard ids stable (`7a`, `12c` …) so the changes are easy to find.

## Design tokens
Full list in `STYLE_GUIDE.md` §0 and the Component Library foundations. Core values: ground `#F5F7F9` · sheet `#FFFFFF` (radius 28, no shadow, one per screen) · ink `#23252B` · muted `rgba(35,37,43,.55)` · rule inside sheet `#EEECE7` · rule on ground `rgba(35,37,43,.12)` 1.5px · locked `#E6EAEE` · green `#58B372` / deep `#2E7C46` · red `#C2463B` (losses) / `#E4766C` (wrong ring) · gold `#E8C94F` (Teach, tokens) · held tint `#FBF6E4` · correct tint `#EAF6EE` · wrong tint `#FBEDEC` · Not yet `#EEF1F4` · lime `#D9DE62` (business bands only). Type: Inter Tight 300–900; display numerals 300 with −.045em tracking, tabular. Receipt only: IBM Plex Mono. Radii: pills 999 · tiles 14–20 · sheet 28. Desktop grid `340px | 1fr`, gap 48, page padding 48. Phone frame 390×844, hit targets ≥44px.

## Assets
`blobs/*.svg`: the illustration set, never recolored. Roles: Startup = business, persona blobs for customers (Singing, Explore, Golf, Coffee, Magic, Skating), Party/Winner/Target/Thinker for celebrations and empty states. Full inventory in `ASSETS.md`.

## Files
- `STYLE_GUIDE.md`: §0 binding spec for every screen.
- `Component Library.dc.html`: all locked screens live, plus color and type foundations.
- Screen files: `Home Grade Stack`, `Daily Lesson`, `Mission & Grade`, `Unit Quiz`, `Grade Test`, `Rewards`, `Grown-ups`, `Living Business v2` (`.dc.html`).
- Reference only: `Living Business.dc.html`, `My Stand.dc.html`, `Kampus.dc.html` (v1 prototype), `Component Library (legacy).dc.html`, `react/` (v1 components and tokens).
- `brief-v5/BUSINESS_DATA.json`: the engine payloads the business screen was designed against.
- `support.js`: prototype runtime only, not part of the design.
