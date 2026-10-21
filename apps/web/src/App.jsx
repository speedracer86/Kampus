/* Phase-0 vertical slice: Home → pick a world → QuizRound fed by @kampus/engine → back home.
   Proves the engine ↔ component-library contract end to end. The remaining screens
   (shop, rewards, stand, grown-ups, onboarding, grade tests) arrive in Phase 3. */
import { useState, useMemo } from 'react';
import { toQuizQuestion, recordAnswer, GRADE_WORLDS, bonusPct, payout,
  buildUnitQuiz, gradeUnitQuiz, buildGradeTest, gradeGradeTest, testIntroCopy,
  award, ask, cancelAsk, availableCents, receiptModel, howYouEarn, DEFAULT_CAP_CENTS, weekKey,
  firstReview, review, dayNumber, problemsForSkill,
  awayFeed, buildStage, seasonFor, unlocks as bizUnlocks,
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
import { buildDayLesson, currentDay, yearProgress, todayCard, quizPlanFor, bizCtx, worldForUnit } from './year.js';
import { unitById } from '@kampus/curriculum';
import { load, save, append, DEFAULT_STUDENT_ID } from './store.js';
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

const dayName = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

/* Seed wishlists until a grown-up sets their own in Grown-ups (Step 8). */
const DEMO_STORE = [
  { id: 's1', name: 'Lego Speed Champions', store: 'Amazon', cents: 2400 },
  { id: 's2', name: 'Sticker book', store: 'Target', cents: 600 },
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
    grades: [3, 4, 5, 6, 7, 8].map(g => {
      const passed = !!state.passed[g];
      return {
        grade: g,
        status: passed ? 'passed' : g === grade ? 'current' : 'locked',
        // Brief v4: a test score, never a letter grade or a percentage.
        test: passed ? (state.tests?.[g] || '18/20') : undefined,
        earned: passed ? (state.testEarned?.[g] || 0) : undefined,
        unit: g === grade ? curTier : undefined,
        units: 7,
        graduated: passed && g === 8,
      };
    }),
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
    runs: (state.recentRuns || []).slice(0, 7).map((r, i) => ({ day: i, world: r.world, color: r.color, kredits: 0 })),
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
  const [studentId] = useState(DEFAULT_STUDENT_ID);
  const [state, setState] = useState(() => load(studentId));
  // A hash deep-link so a screen can be opened directly (headless screenshots, sharing a
  // repro). Home remains the default; the hash is read once, not watched.
  const [screen, setScreen] = useState(() => {
    const h = typeof location !== 'undefined' ? location.hash.slice(1) : '';
    return ['lesson', 'quiz', 'test', 'rewards', 'parents', 'business'].includes(h) ? h : 'home';
  });
  const [paper, setPaper] = useState(null);     // graded quiz / test result
  const [papers, setPapers] = useState(null);   // the assembled question sheet
  const [pinOk, setPinOk] = useState(false);    // parent gate, per session
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
            return s;
          });
          if (type === 'serve_next' || type === 'serve_rest') update(s => {
            // Per-tap serving is theater over the engine's math: stock decides, in order.
            const q = [...(s.dayQueue || [])];
            const serveOne = () => {
              const i = q.findIndex(c => c.status === 'next' || c.status === 'waiting');
              if (i < 0) return false;
              const servedSoFar = q.filter(c => c.status === 'served').length;
              q[i] = { ...q[i], status: servedSoFar < (s.dayServable ?? q.length) ? 'served' : 'soldout' };
              return true;
            };
            if (type === 'serve_next') serveOne(); else while (serveOne());
            const up = q.findIndex(c => c.status === 'waiting');
            if (up >= 0) q[up] = { ...q[up], status: 'next' };
            const served = q.filter(c => c.status === 'served').length;
            s.dayQueue = q;
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
    if (!pinOk) return <PinGate pin={state.pin || '1234'} blobDir={BLOB_DIR}
      onPass={() => setPinOk(true)} onCancel={() => setScreen('home')} />;
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
        store: state.wishlist || DEMO_STORE,
        home: state.homeRewards || DEMO_HOME_REWARDS,
        waiting: ledger.filter(r => r.status === 'held').map(r => ({ id: r.id, label: r.label, cents: Math.abs(r.cents) })),
      }}
      onEvent={(type, payload) => {
        if (type === 'ask') update(s => { s.ledger = ask(s.ledger || [], { name: payload.name, cents: payload.cents, day: dayName() }).rows; return s; });
        if (type === 'cancel') update(s => { s.ledger = cancelAsk(s.ledger || [], payload.id); return s; });
        if (type === 'save') update(s => { s.goal = { id: payload.id, name: payload.name, cents: payload.cents }; return s; });
        if (type === 'paste' && payload.link) update(s => {
          s.wishlist = (s.wishlist || DEMO_STORE).concat({ id: `w${Date.now()}`, name: payload.link.replace(/^https?:\/\//, '').slice(0, 40), store: 'Link', cents: 1000 });
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
          onStart={() => setPapers(isQuiz ? buildUnitQuizFromPlan(state) : buildGradeTest({ grade: state.grade }))} />
      </div>;
    }
    return <AssessmentRunner kind={isQuiz ? 'quiz' : 'test'} questions={papers}
      onExit={() => { setPapers(null); setScreen('home'); }}
      onHandIn={(answers) => {
        const res = isQuiz ? gradeUnitQuiz(papers, answers) : gradeGradeTest({ grade: state.grade, questions: papers, answers });
        append(studentId, { type: isQuiz ? 'quiz_result' : 'test_result', payload: res });
        update(s => {
          s.ledger = award(s.ledger || [], { reason: isQuiz ? 'quiz' : 'test', day: dayName(), week: weekKey() }).rows;
          if (!isQuiz && res.passed) {
            // The License: the district is built and the next grade opens (PLAY_SYSTEM §5).
            s.passed[state.grade] = true;
            s.tests = { ...(s.tests || {}), [state.grade]: `${res.score}/${res.asked}` };
            s.districts = [...new Set([...(s.districts || []), state.grade])];
            if (state.grade < 8) { s.grade = state.grade + 1; s.lessonPointer = 0; }
          }
          if (!isQuiz && !res.passed) {
            // A repair plan is a schedule, not a punishment: its units go into review.
            for (const u of res.repairPlan || []) {
              const skills = (unitById(u.unitId)?.skills) || [];
              for (const sk of skills) if (!(s.review || []).some(r => r.skill === sk)) {
                s.review = (s.review || []).concat(firstReview(sk, dayNumber()));
              }
            }
          }
          // A quiz or test never touches the business — §5 is an invariant, not a habit.
          s.lessonPointer = Math.min((s.lessonPointer || 0) + 1, (currentDay(s).seq.length - 1));
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
      }}
    />
  </Shell>;
}
