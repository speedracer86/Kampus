/* Seasons — the retention calendar (PLAY_SYSTEM §4, "Season loop").

   Four in-world seasons a year. They change OPPORTUNITIES and never punish absence:
   a missed season simply comes around again, and a special order that expires costs
   nothing. That is the ADHD law applied to live-ops — the calendar may pull, it may
   not push.

   This is content the engine reads, not code: adding a season is a table entry. */

/** A season's demand multiplier is applied per business kind, then per type. */
export const SEASONS = [
  {
    id: 'heat', label: 'Heat Wave', months: [5, 6, 7],
    blurb: 'It is hot. People are thirsty and the park is full.',
    demand: { goods: 1.2, lemonade: 1.5, petcare: 1.1 },
    special: {
      id: 'fair-cups', title: 'The summer fair',
      ask: 'The fair wants {n} {units} on Friday. Can you make them in time?',
      units: 60, days: 3, payPerUnit: 1.2, skill: 'scaleRecipe',
    },
  },
  {
    id: 'back', label: 'Back to School', months: [8, 9],
    blurb: 'Everyone is buying pencils and nobody has time to bake.',
    demand: { goods: 1.1, cookie: 1.3, sticker: 1.4, digital: 1.2 },
    special: {
      id: 'class-order', title: 'A class order',
      ask: 'A teacher wants {n} {units} for the first day. Can you fill it?',
      units: 30, days: 2, payPerUnit: 1.3, skill: 'multFact',
    },
  },
  {
    id: 'holiday', label: 'Holidays', months: [10, 11, 0],
    blurb: 'Gift season. People will pay for something handmade.',
    demand: { goods: 1.15, cookie: 1.5, bake: 1.4, craft: 1.5, resale: 1.2 },
    special: {
      id: 'gift-boxes', title: 'Gift boxes',
      ask: 'A neighbour wants {n} {units} boxed up by the weekend. Worth it?',
      units: 24, days: 4, payPerUnit: 1.6, skill: 'unitRate',
    },
  },
  {
    id: 'quiet', label: 'The Quiet Stretch', months: [1, 2, 3, 4],
    blurb: 'Slow weeks. Good time to fix your prices and plan.',
    demand: { goods: 0.9, petcare: 1.2, digital: 1.1 },
    special: {
      id: 'standing-order', title: 'A standing order',
      ask: 'Someone wants {n} {units} every week for a month. What is that worth?',
      units: 10, days: 5, payPerUnit: 1.1, skill: 'twoStep',
    },
  },
];

/** The season a date falls in. Months are 0-indexed, as Date gives them. */
export function seasonFor(date = new Date()) {
  const m = date instanceof Date ? date.getMonth() : new Date(date).getMonth();
  return SEASONS.find(s => s.months.includes(m)) || SEASONS[0];
}

/**
 * How much the season moves demand for this business. Type beats kind; absent both,
 * nothing changes — a season never makes a business worse than its ordinary day
 * except in the Quiet Stretch, which is a planning prompt, not a punishment.
 */
export function demandMultiplier(season, type) {
  if (!season || !type) return 1;
  return season.demand?.[type.id] ?? season.demand?.[type.kind] ?? 1;
}

/**
 * The season's special order, phrased in her own nouns.
 * @returns {{id,title,text,units,days,pay,skill,season}|null}
 */
export function specialOrder(season, type, { units } = {}) {
  if (!season?.special || !type) return null;
  const sp = season.special;
  const n = units || sp.units;
  return {
    id: sp.id, season: season.id, title: sp.title,
    text: sp.ask.replace('{n}', n).replace('{units}', type.unitPlural),
    units: n, days: sp.days,
    pay: Math.round(n * (type.basePrice || 1) * sp.payPerUnit * 100) / 100,
    skill: sp.skill,
  };
}

/**
 * Is an accepted order still live? Expiry is silent and free — §4 forbids a calendar
 * that punishes. An expired order returns when its season comes round again.
 */
export function orderStatus(order, acceptedDay, today) {
  if (!order || acceptedDay == null) return 'none';
  return today - acceptedDay <= order.days ? 'live' : 'expired';
}
