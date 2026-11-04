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

   Coverage grows in tranches; speak.test.js pins what is authored. Tranche 1:
   the four reference skills, so the whole pipeline can be built and tested
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
};

/** Speak entry for one skill, or null while its tranche is unauthored. */
export const speakFor = (skill) => SPEAK[skill] || null;
