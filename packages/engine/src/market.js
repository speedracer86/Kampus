/* Karla's market — NPC trading (PLAY_SYSTEM §4, "Collection loop").

   Two decisions are already made and are not re-litigated here:

     1. **NPCs only.** No kid-to-kid trading and no multiplayer economy, ever —
        COPPA, moderation, and the scam-pattern surface. Every counterparty in this
        module is Karla or another persona; nothing accepts a player id.
     2. **No randomised rewards.** Offers are generated deterministically from live
        market prices. A collection you earn is a trophy case; a gacha is a slot
        machine, and the difference is whether the kid can predict the outcome.

   The teaching claim: accepting or declining a swap IS a ratio question. The offer
   carries the question with it, so the decision and the maths are the same act. */
import { BASE_PRICES } from './business.js';

/** What a pile of goods is worth at today's prices. */
export function valueOf(bundle = {}, prices = BASE_PRICES) {
  return Math.round(Object.entries(bundle)
    .reduce((sum, [k, qty]) => sum + qty * (prices[k] ?? 0), 0) * 100) / 100;
}

/**
 * A swap offer, built from her actual prices.
 * `fair` is the truth of the trade; the kid's job is to work it out before answering.
 */
export function makeOffer(biz, { give, want, from = 'karla', seed = 0 } = {}) {
  const prices = biz?.marketPrices || BASE_PRICES;
  const giveValue = valueOf(give, prices);
  const wantValue = valueOf(want, prices);
  const diff = Math.round((giveValue - wantValue) * 100) / 100;
  const label = (b) => Object.entries(b).map(([k, v]) => `${v} ${k}`).join(' and ');
  return {
    id: `swap-${from}-${seed}`,
    from,
    give, want, giveValue, wantValue,
    // A good deal for her = she receives more value than she hands over.
    good: diff < 0,
    even: diff === 0,
    text: `${label(want)} for ${label(give)} — good deal?`,
    // The decision and the ratio question are the same act.
    question: {
      text: `You'd hand over ${label(give)} and get ${label(want)}. At today's prices, which side is worth more?`,
      answers: ['What I give', 'What I get', 'They are even'],
      correct: diff > 0 ? 0 : diff < 0 ? 1 : 2,
      hint: `Price each side: ${label(give)} is $${giveValue.toFixed(2)}, ${label(want)} is $${wantValue.toFixed(2)}.`,
    },
  };
}

/**
 * Today's posts. Deterministic for a given day and price sheet — the same morning
 * always shows the same board, so a kid can think about an offer and come back to it.
 */
export function marketPosts(biz, dayIndex = 0) {
  const specs = [
    { give: { lemons: 10 }, want: { sugar: 8 } },
    { give: { sugar: 6 }, want: { cups: 10 } },
    { give: { cups: 12 }, want: { lemons: 6 } },
  ];
  const pick = (i) => specs[(dayIndex + i) % specs.length];
  return [0, 1].map(i => makeOffer(biz, { ...pick(i), seed: dayIndex * 10 + i }));
}

/**
 * Settle an accepted swap against her stock. Pure, and it refuses rather than going
 * negative: a trade she cannot cover simply does not happen.
 */
export function settleOffer(biz, offer) {
  const have = { lemons: (biz.lots || []).reduce((s, l) => s + l.qty, 0), sugar: biz.sugar || 0, cups: biz.cups || 0 };
  for (const [k, qty] of Object.entries(offer.give)) if ((have[k] ?? 0) < qty) return { biz, ok: false, reason: 'short' };

  const next = { ...biz, lots: (biz.lots || []).map(l => ({ ...l })) };
  for (const [k, qty] of Object.entries(offer.give)) {
    if (k === 'lemons') {
      let owed = qty;
      next.lots = next.lots.map(l => { const take = Math.min(l.qty, owed); owed -= take; return { ...l, qty: l.qty - take }; })
        .filter(l => l.qty > 0);
    } else next[k] = (next[k] || 0) - qty;
  }
  for (const [k, qty] of Object.entries(offer.want)) {
    if (k === 'lemons') next.lots = [...next.lots, { qty, boughtDay: '', traded: true }];
    else next[k] = (next[k] || 0) + qty;
  }
  return { biz: next, ok: true };
}
