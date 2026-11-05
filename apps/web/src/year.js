/* The school year: turning the curriculum bank's 128-day sequence into the thing the
   Daily Lesson runner plays (PROMPT B1).

   The bank owns WHAT is taught and in what order; the engine owns the questions. This
   module is the seam between them and authors nothing: every title, Snag and teach
   panel here comes from packages/curriculum verbatim. */
import {
  lessonsFor, unitById, unitSpan, yearShape, snagFor, teachFor, teachStepsFor, quizSkills, YEAR,
  SECOND_EXAMPLES, PLAN_B, speakFor,
} from '@kampus/curriculum';

/** Karla's speak script for one step, where the bank has authored it: `speak` is
    what the voice row reads today (speechSynthesis until the generated clips
    land — docs/VOICE_PASS.md), `speakLines` carries the per-line visual cues
    the say-it-show-it playback will drive. */
const speakProps = (entry, kind, index) => (entry?.lines?.length
  ? {
    speak: entry.lines.map(l => l.say).join(' '),
    speakLines: entry.lines,
    // Where this step's clips live in the manifest. Carried on the step because the
    // second examples are SPLICED INTO steps below, so a step's on-screen position
    // no longer matches its slot in the bank — resolving clips by screen index
    // would play the wrong lines over the right picture.
    voiceRef: { kind, index },
  }
  : {});
import { problemsForSkill, dueQueue, dayNumber, hasGenerator, snagChoices, unitTopic } from '@kampus/engine';
import { WORLDS, TOPIC_ORDER } from './worlds.js';

/**
 * The world a unit is taught in. The bank names it in its own words, several of
 * which predate the rename, so the engine's `unitTopic` does the reconciliation
 * (see packages/engine/src/unit-world.js — it is not a cosmetic mapping; the
 * lesson runner keys the adaptive tier on what this returns).
 *
 * `world: 'all'` is a deliberately mixed unit and gets no single world, so it
 * falls back rather than claiming one.
 */
export const worldForUnit = (unit) => {
  const topic = unitTopic(unit?.world);
  return topic ? { id: topic, ...WORLDS[topic] } : { id: 'frac', ...WORLDS.frac };
};

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
  const sp = speakFor(skill);
  const steps = (teachStepsFor(skill) || []).map((s, i) => ({
    id: `t${i}`,
    title: s.verb ? s.verb[0].toUpperCase() + s.verb.slice(1) : `Step ${i + 1}`,
    ...s,
    ...speakProps(sp?.steps?.[i], 'steps', i),
  }));
  // Hands-on steps the bank declared, appended so neither source is lost.
  declared.forEach((s, i) => steps.push({ id: `i${i}`, title: s.do, prompt: s.do, body: s.ex,
    takeaway: s.ex, interactive: s.interactive, config: s.config }));
  // The depth pass, in the sequence by DEFAULT: the second worked example splices
  // in before the final Try it. It used to sit behind a "Show me another one"
  // button; owner verdict, Nov 2026 — an opt-in extra step asks for exactly the
  // executive function an ADHD kid is short on, so the kid who needed it most
  // never tapped it. Teaching twice is the product, not an option. The plan-B
  // representation stays out of the default flow and arrives on the one struggle
  // signal we trust: the re-teach after a missed prove-it (below).
  const second = (SECOND_EXAMPLES[skill] || []).map((s, i) => ({
    id: `m${i}`,
    title: s.verb ? s.verb[0].toUpperCase() + s.verb.slice(1) : `Another ${i + 1}`,
    ...s,
    ...speakProps(sp?.more?.[i], 'more', i),
  }));
  if (second.length && steps.length) {
    // Before the Try it wherever it sits (declared interactives can trail it);
    // appended if a sequence somehow has none.
    const ti = steps.findIndex(s => s.tryIt);
    if (ti >= 0) steps.splice(ti, 0, ...second);
    else steps.push(...second);
  }
  return steps.length ? { steps } : null;
}

/** ReteachView rows from a TeachStep — the SECOND example, so the re-teach after a
    missed prove-it shows fresh work, never the panel she just didn't get. */
function reteachRowsFrom(step) {
  if (step.walk) return step.walk.rows.map(r => ({ lead: '', how: r.how, value: r.value }));
  if (step.line) {
    const { start, delta, answer, unit } = step.line;
    return [
      { lead: '', how: 'start at', value: `${start}${unit || ''}` },
      { lead: '', how: step.hint, value: `${delta >= 0 ? '+' : ''}${delta}` },
      { lead: '', how: 'lands on', value: `${answer}${unit || ''}` },
    ];
  }
  if (step.bar) {
    const { parts, target, context } = step.bar;
    return [
      { lead: '', how: context, value: `${target}/${parts}` },
      { lead: '', how: 'shaded, that is', value: `${target} of ${parts}` },
    ];
  }
  if (step.faceoff) {
    const win = step.faceoff.cards[step.faceoff.answer];
    return [
      { lead: '', how: step.faceoff.why, value: win?.label || '' },
    ];
  }
  return [];
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
        const choices = snagChoices(snag.ans, snag.wrongs);
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

  // The re-teach after a missed prove-it. The second example now runs in the main
  // teach flow, so replaying it here would repeat what she just saw — the wall
  // skills switch to their plan-B REPRESENTATION instead (the bar when symbols
  // failed, money when the bar did), picked automatically on this struggle signal
  // rather than behind a button (owner: no opt-in steps for an ADHD kid). Skills
  // without a plan B re-show the second example — fresh numbers still beat a
  // replay of the original panel, which stays as the last fallback.
  const planB = (PLAN_B[skill] || [])[0];
  const second = planB || (SECOND_EXAMPLES[skill] || [])[0];
  const reteachSource = teachFor(skill);
  /* Karla's voice on the re-teach panel. It is ONE panel, so its script is one
     step, and the bank may author it either as a single step or as a list of one.
     The generator reads the kinds off the bank rather than listing them
     (scripts/voice-plan.mjs), so this is the only place a different key name in
     the tranche-3 patch would need changing. Until that patch lands this is
     undefined and the panel renders exactly as it does today. */
  const rt = speakFor(skill)?.reteach;
  const reteachVoice = speakProps(Array.isArray(rt) ? rt[0] : rt, 'reteach', 0);
  return {
    title: day.title,
    // The manifest is keyed by skill, so playback needs it on the lesson.
    skill,
    unit: `${unit?.name || ''} · unit ${yearProgress(state).unit} of ${yearProgress(state).units}`,
    world,
    day,
    moves: moves.filter(m => (m.questions?.length || m.teach)),
    reteach: second ? {
      kicker: planB ? 'Another way to see it' : 'Same idea, new numbers',
      title: second.prompt,
      lede: second.hint || unit?.focus || '',
      rows: reteachRowsFrom(second),
      ...reteachVoice,
    } : reteachSource ? {
      kicker: 'Go over it',
      title: reteachSource.bigIdea,
      lede: unit?.focus || '',
      rows: (reteachSource.steps || []).map(s => ({ lead: '', how: s.do, value: s.ex })),
      ...reteachVoice,
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
