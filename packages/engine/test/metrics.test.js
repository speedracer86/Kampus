import { describe, it, expect } from 'vitest';
import { EVENTS, weeklyRollup, returnRate } from '../src/metrics.js';

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
