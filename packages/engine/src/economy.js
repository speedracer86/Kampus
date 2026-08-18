/* The Kredit and Ticket economy as pure functions, ported from the v1 app.
   Kredits are in-game currency (per-answer, streak-multiplied). Tickets are the
   real-world reward currency: milestone-only, weekly-capped, parent-redeemed.
   NOTE: the UI library's QuizRound computes per-answer Kredit gains itself (its
   architecture contract). These functions are the server-side source of truth
   for validating and recomputing ledgers from the attempt event log.
   Phase 1 of the build plan reworks ticket reasons to inputs-only (see docs/). */

export const STREAKS = [
  { min: 0, name: 'STARTER', c: '#8A8578' },
  { min: 2, name: 'INTERN', c: '#8F97DE' },
  { min: 4, name: 'PRO', c: '#D9A93F' },
  { min: 6, name: 'MANAGER', c: '#58B372' },
  { min: 8, name: 'BOSS', c: '#EE8A55' },
  { min: 10, name: 'CEO', c: '#5E9FE0' },
  { min: 13, name: 'LEGEND', c: '#8F97DE' },
];

export function streakInfo(streak) {
  let cur = STREAKS[0], next = null;
  for (const t of STREAKS) {
    if (streak >= t.min) cur = t;
    else { next = t; break; }
  }
  return { cur, next };
}

export const comboMult = streak => (streak >= 10 ? 3 : streak >= 6 ? 2 : streak >= 3 ? 1.5 : 1);

/**
 * Kredits paid for one correct answer.
 * @param {1|2|3} tier
 * @param {number} streak current streak before this answer
 * @param {{bonusPct?: number, taught?: boolean}} [opts] bonusPct = shop bonus
 *   percent; taught = answer came after opening Teach, pays half (v1 rule).
 */
export function kreditsFor(tier, streak, opts = {}) {
  const full = Math.round((8 + 4 * tier) * comboMult(streak) * (1 + (opts.bonusPct || 0) / 100));
  return opts.taught ? Math.ceil(full / 2) : full;
}

/* ---------- shop catalog ---------- */

export const GEAR = {
  wood: { name: 'Starter Kit', blob: 'gNote', cost: 0, bonus: 0 },
  stone: { name: 'Big Sign', blob: 'gPitch', cost: 150, bonus: 10 },
  iron: { name: 'Blender', blob: 'gIdea', cost: 400, bonus: 20 },
  gold: { name: 'Ad Campaign', blob: 'gMarketing', cost: 900, bonus: 35 },
  diamond: { name: 'Franchise', blob: 'gGrowth', cost: 1600, bonus: 50 },
  obsidian: { name: 'Empire', blob: 'gVault', cost: 2800, bonus: 75 },
};

export const PETS = {
  wolf: { name: 'Doge', icon: '🐶', cost: 500, bonus: 5 },
  cat: { name: 'Neon Cat', icon: '🐱', cost: 800, bonus: 10 },
  fox: { name: 'Kitsune', icon: '🦊', cost: 1200, bonus: 15 },
  parrot: { name: 'Unicorn', icon: '🦄', cost: 1600, bonus: 20 },
  dragon: { name: 'Shadow Dragon', icon: '🐉', cost: 3000, bonus: 30 },
};

export const THEMES = {
  paper: { name: 'Paper', c: '#F7F5F1', cost: 0 },
  peach: { name: 'Peach', c: '#F4BE93', cost: 300 },
  midnight: { name: 'Midnight', c: '#17181B', cost: 800 },
  blossom: { name: 'Blossom', c: '#F0AFCE', cost: 1200 },
  mint: { name: 'Mint', c: '#7CBF8B', cost: 2000 },
};

/** Best gear bonus (they don't stack) plus every pet's bonus (they do). */
export function bonusPct(owned) {
  let g = 0;
  for (const k of owned.gear) g = Math.max(g, GEAR[k].bonus);
  let p = 0;
  for (const k of owned.pets) p += PETS[k].bonus;
  return g + p;
}

/* ---------- tickets ---------- */

export const DEFAULT_WEEKLY_TICKET_CAP = 10;

/** Stable week bucket (weeks start Monday). */
export const weekKey = (now = Date.now()) => String(Math.floor((now / 86400000 + 3) / 7));

export const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/**
 * How many of `n` tickets fit under the weekly cap. Never negative, never silent.
 * @returns {{granted: number, capped: boolean}}
 */
export function grantTickets(n, weekEarned, weekCap = DEFAULT_WEEKLY_TICKET_CAP, bypassCap = false) {
  const room = bypassCap ? n : Math.max(0, weekCap - weekEarned);
  const granted = Math.min(n, room);
  return { granted, capped: granted < n };
}
