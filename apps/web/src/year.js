/* The school year: turning the curriculum bank's 128-day sequence into the thing the
   Daily Lesson runner plays (PROMPT B1).

   The bank owns WHAT is taught and in what order; the engine owns the questions. This
   module is the seam between them and authors nothing: every title, Snag and teach
   panel here comes from packages/curriculum verbatim. */
import {
  lessonsFor, unitById, unitSpan, yearShape, snagFor, teachFor, teachStepsFor, quizSkills, YEAR,
} from '@kampus/curriculum';
import { problemsForSkill, dueQueue, dayNumber, hasGenerator, snagChoices } from '@kampus/engine';
import { WORLDS, TOPIC_ORDER } from './worlds.js';

const WORLD_BY_NAME = Object.fromEntries(TOPIC_ORDER.map(t => [WORLDS[t].name, { id: t, ...WORLDS[t] }]));
/** A unit names its world in the bank's words; fall back so an unknown name never crashes a day. */
export const worldForUnit = (unit) => WORLD_BY_NAME[unit?.world] || { id: 'frac', ...WORLDS.frac };

/** Where the student is in the year. The pointer is an index into lessonsFor(grade). */
export function currentDay(state) {
  const seq = lessonsFor(state.grade) || [];
  const i = Math.max(0, Math.min(seq.length - 1, state.lessonPointer || 0));
  return { seq, index: i, day: seq[i] };
}

/** Unit progress for Home: which unit, how far through the year (yearShape/unitSpan). */
export function yearProgress(state) {
  const { seq, index, day } = currentDay(state);
  const shape = yearShape(state.grade) || { lessons: seq.length, units: 7 };
  const units = YEAR[state.grade] || [];
  const unitIdx = Math.max(0, units.findIndex(u => u.id === day?.unit));
  return {
    unit: unitIdx + 1,
    units: shape.units || units.length,
    lessonsDone: index,
    lessonsTotal: shape.lessons || seq.length,
    span: unitSpan(state.grade, day?.unit) || null,
    unitRecord: units[unitIdx] || null,
    unitIndex: unitIdx,
  };
}

/** The engine's view of her stand, handed to world generators so questions use her numbers. */
export function bizCtx(state) {
  const b = state.biz || {};
  return {
    biz: {
      pricePerCup: b.price || 3,
      unit: b.unit || 'cup',
      unitPlural: b.unitPlural || 'cups',
      yesterdayRevenue: b.yesterdayRevenue || state.kredits || 40,
      meanCups: b.meanCups || 12,
    },
  };
}

const asQuestion = (p) => ({
  text: String(p.q).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(),
  answers: p.choices, correct: p.correctIdx,
  teachSteps: p.steps, hint: p.steps?.[0], show: p.steps?.join(' '),
  skill: p.skillKey, source: p.source,
});

const draw = (skill, tier, n, ctx) => problemsForSkill(skill, tier, { count: n, ctx }).map(asQuestion);

/** Warm-ups come from the review queue; before anything is due, from the unit's earlier skills. */
function warmUpQuestions(state, unit, tier, ctx) {
  const due = dueQueue(state.review || [], dayNumber(), { limit: 2 })
    .map(e => e.skill).filter(hasGenerator);
  const pool = due.length ? due : (unit?.skills || []).filter(hasGenerator).slice(0, 2);
  return pool.flatMap(s => draw(s, Math.max(1, tier - 1), 1, ctx)).slice(0, 2);
}

/**
 * The bank's teach panel as §0b TeachSteps: authored layouts where they exist,
 * the mechanical walk conversion everywhere else (packages/curriculum teach-steps).
 *
 * A panel that declares an interactive keeps it — those seven are owner-declared
 * and outrank a converted walk row.
 */
function teachMoves(skill) {
  const t = teachFor(skill);
  if (!t) return null;
  const declared = (t.steps || []).filter(s => s.interactive);
  const steps = (teachStepsFor(skill) || []).map((s, i) => ({
    id: `t${i}`,
    title: s.verb ? s.verb[0].toUpperCase() + s.verb.slice(1) : `Step ${i + 1}`,
    ...s,
  }));
  // Hands-on steps the bank declared, appended so neither source is lost.
  declared.forEach((s, i) => steps.push({ id: `i${i}`, title: s.do, prompt: s.do, body: s.ex,
    takeaway: s.ex, interactive: s.interactive, config: s.config }));
  return steps.length ? { steps } : null;
}

/** Scaffolds fade across a guided move: the last two carry none (§0). */
const fade = (qs) => qs.map((q, i) => (i < qs.length - 2
  ? { ...q, scaffold: q.hint, scaffoldLevel: i === 0 ? 'lots' : 'some' }
  : q));

/**
 * Build the day the student is on. Returns null for quiz/test days — those route to the
 * assessment screens instead (B2).
 */
export function buildDayLesson(state) {
  const { day } = currentDay(state);
  if (!day || day.type === 'quiz' || day.type === 'test') return null;

  const unit = unitById(day.unit);
  const world = worldForUnit(unit);
  const tier = state.tiers?.[`${state.grade}_${world.id}`] || 1;
  const ctx = bizCtx(state);
  const skill = day.skill;
  const unitSkills = (unit?.skills || []).filter(hasGenerator);
  const moves = [];

  moves.push({ id: 'warmup', meta: (state.review || []).length ? 'from your review queue' : 'warm up',
    questions: warmUpQuestions(state, unit, tier, ctx) });

  if (day.type === 'new') {
    const teach = teachMoves(skill);
    // PLAY_SYSTEM §1: the Snag opens the new idea — one look, no pay, then the teaching.
    const snag = day.snag ? snagFor(day.snag) : null;
    if (teach) moves.push({
      id: 'new', meta: '2–3 min', teach,
      // answers: null means "no honest distractors exist" — the Snag renders as a
      // scene with a reveal rather than a multiple choice she can win by shape (B7).
      snag: snag && (() => {
        const choices = snagChoices(snag.ans);
        return { scene: snag.scene, q: snag.q, ans: snag.ans, answers: choices.length > 1 ? choices : null };
      })(),
    });
  }

  if (day.type === 'new' || day.type === 'guided') {
    moves.push({ id: 'guided', meta: 'with help', teachFree: true,
      questions: fade(draw(skill, tier, 4, ctx)) });
  }

  const mixPool = unitSkills.length ? unitSkills : [skill].filter(hasGenerator);
  moves.push({ id: 'mixed', meta: day.type === 'review' ? 'a refresh, not a re-teach' : 'interleaved',
    questions: mixPool.flatMap(s => draw(s, tier, 1, ctx)).slice(0, 4) });

  moves.push({ id: 'prove', meta: 'no help',
    questions: draw(skill || mixPool[0], tier, 3, ctx),
    fresh: draw(skill || mixPool[0], tier, 2, ctx) });

  const reteachSource = teachFor(skill);
  return {
    title: day.title,
    unit: `${unit?.name || ''} · unit ${yearProgress(state).unit} of ${yearProgress(state).units}`,
    world,
    day,
    moves: moves.filter(m => (m.questions?.length || m.teach)),
    reteach: reteachSource ? {
      kicker: 'Go over it',
      title: reteachSource.bigIdea,
      lede: unit?.focus || '',
      rows: (reteachSource.steps || []).map(s => ({ lead: '', how: s.do, value: s.ex })),
    } : null,
  };
}

/** What Home's "Today's lesson" row shows. */
export function todayCard(state) {
  const { day } = currentDay(state);
  const unit = unitById(day?.unit);
  const world = worldForUnit(unit);
  const isQuiz = day?.type === 'quiz', isTest = day?.type === 'test';
  return {
    world, mins: state.settings?.lessonLength || 20, moveIndex: 0,
    title: isQuiz ? 'Inspection Day' : isTest ? 'The Grade Test' : (day?.title || 'Today’s lesson'),
    kind: day?.type || 'new',
    isAssessment: isQuiz || isTest,
  };
}

/** The unit's quiz, as skill keys (7 unit + 3 review per Part 5). */
export function quizPlanFor(state) {
  const { unitIndex } = yearProgress(state);
  const plan = quizSkills(state.grade, unitIndex) || { unit: [], review: [] };
  return {
    unit: plan.unit.filter(hasGenerator),
    review: plan.review.filter(hasGenerator),
  };
}
