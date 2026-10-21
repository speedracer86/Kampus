/* Field assignments — the real-world bridge (PLAY_SYSTEM §7).

   One optional mission a week. A grown-up enters two or three real numbers from her
   actual Tuesday — the change jar, the recipe she doubled, the two bag sizes at the
   shop — and the maths runs on those. This is the `life` source from §2: not her
   business, not clean abstraction, but her day.

   It pays the ordinary effort rate, like everything else, and it is optional: a week
   with no assignment is a normal week, never a missed one. */

export const FIELD_PAY_REASON = 'field';

/**
 * The menu, banded. Each asks the grown-up for the fewest numbers that make the
 * maths real — never more than three, because the friction is the feature's enemy.
 */
export const ASSIGNMENTS = [
  {
    id: 'change-jar', band: 'a', title: 'Count the change jar',
    ask: 'Tip out the jar and count each coin.',
    inputs: [
      { key: 'quarters', label: 'Quarters', value: 25 },
      { key: 'dimes', label: 'Dimes', value: 10 },
      { key: 'nickels', label: 'Nickels', value: 5 },
    ],
    question: (v) => {
      const total = v.quarters * 25 + v.dimes * 10 + v.nickels * 5;
      return {
        text: `You counted ${v.quarters} quarters, ${v.dimes} dimes and ${v.nickels} nickels. How much is that?`,
        answer: `$${(total / 100).toFixed(2)}`,
        steps: [
          `Quarters: ${v.quarters} × 25¢ = ${v.quarters * 25}¢.`,
          `Dimes: ${v.dimes} × 10¢ = ${v.dimes * 10}¢. Nickels: ${v.nickels} × 5¢ = ${v.nickels * 5}¢.`,
          `Altogether ${total}¢, which is $${(total / 100).toFixed(2)}.`,
        ],
      };
    },
  },
  {
    id: 'double-recipe', band: 'a', title: 'Double a real recipe',
    ask: 'Pick something you actually cooked and read two amounts off the recipe.',
    inputs: [
      { key: 'flour', label: 'Cups of flour' },
      { key: 'sugar', label: 'Cups of sugar' },
      { key: 'serves', label: 'How many it serves' },
    ],
    question: (v) => ({
      text: `The recipe serves ${v.serves} with ${v.flour} cups of flour. You want to serve ${v.serves * 2}. How much flour?`,
      answer: String(v.flour * 2),
      steps: [
        `Twice the people means twice of everything.`,
        `${v.flour} × 2 = ${v.flour * 2} cups of flour.`,
        `(The sugar doubles too: ${v.sugar} → ${v.sugar * 2}.)`,
      ],
    }),
  },
  {
    id: 'unit-price', band: 'b', title: 'Find the cheaper bag',
    ask: 'At the shop, read the price and the size off two bags of the same thing.',
    inputs: [
      { key: 'priceA', label: 'Small bag price ($)' },
      { key: 'sizeA', label: 'Small bag size' },
      { key: 'priceB', label: 'Big bag price ($)' },
      { key: 'sizeB', label: 'Big bag size' },
    ],
    question: (v) => {
      const a = v.priceA / v.sizeA, b = v.priceB / v.sizeB;
      const cheaper = a <= b ? 'small' : 'big';
      return {
        text: `The small bag is $${v.priceA} for ${v.sizeA}, the big one $${v.priceB} for ${v.sizeB}. Which is cheaper per unit?`,
        answer: cheaper === 'small' ? 'The small bag' : 'The big bag',
        steps: [
          `Price per unit is price ÷ size.`,
          `Small: $${v.priceA} ÷ ${v.sizeA} = ${a.toFixed(2)} each. Big: $${v.priceB} ÷ ${v.sizeB} = ${b.toFixed(2)} each.`,
          `${cheaper === 'small' ? 'The small' : 'The big'} bag wins — and the bigger bag is not always the better deal.`,
        ],
      };
    },
  },
  {
    id: 'trip-cost', band: 'c', title: 'Cost a real trip',
    ask: 'Next drive, note the distance and what fuel costs.',
    inputs: [
      { key: 'miles', label: 'Miles driven' },
      { key: 'mpg', label: 'Miles per gallon' },
      { key: 'price', label: 'Price per gallon ($)' },
    ],
    question: (v) => {
      const gallons = v.miles / v.mpg;
      const cost = gallons * v.price;
      return {
        text: `${v.miles} miles at ${v.mpg} miles per gallon, fuel at $${v.price}. What did the trip cost?`,
        answer: `$${cost.toFixed(2)}`,
        steps: [
          `Gallons used: ${v.miles} ÷ ${v.mpg} = ${gallons.toFixed(2)}.`,
          `Cost: ${gallons.toFixed(2)} × $${v.price} = $${cost.toFixed(2)}.`,
          `That is what the drive actually cost, before anything else.`,
        ],
      };
    },
  },
];

export const assignmentsForBand = (band) => {
  const order = { a: ['a'], b: ['a', 'b'], c: ['a', 'b', 'c'] };
  const allowed = new Set(order[band] || ['a']);
  return ASSIGNMENTS.filter(a => allowed.has(a.band));
};

/** One assignment a week, chosen deterministically so it does not change under her. */
export function weeklyAssignment(band, weekKey = '0') {
  const pool = assignmentsForBand(band);
  if (!pool.length) return null;
  const n = String(weekKey).split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  return pool[n % pool.length];
}

/**
 * Turn the grown-up's real numbers into a question tagged `life`.
 * @returns {{text, answers, correct, steps, source}|null} null if a number is missing.
 */
export function buildFieldQuestion(assignment, values = {}) {
  if (!assignment) return null;
  const missing = assignment.inputs.filter(i => values[i.key] === undefined || values[i.key] === '' || Number.isNaN(Number(values[i.key])));
  if (missing.length) return null;
  const nums = Object.fromEntries(assignment.inputs.map(i => [i.key, Number(values[i.key])]));
  const q = assignment.question(nums);
  // Distractors come from the same numbers, so a wrong answer is a real misstep.
  const near = (ans) => {
    const n = parseFloat(String(ans).replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(n)) return ['The small bag', 'The big bag'].filter(x => x !== ans);
    const money = String(ans).startsWith('$');
    const fmt = (x) => (money ? `$${x.toFixed(2)}` : String(Math.round(x * 100) / 100));
    return [...new Set([fmt(n * 2), fmt(n / 2), fmt(n + 1)])].filter(x => x !== String(ans));
  };
  const answers = [String(q.answer), ...near(q.answer)].slice(0, 4);
  return {
    assignmentId: assignment.id,
    text: q.text,
    answers: answers.sort((a, b) => String(a).localeCompare(String(b))),
    get correct() { return this.answers.indexOf(String(q.answer)); },
    steps: q.steps,
    hint: q.steps[0],
    source: 'life',
  };
}
