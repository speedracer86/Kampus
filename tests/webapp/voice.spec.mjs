/* Say-it-show-it, and the two laws that bound it (docs/VOICE_PASS.md §2/§3).

   CI cannot hear anything, so this asserts the WIRING and the LAWS:

     1. audio never gates — Next's enabled state must be identical with clips
        present, with them playing, and with Quiet on. A kid must be able to tap
        straight through a lesson having heard nothing.
     2. while Karla speaks, nothing else sounds — the register is the only other
        sound in the product, and the bus refuses it mid-line.

   Grade 4 day 52 is eqFrac, tranche 1, The Kitchen — the exact lesson the owner's
   family re-tests on. Part of the suite; run via `npm run test:webapp`. */
import { open, text, driveToTeach, nextButton } from './harness.mjs';

/** Stub Audio so CI stays silent but every play() is observable. */
const captureAudio = (page) => page.addInitScript(() => {
  window.__played = [];
  window.__playing = 0;
  const Real = window.Audio;
  window.Audio = function (src) {
    const el = new Real();
    el.src = src;
    let live = false;
    el.play = () => {
      window.__played.push(String(src).replace(location.origin, ''));
      window.__playing++; live = true;
      // End the "clip" promptly so the sequence advances without CI waiting on real
      // durations — and model a real element, where pause() ends playback and fires
      // no 'ended'. Without that the stub reports concurrency the product does not
      // have, and hides the concurrency it does.
      setTimeout(() => {
        if (!live) return;
        live = false; window.__playing--;
        el.dispatchEvent(new Event('ended'));
      }, 60);
      return Promise.resolve();
    };
    el.pause = () => { if (live) { live = false; window.__playing--; } };
    // Never actually fetch or decode in CI.
    try { Object.defineProperty(el, 'readyState', { get: () => 4 }); } catch { /* fine */ }
    return el;
  };
  window.Audio.prototype = Real.prototype;
});

const played = (page) => page.evaluate(() => window.__played || []);

export default async function run(check) {
  /* ---- the manifest reaches the browser at all ---- */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52 }, '#home');
    await page.waitForTimeout(400);
    const manifest = await page.evaluate(async () => {
      const r = await fetch('/voice/manifest.json');
      return r.ok ? r.json() : null;
    });
    check('the clip manifest is served with the bundle', !!manifest && !!manifest.eqFrac,
      manifest ? Object.keys(manifest).join(', ') : 'not served');
    check('eqFrac has clips for every authored step',
      Array.isArray(manifest?.eqFrac?.steps) && manifest.eqFrac.steps.every(s => s.length > 0),
      JSON.stringify(manifest?.eqFrac?.steps?.map(s => s.length)));
    await page.close();
  }

  /* ---- say-it-show-it on the lesson the family tests ---- */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52 }, '#lesson');
    await captureAudio(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const arrived = await driveToTeach(page);
    check('eqFrac: the teach phase is reachable', arrived, 'grade 4 day 52');

    const t = await text(page);
    check('the spoken script is on screen, not only in the audio',
      /pan of brownies|three equal pieces/i.test(t), t.match(/[^\n]*brownies[^\n]*/)?.[0] || t.slice(0, 80).replace(/\n/g, ' '));
    check('the three controls are the three that already existed',
      /Again/.test(t) && /Slower/.test(t) && /Quiet/.test(t));

    await page.waitForTimeout(900);
    const clips = await played(page);
    check('arriving at the step plays its lines, in order', clips.length >= 2,
      clips.slice(0, 3).join(' → '));
    check('and they are this step\'s clips, not another step\'s',
      clips.every(c => c.includes('/voice/eqFrac/')), clips.slice(0, 2).join(', '));

    /* LAW 1: audio never gates. */
    const before = await nextButton(page);
    check('Next is gated by the step, not by the audio', before?.disabled === true,
      JSON.stringify(before));
    // Solve the step the normal way; audio state must not enter into it.
    for (let i = 0; i < 12; i++) {
      const tapped = await page.evaluate(() => {
        const segs = [...document.querySelectorAll('button')].filter(b => !b.innerText.trim());
        if (segs.length) { segs[Math.min(1, segs.length - 1)].click(); return true; }
        const walk = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Tap for the next line');
        if (walk) { walk.click(); return true; }
        return false;
      });
      if (!tapped) break;
      await page.waitForTimeout(80);
      if ((await nextButton(page))?.disabled === false) break;
    }
    check('solving the step releases Next while audio is irrelevant',
      (await nextButton(page))?.disabled === false, JSON.stringify(await nextButton(page)));
    await page.close();
  }

  /* ---- LAW 1 again, the way a kid would actually hit it: Quiet on ---- */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52 }, '#lesson');
    await captureAudio(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await driveToTeach(page);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Quiet')?.click());
    await page.waitForTimeout(300);
    const after = await played(page);
    const t = await text(page);
    check('Quiet offers its way back', /Unmute/.test(t));
    check('Next is still gated by the step with Quiet on',
      (await nextButton(page))?.disabled === true, JSON.stringify(await nextButton(page)));

    await page.evaluate(() => { window.__played.length = 0; });
    await page.waitForTimeout(400);
    check('and nothing plays after Quiet', (await played(page)).length === 0,
      (await played(page)).join(', '));
    await page.close();
  }

  /* ---- the cues actually move the math, and stop at the Try it ---- */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52 }, '#lesson');
    await captureAudio(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await driveToTeach(page);
    await page.waitForTimeout(1200);            // let the step's lines run

    // eqFrac step 1 is a bar: its script shades the target as Karla says it.
    const bar = await page.evaluate(() => {
      const el = [...document.querySelectorAll('div')].find(d => /^\d+\/\d+$/.test(d.textContent.trim()));
      return el ? el.textContent.trim() : null;
    });
    check('a bar cue shades the bar as Karla says it', bar && bar !== '0/3', `readout ${bar}`);

    // Walk to the Try it and confirm cues there change nothing.
    // The KICKER, not the spine: both say "New idea", and matching the spine meant
    // this loop never knew which step it was on.
    const kicker = async () => ((await text(page)).match(/STEP \d+ OF \d+[^\n]*/i)?.[0] || '');
    let guard = 0;
    while (guard++ < 40) {
      if (/try it/i.test(await kicker())) break;
      const moved = await page.evaluate((attempt) => {
        const next = [...document.querySelectorAll('button')].find(x => /^(Next|Start the mission)/.test(x.innerText.trim()));
        if (next && !next.disabled) { next.click(); return 'next'; }
        const walk = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Tap for the next line');
        if (walk) { walk.click(); return 'walk'; }
        // A bar. Karla's demo leaves the readout showing target/parts, so the
        // segment to tap is readable off the screen — and one click per round,
        // because React has not re-rendered inside this synchronous loop.
        // A bar. Karla's demo often leaves the readout at target/parts, but not
        // every step's script shades — so fall back to sweeping the segments, one
        // per round, rather than trusting a readout that may still be 0.
        const read = [...document.querySelectorAll('div')]
          .map(d => d.textContent.trim()).find(t => /^\d+\/\d+$/.test(t));
        const segs = [...document.querySelectorAll('button')].filter(x => !x.innerText.trim());
        if (!segs.length) return false;
        const demoTarget = read ? Number(read.split('/')[0]) : 0;
        const pick = demoTarget > 0 ? demoTarget - 1 : attempt % segs.length;
        segs[Math.max(0, Math.min(segs.length - 1, pick))].click();
        return 'bar';
      }, guard);
      if (!moved) break;
      await page.waitForTimeout(240);
    }
    const onTryIt = /try it/i.test(await kicker());
    check('reached the Try it step', onTryIt, await kicker());
    if (onTryIt) {
      await page.waitForTimeout(1400);          // its lines play too
      const state = await page.evaluate(() => {
        const el = [...document.querySelectorAll('div')].find(d => /^\d+\/\d+$/.test(d.textContent.trim()));
        const next = [...document.querySelectorAll('button')].find(x => /^(Next|Start the mission)/.test(x.innerText.trim()));
        return { readout: el ? el.textContent.trim() : null, nextDisabled: next ? next.disabled : null };
      });
      // Option 2: on a Try it the cues orient but never answer it for her.
      check('a Try it cue does not fill in the answer', state.readout === null || /^0\//.test(state.readout),
        `readout ${state.readout}`);
      check('and Karla talking does not solve the check', state.nextDisabled === true,
        JSON.stringify(state));
    }
    await page.close();
  }

  /* ---- LAW 2: nothing else sounds while Karla speaks ----

     What is demonstrable end to end is that the bus never lets two clips overlap.
     The register cannot be provoked here: it rings only when the books close,
     which is a different screen, so the two sounds in the product cannot currently
     collide through the UI at all. The guard against that is structural —
     playRegister() returns false while isSpeaking() — and the honest thing is to
     say so rather than stage a collision that the product cannot produce. */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52 }, '#lesson');
    await captureAudio(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await driveToTeach(page);

    // Hammer Again: every click restarts the sequence, and none may stack.
    const peak = await page.evaluate(async () => {
      let max = 0;
      const tick = setInterval(() => { max = Math.max(max, window.__playing); }, 10);
      for (let i = 0; i < 4; i++) {
        [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Again')?.click();
        await new Promise(r => setTimeout(r, 40));
      }
      await new Promise(r => setTimeout(r, 300));
      clearInterval(tick);
      return max;
    });
    check('two clips never play at once, however hard Again is hit', peak <= 1, `peak ${peak} concurrent`);
    await page.close();
  }
}
