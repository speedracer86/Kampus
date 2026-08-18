/* Problem selection and tier adaptation, ported from the v1 app but made pure:
   the caller owns all state (grade, tier, recent answers) and passes it in.
   Same behavior: 5-of-6 right moves a tier up, 2-or-fewer moves down, and one
   question in five is quietly served a tier easier so streaks stay reachable. */
import { pick, shuffle, valOf, fmt, ri } from './util.js';
import { CURRICULUM } from './curriculum.js';

const RECENT_WINDOW = 6;
const UP_THRESHOLD = 5;
const DOWN_THRESHOLD = 2;
const EASIER_WIN_CHANCE = 0.2;

/**
 * Build a play-ready problem: generator output plus value-filtered distractors
 * and shuffled choices.
 * @param {3|4|5|6|7|8} grade
 * @param {'frac'|'ratio'|'int'|'alg'} topic
 * @param {1|2|3} tier
 * @param {{forceTier?: 1|2|3, random?: () => number}} [opts] forceTier pins the
 *   tier exactly (grade tests) and disables the easier-win sprinkle.
 */
export function makeProblem(grade, topic, tier, opts = {}) {
  const random = opts.random || Math.random;
  let effectiveTier = opts.forceTier || tier;
  if (!opts.forceTier && effectiveTier > 1 && random() < EASIER_WIN_CHANCE) effectiveTier--;
  const gens = CURRICULUM[grade][topic][effectiveTier];

  for (let tries = 0; tries < 10; tries++) {
    try {
      const p = pick(gens)();
      const av = valOf(p.ans);
      let wrongs = [];
      for (const w of new Set(p.wrongs)) {
        if (w === p.ans) continue;
        const wv = valOf(w);
        // A distractor must never EQUAL the answer in value (e.g. 4/6 vs 2/3)
        if (av !== null && wv !== null && Math.abs(av - wv) < 1e-9) continue;
        if (wv !== null && wrongs.some(x => { const xv = valOf(x); return xv !== null && Math.abs(xv - wv) < 1e-9; })) continue;
        wrongs.push(w);
      }
      let guard = 0;
      while (wrongs.length < 3 && guard++ < 20) {
        const numAns = parseFloat(String(p.ans).replace('x = ', '').replace('$', '').replace('%', ''));
        if (!isNaN(numAns) && !/</.test(p.ans)) {
          const alt = String(p.ans).replace(/-?[\d.]+/, fmt(numAns + pick([-3, -2, 2, 3, 4])));
          if (alt !== p.ans && !wrongs.includes(alt)) wrongs.push(alt);
        } else break;
      }
      wrongs = wrongs.slice(0, 3);
      if (wrongs.length < 2) continue;
      const choices = shuffle([p.ans, ...wrongs]);
      return { ...p, tier: effectiveTier, choices, correctIdx: choices.indexOf(p.ans) };
    } catch {
      /* regenerate */
    }
  }

  // Fallback if a generator keeps failing — plain addition, never leaves the kid stuck
  const a = ri(2, 9), b = ri(2, 9);
  const ans = String(a + b);
  const choices = shuffle([ans, String(a + b + 1), String(a + b - 1), String(a * b)]);
  return { prompt: 'Add', q: `${a} + ${b}`, ans, wrongs: [], steps: [], skill: 'Arithmetic', tier: 1, choices, correctIdx: choices.indexOf(ans) };
}

/**
 * Record one answer and decide whether the tier moves. Pure: returns new state.
 * @param {number[]} recent 1/0 results within the current window
 * @param {1|2|3} tier
 * @param {boolean} correct
 * @returns {{recent: number[], tier: 1|2|3, changed: 'up'|'down'|null}}
 */
export function recordAnswer(recent, tier, correct) {
  const r = [...recent, correct ? 1 : 0].slice(-RECENT_WINDOW);
  if (r.length < RECENT_WINDOW) return { recent: r, tier, changed: null };
  const rights = r.reduce((s, v) => s + v, 0);
  if (rights >= UP_THRESHOLD && tier < 3) return { recent: [], tier: tier + 1, changed: 'up' };
  if (rights <= DOWN_THRESHOLD && tier > 1) return { recent: [], tier: tier - 1, changed: 'down' };
  return { recent: r, tier, changed: null };
}
