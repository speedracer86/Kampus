/* Karla's voice — the speak-script bank (owner-authored, like everything here).

   One entry per skill:
     steps — aligned 1:1 with teachStepsFor(skill) (the base sequence, Try it last)
     more  — aligned 1:1 with SECOND_EXAMPLES[skill] (spliced in by the seam)

   Each step is { lines: [{ say, cue }] }: short spoken utterances (APD rule —
   one idea per line, nothing over ~110 characters) paired with ONE visual act
   on the math. The cue vocabulary, validated in speak.test.js:

     prompt            highlight the prompt
     takeaway          open/pulse the takeaway band
     bar.pieces        draw the parts        bar.shade   fill the target
     bar.pulse         pulse all pieces
     line.draw         draw the line         line.start  mark the start
     line.hop          animate the jump      line.land   mark the answer
     row.N             reveal walk row N (1-based)
     card.N            spotlight faceoff card N (1-based)
     pick              invite the pick / the try

   These scripts are written to be SPOKEN — contractions, breath, one beat per
   line — and are the source text for the generated clips (see
   docs/VOICE_PASS.md). The say-it-show-it law: while a line plays, its cue is
   the only thing on screen that moves.

   Coverage grows in tranches; speak.test.js pins what is authored. Tranches 1-2:
   the four reference skills, then all of grades 6 and 7, so the whole pipeline can be built and tested
   end to end before the full bank lands. */

export const SPEAK = {
  // ---- bar · The Kitchen ----
  eqFrac: {
    steps: [
      { lines: [
        { say: 'Here’s a pan of brownies, cut into three equal pieces.', cue: 'bar.pieces' },
        { say: 'Go ahead — shade two of the three.', cue: 'bar.shade' },
        { say: 'That’s what two-thirds means. Two pieces, out of three.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Same pan. But now we cut it into twelve skinny pieces.', cue: 'bar.pieces' },
        { say: 'Here’s the game: shade the SAME amount of pan as before.', cue: 'prompt' },
        { say: 'Each old piece became four skinny ones. Two old pieces… eight skinny ones.', cue: 'bar.shade' },
        { say: 'Two-thirds and eight-twelfths. Different names, same brownies.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'So what did the numbers do while we were cutting?', cue: 'prompt' },
        { say: 'The bottom went times four — three pieces became twelve.', cue: 'row.2' },
        { say: 'And the top HAD to go times four too, or the amount would change.', cue: 'row.3' },
        { say: 'Multiply top and bottom by the same number, and the fraction keeps its size.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Your turn. Two-thirds equals something over twelve.', cue: 'prompt' },
        { say: 'Shade it, then read the top number right off the bar.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'One more, backwards this time. Shade six of these eight.', cue: 'bar.shade' },
        { say: 'Now squint. Six-eighths is just three-quarters wearing a longer name.', cue: 'bar.pulse' },
        { say: 'Dividing top and bottom shrinks the name — never the amount.', cue: 'takeaway' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Another look. Six eighths shaded on the bar\u2026', cue: 'row.1' },
      { say: 'Squint: it\u2019s three quarters wearing a longer name. The amount never changed.', cue: 'row.2' },
    ] },
  },

  // ---- faceoff · The Market ----
  unitRate: {
    steps: [
      { lines: [
        { say: 'Two bags of lemons. Which one’s actually the better buy?', cue: 'prompt' },
        { say: 'Don’t compare the price tags — bags are different sizes. Compare the price for ONE lemon.', cue: 'card.1' },
        { say: 'Divide each price by its count, and pick the cheaper per-lemon bag.', cue: 'pick' },
      ] },
      { lines: [
        { say: 'Here’s how that per-one price comes out.', cue: 'prompt' },
        { say: 'Bag A: five-forty split across twelve lemons… forty-five cents each.', cue: 'row.2' },
        { say: 'Bag B: three-forty-four across eight… forty-three cents each. Cheaper.', cue: 'row.4' },
        { say: 'Price divided by count. That’s the for-ONE price, and it makes every comparison fair.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Your turn — cup sizes this time.', cue: 'prompt' },
        { say: 'Careful: the big cup LOOKS like the deal. Divide before you decide.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Rates aren’t just prices. Forty-two dollars for three hours of pet-sitting — what’s your rate?', cue: 'prompt' },
        { say: 'Money divided by hours: fourteen dollars an hour.', cue: 'row.2' },
        { say: 'Now you can compare ANY job against any other. That’s what a unit rate is for.', cue: 'takeaway' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Rates aren\u2019t just lemons. Forty-two dollars for three hours of pet-sitting\u2026', cue: 'row.1' },
      { say: 'Fourteen an hour. Split to the for-ONE and anything can be compared.', cue: 'row.2' },
    ] },
  },

  // ---- line · Outside ----
  addInt: {
    steps: [
      { lines: [
        { say: 'It’s eight degrees out. Then it drops three.', cue: 'line.start' },
        { say: 'A drop is a step DOWN the line. Tap where it lands.', cue: 'pick' },
        { say: 'Adding a negative is just stepping down.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Why down and not up? Look at the signs.', cue: 'prompt' },
        { say: 'You started at eight.', cue: 'row.1' },
        { say: 'The negative three points down the line — that’s all a minus sign is. A direction.', cue: 'row.2' },
        { say: 'Three steps down from eight is five. Same journey as eight minus three.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Your turn. Negative four, plus nine.', cue: 'line.start' },
        { say: 'Start below zero. Nine steps up this time. Tap your landing spot.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Once more, starting in the hole. Negative six, plus four.', cue: 'line.start' },
        { say: 'Climb four… and notice you’re still below zero. Tap it.', cue: 'pick' },
        { say: 'Climbing from below zero can still leave you below. The line never lies.', cue: 'takeaway' },
      ] },
    ],
    reteach: { lines: [
      { say: 'One more, starting below zero: minus six, plus four.', cue: 'row.1' },
      { say: 'Climb four steps up\u2026', cue: 'row.2' },
      { say: '\u2026and you\u2019re at minus two. Climbing can still leave you below. The line never lies.', cue: 'row.3' },
    ] },
  },

  // ---- walk · The Workshop ----
  twoStep: {
    steps: [
      { lines: [
        { say: 'Two t plus five equals twenty-nine. Looks busy. It’s two moves.', cue: 'row.1' },
        { say: 'The plus five is on the outside, so peel it first — off BOTH sides.', cue: 'row.2' },
        { say: 'Now it’s just two t equals twenty-four.', cue: 'row.3' },
        { say: 'One multiply left. Divide both sides by two…', cue: 'row.4' },
        { say: 't is twelve. Outside in, every time.', cue: 'row.5' },
      ] },
      { lines: [
        { say: 'But is twelve actually right? Don’t hope — check.', cue: 'prompt' },
        { say: 'Put twelve back in where t was.', cue: 'row.1' },
        { say: 'Two twelves is twenty-four, plus five…', cue: 'row.2' },
        { say: 'Twenty-nine. The exact number you were told. THAT’s how you know.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Your turn. Three x plus four equals nineteen.', cue: 'prompt' },
        { say: 'Same two moves: clear the four, then divide by three. Walk it down.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'One more, with a minus in it. Three n MINUS four equals seventeen.', cue: 'row.1' },
        { say: 'Undo a minus by adding — four back onto both sides. Twenty-one.', cue: 'row.2' },
        { say: 'Divide by three. n is seven. The peel doesn’t care about the sign.', cue: 'row.3' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Picture a balance scale: two t and a five-block on one pan, twenty-nine on the other.', cue: 'row.1' },
      { say: 'Lift a five off EACH pan \u2014 still level.', cue: 'row.2' },
      { say: 'Halve each pan: t is twelve. Every move goes to both pans. That\u2019s the whole game.', cue: 'row.3' },
    ] },
  },

  // ================= Tranche 2 · Grade 6 =================
  simplifyRatio: {
    steps: [
      { lines: [
        { say: 'Twelve to eighteen. Both of those can be split by six.', cue: 'row.1' },
        { say: 'So it shrinks to two to three. Same deal — smaller words.', cue: 'row.2' },
        { say: 'Split both sides by the same number, and the deal never changes.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Your turn — shrink ten to fifteen.', cue: 'prompt' },
        { say: 'What number goes into both ten AND fifteen?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Twenty-four to thirty-six. Don\u2019t see the big shrink? Take small bites.', cue: 'row.1' },
        { say: 'Half it first. Then split by six. Two to three — same place, smaller steps.', cue: 'row.2' },
      ] },
    ],
  },
  ratioShare: {
    steps: [
      { lines: [
        { say: 'Twenty dollars to split, two-to-three. First count the shares: two plus three is five.', cue: 'row.1' },
        { say: 'Twenty split five ways — each share is four dollars.', cue: 'row.2' },
        { say: 'Deal them out. Eight for you, twelve for your partner.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Your turn: twenty-four cookies, split one-to-two.', cue: 'prompt' },
        { say: 'How many shares are there in all?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Three partners now — one, two, and three shares of thirty-six dollars.', cue: 'row.1' },
        { say: 'Six shares in all, so one share is six dollars.', cue: 'row.2' },
        { say: 'Six, twelve, eighteen. More partners, same move.', cue: 'row.3' },
      ] },
    ],
  },
  easyPct: {
    steps: [
      { lines: [
        { say: 'Ten percent is the magic move. Shade one piece of the ten.', cue: 'bar.shade' },
        { say: 'One piece out of ten. That\u2019s all ten percent is.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Twenty percent of forty-five — built from the ten percent move.', cue: 'prompt' },
        { say: 'Ten percent of forty-five is four and a half.', cue: 'row.1' },
        { say: 'Twenty percent is two of those. Nine.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Your turn. Ten percent of thirty-eight dollars.', cue: 'prompt' },
        { say: 'Just slide — no hard work needed.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Fifteen percent of sixty, with moves you already own.', cue: 'prompt' },
        { say: 'Ten percent is six.', cue: 'row.1' },
        { say: 'Five percent is half of that — three.', cue: 'row.2' },
        { say: 'Six plus three: nine. The pieces snap together.', cue: 'row.3' },
      ] },
    ],
  },
  pctOf: {
    steps: [
      { lines: [
        { say: 'Twenty-five percent — shade a quarter of the bar.', cue: 'bar.shade' },
        { say: '\u201CPercent of\u201D means: keep that much of it.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Twenty-five percent of two dollars, in numbers this time.', cue: 'prompt' },
        { say: 'Twenty-five percent written as a decimal is point two five.', cue: 'row.1' },
        { say: '\u201COf\u201D means times.', cue: 'row.2' },
        { say: 'A quarter of two dollars: fifty cents.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Your turn: thirty percent of sixty.', cue: 'prompt' },
        { say: 'Point three, times sixty.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Sixty percent of forty-five — bigger percents work the exact same way.', cue: 'prompt' },
        { say: 'Point six, times forty-five…', cue: 'row.1' },
        { say: 'Twenty-seven. Or do ten percent six times — both roads land together.', cue: 'row.2' },
      ] },
    ],
    reteach: { lines: [
      { say: 'See it on the bar instead. The bar is worth sixty; each piece is worth six.', cue: 'row.1' },
      { say: 'Thirty percent is three pieces: eighteen. Percent is just pieces of ten.', cue: 'row.2' },
    ] },
  },
  findWhole: {
    steps: [
      { lines: [
        { say: 'Fifteen is thirty percent of some number. Let\u2019s rebuild the whole thing.', cue: 'row.1' },
        { say: 'If thirty percent is fifteen, then ten percent is five.', cue: 'row.2' },
        { say: 'And the whole hundred percent? Ten fives. Fifty.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Twelve is twenty-five percent of what number?', cue: 'prompt' },
        { say: 'If a quarter is twelve, how many quarters make the whole?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Eighteen kids is sixty percent of the class. How big is the class?', cue: 'row.1' },
        { say: 'Ten percent of the class is three kids.', cue: 'row.2' },
        { say: 'Ten of those: thirty kids.', cue: 'row.3' },
      ] },
    ],
    reteach: { lines: [
      { say: 'The bar, backwards. The shaded three pieces are worth fifteen.', cue: 'row.1' },
      { say: 'So one piece is five \u2014 and ten pieces is fifty. Rebuild from the piece.', cue: 'row.2' },
    ] },
  },
  frac2pct: {
    steps: [
      { lines: [
        { say: 'Shade two fifths of the bar.', cue: 'bar.shade' },
        { say: 'Out of one hundred, each fifth is worth twenty. Two of them? Forty percent.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Three quarters, as a percent.', cue: 'prompt' },
        { say: 'Think: quarters of one hundred.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Seven twentieths as a percent — twenty fits into one hundred nicely.', cue: 'row.1' },
        { say: 'Times five, top and bottom: thirty-five out of one hundred. Thirty-five percent.', cue: 'row.2' },
      ] },
    ],
  },
  divFrac: {
    steps: [
      { lines: [
        { say: 'Three and a half bags, scooped out in quarter-size scoops. How many scoops fit?', cue: 'bar.pieces' },
        { say: 'Count them — each whole bag holds four scoops.', cue: 'bar.shade' },
        { say: 'Dividing by a fraction just asks: how many fit?', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Same answer, with the flip trick.', cue: 'prompt' },
        { say: 'Flip the quarter into a four, and multiply.', cue: 'row.1' },
        { say: 'Fourteen. The flip is just the fast way to count the fits.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Two, divided by two-thirds.', cue: 'prompt' },
        { say: 'Flip it: two, times three over two.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'How many eighth-size scoops fit in three quarters?', cue: 'row.1' },
        { say: 'Flip the eighth into an eight: six scoops fit. That\u2019s all the flip ever does.', cue: 'row.2' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Try it as money. Three dollars, and cups cost seventy-five cents.', cue: 'row.1' },
      { say: 'How many cups does three dollars buy? Four. That\u2019s all dividing by a fraction asks \u2014 how many fit.', cue: 'row.2' },
    ] },
  },
  cmpInt: {
    steps: [
      { lines: [
        { say: 'Minus three out, or minus eight — which is warmer? Look at the line.', cue: 'line.draw' },
        { say: 'Farther right is always bigger, even under zero. Tap the warmer one.', cue: 'pick' },
        { say: 'Right means bigger. Always.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Which is bigger: minus two, or minus seven?', cue: 'prompt' },
        { say: 'Think money. Would you rather owe two dollars, or seven?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Owing five dollars, or owing two — which account is bigger?', cue: 'row.1' },
        { say: 'Minus two wins. The smaller debt is the bigger number.', cue: 'row.2' },
      ] },
    ],
  },
  absVal: {
    steps: [
      { lines: [
        { say: 'You\u2019re standing at minus six. How far is home — zero?', cue: 'line.start' },
        { say: 'Walk it, counting steps.', cue: 'line.hop' },
        { say: 'Six steps. Distance is never negative.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'The absolute value of minus fifteen.', cue: 'prompt' },
        { say: 'Just ask: how far from zero?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Seven, and minus seven. The twins.', cue: 'row.1' },
        { say: 'Seven steps right of zero, seven steps left — the same distance. Same absolute value.', cue: 'row.2' },
      ] },
    ],
  },
  subToNeg: {
    steps: [
      { lines: [
        { say: 'You have three. You take away eight. Watch the line.', cue: 'line.start' },
        { say: 'Down three to zero… and keep going. Five more.', cue: 'line.hop' },
        { say: 'You land below zero. And that\u2019s allowed.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Two, take away nine.', cue: 'prompt' },
        { say: 'Two gets you to zero. How many steps keep going?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'It\u2019s four degrees out, and the temperature falls nine.', cue: 'line.start' },
        { say: 'Tap tonight\u2019s low. Weather does this all winter.', cue: 'pick' },
      ] },
    ],
  },
  evalTwoVar: {
    steps: [
      { lines: [
        { say: 'Three a plus b — and a is two, b is five.', cue: 'prompt' },
        { say: 'Both letters get their numbers.', cue: 'row.1' },
        { say: 'Three twos is six, plus five: eleven.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Two a plus three b, when a is four and b is one.', cue: 'prompt' },
        { say: 'Eight, plus three.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Four a minus two b, with a three and b five.', cue: 'row.1' },
        { say: 'Four threes minus two fives: twelve minus ten. Two. Watch that minus.', cue: 'row.2' },
      ] },
    ],
  },
  oneStepAdd: {
    steps: [
      { lines: [
        { say: 'x plus seven is twelve. Seven got added to x — so we undo it.', cue: 'row.1' },
        { say: 'Take seven away from BOTH sides. Fair is fair.', cue: 'row.2' },
        { say: 'x is five, standing alone.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'x plus nine is fourteen.', cue: 'prompt' },
        { say: 'Take nine off both sides.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'This time x LOST six: x minus six is nine.', cue: 'row.1' },
        { say: 'Six was taken away — give it back. To both sides.', cue: 'row.2' },
        { say: 'x is fifteen. Undo a minus with a plus.', cue: 'row.3' },
      ] },
    ],
  },
  oneStepMul: {
    steps: [
      { lines: [
        { say: 'Four x is twenty-eight. x got multiplied by four.', cue: 'row.1' },
        { say: 'Divide both sides by four — that\u2019s the undo.', cue: 'row.2' },
        { say: 'x is seven.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Six x is forty-two.', cue: 'prompt' },
        { say: 'Divide both sides by six.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'x divided by four is eight — x got cut into four pieces.', cue: 'row.1' },
        { say: 'Multiply both sides by four to put it back together.', cue: 'row.2' },
        { say: 'x is thirty-two. Whole again.', cue: 'row.3' },
      ] },
    ],
  },
  depVar: {
    steps: [
      { lines: [
        { say: 'Money follows cups: m is two times c. Say you sell six cups.', cue: 'row.1' },
        { say: 'The rule turns cups into money: two times six.', cue: 'row.2' },
        { say: 'Twelve dollars. Cups drive; money follows.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'm is two c. You sell seven cups — how much money?', cue: 'prompt' },
        { say: 'Feed the seven in.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'You made eighteen dollars. How many cups was that?', cue: 'row.1' },
        { say: 'The rule runs backwards too: nine cups.', cue: 'row.2' },
      ] },
    ],
  },
  meanMedian: {
    steps: [
      { lines: [
        { say: 'Five days of profit: four, six, five, FORTY, five. \u201CWe average twelve dollars!\u201D Hmm.', cue: 'prompt' },
        { say: 'The average does say twelve — but that one wild forty dragged it up.', cue: 'row.1' },
        { say: 'Line the days up in order.', cue: 'row.2' },
        { say: 'The middle day is five. THAT\u2019s what a normal day looks like.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Find the middle of three, nine, seven.', cue: 'prompt' },
        { say: 'Put them in order first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Four days: six, eight, five, nine. An EVEN list has two middles.', cue: 'row.1' },
        { say: 'Sort them, find the two middles, and split the difference: seven.', cue: 'row.2' },
      ] },
    ],
  },

  // ================= Tranche 2 · Grade 7 =================
  propSolve: {
    steps: [
      { lines: [
        { say: 'Three customers show up for every two posts. She posts eight.', cue: 'row.1' },
        { say: 'Two became eight — that\u2019s times four.', cue: 'row.2' },
        { say: 'So the three gets times four too. Stock for twelve.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Two fifths equals x over twenty.', cue: 'prompt' },
        { say: 'Five became twenty. What has to happen to the two?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Five cups use two lemons. Eight cups use how many?', cue: 'row.1' },
        { say: 'Five to eight is times one point six. Messy numbers are fine.', cue: 'row.2' },
        { say: 'Two times one point six: three point two lemons.', cue: 'row.3' },
      ] },
    ],
  },
  subNeg: {
    steps: [
      { lines: [
        { say: 'Five, take away minus three. You\u2019re removing a debt.', cue: 'line.start' },
        { say: 'Taking a debt away pushes you UP. Tap where you land.', cue: 'pick' },
        { say: 'Taking away a minus is the same as adding.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Four, minus minus six.', cue: 'prompt' },
        { say: 'Two minuses right next to each other turn into a plus.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Minus three, take away minus seven. A debt removed from a debt.', cue: 'row.1' },
        { say: 'Flip it: minus three, plus seven.', cue: 'row.2' },
        { say: 'Four. Remove more debt than you had, and you flip to the plus side.', cue: 'row.3' },
      ] },
    ],
    reteach: { lines: [
      { say: 'On the line: two, take away minus four.', cue: 'row.1' },
      { say: 'Taking away turns you around \u2014 and the minus turns you around AGAIN.', cue: 'row.2' },
      { say: 'Two turnarounds face you UP the line: six.', cue: 'row.3' },
    ] },
  },
  mulInt: {
    steps: [
      { lines: [
        { say: 'Minus three, times four. Sign first, size second.', cue: 'prompt' },
        { say: 'The signs don\u2019t match — so the answer will be negative.', cue: 'row.1' },
        { say: 'Sizes: three times four is twelve.', cue: 'row.2' },
        { say: 'Put the sign back on. Minus twelve.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Minus five, times six.', cue: 'prompt' },
        { say: 'Do the signs match?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Minus four times minus six — why do two minuses make a plus?', cue: 'row.1' },
        { say: 'Losing four dollars six times is bad. But REMOVING those six losses? You GAIN twenty-four.', cue: 'row.2' },
      ] },
    ],
  },
  divInt: {
    steps: [
      { lines: [
        { say: 'Minus twenty-four, split by six. Division keeps the same sign rules.', cue: 'prompt' },
        { say: 'Signs don\u2019t match: negative.', cue: 'row.1' },
        { say: 'Twenty-four split by six is four.', cue: 'row.2' },
        { say: 'Minus four.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Minus thirty-six, divided by minus nine.', cue: 'prompt' },
        { say: 'The signs match this time.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'A twenty-seven dollar loss, split across three partners: nine of loss each.', cue: 'row.1' },
      ] },
    ],
  },
  mixedInt: {
    steps: [
      { lines: [
        { say: 'Twelve minus five plus eight minus nine minus three. Read it like your money book.', cue: 'prompt' },
        { say: 'Twelve minus five: seven.', cue: 'row.1' },
        { say: 'Plus eight: fifteen.', cue: 'row.2' },
        { say: 'Minus nine: six.', cue: 'row.3' },
        { say: 'Minus three: three. The week, settled.', cue: 'row.4' },
      ] },
      { lines: [
        { say: 'Minus five, plus twelve, minus four.', cue: 'prompt' },
        { say: 'One step at a time, left to right.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'A longer week: minus eight, plus fifteen, minus six, plus four.', cue: 'prompt' },
        { say: 'Climb out first: minus eight plus fifteen is seven.', cue: 'row.1' },
        { say: 'Down to one…', cue: 'row.2' },
        { say: '…and up to five. One step at a time, always.', cue: 'row.3' },
      ] },
    ],
  },
  doubleSub: {
    steps: [
      { lines: [
        { say: 'Seven, minus ten, minus four. Two dips.', cue: 'line.start' },
        { say: 'The first dip lands at minus three. Then four more down.', cue: 'line.hop' },
        { say: 'A chain of minuses is just steps. No panic.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Three, minus eight, minus two.', cue: 'prompt' },
        { say: 'Do three minus eight first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Start already in the hole: minus two, minus five, minus three.', cue: 'row.1' },
        { say: 'Minus two, down five, is minus seven. Three more down: minus ten.', cue: 'row.2' },
      ] },
    ],
  },
  addLarger: {
    steps: [
      { lines: [
        { say: 'Minus fourteen, plus nine. A tug of war.', cue: 'line.start' },
        { say: 'The fourteen side is stronger. The gap between them is your answer\u2019s size.', cue: 'line.hop' },
        { say: 'Different signs? The bigger side wins — and keeps its sign.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Minus twenty, plus thirteen.', cue: 'prompt' },
        { say: 'Which side is stronger?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Eighteen plus minus eleven — this time the PLUS side is stronger. The gap is seven.', cue: 'row.1' },
      ] },
    ],
  },
  distrib: {
    steps: [
      { lines: [
        { say: 'Four friends each order a lemonade AND a cookie. Ring it all up in one go.', cue: 'prompt' },
        { say: 'Four lemonades: ten dollars.', cue: 'row.1' },
        { say: 'Four cookies: seven.', cue: 'row.2' },
        { say: 'Seventeen. The outside number visits everything inside.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Open up three times x plus five.', cue: 'prompt' },
        { say: 'The three visits the x AND the five.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Five times x minus three — the minus rides along.', cue: 'row.1' },
        { say: 'Five x\u2019s… and five visits the minus three too: minus fifteen.', cue: 'row.2' },
        { say: 'Five x minus fifteen. Signs travel with their numbers.', cue: 'row.3' },
      ] },
    ],
  },
  combineLike: {
    steps: [
      { lines: [
        { say: 'Three x, plus two, plus five x. Sort it.', cue: 'prompt' },
        { say: 'The x\u2019s find each other: three and five make eight x.', cue: 'row.1' },
        { say: 'The plain two stays by itself.', cue: 'row.2' },
        { say: 'Eight x plus two. Tidy.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Seven y plus four, minus two y.', cue: 'prompt' },
        { say: 'The y\u2019s go together.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Two kinds of letters now: x\u2019s and y\u2019s.', cue: 'row.1' },
        { say: 'X\u2019s together: three x. Y\u2019s together: five y.', cue: 'row.2' },
        { say: 'Three x plus five y. Apples with apples — they never mix.', cue: 'row.3' },
      ] },
    ],
  },
  twoStepNeg: {
    steps: [
      { lines: [
        { say: 'Minus two x, plus six, is fourteen. Same peel as always.', cue: 'row.1' },
        { say: 'Six off both sides: minus two x is eight.', cue: 'row.2' },
        { say: 'Divide by minus two. x is minus four — the minus just rides along.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Minus three x, plus five, is twenty.', cue: 'prompt' },
        { say: 'Clear the five first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Four x plus ten is two. Yes — the answer itself can be negative.', cue: 'row.1' },
        { say: 'Ten off both sides, divide by four: x is minus two. The moves never change.', cue: 'row.2' },
      ] },
    ],
  },
  tipCalc: {
    steps: [
      { lines: [
        { say: 'A fifteen percent tip on twelve dollars — no calculator, promise.', cue: 'prompt' },
        { say: 'Ten percent: slide to a dollar twenty.', cue: 'row.1' },
        { say: 'Five percent is half of that: sixty cents.', cue: 'row.2' },
        { say: 'A dollar eighty. Done in your head.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Twenty percent tip on thirty-five dollars.', cue: 'prompt' },
        { say: 'Ten percent… twice.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Eighteen percent on twenty-five dollars — snap it together from pieces.', cue: 'prompt' },
        { say: 'Ten percent: two fifty.', cue: 'row.1' },
        { say: 'Five percent: a dollar twenty-five.', cue: 'row.2' },
        { say: 'Three percent: seventy-five cents.', cue: 'row.3' },
        { say: 'Ten plus five plus three makes eighteen: four dollars fifty.', cue: 'row.4' },
      ] },
    ],
  },
  discountTax: {
    steps: [
      { lines: [
        { say: 'Twenty percent off two fifty, then ten percent tax. He bets it comes back even.', cue: 'prompt' },
        { say: 'Discount first: down to two dollars.', cue: 'row.1' },
        { say: 'The tax lands on the NEW price, not the old one.', cue: 'row.2' },
        { say: 'Two twenty. He owes you a cookie.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Ten percent off forty dollars, then five percent tax.', cue: 'prompt' },
        { say: 'Get the sale price first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Does the order change the price? Check both ways.', cue: 'prompt' },
        { say: 'Discount first: fifty becomes thirty-five. Then tax: thirty-seven eighty.', cue: 'row.1' },
        { say: 'Now flip the order…', cue: 'row.2' },
        { say: 'Thirty-seven eighty again. The order changes the story, never the price.', cue: 'row.3' },
      ] },
    ],
  },
  simpleInterest: {
    steps: [
      { lines: [
        { say: 'Borrow two hundred dollars at five percent, for two years. What does borrowing cost?', cue: 'prompt' },
        { say: 'One year costs five percent of two hundred: ten dollars.', cue: 'row.1' },
        { say: 'Two years is two of those.', cue: 'row.2' },
        { say: 'Twenty dollars. That\u2019s the price of borrowing.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'One hundred dollars at four percent, for three years.', cue: 'prompt' },
        { say: 'Four dollars a year.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Karla borrows forty for the cart — ten percent a year, paid back in half a year.', cue: 'row.1' },
        { say: 'Half a year means the time is point five.', cue: 'row.2' },
        { say: 'Forty, times ten percent, times a half: two dollars.', cue: 'row.3' },
      ] },
    ],
  },
  pctChange: {
    steps: [
      { lines: [
        { say: 'Forty cups grew to fifty. What percent did you grow?', cue: 'prompt' },
        { say: 'The change: ten more cups.', cue: 'row.1' },
        { say: 'Divide by where you STARTED — forty.', cue: 'row.2' },
        { say: 'A quarter more. Twenty-five percent.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'From twenty to twenty-six. What percent did it grow?', cue: 'prompt' },
        { say: 'Six, divided by twenty.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Rainy day: fifty cups fell to thirty-eight. What percent DROP?', cue: 'row.1' },
        { say: 'The drop is twelve — out of the original fifty.', cue: 'row.2' },
        { say: 'Twenty-four percent down. Name it honestly.', cue: 'row.3' },
      ] },
    ],
  },
  probSimple: {
    steps: [
      { lines: [
        { say: 'Three rain days out of the next ten. Shade the risk.', cue: 'bar.shade' },
        { say: 'Chance is: ways it happens, out of all the ways there are.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Eight marbles in the bag, two of them red. The chance of red, as a percent?', cue: 'prompt' },
        { say: 'Two out of eight.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'If rain is three in ten… shade the chance it DOESN\u2019T rain.', cue: 'bar.shade' },
        { say: 'Seven dry days. Rain\u2019s share and dry\u2019s share fill the whole bar.', cue: 'takeaway' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Imagine the next one hundred days. Three rain days in every ten\u2026', cue: 'row.1' },
      { say: '\u2026is thirty in a hundred. Chance is just long-run counting.', cue: 'row.2' },
    ] },
  },

  // ---- cross-grade skills the grade 6-7 hybrid units teach ----
  scaleRecipe: {
    steps: [
      { lines: [
        { say: 'The recipe makes eight cups. Market Day needs twenty.', cue: 'prompt' },
        { say: 'Twenty divided by eight: the batch grows by two and a half times.', cue: 'row.1' },
        { say: 'EVERY ingredient grows by the same amount. Two cups of sugar…', cue: 'row.2' },
        { say: '…becomes five.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'A recipe for six uses three eggs. You need ten servings.', cue: 'prompt' },
        { say: 'How much did the batch grow? Start there.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'It shrinks too. The recipe serves twelve; you only need four.', cue: 'row.1' },
        { say: 'Four out of twelve is a third — so three cups of flour becomes one.', cue: 'row.2' },
      ] },
    ],
  },
  decMul: {
    steps: [
      { lines: [
        { say: 'Point three five, times forty. Multiply first — place the point last.', cue: 'prompt' },
        { say: 'Pretend the point isn\u2019t there: thirty-five times forty is fourteen hundred.', cue: 'row.1' },
        { say: 'Now count the decimal digits you ignored: two.', cue: 'row.2' },
        { say: 'Walk the point two spots in: fourteen.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Point two five, times twelve.', cue: 'prompt' },
        { say: 'Twenty-five times twelve first. Then place the point.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Point four times point six — watch the answer get SMALLER.', cue: 'row.1' },
        { say: 'Four sixes is twenty-four, two decimal digits: point two four. A part of a part shrinks.', cue: 'row.2' },
      ] },
    ],
  },
  decDiv: {
    steps: [
      { lines: [
        { say: 'Seven point two, divided by point eight. Make the dividing number whole first.', cue: 'row.1' },
        { say: 'Slide BOTH points once: now it\u2019s seventy-two divided by eight. Same question.', cue: 'row.2' },
        { say: 'Nine. Just ordinary dividing now.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Four point five, divided by point five.', cue: 'prompt' },
        { say: 'Slide both points once.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'With money it\u2019s easy to see: six thirty, and cups cost ninety cents.', cue: 'row.1' },
        { say: 'How many cups did you sell? Slide both: sixty-three divided by nine. Seven cups.', cue: 'row.2' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Everything in cents: seven twenty split by eighty cents.', cue: 'row.1' },
      { say: 'Seven hundred twenty split by eighty: nine. The point-slide was just switching to cents.', cue: 'row.2' },
    ] },
  },
  frac2dec: {
    steps: [
      { lines: [
        { say: 'Shade three quarters — and think in hundredths while you do.', cue: 'bar.shade' },
        { say: 'Three quarters of one hundred is seventy-five. So three fourths is point seven five.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'One fifth, as a decimal.', cue: 'prompt' },
        { say: 'Make the bottom a ten first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Three fifths — fifths double into tenths.', cue: 'row.1' },
        { say: 'Six tenths: point six.', cue: 'row.2' },
      ] },
    ],
  },
  dec2frac: {
    steps: [
      { lines: [
        { say: 'Point two five. Say it the proper way: twenty-five hundredths.', cue: 'row.1' },
        { say: 'You just said the fraction. Write it: twenty-five over one hundred.', cue: 'row.2' },
        { say: 'Shrink it — both split by twenty-five. One quarter.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Point six, as a fraction.', cue: 'prompt' },
        { say: 'Say it out loud first: six tenths.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Point seven five, said properly: seventy-five hundredths.', cue: 'row.1' },
        { say: 'Both split by twenty-five: three quarters.', cue: 'row.2' },
      ] },
    ],
  },
  evalX: {
    steps: [
      { lines: [
        { say: 'Three x plus two, when x is four. Swap the letter for its number.', cue: 'row.1' },
        { say: 'Multiply first: twelve.', cue: 'row.2' },
        { say: 'Then add the two: fourteen.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Five x minus three, when x is six.', cue: 'prompt' },
        { say: 'Five sixes, minus three.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Two x plus x, when x is five — the letter can show up twice.', cue: 'row.1' },
        { say: 'EVERY x wears the same number: ten plus five. Fifteen.', cue: 'row.2' },
      ] },
    ],
  },
  areaModel: {
    steps: [
      { lines: [
        { say: 'A four-by-six mat. How many tiles cover it?', cue: 'row.1' },
        { say: 'Four rows of six: twenty-four. Multiplying you can walk on.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'A three-by-nine floor — how many tiles?', cue: 'prompt' },
        { say: 'Three rows of nine.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'A seven-by-eight patio — and here\u2019s a secret: turn your head.', cue: 'row.1' },
        { say: 'Seven rows of eight, or eight rows of seven. Fifty-six either way.', cue: 'row.2' },
      ] },
    ],
  },
  volumeBox: {
    steps: [
      { lines: [
        { say: 'A cooler, thirty by twenty by twenty. Space fills in layers.', cue: 'row.1' },
        { say: 'The bottom layer first: thirty by twenty is six hundred.', cue: 'row.2' },
        { say: 'Stack twenty layers: twelve thousand. That\u2019s the room inside.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'A five-by-four-by-three box. How much fits inside?', cue: 'prompt' },
        { say: 'Bottom layer first, then stack.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Backwards now: the box holds ninety-six, and the bottom is six by four.', cue: 'row.1' },
        { say: 'Ninety-six split by twenty-four: four layers tall. Any side can hide.', cue: 'row.2' },
      ] },
    ],
  },

  // ================= Tranche 3 · Grade 3 =================
  multFact: {
    steps: [
      { lines: [
        { say: 'Seven times six. Sounds big — but you already own most of it.', cue: 'row.1' },
        { say: 'Seven times five? Thirty-five. You know that one cold.', cue: 'row.2' },
        { say: 'Each of the seven groups gets its sixth back: thirty-five plus seven. Forty-two.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Eight times six.', cue: 'prompt' },
        { say: 'Start from eight times five — then add one more group.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Six times nine — same move, bigger family.', cue: 'row.1' },
        { say: 'Six tens is sixty. But you wanted nines, so each group gives one back: fifty-four.', cue: 'row.2' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Hard times-problems are built from easy ones you own.', cue: 'prompt' },
      { say: 'Grab the easy neighbor…', cue: 'row.1' },
      { say: '…then fix it up or down by one group.', cue: 'row.2' },
    ] },
  },
  divFact: {
    steps: [
      { lines: [
        { say: 'Forty-two split by six. Here\u2019s the secret: it\u2019s a times-problem read backwards.', cue: 'row.1' },
        { say: 'Six times WHAT makes forty-two? Six times seven.', cue: 'row.2' },
        { say: 'So seven groups fit. Same family, read the other way.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Fifty-four split by nine.', cue: 'prompt' },
        { say: 'Nine times what makes fifty-four?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Sixty-three split by seven. Read the family backwards.', cue: 'row.1' },
        { say: 'Seven nines is sixty-three — so the answer is nine.', cue: 'row.2' },
      ] },
    ],
  },
  boxMul: {
    steps: [
      { lines: [
        { say: 'Four times a mystery box makes twenty-eight.', cue: 'row.1' },
        { say: 'Share twenty-eight into the four groups.', cue: 'row.2' },
        { say: 'Each group holds seven. The box was seven all along.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Four times the box makes thirty-six.', cue: 'prompt' },
        { say: 'Cover the box. Share what you can see.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'The box moved: box times six makes forty-eight. Same unmasking — forty-eight shared by six is eight.', cue: 'row.1' },
      ] },
    ],
  },
  boxAdd: {
    steps: [
      { lines: [
        { say: 'Nine plus the box makes sixteen. The box is a JUMP.', cue: 'line.start' },
        { say: 'Start at nine. Tap where sixteen is — and count the jump as you go.', cue: 'pick' },
        { say: 'The jump between the two numbers IS the box.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Eight plus the box makes fifteen.', cue: 'prompt' },
        { say: 'Count up from eight.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Now the box comes first: box plus six makes thirteen.', cue: 'line.start' },
        { say: 'Tap thirteen and count the jump back down to six. Same jump, either direction.', cue: 'pick' },
      ] },
    ],
  },
  addBig: {
    steps: [
      { lines: [
        { say: 'One forty-eight plus two thirty-six. Stack them up, start on the right.', cue: 'row.1' },
        { say: 'Eight plus six is fourteen — write the four, carry the ten.', cue: 'row.2' },
        { say: 'Tens next, and don\u2019t forget the one you carried.', cue: 'row.3' },
        { say: 'Three hundred eighty-four. Read it right off.', cue: 'row.4' },
      ] },
      { lines: [
        { say: 'Two fifty-seven plus one sixty-eight.', cue: 'prompt' },
        { say: 'Right to left. Carry when a column fills up.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Three sixty-five plus four seventy-eight — this one carries TWICE.', cue: 'row.1' },
        { say: 'Ones carry… tens carry too…', cue: 'row.2' },
        { say: 'Same move both times. Eight forty-three.', cue: 'row.4' },
      ] },
    ],
  },
  subBig: {
    steps: [
      { lines: [
        { say: 'Four oh two, take away one fifty-six. Two take away six… can\u2019t do it. So we borrow.', cue: 'row.1' },
        { say: 'Trade a ten in: now twelve take away six is six.', cue: 'row.2' },
        { say: 'Keep going left, paying back what you borrowed.', cue: 'row.3' },
        { say: 'Two forty-six.', cue: 'row.4' },
      ] },
      { lines: [
        { say: 'Five twenty-three, take away two forty-seven.', cue: 'prompt' },
        { say: 'Three take away seven can\u2019t go — borrow first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Seven hundred take away two fifty-eight — borrowing across a zero.', cue: 'row.1' },
        { say: 'The zero has nothing to lend, so it borrows first and passes it down.', cue: 'row.2' },
        { say: 'Four forty-two.', cue: 'row.3' },
      ] },
    ],
  },
  roundNum: {
    steps: [
      { lines: [
        { say: 'Round six forty-seven to the nearest ten.', cue: 'line.draw' },
        { say: 'It lives between six forty and six fifty. Tap the one it\u2019s closer to.', cue: 'pick' },
        { say: 'Peek one spot right: five or more, and it rounds up.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Round three thousand four hundred eighty-two to the nearest hundred.', cue: 'prompt' },
        { say: 'The peek number is eight. Up or down?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Two eighty-three, to the nearest hundred.', cue: 'line.start' },
        { say: 'The peek number is eight — tap where it snaps.', cue: 'pick' },
      ] },
    ],
  },
  twoStepStory: {
    steps: [
      { lines: [
        { say: 'Three trays of eight cups arrive, then ten sell. How many are left?', cue: 'prompt' },
        { say: 'There\u2019s a HIDDEN question first: how many cups arrived? Three eights — twenty-four.', cue: 'row.1' },
        { say: 'NOW the real question is easy: twenty-four take away ten. Fourteen.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Four boxes of six cups come in, and nine sell.', cue: 'prompt' },
        { say: 'Find the hidden question first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'You had fifty dollars and bought four bags of lemons at six dollars each.', cue: 'row.1' },
        { say: 'Hidden question: the lemons cost twenty-four. Then: fifty take away twenty-four is twenty-six.', cue: 'row.2' },
      ] },
    ],
  },
  patternNext: {
    steps: [
      { lines: [
        { say: 'Seven… twelve… seventeen… What comes next?', cue: 'line.draw' },
        { say: 'Find the jump between neighbors — it\u2019s plus five, every time. Tap the landing.', cue: 'pick' },
        { say: 'Find the jump. The jump repeats.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Four, ten, sixteen… what\u2019s next?', cue: 'prompt' },
        { say: 'Take neighbors apart to find the jump.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Forty, thirty-four, twenty-eight — this pattern goes DOWN.', cue: 'row.1' },
        { say: 'The jump is minus six. Ride it once more: twenty-two.', cue: 'row.2' },
      ] },
    ],
  },
  fracOfSet: {
    steps: [
      { lines: [
        { say: 'Three quarters of a tray of twelve. Cut the twelve into four equal shares.', cue: 'bar.pieces' },
        { say: 'Each share holds three. Shade three of the four shares.', cue: 'bar.shade' },
        { say: 'Split by the bottom number, take the top number of shares.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Same move, as numbers: twelve split by four is three.', cue: 'row.1' },
        { say: 'Three of those shares: nine.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Two thirds of eighteen.', cue: 'prompt' },
        { say: 'Eighteen split by three first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Two fifths of twenty cups. Five shares of four each.', cue: 'bar.pieces' },
        { say: 'Shade two shares: eight cups.', cue: 'bar.shade' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Try it as dealing. Twelve cookies onto four plates, one at a time.', cue: 'row.1' },
      { say: 'Keep three of the four plates: three threes. Nine.', cue: 'row.2' },
    ] },
  },
  unitFracCmp: {
    steps: [
      { lines: [
        { say: 'One piece each — but which piece is bigger?', cue: 'prompt' },
        { say: 'The same pan, cut into four… or cut into six.', cue: 'card.1' },
        { say: 'More cuts means skinnier pieces. Pick the bigger piece.', cue: 'pick' },
      ] },
      { lines: [
        { say: 'Shade one third of the pan.', cue: 'prompt' },
        { say: 'Then picture one fifth — and feel which is more pan.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Shade one eighth — and feel how skinny it is.', cue: 'bar.shade' },
        { say: 'The bigger the bottom number, the thinner the piece.', cue: 'takeaway' },
      ] },
    ],
  },
  cmpFrac: {
    steps: [
      { lines: [
        { say: 'Two thirds, or three fifths — which is more? Give them the same size pieces first.', cue: 'bar.pieces' },
        { say: 'Fifteenths fit both. Two thirds is ten fifteenths — shade it.', cue: 'bar.shade' },
        { say: 'Same bottom first. THEN compare tops.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Now both talk in fifteenths.', cue: 'prompt' },
        { say: 'Three fifths turns into nine fifteenths.', cue: 'row.2' },
        { say: 'Ten beats nine — two thirds is bigger.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Which is bigger: three quarters, or two thirds?', cue: 'prompt' },
        { say: 'Twelfths fit both of them.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Five eighths against one half — here\u2019s a shortcut.', cue: 'row.1' },
        { say: 'Half of eight is four. Five eighths beats four eighths. Done — no renaming.', cue: 'row.2' },
      ] },
    ],
  },

  // ================= Tranche 3 · Grade 4 =================
  multCompare: {
    steps: [
      { lines: [
        { say: '\u201CThree times as many as seven.\u201D Find the seven first — that\u2019s the base.', cue: 'row.1' },
        { say: 'Three times as many means: times three.', cue: 'row.2' },
        { say: 'Twenty-one.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Ava sold four times as many as Leo\u2019s six.', cue: 'prompt' },
        { say: 'Base first. Then multiply.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Backwards now: twenty-four is four times as many as the base. Un-multiply: twenty-four split by four is six.', cue: 'row.1' },
      ] },
    ],
  },
  mulDigit: {
    steps: [
      { lines: [
        { say: 'Twenty-four times twelve. Split the twelve into ten and two.', cue: 'row.1' },
        { say: 'Twenty-four tens… and twenty-four twos.', cue: 'row.2' },
        { say: 'Two forty plus forty-eight: two eighty-eight. Pieces back together.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Thirty-one times fourteen.', cue: 'prompt' },
        { say: 'Split the fourteen first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Forty-seven times twenty-three — BOTH numbers split this time.', cue: 'row.1' },
        { say: 'Four little problems instead of one big one.', cue: 'row.2' },
        { say: 'Add all four pieces: one thousand eighty-one.', cue: 'row.3' },
      ] },
    ],
  },
  divRem: {
    steps: [
      { lines: [
        { say: 'Fifty split by eight — and the leftover MEANS something.', cue: 'row.1' },
        { say: 'Six eights fit: forty-eight. Seven eights would be too big.', cue: 'row.2' },
        { say: 'Two left over. Six full boxes, two loose cups.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Thirty-eight split by five.', cue: 'prompt' },
        { say: 'How many fives fit? What\u2019s left?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Forty-seven kids, and each van seats six. How many vans REALLY?', cue: 'row.1' },
        { say: 'Seven vans carry forty-two… but five kids are still on the curb. Eight vans.', cue: 'row.2' },
      ] },
    ],
  },
  decNotation: {
    steps: [
      { lines: [
        { say: 'Six dimes. Shade them on the dollar bar.', cue: 'bar.shade' },
        { say: 'A dollar is ten dimes — six dimes is point six zero.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Write three pennies as dollars.', cue: 'prompt' },
        { say: 'A penny is one hundredth of a dollar.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Four dimes of the dollar — shade them.', cue: 'bar.shade' },
        { say: 'Point four and point four zero are the same money.', cue: 'takeaway' },
      ] },
    ],
  },
  decCompare: {
    steps: [
      { lines: [
        { say: 'Point four, or point three five — which is more money?', cue: 'prompt' },
        { say: 'Make them the same length: point four zero against point three five.', cue: 'card.1' },
        { say: 'Four dimes against three dimes and five pennies. Pick the bigger.', cue: 'pick' },
      ] },
      { lines: [
        { say: 'Which is bigger: point six, or point five eight?', cue: 'prompt' },
        { say: 'Pad them to the same length first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Point nine against point one two. Longer is NOT bigger.', cue: 'row.1' },
        { say: 'Nine dimes beats one dime and two pennies. Look at the digits, not the length.', cue: 'row.2' },
      ] },
    ],
  },
  addSameDen: {
    steps: [
      { lines: [
        { say: 'Two eighths plus three eighths. Shade both on one bar.', cue: 'bar.shade' },
        { say: 'Same-size pieces just count up: five eighths. The name never changes.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Three tenths plus four tenths.', cue: 'prompt' },
        { say: 'Tenths stay tenths. Just count the tops.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Four sixths plus three sixths — watch it spill past one whole pan.', cue: 'bar.shade' },
        { say: 'Seven sixths is one whole and one more sixth. Spilling over is fine.', cue: 'takeaway' },
      ] },
    ],
  },
  mixedImp: {
    steps: [
      { lines: [
        { say: 'Two and a third — shade it all in thirds.', cue: 'bar.shade' },
        { say: 'Each whole trades for three thirds. Two wholes and one more: seven thirds.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Nine quarters, as a mixed number.', cue: 'prompt' },
        { say: 'How many whole sets of four quarters fit?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Three and two fifths, the other direction.', cue: 'row.1' },
        { say: 'Three wholes is fifteen fifths, plus the loose two…', cue: 'row.2' },
        { say: 'Seventeen fifths. One name, no wholes.', cue: 'row.3' },
      ] },
    ],
  },

  // ================= Tranche 3 · Grade 5 =================
  powTen: {
    steps: [
      { lines: [
        { say: 'Twenty-three dollars for ten bags. What\u2019s one bag? The digits SLIDE.', cue: 'row.1' },
        { say: 'Splitting by ten slides every digit one spot right.', cue: 'row.2' },
        { say: 'Two dollars thirty. The point never moved — the digits did.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Four point seven, times one hundred.', cue: 'prompt' },
        { say: 'Two zeros — two slides left.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Point zero six, times one thousand. Three slides left.', cue: 'row.1' },
        { say: 'Watch it grow: point six… six… sixty.', cue: 'row.2' },
      ] },
    ],
  },
  decAdd: {
    steps: [
      { lines: [
        { say: 'Four fifty plus five twenty-five. Stack them ON the point.', cue: 'row.1' },
        { say: 'Points in one line means dimes meet dimes, pennies meet pennies.', cue: 'row.2' },
        { say: 'Nine seventy-five. It\u2019s just money adding.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Three eighty plus two forty-five.', cue: 'prompt' },
        { say: 'Stack the points first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Seven point five plus point eight six — the lengths don\u2019t match.', cue: 'row.1' },
        { say: 'Pad it: seven point five zero. Stack the points, add straight down: eight thirty-six.', cue: 'row.2' },
      ] },
    ],
  },
  addUnlikeDen: {
    steps: [
      { lines: [
        { say: 'One half plus one third. Halves and thirds won\u2019t add — different size pieces.', cue: 'bar.pieces' },
        { say: 'Sixths fit BOTH. Shade one half wearing its sixths name: three sixths.', cue: 'bar.shade' },
        { say: 'Different bottoms need one shared name first.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Now both talk in sixths.', cue: 'prompt' },
        { say: 'One third is two sixths.', cue: 'row.2' },
        { say: 'Three sixths plus two sixths: five sixths.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'One quarter plus one third.', cue: 'prompt' },
        { say: 'Twelfths fit both of them.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Two thirds plus one quarter — twelfths again.', cue: 'row.1' },
        { say: 'Eight twelfths plus three twelfths…', cue: 'row.2' },
        { say: 'Eleven twelfths.', cue: 'row.3' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Still foggy? It\u2019s coins. A quarter plus a dime won\u2019t add as names either.', cue: 'row.1' },
      { say: 'But in cents? Twenty-five plus ten: thirty-five. One shared name — that\u2019s the whole trick.', cue: 'row.2' },
    ] },
  },
  subFrac: {
    steps: [
      { lines: [
        { say: 'Three quarters take away one third. Give them one name first: twelfths.', cue: 'bar.shade' },
        { say: 'Three quarters is nine twelfths — you\u2019ll remove four of them. Five twelfths left.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Five sixths take away one half.', cue: 'prompt' },
        { say: 'The half speaks sixths: three of them.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'One whole pan, take away three eighths.', cue: 'row.1' },
        { say: 'The whole pan is eight eighths. Take three: five eighths left.', cue: 'row.2' },
      ] },
    ],
  },
  mulFrac: {
    steps: [
      { lines: [
        { say: 'Half OF four fifths. Shade what you keep.', cue: 'bar.shade' },
        { say: '\u201COf\u201D means times: tops multiply, bottoms multiply.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Two thirds times three quarters.', cue: 'prompt' },
        { say: 'Straight across the tops, straight across the bottoms.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Two thirds of three quarters of the tray.', cue: 'bar.pieces' },
        { say: 'Three quarters is nine pieces; two thirds of those is six. Half the tray.', cue: 'bar.shade' },
      ] },
    ],
  },
  unitFracDiv: {
    steps: [
      { lines: [
        { say: 'Three wholes, split into quarter-size scoops. How many scoops?', cue: 'bar.pieces' },
        { say: 'Each whole holds four. Three wholes: twelve scoops.', cue: 'bar.shade' },
        { say: 'Dividing by a little piece counts how many pieces fit.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Two, split into third-size pieces.', cue: 'prompt' },
        { say: 'Thirds per whole: three.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Flipped around: HALF a pitcher, shared by four kids.', cue: 'row.1' },
        { say: 'A half cut four ways is an eighth each. Sharing makes pieces smaller.', cue: 'row.2' },
      ] },
    ],
  },
  orderOpsParen: {
    steps: [
      { lines: [
        { say: 'Two times, bracket, eight take away three. The brackets go FIRST.', cue: 'row.1' },
        { say: 'Inside: five. Then the outside: two fives, ten.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Three times, bracket, ten take away four.', cue: 'prompt' },
        { say: 'Inside the brackets before anything.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Same numbers, with and without brackets — watch the answers split.', cue: 'row.1' },
        { say: 'With brackets: thirty. Without: twenty-six. Brackets are steering, not decoration.', cue: 'row.2' },
      ] },
    ],
  },
  orderOps: {
    steps: [
      { lines: [
        { say: 'Three plus four times five. Who goes first?', cue: 'row.1' },
        { say: 'Times beats plus, wherever it sits. Four fives first: twenty. Then plus three: twenty-three — not thirty-five.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Twenty, take away two times six.', cue: 'prompt' },
        { say: 'The two times six goes first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Eighteen split by three, plus three times two. TWO first-place moves.', cue: 'row.1' },
        { say: 'Same rank goes left to right: six… and six…', cue: 'row.2' },
        { say: 'Six plus six: twelve.', cue: 'row.3' },
      ] },
    ],
  },

  // ================= Tranche 3 · Grade 8 =================
  powers: {
    steps: [
      { lines: [
        { say: 'Two to the fourth. The little number COUNTS the twos — it doesn\u2019t multiply them.', cue: 'row.1' },
        { say: 'Two, four times: four… eight… sixteen.', cue: 'row.2' },
        { say: 'Sixteen. Not eight. That trap is the whole lesson.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Three to the third. Count the threes.', cue: 'prompt' },
        { say: 'Three threes, multiplied.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'The two everyone trips on: five to the first, and five to the ZERO.', cue: 'row.1' },
        { say: 'One five standing alone is five. No fives at all? One. That\u2019s the starting point of multiplying.', cue: 'row.2' },
      ] },
    ],
  },
  sciNot: {
    steps: [
      { lines: [
        { say: 'One million two hundred thousand views — too long to keep writing.', cue: 'row.1' },
        { say: 'Slide the point until ONE digit is in front: one point two.', cue: 'row.2' },
        { say: 'Count the slides — six — and keep them in the little number. One point two, times ten to the sixth.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Forty-five thousand, the short way.', cue: 'prompt' },
        { say: 'Slide to one digit in front. Count your slides.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'It goes tiny too: point zero zero four five.', cue: 'row.1' },
        { say: 'Slides to the RIGHT count as minus: four point five, times ten to the minus three.', cue: 'row.2' },
      ] },
    ],
  },
  multiStep: {
    steps: [
      { lines: [
        { say: 'Five x minus seven on one side, two x plus twenty on the other. Letters left, numbers right.', cue: 'row.1' },
        { say: 'Two x off both sides: three x minus seven is twenty.', cue: 'row.2' },
        { say: 'Seven over: three x is twenty-seven.', cue: 'row.3' },
        { say: 'x is nine. One legal move at a time.', cue: 'row.4' },
      ] },
      { lines: [
        { say: 'Four x plus three equals two x plus eleven.', cue: 'prompt' },
        { say: 'Get the x\u2019s together first.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Two times, bracket, x plus three — equals sixteen. Open the bracket first.', cue: 'row.1' },
        { say: 'Two x plus six is sixteen. Six off: two x is ten.', cue: 'row.2' },
        { say: 'x is five.', cue: 'row.3' },
      ] },
    ],
    reteach: { lines: [
      { say: 'Think of it as two kids earning money — when are they even?', cue: 'row.1' },
      { say: 'One has a twenty-seven dollar gap to close, gaining three a day.', cue: 'row.2' },
      { say: 'Nine days. That\u2019s all the x ever was.', cue: 'row.3' },
    ] },
  },
  slope2: {
    steps: [
      { lines: [
        { say: 'At a dollar fifty you sold twenty cups. At a dollar even, thirty. The slope IS your business.', cue: 'row.1' },
        { say: 'Rise: ten more cups. Run: fifty cents down.', cue: 'row.2' },
        { say: 'Ten over minus a half: minus twenty. Twenty more cups for every dollar you drop.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'The slope through two, three… and four, eleven.', cue: 'prompt' },
        { say: 'Rise over run.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'From zero-zero to four, ten — starting at nothing.', cue: 'row.1' },
        { say: 'Rise ten, run four.', cue: 'row.2' },
        { say: 'Two and a half per step. Through the start, slope IS the per-one rate.', cue: 'row.3' },
      ] },
    ],
  },
  funcRate: {
    steps: [
      { lines: [
        { say: 'y equals two x plus thirty. Read it as a business, not a formula.', cue: 'row.1' },
        { say: 'The thirty? That\u2019s your cost to open, before a single cup.', cue: 'row.2' },
        { say: 'The two? Every cup adds two dollars. The whole story in one line.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'In y equals five x plus twelve — what\u2019s the rate?', cue: 'prompt' },
        { say: 'The number riding the x.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'd equals forty minus ten p — a line that goes DOWN.', cue: 'row.1' },
        { say: 'Forty customers at price zero… and every dollar up scares off ten.', cue: 'row.2' },
      ] },
    ],
  },
  sysSolve: {
    steps: [
      { lines: [
        { say: 'The cart costs thirty to open plus fifty cents a cup. You charge two dollars. When are you even?', cue: 'row.1' },
        { say: 'Cost meets income: set them equal. Half-c off both sides.', cue: 'row.2' },
        { say: 'Twenty cups. Cup twenty-one is pure profit.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'y is x plus three. y is also two x. Where do they meet?', cue: 'prompt' },
        { say: 'Set them equal to each other.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Another way in: y is three x, and x plus y is twelve.', cue: 'row.1' },
        { say: 'Where you see y, write three x: four x is twelve.', cue: 'row.2' },
        { say: 'x is three, y is nine.', cue: 'row.3' },
      ] },
    ],
  },
  funcEval: {
    steps: [
      { lines: [
        { say: 'd equals forty minus ten p. The fair fixes your price at two fifty — feed the machine.', cue: 'row.1' },
        { say: 'Forty minus twenty-five…', cue: 'row.2' },
        { say: 'Fifteen cups. Stock exactly that.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'f of x is three x minus four. What\u2019s f of five?', cue: 'prompt' },
        { say: 'Feed it the five.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'The machine doesn\u2019t care what you feed it — even minus three.', cue: 'row.1' },
        { say: 'Two times minus three, plus one: minus five.', cue: 'row.2' },
      ] },
    ],
  },
  pythag: {
    steps: [
      { lines: [
        { say: 'A post six feet tall, a brace anchored eight feet out. The store cuts your board ONCE.', cue: 'row.1' },
        { say: 'Square both legs and add: thirty-six plus sixty-four, one hundred.', cue: 'row.2' },
        { say: 'Un-square it: ten feet. Exactly.', cue: 'row.3' },
      ] },
      { lines: [
        { say: 'Legs five and twelve — the long side?', cue: 'prompt' },
        { say: 'Square, add, un-square.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Backwards: the long side is thirteen, one leg is five.', cue: 'row.1' },
        { say: 'When the long side is known, the squares SUBTRACT: one sixty-nine minus twenty-five, un-squared… twelve.', cue: 'row.2' },
      ] },
    ],
  },
  approxRoot: {
    steps: [
      { lines: [
        { say: 'The square root of fifty. Trap it between squares you know.', cue: 'line.draw' },
        { say: 'Seven squared is forty-nine. Eight squared is sixty-four. Tap the whole number just below.', cue: 'pick' },
        { say: 'Trap a root between neighbor squares.', cue: 'takeaway' },
      ] },
      { lines: [
        { say: 'Root thirty lives between which whole numbers?', cue: 'prompt' },
        { say: 'Twenty-five and thirty-six are your traps.', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Root seventy-five, higher up the line.', cue: 'line.start' },
        { say: 'Eight squared is sixty-four, nine squared is eighty-one. Tap just below.', cue: 'pick' },
      ] },
    ],
  },
  sqroot: {
    steps: [
      { lines: [
        { say: 'The square root of eighty-one: what number, times ITSELF, makes this?', cue: 'row.1' },
        { say: 'Nine nines is eighty-one. So the root is nine. It just undoes the square.', cue: 'row.2' },
      ] },
      { lines: [
        { say: 'Root sixty-four. Un-square it.', cue: 'prompt' },
        { say: 'What times itself makes sixty-four?', cue: 'pick' },
      ] },
    ],
    more: [
      { lines: [
        { say: 'Root of twelve squared — the undo, undone.', cue: 'row.1' },
        { say: 'Square it, root it, you\u2019re home: twelve. The two moves cancel.', cue: 'row.2' },
      ] },
    ],
  },
};

/** Speak entry for one skill, or null while its tranche is unauthored. */
export const speakFor = (skill) => SPEAK[skill] || null;
