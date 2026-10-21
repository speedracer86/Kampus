import { describe, it, expect } from 'vitest';
import { ASSIGNMENTS, assignmentsForBand, weeklyAssignment, buildFieldQuestion, FIELD_PAY_REASON } from '../src/field.js';
import { RATES, RATE_LABEL } from '../src/earnings.js';
import { SOURCE } from '../src/sources.js';

const byId = (id) => ASSIGNMENTS.find(a => a.id === id);

describe('field assignments run on her actual day (§7)', () => {
  it('asks a grown-up for at most three numbers — friction is the enemy', () => {
    for (const a of ASSIGNMENTS) {
      expect(a.inputs.length, a.id).toBeGreaterThanOrEqual(2);
      expect(a.inputs.length, a.id).toBeLessThanOrEqual(4);
      expect(a.ask, a.id).toBeTruthy();
    }
  });

  it('offers a band its own assignments and every earlier band\'s', () => {
    expect(assignmentsForBand('a').every(a => a.band === 'a')).toBe(true);
    expect(assignmentsForBand('c').map(a => a.id)).toContain('change-jar');
    expect(assignmentsForBand('b').some(a => a.band === 'c')).toBe(false);
  });

  it('picks one a week, and the same one all week', () => {
    expect(weeklyAssignment('c', '2026-W43').id).toBe(weeklyAssignment('c', '2026-W43').id);
    expect(weeklyAssignment('a', 'x')).toBeTruthy();
  });

  it('is tagged life — her day, not her business and not the gym', () => {
    const q = buildFieldQuestion(byId('change-jar'), { quarters: 4, dimes: 3, nickels: 2 });
    expect(q.source).toBe(SOURCE.LIFE);
  });

  it('counts a real change jar correctly', () => {
    const q = buildFieldQuestion(byId('change-jar'), { quarters: 4, dimes: 3, nickels: 2 });
    expect(q.answers[q.correct]).toBe('$1.40');          // 100 + 30 + 10
    expect(q.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('doubles a real recipe', () => {
    const q = buildFieldQuestion(byId('double-recipe'), { flour: 3, sugar: 1, serves: 4 });
    expect(q.text).toContain('serve 8');
    expect(q.answers[q.correct]).toBe('6');
  });

  it('finds the cheaper bag, and the bigger bag is not always it', () => {
    const big = buildFieldQuestion(byId('unit-price'), { priceA: 3, sizeA: 2, priceB: 5, sizeB: 5 });
    expect(big.answers[big.correct]).toBe('The big bag');     // 1.50 vs 1.00
    const small = buildFieldQuestion(byId('unit-price'), { priceA: 2, sizeA: 4, priceB: 9, sizeB: 10 });
    expect(small.answers[small.correct]).toBe('The small bag'); // 0.50 vs 0.90
  });

  it('costs a real trip', () => {
    const q = buildFieldQuestion(byId('trip-cost'), { miles: 120, mpg: 30, price: 4 });
    expect(q.answers[q.correct]).toBe('$16.00');
  });

  it('waits rather than guessing when a number is missing', () => {
    expect(buildFieldQuestion(byId('change-jar'), { quarters: 4 })).toBe(null);
    expect(buildFieldQuestion(byId('change-jar'), { quarters: 4, dimes: '', nickels: 2 })).toBe(null);
    expect(buildFieldQuestion(null, {})).toBe(null);
  });

  it('pays the ordinary effort rate, like everything else', () => {
    expect(RATES[FIELD_PAY_REASON]).toBe(RATES.lesson);
    expect(RATE_LABEL[FIELD_PAY_REASON]).toBeTruthy();
  });
});
