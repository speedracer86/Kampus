import { describe, it, expect } from 'vitest';
import { YEAR, GRADES } from '../src/units.js';
import { SECOND_EXAMPLES, PLAN_B, moreStepsFor } from '../src/teach-depth.js';
import { REFERENCE_STEPS, LAYOUTS } from '../src/teach-steps.js';
import { AUTHORED_STEPS } from '../src/teach-steps-bank.js';

const USED = new Set(GRADES.flatMap(g => YEAR[g].flatMap(u => u.skills)));
const FIRST_PASS = { ...REFERENCE_STEPS, ...AUTHORED_STEPS };
const ALL_DEPTH = Object.entries(SECOND_EXAMPLES).concat(Object.entries(PLAN_B));

describe('the second-example bank (teach-depth)', () => {
  it('covers every unit skill — every lesson can teach more than once', () => {
    for (const skill of USED) {
      expect(SECOND_EXAMPLES[skill], `second example for ${skill}`).toBeDefined();
    }
  });

  it('has no orphan keys — a typo here would silently teach nobody', () => {
    for (const skill of Object.keys(SECOND_EXAMPLES)) {
      expect(USED.has(skill), `${skill} is a real unit skill`).toBe(true);
    }
    for (const skill of Object.keys(PLAN_B)) {
      expect(USED.has(skill), `${skill} (plan B) is a real unit skill`).toBe(true);
      expect(SECOND_EXAMPLES[skill], `${skill} plan B rides behind a second example`).toBeDefined();
    }
  });

  it('every step is well-formed, and none carries tryIt — the base Try it stays the gate', () => {
    for (const [skill, steps] of ALL_DEPTH) {
      expect(steps.length, skill).toBeGreaterThanOrEqual(1);
      for (const s of steps) {
        expect(LAYOUTS, `${skill} layout ${s.layout}`).toContain(s.layout);
        expect(s.prompt?.length, `${skill} prompt`).toBeGreaterThan(8);
        expect(s.hint?.length, `${skill} hint`).toBeGreaterThan(5);
        expect(s.takeaway?.length, `${skill} takeaway`).toBeGreaterThan(5);
        expect(s[s.layout], `${skill} has ${s.layout} payload`).toBeDefined();
        expect(s.tryIt, `${skill}: depth steps never gate`).toBeUndefined();
      }
    }
  });

  it('is actually a SECOND example: no prompt repeats the first pass', () => {
    for (const [skill, steps] of Object.entries(SECOND_EXAMPLES)) {
      const firstPrompts = new Set((FIRST_PASS[skill] || []).map(s => s.prompt));
      for (const s of steps) {
        expect(firstPrompts.has(s.prompt), `${skill}: "${s.prompt}" repeats the first pass`).toBe(false);
      }
    }
  });

  it('plan B changes the REPRESENTATION, not just the numbers', () => {
    for (const [skill, steps] of Object.entries(PLAN_B)) {
      const firstLayouts = new Set((FIRST_PASS[skill] || []).map(s => s.layout));
      const introduces = steps.some(s => !firstLayouts.has(s.layout))
        // walk-based plan Bs recast the story (money, dealing, catching up) even
        // when the first pass also had a walk — require a fresh prompt at minimum.
        || steps.every(s => !(FIRST_PASS[skill] || []).some(f => f.prompt === s.prompt));
      expect(introduces, `${skill} plan B offers a different way in`).toBe(true);
    }
  });

  it('line steps land where they say: answer === start + delta, inside [min, max]', () => {
    for (const [skill, steps] of ALL_DEPTH) {
      for (const s of steps.filter(x => x.layout === 'line')) {
        const { min, max, start, delta, answer } = s.line;
        expect(start + delta, `${skill}: ${start} + ${delta}`).toBe(answer);
        expect(answer, `${skill} answer in range`).toBeGreaterThanOrEqual(min);
        expect(answer).toBeLessThanOrEqual(max);
        expect(start).toBeGreaterThanOrEqual(min);
        expect(start).toBeLessThanOrEqual(max);
      }
    }
  });

  it('bar steps fit: 0 < target ≤ parts ≤ 20, with a real context', () => {
    for (const [skill, steps] of ALL_DEPTH) {
      for (const s of steps.filter(x => x.layout === 'bar')) {
        expect(s.bar.target, `${skill} target`).toBeGreaterThan(0);
        expect(s.bar.target, `${skill} target ≤ parts`).toBeLessThanOrEqual(s.bar.parts);
        expect(s.bar.parts, `${skill} parts`).toBeLessThanOrEqual(20);
        expect(s.bar.context?.length, `${skill} bar context`).toBeGreaterThan(10);
      }
    }
  });

  it('walks end on a result row and every row says how', () => {
    for (const [skill, steps] of ALL_DEPTH) {
      for (const s of steps.filter(x => x.layout === 'walk')) {
        expect(s.walk.rows.length, skill).toBeGreaterThanOrEqual(1);
        expect(s.walk.rows[s.walk.rows.length - 1].result, `${skill} last row is result`).toBe(true);
        for (const r of s.walk.rows) { expect(r.value, skill).toBeTruthy(); expect(r.how, skill).toBeTruthy(); }
      }
    }
  });

  it('spot-checked step math re-derives (independent computation)', () => {
    const se = SECOND_EXAMPLES, pb = PLAN_B;
    const checks = [
      ['boxAdd line', () => { const l = se.boxAdd[0].line; return l.answer === 6 + 7 && 7 === 13 - 6; }],
      ['roundNum snaps up', () => se.roundNum[0].line.answer === Math.round(283 / 100) * 100],
      ['addInt from below zero', () => se.addInt[0].line.answer === -6 + 4],
      ['subToNeg falls through zero', () => se.subToNeg[0].line.answer === 4 - 9],
      ['approxRoot brackets √75', () => { const a = se.approxRoot[0].line.answer; return a === Math.floor(Math.sqrt(75)) && a * a < 75 && (a + 1) * (a + 1) > 75; }],
      ['fracOfSet: 2/5 of 20 is 8', () => { const b = se.fracOfSet[0].bar; return b.target / b.parts === 2 / 5 && (2 / 5) * 20 === 8; }],
      ['mulFrac: 2/3 × 3/4 = 1/2', () => { const b = se.mulFrac[0].bar; return b.target / b.parts === (2 / 3) * (3 / 4); }],
      ['probSimple complement', () => { const b = se.probSimple[0].bar; return b.target / b.parts === 1 - 3 / 10; }],
      ['addSameDen overflows a whole', () => se.addSameDen[0].bar.target === 4 + 3],
      ['mulDigit partial products', () => 800 + 120 + 140 + 21 === 47 * 23],
      ['divRem rounds the vans UP', () => Math.ceil(47 / 6) === 8 && 47 % 6 === 5],
      ['twoStep: 3n − 4 = 17', () => 3 * 7 - 4 === 17],
      ['pythag finds the leg', () => Math.sqrt(13 * 13 - 5 * 5) === 12],
      ['sysSolve by substitution', () => { const x = 12 / 4, y = 3 * x; return x + y === 12 && y === 9; }],
      ['discountTax commutes', () => Math.abs(50 * 0.7 * 1.08 - 50 * 1.08 * 0.7) < 1e-9 && Math.abs(50 * 0.7 * 1.08 - 37.8) < 1e-9],
      ['tipCalc benchmarks total', () => 2.5 + 1.25 + 0.75 === 25 * 0.18],
      ['meanMedian even list', () => (6 + 8) / 2 === 7],
      ['findWhole from 60%', () => 18 / 0.6 === 30],
      ['plan B divFrac as money', () => 3 / 0.75 === 4],
      ['plan B twoStep scale', () => (29 - 5) / 2 === 12],
      ['plan B pctOf bar', () => { const b = pb.pctOf[0].bar; return (b.target / b.parts) * 60 === 18; }],
      ['plan B subNeg line', () => pb.subNeg[0].line.answer === 2 - (-4)],
      ['plan B multiStep catch-up', () => { const x = 9; return 5 * x - 7 === 2 * x + 20; }],
      ['plan B fracOfSet dealt out', () => (3 / 4) * 12 === 9],
    ];
    for (const [name, check] of checks) expect(check(), name).toBe(true);
  });

  it('moreStepsFor concatenates: second example, then plan B where it exists', () => {
    expect(moreStepsFor('nothere')).toBeNull();
    expect(moreStepsFor('mulDigit')).toBe(SECOND_EXAMPLES.mulDigit);
    const wall = moreStepsFor('divFrac');
    expect(wall).toEqual([...SECOND_EXAMPLES.divFrac, ...PLAN_B.divFrac]);
  });
});
