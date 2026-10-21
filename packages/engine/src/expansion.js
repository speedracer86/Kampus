/* Phase 1 curriculum expansion: the generators that close every remaining
   major-work gap in grades 3-8 (see docs/KAMPUS_CURRICULUM_PLAN.md §2 and the
   coverage tests in @kampus/curriculum). Unlike the v1 extract, these are born
   contextual — real-world framing is the default presentation, per the
   engagement plan. Teach steps state the strategy first, then execute it.
   Importing this module registers everything into CURRICULUM (see bottom). */
import { ri, pick, shuffle, gcd, frH, sfrH, fmt, Q } from './util.js';
import { CURRICULUM } from './curriculum.js';

const money = x => '$' + (Math.round(x * 100) / 100).toFixed(2);
const NAMES = ['Maya', 'Leo', 'Zoe', 'Kai', 'Ava', 'Theo', 'Mia', 'Eli'];

/* ---------- grade 3 ---------- */

export function areaModel() {
  const r = ri(3, 9), c = ri(3, 9);
  const wrongs = [r + c, r * (c + 1), r * c + r].filter(x => x !== r * c);
  return Q('Rows × columns', `${r} rows of ${c}. How many in all?`,
    r * c, wrongs, 'Area as multiplication', [
      `Rows of equal groups — that's multiplication, not adding.`,
      `${r} rows × ${c} in each row = ${r} × ${c}.`,
      `${r} × ${c} = <b>${r * c}</b> brownies. A rectangle's area works the same way.`]);
}

export function twoStepStory(ctx) {
  let start, n, price, left;
  do {
    start = pick([15, 20, 25, 30, 40]); n = ri(2, 4); price = ri(2, 6);
    left = start - n * price;
  } while (left <= 0 || left === start - price || left === n * price);
  // world: her own bank, after a supply run (PLAY_SYSTEM §2).
  // Distractors are the two classic wrong moves (forgot to multiply, answered the
  // spend instead of the change) plus a near miss, de-duplicated so three always survive.
  const wrongs = [...new Set([start - price, n * price, left + price, left + n])]
    .filter(w => w !== left).slice(0, 3);
  return Q('Two steps', `Your bank has $${start}. You buy ${n} supplies at $${price} each. How much is left?`,
    left, wrongs, 'Two-step word problems', [
      `Two steps: first find the total spent, then subtract it from what you had.`,
      `Spent: ${n} × $${price} = $${n * price}.`,
      `Left: $${start} − $${n * price} = <b>$${left}</b>.`]);
}

/* ---------- grade 4 ---------- */

export function decNotation() {
  if (Math.random() < 0.5) {
    const d = ri(1, 9), p = ri(1, 9);
    const val = (d * 10 + p) / 100;
    const rev = (p * 10 + d) / 100;
    const wrongs = [fmt(rev), fmt(val * 10), fmt(val / 10)].filter(w => parseFloat(w) !== val);
    return Q('Money as decimals', `${d} dimes and ${p} pennies — what part of a dollar?`,
      fmt(val), wrongs, 'Decimal notation', [
        `Dimes are tenths of a dollar, pennies are hundredths.`,
        `${d} dimes = 0.${d}0 and ${p} pennies = 0.0${p}.`,
        `Together: <b>${fmt(val)}</b> of a dollar.`]);
  }
  const n = ri(1, 9) * 10 + ri(1, 9);
  const val = n / 100;
  return Q('Fraction → decimal', `Write ${frH(n, 100)} as a decimal.`,
    fmt(val), [fmt(n / 10), fmt(n / 1000), String(n)], 'Decimal notation', [
      `Hundredths means two decimal places.`,
      `${n} hundredths = <b>${fmt(val)}</b>.`]);
}

export function decCompare() {
  const d1 = ri(3, 9);
  let d2, e2;
  do { d2 = ri(1, 9); e2 = ri(1, 9); } while (d2 >= d1);
  const a = d1 / 10, b = (d2 * 10 + e2) / 100;   // 0.4 vs 0.35 — "longer is bigger" trap
  return Q('Which is more?', `${fmt(a)} or ${fmt(b)} — which is more?`,
    fmt(a), [fmt(b), "they're equal"], 'Comparing decimals', [
      `More digits doesn't mean bigger — line up the place values.`,
      `${fmt(a)} is ${d1} tenths = ${d1}0 hundredths. ${fmt(b)} is ${d2 * 10 + e2} hundredths.`,
      `${d1}0 > ${d2 * 10 + e2}, so <b>${fmt(a)}</b> is more.`]);
}

export function multCompare() {
  const k = ri(2, 6), base = ri(12, 40), who = pick(NAMES);
  const ans = base * k;
  const wrongs = [base + k, base * (k + 1), base * (k - 1)].filter(x => x !== ans && x > 0);
  return Q('Times as many', `${k} times as many as ${base} is?`,
    ans, wrongs, 'Multiplicative comparison', [
      `"${k} times as many" means multiply — not add ${k}.`,
      `${base} × ${k} = <b>${ans}</b>.`]);
}

/* ---------- grade 5 ---------- */

export function powTen() {
  const a = ri(11, 89) / 10;
  const mul = Math.random() < 0.6;
  // dividing stays ≥ hundredths so every value survives fmt()'s 3-decimal rounding
  const k = mul ? pick([10, 100, 1000]) : pick([10, 100]);
  const ans = mul ? a * k : a / k;
  const places = String(k).length - 1;
  const wrongs = [mul ? a * k / 10 : a / k * 10, mul ? a / k : a * k, a]
    .map(fmt).filter(w => parseFloat(w) !== ans);
  return Q('Slide the decimal', `${fmt(a)} ${mul ? '×' : '÷'} ${k}`,
    fmt(ans), wrongs, 'Powers of ten', [
      `${mul ? 'Multiplying' : 'Dividing'} by ${k} slides the decimal ${places} place${places > 1 ? 's' : ''} ${mul ? 'right' : 'left'}.`,
      `${fmt(a)} → <b>${fmt(ans)}</b>. No other digits change.`]);
}

export function decDiv() {
  const n = pick([2, 3, 4, 5]);
  const q = ri(1, 4) + pick([0.25, 0.5, 0.75]);
  const total = Math.round(n * q * 100) / 100;
  const wrongs = [q + 0.25, q - 0.25, q * 10].map(money).filter(w => w !== money(q));
  return Q('Split it evenly', `${money(total)} split ${n} ways. Each share?`,
    money(q), wrongs, 'Dividing decimals', [
      `Splitting evenly is division: ${money(total)} ÷ ${n}.`,
      `Think in cents if it helps: ${Math.round(total * 100)} ÷ ${n} = ${Math.round(q * 100)} cents.`,
      `Each pays <b>${money(q)}</b>.`]);
}

export function unitFracDiv() {
  if (Math.random() < 0.5) {
    const b = pick([2, 3, 4]), n = pick([2, 3, 4]);
    const ans = sfrH(1, b * n);
    const wrongs = [...new Set([frH(1, b + n), frH(n, b), frH(1, b)])].filter(w => w !== ans);
    return Q('Share a piece', `${frH(1, b)} shared ${n} ways. How much each?`,
      ans, wrongs, 'Dividing unit fractions', [
        `Cutting ${frH(1, b)} into ${n} equal shares makes the pieces ${n} times smaller.`,
        `${frH(1, b)} ÷ ${n} = ${frH(1, b)} × ${frH(1, n)}.`,
        `Multiply the bottoms: <b>${ans}</b> of the pan each.`]);
  }
  const b = pick([2, 3, 4]), c = ri(2, 6);
  const ans = c * b;
  const wrongs = [...new Set([c + b, c, ans + b])].filter(x => x !== ans);
  return Q('How many scoops?', `${c} cups of flour, using a ${frH(1, b)}-cup scoop. How many scoops?`,
    ans, wrongs, 'Dividing by unit fractions', [
      `Each cup holds ${b} scoops of size ${frH(1, b)}.`,
      `${c} cups × ${b} scoops per cup = <b>${ans}</b> scoops.`]);
}

export function volumeBox() {
  const l = ri(2, 6), w = ri(2, 5), h = ri(2, 4);
  const ans = l * w * h;
  const wrongs = [l * w, l + w + h, l * w * (h + 1)].filter(x => x !== ans);
  return Q('Fill the box', `${l} × ${w} × ${h}. How many unit cubes fit?`,
    ans, wrongs, 'Volume', [
      `Build it in layers: how many cubes cover the bottom, times how many layers.`,
      `Bottom layer: ${l} × ${w} = ${l * w} cubes.`,
      `${h} layers: ${l * w} × ${h} = <b>${ans}</b> cubes. That's volume = l × w × h.`]);
}

/* ---------- grade 6 ---------- */

export function meanMedian(ctx) {
  // world: her own week of sales when the stand has a history
  const m = ctx?.biz?.meanCups || ri(8, 20);
  const deltas = shuffle([-3, -1, 0, 1, 3]);
  const days = deltas.map(d => m + d);
  const sorted = [...days].sort((a, b) => a - b);
  const median = sorted[2];
  if (Math.random() < 0.6) {
    const wrongs = [median !== m ? median : m + 2, m + 1, m - 1].filter(x => x !== m);
    return Q('Your stand, your data', `Your stand sold ${days.join(', ')} cups over 5 days. What's the mean (average) per day?`,
      m, wrongs, 'Mean', [
        `Mean = total ÷ number of days.`,
        `Total: ${days.join(' + ')} = ${m * 5}.`,
        `${m * 5} ÷ 5 = <b>${m}</b> cups a day.`]);
  }
  const wrongs = [m !== median ? m : median + 2, sorted[1], sorted[3]].filter(x => x !== median);
  return Q('Your stand, your data', `Sales this week: ${days.join(', ')} cups. What's the median?`,
    median, [...new Set(wrongs)], 'Median', [
      `Median = the middle value once the list is in order.`,
      `In order: ${sorted.join(', ')}.`,
      `The middle (3rd of 5) is <b>${median}</b>.`]);
}

export function depVar(ctx) {
  const p = ctx?.biz?.pricePerCup ? Math.max(2, Math.round(ctx.biz.pricePerCup)) : ri(2, 5);
  const c = ri(4, 9);
  const ans = p * c;
  const wrongs = [p + c, p * (c + 1), c].filter(x => x !== ans);
  return Q('Cups in, money out', `At your stand, money made is m = ${p}c for c cups sold. You sell ${c} cups — what's m?`,
    ans, wrongs, 'Dependent variables', [
      `c (cups) is the independent variable — m (money) depends on it.`,
      `Substitute c = ${c}: m = ${p} × ${c}.`,
      `m = <b>${ans}</b> dollars.`]);
}

/* ---------- grade 7 ---------- */

export function tipCalc(ctx) {
  const bill = pick([20, 25, 30, 40, 50, 60, 80]);
  const pct = pick([10, 15, 20]);
  const tip = bill * pct / 100;
  const askTotal = Math.random() < 0.4;
  const ans = askTotal ? bill + tip : tip;
  const wrongs = (askTotal ? [tip, bill + pct, bill + tip * 2] : [bill + tip, pct, tip * 2])
    .map(money).filter(w => w !== money(ans));
  const steps = [
    `Find 10% first — slide the decimal: 10% of $${bill} is ${money(bill / 10)}.`,
    pct === 10 ? `So the tip is <b>${money(tip)}</b>.`
      : pct === 15 ? `15% = 10% + half of 10%: ${money(bill / 10)} + ${money(bill / 20)} = <b>${money(tip)}</b>.`
        : `20% is double 10%: 2 × ${money(bill / 10)} = <b>${money(tip)}</b>.`,
  ];
  if (askTotal) steps.push(`Total = bill + tip: ${money(bill)} + ${money(tip)} = <b>${money(bill + tip)}</b>.`);
  return Q(askTotal ? 'Bill plus tip' : 'Figure the tip',
    `A big order came to ${money(bill)}. ${askTotal ? `They tipped ${pct}% — what's the total?` : `What's a ${pct}% tip on it?`}`,
    money(ans), wrongs, 'Tips and totals', steps);
}

export function discountTax(ctx) {
  const price = pick([40, 60, 80, 120, 200]);
  const off = pick([10, 20, 25, 50]);
  const discount = price * off / 100;
  const sale = price - discount;
  const wrongs = [discount, price - off, price + discount].map(money).filter(w => w !== money(sale));
  return Q('Sale price', `Sneakers are ${money(price)} at ${off}% off. What do you pay?`,
    money(sale), wrongs, 'Discounts', [
      `Two steps: find the discount, then take it off the price.`,
      off === 50 ? `50% off means half off: the discount is ${money(discount)}.`
        : off === 25 ? `25% is a quarter: ${money(price)} ÷ 4 = ${money(discount)} off.`
          : `${off}% of ${money(price)} = ${money(discount)} off.`,
      `${money(price)} − ${money(discount)} = <b>${money(sale)}</b>.`]);
}

export function simpleInterest(ctx) {
  const p = pick([100, 200, 300, 400, 500]);
  const r = pick([2, 5, 10]);
  const y = ri(1, 3);
  const ans = p * r / 100 * y;
  const wrongs = [p * r / 100, p * r * y, ans * 2].filter(x => x !== ans);
  return Q('Money that grows', `You save ${money(p)} at ${r}% interest a year. How much interest after ${y} year${y > 1 ? 's' : ''}?`,
    money(ans), [...new Set(wrongs)].map(money), 'Simple interest', [
      `Interest each year = ${r}% of what you put in.`,
      `${r}% of ${money(p)} = ${money(p * r / 100)} per year.`,
      y > 1 ? `${y} years: ${money(p * r / 100)} × ${y} = <b>${money(ans)}</b>.` : `After 1 year: <b>${money(ans)}</b>.`]);
}

export function probSimple(ctx) {
  if (Math.random() < 0.5) {
    const p = pick([10, 20, 25, 30, 50]);
    const n = p === 25 ? 20 : pick([10, 20]);   // keep the expected count whole
    const ans = p * n / 100;
    const wrongs = [...new Set([p, n - ans, ans + 2].filter(x => x !== ans && x > 0))];
    return Q('Play the odds', `The forecast says ${p}% chance of rain each day. Out of ${n} days, about how many rainy days?`,
      ans, wrongs, 'Probability', [
        `${p}% means ${p} out of every 100 — so ${fmt(p / 100)} of the days.`,
        `${fmt(p / 100)} × ${n} = <b>${ans}</b> days. An estimate, not a promise.`]);
  }
  let red, blue, green, total, ans, wrongs;
  do {
    red = ri(2, 4); blue = ri(1, 3); green = ri(2, 5);
    total = red + blue + green;
    ans = sfrH(red, total);
    wrongs = [...new Set([frH(red, total - red), frH(1, red), sfrH(blue, total), sfrH(green, total)])]
      .filter(w => w !== ans);
  } while (wrongs.length < 2);
  return Q('Grab bag', `A bag has ${red} red, ${blue} blue, and ${green} green marbles. P(red)?`,
    ans, wrongs, 'Probability', [
      `Probability = favorable outcomes over total outcomes.`,
      `Total marbles: ${red} + ${blue} + ${green} = ${total}.`,
      `P(red) = ${frH(red, total)}${gcd(red, total) > 1 ? ` = <b>${ans}</b>` : ' — that simplifies no further'}.`]);
}

/* ---------- grade 8 ---------- */

export function funcEval() {
  const m = ri(8, 15), b = pick([10, 20, 25, 30]), h = ri(2, 6);
  const ans = m * h + b;
  const wrongs = [m * h, (m + b) * h, ans + 10].filter(x => x !== ans);
  return Q('Function machine', `f(h) = ${m}h + ${b}. What's f(${h})?`,
    ans, wrongs, 'Evaluating functions', [
      `f(${h}) means: feed ${h} into the function wherever h appears.`,
      `${m} × ${h} + ${b} = ${m * h} + ${b}.`,
      `f(${h}) = <b>${ans}</b> dollars.`]);
}

export function funcRate(ctx) {
  const b = pick([20, 30, 40, 50]), m = pick([5, 10, 15]);
  const ans = `s = ${m}w + ${b}`;
  return Q('Which equation?', `Your bank starts at $${b} and grows $${m} every week. Which equation gives s after w weeks?`,
    ans, [`s = ${b}w + ${m}`, `s = ${m + b}w`, `s = ${m}w − ${b}`], 'Modeling with functions', [
      `The amount per week multiplies w; the starting amount stands alone.`,
      `$${m} each week → ${m}w. Started with $${b} → + ${b}.`,
      `<b>s = ${m}w + ${b}</b>. The ${m} is the rate (slope), the ${b} is the start.`]);
}

export function sysSolve() {
  const x = ri(3, 6), y = ri(1, 4);
  const A = 2 * x + y, B = x + y;
  const wrongs = [y, B, x + 1].filter(v => v !== x);
  return Q('Two unknowns', `2a + b = ${A} and a + b = ${B}. What is a?`,
    x, [...new Set(wrongs)], 'Systems of equations', [
      `Compare the two orders — the only difference is one burger.`,
      `$${A} − $${B} = $${x}. That difference IS the burger.`,
      `Burger = <b>$${x}</b> (so fries are $${B} − $${x} = $${y}).`]);
}

export function pythag() {
  const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
  const ctx = pick([
    `A ramp runs ${a} ft along the ground and rises ${b} ft. How long is the ramp itself?`,
    `Legs of ${a} and ${b}. How long is the hypotenuse?`,
  ]);
  const wrongs = [a + b, c + 1, c - 1].filter(x => x !== c);
  return Q('The shortcut rule', ctx, c, wrongs, 'Pythagorean theorem', [
    `Right angle → Pythagorean theorem: a² + b² = c².`,
    `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}.`,
    `c = √${c * c} = <b>${c}</b>. The shortcut beats walking the two sides.`]);
}

export function approxRoot() {
  let n, k;
  do { n = ri(10, 90); k = Math.floor(Math.sqrt(n)); } while (k * k === n);
  const ans = `${k} and ${k + 1}`;
  return Q('Trap the root', `√${n} is between which two whole numbers?`,
    ans, [`${k - 1} and ${k}`, `${k + 1} and ${k + 2}`, `${Math.floor(n / 2)} and ${Math.floor(n / 2) + 1}`].filter(w => w !== ans),
    'Approximating roots', [
      `Trap it between perfect squares you know.`,
      `${k}² = ${k * k} and ${k + 1}² = ${(k + 1) * (k + 1)}. And ${k * k} < ${n} < ${(k + 1) * (k + 1)}.`,
      `So √${n} is between <b>${k} and ${k + 1}</b> — an irrational number we can still pin down.`]);
}

/* ---------- registration ----------
   Placement mirrors the curriculum plan: each generator joins the world whose
   identity fits its context (stats/probability feed off the Lemonade Stand,
   volume lives in The Workshop's formula work, percents in The Market). */
/* Minification-proof name registry: object-literal keys are strings, so the skill
   index can resolve these even where fn.name has been mangled by a bundler. */
export const EXPANSION_GENERATORS = {
  areaModel, twoStepStory, decNotation, decCompare, multCompare, powTen, decDiv,
  unitFracDiv, volumeBox, meanMedian, depVar, tipCalc, discountTax, simpleInterest,
  probSimple, funcEval, funcRate, sysSolve, pythag, approxRoot,
};

const EXPANSION = [
  [3, 'ratio', 2, areaModel],
  [3, 'ratio', 3, twoStepStory],
  [4, 'frac', 2, decNotation],
  [4, 'frac', 3, decCompare],
  [4, 'ratio', 2, multCompare],
  [5, 'int', 1, powTen],
  [5, 'int', 2, decDiv],
  [5, 'int', 3, decDiv],
  [5, 'frac', 3, unitFracDiv],
  [5, 'alg', 2, volumeBox],
  [6, 'ratio', 2, meanMedian],
  [6, 'ratio', 3, meanMedian],
  [6, 'alg', 2, depVar],
  [7, 'ratio', 1, tipCalc],
  [7, 'ratio', 2, discountTax],
  [7, 'ratio', 3, simpleInterest],
  [7, 'ratio', 3, probSimple],
  [8, 'int', 2, approxRoot],
  [8, 'int', 3, pythag],
  [8, 'alg', 1, funcEval],
  [8, 'alg', 2, funcRate],
  [8, 'alg', 3, sysSolve],
];

for (const [grade, topic, tier, gen] of EXPANSION) CURRICULUM[grade][topic][tier].push(gen);
