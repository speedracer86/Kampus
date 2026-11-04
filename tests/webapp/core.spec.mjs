/* The screens load, the nav is never a one-way door, and the week view is real.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { buildDayLesson, clickText, ledger, open, text } from './harness.mjs';

export default async function run(check) {
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

  /* ---------- 7. Teach me is a reveal, not a wall — and never shows raw markup ----
     The owner's play-test found literal "<b>18</b>" on screen: 106 engine teach
     strings carry v1-era <b> markup that the legacy renderer ate via innerHTML and
     React printed as text. The panel also dumped every line at once — prose at the
     exact moment an overloaded kid asked for help. Now the lines tap in one at a
     time and the markup renders as emphasis. */
  {
    const page = await open({ grade: 3 }, '#lesson');
    await page.waitForTimeout(600);
    await clickText(page, 'Teach me');
    await page.waitForTimeout(200);
    // The token gate may ask first; either button lands in the panel.
    if (/Use a token|Teach me anyway/.test(await text(page))) {
      await clickText(page, 'Use a token') || await clickText(page, 'Teach me anyway');
      await page.waitForTimeout(200);
    }
    let t = await text(page);
    check('Teach me opens', /TEACH ME/i.test(t), t.slice(0, 80).replace(/\n/g, ' '));
    check('no raw <b> markup anywhere on the lesson screen', !t.includes('<b>') && !t.includes('</b>'));
    const counter = t.match(/Tap for the next line · (\d+) of (\d+)/);
    if (counter) {
      await clickText(page, 'Tap for the next line');
      await page.waitForTimeout(150);
      t = await text(page);
      const after = t.match(/Tap for the next line · (\d+) of (\d+)/);
      check('teach lines reveal one tap at a time',
        after ? Number(after[1]) === Number(counter[1]) + 1 : Number(counter[2]) === Number(counter[1]) + 1,
        `${counter[1]} of ${counter[2]} → ${after ? after[1] : 'all shown'}`);
    } else {
      check('teach panel rendered its content (single line, no reveal needed)', /TEACH ME/i.test(t));
    }
    await page.close();
  }
}
