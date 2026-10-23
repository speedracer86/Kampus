/* TeachStep[] per skill (§0b "Teach steps").

   A TeachStep is one solvable beat of the new idea:

     { layout: 'walk'|'faceoff'|'line'|'bar', prompt, speak?, hint, takeaway,
       walk?:    { rows: [{ value, how, result? }] },
       faceoff?: { cards: [{ label, count, price, each }], answer, why },
       line?:    { min, max, start, delta, answer, unit },
       bar?:     { parts, target, context } }

   Two sources, deliberately separated:

   1. `REFERENCE_STEPS` — four authored skills, one per layout, so each layout has
      a real worked example to render and to test against.
   2. `walkStepsFrom()` — a MECHANICAL conversion of every other panel in TEACH.
      Each authored {do, ex} becomes one walk row, verbatim; bigIdea becomes the
      prompt; yourTurn stays the unpaid "Try it". Nothing is rewritten, nothing is
      invented. The bank is owner-authored (docs/KAMPUS_INVENTORY.md): the layout
      upgrades for the remaining skills arrive as a bank patch, not from here.

   Which is why a skill with no authored panel gets no steps at all rather than a
   generated one — a teach panel nobody wrote is worse than none. */
import { TEACH } from './teach.js';
import { AUTHORED_STEPS } from './teach-steps-bank.js';
export { AUTHORED_STEPS };
// The depth pass: a second worked example per skill, plan-B representations for
// the wall skills, and `moreStepsFor()` which concatenates them for the
// "show me another one" path. Owner directive: teach more than once.
export { SECOND_EXAMPLES, PLAN_B, moreStepsFor } from './teach-depth.js';

export const LAYOUTS = ['walk', 'faceoff', 'line', 'bar'];

/** The four-skill reference set: one authored example per layout. */
export const REFERENCE_STEPS = {
  // ---- bar · The Kitchen ----
  eqFrac: [
    { layout: 'bar', verb: 'shade',
      prompt: 'Shade two thirds of the pan.',
      hint: 'Three equal pieces. Shade two of them.',
      takeaway: '2/3 means two of three equal pieces.',
      bar: { parts: 3, target: 2, context: 'The pan is cut into three equal pieces.' } },
    { layout: 'bar', verb: 'match',
      prompt: 'Now cut the same pan into twelve. Shade the SAME amount.',
      hint: 'Three pieces became twelve, so each old piece is now four. Two old pieces = eight.',
      takeaway: '2/3 and 8/12 are the same amount with different names.',
      bar: { parts: 12, target: 8, context: 'Same pan, finer cuts. Shade the same amount of pan.' } },
    { layout: 'walk', verb: 'see it',
      prompt: 'So what did the numbers do?',
      hint: 'The bottom went ×4. The top went ×4 too.',
      takeaway: 'Multiply top AND bottom by the same number and the amount keeps its size.',
      walk: { rows: [
        { value: '2/3', how: 'what you started with' },
        { value: '×4', how: 'three pieces became twelve, so each piece split four ways' },
        { value: '8/12', how: 'the top had to ×4 as well', result: true },
      ] } },
    { layout: 'bar', verb: 'try it',
      prompt: '2/3 = ▢/12 — shade it and read off the top.',
      hint: 'Bottom ×4, so top ×4.',
      takeaway: 'To rename a fraction, find the scale and use it on both.',
      tryIt: true,
      bar: { parts: 12, target: 8, context: 'Shade it, then read the top number off the bar.' } },
  ],

  // ---- faceoff · The Market ----
  unitRate: [
    { layout: 'faceoff', verb: 'pick',
      prompt: 'Which is the better buy?',
      hint: 'Divide each price by its count to get the price for ONE.',
      takeaway: 'Divide to the for-ONE price and every comparison is fair.',
      faceoff: {
        cards: [{ label: 'Bag A', count: '12 lemons', price: '$5.40', each: '45¢ each' },
                { label: 'Bag B', count: '8 lemons', price: '$3.44', each: '43¢ each' }],
        answer: 1,
        why: '43¢ beats 45¢, so the 8-pack is cheaper per lemon — even though the bag costs less overall for fewer lemons.' } },
    { layout: 'walk', verb: 'see it',
      prompt: 'How the per-one price comes out.',
      hint: 'Price ÷ count.',
      takeaway: 'Price ÷ count = the price for one.',
      walk: { rows: [
        { value: '$5.40 ÷ 12', how: 'bag A: price divided by lemons' },
        { value: '45¢', how: 'per lemon' },
        { value: '$3.44 ÷ 8', how: 'bag B: same move' },
        { value: '43¢', how: 'per lemon — cheaper', result: true },
      ] } },
    { layout: 'faceoff', verb: 'try it',
      prompt: 'Your turn. Which cup size is the better deal?',
      hint: 'Divide each price by the ounces.',
      takeaway: 'A bigger cup is only a better deal if the per-ounce price is lower.',
      tryIt: true,
      faceoff: {
        cards: [{ label: 'Small', count: '8 oz', price: '$1.20', each: '15¢ an ounce' },
                { label: 'Large', count: '16 oz', price: '$2.72', each: '17¢ an ounce' }],
        answer: 0,
        why: '15¢ an ounce beats 17¢. The big cup looks like the deal and is not.' } },
  ],

  // ---- line · Outside ----
  addInt: [
    { layout: 'line', verb: 'step',
      prompt: 'It is 8° out. It drops 3°. Tap where it lands.',
      hint: 'Start at 8 and step DOWN three.',
      takeaway: 'Adding a negative is a step down the line.',
      line: { min: -6, max: 12, start: 8, delta: -3, answer: 5, unit: '°' } },
    { layout: 'walk', verb: 'see it',
      prompt: 'Why down and not up?',
      hint: 'A negative number points down the line.',
      takeaway: '8 + (−3) is the same journey as 8 − 3.',
      walk: { rows: [
        { value: '8', how: 'where you started' },
        { value: '+ (−3)', how: 'the negative points down the line' },
        { value: '5', how: 'three steps down from 8', result: true },
      ] } },
    { layout: 'line', verb: 'try it',
      prompt: '−4 + 9 — tap where you land.',
      hint: 'Start at −4. Nine steps UP this time.',
      takeaway: 'Start at the first number, then step the way the second one points.',
      tryIt: true,
      line: { min: -8, max: 10, start: -4, delta: 9, answer: 5, unit: '' } },
  ],

  // ---- walk · The Workshop ----
  twoStep: [
    { layout: 'walk', verb: 'peel',
      prompt: '2t + 5 = 29. Peel it outside-in.',
      hint: 'The +5 is on the outside. Undo that first.',
      takeaway: 'Undo the + or − first, then the ×.',
      walk: { rows: [
        { value: '2t + 5 = 29', how: 'what you were given' },
        { value: '− 5', how: 'take the 5 off BOTH sides' },
        { value: '2t = 24', how: 'now only the × is left' },
        { value: '÷ 2', how: 'undo the multiply, both sides' },
        { value: 't = 12', how: 'and that is t', result: true },
      ] } },
    { layout: 'walk', verb: 'check',
      prompt: 'Check it: does t = 12 actually work?',
      hint: 'Put 12 back in where t was.',
      takeaway: 'Putting the answer back in is how you know, not how you hope.',
      walk: { rows: [
        { value: '2(12) + 5', how: 'the original, with 12 in for t' },
        { value: '24 + 5', how: 'multiply first' },
        { value: '29 ✓', how: 'the number you were told. It works.', result: true },
      ] } },
    { layout: 'walk', verb: 'try it',
      prompt: '3x + 4 = 19. Walk it down.',
      hint: 'Take the 4 off both sides, then divide by 3.',
      takeaway: 'Same two moves, every time: undo the add, then undo the multiply.',
      tryIt: true,
      walk: { rows: [
        { value: '3x + 4 = 19', how: 'what you were given' },
        { value: '− 4', how: 'both sides' },
        { value: '3x = 15', how: 'the × is all that is left' },
        { value: 'x = 5', how: 'divide both sides by 3', result: true },
      ] } },
  ],
};

/**
 * Mechanically convert one authored TEACH panel into walk-layout steps.
 * Content is carried over verbatim: each {do, ex} is one row, bigIdea is the
 * prompt and the takeaway, yourTurn becomes the final unpaid "Try it".
 */
export function walkStepsFrom(panel) {
  if (!panel) return null;
  const rows = (panel.steps || []).map((s, i, all) => ({
    value: s.ex, how: s.do, result: i === all.length - 1,
  }));
  const steps = [];
  if (rows.length) steps.push({
    layout: 'walk', verb: 'walk it',
    prompt: panel.bigIdea,
    hint: panel.steps[0]?.do,
    takeaway: panel.bigIdea,
    walk: { rows },
  });
  if (panel.yourTurn) steps.push({
    layout: 'walk', verb: 'try it',
    prompt: panel.yourTurn.q,
    hint: panel.steps?.[panel.steps.length - 1]?.do || panel.bigIdea,
    takeaway: `${panel.yourTurn.q} → ${panel.yourTurn.a}`,
    tryIt: true,
    walk: { rows: [{ value: panel.yourTurn.a, how: 'work it through, then check yourself', result: true }] },
  });
  return steps.length ? steps : null;
}

/** Authored steps first (reference set, then the authored bank); the mechanical
    walk remains only as the safety net for any future skill not yet authored. */
export function teachStepsFor(skill) {
  return REFERENCE_STEPS[skill] || AUTHORED_STEPS[skill] || walkStepsFrom(TEACH[skill]);
}

/** Skills whose steps are authored per layout rather than converted. */
export const REFERENCE_SKILLS = Object.keys(REFERENCE_STEPS);
