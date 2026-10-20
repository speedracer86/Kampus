/* Phase-0 vertical slice: Home → pick a world → QuizRound fed by @kampus/engine → back home.
   Proves the engine ↔ component-library contract end to end. The remaining screens
   (shop, rewards, stand, grown-ups, onboarding, grade tests) arrive in Phase 3. */
import { useState, useMemo } from 'react';
import { toQuizQuestion, recordAnswer, GRADE_WORLDS, bonusPct, payout,
  buildUnitQuiz, gradeUnitQuiz, buildGradeTest, gradeGradeTest, testIntroCopy,
  award, ask, cancelAsk, availableCents, receiptModel, howYouEarn, DEFAULT_CAP_CENTS, weekKey } from '@kampus/engine';
import { color } from '@kampus/ui/tokens';
import { NavBar } from '@kampus/ui/app';
import { HomeStack } from '@kampus/ui/home-stack';
import { QuizRound } from '@kampus/ui/quiz';
import { DailyLesson } from '@kampus/ui/lesson';
import { AssessmentIntro, AssessmentRunner, UnitQuizResults, GradeTestResults } from '@kampus/ui/assessment';
import { RewardsScreen } from '@kampus/ui/rewards';
import { buildLesson } from './lessonData.js';
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
    unit: { unit: curTier, units: 7, lessonsDone: Object.keys(state.days || {}).length, lessonsTotal: 130 },
    lesson: {
      world: WORLDS[state.lastTopic],
      title: GRADE_WORLDS[grade][state.lastTopic].desc,
      moveIndex: 0,
      mins: 20,
    },
    practice: TOPIC_ORDER.map(topic => ({
      id: topic,
      world: WORLDS[topic],
      title: GRADE_WORLDS[grade][topic].desc,
      questions: 6,
      kredits: 6 * (8 + 4 * (state.tiers[tierKey(grade, topic)] || 1)),
      blitz: false,
    })),
    standGated: state.lessonDoneDay !== today,
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
    return ['lesson', 'quiz', 'test', 'rewards'].includes(h) ? h : 'home';
  });
  const [paper, setPaper] = useState(null);     // graded quiz / test result
  const [papers, setPapers] = useState(null);   // the assembled question sheet
  const [topic, setTopic] = useState(state.lastTopic);
  const [blitzOn, setBlitzOn] = useState(false);

  // A fresh question set per round entry; key by nonce so "Run it back" gets new problems too
  const [roundNonce, setRoundNonce] = useState(0);
  const questions = useMemo(
    () => (screen === 'play' ? buildRound(state, topic) : []),
    [screen, topic, roundNonce] // eslint-disable-line react-hooks/exhaustive-deps
  );

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
  const lesson = useMemo(() => buildLesson(state, topic),
    [state.grade, topic, state.tiers[tierKey(state.grade, topic)], roundNonce]);

  const onLessonEvent = (type, payload) => {
    append(studentId, { type: `lesson_${type}`, payload });
    if (type === 'answer' && payload.right) update(s => { s.kredits += payload.gain; s.week.earned += payload.gain; return s; });
    if (type === 'lesson_complete') update(s => {
      s.lessonDoneDay = new Date().toISOString().slice(0, 10);
      s.ledger = award(s.ledger || [], { reason: 'lesson', day: dayName(), week: weekKey(), cap: s.capCents || DEFAULT_CAP_CENTS }).rows;
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

  if (screen === 'rewards') {
    const ledger = state.ledger || [];
    return <RewardsScreen
      data={{
        receipt: receiptModel(ledger, { name: state.name || null, week: weekKey(), cap: state.capCents || DEFAULT_CAP_CENTS, goal: state.goal, number: ledger.length + 1 }),
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
      }} />;
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
          unit={state.tiers[tierKey(state.grade, topic)] || 1}
          intro={isQuiz ? 'Ten questions on this unit, plus a few from earlier. No timer, and Read it to me stays on.' : testIntroCopy(state.grade)}
          onStart={() => setPapers(isQuiz ? buildUnitQuiz({ grade: state.grade, topic, tier: state.tiers[tierKey(state.grade, topic)] || 1, review: state.review })
            : buildGradeTest({ grade: state.grade }))} />
      </div>;
    }
    return <AssessmentRunner kind={isQuiz ? 'quiz' : 'test'} questions={papers}
      onExit={() => { setPapers(null); setScreen('home'); }}
      onHandIn={(answers) => {
        const res = isQuiz ? gradeUnitQuiz(papers, answers) : gradeGradeTest({ grade: state.grade, questions: papers, answers });
        append(studentId, { type: isQuiz ? 'quiz_result' : 'test_result', payload: res });
        update(s => {
          s.ledger = award(s.ledger || [], { reason: isQuiz ? 'quiz' : 'test', day: dayName(), week: weekKey(), cap: s.capCents || DEFAULT_CAP_CENTS }).rows;
          if (!isQuiz && res.passed) { s.passed[state.grade] = true; s.tests = { ...(s.tests || {}), [state.grade]: `${res.score}/${res.asked}` }; }
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
        onShop={() => setScreen('home')}
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

  return <div style={{ minHeight: '100vh', background: color.sidebar }}>
    <NavBar
      items={[
        { id: 'home', label: 'Play', dot: color.green },
        { id: 'stand', label: 'My Stand', dot: color.lime },
        { id: 'shop', label: 'Shop', dot: '#8F97DE' },
        { id: 'rewards', label: 'Rewards', dot: color.gold },
        { id: 'parent', label: 'Grown-ups', dot: color.textFaint },
      ]}
      active="home"
      onNav={() => {}}
      weekLabel={`+$${state.week.earned} this week`}
      kredits={state.kredits}
      avatar={state.name || 'K'}
      avatarColor={WORLDS[state.lastTopic]?.color}
    />
    <HomeStack
      data={homeStackData(state)}
      onEvent={(type, payload) => {
        if (type === 'start_lesson') { setTopic(state.lastTopic); setScreen('lesson'); }
        if (type === 'practice') startRound(payload.id, { blitz: !!payload.blitz });
        if (type === 'stand') setScreen('home');
      }}
    />
  </div>;
}
