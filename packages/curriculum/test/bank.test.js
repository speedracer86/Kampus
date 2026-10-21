import { describe, it, expect } from 'vitest';
import { SKILLS, MAJOR_WORK, majorWorkCoverage } from '../src/skills.js';
import { YEAR, GRADES, quizSkills } from '../src/units.js';
import { lessonsFor } from '../src/lessons.js';
import { SNAGS, snagFor } from '../src/snags.js';
import { TEACH } from '../src/teach.js';

const bandOf = g => (g <= 4 ? 'a' : g <= 6 ? 'b' : 'c');

describe('the unit maps', () => {
  it('cover all 32 weeks with contiguous units and real skills', () => {
    for (const g of GRADES) {
      const units = YEAR[g];
      expect(units.length).toBeGreaterThanOrEqual(7);
      let week = 1;
      for (const u of units) {
        expect(u.weeks[0]).toBe(week);                    // contiguous, no gaps
        expect(u.weeks[1]).toBeGreaterThanOrEqual(u.weeks[0]);
        week = u.weeks[1] + 1;
        expect(u.skills.length).toBeGreaterThan(0);
        for (const s of u.skills) expect(SKILLS[s], `${u.id} skill ${s}`).toBeDefined();
      }
      expect(week - 1).toBe(32);
    }
  });

  it('every grade’s units cover its full major work', () => {
    for (const g of GRADES) {
      const all = YEAR[g].flatMap(u => u.skills);
      const { missing } = majorWorkCoverage(g, all);
      expect(missing, `grade ${g} missing ${missing}`).toEqual([]);
    }
  });

  it('unit quizzes mix the unit with recent review', () => {
    const { unit, review } = quizSkills(6, 3);
    expect(unit).toContain('addInt');
    expect(review.length).toBeGreaterThan(0);
    for (const s of review) expect(unit).not.toContain(s);
  });
});

describe('the lesson sequence', () => {
  it('runs a 128-day year ending in the grade test', () => {
    for (const g of GRADES) {
      const seq = lessonsFor(g);
      expect(seq.length).toBe(128);
      expect(seq[127].type).toBe('test');
      expect(seq.filter(d => d.type === 'quiz').length).toBe(YEAR[g].length - 1);
    }
  });

  it('every skill gets exactly one teach-first day the FIRST time it appears — later units refresh, never re-teach', () => {
    for (const g of GRADES) {
      const seq = lessonsFor(g);
      const last = YEAR[g][YEAR[g].length - 1];
      const before = new Set(YEAR[g].slice(0, -1).flatMap(u => u.skills));
      for (const u of YEAR[g]) {
        for (const s of u.skills) {
          const days = seq.filter(d => d.unit === u.id && d.skill === s);
          // in the final unit, only a first-appearance skill (a hybrid unit's new
          // content, like grade 6 statistics) gets a 'new' day
          const wantsNew = u !== last || !before.has(s);
          expect(days.some(d => d.type === 'new'), `${u.id}/${s} new`).toBe(wantsNew);
          expect(days.some(d => d.type === 'guided'), `${u.id}/${s} guided`).toBe(true);
        }
      }
      // ...and every skill in the year has a teach-first day SOMEWHERE
      for (const s of new Set(YEAR[g].flatMap(u => u.skills))) {
        expect(seq.some(d => d.type === 'new' && d.skill === s), `grade ${g}/${s} taught`).toBe(true);
      }
    }
  });

  it('opens every unit with its snag on day one', () => {
    for (const g of GRADES) {
      const seq = lessonsFor(g);
      for (const u of YEAR[g]) {
        expect(seq.find(d => d.unit === u.id).snag).toBe(u.id);
      }
    }
  });
});

describe('the snag bank', () => {
  it('has one snag per unit, banded correctly, resolving into a unit skill', () => {
    for (const g of GRADES) {
      for (const u of YEAR[g]) {
        const s = snagFor(u.id);
        expect(s, `snag for ${u.id}`).toBeDefined();
        expect(s.band).toBe(bandOf(g));
        expect(u.skills, `${u.id} resolves ${s.resolves}`).toContain(s.resolves);
        expect(s.scene.length).toBeGreaterThan(20);
        expect(s.q.length).toBeGreaterThan(3);
        expect(String(s.ans).length).toBeGreaterThan(0);
      }
    }
    expect(SNAGS.length).toBe(GRADES.reduce((n, g) => n + YEAR[g].length, 0));
  });

  it('snag arithmetic is right (hand-verified spot checks, computed)', () => {
    const checks = [
      ['3-1', 3 * 4], ['3-2', 6 * 5], ['3-3', 148 + 236], ['3-4', 7 * 8],
      ['4-1', 1286 + 905], ['4-2', 24 * 12], ['4-3', 15 * 36],
      ['5-2', 40 * 0.35], ['5-7', 4.5 + 6 + 5.25],
      ['6-3', 3.5 / 0.25], ['6-4', 8 - 3], ['6-5', (29 - 5) / 2], ['6-6', 3 * 4 - 2 * 2],
      ['7-1', (3 / 2) * 8], ['7-2', 12 - 5 + 8 - 9 - 3], ['7-3', 4 * (2.5 + 1.75)],
      ['7-4', 2.5 * 0.8 * 1.1], ['7-6', 30], ['7-7', 12 * 0.15],
      ['8-2', (45 - 12) / 3], ['8-4', 30 / 1.5], ['8-5', 40 - 10 * 2.5],
      ['8-6', Math.hypot(6, 8)], ['8-7', (18 + 22 + 26) / 3], ['8-8', 27 / 3],
    ];
    for (const [id, val] of checks) {
      const num = parseFloat(String(snagFor(id).ans).replace(/[^\d.−-]/g, '').replace('−', '-'));
      expect(num, `snag ${id}`).toBeCloseTo(val, 2);
    }
  });
});

describe('the teach-panel bank', () => {
  it('covers every skill that appears in any unit', () => {
    const used = new Set(GRADES.flatMap(g => YEAR[g].flatMap(u => u.skills)));
    for (const key of used) {
      const p = TEACH[key];
      expect(p, `panel for ${key}`).toBeDefined();
      expect(p.bigIdea.length).toBeGreaterThan(20);
      expect(p.steps.length).toBeGreaterThanOrEqual(1);
      for (const st of p.steps) { expect(st.do).toBeTruthy(); expect(st.ex).toBeTruthy(); }
      expect(p.yourTurn.q).toBeTruthy();
      expect(p.yourTurn.a).toBeTruthy();
    }
  });

  it('yourTurn arithmetic is right (hand-verified spot checks, computed)', () => {
    const checks = [
      ['multFact', 48], ['divFact', 6], ['boxMul', 9], ['boxAdd', 7],
      ['addBig', 425], ['subBig', 276], ['twoStepStory', 4 * 6 - 9], ['patternNext', 22],
      ['mulDigit', 31 * 14], ['divRem', null], ['fracOfSet', 12], ['multCompare', 24],
      ['decAdd', 6.25], ['decMul', 3], ['decDiv', 9], ['powTen', 470],
      ['unitFracDiv', 6], ['divFrac', 3], ['scaleRecipe', 5],
      ['pctOf', 18], ['findWhole', 48], ['easyPct', 3.8], ['tipCalc', 7],
      ['discountTax', 40 * 0.9 * 1.05], ['simpleInterest', 12], ['propSolve', 8],
      ['addInt', 5], ['subNeg', 10], ['mulInt', -30], ['divInt', 4], ['mixedInt', 3],
      ['doubleSub', -7], ['addLarger', -7], ['subToNeg', -7], ['absVal', 15],
      ['orderOps', 8], ['orderOpsParen', 10], ['evalX', 27], ['evalTwoVar', 11],
      ['oneStepAdd', 5], ['oneStepMul', 7], ['twoStep', 5], ['twoStepNeg', -5],
      ['multiStep', 4], ['depVar', 14], ['meanMedian', 7],
      ['powers', 27], ['sqroot', 8], ['slope2', 4], ['funcEval', 11], ['funcRate', 5],
      ['sysSolve', 3], ['pythag', 13], ['areaModel', 27], ['volumeBox', 60],
    ];
    for (const [key, val] of checks) {
      if (val === null) continue;
      const num = parseFloat(String(TEACH[key].yourTurn.a).replace(/[^\d.−-]/g, '').replace('−', '-'));
      expect(num, `panel ${key}`).toBeCloseTo(val, 2);
    }
  });
});
