/* The §0b layout gallery, desktop and phone.

   POLISH_TASKS Task 1's done-condition is that all four layouts render on both
   widths and that a wrong pick shows the hint WITHOUT blocking. That last clause
   is an ADHD law in disguise — a layout that locks after a wrong tap turns a
   teaching step into a punishment — so it is checked here rather than trusted.

   Builds tests/fixtures/teach-gallery.jsx with esbuild, serves it, drives it.
   Usage: node tests/test_layouts.mjs   (PW_CHROME as in CLAUDE.md) */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let PORT = 0;                       // OS-assigned: see test_webapp.mjs
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const out = await mkdtemp(path.join(tmpdir(), 'kampus-gallery-'));
execFileSync('npx', ['esbuild', 'tests/fixtures/teach-gallery.jsx',
  '--bundle', '--loader:.jsx=jsx', '--format=esm', `--outfile=${path.join(out, 'gallery.js')}`],
  { cwd: ROOT, stdio: 'pipe' });
await writeFile(path.join(out, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<div id="root"></div><script type="module" src="/gallery.js"></script>');

const server = createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];
  try {
    const body = await readFile(path.join(out, url === '/' ? 'index.html' : url));
    res.writeHead(200, { 'Content-Type': url.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, r));
PORT = server.address().port;

const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const errors = [];
const LAYOUTS = ['walk', 'faceoff', 'line', 'bar'];

try {
  for (const vp of [{ name: 'desktop', width: 1280, height: 1000 }, { name: 'phone', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('pageerror', e => errors.push(`${vp.name}: ${e.message.slice(0, 160)}`));
    // The fixture ships no favicon; the browser asking for one is not a defect.
    page.on('console', m => { if (m.type() === 'error' && !/favicon|status of 404/.test(m.text())) errors.push(`${vp.name}: ${m.text().slice(0, 160)}`); });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);

    const drawn = await page.evaluate(() => Object.fromEntries(
      [...document.querySelectorAll('section[data-layout]')].map(s => [s.dataset.layout,
        { h: s.offsetHeight, buttons: s.querySelectorAll('button').length }])));
    for (const l of LAYOUTS) {
      const d = drawn[l];
      check(`${vp.name}: the ${l} layout draws something tappable`,
        !!d && d.h > 120 && d.buttons > 0, JSON.stringify(d));
    }
    // Nothing may overflow the viewport sideways — the phone pass is the real test.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${vp.name}: no horizontal overflow`, overflow <= 1, `${overflow}px`);
    await page.close();
  }

  /* The clause that matters: a wrong pick explains and lets her carry on. */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on('pageerror', e => errors.push(`wrong-pick: ${e.message.slice(0, 160)}`));
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);

    // Face-off: pick the dearer bag (card 0 is the 45¢ one).
    const faceoff = await page.evaluate(() => {
      const s = document.querySelector('section[data-layout="faceoff"]');
      s.querySelectorAll('button')[0].click();
      return new Promise(r => setTimeout(() => r({ text: s.innerText, solved: s.dataset.solved }), 120));
    });
    check('a wrong face-off pick shows the step instead of just "wrong"',
      /Here is the step/.test(faceoff.text), faceoff.text.split('\n').pop()?.slice(0, 60));
    check('a wrong face-off pick does not mark the step solved', faceoff.solved === 'no');

    // Bar: overshoot the target, then come back down to it.
    const bar = await page.evaluate(() => {
      const s = document.querySelector('section[data-layout="bar"]');
      const segs = [...s.querySelectorAll('button')];
      segs[segs.length - 1].click();                    // shade everything: over the target
      return new Promise(r => setTimeout(() => r({ text: s.innerText, solved: s.dataset.solved }), 120));
    });
    check('overshooting the bar says so and offers the step', /Too many/.test(bar.text) && /Here is the step/.test(bar.text));
    check('overshooting does not lock the bar', bar.solved === 'no');

    const recovered = await page.evaluate(() => {
      const s = document.querySelector('section[data-layout="bar"]');
      s.querySelectorAll('button')[1].click();          // back down to 2 of 3
      return new Promise(r => setTimeout(() => r(s.dataset.solved), 150));
    });
    check('she can recover from a wrong bar without reloading', recovered === 'yes', recovered);

    // Line: tap a tick that is not the answer, then the one that is.
    const line = await page.evaluate(() => {
      const s = document.querySelector('section[data-layout="line"]');
      s.querySelectorAll('button')[0].click();
      return new Promise(r => setTimeout(() => r({ text: s.innerText, solved: s.dataset.solved }), 120));
    });
    check('a wrong tick on the line shows the step', /Here is the step/.test(line.text), line.text.slice(0, 60));
    check('nothing in the layouts counts down or scolds',
      !/seconds|hurry|too slow|wrong!|locked/i.test(await page.evaluate(() => document.body.innerText)));
    await page.close();
  }

  /* The re-teach panel: the plumbing for Karla's voice, before the scripts exist.

     Two things are worth a test here and nowhere else. The silent panel is what
     ships today and must be untouched by the plumbing. The voiced one proves the
     cue contract on a surface where nothing CAN be solved: a cue highlights the
     row it names, every row stays on screen, and the one control off the panel
     fires on a tap and on nothing else. That last clause is the gating law in the
     direction that nearly shipped broken once already — audio may not block her,
     and it may not advance her either. */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on('pageerror', e => errors.push(`reteach: ${e.message.slice(0, 160)}`));
    // Stub Audio: CI is silent, but every play() must still be observable and each
    // "clip" has to end promptly so the sequence advances without real durations.
    await page.addInitScript(() => {
      window.__played = [];
      const Real = window.Audio;
      window.Audio = function (src) {
        const el = new Real();
        let live = false;
        el.play = () => {
          window.__played.push(String(src).replace(location.origin, ''));
          live = true;
          // 200ms, not 20: short enough to keep the suite fast, long enough that a
          // 40ms poll sees each line's cue rather than only the one left standing
          // at the end. The first version of this check sampled after the sequence
          // had finished and would have passed with only the LAST cue firing.
          setTimeout(() => { if (live) { live = false; el.dispatchEvent(new Event('ended')); } }, 200);
          return Promise.resolve();
        };
        el.pause = () => { live = false; };
        return el;
      };
      window.Audio.prototype = Real.prototype;
    });
    await page.goto(`http://localhost:${PORT}/?voice=1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);

    const read = (sel) => page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const go = [...el.querySelectorAll('button')].find(b => /fresh ones/.test(b.innerText));
      return {
        text: el.innerText,
        rows: el.querySelectorAll('[data-reteach-row]').length,
        lit: [...el.querySelectorAll('[data-reteach-row]')].filter(r => r.dataset.lit === 'yes')
          .map(r => Number(r.dataset.reteachRow)),
        goDisabled: go ? go.disabled : null,
        litTitle: el.querySelector('[data-reteach-title]')?.dataset.lit,
        continued: window.__continued,
      };
    }, sel);

    const silent = await read('section[data-reteach="silent"]');
    check('an unscripted re-teach panel still renders its rows', silent?.rows === 3, JSON.stringify(silent?.rows));
    check('and offers no voice controls at all',
      !/Again|Slower|Quiet/.test(silent?.text || ''), (silent?.text || '').split('\n').slice(-2).join(' / '));
    check('nothing is highlighted when there is no script', silent?.lit.length === 0, JSON.stringify(silent?.lit));

    const voiced = await read('section[data-reteach="voiced"]');
    check('a scripted re-teach panel shows the spoken lines as text',
      /Look at the bottom row first/.test(voiced?.text || ''));
    check('and offers the same three controls as the teach steps',
      /Again/.test(voiced?.text || '') && /Slower/.test(voiced?.text || '') && /Quiet/.test(voiced?.text || ''));
    check('the way off the panel is live before a single clip plays', voiced?.goDisabled === false,
      voiced?.goDisabled === false ? 'enabled' : 'DISABLED');

    // Replay from the top and watch it, rather than reading the state it settles
    // in: the script is prompt → row.1 → row.2, and the order is the contract.
    await page.evaluate(() => [...document.querySelectorAll('section[data-reteach="voiced"] button')]
      .find(b => b.innerText.trim() === 'Again')?.click());
    const during = [];
    for (let i = 0; i < 20; i++) {
      during.push(await read('section[data-reteach="voiced"]'));
      await page.waitForTimeout(40);
    }
    // Each distinct highlight, in the order it first appeared: 'title' for the
    // prompt cue, then the row numbers.
    const seq = [];
    for (const d of during) {
      const mark = d?.litTitle === 'yes' ? 'title' : (d?.lit?.[0] ?? null);
      if (mark !== null && mark !== seq[seq.length - 1]) seq.push(mark);
    }
    check('the cues highlight what they name, in the order Karla says them',
      JSON.stringify(seq) === JSON.stringify(['title', 1, 2]), `saw ${JSON.stringify(seq)}`);
    check('one highlight at a time, never two',
      during.every(d => (d?.lit.length || 0) + (d?.litTitle === 'yes' ? 1 : 0) <= 1),
      JSON.stringify(during.map(d => [d?.litTitle, d?.lit])));
    check('every row stays on screen while she listens — a cue highlights, it does not reveal',
      during.every(d => d?.rows === 3), JSON.stringify(during.map(d => d?.rows)));
    check('the clips that played are this panel\'s clips',
      (await page.evaluate(() => window.__played)).every(c => c.includes('/voice/fake/')),
      (await page.evaluate(() => window.__played)).slice(0, 2).join(', '));

    const after = await read('section[data-reteach="voiced"]');
    check('audio never gates: the way off the panel was never disabled',
      during.every(d => d?.goDisabled === false) && after?.goDisabled === false,
      JSON.stringify(during.map(d => d?.goDisabled)));
    check('audio never advances her either: nothing moved on without a tap',
      after?.continued === 0, `onContinue fired ${after?.continued} times`);

    // Quiet, the control a kid who cannot bear the voice will reach for.
    await page.evaluate(() => [...document.querySelectorAll('section[data-reteach="voiced"] button')]
      .find(b => b.innerText.trim() === 'Quiet')?.click());
    await page.waitForTimeout(60);
    await page.evaluate(() => { window.__played.length = 0; });
    await page.waitForTimeout(300);
    const quiet = await read('section[data-reteach="voiced"]');
    check('Quiet stops the voice and nothing plays after it',
      (await page.evaluate(() => window.__played)).length === 0,
      (await page.evaluate(() => window.__played)).join(', '));
    check('Quiet does not take the way off the panel with it',
      quiet?.goDisabled === false && quiet?.rows === 3, JSON.stringify(quiet));

    // And the tap itself still works, which is the whole point of the panel.
    await page.evaluate(() => [...document.querySelectorAll('section[data-reteach="voiced"] button')]
      .find(b => /fresh ones/.test(b.innerText))?.click());
    await page.waitForTimeout(60);
    check('a tap on it moves her on', (await page.evaluate(() => window.__continued)) === 1,
      String(await page.evaluate(() => window.__continued)));
    await page.close();
  }

  /* rich() and plainSpeech(): the screen and the voice, on the same strings. */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on('pageerror', e => errors.push(`rich: ${e.message.slice(0, 160)}`));
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);

    const seen = await page.evaluate(() => {
      const cases = [...document.querySelectorAll('[data-rich-case]')];
      return {
        n: cases.length,
        text: cases.map(c => c.innerText),
        sups: cases.map(c => c.querySelectorAll('sup').length),
        bolds: cases.map(c => c.querySelectorAll('strong').length),
        plain: window.__plain, want: window.__plainWant,
      };
    });

    check('the markup cases rendered at all', seen.n === 6, `${seen.n} cases`);
    check('a superscript becomes a real <sup> element, not flat digits',
      seen.sups[0] === 1 && seen.sups[1] === 1 && seen.sups[2] === 1, JSON.stringify(seen.sups));
    check('no tag is ever printed as text', !seen.text.join(' ').includes('<'),
      seen.text.find(x => x.includes('<')) || 'none');
    check('a bolded exponent keeps BOTH the bold and the superscript',
      seen.bolds[4] === 1 && seen.sups[4] === 1, `strong ${seen.bolds[4]}, sup ${seen.sups[4]}`);
    check('an unknown tag is dropped, not shown', seen.text[5] === 'Nothing special here.', seen.text[5]);
    const wrong = (seen.plain || []).map((got, i) => (got === seen.want[i] ? null : `${i}: "${got}"`)).filter(Boolean);
    check('the voice says "to the", never the flattened number', wrong.length === 0,
      wrong.join(' | ') || seen.plain[1]);

    /* The sweep's timing sources. */
    const sw = await page.evaluate(() => window.__sweep);
    check('a line splits into its words', sw.nWords === 11, `${sw.nWords} words`);
    check('word starts rise through the line', sw.startsRise);
    check('a longer word gets a longer slice of the clip', sw.longerWordGetsLongerSlice);
    check('exact timings are used when the manifest has them', sw.exactUsed, JSON.stringify(sw.exactUsed));
    check('timings that do not match the words are refused, not stretched', sw.mismatchRefused);
    check('without a duration nothing is swept rather than guessed', sw.noDuration === -1, String(sw.noDuration));
    check('exact timings need no duration', sw.exactIgnoresDuration === 2, String(sw.exactIgnoresDuration));
    check('the first word is held at t=0 and the last at the end',
      sw.firstWord === 0 && sw.lastWord === sw.nWords - 1, `${sw.firstWord} … ${sw.lastWord}`);
    check('the held word never goes backwards', sw.monotonic);
    await page.close();
  }

  check('no uncaught errors in any layout', errors.length === 0, errors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\nLAYOUT GALLERY: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.error('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
