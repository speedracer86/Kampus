/* The stand: a day played end to end, and the math its queue asks for.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { answerMoment, clickText, ledger, open, openMoment, spoken, text, workTheLine } from './harness.mjs';

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
      /* "Hear Ava" shipped emitting an event nothing handled — a button that
         did nothing, which is the same lie as a reader on a screen with
         nothing to read. It has to actually speak, through the one reader, and
         it may not gate: the sale is unaffected either way. */
      const saidBefore = spoken.length;
      const hasHear = await page.evaluate(() => {
        const b = document.querySelector('[data-hear]');
        if (!b) return false;
        b.click();
        return true;
      });
      for (let i = 0; i < 40 && spoken.length === saidBefore; i++) await page.waitForTimeout(100);
      check('the counter offers to say the customer out loud', hasHear);
      check('and tapping it really speaks, rather than firing into nothing',
        spoken.length > saidBefore, `${spoken.length - saidBefore} utterance(s)`);

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

      /* WAIT FOR THE BUTTON, THEN CLICK IT. This clicked whatever was there the
         instant the wrong answer landed, so when the footer had not re-rendered
         yet it clicked NOTHING and the customer was never served — and the
         check that followed reported "a question costs her the sale", which is
         a true sentence about a button that was never pressed. Intermittent,
         and exposed by an unrelated change shifting the timing by half a
         second. */
      for (let i = 0; i < 60; i++) {
        const hit = await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')]
            .find(x => /Next customer|^Serve /.test(x.innerText.trim()));
          if (b) { b.click(); return true; }
          return false;
        });
        if (hit) break;
        await page.waitForTimeout(100);
      }
      /* WAIT FOR THE WRITE, NOT FOR THE CLOCK. A fixed 350ms passed alone and
         failed in the full run, where eight specs drive eight browsers: the
         store had not been written when the check read it, so "the customer is
         served either way" reported a sale that had simply not landed yet. */
      for (let i = 0; i < 60; i++) {
        if (await page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
          return (s.dayQueue || []).some(c => c.momentDone);
        })) break;
        await page.waitForTimeout(100);
      }
      const after = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
        return { kredits: s.kredits, biz: JSON.stringify(s.biz || null) };
      });
      check('getting it wrong costs her nothing', after.kredits === before.kredits && after.biz === before.biz);
      /* "A question never costs her the sale" means the question changes NOTHING
         about the outcome — not that the outcome is always a sale. The stand
         can be out of stock by the time this customer reaches the counter (the
         seed seats ten cups against a line past twenty), and then she is sold
         out for want of lemons, which the question did not cause.

         Demanding 'served' made this fail roughly one run in three, and an
         earlier fix waited longer for the write — treating the symptom. What is
         actually invariant is that she is RESOLVED, and resolved the way STOCK
         dictates. A failure prints both, so it diagnoses itself. */
      const sale = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
        const q = s.dayQueue || [];
        const i = q.findIndex(c => c.momentDone);
        if (i < 0) return { resolved: false };
        const servedBefore = q.slice(0, i).filter(c => c.status === 'served').length;
        return { resolved: true, index: i, status: q[i].status,
          servable: s.dayServable ?? q.length, servedBefore,
          stockAllowed: servedBefore < (s.dayServable ?? q.length) };
      });
      check('the customer is served either way — a question never costs her the sale',
        sale.resolved && (sale.stockAllowed ? sale.status === 'served' : sale.status === 'soldout'),
        JSON.stringify(sale));

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
