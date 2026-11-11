/* The pilot report's seam.

   The engine has had the numbers since §8.8 was written — `weeklyRollup`,
   `returnRate`, `lessonReadiness` — and no screen has ever read them. This module
   is what connects the two, and it authors nothing: every figure below comes out
   of @kampus/engine, and the component in packages/ui/src/report.jsx formats what
   it is given.

   The work here is reconciliation, and it is not cosmetic. The recorded stream and
   the metrics vocabulary did not agree:

     - the lesson runner prefixed every event with `lesson_`, so finishing a lesson
       was recorded as `lesson_lesson_complete` while the rollup counts
       `lesson_complete`. A kid who had done every lesson rolled up as zero.
     - `append()` stamps `created_at`, not `day`, and the rollup buckets the stand
       by `day`.
     - `lesson_answer` and a quiz's `answer` are the same act for counting purposes.

   The prefix is fixed at source now, but old saves still carry the old names, so
   `canonical()` accepts both. That is the whole job: translate, then fold. */
import { weeklyRollup, returnRate, lessonReadiness, EVENTS, weekKey,
  availableCents, earnedThisWeek, pendingEarnings, DEFAULT_CAP_CENTS } from '@kampus/engine';
import { buildDayLesson, currentDay, yearProgress } from './year.js';

/** Stored type -> the vocabulary the metrics module counts. */
const ALIAS = {
  lesson_lesson_complete: EVENTS.LESSON_COMPLETE,   // the old double prefix
  lesson_complete: EVENTS.LESSON_COMPLETE,
  lesson_lesson_empty: EVENTS.LESSON_EMPTY,
  lesson_empty: EVENTS.LESSON_EMPTY,
  lesson_answer: EVENTS.ANSWER,
  lesson_teach_used: EVENTS.TEACH_USED,
  lesson_reteach: EVENTS.RETEACH,
  lesson_snag_attempt: EVENTS.SNAG_ATTEMPT,
  lesson_snag_shown: EVENTS.SNAG_SHOWN,
  lesson_lesson_start: EVENTS.LESSON_START,
  lesson_start: EVENTS.LESSON_START,
};

/** The day an event happened, from whatever the row actually carries. */
const dayOf = (e) => e.day || (e.created_at ? String(e.created_at).slice(0, 10) : null);

/**
 * The recorded stream, in the vocabulary the engine speaks, each row carrying a day.
 * Rows that are not part of the measured vocabulary pass through untouched — they
 * are simply not counted, which is what "anything not in EVENTS is not measured"
 * means.
 */
export function canonical(events = []) {
  return events.map(e => ({ ...e, type: ALIAS[e.type] || e.type, day: dayOf(e) }));
}

/** Monday-based week key for a day string, matching the engine's own bucketing. */
export const weekOf = (day) => weekKey(Date.parse(`${day}T12:00:00Z`));

/* The Monday a week key names, back out of the key's own arithmetic
   (`floor((ms/day + 3) / 7)` — the +3 is what makes the week start on a Monday).
   Derived rather than stored so it can never disagree with the bucketing the
   figures were counted with. */
export const mondayOf = (week) => new Date((Number(week) * 7 - 3) * 86400000);

/* The span the report covers: Monday to today, or to the Sunday if the week is
   already over. "Nov 9 to Nov 12" on a Thursday — not Monday to Sunday, which
   would promise days that have not happened yet. */
export function weekRange(week, now = new Date()) {
  const from = mondayOf(week);
  const sunday = new Date(from.getTime() + 6 * 86400000);
  const to = now < from ? from : (now > sunday ? sunday : now);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

/* The ISO week-of-year, for the report's footer. The week KEY is an epoch week
   count (2970-odd) and means nothing to a parent; "week 46" is the number they
   would recognise from a calendar. */
export function weekOfYear(week) {
  const d = mondayOf(week);
  const thursday = new Date(d.getTime() + 3 * 86400000);
  const jan1 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.floor((thursday - jan1) / 86400000 / 7) + 1;
}

/** The events of one week, newest week by default. */
export function eventsForWeek(events = [], week = weekKey()) {
  return canonical(events).filter(e => e.day && weekOf(e.day) === week);
}

/** Distinct days with any recorded activity at all. */
export const activeDays = (events = []) =>
  [...new Set(canonical(events).map(e => e.day).filter(Boolean))].sort();

/**
 * Everything the weekly report prints.
 *
 * Deliberately NOT included: any figure whose event is not emitted yet. The
 * rollup can compute a snag-to-lesson rate, but nothing emits `snag_shown`, so it
 * would read 0% for a kid who answered every Snag. A number nobody is recording is
 * worse on a parent's report than an absent one — the same rule the Deal Score
 * follows elsewhere: honest signal over fake precision.
 */
export function pilotReport(state = {}, events = [], { week = weekKey(), days = 7 } = {}) {
  const all = canonical(events);
  const mine = all.filter(e => e.day && weekOf(e.day) === week);
  const rollup = weeklyRollup(mine, { days });

  const ledger = state.ledger || [];
  const approvedThisWeek = earnedThisWeek(ledger, week);
  const waiting = pendingEarnings(ledger).reduce((n, r) => n + r.cents, 0);

  // Days she turned up. A COUNT, never a streak: PLAY_SYSTEM bans the chain that
  // can break, and a weekly report to a parent is exactly where one would creep in.
  const daysSeen = [...new Set(mine.map(e => e.day))].sort();
  const standDays = [...new Set(mine.filter(e => e.type === EVENTS.STAND_OPEN).map(e => e.day))];

  const progress = yearProgress(state);
  const { day } = currentDay(state);
  const lesson = buildDayLesson(state);

  return {
    week,
    weekNumber: weekOfYear(week),
    range: weekRange(week),
    showedUp: { days: daysSeen.length, of: days, dates: daysSeen },
    lessons: { finished: rollup.lessonsCompleted },
    stand: { daysOpen: standDays.length },
    money: {
      approvedCents: approvedThisWeek,
      waitingCents: waiting,
      availableCents: availableCents(ledger),
      capCents: state.settings?.cap ?? DEFAULT_CAP_CENTS,
    },
    // Where she is. Not how far behind, not how fast — where.
    where: {
      grade: state.grade,
      unit: progress.unit,
      units: progress.units,
      lessonsDone: progress.lessonsDone,
      lessonsTotal: progress.lessonsTotal,
      nextUp: day?.type === 'quiz' ? 'Inspection Day' : day?.type === 'test' ? 'the License' : null,
    },
    // Whether the APP is healthy, which is not a statement about the kid.
    health: lesson ? lessonReadiness(lesson.moves || []) : { playable: true, missing: [] },
    // A week with nothing in it is a fact to state plainly, not a failing to flag.
    quiet: daysSeen.length === 0,
    // Longer window: did she come back at all after the first day we saw her?
    returned: returnRate(activeDays(all), { window: 7 }),
  };
}
