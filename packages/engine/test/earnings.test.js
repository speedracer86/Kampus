import { describe, it, expect } from 'vitest';
import {
  RATES, RATE_LABEL, CAP_OPTIONS, DEFAULT_CAP_CENTS, EARNED, HELD, GIVEN, REFUNDED,
  earnedThisWeek, capRemaining, award, heldCents, availableCents,
  ask, approve, cancelAsk, goalProgress, receiptModel, howYouEarn,
} from '../src/earnings.js';

const W = '2026-W43';
const pay = (rows, reason, cap = DEFAULT_CAP_CENTS) => award(rows, { reason, day: 'Mon', week: W, cap });

describe('rates — effort only', () => {
  it('pays the four efforts at the published rates', () => {
    expect(RATES).toEqual({ lesson: 50, quiz: 100, test: 150, streak5: 50 });
  });

  it('has no rate that depends on a score, and no way to pass one in', () => {
    // Every earning reason is an action, not an outcome.
    expect(Object.keys(RATES)).toEqual(['lesson', 'quiz', 'test', 'streak5']);
    const { rows } = award([], { reason: 'quiz', day: 'Mon', week: W, score: 20, accuracy: 1 });
    expect(rows[0].cents).toBe(RATES.quiz);          // the extra fields change nothing
    expect(Object.keys(rows[0])).not.toContain('score');
  });

  it("labels rows in the kid's own terms", () => {
    expect(RATE_LABEL.lesson).toBe("Finished today's lesson");
  });
});

describe('the weekly cap', () => {
  it('defaults to $5.00 and offers $3 / $5 / $8', () => {
    expect(DEFAULT_CAP_CENTS).toBe(500);
    expect(CAP_OPTIONS).toEqual([300, 500, 800]);
  });

  it('counts only this week', () => {
    const rows = [{ id: 'x', cents: 300, week: 'older', status: EARNED }];
    expect(earnedThisWeek(rows, W)).toBe(0);
    expect(capRemaining(rows, W)).toBe(500);
  });

  it('trims the last award to what is left instead of overshooting', () => {
    let rows = [];
    ({ rows } = pay(rows, 'test'));      // 150
    ({ rows } = pay(rows, 'test'));      // 300
    ({ rows } = pay(rows, 'test'));      // 450
    const r = pay(rows, 'test');         // would be 600; only 50 left
    expect(r.awarded).toBe(50);
    expect(r.cappedOut).toBe(true);
    expect(earnedThisWeek(r.rows, W)).toBe(500);
  });

  it('awards nothing once the cap is reached, and adds no row', () => {
    let rows = [];
    for (let i = 0; i < 5; i++) ({ rows } = pay(rows, 'quiz'));   // 5 x 100 = cap
    const r = pay(rows, 'lesson');
    expect(r.awarded).toBe(0);
    expect(r.cappedOut).toBe(true);
    expect(r.rows).toHaveLength(rows.length);
  });

  it('never claws back an earlier row to fit the cap', () => {
    let rows = [];
    for (let i = 0; i < 6; i++) ({ rows } = pay(rows, 'quiz'));
    expect(rows.every(r => r.cents > 0)).toBe(true);
    expect(earnedThisWeek(rows, W)).toBe(500);
  });

  it("respects a grown-up's lower or higher cap", () => {
    let low = [];
    ({ rows: low } = pay(low, 'test', 300));
    ({ rows: low } = pay(low, 'test', 300));
    expect(earnedThisWeek(low, W)).toBe(300);

    // Nine quizzes is $9.00 of effort; the $8 cap must trim it to exactly $8.00.
    let high = [];
    for (let i = 0; i < 9; i++) ({ rows: high } = pay(high, 'quiz', 800));
    expect(earnedThisWeek(high, W)).toBe(800);
    expect(capRemaining(high, W, 800)).toBe(0);
  });
});

describe('asking holds the money', () => {
  const funded = () => {
    let rows = [];
    ({ rows } = pay(rows, 'test'));     // 150
    ({ rows } = pay(rows, 'quiz'));     // 100  -> 250 available
    return rows;
  };

  it('drops available immediately and shows up as held', () => {
    const { rows, ok } = ask(funded(), { name: 'Sticker book', cents: 200 });
    expect(ok).toBe(true);
    expect(availableCents(rows)).toBe(50);
    expect(heldCents(rows)).toBe(200);
  });

  it('refuses an ask bigger than what is available, changing nothing', () => {
    const before = funded();
    const { rows, ok } = ask(before, { name: 'Too big', cents: 9999 });
    expect(ok).toBe(false);
    expect(rows).toBe(before);
  });

  it('approving keeps the money spent', () => {
    const { rows } = ask(funded(), { name: 'Sticker book', cents: 200 });
    const after = approve(rows, rows.at(-1).id);
    expect(after.at(-1).status).toBe(GIVEN);
    expect(availableCents(after)).toBe(50);
    expect(heldCents(after)).toBe(0);
  });

  it('cancelling gives it straight back', () => {
    const { rows } = ask(funded(), { name: 'Sticker book', cents: 200 });
    const after = cancelAsk(rows, rows.at(-1).id);
    expect(after.at(-1).status).toBe(REFUNDED);
    expect(availableCents(after)).toBe(250);
    expect(heldCents(after)).toBe(0);
  });
});

describe('the receipt', () => {
  it('prints the week, the cap line, holds, available and the effort note', () => {
    let rows = [];
    ({ rows } = pay(rows, 'lesson'));
    ({ rows } = pay(rows, 'quiz'));
    ({ rows } = ask(rows, { name: 'Lego set', cents: 100 }));
    const m = receiptModel(rows, { name: 'Tom', week: W, number: 42 });
    expect(m.number).toBe('0042');
    expect(m.earned).toHaveLength(2);
    expect(m.subtotal).toBe(150);
    expect(m.capLeft).toBe(350);
    expect(m.held).toEqual([{ id: expect.any(String), label: 'Lego set', cents: 100 }]);
    expect(m.available).toBe(50);
    expect(m.note).toBe('Paid for effort. Never for scores.');
  });

  it('tracks a saving goal as ten cells', () => {
    let rows = [];
    for (let i = 0; i < 3; i++) ({ rows } = pay(rows, 'quiz'));    // 300
    const g = goalProgress(rows, { name: 'Headphones', cents: 1000 });
    expect(g).toMatchObject({ have: 300, cells: 3, toGo: 700 });
  });

  it('caps the goal bar at ten cells when the kid is over the goal', () => {
    let rows = [];
    for (let i = 0; i < 5; i++) ({ rows } = pay(rows, 'quiz'));
    expect(goalProgress(rows, { name: 'Small thing', cents: 100 }).cells).toBe(10);
  });

  it('lists how you earn, straight from the rates', () => {
    expect(howYouEarn().map(h => h.cents)).toEqual([50, 100, 150, 50]);
  });
});
