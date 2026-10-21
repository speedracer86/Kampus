import { describe, it, expect } from 'vitest';
import { valueOf, makeOffer, marketPosts, settleOffer } from '../src/market.js';
import { freshBiz, BASE_PRICES, lemonCount } from '../src/business.js';

const biz = () => ({ ...freshBiz(7), marketPrices: { lemons: 0.5, sugar: 0.3, cups: 0.2 } });

describe("Karla's market — NPC only, never randomised", () => {
  it('prices a bundle at today\'s prices', () => {
    expect(valueOf({ lemons: 10 }, { lemons: 0.5 })).toBe(5);
    expect(valueOf({}, BASE_PRICES)).toBe(0);
  });

  it('tells the truth about which side is worth more', () => {
    const o = makeOffer(biz(), { give: { lemons: 10 }, want: { sugar: 8 } });   // $5.00 for $2.40
    expect(o.giveValue).toBe(5);
    expect(o.wantValue).toBeCloseTo(2.4, 2);
    expect(o.good).toBe(false);                       // she would lose value
    expect(o.question.correct).toBe(0);               // "What I give" is worth more
  });

  it('marks a good deal as good', () => {
    const o = makeOffer(biz(), { give: { cups: 4 }, want: { lemons: 6 } });     // $0.80 for $3.00
    expect(o.good).toBe(true);
    expect(o.question.correct).toBe(1);
  });

  it('carries the ratio question with the offer — deciding IS the maths', () => {
    const o = makeOffer(biz(), { give: { lemons: 10 }, want: { sugar: 8 } });
    expect(o.question.answers).toHaveLength(3);
    expect(o.question.hint).toMatch(/\$5\.00/);
    expect(o.question.text).toMatch(/worth more/);
  });

  it('is deterministic — the same morning shows the same board', () => {
    const a = marketPosts(biz(), 3).map(o => o.id + o.text);
    const b = marketPosts(biz(), 3).map(o => o.id + o.text);
    expect(a).toEqual(b);
    expect(marketPosts(biz(), 4).map(o => o.id)).not.toEqual(marketPosts(biz(), 3).map(o => o.id));
  });

  it('never takes a counterparty that is not an NPC', () => {
    for (const o of marketPosts(biz(), 0)) {
      expect(o.from).toBe('karla');
      expect(Object.keys(o)).not.toContain('playerId');
    }
  });

  it('settles a swap against real stock', () => {
    const before = biz();
    const o = makeOffer(before, { give: { cups: 4 }, want: { lemons: 6 } });
    const { biz: after, ok } = settleOffer(before, o);
    expect(ok).toBe(true);
    expect(after.cups).toBe(before.cups - 4);
    expect(lemonCount(after)).toBe(lemonCount(before) + 6);
  });

  it('refuses a trade she cannot cover rather than going negative', () => {
    const before = { ...biz(), cups: 1 };
    const o = makeOffer(before, { give: { cups: 40 }, want: { lemons: 6 } });
    const { biz: after, ok, reason } = settleOffer(before, o);
    expect(ok).toBe(false);
    expect(reason).toBe('short');
    expect(after).toBe(before);
    expect(after.cups).toBeGreaterThanOrEqual(0);
  });
});
