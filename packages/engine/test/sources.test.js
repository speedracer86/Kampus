import { describe, it, expect } from 'vitest';
import { CURRICULUM } from '../src/curriculum.js';
import '../src/expansion.js';
import { makeProblem } from '../src/adaptive.js';
import { SOURCE, SOURCES, sourceFor, WORLD_GENERATORS, COSTUME_MARKERS } from '../src/sources.js';

/** Every generator the curriculum can actually serve. */
function allGenerators() {
  const seen = new Map();
  for (const g of [3, 4, 5, 6, 7, 8])
    for (const t of ['frac', 'ratio', 'int', 'alg'])
      for (const tier of [1, 2, 3])
        for (const f of (CURRICULUM[g]?.[t]?.[tier] || [])) if (!seen.has(f.name)) seen.set(f.name, f);
  return seen;
}
const plain = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');

describe('the three-source rule (PLAY_SYSTEM §2)', () => {
  it('ships no untagged generator', () => {
    const untagged = [...allGenerators().keys()].filter(n => !sourceFor(n));
    expect(untagged).toEqual([]);
  });

  it('tags nothing that is not actually registered', () => {
    const names = allGenerators();
    expect(Object.keys(SOURCES).filter(n => !names.has(n))).toEqual([]);
  });

  it('uses only world, life or gym', () => {
    const allowed = new Set(Object.values(SOURCE));
    expect(Object.values(SOURCES).every(v => allowed.has(v))).toBe(true);
  });

  it('stamps the source onto every problem it generates', () => {
    for (const grade of [3, 5, 8])
      for (const topic of ['frac', 'ratio', 'int', 'alg'])
        for (let i = 0; i < 10; i++) {
          const p = makeProblem(grade, topic, 1);
          expect(Object.values(SOURCE)).toContain(p.source);
        }
  });

  it('wears no costume: no third-person actor with numbers that are not hers', () => {
    const offenders = [];
    for (const [name, gen] of allGenerators()) {
      for (let i = 0; i < 20; i++) {
        const text = plain(gen().q) + ' ' + plain(gen().prompt);
        if (COSTUME_MARKERS.some(re => re.test(text))) { offenders.push(`${name}: ${text.trim().slice(0, 70)}`); break; }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('world generators read her state', () => {
  const biz = { pricePerCup: 3, unit: 'cup', unitPlural: 'cups', yesterdayRevenue: 40, meanCups: 12 };

  it('every world generator accepts a ctx and still works without one', () => {
    const gens = allGenerators();
    for (const name of WORLD_GENERATORS) {
      const gen = gens.get(name);
      expect(gen, `${name} is tagged world but not registered`).toBeTruthy();
      expect(() => gen()).not.toThrow();           // no stand yet
      expect(() => gen({ biz })).not.toThrow();    // with her stand
    }
  });

  it('uses her price rather than an invented one', () => {
    const gens = allGenerators();
    const q = plain(gens.get('unitRate')({ biz }).q).replace(/\s+/g, ' ');
    expect(q).toMatch(/cups? for \$\d+/);
    const depVar = gens.get('depVar');
    for (let i = 0; i < 20; i++) expect(plain(depVar({ biz }).q)).toContain('m = 3c');
  });

  it('uses her takings for percent change', () => {
    const gens = allGenerators();
    for (let i = 0; i < 20; i++) {
      expect(plain(gens.get('pctChange')({ biz }).q)).toMatch(/Your takings went from \$40\b/);
    }
  });
});
