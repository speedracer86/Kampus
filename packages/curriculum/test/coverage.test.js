import { describe, it, expect } from 'vitest';
import { SKILLS, MAJOR_WORK, majorWorkCoverage, codesFor } from '../src/index.js';

describe('skill taxonomy', () => {
  it('every skill has a well-formed primary CCSS code', () => {
    for (const [key, s] of Object.entries(SKILLS)) {
      expect(s.primary, key).toMatch(/^[3-8]\.(OA|NBT|NF|RP|NS|EE|F|G|MD|SP)\.[A-D](\.\d+[a-d]?)?$/);
      expect(s.label.length, key).toBeGreaterThan(3);
    }
  });

  it('codesFor returns primary plus alsos', () => {
    expect(codesFor('eqFrac')).toEqual(['4.NF.A.1', '3.NF.A.3b']);
    expect(codesFor('nope')).toEqual([]);
  });
});

describe('majorWorkCoverage — documents the known curriculum gaps', () => {
  const allSkills = Object.keys(SKILLS);

  it('grade 7 major work is fully covered; grade 6 misses only 6.EE.C', () => {
    expect(majorWorkCoverage(7, allSkills).missing).toEqual([]);
    // 6.EE.C (dependent/independent variable relationships) is a real gap —
    // planned as a Lemonade Stand skill (cups-sold vs revenue tables) in Phase 1
    expect(majorWorkCoverage(6, allSkills).missing).toEqual(['6.EE.C']);
  });

  it('grade 4 is missing decimal notation (4.NF.C is covered, 4.OA partially)', () => {
    const { covered } = majorWorkCoverage(4, allSkills);
    expect(covered).toContain('4.NF.C');
  });

  it('grade 8 gaps match the build plan: number system and functions', () => {
    const { missing } = majorWorkCoverage(8, allSkills);
    expect(missing).toContain('8.NS.A');   // irrational approximation — to build
    expect(missing).toContain('8.F.A');    // functions — to build
    expect(missing).toContain('8.F.B');
  });

  it('grade 5 gap matches the build plan: volume (5.MD.C)', () => {
    expect(majorWorkCoverage(5, allSkills).missing).toContain('5.MD.C');
  });
});
