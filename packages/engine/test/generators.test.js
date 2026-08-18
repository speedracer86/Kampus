import { describe, it, expect } from 'vitest';
import { makeProblem, CURRICULUM } from '../src/index.js';

const GRADES = [3, 4, 5, 6, 7, 8];
const TOPICS = ['frac', 'ratio', 'int', 'alg'];
const TIERS = [1, 2, 3];
const RUNS_PER_CELL = 150;

/* The same fuzz the v1 Playwright suite ran in-browser: every grade x topic x tier,
   many times, asserting the structural invariants every problem must satisfy. */
describe('generator fuzz across the full curriculum', () => {
  for (const grade of GRADES) {
    for (const topic of TOPICS) {
      for (const tier of TIERS) {
        it(`G${grade} ${topic} T${tier} produces valid problems`, () => {
          for (let i = 0; i < RUNS_PER_CELL; i++) {
            const p = makeProblem(grade, topic, tier, { forceTier: tier });
            expect(p.choices.length, 'at least 3 choices').toBeGreaterThanOrEqual(3);
            expect(p.choices[p.correctIdx], 'correctIdx points at the answer').toBe(p.ans);
            expect(new Set(p.choices).size, 'no duplicate choices').toBe(p.choices.length);
            expect(p.steps.length, 'teach steps present').toBeGreaterThanOrEqual(2);
            expect(p.skill, 'no fallback generator in normal play').not.toBe('Arithmetic');
          }
        });
      }
    }
  }

  it('curriculum has pools for every grade x topic x tier', () => {
    for (const grade of GRADES)
      for (const topic of TOPICS)
        for (const tier of TIERS)
          expect(CURRICULUM[grade][topic][tier].length).toBeGreaterThan(0);
  });
});
