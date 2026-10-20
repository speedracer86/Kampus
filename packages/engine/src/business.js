/* The Living Business — Tamagotchi logic with ADHD-safe bounds, as pure tick
   functions (see docs/KAMPUS_BUSINESS_SIM.md). The caller owns all state and
   passes time as day strings; nothing here reads the clock or the DOM.

   The pull: perishable inventory, market prices that drift, regulars who
   remember you, reputation that fades when the stand stays closed.
   The bounds: reputation has a floor and a vacation freeze, spoilage is
   capped per day, nothing dies, and every setback names its comeback.

   Capabilities switch on by grade band — each system arrives in the grade
   whose math it runs on (ownership 3-4, inventory 5, memory 6, company 7-8). */

export const RECIPE = { lemons: 1, sugar: 1, cups: 1 };          // per drink
export const BASE_PRICES = { lemons: 0.5, sugar: 0.3, cups: 0.2 };
export const LEMON_SHELF_DAYS = 3;
export const REP_START = 50, REP_FLOOR = 10, REP_MAX = 100;
export const REP_GRACE_DAYS = 2;                                  // closed days before drift
export const SPOIL_CAP_PER_DAY = 8;                               // lemons max spoiled/day — bounded loss
export const DEMAND_BASE = { 1: 36, 2: 22, 3: 12, 4: 6 };

export const PERSONAS = [
  { id: 'juan', name: 'Juan', blob: 'Selfie' },
  { id: 'delfina', name: 'Delfina', blob: 'Singing', sunnyOnly: true },
  { id: 'tom', name: 'Tom', blob: 'Golf' },
  { id: 'ava', name: 'Ava', blob: 'Skating' },
  { id: 'leo', name: 'Leo', blob: 'Explore' },
];

/** Which living systems are on for a grade band ('a' 3-4 · 'b' 5-6 · 'c' 7-8). */
export function capabilities(band) {
  return {
    inventory: band !== 'a',      // 3-4: pre-stocked kit, nothing runs out or spoils
    spoilage: band !== 'a',
    memory: band !== 'a',         // regulars remember you from the 5-6 band up
    reputation: band !== 'a',
    repDrift: band === 'c',       // only the 7-8 company feels absence
    promos: band === 'c',
    loan: band === 'c',
  };
}

export const bandOf = g => (g <= 4 ? 'a' : g <= 6 ? 'b' : 'c');

export function freshBiz(grade = 6) {
  return {
    band: bandOf(grade),
    price: 2,
    lots: [],                       // lemons: [{qty, boughtDay}] — lots make spoilage computable
    sugar: 0, cups: 0,
    marketPrices: { ...BASE_PRICES },
    reputation: REP_START,
    regulars: PERSONAS.slice(0, 3).map(p => ({ id: p.id, affinity: 50 })),
    lastOpenDay: '', lastTickDay: '',
    vacation: false,
    ledger: [],                     // [{day, served, missed, revenue, cost, profit}]
    events: [],                     // narrative feed, newest first
  };
}

export const lemonCount = biz => biz.lots.reduce((s, l) => s + l.qty, 0);
const dayNum = d => Math.floor(Date.parse(d + 'T12:00:00Z') / 86400000);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/* ---------- the daily tick (run once per real day, open or not) ---------- */

/**
 * Advance the world to `today`: market drift, spoilage, reputation drift.
 * Pure; returns {biz, events}. Safe to call repeatedly (no-ops on same day).
 */
export function dailyTick(biz, today, random = Math.random) {
  if (biz.lastTickDay === today) return { biz, events: [] };
  const caps = capabilities(biz.band);
  const events = [];
  const next = { ...biz, lastTickDay: today, lots: biz.lots.map(l => ({ ...l })), marketPrices: { ...biz.marketPrices } };

  // market drift: ±10%/day, bounded to [0.6x, 1.6x] of base
  for (const k of Object.keys(BASE_PRICES)) {
    const drifted = next.marketPrices[k] * (1 + (random() - 0.5) * 0.2);
    next.marketPrices[k] = Math.round(clamp(drifted, BASE_PRICES[k] * 0.6, BASE_PRICES[k] * 1.6) * 100) / 100;
  }

  // spoilage: lemons past shelf life, capped per day so a setback is a lesson, not a wipeout
  if (caps.spoilage) {
    let spoiled = 0;
    next.lots = next.lots.filter(lot => {
      if (dayNum(today) - dayNum(lot.boughtDay) > LEMON_SHELF_DAYS && spoiled < SPOIL_CAP_PER_DAY) {
        const n = Math.min(lot.qty, SPOIL_CAP_PER_DAY - spoiled);
        spoiled += n; lot.qty -= n;
        return lot.qty > 0;
      }
      return lot.qty > 0;
    });
    if (spoiled > 0) events.push({ type: 'spoilage', qty: spoiled, lesson: 'planning',
      text: `${spoiled} lemons went soft — want the quantity-planning trick?` });
  }

  // reputation drift: only after grace days closed, only for band c, never below floor, frozen on vacation
  if (caps.repDrift && !next.vacation && next.lastOpenDay) {
    const closedFor = dayNum(today) - dayNum(next.lastOpenDay);
    if (closedFor > REP_GRACE_DAYS && next.reputation > REP_FLOOR) {
      next.reputation = Math.max(REP_FLOOR, next.reputation - 1);
      if (next.reputation <= 35 && biz.reputation > 35) events.push({ type: 'quiet', lesson: 'percent',
        text: 'The stand has gone quiet — your regulars tried the park cart. A comeback promo would bring them back.' });
    }
  }

  next.events = [...events, ...biz.events].slice(0, 20);
  return { biz: next, events };
}

/* ---------- buying inventory (the seed-capital loop) ---------- */

/** Buy supplies at today's market prices. Returns {biz, cost} or {error}. */
export function buySupplies(biz, order, today, kredits) {
  const { lemons = 0, sugar = 0, cups = 0 } = order;
  const p = biz.marketPrices;
  const cost = Math.round((lemons * p.lemons + sugar * p.sugar + cups * p.cups) * 100) / 100;
  if (cost > kredits) return { error: 'not_enough_kredits', cost };
  const next = { ...biz, sugar: biz.sugar + sugar, cups: biz.cups + cups,
    lots: lemons > 0 ? [...biz.lots, { qty: lemons, boughtDay: today }] : biz.lots };
  return { biz: next, cost };
}

/* ---------- the customer queue (the game) ---------- */

/**
 * Generate the day's queue: persona customers waiting to buy, oldest regulars
 * first when loyal. Demand = price curve × weather × reputation × marketing.
 * Returns [{persona, name, blob, order, isRegular, moment?}] — the UI animates
 * this as a line at the stand; moments are the math micro-decisions.
 */
export function customersForDay(biz, { forecast = 'sunny', marketingPct = 0, grade = 6 } = {}, random = Math.random) {
  const caps = capabilities(biz.band);
  const base = DEMAND_BASE[clamp(Math.round(biz.price), 1, 4)] ?? 6;
  const weather = forecast === 'sunny' ? 1.2 : 0.8;
  const rep = caps.reputation ? 0.6 + (biz.reputation / REP_MAX) * 0.8 : 1;
  const count = Math.max(2, Math.round(base * weather * rep * (1 + marketingPct / 100)));

  const queue = [];
  const regularIds = new Set(biz.regulars.filter(r => r.affinity >= 40).map(r => r.id));
  for (let i = 0; i < count; i++) {
    const persona = PERSONAS[Math.floor(random() * PERSONAS.length)];
    if (persona.sunnyOnly && forecast !== 'sunny') { queue.push(anon(random)); continue; }
    const isRegular = caps.memory !== false && regularIds.has(persona.id) && random() < 0.6;
    queue.push({ persona: persona.id, name: persona.name, blob: persona.blob,
      order: { cups: 1 + (random() < 0.25 ? 1 : 0) + (random() < 0.08 ? 1 : 0) }, isRegular });
  }
  // sprinkle up to 3 math moments through the line (never the first customer — let her settle in)
  const momentCount = Math.min(3, Math.max(1, Math.floor(count / 8)));
  const slots = new Set();
  while (slots.size < momentCount && queue.length > 1) slots.add(1 + Math.floor(random() * (queue.length - 1)));
  for (const s of slots) queue[s].moment = makeMoment(biz, queue[s], grade, random);
  return queue;
}
const anon = (random) => ({ persona: 'visitor', name: 'Visitor', blob: 'Networking',
  order: { cups: 1 + (random() < 0.25 ? 1 : 0) }, isRegular: false });

/* ---------- moments: the math the queue asks for ---------- */

/** A playable Q-shaped question generated from live sim state, banded by grade. */
export function makeMoment(biz, customer, grade = 6, random = Math.random) {
  const band = bandOf(grade);
  const cups = customer.order.cups;
  const price = biz.price;
  if (band === 'a') {
    // make change: total owed vs paid
    const total = cups * price;
    const paid = total < 5 ? 5 : 10;
    const ans = paid - total;
    return q(`${customer.name} buys ${cups} cup${cups > 1 ? 's' : ''} at $${price} and pays with $${paid}. Change?`,
      `$${ans}`, [`$${ans + 1}`, `$${Math.max(0, ans - 1)}`, `$${paid - cups}`], 'Making change', [
        `First find what they owe: ${cups} × $${price} = $${total}.`,
        `Count up from $${total} to $${paid}: change is <b>$${ans}</b>.`]);
  }
  if (band === 'b') {
    // unit price: bag vs each, using today's market
    const each = biz.marketPrices.lemons;
    const bagQty = 12, bagCost = Math.round(each * bagQty * 0.85 * 100) / 100;
    const bagEach = Math.round(bagCost / bagQty * 100) / 100;
    return q(`Restock time: lemons are $${each.toFixed(2)} each, or a bag of ${bagQty} for $${bagCost.toFixed(2)}. Which is cheaper per lemon?`,
      `the bag ($${bagEach.toFixed(2)} each)`, [`single lemons`, `they're the same`], 'Unit price', [
        `Unit price = bag cost ÷ how many: $${bagCost.toFixed(2)} ÷ ${bagQty} = $${bagEach.toFixed(2)}.`,
        `$${bagEach.toFixed(2)} < $${each.toFixed(2)}, so <b>the bag</b> wins.`]);
  }
  // band c: is the regular's bulk-discount ask still profitable?
  const unitCost = Math.round((biz.marketPrices.lemons + biz.marketPrices.sugar + biz.marketPrices.cups) * 100) / 100;
  const discPct = 25;
  const discPrice = Math.round(price * (1 - discPct / 100) * 100) / 100;
  const stillProfit = discPrice > unitCost;
  return q(`${customer.name} asks for ${discPct}% off a big order. Your cost per cup is $${unitCost.toFixed(2)}, price $${price.toFixed(2)}. Still profitable?`,
    stillProfit ? `yes — $${(discPrice - unitCost).toFixed(2)}/cup` : `no — you'd lose $${(unitCost - discPrice).toFixed(2)}/cup`,
    [stillProfit ? `no — you'd lose money` : `yes — easily`, `can't tell without more info`], 'Margin after discount', [
      `Discounted price: $${price.toFixed(2)} × ${(100 - discPct) / 100} = $${discPrice.toFixed(2)}.`,
      `Compare to cost $${unitCost.toFixed(2)}: margin is <b>$${(discPrice - unitCost).toFixed(2)}</b> per cup${stillProfit ? ' — deal.' : ' — counter-offer.'}`]);
}
const q = (text, ans, wrongs, skill, steps) => ({ prompt: 'Business moment', q: text, ans: String(ans),
  wrongs: wrongs.map(String), skill, steps, moment: true });

/* ---------- opening and closing a day ---------- */

/**
 * Simulate an opened day against a queue (moments already resolved by the UI).
 * Consumes inventory in lot order; missed customers when stock runs out.
 */
export function openDay(biz, queue, today) {
  const caps = capabilities(biz.band);
  let served = 0, missed = 0, cupsSold = 0;
  const next = { ...biz, lots: biz.lots.map(l => ({ ...l })) };
  for (const c of queue) {
    const want = c.order.cups;
    const canServe = !caps.inventory || (lemonCount(next) >= want * RECIPE.lemons && next.sugar >= want * RECIPE.sugar && next.cups >= want * RECIPE.cups);
    if (canServe) {
      if (caps.inventory) {
        let need = want * RECIPE.lemons;
        for (const lot of next.lots) { const take = Math.min(lot.qty, need); lot.qty -= take; need -= take; }
        next.lots = next.lots.filter(l => l.qty > 0);
        next.sugar -= want * RECIPE.sugar; next.cups -= want * RECIPE.cups;
      }
      served++; cupsSold += want;
    } else missed++;
  }
  const revenue = Math.round(cupsSold * biz.price * 100) / 100;
  const unitCost = Math.round((biz.marketPrices.lemons + biz.marketPrices.sugar + biz.marketPrices.cups) * 100) / 100;
  const cost = caps.inventory ? Math.round(cupsSold * unitCost * 100) / 100 : 0;
  const result = { day: today, served, missed, cupsSold, revenue, cost, profit: Math.round((revenue - cost) * 100) / 100 };
  return { biz: closeDay(next, result, today), result };
}

/** Ledger, reputation gain, regular memory. Pure. */
export function closeDay(biz, result, today) {
  const caps = capabilities(biz.band);
  const next = { ...biz, lastOpenDay: today, ledger: [...biz.ledger, result].slice(-30) };
  if (caps.reputation) {
    const ratio = result.served / Math.max(1, result.served + result.missed);
    next.reputation = clamp(Math.round(next.reputation + 2 + 4 * ratio - (result.missed > 0 ? 2 : 0)), REP_FLOOR, REP_MAX);
    next.regulars = next.regulars.map(r => ({ ...r, affinity: clamp(r.affinity + (result.missed > 0 ? -2 : 3), 10, 100) }));
  }
  return next;
}

/** The comeback: available when quiet; running it is a percent lesson in disguise. */
export function comebackPromo(biz) {
  if (biz.reputation > 40) return null;
  return { discountPct: 25, days: 2, repBoostPerDay: 8,
    pitch: 'Reopening sale: 25% off for two days. Flyers out, regulars return.' };
}
