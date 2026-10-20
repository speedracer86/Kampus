/* The lesson sequence, built deterministically from the unit maps.

   Every grade-year is 32 teaching weeks × 4 lessons = 128 sequenced days.
   Within a unit the pattern follows the teaching system's arc:
     - each skill gets a 'new' day (teach-first: Snag → teach panel → try) and a
       'guided' day (scaffolds that fade) in curriculum order,
     - remaining days alternate 'mixed' (interleaved practice across the unit's
       skills, small pay bonus) and 'review' (warm-up from the spaced review
       queue — the runner draws due skills at runtime, so skill is null),
     - the unit's last day is its 'quiz' (Inspection Day) — or 'test' when the
       unit is the grade's final review unit (the License).
   The first 'new' day of each unit carries the unit's Snag (snags.js).

   Callers own all state; the runner keeps a per-student lessonPointer and walks
   this array. The sequence is pure data derived from YEAR — editing a unit map
   re-derives the year. */

import { YEAR, GRADES } from './units.js';
import { SKILLS } from './skills.js';

const TITLES = {
  new: key => SKILLS[key].label,
  guided: key => `${SKILLS[key].label} — with help nearby`,
  mixed: () => 'Mix it up',
  review: () => 'Warm-up: your review queue',
  quiz: () => 'Inspection Day',
  test: () => 'The Grade Test',
};

function buildUnit(unit, isFinal) {
  const weeks = unit.weeks[1] - unit.weeks[0] + 1;
  const slots = weeks * 4;
  const days = [];
  for (const key of unit.skills) {
    // The final unit is the year in review: its skills were all taught earlier,
    // so they get a guided refresh day each — never a second "new" lesson.
    if (!isFinal) days.push({ type: 'new', skill: key });
    days.push({ type: 'guided', skill: key });
  }
  // Interleave the remaining practice: mixed, mixed, review, repeating — mixed
  // work dominates (the interleaving effect) with a spaced-review day each cycle.
  let i = 0;
  while (days.length < slots - 1) {
    days.push(i % 3 === 2 ? { type: 'review', skill: null } : { type: 'mixed', skill: null });
    i++;
  }
  days.length = Math.min(days.length, slots - 1);  // oversized skill lists never spill
  days.push({ type: isFinal ? 'test' : 'quiz', skill: null });
  return days.map((d, idx) => ({
    ...d,
    unit: unit.id,
    title: TITLES[d.type](d.skill),
    snag: idx === 0 ? unit.id : null,   // every unit opens on its snag; in the
  }));                                  // review unit it's a look-back scene
}

const cache = {};

/** The full ordered lesson sequence for a grade: 128 entries of
    {n, unit, type, skill, title, snag}. */
export function lessonsFor(grade) {
  if (cache[grade]) return cache[grade];
  const units = YEAR[grade];
  const seq = units.flatMap((u, i) => buildUnit(u, i === units.length - 1));
  cache[grade] = seq.map((d, n) => ({ n: n + 1, ...d }));
  return cache[grade];
}

/** Where a unit starts and ends in the sequence (1-based, inclusive). */
export function unitSpan(grade, unitId) {
  const seq = lessonsFor(grade);
  const ns = seq.filter(d => d.unit === unitId).map(d => d.n);
  return { first: ns[0], last: ns[ns.length - 1] };
}

/** Year shape summary used by Home ("unit 3 of 7 · 38 of 128 lessons"). */
export function yearShape(grade) {
  const seq = lessonsFor(grade);
  return { lessons: seq.length, units: YEAR[grade].length };
}

export { GRADES };
