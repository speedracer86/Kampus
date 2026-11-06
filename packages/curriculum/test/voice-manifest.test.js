/* The manifest must match the bank it was generated from.

   A clip set drifts silently: the bank gains a line, the manifest does not, and
   the step plays three sentences over four beats with the last cue never firing.
   Nothing errors — it just goes subtly wrong, which is this project's recurring
   failure shape. So the shapes are compared, both directions.

   PARTIAL COVERAGE IS LEGAL PER SKILL AND KIND, NEVER INSIDE ONE. Credits run out
   mid-bank (owner's call, Nov 2026: grades 3-5 first, the rest on the renewal),
   and an unvoiced skill simply falls back to speechSynthesis — today's behaviour.
   A kind is a whole surface with its own fallback: `steps`+`more` are the teach
   sequence, `reteach` is the panel after a missed prove-it. Half of ONE of those
   is the state that must never ship — real voice on one step and the robot voice
   on the next, inside one sequence. So:

     - a kind in the manifest must be complete, to the line, hash for hash;
     - a kind absent from the manifest is reported, not failed — and the report
       below is where a deferred tranche becomes visible rather than forgotten;
     - a skill or kind in the manifest that is NOT in the bank is an orphan, and fails.

   The granularity cost real money to learn: generating grades 3-5 left eight
   grade-6/7 skills teaching in Karla's voice and re-teaching in the robot's,
   because the grade-ordered split cut across the `reteach` kind rather than along
   it. Legal, visible, and first in the queue when credits renew — not silent.

   The kinds are read off each bank entry rather than listed, so a tranche that
   adds a new kind of script (the re-teach scripts) is covered by this guard the
   moment it lands, with nothing here to remember to update. */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SPEAK } from '../src/speak.js';
import { MOVE_INTROS } from '../src/speak.js';
import { kindsOf, stepsOf, fullBank } from '../../../scripts/voice-plan.mjs';

/* What the generator actually works from: the skills plus Karla's move intros,
   composed as `move_<id>` entries. The guard has to compare against the same
   bank the clips were made from, or every intro reads as an orphan. */
const BANK = fullBank(SPEAK, MOVE_INTROS);

const MANIFEST = new URL('../../ui/voice/manifest.json', import.meta.url).pathname;
const VOICE = new URL('../../ui/voice/', import.meta.url).pathname;
const has = existsSync(MANIFEST);
const manifest = has ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const sha = (t) => createHash('sha256').update(t).digest('hex').slice(0, 16);
const voiced = Object.keys(BANK).filter(s => manifest[s]);

describe.skipIf(!has)('the clip manifest matches the speak bank', () => {
  it('has no skill the bank does not author', () => {
    const orphans = Object.keys(manifest).filter(s => !BANK[s]);
    expect(orphans).toEqual([]);
  });

  it('has one clip per line, with the step shapes aligned', () => {
    for (const skill of voiced) {
      for (const kind of kindsOf(BANK[skill])) {
        if (!manifest[skill][kind]) continue;        // a deferred kind, reported below
        const bank = stepsOf(BANK[skill], kind).map(s => s.lines.length);
        const clips = manifest[skill][kind].map(s => s.length);
        expect(clips, `${skill}.${kind}`).toEqual(bank);
      }
    }
  });

  it('carries no kind the bank no longer authors', () => {
    for (const skill of voiced) {
      const authored = kindsOf(BANK[skill]);
      expect(Object.keys(manifest[skill]).filter(k => !authored.includes(k)), skill).toEqual([]);
    }
  });

  it('hashes the line it was generated from, so an edited line regenerates', () => {
    for (const skill of voiced) {
      for (const kind of kindsOf(BANK[skill])) {
        if (!manifest[skill][kind]) continue;
        stepsOf(BANK[skill], kind).forEach((step, si) => {
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
    // A deliberate state, not a defect: these fall back to speechSynthesis. The
    // log is the point — it is how a deferred tranche stays visible.
    const unvoiced = Object.keys(BANK).filter(s => !manifest[s]);
    if (unvoiced.length) console.log(`    ${unvoiced.length} authored skills have no clips yet: ${unvoiced.join(', ')}`);
    const gaps = [];
    for (const skill of voiced) {
      for (const kind of kindsOf(BANK[skill])) if (!manifest[skill][kind]) gaps.push(`${skill}.${kind}`);
    }
    if (gaps.length) console.log(`    ${gaps.length} voiced skills are missing a whole kind: ${gaps.join(', ')}`);
    expect(voiced.length + unvoiced.length).toBe(Object.keys(BANK).length);
  });

  it('never carries HALF of a kind', () => {
    // The line that matters. A kind is all or nothing: anything else plays Karla
    // on one step of a sequence and the robot on the next.
    for (const skill of voiced) {
      for (const kind of kindsOf(BANK[skill])) {
        const clips = manifest[skill][kind];
        if (!clips) continue;
        const want = stepsOf(BANK[skill], kind);
        expect(clips.length, `${skill}.${kind} has ${clips.length} of ${want.length} steps`).toBe(want.length);
        clips.forEach((step, si) => {
          expect(step.filter(Boolean).length, `${skill}.${kind}[${si}] is a partial step`)
            .toBe(want[si].lines.length);
        });
      }
    }
  });
});

describe('the bank is sane whether or not clips exist', () => {
  it('keeps every spoken line inside the auditory-processing limit', () => {
    for (const [skill, entry] of Object.entries(BANK)) {
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
