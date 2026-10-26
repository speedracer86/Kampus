/* The stand: a day played end to end, and the math its queue asks for.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { answerMoment, clickText, ledger, open, openMoment, text } from './harness.mjs';

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
    const queued = await page.evaluate(() => document.body.innerText.match(/SERVED\n(\d+)/)?.[1]);
    check('opening the day forms a queue', queued === '0' && /Waiting|Next/.test(await text(page)));

    // A customer carrying a math moment stops the line, by design, so "Serve the
    // rest" no longer runs the whole day in one tap.
    await clickText(page, 'Serve the rest');
    await page.waitForTimeout(500);
    for (let i = 0; i < 8; i++) {
      if (!await answerMoment(page)) break;
      await clickText(page, 'Serve the rest');
      await page.waitForTimeout(350);
    }
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

    // "Serve the rest" serves everyone up to the first moment and stops there, so
    // one click reaches it whatever the queue length. Tapping "Serve next" a fixed
    // number of times did not: moments sit at random points in a queue that can run
    // past twenty, so the check passed or failed on the roll of the dice.
    await clickText(page, 'Serve the rest');
    await page.waitForTimeout(500);
    let m = await openMoment(page);
    let t = await text(page);
    check('a customer in the line asks for the math', !!m, t.slice(0, 80).replace(/\n/g, ' '));
    if (!m) { await page.close(); }
    else {
      check('the question reaches the screen, not just the store', t.includes(m.q.replace(/<[^>]*>/g, '').slice(0, 30)),
        m.q.slice(0, 60));
      check('the moment names the skill it is practising', t.includes(m.skill), m.skill);
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

      check('"Serve the rest" cannot skip past an open moment', (await clickText(page, 'Serve the rest')) === false);
      check('the line shows exactly one customer as Next', (await page.evaluate(() =>
        (document.body.innerText.match(/\nNext\n/g) || []).length)) <= 1);
      // The question that stopped the line must be above the line, not under 26 rows.
      check('the moment is above the queue, not below the fold', await page.evaluate((q) => {
        const t = document.body.innerText;
        return t.indexOf(q.slice(0, 24)) < t.indexOf('Waiting');
      }, m.q.replace(/<[^>]*>/g, '')), '');

      // Wrong on purpose: the §5 rule has to hold for questions inside the business.
      const before = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
        return { kredits: s.kredits, biz: JSON.stringify(s.biz || null) };
      });
      await page.evaluate((l) => [...document.querySelectorAll('button')].find(b => b.innerText.trim() === l)?.click(), m.wrongs[0]);
      await page.waitForTimeout(300);
      t = await text(page);
      check('a miss shows the working rather than just marking it wrong',
        /Here.s the working/.test(t) && m.ans.split(' ')[0] && t.includes(m.ans),
        t.match(/Here.s the working[^\n]*/)?.[0] || t.slice(0, 80).replace(/\n/g, ' '));

      await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Serve them/.test(b.innerText))?.click());
      await page.waitForTimeout(350);
      const after = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('kampus_v1_local') || '{}');
        return { kredits: s.kredits, biz: JSON.stringify(s.biz || null) };
      });
      check('getting it wrong costs her nothing', after.kredits === before.kredits && after.biz === before.biz);
      t = await text(page);
      check('the customer is served either way — a question never costs her the sale',
        /Serve next|Serve the rest|Close the books/.test(t), t.slice(0, 80).replace(/\n/g, ' '));

      // Finish the day, answering any further moments.
      for (let i = 0; i < 8; i++) {
        await clickText(page, 'Serve the rest');
        await page.waitForTimeout(320);
        if (!await answerMoment(page)) break;
      }
      await clickText(page, 'Close the books');
      await page.waitForTimeout(700);
      t = await text(page);
      check('the day still closes with a ledger after the moments', /Revenue/.test(t) && /Profit/.test(t),
        t.slice(0, 80).replace(/\n/g, ' '));
      await page.close();
    }
  }
}
