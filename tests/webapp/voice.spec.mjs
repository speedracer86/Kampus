/* Say-it-show-it, and the two laws that bound it (docs/VOICE_PASS.md §2/§3).

   CI cannot hear anything, so this asserts the WIRING and the LAWS:

     1. audio never gates — Next's enabled state must be identical with clips
        present, with them playing, and with Quiet on. A kid must be able to tap
        straight through a lesson having heard nothing.
     2. while Karla speaks, nothing else sounds — the register is the only other
        sound in the product, and the bus refuses it mid-line.

   Grade 4 day 52 is eqFrac, tranche 1, The Kitchen — the exact lesson the owner's
   family re-tests on. Part of the suite; run via `npm run test:webapp`. */
import { open, text, driveToTeach, nextButton, clickText } from './harness.mjs';

/** Stub Audio so CI stays silent but every play() is observable.

    It MODELS A CLIP rather than just firing 'ended': a duration, and a
    currentTime that advances with wall time scaled by playbackRate. Without
    that, progress() reports t=0 and d=NaN, the word sweep never starts, and
    every assertion about it would pass against a product that does not sweep —
    while `Slower` would be untestable, since the whole point is that the sweep
    rides the clip's clock rather than a timer of its own. */
/* Long enough to be representative: a real line of ~15 words runs 2-4 seconds,
   so a word is held for 150-250ms. At 0.6s the whole line flew past in under
   two frames of the highlight's own fade, which told us nothing about whether a
   kid would ever see it. */
const CLIP_SECONDS = 1.6;
const CLIP_MS = CLIP_SECONDS * 1000;
const captureAudio = (page) => page.addInitScript((DUR) => {
  window.__played = [];
  window.__playing = 0;
  const Real = window.Audio;
  window.Audio = function (src) {
    const el = new Real();
    el.src = src;
    let live = false, cur = 0, raf = 0, t0 = 0;
    try {
      Object.defineProperty(el, 'duration', { get: () => DUR });
      Object.defineProperty(el, 'currentTime', { get: () => cur, set: (v) => { cur = Number(v) || 0; } });
      Object.defineProperty(el, 'readyState', { get: () => 4 });
      Object.defineProperty(el, 'paused', { get: () => !live });
      Object.defineProperty(el, 'ended', { get: () => cur >= DUR });
    } catch { /* fine */ }
    const stopTicking = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    el.play = () => {
      window.__played.push(String(src).replace(location.origin, ''));
      window.__playing++; live = true; cur = 0; t0 = performance.now();
      const tick = () => {
        if (!live) return;
        cur = Math.min(DUR, ((performance.now() - t0) / 1000) * (el.playbackRate || 1));
        if (cur >= DUR) {
          live = false; window.__playing--; stopTicking();
          // A real element fires 'ended' only when it runs out, never on pause.
          el.dispatchEvent(new Event('ended'));
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return Promise.resolve();
    };
    el.pause = () => { if (live) { live = false; window.__playing--; stopTicking(); } };
    return el;
  };
  window.Audio.prototype = Real.prototype;
}, CLIP_SECONDS);

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

    await page.waitForTimeout(CLIP_MS * 1.6);     // long enough for two lines
    const clips = await played(page);
    check('arriving at the step plays its lines, in order', clips.length >= 2,
      clips.slice(0, 3).join(' → '));
    /* Karla hosts the move before the step speaks, so its clip legitimately
       plays first. What must never happen is ANOTHER STEP's clip. */
    const stepClips = clips.filter(c => !c.includes('/voice/move_'));
    check('and they are this step\'s clips, not another step\'s',
      stepClips.length > 0 && stepClips.every(c => c.includes('/voice/eqFrac/')),
      stepClips.slice(0, 2).join(', ') || 'no step clips played');

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
    await page.waitForTimeout(CLIP_MS * 2.2);   // through the shade cue on line 2

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
      await page.waitForTimeout(CLIP_MS * 1.5);  // its lines play too
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

  /* ---- the script is the hero while she speaks, and the sweep rides the clip ---- */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52 }, '#lesson');
    await captureAudio(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await driveToTeach(page);

    /** The script block, as the browser computes it. */
    const script = () => page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-say-line]')];
      const px = (el) => Math.round(parseFloat(getComputedStyle(el).fontSize));
      const cur = rows.find(r => r.dataset.sayState === 'current');
      const words = [...document.querySelectorAll('[data-say-word]')];
      const colourOf = (st) => {
        const w = words.find(x => x.dataset.wordState === st);
        return w ? getComputedStyle(w).color : null;
      };
      return {
        rows: rows.length,
        states: rows.map(r => r.dataset.sayState),
        sizes: words.map(px),
        scriptSize: rows[0] ? px(rows[0]) : null,
        promptSize: document.querySelector('h2') ? px(document.querySelector('h2')) : null,
        held: words.filter(w => w.dataset.wordState === 'now')
          .map(w => getComputedStyle(w).backgroundColor),
        inkSaid: colourOf('said'), paleAhead: colourOf('ahead'),
        nowAt: cur ? [...cur.querySelectorAll('[data-say-word]')].findIndex(w => w.dataset.wordState === 'now') : -1,
        wordCount: words.length,
      };
    });

    // Sample while the first line plays.
    const frames = [];
    for (let i = 0; i < 14; i++) { frames.push(await script()); await page.waitForTimeout(45); }
    const speakingFrames = frames.filter(f => f.states.includes('current'));
    check('a line is the current one while she speaks', speakingFrames.length > 0,
      `${speakingFrames.length} of ${frames.length} frames`);

    const f = speakingFrames[0] || frames[0];
    /* The demo's model: ONE paragraph, ONE size, state carried by colour alone.
       The first build of this stacked the lines and resized the current one,
       which moves the text under a kid who is trying to read it. */
    check('the whole script is on screen, not revealed line by line',
      f.rows === frames[0].rows && f.rows > 1, `${f.rows} lines throughout`);
    check('the script is one size from end to end',
      new Set(f.sizes).size === 1, `${new Set(f.sizes).size} distinct sizes`);
    check('and that size is the demo\'s hero scale, not caption size',
      f.scriptSize === 26, `${f.scriptSize}px (prompt is ${f.promptSize}px)`);
    check('exactly one word is held at a time', speakingFrames.every(x => x.held.length <= 1),
      JSON.stringify(speakingFrames.map(x => x.held.length)));
    /* Over the frames, not in one: the highlight fades in over .25s, so a single
       sample catches it mid-transition at 5% alpha. Hue must be the demo's gold,
       and it must actually reach visible — an invisible highlight would otherwise
       satisfy a hue-only check. */
    const golds = speakingFrames.flatMap(x => x.held)
      .map(c => (c || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/))
      .filter(Boolean)
      .map(m => ({ rgb: `${m[1]},${m[2]},${m[3]}`, a: m[4] === undefined ? 1 : Number(m[4]) }))
      // A word that has just become current can be sampled at zero alpha, which
      // the browser reports as rgba(0,0,0,0) — not a wrong colour, just not
      // painted yet.
      .filter(g => g.a > 0);
    check('the held word is the demo\'s gold', golds.length > 0 && golds.every(g => g.rgb === '255,233,168'),
      golds[0] ? golds[0].rgb : 'nothing held');
    check('and it reaches full strength, not a ghost of itself',
      Math.max(0, ...golds.map(g => g.a)) > 0.5,
      `peak alpha ${Math.max(0, ...golds.map(g => g.a)).toFixed(2)}`);
    check('words already said are ink and words to come are pale',
      f.inkSaid !== f.paleAhead && !!f.paleAhead, `said ${f.inkSaid} vs ahead ${f.paleAhead}`);

    // The sweep: the held word must MOVE through the line, not sit on word one.
    const swept = [...new Set(speakingFrames.map(x => x.nowAt).filter(n => n >= 0))];
    check('the highlight sweeps word by word through the line', swept.length > 1,
      `held words seen: ${swept.join(', ') || 'none'}`);
    check('it moves forward, never backwards within a line',
      (() => {
        let last = -1, ok = true;
        for (const x of speakingFrames) {
          if (x.nowAt < 0) continue;
          if (x.nowAt < last && x.states.indexOf('current') === speakingFrames[0].states.indexOf('current')) ok = false;
          last = Math.max(last, x.nowAt);
        }
        return ok;
      })());

    /* Slower slows BOTH, because the sweep reads the clip's clock rather than a
       timer of its own: at 0.8 the same wall-clock window covers less of the
       line. Measured as a fraction of the line, so it does not depend on which
       line happens to be playing. */
    const sweepReach = async () => {
      await page.evaluate(() => [...document.querySelectorAll('button')]
        .find(b => b.innerText.trim() === 'Again')?.click());
      // Far enough in that one playback rate is several WORDS ahead of the
      // other. At 200ms of a 1.6s clip both rates were still on word one, and
      // the check compared two identical numbers and called it agreement.
      // Three quarters of the way through at full speed, so the two rates are
      // several WORDS apart. Words are not equal lengths, so comparing
      // percentages rounded to whole numbers hid a real difference behind
      // "50% vs 50%"; the word index is what the eye actually sees.
      await page.waitForTimeout(CLIP_MS * 0.75);
      return page.evaluate(() => {
        const cur = [...document.querySelectorAll('[data-say-line]')].find(r => r.dataset.sayState === 'current');
        if (!cur) return -1;
        return [...cur.querySelectorAll('[data-say-word]')].findIndex(w => w.dataset.wordState === 'now');
      });
    };
    const atFull = await sweepReach();
    await page.evaluate(() => [...document.querySelectorAll('button')]
      .find(b => b.innerText.trim() === 'Slower')?.click());
    await page.waitForTimeout(120);
    const atSlow = await sweepReach();
    check('Slower slows the sweep with the voice, not just the voice',
      atSlow >= 0 && atFull > atSlow, `word ${atFull} at 1.0, word ${atSlow} at 0.8`);

    /* And the law that outranks the redesign. */
    check('the hero script still does not gate Next',
      (await nextButton(page))?.disabled === true, JSON.stringify(await nextButton(page)));
    await page.close();
  }

  /* ---- the question screens joined the product (owner, Nov 2026) ---- */
  {
    // A returning grade-4 kid: band a, so she is read to without asking, and
    // the warm-up exists (a first-ever lesson opens on the New idea instead).
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52, days: { '2026-01-02': 1 } }, '#lesson');
    await captureAudio(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);

    const t = await text(page);
    check('Karla hosts the move with her own line', /Quick ones first/.test(t),
      (t.match(/Quick ones[^\n]*/) || ['missing'])[0]);
    check('and the host line is spoken from the bank\'s own clip',
      (await played(page)).some(c => c.includes('/voice/move_warmup/')),
      (await played(page)).slice(0, 2).join(', ') || 'nothing played');

    /** The question, its words, and everything that could gate. */
    const look = () => page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const words = h2 ? [...h2.querySelectorAll('[data-say-word]')] : [];
      const answers = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
      return {
        words: words.length,
        now: words.findIndex(w => w.dataset.wordState === 'now'),
        answers: answers.length,
        anyDisabled: answers.some(b => b.disabled),
        heading: h2 ? h2.innerText.slice(0, 40) : null,
      };
    });

    /* Replay it rather than racing it: the browser voice finishes a short
       question in well under a second, so sampling after the page settles
       watches a sentence that has already been read. */
    await page.evaluate(() => [...document.querySelectorAll('button')]
      .find(b => b.getAttribute('aria-label') === 'Read it to me')?.click());
    const frames = [];
    for (let i = 0; i < 14; i++) { frames.push(await look()); await page.waitForTimeout(25); }
    const swept = frames.filter(f => f.words > 0);
    check('the question sweeps word by word, like the teaching does',
      swept.length > 0, `${swept.length} of ${frames.length} frames carried word spans`);
    const held = [...new Set(swept.map(f => f.now).filter(n => n >= 0))];
    check('and the held word moves through it', held.length > 1, `words held: ${held.join(', ') || 'none'}`);

    /* THE LAW, on the screen a kid spends most of her time on. */
    check('every answer stays tappable while Karla reads the question',
      frames.every(f => f.answers >= 2 && !f.anyDisabled),
      JSON.stringify(frames.map(f => [f.answers, f.anyDisabled])));
    check('and Karla never picks one for her',
      await page.evaluate(() => !document.querySelector('[data-picked], [aria-pressed="true"]')));

    // The kid answers mid-sentence: audio must not be in the way.
    await page.evaluate(() => {
      const a = [...document.querySelectorAll('button')].find(b => /^\d\n/.test(b.innerText.trim()));
      a?.click();
    });
    await page.waitForTimeout(250);
    check('answering while she is still talking works',
      /\+\$|Not yet|Next/.test(await text(page)), (await text(page)).slice(0, 60).replace(/\n/g, ' '));
    await page.close();
  }

  /* ---- everywhere means everywhere: the paper reads too (owner, Nov 2026) ----

     A self-learning kid has no adult beside her to be the reader, and that is
     most true on an assessment — the screen where a reading difficulty gets
     mistaken for a maths one. So Hope reads the QUESTION on Inspection Day, the
     grade test and placement, with the same sweep as a lesson.

     And only the question. On a paper there is no hint to read and no step to
     walk: reading the question is an accommodation, reading the way to the
     answer would be sitting the test for her. */
  {
    // Grade 4 is band a, so she is read to without having to ask.
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 0, kredits: 100 }, '#quiz');
    await captureAudio(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await clickText(page, 'Start');
    await page.waitForTimeout(700);

    const paper = () => page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const inHeading = h2 ? [...h2.querySelectorAll('[data-say-word]')].length : 0;
      const everywhere = [...document.querySelectorAll('[data-say-word]')].length;
      const answers = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
      const now = h2 ? [...h2.querySelectorAll('[data-say-word]')].findIndex(w => w.dataset.wordState === 'now') : -1;
      return { inHeading, everywhere, answers: answers.length, anyDisabled: answers.some(b => b.disabled), now };
    });

    /* Replayed rather than raced. "71 + 44" takes the browser voice well under a
       second, so sampling after the screen settles watches a question that has
       already been read. */
    await page.evaluate(() => document.querySelector('[aria-label="Read it to me"]')?.click());
    const frames = [];
    for (let i = 0; i < 14; i++) { frames.push(await paper()); await page.waitForTimeout(25); }
    const read = frames.filter(f => f.inHeading > 0);
    check('Inspection Day reads the question aloud, with the sweep',
      read.length > 0, `${read.length} of ${frames.length} frames carried word spans`);
    const held = [...new Set(read.map(f => f.now).filter(n => n >= 0))];
    check('and the held word moves through it', held.length > 1, `words held: ${held.join(', ') || 'none'}`);

    /* The clause that keeps it an accommodation rather than a hint. */
    check('nothing below the question is ever read on a paper',
      frames.every(f => f.everywhere === f.inHeading),
      JSON.stringify(frames.map(f => [f.inHeading, f.everywhere]).find(([a, b]) => a !== b) || 'question only'));

    check('every answer stays tappable while she is read to',
      frames.every(f => f.answers >= 2 && !f.anyDisabled),
      JSON.stringify(frames.map(f => [f.answers, f.anyDisabled])[0]));

    // Scoring is untouched: the paper still hands in and still marks.
    const t = await text(page);
    check('and the paper is still a paper', /of \d+|Hand it in|Question/i.test(t),
      t.slice(0, 70).replace(/\n/g, ' '));
    await page.close();

    /* Placement is the first maths a new kid meets, sat before anyone knows
       what she can read. It reads too. */
    const pl = await open({ grade: 3, name: 'Talia', placementQueued: true }, '#home');
    await pl.waitForTimeout(600);
    await clickText(pl, 'Start');
    await pl.waitForTimeout(600);
    const onPlacement = /FINDING YOUR LEVEL|of 24/i.test(await text(pl));
    if (onPlacement) {
      await pl.evaluate(() => document.querySelector('[aria-label="Read it to me"]')?.click());
      let sawWords = 0;
      for (let i = 0; i < 14; i++) {
        sawWords = Math.max(sawWords, await pl.evaluate(() =>
          (document.querySelector('h2')?.querySelectorAll('[data-say-word]') || []).length));
        await pl.waitForTimeout(25);
      }
      check('placement questions are read with the sweep too', sawWords > 0, `${sawWords} words swept`);
    } else {
      check('placement was reachable to check', false, (await text(pl)).slice(0, 80).replace(/\n/g, ' '));
    }
    await pl.close();
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
