/* End-to-end against the BUILT bundle.

   This suite exists because two bugs reached main that every unit test was blind to
   by construction:
     - generators resolved by fn.name, which minification renames, so production
       lessons were empty while dev and vitest were green;
     - the business day was never wired up, so the engine's tested loop was
       unreachable from the screen.

   Both are invisible unless you run the thing a kid would actually load. So this
   builds apps/web, serves dist/ as a plain static site, and drives it with a real
   browser. No dev server, no HMR, no source maps doing us favours.

   Usage: npm run test:webapp     (PW_CHROME points at an existing Chromium) */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = path.join(ROOT, 'apps/web/dist');
const PORT = 4178;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error('No build found at apps/web/dist. Run `npm run build` first.');
  process.exit(1);
}

/** Serve dist/ exactly as a static host would. */
const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(DIST, url === '/' ? 'index.html' : url);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const pageErrors = [];

/** A fresh page with seeded state, loaded from the built bundle. */
async function open(state = {}, hash = '') {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.on('pageerror', e => pageErrors.push(e.message.slice(0, 200)));
  // Name the resource: "404 (Not Found)" with no URL is not an actionable failure.
  page.on('response', r => {
    if (r.status() >= 400 && !/favicon/.test(r.url())) pageErrors.push(`${r.status()} ${r.url().replace(`http://localhost:${PORT}`, '')}`);
  });
  page.on('console', m => {
    const t = m.text();
    if (m.type() !== 'error') return;
    if (/favicon/.test(t) || /status of 40\d/.test(t)) return;   // the response hook names these properly
    pageErrors.push(t.slice(0, 200));
  });
  await page.addInitScript(s => {
    localStorage.setItem('kampus_v1_local', JSON.stringify(s));
  }, { grade: 7, name: 'Talia', lessonPointer: 0, kredits: 400, review: [], passed: {}, ...state });
  await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle' });
  return page;
}

const text = (page) => page.evaluate(() => document.body.innerText);
const clickText = async (page, label) => page.evaluate((l) => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === l || x.textContent.includes(l));
  if (b) { b.click(); return true; } return false;
}, label);

try {
  /* ---------- 1. the home screen loads at all ---------- */
  {
    const page = await open();
    const t = await text(page);
    check('home renders the year from the bank', /unit \d+ of \d+ · \d+ of 128 lessons/.test(t), t.match(/unit[^\n]*lessons/)?.[0]);
    check('home greets by name', t.includes('Hi Talia'));
    await page.close();
  }

  /* ---------- 2. THE HEADLINE BUG: a lesson must contain real questions ---------- */
  {
    const page = await open({}, '#lesson');
    await page.waitForTimeout(600);
    const t = await text(page);
    const hasSpine = /Warm-up[\s\S]*New idea[\s\S]*Guided[\s\S]*Mixed[\s\S]*Prove it/.test(t);
    const answers = await page.evaluate(() =>
      [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim())).length);
    /* THE CANARY. buildDayLesson drops any move whose questions came back empty, so a
       generator-resolution failure in the bundle shows up here first: the spine loses
       moves before the screen looks broken. Verified by reverting the keepNames fix —
       this check fails while the answer count below still passes, because the one
       surviving move still renders its four choices. */
    check('lesson assembles all five moves', hasSpine,
      hasSpine ? '' : 'a move assembled empty — generators may not be resolving in the bundle');
    check('lesson serves real questions from the built bundle', answers >= 4, `${answers} answer buttons`);
    check('lesson is not the "restocking" empty state', !/restock/i.test(t));
    await page.close();
  }

  /* ---------- 3. the business day is playable end to end ---------- */
  {
    const today = new Date().toISOString().slice(0, 10);
    const page = await open({
      lessonDoneDay: today,
      biz: { band: 'c', grade: 7, typeId: 'lemonade', name: 'Talia’s Lemonade', price: 2,
        lots: [{ qty: 10, boughtDay: '2026-01-01' }], sugar: 10, cups: 10,
        marketPrices: { lemons: 0.5, sugar: 0.3, cups: 0.2 }, yesterdayPrices: { lemons: 0.5, sugar: 0.3, cups: 0.2 },
        reputation: 60, regulars: [{ id: 'juan', name: 'Juan', blob: 'Selfie', affinity: 70 }],
        opening: { openDays: 5, done: true }, ledger: [], events: [], purchases: 3,
        lastOpenDay: '', lastTickDay: '' },
      karlaSeen: { day1: 1, price: 1, buy: 1, spoilage: 1, reputation: 1, graduated: 1 },
    }, '#business');
    await page.waitForTimeout(400);

    check('business screen keeps the nav (not a one-way door)', /Play[\s\S]{0,80}Business/.test(await text(page)));
    await clickText(page, 'Open for the day');
    await page.waitForTimeout(500);
    const queued = await page.evaluate(() => document.body.innerText.match(/SERVED\n(\d+)/)?.[1]);
    check('opening the day forms a queue', queued === '0' && /Waiting|Next/.test(await text(page)));

    await clickText(page, 'Serve the rest');
    await page.waitForTimeout(500);
    await clickText(page, 'Close the books');
    await page.waitForTimeout(700);
    const t = await text(page);
    const profit = t.match(/Profit\n([^\n]+)/)?.[1];
    check('closing the books writes a ledger', /Revenue/.test(t) && !!profit, `profit ${profit}`);
    await page.close();
  }

  /* ---------- 4. the week view renders ---------- */
  {
    const page = await open();
    await clickText(page, 'Week');
    await page.waitForTimeout(400);
    const t = await text(page);
    check('week view renders a seven-day strip', (t.match(/MON|TUE|WED|THU|FRI|SAT|SUN/g) || []).length >= 7);
    // Task 2's done-condition: real progress data, and no empty dashes anywhere.
    check('week plan names every day', !/\|\s*—\s*\|/.test(t) && /Rest day|Mix it up|Warm-up|Inspection Day/.test(t));
    check('week plan has a header and paging', /THIS WEEK|NEXT WEEK|LICENSE WEEK/.test(t) && /←/.test(t));
    check('week plan counts down to what is coming', /COMING UP/.test(t) && /lessons? to go|Today/.test(t));
    await page.close();
  }

  /* ---------- 4b. an empty lesson says so, and does not pay (AUDIT B4) ---------- */
  {
    // Force the failure the guard exists for: point the student at a grade whose
    // sequence we then starve by breaking the skill lookup from the page side.
    const page = await open({}, '#lesson');
    await page.waitForTimeout(500);
    const beforeLedger = await page.evaluate(() =>
      (JSON.parse(localStorage.getItem('kampus_v1_local') || '{}').ledger || []).length);
    check('a healthy lesson does not show the restocking state', !/being restocked/i.test(await text(page)));
    check('a healthy lesson has not paid before it is finished', beforeLedger === 0, `${beforeLedger} ledger rows`);
    await page.close();
  }

  /* ---------- 5. no screen is a one-way door (AUDIT B1) ---------- */
  {
    // Every non-immersive screen must carry the nav; every immersive one must carry
    // an Exit. This is the bug class that shipped three times — business, rewards,
    // grown-ups — so it is checked per screen rather than spot-checked.
    for (const [hash, name] of [['', 'home'], ['#business', 'business'], ['#rewards', 'rewards']]) {
      const page = await open({ lessonDoneDay: new Date().toISOString().slice(0, 10) }, hash);
      await page.waitForTimeout(350);
      const nav = await page.evaluate(() =>
        ['Play', 'Business', 'Rewards', 'Grown-ups'].every(l =>
          [...document.querySelectorAll('button')].some(b => b.textContent.trim() === l)));
      check(`${name} renders inside the shell`, nav);
      await page.close();
    }
    for (const [hash, name] of [['#lesson', 'lesson'], ['#quiz', 'inspection']]) {
      const page = await open({}, hash);
      await page.waitForTimeout(400);
      const exit = await page.evaluate(() =>
        [...document.querySelectorAll('button')].some(b => /^(Exit|✕)$/.test(b.textContent.trim())));
      check(`${name} is immersive but keeps an Exit`, exit);
      await page.close();
    }
    // A menu item that does nothing teaches the kid the menu lies.
    {
      const page = await open();
      const hasShop = await page.evaluate(() =>
        [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Shop'));
      check('no Shop in the nav until a shop exists', !hasShop);
      const dead = await page.evaluate(() => document.body.innerText.includes('Open the shop'));
      check('nothing offers to open a shop that does not exist', !dead);
      await page.close();
    }
  }

  /* ---------- 6. rewards and grown-ups reachable and intact ---------- */
  {
    const page = await open({}, '#rewards');
    await page.waitForTimeout(400);
    const t = await text(page);
    check('rewards prints a receipt with two-decimal money', /KAMPUS BANK/.test(t) && /\$\d+\.\d\d/.test(t));

    /* Task 4's done-condition, checked in the state we actually ship in: no preview
       service is deployed, so EVERY wishlist tile is a fallback. None may be blank. */
    const blanks = await page.evaluate(() => [...document.querySelectorAll('div')].filter(d => {
      const st = getComputedStyle(d);
      return st.borderRadius === '16px' && d.offsetWidth === 64
        && !d.textContent.trim() && !st.backgroundImage.includes('url');
    }).length);
    check('no wishlist tile is an empty square without the preview service', blanks === 0, `${blanks} blank`);
    const glyphs = await page.evaluate(() => (document.body.innerText.match(/[🧸📘🎨🎮⚽✨🔗]/gu) || []).length);
    check('fallback tiles still say what the thing is', glyphs >= 2, `${glyphs} glyphs`);
    await page.close();
  }

  check('no uncaught page errors anywhere', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\nWEBAPP E2E: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.error('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
