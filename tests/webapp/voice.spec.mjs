/* Say-it-show-it, and the two laws that bound it (docs/VOICE_PASS.md §2/§3).

   CI cannot hear anything, so this asserts the WIRING and the LAWS:

     1. audio never gates — Next's enabled state must be identical with clips
        present, with them playing, and with Quiet on. A kid must be able to tap
        straight through a lesson having heard nothing.
     2. while Karla speaks, nothing else sounds — the register is the only other
        sound in the product, and the bus refuses it mid-line.

   Grade 4 day 52 is eqFrac, tranche 1, The Kitchen — the exact lesson the owner's
   family re-tests on. Part of the suite; run via `npm run test:webapp`. */
import { open, text, driveToTeach, nextButton, clickText, voiceLog } from './harness.mjs';

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
      atSlow >= 0 && atFull > atSlow, `word ${atFull} at the band default, word ${atSlow} after Slower`);

    /* The pace is HERS now, not the session's. Owner's play-test: Hope was too
       fast for the kid this is built for, and a choice she has to make again on
       every screen is a choice she will stop making. */
    check('Slower is remembered for this kid',
      await page.evaluate(() => JSON.parse(localStorage.getItem('kampus_v1_local') || '{}').settings?.voiceRate) === 0.75,
      JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem('kampus_v1_local') || '{}').settings)));

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

  /* ---- the Snag reads (owner's play-test, Nov 2026) ----

     It was the one question surface still silent, and it is the FIRST beat of a
     new idea: a brand-new kid meets it before anything has been taught. A
     first-ever lesson opens straight on it, which is how the owner found it. */
  {
    const page = await open({ grade: 3, name: 'Talia', lessonPointer: 0 }, '#lesson');
    await page.waitForTimeout(900);
    const t = await text(page);
    const onSnag = /The snag/i.test(t);
    check('a first lesson opens on the Snag', onSnag, t.slice(0, 70).replace(/\n/g, ' '));
    if (onSnag) {
      await page.evaluate(() => document.querySelector('[aria-label="Read it to me"]')?.click());
      const seen = [];
      for (let i = 0; i < 16; i++) {
        seen.push(await page.evaluate(() => {
          const words = [...document.querySelectorAll('[data-say-word]')];
          const now = words.findIndex(w => w.dataset.wordState === 'now');
          const h2 = document.querySelector('h2');
          const inQuestion = h2 ? [...h2.querySelectorAll('[data-say-word]')].length : 0;
          return { total: words.length, now, inQuestion };
        }));
        await page.waitForTimeout(30);
      }
      const live = seen.filter(f => f.total > 0);
      check('the Snag is read with the sweep', live.length > 0,
        `${live.length} of ${seen.length} frames`);
      const held = [...new Set(live.map(f => f.now).filter(n => n >= 0))];
      check('and the held word moves through the scene', held.length > 1,
        `held: ${held.slice(0, 6).join(', ') || 'none'}`);
      check('the scene and the question are one sweep, not two readers',
        live.every(f => f.inQuestion < f.total),
        JSON.stringify(live[0]));
      check('one companion on the Snag, not two',
        await page.evaluate(() => document.querySelectorAll('[aria-label="Read it to me"]').length) === 1);
    }
    await page.close();
  }

  /* ---- the mission surface: one face, and nothing left greyed ----

     The owner photographed this one: the world's mascot floating above the card
     AND Question's disc inside it, the question stuck in not-yet-reached grey,
     and no sweep. All three were one bug — two readers on one screen, each
     cancelling the other's utterance, leaving a hook that believed it was still
     talking with the sweep parked on word one. */
  {
    const page = await open({ grade: 3, name: 'Talia', lessonPointer: 0, kredits: 400,
      days: { '2026-01-02': 1 }, lastTopic: 'frac' }, '#home');
    await page.waitForTimeout(700);
    const started = await page.evaluate(() => {
      const play = [...document.querySelectorAll('button')].find(b => /^Play /.test(b.getAttribute('aria-label') || ''));
      if (play) { play.click(); return true; }
      return false;
    });
    check('a free-practice round opens', started);
    if (started) {
      await page.waitForTimeout(900);
      check('one reader on the mission screen, not two',
        await page.evaluate(() => document.querySelectorAll('[aria-label="Read it to me"]').length) === 1,
        String(await page.evaluate(() => document.querySelectorAll('[aria-label="Read it to me"]').length)));

      /* The face sits in the lesson's slot — inside the question card, above the
         prompt — not floating over the top of the screen on its own. */
      const placed = await page.evaluate(() => {
        const face = document.querySelector('[aria-label="Read it to me"]');
        const h2 = document.querySelector('h2');
        if (!face || !h2) return null;
        const f = face.getBoundingClientRect();
        const q = h2.getBoundingClientRect();
        // Directly above the question and sharing its left edge, within a line or two.
        return { above: f.bottom <= q.top + 4, near: Math.abs(f.left - q.left) < 24,
          gap: Math.round(q.top - f.bottom) };
      });
      check('the companion sits in the lesson\'s slot, not floating over the screen',
        !!placed && placed.above && placed.near, JSON.stringify(placed));

      await page.evaluate(() => document.querySelector('[aria-label="Read it to me"]')?.click());
      const frames = [];
      for (let i = 0; i < 24; i++) {
        frames.push(await page.evaluate(() => {
          const words = [...document.querySelectorAll('[data-say-word]')];
          return { n: words.length, now: words.findIndex(w => w.dataset.wordState === 'now'),
            pale: words.filter(w => w.dataset.wordState === 'ahead').length };
        }));
        await page.waitForTimeout(40);
      }
      const held = [...new Set(frames.map(f => f.now).filter(n => n >= 0))];
      check('the mission question sweeps', held.length > 1, `held: ${held.join(', ') || 'none'}`);
      /* THE DEFECT: it must not be left mid-read. Once the voice stops, the
         spans go and nothing is left in the not-yet-reached grey. */
      const last = frames[frames.length - 1];
      check('and nothing is left greyed when she stops', last.n === 0 || last.pale === 0,
        JSON.stringify(last));
    }
    await page.close();
  }

  /* ---- readers take turns (owner's play-test, Nov 2026) ----

     On a band-a move two readers arrive together: Karla introduces the move and
     the question reads itself. Both fired on mount, so whoever went second cut
     the first off mid-word — nothing stranded, but a kid with auditory
     processing delays who loses half a sentence has lost the sentence.

     The stub records a CUT when one utterance interrupts another, so this
     asserts the strong thing (nobody was interrupted) rather than the weak one
     (both of them eventually spoke). */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52,
      days: { '2026-01-02': 1 } }, '#lesson');
    // Clips are stubbed too: the host reads from the bank's recording, and
    // without this the only visible reader would be the browser voice.
    await captureAudio(page);
    /* The marker is written at DOCUMENT START, not after `networkidle`. The
       question begins reading about 50ms into the load, long before a page is
       idle, so a baseline taken afterwards misses the very utterance this block
       is about — which is how an earlier version of this check concluded the
       question never spoke at all. */
    await page.addInitScript(() => { try { window.__kampusVoice('mark', 'load'); } catch { /* fine */ } });
    const before = voiceLog.length;
    await page.reload({ waitUntil: 'networkidle' });
    const marked = voiceLog.findIndex((e, i) => i >= before && e.kind === 'mark');
    const from = marked >= 0 ? marked + 1 : voiceLog.length;
    await page.waitForTimeout(600);

    /* THE LAW FIRST: a wait is not a gate. While one reader is waiting its
       turn, every answer is live and nothing is disabled. */
    const duringWait = [];
    for (let i = 0; i < 10; i++) {
      duringWait.push(await page.evaluate(() => {
        const answers = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
        return { answers: answers.length, disabled: answers.filter(b => b.disabled).length };
      }));
      await page.waitForTimeout(120);
    }
    check('answers stay live while a reader waits its turn',
      // answers > 0 matters: with none on screen this would pass against a
      // page that never rendered a question at all.
      duringWait.every(f => f.answers >= 2 && f.disabled === 0),
      JSON.stringify(duringWait.find(f => f.disabled || f.answers < 2) || 'all live'));

    await page.waitForTimeout(6000);            // let both readers have their turn
    const log = voiceLog.slice(from);
    const cuts = log.filter(e => e.kind === 'cut');
    check('nobody is cut off mid-sentence', cuts.length === 0,
      cuts.map(c => `"${c.text.slice(0, 40)}"`).join(' | ') || 'no cuts');

    const starts = log.filter(e => e.kind === 'start');
    const ends = log.filter(e => e.kind === 'end');
    /* The host reads from the bank's RECORDING and the question from the
       browser voice, so "both spoke" is one of each — not two utterances. */
    const clips = await page.evaluate(() => window.__played || []);
    check('both the host line and the question were spoken',
      clips.some(c => c.includes('/voice/move_')) && starts.length >= 1,
      `clip: ${clips.find(c => c.includes('/voice/move_')) || 'none'} | tts: ${starts.map(e => `"${e.text.slice(0, 24)}"`).join(' | ') || 'none'}`);
    check('and each finished before the next began',
      ends.length >= starts.length - 1, `${starts.length} started, ${ends.length} finished`);

    // Interleaving, stated as the records themselves: no start between a
    // start and its matching end.
    let open_ = 0, overlapped = false;
    for (const e of log) {
      if (e.kind === 'start') { if (open_ > 0) overlapped = true; open_ += 1; }
      if (e.kind === 'end' || e.kind === 'cut') open_ = Math.max(0, open_ - 1);
    }
    check('two readers never speak at the same time', !overlapped,
      log.map(e => e.kind[0]).join(''));
    await page.close();
  }

  /* ---- a blocked read is an invitation, never a lie ----

     On a freshly loaded page Chrome refuses both `speechSynthesis.speak()` and
     `audio.play()` until the kid has touched something. The owner found the
     companion sitting on "Reading it to you…" with nothing happening: the
     product promised a reader and delivered silence.

     This refuses everything until a flag flips, exactly as the browser does. */
  {
    const page = await open({ grade: 4, name: 'Talia', lessonPointer: 52,
      days: { '2026-01-02': 1 } }, '#lesson');
    await page.addInitScript(() => {
      window.__allowAudio = false;
      const RealAudio = window.Audio;
      window.Audio = function (src) {
        const el = new RealAudio(); el.src = src;
        let live = false;
        el.play = () => {
          if (!window.__allowAudio) {
            const e = new Error('blocked'); e.name = 'NotAllowedError';
            return Promise.reject(e);
          }
          live = true;
          setTimeout(() => { if (live) { live = false; el.dispatchEvent(new Event('ended')); } }, 120);
          return Promise.resolve();
        };
        el.pause = () => { live = false; };
        try { Object.defineProperty(el, 'paused', { get: () => !live }); } catch { /* fine */ }
        return el;
      };
      window.Audio.prototype = RealAudio.prototype;

      const sink = {
        speak: (u) => {
          if (!window.__allowAudio) {
            // Exactly what Chrome sends before a gesture.
            setTimeout(() => { try { u.onerror?.({ error: 'not-allowed' }); } catch { /* fine */ } }, 0);
            return;
          }
          try { window.__kampusSpoke(String(u?.text ?? u)); } catch { /* fine */ }
          const text = String(u?.text ?? '');
          let at = 0;
          const step = () => {
            const next = text.indexOf(' ', at + 1);
            if (next < 0) {
              try { u?.onboundary?.({ charIndex: text.length }); } catch { /* fine */ }
              try { u?.onend?.({}); } catch { /* fine */ }
              return;
            }
            at = next;
            try { u.onboundary?.({ charIndex: at }); } catch { /* fine */ }
            setTimeout(step, 30);
          };
          setTimeout(step, 30);
        },
        cancel: () => {}, getVoices: () => [], pause: () => {}, resume: () => {},
        speaking: false, pending: false, paused: false,
      };
      try { Object.defineProperty(window, 'speechSynthesis', { get: () => sink, configurable: true }); } catch { /* fine */ }
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const look = () => page.evaluate(() => {
      const label = [...document.querySelectorAll('span')]
        .map(x => x.innerText).find(t => /Reading it to you|Tap me to hear it/.test(t || '')) || null;
      const answers = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
      return { label, words: document.querySelectorAll('[data-say-word]').length,
        answers: answers.length, disabled: answers.filter(b => b.disabled).length };
    });

    const blocked = await look();
    check('a blocked read never claims to be reading',
      blocked.label === 'Tap me to hear it.', JSON.stringify(blocked.label));
    check('and nothing is swept while nothing is being said', blocked.words === 0,
      `${blocked.words} words`);
    check('the screen stays fully tappable while the voice is blocked',
      blocked.answers >= 2 && blocked.disabled === 0, JSON.stringify(blocked));

    /* Her first tap ANYWHERE is the one that starts the read — she should not
       have to find the disc. */
    await page.evaluate(() => {
      window.__allowAudio = true;
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    let sawWords = 0, sawLabel = null;
    for (let i = 0; i < 20; i++) {
      const f = await look();
      sawWords = Math.max(sawWords, f.words);
      if (f.label === 'Reading it to you…') sawLabel = f.label;
      await page.waitForTimeout(40);
    }
    check('her first tap anywhere starts the read she was promised',
      sawWords > 0, `${sawWords} words swept after the tap`);
    check('and the label only claims to read once something really is',
      sawLabel === 'Reading it to you\u2026' || sawWords > 0, String(sawLabel));
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
