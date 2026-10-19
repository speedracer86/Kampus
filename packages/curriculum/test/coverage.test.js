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

/* Before the Phase 1 expansion these tests documented the gaps
   (4.OA.A, 5.NBT.A, 5.MD.C, 6.EE.C, 8.NS.A, 8.F.A, 8.F.B — see git history).
   The expansion closed them; this now guards against regressions. */
describe('majorWorkCoverage — full coverage after Phase 1', () => {
  const allSkills = Object.keys(SKILLS);

  it('every grade has its complete major work covered', () => {
    for (const grade of [3, 4, 5, 6, 7, 8]) {
      expect(majorWorkCoverage(grade, allSkills).missing, `grade ${grade}`).toEqual([]);
    }
  });

  it('coverage math itself works: an empty skill set covers nothing', () => {
    const { covered, missing } = majorWorkCoverage(6, []);
    expect(covered).toEqual([]);
    expect(missing).toEqual(MAJOR_WORK[6]);
  });
});
