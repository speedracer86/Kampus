/* Phase-0 vertical slice: Home → pick a world → QuizRound fed by @kampus/engine → back home.
   Proves the engine ↔ component-library contract end to end. The remaining screens
   (shop, rewards, stand, grown-ups, onboarding, grade tests) arrive in Phase 3. */
import { useState, useMemo, useRef } from 'react';
import { toQuizQuestion, recordAnswer, GRADE_WORLDS, bonusPct, payout,
  buildUnitQuiz, gradeUnitQuiz, buildGradeTest, gradeGradeTest, testIntroCopy,
  award, ask, cancelAsk, availableCents, receiptModel, howYouEarn, DEFAULT_CAP_CENTS, weekKey,
  firstReview, review, dayNumber, problemsForSkill, unitTopic, hasGenerator,
  awayFeed, buildStage, seasonFor, unlocks as bizUnlocks, gradeStates, foldGradeStack, wishTile, storeNameOf,
  startPlacement, nextProbe, recordProbe, placementDone, placementProgress, placementResult, placementQuestion,
  weekPlan, weekHeader, comingUp, weekOffsetFor,
  approveEarning, deferEarning, undoEarning, approveAllEarned, pendingEarnings, earnedThisWeek, approve as approveAsk } from '@kampus/engine';
import { color } from '@kampus/ui/tokens';
import { Shell } from '@kampus/ui/app';
import { HomeStack } from '@kampus/ui/home-stack';
import { QuizRound } from '@kampus/ui/quiz';
import { DailyLesson } from '@kampus/ui/lesson';
import { AssessmentIntro, AssessmentRunner, UnitQuizResults, GradeTestResults } from '@kampus/ui/assessment';
import { RewardsScreen } from '@kampus/ui/rewards';
import { GrownUps } from '@kampus/ui/parents';
import { BusinessScreen } from '@kampus/ui/business';
import { businessData, ensureBiz, gatesFor, today as bizToday,
  dailyTick, buySupplies, customersForDay, openDay, closeDay } from './businessData.js';
import { capabilities, lemonCount } from '@kampus/engine';
import { PinGate } from '@kampus/ui/pin-gate';
import { ParentSetup, StudentFirstRun, Doorway } from '@kampus/ui/onboarding';
import { PlacementIntro, PlacementRunner, PlacementResult } from '@kampus/ui/placement';
import { buildDayLesson, currentDay, yearProgress, todayCard, quizPlanFor, bizCtx, worldForUnit } from './year.js';
import { unitById, lessonsFor, YEAR } from '@kampus/curriculum';
import { load, save, append, DEFAULT_STUDENT_ID,
  loadFamily, saveFamily, createStudent, updateStudent } from './store.js';
import { WORLDS, TOPIC_ORDER } from './worlds.js';

const ROUND_LENGTH = 12;
const BLOB_DIR = '/blobs/';

const tierKey = (grade, topic) => `${grade}_${topic}`;

function buildRound(state, topic) {
  const tier = state.tiers[tierKey(state.grade, topic)] || 1;
  return Array.from({ length: ROUND_LENGTH }, () => toQuizQuestion(state.grade, topic, tier));
}

/** The §0 Home contract: grade placement, today's lesson, free practice, bank, gate. */
/** Inspection Day's sheet: the unit's own skills, plus the bank's review picks. */
function buildUnitQuizFromPlan(state) {
  const plan = quizPlanFor(state);
  const { day } = currentDay(state);
  const world = worldForUnit(unitById(day?.unit));
  const tier = state.tiers?.[`${state.grade}_${world.id}`] || 1;
  const ctx = bizCtx(state);
  const toQ = (p, group) => ({
    text: String(p.q).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(),
    answers: p.choices, correct: p.correctIdx, answerIndex: p.correctIdx, choices: p.choices,
    skill: p.skill || p.skillKey, teachSteps: p.steps, hint: p.steps?.[0], group,
  });
  const unitQs = plan.unit.flatMap(sk => problemsForSkill(sk, tier, { count: 3, ctx }).map(p => toQ(p, 'unit'))).slice(0, 7);
  const reviewPool = plan.review.length ? plan.review : plan.unit;
  const reviewQs = reviewPool.flatMap(sk => problemsForSkill(sk, Math.max(1, tier - 1), { count: 2, ctx }).map(p => toQ(p, 'review'))).slice(0, 3);
  return [...unitQs, ...reviewQs];
}

/** Whole days since she last opened the app; 1 when we have never seen her. */
const daysSince = (iso) => {
  if (!iso) return 1;
  return Math.max(0, Math.round((Date.now() - Date.parse(iso + 'T12:00:00Z')) / 86400000));
};

/* The nav, defined once. Shop is deliberately absent: a menu item that does nothing
   teaches the kid the menu lies, so it returns when a shop exists (AUDIT B1). */
const NAV_ITEMS = [
  { id: 'home', label: 'Play', dot: color.green },
  { id: 'business', label: 'Business', dot: color.lime },
  { id: 'rewards', label: 'Rewards', dot: color.gold },
  { id: 'parents', label: 'Grown-ups', dot: color.textFaint },
];

/** Exactly one customer is "Next": the first who has not been dealt with. */
function markNext(q) {
  let marked = false;
  for (let i = 0; i < q.length; i++) {
    if (q[i].status === 'served' || q[i].status === 'soldout') continue;
    q[i] = { ...q[i], status: !marked ? 'next' : 'waiting' };
    marked = true;
  }
  return q;
}

const dayName = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

/* Seed wishlists until a grown-up sets their own in Grown-ups (Step 8). */
const DEMO_STORE = [
  { id: 's1', name: 'Lego Speed Champions', store: 'Amazon', url: 'https://www.amazon.com/dp/x', cents: 2400, category: 'toy', fetch: 'miss' },
  { id: 's2', name: 'Sticker book', store: 'Target', url: 'https://www.target.com/p/y', cents: 600, category: 'art', fetch: 'miss' },
];
const DEMO_HOME_REWARDS = [
  { id: 'h1', name: 'Pick what we watch tonight', sub: 'One film, your call', cents: 200, icon: '📺' },
  { id: 'h2', name: '30 min extra screen time', sub: 'Any day this week', cents: 150, icon: '⏱' },
];

function homeStackData(state) {
  const grade = state.grade;
  const today = new Date().toISOString().slice(0, 10);
  const curTier = state.tiers[tierKey(grade, state.lastTopic)] || 1;
  return {
    name: state.name || 'there',
    bank: state.kredits,
    weekKredits: state.week.earned,
    // Grade states and the folded "earlier grades" card come from the engine, so the
    // placed-vs-locked distinction is one rule with tests rather than a ternary here.
    ...(() => {
      const states = gradeStates({ grade, passed: state.passed || {}, tests: state.tests || {}, earned: state.testEarned || {} });
      const { earlier, rows } = foldGradeStack(states);
      return {
        earlierGrades: earlier,
        grades: rows.map(r => (r.state === 'current' ? { ...r, unit: curTier, units: 7 } : r)),
      };
    })(),
    unit: (({ unit, units, lessonsDone, lessonsTotal }) => ({ unit, units, lessonsDone, lessonsTotal }))(yearProgress(state)),
    lesson: todayCard(state),
    practice: TOPIC_ORDER.map(topic => ({
      id: topic,
      world: WORLDS[topic],
      title: GRADE_WORLDS[grade][topic].desc,
      questions: 6,
      kredits: 6 * (8 + 4 * (state.tiers[tierKey(grade, topic)] || 1)),
      blitz: false,
    })),
    standGated: state.lessonDoneDay !== today,
    // Care loop + growth loop (PLAY_SYSTEM §4/§6).
    feed: awayFeed({ ...ensureBiz(state), gates: gatesFor(state) }, {
      daysAway: daysSince(state.lastSeenDay),
      season: seasonFor(new Date()),
      unlocks: bizUnlocks({ ...ensureBiz(state), gates: gatesFor(state) }),
    }),
    standStage: buildStage(ensureBiz(state)),
    blobDir: BLOB_DIR,
    // The week plan, from the real sequence (Task 2). `history` is the day map the
    // lesson runner writes, so past days show what she actually did and what it paid.
    week: (() => {
      const sequence = lessonsFor(state.grade) || [];
      const offsetWeeks = state.weekOffset || 0;
      const days = weekPlan({ sequence, pointer: state.lessonPointer || 0, history: state.history || {}, offsetWeeks });
      return {
        days,
        header: weekHeader(days, offsetWeeks),
        comingUp: comingUp({ sequence, pointer: state.lessonPointer || 0 }),
        earnedCents: days.reduce((n, d) => n + (d.earnedCents || 0), 0),
      };
    })(),
  };
}

function homeData(state) {
  const grade = state.grade;
  const worlds = TOPIC_ORDER.map(topic => {
    const w = WORLDS[topic];
    const tier = state.tiers[tierKey(grade, topic)] || 1;
    return {
      id: topic,
      name: w.name,
      skill: GRADE_WORLDS[grade][topic].desc,
      worldColor: w.color,
      blob: w.blob,
      tier,
      tierLabel: `0${TOPIC_ORDER.indexOf(topic) + 1} · TIER ${tier}`,
    };
  });
  const last = WORLDS[state.lastTopic];
  return {
    headline: state.week.earned > 0 ? `${state.week.earned} Kredits this week.` : 'Nothing earned yet. Lock in.',
    grades: [3, 4, 5, 6, 7, 8].map(g => ({
      grade: g,
      status: state.passed[g] ? 'passed' : g === grade ? 'current' : 'locked',
      pct: state.passed[g] ? 100 : g === grade ? 40 : 0,
      detail: state.passed[g] ? 'test passed' : g === grade ? 'in progress' : `after grade ${g - 1}`,
    })),
    jumpBack: {
      world: last.name,
      tier: state.tiers[tierKey(grade, state.lastTopic)] || 1,
      skill: GRADE_WORLDS[grade][state.lastTopic].desc,
      blob: last.blob,
      color: last.color,
    },
    worlds,
    tickets: state.tickets,
    nextReward: { name: '$5 treat (or Robux!)', cost: 10 },
    weekEarned: state.week.earned,
    weekSpent: state.week.spent,
    weekHint: state.week.earned === 0 ? 'Play a round to start earning.' : undefined,
    recentRuns: state.recentRuns.slice(0, 4),
    practiceDays: state.days || {},
    records: [
      { n: state.tickets, label: 'Tickets saved', bg: '#FBF3E4', fg: '#A8862A' },
      { n: state.week.earned, label: 'Kredits this week', bg: '#EAF6EE', fg: '#2E7C46' },
      { n: Object.keys(state.passed || {}).length, label: 'Grades passed', bg: '#EDEBFA', fg: '#4F56A3' },
      { n: Object.values(state.days || {}).reduce((a, b) => a + b, 0), label: 'Total runs', bg: '#FBEDF5', fg: '#A3537D' },
    ],
  };
}

export function App() {
  // One student per device until family profiles exist; the id is chosen here, not
  // inside store.js, so adding a profile switcher touches only this line.
  /* Who is on the device, and who is playing. The roster lives at the family key;
     a student's own state lives under her id. A device that has never been set up
     has an empty roster, which is what puts onboarding in front of everything. */
  const [family, setFamily] = useState(loadFamily);
  const [studentId, setStudentId] = useState(() => loadFamily().students[0]?.id || DEFAULT_STUDENT_ID);
  const [state, setState] = useState(() => load(studentId));
  // A hash deep-link so a screen can be opened directly (headless screenshots, sharing a
  // repro). Home remains the default; the hash is read once, not watched.
  const [screen, setScreen] = useState(() => {
    const h = typeof location !== 'undefined' ? location.hash.slice(1) : '';
    if (['lesson', 'quiz', 'test', 'rewards', 'parents', 'business', 'placement'].includes(h)) return h;
    // A paper in progress outranks Home: she was in the middle of it.
    const open = load(loadFamily().students[0]?.id || DEFAULT_STUDENT_ID).openPaper;
    if (open?.kind) return open.kind;
    // A queued placement check outranks Home: a kid whose grown-up chose "find her
    // level" has not been placed yet, so Home would be showing her someone else's
    // year. Exiting the check clears the flag, so this is an offer and not a trap.
    return load(loadFamily().students[0]?.id || DEFAULT_STUDENT_ID).placementQueued ? 'placement' : 'home';
  });
  const [paper, setPaper] = useState(null);     // graded quiz / test result
  // The assembled question sheet. Restored from the store when one is in progress:
  // an untimed twenty-question test is exactly the thing a kid walks away from, and
  // a reload used to throw away every answer and drop her back at the intro.
  const [papers, setPapers] = useState(() => load(loadFamily().students[0]?.id || DEFAULT_STUDENT_ID).openPaper?.questions || null);
  const [pinOk, setPinOk] = useState(false);    // parent gate, per session
  // Onboarding routing: 'setup' | 'firstrun' | 'doorway' | null (play as usual).
  const [gate, setGate] = useState(() => {
    const h = typeof location !== 'undefined' ? location.hash.slice(1) : '';
    if (h === 'setup' || h === 'doorway') return h;
    const f = loadFamily();
    // A device with a save but no roster predates profiles — leave it alone.
    if (!f.students.length) return load(DEFAULT_STUDENT_ID).name ? null : 'setup';
    // One kid walks straight in; her PIN is for telling two kids apart.
    return f.students.length > 1 ? 'doorway' : null;
  });
  const [pending, setPending] = useState(null);  // the profile mid-first-run
  // The placement check: engine state machine + the question it is currently asking.
  const [placement, setPlacement] = useState(null);
  const deepLink = useRef(typeof location !== 'undefined'
    && ['lesson', 'quiz', 'test', 'rewards', 'parents', 'business', 'placement'].includes(location.hash.slice(1)));
  const [topic, setTopic] = useState(state.lastTopic);
  const [blitzOn, setBlitzOn] = useState(false);

  // A fresh question set per round entry; key by nonce so "Run it back" gets new problems too
  const [roundNonce, setRoundNonce] = useState(0);
  const questions = useMemo(
    () => (screen === 'play' ? buildRound(state, topic) : []),
    [screen, topic, roundNonce] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Everything the frame needs, so no screen assembles its own chrome. */
  const shellProps = (active) => ({
    items: NAV_ITEMS, active,
    onNav: (id) => setScreen(id),
    weekLabel: `+$${state.week.earned} this week`,
    kredits: state.kredits,
    avatar: state.name || 'K',
    avatarColor: WORLDS[state.lastTopic]?.color,
  });

  const update = mutate => setState(prev => {
    const next = mutate(structuredClone(prev));
    save(studentId, next);
    return next;
  });

  const startRound = (t, { blitz = false } = {}) => {
    setTopic(t);
    setBlitzOn(blitz);
    setRoundNonce(n => n + 1);
    update(s => { s.lastTopic = t; return s; });
    setScreen('play');
  };

  // buildLesson() draws random questions, so it must be built once per attempt —
  // rebuilding on a re-render would swap the questions mid-lesson.
  // The day the student is actually on. Rebuilt only when the pointer or her tier moves —
  // the questions are random, so rebuilding on a re-render would swap them mid-lesson.
  const lesson = useMemo(() => buildDayLesson(state),
    [state.grade, state.lessonPointer, state.tiers[tierKey(state.grade, topic)], roundNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLessonEvent = (type, payload) => {
    append(studentId, { type: `lesson_${type}`, payload });
    if (type === 'answer' && payload.right) update(s => { s.kredits += payload.gain; s.week.earned += payload.gain; return s; });
    if (type === 'lesson_complete') update(s => {
      s.lessonDoneDay = new Date().toISOString().slice(0, 10);
      // Prove-it finished: step the year forward and put the skill into the review ladder.
      const { day, seq } = currentDay(s);
      if (day?.skill) {
        const existing = (s.review || []).find(r => r.skill === day.skill);
        s.review = existing
          ? (s.review || []).map(r => (r.skill === day.skill ? review(r, true, dayNumber()) : r))
          : (s.review || []).concat(firstReview(day.skill, dayNumber()));
      }
      s.history = { ...(s.history || {}),
        [new Date().toISOString().slice(0, 10)]: { lessonN: (s.lessonPointer || 0) + 1, earnedCents: payload.rewardCents } };
      s.lessonPointer = Math.min((s.lessonPointer || 0) + 1, seq.length - 1);
      s.ledger = award(s.ledger || [], { reason: 'lesson', day: dayName(), week: weekKey() }).rows;
      return s;
    });
  };

  const onQuizEvent = (type, payload) => {
    append(studentId, { type, payload });
    if (type === 'answer') {
      update(s => {
        if (payload.right) {
          s.kredits += payload.gain;
          s.week.earned += payload.gain;
        }
        const k = tierKey(s.grade, topic);
        const r = recordAnswer(s.recent[k] || [], s.tiers[k] || 1, payload.right);
        s.recent[k] = r.recent;
        s.tiers[k] = r.tier;
        return s;
      });
    }
    if (type === 'round_end') {
      update(s => {
        s.recentRuns.unshift({
          world: WORLDS[topic].name,
          color: WORLDS[topic].color,
          meta: `${payload.correct}/${payload.asked} · +${payload.kredits} Kredits`,
        });
        s.recentRuns = s.recentRuns.slice(0, 8);
        const day = new Date().toISOString().slice(0, 10);
        s.days = s.days || {};
        s.days[day] = (s.days[day] || 0) + 1;
        return s;
      });
    }
    if (type === 'again') setRoundNonce(n => n + 1);
  };

  /** Make a roster row the live student, and load her state. */
  const becomeStudent = (id) => {
    setStudentId(id);
    setState(load(id));
    setPinOk(false);
    // A deep link survives the doorway exactly once: #lesson on a two-kid device
    // should still open the lesson after she says who she is, but switching
    // profiles later goes home rather than dropping the next kid mid-screen.
    if (deepLink.current) { deepLink.current = false; return; }
    setScreen('home');
  };

  /* ---- onboarding (§0a) sits in front of everything, before any nav exists ---- */
  if (gate === 'setup') {
    return <ParentSetup blobDir={BLOB_DIR}
      onPickProfile={() => setGate('doorway')}
      onDone={({ name, pin, grade, settings }) => {
        const id = createStudent({ name, pin, grade, settings, parentEmail: null });
        setFamily(loadFamily());
        setStudentId(id);
        setState(load(id));
        setPending({ id, name, pin, grade });
        setGate('firstrun');
      }} />;
  }

  if (gate === 'firstrun') {
    return <StudentFirstRun profile={pending} blobDir={BLOB_DIR}
      onDone={({ worldId }) => {
        const topicOf = { fractions: 'frac', ratios: 'ratio', integers: 'int', equations: 'alg' };
        const t = topicOf[worldId] || 'frac';
        updateStudent(pending.id, { worldTopic: t });
        setFamily(loadFamily());
        update(s => { s.onboarded = true; s.lastTopic = t; return s; });
        setTopic(t);
        setPending(null);
        setGate(null);
        // A queued placement check is the first thing she sees — NOT the Grade 3
        // License, which is what this used to route to: that one pays, promotes and
        // prints a repair plan, none of which the setup screen promised.
        setScreen(pending?.grade === 'placement' ? 'placement' : 'home');
      }} />;
  }

  if (gate === 'doorway') {
    return <Doorway profiles={family.students} parentPin={family.parentPin} blobDir={BLOB_DIR}
      onSetup={() => setGate('setup')}
      onEnterStudent={(p) => { becomeStudent(p.id); setGate(null); }}
      onEnterParent={(entered) => {
        if (!family.parentPin) { const f = { ...loadFamily(), parentPin: entered }; saveFamily(f); setFamily(f); }
        setPinOk(true);
        setGate(null);
        setScreen('parents');
      }} />;
  }

  /* ---- the placement check (§0a 13k) ---------------------------------------
     Untimed, pays nothing, costs nothing, and ends on a grade rather than a pass
     or a fail — all four promised on the setup screen and enforced in
     packages/engine/src/placement.js. The engine is the state machine; this owns
     only which question is on screen. */
  if (screen === 'placement') {
    if (!placement) {
      return <PlacementIntro name={state.name} blobDir={BLOB_DIR}
        onExit={() => { update(s => { s.placementQueued = false; return s; }); setScreen('home'); }}
        onStart={() => {
          const machine = startPlacement();
          setPlacement({ machine, question: placementQuestion(nextProbe(machine)) });
          append(studentId, { type: 'placement_start', payload: {} });
        }} />;
    }

    if (placement.result) {
      return <PlacementResult result={placement.result} name={state.name} blobDir={BLOB_DIR}
        onStart={() => {
          update(s => {
            s.grade = placement.result.grade;
            s.placementQueued = false;
            s.lessonPointer = 0;
            return s;
          });
          setPlacement(null);
          setScreen('home');
        }} />;
    }

    return <PlacementRunner question={placement.question}
      progress={placementProgress(placement.machine)}
      onExit={() => {
        // She chose to stop. Clear the flag rather than re-offering on every load.
        update(s => { s.placementQueued = false; return s; });
        append(studentId, { type: 'placement_exit', payload: { asked: placement.machine.asked } });
        setPlacement(null); setScreen('home');
      }}
      onAnswer={(choice) => {
        const right = choice === placement.question.answerIndex;
        const machine = recordProbe(placement.machine, right);
        if (placementDone(machine)) {
          const result = placementResult(machine);
          append(studentId, { type: 'placement_done', payload: { grade: result.grade, perTopic: result.perTopic, asked: machine.asked } });
          return setPlacement({ machine, result });
        }
        setPlacement({ machine, question: placementQuestion(nextProbe(machine)) });
      }} />;
  }

  if (screen === 'business') {
    return <Shell {...shellProps('business')}>
      <BusinessScreen data={businessData(state)} blobDir={BLOB_DIR}
        onEvent={(type, payload) => {
          if (type === 'start_lesson') {
            const { day } = currentDay(state);
            setScreen(day?.type === 'quiz' ? 'quiz' : day?.type === 'test' ? 'test' : 'lesson');
          }
          if (type === 'price') update(s => { s.biz = { ...ensureBiz(s), price: payload }; return s; });
          if (type === 'stock') update(s => {
            s.order = { ...(s.order || {}), [payload.key]: Math.max(0, (s.order?.[payload.key] || 0) + payload.delta) };
            return s;
          });
          if (type === 'promo') update(s => { s.promo = payload.id === 'none' ? null : payload.id; return s; });
          if (type === 'karla_dismiss') update(s => {
            if (payload?.key) s.karlaSeen = { ...(s.karlaSeen || {}), [payload.key]: true };
            return s;
          });
          if (type === 'open_day') update(s => {
            // Morning: the world ticks, the order is bought, the line forms.
            let biz = { ...ensureBiz(s), gates: gatesFor(s) };
            biz = dailyTick(biz, bizToday()).biz;
            if (Object.values(s.order || {}).some(n => n > 0)) {
              const bought = buySupplies(biz, s.order, bizToday(), s.kredits || 0);
              if (!bought.error) { biz = bought.biz; s.kredits = Math.round(((s.kredits || 0) - bought.cost) * 100) / 100; }
            }
            const queue = customersForDay(biz, { forecast: 'sunny', grade: s.grade });
            const servable = capabilities(biz.band).inventory
              ? Math.min(lemonCount(biz), biz.sugar ?? 0, biz.cups ?? 0)
              : queue.length;
            s.biz = biz;
            s.order = {};
            s.dayQueue = queue.map((c, i) => ({ ...c, status: i === 0 ? 'next' : 'waiting' }));
            s.dayServable = servable;
            s.dayCounters = { served: 0, missed: 0, left: servable };
            s.dayMomentAt = -1;
            return s;
          });
          if (type === 'serve_next' || type === 'serve_rest') update(s => {
            // Per-tap serving is theater over the engine's math: stock decides, in order.
            const q = [...(s.dayQueue || [])];
            const serveOne = () => {
              const i = q.findIndex(c => c.status === 'next' || c.status === 'waiting');
              if (i < 0) return false;
              // A customer who came with a math moment stops the line until it is
              // answered. "Serve the rest" serves everyone up to them and then asks:
              // the fast path stays useful, but the math is never skipped in one tap —
              // these are the world-sourced questions (PLAY_SYSTEM §2), not filler.
              if (q[i].moment && !q[i].momentDone) { s.dayMomentAt = i; return false; }
              const servedSoFar = q.filter(c => c.status === 'served').length;
              q[i] = { ...q[i], status: servedSoFar < (s.dayServable ?? q.length) ? 'served' : 'soldout' };
              return true;
            };
            if (type === 'serve_next') serveOne(); else while (serveOne());
            // Exactly one "Next". This used to mark the first waiting customer
            // without clearing the old marker, so when a moment stopped the line the
            // queue showed two people as next at once.
            markNext(q);
            const served = q.filter(c => c.status === 'served').length;
            s.dayQueue = q;
            s.dayCounters = { served, missed: q.filter(c => c.status === 'soldout').length,
              left: Math.max(0, (s.dayServable ?? q.length) - served) };
            return s;
          });
          // A moment never changes the day: openDay reads stock and orders, never
          // answers. Getting it wrong costs her nothing — the §5 rule has to hold for
          // the questions standing inside the business too — and it pays nothing
          // either, because serving the line is the job and the profit is the reward.
          if (type === 'moment_answer') {
            append(studentId, { type: 'business_moment', payload: { right: !!payload?.right, skill: payload?.skill } });
          }
          if (type === 'moment_done') update(s => {
            const i = s.dayMomentAt ?? -1;
            if (i < 0) return s;
            const q = [...(s.dayQueue || [])];
            q[i] = { ...q[i], momentDone: true };
            // Now serve the customer she just worked out, and move the line on.
            const servedSoFar = q.filter(c => c.status === 'served').length;
            q[i] = { ...q[i], status: servedSoFar < (s.dayServable ?? q.length) ? 'served' : 'soldout' };
            markNext(q);
            const served = q.filter(c => c.status === 'served').length;
            s.dayQueue = q;
            s.dayMomentAt = -1;
            s.dayCounters = { served, missed: q.filter(c => c.status === 'soldout').length,
              left: Math.max(0, (s.dayServable ?? q.length) - served) };
            return s;
          });
          if (type === 'close_books') update(s => {
            // The engine's day is authoritative; the taps were its preview.
            const biz = { ...ensureBiz(s), gates: gatesFor(s) };
            const { biz: after, result } = openDay(biz, s.dayQueue || [], bizToday());
            s.biz = closeDay(after, result, bizToday());
            s.kredits = Math.round(((s.kredits || 0) + (result.revenue || 0)) * 100) / 100;
            s.dayQueue = [];
            s.dayCounters = { served: result.served, missed: result.missed, left: 0 };
            return s;
          });
          if (type === 'event_action') update(s => {
            if (payload?.kind === 'comeback') s.promo = 'comeback';
            return s;
          });
        }} />
    </Shell>;
  }

  if (screen === 'parents') {
    // The family PIN, not the kid's: her unlock PIN must not open this side. Unset
    // means the pad runs in 'set' mode and the first grown-up through chooses it.
    if (!pinOk) return <PinGate pin={family.parentPin || state.pin || null} blobDir={BLOB_DIR}
      onPass={(entered) => {
        if (!family.parentPin && !state.pin) {
          const f = { ...loadFamily(), parentPin: entered };
          saveFamily(f); setFamily(f);
        }
        setPinOk(true);
      }}
      onCancel={() => setScreen('home')} />;
    const ledger = state.ledger || [];
    const cap = state.settings?.cap ?? DEFAULT_CAP_CENTS;
    const setS = (k, v) => update(s => { s.settings = { ...(s.settings || {}), [k]: v }; return s; });
    return <Shell {...shellProps('parents')}><GrownUps
      data={{
        kid: { name: state.name || 'Your kid', grade: state.grade, day: Object.keys(state.days || {}).length, daysPlayed: Object.keys(state.days || {}).length },
        // Waiting first, then recently decided — §0 keeps closed rows visible with an Undo.
        pending: [
          ...ledger.filter(r => r.cents > 0 && r.status === 'pending'),
          ...ledger.filter(r => r.cents > 0 && r.status !== 'pending'),
        ].slice(0, 12),
        asks: ledger.filter(r => r.status === 'held').map(r => ({ id: r.id, label: r.label, cents: Math.abs(r.cents) })),
        approvedThisWeek: earnedThisWeek(ledger, weekKey()),
        settings: { cap, ...(state.settings || {}) },
        progress: TOPIC_ORDER.map(t => ({ topic: t, name: WORLDS[t].name, color: WORLDS[t].color,
          unit: state.tiers[tierKey(state.grade, t)] || 1, placement: state.grade,
          verdict: (state.tiers[tierKey(state.grade, t)] || 1) >= 3 ? 'solid' : (state.tiers[tierKey(state.grade, t)] || 1) === 2 ? 'shaky' : 'notyet' })),
        stats: [
          { label: 'Lessons done', value: Object.keys(state.days || {}).length },
          { label: 'Kredits', value: state.kredits },
          { label: 'Waiting', value: pendingEarnings(ledger).length },
        ],
      }}
      onEvent={(type, payload) => {
        if (type === 'approve_earning') update(s => { s.ledger = approveEarning(s.ledger, payload.id, { week: weekKey(), cap }).rows; return s; });
        if (type === 'hold_earning') update(s => { s.ledger = deferEarning(s.ledger, payload.id); return s; });
        if (type === 'undo_earning') update(s => { s.ledger = undoEarning(s.ledger, payload.id); return s; });
        if (type === 'approve_all') update(s => { s.ledger = approveAllEarned(s.ledger, { week: weekKey(), cap }).rows; return s; });
        if (type === 'approve_ask') update(s => { s.ledger = approveAsk(s.ledger, payload.id); return s; });
        if (type === 'decline_ask') update(s => { s.ledger = cancelAsk(s.ledger, payload.id); return s; });
        if (type === 'set_cap') setS('cap', payload);
        if (type === 'set_lesson_length') setS('lessonLength', payload);
        if (type === 'set_allow_blitz') setS('allowBlitz', payload);
        if (type === 'set_sprints') setS('sprints', payload);
        if (type === 'set_vacation') setS('vacation', payload);
        if (type === 'set_business_coach') setS('businessCoach', payload);
        if (type === 'set_sound') setS('sound', payload);
      }} /></Shell>;
  }

  if (screen === 'rewards') {
    const ledger = state.ledger || [];
    return <Shell {...shellProps('rewards')}><RewardsScreen
      data={{
        receipt: receiptModel(ledger, { name: state.name || null, week: weekKey(), cap: state.settings?.cap ?? DEFAULT_CAP_CENTS, goal: state.goal, number: ledger.length + 1 }),
        howYouEarn: howYouEarn(),
        available: availableCents(ledger),
        goal: state.goal?.id,
        // Every row carries its tile state, so a failed preview still looks designed.
        store: (state.wishlist || DEMO_STORE).map(it => ({ ...it, tile: wishTile(it) })),
        home: state.homeRewards || DEMO_HOME_REWARDS,
        waiting: ledger.filter(r => r.status === 'held').map(r => ({ id: r.id, label: r.label, cents: Math.abs(r.cents) })),
      }}
      onEvent={(type, payload) => {
        if (type === 'ask') update(s => { s.ledger = ask(s.ledger || [], { name: payload.name, cents: payload.cents, day: dayName() }).rows; return s; });
        if (type === 'cancel') update(s => { s.ledger = cancelAsk(s.ledger || [], payload.id); return s; });
        if (type === 'save') update(s => { s.goal = { id: payload.id, name: payload.name, cents: payload.cents }; return s; });
        if (type === 'paste' && payload.link) update(s => {
          // No preview service wired yet, so the item resolves straight to its
          // fallback tile rather than sitting on a spinner (Task 4).
          s.wishlist = (s.wishlist || DEMO_STORE).concat({
            id: `w${Date.now()}`, url: payload.link, name: '', store: storeNameOf(payload.link),
            cents: 1000, fetch: 'miss',
          });
          return s;
        });
      }} /></Shell>;
  }

  if (screen === 'quiz' || screen === 'test') {
    const isQuiz = screen === 'quiz';
    if (paper) {
      return isQuiz
        ? <UnitQuizResults result={paper} onDone={() => { setPaper(null); setScreen('home'); }}
            onPractice={() => { setPaper(null); startRound(topic); }} />
        : <GradeTestResults grade={state.grade} result={paper} worlds={WORLDS}
            onDone={() => { setPaper(null); setScreen('home'); }}
            onRepair={() => { setPaper(null); setScreen('lesson'); }} />;
    }
    if (!papers) {
      return <div style={{ minHeight: '100vh', background: color.ground, padding: 48 }}>
        <AssessmentIntro kind={isQuiz ? 'quiz' : 'test'} grade={state.grade}
          onExit={() => { setPapers(null); setScreen('home'); }}
          unit={state.tiers[tierKey(state.grade, topic)] || 1}
          intro={isQuiz
            ? 'Inspection Day. Ten questions on this unit, plus a few from earlier — the stand stays shut this morning. No timer, and Read it to me stays on. Nothing here can hurt your business.'
            : `${testIntroCopy(state.grade)} Pass it and you earn the Grade ${state.grade} License — the district gets built.`}
          onStart={() => {
            const sheet = isQuiz ? buildUnitQuizFromPlan(state) : buildGradeTest({ grade: state.grade });
            // Persisted so a reload resumes rather than restarts. The sheet carries
            // its own answerIndex, which the bundle's generators already expose —
            // this is not a new way to find the answers, just a way not to lose work.
            update(s => { s.openPaper = { kind: isQuiz ? 'quiz' : 'test', grade: state.grade, questions: sheet, answers: sheet.map(() => null), at: 0 }; return s; });
            setPapers(sheet);
          }} />
      </div>;
    }
    return <AssessmentRunner kind={isQuiz ? 'quiz' : 'test'} questions={papers}
      initialAnswers={state.openPaper?.answers} initialAt={state.openPaper?.at || 0}
      onProgress={(answers, at) => update(s => {
        if (s.openPaper) s.openPaper = { ...s.openPaper, answers, at };
        return s;
      })}
      onExit={() => { update(s => { s.openPaper = null; return s; }); setPapers(null); setScreen('home'); }}
      onHandIn={(answers) => {
        const res = isQuiz ? gradeUnitQuiz(papers, answers) : gradeGradeTest({ grade: state.grade, questions: papers, answers });
        append(studentId, { type: isQuiz ? 'quiz_result' : 'test_result', payload: res });
        update(s => {
          s.ledger = award(s.ledger || [], { reason: isQuiz ? 'quiz' : 'test', day: dayName(), week: weekKey() }).rows;
          let promoted = false;
          if (!isQuiz && res.passed) {
            // The License: the district is built and the next grade opens (PLAY_SYSTEM §5).
            s.passed[state.grade] = true;
            s.tests = { ...(s.tests || {}), [state.grade]: `${res.score}/${res.asked}` };
            s.districts = [...new Set([...(s.districts || []), state.grade])];
            if (state.grade < 8) { s.grade = state.grade + 1; s.lessonPointer = 0; promoted = true; }
          }
          if (!isQuiz && !res.passed) {
            /* A repair plan is a schedule, not a punishment: its clusters go into
               review. This read `u.unitId`, which the engine has never put on a
               repair row — the rows are {index, unit, world, reason} — so every miss
               scheduled exactly nothing and the plan was decoration. The rows are
               per CLUSTER, and a cluster is a topic, so the units to redo are her
               grade's units in that topic. Capped per cluster: a three-cluster miss
               should hand her a week of review, not fifty skills. */
            const PER_CLUSTER = 4;
            for (const row of res.repairPlan || []) {
              const units = (YEAR[state.grade] || []).filter(u => unitTopic(u.world) === row.world);
              const skills = units.flatMap(u => u.skills || []).filter(hasGenerator).slice(0, PER_CLUSTER);
              for (const sk of skills) if (!(s.review || []).some(r => r.skill === sk)) {
                s.review = (s.review || []).concat(firstReview(sk, dayNumber()));
              }
            }
          }
          // A quiz or test never touches the business — §5 is an invariant, not a habit.
          // Advance a day, UNLESS the License just moved her to a new grade: that sets
          // the pointer to day 0, and incrementing it again skipped the first lesson
          // of every grade from 7 up.
          if (!promoted) s.lessonPointer = Math.min((s.lessonPointer || 0) + 1, (currentDay(s).seq.length - 1));
          s.openPaper = null;                 // handed in; nothing left to resume
          return s;
        });
        setPapers(null); setPaper(res);
      }} />;
  }

  if (screen === 'lesson') {
    return <div style={{ minHeight: '100vh', background: color.ground }}>
      <DailyLesson
        lesson={lesson}
        tier={state.tiers[tierKey(state.grade, topic)] || 1}
        grade={state.grade}
        blobDir={BLOB_DIR}
        pricer={(a) => { const p = payout({ ...a, bonusPct: bonusPct(state.owned) });
          return { amount: p.total, pills: p.parts.map(label => ({ label, kind: /streak/.test(label) ? 'streak' : /first/.test(label) ? 'first' : /blitz/.test(label) ? 'blitz' : /token/.test(label) ? 'token' : 'help' })) }; }}
        onEvent={onLessonEvent}
        onExit={() => setScreen('home')}
        onDone={() => setScreen('home')}
      />
    </div>;
  }

  if (screen === 'play') {
    const w = WORLDS[topic];
    return <div style={{ minHeight: '100vh', background: color.ground }}>
      <QuizRound
        questions={questions}
        grade={state.grade}
        tier={state.tiers[tierKey(state.grade, topic)] || 1}
        gearBonus={bonusPct(state.owned)}
        worldColor={w.color}
        mascot={w.blob}
        blobDir={BLOB_DIR}
        focusMode
        blitz={blitzOn}
        onEvent={onQuizEvent}
        onQuit={() => setScreen('home')}
      />
    </div>;
  }

  return <Shell {...shellProps('home')}>
    <HomeStack
      data={homeStackData(state)}
      onEvent={(type, payload) => {
        if (type === 'start_lesson') {
          const { day } = currentDay(state);
          setScreen(day?.type === 'quiz' ? 'quiz' : day?.type === 'test' ? 'test' : 'lesson');
        }
        if (type === 'practice') startRound(payload.id, { blitz: !!payload.blitz });
        if (type === 'stand') setScreen('business');
        if (type === 'week_page') update(s => { s.weekOffset = (s.weekOffset || 0) + (payload === 'next' ? 1 : -1); return s; });
        if (type === 'week_jump') update(s => {
          s.weekOffset = weekOffsetFor(payload.index, { sequence: lessonsFor(s.grade) || [], pointer: s.lessonPointer || 0 });
          return s;
        });
      }}
    />
  </Shell>;
}
