import { describe, it, expect } from 'vitest';
import { recordAnswer, makeProblem } from '../src/index.js';

function play(answers, startTier = 1) {
  let r = { recent: [], tier: startTier, changed: null };
  for (const correct of answers) r = recordAnswer(r.recent, r.tier, correct);
  return r;
}

describe('recordAnswer', () => {
  it('moves up after 5 of 6 right', () => {
    const r = play([true, true, false, true, true, true]);
    expect(r).toEqual({ recent: [], tier: 2, changed: 'up' });
  });

  it('moves down after 2 or fewer of 6 right', () => {
    const r = play([false, true, false, false, true, false], 2);
    expect(r.tier).toBe(1);
    expect(r.changed).toBe('down');
  });

  it('holds steady in the middle band', () => {
    const r = play([true, false, true, true, false, false], 2);
    expect(r.tier).toBe(2);
    expect(r.changed).toBeNull();
  });

  it('never leaves the 1..3 tier range', () => {
    expect(play([true, true, true, true, true, true], 3).tier).toBe(3);
    expect(play([false, false, false, false, false, false], 1).tier).toBe(1);
  });
});

describe('makeProblem easier-win sprinkle', () => {
  it('serves ~20% of tier-2 questions at tier 1 when not forced', () => {
    let easier = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) if (makeProblem(6, 'ratio', 2).tier === 1) easier++;
    expect(easier / N).toBeGreaterThan(0.12);
    expect(easier / N).toBeLessThan(0.28);
  });

  it('forceTier pins the tier exactly', () => {
    for (let i = 0; i < 200; i++) expect(makeProblem(6, 'ratio', 2, { forceTier: 2 }).tier).toBe(2);
  });
});
