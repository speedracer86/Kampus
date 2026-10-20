/* BUSINESS_TYPES — the kid picks and names her business (PLAY_SYSTEM §3).

   The type is a skin she chose over the same engine. That is the whole point: chosen
   and load-bearing is the opposite of a fake theme. So the math objectives per band
   are identical across every type — only the nouns, the recipe and the way stock
   works change. A test asserts that equality, because it is the thing that would
   quietly rot if someone added a type in a hurry.

   Three kinds of stock model:
     goods   — a recipe consumes supplies; leftovers can spoil (the lemonade case).
     service — no inventory at all; capacity is hours, and an unbooked hour is simply
               gone, so nothing can rot and nothing "dies" (the ADHD laws).
     resale  — no recipe; you buy a thing and sell it for a spread, which is where
               integer gains and losses live.
     digital — no stock and no marginal cost, so every sale is pure margin. */

export const BANDS = ['a', 'b', 'c'];

/** Per-band math objectives. Identical across types by design — see the test. */
export const BAND_OBJECTIVES = {
  a: ['count money', 'make change', 'simple totals'],
  b: ['unit cost', 'pricing', 'profit and loss'],
  c: ['percent margin', 'rates', 'break-even'],
};

export const BUSINESS_TYPES = {
  lemonade: {
    id: 'lemonade', band: 'a', kind: 'goods', label: 'Lemonade Stand',
    unit: 'cup', unitPlural: 'cups', make: 'make',
    recipe: { lemons: 1, sugar: 1, cups: 1 },
    basePrices: { lemons: 0.5, sugar: 0.3, cups: 0.2 },
    perishable: 'lemons', basePrice: 1.5,
    flavor: 'thirsty neighbours', momentSkills: ['easyPct', 'addBig', 'decAdd'],
  },
  cookie: {
    id: 'cookie', band: 'a', kind: 'goods', label: 'Cookie Stand',
    unit: 'cookie', unitPlural: 'cookies', make: 'bake',
    recipe: { dough: 1, chips: 1, bags: 1 },
    basePrices: { dough: 0.45, chips: 0.35, bags: 0.2 },
    perishable: 'dough', basePrice: 1.5,
    flavor: 'the after-school crowd', momentSkills: ['easyPct', 'addBig', 'multFact'],
  },
  sticker: {
    id: 'sticker', band: 'a', kind: 'goods', label: 'Sticker Stand',
    unit: 'sticker', unitPlural: 'stickers', make: 'print',
    recipe: { sheets: 1, ink: 1, sleeves: 1 },
    basePrices: { sheets: 0.4, ink: 0.3, sleeves: 0.15 },
    perishable: null, basePrice: 1,
    flavor: 'classmates with pocket money', momentSkills: ['easyPct', 'multFact', 'divFact'],
  },
  bake: {
    id: 'bake', band: 'b', kind: 'goods', label: 'Bake Shop',
    unit: 'loaf', unitPlural: 'loaves', make: 'bake',
    recipe: { flour: 2, butter: 1, boxes: 1 },
    basePrices: { flour: 0.6, butter: 0.8, boxes: 0.25 },
    perishable: 'flour', basePrice: 4,
    flavor: 'the weekend market', momentSkills: ['scaleRecipe', 'unitRate', 'decMul'],
  },
  craft: {
    id: 'craft', band: 'b', kind: 'goods', label: 'Craft Stand',
    unit: 'bracelet', unitPlural: 'bracelets', make: 'make',
    recipe: { beads: 6, cord: 1, tags: 1 },
    basePrices: { beads: 0.1, cord: 0.5, tags: 0.15 },
    perishable: null, basePrice: 3,
    flavor: 'friends who want one in their colours', momentSkills: ['unitRate', 'ratioShare', 'mulDigit'],
  },
  petcare: {
    id: 'petcare', band: 'b', kind: 'service', label: 'Pet-Care Crew',
    unit: 'walk', unitPlural: 'walks', make: 'book',
    // A service sells time: capacity is hours, and an unbooked hour simply passes.
    recipe: null, hoursPerDay: 4, minutesPerJob: 30,
    basePrices: { treats: 0.4, bags: 0.1 },
    perishable: null, basePrice: 8,
    flavor: 'neighbours with dogs', momentSkills: ['unitRate', 'divFact', 'twoStep'],
  },
  resale: {
    id: 'resale', band: 'c', kind: 'resale', label: 'Resale Shop',
    unit: 'card', unitPlural: 'cards', make: 'source',
    // No recipe: you buy a thing and sell it on. The spread is the lesson.
    recipe: null, spread: true,
    basePrices: { stock: 4 },
    perishable: null, basePrice: 7,
    flavor: 'collectors who know the going rate', momentSkills: ['pctChange', 'addInt', 'subNeg'],
  },
  digital: {
    id: 'digital', band: 'c', kind: 'digital', label: 'Digital Shop',
    unit: 'design', unitPlural: 'designs', make: 'draw',
    // Zero marginal cost: pure margin math, nothing to stock and nothing to lose.
    recipe: null, zeroMarginalCost: true,
    basePrices: {},
    perishable: null, basePrice: 3,
    flavor: 'people who want it on a phone case', momentSkills: ['pctOf', 'pctChange', 'findWhole'],
  },
};

/** Types a band may choose. Earlier bands' types stay available (§3). */
export function typesForBand(band) {
  const order = { a: ['a'], b: ['a', 'b'], c: ['a', 'b', 'c'] };
  const allowed = new Set(order[band] || ['a']);
  return Object.values(BUSINESS_TYPES).filter(t => allowed.has(t.band));
}

export const typeById = (id) => BUSINESS_TYPES[id] || BUSINESS_TYPES.lemonade;

/** Objectives this type must teach at this band — identical across types by design. */
export const objectivesFor = (band) => BAND_OBJECTIVES[band] || BAND_OBJECTIVES.a;

/** A default name so a business is never nameless before onboarding exists. */
export const defaultName = (type, kidName) =>
  kidName ? `${kidName}’s ${type.label.split(' ')[0]}` : type.label;
