/* The teach phase: layouts, the voice band, the Snag, and whole authored sequences.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { answerOne, buildDayLesson, clickText, currentDay, driveToTeach, nextButton, open, solveStep, text } from './harness.mjs';

export default async function run(check) {
  /* ---------- practice teaches (owner's play-test, Nov 2026) ----------

     Two things a kid in free practice was not getting. The ASK that the
     generator authored — Q('Which is bigger?', '1/6 or 1/2') — was dropped on
     the way to the screen, leaving her looking at two fractions with no
     question. And a miss charged her a Teach Token to see the worked steps,
     which is a fine on learning: the miss has already cost the streak and the
     first-try bonus, and it is the struggle signal the teaching exists for. */
  {
    const page = await open({ grade: 3, name: 'Talia', lessonPointer: 0, kredits: 400,
      days: { '2026-01-02': 1 }, lastTopic: 'frac' }, '#home');
    await page.waitForTimeout(700);
    const started = await page.evaluate(() => {
      const play = [...document.querySelectorAll('button')]
        .find(b => /^Play /.test(b.getAttribute('aria-label') || ''));
      if (play) { play.click(); return true; }
      return false;
    });
    check('free practice opens', started);

    if (started) {
      await page.waitForTimeout(800);
      const heading = await page.evaluate(() => document.querySelector('h2')?.innerText || '');
      check('the question says what is being ASKED, not just the maths',
        /[A-Za-z]{3,}/.test(heading), JSON.stringify(heading.slice(0, 60)));

      /* Answer wrongly on purpose. Which option is wrong is not knowable from
         the page, so this takes one and tries the next question if it happened
         to be right.

         TWICE THIS HAS FAILED IN THE FULL RUN AND PASSED ALONE, and both times
         the cause was the driver deciding something from the CLOCK. First it
         slept fixed amounts. Then it waited properly but kept the assumption
         underneath: "not marked within 2500ms, so it must have been right" —
         which under eight concurrent browsers is simply a slow page, and the
         driver would go and click an answer on a question that had already been
         answered. The check then reported "a miss opens nothing", a true
         sentence about a screen that was never missed on.

         So it waits for the screen to RESOLVE, either way, and reads which way
         it went: a miss marks, a hit moves the question on. Neither outcome is
         inferred from elapsed time. */
      const until = async (fn, ms = 9000, every = 100) => {
        for (let i = 0; i < Math.ceil(ms / every); i++) {
          if (await fn()) return true;
          await page.waitForTimeout(every);
        }
        return false;
      };
      const marked = () => page.evaluate(() => /Not yet|Try again/i.test(document.body.innerText));
      const headNow = () => page.evaluate(() => document.querySelector('h2')?.innerText || '');
      const pickable = () => page.evaluate(() =>
        [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim())).length >= 2);

      let hitAMiss = false;
      for (let attempt = 0; attempt < 4 && !hitAMiss; attempt++) {
        if (!(await until(pickable, 9000))) break;
        const was = await headNow();
        const clicked = await page.evaluate((last) => {
          const opts = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
          if (opts.length < 2) return false;
          opts[last ? opts.length - 1 : 0].click();
          return true;
        }, attempt % 2 === 1);
        if (!clicked) break;
        // Resolve EITHER WAY before deciding anything.
        await until(async () => (await marked()) || (await headNow()) !== was, 9000);
        hitAMiss = await marked();
      }
      check('a miss was actually reached', hitAMiss, `after 4 tries`);
      let t = await text(page);

      // The walk itself, not the "Not yet" bar — that appears either way and
      // would have passed against a product that opened nothing.
      const walk = await page.evaluate(() => ({
        rows: document.querySelectorAll('[data-teach-row]').length,
        more: /Tap for the next line/.test(document.body.innerText),
      }));
      check('a miss opens the worked steps by itself', walk.rows > 0 || walk.more,
        JSON.stringify(walk));
      check('and never asks her to pay for them',
        !/Spend a Teach Token|costs half/i.test(t),
        (t.match(/Spend a Teach Token[^\n]*|costs half[^\n]*/) || ['free'])[0]);
      check('the retry is still hers to answer — nothing is disabled',
        await page.evaluate(() => [...document.querySelectorAll('button')]
          .filter(b => /^\d\n/.test(b.innerText.trim())).every(b => !b.disabled)));
    }
    await page.close();
  }

  /* ---------- 9. teach steps: the layouts render and gate Next (§0b) ----------
     The teach panel is the one screen where "it rendered" is not enough: if Next
     is live before the step is solved, the whole teach-first design is decorative.
     Reaching it means playing the warm-up and the Snag, which is also the only
     proof that the teach phase is reachable at all. */
  {
    const page = await open({ grade: 7, name: 'Talia', lessonPointer: 0 }, '#lesson');
    await page.waitForTimeout(600);
    const arrived = await driveToTeach(page);
    let t = await text(page);
    check('the teach phase is reachable and opens on a numbered §0b step', arrived,
      t.match(/NEW IDEA[^\n]*/i)?.[0] || t.slice(0, 70).replace(/\n/g, ' '));

    const nextState = () => page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /^(Next|Start the mission)/.test(x.innerText.trim()));
      return b ? { disabled: b.disabled, label: b.innerText.trim() } : null;
    });
    check('Next is disabled while the step is unsolved', (await nextState())?.disabled === true, JSON.stringify(await nextState()));
    check('the walk layout offers the next line one tap at a time', t.includes('Tap for the next line'));

    for (let i = 0; i < 8; i++) {
      const tapped = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Tap for the next line');
        if (b) { b.click(); return true; } return false;
      });
      if (!tapped) break;
      await page.waitForTimeout(90);
    }
    t = await text(page);
    check('revealing the walk solves the step and releases Next', (await nextState())?.disabled === false);
    check('solving the step opens the takeaway band', /for your notes/i.test(t) && t.includes('Write it down'));

    await clickText(page, 'Write it down');
    await page.waitForTimeout(300);
    t = await text(page);
    check('writing it down drops the note into the cheat-sheet column', /your notes/i.test(t) && t.includes('Written ✓'));

    /* Grades 7–8 are voice band c: §0c gives them the ink glyph disc and the
       line "Read it to me". Read off the bar's own attributes, not the label —
       the label reads "Hope is reading" whenever a clip happens to be playing,
       which made the first version of this check pass or fail on timing. */
    const bar = await page.evaluate(() => {
      const b = document.querySelector('[data-voice-bar]');
      return b && { band: b.dataset.voiceBand, disc: b.dataset.voiceDisc, text: b.innerText.trim() };
    });
    check('grades 7–8 get the ink glyph disc, not the one that reads on its own',
      bar?.band === 'c' && bar?.disc === 'glyph', JSON.stringify(bar));

    /* Teach depth, IN the flow: the second worked example is a default step
       before the Try it, not an opt-in. Owner verdict, Nov 2026 — a "Show me
       another one" button asks for exactly the executive function an ADHD kid
       is short on, so the kid who needed it most never tapped it. The sequence
       itself teaches twice; no button exists. */
    const tapWalk = async () => {
      for (let i = 0; i < 8; i++) {
        const tapped = await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Tap for the next line');
          if (b) { b.click(); return true; } return false;
        });
        if (!tapped) break;
        await page.waitForTimeout(90);
      }
    };
    check('no opt-in "Show me another one" button exists', !t.includes('Show me another one'));
    await clickText(page, 'Next');
    await page.waitForTimeout(300);
    t = await text(page);
    check('the second worked example arrives by default, before the Try it',
      /STEP 2 OF 3/i.test(t) && /AGAIN/i.test(t),
      t.match(/step \d+ of \d+[^\n]*/i)?.[0] || t.slice(0, 90).replace(/\n/g, ' '));
    await tapWalk();
    await clickText(page, 'Next');
    await page.waitForTimeout(300);
    await tapWalk();
    t = await text(page);
    check('the Try it stays last and still gates the mission',
      /STEP 3 OF 3/i.test(t) && t.includes('Start the mission'), t.slice(0, 90).replace(/\n/g, ' '));
    await page.close();
  }

  /* ---------- Teach me takes the sheet (§0c 25a) ---------- */
  {
    const page = await open({ grade: 6, name: 'Talia', kredits: 400,
      days: { '2026-01-02': 1 }, lastTopic: 'frac' }, '#home');
    await page.waitForTimeout(700);
    const started = await page.evaluate(() => {
      const play = [...document.querySelectorAll('button')]
        .find(b => /^Play /.test(b.getAttribute('aria-label') || ''));
      if (play) { play.click(); return true; }
      return false;
    });
    await page.waitForTimeout(900);

    const look = () => page.evaluate(() => ({
      text: document.body.innerText,
      rows: document.querySelectorAll('[data-teach-row]').length,
      slots: document.querySelectorAll('[data-teach-slot]').length,
      answers: [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim())).length,
      bars: document.querySelectorAll('[data-voice-bar]').length,
      back: [...document.querySelectorAll('button')].some(b => /Back to the question/.test(b.innerText)),
    }));

    const before = await look();
    check('a question surface was reached', started && before.answers >= 2, JSON.stringify(before.answers));

    const opened = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /^Teach me/.test(x.innerText.trim()));
      if (!b) return false;
      b.click(); return true;
    });
    await page.waitForTimeout(250);
    // The token gate comes first; take it.
    await page.evaluate(() => [...document.querySelectorAll('button')]
      .find(b => /Use a token|Teach me anyway/.test(b.innerText))?.click());
    await page.waitForTimeout(350);

    const during = await look();
    check('Teach me was offered and opened', opened, JSON.stringify(opened));
    /* §0c 25a: the TEACHING is the screen. The working for a question set in a
       third of the width, beside a question that stayed the biggest thing on
       screen, is what this replaced. */
    check('the teaching takes the sheet, and the answers step aside',
      during.rows > 0 && during.answers === 0, JSON.stringify(during));
    check('the lines still to come are slots she can count, not an unknown',
      during.slots > 0 && /Tap for the next line/.test(during.text), JSON.stringify(during.slots));
    // The kicker renders uppercase, so the check reads it that way.
    check('and it says what it cost her', /teach me · (token used|no token|free)/i.test(during.text),
      during.text.match(/[Tt][Ee][Aa][Cc][Hh] [Mm][Ee] · [^\n]*/)?.[0] || '');
    /* No voice bar here: 25a draws none, and a reader with nothing to read is a
       control that lies. The voice comes back with the question. */
    check('no reader is offered on a screen that does not read', during.bars === 0,
      String(during.bars));
    check('the way back to the question is live from the first paint', during.back);

    await page.evaluate(() => [...document.querySelectorAll('button')]
      .find(b => /Back to the question/.test(b.innerText))?.click());
    await page.waitForTimeout(300);
    const after = await look();
    check('and it gives the question back, voice and all',
      after.answers >= 2 && after.bars === 1 && after.rows === 0, JSON.stringify(after));
    await page.close();
  }

  /* ---------- a miss keeps the question (§0c 25a, the other way) ---------- */
  {
    const page = await open({ grade: 6, name: 'Talia', kredits: 400,
      days: { '2026-01-02': 1 }, lastTopic: 'frac' }, '#home');
    await page.waitForTimeout(700);
    await page.evaluate(() => [...document.querySelectorAll('button')]
      .find(b => /^Play /.test(b.getAttribute('aria-label') || ''))?.click());
    await page.waitForTimeout(900);
    // Miss on purpose, then try the next question if that one was right.
    for (let i = 0; i < 3; i++) {
      await page.evaluate((n) => {
        const opts = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
        opts[n % 2 === 0 ? 0 : opts.length - 1]?.click();
      }, i);
      await page.waitForTimeout(500);
      if (await page.evaluate(() => /Not yet/i.test(document.body.innerText))) break;
      await page.waitForTimeout(900);
    }
    const t = await page.evaluate(() => ({
      text: document.body.innerText,
      rows: document.querySelectorAll('[data-teach-row]').length,
      answers: [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim())).length,
    }));
    /* The miss opens the walk free, and it may NOT take the sheet: hiding "Not
       yet. Here's the step" behind working she did not ask for is the correction
       disappearing at the moment she needs it.

       NO ESCAPE HATCH. The first version read `!/Not yet/.test(text) || ...`,
       so a sheet takeover that swallowed the "Not yet" bar made the check pass
       by destroying the evidence it looked for — the mutation proved it. Both
       facts are now required: the walk opened, AND the question is still there.
       A run that never produced a miss fails too, which is correct: a spec that
       cannot reach what it claims to test has not tested it. */
    check('a miss opens the walk without taking the question away',
      t.rows > 0 && t.answers >= 2,
      JSON.stringify({ rows: t.rows, answers: t.answers, notYet: /Not yet/i.test(t.text) }));
    await page.close();
  }

  /* ---------- 10. voice band follows the grade, not a setting ---------- */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 0 }, '#lesson');
    await page.waitForTimeout(600);
    const arrived = await driveToTeach(page);
    const t = await text(page);
    check('a grade-4 teach panel was reached', arrived, t.slice(0, 70).replace(/\n/g, ' '));
    const bar4 = await page.evaluate(() => {
      const b = document.querySelector('[data-voice-bar]');
      return b && { band: b.dataset.voiceBand, disc: b.dataset.voiceDisc, text: b.innerText.trim() };
    });
    check('grades 3–4 get her face on the disc, and she reads on her own',
      bar4?.band === 'a' && bar4?.disc === 'face', JSON.stringify(bar4));
    /* Slower and Quiet, one disc, and no Again BUTTON. Not "no Again on the
       page": the bank's own second worked example is kickered AGAIN, and a text
       search for the word failed on content rather than on chrome. */
    check('the bar offers Slower and Quiet, one disc, and no timer',
      await page.evaluate(() => {
        const b = document.querySelector('[data-voice-bar]');
        const again = [...document.querySelectorAll('button')].some(x => x.innerText.trim() === 'Again');
        return !!b && !!b.querySelector('[data-voice-pill="slower"]') && !!b.querySelector('[data-voice-pill="quiet"]')
          && document.querySelectorAll('[data-voice-play]').length === 1 && !again
          && !/\d+\s*(s|sec|seconds?)\b/i.test(b.innerText);
      }));
    await page.close();
  }

  /* ---------- 11. a worded Snag is a REAL choice now (B7 + the bank's wrongs) ----
     Grade 6 opens on unit 6-1, whose Snag answer is "The 8-pack (43¢ vs 45¢)".
     B7 banned the rigged set (the answer among bare integers). The bank then
     authored real wrongs for every worded Snag, so the honest end state is four
     same-shaped choices — and the reveal path stays as the fallback for any
     future snag without authored wrongs (unit-tested in the engine). */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0 }, '#lesson');
    await page.waitForTimeout(600);
    // Play the warm-up until the Snag is on screen.
    for (let i = 0; i < 10; i++) {
      if (/THE SNAG/i.test(await text(page))) break;
      await answerOne(page);
      await page.waitForTimeout(140);
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => !x.disabled && !x.innerText.includes('\n')
          && /^(Next|Continue|Keep going|Got it)/.test(x.innerText.trim()));
        if (b) b.click();
      });
      await page.waitForTimeout(200);
    }
    let t = await text(page);
    check('the Snag is reached', /THE SNAG/i.test(t), t.slice(0, 70).replace(/\n/g, ' '));
    check('a worded Snag offers its authored choices', t.includes('The 8-pack (43¢ vs 45¢)')
      && t.includes('The 12-pack (45¢ vs 43¢)'), t.match(/The 8-pack[^\n]*/)?.[0] || '');
    // The tell the old build had: the answer sat among bare integers. Now every
    // choice is a worded sentence — zero bare-number buttons on a worded Snag.
    const numeric = await page.evaluate(() => [...document.querySelectorAll('button')]
      .filter(b => /^-?\$?\d+(?:\.\d+)?$/.test(b.innerText.trim().replace(/^\d\n/, ''))).length);
    check('no bare-number choices beside a worded answer', numeric === 0, `${numeric} bare-number buttons`);

    await clickText(page, 'The 8-pack (43¢ vs 45¢)');
    await page.waitForTimeout(300);
    t = await text(page);
    check('picking the right deal lands and leads on', /Show me the move|That.s it|Next/i.test(t), t.slice(0, 120));
    await page.close();
  }

  /* ---------- 13. a whole authored teach sequence, one grade per band ----------
     Day 1 of grades 3, 6 and 8, step 1 to "Start the mission", every layout solved
     the way a kid would solve it. Each failure names the skill, so a bank patch that
     breaks a step points at itself rather than at the suite. */
  for (const grade of [3, 6, 8]) {
    // Not her first ever lesson: that one opens straight on the New idea.
    const seed = { grade, name: 'Talia', lessonPointer: 0, tiers: {}, recent: {}, review: [], passed: {}, days: { '2026-01-02': 1 } };
    const day = currentDay(seed).day;
    const skill = day?.skill || `grade ${grade} day 1`;
    const lesson = buildDayLesson(seed);
    const teach = (lesson?.moves || []).find(m => m.teach)?.teach;

    if (!teach) { check(`${skill}: day 1 assembles a teach phase`, false, `grade ${grade} has no New idea move`); continue; }

    const page = await open(seed, '#lesson');
    await page.waitForTimeout(500);
    const arrived = await driveToTeach(page);
    check(`${skill}: the teach phase is reachable`, arrived, `grade ${grade}`);
    if (!arrived) { await page.close(); continue; }

    // The second example is a default step now (no opt-in button), so the computed
    // sequence already carries it — the walk below exercises the whole thing.
    let steps = [...teach.steps];
    let ok = true, note = '';
    const firstVisit = new Set();

    for (let i = 0; i < steps.length && ok; i++) {
      const step = steps[i];
      const onScreen = await text(page);

      // The sequence the test computed must be the sequence on screen; if the bank
      // and the seam ever disagree, say so here rather than failing mysteriously below.
      if (step.prompt && !onScreen.includes(step.prompt.slice(0, 28))) {
        ok = false; note = `step ${i + 1} on screen is not "${step.prompt.slice(0, 40)}"`;
        break;
      }

      const before = await nextButton(page);
      // A one-row walk has nothing to reveal, so it is solved on arrival and Next is
      // correctly live — asserting otherwise would be the test inventing a rule.
      const preSolved = step.layout === 'walk' && (step.walk?.rows?.length || 0) <= 1;
      const revisit = firstVisit.has(step.prompt);
      firstVisit.add(step.prompt);
      const needsSolving = !!step.layout && !preSolved && !revisit;
      if (needsSolving && before?.disabled !== true) {
        ok = false; note = `step ${i + 1} (${step.layout}) had Next live before it was solved`;
        break;
      }

      const how = await solveStep(page, step);
      const after = await nextButton(page);
      if (after?.disabled !== false) {
        ok = false; note = `step ${i + 1} (${step.layout}) still dead after ${how}`;
        break;
      }

      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /^(Next|Start the mission)/.test(x.innerText.trim()));
        if (b && !b.disabled) b.click();
      });
      await page.waitForTimeout(220);
    }

    check(`${skill}: every step solves and releases Next`, ok, note);
    if (ok) {
      // The depth pass is default-on: a second-example step (seam id m*) sits in
      // the sequence before the Try it, with no button between the kid and it.
      const mi = steps.findIndex(s => /^m/.test(s.id || ''));
      const ti = steps.findIndex(s => s.tryIt);
      check(`${skill}: the second example is in the default sequence, before the Try it`,
        mi >= 0 && (ti < 0 || mi < ti), `m at ${mi}, tryIt at ${ti}`);
      // The sequence is over. "Not on a step" is NOT enough — a blank screen
      // satisfies that, and a blank screen is exactly what this used to produce:
      // finishing the teach phase unmounted the whole app. Assert the lesson is
      // actually there.
      const t = await text(page);
      check(`${skill}: the sequence ends in the mission, not a blank screen`,
        !/STEP \d+ OF \d+/i.test(t) && /Warm-up[\s\S]*Prove it/.test(t) && t.trim().length > 80,
        t.trim().length < 80 ? `screen is ${t.trim().length} chars — blank` : (t.match(/STEP \d+ OF \d+/i)?.[0] || ''));
    }
    await page.close();
  }
}
