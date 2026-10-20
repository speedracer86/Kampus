import { describe, it, expect } from 'vitest';
import {
  INTERVALS, MONTHLY_DAYS, dayNumber, intervalFor,
  firstReview, review, dueQueue, overdueBy, retention,
} from '../src/review.js';

const T = 1000;   // an arbitrary "today" so the tests never touch a real clock

describe('review — the expanding ladder', () => {
  it('walks 1, 3, 7, 16, 35 then goes monthly', () => {
    expect(INTERVALS).toEqual([1, 3, 7, 16, 35]);
    expect(INTERVALS.map((_, i) => intervalFor(i))).toEqual([1, 3, 7, 16, 35]);
    expect(intervalFor(5)).toBe(MONTHLY_DAYS);
    expect(intervalFor(99)).toBe(MONTHLY_DAYS);
  });

  it('a newly mastered skill comes back tomorrow', () => {
    expect(firstReview('frac.add', T)).toEqual({ skill: 'frac.add', step: 0, due: T + 1, reviews: 0, lapses: 0 });
  });

  it('expands one rung per correct review', () => {
    let e = firstReview('s', T);
    const dues = [];
    for (let i = 0; i < 5; i++) { e = review(e, true, T); dues.push(e.due - T); }
    expect(dues).toEqual([3, 7, 16, 35, MONTHLY_DAYS]);
    expect(e.reviews).toBe(5);
    expect(e.lapses).toBe(0);
  });

  it('contracts one rung on a miss, and counts the lapse', () => {
    let e = { skill: 's', step: 3, due: T, reviews: 3, lapses: 0 };
    e = review(e, false, T);
    expect(e.step).toBe(2);
    expect(e.due).toBe(T + 7);          // back to the 7-day rung, not to zero
    expect(e.lapses).toBe(1);
  });

  it('never contracts below the first rung — a miss at the bottom means tomorrow', () => {
    const e = review(firstReview('s', T), false, T);
    expect(e.step).toBe(0);
    expect(e.due).toBe(T + 1);
  });

  it('is pure — reviewing does not mutate the entry passed in', () => {
    const e = firstReview('s', T);
    const snapshot = { ...e };
    review(e, true, T);
    expect(e).toEqual(snapshot);
  });
});

describe('review — the due queue', () => {
  const entries = [
    { skill: 'later', step: 1, due: T + 5, reviews: 1, lapses: 0 },
    { skill: 'overdue', step: 3, due: T - 4, reviews: 3, lapses: 0 },
    { skill: 'today', step: 2, due: T, reviews: 2, lapses: 0 },
    { skill: 'weak', step: 0, due: T - 4, reviews: 1, lapses: 2 },
  ];

  it('draws only what is due, most overdue first, weakest first on a tie', () => {
    expect(dueQueue(entries, T).map(e => e.skill)).toEqual(['weak', 'overdue', 'today']);
  });

  it('honours a limit, so a warm-up never swamps the lesson', () => {
    expect(dueQueue(entries, T, { limit: 2 }).map(e => e.skill)).toEqual(['weak', 'overdue']);
    expect(dueQueue(entries, T, { limit: 0 })).toEqual([]);
  });

  it('ignores malformed entries rather than throwing', () => {
    expect(dueQueue([null, undefined, { skill: 'x' }, ...entries], T).map(e => e.skill))
      .toEqual(['weak', 'overdue', 'today']);
  });

  it('reports how overdue something is, and never negative', () => {
    expect(overdueBy(entries[1], T)).toBe(4);
    expect(overdueBy(entries[0], T)).toBe(0);
  });
});

describe('review — retention snapshot', () => {
  it('counts what is held (7-day rung or beyond), what is due, and lapses', () => {
    const entries = [
      { skill: 'a', step: 4, due: T + 30, reviews: 4, lapses: 0 },
      { skill: 'b', step: 2, due: T - 1, reviews: 2, lapses: 1 },
      { skill: 'c', step: 0, due: T + 1, reviews: 1, lapses: 2 },
    ];
    expect(retention(entries, T)).toEqual({ tracked: 3, held: 2, due: 1, lapses: 3 });
  });

  it('an empty history is a valid, zeroed snapshot', () => {
    expect(retention([], T)).toEqual({ tracked: 0, held: 0, due: 0, lapses: 0 });
  });
});

describe('review — dayNumber', () => {
  it('is stable within a day and advances by one overnight', () => {
    const morning = dayNumber(new Date('2026-10-20T08:00:00'));
    const night = dayNumber(new Date('2026-10-20T23:30:00'));
    const next = dayNumber(new Date('2026-10-21T08:00:00'));
    expect(night).toBe(morning);
    expect(next).toBe(morning + 1);
  });
});
