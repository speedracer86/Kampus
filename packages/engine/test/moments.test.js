/* Business moments — the math the queue actually asks for.

   PLAY_SYSTEM §2 calls `makeMoment` the crown jewel of the three-source rule:
   questions generated from live state she owns, not a costume with invented
   numbers. They were being generated and attached to the day's queue, and no
   screen ever asked them.

   The invariant that matters most is the §5 rule reaching inside the business: a
   question may never cost her the day. `openDay` reads stock and orders and has no
   parameter for an answer, so correctness cannot touch the ledger — that is tested
   here so it stays true. */
import { describe, it, expect } from 'vitest';
import { makeMoment, customersForDay, openDay, freshBiz, lemonCount } from '../src/business.js';

const graduated = (b) => ({ ...b, opening: { openDays: 5, done: true } });
const stocked = (g) => ({ ...graduated(freshBiz(g)), lots: [{ qty: 200, boughtDay: '2026-10-01' }], sugar: 200, cups: 200 });

describe('every moment is answerable', () => {
  const variants = [];
  for (const grade of [3, 4, 5, 6, 7, 8]) {
    for (const price of [1, 1.5, 2, 2.5, 3, 4]) {
      for (const cups of [1, 2, 3]) {
        variants.push({ grade, price, cups,
          m: makeMoment({ ...freshBiz(grade), price }, { name: 'Ava', order: { cups } }, grade, () => 0.5) });
      }
    }
  }

  it('offers at least two wrongs and never repeats an option', () => {
    for (const { grade, price, cups, m } of variants) {
      const all = [String(m.ans), ...m.wrongs];
      expect(m.wrongs.length, `g${grade} $${price} ×${cups}`).toBeGreaterThanOrEqual(2);
      expect(new Set(all).size, `g${grade} $${price} ×${cups}: ${JSON.stringify(all)}`).toBe(all.length);
    }
  });

  it('never lets a wrong equal the answer', () => {
    for (const { grade, m } of variants) expect(m.wrongs, `g${grade}`).not.toContain(String(m.ans));
  });

  it('does not telegraph by shape: the answer is not the only one with a figure', () => {
    // The B7 tell, inside the business. "the bag ($0.43 each)" beside "single lemons"
    // is answerable without dividing.
    for (const { grade, m } of variants) {
      const hasFigure = (c) => /\d/.test(c);
      const all = [String(m.ans), ...m.wrongs];
      const withFigures = all.filter(hasFigure).length;
      expect(withFigures === 0 || withFigures >= 2, `g${grade}: ${JSON.stringify(all)}`).toBe(true);
    }
  });

  it('always carries its working, so a miss can be shown the steps', () => {
    for (const { grade, m } of variants) {
      expect(m.steps?.length, `g${grade}`).toBeGreaterThan(0);
      expect(m.skill, `g${grade}`).toBeTruthy();
    }
  });
});

describe('a moment can never hurt the business (§5, inside the stand)', () => {
  it('openDay takes no answers at all — the ledger cannot depend on them', () => {
    expect(openDay.length).toBeLessThanOrEqual(3);     // (biz, queue, today)
  });

  it('a queue answered wrong closes exactly like one answered right', () => {
    const biz = stocked(6);
    const queue = customersForDay(biz, { forecast: 'sunny', grade: 6 }, () => 0.5);
    const right = openDay(biz, queue.map(c => ({ ...c, momentRight: true, momentDone: true })), '2026-10-20');
    const wrong = openDay(biz, queue.map(c => ({ ...c, momentRight: false, momentDone: true })), '2026-10-20');
    expect(wrong.result).toEqual(right.result);
    expect(lemonCount(wrong.biz)).toBe(lemonCount(right.biz));
    expect(wrong.biz.reputation).toBe(right.biz.reputation);
  });

  it('serving a customer who came with a moment is worth the same as any other', () => {
    const biz = stocked(7);
    const queue = customersForDay(biz, { forecast: 'sunny', grade: 7 }, () => 0.5);
    const withMoments = queue.filter(c => c.moment).length;
    expect(withMoments).toBeGreaterThan(0);            // the day really does carry them
    const stripped = openDay(biz, queue.map(({ moment, ...c }) => c), '2026-10-20');
    const kept = openDay(biz, queue, '2026-10-20');
    expect(kept.result).toEqual(stripped.result);
  });
});

describe('the day actually carries moments to ask', () => {
  it('attaches between one and three, never to the first customer', () => {
    for (const grade of [3, 6, 8]) {
      for (const seed of [0.1, 0.35, 0.5, 0.75, 0.9]) {
        const queue = customersForDay(stocked(grade), { forecast: 'sunny', grade }, () => seed);
        const idx = queue.map((c, i) => (c.moment ? i : -1)).filter(i => i >= 0);
        expect(idx.length, `g${grade} seed ${seed}`).toBeGreaterThanOrEqual(1);
        expect(idx.length).toBeLessThanOrEqual(3);
        expect(idx, 'never the first customer — let her settle in').not.toContain(0);
      }
    }
  });
});
