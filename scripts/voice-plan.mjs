/* What to generate, in what order — the planning half of the voice generator.

   Split out of generate-voice.mjs for one reason: every decision in here is a
   decision about MONEY (a character generated twice is a credit spent twice) and
   about half-voiced skills, and neither can be tested through a script whose only
   output is API calls. These functions are pure. The tests live in
   packages/curriculum/test/voice-plan.test.js.

   Three things it owns:

     1. KINDS ARE DISCOVERED, NOT LISTED. The bank grows by tranche and the next
        one carries re-teach scripts under a key this file has never seen. Reading
        the kinds off each entry means a new kind generates, manifests and plays
        with no code change here — and a kind that arrives as one step rather than
        an array of them still works.
     2. PRIORITY ORDER IS BY GRADE, LOWEST FIRST. Owner's call, Nov 2026: the
        band-a auto-read kids in grades 3-5 need the voice most, so when credits
        are short they are generated first and the older grades wait for the
        renewal. A skill taught in several grades sorts by the youngest that
        teaches it.
     3. A BUDGET CUTS AT SKILL BOUNDARIES, never mid-skill. Half a skill's clips
        is the worst state available: the step with clips plays and the next one
        falls back to the robot voice, inside one lesson. A whole unvoiced skill
        is just today's behaviour. */
import { SPEAK, MOVE_INTROS, SKILLS, YEAR, GRADES } from '@kampus/curriculum';
import { createHash } from 'node:crypto';

export const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

/* The kinds that have shipped keep their letters — renaming one regenerates
   correct clips at full price. `moveIntros` is listed because its initial
   collides with `more`, which the prefix guard caught the first time the two
   were in the bank together. */
const KNOWN_PREFIX = { steps: 't', more: 'm', moveIntros: 'i' };
export const prefixFor = (kind) => KNOWN_PREFIX[kind] || kind.slice(0, 1);

/** The kinds this bank entry actually carries, in a stable order. */
export function kindsOf(entry) {
  const isStep = (s) => Array.isArray(s?.lines);
  const kinds = Object.keys(entry || {}).filter((k) => {
    const v = entry[k];
    return Array.isArray(v) ? v.some(isStep) : isStep(v);
  });
  // steps before more before whatever is new, so file order stays readable.
  const rank = (k) => (k === 'steps' ? 0 : k === 'more' ? 1 : 2);
  return kinds.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/** A kind's steps, whether the bank wrote one step or a list of them. */
export const stepsOf = (entry, kind) => {
  const v = entry?.[kind];
  return Array.isArray(v) ? v : v ? [v] : [];
};

/**
 * The bank the generator actually works from: the skills, plus Karla's move
 * intros as their own entries.
 *
 * The intros are the same five sentences for every skill, so they live in one
 * place and are composed in here as `move_<id>` with a `moveIntros` kind —
 * discovered like any other kind, generated and manifested like any other clip,
 * with nothing in the pipeline needing to know what they are.
 */
export function fullBank(speak = SPEAK, intros = MOVE_INTROS) {
  const moves = Object.fromEntries(
    Object.entries(intros || {}).map(([id, step]) => [`move_${id}`, { moveIntros: [step] }]),
  );
  return { ...speak, ...moves };
}

/** The youngest grade whose year teaches this skill — its generation priority. */
export function gradeOf(skill) {
  // Karla's host lines are not a grade's material — every kid hears them on
  // every lesson, so they generate before anyone's skills do.
  if (String(skill).startsWith('move_')) return 0;
  for (const g of GRADES) {
    if (YEAR[g].some(u => (u.skills || []).includes(skill))) return g;
  }
  // Not in any year plan (a generator ahead of the sequence): fall back to the
  // grade in its primary standard, e.g. 4.NF.A.1 → 4.
  const code = SKILLS[skill]?.primary || '';
  const n = Number(code.split('.')[0]);
  return Number.isFinite(n) && n ? n : 99;
}

/**
 * Every line in the bank, flattened with the file it will be written to, in
 * generation priority order.
 */
export function plan(bank = SPEAK) {
  const rows = [];
  const seen = new Map();
  Object.entries(bank).forEach(([skill, entry], bankIndex) => {
    for (const kind of kindsOf(entry)) {
      const prefix = prefixFor(kind);
      // Two kinds resolving to one letter would silently overwrite each other's
      // clips. Loud is the only acceptable behaviour here.
      const clash = seen.get(prefix);
      if (clash && clash !== kind) {
        throw new Error(`voice kinds "${clash}" and "${kind}" both want the file prefix "${prefix}"`);
      }
      seen.set(prefix, kind);
      stepsOf(entry, kind).forEach((step, si) => {
        (step.lines || []).forEach((line, li) => {
          rows.push({
            skill, kind, grade: gradeOf(skill), bankIndex, stepIndex: si, lineIndex: li,
            say: line.say, cue: line.cue,
            file: `${skill}/${prefix}${si}-${li}.mp3`,
            sha: sha(line.say),
          });
        });
      });
    }
  });
  const rank = (k) => (k === 'steps' ? 0 : k === 'more' ? 1 : 2);
  return rows.sort((a, b) => a.grade - b.grade || a.skill.localeCompare(b.skill)
    || rank(a.kind) - rank(b.kind) || a.stepIndex - b.stepIndex || a.lineIndex - b.lineIndex);
}

/** Lines whose text changed since the last run (or all of them, with force). */
export function stale(rows, manifest, { force = false, exists = () => true } = {}) {
  if (force) return rows.slice();
  return rows.filter(r => {
    const got = manifest?.[r.skill]?.[r.kind]?.[r.stepIndex]?.[r.lineIndex];
    if (!got || got.sha !== r.sha) return true;
    return !exists(r.file);              // manifest says done, the file is gone
  });
}

/**
 * Narrow a plan to what this run should pay for.
 *
 * @param {object} opts
 * @param {number[]} [opts.grades]  only these grades
 * @param {string[]} [opts.only]    only these skills
 * @param {number} [opts.budget]    stop before exceeding this many characters,
 *                                  cutting between skills and never inside one
 * @returns {{take: object[], deferred: object[]}}
 */
export function select(rows, { grades, only, budget } = {}) {
  let pool = rows;
  if (grades?.length) pool = pool.filter(r => grades.includes(r.grade));
  if (only?.length) pool = pool.filter(r => only.includes(r.skill));
  if (!(budget > 0)) return { take: pool, deferred: [] };

  // Whole skills, in priority order, while the budget holds. A skill that does not
  // fit stops the run: taking the next, cheaper skill instead would reorder the
  // owner's priority to save a few credits.
  const order = [];
  const bySkill = new Map();
  for (const r of pool) {
    if (!bySkill.has(r.skill)) { bySkill.set(r.skill, []); order.push(r.skill); }
    bySkill.get(r.skill).push(r);
  }
  const take = [];
  const deferred = [];
  let spent = 0;
  let stopped = false;
  for (const skill of order) {
    const group = bySkill.get(skill);
    const cost = group.reduce((n, r) => n + r.say.length, 0);
    if (!stopped && spent + cost <= budget) { take.push(...group); spent += cost; }
    else { stopped = true; deferred.push(...group); }
  }
  return { take, deferred };
}

/**
 * The manifest, built from the FULL plan but listing only clips that exist.
 *
 * Both halves matter. Built from the full plan, a filtered run does not wipe the
 * entries for skills it did not touch. Listing only files that exist, it never
 * claims a clip the budget deferred — the manifest is what playback trusts, and a
 * missing file it points at is a silent dead beat in a lesson.
 */
export function buildManifest(rows, { exists = () => true } = {}) {
  const m = {};
  // Bank order, not priority order: the manifest is a committed file, and
  // re-keying it by grade would show up as a whole-file diff on every run.
  const ordered = rows.slice().sort((a, b) => (a.bankIndex ?? 0) - (b.bankIndex ?? 0));
  for (const r of ordered) {
    if (!exists(r.file)) continue;
    m[r.skill] = m[r.skill] || {};
    m[r.skill][r.kind] = m[r.skill][r.kind] || [];
    const arr = m[r.skill][r.kind];
    arr[r.stepIndex] = arr[r.stepIndex] || [];
    arr[r.stepIndex][r.lineIndex] = { file: r.file, sha: r.sha };
  }
  return m;
}

/** Parse `--grades 3,4,5` / `--only eqFrac,addInt` / `--budget 9700` from argv. */
export function flags(argv = []) {
  const value = (name) => {
    const i = argv.indexOf(`--${name}`);
    if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
    const eq = argv.find(a => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : null;
  };
  const list = (name) => (value(name) || '').split(',').map(s => s.trim()).filter(Boolean);
  const budget = Number(value('budget'));
  return {
    dry: argv.includes('--dry'),
    force: argv.includes('--force'),
    grades: list('grades').map(Number).filter(Number.isFinite),
    only: list('only'),
    budget: Number.isFinite(budget) && budget > 0 ? budget : 0,
  };
}
