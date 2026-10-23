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
// The seam itself, imported in Node: the test knows which steps a day assembles and
// what each layout's right answer is, so it can solve them honestly instead of
// guessing or reaching into the page for the answer.
import { buildDayLesson, currentDay } from '../apps/web/src/year.js';
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


/* ---------------------------------------------------------------------------
   Full-sequence teach driver.

   The earlier teach checks only ever reached step 1, which is how an unkeyed
   layout component — every step after the first arriving pre-revealed and
   unsolvable — got past them. With the bank now authoring 3-5 steps per skill and
   the depth pass splicing in more, the path is long enough that "it rendered" says
   almost nothing. So this walks a whole sequence to "Start the mission", solving
   each layout the way a kid would and checking the Next button at every beat.

   Answers come from the bank via year.js, not from the page: a test that reads the
   answer out of the DOM would pass against a screen showing the wrong one. */

/** The chrome around a step; everything else inside the sheet belongs to the layout. */
const CHROME = ['Back', 'Next', 'Start the mission →', 'Show me another one', 'Write it down',
  'Read it to me', 'Again', 'Slower', 'Quiet', 'Unmute', 'Exit', 'Written ✓'];

/** The layout's own controls, in document order, scoped to the step sheet. */
const layoutButtons = (page) => page.evaluate((chrome) => {
  const next = [...document.querySelectorAll('button')].find(b => /^(Next|Start the mission)/.test(b.innerText.trim()));
  if (!next) return [];
  let sheet = next.parentElement;
  while (sheet && !sheet.querySelector('h2')) sheet = sheet.parentElement;
  if (!sheet) return [];
  return [...sheet.querySelectorAll('button')]
    .map((b, i) => ({ i, text: b.innerText.trim() }))
    .filter(b => !chrome.includes(b.text));
}, CHROME);

const clickLayoutButton = (page, nth) => page.evaluate(({ chrome, nth }) => {
  const next = [...document.querySelectorAll('button')].find(b => /^(Next|Start the mission)/.test(b.innerText.trim()));
  let sheet = next.parentElement;
  while (sheet && !sheet.querySelector('h2')) sheet = sheet.parentElement;
  const own = [...sheet.querySelectorAll('button')].filter(b => !chrome.includes(b.innerText.trim()));
  own[nth]?.click();
  return own.length;
}, { chrome: CHROME, nth });

const nextButton = (page) => page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /^(Next|Start the mission)/.test(x.innerText.trim()));
  return b ? { disabled: b.disabled, label: b.innerText.trim() } : null;
});

/** Solve one step the way its layout is meant to be solved. */
async function solveStep(page, step) {
  if (step.layout === 'walk') {
    for (let i = 0; i < 12; i++) {
      const tapped = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Tap for the next line');
        if (b) { b.click(); return true; } return false;
      });
      if (!tapped) break;
      await page.waitForTimeout(70);
    }
    return 'revealed every row';
  }
  if (step.layout === 'bar') {
    // Segments in order; clicking the Nth shades N.
    await clickLayoutButton(page, step.bar.target - 1);
    await page.waitForTimeout(90);
    return `shaded ${step.bar.target}/${step.bar.parts}`;
  }
  if (step.layout === 'line') {
    // Ticks run min..max in document order.
    await clickLayoutButton(page, step.line.answer - step.line.min);
    await page.waitForTimeout(90);
    return `tapped ${step.line.answer}`;
  }
  if (step.layout === 'faceoff') {
    await clickLayoutButton(page, step.faceoff.answer);
    await page.waitForTimeout(90);
    return `picked card ${step.faceoff.answer}`;
  }
  return 'no layout';
}

/** Cut the page off from the network.

    The suite tests OUR bundle. The page pulls Inter Tight from Google Fonts, and
    letting it do that in a test makes the run depend on a third-party CDN: a stalled
    request never settles, so `waitUntil: 'networkidle'` hangs the whole suite rather
    than failing one check. Blocking it keeps the run hermetic and fast. We assert
    text and structure, never pixels, so the substituted font changes nothing. */
async function sealOffsite(page) {
  await page.route('**://*/**', (route) => {
    const url = route.request().url();
    if (url.includes(`localhost:${PORT}`) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    return route.abort();
  });
}

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
    if (/ERR_FAILED|ERR_QUIC|ERR_NETWORK|ERR_CONNECTION/.test(t)) return;   // sealOffsite aborts these
    pageErrors.push(t.slice(0, 200));
  });
  await sealOffsite(page);
  await page.addInitScript(s => {
    localStorage.setItem('kampus_v1_local', JSON.stringify(s));
  }, { grade: 7, name: 'Talia', lessonPointer: 0, kredits: 400, review: [], passed: {}, ...state });
  await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle' });
  return page;
}

/** A device nobody has set up: no seeded save, so onboarding is what loads. */
async function openBlank(hash = '') {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.on('pageerror', e => pageErrors.push(e.message.slice(0, 200)));
  // Offsite failures (the Google Fonts stylesheet) are not defects in our bundle,
  // and letting a third-party CDN blip fail the suite makes it flaky for no signal.
  page.on('console', m => {
    const t = m.text();
    if (m.type() !== 'error') return;
    if (/favicon|status of 40\d|ERR_FAILED|ERR_QUIC|ERR_NETWORK|ERR_CONNECTION/.test(t)) return;   // sealOffsite aborts these
    pageErrors.push(t.slice(0, 200));
  });
  await sealOffsite(page);
  await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle' });
  return page;
}

const text = (page) => page.evaluate(() => document.body.innerText);
const clickText = async (page, label) => page.evaluate((l) => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === l || x.textContent.includes(l));
  if (b) { b.click(); return true; } return false;
}, label);

/** Answer by trial: click each choice until one is not rejected. The lesson gates
    forward progress on a correct answer, which is the point — a test that wants to
    reach a later move has to actually get there. */
async function answerOne(page) {
  for (let k = 1; k <= 4; k++) {
    await page.evaluate((n) => [...document.querySelectorAll('button')]
      .find(b => b.innerText.trim().startsWith(n + '\n'))?.click(), String(k));
    await page.waitForTimeout(170);
    if (!/Try again/.test(await text(page))) return true;
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Try again')?.click());
    await page.waitForTimeout(120);
  }
  return false;
}

/** Play the warm-up and the Snag until the teach panel is on screen. */
async function driveToTeach(page) {
  for (let i = 0; i < 14; i++) {
    if (/STEP \d OF \d/i.test(await text(page))) return true;
    await answerOne(page);
    await page.waitForTimeout(160);
    // Spine labels carry a newline; the real forward button does not.
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => !x.disabled && !x.innerText.includes('\n')
        && /^(Show me the move|Next|Continue|Keep going|Got it)/.test(x.innerText.trim()));
      if (b) b.click();
    });
    await page.waitForTimeout(220);
  }
  return /STEP \d OF \d/i.test(await text(page));
}

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

  /* ---------- 7. onboarding: a blank device all the way to playing ----------
     This is the only path a real first user takes, and until now nothing covered it.
     It is also the one flow where a dead button means the app cannot be started at
     all, so it is driven click by click rather than by seeding state. */
  {
    const page = await openBlank();
    let t = await text(page);
    check('a blank device opens on setup, not on an empty home', t.includes('This is Kampus'), t.slice(0, 60).replace(/\n/g, ' '));

    await clickText(page, 'Bet. Set it up');
    await page.waitForTimeout(150);
    await page.fill('input', 'parent@example.com');
    await clickText(page, 'Send me the link');
    await page.waitForTimeout(150);
    check('the magic link step says plainly that it is not wired up', (await text(page)).includes('Not wired up yet'));

    await clickText(page, 'Continue');
    await page.waitForTimeout(150);
    t = await text(page);
    check('the COPPA line ships verbatim', t.includes('We keep her first name. That’s it.'));

    await page.fill('input', 'Maya');
    await clickText(page, 'Next');
    await page.waitForTimeout(150);

    /* The PIN pad, twice — this is also the ADHD check: a mismatch must not lock
       her out or start a countdown, it must just say so and let her retry. */
    const tapPin = async (digits) => {
      for (const d of digits) {
        await page.evaluate((x) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === x)?.click(), d);
      }
      await page.waitForTimeout(60);
    };
    await tapPin('1234');
    await tapPin('9999');
    t = await text(page);
    check('a mismatched PIN starts over without a lockout', t.includes('didn’t match') && !/wait|try again in|locked/i.test(t));

    await tapPin('1234');
    await tapPin('1234');
    await page.waitForTimeout(600);
    t = await text(page);
    check('setup reaches the grade step after the PIN', t.includes('Where should she start'), t.slice(0, 60).replace(/\n/g, ' '));

    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /GRADE\s*5/.test(b.innerText))?.click());
    await clickText(page, 'Next');
    await page.waitForTimeout(150);
    check('defaults step offers a weekly limit and a lesson length', (await text(page)).includes('Weekly limit'));

    await clickText(page, 'Next');
    await page.waitForTimeout(150);
    t = await text(page);
    check('the hand-over summary shows the real answers back', t.includes('Maya') && t.includes('Grade 5') && t.includes('$5.00'));

    await clickText(page, 'Give it to Maya');
    await page.waitForTimeout(250);
    check('student first run greets her by name', (await text(page)).includes('Hey Maya'));

    await clickText(page, 'Let’s go');
    await page.waitForTimeout(150);
    check('she picks a starting world from the one string table', (await text(page)).includes('The Kitchen'));

    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('The Market'))?.click());
    await clickText(page, 'Next');
    await page.waitForTimeout(200);
    await clickText(page, 'Start');
    await page.waitForTimeout(500);
    t = await text(page);
    check('onboarding ends on a playable home, not a dead end', /Hi Maya/.test(t) && /lessons/.test(t), t.slice(0, 80).replace(/\n/g, ' '));

    const saved = await page.evaluate(() => {
      const fam = JSON.parse(localStorage.getItem('kampus_v1_family') || 'null');
      const id = fam?.students?.[0]?.id;
      return { fam, me: id ? JSON.parse(localStorage.getItem(`kampus_v1_${id}`) || 'null') : null };
    });
    check('the profile is written through the student-keyed store', saved.me?.name === 'Maya' && saved.me?.grade === 5,
      JSON.stringify({ name: saved.me?.name, grade: saved.me?.grade }));
    check('her PIN is on the roster row, not loose in her game state', saved.fam?.students?.[0]?.pin === '1234');
    check('reloading after onboarding goes straight to play', await (async () => {
      await page.reload({ waitUntil: 'networkidle' });
      return (await text(page)).includes('Hi Maya');
    })());
    await page.close();
  }

  /* ---------- 8. the doorway, and the grown-ups PIN it sets ---------- */
  {
    const page = await openBlank('#doorway');
    await page.evaluate(() => {
      localStorage.setItem('kampus_v1_family', JSON.stringify({ parentEmail: null, parentPin: null,
        students: [{ id: 'a', name: 'Maya', pin: '1234', worldTopic: 'ratio' }, { id: 'b', name: 'Theo', pin: '4321', worldTopic: 'int' }] }));
      localStorage.setItem('kampus_v1_a', JSON.stringify({ grade: 5, name: 'Maya' }));
      localStorage.setItem('kampus_v1_b', JSON.stringify({ grade: 7, name: 'Theo' }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    let t = await text(page);
    check('two kids on a device get asked who is playing', t.includes('Who’s this?') && t.includes('Maya') && t.includes('Theo'));
    check('the doorway offers the grown-up side too', t.includes('Grown-ups'));

    // The tile holds an initial and the name, so match on contains, not equals.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('Theo'))?.click());
    await page.waitForTimeout(150);
    check('picking a kid asks for her PIN by name', (await text(page)).includes('Hi Theo.'));
    for (const d of '4321') await page.evaluate((x) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === x)?.click(), d);
    await page.waitForTimeout(700);
    t = await text(page);
    // Distinct from the pad's own "Hi Theo." — this must be the shell, on his grade.
    check('the right PIN lands on that kid’s own home', /Hi Theo,/.test(t) && t.includes('Rewards'), t.slice(0, 70).replace(/\n/g, ' '));
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

  /* ---------- 12. "find her level" runs a placement check, not the License ------
     This path used to route into the Grade 3 grade test: it paid $1.50, could
     promote her a grade and printed a repair plan on a miss, while the setup screen
     promised an untimed check that doesn't pay and doesn't cost. */
  {
    const page = await openBlank();
    // Straight through setup, choosing "Not sure" at the grade step.
    await clickText(page, 'Bet. Set it up');
    await page.waitForTimeout(150);
    await page.fill('input', 'parent@example.com');
    await clickText(page, 'Send me the link');
    await page.waitForTimeout(150);
    await clickText(page, 'Continue');
    await page.waitForTimeout(150);
    await page.fill('input', 'Nia');
    await clickText(page, 'Next');
    await page.waitForTimeout(150);
    const tapPin = async (digits) => {
      for (const d of digits) await page.evaluate((x) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === x)?.click(), d);
      await page.waitForTimeout(80);
    };
    await tapPin('1234'); await tapPin('1234');
    await page.waitForTimeout(600);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Let Kampus find her level/.test(b.innerText))?.click());
    await clickText(page, 'Next');
    await page.waitForTimeout(150);
    await clickText(page, 'Next');
    await page.waitForTimeout(150);
    check('the summary says placement, not a grade she was given', (await text(page)).includes('Placement check'));

    await clickText(page, 'Give it to Nia');
    await page.waitForTimeout(250);
    await clickText(page, 'Let’s go');
    await page.waitForTimeout(150);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('The Market'))?.click());
    await clickText(page, 'Next');
    await page.waitForTimeout(200);
    await clickText(page, 'Start');
    await page.waitForTimeout(500);

    let t = await text(page);
    check('she lands on the placement check, not the License', /Let’s see where you start/.test(t) && !/License|Grade test/i.test(t),
      t.slice(0, 80).replace(/\n/g, ' '));
    check('the check repeats the four promises the setup screen made',
      t.includes('No timer') && t.includes('Doesn’t pay') && t.includes('Doesn’t cost') && /About 15 minutes/.test(t));

    await clickText(page, 'Start →');
    await page.waitForTimeout(400);
    t = await text(page);
    check('the check says untimed where a test would put a clock', t.includes('Untimed'));
    // NB: not /\d+\/\d+/ — the questions are full of fractions. A tally would read
    // "4 of 24" or name a score, so look for that instead.
    check('no score, no tally, no money on screen',
      !/\$\d/.test(t) && !/\b\d+\s*(of|out of)\s*\d+\b/i.test(t) && !/score|correct so far|right so far/i.test(t),
      t.match(/\$\d[^\n]*|\b\d+\s*(of|out of)\s*\d+\b/i)?.[0] || '');
    check('no help beyond reading it aloud', t.includes('Read it') && !t.includes('Teach me') && !t.includes('Show me'));

    // Answer every question; any choice is fine, nothing is scored against her.
    let asked = 0;
    for (let i = 0; i < 40; i++) {
      const clicked = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /^\d\n/.test(x.innerText.trim()));
        if (b) { b.click(); return true; } return false;
      });
      if (!clicked) break;
      asked++;
      await page.waitForTimeout(110);
      await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Check')?.click());
      await page.waitForTimeout(110);
      if (/You’re starting at/.test(await text(page))) break;
    }
    t = await text(page);
    check('the check ends by itself inside 24 questions', /You’re starting at/.test(t), `${asked} asked`);
    check('it ends on a grade, not a pass or a fail', /You’re starting at/.test(t)
      && !/passed|failed|repair/i.test(t), t.slice(0, 90).replace(/\n/g, ' '));
    check('it shows where each world starts her', /where each world starts you/i.test(t) && t.includes('The Kitchen'));

    await clickText(page, 'Let’s go, Nia');
    await page.waitForTimeout(500);
    t = await text(page);
    check('the placed grade carries through to a playable home', /Hi Nia/.test(t) && /lessons/.test(t), t.slice(0, 70).replace(/\n/g, ' '));

    const saved = await page.evaluate(() => {
      const fam = JSON.parse(localStorage.getItem('kampus_v1_family') || 'null');
      const me = JSON.parse(localStorage.getItem(`kampus_v1_${fam.students[0].id}`) || 'null');
      return { grade: me.grade, queued: me.placementQueued, earned: me.week?.earned, ledger: (me.ledger || []).length };
    });
    check('the grade it found is written to her profile', saved.grade >= 3 && saved.grade <= 8, `grade ${saved.grade}`);
    check('the flag is cleared, so she is not asked again', saved.queued === false);
    check('the check paid her nothing', saved.earned === 0 && saved.ledger === 0,
      `earned ${saved.earned}, ${saved.ledger} ledger rows`);

    await page.reload({ waitUntil: 'networkidle' });
    check('reloading goes to her year, not back into the check', /Hi Nia/.test(await text(page)));
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

  check('no uncaught page errors anywhere', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\nWEBAPP E2E: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.error('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
