import { describe, it, expect } from 'vitest';
import { kreditsFor, comboMult, streakInfo, bonusPct, grantTickets, weekKey } from '../src/index.js';

describe('kreditsFor', () => {
  it('matches the v1 formula: round((8 + 4·tier) · comboMult · (1 + bonus/100))', () => {
    expect(kreditsFor(1, 0)).toBe(12);
    expect(kreditsFor(3, 0)).toBe(20);
    expect(kreditsFor(2, 4)).toBe(24);           // 16 × 1.5
    expect(kreditsFor(2, 10)).toBe(48);          // 16 × 3
    expect(kreditsFor(1, 0, { bonusPct: 50 })).toBe(18);
  });

  it('teach halves the payout, rounded up (v1 rule)', () => {
    expect(kreditsFor(1, 0, { taught: true })).toBe(6);
    expect(kreditsFor(3, 0, { taught: true })).toBe(10);
  });
});

describe('streaks', () => {
  it('multiplier tiers', () => {
    expect(comboMult(0)).toBe(1);
    expect(comboMult(3)).toBe(1.5);
    expect(comboMult(6)).toBe(2);
    expect(comboMult(10)).toBe(3);
  });

  it('job titles ladder', () => {
    expect(streakInfo(0).cur.name).toBe('STARTER');
    expect(streakInfo(8).cur.name).toBe('BOSS');
    expect(streakInfo(8).next.name).toBe('CEO');
    expect(streakInfo(20).cur.name).toBe('LEGEND');
    expect(streakInfo(20).next).toBeNull();
  });
});

describe('shop bonus', () => {
  it('takes best gear (no stacking) plus all pets (stacking)', () => {
    expect(bonusPct({ gear: ['wood'], pets: [] })).toBe(0);
    expect(bonusPct({ gear: ['wood', 'stone', 'gold'], pets: [] })).toBe(35);
    expect(bonusPct({ gear: ['stone'], pets: ['wolf', 'cat'] })).toBe(25);
  });
});

describe('tickets', () => {
  it('respects the weekly cap and reports capping', () => {
    expect(grantTickets(3, 0)).toEqual({ granted: 3, capped: false });
    expect(grantTickets(3, 9)).toEqual({ granted: 1, capped: true });
    expect(grantTickets(3, 10)).toEqual({ granted: 0, capped: true });
    expect(grantTickets(3, 10, 10, true)).toEqual({ granted: 3, capped: false });
  });

  it('week buckets start Monday and are stable within a week', () => {
    const mon = Date.UTC(2026, 7, 17, 12);      // Mon Aug 17 2026
    const sun = Date.UTC(2026, 7, 23, 12);      // Sun Aug 23 2026
    const nextMon = Date.UTC(2026, 7, 24, 12);
    expect(weekKey(mon)).toBe(weekKey(sun));
    expect(weekKey(mon)).not.toBe(weekKey(nextMon));
  });
});
