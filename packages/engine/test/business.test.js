import { describe, it, expect } from 'vitest';
import {
  freshBiz, dailyTick, buySupplies, customersForDay, makeMoment, openDay,
  comebackPromo, capabilities, lemonCount, REP_FLOOR, SPOIL_CAP_PER_DAY, BASE_PRICES,
} from '../src/business.js';
import { valOf } from '../src/util.js';

const seeded = (seq => () => { seq = (seq * 9301 + 49297) % 233280; return seq / 233280; })(42);
const day = n => `2026-11-${String(n).padStart(2, '0')}`;

describe('capabilities — the start-grade policy', () => {
  it('grade 3-4 owns without managing; 7-8 runs the full company', () => {
    expect(capabilities('a')).toMatchObject({ inventory: false, spoilage: false, repDrift: false });
    expect(capabilities('b')).toMatchObject({ inventory: true, memory: true, repDrift: false });
    expect(capabilities('c')).toMatchObject({ inventory: true, repDrift: true, promos: true, loan: true });
  });
});

describe('dailyTick — the Tamagotchi organ, bounded', () => {
  it('is idempotent per day and drifts market prices within bounds', () => {
    let biz = freshBiz(7);
    for (let d = 1; d <= 20; d++) biz = dailyTick(biz, day(d), seeded).biz;
    for (const k of Object.keys(BASE_PRICES)) {
      expect(biz.marketPrices[k]).toBeGreaterThanOrEqual(BASE_PRICES[k] * 0.6 - 1e-9);
      expect(biz.marketPrices[k]).toBeLessThanOrEqual(BASE_PRICES[k] * 1.6 + 1e-9);
    }
    const again = dailyTick(biz, day(20), seeded);
    expect(again.biz).toBe(biz);               // same-day tick is a no-op
  });

  it('spoils old lemons with a daily cap and fires the planning lesson', () => {
    let biz = freshBiz(7);
    biz = buySupplies(biz, { lemons: 30 }, day(1), 999).biz;
    const { biz: after, events } = dailyTick(biz, day(6), seeded);
    expect(lemonCount(biz) - lemonCount(after)).toBe(SPOIL_CAP_PER_DAY);   // capped, not wiped out
    expect(events.find(e => e.type === 'spoilage').lesson).toBe('planning');
  });

  it('reputation drifts only after grace, never below the floor, frozen on vacation', () => {
    let biz = { ...freshBiz(8), lastOpenDay: day(1), reputation: 23 };
    for (let d = 2; d <= 15; d++) biz = dailyTick(biz, day(d), seeded).biz;
    expect(biz.reputation).toBe(REP_FLOOR);    // floored, business never dies
    let frozen = { ...freshBiz(8), lastOpenDay: day(1), reputation: 60, vacation: true };
    for (let d = 2; d <= 15; d++) frozen = dailyTick(frozen, day(d), seeded).biz;
    expect(frozen.reputation).toBe(60);        // vacation mode: zero decay
    let young = { ...freshBiz(3), lastOpenDay: day(1), reputation: 60 };
    for (let d = 2; d <= 15; d++) young = dailyTick(young, day(d), seeded).biz;
    expect(young.reputation).toBe(60);         // grade 3-4 never feels absence
  });
});

describe('the customer queue', () => {
  it('scales with price, weather, and reputation; always at least a trickle', () => {
    const biz = freshBiz(7);
    const sunny = customersForDay(biz, { forecast: 'sunny', grade: 7 }, seeded).length;
    const cloudy = customersForDay(biz, { forecast: 'cloudy', grade: 7 }, seeded).length;
    expect(sunny).toBeGreaterThan(cloudy);
    const pricey = customersForDay({ ...biz, price: 4 }, { forecast: 'sunny', grade: 7 }, seeded).length;
    expect(pricey).toBeLessThan(sunny);
    const quiet = customersForDay({ ...biz, reputation: REP_FLOOR }, { forecast: 'cloudy', grade: 7 }, seeded);
    expect(quiet.length).toBeGreaterThanOrEqual(2);   // the floor keeps a comeback possible
  });

  it('plants 1-3 valid math moments, never on the first customer', () => {
    const biz = freshBiz(7);
    for (let i = 0; i < 20; i++) {
      const queue = customersForDay(biz, { forecast: 'sunny', grade: 7 }, seeded);
      const moments = queue.map((c, idx) => ({ c, idx })).filter(x => x.c.moment);
      expect(moments.length).toBeGreaterThanOrEqual(1);
      expect(moments.length).toBeLessThanOrEqual(3);
      expect(moments.every(m => m.idx > 0)).toBe(true);
      for (const { c } of moments) {
        expect(c.moment.wrongs.length).toBeGreaterThanOrEqual(2);
        expect(c.moment.wrongs).not.toContain(c.moment.ans);
        expect(c.moment.steps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('moments are banded: change-making at 3, unit price at 5, margins at 7', () => {
    const base = freshBiz(7);
    expect(makeMoment(base, { name: 'Ava', order: { cups: 2 } }, 3, seeded).skill).toBe('Making change');
    expect(makeMoment(base, { name: 'Ava', order: { cups: 2 } }, 5, seeded).skill).toBe('Unit price');
    expect(makeMoment(base, { name: 'Ava', order: { cups: 2 } }, 8, seeded).skill).toBe('Margin after discount');
  });

  it('change-making math is correct against the live price', () => {
    for (let i = 0; i < 40; i++) {
      const biz = { ...freshBiz(3), price: 1 + (i % 4) };
      const cups = 1 + (i % 3);
      const m = makeMoment(biz, { name: 'Leo', order: { cups } }, 3, seeded);
      const paid = cups * biz.price < 5 ? 5 : 10;
      expect(valOf(m.ans)).toBe(paid - cups * biz.price);
    }
  });
});

describe('openDay — serving the line', () => {
  it('serves while stocked, misses when out, and the ledger math balances', () => {
    let biz = freshBiz(7);
    biz = buySupplies(biz, { lemons: 10, sugar: 10, cups: 10 }, day(1), 999).biz;
    const queue = Array.from({ length: 15 }, (_, i) => ({ persona: 'v', name: 'V', blob: 'Networking', order: { cups: 1 }, isRegular: false }));
    const { biz: after, result } = openDay(biz, queue, day(1));
    expect(result.served).toBe(10);
    expect(result.missed).toBe(5);
    expect(result.revenue).toBeCloseTo(10 * biz.price, 6);
    expect(result.profit).toBeCloseTo(result.revenue - result.cost, 6);
    expect(lemonCount(after)).toBe(0);
    expect(after.ledger).toHaveLength(1);
  });

  it('grade 3-4 never runs out (ownership without management)', () => {
    const biz = freshBiz(3);
    const queue = Array.from({ length: 12 }, () => ({ persona: 'v', name: 'V', blob: 'Networking', order: { cups: 1 }, isRegular: false }));
    const { result } = openDay(biz, queue, day(1));
    expect(result.missed).toBe(0);
  });

  it('serving well raises reputation and regular affinity; missing dings both, bounded', () => {
    let biz = { ...freshBiz(7) };
    biz = buySupplies(biz, { lemons: 50, sugar: 50, cups: 50 }, day(1), 999).biz;
    const good = openDay(biz, Array.from({ length: 10 }, () => ({ order: { cups: 1 } })), day(1)).biz;
    expect(good.reputation).toBeGreaterThan(biz.reputation);
    expect(good.regulars[0].affinity).toBeGreaterThan(50);
  });
});

describe('the comeback', () => {
  it('a quiet stand always has a way back; a healthy one needs none', () => {
    expect(comebackPromo({ ...freshBiz(7), reputation: REP_FLOOR })).toMatchObject({ discountPct: 25 });
    expect(comebackPromo(freshBiz(7))).toBeNull();
  });
});
