/* Common Core mapping for every generator in @kampus/engine.
   Codes follow CCSS.Math.Content notation (e.g. 6.RP.A.3c). `primary` is the
   standard the generator most directly practices; `also` lists standards it
   meaningfully supports at other grades (many generators serve several grades
   at different tiers — that reuse is intentional, mirroring how the curriculum
   spirals). Coverage gaps to build next live in docs/KAMPUS_CURRICULUM_PLAN.md. */

export const SKILLS = {
  // ---- fractions & decimals ----
  eqFrac: { label: 'Equivalent fractions', primary: '4.NF.A.1', also: ['3.NF.A.3b'] },
  cmpFrac: { label: 'Comparing fractions', primary: '4.NF.A.2', also: ['3.NF.A.3d'] },
  addSameDen: { label: 'Adding fractions, same denominator', primary: '4.NF.B.3a' },
  addUnlikeDen: { label: 'Adding fractions, unlike denominators', primary: '5.NF.A.1' },
  subFrac: { label: 'Subtracting fractions', primary: '5.NF.A.1' },
  frac2dec: { label: 'Fraction → decimal', primary: '4.NF.C.6', also: ['7.NS.A.2d'] },
  dec2frac: { label: 'Decimal → fraction', primary: '4.NF.C.6' },
  mulFrac: { label: 'Multiplying fractions', primary: '5.NF.B.4' },
  divFrac: { label: 'Dividing fractions', primary: '6.NS.A.1' },
  decMul: { label: 'Multiplying decimals', primary: '5.NBT.B.7' },
  frac2pct: { label: 'Fraction → percent', primary: '6.RP.A.3c' },
  unitFracCmp: { label: 'Comparing unit fractions', primary: '3.NF.A.3d' },
  fracOfSet: { label: 'Fraction of a set', primary: '3.NF.A.1', also: ['5.NF.B.4a'] },
  mixedImp: { label: 'Mixed ↔ improper fractions', primary: '4.NF.B.3b' },
  decAdd: { label: 'Adding decimals', primary: '5.NBT.B.7' },

  // ---- ratios, rates & percents ----
  unitRate: { label: 'Unit rates', primary: '6.RP.A.2' },
  simplifyRatio: { label: 'Simplifying ratios', primary: '6.RP.A.1' },
  easyPct: { label: 'Benchmark percents', primary: '6.RP.A.3c' },
  pctOf: { label: 'Percent of a number', primary: '6.RP.A.3c' },
  propSolve: { label: 'Solving proportions', primary: '7.RP.A.2c' },
  ratioShare: { label: 'Sharing in a ratio', primary: '6.RP.A.3' },
  pctChange: { label: 'Percent change', primary: '7.RP.A.3' },
  findWhole: { label: 'Finding the whole from a percent', primary: '7.RP.A.3', also: ['6.RP.A.3c'] },
  scaleRecipe: { label: 'Scaling recipes', primary: '6.RP.A.3', also: ['5.NF.B.5'] },

  // ---- integers & the number system ----
  addInt: { label: 'Adding integers', primary: '7.NS.A.1b', also: ['6.NS.C.5'] },
  subToNeg: { label: 'Subtracting below zero', primary: '7.NS.A.1c', also: ['6.NS.C.5'] },
  cmpInt: { label: 'Comparing integers', primary: '6.NS.C.7' },
  absVal: { label: 'Absolute value', primary: '6.NS.C.7c' },
  subNeg: { label: 'Subtracting negatives', primary: '7.NS.A.1c' },
  mulInt: { label: 'Multiplying integers', primary: '7.NS.A.2a' },
  addLarger: { label: 'Adding with larger negatives', primary: '7.NS.A.1' },
  divInt: { label: 'Dividing integers', primary: '7.NS.A.2b' },
  mixedInt: { label: 'Mixed integer operations', primary: '7.NS.A.3' },
  doubleSub: { label: 'Chained subtraction with negatives', primary: '7.NS.A.1c' },

  // ---- expressions & equations ----
  orderOps: { label: 'Order of operations', primary: '6.EE.A.2c', also: ['5.OA.A.1'] },
  orderOpsParen: { label: 'Order of operations with parentheses', primary: '5.OA.A.1' },
  evalX: { label: 'Evaluating expressions', primary: '6.EE.A.2c' },
  evalTwoVar: { label: 'Evaluating two-variable expressions', primary: '6.EE.A.2c' },
  oneStepAdd: { label: 'One-step equations (+/−)', primary: '6.EE.B.7' },
  oneStepMul: { label: 'One-step equations (×/÷)', primary: '6.EE.B.7' },
  twoStep: { label: 'Two-step equations', primary: '7.EE.B.4a' },
  twoStepNeg: { label: 'Two-step equations with negatives', primary: '7.EE.B.4a' },
  distrib: { label: 'Distributive property', primary: '7.EE.A.1', also: ['6.EE.A.3'] },
  combineLike: { label: 'Combining like terms', primary: '7.EE.A.1', also: ['6.EE.A.3'] },
  multiStep: { label: 'Multi-step equations', primary: '8.EE.C.7b' },

  // ---- elementary operations & place value ----
  addBig: { label: 'Multi-digit addition', primary: '3.NBT.A.2', also: ['4.NBT.B.4'] },
  subBig: { label: 'Multi-digit subtraction', primary: '3.NBT.A.2', also: ['4.NBT.B.4'] },
  multFact: { label: 'Multiplication facts', primary: '3.OA.C.7' },
  divFact: { label: 'Division facts', primary: '3.OA.C.7' },
  mulDigit: { label: 'Multi-digit multiplication', primary: '4.NBT.B.5' },
  divRem: { label: 'Division with remainders', primary: '4.NBT.B.6' },
  roundNum: { label: 'Rounding', primary: '4.NBT.A.3' },
  boxAdd: { label: 'Missing addend puzzles', primary: '3.OA.A.4' },
  boxMul: { label: 'Missing factor puzzles', primary: '3.OA.A.4' },
  patternNext: { label: 'Number patterns', primary: '4.OA.C.5', also: ['3.OA.D.9'] },

  // ---- grade 8 ----
  powers: { label: 'Exponents', primary: '8.EE.A.1' },
  sqroot: { label: 'Square roots', primary: '8.EE.A.2' },
  sciNot: { label: 'Scientific notation', primary: '8.EE.A.3' },
  slope2: { label: 'Slope from two points', primary: '8.EE.B.6' },
};

/* The major work of each grade (Achieve the Core "Where to Focus" cluster codes).
   Used by coverage reporting: a grade is well-served when most of its practice
   time lands inside these clusters. */
export const MAJOR_WORK = {
  3: ['3.OA.A', '3.OA.B', '3.OA.C', '3.OA.D', '3.NBT.A', '3.NF.A'],
  4: ['4.OA.A', '4.NBT.A', '4.NBT.B', '4.NF.A', '4.NF.B', '4.NF.C'],
  5: ['5.NBT.A', '5.NBT.B', '5.NF.A', '5.NF.B', '5.MD.C'],
  6: ['6.RP.A', '6.NS.A', '6.NS.C', '6.EE.A', '6.EE.B', '6.EE.C'],
  7: ['7.RP.A', '7.NS.A', '7.EE.A', '7.EE.B'],
  8: ['8.NS.A', '8.EE.A', '8.EE.B', '8.EE.C', '8.F.A', '8.F.B'],
};

const cluster = code => code.split('.').slice(0, 3).join('.');

/** All CCSS codes a skill touches. */
export const codesFor = key => {
  const s = SKILLS[key];
  return s ? [s.primary, ...(s.also || [])] : [];
};

/**
 * Which of a grade's major-work clusters are covered by a set of skill keys —
 * the basis of the parent-facing standards report and our own gap tracking.
 * @returns {{covered: string[], missing: string[]}}
 */
export function majorWorkCoverage(grade, skillKeys) {
  const touched = new Set(skillKeys.flatMap(codesFor).map(cluster));
  const covered = [], missing = [];
  for (const c of MAJOR_WORK[grade]) (touched.has(c) ? covered : missing).push(c);
  return { covered, missing };
}
