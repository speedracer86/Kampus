/* The manifest must match the bank it was generated from.

   A clip set drifts silently: the bank gains a line, the manifest does not, and
   the step plays three sentences over four beats with the last cue never firing.
   Nothing errors — it just goes subtly wrong, which is this project's recurring
   failure shape. So the shapes are compared, both directions.

   PARTIAL COVERAGE IS LEGAL, AT SKILL GRANULARITY ONLY. Credits run out mid-bank
   (owner's call, Nov 2026: grades 3-5 first, grade 8 after the renewal), and a
   skill with no clips simply falls back to speechSynthesis — today's behaviour.
   A skill with SOME of its clips is the state that must never ship: real voice on
   one step, robot voice on the next, inside one lesson. So:

     - a skill in the manifest must be complete, to the line, hash for hash;
     - a skill absent from the manifest is reported, not failed;
     - a skill in the manifest that is NOT in the bank is an orphan, and fails.

   The kinds are read off each bank entry rather than listed, so a tranche that
   adds a new kind of script (the re-teach scripts) is covered by this guard the
   moment it lands, with nothing here to remember to update. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SPEAK } from '../src/speak.js';
import { kindsOf, stepsOf } from '../../../scripts/voice-plan.mjs';

const MANIFEST = new URL('../../ui/voice/manifest.json', import.meta.url).pathname;
const VOICE = new URL('../../ui/voice/', import.meta.url).pathname;
const has = existsSync(MANIFEST);
const manifest = has ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const sha = (t) => createHash('sha256').update(t).digest('hex').slice(0, 16);
const voiced = Object.keys(SPEAK).filter(s => manifest[s]);

describe.skipIf(!has)('the clip manifest matches the speak bank', () => {
  it('has no skill the bank does not author', () => {
    const orphans = Object.keys(manifest).filter(s => !SPEAK[s]);
    expect(orphans).toEqual([]);
  });

  it('has one clip per line, with the step shapes aligned', () => {
    for (const skill of voiced) {
      for (const kind of kindsOf(SPEAK[skill])) {
        const bank = stepsOf(SPEAK[skill], kind).map(s => s.lines.length);
        const clips = (manifest[skill]?.[kind] || []).map(s => s.length);
        expect(clips, `${skill}.${kind}`).toEqual(bank);
      }
    }
  });

  it('carries no kind the bank no longer authors', () => {
    for (const skill of voiced) {
      const authored = kindsOf(SPEAK[skill]);
      expect(Object.keys(manifest[skill]).filter(k => !authored.includes(k)), skill).toEqual([]);
    }
  });

  it('hashes the line it was generated from, so an edited line regenerates', () => {
    for (const skill of voiced) {
      for (const kind of kindsOf(SPEAK[skill])) {
        stepsOf(SPEAK[skill], kind).forEach((step, si) => {
          step.lines.forEach((line, li) => {
            const got = manifest[skill][kind][si][li];
            expect(got?.sha, `${skill}.${kind}[${si}][${li}]`).toBe(sha(line.say));
          });
        });
      }
    }
  });

  it('points at files that exist, and has no orphans', () => {
    const listed = [];
    for (const [skill, entry] of Object.entries(manifest)) {
      for (const kind of Object.keys(entry)) {
        (entry[kind] || []).forEach(step => step.forEach(l => {
          listed.push(l.file);
          expect(existsSync(`${VOICE}${l.file}`), `missing ${l.file}`).toBe(true);
        }));
      }
    }
    expect(new Set(listed).size, 'two manifest entries share a file').toBe(listed.length);
  });

  it('reports what is still unvoiced rather than failing it', () => {
    // A deliberate state, not a defect: those skills fall back to speechSynthesis.
    const unvoiced = Object.keys(SPEAK).filter(s => !manifest[s]);
    if (unvoiced.length) console.log(`    ${unvoiced.length} authored skills have no clips yet: ${unvoiced.join(', ')}`);
    expect(voiced.length + unvoiced.length).toBe(Object.keys(SPEAK).length);
  });
});

describe('the bank is sane whether or not clips exist', () => {
  it('keeps every spoken line inside the auditory-processing limit', () => {
    for (const [skill, entry] of Object.entries(SPEAK)) {
      for (const kind of kindsOf(entry)) {
        stepsOf(entry, kind).forEach((step, si) => {
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
