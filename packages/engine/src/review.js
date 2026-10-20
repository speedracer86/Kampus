/* The review engine — retention, not just completion.
   Spec: docs/KAMPUS_TEACHING_SYSTEM.md Part 6 #1 and Part 7 #3.

   Every mastered skill carries a due date on an expanding ladder:
   1, 3, 7, 16, 35 days, then monthly. A correct review expands the interval
   (one rung up); a miss contracts it (one rung down, never below the first).

   Contracting by one rung rather than resetting to zero is deliberate: a kid
   who misses one review of a skill they have seen five times has not lost it,
   and the ADHD rules forbid punitive mechanics. A miss at the bottom rung just
   means "tomorrow".

   Pure: callers own all state. Days are integers (days since the epoch) so the
   module never touches clocks or timezones — use dayNumber(date) at the edge. */

/** The expanding ladder, in days. Past the last rung, reviews go monthly. */
export const INTERVALS = [1, 3, 7, 16, 35];
export const MONTHLY_DAYS = 30;

/** Calendar day as an integer, for scheduling. Local midnight, so "today" matches the kid's. */
export function dayNumber(date = new Date()) {
  const d = new Date(date);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}

/** Days to wait at a given rung. Rungs past the ladder repeat monthly. */
export function intervalFor(step) {
  const i = Math.max(0, Math.floor(step));
  return i < INTERVALS.length ? INTERVALS[i] : MONTHLY_DAYS;
}

/**
 * First schedule for a skill the kid has just mastered (end of its lesson).
 * @returns {{skill: string, step: number, due: number, reviews: number, lapses: number}}
 */
export function firstReview(skill, today = dayNumber()) {
  return { skill, step: 0, due: today + intervalFor(0), reviews: 0, lapses: 0 };
}

/**
 * Re-schedule one entry after it was reviewed. Pure — returns a new entry.
 * @param {object} entry from firstReview / a previous review
 * @param {boolean} correct
 * @param {number} [today]
 */
export function review(entry, correct, today = dayNumber()) {
  const step = correct
    ? entry.step + 1                      // expand
    : Math.max(0, entry.step - 1);        // contract, with a floor
  return {
    ...entry,
    step,
    due: today + intervalFor(step),
    reviews: (entry.reviews || 0) + 1,
    lapses: (entry.lapses || 0) + (correct ? 0 : 1),
  };
}

/**
 * The due queue: everything at or past its due day, weakest and most overdue first.
 * Warm-ups and mixed sets draw from here (Part 7 #2).
 * @param {Array} entries
 * @param {number} [today]
 * @param {{limit?: number}} [opts]
 */
export function dueQueue(entries = [], today = dayNumber(), { limit } = {}) {
  const due = entries
    .filter(e => e && Number.isFinite(e.due) && e.due <= today)
    .sort((a, b) => (a.due - b.due) || (a.step - b.step) || String(a.skill).localeCompare(String(b.skill)));
  return typeof limit === 'number' ? due.slice(0, Math.max(0, limit)) : due;
}

/** How overdue an entry is, in days (0 when not yet due). Drives review-queue cues later. */
export function overdueBy(entry, today = dayNumber()) {
  return Math.max(0, today - entry.due);
}

/**
 * Retention snapshot for the parent report — what's held, not just what's done.
 * `held` is anything that has reached the 7-day rung or beyond without lapsing back.
 */
export function retention(entries = [], today = dayNumber()) {
  const tracked = entries.filter(Boolean);
  const held = tracked.filter(e => e.step >= 2).length;
  return {
    tracked: tracked.length,
    held,
    due: dueQueue(tracked, today).length,
    lapses: tracked.reduce((n, e) => n + (e.lapses || 0), 0),
  };
}
