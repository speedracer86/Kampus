import { describe, it, expect } from 'vitest';
import {
  QUIZ_LENGTH, QUIZ_UNIT_QUESTIONS, QUIZ_REVIEW_QUESTIONS, TEST_LENGTH, TEST_PASS_SCORE,
  TEST_CLUSTERS, QUESTIONS_PER_CLUSTER, QUIZ_REWARD_CENTS, TEST_REWARD_CENTS,
  SOLID, SHAKY, NOT_YET, VERDICT_LABEL,
  verdictFor, nextStepFor, buildUnitQuiz, gradeUnitQuiz,
  clustersFor, buildGradeTest, gradeGradeTest, testIntroCopy,
} from '../src/assessment.js';

/** A stand-in generator so these tests never depend on the random problem library. */
let n = 0;
const fake = (grade, topic, tier) => ({
  text: `${topic}-${tier}-${n++}`, answers: ['a', 'b', 'c', 'd'], answerIndex: 0,
  skill: `${topic} skill`, teach: ['step'],
});
const allRight = (qs) => qs.map(q => q.answerIndex);
const allWrong = (qs) => qs.map(q => (q.answerIndex + 1) % 4);

describe('verdicts — the whole vocabulary', () => {
  it('is Solid / Shaky / Not yet and nothing else', () => {
    expect(Object.values(VERDICT_LABEL)).toEqual(['Solid', 'Shaky', 'Not yet']);
  });

  it('all right is Solid, some right is Shaky, none right is Not yet', () => {
    expect(verdictFor([true, true])).toBe(SOLID);
    expect(verdictFor([true, false])).toBe(SHAKY);
    expect(verdictFor([false, false])).toBe(NOT_YET);
    expect(verdictFor([])).toBe(NOT_YET);
  });

  it('routes Shaky to warm-ups and Not yet to a lesson', () => {
    expect(nextStepFor(SHAKY)).toMatch(/warm-ups/i);
    expect(nextStepFor(NOT_YET)).toMatch(/lesson/i);
  });

  it('never produces a percentage or a letter grade', () => {
    const qs = buildUnitQuiz({ grade: 6, topic: 'frac', tier: 2, make: fake });
    const r = gradeUnitQuiz(qs, qs.map((q, i) => (i % 2 ? q.answerIndex : 9)));
    const text = JSON.stringify(r);
    expect(text).not.toMatch(/%/);
    expect(text).not.toMatch(/"grade":\s*"[A-F]"/);
  });
});

describe('question shape — renderable and gradable without a second adapter', () => {
  it('carries both the engine and UI field names, and always presents as choice', () => {
    const fakeChoice = () => ({ text: 'q', choices: ['a', 'b', 'c', 'd'], answerIndex: 2,
      skill: 's', teach: ['first step', 'second step'], mode: 'numline', vis: {} });
    for (const q of buildUnitQuiz({ grade: 6, topic: 'frac', tier: 1, make: fakeChoice })) {
      expect(q.answers).toEqual(q.choices);        // what Question renders
      expect(q.correct).toBe(q.answerIndex);       // what grading reads
      expect(q.mode).toBe('choice');               // never a free-response widget in a quiz
      expect(q.hint).toBe('first step');
      expect(q.teachSteps).toEqual(q.teach);
    }
    for (const q of buildGradeTest({ grade: 6, make: fakeChoice })) {
      expect(q.answers).toEqual(q.choices);
      expect(q.correct).toBe(q.answerIndex);
    }
  });
});

describe('unit quiz', () => {
  it('is 7 from the unit and 3 from review', () => {
    const qs = buildUnitQuiz({ grade: 6, topic: 'frac', tier: 2, make: fake });
    expect(qs).toHaveLength(QUIZ_LENGTH);
    expect(qs.filter(q => q.group === 'unit')).toHaveLength(QUIZ_UNIT_QUESTIONS);
    expect(qs.filter(q => q.group === 'review')).toHaveLength(QUIZ_REVIEW_QUESTIONS);
  });

  it('draws review questions from the review queue when there is one', () => {
    const qs = buildUnitQuiz({ grade: 6, topic: 'frac', tier: 2, make: fake,
      review: [{ topic: 'ratio', tier: 1 }] });
    expect(qs.filter(q => q.group === 'review').every(q => q.text.startsWith('ratio-1'))).toBe(true);
  });

  it('falls back to the tier below when the review queue is empty', () => {
    const qs = buildUnitQuiz({ grade: 6, topic: 'frac', tier: 3, make: fake });
    expect(qs.filter(q => q.group === 'review').every(q => q.text.startsWith('frac-2'))).toBe(true);
  });

  it('groups by skill, tallies verdicts, and pays for taking it', () => {
    const qs = buildUnitQuiz({ grade: 6, topic: 'frac', tier: 2, make: fake });
    const r = gradeUnitQuiz(qs, allRight(qs));
    expect(r.right).toBe(QUIZ_LENGTH);
    expect(r.perSkill.every(s => s.verdict === SOLID)).toBe(true);
    expect(r.tally[SOLID]).toBe(r.perSkill.length);
    expect(r.rewardCents).toBe(QUIZ_REWARD_CENTS);
  });

  it('pays the same for a bad quiz — effort, never accuracy', () => {
    const qs = buildUnitQuiz({ grade: 6, topic: 'frac', tier: 2, make: fake });
    expect(gradeUnitQuiz(qs, allWrong(qs)).rewardCents).toBe(QUIZ_REWARD_CENTS);
  });

  it('counts a blank as wrong without throwing', () => {
    const qs = buildUnitQuiz({ grade: 6, topic: 'frac', tier: 2, make: fake });
    const r = gradeUnitQuiz(qs, []);
    expect(r.right).toBe(0);
    expect(r.perSkill.every(s => s.verdict === NOT_YET)).toBe(true);
  });
});

describe('grade test', () => {
  it('covers ten clusters, two questions each', () => {
    expect(clustersFor(6)).toHaveLength(TEST_CLUSTERS);
    const qs = buildGradeTest({ grade: 6, make: fake });
    expect(qs).toHaveLength(TEST_LENGTH);
    expect(TEST_CLUSTERS * QUESTIONS_PER_CLUSTER).toBe(TEST_LENGTH);
    for (const c of clustersFor(6)) {
      expect(qs.filter(q => q.cluster === c.id)).toHaveLength(QUESTIONS_PER_CLUSTER);
    }
  });

  it('gives every cluster a distinct label — a repair plan must not list the same unit twice', () => {
    const labels = clustersFor(6).map(c => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('passes on 16+ right with every cluster scoring', () => {
    const qs = buildGradeTest({ grade: 6, make: fake });
    const r = gradeGradeTest({ grade: 6, questions: qs, answers: allRight(qs) });
    expect(r.passed).toBe(true);
    expect(r.district).toBe(6);
    expect(r.repairPlan).toEqual([]);
  });

  it('fails breadth: 16 right is not enough if one cluster is fully missed', () => {
    const qs = buildGradeTest({ grade: 6, make: fake });
    // Miss both questions of the first cluster and two singles elsewhere -> exactly 16.
    const answers = allRight(qs);
    const first = qs.map((q, i) => (q.cluster === qs[0].cluster ? i : -1)).filter(i => i >= 0);
    [...first, 4, 6].forEach(i => { answers[i] = (qs[i].answerIndex + 1) % 4; });
    const r = gradeGradeTest({ grade: 6, questions: qs, answers });
    expect(r.score).toBe(TEST_PASS_SCORE);
    expect(r.checks.enoughRight).toBe(true);
    expect(r.checks.everyClusterHasOne).toBe(false);
    expect(r.passed).toBe(false);
  });

  it('fails the count but keeps breadth when one per cluster is right', () => {
    const qs = buildGradeTest({ grade: 6, make: fake });
    const answers = qs.map((q, i) => (i % 2 === 0 ? q.answerIndex : (q.answerIndex + 1) % 4));
    const r = gradeGradeTest({ grade: 6, questions: qs, answers });
    expect(r.score).toBe(TEST_LENGTH / 2);
    expect(r.checks.everyClusterHasOne).toBe(true);
    expect(r.checks.enoughRight).toBe(false);
    expect(r.passed).toBe(false);
  });

  it('gives a repair plan of at most three units, weakest first, never a fail', () => {
    const qs = buildGradeTest({ grade: 6, make: fake });
    const r = gradeGradeTest({ grade: 6, questions: qs, answers: allWrong(qs) });
    expect(r.passed).toBe(false);
    expect(r.repairPlan.length).toBeGreaterThanOrEqual(2);
    expect(r.repairPlan.length).toBeLessThanOrEqual(3);
    expect(r.repairPlan[0]).toMatchObject({ index: 1, reason: 'both questions missed' });
    expect(r.repairPlan.every(u => u.unit && u.world)).toBe(true);
    expect(JSON.stringify(r)).not.toMatch(/fail/i);
  });

  it('pays for taking it either way', () => {
    const qs = buildGradeTest({ grade: 6, make: fake });
    expect(gradeGradeTest({ grade: 6, questions: qs, answers: allRight(qs) }).rewardCents).toBe(TEST_REWARD_CENTS);
    expect(gradeGradeTest({ grade: 6, questions: qs, answers: allWrong(qs) }).rewardCents).toBe(TEST_REWARD_CENTS);
  });

  it('says what it covers without saying "Common Core"', () => {
    expect(testIntroCopy(7)).toBe('Covers everything your state expects for grade 7.');
    expect(testIntroCopy(7)).not.toMatch(/common core/i);
  });
});
