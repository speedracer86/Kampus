/* Assessment — the unit quiz and the grade test.
   Spec: STYLE_GUIDE §0 "Unit quiz" / "Grade test", docs/KAMPUS_TEACHING_SYSTEM.md.

   Two rules shape everything here:
     1. A result is never a percentage and never a letter. Per-skill verdicts are
        Solid / Shaky / Not yet, and that is the whole vocabulary.
     2. There is no fail screen. Missing the grade test produces a repair plan —
        a short, concrete list of units to redo — not a score to feel bad about.

   Pure: callers own all state, and question generation is injected so the module
   is testable without the generator library. */
import { toQuizQuestion } from './quiz-adapter.js';
import { GRADE_WORLDS } from './curriculum.js';

export const QUIZ_LENGTH = 10;
export const QUIZ_UNIT_QUESTIONS = 7;
export const QUIZ_REVIEW_QUESTIONS = 3;

export const TEST_LENGTH = 20;
export const TEST_PASS_SCORE = 16;
export const TEST_CLUSTERS = 10;
export const QUESTIONS_PER_CLUSTER = 2;

/** Effort pay, in cents. Never tied to accuracy (the rules that never bend). */
export const QUIZ_REWARD_CENTS = 100;
export const TEST_REWARD_CENTS = 150;

export const TOPIC_ORDER = ['frac', 'ratio', 'int', 'alg'];

/**
 * The engine speaks `choices`/`answerIndex`; the UI's Question component speaks
 * `answers`/`correct`. Assessments carry both, so a quiz question can be rendered
 * and graded without a second adapter at every call site. Quizzes always present
 * as multiple choice — the generator's `choices` exist even for number-line modes.
 */
export function withQuestionProps(q) {
  return {
    ...q,
    mode: 'choice',
    answers: q.choices,
    correct: q.answerIndex,
    teachSteps: q.teach,
    hint: q.hint || (q.teach && q.teach[0]),
    show: q.show || (q.teach && q.teach.join(' ')),
  };
}

/** Verdict vocabulary. Nothing else may reach a screen. */
export const SOLID = 'solid', SHAKY = 'shaky', NOT_YET = 'notyet';
export const VERDICT_LABEL = { [SOLID]: 'Solid', [SHAKY]: 'Shaky', [NOT_YET]: 'Not yet' };

/**
 * One skill's verdict from its answers.
 * All right = Solid · some right = Shaky · none right = Not yet.
 */
export function verdictFor(dots = []) {
  if (!dots.length) return NOT_YET;
  const right = dots.filter(Boolean).length;
  if (right === dots.length) return SOLID;
  return right > 0 ? SHAKY : NOT_YET;
}

/** What a verdict tells the kid to do next (§0: a next-step line, not a score). */
export function nextStepFor(verdict) {
  return verdict === SOLID ? 'Keep it warm — it comes back in a week.'
    : verdict === SHAKY ? 'Back into your warm-ups.'
      : 'We’ll put a lesson on this.';
}

/**
 * Assemble a unit quiz: 7 from the unit being tested, 3 drawn from review.
 * `review` entries are review.js rows; each needs a {topic, tier} to generate from.
 */
export function buildUnitQuiz({ grade, topic, tier = 1, review = [], make = toQuizQuestion }) {
  const unit = Array.from({ length: QUIZ_UNIT_QUESTIONS }, () =>
    ({ ...withQuestionProps(make(grade, topic, tier)), group: 'unit' }));
  const pool = review.length ? review : [{ topic, tier: Math.max(1, tier - 1) }];
  const back = Array.from({ length: QUIZ_REVIEW_QUESTIONS }, (_, i) => {
    const r = pool[i % pool.length];
    return { ...withQuestionProps(make(grade, r.topic || topic, r.tier || Math.max(1, tier - 1))), group: 'review' };
  });
  return [...unit, ...back];
}

/**
 * Grade a unit quiz.
 * @param questions as built above (each carries .skill and .group)
 * @param answers   array of picked indices, aligned with questions (null = blank)
 * @returns {{perSkill, tally, rewardCents, asked, right}}
 */
export function gradeUnitQuiz(questions = [], answers = []) {
  const bySkill = new Map();
  questions.forEach((q, i) => {
    const key = q.skill || q.group || 'unknown';
    if (!bySkill.has(key)) bySkill.set(key, { skill: key, group: q.group || 'unit', dots: [] });
    bySkill.get(key).dots.push(answers[i] === q.answerIndex);
  });
  const perSkill = [...bySkill.values()].map(s => {
    const verdict = verdictFor(s.dots);
    return { ...s, verdict, nextStep: nextStepFor(verdict) };
  });
  const tally = perSkill.reduce((t, s) => ({ ...t, [s.verdict]: (t[s.verdict] || 0) + 1 }),
    { [SOLID]: 0, [SHAKY]: 0, [NOT_YET]: 0 });
  const right = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  return { perSkill, tally, rewardCents: QUIZ_REWARD_CENTS, asked: questions.length, right };
}

/**
 * The ten clusters a grade test covers: two per world (core and stretch), plus two
 * review clusters drawn from the grade below. Ten clusters × two questions = 20,
 * which is also the 5×2 grid §0 draws on the results screen.
 */
export function clustersFor(grade) {
  const worlds = GRADE_WORLDS[grade] || {};
  // Labels must be distinct: they are what a repair plan lists, and two rows reading
  // the same thing is indistinguishable from a bug.
  const core = TOPIC_ORDER.flatMap(topic => {
    const desc = worlds[topic]?.desc || topic;
    return [
      { id: `${topic}-core`, topic, tier: 1, kind: 'core', label: desc, world: topic },
      { id: `${topic}-stretch`, topic, tier: 3, kind: 'stretch', label: `${desc} · the harder ones`, world: topic },
    ];
  });
  const review = [
    { id: 'review-frac', topic: 'frac', tier: 1, kind: 'review', label: 'review: earlier fractions', world: 'frac' },
    { id: 'review-ratio', topic: 'ratio', tier: 1, kind: 'review', label: 'review: earlier rates', world: 'ratio' },
  ];
  return [...core, ...review].slice(0, TEST_CLUSTERS);
}

/** Assemble the 20-question grade test: two questions per cluster, tagged. */
export function buildGradeTest({ grade, make = toQuizQuestion }) {
  return clustersFor(grade).flatMap(c =>
    Array.from({ length: QUESTIONS_PER_CLUSTER }, () =>
      ({ ...withQuestionProps(make(grade, c.topic, c.tier)), cluster: c.id, world: c.world })));
}

/**
 * Grade the test. Pass needs both: at least 16 right AND no cluster fully missed —
 * breadth matters as much as the total, which is why the second check exists.
 * A miss returns a 2-3 unit repair plan, never a fail.
 */
export function gradeGradeTest({ grade, questions = [], answers = [] }) {
  const clusters = clustersFor(grade);
  const perCluster = clusters.map(c => {
    const idx = questions.map((q, i) => (q.cluster === c.id ? i : -1)).filter(i => i >= 0);
    const dots = idx.map(i => answers[i] === questions[i].answerIndex);
    const right = dots.filter(Boolean).length;
    return { ...c, dots, right, missedEntirely: dots.length > 0 && right === 0 };
  });
  const score = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const everyClusterHasOne = perCluster.every(c => !c.missedEntirely);
  const passed = score >= TEST_PASS_SCORE && everyClusterHasOne;

  // Weakest first; fully-missed clusters lead, then half-missed, capped at three units.
  const repairPlan = passed ? [] : perCluster
    .filter(c => c.right < QUESTIONS_PER_CLUSTER)
    .sort((a, b) => a.right - b.right)
    .slice(0, 3)
    .map((c, i) => ({
      index: i + 1,
      unit: c.label,
      world: c.world,
      reason: c.missedEntirely ? 'both questions missed' : 'one question missed',
    }));

  return {
    score,
    asked: questions.length,
    perCluster,
    checks: { enoughRight: score >= TEST_PASS_SCORE, everyClusterHasOne },
    passed,
    repairPlan,
    district: passed ? grade : null,
    rewardCents: TEST_REWARD_CENTS,
  };
}

/** §0 intro copy. Never the words "Common Core". */
export const testIntroCopy = (grade) => `Covers everything your state expects for grade ${grade}.`;
