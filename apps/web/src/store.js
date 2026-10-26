/* The single persistence surface for the React app.

   Its shape is already the server's shape (see docs/DEPLOYMENT.md): every call
   is keyed by a student id, and facts can be appended to an event log as well as
   folded into state. While the backend is localStorage the keys are
   `kampus_v1_<studentId>`; swapping in Supabase changes this one file and zero
   components.

   The active student id is chosen outside this module — a family has several
   students, and nothing here should assume there is only one. */
import { weekKey } from '@kampus/engine';

const stateKey = (studentId) => `kampus_v1_${studentId}`;
const eventsKey = (studentId) => `kampus_v1_${studentId}_events`;

/** Stand-in until profiles exist: one local student per device. */
export const DEFAULT_STUDENT_ID = 'local';

/* The family roster. One record per device holding who lives here, so the doorway
   (§0a 15a–15f) can ask "who's this?" without reading every student's state.

   Kept deliberately thin: ids, display names, the kid's unlock PIN, and the
   grown-ups PIN. Everything else about a student lives in that student's own
   state under their own key, which is what lets a server shard by student later. */
const FAMILY_KEY = 'kampus_v1_family';

export function freshFamily() {
  return { parentEmail: null, parentPin: null, students: [] };
}

export function loadFamily() {
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    return raw ? { ...freshFamily(), ...JSON.parse(raw) } : freshFamily();
  } catch {
    return freshFamily();
  }
}

export function saveFamily(family) {
  try {
    localStorage.setItem(FAMILY_KEY, JSON.stringify(family));
  } catch {
    /* same bargain as save(): play continues, persistence doesn't */
  }
}

/**
 * Write one student out of onboarding's answers: a roster row plus that student's
 * own state. Returns the new student id, which the caller makes active.
 *
 * `grade: 'placement'` means the grown-up chose "let Kampus find her level" — we
 * park her at the lowest grade and set placementQueued, because a placement check
 * she has not sat yet must not look like a grade she was assigned.
 */
export function createStudent({ name, pin, grade, settings, parentEmail }) {
  const family = loadFamily();
  const id = `s${Date.now().toString(36)}`;
  const placement = grade === 'placement';
  save(id, {
    ...freshState(),
    name,
    grade: placement ? 3 : grade,
    placementQueued: placement,
    settings: { ...(settings || {}) },
  });
  saveFamily({
    ...family,
    parentEmail: parentEmail ?? family.parentEmail,
    students: [...family.students, { id, name, pin, worldTopic: null }],
  });
  return id;
}

/** Patch one roster row (her colour after first run, a renamed profile). */
export function updateStudent(id, patch) {
  const family = loadFamily();
  saveFamily({ ...family, students: family.students.map(s => (s.id === id ? { ...s, ...patch } : s)) });
}

/** How many events to keep client-side. The server is the real log; this is a buffer. */
const EVENT_BUFFER = 500;

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
    days: {},
    review: [],          // review.js entries: {skill, step, due, reviews, lapses}
    earnings: [],        // real-dollar ledger rows, integer cents
    onboarded: false,
    placementQueued: false,
    openPaper: null,      // an assessment in progress, so a reload resumes it
    avatar: 'Thinker',
  };
}

/** Pre-multi-student key. Its save is adopted once, then left alone. */
const LEGACY_KEY = 'kampus_web_v0';

function migrateLegacy(studentId) {
  try {
    const old = localStorage.getItem(LEGACY_KEY);
    if (!old || localStorage.getItem(stateKey(studentId))) return;
    localStorage.setItem(stateKey(studentId), old);
  } catch { /* nothing to adopt */ }
}

export function load(studentId = DEFAULT_STUDENT_ID) {
  try {
    migrateLegacy(studentId);
    const raw = localStorage.getItem(stateKey(studentId));
    const s = raw ? { ...freshState(), ...JSON.parse(raw) } : freshState();
    if (s.week.key !== weekKey()) s.week = { key: weekKey(), earned: 0, spent: 0 };
    return s;
  } catch {
    return freshState();
  }
}

export function save(studentId = DEFAULT_STUDENT_ID, state) {
  try {
    localStorage.setItem(stateKey(studentId), JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode) — session still plays, just doesn't persist */
  }
}

/**
 * Append one fact to the student's event log. These are the same payloads the UI
 * already emits through onEvent, which is what makes sync, parent analytics and
 * term reports queries over history rather than new schema.
 */
export function append(studentId = DEFAULT_STUDENT_ID, event) {
  try {
    const raw = localStorage.getItem(eventsKey(studentId));
    const log = raw ? JSON.parse(raw) : [];
    log.push({ ...event, created_at: new Date().toISOString() });
    localStorage.setItem(eventsKey(studentId), JSON.stringify(log.slice(-EVENT_BUFFER)));
  } catch {
    /* the log is a convenience buffer; losing it never blocks play */
  }
}

/** Read the local event buffer (newest last). */
export function events(studentId = DEFAULT_STUDENT_ID) {
  try {
    return JSON.parse(localStorage.getItem(eventsKey(studentId)) || '[]');
  } catch {
    return [];
  }
}
