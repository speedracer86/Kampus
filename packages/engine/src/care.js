/* The care loop — "while you were away" (PLAY_SYSTEM §4, §6).

   Opening the app leads with two or three warm lines about what happened at her stand,
   then today's lesson. This is the reason to come back that is NOT a streak: §4 bans
   streak flames outright, so the pull has to be curiosity about something she owns.

   Rules the copy follows: warm, never alarmed; at most three lines; absence is never
   scolded; and nothing here is a call to action — it is news. */
import { lemonCount, capabilities } from './business.js';

const cents = (n) => `${Math.round(Math.abs(n) * 100)}¢`;

/**
 * @param {object} biz
 * @param {{daysAway?: number, season?: object, unlocks?: object}} [ctx]
 * @returns {Array<{id: string, text: string}>} at most three lines, newest news first
 */
export function awayFeed(biz, { daysAway = 1, season, unlocks = {} } = {}) {
  if (!biz) return [];
  const lines = [];
  const caps = capabilities(biz.band);

  // Price drift, but only once she has been shown that prices move.
  if (unlocks.drift && biz.yesterdayPrices && biz.marketPrices) {
    for (const k of Object.keys(biz.marketPrices)) {
      const delta = biz.marketPrices[k] - (biz.yesterdayPrices[k] ?? biz.marketPrices[k]);
      if (Math.abs(delta) >= 0.03) {
        lines.push({ id: `drift-${k}`, text: `${k[0].toUpperCase() + k.slice(1)} ${delta < 0 ? 'dropped' : 'went up'} ${cents(delta)}.` });
        break;                                   // one price line is plenty
      }
    }
  }

  // A regular came by. Warm, and never "you missed them".
  const regular = (biz.regulars || [])[0];
  if (caps.memory && regular) {
    lines.push({ id: 'regular', text: `${regular.name || 'A regular'} came by.` });
  }

  // Stock aging, phrased as a heads-up rather than a loss.
  if (unlocks.spoilage && lemonCount(biz) > 0) {
    lines.push({ id: 'stock', text: `${lemonCount(biz)} in the back, getting on a bit.` });
  }

  if (season) lines.push({ id: 'season', text: season.blurb });

  // Absence is news about the stand, never a reprimand about her.
  if (daysAway >= 3 && lines.length < 3) {
    lines.push({ id: 'away', text: 'Quiet while you were gone. Everything is where you left it.' });
  }

  return lines.slice(0, 3);
}

/** The stand's build-out stage, for the Home thumbnail. Rungs are earned, never lost. */
export const BUILD_STAGES = [
  { id: 'starter', label: 'Starter Kit', blob: 'Startup' },
  { id: 'sign', label: 'Big Sign', blob: 'Marketing' },
  { id: 'blender', label: 'Blender', blob: 'Coffee' },
  { id: 'ad', label: 'Ad Campaign', blob: 'Networking' },
  { id: 'cookie', label: 'Cookie Shop', blob: 'Eating' },
  { id: 'franchise', label: 'Franchise', blob: 'Startup' },
  { id: 'empire', label: 'Empire', blob: 'Winner' },
];

/** Her current stage — the highest rung owned. Placeholder art until the design round. */
export function buildStage(biz) {
  const owned = new Set(biz?.ladder || ['starter']);
  const stage = [...BUILD_STAGES].reverse().find(s => owned.has(s.id)) || BUILD_STAGES[0];
  return { ...stage, index: BUILD_STAGES.findIndex(s => s.id === stage.id), total: BUILD_STAGES.length };
}
