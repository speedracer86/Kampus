/* Phase-0 vertical slice: Home → pick a world → QuizRound fed by @kampus/engine → back home.
   Proves the engine ↔ component-library contract end to end. The remaining screens
   (shop, rewards, stand, grown-ups, onboarding, grade tests) arrive in Phase 3. */
import { useState, useMemo } from 'react';
import { toQuizQuestion, recordAnswer, GRADE_WORLDS, bonusPct } from '@kampus/engine';
import { color } from '@kampus/ui/tokens';
import { NavBar } from '@kampus/ui/app';
import { HomeScreen } from '@kampus/ui/home';
import { QuizRound } from '@kampus/ui/quiz';
import { load, save } from './store.js';
import { WORLDS, TOPIC_ORDER } from './worlds.js';

const ROUND_LENGTH = 12;
const BLOB_DIR = '/blobs/';

const tierKey = (grade, topic) => `${grade}_${topic}`;

function buildRound(state, topic) {
  const tier = state.tiers[tierKey(state.grade, topic)] || 1;
  return Array.from({ length: ROUND_LENGTH }, () => toQuizQuestion(state.grade, topic, tier));
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
  };
}

export function App() {
  const [state, setState] = useState(load);
  const [screen, setScreen] = useState('home');
  const [topic, setTopic] = useState(state.lastTopic);

  // A fresh question set per round entry; key by nonce so "Run it back" gets new problems too
  const [roundNonce, setRoundNonce] = useState(0);
  const questions = useMemo(
    () => (screen === 'play' ? buildRound(state, topic) : []),
    [screen, topic, roundNonce] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const update = mutate => setState(prev => {
    const next = mutate(structuredClone(prev));
    save(next);
    return next;
  });

  const startRound = t => {
    setTopic(t);
    setRoundNonce(n => n + 1);
    update(s => { s.lastTopic = t; return s; });
    setScreen('play');
  };

  const onQuizEvent = (type, payload) => {
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
        return s;
      });
    }
    if (type === 'again') setRoundNonce(n => n + 1);
  };

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
        onEvent={onQuizEvent}
        onQuit={() => setScreen('home')}
      />
    </div>;
  }

  return <div style={{ minHeight: '100vh', background: color.ground }}>
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
      weekLabel="0-day week"
      kredits={state.kredits}
      avatar={state.avatar}
      blobDir={BLOB_DIR}
    />
    <HomeScreen
      data={homeData(state)}
      blobDir={BLOB_DIR}
      onEvent={(type, payload) => {
        if (type === 'world') startRound(payload.id);
        if (type === 'play' || type === 'quick6') startRound(state.lastTopic);
      }}
    />
  </div>;
}
