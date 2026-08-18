# Kampus Build Plan — Pilot Edition

*From single-file family app → multi-family product for homeschool parents and tutors. Scope decided: 5–10 family pilot, best-fit infrastructure (cost OK), React component library incoming.*

---

## 1. What we're building, in one paragraph

Kampus today is one HTML file with progress trapped in one browser. The pilot needs: a parent who signs up, adds two kids, sees each kid's placement and progress from her own phone, defines each kid's reward menu, and gets a weekly standards-mapped report she can drop into her homeschool portfolio — while each kid logs in on any device (PIN, not email), lands on *their* grade, and their practice syncs. The curriculum expands to genuinely cover each grade's major work, every question wrapped in a real-world story, and the reward economy pays for effort (inputs), not scores. A tutor role comes right after the pilot proves out.

---

## 2. Architecture

**Frontend — React + TypeScript + Vite.** Rebuilt with your component library when you hand it over. The game engine (generators, adaptive tiers, teach steps, economy math) ports as pure TypeScript modules with zero UI dependencies — it's already effectively pure functions, which is why the whole thing is testable headlessly today. The engine port is *not* blocked on the component library; the UI rebuild is.

**Backend — Supabase** (Postgres + Auth + Row-Level Security + Realtime). Chosen over Firebase because the product's core promise to homeschool parents is *reporting* — "show me mastery against grade-level standards over time" — and that's relational query territory where Postgres wins outright. Free tier comfortably covers a 10-family pilot; the paid tier ($25/mo) is the growth path, no migration. Auth handles parent email/password + OAuth; kids get PIN-based profile logins under the parent account (see Privacy).

**Offline-first sync.** Homeschool practice happens in cars and co-ops. The app keeps working offline exactly as it does today (local cache is the source of truth during a session), with an append-only sync queue that pushes attempt events when connectivity returns. Conflict policy is trivial by design: attempts are immutable events, and derived state (mastery, balances) is recomputed server-side from the event log — no merge conflicts possible.

**Hosting — Vercel** for the app (preview deploys per branch, which matters once parents are testing), keep GitHub Pages as the marketing/landing page. Custom domain applies to either.

---

## 3. Data model (Postgres)

**Identity & access:** `families` → `guardians` (parent auth users, role: parent/tutor-later) → `students` (no email, display name + avatar + PIN hash, grade placement). Row-Level Security: a guardian sees only their family's rows; a student session sees only its own.

**Curriculum (the big shift — curriculum becomes data, not code):**
- `skills` — the atomic unit. Each has: CCSS code(s) (e.g., `4.NF.B.4`), grade, world, tier, generator id + params, teach-script template, real-world wrap templates, CRA visual type (numberline / fracbar / areagrid / cubestack / graph / none).
- `curriculum_versions` — versioned JSON snapshots so a curriculum edit never silently changes a kid's history mid-week.
- Generators stay code (pure TS, they're algorithmic), but *which* generators, at what params, in what sequence, with what wraps = data. This is what lets you tune lessons without redeploying, and later lets tutors assign specific skills.

**Learning events (append-only):** `attempts` (student, skill, tier, question payload hash, answer, correct, ms, teach_used, second_look), `sessions` (rollups), `placements` (diagnostic results). Everything a dashboard shows derives from `attempts`.

**Mastery:** `skill_mastery` materialized per student per skill — rolling accuracy, tier reached, last-seen, spaced-review due date. Simple mastery model to start (current 5-of-6 adaptive logic, plus decay: a skill unseen for 3+ weeks gets resurfaced — retrieval spacing is free learning science).

**Economy:** `kredit_ledger` and `ticket_ledger` (append-only, reason-coded — this is what makes "inputs only" auditable), `reward_menus` (per student), `redemptions` (requested → approved → given), `stand_ledger`, `weekly_goals` (student-set, per the engagement plan).

**Settings:** per-student session length, focus mode, voice, sound; per-family weekly ticket cap.

---

## 4. Curriculum build-out (the content work)

This executes the gap analysis from the Curriculum & Engagement Plan, now as a concrete skill inventory:

1. **Skill taxonomy pass** — map every existing generator to CCSS codes and re-sequence tiers so each grade's majority of skills sits in that grade's *major work*. Current inventory: ~60 generators; target after build-out: ~95.
2. **New skills by grade:** G3 area-as-multiplication + two-step word problems; G4 decimal notation/comparison + multiplicative comparison; G5 decimal division + unit-fraction division + volume; G6 mean/median (Stand-fed); G7 tax/tip/discount/markup/simple interest + probability (Stand forecast-fed); G8 functions (evaluate/compare/model) + simple systems + Pythagorean.
3. **Context wraps** — every skill gets 3–6 story templates using its world's identity (money, weather, food, games, her stand's own data), with a "just the math" toggle. Existing bare-computation generators keep working; wraps are a presentation layer over them.
4. **Placement diagnostic** — the homeschool killer feature. A ~15-minute adaptive check that starts at claimed grade, steps down on misses across strands, and outputs: starting grade per world (Kampus already tracks tiers per-world per-grade, so a kid can be G6 in ratios and G4 in fractions — that *asymmetric placement* is precisely what homeschool parents can't get from a workbook), plus a plain-English report.
5. **Reward-economy rework** — inputs-only tickets, Scholar bonus replaces the teach-me penalty, student-set weekly goals, parent "high-five" social reward, mystery bonus. All ledgered with reason codes.

---

## 5. Catered to homeschool parents & tutoring

**The standards report is the product *and* the distribution strategy.** Many states require homeschool families to document progress (portfolios, assessments, instructor reports). A one-click, printable "Term Report: skills practiced, mastery by CCSS strand, time on task, grade-level progression" turns Kampus from a game into *evidence* — and evidence is what gets shared in co-op meetings and homeschool Facebook groups. A strong product with no channel loses to a mediocre one with a channel; this report is the channel. Same artifact doubles as the tutor's session prep sheet.

**Parent features (pilot):** multi-kid dashboard from any device; weekly email digest (practice days, skills advanced, tickets earned, one suggested focus); assignment mode ("this week: fractions and the stand") that gently shapes the kid's home screen without removing choice; per-kid reward menus and caps; placement report; term report export (PDF).

**Tutor role (phase 6, post-pilot):** a guardian-type account linkable to students across families, with assign + notes + multi-student dashboard. The data model above supports it from day one (that's why `guardians` isn't called `parents`), so it's an access-control feature later, not a rebuild.

**Privacy (non-negotiable, and a selling point):** COPPA-conscious by construction — children never provide email or any PII (name/avatar/PIN only, created by the parent), all child data lives under the parent's account and is exportable/deletable in one action, no ads, no third-party analytics on child sessions. For homeschool parents this is a first-paragraph marketing claim, not fine print.

---

## 6. Phases

**Phase 0 — Foundation (no design dependency).** Restructure repo to a Vite + React + TS monorepo: `packages/engine` (generators, adaptive, economy — pure TS + the existing Playwright suite ported to Vitest for logic and Playwright for E2E), `packages/curriculum` (skill data + CCSS map), `apps/web`. CI on GitHub Actions. The current single-file app stays live and untouched during this phase — your stepdaughter keeps playing while we rebuild underneath.

**Phase 1 — Curriculum expansion** in `packages/curriculum` + `engine`: the ~35 new skills, wraps, placement diagnostic. Fully testable headlessly before any UI exists.

**Phase 2 — Backend.** Supabase project, schema + RLS, auth (parent), student PIN profiles, sync queue, importer that migrates an existing localStorage save into an account on first sign-in.

**Phase 3 — Kid app rebuild** in React with your component library. Same 10 screens, same Kampus design tokens, plus placement flow, weekly goal, assignment surfacing.

**Phase 4 — Parent app.** Dashboard, reports, digest, reward admin, assignments.

**Phase 5 — Pilot ops.** Invite codes for the 5–10 families, feedback capture in-app (parent side), a simple metrics view for you (activation, weekly-active kids, sessions/kid/week), custom domain go-live.

**Phase 6 — Tutor role** (post-pilot, scoped by what pilots actually ask for).

Sequencing honesty: 0→1→2 can start immediately and don't need the component library. Phase 3 waits on it. If the library arrives late, nothing stalls — the backend and curriculum are the long poles anyway.

---

## 7. Cowork vs Claude Code — direct answer

I can build all of this right here — I've been writing and testing the code for this project in this session all along, and phases 0–2 are exactly that kind of work. The one real friction in this environment is GitHub: this session's connector can't push to the repo (we worked around it via your browser, which is fine for occasional commits but too clunky for daily development). Two clean fixes, pick either:

- **Stay here (recommended for now):** create a fine-grained GitHub token scoped to just the Kampus repo (github.com → Settings → Developer settings → Fine-grained tokens → only `speedracer86/Kampus`, Contents: read/write). Paste it in chat and I push normally from this workspace. You keep one continuous collaborator who has the full project context, and you can hand me the component library as a zip right in this conversation.
- **Claude Code locally:** best if *you* want to run the dev server, see changes live, and review diffs on your own machine. Clone the repo, run `claude` in it. The tradeoff is that a fresh Claude Code session starts without this conversation's context — the repo's docs (this plan, the curriculum plan, the style guide) are written to be that context, so keep them current and the handoff cost stays low.

They're not exclusive: build the foundation here, use Claude Code locally when you want hands-on iteration. What I'd avoid is bouncing a half-finished phase between environments.

---

## 8. Risks worth naming now

**Scope risk is the big one.** This plan is roughly 5–6 phases of real work, and the pilot date slips if we gold-plate. The discipline: phases 0–2 build no UI polish at all, and Phase 3 reuses the game you already have rather than reinventing interactions. **Second:** an offline-first sync layer is the most bug-prone component in this class of app — the append-only event design exists specifically to de-risk it, so resist any future feature that requires mutable shared state. **Third:** your stepdaughter is still user #1 — if pilot-facing work ever degrades her daily experience (regressions, moved cheese), we've inverted the priorities; her build stays stable on the current file until Phase 3 is demonstrably better. **Fourth:** curriculum credibility — before pilot launch, have your wife (the practicing homeschooler) review the skill map against what she actually teaches; CCSS alignment is necessary but a real homeschool parent's read is the validation that matters.
