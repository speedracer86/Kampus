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

  check('no uncaught errors in any layout', errors.length === 0, errors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\nLAYOUT GALLERY: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.error('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
