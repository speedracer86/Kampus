import { describe, it, expect } from 'vitest';
import { toQuizQuestion, valOf } from '../src/index.js';

describe('toQuizQuestion', () => {
  it('emits the QuizRound question contract for choice mode', () => {
    for (let i = 0; i < 100; i++) {
      const q = toQuizQuestion(6, 'ratio', 2, { forceTier: 2 });
      expect(q.mode).toBe('choice');
      expect(q.choices[q.answerIndex]).toBeDefined();
      expect(Array.isArray(q.teach)).toBe(true);
      expect(q.teach.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('numline vis satisfies {from, to, start, end} with end inside range', () => {
    let seen = 0;
    for (let i = 0; i < 300 && seen < 20; i++) {
      const q = toQuizQuestion(6, 'int', 1, { forceTier: 1 });
      if (q.mode !== 'numline') continue;
      seen++;
      expect(q.vis.from).toBeLessThan(q.vis.to);
      expect(q.vis.end).toBeGreaterThanOrEqual(q.vis.from);
      expect(q.vis.end).toBeLessThanOrEqual(q.vis.to);
      expect(q.vis.start).toBeGreaterThanOrEqual(q.vis.from);
      expect(q.vis.start).toBeLessThanOrEqual(q.vis.to);
      expect(q.vis.end).toBe(valOf(q.choices[q.answerIndex]));
    }
    expect(seen, 'some G6 int T1 problems should play as numline').toBeGreaterThan(0);
  });
});
