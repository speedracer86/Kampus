import { describe, it, expect } from 'vitest';
import { EVENTS, weeklyRollup, returnRate, lessonReadiness, lessonEarnsPay, REQUIRED_MOVES } from '../src/metrics.js';

const ev = (type, payload, day) => ({ type, payload, day });

describe('the pilot produces data from day one (§8.8)', () => {
  it('names every event the rollup needs', () => {
    for (const k of ['LESSON_COMPLETE', 'SNAG_SHOWN', 'QUIZ_RESULT', 'STAND_OPEN', 'FIELD_SUBMITTED']) {
      expect(EVENTS[k]).toBeTruthy();
    }
  });

  it('counts lessons, the snag-to-lesson rate, and stand-open days', () => {
    const events = [
      ev(EVENTS.SNAG_SHOWN), ev(EVENTS.SNAG_SHOWN), ev(EVENTS.SNAG_SHOWN), ev(EVENTS.SNAG_SHOWN),
      ev(EVENTS.LESSON_COMPLETE), ev(EVENTS.LESSON_COMPLETE), ev(EVENTS.LESSON_COMPLETE),
      ev(EVENTS.STAND_OPEN, {}, '2026-10-19'), ev(EVENTS.STAND_OPEN, {}, '2026-10-20'),
      ev(EVENTS.STAND_OPEN, {}, '2026-10-20'),                       // twice in a day is one day
    ];
    const r = weeklyRollup(events);
    expect(r.lessonsCompleted).toBe(3);
    expect(r.snagToLessonRate).toBe(0.75);
    expect(r.standOpenRate).toBeCloseTo(0.29, 2);                    // 2 of 7 days
  });

  it('counts a retake only when the same unit is sat twice', () => {
    const r = weeklyRollup([
      ev(EVENTS.QUIZ_RESULT, { unit: '7-1' }),
      ev(EVENTS.QUIZ_RESULT, { unit: '7-2' }),
      ev(EVENTS.QUIZ_RESULT, { unit: '7-1' }),
    ]);
    expect(r.quizRetakes).toBe(1);
  });

  it('returns null rather than a fake rate when there is nothing to divide by', () => {
    const r = weeklyRollup([]);
    expect(r.snagToLessonRate).toBe(null);
    expect(r.lessonsCompleted).toBe(0);
  });

  it('measures the product, never the kid — no score or accuracy anywhere', () => {
    const keys = Object.keys(weeklyRollup([ev(EVENTS.ANSWER, { right: false })]));
    for (const forbidden of ['score', 'accuracy', 'correct', 'wrong', 'grade']) {
      expect(keys.some(k => k.toLowerCase().includes(forbidden)), forbidden).toBe(false);
    }
  });

  it('answers the D7 retention question', () => {
    expect(returnRate(['2026-10-01', '2026-10-05']).returned).toBe(true);
    expect(returnRate(['2026-10-01', '2026-10-20']).returned).toBe(false);   // outside the window
    expect(returnRate([]).active).toBe(0);
  });
});

describe('lesson completion guard (AUDIT B4)', () => {
  const move = (id, n) => ({ id, questions: Array.from({ length: n }, (_, i) => ({ text: `q${i}` })) });

  it('is playable when guided and prove both carry questions', () => {
    const r = lessonReadiness([move('warmup', 2), move('guided', 4), move('mixed', 4), move('prove', 3)]);
    expect(r).toEqual({ playable: true, missing: [] });
  });

  it('is NOT playable when a required move assembled empty', () => {
    expect(lessonReadiness([move('warmup', 2), move('guided', 0), move('prove', 3)]))
      .toEqual({ playable: false, missing: ['guided'] });
    expect(lessonReadiness([move('guided', 4)]))
      .toEqual({ playable: false, missing: ['prove'] });
  });

  it('catches the generator-resolution failure that shipped: every move empty', () => {
    // This is what a minified bundle with unresolvable generators produced.
    const r = lessonReadiness([move('warmup', 0), move('guided', 0), move('mixed', 0), move('prove', 0)]);
    expect(r.playable).toBe(false);
    expect(r.missing).toEqual(['guided', 'prove']);
  });

  it('tolerates a thin warm-up or mixed set — only the teaching moves are required', () => {
    expect(lessonReadiness([move('warmup', 0), move('guided', 4), move('mixed', 0), move('prove', 2)]).playable).toBe(true);
  });

  it('pays only when the required moves actually ran', () => {
    expect(lessonEarnsPay({ warmup: 2, guided: 4, mixed: 4, prove: 3 })).toBe(true);
    expect(lessonEarnsPay({ warmup: 2, guided: 4, mixed: 4, prove: 0 })).toBe(false);
    expect(lessonEarnsPay({ guided: 1, prove: 1 })).toBe(true);
    expect(lessonEarnsPay({})).toBe(false);
  });

  it('names the event so an empty lesson is never silent', () => {
    expect(EVENTS.LESSON_EMPTY).toBe('lesson_empty');
  });
});
