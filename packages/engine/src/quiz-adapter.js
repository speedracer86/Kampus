/* Bridges engine problems to the UI library's QuizRound question contract:
   {text, mode: 'choice'|'numline'|'fraction'|'money'|'thermo', choices?, answerIndex?, vis?, teach: []}.
   The engine emits display strings (fraction HTML, minus signs); QuizRound
   renders them as-is, so this adapter only maps shape, never content. */
import { makeProblem } from './adaptive.js';
import { valOf } from './util.js';

/* QuizRound renders question/choice/teach strings as plain text, so engine HTML
   (stacked fractions, bold marks, inline SVG visuals) must flatten to text here.
   Known tradeoff, tracked for Phase 3: extend the library with a blessed rich-text
   question mode so stacked fractions and CRA visuals come back. */
export function plainText(s) {
  return String(s)
    .replace(/<span class="fr"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, '$1/$2')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Integer tier-1 add/sub problems play as tap-the-number-line (the v1 rule).
   QuizRound's NumberLine contract: vis = {from, to, start, end} where start is
   the first operand and end is the answer the kid taps. */
function numlineMode(problem, topic) {
  if (topic !== 'int' || problem.tier !== 1) return null;
  const end = valOf(problem.ans);
  const m = String(problem.q).replace(/−/g, '-').match(/^\(?(-?\d+)\)?\s*[+\-]/);
  if (end === null || !m || !Number.isInteger(end) || Math.abs(end) > 20) return null;
  const start = parseInt(m[1], 10);
  if (Math.abs(start) > 20 || start === end) return null;
  const lo = Math.min(start, end, 0), hi = Math.max(start, end, 0);
  return { from: lo - 2, to: hi + 2, start, end };
}

/**
 * One play-ready question in QuizRound shape.
 * @param {3|4|5|6|7|8} grade
 * @param {'frac'|'ratio'|'int'|'alg'} topic
 * @param {1|2|3} tier
 * @param {{forceTier?: 1|2|3}} [opts]
 */
export function toQuizQuestion(grade, topic, tier, opts = {}) {
  const p = makeProblem(grade, topic, tier, opts);
  const nl = numlineMode(p, topic);
  return {
    text: plainText(p.q),
    prompt: p.prompt,
    skill: p.skill,
    tier: p.tier,
    mode: nl ? 'numline' : 'choice',
    ...(nl ? { vis: nl } : {}),
    choices: p.choices.map(plainText),
    answerIndex: p.correctIdx,
    teach: p.steps.map(plainText),
  };
}
