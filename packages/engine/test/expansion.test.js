import { describe, it, expect } from 'vitest';
import * as x from '../src/expansion.js';
import { valOf } from '../src/util.js';

const GENERATORS = [
  'areaModel', 'twoStepStory', 'decNotation', 'decCompare', 'multCompare',
  'powTen', 'decDiv', 'unitFracDiv', 'volumeBox', 'meanMedian', 'depVar',
  'tipCalc', 'discountTax', 'simpleInterest', 'probSimple',
  'funcEval', 'funcRate', 'sysSolve', 'pythag', 'approxRoot',
];

/* Direct per-generator fuzz — heavier per generator than the pooled curriculum
   fuzz, so rare parameter combinations get exercised. */
describe.each(GENERATORS)('%s', name => {
  it('produces valid problems across 300 runs', () => {
    for (let i = 0; i < 300; i++) {
      const p = x[name]();
      expect(p.ans, 'answer present').toBeTruthy();
      expect(p.wrongs.length, 'at least 2 distractors').toBeGreaterThanOrEqual(2);
      expect(p.steps.length, 'teach steps present').toBeGreaterThanOrEqual(2);
      expect(p.wrongs, 'no distractor equals the answer').not.toContain(p.ans);
      const av = valOf(p.ans);
      if (av !== null) {
        for (const w of p.wrongs) {
          const wv = valOf(w);
          if (wv !== null) expect(Math.abs(av - wv), `${name}: ${w} vs ${p.ans}`).toBeGreaterThan(1e-9);
        }
      }
    }
  });
});

describe('spot-checked math', () => {
  it('sysSolve: a is the difference of the two equations', () => {
    for (let i = 0; i < 50; i++) {
      const p = x.sysSolve();
      // "2a + b = A and a + b = B"  =>  a = A - B
      const [A, B] = [...p.q.matchAll(/=\s*(\d+)/g)].map(m => parseInt(m[1], 10));
      expect(Number(p.ans)).toBe(A - B);
    }
  });

  it('pythag answers are true hypotenuses', () => {
    for (let i = 0; i < 50; i++) {
      const p = x.pythag();
      const [a, b] = [...p.q.matchAll(/(\d+)/g)].map(m => parseInt(m[1], 10));
      expect(a * a + b * b).toBe(Number(p.ans) ** 2);
    }
  });

  it('discountTax: pay price + discount = sticker price', () => {
    for (let i = 0; i < 50; i++) {
      const p = x.discountTax();
      const sticker = parseFloat(p.q.match(/\$([\d.]+)/)[1]);
      const off = parseInt(p.q.match(/(\d+)% off/)[1], 10);
      expect(valOf(p.ans)).toBeCloseTo(sticker * (1 - off / 100), 6);
    }
  });
});
