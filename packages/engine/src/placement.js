/* The placement check — "let Kampus find her level".

   This is NOT an exam and must never become one. Onboarding (§0a 13k) promises a
   kid three things in as many words: about fifteen minutes, no timer, and it
   doesn't pay and it doesn't cost. All three are load-bearing, so they are
   constants and tests here rather than copy on a screen:

     PLACEMENT_REWARD_CENTS = 0   it pays nothing, so it cannot be farmed
     nothing in this module reads or writes a tier, a ledger or a streak
     there is no pass, no fail and no score — the output is a GRADE

   Shape. Four topics, each a binary search for the lowest grade she cannot yet
   do. Six candidate grades (3–8) is three probes, two questions each: 24
   questions, which is the fifteen minutes the screen promises. The search is per
   topic because a kid is rarely level across all four, and the per-topic result is
   worth showing her.

   "Can do grade G" is asked at the MIDDLE tier, not the entry tier. A kid who can
   only manage grade 5's easiest questions is not ready to start grade 6, and
   placing her too high is the expensive mistake: she lands in work she cannot do
   on day one. Placing her too low costs her a few easy days and the grade stack
   already folds them into "Earlier grades · Review anytime". */
import { toQuizQuestion } from './quiz-adapter.js';
import { withQuestionProps, TOPIC_ORDER } from './assessment.js';

export const PLACEMENT_MIN_GRADE = 3;
export const PLACEMENT_MAX_GRADE = 8;
export const PLACEMENT_PROBE_TIER = 2;
export const QUESTIONS_PER_RUNG = 2;
/** It pays nothing. This is a constant so a future "reward" has to delete a test. */
export const PLACEMENT_REWARD_CENTS = 0;

/** Probes to resolve one topic: ceil(log2(grades)) — 3 for grades 3–8. */
export const RUNGS_PER_TOPIC = Math.ceil(Math.log2(PLACEMENT_MAX_GRADE - PLACEMENT_MIN_GRADE + 1));
export const PLACEMENT_LENGTH = TOPIC_ORDER.length * RUNGS_PER_TOPIC * QUESTIONS_PER_RUNG;

const freshTopic = () => ({ lo: PLACEMENT_MIN_GRADE, hi: PLACEMENT_MAX_GRADE, dots: [], rungs: 0 });

/** A fresh check. State is plain data: the caller owns it, as everywhere else. */
export function startPlacement() {
  return {
    topics: Object.fromEntries(TOPIC_ORDER.map(t => [t, freshTopic()])),
    order: [...TOPIC_ORDER],
    at: 0,
    asked: 0,
  };
}

const settled = (t) => t.lo >= t.hi;
const probeGrade = (t) => Math.floor((t.lo + t.hi) / 2);

/**
 * The next question to ask, or null when every topic has settled.
 * Returns the coordinates only — generating the question is the caller's job, so
 * this module stays pure and testable without the generator library.
 */
export function nextProbe(state) {
  for (let i = 0; i < state.order.length; i++) {
    const topic = state.order[(state.at + i) % state.order.length];
    const t = state.topics[topic];
    if (settled(t)) continue;
    return { topic, grade: probeGrade(t), tier: PLACEMENT_PROBE_TIER, index: state.asked };
  }
  return null;
}

/**
 * Record one answer. A rung is QUESTIONS_PER_RUNG questions; she clears the rung
 * by getting them all right, because "can do this grade" should not mean "guessed
 * one of two". Clearing moves the floor up, missing moves the ceiling down.
 */
export function recordProbe(state, right) {
  const probe = nextProbe(state);
  if (!probe) return state;

  const topics = { ...state.topics };
  const t = { ...topics[probe.topic], dots: [...topics[probe.topic].dots, !!right] };
  const rung = t.dots.slice(-QUESTIONS_PER_RUNG);

  if (rung.length === QUESTIONS_PER_RUNG) {
    const cleared = rung.every(Boolean);
    if (cleared) t.lo = Math.min(probe.grade + 1, PLACEMENT_MAX_GRADE);
    else t.hi = probe.grade;
    t.rungs += 1;
    t.dots = [];                       // the next rung starts clean
  }
  topics[probe.topic] = t;

  // Round-robin: four topics interleave so it never feels like four little tests.
  return { ...state, topics, asked: state.asked + 1, at: (state.at + 1) % state.order.length };
}

/** Has every topic settled? */
export const placementDone = (state) => nextProbe(state) === null;

/** How far through, for a progress bar that is not a countdown. */
export const placementProgress = (state) => ({
  asked: state.asked,
  of: PLACEMENT_LENGTH,
  // Settled topics shorten the check, so the bar may finish early — never late.
  done: placementDone(state),
});

/**
 * Where she starts.
 *
 * Per topic the search lands on the lowest grade she could not do, which is the
 * grade to start learning. The overall grade is the LOWER MIDDLE of the four, not
 * the average and not the best: placing her above her level is the mistake that
 * costs her a bad first week, and one strong topic should not drag the other three
 * up with it. One weak topic should not drag her down either, which is why it is
 * the lower middle and not the minimum.
 */
export function placementResult(state) {
  const perTopic = Object.fromEntries(
    Object.entries(state.topics).map(([topic, t]) => [topic, Math.max(PLACEMENT_MIN_GRADE, Math.min(t.lo, PLACEMENT_MAX_GRADE))]));
  const grades = Object.values(perTopic).sort((a, b) => a - b);
  const grade = grades[Math.floor((grades.length - 1) / 2)];
  return {
    grade,
    perTopic,
    // What to say to her. Never a score, never a verdict on her.
    strongest: Object.entries(perTopic).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    spread: grades[grades.length - 1] - grades[0],
  };
}

/** Build the question for a probe. Split out so the runner never touches generators. */
export function placementQuestion(probe, make = toQuizQuestion) {
  return {
    ...withQuestionProps(make(probe.grade, probe.topic, probe.tier)),
    probeTopic: probe.topic,
    probeGrade: probe.grade,
  };
}
