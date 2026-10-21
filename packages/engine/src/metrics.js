/* Measurement (PLAY_SYSTEM §8.8).

   Define the event names NOW, before the pilot, so the data exists from day one. The
   events table in docs/DEPLOYMENT.md already captures the raw stream — every UI
   component emits onEvent and the store appends it — so this module only has to name
   the events and fold them into the weekly numbers the pilot report needs.

   Nothing here is a judgement about a kid. These are product metrics: whether the
   thing gets used, not whether she is good at it. */

/** The event vocabulary. Anything not in here is not measured, by design. */
export const EVENTS = {
  // the lesson runner
  LESSON_START: 'lesson_start',
  LESSON_COMPLETE: 'lesson_complete',
  SNAG_SHOWN: 'snag_shown',
  SNAG_ATTEMPT: 'snag_attempt',
  MOVE_COMPLETE: 'move_complete',
  ANSWER: 'answer',
  TEACH_USED: 'teach_used',
  RETEACH: 'reteach',
  // assessments
  QUIZ_START: 'quiz_start',
  QUIZ_RESULT: 'quiz_result',
  TEST_RESULT: 'test_result',
  // the business
  STAND_OPEN: 'stand_open',
  DAY_CLOSED: 'day_closed',
  // money
  EARN: 'earn',
  ASK: 'ask',
  APPROVE: 'approve',
  // the bridge
  FIELD_SUBMITTED: 'field_submitted',
};

const of = (events, type) => events.filter(e => e.type === type);
const rate = (num, den) => (den > 0 ? Math.round((num / den) * 100) / 100 : null);

/**
 * The pilot's weekly numbers.
 * @param {Array<{type: string, payload?: object, day?: string}>} events
 * @param {{days?: number}} [opts] days the week covers, for the stand-open rate
 */
export function weeklyRollup(events = [], { days = 7 } = {}) {
  const lessonsCompleted = of(events, EVENTS.LESSON_COMPLETE).length;
  const snagsShown = of(events, EVENTS.SNAG_SHOWN).length;
  const quizzes = of(events, EVENTS.QUIZ_RESULT);
  const opens = new Set(of(events, EVENTS.STAND_OPEN).map(e => e.day).filter(Boolean));

  // A retake is a second (or later) result for a unit already sat this week.
  const seenUnits = new Map();
  let quizRetakes = 0;
  for (const q of quizzes) {
    const key = q.payload?.unit ?? 'unknown';
    const n = (seenUnits.get(key) || 0) + 1;
    seenUnits.set(key, n);
    if (n > 1) quizRetakes++;
  }

  return {
    lessonsCompleted,
    // Does opening with the problem actually pull her into the lesson?
    snagToLessonRate: rate(lessonsCompleted, snagsShown),
    // Is the business a daily habit, or a thing she opened once?
    standOpenRate: rate(opens.size, days),
    quizRetakes,
    fieldAssignments: of(events, EVENTS.FIELD_SUBMITTED).length,
    teachUsed: of(events, EVENTS.TEACH_USED).length,
    answers: of(events, EVENTS.ANSWER).length,
    reteaches: of(events, EVENTS.RETEACH).length,
  };
}

/**
 * Return rates across a longer window. D7/D30 are the retention questions §8.8 asks;
 * `days` is the set of distinct days with any activity at all.
 */
export function returnRate(days = [], { window = 7, from } = {}) {
  const uniq = [...new Set(days)].sort();
  if (!uniq.length) return { active: 0, window, returned: false };
  const start = from || uniq[0];
  const end = new Date(Date.parse(start + 'T12:00:00Z') + window * 86400000).toISOString().slice(0, 10);
  const inWindow = uniq.filter(d => d > start && d <= end);
  return { active: inWindow.length, window, returned: inWindow.length > 0 };
}
