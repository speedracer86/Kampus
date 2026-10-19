import { describe, it, expect } from 'vitest';
import { payout, FIRST_TRY_BONUS, BLITZ_MULT, TEACH_TOKENS_PER_RUN } from '../src/payout.js';

describe('payout — economy v2', () => {
  it('base case: tier pay only, no chips', () => {
    expect(payout({ tier: 1, streak: 1 })).toEqual({ total: 12, parts: [] });
  });

  it('streak multiplies and shows a chip', () => {
    const p = payout({ tier: 2, streak: 6 });
    expect(p.total).toBe(32);                      // 16 × 2
    expect(p.parts).toContain('×2 streak');
  });

  it('first try adds a flat bonus after multipliers', () => {
    const p = payout({ tier: 1, streak: 1, firstTry: true });
    expect(p.total).toBe(12 + FIRST_TRY_BONUS);
    expect(p.parts).toContain(`+${FIRST_TRY_BONUS} first try`);
  });

  it('blitz multiplies before the first-try bonus', () => {
    const p = payout({ tier: 2, streak: 1, blitzFast: true, firstTry: true });
    expect(p.total).toBe(Math.round(16 * BLITZ_MULT) + FIRST_TRY_BONUS);
    expect(p.parts).toContain(`×${BLITZ_MULT} blitz`);
  });

  it('a teach token protects the payout', () => {
    const p = payout({ tier: 3, streak: 4, teachUsed: true, tokenUsed: true });
    expect(p.total).toBe(30);                      // 20 × 1.5, untouched
    expect(p.parts).toContain('token used');
  });

  it('teach without a token halves everything, rounded up', () => {
    const p = payout({ tier: 3, streak: 1, firstTry: true, teachUsed: true });
    expect(p.total).toBe(Math.ceil((20 + FIRST_TRY_BONUS) / 2));
    expect(p.parts).toContain('halved · help');
  });

  it('gear bonus applies and shows', () => {
    const p = payout({ tier: 1, streak: 1, bonusPct: 50 });
    expect(p.total).toBe(18);
    expect(p.parts).toContain('+50% gear');
  });

  it('three tokens per run is the contract the UI follows', () => {
    expect(TEACH_TOKENS_PER_RUN).toBe(3);
  });
});
