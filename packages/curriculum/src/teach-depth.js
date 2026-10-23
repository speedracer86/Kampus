/* The depth pass — teach more than once (owner directive, Oct 23).

   Two banks:

   SECOND_EXAMPLES — one more worked beat per skill: SAME strategy, DIFFERENT
   surface (new numbers, new context), so generalization has two points to draw a
   line through. Surfaces here deliberately rotate contexts the first pass didn't
   use. Reached by "Another example →" inside the teach phase, and the re-teach
   branch is built from these — a kid who missed prove-it gets a fresh example,
   never a replay of the one that didn't land.

   PLAN_B — a different REPRESENTATION for the classic wall skills: when the bar
   didn't land, try the line; when symbols failed, try money. Appended after the
   second example on the "another one" path.

   Same invariants as the main bank, enforced in teach-steps-bank.test.js:
   line answer === start + delta, bar target ≤ parts, walks end on a result row. */

export const SECOND_EXAMPLES = {
  // ---- Grade 3 ----
  multFact: [
    { layout: 'walk', verb: 'again, new numbers',
      prompt: '6 × 9 — same move, harder family.',
      hint: 'Six nines is six tens, minus one of each.',
      takeaway: '6 × 9 = 60 − 6 = 54.',
      walk: { rows: [
        { value: '6 × 10 = 60', how: 'the easy neighbor fact' },
        { value: '60 − 6 = 54', how: 'each of the six groups gives one back', result: true },
      ] } },
  ],
  divFact: [
    { layout: 'walk', verb: 'again, new numbers',
      prompt: '63 ÷ 7 — read the family backwards.',
      hint: '7 times what lands on 63?',
      takeaway: '7 × 9 = 63, so 63 ÷ 7 = 9.',
      walk: { rows: [
        { value: '7 × 9 = 63', how: 'the fact' },
        { value: '63 ÷ 7 = 9', how: 'backwards', result: true },
      ] } },
  ],
  boxMul: [
    { layout: 'walk', verb: 'again, new numbers',
      prompt: '▢ × 6 = 48 — the box moved. Same unmasking.',
      hint: 'Something, six times, makes 48.',
      takeaway: '48 ÷ 6 = 8, wherever the box hides.',
      walk: { rows: [{ value: '48 ÷ 6 = 8', how: 'divide by the factor you can see', result: true }] } },
  ],
  boxAdd: [
    { layout: 'line', verb: 'again, new numbers',
      prompt: '▢ + 6 = 13 — the box is first this time. Tap 13 and count back.',
      hint: 'The jump from 6 to 13 is the same jump backwards.',
      takeaway: '13 − 6 = 7: a missing addend either way.',
      line: { min: 0, max: 16, start: 6, delta: 7, answer: 13, unit: '' } },
  ],
  addBig: [
    { layout: 'walk', verb: 'again, new numbers',
      prompt: '365 + 478 — two carries this time.',
      hint: 'Ones carry AND tens carry.',
      takeaway: 'Carrying twice is the same move twice: 843.',
      walk: { rows: [
        { value: '5 + 8 = 13', how: 'write 3, carry 1' },
        { value: '6 + 7 + 1 = 14', how: 'write 4, carry 1 again' },
        { value: '3 + 4 + 1 = 8', how: 'hundreds, with the carry' },
        { value: '843', how: 'read it down', result: true },
      ] } },
  ],
  subBig: [
    { layout: 'walk', verb: 'again, new numbers',
      prompt: '700 − 258 — borrowing across a zero.',
      hint: 'The 0 has nothing to lend — it borrows first.',
      takeaway: 'Zeros pass the borrow along: 442.',
      walk: { rows: [
        { value: '700 → 6 · 9 · 10', how: 'the hundred lends through the zero' },
        { value: '10−8 · 9−5 · 6−2', how: 'now every column can pay' },
        { value: '442', how: 'done', result: true },
      ] } },
  ],
  roundNum: [
    { layout: 'line', verb: 'again, new numbers',
      prompt: 'Round 283 to the nearest hundred — tap where it snaps.',
      hint: 'Between 200 and 300. The peek digit is 8.',
      takeaway: '283 → 300: the 8 pushes it up.',
      line: { min: 200, max: 320, start: 283, delta: 17, answer: 300, unit: '' } },
  ],
  twoStepStory: [
    { layout: 'walk', verb: 'again, new story',
      prompt: 'You had $50. You bought 4 bags of lemons at $6 each. What’s left?',
      hint: 'Hidden question: what did the lemons cost?',
      takeaway: 'Cost first (24), then what remains (26).',
      walk: { rows: [
        { value: '4 × 6 = 24', how: 'the hidden question: total cost' },
        { value: '50 − 24 = 26', how: 'the asked question', result: true },
      ] } },
  ],
  patternNext: [
    { layout: 'walk', verb: 'again, going down',
      prompt: '40, 34, 28, ? — the jump can go DOWN too.',
      hint: 'Neighbors drop by the same amount.',
      takeaway: 'A pattern’s jump can be negative: 22.',
      walk: { rows: [
        { value: '34 − 40 = −6', how: 'the jump, downward' },
        { value: '28 − 6 = 22', how: 'ride it once more', result: true },
      ] } },
  ],
  fracOfSet: [
    { layout: 'bar', verb: 'again, new set',
      prompt: 'Shade 2/5 of the 20-pack of cups.',
      hint: 'Five shares of 4 each. Shade two shares.',
      takeaway: '20 ÷ 5 = 4, then × 2 = 8 cups.',
      bar: { parts: 5, target: 2, context: 'Twenty cups in five shares — each shaded share is 4 cups.' } },
  ],
  unitFracCmp: [
    { layout: 'bar', verb: 'again, other way',
      prompt: 'Shade 1/8 — and feel how thin it is next to 1/3.',
      hint: 'Eight cuts make slim pieces.',
      takeaway: 'The bigger the bottom, the thinner the piece.',
      bar: { parts: 8, target: 1, context: 'One slim piece of eight. A third would be nearly three times this.' } },
  ],
  cmpFrac: [
    { layout: 'walk', verb: 'again, a shortcut',
      prompt: '5/8 vs 1/2 — compare to one half, no renaming.',
      hint: 'Half of 8 is 4. Is 5 eighths more than 4 eighths?',
      takeaway: 'Benchmarks beat renaming when one side is 1/2.',
      walk: { rows: [
        { value: '1/2 = 4/8', how: 'half, in eighths' },
        { value: '5/8 > 4/8', how: 'five beats four', result: true },
      ] } },
  ],
  areaModel: [
    { layout: 'walk', verb: 'again, bigger room',
      prompt: 'A 7 × 8 patio — and why it’s the same as 8 × 7.',
      hint: 'Turn the patio sideways: same tiles.',
      takeaway: 'Rows × columns = columns × rows: 56 either way.',
      walk: { rows: [
        { value: '7 × 8 = 56', how: 'seven rows of eight' },
        { value: '8 × 7 = 56', how: 'turn your head: eight rows of seven', result: true },
      ] } },
  ],

  // ---- Grade 4 ----
  multCompare: [
    { layout: 'walk', verb: 'again, backwards',
      prompt: '"24 is 4 times as many as ▢" — the base is hiding now.',
      hint: 'If 4 bases make 24, one base is…',
      takeaway: 'When the base hides, divide: 24 ÷ 4 = 6.',
      walk: { rows: [{ value: '24 ÷ 4 = 6', how: 'un-multiply to find the base', result: true }] } },
  ],
  mulDigit: [
    { layout: 'walk', verb: 'again, new numbers',
      prompt: '47 × 23 — both numbers split this time.',
      hint: 'Four pieces: 40×20, 40×3, 7×20, 7×3.',
      takeaway: 'Every piece of one times every piece of the other: 1,081.',
      walk: { rows: [
        { value: '40×20 = 800 · 40×3 = 120', how: 'the forty’s two pieces' },
        { value: '7×20 = 140 · 7×3 = 21', how: 'the seven’s two pieces' },
        { value: '800+120+140+21 = 1081', how: 'all four added', result: true },
      ] } },
  ],
  divRem: [
    { layout: 'walk', verb: 'again, real stakes',
      prompt: '47 kids, vans seat 6 — how many vans REALLY?',
      hint: '7 vans carry 42… and the remainder is five kids on the curb.',
      takeaway: 'Sometimes the remainder forces a round UP: 8 vans.',
      walk: { rows: [
        { value: '47 ÷ 6 = 7 r 5', how: 'the division' },
        { value: '8 vans', how: 'the 5 leftover kids still need a van', result: true },
      ] } },
  ],
  decNotation: [
    { layout: 'bar', verb: 'again, mixed coins',
      prompt: 'Shade $0.40 — four dimes of the dollar.',
      hint: 'Each piece of the bar is a dime.',
      takeaway: '0.4 = 0.40: tenths written two ways.',
      bar: { parts: 10, target: 4, context: 'Four dimes shaded. 0.4 and 0.40 are the same money.' } },
  ],
  decCompare: [
    { layout: 'walk', verb: 'again, the trap',
      prompt: '0.9 vs 0.12 — longer is NOT bigger.',
      hint: 'Pad them: 0.90 vs 0.12.',
      takeaway: 'Nine dimes beat one dime and two pennies.',
      walk: { rows: [
        { value: '0.90 vs 0.12', how: 'padded to the same length' },
        { value: '0.9 wins', how: '9 tenths beats 1 tenth — digits, not length', result: true },
      ] } },
  ],
  frac2dec: [
    { layout: 'walk', verb: 'again, new fraction',
      prompt: '3/5 as a decimal — scale to tenths.',
      hint: 'Fifths double into tenths.',
      takeaway: '3/5 = 6/10 = 0.6.',
      walk: { rows: [
        { value: '3/5 = 6/10', how: 'both doubled' },
        { value: '0.6', how: 'six tenths', result: true },
      ] } },
  ],
  dec2frac: [
    { layout: 'walk', verb: 'again, new decimal',
      prompt: '0.75 back to a fraction.',
      hint: 'Seventy-five hundredths — then shrink it.',
      takeaway: '75/100 = 3/4 (÷25 both).',
      walk: { rows: [
        { value: '75/100', how: 'said aloud, written down' },
        { value: '3/4', how: 'both shared by 25', result: true },
      ] } },
  ],
  addSameDen: [
    { layout: 'bar', verb: 'again, past one',
      prompt: '4/6 + 3/6 — shade it and watch it pass a whole.',
      hint: 'Seven sixths is more than one pan.',
      takeaway: '7/6 = 1 1/6: same-bottom adding can overflow, and that’s fine.',
      bar: { parts: 12, target: 7, context: 'Two pans of sixths side by side — seven pieces shaded spills into the second pan.' } },
  ],
  mixedImp: [
    { layout: 'walk', verb: 'again, other direction',
      prompt: '3 2/5 as an improper fraction.',
      hint: 'Three wholes of five fifths, plus two.',
      takeaway: '3 2/5 = 17/5.',
      walk: { rows: [
        { value: '3 × 5 = 15', how: 'the wholes, as fifths' },
        { value: '15 + 2 = 17', how: 'plus the loose fifths' },
        { value: '17/5', how: 'one name, no wholes', result: true },
      ] } },
  ],

  // ---- Grade 5 ----
  powTen: [
    { layout: 'walk', verb: 'again, going up',
      prompt: '0.06 × 1000 — three slides left.',
      hint: 'Each zero is one slide.',
      takeaway: '0.06 → 0.6 → 6 → 60.',
      walk: { rows: [
        { value: '0.06', how: 'start' },
        { value: '→ 0.6 → 6 → 60', how: 'three slides for three zeros', result: true },
      ] } },
  ],
  decAdd: [
    { layout: 'walk', verb: 'again, ragged ends',
      prompt: '7.5 + 0.86 — the lengths don’t match.',
      hint: 'Pad 7.5 to 7.50 and stack the points.',
      takeaway: 'Pad, stack, add: 8.36.',
      walk: { rows: [
        { value: '7.50 + 0.86', how: 'padded so hundredths meet hundredths' },
        { value: '8.36', how: 'straight down', result: true },
      ] } },
  ],
  decMul: [
    { layout: 'walk', verb: 'again, both decimal',
      prompt: '0.4 × 0.6 — the answer gets SMALLER.',
      hint: '4 × 6 = 24, then two decimal digits.',
      takeaway: '0.24: less than either, because it’s a part OF a part.',
      walk: { rows: [
        { value: '4 × 6 = 24', how: 'points ignored' },
        { value: '0.24', how: 'two digits placed — part of a part shrinks', result: true },
      ] } },
  ],
  decDiv: [
    { layout: 'walk', verb: 'again, money',
      prompt: '$6.30 ÷ $0.90 a cup — how many cups did you sell?',
      hint: 'Slide both: 63 ÷ 9.',
      takeaway: 'Seven cups — division counts how many fit.',
      walk: { rows: [
        { value: '6.30 ÷ 0.90 → 63 ÷ 9', how: 'both slid twice' },
        { value: '7', how: 'seven ninety-cent cups', result: true },
      ] } },
  ],
  addUnlikeDen: [
    { layout: 'walk', verb: 'again, new pair',
      prompt: '2/3 + 1/4 — twelfths this time.',
      hint: 'Twelfths fit thirds and quarters.',
      takeaway: '8/12 + 3/12 = 11/12.',
      walk: { rows: [
        { value: '2/3 = 8/12', how: '×4 both' },
        { value: '1/4 = 3/12', how: '×3 both' },
        { value: '11/12', how: 'tops add', result: true },
      ] } },
  ],
  subFrac: [
    { layout: 'walk', verb: 'again, from a whole',
      prompt: '1 − 3/8 — subtracting from one whole pan.',
      hint: 'The whole pan is 8/8.',
      takeaway: '8/8 − 3/8 = 5/8.',
      walk: { rows: [
        { value: '1 = 8/8', how: 'the whole, renamed' },
        { value: '8/8 − 3/8 = 5/8', how: 'now same-size pieces', result: true },
      ] } },
  ],
  mulFrac: [
    { layout: 'bar', verb: 'again, new pair',
      prompt: '2/3 of 3/4 of the tray — shade what survives.',
      hint: 'Three quarters first; keep two thirds of THAT.',
      takeaway: '2/3 × 3/4 = 6/12 = 1/2.',
      bar: { parts: 12, target: 6, context: 'The tray in twelfths: 3/4 is nine pieces; two thirds of nine is six.' } },
  ],
  unitFracDiv: [
    { layout: 'walk', verb: 'again, flipped question',
      prompt: '1/2 ÷ 4 — HALF a pitcher shared by four kids.',
      hint: 'A half, cut four ways.',
      takeaway: '1/2 ÷ 4 = 1/8 each: sharing shrinks the piece.',
      walk: { rows: [
        { value: '1/2 ÷ 4', how: 'half a pitcher, four cups' },
        { value: '1/8', how: 'each cut makes the pieces smaller', result: true },
      ] } },
  ],
  scaleRecipe: [
    { layout: 'walk', verb: 'again, scaling DOWN',
      prompt: 'The recipe serves 12; you need 4. Flour is 3 cups.',
      hint: 'The factor can shrink: 4 ÷ 12.',
      takeaway: '× 1/3 → 1 cup: factors work downward too.',
      walk: { rows: [
        { value: '4 ÷ 12 = 1/3', how: 'the shrink factor' },
        { value: '3 × 1/3 = 1', how: 'flour scaled down', result: true },
      ] } },
  ],
  volumeBox: [
    { layout: 'walk', verb: 'again, missing side',
      prompt: 'The box holds 96 cm³; the base is 6 × 4. How tall?',
      hint: 'Volume ÷ base area = height.',
      takeaway: 'Any one of the three can hide: 96 ÷ 24 = 4.',
      walk: { rows: [
        { value: '6 × 4 = 24', how: 'the base' },
        { value: '96 ÷ 24 = 4 cm', how: 'layers needed to reach 96', result: true },
      ] } },
  ],
  orderOpsParen: [
    { layout: 'walk', verb: 'again, brackets move',
      prompt: '(2 + 8) × 3 vs 2 + 8 × 3 — same digits, different answers.',
      hint: 'The brackets change who goes first.',
      takeaway: '30 vs 26: brackets are steering, not decoration.',
      walk: { rows: [
        { value: '(2+8) × 3 = 30', how: 'brackets first: 10 × 3' },
        { value: '2 + 8×3 = 26', how: 'no brackets: multiply first', result: true },
      ] } },
  ],
  orderOps: [
    { layout: 'walk', verb: 'again, with division',
      prompt: '18 ÷ 3 + 3 × 2 — two first-rank moves.',
      hint: '÷ and × both outrank +. Left to right.',
      takeaway: '6 + 6 = 12: same rank goes left to right.',
      walk: { rows: [
        { value: '18 ÷ 3 = 6', how: 'leftmost first-rank move' },
        { value: '3 × 2 = 6', how: 'the other one' },
        { value: '6 + 6 = 12', how: 'the + finally goes', result: true },
      ] } },
  ],
  evalX: [
    { layout: 'walk', verb: 'again, x twice',
      prompt: '2x + x when x = 5 — the letter can appear twice.',
      hint: 'Both x’s get the 5.',
      takeaway: '10 + 5 = 15: every x wears the same number.',
      walk: { rows: [
        { value: '2(5) + 5', how: 'both substituted' },
        { value: '15', how: 'computed', result: true },
      ] } },
  ],

  // ---- Grade 6 ----
  eqFrac: [
    { layout: 'bar', verb: 'again, shrinking',
      prompt: 'Shade 6/8 — then see it as quarters.',
      hint: 'Six of eight is the same amount as three of four.',
      takeaway: 'Dividing top and bottom shrinks the NAME, not the amount.',
      bar: { parts: 8, target: 6, context: 'Six eighths shaded — squint and it’s three quarters.' } },
  ],
  unitRate: [
    { layout: 'walk', verb: 'again, per hour',
      prompt: '$42 for 3 hours of pet-sitting — your rate?',
      hint: 'Money ÷ hours gives the for-ONE.',
      takeaway: 'Rates aren’t just prices: $14 an hour is a unit rate too.',
      walk: { rows: [
        { value: '42 ÷ 3', how: 'dollars per one hour' },
        { value: '$14/hr', how: 'your rate — compare any job with it', result: true },
      ] } },
  ],
  addInt: [
    { layout: 'line', verb: 'again, from below',
      prompt: '−6 + 4 — start below zero, climb. Tap the landing.',
      hint: 'Four steps up from −6.',
      takeaway: 'Climbing from below zero can still leave you below.',
      line: { min: -8, max: 4, start: -6, delta: 4, answer: -2, unit: '°' } },
  ],
  simplifyRatio: [
    { layout: 'walk', verb: 'again, three steps',
      prompt: '24:36 — simplify in stages if you don’t spot 12.',
      hint: 'Halve, halve, then thirds.',
      takeaway: 'Stages reach the same place: 2:3.',
      walk: { rows: [
        { value: '24:36 → 12:18', how: '÷2' },
        { value: '12:18 → 2:3', how: '÷6 — or two more small steps', result: true },
      ] } },
  ],
  ratioShare: [
    { layout: 'walk', verb: 'again, three ways',
      prompt: 'Split $36 of stand profit 1:2:3 between three partners.',
      hint: 'Six parts in all.',
      takeaway: 'More partners, same move: $6, $12, $18.',
      walk: { rows: [
        { value: '1+2+3 = 6 parts', how: 'total the ratio' },
        { value: '36 ÷ 6 = 6', how: 'one part' },
        { value: '6 · 12 · 18', how: 'deal them out', result: true },
      ] } },
  ],
  easyPct: [
    { layout: 'walk', verb: 'again, 5% and 1%',
      prompt: '15% of $60 — with the 10% and 5% moves.',
      hint: '10% is 6; 5% is half of that.',
      takeaway: '6 + 3 = $9: benchmarks snap together.',
      walk: { rows: [
        { value: '10% = 6', how: 'one slide' },
        { value: '5% = 3', how: 'half the slide' },
        { value: '15% = 9', how: 'together', result: true },
      ] } },
  ],
  pctOf: [
    { layout: 'walk', verb: 'again, bigger percent',
      prompt: '60% of 45 — percents above half.',
      hint: '0.6 × 45, or 10% six times.',
      takeaway: '27 either way: the decimal route and the benchmark route agree.',
      walk: { rows: [
        { value: '0.60 × 45', how: 'the decimal route' },
        { value: '27', how: 'or 4.5 six times — same answer', result: true },
      ] } },
  ],
  findWhole: [
    { layout: 'walk', verb: 'again, from 60%',
      prompt: '18 kids is 60% of the class. How big is the class?',
      hint: 'If 60% is 18, what is 10%?',
      takeaway: '10% = 3, so 100% = 30.',
      walk: { rows: [
        { value: '60% → 18', how: 'known' },
        { value: '10% → 3', how: 'divide by six' },
        { value: '100% → 30', how: 'ten of those', result: true },
      ] } },
  ],
  frac2pct: [
    { layout: 'walk', verb: 'again, awkward bottom',
      prompt: '7/20 as a percent — 20 goes into 100 cleanly.',
      hint: '×5 lifts twentieths to hundredths.',
      takeaway: '7/20 = 35/100 = 35%.',
      walk: { rows: [
        { value: '7/20 = 35/100', how: '×5 both' },
        { value: '35%', how: 'read the top', result: true },
      ] } },
  ],
  divFrac: [
    { layout: 'walk', verb: 'again, fraction by fraction',
      prompt: '3/4 ÷ 1/8 — how many eighths fit in three quarters?',
      hint: 'Flip and multiply: 3/4 × 8.',
      takeaway: '24/4 = 6 eighths fit.',
      walk: { rows: [
        { value: '3/4 × 8/1', how: 'divisor flipped' },
        { value: '24/4 = 6', how: 'six eighth-scoops', result: true },
      ] } },
  ],
  cmpInt: [
    { layout: 'walk', verb: 'again, money words',
      prompt: 'Owing $5 vs owing $2 — which account is GREATER?',
      hint: 'Greater means further right, not further from zero.',
      takeaway: '−2 > −5: the smaller debt is the greater number.',
      walk: { rows: [
        { value: '−5 and −2', how: 'two debts on the line' },
        { value: '−2 is greater', how: 'closer to having money', result: true },
      ] } },
  ],
  absVal: [
    { layout: 'walk', verb: 'again, both sides',
      prompt: '|7| and |−7| — the twins.',
      hint: 'Both are seven steps from zero.',
      takeaway: 'Opposites share one absolute value.',
      walk: { rows: [
        { value: '|7| = 7', how: 'seven steps right of zero' },
        { value: '|−7| = 7', how: 'seven steps left — same distance', result: true },
      ] } },
  ],
  subToNeg: [
    { layout: 'line', verb: 'again, colder',
      prompt: 'It’s 4° and the temperature falls 9°. Tap tonight’s low.',
      hint: 'Four to zero, then five more below.',
      takeaway: '4 − 9 = −5: weather does this all winter.',
      line: { min: -8, max: 6, start: 4, delta: -9, answer: -5, unit: '°' } },
  ],
  evalTwoVar: [
    { layout: 'walk', verb: 'again, subtraction inside',
      prompt: '4a − 2b when a = 3, b = 5.',
      hint: 'Substitute both, then watch the minus.',
      takeaway: '12 − 10 = 2.',
      walk: { rows: [
        { value: '4(3) − 2(5)', how: 'both letters dressed' },
        { value: '12 − 10 = 2', how: 'computed', result: true },
      ] } },
  ],
  oneStepAdd: [
    { layout: 'walk', verb: 'again, minus flavor',
      prompt: 'x − 6 = 9 — undo a SUBTRACT this time.',
      hint: 'Six was taken away; give it back.',
      takeaway: 'Undo − by +: x = 15.',
      walk: { rows: [
        { value: 'x − 6 = 9', how: 'x lost six' },
        { value: '+ 6 both sides', how: 'give it back fairly' },
        { value: 'x = 15', how: 'restored', result: true },
      ] } },
  ],
  oneStepMul: [
    { layout: 'walk', verb: 'again, division flavor',
      prompt: 'x ÷ 4 = 8 — undo a DIVIDE.',
      hint: 'x was quartered. Multiply to undo.',
      takeaway: 'Undo ÷ by ×: x = 32.',
      walk: { rows: [
        { value: 'x ÷ 4 = 8', how: 'x was cut four ways' },
        { value: '× 4 both sides', how: 'the undo' },
        { value: 'x = 32', how: 'whole again', result: true },
      ] } },
  ],
  twoStep: [
    { layout: 'walk', verb: 'again, minus constant',
      prompt: '3n − 4 = 17 — the constant is negative this time.',
      hint: 'Add 4 to both sides first.',
      takeaway: 'Same peel: +4, then ÷3 → n = 7.',
      walk: { rows: [
        { value: '3n − 4 = 17', how: 'given' },
        { value: '3n = 21', how: 'four added back, both sides' },
        { value: 'n = 7', how: 'divide by 3', result: true },
      ] } },
  ],
  depVar: [
    { layout: 'walk', verb: 'again, read backwards',
      prompt: 'm = 2c. You made $18 — how many cups was that?',
      hint: 'The rule runs backwards too.',
      takeaway: 'c = m ÷ 2 = 9: rules read both ways.',
      walk: { rows: [
        { value: '18 = 2c', how: 'the output is known this time' },
        { value: 'c = 9', how: 'divide by the rate', result: true },
      ] } },
  ],
  meanMedian: [
    { layout: 'walk', verb: 'again, even count',
      prompt: 'Four days: $6, $8, $5, $9 — the median of an EVEN list.',
      hint: 'Two middles — split the difference.',
      takeaway: 'Even lists average their two middles: 7.',
      walk: { rows: [
        { value: '5, 6, 8, 9', how: 'sorted' },
        { value: '(6+8) ÷ 2 = 7', how: 'the two middles, averaged', result: true },
      ] } },
  ],

  // ---- Grade 7 ----
  propSolve: [
    { layout: 'walk', verb: 'again, messy multiplier',
      prompt: '5 cups use 2 lemons. 8 cups use how many?',
      hint: 'The multiplier isn’t whole this time: 8 ÷ 5.',
      takeaway: '2 × 1.6 = 3.2 lemons: proportions survive messy numbers.',
      walk: { rows: [
        { value: '2/5 = x/8', how: 'lemons per cup, locked' },
        { value: '×1.6', how: '5 → 8' },
        { value: 'x = 3.2', how: 'the lemons follow', result: true },
      ] } },
  ],
  subNeg: [
    { layout: 'walk', verb: 'again, both negative',
      prompt: '−3 − (−7) — a debt removed from a debt.',
      hint: 'Minus a negative is plus.',
      takeaway: '−3 + 7 = 4: removing more debt than you have flips you positive.',
      walk: { rows: [
        { value: '−3 − (−7)', how: 'given' },
        { value: '−3 + 7', how: 'the flip' },
        { value: '4', how: 'above water', result: true },
      ] } },
  ],
  mulInt: [
    { layout: 'walk', verb: 'again, both negative',
      prompt: '(−4) × (−6) — why two wrongs make a right.',
      hint: 'Removing losses IS gaining.',
      takeaway: 'Same signs → positive: 24.',
      walk: { rows: [
        { value: '(−4) × 6 = −24', how: 'four-dollar losses, six times' },
        { value: '(−4) × (−6) = 24', how: 'six of those losses REMOVED', result: true },
      ] } },
  ],
  divInt: [
    { layout: 'walk', verb: 'again, sharing a loss',
      prompt: 'A −$27 day split across 3 partners.',
      hint: 'The loss shares out like any number.',
      takeaway: '−27 ÷ 3 = −9 each.',
      walk: { rows: [{ value: '−9', how: 'each partner’s share of the bad day', result: true }] } },
  ],
  mixedInt: [
    { layout: 'walk', verb: 'again, longer chain',
      prompt: '−8 + 15 − 6 + 4 — a longer ledger.',
      hint: 'Running total, four steps.',
      takeaway: '−8 → 7 → 1 → 5.',
      walk: { rows: [
        { value: '−8 + 15 = 7', how: 'climbed out' },
        { value: '7 − 6 = 1', how: 'nearly spent' },
        { value: '1 + 4 = 5', how: 'ended up', result: true },
      ] } },
  ],
  doubleSub: [
    { layout: 'walk', verb: 'again, starting negative',
      prompt: '−2 − 5 − 3 — already below before the dips.',
      hint: 'Same walk, lower start.',
      takeaway: '−2 → −7 → −10.',
      walk: { rows: [
        { value: '−2 − 5 = −7', how: 'first dip' },
        { value: '−7 − 3 = −10', how: 'second', result: true },
      ] } },
  ],
  addLarger: [
    { layout: 'walk', verb: 'again, positive wins',
      prompt: '18 + (−11) — this time the plus side is bigger.',
      hint: 'Sizes: 18 vs 11. The 18 keeps its sign.',
      takeaway: '18 − 11 = 7, positive.',
      walk: { rows: [{ value: '7', how: 'gap of seven, plus side won', result: true }] } },
  ],
  distrib: [
    { layout: 'walk', verb: 'again, with a minus',
      prompt: '5(x − 3) — the minus rides along.',
      hint: 'The 5 hits the x AND the −3.',
      takeaway: '5x − 15: signs distribute too.',
      walk: { rows: [
        { value: '5 · x = 5x', how: 'first term' },
        { value: '5 · (−3) = −15', how: 'the minus comes with it' },
        { value: '5x − 15', how: 'together', result: true },
      ] } },
  ],
  combineLike: [
    { layout: 'walk', verb: 'again, two letters',
      prompt: '4x + 3y − x + 2y — two kinds of letter now.',
      hint: 'x’s with x’s, y’s with y’s — never across.',
      takeaway: '3x + 5y: apples with apples.',
      walk: { rows: [
        { value: '4x − x = 3x', how: 'the x family' },
        { value: '3y + 2y = 5y', how: 'the y family' },
        { value: '3x + 5y', how: 'they never merge', result: true },
      ] } },
  ],
  twoStepNeg: [
    { layout: 'walk', verb: 'again, negative answer',
      prompt: '4x + 10 = 2 — the answer itself is negative.',
      hint: 'Ten off both sides leaves 4x = −8.',
      takeaway: 'x = −2: nothing about the method changes.',
      walk: { rows: [
        { value: '4x = −8', how: 'ten removed, both sides' },
        { value: 'x = −2', how: 'divide by 4', result: true },
      ] } },
  ],
  tipCalc: [
    { layout: 'walk', verb: 'again, 18%',
      prompt: 'An 18% tip on $25 — build it from three benchmarks.',
      hint: '10% + 5% + half of 5%… or 20% minus 2%.',
      takeaway: '2.50 + 1.25 + 0.75 = $4.50.',
      walk: { rows: [
        { value: '10% = $2.50', how: 'the slide' },
        { value: '5% = $1.25', how: 'half the slide' },
        { value: '3% = $0.75', how: '1% is a quarter; three of them' },
        { value: '$4.50', how: '10 + 5 + 3 makes 18', result: true },
      ] } },
  ],
  discountTax: [
    { layout: 'walk', verb: 'again, does order matter?',
      prompt: '$50 item: 30% off then 8% tax — would tax-first change it?',
      hint: 'Multiply both ways and look.',
      takeaway: '50 × 0.7 × 1.08 = 50 × 1.08 × 0.7 = $37.80 — order doesn’t change the price, only the story.',
      walk: { rows: [
        { value: '50 × 0.70 = 35', how: 'discount first' },
        { value: '35 × 1.08 = 37.80', how: 'then tax' },
        { value: '37.80 either order', how: 'multiplication commutes — the myth dies', result: true },
      ] } },
  ],
  simpleInterest: [
    { layout: 'walk', verb: 'again, Karla’s loan',
      prompt: 'Borrow $40 for the cart at 10% a year, pay back in 6 months.',
      hint: 'Time can be a fraction of a year.',
      takeaway: '40 × 0.10 × 0.5 = $2 interest.',
      walk: { rows: [
        { value: 't = 0.5', how: 'half a year' },
        { value: '40 × 0.10 × 0.5', how: 'P × r × t' },
        { value: '$2', how: 'the cost of borrowing', result: true },
      ] } },
  ],
  pctChange: [
    { layout: 'walk', verb: 'again, a decrease',
      prompt: 'Cups fell from 50 to 38 on the rainy day. Percent DROP?',
      hint: 'Change over original, same as ever.',
      takeaway: '12 ÷ 50 = 24% down.',
      walk: { rows: [
        { value: '50 − 38 = 12', how: 'the drop' },
        { value: '12 ÷ 50 = 0.24', how: 'over the original' },
        { value: '24% decrease', how: 'named honestly', result: true },
      ] } },
  ],
  probSimple: [
    { layout: 'bar', verb: 'again, the flip side',
      prompt: 'If rain is 3 in 10 — shade the chance it DOESN’T rain.',
      hint: 'Everything that isn’t rain.',
      takeaway: 'P(not) = 1 − P: the two shares fill the bar.',
      bar: { parts: 10, target: 7, context: 'Seven dry days of ten — rain’s share and dry’s share make the whole bar.' } },
  ],

  // ---- Grade 8 ----
  powers: [
    { layout: 'walk', verb: 'again, power of one and zero',
      prompt: '5¹ and 5⁰ — the two everyone trips on.',
      hint: 'Count the multiplications: one five… and none.',
      takeaway: '5¹ = 5 and 5⁰ = 1.',
      walk: { rows: [
        { value: '5¹ = 5', how: 'one five, standing alone' },
        { value: '5⁰ = 1', how: 'no fives at all — the multiplicative start', result: true },
      ] } },
  ],
  sciNot: [
    { layout: 'walk', verb: 'again, going tiny',
      prompt: '0.0045 — scientific notation goes small too.',
      hint: 'Slides to the RIGHT count negative.',
      takeaway: '4.5 × 10⁻³.',
      walk: { rows: [
        { value: '0.0045 → 4.5', how: 'three slides right' },
        { value: '4.5 × 10⁻³', how: 'right-slides go in the exponent as minus', result: true },
      ] } },
  ],
  multiStep: [
    { layout: 'walk', verb: 'again, brackets first',
      prompt: '2(x + 3) = 16 — distribute, then peel.',
      hint: 'Open the bracket before anything.',
      takeaway: '2x + 6 = 16 → x = 5.',
      walk: { rows: [
        { value: '2x + 6 = 16', how: 'the 2 dealt in' },
        { value: '2x = 10', how: 'six off both sides' },
        { value: 'x = 5', how: 'halved', result: true },
      ] } },
  ],
  slope2: [
    { layout: 'walk', verb: 'again, through zero',
      prompt: 'Points (0, 0) and (4, 10) — slope from the origin.',
      hint: 'Rise 10, run 4.',
      takeaway: 'Slope 2.5 — through the origin, slope IS the unit rate.',
      walk: { rows: [
        { value: '10 − 0 = 10', how: 'rise' },
        { value: '4 − 0 = 4', how: 'run' },
        { value: '10/4 = 2.5', how: 'per one across', result: true },
      ] } },
  ],
  funcRate: [
    { layout: 'walk', verb: 'again, falling line',
      prompt: 'd = 40 − 10p — read the MINUS rate.',
      hint: 'What does each dollar of price do to demand?',
      takeaway: 'Rate −10: every dollar up costs ten customers.',
      walk: { rows: [
        { value: 'b = 40', how: 'customers at price zero (free lemonade!)' },
        { value: 'm = −10', how: 'each dollar scares off ten', result: true },
      ] } },
  ],
  sysSolve: [
    { layout: 'walk', verb: 'again, substitution',
      prompt: 'y = 3x and x + y = 12 — substitution’s turn.',
      hint: 'Where you see y, write 3x.',
      takeaway: 'x + 3x = 12 → x = 3, y = 9.',
      walk: { rows: [
        { value: 'x + 3x = 12', how: 'y replaced by its rule' },
        { value: '4x = 12 → x = 3', how: 'combined, divided' },
        { value: 'y = 9', how: 'back through the first rule', result: true },
      ] } },
  ],
  funcEval: [
    { layout: 'walk', verb: 'again, negative input',
      prompt: 'f(x) = 2x + 1. f(−3) — feed it a negative.',
      hint: 'The machine doesn’t care what you feed it.',
      takeaway: '2(−3) + 1 = −5.',
      walk: { rows: [
        { value: '2(−3) = −6', how: 'the rule runs on −3' },
        { value: '−6 + 1 = −5', how: 'output', result: true },
      ] } },
  ],
  pythag: [
    { layout: 'walk', verb: 'again, finding a LEG',
      prompt: 'Hypotenuse 13, one leg 5 — find the other.',
      hint: 'The squares subtract when the long side is known.',
      takeaway: '13² − 5² = 144 → 12.',
      walk: { rows: [
        { value: '169 − 25 = 144', how: 'c² minus the known leg²' },
        { value: '√144 = 12', how: 'the missing leg', result: true },
      ] } },
  ],
  approxRoot: [
    { layout: 'line', verb: 'again, higher up',
      prompt: '√75 — tap the whole number just below it.',
      hint: '8² = 64 and 9² = 81.',
      takeaway: '√75 is between 8 and 9, nearer 9.',
      line: { min: 6, max: 11, start: 6, delta: 2, answer: 8, unit: '' } },
  ],
  sqroot: [
    { layout: 'walk', verb: 'again, root of a square',
      prompt: '√(12²) — the undo, undone.',
      hint: 'Square then root lands you home.',
      takeaway: '√144 = 12: the two operations cancel.',
      walk: { rows: [
        { value: '12² = 144', how: 'squared' },
        { value: '√144 = 12', how: 'rooted straight back', result: true },
      ] } },
  ],
};

/* A different REPRESENTATION for the classic wall skills — reached on the
   "another one" path after the second example. When the first picture didn't
   land, don't repeat it louder; change the picture. */
export const PLAN_B = {
  divFrac: [
    { layout: 'walk', verb: 'plan B: money',
      prompt: 'Still foggy? Try it as money. $3 ÷ $0.75 a cup.',
      hint: 'How many 75¢ cups does $3 buy? Same question as 3 ÷ 3/4.',
      takeaway: 'Dividing by a fraction = how many fit — money makes it visible.',
      walk: { rows: [
        { value: '$3.00 ÷ $0.75', how: 'the fraction as cents' },
        { value: '4 cups', how: 'four three-quarters fit in three wholes', result: true },
      ] } },
  ],
  addUnlikeDen: [
    { layout: 'walk', verb: 'plan B: coins',
      prompt: 'Try it as coins: a quarter + a dime, in cents.',
      hint: '1/4 dollar and 1/10 dollar refuse to add as names — cents fix it.',
      takeaway: '25¢ + 10¢ = 35¢ — a common unit is all "common denominator" means.',
      walk: { rows: [
        { value: '1/4 = 25/100 · 1/10 = 10/100', how: 'both as hundredths (cents)' },
        { value: '35/100', how: 'now they add — that’s the whole trick', result: true },
      ] } },
  ],
  subNeg: [
    { layout: 'line', verb: 'plan B: the line',
      prompt: 'On the line: 2 − (−4). Subtraction faces left — the negative turns you around.',
      hint: 'Face left to subtract, then the (−) spins you to face RIGHT. Walk 4.',
      takeaway: 'Two turnarounds face you up the line: 2 − (−4) = 6.',
      line: { min: -2, max: 8, start: 2, delta: 4, answer: 6, unit: '' } },
  ],
  twoStep: [
    { layout: 'walk', verb: 'plan B: the scale',
      prompt: 'Picture a balance scale: 2t + 5 = 29.',
      hint: 'Both pans stay level only if you do the same to each.',
      takeaway: 'Equations are balanced scales — every move is to BOTH pans.',
      walk: { rows: [
        { value: 'left pan: 2t and a 5-block', how: 'right pan: 29' },
        { value: 'lift 5 off each pan', how: 'still level: 2t | 24' },
        { value: 'halve each pan', how: 't | 12 — the scale never lied', result: true },
      ] } },
  ],
  pctOf: [
    { layout: 'bar', verb: 'plan B: the bar',
      prompt: 'See 30% of 60 on the bar instead.',
      hint: 'Ten pieces of 6 each. Shade three.',
      takeaway: 'Three pieces of six: 18. Percent is just pieces of ten.',
      bar: { parts: 10, target: 3, context: 'The bar is 60; each piece is worth 6. Shade 30% — three pieces.' } },
  ],
  findWhole: [
    { layout: 'bar', verb: 'plan B: the bar backwards',
      prompt: 'The shaded 3 pieces are worth 15. What’s the WHOLE bar?',
      hint: 'If three pieces are 15, one piece is 5.',
      takeaway: 'One piece = 5, ten pieces = 50: rebuild from the piece.',
      bar: { parts: 10, target: 3, context: 'Shaded = 30% = 15. Read one piece, then the whole bar.' } },
  ],
  fracOfSet: [
    { layout: 'walk', verb: 'plan B: deal them out',
      prompt: 'Deal 12 cookies onto 4 plates, one at a time.',
      hint: '3/4 of 12 = keep three of the four plates.',
      takeaway: 'Dealing makes the shares real: 3 plates of 3 = 9.',
      walk: { rows: [
        { value: '12 dealt on 4 plates', how: 'three land on each' },
        { value: 'keep 3 plates', how: '3 × 3 = 9 cookies', result: true },
      ] } },
  ],
  decDiv: [
    { layout: 'walk', verb: 'plan B: cents',
      prompt: 'Everything in cents: 7.2 ÷ 0.8 becomes 720¢ ÷ 80¢.',
      hint: 'Sliding the points is just switching to cents.',
      takeaway: '720 ÷ 80 = 9 — the slide was a unit change all along.',
      walk: { rows: [
        { value: '720 ÷ 80', how: 'dollars become cents, both sides' },
        { value: '9', how: 'same answer, no decimals in sight', result: true },
      ] } },
  ],
  multiStep: [
    { layout: 'walk', verb: 'plan B: undo the story',
      prompt: 'Think of 5x − 7 = 2x + 20 as two kids earning: when are they even?',
      hint: 'One earns 5/day but owes 7; one earns 2/day with 20 saved.',
      takeaway: 'Gaining 3/day on a 27 gap takes 9 days — algebra is a story about catching up.',
      walk: { rows: [
        { value: 'gap: 20 + 7 = 27', how: 'what the faster earner must make up' },
        { value: 'gain: 5 − 2 = 3/day', how: 'how fast the gap closes' },
        { value: '27 ÷ 3 = 9', how: 'days to even — the same x = 9', result: true },
      ] } },
  ],
  probSimple: [
    { layout: 'walk', verb: 'plan B: run the days',
      prompt: 'Imagine the next 100 fair days. How many bring rain at 3-in-10?',
      hint: 'Stretch the 10-day picture to 100.',
      takeaway: '30 of 100 — probability is just long-run counting.',
      walk: { rows: [
        { value: '3 of every 10', how: 'the forecast’s claim' },
        { value: '30 of 100', how: 'the same share, longer run — that IS 30%', result: true },
      ] } },
  ],
};

/** Second example for a skill, with plan-B representation appended for wall skills. */
export function moreStepsFor(skill) {
  const second = SECOND_EXAMPLES[skill];
  if (!second) return null;
  return PLAN_B[skill] ? [...second, ...PLAN_B[skill]] : second;
}
