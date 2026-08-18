/* Phase-0 persistence: a single localStorage blob, same shape philosophy as v1.
   Phase 2 replaces this with the Supabase-backed event log + sync queue; the
   read/write surface below is deliberately tiny so that swap stays contained. */
import { weekKey } from '@kampus/engine';

const KEY = 'kampus_web_v0';

export function freshState() {
  return {
    grade: 6,
    passed: {},
    kredits: 0,
    tickets: 0,
    owned: { gear: ['wood'], pets: [], themes: ['paper'] },
    // per `${grade}_${topic}`: adaptive tier + rolling answers
    tiers: {},
    recent: {},
    lastTopic: 'frac',
    week: { key: weekKey(), earned: 0, spent: 0 },
    recentRuns: [],
    onboarded: false,
    avatar: 'Thinker',
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? { ...freshState(), ...JSON.parse(raw) } : freshState();
    if (s.week.key !== weekKey()) s.week = { key: weekKey(), earned: 0, spent: 0 };
    return s;
  } catch {
    return freshState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode) — session still plays, just doesn't persist */
  }
}
