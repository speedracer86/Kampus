import { describe, it, expect } from 'vitest';
import { SPEAK } from '../src/speak.js';
import { teachStepsFor } from '../src/teach-steps.js';
import { SECOND_EXAMPLES } from '../src/teach-depth.js';
import { YEAR, GRADES } from '../src/units.js';

/* The speak-script bank: Karla's voice lines with say-it-show-it cues.
   Coverage grows in tranches, so completeness here pins exactly what IS
   authored — alignment, cue validity, and the APD line rules — rather than
   demanding the whole bank at once. docs/VOICE_PASS.md carries the plan. */

const USED = new Set(GRADES.flatMap(g => YEAR[g].flatMap(u => u.skills)));
const GENERIC = new Set(['prompt', 'takeaway', 'pick']);
const BY_LAYOUT = {
  bar: new Set(['bar.pieces', 'bar.shade', 'bar.pulse']),
  line: new Set(['line.draw', 'line.start', 'line.hop', 'line.land']),
  faceoff: new Set([]),   // card.N handled by pattern
  walk: new Set([]),      // row.N handled by pattern
};

function checkLines(skill, step, entry, where) {
  expect(entry.lines?.length, `${skill} ${where}: has lines`).toBeGreaterThanOrEqual(1);
  for (const l of entry.lines) {
    // The APD rules: short spoken beats, one cue each.
    expect(l.say?.length, `${skill} ${where}: say present`).toBeGreaterThan(8);
    expect(l.say.length, `${skill} ${where}: "${l.say.slice(0, 40)}…" under the APD cap`).toBeLessThanOrEqual(120);
    expect(l.cue, `${skill} ${where}: cue present`).toBeTruthy();
    if (GENERIC.has(l.cue)) continue;
    const row = l.cue.match(/^row\.(\d+)$/), card = l.cue.match(/^card\.(\d+)$/);
    if (row) {
      expect(step.layout, `${skill} ${where}: row cue on a walk`).toBe('walk');
      expect(Number(row[1]), `${skill} ${where}: ${l.cue} exists`).toBeLessThanOrEqual(step.walk.rows.length);
      expect(Number(row[1])).toBeGreaterThanOrEqual(1);
    } else if (card) {
      expect(step.layout, `${skill} ${where}: card cue on a faceoff`).toBe('faceoff');
      expect(Number(card[1]), `${skill} ${where}: ${l.cue} exists`).toBeLessThanOrEqual(step.faceoff.cards.length);
    } else {
      expect(BY_LAYOUT[step.layout]?.has(l.cue), `${skill} ${where}: cue ${l.cue} legal on ${step.layout}`).toBe(true);
    }
  }
}

describe('the speak-script bank', () => {
  it('every authored skill is real, and its scripts align 1:1 with its steps', () => {
    for (const [skill, sp] of Object.entries(SPEAK)) {
      expect(USED.has(skill), `${skill} is a unit skill`).toBe(true);
      const base = teachStepsFor(skill) || [];
      const second = SECOND_EXAMPLES[skill] || [];
      expect(sp.steps?.length, `${skill}: one script per base step`).toBe(base.length);
      expect(sp.more?.length ?? 0, `${skill}: one script per second-example step`).toBe(second.length);
      sp.steps.forEach((entry, i) => checkLines(skill, base[i], entry, `step ${i + 1}`));
      (sp.more || []).forEach((entry, i) => checkLines(skill, second[i], entry, `more ${i + 1}`));
    }
  });

  it('tranche 1 covers the four reference skills end to end', () => {
    for (const skill of ['eqFrac', 'unitRate', 'addInt', 'twoStep']) {
      expect(SPEAK[skill], `${skill} authored`).toBeDefined();
    }
  });

  it('scripts are written to be spoken: no markup, no bare symbol soup', () => {
    for (const [skill, sp] of Object.entries(SPEAK)) {
      for (const entry of [...sp.steps, ...(sp.more || [])]) {
        for (const l of entry.lines) {
          expect(l.say.includes('<'), `${skill}: no markup in "${l.say.slice(0, 30)}"`).toBe(false);
          // A voice can't say "2/3" reliably — fractions and equations are written out.
          expect(/\d\/\d/.test(l.say), `${skill}: fraction written out in "${l.say.slice(0, 40)}"`).toBe(false);
        }
      }
    }
  });
});
