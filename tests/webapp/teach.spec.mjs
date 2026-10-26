/* The teach phase: layouts, the voice band, the Snag, and whole authored sequences.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { answerOne, buildDayLesson, clickText, currentDay, driveToTeach, nextButton, open, solveStep, text } from './harness.mjs';

export default async function run(check) {
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

    // Grades 7–8 are voice band c: the pill, never the auto-reading companion.
    check('grades 7–8 keep the quiet "Read it to me" pill', t.includes('Read it to me') && !/Reading it to you/.test(t));

    /* Teach depth: on the FINAL step, "Show me another one" splices in the second
       worked example before the Try it. Thin lessons were the family's verdict;
       this is the affordance that answers it, so it is checked in the bundle. */
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
    await clickText(page, 'Next');
    await page.waitForTimeout(300);
    t = await text(page);
    check('the final step offers "Show me another one"', t.includes('Show me another one'), t.slice(0, 90).replace(/\n/g, ' '));
    const before = t;
    await clickText(page, 'Show me another one');
    await page.waitForTimeout(300);
    t = await text(page);
    check('another one is ANOTHER one: a fresh example she has not seen',
      !t.includes('Show me another one') && t !== before && /step \d+ of 3/i.test(t),
      t.match(/step \d+ of \d+/i)?.[0] || t.slice(0, 90).replace(/\n/g, ' '));
    await tapWalk();
    await clickText(page, 'Next');
    await page.waitForTimeout(300);
    await tapWalk();
    t = await text(page);
    check('the Try it still gates the mission after the extra example',
      t.includes('Start the mission'), t.slice(0, 90).replace(/\n/g, ' '));
    await page.close();
  }

  /* ---------- 10. voice band follows the grade, not a setting ---------- */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 0 }, '#lesson');
    await page.waitForTimeout(600);
    const arrived = await driveToTeach(page);
    const t = await text(page);
    check('a grade-4 teach panel was reached', arrived, t.slice(0, 70).replace(/\n/g, ' '));
    check('grades 3–4 get the reading companion, not the pill',
      /Reading it to you|Ready when you are/.test(t) && !t.includes('Read it to me'),
      t.match(/Read[^\n]*|Ready[^\n]*/)?.[0] || '');
    check('the companion offers Again, Slower and Quiet — and no timer',
      t.includes('Again') && t.includes('Slower') && t.includes('Quiet'));
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
    const seed = { grade, name: 'Talia', lessonPointer: 0, tiers: {}, recent: {}, review: [], passed: {} };
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

    let steps = [...teach.steps];
    const more = teach.more || [];
    let expanded = false;
    let ok = true, note = '';
    // A step she already solved stays solved when she comes back to it after asking
    // for another example, so Next is correctly live on a repeat visit.
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

      // One expansion per sequence, taken on the last step: the extra example goes
      // in BEFORE the Try it, so the unpaid check stays last.
      if (i === steps.length - 1 && more.length && !expanded) {
        await clickText(page, 'Show me another one');
        await page.waitForTimeout(250);
        expanded = true;
        steps = [...steps.slice(0, -1), ...more, steps[steps.length - 1]];
        // The view does NOT advance: `at` stays put and the first extra step takes
        // that index, so the same i must be re-processed against the new sequence.
        i -= 1;
        continue;
      }

      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /^(Next|Start the mission)/.test(x.innerText.trim()));
        if (b && !b.disabled) b.click();
      });
      await page.waitForTimeout(220);
    }

    check(`${skill}: every step solves and releases Next`, ok, note);
    if (ok) {
      check(`${skill}: the expansion ran and the Try it stayed last`, expanded === (more.length > 0),
        `more=${more.length}, expanded=${expanded}`);
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
