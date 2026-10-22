/* The bank's unit `world` field -> an internal topic code.

   The bank names a world on every unit, and it predates the world rename. Fourteen
   of the 45 units still carry a name the current table does not contain:

     Number Mine · Decimal Depths · Frozen Obby · Power Plant · Slope City · The Stand

   The seam looked those up by name and fell through to a `frac` default, which is
   not a cosmetic problem: the lesson runner keys the adaptive tier on the world it
   resolves, so 236 of 768 lesson days were reading and writing the FRACTIONS tier
   regardless of what they were teaching. A kid's grade-8 exponents difficulty was
   being stored as her fractions difficulty.

   The mapping is not a guess. It is read off the per-grade world map the engine
   shipped before the rename, where each of these names sat in a known topic slot.

   The bank is owner-authored — verify, never re-author — so the names stay as
   written and the reconciliation lives here. */

/** Retired and bank-local world names -> the topic they always meant. */
export const UNIT_WORLD_ALIAS = {
  // whole-number and decimal arithmetic: the `int` slot in every grade that had it
  'Number Mine': 'int',
  'Decimal Depths': 'int',
  'Frozen Obby': 'int',
  'Power Plant': 'int',
  // grade 8's `ratio` slot
  'Slope City': 'ratio',
  // the business units: money and rates, which is what The Market is
  'The Stand': 'ratio',
  // pre-rename `alg`
  'Puzzle Lab': 'alg',
  // the current table, so one function answers for every unit in the bank
  'The Kitchen': 'frac',
  'The Market': 'ratio',
  'Outside': 'int',
  'The Workshop': 'alg',
};

/**
 * The topic a unit teaches in, or null when the unit is deliberately mixed
 * (`world: 'all'`) and no single world is the honest answer.
 */
export function unitTopic(unitWorld) {
  if (!unitWorld || unitWorld === 'all') return null;
  return UNIT_WORLD_ALIAS[unitWorld] || null;
}
