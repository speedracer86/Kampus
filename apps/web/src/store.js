/* The single persistence surface for the React app.

   Its shape is already the server's shape (see docs/DEPLOYMENT.md): every call
   is keyed by a student id, and facts can be appended to an event log as well as
   folded into state. While the backend is localStorage the keys are
   `kampus_v1_<studentId>`; swapping in Supabase changes this one file and zero
   components.

   The active student id is chosen outside this module — a family has several
   students, and nothing here should assume there is only one. */
import { weekKey } from '@kampus/engine';
import {
  SYNC_ON, client, onAuth, currentUser, ensureFamily, pullStudents, pushStudent,
  pushEvents, pullEvents,
} from './supabase.js';

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

/**
 * @param {object} [opts]
 * @param {boolean} [opts.queue] false when the write CAME from the server, so a
 *   pull does not immediately queue itself straight back up again.
 */
export function save(studentId = DEFAULT_STUDENT_ID, state, { queue = true } = {}) {
  try {
    localStorage.setItem(stateKey(studentId), JSON.stringify(state));
    // When this device last wrote, kept beside the state rather than inside it:
    // last-writer-wins needs a timestamp, and the state object belongs to the
    // engine, not to the sync layer.
    writeJSON(metaKey(studentId), { savedAt: Date.now() });
    if (queue) queueStudent(studentId);
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
    // The id is generated HERE, on the device, at the moment the thing happened.
    // It is what makes a queue that flushes twice store the fact once: a lesson
    // finished in a dead zone pays out when the network returns, and pays once.
    const row = { ...event, client_id: event.client_id || uuid(), created_at: new Date().toISOString() };
    log.push(row);
    localStorage.setItem(eventsKey(studentId), JSON.stringify(log.slice(-EVENT_BUFFER)));
    queueEvent(studentId, row);
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

/* ===========================================================================
   SYNC (docs/SUPABASE_WORK_ORDER.md steps 3-6)

   Everything above this line is unchanged and still the whole product when
   VITE_SYNC is off. Supabase is the source of truth; localStorage stays the
   write-through cache; and the kid's session works with the network down.

   THE API STAYS SYNCHRONOUS. `load()` returns a state object, not a promise,
   because App.jsx calls it inside a useState initialiser — making it async
   would push an await into every screen, and the work order is explicit that
   no component may change. So reads come from the cache, always, and sync runs
   beside them: writes go local first and queue, and a pull from the server
   lands in the cache and tells the app to re-read.

   THE CONFLICT RULES, as the work order sets them:
     - a student's state blob: last writer wins, by timestamp;
     - events: append-only, never merged, deduplicated on a client-generated id;
     - the ledger: UNIONED BY ROW ID, not merged as a blob and not replayed.
       The work order says "replays from events", and that is the right
       instinct — but `earn` events carry cents and a reason, not the row id
       that an `approve` later refers to, so a replay would mint new ids and
       orphan every approval. A union by id loses no row and no approval, which
       is what replaying was for.
=========================================================================== */

const OUTBOX_KEY = 'kampus_v1_outbox';
const REMOTE_KEY = 'kampus_v1_remote';
const metaKey = (studentId) => `kampus_v1_${studentId}_meta`;

const readJSON = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
};
const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* play continues */ }
};

const uuid = () => (globalThis.crypto?.randomUUID
  ? crypto.randomUUID()
  // A fallback for an http origin, where crypto.randomUUID is not exposed. The
  // value only has to be unique per student, and it is never a secret.
  : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`);

/** What this device knows about the server: the family, and which student is which. */
const remoteMap = () => readJSON(REMOTE_KEY, { familyId: null, byStudent: {}, pulledAt: null });
const setRemoteMap = (m) => writeJSON(REMOTE_KEY, m);

/** The queue of writes the server has not taken yet. */
const outbox = () => readJSON(OUTBOX_KEY, { students: [], events: {} });
const setOutbox = (o) => writeJSON(OUTBOX_KEY, o);

/** Mark a student's blob as needing a push. Cheap, and safe to call on every save. */
function queueStudent(studentId) {
  if (!SYNC_ON) return;
  const o = outbox();
  if (!o.students.includes(studentId)) { o.students.push(studentId); setOutbox(o); }
}

/** Queue one fact. The client_id is what makes a replayed flush a no-op. */
function queueEvent(studentId, event) {
  if (!SYNC_ON) return;
  const o = outbox();
  (o.events[studentId] = o.events[studentId] || []).push(event);
  setOutbox(o);
}

/** Ledger rows from both sides, by id, newest wins — never fewer rows than we had. */
function unionLedger(mine = [], theirs = []) {
  const by = new Map();
  for (const row of [...theirs, ...mine]) if (row?.id) by.set(row.id, row);
  return [...by.values()];
}

/** Merge a pulled state into what this device has. */
function mergeState(localState, localSavedAt, remoteState, remoteUpdatedAt) {
  const remoteWins = Date.parse(remoteUpdatedAt || 0) > (localSavedAt || 0);
  const base = remoteWins ? { ...localState, ...remoteState } : { ...remoteState, ...localState };
  // Money is never decided by whose clock was ahead.
  base.ledger = unionLedger(localState?.ledger, remoteState?.ledger);
  return base;
}

let syncing = false;
let notify = () => {};

/**
 * Push everything queued. Safe to call at any time; does nothing when the queue
 * is empty, sync is off, or nobody is signed in.
 */
export async function flush() {
  /* The guard is claimed BEFORE the first await, not after it.
     It used to read "if (syncing) return" and then await currentUser() before
     setting the flag — so three cycles starting together (startup, the auth
     event, and a reconnect) all passed the check, all awaited, and all pushed.
     The server grew three copies of the same student 46ms apart, and the
     device's id map pointed at the last one, which is how a kid gets two of
     herself on the family roster. */
  if (!SYNC_ON || syncing) return;
  syncing = true;
  try {
    const sb = client();
    if (!sb || !(await currentUser())) return;
    const map = remoteMap();
    if (!map.familyId) {
      map.familyId = await ensureFamily();
      if (!map.familyId) return;
      setRemoteMap(map);
    }
    const o = outbox();

    for (const localId of [...o.students]) {
      const state = load(localId);
      const roster = loadFamily().students.find(x => x.id === localId);
      const remoteId = await pushStudent(map.familyId, map.byStudent[localId] || null, {
        display_name: state.name || roster?.name || 'Student',
        grade: state.grade ?? null,
        pin_hash: roster?.pin ? String(roster.pin) : null,
        settings: state.settings || {},
        state,
      });
      if (!remoteId) continue;                       // offline: keep it queued
      map.byStudent[localId] = remoteId;
      setRemoteMap(map);
      o.students = o.students.filter(x => x !== localId);
      setOutbox(o);
    }

    for (const [localId, rows] of Object.entries(o.events)) {
      const remoteId = map.byStudent[localId];
      if (!remoteId || !rows.length) continue;
      const sent = await pushEvents(remoteId, rows);
      if (sent) { delete o.events[localId]; if (o.tries) delete o.tries[localId]; setOutbox(o); continue; }
      /* ONE BAD FACT MUST NOT STOP THE REST.
         A row the server will never accept — a malformed id, a type longer than
         the column — fails every flush, and because the batch is all-or-nothing
         it takes every later fact down with it: the queue grows forever and the
         pilot report quietly stops moving. So a batch that keeps failing is
         retried a few times and then dropped, loudly in the console, rather than
         blocking the log behind it. Losing one fact is bad; losing every fact
         after it is how a kid's week disappears. */
      o.tries = o.tries || {};
      o.tries[localId] = (o.tries[localId] || 0) + 1;
      if (o.tries[localId] >= 5) {
        console.warn(`[kampus] dropping ${rows.length} queued events for ${localId} the server kept refusing`);
        delete o.events[localId];
        delete o.tries[localId];
      }
      setOutbox(o);
    }
  } catch { /* the queue survives; the next flush tries again */ }
  finally { syncing = false; }
}

/**
 * Pull the family down into the cache. This is what makes the iPad show what
 * the laptop did: a device with empty storage ends up holding the same roster,
 * the same state and the same log.
 */
export async function hydrate() {
  if (!SYNC_ON) return false;
  const sb = client();
  if (!sb || !(await currentUser())) return false;
  const map = remoteMap();
  map.familyId = map.familyId || await ensureFamily();
  if (!map.familyId) return false;

  const students = await pullStudents();
  if (!students) return false;

  const family = loadFamily();
  let changed = false;
  for (const row of students) {
    // A student pulled from the server is keyed locally by her server id, so
    // the two sides share one identity from then on.
    const localId = Object.entries(map.byStudent).find(([, r]) => r === row.id)?.[0] || row.id;
    map.byStudent[localId] = row.id;

    const meta = readJSON(metaKey(localId), { savedAt: 0 });
    const merged = mergeState(load(localId), meta.savedAt, row.state || {}, row.updated_at);
    merged.name = merged.name || row.display_name;
    if (row.grade != null) merged.grade = merged.grade ?? row.grade;
    save(localId, merged, { queue: false });

    if (!family.students.some(x => x.id === localId)) {
      family.students.push({ id: localId, name: row.display_name, pin: row.pin_hash || null, worldTopic: null });
      changed = true;
    }

    const log = await pullEvents(row.id);
    if (log) {
      // The log is the measured truth (the report reads events, never the blob),
      // so the cache holds the server's copy plus anything not yet pushed.
      const pending = (outbox().events[localId] || []);
      const seen = new Set(log.map(e => e.client_id));
      const mergedLog = [...log, ...pending.filter(e => !seen.has(e.client_id))];
      writeJSON(eventsKey(localId), mergedLog.slice(-EVENT_BUFFER));
    }
  }
  setRemoteMap(map);
  if (changed) saveFamily(family);
  return true;
}

/**
 * Adopt what is already on this device into the family (work order step 4).
 *
 * The owner's daughter has a year of progress in this browser. On her first
 * sign-in those students have no server id, so they are queued for a push — the
 * save is adopted, not replaced, and nothing is read from the server over the
 * top of it until it has been sent.
 */
export function adoptLocalSaves() {
  if (!SYNC_ON) return 0;
  const map = remoteMap();
  const mine = loadFamily().students.filter(s => !map.byStudent[s.id]);
  for (const s of mine) queueStudent(s.id);
  return mine.length;
}

/**
 * Start syncing. Called once by the app; returns a stop function.
 * `onChange` fires when a pull has changed what load() would return.
 */
export function startSync({ onChange } = {}) {
  if (!SYNC_ON) return () => {};
  notify = onChange || (() => {});
  let stopped = false;

  // One cycle at a time. Three triggers (startup, auth, reconnect) fire within
  // milliseconds of each other on a cold load, and a pull racing a push reads
  // the id map half-written.
  let cycling = false;
  const cycle = async () => {
    if (stopped || cycling) return;
    cycling = true;
    try {
      await flush();
      if (await hydrate()) notify();
    } finally { cycling = false; }
  };

  const offAuth = onAuth(async (user) => {
    if (stopped) return;
    if (!user) return;
    adoptLocalSaves();     // what is already here goes up before anything comes down
    await cycle();
  });

  const onOnline = () => { cycle(); };
  globalThis.addEventListener?.('online', onOnline);
  const timer = setInterval(cycle, 60_000);
  cycle();

  return () => {
    stopped = true;
    offAuth();
    globalThis.removeEventListener?.('online', onOnline);
    clearInterval(timer);
  };
}
