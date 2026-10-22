/* Snag answer shaping (AUDIT B7).

   The bug this pins: a Snag authored as a scene ("The 8-pack (43¢ vs 45¢)") was
   fed through numeric distractor generation, producing a choice set where the
   answer was the only one that looked like an answer. She wins by shape, the
   lesson records an attempt she never made, and the Snag's whole job — meet the
   problem before the method — is lost. */
import { describe, it, expect } from 'vitest';
import { snagChoices, snagIsPickable } from '../src/snag.js';

describe('plain numbers get real near misses', () => {
  it('offers four choices including the answer', () => {
    const ch = snagChoices('12');
    expect(ch).toHaveLength(4);
    expect(ch).toContain('12');
    expect(new Set(ch).size).toBe(4);
  });

  it('keeps the answer out of a fixed slot', () => {
    // Deterministic, but not always first — otherwise the first button always wins.
    const slots = new Set(['12', '30', '384', '45', '7'].map(a => snagChoices(a).indexOf(a)));
    expect(slots.size).toBeGreaterThan(1);
  });

  it('keeps the money shape, so the answer is not the only one with a $', () => {
    const ch = snagChoices('$5.40');
    expect(ch.every(c => c.startsWith('$') || c.startsWith('−$'))).toBe(true);
    expect(ch.every(c => /\d\.\d\d$/.test(c))).toBe(true);
  });

  it('keeps a negative answer in negative company', () => {
    const ch = snagChoices('−20');
    expect(ch).toContain('−20');
    expect(ch.every(c => c.startsWith('−'))).toBe(true);
  });

  it('never offers the answer twice or offers zero as filler', () => {
    for (const a of ['1', '2', '3', '7', '10', '100', '0.5']) {
      const ch = snagChoices(a);
      if (!ch.length) continue;
      expect(new Set(ch).size, a).toBe(ch.length);
      expect(ch.filter(c => c === '0'), a).toEqual([]);
    }
  });
});

describe('everything else reveals instead of pretending to be a quiz', () => {
  const scenes = ['No — they are equal', '5/6', 'The 25×25×24 one',
    'The 8-pack (43¢ vs 45¢)', '1.2 × 10^6', '25 cents', 'the red one', ''];

  it('returns no choices at all', () => {
    for (const a of scenes) expect(snagChoices(a), a).toEqual([]);
  });

  it('says plainly that it is not pickable', () => {
    for (const a of scenes) expect(snagIsPickable(a), a).toBe(false);
    expect(snagIsPickable('12')).toBe(true);
  });

  it('never mixes a worded answer in with bare numbers', () => {
    // The exact shape of the old bug: the answer was the only non-number.
    const ch = snagChoices('The 8-pack (43¢ vs 45¢)');
    expect(ch.some(c => /^\d+$/.test(c))).toBe(false);
  });
});

describe('every authored Snag is either pickable or revealable, never rigged', () => {
  it('holds across the whole bank', async () => {
    const { SNAGS } = await import('@kampus/curriculum');
    for (const s of SNAGS) {
      const ch = snagChoices(s.ans);
      if (!ch.length) continue;                       // reveal path
      expect(ch.length, `${s.unit}: ${s.ans}`).toBe(4);
      expect(ch, `${s.unit}`).toContain(String(s.ans).trim());
      // No choice may be distinguishable by shape: same sign, same prefix, same kind.
      const shape = (c) => `${c.startsWith('−') ? '-' : '+'}${c.includes('$') ? '$' : ''}${/\./.test(c) ? 'd' : 'i'}`;
      expect(new Set(ch.map(shape)).size, `${s.unit}: ${JSON.stringify(ch)}`).toBe(1);
    }
  });
});
