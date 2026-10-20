/* Total answer verification: EVERY authored answer in the bank — all snags, all
   teach-panel yourTurns — is re-derived here by independent computation, never
   by comparing the author's string to itself. Fractions are re-computed and
   reduced, ratios re-simplified by GCD, symbolic answers checked by evaluating
   both forms at sample points. A completeness assertion guarantees no authored
   answer ships unverified. */
import { describe, it, expect } from 'vitest';
import { YEAR, GRADES } from '../src/units.js';
import { SNAGS, snagFor } from '../src/snags.js';
import { TEACH } from '../src/teach.js';

// ---------- independent math helpers ----------
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const frac = (n, d) => { const g = gcd(Math.abs(n), Math.abs(d)); return `${n / g}/${d / g}`; };
const addF = (a, b, c, d) => frac(a * d + c * b, b * d);
const subF = (a, b, c, d) => frac(a * d - c * b, b * d);
const mulF = (a, b, c, d) => frac(a * c, b * d);
const num = s => parseFloat(String(s).replace(/[^\d.−-]/g, '').replace('−', '-'));
const ratio = (a, b) => { const g = gcd(a, b); return `${a / g}:${b / g}`; };
// symbolic check: both expressions agree at sample points (x/y as the letter)
const sameExpr = (got, expected, letter = 'x') => [2, 7].every(v => {
  const f = s => Function(letter, `return ${String(s).replace(/(\d)\s*([a-z])/g, '$1*$2').replace(/−/g, '-')}`)(v);
  return Math.abs(f(got) - f(expected)) < 1e-9;
});

// ---------- every snag answer, re-derived ----------
const SNAG_VERIFY = {
  '3-1': a => num(a) === 3 * 4,
  '3-2': a => num(a) === 6 * 5,
  '3-3': a => num(a) === 148 + 236,
  '3-4': a => num(a) === 7 * 8,
  '3-5': a => num(a) === 8 / 2,
  '3-6': a => num(a) === 4 * 6,
  '3-7': a => num(a) === 100 - 75,
  '3-8': a => num(a) === 3 * 6 + 2,
  '4-1': a => num(a) === 1286 + 905,
  '4-2': a => num(a) === 24 * 12,
  '4-3': a => num(a) === 15 * 36,
  '4-4': a => 2 / 4 === 1 / 2 && /^no/i.test(a),          // they are equal
  '4-5': a => num(a) === 12 * 3 / 4,
  '4-6': a => Math.abs(num(a) - 6 * 0.10) < 1e-9,
  '4-7': a => num(a) === 3 * 7,
  '4-8': a => num(a) === 16 * 3 / 4,
  '5-1': a => num(a) === 23.0 / 10,
  '5-2': a => num(a) === 40 * 0.35,
  '5-3': a => a === addF(1, 2, 1, 3),                      // 5/6
  '5-4': a => num(a) === 2 * (20 / 8),
  '5-5': a => (25 * 25 * 24 > 30 * 20 * 20) && /25/.test(a),
  '5-6': a => num(a) === 3 + 4 * 5,
  '5-7': a => num(a) === 4.5 + 6 + 5.25,
  '6-1': a => (3.44 / 8 < 5.40 / 12) && /8/.test(a) && /43/.test(a) && /45/.test(a),
  '6-2': a => num(a) === 2.00 * (1 - 0.25),
  '6-3': a => num(a) === 3.5 / 0.25,
  '6-4': a => num(a) === 8 - 3,
  '6-5': a => num(a) === (29 - 5) / 2,
  '6-6': a => num(a) === 3 * 4 - 2 * 2,
  '6-7': a => num(a) === [4, 6, 5, 40, 5].sort((x, y) => x - y)[2],
  '7-1': a => num(a) === (3 / 2) * 8,
  '7-2': a => num(a) === 12 - 5 + 8 - 9 - 3,
  '7-3': a => num(a) === 4 * (2.50 + 1.75),
  '7-4': a => Math.abs(num(a) - 2.50 * 0.8 * 1.1) < 1e-9,
  '7-5': a => num(a) === (5 + 5 + 4 + 5 + 1) / 5,
  '7-6': a => num(a) === (3 / 10) * 100,
  '7-7': a => Math.abs(num(a) - 12 * 0.15) < 1e-9,
  '8-1': a => { const m = a.match(/([\d.]+)\s*×\s*10\^?(\d+)/); return m && parseFloat(m[1]) * 10 ** +m[2] === 1200000; },
  '8-2': a => num(a) === (45 - 12) / 3,
  '8-3': a => num(a) === (30 - 20) / (1.00 - 1.50),
  '8-4': a => num(a) === 30 / (2 - 0.5),
  '8-5': a => num(a) === 40 - 10 * 2.5,
  '8-6': a => num(a) === Math.hypot(6, 8),
  '8-7': a => num(a) === (18 + 22 + 26) / 3,
  '8-8': a => num(a) === 27 / 3,                           // 5x−7=2x+20 → 3x=27
};

// ---------- every teach-panel yourTurn answer, re-derived ----------
const TEACH_VERIFY = {
  multFact: a => num(a) === 8 * 6,
  divFact: a => num(a) === 54 / 9,
  boxMul: a => num(a) === 36 / 4,
  boxAdd: a => num(a) === 15 - 8,
  addBig: a => num(a) === 257 + 168,
  subBig: a => num(a) === 523 - 247,
  roundNum: a => num(a.replace(',', '')) === Math.round(3482 / 100) * 100,
  twoStepStory: a => num(a) === 4 * 6 - 9,
  patternNext: a => num(a) === 17 + (12 - 7),
  mulDigit: a => num(a) === 31 * 14,
  divRem: a => { const m = a.match(/^(\d+)\s*r\s*(\d+)$/); return m && +m[1] === Math.floor(38 / 5) && +m[2] === 38 % 5; },
  multCompare: a => num(a) === 4 * 6,
  fracOfSet: a => num(a) === 18 * 2 / 3,
  unitFracCmp: a => (1 / 4 > 1 / 6) && a.trim() === '1/4',
  eqFrac: a => num(a) === (2 * 12) / 3,
  cmpFrac: a => (3 / 4 > 2 / 3) && a.trim() === '3/4',
  addSameDen: a => a === frac(3 + 4, 10),
  mixedImp: a => { const m = a.match(/(\d+)\s+(\d+)\/(\d+)/); return m && +m[1] + m[2] / m[3] === 9 / 4; },
  addUnlikeDen: a => a === addF(1, 4, 1, 3),
  subFrac: a => a === subF(5, 6, 1, 2),
  mulFrac: a => a === mulF(1, 2, 4, 5),
  unitFracDiv: a => num(a) === 2 * 3,
  divFrac: a => num(a) === 2 / (2 / 3),
  decNotation: a => num(a) === 3 * 0.01,
  decCompare: a => (0.4 > 0.35) && num(a) === 0.4,
  frac2dec: a => num(a) === 1 / 5,
  dec2frac: a => a === frac(6, 10),
  decAdd: a => num(a) === 3.80 + 2.45,
  decMul: a => num(a) === 0.25 * 12,
  decDiv: a => num(a) === 4.5 / 0.5,
  powTen: a => num(a) === 4.7 * 100,
  unitRate: a => Math.abs(num(a) - (3.60 / 8) * 100) < 1e-9,   // 45¢
  simplifyRatio: a => a === ratio(10, 15),
  ratioShare: a => { const parts = 24 / (1 + 2); return a.includes(String(parts)) && a.includes(String(parts * 2)); },
  easyPct: a => Math.abs(num(a) - 38 * 0.10) < 1e-9,
  pctOf: a => num(a) === 60 * 0.30,
  findWhole: a => num(a) === 12 / 0.25,
  frac2pct: a => num(a) === (2 / 5) * 100,
  scaleRecipe: a => num(a) === 3 * (10 / 6),
  propSolve: a => num(a) === (2 / 5) * 20,
  pctChange: a => num(a) === ((26 - 20) / 20) * 100,
  tipCalc: a => num(a) === 35 * 0.20,
  discountTax: a => Math.abs(num(a) - 40 * 0.9 * 1.05) < 1e-9,
  simpleInterest: a => num(a) === 100 * 0.04 * 3,
  addInt: a => num(a) === -4 + 9,
  cmpInt: a => (-3 > -8) && num(a) === -3,
  absVal: a => num(a) === Math.abs(-15),
  subToNeg: a => num(a) === 2 - 9,
  subNeg: a => num(a) === 4 - (-6),
  mulInt: a => num(a) === -5 * 6,
  divInt: a => num(a) === -36 / -9,
  mixedInt: a => num(a) === -5 + 12 - 4,
  doubleSub: a => num(a) === 3 - 8 - 2,
  addLarger: a => num(a) === -20 + 13,
  orderOps: a => num(a) === 20 - 2 * 6,
  orderOpsParen: a => num(a) === 2 * (8 - 3),
  evalX: a => num(a) === 5 * 6 - 3,
  evalTwoVar: a => num(a) === 2 * 4 + 3 * 1,
  oneStepAdd: a => num(a) === 14 - 9,
  oneStepMul: a => num(a) === 42 / 6,
  twoStep: a => num(a) === (19 - 4) / 3,
  twoStepNeg: a => num(a) === (20 - 5) / -3,
  distrib: a => sameExpr(a, '3*(x + 5)'),
  combineLike: a => sameExpr(a, '7*y + 4 - 2*y', 'y'),
  multiStep: a => num(a) === (11 - 3) / 2,                  // 4x+3=2x+11 → 2x=8
  depVar: a => num(a) === 2 * 7,
  meanMedian: a => num(a) === [3, 9, 7].sort((x, y) => x - y)[1],
  probSimple: a => num(a) === (2 / 8) * 100,
  powers: a => num(a) === 3 ** 3,
  sqroot: a => num(a) === Math.sqrt(64),
  sciNot: a => { const m = a.match(/([\d.]+)\s*×\s*10\^?(\d+)/); return m && parseFloat(m[1]) * 10 ** +m[2] === 45000; },
  slope2: a => num(a) === (11 - 3) / (4 - 2),
  funcEval: a => num(a) === 3 * 5 - 4,
  funcRate: a => num(a) === 5,
  sysSolve: a => num(a) === 3,                              // x+3=2x → x=3
  pythag: a => num(a) === Math.hypot(5, 12),
  approxRoot: a => Math.floor(Math.sqrt(30)) === 5 && /5/.test(a) && /6/.test(a),
  areaModel: a => num(a) === 3 * 9,
  volumeBox: a => num(a) === 5 * 4 * 3,
};

describe('total answer verification', () => {
  it('covers every snag — none ships unverified', () => {
    for (const s of SNAGS) expect(SNAG_VERIFY[s.unit], `verifier for ${s.unit}`).toBeDefined();
    expect(Object.keys(SNAG_VERIFY).length).toBe(SNAGS.length);
  });

  it('every snag answer re-derives correctly', () => {
    for (const s of SNAGS) {
      expect(SNAG_VERIFY[s.unit](String(s.ans)), `${s.unit}: "${s.ans}"`).toBe(true);
    }
  });

  it('covers every teach panel used by any unit — none ships unverified', () => {
    const used = new Set(GRADES.flatMap(g => YEAR[g].flatMap(u => u.skills)));
    for (const key of used) expect(TEACH_VERIFY[key], `verifier for ${key}`).toBeDefined();
  });

  it('every teach-panel answer re-derives correctly', () => {
    for (const [key, check] of Object.entries(TEACH_VERIFY)) {
      expect(TEACH[key], `panel ${key}`).toBeDefined();
      expect(check(String(TEACH[key].yourTurn.a)), `${key}: "${TEACH[key].yourTurn.a}"`).toBe(true);
    }
  });
});
