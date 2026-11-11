/* The business screen's data, assembled from the engine (BUSINESS_CLEANUP).
   The screen decides nothing: which controls exist comes from unlocks(), the
   coaching line from coachTip(), and the register gate from today's lesson. */
import {
  freshBiz, unlocks, dailyTick, closeDay, openDay, customersForDay, buySupplies,
  coachTip, unlockedOnDay, KARLA_LINES, openingDone, lemonCount, capabilities,
  typeById, RECIPE, BASE_PRICES,
} from '@kampus/engine';
import { currentDay } from './year.js';

export const today = () => new Date().toISOString().slice(0, 10);

/** Her stand, created on first visit so the screen always has something real. */
export function ensureBiz(state) {
  return state.biz || freshBiz(state.grade, state.bizType || 'lemonade', state.bizName);
}

/** Skill gates the engine cannot read for itself (it stays pure). */
export function gatesFor(state) {
  return {
    percentsSolid: !!state.verdicts?.percentsSolid,
    unitQuizTaken: !!state.unitQuizTaken,
    systemsSolid: !!state.verdicts?.systemsSolid,
  };
}

const LADDER = [
  { id: 'starter', label: 'Starter Kit', gate: '' },
  { id: 'sign', label: 'Big Sign', gate: 'needs 2 more Solid skills' },
  { id: 'blender', label: 'Blender', gate: 'needs percents Solid' },
  { id: 'ad', label: 'Ad Campaign', gate: 'needs percents Solid' },
  { id: 'cookie', label: 'Cookie Shop', gate: 'needs systems' },
  { id: 'franchise', label: 'Franchise', gate: 'needs systems' },
  { id: 'empire', label: 'Empire', gate: 'loan · staff · grade 8' },
];

/** One sentence, not a stat row (declutter rule 2). Same engine math either way. */
function estimateSentence(biz, u, type) {
  const can = capabilities(biz.band).inventory
    ? Math.min(lemonCount(biz), biz.sugar, biz.cups)
    : 24;
  const likely = Math.max(4, Math.round(30 - biz.price * 6));
  const take = Math.min(can, likely) * biz.price;
  if (!u.price) return `A kit is already on the table. Serve the line and watch the money.`;
  if (!u.buy) return `You can make ${can} ${type.unitPlural}. About ${likely} people will come.`;
  return `You can make ${can} ${type.unitPlural}. About ${likely} people will come. Sell out and it's ${'$' + take.toFixed(0)}.`;
}

/** The register opens only after today's lesson (PLAY_SYSTEM §5 / §6). */
export function registerGate(state) {
  const { day } = currentDay(state);
  const lessonDone = state.lessonDoneDay === today();
  if (day?.type === 'quiz') return { ok: false, label: 'Closed for inspection', reason: 'Inspection Day — the stand stays shut this morning.' };
  if (state.settings?.vacation) return { ok: false, label: 'On vacation', reason: 'The stand is closed for a few days. Nothing drifts while you’re away.' };
  if (!lessonDone) return { ok: false, lesson: true, label: 'Start today’s lesson →', reason: 'Class is out after today’s lesson. Then the stand can open.' };
  return { ok: true, label: 'Open for the day →', tip: 'Everything’s set. Open when you’re ready.' };
}

/** Karla speaks on an unlock day, on the first drift, and when promos arrive. */
export function karlaFor(state, biz, u) {
  if (state.settings?.businessCoach === false) return null;
  const seen = state.karlaSeen || {};
  const justUnlocked = unlockedOnDay(biz, biz.opening?.openDays || 0);
  if ((biz.opening?.openDays || 0) === 0 && !seen.day1) return { key: 'day1', line: KARLA_LINES.day1 };
  if (justUnlocked && !seen[justUnlocked]) return { key: justUnlocked, line: KARLA_LINES[justUnlocked] };
  if (u.promos && !seen.promos) return { key: 'promos', line: KARLA_LINES.promos, tone: 'gold' };
  if (openingDone(biz) && !seen.graduated) return { key: 'graduated', line: KARLA_LINES.graduated };
  return null;
}

export function businessData(state) {
  const biz = { ...ensureBiz(state), gates: gatesFor(state) };
  const type = typeById(biz.typeId);
  const u = unlocks(biz);
  const tip = coachTip(biz, biz.ledger?.[biz.ledger.length - 1]);

  const stock = u.buy ? Object.keys(RECIPE).map(key => ({
    key,
    label: key[0].toUpperCase() + key.slice(1),
    onHand: key === 'lemons' ? lemonCount(biz) : biz[key] || 0,
    price: biz.marketPrices?.[key] ?? BASE_PRICES[key],
    drift: u.drift ? (biz.marketPrices?.[key] ?? 0) - (biz.yesterdayPrices?.[key] ?? biz.marketPrices?.[key] ?? 0) : 0,
    order: state.order?.[key] || 0,
  })) : [];

  return {
    biz: { ...biz, type, priceOptions: [1, 1.5, 2, 2.5, 3] },
    unlocks: u,
    date: today(),
    bank: state.kredits || 0,
    coachOn: state.settings?.businessCoach !== false,
    karla: karlaFor(state, biz, u),
    askKarla: tip ? { line: tip.text } : { line: 'Looking good. Open when you’re ready.' },
    estimate: estimateSentence(biz, u, type),
    stock,
    promos: u.promos ? [
      { id: 'none', label: 'No promo', active: !state.promo },
      { id: 'off25', label: '25% off today', active: state.promo === 'off25' },
      { id: 'two', label: '2 for $3.50', locked: !state.verdicts?.systemsSolid, gate: 'needs systems' },
    ] : [],
    // Rule 5: the ladder is behind Grow; prep only hints at the next rung.
    nextRung: u.ladder ? 'Big Sign — 2 more Solid skills' : null,
    ladder: LADDER.map((r, i) => ({ ...r, owned: i === 0 })),
    canOpen: registerGate(state),
    queue: state.dayQueue || [],
    // The customer the line is waiting on, when they came with a math moment
    // (engine: makeMoment). Null unless one is actually open.
    moment: (() => {
      const q = (state.dayQueue || [])[state.dayMomentAt ?? -1];
      return q?.moment ? { moment: q.moment, customer: q } : null;
    })(),
    counters: state.dayCounters || { served: 0, missed: 0, left: 0 },

    /* THE ONE-CUP RECEIPT (§0f). What one cup sells for, what it costs to make
       it, what she keeps — the whole economics of her stand on one slip, beside
       the customer asking for it. Derived here rather than in the component,
       because RECIPE and the market's prices belong to the engine and the UI
       takes no engine dependency. */
    receipt: (() => {
      const prices = biz.marketPrices || BASE_PRICES;
      const lines = Object.entries(RECIPE).map(([key, qty]) => ({
        key,
        label: key === 'sugar' ? `${qty} scoop sugar` : `${qty} ${key.replace(/s$/, '')}${qty === 1 ? '' : 's'}`,
        cents: Math.round((prices[key] || 0) * qty * 100),
      }));
      const subtotal = lines.reduce((n, l) => n + l.cents, 0);
      const sells = Math.round((biz.price || 0) * 100);
      return {
        sells, lines, subtotal, keep: sells - subtotal,
        shelf: [
          { key: 'lemons', label: 'Lemons', n: lemonCount(biz) },
          { key: 'sugar', label: 'Sugar, scoops', n: biz.sugar || 0 },
          { key: 'cups', label: 'Cups you can pour', n: Math.min(lemonCount(biz), biz.sugar || 0, biz.cups || 0) },
        ],
      };
    })(),

    /* The running total at the counter, and the one payment that just landed.
       Served cups at today's price: the ledger does the real arithmetic at
       close, and this is the number rising in front of her while she works. */
    takings: ((state.dayQueue || []).filter(c => c.status === 'served').length)
      * Math.round((biz.price || 0) * 100),
    lastPaid: ((state.dayQueue || []).some(c => c.status === 'served')
      ? Math.round((biz.price || 0) * 100) * ((state.dayQueue || [])
        .filter(c => c.status === 'served').slice(-1)[0]?.order?.cups || 1)
      : null),

    /* Where the line is, for the counter's progress dots. Not a crowd and not a
       countdown: one dot per customer, and the one she is on. */
    counter: (() => {
      const q = state.dayQueue || [];
      const servedOrPast = q.filter(c => c.status && c.status !== 'next' && c.status !== 'waiting').length;
      const at = q.findIndex(c => !c.status || c.status === 'next' || c.status === 'waiting');
      return { of: q.length, served: servedOrPast, at: at < 0 ? q.length : at };
    })(),
    result: biz.ledger?.[biz.ledger.length - 1] || null,
  };
}

export { unlocks, dailyTick, closeDay, openDay, customersForDay, buySupplies };
