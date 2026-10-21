import { describe, it, expect } from 'vitest';
import { gradeStates, foldGradeStack, hasEarlierGrades, GRADE_STATES } from '../src/grades.js';

const byGrade = (rows) => Object.fromEntries(rows.map(r => [r.grade, r.state]));

describe('grade stack semantics (AUDIT B5 / Task 3)', () => {
  it('never calls a grade below her placement "locked"', () => {
    const rows = gradeStates({ grade: 7, passed: {} });
    for (const g of [3, 4, 5, 6]) expect(byGrade(rows)[g], `grade ${g}`).toBe('placed');
    expect(rows.find(r => r.grade === 3).sub).toBe('Review anytime');
  });

  it('keeps placed and passed distinct — placed earns no test chip', () => {
    const rows = gradeStates({ grade: 7, passed: { 6: true }, tests: { 6: '18/20' }, earned: { 6: 212 } });
    const five = rows.find(r => r.grade === 5), six = rows.find(r => r.grade === 6);
    expect(five.state).toBe('placed');
    expect(five.test).toBeUndefined();          // no chips, no purple ramp
    expect(six.state).toBe('passed');
    expect(six.test).toBe('18/20');
    expect(six.sub).toBe('');     // the status line already says "License earned"
  });

  it('locks only what is ahead, and says what earns it', () => {
    const rows = gradeStates({ grade: 5 });
    expect(byGrade(rows)[6]).toBe('locked');
    expect(rows.find(r => r.grade === 6).sub).toBe('After the Grade 5 License');
    expect(rows.find(r => r.grade === 7).sub).toBe('After the Grade 6 License');
  });

  it('always ends with a Graduation card, coloured in only by passing', () => {
    const open = gradeStates({ grade: 7 }).at(-1);
    expect(open).toMatchObject({ grade: 8, state: 'graduation', graduated: false });
    const done = gradeStates({ grade: 8, passed: { 8: true } }).at(-1);
    expect(done).toMatchObject({ state: 'graduation', graduated: true, sub: 'Finished' });
  });

  it('uses only the five declared states', () => {
    for (const g of [3, 6, 8]) {
      for (const row of gradeStates({ grade: g, passed: { 3: g > 3 } })) {
        expect(GRADE_STATES).toContain(row.state);
      }
    }
  });

  it('never says "License" about a grade test to a kid in the wrong direction', () => {
    // The sub line is forward-looking: it names the License that UNLOCKS the grade.
    const rows = gradeStates({ grade: 3 });
    expect(rows.find(r => r.grade === 4).sub).toBe('After the Grade 3 License');
  });
});

describe('folding the earlier grades', () => {
  it('folds a contiguous run into one card with its range', () => {
    const { earlier, rows } = foldGradeStack(gradeStates({ grade: 7 }));
    expect(earlier).toMatchObject({ range: '3–6', grades: [3, 4, 5, 6] });
    expect(rows.map(r => r.grade)).toEqual([7, 8]);     // current + graduation
  });

  it('does not fold a single placed grade — one row is not noise', () => {
    const { earlier, rows } = foldGradeStack(gradeStates({ grade: 4 }));
    expect(earlier).toBe(null);
    expect(rows).toHaveLength(6);
  });

  it('does not fold across a passed grade, which has its own card', () => {
    const { earlier } = foldGradeStack(gradeStates({ grade: 7, passed: { 5: true } }));
    expect(earlier).toBe(null);          // 3,4 then 6 — not contiguous
  });

  it('gives a grade-3 student nothing to fold', () => {
    expect(hasEarlierGrades(3)).toBe(false);
    expect(foldGradeStack(gradeStates({ grade: 3 })).earlier).toBe(null);
  });
});
