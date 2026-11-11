/* The stand: a day played end to end, and the math its queue asks for.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { answerMoment, clickText, ledger, open, openMoment, text, workTheLine } from './harness.mjs';

export default async function run(check) {
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
    const counter = await page.evaluate(() => document.body.innerText.match(/Customer (\d+) of (\d+)/));
    check('opening the day puts one customer at the counter',
      !!counter && counter[1] === '1' && Number(counter[2]) > 0,
      counter ? counter.slice(1).join(' of ') : (await text(page)).slice(0, 70).replace(/\n/g, ' '));

    /* §0f: there is no "Serve the rest". Open day is one person at a time, so
       finishing the day means working the line — and the driver reports how
       many questions it met, because a day that skipped the maths would look
       exactly like a day that had none. */
    const worked = await workTheLine(page);
    check('the whole line can be worked, questions and all',
      worked.served > 0, JSON.stringify(worked));
    await clickText(page, 'Close the books');
    await page.waitForTimeout(700);
    const t = await text(page);
    const profit = t.match(/Profit\n([^\n]+)/)?.[1];
    check('closing the books writes a ledger', /Revenue/.test(t) && !!profit, `profit ${profit}`);
    await page.close();
  }

  /* ---------- 14. the queue asks for its math (business moments) ----------
     makeMoment generates questions from state she owns — her price, her stock,
     today's market — which PLAY_SYSTEM §2 calls the crown jewel of the three-source
     rule. They were attached to every day's queue and no screen ever asked them. */
  {
    const today = new Date().toISOString().slice(0, 10);
    const page = await open({ grade: 6, name: 'Talia', kredits: 400, lessonDoneDay: today }, '#business');
    await page.waitForTimeout(400);
    await clickText(page, 'Open for the day');
    await page.waitForTimeout(500);

    /* Walk the line until someone asks for the maths. There is no bulk serve on
       the counter, and a fixed number of taps would pass or fail on the roll of
       the dice — the engine puts questions at random points in a line that can
       run past twenty. */
    let m = null;
    for (let i = 0; i < 40 && !m; i++) {
      m = await openMoment(page);
      if (m) break;
      const moved = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /^Serve |^Next customer/.test(x.innerText.trim()));
        if (b) { b.click(); return true; }
        return false;
      });
      if (!moved) break;
      await page.waitForTimeout(110);
    }
    let t = await text(page);
    check('a customer in the line asks for the math', !!m, t.slice(0, 80).replace(/\n/g, ' '));
    if (!m) { await page.close(); }
    else {
      check('the question reaches the screen, not just the store', t.includes(m.q.replace(/<[^>]*>/g, '').slice(0, 30)),
        m.q.slice(0, 60));
      check('it is built from her own numbers, not a costume',
        /\$\d/.test(m.q) && !/Maria|a store offers/i.test(m.q));

      const options = [m.ans, ...m.wrongs];
      const onScreen = await page.evaluate((opts) => opts.filter(o =>
        [...document.querySelectorAll('button')].some(b => b.innerText.trim() === o)).length, options);
      check('every option is on screen as a real button', onScreen === options.length, `${onScreen}/${options.length}`);
      check('no option is repeated', new Set(options).size === options.length, JSON.stringify(options));
      const withFigures = options.filter(o => /\d/.test(o)).length;
      check('the answer is not the only choice carrying a figure',
        withFigures === 0 || withFigures >= 2, `${withFigures} of ${options.length}`);

      /* §0f: open day shows ONLY the counter. Reputation, regulars, the bank,
         the phase tabs and the served/missed counts belong to prep and to the
         ledger; here they are five things competing with the person waiting. */
      check('the counter shows only the counter',
        !/Reputation|Regulars|SERVED\n|MISSED\n|Prep\n|Ledger\n/.test(t),
        t.match(/Reputation|Regulars|SERVED|MISSED/)?.[0] || 'clean');
      /* And nothing can serve past an open question: the only way on is to
         answer it, which is the "never blocks the sale" rule from the other
         side — it does not block her, and she cannot skip it either. */
      check('there is no way to serve past an open question',
        await page.evaluate(() => ![...document.querySelectorAll('button')]
          .some(b => /^Serve |^Next customer|Serve the rest/.test(b.innerText.trim()))));
      // The question IS the screen now, not a card under twenty-six rows.
      check('the question is the biggest thing on the counter', await page.evaluate((q) => {
        const el = [...document.querySelectorAll('div')]
          .find(d => d.children.length === 0 && d.innerText.trim().startsWith(q.slice(0, 20)));
        return el ? parseFloat(getComputedStyle(el).fontSize) >= 24 : false;
      }, m.q.replace(/<[^>]*>/g, '')), '');
      check('exactly one customer is marked as the one she is on', await page.evaluate(() =>
        document.querySelectorAll('[data-customer][data-state="current"]').length) === 1);

      // Wrong on purpose: the §5 rule has to hold for questions inside the business.
      const before = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
        return { kredits: s.kredits, biz: JSON.stringify(s.biz || null) };
      });
      await page.evaluate((l) => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === l)?.click(), m.wrongs[0]);
      await page.waitForTimeout(300);
      t = await text(page);
      check('a miss shows the working rather than just marking it wrong',
        /Here.s the (working|sum)/.test(t) && t.includes(m.ans),
        t.match(/Here.s the [^\n]*/)?.[0] || t.slice(0, 80).replace(/\n/g, ' '));

      await page.evaluate(() => [...document.querySelectorAll('button')]
        .find(b => /Next customer|^Serve /.test(b.innerText.trim()))?.click());
      await page.waitForTimeout(350);
      const after = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
        return { kredits: s.kredits, biz: JSON.stringify(s.biz || null) };
      });
      check('getting it wrong costs her nothing', after.kredits === before.kredits && after.biz === before.biz);
      check('the customer is served either way — a question never costs her the sale',
        await page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
          return (s.dayQueue || []).some(c => c.momentDone && c.status === 'served');
        }));

      // Finish the day and close the books.
      await workTheLine(page);
      await clickText(page, 'Close the books');
      await page.waitForTimeout(700);
      t = await text(page);
      check('the day still closes with a ledger after the moments', /Revenue/.test(t) && /Profit/.test(t),
        t.slice(0, 80).replace(/\n/g, ' '));
      await page.close();
    }
  }
}
