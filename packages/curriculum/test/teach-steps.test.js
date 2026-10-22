/* The TeachStep contract (§0b).

   Two things are worth pinning here. The mechanical conversion must not lose or
   invent content — the bank is owner-authored, and a converter that paraphrases is
   a converter that quietly rewrites the curriculum. And every step must be
   renderable: a layout the UI does not have is a blank panel in a lesson. */
import { describe, it, expect } from 'vitest';
import { TEACH } from '../src/teach.js';
import { teachStepsFor, walkStepsFrom, REFERENCE_STEPS, REFERENCE_SKILLS, LAYOUTS } from '../src/teach-steps.js';

const PAYLOAD = { walk: 'walk', faceoff: 'faceoff', line: 'line', bar: 'bar' };
const skills = Object.keys(TEACH);

describe('every authored panel converts to renderable steps', () => {
  it('covers every skill in the bank', () => {
    const missing = skills.filter(k => !teachStepsFor(k)?.length);
    expect(missing).toEqual([]);
  });

  it('only ever uses a layout the UI implements, with its payload present', () => {
    for (const k of skills) {
      for (const s of teachStepsFor(k)) {
        expect(LAYOUTS, `${k}: ${s.layout}`).toContain(s.layout);
        expect(s[PAYLOAD[s.layout]], `${k} step "${s.prompt}" has no ${s.layout} payload`).toBeTruthy();
      }
    }
  });

  it('gives every step a prompt, a hint and a takeaway', () => {
    for (const k of skills) {
      for (const s of teachStepsFor(k)) {
        expect(s.prompt, `${k}`).toBeTruthy();
        expect(s.hint, `${k}: ${s.prompt}`).toBeTruthy();
        expect(s.takeaway, `${k}: ${s.prompt}`).toBeTruthy();
      }
    }
  });

  it('ends on an unpaid "Try it" wherever the panel has a yourTurn', () => {
    for (const k of skills) {
      if (!TEACH[k].yourTurn) continue;
      const steps = teachStepsFor(k);
      expect(steps[steps.length - 1].tryIt, `${k} does not end on Try it`).toBe(true);
    }
  });
});

describe('the conversion is mechanical, not a rewrite', () => {
  it('carries each {do, ex} across verbatim, in order', () => {
    const panel = TEACH.multFact;
    const [walk] = walkStepsFrom(panel);
    expect(walk.layout).toBe('walk');
    expect(walk.prompt).toBe(panel.bigIdea);
    expect(walk.walk.rows.map(r => r.how)).toEqual(panel.steps.map(s => s.do));
    expect(walk.walk.rows.map(r => r.value)).toEqual(panel.steps.map(s => s.ex));
  });

  it('never paraphrases: every converted row appears in the panel it came from', () => {
    for (const k of skills) {
      if (REFERENCE_SKILLS.includes(k)) continue;        // authored, not converted
      const panel = TEACH[k];
      const own = new Set([...(panel.steps || []).flatMap(s => [s.do, s.ex]),
        panel.bigIdea, panel.yourTurn?.q, panel.yourTurn?.a]);
      for (const s of walkStepsFrom(panel) || []) {
        for (const r of s.walk.rows) {
          if (s.tryIt) continue;                          // the Try it row is scaffolding
          expect(own.has(r.how), `${k}: invented "${r.how}"`).toBe(true);
          expect(own.has(r.value), `${k}: invented "${r.value}"`).toBe(true);
        }
      }
    }
  });

  it('puts the yourTurn answer in the Try it step and nowhere earlier', () => {
    const steps = walkStepsFrom(TEACH.multFact);
    const tryIt = steps[steps.length - 1];
    expect(tryIt.prompt).toBe(TEACH.multFact.yourTurn.q);
    expect(tryIt.walk.rows[0].value).toBe(TEACH.multFact.yourTurn.a);
    expect(JSON.stringify(steps.slice(0, -1))).not.toContain(TEACH.multFact.yourTurn.a);
  });
});

describe('the reference set gives each layout a worked example', () => {
  it('is exactly the four skills, one per layout', () => {
    expect(REFERENCE_SKILLS.sort()).toEqual(['addInt', 'eqFrac', 'twoStep', 'unitRate']);
    const headline = { eqFrac: 'bar', unitRate: 'faceoff', addInt: 'line', twoStep: 'walk' };
    for (const [skill, layout] of Object.entries(headline)) {
      expect(REFERENCE_STEPS[skill][0].layout, skill).toBe(layout);
    }
  });

  it('runs 3–5 steps and ends on Try it', () => {
    for (const k of REFERENCE_SKILLS) {
      const steps = REFERENCE_STEPS[k];
      expect(steps.length, k).toBeGreaterThanOrEqual(3);
      expect(steps.length, k).toBeLessThanOrEqual(5);
      expect(steps[steps.length - 1].tryIt, k).toBe(true);
    }
  });

  it('keeps every payload solvable: the target is reachable in the thing drawn', () => {
    for (const k of REFERENCE_SKILLS) {
      for (const s of REFERENCE_STEPS[k]) {
        if (s.layout === 'bar') {
          expect(s.bar.target).toBeGreaterThan(0);
          expect(s.bar.target, `${k}: ${s.prompt}`).toBeLessThanOrEqual(s.bar.parts);
        }
        if (s.layout === 'line') {
          expect(s.line.answer, `${k}: ${s.prompt}`).toBe(s.line.start + s.line.delta);
          expect(s.line.answer).toBeGreaterThanOrEqual(s.line.min);
          expect(s.line.answer).toBeLessThanOrEqual(s.line.max);
          expect(s.line.start).toBeGreaterThanOrEqual(s.line.min);
          expect(s.line.start).toBeLessThanOrEqual(s.line.max);
        }
        if (s.layout === 'faceoff') {
          expect(s.faceoff.cards).toHaveLength(2);
          expect([0, 1]).toContain(s.faceoff.answer);
          expect(s.faceoff.why, `${k}: ${s.prompt}`).toBeTruthy();
          s.faceoff.cards.forEach(c => expect(c.each, `${k}: ${c.label} has no per-one line`).toBeTruthy());
        }
      }
    }
  });
});

describe('the teach panels keep the ADHD laws', () => {
  it('never puts a clock, a streak or a scold in a step', () => {
    for (const k of skills) {
      const text = JSON.stringify(teachStepsFor(k));
      expect(text, k).not.toMatch(/seconds left|hurry|quickly|time's up|streak|🔥/i);
    }
  });
});
