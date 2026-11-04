/* Sound and juice (§8.1), and the three rules that bound it.

   The rules, not the pixels. Whether confetti is pretty is not checkable here;
   whether it appears somewhere it must not be is exactly checkable, and that is
   the part that can hurt a kid:

     1. juice is for EARNING and BUILDING moments — never idle, never on a miss
     2. reduced motion kills all of it, sound included
     3. the Grown-ups mute switch is honoured

   Part of the end-to-end suite — run via `npm run test:webapp`. */
import { open, text, clickText, answerMoment, sitPaper, openPaper, driveToTeach } from './harness.mjs';

/**
 * Did confetti EVER appear? Not "is it on screen now".
 *
 * The burst clears itself after 1.4s, so a live-DOM check is a race: a burst that
 * came and went before the assertion reads as "no confetti", which would make
 * every negative check here pass without proving anything. An observer installed
 * before the bundle loads records the fact instead of the moment.
 */
const watchConfetti = (page) => page.addInitScript(() => {
  window.__kampusConfetti = 0;
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches?.('[data-confetti]') || n.querySelector?.('[data-confetti]'))) {
          window.__kampusConfetti++;
        }
      }
    }
  });
  // An init script runs BEFORE the document exists, so observing documentElement
  // straight away throws and the observer never attaches — which made every
  // confetti check read zero and pass the negative ones for the wrong reason.
  const attach = () => {
    if (!document.documentElement) return setTimeout(attach, 0);
    obs.observe(document.documentElement, { childList: true, subtree: true });
  };
  attach();
});

const confettiFired = (page) => page.evaluate(() => window.__kampusConfetti || 0);

/** Did a WebAudio oscillator actually start? Stubbed before the bundle loads. */
const soundsPlayed = (page) => page.evaluate(() => window.__kampusSounds || 0);

/** Count every oscillator start, without playing anything audible in CI. */
const listenForSound = (page) => page.addInitScript(() => {
  window.__kampusSounds = 0;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const realStart = AC.prototype.createOscillator;
  AC.prototype.createOscillator = function (...a) {
    const osc = realStart.apply(this, a);
    const start = osc.start.bind(osc);
    osc.start = (...b) => { window.__kampusSounds++; return start(...b); };
    return osc;
  };
});

/** Play a business day to the ledger, answering any moment that stops the line. */
async function closeTheBooks(page) {
  await clickText(page, 'Open for the day');
  await page.waitForTimeout(500);
  for (let i = 0; i < 8; i++) {
    await clickText(page, 'Serve the rest');
    await page.waitForTimeout(320);
    if (!await answerMoment(page)) break;
  }
  await clickText(page, 'Close the books');
  await page.waitForTimeout(700);
}

export default async function run(check) {
  const today = new Date().toISOString().slice(0, 10);
  const seed = { grade: 6, name: 'Talia', kredits: 400, lessonDoneDay: today };

  /* ---- the register rings when the books close, and only then ---- */
  {
    const page = await open(seed, '#business');
    await listenForSound(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    check('nothing has made a sound just by opening a screen', await soundsPlayed(page) === 0,
      `${await soundsPlayed(page)} sounds`);

    await closeTheBooks(page);
    const t = await text(page);
    check('the books closed', /Revenue/.test(t) && /Profit/.test(t), t.slice(0, 70).replace(/\n/g, ' '));
    check('closing the books rings the register', await soundsPlayed(page) > 0, `${await soundsPlayed(page)} notes`);

    // The profit is a count-up, so the figure on screen must still land on the real one.
    const landed = await page.evaluate(() => {
      const el = document.querySelector('[data-countup]');
      return el ? { target: el.dataset.countup, shown: el.textContent.trim() } : null;
    });
    check('the count-up lands on the real figure, not near it',
      !!landed && landed.shown.replace(/[^\d-]/g, '') === String(Math.abs(Number(landed.target))),
      JSON.stringify(landed));
    await page.close();
  }

  /* ---- muted means muted ---- */
  {
    const page = await open({ ...seed, settings: { sound: false } }, '#business');
    await listenForSound(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await closeTheBooks(page);
    check('the Grown-ups mute switch silences the register',
      await soundsPlayed(page) === 0, `${await soundsPlayed(page)} sounds while muted`);
    check('but the day still closes and the money still shows',
      /Revenue/.test(await text(page)), '');
    await page.close();
  }

  /* ---- reduced motion kills all of it, sound included ---- */
  {
    const page = await open(seed, '#business');
    await listenForSound(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await closeTheBooks(page);
    check('reduced motion silences the register without anyone setting a setting',
      await soundsPlayed(page) === 0, `${await soundsPlayed(page)} sounds`);
    check('and the ledger still reads correctly', /Revenue/.test(await text(page)), '');
    const shown = await page.evaluate(() => {
      const el = document.querySelector('[data-countup]');
      return el ? el.textContent.trim() : null;
    });
    check('the figure is there immediately, not animated to', !!shown && shown !== '$0', shown || 'missing');
    await page.close();
  }

  /* ---- a miss gets no celebration ---- */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0, ledger: [], passed: {} }, '#test');
    await watchConfetti(page);
    await listenForSound(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Start|Begin|ready/i.test(b.innerText))?.click());
    await page.waitForTimeout(500);
    await sitPaper(page, { score: 0 });                 // every answer wrong, on purpose
    const t = await text(page);
    check('a missed License shows its repair plan', /repair|redo|again/i.test(t), t.slice(0, 70).replace(/\n/g, ' '));
    check('and nothing celebrates over it', await confettiFired(page) === 0, `${await confettiFired(page)} bursts`);
    check('nor does it make a sound', await soundsPlayed(page) === 0, `${await soundsPlayed(page)}`);
    await page.close();
  }

  /* ---- a License earned is a building moment ---- */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0, ledger: [], passed: {} }, '#test');
    await watchConfetti(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Start|Begin|ready/i.test(b.innerText))?.click());
    await page.waitForTimeout(500);
    await sitPaper(page, { score: Infinity });
    check('passing the License celebrates', await confettiFired(page) > 0, `${await confettiFired(page)} bursts`);
    check('the district screen is what is showing', /district is built/i.test(await text(page)));
    await page.close();
  }

  /* ---- and under reduced motion, even a pass stays still ---- */
  {
    const page = await open({ grade: 6, name: 'Talia', lessonPointer: 0, ledger: [], passed: {} }, '#test');
    await watchConfetti(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => /Start|Begin|ready/i.test(b.innerText))?.click());
    await page.waitForTimeout(500);
    await sitPaper(page, { score: Infinity });
    check('reduced motion means no confetti even on the best moment in the product',
      await confettiFired(page) === 0, `${await confettiFired(page)} bursts`);
    check('and the district is still built', /district is built/i.test(await text(page)));
    await page.close();
  }
}
