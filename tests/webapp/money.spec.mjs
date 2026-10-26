/* The papers and the money: Inspection Day, the License, and effort → approval → receipt.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { bizSnapshot, clickText, intoGrownUps, ledger, open, openPaper, receiptBlock, rowAction, sitPaper, start, stop, text, weekKey } from './harness.mjs';

export default async function run(check) {
  /* ---------- 15. Inspection Day, start to results ---------- */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0, kredits: 100 }, '#quiz');
    await page.waitForTimeout(500);
    let t = await text(page);
    check('Inspection Day opens on its intro, untimed and harmless to the stand',
      /Inspection Day/i.test(t) && /No timer|Timer\nNone/i.test(t) && /hurt your business/i.test(t));

    const before = await bizSnapshot(page);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Start|Begin|ready/i.test(b.innerText))?.click());
    await page.waitForTimeout(500);
    const paper = await openPaper(page);
    check('the paper assembles ten questions', paper?.n === 10, `${paper?.n} questions`);

    await sitPaper(page, { score: Infinity });
    t = await text(page);
    check('sitting the whole paper reaches the results', /How it went/i.test(t), t.slice(0, 80).replace(/\n/g, ' '));
    check('results speak only Solid / Shaky / Not yet',
      /(Solid|Shaky|Not yet)/.test(t) && !/\d+%/.test(t) && !/\b[A-F][+-]?\s*grade\b/i.test(t),
      t.match(/\d+%/)?.[0] || '');
    check('it pays for taking it, not for getting it right', /For taking it/i.test(t) && /\$1\.00/.test(t),
      t.match(/\$\d\.\d\d[\s\S]{0,20}For taking it/)?.[0]?.replace(/\n/g, ' ') || '');
    check('a quiz never touches the business (§5)', (await bizSnapshot(page)) === before);

    const row = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
      const l = (s.ledger || []).filter(r => r.reason === 'quiz');
      return { n: l.length, status: l[0]?.status, cents: l[0]?.cents };
    });
    check('the fee lands in the ledger as pending, for a grown-up to approve',
      row.n === 1 && row.status === 'pending' && row.cents === 100, JSON.stringify(row));
    check('the paper is cleared once handed in',
      (await openPaper(page)) === null);
    await page.close();
  }

  /* ---------- 16. the License: the pass, which writes a grade ---------- */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0, kredits: 100, passed: {} }, '#test');
    await page.waitForTimeout(500);
    let t = await text(page);
    check('the License opens on its intro with the two things it costs',
      /License/i.test(t) && /20/.test(t) && /Read it only/i.test(t));

    const before = await bizSnapshot(page);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Start|Begin|ready/i.test(b.innerText))?.click());
    await page.waitForTimeout(500);
    const paper = await openPaper(page);
    check('the License paper is twenty questions', paper?.n === 20, `${paper?.n}`);

    // Mid-paper reload: an untimed 20-question test is exactly what a kid walks away from.
    await page.evaluate((n) => {
      const btns = [...document.querySelectorAll('button')].filter(b => /^\d\n/.test(b.innerText.trim()));
      btns[n]?.click();
    }, paper.correct[0]);
    await page.waitForTimeout(150);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    t = await text(page);
    check('a reload mid-paper resumes it rather than starting over',
      /of 20/.test(t) && !/Start|Begin/i.test(t.slice(0, 60)), t.slice(0, 70).replace(/\n/g, ' '));
    const resumed = await openPaper(page);
    check('her answers survive the reload', resumed?.answers.filter(a => a !== null).length >= 1,
      `${resumed?.answers.filter(a => a !== null).length} kept`);

    await sitPaper(page, { score: Infinity });
    t = await text(page);
    check('sitting the whole License reaches the results', /The two checks/i.test(t), t.slice(0, 80).replace(/\n/g, ' '));
    check('both checks are shown, not a percentage', /16 needed/.test(t) && /Every cluster/.test(t) && !/\d+%/.test(t));

    const after = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
      return { grade: s.grade, passed: s.passed, districts: s.districts, pointer: s.lessonPointer };
    });
    check('passing the License writes the grade and opens the next one',
      after.passed?.['6'] === true && after.grade === 7, JSON.stringify(after));
    // The generic "advance a day" used to run on top of the promotion reset, so the
    // first lesson of every grade from 7 up was skipped.
    check('the new grade starts on its first day, not its second', after.pointer === 0, `pointer ${after.pointer}`);
    check('the district is recorded', (after.districts || []).includes(6), JSON.stringify(after.districts));
    check('the License never touches the business either (§5)', (await bizSnapshot(page)) === before);
    await page.close();
  }

  /* ---------- 17. the License: the miss, which is a plan and not a fail ---------- */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0, kredits: 100, passed: {}, review: [] }, '#test');
    await page.waitForTimeout(500);
    const before = await bizSnapshot(page);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Start|Begin|ready/i.test(b.innerText))?.click());
    await page.waitForTimeout(500);

    await sitPaper(page, { score: 0 });               // every one wrong, on purpose
    const t = await text(page);
    check('missing the License is a repair plan, never a fail screen',
      /repair|redo|again/i.test(t) && !/\bfail(ed)?\b/i.test(t) && !/\d+%/.test(t),
      t.match(/\bfail(ed)?\b/i)?.[0] || t.slice(0, 70).replace(/\n/g, ' '));
    check('it still pays for taking it', /For taking it/i.test(t) && /\$1\.50/.test(t));

    const after = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
      return { grade: s.grade, passed: s.passed, review: (s.review || []).length };
    });
    check('a miss does not move her grade', after.grade === 6 && !after.passed?.['6'], JSON.stringify(after));
    check('the repair plan schedules real review, not a scolding', after.review > 0, `${after.review} review entries`);
    check('a missed License still cannot touch the business (§5)', (await bizSnapshot(page)) === before);
    await page.close();
  }

  /* ---------- 18. effort → pending → approved → receipt ---------- */
  {
    // A week with $4.50 already approved against a $5.00 cap, and three things
    // waiting: a 50c lesson that fits, and two that cannot both fit.
    const wk = weekKey();
    const seedLedger = [
      { id: 'e1', cents: 450, reason: 'lesson', label: 'Lessons', status: 'approved', day: 'Mon', week: wk },
      { id: 'e2', cents: 50, reason: 'lesson', label: 'Daily lesson', status: 'pending', day: 'Tue', week: wk },
      { id: 'e3', cents: 100, reason: 'quiz', label: 'Inspection Day', status: 'pending', day: 'Tue', week: wk },
    ];
    const page = await open({ grade: 6, name: 'Talia', ledger: seedLedger,
      settings: { cap: 500 }, week: { key: wk, earned: 0, spent: 0 } }, '#parents');
    await page.waitForTimeout(500);
    check('Grown-ups is behind a PIN', /Grown-ups only|Pick a PIN/i.test(await text(page)));
    check('the gate opens', await intoGrownUps(page));

    let t = await text(page);
    check('both waiting rows are shown with what they were for',
      t.includes('Daily lesson') && t.includes('Inspection Day'), '');
    // $4.50 of a $5.00 cap is used, so 50c fits and $1.00 does not.
    const buttons = await page.evaluate(() => [...document.querySelectorAll('button')]
      .filter(b => /Approve|Over limit/.test(b.innerText.trim()))
      .map(b => ({ label: b.innerText.trim(), disabled: b.disabled })));
    check('the cap binds at approval: the row that would pass it reads "Over limit"',
      buttons.some(b => b.label === 'Over limit' && b.disabled) && buttons.some(b => b.label === 'Approve'),
      JSON.stringify(buttons));

    // Approving the one that fits.
    check('Approve is offered on the row that fits', await rowAction(page, 'Daily lesson', 'Approve'));
    await page.waitForTimeout(400);
    let rows = await ledger(page);
    check('approving marks exactly that row approved, at its full rate',
      rows.find(r => r.id === 'e2')?.status === 'approved' && rows.find(r => r.id === 'e2')?.cents === 50,
      JSON.stringify(rows.find(r => r.id === 'e2')));
    check('the row that would pass the cap is untouched',
      rows.find(r => r.id === 'e3')?.status === 'pending', JSON.stringify(rows.find(r => r.id === 'e3')));

    // Hold, then undo: §0 says a decision is never destructive.
    await rowAction(page, 'Inspection Day', 'Hold');
    await page.waitForTimeout(350);
    rows = await ledger(page);
    check('Hold defers rather than deletes', rows.find(r => r.id === 'e3')?.status === 'deferred',
      JSON.stringify(rows.find(r => r.id === 'e3')));
    check('nothing left the ledger', rows.length === 3, `${rows.length} rows`);

    check('Undo is offered on the row that was just held', await rowAction(page, 'Inspection Day', 'Undo'));
    await page.waitForTimeout(350);
    rows = await ledger(page);
    check('Undo puts it back in the queue', rows.find(r => r.id === 'e3')?.status === 'pending',
      JSON.stringify(rows.find(r => r.id === 'e3')));
    check('undoing one row leaves the others alone',
      rows.find(r => r.id === 'e2')?.status === 'approved', JSON.stringify(rows.find(r => r.id === 'e2')));

    // Approve all must stop cleanly at the cap, not blow through it.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Approve all/.test(b.innerText))?.click());
    await page.waitForTimeout(450);
    rows = await ledger(page);
    const approved = rows.filter(r => r.status === 'approved').reduce((n, r) => n + r.cents, 0);
    check('"Approve all" stops at the cap instead of passing it', approved <= 500, `$${(approved / 100).toFixed(2)} approved`);
    check('the over-cap row is still waiting, not silently dropped',
      rows.find(r => r.id === 'e3')?.status === 'pending', JSON.stringify(rows.find(r => r.id === 'e3')));

    // The kid's side: the receipt counts approved money only.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Rewards')?.click());
    await page.waitForTimeout(500);
    t = await text(page);
    // Scoped to the receipt: the page also lists wishlist prices, and an unscoped
    // regex read a $6.00 sticker book as if it were the balance.
    const receipt = receiptBlock(t);
    check('the receipt prints approved money, in two decimals',
      /KAMPUS BANK/.test(t) && /\$5\.00/.test(receipt),
      receipt.match(/\$\d+\.\d\d/g)?.slice(0, 4).join(' ') || '');
    check('the receipt counts only what a grown-up okayed', !/\$6\.00/.test(receipt),
      receipt.match(/\$6\.00/)?.[0] || '');
    await page.close();
  }

  /* ---------- 19. real effort, all the way to the receipt ----------
     Section 18 drives the rules against a seeded ledger. This one proves the rules
     are wired to work she actually did: sit Inspection Day, approve what it earned,
     and watch the receipt move. The quiz is the cheap way to produce a real row —
     a whole five-move lesson takes a minute of wall clock to say the same thing. */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0, kredits: 0, ledger: [] }, '#quiz');
    await page.waitForTimeout(500);
    check('nothing is owed before the work', (await ledger(page)).length === 0);

    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Start|Begin|ready/i.test(b.innerText))?.click());
    await page.waitForTimeout(500);
    await sitPaper(page, { score: Infinity });

    let rows = await ledger(page);
    const earned = rows.find(r => r.reason === 'quiz');
    check('real work writes one pending row', rows.length === 1 && earned?.status === 'pending', JSON.stringify(rows));
    check('at the full rate — the cap never shrinks what she did', earned?.cents === 100, `${earned?.cents}c`);

    // The results screen is immersive — it carries no nav, only "Back to Today" —
    // so the way back to the shell is its own button, not a nav item that isn't there.
    check('the results screen offers the way back', await clickText(page, 'Back to Today'));
    await page.waitForTimeout(500);

    // Her side first: she can see it, and it does not count as money yet.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Rewards')?.click());
    await page.waitForTimeout(500);
    let t = await text(page);
    let receipt = receiptBlock(t);
    check('the kid sees nothing spendable until a grown-up says yes', /\$0\.00/.test(receipt),
      receipt.match(/\$\d+\.\d\d/g)?.slice(0, 3).join(' ') || '');

    // The grown-up finds it waiting and says yes.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Grown-ups')?.click());
    await page.waitForTimeout(400);
    await intoGrownUps(page);
    t = await text(page);
    check('the grown-up sees the work waiting, in their own words',
      /Inspection Day|Unit quiz|Quiz/i.test(t) && /\$1\.00/.test(t),
      t.match(/\$1\.00[^\n]*/)?.[0] || t.slice(0, 80).replace(/\n/g, ' '));

    check('the approve button is on that row', await rowAction(page, '$1.00', 'Approve'));
    await page.waitForTimeout(400);
    rows = await ledger(page);
    check('saying yes approves it without changing the amount',
      rows[0]?.status === 'approved' && rows[0]?.cents === 100, JSON.stringify(rows));

    // And now it is hers.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Rewards')?.click());
    await page.waitForTimeout(500);
    t = await text(page);
    receipt = receiptBlock(t);
    check('the receipt moves once it is approved', /\$1\.00/.test(receipt),
      receipt.match(/\$\d+\.\d\d/g)?.slice(0, 3).join(' ') || '');
    // Asserted positively. A scan for "score" matched the receipt's own line —
    // "Paid for effort. Never for scores." — which is the principle, not a breach.
    check('the receipt names the work she did, in her words',
      /Sat Inspection Day/.test(receipt), receipt.match(/Sat [^\n]*/)?.[0] || '');
    check('and says what it paid for', /Paid for effort\. Never for scores\./.test(receipt));
    await page.close();
  }
}
