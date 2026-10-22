/* The bank's unit `world` -> topic reconciliation.

   This is the test the Task 0 "grep for a retired world name returns zero hits"
   check was supposed to be. It passed while fourteen units still named a world the
   table did not contain, because nothing *displayed* those names — the seam quietly
   resolved them to the fractions default instead, and the lesson runner keys the
   adaptive tier on exactly that. A third of the year was storing its difficulty in
   the wrong place. */
import { describe, it, expect } from 'vitest';
import { unitTopic, UNIT_WORLD_ALIAS } from '../src/unit-world.js';
import { YEAR } from '@kampus/curriculum';
import { lessonsFor } from '@kampus/curriculum';

const TOPICS = ['frac', 'ratio', 'int', 'alg'];

describe('every unit in the bank resolves to a real topic', () => {
  const units = [3, 4, 5, 6, 7, 8].flatMap(g => (YEAR[g] || []).map(u => ({ ...u, grade: g })));

  it('covers the whole bank — no unit silently falls through', () => {
    const unresolved = units.filter(u => u.world !== 'all' && !unitTopic(u.world));
    expect(unresolved.map(u => `${u.id}: ${u.world}`)).toEqual([]);
  });

  it('resolves to one of the four topics, never to something invented', () => {
    for (const u of units) {
      const t = unitTopic(u.world);
      if (t === null) continue;
      expect(TOPICS, `${u.id} (${u.world})`).toContain(t);
    }
  });

  it('keeps the four current world names answering for themselves', () => {
    expect(unitTopic('The Kitchen')).toBe('frac');
    expect(unitTopic('The Market')).toBe('ratio');
    expect(unitTopic('Outside')).toBe('int');
    expect(unitTopic('The Workshop')).toBe('alg');
  });

  it('maps each retired name to the topic slot it actually occupied', () => {
    // Read off the per-grade world map the engine shipped before the rename.
    expect(unitTopic('Number Mine')).toBe('int');
    expect(unitTopic('Decimal Depths')).toBe('int');
    expect(unitTopic('Frozen Obby')).toBe('int');
    expect(unitTopic('Power Plant')).toBe('int');
    expect(unitTopic('Slope City')).toBe('ratio');
    expect(unitTopic('Puzzle Lab')).toBe('alg');
  });

  it('says "no single world" for a deliberately mixed unit instead of guessing', () => {
    expect(unitTopic('all')).toBeNull();
    expect(unitTopic(undefined)).toBeNull();
  });
});

describe('the regression this was found by', () => {
  it('does not put a third of the year in the fractions world', () => {
    let frac = 0, total = 0;
    for (const g of [3, 4, 5, 6, 7, 8]) {
      const byId = Object.fromEntries((YEAR[g] || []).map(u => [u.id, u]));
      for (const day of lessonsFor(g) || []) {
        const u = byId[day.unit];
        if (!u) continue;
        total++;
        if ((unitTopic(u.world) || 'frac') === 'frac') frac++;
      }
    }
    // Before the fix this was 236/768 wrong on top of the real fractions days.
    // The Kitchen is one world of four, so it should be nowhere near a third.
    expect(frac / total, `${frac} of ${total} days resolve to fractions`).toBeLessThan(0.3);
  });

  it('every alias target is a topic, so a typo cannot reintroduce the fallback', () => {
    for (const [name, topic] of Object.entries(UNIT_WORLD_ALIAS)) {
      expect(TOPICS, name).toContain(topic);
    }
  });
});
