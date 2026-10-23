/* The placement check.

   This module exists because the "let Kampus find her level" path used to route
   into the Grade 3 License: it paid $1.50, could promote her a grade, and printed
   a repair plan on a miss, while the setup screen promised an untimed check that
   doesn't pay and doesn't cost. The screen's four promises are tested here so the
   code cannot drift away from the copy again. */
import { describe, it, expect } from 'vitest';
import {
  startPlacement, nextProbe, recordProbe, placementDone, placementProgress,
  placementResult, placementQuestion,
  PLACEMENT_MIN_GRADE, PLACEMENT_MAX_GRADE, PLACEMENT_LENGTH, PLACEMENT_REWARD_CENTS,
  QUESTIONS_PER_RUNG, RUNGS_PER_TOPIC,
} from '../src/placement.js';
import { TOPIC_ORDER } from '../src/assessment.js';

/** Run a whole check against a kid with a known ceiling per topic. */
const sit = (canDo) => {
  let s = startPlacement();
  let guard = 0;
  while (!placementDone(s) && guard++ < 200) {
    const p = nextProbe(s);
    s = recordProbe(s, canDo(p));
  }
  return s;
};
const ceiling = (c) => (p) => p.grade <= c;

describe('the promises the setup screen makes', () => {
  it('pays nothing — there is no reward to farm', () => {
    expect(PLACEMENT_REWARD_CENTS).toBe(0);
  });

  it('costs nothing: nothing it produces carries money, a tier or a streak', () => {
    // The real invariant is the DATA, not the source text — PLACEMENT_PROBE_TIER is
    // which difficulty to generate at, which is nothing to do with her earned tier.
    let s = startPlacement();
    const shapes = [JSON.stringify(s)];
    let guard = 0;
    while (!placementDone(s) && guard++ < 50) { s = recordProbe(s, guard % 3 !== 0); shapes.push(JSON.stringify(s)); }
    shapes.push(JSON.stringify(placementResult(s)));
    for (const shape of shapes) {
      for (const banned of ['cents', 'kredit', 'streak', 'ledger', 'earn', 'reward', 'payout']) {
        expect(shape.toLowerCase(), banned).not.toContain(banned);
      }
    }
  });

  it('has no pass, no fail and no score — the output is a grade', () => {
    const r = placementResult(sit(ceiling(5)));
    expect(Object.keys(r).sort()).toEqual(['grade', 'perTopic', 'spread', 'strongest']);
    expect(r).not.toHaveProperty('passed');
    expect(r).not.toHaveProperty('score');
    expect(r).not.toHaveProperty('repairPlan');
  });

  it('is about fifteen minutes: 24 questions, and never more', () => {
    expect(PLACEMENT_LENGTH).toBe(TOPIC_ORDER.length * RUNGS_PER_TOPIC * QUESTIONS_PER_RUNG);
    expect(PLACEMENT_LENGTH).toBe(24);
    for (let c = 1; c <= 9; c++) {
      expect(sit(ceiling(c)).asked, `ceiling ${c}`).toBeLessThanOrEqual(PLACEMENT_LENGTH);
    }
  });
});

describe('it lands on the right grade', () => {
  it('places a kid one grade above the highest she can do', () => {
    for (let c = PLACEMENT_MIN_GRADE; c < PLACEMENT_MAX_GRADE; c++) {
      expect(placementResult(sit(ceiling(c))).grade, `ceiling ${c}`).toBe(c + 1);
    }
  });

  it('floors at grade 3 for a kid who gets nothing, and never below', () => {
    const r = placementResult(sit(() => false));
    expect(r.grade).toBe(PLACEMENT_MIN_GRADE);
    expect(Object.values(r.perTopic).every(g => g >= PLACEMENT_MIN_GRADE)).toBe(true);
  });

  it('caps at grade 8 for a kid who gets everything, and never above', () => {
    const r = placementResult(sit(() => true));
    expect(r.grade).toBe(PLACEMENT_MAX_GRADE);
    expect(Object.values(r.perTopic).every(g => g <= PLACEMENT_MAX_GRADE)).toBe(true);
  });

  it('resolves every topic independently when she is uneven', () => {
    const truth = { frac: 5, ratio: 6, int: 4, alg: 7 };
    const r = placementResult(sit(p => p.grade <= truth[p.topic]));
    expect(r.perTopic).toEqual({ frac: 6, ratio: 7, int: 5, alg: 8 });
    expect(r.spread).toBe(3);
  });

  it('does not let one strong topic drag the other three up', () => {
    // Weak in three, a prodigy in one. She should not be sent to grade 8.
    const r = placementResult(sit(p => (p.topic === 'alg' ? true : p.grade <= 3)));
    expect(r.grade).toBeLessThanOrEqual(5);
    expect(r.perTopic.alg).toBe(PLACEMENT_MAX_GRADE);
  });

  it('does not let one weak topic drag her all the way down either', () => {
    const r = placementResult(sit(p => (p.topic === 'int' ? false : p.grade <= 6)));
    expect(r.grade).toBe(7);
    expect(r.perTopic.int).toBe(PLACEMENT_MIN_GRADE);
  });
});

describe('the state machine behaves', () => {
  it('clears a rung only on a clean sweep — one of two is not "can do"', () => {
    // Answer one topic and ignore the rest, since the four interleave.
    const run = (target, answers) => {
      let s = startPlacement();
      const grades = [];
      let i = 0, guard = 0;
      while (!placementDone(s) && guard++ < 80) {
        const p = nextProbe(s);
        if (p.topic !== target) { s = recordProbe(s, false); continue; }
        grades.push(p.grade);
        s = recordProbe(s, answers[i++] ?? false);
      }
      return grades;
    };
    const target = nextProbe(startPlacement()).topic;
    // Both right: the rung clears and the next probe is HIGHER.
    const swept = run(target, [true, true]);
    expect(swept[2]).toBeGreaterThan(swept[0]);
    // One of two: the rung does not clear and the next probe is LOWER.
    const half = run(target, [true, false]);
    expect(half[2]).toBeLessThan(half[0]);
  });

  it('interleaves the four topics rather than running four little tests', () => {
    let s = startPlacement();
    const seen = [];
    for (let i = 0; i < 4; i++) { seen.push(nextProbe(s).topic); s = recordProbe(s, true); }
    expect(new Set(seen).size).toBe(4);
  });

  it('stops: nextProbe returns null and further records are no-ops', () => {
    const s = sit(ceiling(5));
    expect(nextProbe(s)).toBeNull();
    expect(placementDone(s)).toBe(true);
    expect(recordProbe(s, true)).toBe(s);
  });

  it('never reports more asked than its own length', () => {
    const s = sit(ceiling(4));
    const p = placementProgress(s);
    expect(p.asked).toBeLessThanOrEqual(p.of);
    expect(p.done).toBe(true);
  });

  it('is pure — recording does not mutate the state handed in', () => {
    const s = startPlacement();
    const snapshot = JSON.stringify(s);
    recordProbe(s, true);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('builds a real question for every probe it asks', () => {
    let s = startPlacement();
    let guard = 0;
    while (!placementDone(s) && guard++ < 50) {
      const probe = nextProbe(s);
      const q = placementQuestion(probe);
      expect(q.text, JSON.stringify(probe)).toBeTruthy();
      expect(q.answers.length).toBeGreaterThan(1);
      expect(q.answers[q.correct]).toBeDefined();
      expect(q.probeGrade).toBe(probe.grade);
      s = recordProbe(s, true);
    }
  });
});

describe('the ADHD laws hold here too', () => {
  it('a wrong answer takes nothing away — the state only ever narrows a range', () => {
    let s = startPlacement();
    const before = placementResult(s);
    s = recordProbe(s, false);
    s = recordProbe(s, false);
    const after = placementResult(s);
    // Her floor never drops below the minimum, and nothing else exists to lose.
    expect(after.perTopic[Object.keys(after.perTopic)[0]]).toBeGreaterThanOrEqual(PLACEMENT_MIN_GRADE);
    expect(Object.keys(after)).toEqual(Object.keys(before));
  });

  it('asks nothing about time', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/placement.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/Date\.now|setTimeout|elapsed|duration|deadline/);
  });
});
