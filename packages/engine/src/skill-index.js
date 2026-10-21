/* Per-skill problem lookup — the runner needs to ask for a specific skill, not a
   random one from a tier (PROMPT A3).

   The curriculum bank (packages/curriculum/units.js) names skills with the same keys
   as the generator functions, except that the expansion generators carry a trailing
   `G` (the bank says `decAdd`, the generator is `decAddG`). That single suffix is the
   whole mapping; everything else resolves by name. */
import { CURRICULUM, R } from './curriculum.js';
import { EXPANSION_GENERATORS } from './expansion.js';   // import also runs its registration
import { assembleProblem } from './adaptive.js';
import { sourceFor } from './sources.js';

/* Explicit, minification-proof names first: object-literal keys survive any bundler.
   The fn.name scan below remains for generators that live only in GEN's arrays —
   which is why the web build sets esbuild keepNames (see apps/web/vite.config.js);
   without it, fn.name is mangled and those generators vanish from production. */
const NAMED = { ...R, ...EXPANSION_GENERATORS };

/** name -> {fn, topic, tiers[]} for every generator the curriculum can serve. */
export const GENERATOR_INDEX = (() => {
  const index = new Map();
  for (const grade of [3, 4, 5, 6, 7, 8])
    for (const topic of ['frac', 'ratio', 'int', 'alg'])
      for (const tier of [1, 2, 3])
        for (const fn of (CURRICULUM[grade]?.[topic]?.[tier] || [])) {
          const entry = index.get(fn.name) || { fn, topic, tiers: new Set() };
          entry.tiers.add(tier);
          index.set(fn.name, entry);
        }
  return index;
})();

/** The generator behind a bank skill key, or undefined. */
export function generatorForSkill(skillKey) {
  return NAMED[skillKey] || NAMED[`${skillKey}G`]
    || (GENERATOR_INDEX.get(skillKey) || GENERATOR_INDEX.get(`${skillKey}G`))?.fn;
}

/** Does this skill have a working generator? The bank's `gaps` lists are the ones that don't. */
export function hasGenerator(skillKey) {
  return !!generatorForSkill(skillKey);
}

/** What the engine can serve, for the inventory's gap tracking. */
export function skillCoverage(skillKeys = []) {
  const covered = skillKeys.filter(hasGenerator);
  return { total: skillKeys.length, covered: covered.length, missing: skillKeys.filter(k => !hasGenerator(k)) };
}

/**
 * Problems for one named skill — what a lesson's guided, mixed and prove-it moves draw
 * from. Returns fewer than `count` only if the generator keeps failing to produce a
 * usable set, and an empty array when the skill has no generator at all (a bank gap,
 * which the sequence skips rather than blocking on).
 *
 * @param {string} skillKey  a key from units.js
 * @param {1|2|3} [tier]     recorded on the problem; generators vary by their own difficulty
 * @param {{count?: number, ctx?: object}} [opts]  ctx.biz feeds the world generators
 */
export function problemsForSkill(skillKey, tier = 1, { count = 1, ctx } = {}) {
  const fn = generatorForSkill(skillKey);
  if (!fn) return [];
  const out = [];
  for (let tries = 0; out.length < count && tries < count * 10; tries++) {
    try {
      const p = fn(ctx);
      p.source = sourceFor(fn.name);
      p.skillKey = skillKey;
      const assembled = assembleProblem(p, tier);
      if (assembled) out.push(assembled);
    } catch { /* regenerate */ }
  }
  return out;
}
