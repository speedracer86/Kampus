/* The manifest must match the bank it was generated from.

   A clip set drifts silently: the bank gains a line, the manifest does not, and
   the step plays three sentences over four beats with the last cue never firing.
   Nothing errors — it just goes subtly wrong, which is this project's recurring
   failure shape. So the shapes are compared, both directions.

   Skipped when no manifest exists: an ungenerated tranche is a valid state (the
   lesson falls back to speechSynthesis), not a failure. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SPEAK } from '../src/speak.js';

const MANIFEST = new URL('../../ui/voice/manifest.json', import.meta.url).pathname;
const VOICE = new URL('../../ui/voice/', import.meta.url).pathname;
const has = existsSync(MANIFEST);
const manifest = has ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const sha = (t) => createHash('sha256').update(t).digest('hex').slice(0, 16);

describe.skipIf(!has)('the clip manifest matches the speak bank', () => {
  it('covers every authored skill', () => {
    const authored = Object.keys(SPEAK).sort();
    const generated = Object.keys(manifest).sort();
    expect(generated).toEqual(authored);
  });

  it('has one clip per line, with the step shapes aligned', () => {
    for (const [skill, entry] of Object.entries(SPEAK)) {
      for (const kind of ['steps', 'more']) {
        const bank = (entry[kind] || []).map(s => s.lines.length);
        const clips = (manifest[skill]?.[kind] || []).map(s => s.length);
        expect(clips, `${skill}.${kind}`).toEqual(bank);
      }
    }
  });

  it('hashes the line it was generated from, so an edited line regenerates', () => {
    for (const [skill, entry] of Object.entries(SPEAK)) {
      for (const kind of ['steps', 'more']) {
        (entry[kind] || []).forEach((step, si) => {
          step.lines.forEach((line, li) => {
            const got = manifest[skill][kind][si][li];
            expect(got.sha, `${skill}.${kind}[${si}][${li}]`).toBe(sha(line.say));
          });
        });
      }
    }
  });

  it('points at files that exist, and has no orphans', () => {
    const listed = [];
    for (const [skill, entry] of Object.entries(manifest)) {
      for (const kind of ['steps', 'more']) {
        (entry[kind] || []).forEach(step => step.forEach(l => {
          listed.push(l.file);
          expect(existsSync(`${VOICE}${l.file}`), `missing ${l.file}`).toBe(true);
        }));
      }
    }
    expect(new Set(listed).size, 'two manifest entries share a file').toBe(listed.length);
  });
});

describe('the bank is sane whether or not clips exist', () => {
  it('keeps every spoken line inside the auditory-processing limit', () => {
    for (const [skill, entry] of Object.entries(SPEAK)) {
      for (const kind of ['steps', 'more']) {
        (entry[kind] || []).forEach((step, si) => {
          step.lines.forEach((line, li) => {
            // ≤120 characters, one idea per line (docs/VOICE_PASS.md).
            expect(line.say.length, `${skill}.${kind}[${si}][${li}] is ${line.say.length} chars`)
              .toBeLessThanOrEqual(120);
          });
        });
      }
    }
  });
});
