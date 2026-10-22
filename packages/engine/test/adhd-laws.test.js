/* The ADHD laws, enforced where the engine can enforce them (PLAY_SYSTEM preamble).
   Untimed by default · no punitive mechanics · no streak guilt · nothing dies ·
   absence is never punished. These are invariants, so they are tests, not intentions. */
import { describe, it, expect } from 'vitest';
import { BLITZ_FAST_MS, payout } from '../src/payout.js';
import { freshBiz, dailyTick, closeDay, REP_FLOOR, SPOIL_CAP_PER_DAY, lemonCount, unlocks } from '../src/business.js';
import { awayFeed } from '../src/care.js';
import { SEASONS, orderStatus, specialOrder } from '../src/seasons.js';
import { typeById } from '../src/business-types.js';
import { RATES, award, DEFAULT_CAP_CENTS } from '../src/earnings.js';
import { review, firstReview } from '../src/review.js';

const day = (n) => `2026-10-${String(n).padStart(2, '0')}`;
const graduated = (b) => ({ ...b, opening: { openDays: 5, done: true } });

describe('untimed by default', () => {
  it('only measures time when Blitz is explicitly on', () => {
    const untimed = payout({ tier: 2, streak: 1 });
    const blitzed = payout({ tier: 2, streak: 1, blitzFast: true });
    expect(untimed.parts.some(p => /blitz/i.test(p))).toBe(false);
    expect(blitzed.total).toBeGreaterThan(untimed.total);
    expect(BLITZ_FAST_MS).toBeGreaterThan(0);          // a window exists, opt-in only
  });
});

describe('no streak guilt', () => {
  it('pays the five-day streak quietly through the ledger, as an ordinary row', () => {
    expect(RATES.streak5).toBeGreaterThan(0);
    const { rows } = award([], { reason: 'streak5', day: 'Fri', week: 'w' });
    expect(rows[0].status).toBe('pending');            // same as every other earning
    expect(rows[0].label).not.toMatch(/🔥|flame|chain|don't break/i);
  });

  it('never puts a streak in the care feed', () => {
    const biz = graduated(freshBiz(7));
    const text = awayFeed(biz, { daysAway: 10, season: SEASONS[0], unlocks: unlocks(biz) }).map(l => l.text).join(' ');
    expect(text).not.toMatch(/streak|in a row|🔥/i);
  });
});

describe('nothing dies and absence is never punished', () => {
  it('floors reputation however long she is away', () => {
    let biz = graduated({ ...freshBiz(8), lastOpenDay: day(1), reputation: REP_FLOOR + 20 });
    for (let d = 2; d <= 60; d++) biz = dailyTick(biz, day(d)).biz;
    expect(biz.reputation).toBe(REP_FLOOR);
    expect(biz.reputation).toBeGreaterThan(0);
  });

  it('caps spoilage per day, so a long absence is a lesson and not a wipeout', () => {
    let biz = graduated(freshBiz(7));
    biz = { ...biz, lots: [{ qty: 40, boughtDay: day(1) }] };
    const after = dailyTick(biz, day(20)).biz;
    expect(lemonCount(biz) - lemonCount(after)).toBeLessThanOrEqual(SPOIL_CAP_PER_DAY);
  });

  it('freezes everything in vacation mode', () => {
    let biz = graduated({ ...freshBiz(8), lastOpenDay: day(1), reputation: 60, vacation: true });
    for (let d = 2; d <= 30; d++) biz = dailyTick(biz, day(d)).biz;
    expect(biz.reputation).toBe(60);
  });

  it('lets a missed season expire with nothing taken', () => {
    const order = specialOrder(SEASONS[0], typeById('lemonade'));
    expect(orderStatus(order, 1, 500)).toBe('expired');
    expect(JSON.stringify(order)).not.toMatch(/penalt|forfeit|lose/i);
  });

  it('contracts a missed review by one rung, never back to nothing', () => {
    let e = firstReview('s', 100);
    for (let i = 0; i < 4; i++) e = review(e, true, 100);
    const missed = review(e, false, 200);
    expect(missed.step).toBe(e.step - 1);
    expect(missed.step).toBeGreaterThanOrEqual(0);
  });
});

describe('no punitive mechanics in the money', () => {
  it('has no negative earning reason — nothing can fine her', () => {
    for (const cents of Object.values(RATES)) expect(cents).toBeGreaterThan(0);
  });

  it('caps the week without ever removing what was already approved', () => {
    let rows = [];
    for (let i = 0; i < 9; i++) ({ rows } = award(rows, { reason: 'quiz', day: 'Mon', week: 'w' }));
    expect(rows.every(r => r.cents > 0)).toBe(true);
    expect(DEFAULT_CAP_CENTS).toBeGreaterThan(0);
  });
});

/* Not an ADHD law — a naming one, and it lives here because this is the file that
   already walks the source for things that must not exist anywhere.

   POLISH_TASKS Task 0's done-condition is that a retired world name returns zero
   hits. It passed for a while without being true: six of them sat in both copies of
   GRADE_WORLDS, unread by the React app and overwritten at load by the legacy one.

   The check is scoped to the surfaces that RENDER. `unit-world.js` names the
   retired worlds on purpose — it is the translation layer that maps them onto
   topics — and the bank keeps its own wording because it is owner-authored. What
   must never happen again is one of these names reaching a screen. */
describe('the retired world names never reach a screen', () => {
  const RETIRED = ['Number Mine', 'Puzzle Lab', 'Decimal Depths', 'Frozen Obby',
    'Power Plant', 'Slope City', 'The Store', 'The Trip', 'The Build'];
  // Everything a kid or a grown-up can actually see.
  const SURFACES = ['packages/ui/src', 'apps/web/src', 'index.html'];

  it('appears nowhere in the rendering surfaces', async () => {
    const { readdirSync, readFileSync, statSync, existsSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = new URL('../../../', import.meta.url).pathname;

    const files = [];
    const walk = (p) => {
      if (!existsSync(p)) return;
      if (!statSync(p).isDirectory()) return void files.push(p);
      for (const e of readdirSync(p)) walk(join(p, e));
    };
    SURFACES.forEach(s => walk(join(root, s)));

    const hits = [];
    for (const f of files.filter(f => /\.(js|jsx|html)$/.test(f))) {
      const text = readFileSync(f, 'utf8');
      for (const name of RETIRED) if (text.includes(name)) hits.push(`${f.replace(root, '')}: ${name}`);
    }
    expect(hits).toEqual([]);
  });
});
