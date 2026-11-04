/* The weekly pilot report: the artifact a family receives.

   Checked the way the spec demanded, because this is the engine-tested /
   screen-unreached shape that has hidden a bug every time: seed several weeks of
   events, then assert the figures ON SCREEN equal an INDEPENDENT recomputation —
   not a recomputation through the same seam the screen used, which would agree
   with itself however wrong it was.

   Part of the end-to-end suite — run via `npm run test:webapp`. */
import { open, text, clickText, intoGrownUps, weekKey } from './harness.mjs';

/** Count straight from the seeded rows, with no help from app code. */
function recount(events, week) {
  const dayOf = (e) => e.day || String(e.created_at || '').slice(0, 10);
  const inWeek = events.filter(e => {
    const d = dayOf(e);
    return d && weekKey(Date.parse(`${d}T12:00:00Z`)) === week;
  });
  const isLessonDone = (t) => t === 'lesson_complete' || t === 'lesson_lesson_complete';
  return {
    days: new Set(inWeek.map(dayOf)).size,
    lessons: inWeek.filter(e => isLessonDone(e.type)).length,
    standDays: new Set(inWeek.filter(e => e.type === 'stand_open').map(dayOf)).size,
  };
}

export default async function run(check) {
  /* The vocabulary is checked statically in the engine, but static analysis already
     mistook a handler for an emitter once. This plays the app and reads the log the
     store actually wrote. */
  {
    const p2 = await open({ grade: 6, name: 'Talia', lessonPointer: 0, kredits: 400,
      lessonDoneDay: new Date().toISOString().slice(0, 10) }, '#lesson');
    await p2.waitForTimeout(600);
    const logged = async () => p2.evaluate(() =>
      [...new Set(JSON.parse(localStorage.getItem('kampus_v1_local_events') || '[]').map(e => e.type))]);

    check('opening a lesson records that it started',
      (await logged()).some(t => /lesson_start/.test(t)), (await logged()).join(', ').slice(0, 90));

    await p2.close();

    // The lesson is immersive and carries no nav, so the stand needs its own page.
    const p3 = await open({ grade: 6, name: 'Talia', kredits: 400,
      lessonDoneDay: new Date().toISOString().slice(0, 10) }, '#business');
    await p3.waitForTimeout(500);
    await clickText(p3, 'Open for the day');
    await p3.waitForTimeout(600);
    check('opening the stand records a stand_open carrying its day',
      await p3.evaluate(() => JSON.parse(localStorage.getItem('kampus_v1_local_events') || '[]')
        .some(e => e.type === 'stand_open' && !!e.day)),
      (await p3.evaluate(() => [...new Set(JSON.parse(localStorage.getItem('kampus_v1_local_events') || '[]').map(e => e.type))].join(', '))).slice(0, 90));
    await p3.close();
  }

  const week = weekKey();
  const day = (back) => new Date(Date.now() - back * 86400000).toISOString().slice(0, 10);

  /* Three days this week, plus older weeks that must NOT leak in. */
  const events = [
    { type: 'lesson_lesson_complete', created_at: `${day(0)}T09:00:00Z` },   // the old name
    { type: 'lesson_complete', created_at: `${day(0)}T15:00:00Z` },          // and the new one
    { type: 'stand_open', day: day(0) },
    { type: 'lesson_complete', created_at: `${day(1)}T10:00:00Z` },
    { type: 'stand_open', day: day(1) },
    { type: 'lesson_answer', created_at: `${day(2)}T11:00:00Z` },
    // Older weeks: present in the log, and not this week's business.
    { type: 'lesson_complete', created_at: `${day(9)}T10:00:00Z` },
    { type: 'lesson_complete', created_at: `${day(16)}T10:00:00Z` },
    { type: 'stand_open', day: day(9) },
  ];
  const expected = recount(events, week);

  const ledger = [
    { id: 'r1', cents: 150, reason: 'lesson', label: 'Lessons', status: 'approved', day: 'Mon', week },
    { id: 'r2', cents: 100, reason: 'quiz', label: 'Inspection Day', status: 'pending', day: 'Tue', week },
  ];

  const page = await open({ grade: 6, name: 'Talia', lessonPointer: 3, ledger,
    settings: { cap: 500 } }, '#parents');
  await page.waitForTimeout(400);
  // Seed the event log the way the app stores it, then reload into it.
  await page.evaluate((ev) => localStorage.setItem('kampus_v1_local_events', JSON.stringify(ev)), events);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  check('Grown-ups opens behind the PIN', await intoGrownUps(page));
  check('there is a weekly report to open', await clickText(page, 'This week'));
  await page.waitForTimeout(400);
  let t = await text(page);

  check('the report names the week as hers, not as a score',
    /this week · talia/i.test(t) && /Here.s Talia.s week/.test(t),
    t.match(/Here.s Talia[^\n]*/)?.[0] || t.slice(0, 90).replace(/\n/g, ' '));

  /* The figures, against the independent count. */
  const figure = (label) => {
    const m = t.match(new RegExp(`([\\d.$]+)\\n${label}`));
    return m ? m[1] : null;
  };
  check('days she showed up matches an independent count',
    figure('days she showed up') === String(expected.days), `screen ${figure('days she showed up')}, counted ${expected.days}`);
  check('lessons finished matches, counting BOTH event namings',
    figure('lessons finished') === String(expected.lessons), `screen ${figure('lessons finished')}, counted ${expected.lessons}`);
  check('days at the stand matches', figure('days at the stand') === String(expected.standDays),
    `screen ${figure('days at the stand')}, counted ${expected.standDays}`);
  check('older weeks do not leak into this week',
    expected.lessons === 3 && figure('lessons finished') === '3', `counted ${expected.lessons}`);

  /* Money, in a parent's terms. */
  check('it shows what the grown-up approved and what waits on them',
    /\$1\.50\nyou approved/.test(t) && /\$1\.00\nwaiting on you/.test(t),
    t.match(/\$\d\.\d\d\n[a-z ]+/g)?.join(' | ') || '');
  check('and says what the money was for', /Paid for effort\. Never for scores\./.test(t));

  /* Where she is — not how far behind. */
  check('it says where she is, by unit', /Grade 6 · unit \d of \d/.test(t), t.match(/Grade 6[^\n]*/)?.[0] || '');
  check('and frames the year as a position, not a shortfall',
    /lessons into a \d+-lesson year/.test(t), t.match(/\d+ lessons into[^\n]*/)?.[0] || '');

  /* The ADHD laws, on the one screen most likely to break them. */
  check('no streak anywhere in the report', !/streak|in a row|days running|🔥/i.test(t),
    t.match(/streak|in a row|days running/i)?.[0] || '');
  check('no deficit or decline language', !/behind|fell|dropped|declin|missed \d|only \d|slipp/i.test(t),
    t.match(/behind|fell|dropped|declin|missed \d|only \d|slipp/i)?.[0] || '');
  // "3 out of 7" on a Wednesday is four days missed, stated as arithmetic.
  check('show-up days carry no denominator to fall short of',
    !/out of 7/.test(t) && /so far this week/.test(t), t.match(/out of \d/)?.[0] || '');
  check('nothing scores the kid: no percentage, no accuracy, no grade letter',
    !/\d+%/.test(t) && !/accuracy|correct|right answers/i.test(t),
    t.match(/\d+%|accuracy|correct/i)?.[0] || '');

  /* It has to read on a phone and survive a screenshot. */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('the report fits a phone with no sideways scroll', overflow <= 1, `${overflow}px`);
  const phoneText = await text(page);
  check('and still carries every figure at phone width',
    /days she showed up/.test(phoneText) && /you approved/.test(phoneText) && /Grade 6/.test(phoneText));
  await page.close();

  /* A week with nothing in it is a fact, not a failing. */
  const quiet = await open({ grade: 6, name: 'Talia', lessonPointer: 3, ledger: [] }, '#parents');
  await quiet.waitForTimeout(400);
  await intoGrownUps(quiet);
  await clickText(quiet, 'This week');
  await quiet.waitForTimeout(400);
  const q = await text(quiet);
  check('the quiet week really opened the report, not another tab', /this week · talia/i.test(q));
  check('a quiet week is reported as where she is',
    /A quiet week\. Here.s where Talia is\./.test(q), q.match(/A quiet week[^\n]*/)?.[0] || q.slice(0, 80).replace(/\n/g, ' '));
  check('a quiet week says nothing was lost, and blames nobody',
    /nothing expired, nothing was lost/i.test(q) && !/behind|fell|missed/i.test(q),
    q.match(/behind|fell|missed/i)?.[0] || '');
  check('a quiet week still says where she is', /Grade 6 · unit/.test(q));
  await quiet.close();
}
