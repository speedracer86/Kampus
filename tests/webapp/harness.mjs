/* The shared harness for the end-to-end suite.

   Everything here is machinery: the static host over apps/web/dist, the browser,
   the check recorder, and the drivers that know how to play a lesson, sit a paper,
   solve a teach layout or approve an earning. The checks themselves live in
   tests/webapp/*.spec.mjs; the runner is tests/test_webapp.mjs.

   The original header follows, because the reason the suite exists has not changed.

   End-to-end against the BUILT bundle.

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
import { buildDayLesson, currentDay } from '../../apps/web/src/year.js';
export { buildDayLesson, currentDay };
import { weekKey } from '@kampus/engine';
export { weekKey };
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = path.join(ROOT, 'apps/web/dist');
// Chosen by the OS, not hard-coded. A hard-coded port means an interrupted run
// leaves the socket held and the NEXT run dies on EADDRINUSE before it starts —
// which is a test suite that breaks because of how the last one ended.
let PORT = 0;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };

/** A recorder per spec. Specs run concurrently, so each buffers its own lines and
    the runner prints them as a block when that spec finishes — interleaved output
    from five specs at once is unreadable. */
export function createCheck() {
  const results = [];
  const lines = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    lines.push(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };
  return { check, results, lines };
}

function requireBuild() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.error('No build found at apps/web/dist. Run `npm run build` first.');
    process.exit(1);
  }
}

let server = null;
let browser = null;
export const pageErrors = [];

/** Serve dist/ exactly as a static host would. */
const makeServer = () => createServer(async (req, res) => {
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

/** Boot the static host and one browser, shared by every spec. */
export async function start() {
  requireBuild();
  server = makeServer();
  await new Promise(r => server.listen(0, r));
  PORT = server.address().port;
  browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
}

export async function stop() {
  if (browser) await browser.close();
  if (server) server.close();
}





/* ---------------------------------------------------------------------------
   The money path.

   Effort earns a pending row, a grown-up approves it, the weekly cap binds at
   APPROVAL rather than at award, and the receipt shows what was actually okayed.
   This is the part a parent sees and the part that has to be right before anyone
   pays for the thing, and nothing drove it end to end. */

/** Just the receipt. Slicing from "KAMPUS BANK" to the end of the page swept in the
    wishlist below it, so a $6.00 sticker book read as the balance. */
export const receiptBlock = (t) => {
  const start = t.indexOf('KAMPUS BANK');
  if (start < 0) return '';
  const rest = t.slice(start);
  const end = rest.search(/Wish|Saving for|Spend it|Home rewards/i);
  return end > 0 ? rest.slice(0, end) : rest;
};

/** The ledger, as stored. */
export const ledger = (page) => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
  return (s.ledger || []).map(r => ({ id: r.id, cents: r.cents, status: r.status, reason: r.reason, label: r.label }));
});

/** Click Approve / Hold / Undo on the row for a named earning.

    Walking up "until the text contains the label" escapes the row at the second
    level and matches the container holding every row — which is how asking for
    Inspection Day's Hold held a different earning, and asking for its Undo
    un-approved a third one. A size threshold is not the fix either: the whole list
    is only 153 characters here.

    The structural rule is reliable: a row contains exactly ONE button with a given
    action, so the moment an ancestor holds two, we have left the row. */
export const rowAction = (page, label, action) => page.evaluate(({ label, action }) => {
  const btns = [...document.querySelectorAll('button')].filter(b => b.innerText.trim() === action);
  for (const b of btns) {
    let node = b.parentElement;
    for (let i = 0; i < 6 && node; i++, node = node.parentElement) {
      const sameAction = [...node.querySelectorAll('button')].filter(x => x.innerText.trim() === action).length;
      if (sameAction > 1) break;
      if ((node.innerText || '').includes(label)) { b.click(); return true; }
    }
  }
  return false;
}, { label, action });

/** Through the Grown-ups PIN gate, whatever state it is in. */
export async function intoGrownUps(page, pin = '1234') {
  for (const d of pin) {
    await page.evaluate((x) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === x)?.click(), d);
  }
  await page.waitForTimeout(700);
  // First time through, the pad is in 'set' mode and asks for it twice.
  if (/Once more/i.test(await text(page))) {
    for (const d of pin) {
      await page.evaluate((x) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === x)?.click(), d);
    }
    await page.waitForTimeout(700);
  }
  return /Approvals|Earned|Nothing waiting/i.test(await text(page));
}

/* ---------------------------------------------------------------------------
   Assessment driver: sit a whole paper.

   Inspection Day and the License are the two screens that decide what she does
   next — the License writes a grade — and neither had coverage past the intro.
   Correctness comes from the paper the app persisted, so a run can be driven to a
   pass or to a repair plan deliberately instead of by luck. */

/** The paper in progress, as the app itself stored it. */
export const openPaper = (page, key = 'kampus_v1_local') => page.evaluate((k) => {
  const s = JSON.parse(localStorage.getItem(k) || '{}');
  const p = s.openPaper;
  return p ? { kind: p.kind, at: p.at, answers: p.answers,
    correct: p.questions.map(q => q.answerIndex ?? q.correct),
    n: p.questions.length } : null;
}, key);

/**
 * Answer every question and hand in.
 * `score` is how many to get RIGHT; the rest are answered with a wrong option.
 */
export async function sitPaper(page, { score = Infinity } = {}) {
  const paper = await openPaper(page);
  if (!paper) return null;
  for (let i = 0; i < paper.n; i++) {
    const right = paper.correct[i];
    const pick = i < score ? right : (right === 0 ? 1 : 0);
    // Options render as "<n>\n<text>"; the nth option button is the nth choice.
    await page.evaluate((n) => {
      const btns = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
      btns[n]?.click();
    }, pick);
    await page.waitForTimeout(70);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /^(Next|Check|Hand it in)/.test(x.innerText.trim()) && !x.disabled);
      if (b) b.click();
    });
    await page.waitForTimeout(90);
  }
  // The last Next becomes the hand-in; click whatever commits the paper.
  for (let i = 0; i < 4; i++) {
    const done = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /Hand it in|Hand in|Finish/i.test(x.innerText.trim()) && !x.disabled);
      if (b) { b.click(); return true; } return false;
    });
    if (done) break;
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(600);
  return paper;
}

/** The business, as stored. §5 is about the BUSINESS: a quiz may write its pending
    fee to the ledger and move her through the year, and does, so a snapshot that
    froze those would be testing something the rule never said. */
export const bizSnapshot = (page) => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
  return JSON.stringify(s.biz || null);
});

/** The moment the app currently has open, read from its own state.

    Not scraped from the page: climbing the DOM for an unlabelled card walked up to
    <body> and called the nav bar a set of answer choices. The store knows exactly
    which customer is being asked and what the answer is, so the test clicks real
    options by their real labels. */
export const openMoment = (page) => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
  const c = (s.dayQueue || [])[s.dayMomentAt ?? -1];
  return c?.moment ? { q: c.moment.q, ans: String(c.moment.ans), wrongs: (c.moment.wrongs || []).map(String),
    skill: c.moment.skill, name: c.name } : null;
});

/** Answer whatever moment is open — `right: false` picks a real wrong on purpose. */
export async function answerMoment(page, { right = false } = {}) {
  const m = await openMoment(page);
  if (!m) return null;
  const label = right ? m.ans : m.wrongs[0];
  await page.evaluate((l) => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === l)?.click(), label);
  await page.waitForTimeout(220);
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Serve them/.test(b.innerText))?.click());
  await page.waitForTimeout(280);
  return m;
}

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
export const CHROME = ['Back', 'Next', 'Start the mission →', 'Show me another one', 'Write it down',
  'Read it to me', 'Again', 'Slower', 'Quiet', 'Unmute', 'Exit', 'Written ✓'];

/** The layout's own controls, in document order, scoped to the step sheet. */
export const layoutButtons = (page) => page.evaluate((chrome) => {
  const next = [...document.querySelectorAll('button')].find(b => /^(Next|Start the mission)/.test(b.innerText.trim()));
  if (!next) return [];
  let sheet = next.parentElement;
  while (sheet && !sheet.querySelector('h2')) sheet = sheet.parentElement;
  if (!sheet) return [];
  return [...sheet.querySelectorAll('button')]
    .map((b, i) => ({ i, text: b.innerText.trim() }))
    .filter(b => !chrome.includes(b.text));
}, CHROME);

export const clickLayoutButton = (page, nth) => page.evaluate(({ chrome, nth }) => {
  const next = [...document.querySelectorAll('button')].find(b => /^(Next|Start the mission)/.test(b.innerText.trim()));
  let sheet = next.parentElement;
  while (sheet && !sheet.querySelector('h2')) sheet = sheet.parentElement;
  const own = [...sheet.querySelectorAll('button')].filter(b => !chrome.includes(b.innerText.trim()));
  own[nth]?.click();
  return own.length;
}, { chrome: CHROME, nth });

export const nextButton = (page) => page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /^(Next|Start the mission)/.test(x.innerText.trim()));
  return b ? { disabled: b.disabled, label: b.innerText.trim() } : null;
});

/** Solve one step the way its layout is meant to be solved. */
export async function solveStep(page, step) {
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
export async function sealOffsite(page) {
  await page.route('**://*/**', (route) => {
    const url = route.request().url();
    if (url.includes(`localhost:${PORT}`) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    return route.abort();
  });
}

/** A fresh page with seeded state, loaded from the built bundle. */
export async function open(state = {}, hash = '') {
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
  // Seed ONLY when storage is empty. addInitScript runs on every navigation, so an
  // unconditional seed silently reset the app on page.reload() — which is the exact
  // thing several checks are reloading to test.
  await page.addInitScript(s => {
    if (!localStorage.getItem('kampus_v1_local')) localStorage.setItem('kampus_v1_local', JSON.stringify(s));
  }, { grade: 7, name: 'Talia', lessonPointer: 0, kredits: 400, review: [], passed: {}, ...state });
  await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: 'networkidle' });
  return page;
}

/** A device nobody has set up: no seeded save, so onboarding is what loads. */
export async function openBlank(hash = '') {
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

export const text = (page) => page.evaluate(() => document.body.innerText);


/** The app's own week key, so a seeded ledger lands in the week it is testing. */
async function openBlankWeekKey() {
  const p = await browser.newPage();
  await sealOffsite(p);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  const wk = await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
    return s.week?.key || null;
  });
  await p.close();
  return wk;
}
export const clickText = async (page, label) => page.evaluate((l) => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === l || x.textContent.includes(l));
  if (b) { b.click(); return true; } return false;
}, label);

/** Answer by trial: click each choice until one is not rejected. The lesson gates
    forward progress on a correct answer, which is the point — a test that wants to
    reach a later move has to actually get there. */
export async function answerOne(page) {
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
export async function driveToTeach(page) {
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
