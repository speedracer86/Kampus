# Kampus Play System — Part 10 of the Teaching System (binding addendum)

*Owner-approved direction, Oct 2026. This amends KAMPUS_TEACHING_SYSTEM.md Parts 2–8,
KAMPUS_BUSINESS_SIM.md, and design-incoming/BUSINESS_CLEANUP.md. Where they conflict,
this document wins. §0 visuals are untouched. The ADHD laws are untouched and every
mechanic below must pass them: untimed by default, no punitive mechanics, no streak
guilt, nothing dies, absence is never punished.*

**The thesis in one line:** every other app makes math a chore between rewards —
Kampus gives her a business, and the math is how she runs it. The kid-facing word is
never "business"; it is **yours**. Your stand, your regulars, your money, your call.

---

## 1. The Snag — every lesson now opens with the problem, not the idea

Amends the five-move lesson (Part 2). A new 30-second beat opens move 2, BEFORE the
teach panel: a staged scene where a problem from her world arrives that she visibly
cannot solve with her current tools. One attempt allowed, zero penalty, no pay, then:
"You don't have the move for this one yet. Here it is." — and the existing teach-first
lesson proceeds unchanged. The evidence base (explicit instruction, worked examples)
stays fully intact; the Snag only installs the *need* first.

Rules for writing a Snag: it must be a problem her world plausibly has today; it must
be unsolvable with her current toolkit (not merely hard); it must resolve into the
lesson's named strategy; it reuses the Question component with a `snag: true` variant
(muted pay row, "no pay, just a look" kicker).

Per-band style: band a = a concrete freeze at the register ("they gave you $5 for two
$1.50 cups — now what?"); band b = a stocking/pricing choice she can't justify yet;
band c = a Karla scene with a strategic stake (the park cart's sale, a bulk-order
offer, a loan term). One Snag per unit, ~42 total; grade 6 and 7 first (user #1), then
3→8. Snags live in the curriculum package as data (`snags.js`: unit → {scene, q,
band}), tested like generators.

## 2. The three-source rule — where every question must come from

Every generator and every authored question declares exactly one source tag:

- **world** — generated from live state she owns (her prices, her ledger, her stock,
  today's weather). The `makeMoment` pattern. The crown jewel; grow it.
- **life** — her actual day, entered by her or a parent (field assignments, §7).
- **gym** — clean abstraction taught proudly as itself. No story, no costume. Fluency,
  number lines, pattern play. Copy voice: "pure tool — you'll feel where it bites."

**Banned: the costume** — fictional third-person characters with arbitrary numbers
("a store offers 20% off", "Maria has 30 lemons"). That is the train leaving Chicago.
Engine work: add `source: 'world'|'life'|'gym'` to the generator contract; audit the
existing library — strip fake stories from salvageable generators (they become gym),
and convert the best percent/ratio/stats generators to world by feeding them `biz`
state (her revenue, her ledger rows, her price history). A coverage test asserts no
generator ships untagged.

## 3. Ownership — the kid picks and names the business

The single highest-leverage relatability change. At onboarding (and changeable later in
Grown-ups), the kid picks a business type and names it. The type is a *skin she chose*
over the same engine — chosen + load-bearing is the opposite of a fake theme.

Band menu (same math, different nouns; types unlock by band, earlier ones stay):
- **a (3–4):** Lemonade Stand · Cookie Stand · Sticker Stand
- **b (5–6):** + Bake Shop · Craft Stand (bracelets/slime) · Pet-Care Crew *(service)*
- **c (7–8):** + Resale Shop (cards/sneakers: buy low, sell high — integer gains and
  losses) · Digital Shop (stickers/designs: zero marginal cost — pure margin math) ·
  any service with an hourly rate (rate problems, scheduling)

Engine: `BUSINESS_TYPES` table — `{kind: 'goods'|'service'|'resale'|'digital', recipe,
basePrices, unit nouns, persona flavor, momentSkills}`. Services replace
inventory/spoilage with bookings and hours (capacity math); resale replaces recipe with
buy/sell spread. `freshBiz(grade, typeId, name)`. Moments draw from the type's noun
set; the math objectives per band are identical across types — a coverage test asserts
it. Build goods first (exists), then service, then resale/digital.

## 4. The tycoon loops — the addictiveness architecture, ADHD-safe

Four interlocking loops, each with a deliberate cadence. The pull must always be
ownership and curiosity ("what happened at my stand?"), never loss-anxiety or timers.

- **Care loop (daily):** the overnight tick already exists. Make it *visible*: opening
  the app leads with a "while you were away" feed (prices drifted, Delfina came by,
  lemons aging) — 2–3 lines max, warm, then today's lesson. Reason to return that is
  not a streak. (No streak flames anywhere, ever. The five-day streak pays quietly in
  the rewards ledger; it is never displayed as a chain that can break.)
- **Earn loop (per session):** payout pills per answer (exists). Add the register
  *juice*: a short count-up on money values, one soft cha-ching on a day's close, calm
  confetti per §0 motion rules. Juice is reserved for earning and building moments
  only — never idle, never nagging.
- **Growth loop (weekly):** the ladder (exists) becomes *visible build-out* — each
  rung upgrades the stand's picture (Starter Kit → Big Sign → Blender → …). The kid
  watches her base grow, Roblox-tycoon style. Rungs stay skill-gated ("needs percents
  Solid"), so growth is literally made of mastery. Design round needed: stand
  visual states per rung + per type (ask Claude Design; blobs pack covers some).
- **Collection loop (slow):** gear and recipes become a visible collection — cards
  earned deterministically by mastery and ladder progress. NO loot boxes, NO
  randomized rewards, ever: a collection you earn is a trophy case; a gacha is a slot
  machine. **Trading exists but only with NPCs:** Karla's market posts swap offers
  ("10 lemons for 8 sugar — good deal?") — trading *is* ratio curriculum. No
  kid-to-kid trading or any multiplayer economy: COPPA, moderation and scam-pattern
  surface we will not carry. Decision is final until a dedicated safety review.
- **Season loop (live-ops, the retention calendar):** four in-world seasons per year.
  Demand shifts with them (heat wave = lemonade boom; holidays = cookie orders),
  seasonal special orders arrive as world-problems ("the fair wants 60 cups Friday —
  can you make them in time?"), and one **Fair** per term is the in-world event that
  Market Day (§7) attaches to. Seasons change opportunities, never punish absence; a
  missed season simply comes around again. This is the lever that keeps month six
  alive, and it is content, not code: a seasons table the engine reads.

## 5. Quizzes and tests — framing only, mechanics unchanged

Verdicts (Solid/Shaky/Not yet), free retakes, repair plans, no percentages: all
unchanged. Reframe inside the world: the unit quiz day is **Inspection Day** (stand
closed for the morning, fixed $1.00 for taking it — exists); passing the grade test is
the **License** that builds the campus district and unlocks the next grade's ladder
rungs. Test stakes must never touch the business negatively: failing an inspection
never closes the stand, costs reputation, or takes anything away — it only produces
the repair plan. The business is the reason to master skills, never the hostage.

## 6. Home screen framing

Home already leads with Today's Lesson (correct — class first, then the register).
Add the care-loop feed line under the greeting (one sentence: "Overnight: lemon prices
dropped 5¢ and Tom came by.") and make the stand band show the stand's current
build-out thumbnail, so the growth loop is felt on every open.

## 7. The real-world bridge

- **Field assignments (weekly, one, optional):** a real-numbers mission with the
  parent — count the change jar (band a), double the actual recipe (band a/b), find
  the cheaper per-unit bag at the store (band b), compute the real trip's gas cost
  (band c). Parent enters 2–3 numbers or snaps a receipt; the math runs on her actual
  Tuesday; pays normal effort dollars. Thin feature, huge differentiation.
- **Market Day (once or twice a term, opt-in, parent-gated):** the Fair made real.
  Prep in app (scale the real recipe, shop and photo the receipt → real unit costs,
  set price with margin math, build the cash float), sell at the driveway/church/
  co-op, close the books in app — and her real P&L renders beside her virtual days in
  the same ledger. Per-band roles so siblings share one event: band a runs the
  register (change-making), band b made the batches (recipe/unit math), band c did
  costing and pricing (margin). Never framed as superior to the virtual stand; some
  kids will never want it and lose nothing. Real cash proceeds are the family's
  domain — the app pays only its normal effort dollars for the math. Printable
  Market Day kit (price tags, ledger sheet, float worksheet) doubles as marketing.

## 8. What the owner's list missed (gaps this doc adds or flags)

1. **Sound and juice** — tycoon stickiness is partly audio/motion. Needs a §0-level
   spec (one register sound, count-ups, calm confetti; mute switch in Grown-ups).
2. **The retention calendar** — seasons/Fairs (§4) are the month-six answer; without
   live-ops cadence the economy wears off. Content pipeline, not engineering.
3. **Siblings** — multi-kid families are the buyer. Profiles exist in the schema;
   add family-visible (never public) stats: a shared fridge-door screen in Grown-ups,
   no rankings between kids, ever.
4. **No kid-to-kid anything** — stated as a decision (§4), not an omission.
5. **Placement diagnostic** — still undesigned and now load-bearing (onboarding
   offers it). Next design round after onboarding.
6. **Accessibility pass** — dyscalculia-aware numerals (tabular already per §0),
   read-aloud everywhere (exists as "Read it to me" — make it universal), reduced-
   motion setting that disables all juice.
7. **Content audit** — the costume ban (§2) applies retroactively; schedule the
   generator audit as its own commit.
8. **Measurement** — define now, before pilot: D7/D30 return, lessons completed per
   week, Snag→lesson completion rate, stand-open rate, quiz retake rate. The events
   table (docs/DEPLOYMENT.md) already captures the raw stream; add a tiny weekly
   rollup for the pilot report.

## 9. Build order (amends design-incoming/START_HERE.md step 9 onward)

1. Generator `source` tags + costume audit (engine, mechanical).
2. Snag beat in the lesson runner + `snags.js` for grades 6–7.
3. `BUSINESS_TYPES` + choose/name flow (goods types first; service math next).
4. Care-loop feed + Home stand thumbnail.
5. Ladder build-out visuals + collection shelf (needs a Claude Design round:
   stand states per rung/type, collection cards, season banners — brief these with
   the onboarding round's deliverable conventions).
6. Seasons table + first season's special orders.
7. Field assignments (thin slice: manual number entry first, receipts later).
8. Market Day flow + printable kit.

Everything gated as always: `npm test && npm run build`, CHANGES.md entries,
screenshots per screen. The ADHD laws and the §5 rule (tests never hurt the business)
are invariants — write tests for them where the engine can enforce them.
