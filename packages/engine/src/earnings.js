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
};
export const RATE_LABEL = {
  lesson: "Finished today's lesson",
  quiz: 'Took a unit quiz',
  test: 'Took the grade test',
  streak5: 'Five-day streak',
};

/** Weekly cap options a grown-up can choose, in cents. */
export const CAP_OPTIONS = [300, 500, 800];
export const DEFAULT_CAP_CENTS = 500;

export const EARNED = 'earned', HELD = 'held', GIVEN = 'given', REFUNDED = 'refunded';

const sum = (rows) => rows.reduce((n, r) => n + r.cents, 0);
const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/** Rows that are money coming in this week. */
export function earnedThisWeek(rows = [], week) {
  return sum(rows.filter(r => r.cents > 0 && r.week === week && r.status !== REFUNDED));
}

/** What is left under the cap this week. Never negative. */
export function capRemaining(rows = [], week, cap = DEFAULT_CAP_CENTS) {
  return Math.max(0, cap - earnedThisWeek(rows, week));
}

/**
 * Pay for an action. Trimmed to the cap, so the result may be a smaller row or none.
 * @returns {{rows, awarded: number, cappedOut: boolean}}
 */
export function award(rows = [], { reason, day, week, cap = DEFAULT_CAP_CENTS, label } = {}) {
  const full = RATES[reason] || 0;
  const room = capRemaining(rows, week, cap);
  const awarded = Math.max(0, Math.min(full, room));
  if (awarded === 0) return { rows, awarded: 0, cappedOut: true };
  const row = {
    id: id('e'), cents: awarded, reason,
    label: label || RATE_LABEL[reason] || reason,
    status: EARNED, day, week,
  };
  return { rows: [...rows, row], awarded, cappedOut: awarded < full };
}

/** Money set aside against a specific ask, waiting on a grown-up. */
export function heldCents(rows = []) {
  return Math.abs(sum(rows.filter(r => r.status === HELD)));
}

/** Money the kid can actually spend: earned, minus held, minus given. */
export function availableCents(rows = []) {
  const earned = sum(rows.filter(r => r.cents > 0 && r.status !== REFUNDED));
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
  const earned = rows.filter(r => r.cents > 0 && r.week === week && r.status !== REFUNDED);
  const holds = rows.filter(r => r.status === HELD);
  return {
    name,
    number: String(number).padStart(4, '0'),
    earned: earned.map(r => ({ day: r.day, label: r.label, cents: r.cents })),
    subtotal: sum(earned),
    cap,
    capLeft: capRemaining(rows, week, cap),
    held: holds.map(r => ({ id: r.id, label: r.label, cents: Math.abs(r.cents) })),
    available: availableCents(rows),
    goal: goalProgress(rows, goal),
    note: 'Paid for effort. Never for scores.',
  };
}

/** The "How you earn" list §0 prints on the ground under the receipt. */
export function howYouEarn() {
  return Object.keys(RATES).map(reason => ({ reason, label: RATE_LABEL[reason], cents: RATES[reason] }));
}
