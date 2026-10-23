import { describe, it, expect } from 'vitest';
import { YEAR, GRADES } from '../src/units.js';
import { AUTHORED_STEPS } from '../src/teach-steps-bank.js';
import { REFERENCE_STEPS, teachStepsFor, LAYOUTS } from '../src/teach-steps.js';
import { SNAGS } from '../src/snags.js';

const ALL_AUTHORED = { ...REFERENCE_STEPS, ...AUTHORED_STEPS };

describe('the authored TeachStep bank', () => {
  it('covers every unit skill — the mechanical fallback is never reached', () => {
    const used = new Set(GRADES.flatMap(g => YEAR[g].flatMap(u => u.skills)));
    for (const skill of used) {
      expect(ALL_AUTHORED[skill], `authored steps for ${skill}`).toBeDefined();
      expect(teachStepsFor(skill)).toBe(ALL_AUTHORED[skill]);
    }
  });

  it('every sequence is well-formed and ends on an unpaid Try it', () => {
    for (const [skill, steps] of Object.entries(ALL_AUTHORED)) {
      expect(steps.length, skill).toBeGreaterThanOrEqual(2);
      for (const s of steps) {
        expect(LAYOUTS, `${skill} layout ${s.layout}`).toContain(s.layout);
        expect(s.prompt?.length, `${skill} prompt`).toBeGreaterThan(8);
        expect(s.hint?.length, `${skill} hint`).toBeGreaterThan(5);
        expect(s.takeaway?.length, `${skill} takeaway`).toBeGreaterThan(5);
        expect(s[s.layout], `${skill} has ${s.layout} payload`).toBeDefined();
      }
      expect(steps[steps.length - 1].tryIt, `${skill} ends on tryIt`).toBe(true);
      expect(steps.slice(0, -1).every(s => !s.tryIt), `${skill} tryIt only last`).toBe(true);
    }
  });

  it('line steps land where they say: answer === start + delta, inside [min, max]', () => {
    for (const [skill, steps] of Object.entries(ALL_AUTHORED)) {
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

  it('bar steps fit: 0 < target ≤ parts, parts sane', () => {
    for (const [skill, steps] of Object.entries(ALL_AUTHORED)) {
      for (const s of steps.filter(x => x.layout === 'bar')) {
        expect(s.bar.target, `${skill} target`).toBeGreaterThan(0);
        expect(s.bar.target, `${skill} target ≤ parts`).toBeLessThanOrEqual(s.bar.parts);
        expect(s.bar.parts, `${skill} parts`).toBeLessThanOrEqual(20);
        expect(s.bar.context?.length, `${skill} bar context`).toBeGreaterThan(10);
      }
    }
  });

  it('faceoff answers index a real card, with a why', () => {
    for (const [skill, steps] of Object.entries(ALL_AUTHORED)) {
      for (const s of steps.filter(x => x.layout === 'faceoff')) {
        expect(s.faceoff.cards.length, skill).toBeGreaterThanOrEqual(2);
        expect(s.faceoff.answer, skill).toBeGreaterThanOrEqual(0);
        expect(s.faceoff.answer, skill).toBeLessThan(s.faceoff.cards.length);
        expect(s.faceoff.why?.length, `${skill} why`).toBeGreaterThan(15);
      }
    }
  });

  it('walks end on a result row and never run empty', () => {
    for (const [skill, steps] of Object.entries(ALL_AUTHORED)) {
      for (const s of steps.filter(x => x.layout === 'walk')) {
        expect(s.walk.rows.length, skill).toBeGreaterThanOrEqual(1);
        expect(s.walk.rows[s.walk.rows.length - 1].result, `${skill} last row is result`).toBe(true);
        for (const r of s.walk.rows) { expect(r.value, skill).toBeTruthy(); expect(r.how, skill).toBeTruthy(); }
      }
    }
  });

  it('spot-checked step math re-derives (independent computation)', () => {
    const checks = [
      ['boxAdd', 'line', s => s.line.start + s.line.delta === 16 && 9 + 7 === 16],
      ['roundNum', 'line', s => s.line.answer === Math.round(647 / 10) * 10],
      ['patternNext', 'line', s => s.line.answer === 17 + (12 - 7)],
      ['cmpInt', 'line', s => s.line.answer === Math.max(-3, -8)],
      ['absVal', 'line', s => s.line.answer === -6 + Math.abs(-6)],
      ['subToNeg', 'line', s => s.line.answer === 3 - 8],
      ['subNeg', 'line', s => s.line.answer === 5 - (-3)],
      ['doubleSub', 'line', s => s.line.answer === 7 - 10 - 4],
      ['addLarger', 'line', s => s.line.answer === -14 + 9],
      ['approxRoot', 'line', s => s.line.answer === Math.floor(Math.sqrt(50))],
      ['fracOfSet', 'bar', s => s.bar.target / s.bar.parts === 3 / 4],
      ['addSameDen', 'bar', s => s.bar.target === 2 + 3],
      ['divFrac', 'bar', s => s.bar.target === 3.5 / 0.25],
      ['probSimple', 'bar', s => s.bar.target / s.bar.parts === 3 / 10],
    ];
    for (const [skill, layout, check] of checks) {
      const s = ALL_AUTHORED[skill].find(x => x.layout === layout);
      expect(s, `${skill} has a ${layout} step`).toBeDefined();
      expect(check(s), `${skill} ${layout} math`).toBe(true);
    }
  });
});

describe('sentence snags carry authored wrongs', () => {
  it('every non-numeric snag answer has ≥2 authored wrongs, none equal to the answer', () => {
    const plain = /^-?\$?\d+(?:\.\d+)?$/;      // the engine's own PLAIN shape (snag.js)
    for (const s of SNAGS) {
      const numeric = plain.test(String(s.ans).trim().replace(/−/g, '-'));
      if (!numeric) {
        expect(s.wrongs?.length, `${s.unit} "${s.ans}" needs wrongs`).toBeGreaterThanOrEqual(2);
        for (const w of s.wrongs) expect(w, s.unit).not.toBe(s.ans);
      }
    }
  });
});
