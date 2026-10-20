# Kampus Business Sim v2 — "The Living Business"

*Design for turning the Lemonade Stand into a persistent business the kid owns, stocks,
and serves — Tamagotchi pull, ADHD-safe consequences, and lessons as the engine of
everything. Companion to KAMPUS_TEACHING_SYSTEM.md Part 8 (the Business Spine).*

## The idea in one line

The kid runs a real (virtual) business — buys inventory with her own Kredits, serves
customers who arrive based on her choices, keeps what she earns — and **the register
doesn't open until today's lesson is done**, because in this world the owner goes to
school.

## The daily loop (~5–8 minutes on top of the lesson)

1. **Lesson first — the enforcement.** Finishing today's lesson unlocks the business
   day. Fiction, not punishment: "Class is out — the stand can open." Skills she just
   learned appear the same afternoon as business moments.
2. **Morning prep (math decisions):** check stock, buy supplies at today's market
   prices (prices drift daily — comparison shopping is a live skill), set price,
   pick a promo if unlocked. Younger band: picture-based restocking. Older band:
   unit-cost math ("lemons $0.60 ea vs. bag of 12 for $6 — which?").
3. **Open day (simulated, ~2 min):** customers arrive against demand (price, weather,
   reputation, marketing gear, pet mascot). A few become **moments** — micro-decisions
   using current or recent skills: make change (G3–4), a 3-cup rush order ratio
   (G5–6), "regular asks for the bulk discount — profitable?" (G7–8). Moments pay
   Kredit bonuses; skipping a moment just auto-resolves it neutrally.
4. **Close & ledger:** the day's P&L, auto-computed but inspectable — and once a week
   the ledger IS the lesson's mixed review (averages, best price, margin trend).

## The living systems

- **Inventory.** Bought with Kredits (lesson earnings are the seed capital — a second,
  economic enforcement of lessons). Supplies are finite and perishable: unsold lemons
  spoil in 3 days for a small, visible loss ("-12 Kredits of lemons — want the
  planning trick?" → links the quantity-planning lesson). Losses are bounded: spoilage
  never exceeds a small fraction of the day's typical profit, and supplies can't go
  negative. No debt exists except the opt-in grade 7–8 startup loan (simple interest,
  itself a unit).
- **Customers.** Lightweight personas (the blob cast: Juan the regular, Delfina who
  only comes on sunny days, the picky reviewer). Regulars form with consistency and
  have memory: serve them well and they bring friends (reputation), raise prices too
  fast and they grumble. Demand = base × price curve × weather × reputation ×
  marketing — every term is a thing she can learn to move, and at grade 7–8 the
  demand curve itself becomes the functions unit, plotted from HER data.
- **Reputation (the Tamagotchi organ — with a floor).** Serving days grow it; closed
  days let it *drift* down slowly ("your regulars tried the park cart"). It never
  hits zero, the business never dies, nothing is ever deleted — the worst state is
  "quiet," and a quiet stand always gets a **comeback arc**: run a 25%-off reopening
  promo (percent lesson), hand out 10 flyers (multiplication moment), reputation
  rebuilds in 2–3 days. Absence costs story, never destroys progress. A vacation
  mode (parent toggle) freezes drift entirely — bad weeks are planned for, not
  punished.
- **Growth ladder** (existing gear names, now real): Starter Kit stand → Big Sign →
  Blender (new product: smoothies, recipe fractions) → Ad Campaign (reach vs. cost) →
  **Cookie Shop** (unlocked G5–6: recipes, batch conversions, oven scheduling) →
  Franchise (second location: comparing two P&Ls) → Empire (G7–8: loan, staff wages,
  combo pricing via systems, scatter of price vs. demand).

## How the business enforces the lessons (the full list)

1. **The register gate:** no lesson, no business day (the single hard rule).
2. **Capability gates:** every business capability maps to a unit's mastery —
   promotions need percent, bulk buying needs unit rates, the loan needs interest,
   the second location needs systems. The unit arcs in Part 8 ARE the tech tree.
3. **Seed capital:** inventory is bought with lesson-earned Kredits.
4. **Moments:** in-day events are the current unit's skills with her numbers.
5. **Ledger-as-review:** the weekly ledger session is spaced review in disguise.
6. **Struggle links:** business pain points name the lesson that fixes them ("you
   sold out by noon again — the planning lesson is 4 minutes").
7. **Capstone week:** each grade test pairs with running a profitable week using
   that year's math.

## ADHD guardrails (non-negotiable)

Day-granularity only (no real-time clock anxiety, nothing happens at 3am). Consequences
bounded, recoverable, and framed as story. No permadeath, no decay below the floor,
no red-alert badges. The pull is warmth (regulars miss you) not fear. Vacation mode
exists. The lesson stays short; the business layer is capped at ~8 minutes and the
day auto-closes gracefully if she walks away.

## Build sequence (slots into Part 7)

A. Business state v2 (inventory, reputation, personas, market prices) in the engine as
   pure tick functions — fully testable. B. Prep/open/close screens (Claude Design has
   My Stand in the brief; this extends it). C. Moments engine (reuses QuizRound
   single-question mode). D. Capability gates wired to unit mastery. E. Cookie Shop +
   G7–8 mechanics (loan, staff, franchise). Dependencies: review engine + lesson
   runner first; the sim reads lesson state everywhere.
