/* Golden-answer tests (owner priority, PROMPT A2).

   The rule these follow, borrowed from curriculum/bank-verify.test.js: the expected
   answer is re-derived here, independently, from the numbers printed in the question.
   A generator is never compared to itself — that would only prove it is consistent,
   not that it is right. Where a clean closed form exists we assert it outright; where
   it does not, we assert domain invariants that a wrong answer would violate.        */
import { describe, it, expect } from 'vitest';
import { CURRICULUM } from '../src/curriculum.js';
import '../src/expansion.js';

const gens = (() => {
  const seen = new Map();
  for (const g of [3, 4, 5, 6, 7, 8])
    for (const t of ['frac', 'ratio', 'int', 'alg'])
      for (const tier of [1, 2, 3])
        for (const f of (CURRICULUM[g]?.[t]?.[tier] || [])) if (!seen.has(f.name)) seen.set(f.name, f);
  return seen;
})();

const G = (name) => { const f = gens.get(name); if (!f) throw new Error(`no generator ${name}`); return f; };
const plain = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const nums = (p) => [...plain(p.q).matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
const money = (s) => Number(String(s).replace(/[^0-9.-]/g, ''));
/** Run a generator a few times; every case must satisfy the check. */
const each = (name, n, check) => { const f = G(name); for (let i = 0; i < n; i++) check(f(), i); };

describe('golden answers — arithmetic', () => {
  it('addBig / subBig / mulDigit: re-add the printed operands', () => {
    each('addBig', 20, p => { const [a, b] = nums(p); expect(Number(p.ans)).toBe(a + b); });
    each('subBig', 20, p => { const [a, b] = nums(p); expect(Number(p.ans)).toBe(a - b); });
    each('mulDigit', 20, p => { const [a, b] = nums(p); expect(Number(p.ans)).toBe(a * b); });
  });

  it('divRem: quotient and remainder rebuild the dividend', () => {
    each('divRem', 20, p => {
      const [a, b] = nums(p);
      const [q, r] = String(p.ans).split(/\s*r\s*/).map(Number);
      expect(q * b + r).toBe(a);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(b);
    });
  });

  it('orderOps respects precedence, not left-to-right', () => {
    each('orderOps', 20, p => {
      const [a, b, c] = nums(p);
      expect(Number(p.ans)).toBe(plain(p.q).includes('×') ? a + b * c : a - b / c);
    });
  });

  it('absVal is never negative and matches the printed magnitude', () => {
    each('absVal', 20, p => {
      const n = nums(p)[0];
      expect(Number(p.ans)).toBe(Math.abs(n));
      expect(Number(p.ans)).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('golden answers — money and percent', () => {
  it('easyPct / pctOf: percent of a number, computed here', () => {
    for (const name of ['easyPct', 'pctOf']) {
      each(name, 20, p => { const [pct, whole] = nums(p); expect(Number(p.ans)).toBeCloseTo(whole * pct / 100, 6); });
    }
  });

  it('findWhole inverts the percent correctly', () => {
    each('findWhole', 20, p => { const [part, pct] = nums(p); expect(Number(p.ans)).toBeCloseTo(part * 100 / pct, 6); });
  });

  it('discountTax: what you pay is below the sticker price, and the gap is the discount', () => {
    each('discountTax', 30, p => {
      const [sticker, pct] = nums(p);
      const pay = money(p.ans);
      expect(pay).toBeLessThan(sticker);                       // a sale is cheaper
      expect(pay).toBeCloseTo(sticker * (100 - pct) / 100, 2); // and exactly this much cheaper
    });
  });

  it('tipCalc: a tip is positive, and a total exceeds the bill by exactly the tip', () => {
    each('tipCalc', 30, p => {
      const [bill, pct] = nums(p);
      const ans = money(p.ans);
      const tip = bill * pct / 100;
      if (/total/i.test(plain(p.q))) { expect(ans).toBeCloseTo(bill + tip, 2); expect(ans).toBeGreaterThan(bill); }
      else { expect(ans).toBeCloseTo(tip, 2); expect(ans).toBeGreaterThan(0); }
    });
  });

  it('pctChange: the percent is the gap over the ORIGINAL, never over the new value', () => {
    each('pctChange', 30, p => {
      const [a, b] = nums(p);
      expect(Number(String(p.ans).replace('%', ''))).toBeCloseTo(Math.abs(b - a) / a * 100, 6);
    });
  });

  it('simpleInterest: interest grows linearly with the years printed', () => {
    each('simpleInterest', 20, p => {
      const [principal, rate, years] = nums(p);
      expect(money(p.ans)).toBeCloseTo(principal * rate / 100 * years, 2);
    });
  });

  it('unitRate: one unit times the count rebuilds the total paid', () => {
    each('unitRate', 20, p => {
      const [count, total] = nums(p);
      expect(money(p.ans) * count).toBeCloseTo(total, 6);
    });
  });
});

describe('golden answers — statistics and geometry invariants', () => {
  it('meanMedian: the answer lies between the smallest and largest value', () => {
    each('meanMedian', 30, p => {
      const vals = nums(p);
      const ans = Number(p.ans);
      expect(ans).toBeGreaterThanOrEqual(Math.min(...vals));
      expect(ans).toBeLessThanOrEqual(Math.max(...vals));
      if (/mean/i.test(plain(p.q))) {
        const days = vals.slice(0, 5);
        expect(ans).toBeCloseTo(days.reduce((s, v) => s + v, 0) / days.length, 6);
      } else {
        const days = [...vals.slice(0, 5)].sort((x, y) => x - y);
        expect(ans).toBe(days[2]);
      }
    });
  });

  it('volumeBox is the product of its three printed edges', () => {
    each('volumeBox', 20, p => { const [l, w, h] = nums(p); expect(Number(p.ans)).toBe(l * w * h); });
  });

  it('pythag returns a true hypotenuse, longer than either leg', () => {
    each('pythag', 20, p => {
      const [a, b] = nums(p);
      const c = Number(p.ans);
      expect(a * a + b * b).toBe(c * c);
      expect(c).toBeGreaterThan(Math.max(a, b));
    });
  });

  it('probSimple: an expected count never exceeds the number of trials', () => {
    each('probSimple', 30, p => {
      const ans = Number(p.ans);
      if (Number.isFinite(ans)) {
        const trials = Math.max(...nums(p));
        expect(ans).toBeGreaterThanOrEqual(0);
        expect(ans).toBeLessThanOrEqual(trials);
      }
    });
  });
});

describe('golden answers — algebra', () => {
  /** Algebra answers read "x = 3"; take the value the kid would check. */
  const xval = (p) => Number(String(p.ans).replace(/^[a-z]\s*=\s*/i, ''));

  it('oneStepAdd / oneStepMul / twoStep: substituting the answer satisfies the equation', () => {
    each('oneStepAdd', 20, p => { const [a, b] = nums(p); expect(xval(p) + a).toBe(b); });
    each('oneStepMul', 20, p => { const [a, b] = nums(p); expect(a * xval(p)).toBe(b); });
    each('twoStep', 20, p => { const [a, b, c] = nums(p); expect(a * xval(p) + b).toBe(c); });
  });

  it('evalX substitutes the value printed in the prompt', () => {
    each('evalX', 20, p => {
      const x = Number(plain(p.prompt).match(/x\s*=\s*(-?\d+)/)[1]);
      const [a, b] = nums(p);
      expect(Number(p.ans)).toBe(a * x + b);
    });
  });

  it('sysSolve: a is the gap between the two equations', () => {
    each('sysSolve', 20, p => { const [A, B] = [...plain(p.q).matchAll(/=\s*(\d+)/g)].map(m => Number(m[1])); expect(Number(p.ans)).toBe(A - B); });
  });
});

describe('every generator produces a well-formed, answerable problem', () => {
  it('has a prompt, a question, an answer, distinct wrongs and teach steps', () => {
    for (const [name, f] of gens) {
      for (let i = 0; i < 5; i++) {
        const p = f();
        expect(p.prompt, name).toBeTruthy();
        expect(p.q, name).toBeTruthy();
        expect(p.ans, `${name} answer`).not.toBe(undefined);
        expect(String(p.ans).length, name).toBeGreaterThan(0);
        expect(p.steps.length, `${name} teach steps`).toBeGreaterThanOrEqual(2);
        expect(p.wrongs.some(w => String(w) === String(p.ans)), `${name} has a wrong equal to its answer`).toBe(false);
      }
    }
  });
});
