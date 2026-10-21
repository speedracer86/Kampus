import { describe, it, expect } from 'vitest';
import { SEASONS, seasonFor, demandMultiplier, specialOrder, orderStatus } from '../src/seasons.js';
import { awayFeed, buildStage, BUILD_STAGES } from '../src/care.js';
import { freshBiz, closeDay, unlocks } from '../src/business.js';
import { typeById } from '../src/business-types.js';

const graduated = (b) => ({ ...b, opening: { openDays: 5, done: true } });

describe('seasons pull, they never push (PLAY_SYSTEM §4)', () => {
  it('covers all twelve months exactly once', () => {
    const months = SEASONS.flatMap(s => s.months).sort((a, b) => a - b);
    expect(months).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('finds the season for a date', () => {
    expect(seasonFor(new Date('2026-07-04')).id).toBe('heat');
    expect(seasonFor(new Date('2026-12-20')).id).toBe('holiday');
  });

  it('shifts demand by type first, then by kind, then not at all', () => {
    const heat = SEASONS.find(s => s.id === 'heat');
    expect(demandMultiplier(heat, typeById('lemonade'))).toBe(1.5);   // by type
    expect(demandMultiplier(heat, typeById('cookie'))).toBe(1.2);     // by kind (goods)
    expect(demandMultiplier(heat, typeById('digital'))).toBe(1);      // untouched
  });

  it('phrases the special order in her own nouns and pays for the work', () => {
    const order = specialOrder(SEASONS[0], typeById('cookie'));
    expect(order.text).toContain('cookies');
    expect(order.pay).toBeGreaterThan(0);
    expect(order.skill).toBeTruthy();
  });

  it('lets an order expire silently — a missed season costs nothing', () => {
    const order = specialOrder(SEASONS[0], typeById('lemonade'));
    expect(orderStatus(order, 10, 12)).toBe('live');
    expect(orderStatus(order, 10, 99)).toBe('expired');
    // Expiry carries no penalty field at all: there is nothing to take.
    expect(Object.keys(order)).not.toContain('penalty');
    expect(JSON.stringify(order)).not.toMatch(/penalt|lose|forfeit/i);
  });

  it('never drops demand below its ordinary day except the deliberate quiet stretch', () => {
    for (const s of SEASONS) {
      for (const v of Object.values(s.demand)) {
        if (s.id === 'quiet') expect(v).toBeGreaterThanOrEqual(0.9);
        else expect(v).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('the care feed is news, not a scoreboard', () => {
  const biz = () => graduated({
    ...freshBiz(7),
    marketPrices: { lemons: 0.45, sugar: 0.3, cups: 0.2 },
    yesterdayPrices: { lemons: 0.55, sugar: 0.3, cups: 0.2 },
    regulars: [{ id: 'juan', name: 'Juan', affinity: 70 }],
  });

  it('gives at most three lines', () => {
    const feed = awayFeed(biz(), { daysAway: 5, season: SEASONS[0], unlocks: unlocks(biz()) });
    expect(feed.length).toBeLessThanOrEqual(3);
    expect(feed.length).toBeGreaterThan(0);
  });

  it('reports a price move once she has been shown prices move', () => {
    const b = biz();
    expect(awayFeed(b, { unlocks: { drift: false } }).some(l => l.id.startsWith('drift'))).toBe(false);
    const withDrift = awayFeed(b, { unlocks: { drift: true } });
    expect(withDrift.find(l => l.id === 'drift-lemons').text).toMatch(/dropped 10¢/);
  });

  it('never scolds an absence — it reports the stand, not the kid', () => {
    const text = awayFeed(biz(), { daysAway: 9, unlocks: unlocks(biz()) }).map(l => l.text).join(' ');
    expect(text).not.toMatch(/you (missed|forgot|lost|should)|don't forget|come back/i);
  });

  it('mentions no streak, ever (§4 bans the chain that can break)', () => {
    const text = awayFeed(biz(), { daysAway: 7, season: SEASONS[0], unlocks: unlocks(biz()) }).map(l => l.text).join(' ');
    expect(text).not.toMatch(/streak|in a row|day \d+|🔥/i);
  });

  it('says nothing at all when there is no business yet', () => {
    expect(awayFeed(null)).toEqual([]);
  });
});

describe('the growth loop is visible build-out', () => {
  it('starts at the starter kit and advances with the ladder', () => {
    expect(buildStage(freshBiz(7)).id).toBe('starter');
    expect(buildStage({ ladder: ['starter', 'sign', 'blender'] }).id).toBe('blender');
  });

  it('gives every rung a placeholder illustration until the design round', () => {
    for (const s of BUILD_STAGES) expect(s.blob, s.id).toBeTruthy();
  });

  it('never moves backwards — a rung owned is a rung kept', () => {
    const before = buildStage({ ladder: ['starter', 'sign'] });
    const afterBadDay = buildStage({ ladder: ['starter', 'sign'], reputation: 10 });
    expect(afterBadDay.index).toBe(before.index);
  });
});
