/* Real money — the earnings ledger.
   Spec: STYLE_GUIDE §0 "Rewards" + the Brief v4 retrofit; START_HERE.

   Two rules decide the whole design:
     1. **Effort, never accuracy.** A row is created for *doing* a thing — finishing
        a lesson, sitting a quiz, sitting the grade test, keeping a five-day streak.
        Nothing here can see a score, so nothing here can pay for one.
     2. **A weekly cap.** Earning stops at the cap ($5.00 by default, a grown-up may
        set $3/$5/$8). Hitting it is not a failure and never costs an earlier row:
        the award is simply trimmed to what is left, possibly to nothing.

   Everything is integer cents — no floats touch money. Pure: callers own the rows,
   which are the `ledger` table in docs/DEPLOYMENT.md. */

/** What each action pays, in cents. The only way money is ever created. */
export const RATES = {
  lesson: 50,     // finished today's lesson
  quiz: 100,      // took a unit quiz
  test: 150,      // took the grade test
  streak5: 50,    // five-day streak
  field: 50,      // a field assignment, done with a grown-up (PLAY_SYSTEM §7)
};
/* Two vocabularies for one ledger row (POLISH_TASKS Task 0). A grown-up approving
   an earning needs to know what it was — "a unit quiz". The kid reading her own
   receipt lives in the world, where it was Inspection Day. Same row, same money. */
export const RATE_LABEL = {
  lesson: "Finished today's lesson",
  quiz: 'Took a unit quiz',
  test: 'Took the grade test',
  streak5: 'Five-day streak',
  field: 'Field assignment',
};
export const KID_LABEL = {
  lesson: "Finished today's lesson",
  quiz: 'Sat Inspection Day',
  test: 'Sat the License',
  streak5: 'Five days running',
  field: 'Field assignment',
};
/** The wording for an audience: 'kid' (her receipt) or 'grownup' (the approvals queue). */
export const labelFor = (reason, audience = 'grownup') =>
  (audience === 'kid' ? KID_LABEL : RATE_LABEL)[reason] || reason;

/** Weekly cap options a grown-up can choose, in cents. */
export const CAP_OPTIONS = [300, 500, 800];
export const DEFAULT_CAP_CENTS = 500;

/* Statuses.
   An earning is recorded the moment the effort happens, but it is *pending* until a
   grown-up approves it — that is what the Grown-ups approvals queue is for (§0 11a),
   and it is why the weekly cap binds at approval rather than at award: the kid is
   never told "that lesson didn't count", only that the week is paid up.
   A grown-up may also defer a row; deferring is reversible and costs nothing. */
export const PENDING = 'pending', APPROVED = 'approved', DEFERRED = 'deferred';
/* An ask moves money out: held while it waits, given once the grown-up buys it. */
export const HELD = 'held', GIVEN = 'given', REFUNDED = 'refunded';
export const EARNED = PENDING;   // legacy alias

const sum = (rows) => rows.reduce((n, r) => n + r.cents, 0);
const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/** Money a grown-up has actually approved this week — what the cap measures. */
export function earnedThisWeek(rows = [], week) {
  return sum(rows.filter(r => r.cents > 0 && r.week === week && r.status === APPROVED));
}

/** Efforts recorded but not yet approved or deferred — the approvals queue. */
export function pendingEarnings(rows = []) {
  return rows.filter(r => r.cents > 0 && r.status === PENDING);
}

/** What is left under the cap this week. Never negative. */
export function capRemaining(rows = [], week, cap = DEFAULT_CAP_CENTS) {
  return Math.max(0, cap - earnedThisWeek(rows, week));
}

/**
 * Record an effort. Always the full rate, always pending — the cap is applied when a
 * grown-up approves, so a capped-out week never silently shrinks what the kid did.
 * @returns {{rows, awarded: number}}
 */
export function award(rows = [], { reason, day, week, label } = {}) {
  const cents = RATES[reason] || 0;
  if (cents === 0) return { rows, awarded: 0 };
  const row = {
    id: id('e'), cents, reason,
    label: label || RATE_LABEL[reason] || reason,
    status: PENDING, day, week,
  };
  return { rows: [...rows, row], awarded: cents };
}

/** Would approving this row push the week past the cap? Drives §0's "Over limit". */
export function wouldExceedCap(rows = [], rowId, { week, cap = DEFAULT_CAP_CENTS } = {}) {
  const row = rows.find(r => r.id === rowId);
  if (!row) return false;
  return row.cents > capRemaining(rows, week, cap);
}

/** A grown-up says yes. Refused, without changing anything, if it would pass the cap. */
export function approveEarning(rows = [], rowId, { week, cap = DEFAULT_CAP_CENTS } = {}) {
  const row = rows.find(r => r.id === rowId);
  if (!row || row.status === APPROVED) return { rows, ok: false, overLimit: false };
  if (wouldExceedCap(rows, rowId, { week, cap })) return { rows, ok: false, overLimit: true };
  return { rows: rows.map(r => (r.id === rowId ? { ...r, status: APPROVED } : r)), ok: true, overLimit: false };
}

/** Defer a row for now. Reversible, and it never expires. */
export function deferEarning(rows = [], rowId) {
  return rows.map(r => (r.id === rowId && r.cents > 0 ? { ...r, status: DEFERRED } : r));
}

/** Undo a decision on an earning, putting it back in the queue. */
export function undoEarning(rows = [], rowId) {
  return rows.map(r => (r.id === rowId && r.cents > 0 ? { ...r, status: PENDING } : r));
}

/** Approve everything pending, oldest first, stopping cleanly at the cap. */
export function approveAllEarned(rows = [], { week, cap = DEFAULT_CAP_CENTS } = {}) {
  let out = rows, approved = 0;
  for (const r of pendingEarnings(rows)) {
    const res = approveEarning(out, r.id, { week, cap });
    if (res.ok) { out = res.rows; approved += r.cents; }
  }
  return { rows: out, approved };
}

/** Money set aside against a specific ask, waiting on a grown-up. */
export function heldCents(rows = []) {
  return Math.abs(sum(rows.filter(r => r.status === HELD)));
}

/** Money the kid can actually spend: approved earnings, minus what is held or given. */
export function availableCents(rows = []) {
  const earned = sum(rows.filter(r => r.cents > 0 && r.status === APPROVED));
  const out = Math.abs(sum(rows.filter(r => r.cents < 0 && r.status !== REFUNDED)));
  return earned - out;
}

/**
 * Ask for something. Holds the money: available drops immediately, and the row
 * waits for a grown-up. Returns the rows unchanged if there isn't enough.
 */
export function ask(rows = [], { name, cents, day } = {}) {
  if (!(cents > 0) || availableCents(rows) < cents) return { rows, ok: false };
  return {
    rows: [...rows, { id: id('a'), cents: -cents, reason: 'ask', label: name, status: HELD, day }],
    ok: true,
  };
}

/** A grown-up says yes: the hold becomes a real payment. */
export function approve(rows = [], rowId) {
  return rows.map(r => (r.id === rowId && r.status === HELD ? { ...r, status: GIVEN } : r));
}

/** The ask is cancelled or declined: the money comes straight back. */
export function cancelAsk(rows = [], rowId) {
  return rows.map(r => (r.id === rowId && r.status === HELD ? { ...r, status: REFUNDED } : r));
}

/** Progress toward a saving goal, as a 10-cell bar (§0 receipt). */
export function goalProgress(rows = [], goal) {
  if (!goal?.cents) return null;
  const have = availableCents(rows);
  const cells = Math.max(0, Math.min(10, Math.floor((have / goal.cents) * 10)));
  return { name: goal.name, cents: goal.cents, have, cells, toGo: Math.max(0, goal.cents - have) };
}

/**
 * Everything the receipt prints, already ordered. The UI formats; it decides nothing.
 */
export function receiptModel(rows = [], { name = 'you', week, cap = DEFAULT_CAP_CENTS, goal, number = 1 } = {}) {
  const earned = rows.filter(r => r.cents > 0 && r.week === week && r.status === APPROVED);
  const holds = rows.filter(r => r.status === HELD);
  return {
    name,
    number: String(number).padStart(4, '0'),
    // The receipt is hers, so it speaks her world's words.
    earned: earned.map(r => ({ day: r.day, label: labelFor(r.reason, 'kid') || r.label, cents: r.cents })),
    subtotal: sum(earned),
    cap,
    capLeft: capRemaining(rows, week, cap),
    held: holds.map(r => ({ id: r.id, label: r.label, cents: Math.abs(r.cents) })),
    waitingOnGrownUp: sum(pendingEarnings(rows)),
    available: availableCents(rows),
    goal: goalProgress(rows, goal),
    note: 'Paid for effort. Never for scores.',
  };
}

/** The "How you earn" list §0 prints on the ground under the receipt. */
export function howYouEarn(audience = 'kid') {
  return Object.keys(RATES).map(reason => ({ reason, label: labelFor(reason, audience), cents: RATES[reason] }));
}
