/* The week plan (POLISH_TASKS Task 2, §0b "Week plan").

   The question this answers, for a kid and a parent alike: what is coming this week?
   Before this, the week view drew seven empty dashes — technically a calendar, and
   useless to both of them.

   The plan is the 128-day sequence laid onto a real calendar. School days carry the
   next lessons in order; weekends and days a grown-up marks off are rest. Rest days
   are not failures and never carry a lesson — the sequence simply waits, which is
   the same promise the review ladder and the business make about absence.

   Pure: the caller owns the pointer, the done-map and the rest-day settings. */

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MS = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);

/** Monday-start week containing `date`. */
export function weekStart(date = new Date(), offsetWeeks = 0) {
  const d = new Date(Date.parse(iso(date) + 'T12:00:00Z'));
  const shift = (d.getUTCDay() + 6) % 7;                 // Monday = 0
  return new Date(d.getTime() - shift * DAY_MS + offsetWeeks * 7 * DAY_MS);
}

export const isRestDay = (date, restDows = [0, 6]) => restDows.includes(date.getUTCDay());

/**
 * Seven days, each knowing what it is.
 *
 * @param {object} a
 * @param {Array} a.sequence         lessonsFor(grade)
 * @param {number} a.pointer         index of the NEXT day she will play
 * @param {Record<string, object>} [a.history]  iso date -> {lessonN, earnedCents}
 * @param {Date} [a.today]
 * @param {number} [a.offsetWeeks]   0 = this week, 1 = next, -1 = last
 * @param {number[]} [a.restDows]    days the grown-up marks off (default weekends)
 */
export function weekPlan({ sequence = [], pointer = 0, history = {}, today = new Date(), offsetWeeks = 0, restDows = [0, 6] } = {}) {
  const start = weekStart(today, offsetWeeks);
  const todayIso = iso(today);
  let upcomingAt = pointer;                               // walks forward across school days

  // Days before this week that are school days consume sequence slots too, so a future
  // week shows the lessons she will actually reach rather than the next five regardless.
  const firstOfWeek = start.getTime();
  const todayStart = weekStart(today, 0).getTime();
  if (firstOfWeek > todayStart) {
    for (let t = todayStart; t < firstOfWeek; t += DAY_MS) {
      const d = new Date(t);
      // `>=` because today itself consumes a lesson slot — excluding it made the
      // next week restart on the lesson this week's Friday already showed.
      if (!isRestDay(d, restDows) && iso(d) >= todayIso) upcomingAt++;
    }
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY_MS);
    const dateIso = iso(date);
    const dow = DOW[date.getUTCDay()];
    const past = dateIso < todayIso, isToday = dateIso === todayIso;
    const rest = isRestDay(date, restDows);

    if (rest) return { date: dateIso, dow, kind: 'rest', status: past ? 'done' : isToday ? 'today' : 'upcoming' };

    const record = history[dateIso];
    if (record) {
      const day = sequence[record.lessonN - 1] || {};
      return { date: dateIso, dow, kind: day.type === 'quiz' ? 'quiz' : day.type === 'test' ? 'test' : 'lesson',
        status: 'done', lessonId: record.lessonN, title: day.title, worldId: day.unit, earnedCents: record.earnedCents };
    }
    if (past) return { date: dateIso, dow, kind: 'rest', status: 'done' };   // a day she did not play is simply rest

    const day = sequence[upcomingAt];
    upcomingAt++;
    if (!day) return { date: dateIso, dow, kind: 'rest', status: isToday ? 'today' : 'upcoming' };
    return {
      date: dateIso, dow,
      kind: day.type === 'quiz' ? 'quiz' : day.type === 'test' ? 'test' : 'lesson',
      status: isToday ? 'today' : 'upcoming',
      lessonId: day.n, title: day.title, worldId: day.unit,
    };
  });
}

/** The header: "This week" / "Next week" / "License week", plus its date range. */
export function weekHeader(days = [], offsetWeeks = 0) {
  const hasTest = days.some(d => d.kind === 'test');
  const label = hasTest ? 'License week' : offsetWeeks === 0 ? 'This week' : offsetWeeks === 1 ? 'Next week'
    : offsetWeeks === -1 ? 'Last week' : offsetWeeks > 0 ? `In ${offsetWeeks} weeks` : `${-offsetWeeks} weeks ago`;
  const first = days[0]?.date, last = days.at(-1)?.date;
  return { label, range: first && last ? `${first.slice(5)} – ${last.slice(5)}` : '', hasTest };
}

/**
 * What is worth looking forward to: the next Inspection Day and the License, with how
 * many lessons stand between her and each.
 */
export function comingUp({ sequence = [], pointer = 0 } = {}) {
  const out = [];
  const nextQuiz = sequence.findIndex((d, i) => i >= pointer && d.type === 'quiz');
  const nextTest = sequence.findIndex((d, i) => i >= pointer && d.type === 'test');
  if (nextQuiz >= 0) out.push({ kind: 'quiz', label: 'Inspection Day', lessonsToGo: nextQuiz - pointer, index: nextQuiz });
  if (nextTest >= 0) out.push({ kind: 'test', label: 'The License', lessonsToGo: nextTest - pointer, index: nextTest });
  return out;
}

/**
 * A rough "how far away" for copy only. Do NOT use it to page the calendar: it
 * divides by a full week of school days and so ignores how much of the current week
 * is already spent, which lands a week short whenever today is mid-week.
 */
export function weeksAhead(lessonsToGo, schoolDaysPerWeek = 5) {
  return Math.floor(Math.max(0, lessonsToGo) / schoolDaysPerWeek);
}

/**
 * The exact week offset whose plan contains sequence index `index`. Found by walking
 * the weeks rather than by arithmetic, so rest days, a mid-week today and any
 * grown-up's marked-off days are all accounted for by construction.
 * @returns {number} offset, or 0 if it is not reachable within `maxWeeks`
 */
export function weekOffsetFor(index, { sequence = [], pointer = 0, today = new Date(), restDows = [0, 6], maxWeeks = 80 } = {}) {
  const targetN = sequence[index]?.n;
  if (targetN == null) return 0;
  for (let off = 0; off <= maxWeeks; off++) {
    const days = weekPlan({ sequence, pointer, today, offsetWeeks: off, restDows });
    if (days.some(d => d.lessonId === targetN)) return off;
  }
  return 0;
}
