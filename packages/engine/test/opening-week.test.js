/* The Opening Week, Karla, and the business types (BUSINESS_CLEANUP + PLAY_SYSTEM §3). */
import { describe, it, expect } from 'vitest';
import {
  freshBiz, unlocks, closeDay, dailyTick, openingDone, unlockedOnDay, coachTip,
  KARLA_LINES, PERSONAS, OPENING_LENGTH, STARTER_KIT, lemonCount, capabilities,
} from '../src/business.js';
import { BUSINESS_TYPES, typesForBand, typeById, objectivesFor, BAND_OBJECTIVES, defaultName } from '../src/business-types.js';

const day = (n) => `2026-10-${String(n).padStart(2, '0')}`;
const openN = (biz, n) => { let b = biz; for (let i = 0; i < n; i++) b = closeDay(b, { served: 4, missed: 0, revenue: 8, cost: 3, profit: 5 }, day(i + 1)); return b; };

describe('the Opening Week reveals one system per open day', () => {
  it('starts with serving only — no price, no stock, no reputation', () => {
    const u = unlocks(freshBiz(7));
    expect(u.serve).toBe(true);
    expect([u.price, u.buy, u.spoilage, u.drift, u.reputation]).toEqual([false, false, false, false, false]);
  });

  it('walks price -> buy -> spoilage+drift -> reputation for band c', () => {
    const seq = [1, 2, 3, 4].map(n => unlocks(openN(freshBiz(7), n)));
    expect(seq[0].price).toBe(true);
    expect(seq[1].buy).toBe(true);
    expect(seq[2].spoilage && seq[2].drift).toBe(true);
    expect(seq[3].reputation).toBe(true);
  });

  it('ends early for band a — serving and price are their whole business', () => {
    const b = openN(freshBiz(3), 2);
    expect(openingDone(b)).toBe(true);
    expect(OPENING_LENGTH.a).toBe(2);
    const u = unlocks(b);
    expect(u.price).toBe(true);
    expect([u.buy, u.spoilage, u.reputation]).toEqual([false, false, false]);   // never revealed
  });

  it('never shows band b a promo, however long it plays', () => {
    const b = { ...openN(freshBiz(5), 12), gates: { percentsSolid: true, unitQuizTaken: true } };
    expect(unlocks(b).promos).toBe(false);
    expect(capabilities('b').promos).toBe(false);
  });

  it('gates band c promos on percents being Solid, not on days', () => {
    const played = openN(freshBiz(7), 5);
    expect(unlocks(played).promos).toBe(false);
    expect(unlocks({ ...played, gates: { percentsSolid: true } }).promos).toBe(true);
  });

  it('gates the ladder on the first unit quiz, and bag-of-12 on three stock buys', () => {
    const b = openN(freshBiz(7), 5);
    expect(unlocks(b).ladder).toBe(false);
    expect(unlocks({ ...b, gates: { unitQuizTaken: true } }).ladder).toBe(true);
    expect(unlocks({ ...b, purchases: 2 }).bagOf12).toBe(false);
    expect(unlocks({ ...b, purchases: 3 }).bagOf12).toBe(true);
  });

  it('counts open days, not calendar days — absence pauses the arc', () => {
    let b = freshBiz(7);
    b = dailyTick(b, day(1)).biz;
    b = dailyTick(b, day(9)).biz;          // a week away, never opened
    expect(b.opening.openDays).toBe(0);
    b = closeDay(b, { served: 2, missed: 0 }, day(9));
    expect(b.opening.openDays).toBe(1);
  });

  it('names what each day introduces, so Karla can say it', () => {
    expect(unlockedOnDay(freshBiz(7), 1)).toBe('price');
    expect(unlockedOnDay(freshBiz(7), 3)).toBe('spoilage');
    expect(unlockedOnDay(freshBiz(3), 2)).toBe(null);     // band a has no stock day
    expect(KARLA_LINES.day1).toMatch(/First day's easy/);
  });
});

describe('the week is a grace period, not a hidden simulation', () => {
  it('does not spoil stock before spoilage is introduced', () => {
    let b = freshBiz(7);
    b.lots = [{ qty: 12, boughtDay: day(1) }];
    for (let d = 2; d <= 9; d++) b = dailyTick(b, day(d)).biz;
    expect(lemonCount(b)).toBe(12);                       // untouched while locked
  });

  it('spoils normally once it is introduced — including the starter kit', () => {
    let b = openN(freshBiz(7), 3);
    b = { ...b, lots: [{ qty: STARTER_KIT.lemons, boughtDay: day(1), starter: true }] };
    const after = dailyTick(b, day(9)).biz;
    expect(lemonCount(after)).toBeLessThan(STARTER_KIT.lemons);
  });

  it('does not drift prices before drift is introduced', () => {
    let b = freshBiz(7);
    const before = { ...b.marketPrices };
    for (let d = 2; d <= 6; d++) b = dailyTick(b, day(d), () => 0.9).biz;
    expect(b.marketPrices).toEqual(before);
  });

  it('keeps yesterday\'s prices so the screen can draw drift arrows', () => {
    let b = openN(freshBiz(7), 3);
    const before = { ...b.marketPrices };
    b = dailyTick(b, day(9), () => 0.95).biz;
    expect(b.yesterdayPrices).toEqual(before);
    expect(b.marketPrices).not.toEqual(before);
  });

  it('gives every band a starter kit on day one', () => {
    for (const g of [3, 5, 7]) {
      const b = freshBiz(g);
      expect(lemonCount(b), `grade ${g}`).toBe(STARTER_KIT.lemons);
      expect(b.lots[0].starter).toBe(true);
    }
  });
});

describe('Karla', () => {
  it('is a persona, a regular from day one, and not sunny-only', () => {
    const karla = PERSONAS.find(p => p.id === 'karla');
    expect(karla).toBeTruthy();
    expect(karla.coach).toBe(true);
    expect(karla.sunnyOnly).toBeUndefined();     // a coach shows up in the rain
    expect(karla.blob).toBeTruthy();
  });

  it('coaches in priority order: planning, then buying, then comeback, then pricing', () => {
    const base = openN(freshBiz(7), 5);
    const stocked = { ...base, lots: [{ qty: 20, boughtDay: day(1) }] };
    expect(coachTip(stocked, { served: 2, missed: 8 }).topic).toBe('planning');   // beats buying
    expect(coachTip(stocked, { served: 8, missed: 0 }).topic).toBe('buying');
    const bare = { ...base, lots: [], reputation: 20 };
    expect(coachTip(bare, { served: 8, missed: 0 }).topic).toBe('comeback');
    const thin = { ...base, lots: [], reputation: 80, price: 1.0 };
    expect(coachTip(thin, { served: 8, missed: 0 }).topic).toBe('pricing');
  });

  it('says nothing when nothing needs saying', () => {
    const fine = { ...openN(freshBiz(7), 5), lots: [], reputation: 80, price: 3 };
    expect(coachTip(fine, { served: 8, missed: 0 })).toBe(null);
  });
});

describe('business types — a skin she chose over the same engine (§3)', () => {
  it('offers each band its own types plus every earlier band\'s', () => {
    expect(typesForBand('a').map(t => t.id)).toEqual(['lemonade', 'cookie', 'sticker']);
    expect(typesForBand('b').map(t => t.id)).toContain('petcare');
    expect(typesForBand('c').map(t => t.id)).toEqual(expect.arrayContaining(['lemonade', 'bake', 'resale', 'digital']));
    expect(typesForBand('b').some(t => t.band === 'c')).toBe(false);
  });

  it('teaches the SAME math objectives at a band, whatever type she picked', () => {
    for (const band of ['a', 'b', 'c']) {
      const objectives = typesForBand(band).filter(t => t.band === band).map(() => objectivesFor(band));
      for (const o of objectives) expect(o).toEqual(BAND_OBJECTIVES[band]);
    }
  });

  it('models stock three ways: a recipe, booked hours, or a buy/sell spread', () => {
    expect(BUSINESS_TYPES.lemonade.recipe).toBeTruthy();
    expect(BUSINESS_TYPES.petcare.kind).toBe('service');
    expect(BUSINESS_TYPES.petcare.recipe).toBe(null);
    expect(BUSINESS_TYPES.petcare.hoursPerDay).toBeGreaterThan(0);   // capacity, not inventory
    expect(BUSINESS_TYPES.resale.spread).toBe(true);
    expect(BUSINESS_TYPES.digital.zeroMarginalCost).toBe(true);
  });

  it('gives every type the nouns a screen needs', () => {
    for (const t of Object.values(BUSINESS_TYPES)) {
      expect(t.unit && t.unitPlural && t.label && t.make, t.id).toBeTruthy();
      expect(t.momentSkills.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.basePrice, t.id).toBeGreaterThan(0);
    }
  });

  it('remembers what she picked and what she called it', () => {
    const b = freshBiz(7, 'resale', 'Card Corner');
    expect(b.typeId).toBe('resale');
    expect(b.name).toBe('Card Corner');
    expect(freshBiz(5, 'bake').name).toBe(typeById('bake').label);
    expect(defaultName(typeById('cookie'), 'Talia')).toBe('Talia’s Cookie');
  });
});
