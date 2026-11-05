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
};

/** Speak entry for one skill, or null while its tranche is unauthored. */
export const speakFor = (skill) => SPEAK[skill] || null;
