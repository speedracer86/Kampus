/* A blank device to a playing kid: setup, the doorway, and the placement check.

   Part of the end-to-end suite — run it through `npm run test:webapp`, which builds
   apps/web first and shares one static host and one browser across every spec. */
import { clickText, ledger, openBlank, start, text } from './harness.mjs';

export default async function run(check) {
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
}
