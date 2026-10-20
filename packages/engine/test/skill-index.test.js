import { describe, it, expect } from 'vitest';
import { YEAR } from '@kampus/curriculum';
import { GENERATOR_INDEX, generatorForSkill, hasGenerator, skillCoverage, problemsForSkill } from '../src/skill-index.js';
import { SOURCE } from '../src/sources.js';

const bankSkills = (() => {
  const keys = new Set();
  for (const grade of Object.keys(YEAR)) for (const unit of YEAR[grade]) (unit.skills || []).forEach(k => keys.add(k));
  return [...keys];
})();

describe('every skill the bank sequences resolves to a working generator', () => {
  it('covers all of them', () => {
    const cov = skillCoverage(bankSkills);
    expect(cov.missing, `uncovered skills: ${cov.missing.join(', ')}`).toEqual([]);
    expect(cov.covered).toBe(cov.total);
  });

  it('resolves the trailing-G expansion names the bank writes without it', () => {
    for (const k of ['decAdd', 'combineLike', 'powers', 'sciNot', 'multiStep', 'slope2', 'sqroot', 'roundNum']) {
      expect(hasGenerator(k), k).toBe(true);
      expect(generatorForSkill(k).name).toBe(`${k}G`);
    }
  });

  it('produces playable problems for every bank skill', () => {
    for (const key of bankSkills) {
      const [p] = problemsForSkill(key, 1, { count: 1 });
      expect(p, `no problem for ${key}`).toBeTruthy();
      expect(p.choices.length, `${key} choices`).toBeGreaterThanOrEqual(3);
      expect(p.choices[p.correctIdx], `${key} correctIdx`).toBe(p.ans);
      expect(p.skillKey).toBe(key);
      expect(Object.values(SOURCE)).toContain(p.source);
    }
  });

  it('returns the number asked for, and an empty list for a skill with no generator', () => {
    expect(problemsForSkill('unitRate', 2, { count: 4 })).toHaveLength(4);
    expect(problemsForSkill('no-such-skill', 1, { count: 3 })).toEqual([]);
  });

  it('feeds her business state through to the world generators', () => {
    const biz = { pricePerCup: 3, unit: 'cup', unitPlural: 'cups', yesterdayRevenue: 40 };
    const [p] = problemsForSkill('pctChange', 3, { count: 1, ctx: { biz } });
    expect(p.q.replace(/<[^>]*>/g, ' ')).toMatch(/Your takings went from \$40\b/);
    expect(p.source).toBe(SOURCE.WORLD);
  });

  it('indexes every generator exactly once', () => {
    expect(GENERATOR_INDEX.size).toBe(79);
    for (const [name, entry] of GENERATOR_INDEX) {
      expect(entry.fn.name).toBe(name);
      expect(entry.tiers.size).toBeGreaterThan(0);
    }
  });
});
