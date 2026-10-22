import { describe, it, expect } from 'vitest';
import { weekPlan, weekStart, weekHeader, comingUp, weeksAhead, weekOffsetFor, isRestDay, DOW } from '../src/week.js';
import { lessonsFor } from '@kampus/curriculum';

// A Wednesday, so "today" sits mid-week and both halves are exercised.
const WED = new Date('2026-10-21T12:00:00Z');
const seq = lessonsFor(7);

describe('the week plan is the real sequence on a real calendar (Task 2)', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart(WED).toISOString().slice(0, 10)).toBe('2026-10-19');
    expect(DOW[weekStart(WED).getUTCDay()]).toBe('Mon');
  });

  it('never renders an empty dash — every day knows what it is', () => {
    const days = weekPlan({ sequence: seq, pointer: 10, today: WED });
    expect(days).toHaveLength(7);
    for (const d of days) {
      expect(['lesson', 'quiz', 'test', 'rest']).toContain(d.kind);
      expect(['done', 'today', 'upcoming']).toContain(d.status);
      expect(d.dow).toBeTruthy();
    }
  });

  it('marks weekends as rest, and never spends a lesson on them', () => {
    const days = weekPlan({ sequence: seq, pointer: 0, today: WED });
    const weekend = days.filter(d => ['Sat', 'Sun'].includes(d.dow));
    expect(weekend).toHaveLength(2);
    expect(weekend.every(d => d.kind === 'rest' && !d.lessonId)).toBe(true);
  });

  it('honours rest days a grown-up marks off', () => {
    const days = weekPlan({ sequence: seq, pointer: 0, today: WED, restDows: [0, 3, 6] });  // also Wednesdays
    expect(days.find(d => d.dow === 'Wed').kind).toBe('rest');
  });

  it('lays the next lessons in order across school days only', () => {
    const days = weekPlan({ sequence: seq, pointer: 0, today: WED });
    const school = days.filter(d => d.kind !== 'rest' && d.status !== 'done');
    const ids = school.map(d => d.lessonId);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));       // in order
    expect(new Set(ids).size).toBe(ids.length);                // no day repeats a lesson
  });

  it('shows what she actually did on past days, with what it paid', () => {
    const days = weekPlan({
      sequence: seq, pointer: 3, today: WED,
      history: { '2026-10-19': { lessonN: 1, earnedCents: 50 }, '2026-10-20': { lessonN: 2, earnedCents: 50 } },
    });
    const mon = days.find(d => d.dow === 'Mon');
    expect(mon).toMatchObject({ status: 'done', kind: 'lesson', earnedCents: 50 });
    expect(mon.title).toBe(seq[0].title);
  });

  it('treats a past day she skipped as rest, not as a failure', () => {
    const days = weekPlan({ sequence: seq, pointer: 0, today: WED, history: {} });
    const mon = days.find(d => d.dow === 'Mon');
    expect(mon).toMatchObject({ status: 'done', kind: 'rest' });
    expect(JSON.stringify(mon)).not.toMatch(/miss|fail|skip/i);
  });

  it('marks exactly one day as today', () => {
    const days = weekPlan({ sequence: seq, pointer: 5, today: WED });
    expect(days.filter(d => d.status === 'today')).toHaveLength(1);
    expect(days.find(d => d.status === 'today').dow).toBe('Wed');
  });

  it('pages forward without replaying the same lessons', () => {
    const thisWeek = weekPlan({ sequence: seq, pointer: 0, today: WED, offsetWeeks: 0 });
    const nextWeek = weekPlan({ sequence: seq, pointer: 0, today: WED, offsetWeeks: 1 });
    const ids = (w) => w.filter(d => d.lessonId).map(d => d.lessonId);
    expect(ids(nextWeek)[0]).toBeGreaterThan(ids(thisWeek).at(-1));
  });

  it('calls a week containing the grade test "License week"', () => {
    const testIndex = seq.findIndex(d => d.type === 'test');
    const days = weekPlan({ sequence: seq, pointer: testIndex, today: WED });
    expect(weekHeader(days, 0).label).toBe('License week');
    expect(weekHeader(weekPlan({ sequence: seq, pointer: 0, today: WED }), 1).label).toBe('Next week');
  });

  it('counts down to the next Inspection Day and the License', () => {
    const up = comingUp({ sequence: seq, pointer: 0 });
    expect(up.map(u => u.label)).toEqual(['Inspection Day', 'The License']);
    expect(up[0].lessonsToGo).toBeGreaterThan(0);
    expect(up[1].lessonsToGo).toBeGreaterThan(up[0].lessonsToGo);
    expect(weeksAhead(up[0].lessonsToGo)).toBeGreaterThanOrEqual(0);
  });

  it('jumps to the week that ACTUALLY holds the License, mid-week today included', () => {
    const up = comingUp({ sequence: seq, pointer: 18 });
    const license = up.find(u => u.kind === 'test');
    const off = weekOffsetFor(license.index, { sequence: seq, pointer: 18, today: WED });
    const days = weekPlan({ sequence: seq, pointer: 18, today: WED, offsetWeeks: off });
    expect(days.some(d => d.kind === 'test'), `offset ${off} has no test day`).toBe(true);
    expect(weekHeader(days, off).label).toBe('License week');
    // The arithmetic shortcut is off by a week here, which is exactly why it is not used.
    const naive = weeksAhead(license.lessonsToGo);
    expect(weekPlan({ sequence: seq, pointer: 18, today: WED, offsetWeeks: naive }).some(d => d.kind === 'test')).toBe(false);
  });

  it('stops offering what is already behind her', () => {
    expect(comingUp({ sequence: seq, pointer: seq.length - 1 }).map(u => u.kind)).toEqual(['test']);
  });
});
