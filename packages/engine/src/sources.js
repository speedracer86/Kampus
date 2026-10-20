/* The three-source rule — KAMPUS_PLAY_SYSTEM.md §2 (binding).

   Every question must come from exactly one place:

     world — generated from live state she owns: her prices, her ledger, her stock,
             today's weather. The crown jewel. These generators read `ctx.biz`.
     life  — her actual day, entered by her or a grown-up (field assignments).
     gym   — clean abstraction, taught proudly as itself. No story, no costume.

   Banned: the costume — a fictional third person with arbitrary numbers ("a store
   offers 20% off", "Maria has 30 lemons"). A costume pretends to be world and is
   really gym wearing a hat, which is exactly the train-leaving-Chicago problem.

   A generator with no entry here does not ship: sources.test.js fails on it. */

export const SOURCE = { WORLD: 'world', LIFE: 'life', GYM: 'gym' };

/**
 * Generators fed from her business state. They take `ctx` and use `ctx.biz` when it
 * is there, falling back to random values so they still work before a stand exists.
 */
export const WORLD_GENERATORS = [
  'unitRate',        // her price per cup
  'pctChange',       // her ledger, day over day
  'discountTax',     // a sale on her own menu
  'meanMedian',      // her sales across the week
  'depVar',          // cups in, money out, at her price
  'probSimple',      // today's forecast, which already drives demand
  'scaleRecipe',     // her recipe, scaled for a bigger day
  'simpleInterest',  // her bank balance
  'funcRate',        // her savings, growing per week
  'twoStepStory',    // her money, after a supply run
];

/** Everything else is gym: honest abstraction, no narrative wrapper. */
export const GYM_GENERATORS = [
  'absVal', 'addBig', 'addInt', 'addLarger', 'addSameDen', 'addUnlikeDen', 'approxRoot',
  'areaModel', 'boxAdd', 'boxMul', 'cmpFrac', 'cmpInt', 'combineLikeG', 'dec2frac',
  'decAddG', 'decCompare', 'decDiv', 'decMul', 'decNotation', 'distrib', 'divFact',
  'divFrac', 'divInt', 'divRem', 'doubleSub', 'easyPct', 'eqFrac', 'evalTwoVar', 'evalX',
  'findWhole', 'frac2dec', 'frac2pct', 'fracOfSet', 'funcEval', 'mixedImp', 'mixedInt', 'mulDigit',
  'mulFrac', 'mulInt', 'multCompare', 'multFact', 'multiStepG', 'oneStepAdd', 'oneStepMul',
  'orderOps', 'orderOpsParen', 'patternNext', 'pctOf', 'powTen', 'powersG', 'propSolve',
  'pythag', 'ratioShare', 'roundNumG', 'sciNotG', 'simplifyRatio', 'slope2G', 'sqrootG',
  'subBig', 'subFrac', 'subNeg', 'subToNeg', 'sysSolve', 'tipCalc', 'twoStep', 'twoStepNeg',
  'unitFracCmp', 'unitFracDiv', 'volumeBox',
];

/** name -> source tag. */
export const SOURCES = Object.fromEntries([
  ...WORLD_GENERATORS.map(n => [n, SOURCE.WORLD]),
  ...GYM_GENERATORS.map(n => [n, SOURCE.GYM]),
]);

/** The tag for a generator, or undefined if it was never declared (a test failure). */
export function sourceFor(name) {
  return SOURCES[name];
}

/**
 * Phrases that mark a costume. Used by the audit test to stop one being reintroduced:
 * a third-person actor doing something with numbers that are not hers.
 */
export const COSTUME_MARKERS = [
  /\b(?:a|the)\s+(?:store|shop|shopkeeper|vendor|company|team|class|teacher|farmer|baker)\b/i,
  /\b(?:Maria|Leo|Sam|Ana|Jose|Priya|Tom's friend)\b/,
  /\b\d+\s+friends?\s+(?:split|share)\b/i,
];
