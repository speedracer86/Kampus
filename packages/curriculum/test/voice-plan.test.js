/* The generator's planning half — the decisions that cost money.

   Imported from scripts/ rather than src/: this is tooling, not bank content, and
   packages/curriculum is owner-authored. It is tested from here because this is
   where the bank it plans against lives.

   What is pinned, and why each one has a bill attached:

     - kinds are DISCOVERED. Tranche 3 brings re-teach scripts under a key no code
       here has seen. If the generator listed its kinds instead, those lines would
       generate as nothing, the manifest would not carry them, and the re-teach
       panel would stay silent with every test green.
     - a prefix collision THROWS. Two kinds writing `r0-0.mp3` would overwrite each
       other's clips: the second kind plays the first kind's sentences.
     - a budget cuts BETWEEN skills. Half a skill's clips is the one genuinely bad
       state — real voice on step 1, robot voice on step 2, inside one lesson.
     - the manifest lists only files that EXIST. A manifest entry pointing at a
       clip the budget deferred is a silent dead beat in a lesson. */
import { describe, it, expect } from 'vitest';
import { SPEAK } from '../src/speak.js';
import {
  plan, select, stale, buildManifest, kindsOf, stepsOf, prefixFor, gradeOf, flags, sha,
} from '../../../scripts/voice-plan.mjs';

const line = (say, cue = 'prompt') => ({ say, cue });
const step = (...says) => ({ lines: says.map(s => line(s)) });

describe('kinds are read off the bank, not listed in the code', () => {
  it('finds a kind no version of this code has seen', () => {
    expect(kindsOf({ steps: [step('a')], reteach: [step('b')] })).toEqual(['steps', 'reteach']);
  });

  it('accepts a kind the bank wrote as ONE step rather than a list', () => {
    // The re-teach panel is a single panel, so the bank may well author it that way.
    const entry = { steps: [step('a')], reteach: step('b') };
    expect(kindsOf(entry)).toEqual(['steps', 'reteach']);
    expect(stepsOf(entry, 'reteach')).toHaveLength(1);
  });

  it('ignores keys that are not scripts', () => {
    expect(kindsOf({ steps: [step('a')], note: 'authored Nov 2026', version: 3 })).toEqual(['steps']);
  });

  it('keeps the two shipped kinds on their existing letters', () => {
    // Changing these would regenerate 355 correct clips at full price.
    expect(prefixFor('steps')).toBe('t');
    expect(prefixFor('more')).toBe('m');
    expect(prefixFor('reteach')).toBe('r');
  });

  it('plans a new kind into files and a manifest slot', () => {
    const rows = plan({ eqFrac: { steps: [step('a')], reteach: [step('b', 'c')] } });
    expect(rows.map(r => r.file)).toEqual(['eqFrac/t0-0.mp3', 'eqFrac/r0-0.mp3', 'eqFrac/r0-1.mp3']);
    const m = buildManifest(rows);
    expect(m.eqFrac.reteach[0]).toHaveLength(2);
  });

  it('refuses two kinds that would write the same files', () => {
    expect(() => plan({ eqFrac: { steps: [step('a')], retry: [step('b')], reteach: [step('c')] } }))
      .toThrow(/prefix/);
  });
});

describe('priority order is youngest grade first', () => {
  it('sorts the real bank by grade, ascending', () => {
    const grades = plan(SPEAK).map(r => r.grade);
    expect(grades).toEqual([...grades].sort((a, b) => a - b));
  });

  it('gives a skill the youngest grade whose year teaches it', () => {
    expect(gradeOf('eqFrac')).toBeLessThanOrEqual(5);
    expect(gradeOf('notASkillAnywhere')).toBe(99);
  });
});

describe('a budget cuts between skills, never inside one', () => {
  const rows = [
    { skill: 'a', grade: 3, say: '12345', file: 'a/t0-0.mp3' },
    { skill: 'a', grade: 3, say: '12345', file: 'a/t0-1.mp3' },
    { skill: 'b', grade: 4, say: '1234567890', file: 'b/t0-0.mp3' },
    { skill: 'c', grade: 6, say: '12345', file: 'c/t0-0.mp3' },
  ];

  it('takes whole skills while the budget holds', () => {
    const { take, deferred } = select(rows, { budget: 12 });
    expect(take.map(r => r.skill)).toEqual(['a', 'a']);
    expect(deferred.map(r => r.skill)).toEqual(['b', 'c']);
  });

  it('never spends more than the budget', () => {
    for (const budget of [1, 9, 10, 11, 15, 19, 20, 24, 25, 100]) {
      const { take } = select(rows, { budget });
      expect(take.reduce((n, r) => n + r.say.length, 0)).toBeLessThanOrEqual(budget);
    }
  });

  it('never returns part of a skill', () => {
    for (const budget of [1, 5, 9, 11, 14, 17, 21, 24]) {
      const { take } = select(rows, { budget });
      for (const skill of new Set(take.map(r => r.skill))) {
        expect(take.filter(r => r.skill === skill)).toHaveLength(rows.filter(r => r.skill === skill).length);
      }
    }
  });

  it('stops rather than skipping ahead to a cheaper skill', () => {
    // At 16: a fits (10), b does not (would be 20), and c WOULD (15). Taking c
    // would quietly reorder the owner's priority to use up the last credits —
    // grade 6 getting a voice while a grade 4 skill waits.
    const { take } = select(rows, { budget: 16 });
    expect(take.map(r => r.skill)).toEqual(['a', 'a']);
  });

  it('filters by grade and by skill', () => {
    expect(select(rows, { grades: [3, 4] }).take.map(r => r.skill)).toEqual(['a', 'a', 'b']);
    expect(select(rows, { only: ['c'] }).take.map(r => r.skill)).toEqual(['c']);
  });

  it('takes everything when no budget is set', () => {
    expect(select(rows, {}).take).toHaveLength(4);
    expect(select(rows, {}).deferred).toHaveLength(0);
  });
});

describe('regeneration pays only for what changed', () => {
  const rows = plan({ eqFrac: { steps: [step('one', 'two')] } });
  const current = buildManifest(rows);

  it('skips a line whose text is unchanged', () => {
    expect(stale(rows, current)).toHaveLength(0);
  });

  it('regenerates a line whose text was edited', () => {
    const edited = plan({ eqFrac: { steps: [step('one', 'two, rewritten')] } });
    expect(stale(edited, current).map(r => r.lineIndex)).toEqual([1]);
  });

  it('regenerates a line the manifest claims but whose file is gone', () => {
    expect(stale(rows, current, { exists: (f) => !f.endsWith('t0-1.mp3') }).map(r => r.lineIndex)).toEqual([1]);
  });

  it('regenerates everything with force', () => {
    expect(stale(rows, current, { force: true })).toHaveLength(2);
  });

  it('hashes the say text, so a cue change alone is free', () => {
    const recued = plan({ eqFrac: { steps: [{ lines: [line('one', 'takeaway'), line('two', 'bar.pulse')] }] } });
    expect(stale(recued, current)).toHaveLength(0);
    expect(rows[0].sha).toBe(sha('one'));
  });
});

describe('the manifest never promises a clip that is not there', () => {
  const rows = plan({ a: { steps: [step('x', 'y')] }, b: { steps: [step('z')] } });

  it('leaves out a line whose file was never written', () => {
    const m = buildManifest(rows, { exists: (f) => !f.startsWith('b/') });
    expect(Object.keys(m)).toEqual(['a']);
  });

  it('is built from the full plan, so a filtered run keeps the skills it skipped', () => {
    // b was not generated in this run but its clips are on disk from the last one.
    const { take } = select(rows, { only: ['a'] });
    expect(take.every(r => r.skill === 'a')).toBe(true);
    expect(Object.keys(buildManifest(rows, { exists: () => true }))).toEqual(['a', 'b']);
  });

  it('keeps bank order, so a run does not re-key the committed file', () => {
    const m = buildManifest(plan({ zeta: { steps: [step('x')] }, alpha: { steps: [step('y')] } }));
    expect(Object.keys(m)).toEqual(['zeta', 'alpha']);
  });

  it('writes one file per line across the real bank', () => {
    const files = plan(SPEAK).map(r => r.file);
    expect(new Set(files).size).toBe(files.length);
  });
});

describe('the flags', () => {
  it('reads both --x y and --x=y', () => {
    expect(flags(['--grades', '3,4,5']).grades).toEqual([3, 4, 5]);
    expect(flags(['--grades=3,5']).grades).toEqual([3, 5]);
    expect(flags(['--only', 'eqFrac, addInt']).only).toEqual(['eqFrac', 'addInt']);
    expect(flags(['--budget', '9700']).budget).toBe(9700);
  });

  it('ignores a budget that is not a positive number', () => {
    expect(flags(['--budget', 'lots']).budget).toBe(0);
    expect(flags(['--budget', '0']).budget).toBe(0);
    expect(flags([]).budget).toBe(0);
  });

  it('does not swallow the next flag as a value', () => {
    expect(flags(['--grades', '--dry']).grades).toEqual([]);
    expect(flags(['--grades', '--dry']).dry).toBe(true);
  });
});
