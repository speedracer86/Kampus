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

    /* The placement runner changes shape rather than shrinking: four named
       world cells on desktop, four segments plus one named chip on a phone.
       Four 14px dots with names beside them do not fit 390px, and squeezing
       them is how the bar would become unreadable instead of becoming phone. */
    const pl = await page.evaluate(() => {
      const sec = document.querySelector('section[data-placement="start"]');
      if (!sec) return null;
      const cells = [...sec.querySelectorAll('[data-world-cell]')];
      return { cells: cells.length, named: cells.filter(c => (c.innerText || '').trim()).length,
        text: sec.innerText };
    });
    check(`${vp.name}: the runner shows all four worlds`, pl?.cells === 4, JSON.stringify(pl?.cells));
    if (vp.name === 'phone') {
      check('phone: the worlds are segments, with one named chip, not four labelled cells',
        pl?.named === 0 && /Looking now/.test(pl?.text || '') && /Finding your level/.test(pl?.text || ''),
        `${pl?.named} labelled cells`);
    } else {
      check('desktop: every world cell carries its own name and status',
        pl?.named === 4 && /Up next/.test(pl?.text || ''), `${pl?.named} labelled cells`);
    }
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
    /* §0c: the bar is there whether or not the bank scripted this panel — an
       unscripted one still reads its title aloud. What it must NOT have is the
       old Again / Unmute chrome, which the bar replaced. */
    check('an unscripted panel still gets the voice bar, and none of the old chrome',
      /Slower/.test(silent?.text || '') && /Quiet/.test(silent?.text || '')
      && !/\bAgain\b/.test(silent?.text || '') && !/Unmute/.test(silent?.text || ''),
      (silent?.text || '').split('\n').slice(-2).join(' / '));
    check('nothing is highlighted when there is no script', silent?.lit.length === 0, JSON.stringify(silent?.lit));

    const voiced = await read('section[data-reteach="voiced"]');
    check('a scripted re-teach panel shows the spoken lines as text',
      /Look at the bottom row first/.test(voiced?.text || ''));
    check('and offers the same bar as the teach steps — a disc, Slower, Quiet',
      /Slower/.test(voiced?.text || '') && /Quiet/.test(voiced?.text || '')
      && !/\bAgain\b/.test(voiced?.text || ''));
    check('the way off the panel is live before a single clip plays', voiced?.goDisabled === false,
      voiced?.goDisabled === false ? 'enabled' : 'DISABLED');

    // Replay from the top and watch it, rather than reading the state it settles
    // in: the script is prompt → row.1 → row.2, and the order is the contract.
    await page.evaluate(() =>
      document.querySelector('section[data-reteach="voiced"] [data-voice-play]')?.click());
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
    await page.evaluate(() =>
      document.querySelector('section[data-reteach="voiced"] [data-voice-pill="quiet"]')?.click());
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
        brs: cases.map(c => c.querySelectorAll('br').length),
        bolds: cases.map(c => c.querySelectorAll('strong').length),
        plain: window.__plain, want: window.__plainWant,
      };
    });

    check('the markup cases rendered at all', seen.n === 10, `${seen.n} cases`);
    check('a superscript becomes a real <sup> element, not flat digits',
      seen.sups[0] === 1 && seen.sups.filter(Boolean).length >= 3, JSON.stringify(seen.sups));
    check('no tag is ever printed as text', !seen.text.join(' ').includes('<'),
      seen.text.find(x => x.includes('<')) || 'none');
    const bolded = seen.text.findIndex(t => /is the one to beat/.test(t));
    check('a bolded exponent keeps BOTH the bold and the superscript',
      seen.bolds[bolded] === 1 && seen.sups[bolded] === 1, `strong ${seen.bolds[bolded]}, sup ${seen.sups[bolded]}`);
    check('an unknown tag is dropped, not shown', seen.text.at(-1) === 'Nothing special here.', seen.text.at(-1));
    /* The sweep's findings (owner's order, Nov 5). Each of these was leaking in
       the live product: a stacked fraction rendered as "13", &nbsp; as five
       literal characters, and <br> as nothing at all — joining two sentences. */
    const flat = (t) => String(t).replace(/\u00A0/g, ' ');
    check('a stacked fraction reads as a fraction, not two joined digits',
      flat(seen.text[1]).startsWith('1/3') && flat(seen.text[1]).includes('?/15'), seen.text[1]);
    check('&nbsp; is a space, not five characters on screen',
      !seen.text.join(' ').includes('&nbsp;') && !seen.text.join(' ').includes('&'),
      seen.text.find(x => x.includes('&')) || 'none');
    check('<br> breaks the line instead of joining the sentences',
      seen.brs[3] === 1 && !flat(seen.text[3]).includes('$12.What'), `${seen.brs[3]} <br>, "${flat(seen.text[3]).slice(10, 40)}"`);
    check('bold still survives alongside a break', seen.bolds.at(-2) === 1, String(seen.bolds.at(-2)));
    const wrong = (seen.plain || []).map((got, i) => (got === seen.want[i] ? null : `${i}: "${got}"`)).filter(Boolean);
    check('the voice says "to the", never the flattened number', wrong.length === 0,
      wrong.join(' | ') || seen.plain[1]);

    /* The sweep's timing sources. */
    const rates = await page.evaluate(() => window.__rates);
    check('bands a and b are read to more slowly than the band that asks',
      rates.a === 0.9 && rates.b === 0.9 && rates.c === 1,
      `a ${rates.a}, b ${rates.b}, c ${rates.c}`);
    check('Slower is one number, the same everywhere', rates.slower === 0.75, String(rates.slower));
    check('a kid\'s saved pace beats her band\'s default', rates.savedWins === 0.75, String(rates.savedWins));
    check('and a nonsense saved value falls back to the default', rates.ignoresRubbish === 0.9,
      String(rates.ignoresRubbish));

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

  /* ---------- the worked animation stage (§0c) ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);          // long enough for every move to land

    const read = (kind) => page.evaluate((k) => {
      const sec = document.querySelector(`section[data-stage="${k}"]`);
      if (!sec) return null;
      const svg = sec.querySelector('svg');
      const texts = [...svg.querySelectorAll('text')]
        .map(t => ({ ch: t.textContent, x: Number(t.getAttribute('x')), op: Number(getComputedStyle(t).opacity) }));
      const circle = svg.querySelector('circle');
      const rects = [...svg.querySelectorAll('rect')]
        .map(r => ({ x: Number(r.getAttribute('x')), w: Number(r.getAttribute('width')),
          fill: getComputedStyle(r).fill }));
      const readout = [...sec.querySelectorAll('div')]
        .find(d => d.children.length === 0 && /=/.test(d.innerText));
      return { landed: svg.dataset.landed, texts, rects, label: svg.getAttribute('aria-label'),
        dot: circle ? { cx: Number(circle.getAttribute('cx')), fill: getComputedStyle(circle).fill } : null,
        readout: readout ? { text: readout.innerText, op: Number(getComputedStyle(readout).opacity) } : null,
        watch: !!sec.querySelector('[data-watch]') };
    }, kind);

    const hop = await read('hop');
    check('the decimal hop lands', hop?.landed === 'yes', JSON.stringify(hop?.landed));
    /* The move IS the point travelling: it has to end up left of where it was,
       between different digits, or the animation showed nothing happening. */
    const digits = (hop?.texts || []).filter(t => /\d/.test(t.ch));
    const leftOfDot = digits.filter(t => t.x < (hop?.dot?.cx ?? 0)).length;
    check('the point ends up one place left, not where it started',
      leftOfDot === 1 && digits.length >= 3, `${leftOfDot} digit(s) left of the point`);
    /* "$64.00 x 10%" is "$6.40", not "$6.400": the spare zero goes. */
    check('the spare trailing zero is dropped, not left behind',
      digits.filter(t => t.op === 0).length === 1,
      digits.map(t => `${t.ch}:${t.op}`).join(' '));
    check('and the money mark is not treated as a digit that moves',
      (hop?.texts || []).some(t => t.ch === '$' && t.x === 0));

    const split = await read('split');
    check('the split opens one bar into two', (split?.rects || []).length === 2
      && split.rects[1].x > split.rects[0].x + split.rects[0].w, JSON.stringify(split?.rects));
    check('and the half she is not using greys out, rather than vanishing',
      split?.rects?.[1].fill === 'rgb(230, 234, 238)', split?.rects?.[1].fill);

    const join = await read('join');
    check('the join closes the gap and turns the bar green',
      join?.rects?.every(r => r.fill === 'rgb(46, 124, 70)')
      && join.rects[1].x <= join.rects[0].w, JSON.stringify(join?.rects));

    /* The readout is the CONSEQUENCE of the move, so it may not be there before
       it. Checked after the landing, when it must be. */
    for (const k of ['hop', 'split', 'join']) {
      const st = await read(k);
      check(`${k}: the readout arrives with the landing`, st?.readout?.op === 1,
        JSON.stringify(st?.readout));
      check(`${k}: it offers to play it again`, st?.watch === true);
      // A screen reader gets the move as a sentence, not as a box of shapes.
      check(`${k}: the move says what it is`, /becomes/.test(st?.label || ''), st?.label);
    }

    /* NOTHING WAITS ON IT, and reduced motion HOLDS rather than crawling: the
       move is shown finished, with the readout already there. */
    const still = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await still.emulateMedia({ reducedMotion: 'reduce' });
    await still.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await still.waitForTimeout(250);
    const held = await still.evaluate(() => {
      const sec = document.querySelector('section[data-stage="hop"]');
      const svg = sec.querySelector('svg');
      const readout = [...sec.querySelectorAll('div')]
        .find(d => d.children.length === 0 && /=/.test(d.innerText));
      const moving = [...sec.querySelectorAll('*')]
        .filter(el => (getComputedStyle(el).transition || '').match(/\b0?\.\d+s|\b[1-9]\d*s/)).length;
      return { landed: svg.dataset.landed, readout: readout ? Number(getComputedStyle(readout).opacity) : null, moving };
    });
    check('reduced motion shows the move already made, with no transitions left',
      held?.landed === 'yes' && held?.readout === 1 && held?.moving === 0, JSON.stringify(held));
    await still.close();
    await page.close();
  }

  /* ---------- the placement check (§0e) ---------- */
  {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(String(e)));
    await page.setViewportSize({ width: 1340, height: 1000 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    const read = (sel) => page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const cells = [...el.querySelectorAll('[data-world-cell]')]
        .map(c => ({ name: c.dataset.world, status: c.dataset.status }));
      return { text: el.innerText, cells, discs: el.querySelectorAll('[data-voice-play]').length };
    }, sel);

    const start = await read('section[data-placement="start"]');
    check('the runner names all four worlds, not a progress bar',
      start?.cells.length === 4, JSON.stringify(start?.cells));
    check('exactly one world is being looked at, the rest are waiting',
      start?.cells.filter(c => c.status === 'looking').length === 1
      && start?.cells.filter(c => c.status === 'next').length === 3,
      JSON.stringify(start?.cells.map(c => c.status)));
    check('the check says untimed where a test would put a clock',
      /Untimed/.test(start?.text || ''));
    /* The ONLY way out, and never a score, a mark, a tally or money — the four
       things that would turn a start line into an exam. */
    check('the only way out is Exit', /Exit/.test(start?.text || '')
      && !/Today|Business|Grades|Rewards/.test(start?.text || ''));
    check('no score, no tally, no money on the runner',
      !/\$\d/.test(start?.text || '') && !/\b\d+\s*(of|out of)\s*\d+\b/i.test(start?.text || '')
      && !/score|right so far|correct/i.test(start?.text || ''),
      (start?.text || '').match(/\$\d[^\n]*|\b\d+\s*(of|out of)\s*\d+\b/i)?.[0] || '');
    check('the question is read by one voice bar, in the sheet', start?.discs === 1,
      String(start?.discs));

    const mid = await read('section[data-placement="midway"]');
    check('settled worlds read Found, and the search moves on',
      mid?.cells.filter(c => c.status === 'found').length === 2
      && mid?.cells.filter(c => c.status === 'looking').length === 1,
      JSON.stringify(mid?.cells.map(c => c.status)));

    const res = await read('section[data-placement="result"]');
    check('the result names the world she is ahead in',
      /already ahead in The Market/.test(res?.text || ''),
      (res?.text || '').split('\n').slice(0, 9).join(' / '));
    check('a world above her grade is tagged Ahead, one below Starts earlier',
      /Ahead/.test(res?.text || '') && /Starts earlier/.test(res?.text || ''));
    check('and the grade reads as a start line, not a mark',
      /That is where your lessons begin, not a mark/.test(res?.text || ''));
    check('no score, no percentage, no money on the result',
      !/\$\d/.test(res?.text || '') && !/%/.test(res?.text || '')
      && !/score|out of/i.test(res?.text || ''),
      (res?.text || '').match(/\$\d[^\n]*|%|out of/i)?.[0] || '');

    /* A kid level across all four has no world to be ahead in, and the first
       thing this screen says may not be invented. */
    const level = await read('section[data-placement="level"]');
    check('a level result names no world it cannot name',
      /level across all four/.test(level?.text || '') && !/already ahead in/.test(level?.text || ''),
      (level?.text || '').split('\n').slice(0, 8).join(' / '));
    check('and tags nothing Ahead or Starts earlier when she is level',
      !/Ahead/.test(level?.text || '') && !/Starts earlier/.test(level?.text || ''));

    /* Kampus starts at grade 3. A kid placed there has nothing below her, and
       the footer may not offer her a review shelf that does not exist. */
    const floor = await read('section[data-placement="floor"]');
    check('a kid at the floor is not promised a review shelf she does not have',
      !/Everything below/.test(floor?.text || '') && /where Kampus begins/.test(floor?.text || ''),
      (floor?.text || '').split('\n').slice(-3).join(' / '));
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
