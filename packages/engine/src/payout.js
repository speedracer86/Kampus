/* Economy v2 payout: one pure function that prices a correct answer and
   explains itself. The breakdown is the product feature — a kid who can read
   why a gain was big learns to play strategically (keep the streak, budget
   teach tokens, go first-try). QuizRound mirrors this formula for display
   (the library stays dependency-free); this module is the tested source of
   truth and what the backend will use to validate ledgers.

   Order of operations (fixed, documented, tested):
     subtotal = round(base(tier) × streakMult × (1 + gear%) × blitz)
     + FIRST_TRY_BONUS if first try
     halved (ceil) if teach was used WITHOUT a token          */
import { comboMult } from './economy.js';

export const FIRST_TRY_BONUS = 5;
export const BLITZ_MULT = 1.5;
export const TEACH_TOKENS_PER_RUN = 3;
/** Blitz only: an answer within this window counts as fast. Untimed mode never measures. */
export const BLITZ_FAST_MS = 8000;

/**
 * Price one correct answer.
 * @param {object} a
 * @param {1|2|3} a.tier
 * @param {number} a.streak streak INCLUDING this answer
 * @param {number} [a.bonusPct] shop bonus percent
 * @param {boolean} [a.firstTry] not answered on the second-look retry pass
 * @param {boolean} [a.blitzFast] Blitz mode was on and the answer was fast
 * @param {boolean} [a.teachUsed] the teach panel was opened for this question
 * @param {boolean} [a.tokenUsed] that teach was covered by a free Teach Token
 * @returns {{total: number, parts: string[]}} parts are display chips, e.g. ["×2 streak", "+5 first try", "token used"]
 */
export function payout({ tier, streak, bonusPct = 0, firstTry = false, blitzFast = false, teachUsed = false, tokenUsed = false }) {
  const mult = comboMult(streak);
  let total = Math.round((8 + 4 * tier) * mult * (1 + bonusPct / 100) * (blitzFast ? BLITZ_MULT : 1));
  const parts = [];
  if (mult > 1) parts.push(`×${mult} streak`);
  if (bonusPct > 0) parts.push(`+${bonusPct}% gear`);
  if (blitzFast) parts.push(`×${BLITZ_MULT} blitz`);
  if (firstTry) { total += FIRST_TRY_BONUS; parts.push(`+${FIRST_TRY_BONUS} first try`); }
  if (teachUsed && tokenUsed) parts.push('token used');
  if (teachUsed && !tokenUsed) { total = Math.ceil(total / 2); parts.push('halved · help'); }
  return { total, parts };
}
