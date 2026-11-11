/* The shared Question screen — STYLE_GUIDE §0 "Question screen" (4d desktop, 4f phone).
   One component serves the daily lesson, free-practice missions, unit quizzes and the
   grade test; the context prop decides which help is offered, nothing else changes.

   Stateless by contract: every piece of state (what's picked, which help is open,
   tokens left, the payout to show) is owned by the caller and arrives as props.
   The component reports intent through callbacks and onEvent. No localStorage. */
import { color, type, radius, font, numeral } from './tokens.js';
import { Kicker, Button } from './primitives.jsx';
import { useWidth, speak } from './util.jsx';
import { useSpokenLine, rateFor, whenVoiceQuiet, VoiceBar, SLOWER_RATE } from './say-it-show-it.jsx';
import { TeachStage } from './teach-layouts.jsx';
// (no illustration here any more: the reader's disc lives in the voice bar)

const qBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** Help offered per context. Quiz and test allow read-aloud only (§0 / README). */
/* READ IT LEFT THE HELP GRID (§0c). It was a help pill only because the reader
   was optional; the voice bar is now the first row of every sheet that reads, so
   asking for the line back is not a form of help and does not belong in a list
   with Hint and Teach me. A quiz and a test are left with no help at all, which
   is what they always meant: on the paper, the only thing she was ever offered
   was the read. */
export const HELP_BY_CONTEXT = {
  lesson: ['hint', 'show', 'teach'],
  mission: ['hint', 'show', 'teach'],
  quiz: [],
  test: [],
};
const HELP_LABEL = { hint: 'Hint', show: 'Show me', teach: 'Teach me' };

/** Cost caption for a help pill. Teach is free during a lesson's new skill (§0). */
function helpCost(id, { tokensLeft, teachFree }) {
  if (id !== 'teach') return 'Free';
  if (teachFree) return 'Free today';
  return tokensLeft > 0 ? `${tokensLeft} token${tokensLeft === 1 ? '' : 's'}` : 'Half pay';
}

function GivenRow({ k, v, dim }) {
  return <div style={{ ...qBase, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: `1px solid ${color.rule}` }}>
    <span style={{ fontSize: 15, fontWeight: 700, color: color.ink }}>{k}</span>
    <span style={{ ...numeral(40), color: dim ? color.disabledText : color.ink, whiteSpace: 'nowrap' }}>{v}</span>
  </div>;
}

/** The help pills. Desktop sits on ground; phone sits inside the sheet. */
function HelpGrid({ ids, open, onPick, tokensLeft, teachFree, phone }) {
  /* §0c: three full-width pills in ONE column on desktop, three in a row on
     phone. Two columns of four only made sense while Read it was one of them. */
  return <div style={{ display: 'grid',
    gridTemplateColumns: phone ? `repeat(${Math.max(1, ids.length)}, 1fr)` : '1fr',
    gap: phone ? 8 : 10 }}>
    {ids.map(id => {
      const picked = open === id, teach = id === 'teach';
      return <button key={id} onClick={() => onPick(id)} style={{ ...qBase, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 10, cursor: 'pointer', border: 'none', textAlign: 'left',
        minHeight: phone ? 44 : 48, padding: phone ? '0 10px' : '0 18px', borderRadius: radius.full,
        background: picked ? color.ink : teach ? color.gold : phone ? color.track : color.surface,
        color: picked ? '#fff' : color.ink, fontSize: phone ? 13.5 : 15, fontWeight: 700 }}>
        <span style={{ whiteSpace: 'nowrap' }}>{HELP_LABEL[id]}</span>
        {/* Three pills share one phone row (§0c), and "Free" is the least
            informative thing on any of them — so on a phone only the pill that
            actually costs something says what it costs. */}
        {(!phone || teach) && <span style={{ fontSize: 12, fontWeight: 700,
          color: picked ? 'rgba(255,255,255,.7)' : color.mutedDeep, whiteSpace: 'nowrap' }}>
          {helpCost(id, { tokensLeft, teachFree })}</span>}
      </button>;
    })}
  </div>;
}

/* THE V1 MARKUP VOCABULARY, IN ONE PLACE.

   The engine still emits the display strings the v1 app set with innerHTML.
   React shows markup as text, so every one of these has to be understood here
   or it leaks — and the way it leaks is the dangerous part: stripping a tag
   does not leave a gap, it JOINS what was either side of it. 2<sup>6</sup>
   became 26 (owner catch, Nov 5), and a stacked fraction became worse:

       <span class="fr"><span class="fn">1</span><span class="fd">3</span></span>

   rendered as "13". A kid at a grade-4 equivalent-fractions lesson was being
   shown "1 3 = ? 15" where the question is "1/3 = ?/15" — in 17 skills,
   including the one the owner's family re-tests on. Nothing errored, nothing
   looked broken to a test, and the number was simply wrong on screen.

   So the rule is: a tag is either understood here or it is a bug. The sweep that
   found this (owner's order, Nov 5) is pinned by tests in the layout gallery
   against the shapes packages/engine really emits. */

/** One token of v1 markup: bold, superscript, stacked fraction, or a line break. */
const MARKUP = /(<b>[\s\S]*?<\/b>|<sup>[\s\S]*?<\/sup>|<span class="fr"><span class="fn">[\s\S]*?<\/span><span class="fd">[\s\S]*?<\/span><\/span>|<br\s*\/?>)/g;
const FRACTION_BODY = '<span class="fr"><span class="fn">([\\s\\S]*?)<\\/span><span class="fd">([\\s\\S]*?)<\\/span><\\/span>';
const FRACTION = new RegExp(`^${FRACTION_BODY}$`);          // one token, exactly
const FRACTION_ALL = new RegExp(FRACTION_BODY, 'g');        // every one in a string

/* The entities v1 wrote by hand. `&nbsp;` is the one that matters — the engine
   uses it to keep "2/4 = ?/8" from breaking across lines — and React renders it
   as the five literal characters unless it is decoded. It decodes to a real
   non-breaking space, which is what it was asking for. */
/* An inline SVG is a PICTURE, and its text nodes are axis labels. Stripping it
   tag by tag leaves them behind as prose: the number-line step rendered as
   "You land on -2. 0-9-2". Whole elements go, contents and all — the engine's
   own adapter (quiz-adapter.plainText) drops them the same way and for the same
   reason. Rendering them properly is a separate job (the adapter calls it a
   Phase 3 tradeoff); printing their labels as sentences is just wrong. */
const SVG = /<svg[\s\S]*?<\/svg>/gi;

const ENTITIES = [[/&nbsp;/g, '\u00A0'], [/&amp;/g, '&'], [/&lt;/g, '<'], [/&gt;/g, '>'],
  [/&quot;/g, '"'], [/&#0*39;|&apos;/g, "'"]];
const decode = (s) => ENTITIES.reduce((acc, [re, to]) => acc.replace(re, to), s);

/** Strip any tag we do not understand, then decode entities. */
const plainPart = (s) => decode(String(s).replace(/<[^>]+>/g, ''));

/**
 * Legacy display strings, as React elements: bold spans bolded, superscripts
 * RAISED, stacked fractions written as n/d, <br> as a real break, entities
 * decoded, and anything else dropped.
 */
/**
 * The words rich() will render, in the order it renders them.
 *
 * A markup token counts as ONE word: "<b>2</b>" is a word, and so is a stacked
 * fraction, however many characters it takes to write. The sweep is built from
 * this list so the highlight lands on what a reader sees as a word.
 */
export function richWords(s) {
  const out = [];
  String(s ?? '').replace(SVG, '').split(MARKUP).forEach((part) => {
    if (!part) return;
    // A split token is the whole tag, so "starts with < and ends with >" is
    // enough — and it avoids calling .test() on MARKUP, which carries /g and
    // would advance its own lastIndex between calls.
    if (/^<[\s\S]*>$/.test(part)) { out.push(bare(part) || part); return; }
    plainPart(part).split(/\s+/).filter(Boolean).forEach(w => out.push(w));
  });
  return out;
}

/* The three sweep states, in the demo's palette. Shared with say-it-show-it so
   a word held in the question looks like a word held in the script. */
const swept = (state) => ({
  background: state === 'now' ? color.goldHold : 'transparent',
  color: state === 'ahead' ? color.inkAhead : color.ink,
  borderRadius: radius.sm, padding: '1px 4px', margin: '0 -1px',
  transition: 'background .1s linear, color .25s ease',
});

/**
 * @param {string} s
 * @param {{word:number, reduced?:boolean}} [sweep] when present, every word is
 *   wrapped and the one being spoken is held. Absent (the default), the output
 *   is exactly what it has always been.
 */
export function rich(s, sweep) {
  // `offset` lets one sweep span two elements — the Snag reads its scene and
  // then its question, and the held word has to cross from one to the other.
  let n = (sweep?.offset ?? 0) - 1;        // word counter across all the parts
  const mark = (node, key) => {
    // The key belongs on the element either way. Returning the node bare when
    // there is no sweep dropped the key that used to be written inline, and
    // React warned about it from the first render in the gallery.
    if (!sweep) return React.cloneElement(node, { key });
    n += 1;
    const state = sweep.reduced ? 'now' : n === sweep.word ? 'now' : n < sweep.word ? 'said' : 'ahead';
    return <span key={key} data-say-word={n} data-word-state={state} style={swept(state)}>{node}</span>;
  };
  return String(s ?? '').replace(SVG, '').split(MARKUP).map((part, i) => {
    const b = part.match(/^<b>([\s\S]*)<\/b>$/);
    // Recurse into the bold span rather than printing its contents: <b> wraps the
    // outer match, so a bolded exponent — <b>2<sup>6</sup></b> — would otherwise
    // render its own tags as visible text.
    if (b) return mark(<strong style={{ fontWeight: 800 }}>{rich(b[1])}</strong>, i);
    const sup = part.match(/^<sup>([\s\S]*)<\/sup>$/);
    if (sup) return mark(<sup style={{ fontSize: '.62em', lineHeight: 0 }}>{plainPart(sup[1])}</sup>, i);
    const fr = part.match(FRACTION);
    // Written with a slash rather than stacked: it is unambiguous at every size
    // this appears in — a 40px heading, a 26px answer button, a 15px teach line —
    // and the engine's own adapter (quiz-adapter.plainText) already made the same
    // choice. A stacked treatment is a design decision, not a bug fix.
    if (fr) return mark(<span style={{ whiteSpace: 'nowrap' }}>{plainPart(fr[1])}/{plainPart(fr[2])}</span>, i);
    if (/^<br\s*\/?>$/.test(part)) return <br key={i} />;
    const plain = plainPart(part);
    if (!sweep) return plain;
    // Each word its own span, so the sweep can hold one at a time.
    return plain.split(/(\s+)/).map((w, k) => (w.trim()
      ? mark(w, `${i}-${k}`)
      : <span key={`${i}-${k}`}>{w}</span>));
  });
}

/** The same string for a VOICE: markup spoken, never read out or run together.
    "2<sup>6</sup>" must be "2 to the 6", never "twenty-six"; a fraction must be
    "1 over 3", never "13". */
export function plainSpeech(s) {
  return String(s ?? '')
    .replace(SVG, ' ')
    .replace(FRACTION_ALL, ' $1 over $2 ')
    .replace(/<sup>([\s\S]*?)<\/sup>/g, ' to the $1 ')
    // A <br> ends a sentence for the voice — unless the sentence already ended,
    // which is the common case ("…for $12.<br>What's one cup?") and produced a
    // doubled stop the first time this was written.
    .replace(/\s*<br\s*\/?>\s*/gi, (m, off, str) => (/[.!?\u2026]$/.test(str.slice(0, off).trimEnd()) ? ' ' : '. '))
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, 'and')
    .replace(/&lt;/g, 'less than').replace(/&gt;/g, 'greater than')
    .replace(/&quot;/g, '').replace(/&#0*39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    // Tidy a space before real punctuation, but NOT before "?" — in these strings
    // a lone ? is the blank to fill ("? over 15"), not the end of a sentence.
    .replace(/\s+([.,!])/g, '$1')
    .trim();
}

/* Teach me, as a MINI-WALK (owner, Nov 2026).

   It used to be prose lines on a rule. The teach layouts already proved the
   shape that works for an overloaded kid — a value in numeral type, the move
   beside it, one row per tap — so the help box now uses the same one instead of
   a second, weaker presentation of the same idea.

   The engine writes these as sentences, not as rows, so the row is derived: the
   RESULT of the step goes in the numeral column and the move stays in the text.
   Two shapes carry a result, and both come from the engine's own emphasis:

     "One costs <b>$7</b>."              -> $7   | One costs
     "$21 ÷ 3 = 7."                      -> 7    | $21 ÷ 3

   A line with neither — "Peel it like an onion — undo the + first" — is a step
   with nothing to show, and stays full-width prose. Lifting something that is
   not a result would be worse than lifting nothing: "75% is three quarters"
   must not put "three quarters" in the numeral column as if it were a figure. */

/** The plain text of a string, markup and pictures gone. */
const bare = (s) => String(s ?? '').replace(SVG, '').replace(/<[^>]+>/g, '').trim();

/** A number-ish result: 7, $7, -2, 3.5, 60%, 2/5. Not a phrase. A dot counts
    only between digits, so a sentence's full stop never lands in the column. */
const NUM = '[-\u2212+]?[$\u00a3\u20ac]?\\d(?:[\\d,/]|\\.(?=\\d))*\\s*%?';
const RESULTISH = new RegExp(`^${NUM}$`);
const TRAILING_RESULT = new RegExp(`^(.*?)=\\s*(${NUM})\\s*\\.?$`);

/** What is left of a sentence once its result has been lifted out of it. */
const tidy = (s) => {
  let t = String(s).replace(/\s{2,}/g, ' ').trim();
  // Repeatedly, because lifting "<b>3</b>." leaves "… 5 = ." — one pass removes
  // the stop and stops, leaving a dangling "=" at the end of the row.
  for (let i = 0; i < 4; i += 1) {
    const next = t.replace(/[\s.,:;=\u2192\u2014-]+$/, '').trim();
    if (next === t) break;
    t = next;
  }
  return t;
};

/** Split one teach sentence into { value, how }, or { how } when it has no result. */
export function teachRow(line) {
  const text = String(line ?? '');
  const bolds = [...text.matchAll(/<b>([\s\S]*?)<\/b>/g)];
  const last = bolds[bolds.length - 1];
  if (last && RESULTISH.test(bare(last[1]))) {
    // Only when the result ENDS the sentence. "Top: 1 \u00d7 2 = <b>2</b>. Same amount,
    // just cut into smaller pieces:" carries on afterwards, and lifting the 2 out
    // of the middle leaves "1 \u00d7 2 =. Same amount\u2026" \u2014 a hole where the answer was.
    const after = bare(text.slice(last.index + last[0].length));
    if (/^[\s.]*$/.test(after)) {
      const how = text.slice(0, last.index) + text.slice(last.index + last[0].length);
      return { value: bare(last[1]), how: tidy(how) };
    }
  }
  const trailing = bare(text).match(TRAILING_RESULT);
  if (trailing && trailing[1].trim()) return { value: trailing[2].trim(), how: tidy(trailing[1]) };
  return { how: text };
}


/* TEACH ME TAKES THE SHEET (§0c 25a).

   It used to open as a box under the help grid, in the 340px left column — the
   working for a question set in a third of the width of the question, while the
   question itself stayed the biggest thing on screen. If she has asked to be
   taught, the teaching is the screen.

   So the sheet's body is replaced: the kicker says what it cost, the question
   is restated small because she still needs it, the stage shows the move, and
   the walk builds a line at a time. The unrevealed lines are SLOTS rather than
   nothing, so she can see how many there are — "three more" is a different
   feeling from an unknown number of taps.

   No voice bar here: the Teach me screen does not read (25a draws none), and a
   reader with nothing to read is a control that lies. The voice comes back with
   the question.

   Nothing in here gates. "Back to the question" is live from the first paint. */
function TeachSheet({ question, tokensLeft, teachFree, onBack, phone, compact = false }) {
  const steps = question.teachSteps || [];
  const rows = steps.map(teachRow);
  const [shown, setShown] = React.useState(1);
  React.useEffect(() => { setShown(1); }, [question.text]);
  const cost = teachFree ? 'free on a new idea' : tokensLeft > 0 ? 'token used, full pay' : 'no token, half pay';

  return <>
    <div style={{ padding: compact ? 0 : (phone ? '20px 16px' : '32px 40px') }}>
      {!compact && <>
        <Kicker style={{ marginBottom: 10 }}>Teach me · {cost}</Kicker>
        {/* The question, restated small: she is still answering it. */}
        <div style={{ fontSize: phone ? 19 : 24, fontWeight: 600, lineHeight: 1.3, textWrap: 'pretty' }}>
          {!!question.ask && <>{rich(question.ask)} </>}{rich(question.text)}</div>
      </>}

      {/* The move, where the bank authored one. */}
      {question.stage && <TeachStage stage={question.stage} index={shown - 1} of={rows.length} phone={phone} />}

      <div style={{ marginTop: 18 }}>
        {rows.map((r, i) => {
          if (i >= shown) {
            // A slot, not a gap: she can see how much is still coming.
            const next = i === shown;
            return <button key={i} data-teach-slot onClick={next ? () => setShown(n => n + 1) : undefined}
              style={{ ...qBase, display: 'block', width: '100%', textAlign: 'left', border: 'none',
                cursor: next ? 'pointer' : 'default', height: 56, borderRadius: 16,
                background: color.fill, color: color.muted, fontSize: 14, fontWeight: 600,
                padding: '0 16px', marginTop: 10 }}>
              {next ? 'Tap for the next line' : ''}</button>;
          }
          const isResult = i === rows.length - 1;
          const tone = isResult ? color.greenDeep : color.ink;
          return <div key={i} data-teach-row={i} style={{ display: 'grid',
            gridTemplateColumns: phone ? '92px 1fr' : '150px 1fr', alignItems: 'baseline',
            gap: phone ? 12 : 18, padding: '12px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${color.rule}` : 'none' }}>
            <span data-teach-value style={{ ...numeral(phone ? 28 : 40), color: tone }}>
              {r.value !== undefined ? rich(r.value) : ''}</span>
            <span style={{ fontSize: phone ? 15.5 : 17, lineHeight: 1.45, fontWeight: 600,
              color: isResult ? tone : color.muted }}>{rich(r.how)}</span>
          </div>;
        })}
      </div>
    </div>

    {!compact && <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: phone ? '16px' : '20px 40px', borderTop: `1px solid ${color.rule}` }}>
      <span style={{ flex: 1, minWidth: 120, fontSize: 16, fontWeight: 600, color: color.muted }}>
        {Math.min(shown, rows.length)} of {rows.length}</span>
      <Button variant="ink" onClick={onBack}>Back to the question →</Button>
    </div>}
  </>;
}

/** Whatever help the kid opened, in a box under the grid. Teach shows the token gate first. */
function HelpBox({ open, question, teachConfirm, tokensLeft, teachFree, onTeachConfirm, phone, missed = false }) {
  if (!open) return null;
  const box = { ...qBase, background: phone ? '#F2F4F6' : color.surface, borderRadius: radius.lg, padding: phone ? 16 : 20, marginTop: 12 };
  if (open === 'teach' && teachConfirm) return <div style={{ ...box, background: color.held }}>
    <Kicker style={{ color: color.goldDeep, marginBottom: 8 }}>Teach me</Kicker>
    <div style={{ fontSize: 16, lineHeight: 1.45, marginBottom: 14 }}>
      {tokensLeft > 0
        ? <>Spend a Teach Token? <strong>{tokensLeft} left</strong> this run. A token keeps full pay. Save them for the hard ones.</>
        : <>No tokens left. Teach still works — this one pays <strong>half</strong>.</>}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button variant="ink" size="sm" onClick={() => onTeachConfirm(false)}>I'll try first</Button>
      <Button variant="outline" size="sm" onClick={() => onTeachConfirm(true)}>
        {tokensLeft > 0 ? 'Use a token' : 'Teach me anyway'}</Button>
    </div>
  </div>;
  const body = open === 'hint' ? question.hint
    : open === 'show' ? question.show
      : open === 'teach' ? null
        : question.text;
  /* Teach me takes the SHEET when she asked for it (§0c 25a). The one case
     that still belongs beside the question is the walk a MISS opened, because
     there the question and its correction are what she is looking at. */
  if (open === 'teach') {
    if (!missed || !(question.teachSteps || []).length) return null;
    return <div style={box}>
      <Kicker style={{ marginBottom: 8 }}>{HELP_LABEL[open]}</Kicker>
      <TeachSheet compact question={question} phone={phone} />
    </div>;
  }
  return <div style={box}>
    <Kicker style={{ marginBottom: 8 }}>{HELP_LABEL[open]}</Kicker>
    <div style={{ fontSize: 16, lineHeight: 1.5 }}>{rich(body)}</div>
  </div>;
}

/** The payout line after a correct answer (§0: 44px/300 green, then the breakdown pills). */
export function PayoutLine({ payout, align = 'left' }) {
  if (!payout) return null;
  const kind = {
    streak: { background: color.ink, color: '#fff' },
    blitz: { background: color.ink, color: '#fff' },
    first: { background: color.greenTint, color: color.greenDeep },
    token: { background: color.held, color: color.goldDeep },
    help: { background: color.held, color: color.goldDeep },
    gear: { background: color.greenTint, color: color.greenDeep },
  };
  return <div style={{ ...qBase, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 8 }}>
    <div style={{ ...numeral(44), color: color.greenDeep }}>+${payout.amount}</div>
    {payout.line && <div style={{ fontSize: 16, fontWeight: 600 }}>{payout.line}</div>}
    {payout.pills?.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
      {payout.pills.map((p, i) => <span key={i} style={{ ...(kind[p.kind] || kind.first), borderRadius: radius.full,
        padding: '4px 11px', fontSize: 12, fontWeight: 700 }}>{p.label}</span>)}</div>}
  </div>;
}

/**
 * question: {text, givens[{k,v}], find, family, answers[4], correct, hint, show, teachSteps[], scaffold?, scaffoldLevel?}
 * context: 'lesson' | 'mission' | 'quiz' | 'test'  — decides which help is offered
 * Controlled: feedback/picked/help/teachConfirm/tokensLeft/payout/selected come from the caller.
 * In quiz and test contexts the caller holds `feedback` at null so nothing is marked
 * right or wrong until the paper is handed in.
 * onAnswer(index) commits an answer; on phone the kid picks first and commits with Check (§0 4f).
 */
export function Question({
  question, context = 'mission', teachFree = false, tokensLeft = 3,
  feedback = null, picked = null, payout = null, help = null, teachConfirm = false, selected = null, snag = false,
  onAnswer = () => {}, onHelp = () => {}, onTeachConfirm = () => {}, onNext,
  onEvent = () => {}, style, worldColor, mode = 'c', voice, blobDir = '/blobs/', muted = false,
  sweep = null, onRate, onMuted, footer = null, checkLabel = 'Check',
}) {
  const ref = React.useRef(null);
  const w = useWidth(ref);
  const phone = w < 760;
  const [sel, setSel] = React.useState(null);
  const [pressed, setPressed] = React.useState(null);
  React.useEffect(() => { setSel(null); }, [question]);
  // The world's colour carries through from the lesson; anywhere without one
  // (a quiz, a stray render) falls back to ink and looks exactly as before.
  const accent = worldColor || color.ink;

  /* THE QUESTION SPEAKS, in the same voice and with the same sweep as the
     teaching (owner, Nov 2026). Band policy is unchanged: a is read to without
     asking; b and c tap the bar's disc (§0c).

     Fallback chain: the voice cache's clip, then the browser voice through
     plainSpeech(), then silence. The cache Worker is not deployed yet, so today
     every one of these is the browser voice — which still sweeps, because the
     utterance reports the character it has reached.

     NOTHING HERE GATES. No part of this reaches onAnswer, feedback, sel or the
     Check button, in either direction: audio cannot block her and cannot answer
     for her. */
  /* THE ASK, WITH THE MATHS, AS ONE HEADING AND ONE READ.

     The generators author it — Q('Which is bigger?', '1/6 or 1/2') — and it was
     being dropped on the way to the screen, so a kid in practice was shown
     "1/6 or 1/2" and left to guess what was being asked of her. It is one
     heading because it is one question, and one read with one sweep across
     both, because that is how she hears it. */
  const ask = question.ask ? String(question.ask).trim() : '';
  const words = React.useMemo(
    () => [...(ask ? richWords(ask) : []), ...richWords(question.text)], [ask, question.text]);
  const askWords = React.useMemo(() => (ask ? richWords(ask).length : 0), [ask]);
  const saying = React.useMemo(
    () => plainSpeech(ask ? `${ask} ${question.text}` : question.text), [ask, question.text]);
  const clipSrc = voice?.cacheUrl && saying.length <= 200
    ? `${voice.cacheUrl}?text=${encodeURIComponent(saying)}`
    : null;
  /* Quiet is the app's sound setting wherever the app gives us one to write
     (`onMuted`), so one tap means it on every surface and after a reload. The
     local flag is the fallback for a surface rendered without one. */
  const [localQuiet, setLocalQuiet] = React.useState(false);
  const quiet = muted || localQuiet;
  const line = useSpokenLine({ src: clipSrc, text: words, speech: saying, muted: quiet,
    rate: rateFor(mode, voice?.rate) });
  /* A caller may own the read instead — the Snag does, because it reads its
     scene and then its question as one sentence and the held word crosses from
     one element into the other. When it does, this component neither speaks nor
     shows a face: one reader, one companion, per surface. */
  const ownsRead = !sweep;
  React.useEffect(() => {
    // Waits for whoever is already reading (the move host, usually) to finish.
    const cancel = (ownsRead && mode === 'a' && !quiet) ? whenVoiceQuiet(() => line.play(undefined, { auto: true })) : null;
    return () => { cancel?.(); line.stop(); };
  }, [question.text, mode, quiet, ownsRead]);  // eslint-disable-line react-hooks/exhaustive-deps

  // A Snag is "no pay, just a look": no help stack, because having the move is the point.
  const helpIds = snag ? [] : (HELP_BY_CONTEXT[context] || HELP_BY_CONTEXT.mission);
  const locked = feedback === 'correct';
  const chooseHelp = (id) => {
    if (locked) return;
    const next = help === id ? null : id;
    onHelp(next, { needsConfirm: id === 'teach' && !teachFree });
    if (next) onEvent('help_open', { id: next });
  };
  const commit = (i) => { if (feedback) return; onAnswer(i); };
  const pick = (i) => { if (feedback) return; phone ? setSel(i) : commit(i); };

  const answerStyle = (i) => {
    const right = feedback && i === question.correct;
    const wrong = feedback === 'wrong' && i === picked;
    // `selected` lets a quiz show the kid's pick without revealing right or wrong (§0).
    const chosen = !feedback && (sel === i || selected === i);
    const down = pressed === i && !feedback;
    return {
      ...qBase, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: feedback ? 'default' : 'pointer',
      /* §0c: a plain answer is a #F5F7F9 tile with NO border. The 1.5px rule was
         there to hold a white tile off a white sheet, and it competed with the
         three borders that mean something — right, wrong, chosen. */
      background: right ? color.greenTint : wrong ? color.redTint : chosen ? color.surface : color.fill,
      border: `1.5px solid ${right ? color.green : wrong ? color.red : chosen ? accent : 'transparent'}`,
      borderRadius: radius.lg, padding: phone ? '16px 16px' : '20px 22px', width: '100%',
      /* A tap should feel like it landed. The press is a scale, not a colour
         flash: colour on this card already means right, wrong or chosen, and a
         fourth meaning would make the three that matter harder to read. */
      transform: down ? 'scale(.985)' : 'scale(1)',
      boxShadow: chosen && !feedback ? `0 0 0 3px ${color.fill}` : 'none',
      transition: 'transform .09s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease',
    };
  };
  const press = (i) => ({
    onPointerDown: () => !feedback && setPressed(i),
    onPointerUp: () => setPressed(null),
    onPointerLeave: () => setPressed(null),
    onPointerCancel: () => setPressed(null),
  });

  /* TEACHING TAKES THE SHEET (§0c 25a). Not the prompt and the answers with a
     box of working beside them: if she asked to be taught, the teaching is the
     screen, and the voice bar goes with the question it belonged to. */
  /* Only when she ASKED. A miss opens the walk too (no punitive mechanics —
     the miss already cost her the streak), but then the correction and the
     answers are the thing she needs to see: taking the sheet would hide "Not
     yet. Here's the step" behind the working she did not request. */
  const teaching = help === 'teach' && !teachConfirm && !feedback
    && (question.teachSteps || []).length > 0;

  const givens = question.givens || [];
  const hasLeftColumn = givens.length > 0 || !!question.family || helpIds.length > 0;
  const knowCol = <>
    {givens.length > 0 && <>
      <Kicker style={{ marginBottom: 6 }}>What you know</Kicker>
      <div style={{ borderTop: `1px solid ${color.rule}` }}>
        {givens.map((g, i) => <GivenRow key={i} k={g.k} v={g.v} />)}
        {question.find && <GivenRow k="Find" v={question.find} dim />}
      </div>
    </>}
    {question.family && <div style={{ marginTop: 14 }}>
      <span style={{ ...qBase, display: 'inline-block', background: color.ink, color: '#fff', borderRadius: radius.full,
        padding: '7px 14px', fontSize: 13, fontWeight: 700 }}>{question.family}</span></div>}
  </>;

  const helpCol = helpIds.length > 0 && <>
    <Kicker style={{ margin: phone ? '18px 0 8px' : '26px 0 10px' }}>Need help</Kicker>
    <HelpGrid ids={helpIds} open={help} onPick={chooseHelp} tokensLeft={tokensLeft} teachFree={teachFree} phone={phone} />
    <HelpBox open={help} question={question} teachConfirm={teachConfirm} tokensLeft={tokensLeft}
      teachFree={teachFree} onTeachConfirm={onTeachConfirm} phone={phone} missed={!!feedback} />
  </>;

  /* THE VOICE BAR IS THE SHEET'S FIRST ROW (§0c).

     It replaces band a and b's companion row above the h2 and band c's "Read
     it" help pill — one chrome, one place, on every surface that reads. The
     band changes the disc, the idle line and the prompt size; nothing about the
     layout moves between grades 3 and 8, which is the defect this came from
     (the quiz surface reflowing while she was reading it).

     A caller may own the read instead — the Snag folds Karla's intro, the scene
     and the question into one sentence — and then the bar plays THAT, through
     `sweep.onRead`, so there is still exactly one reader and one bar.

     NOTHING HERE GATES. Check, Next and Continue are live throughout. */
  const reader = sweep
    ? { speaking: !!sweep.speaking, play: (r, o) => sweep.onRead?.(r, o) }
    : line;
  const voiceBar = <VoiceBar mode={mode} phone={phone} worldColor={accent} blobDir={blobDir}
    speaking={reader.speaking} muted={quiet} slower={(voice?.rate ?? 0) > 0 && voice.rate <= SLOWER_RATE}
    onPlay={() => {
      // The tap that turns Quiet off is also the tap that asks for the line, and
      // `quiet` will not have changed yet when play() checks it — so say so.
      if (quiet) { setLocalQuiet(false); onMuted?.(false); }
      reader.play(undefined, { force: quiet });
    }}
    onSlower={() => { onRate?.(SLOWER_RATE); reader.play(SLOWER_RATE); }}
    onQuiet={(next) => { setLocalQuiet(next); onMuted?.(next); if (next) line.stop(); }} />;

  const promptSize = phone
    ? (mode === 'a' ? 28 : mode === 'b' ? 26 : 24)
    : (mode === 'a' ? 48 : mode === 'b' ? 44 : 40);

  const prompt = <>
    {snag && <Kicker style={{ marginBottom: 10 }}>No pay, just a look</Kicker>}
    <h2 style={{ fontSize: promptSize, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.18,
      margin: 0, textWrap: 'pretty' }}>
      {/* Only once the sweep has actually started. A voice that reports no
          boundaries at all (Safari does this) would otherwise leave every word
          in the "not reached yet" grey for the whole sentence — the question
          would go pale and stay there. No sweep is the normal rendering. */}
      {/* An external sweep is applied only once it has actually reached a word:
          at -1 every word would render in the not-yet-reached grey. */}
      {(() => {
        const live = (sweep && sweep.word >= 0)
          ? sweep
          : (line.speaking && line.word >= 0 ? { word: line.word } : undefined);
        // The ask and the maths are ONE heading and one sweep; the offset
        // carries the held word across from the instruction into the sum.
        return <>
          {!!ask && <>{rich(ask, live)} </>}
          {rich(question.text, live ? { ...live, offset: (live.offset || 0) + askWords } : undefined)}
        </>;
      })()}</h2>
  </>;

  const answers = <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: 12, marginTop: phone ? 18 : 26 }}>
    {(question.answers || []).map((a, i) => <button key={i} onClick={() => pick(i)} {...press(i)} style={answerStyle(i)}>
      <span style={{ ...qBase, flex: 'none', width: 30, height: 30, borderRadius: radius.full,
        background: (!feedback && (sel === i || selected === i)) ? accent : color.surface,
        color: (!feedback && (sel === i || selected === i)) ? '#fff' : color.mutedDeep,
        display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
        transition: 'background .18s ease, color .18s ease' }}>{i + 1}</span>
      {/* Through rich() like the question: a fraction answer is the same v1
          markup, and raw it either prints its tags or runs its digits together. */}
      <span style={{ ...numeral(phone ? 26 : 34), color: color.ink }}>{rich(a)}</span>
    </button>)}
  </div>;

  // §0: scaffolds live inside the sheet and fade over a guided move.
  const scaffold = question.scaffold && !feedback && <div style={{ background: color.fill, borderRadius: 18, padding: '14px 18px',
    marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
    <span style={{ ...qBase, background: color.surface, borderRadius: radius.full, padding: '6px 12px', fontSize: 12.5, fontWeight: 700 }}>
      {question.scaffoldLevel === 'some' ? 'Some help' : 'Lots of help'}</span>
    <span style={{ fontSize: 17, fontWeight: 500 }}>{question.scaffold}</span></div>;

  const wrongBar = feedback === 'wrong' && <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    background: color.redTint, borderRadius: radius.lg, padding: '14px 18px', marginTop: 18 }}>
    <span style={{ fontSize: 16, lineHeight: 1.45, flex: 1, minWidth: 200 }}>
      <strong>Not yet.</strong>{question.hint ? <> Here's the step: {question.hint}</> : null}</span>
    {onNext && <Button variant="ink" size="sm" onClick={onNext}>Try again</Button>}</div>;

  const checkBar = phone && !feedback && <Button variant="ink" size="lg" disabled={sel === null}
    style={{ width: '100%', marginTop: 16 }} onClick={() => commit(sel)}>{checkLabel}</Button>;

  /* A footer row at the sheet's bottom edge, on the bar's own left edge (§0c/§0e).
     The line that belongs to the whole sheet — "Not sure? Pick the one you think
     is closest." — is not a caption under the answers; it is the last thing the
     sheet says, and it was sitting out on the ground below it. */
  const footerRow = footer && <div style={{ ...qBase, display: 'flex', alignItems: 'center', gap: 16,
    padding: phone ? '16px' : '20px 40px', borderTop: `1px solid ${color.rule}`,
    fontSize: 16, fontWeight: 600, color: color.muted }}>{footer}</div>;

  return <div ref={ref} style={{ ...qBase, ...style }}>
    {phone
      ? <>
        {givens.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, givens.length)}, 1fr)`, gap: 10, marginBottom: 16 }}>
          {givens.slice(0, 3).map((g, i) => <div key={i}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: color.muted }}>{g.k}</div>
            <div style={{ ...numeral(26), marginTop: 2 }}>{g.v}</div></div>)}</div>}
        <div style={{ background: color.surface, borderRadius: radius.sheet, padding: 0, overflow: 'hidden' }}>
          {teaching
            ? <TeachSheet question={question} tokensLeft={tokensLeft} teachFree={teachFree}
              phone onBack={() => chooseHelp('teach')} />
            : <>
              {voiceBar}
              <div style={{ padding: '20px 16px' }}>
                {prompt}{scaffold}{answers}{helpCol}{!snag && wrongBar}
                {!snag && feedback === 'correct' && <div style={{ marginTop: 18 }}><PayoutLine payout={payout} /></div>}
                {checkBar}
              </div>
              {footerRow}
            </>}
        </div>
      </>
      /* The left column only exists when it holds something. A Snag has no
         givens and no help stack — "no pay, just a look" — so the grid was
         reserving 340px for nothing and the question sheet floated off to the
         right of a hole. */
      : <div style={{ display: 'grid', gridTemplateColumns: hasLeftColumn ? '340px 1fr' : '1fr',
        gap: 48, alignItems: 'start' }}>
        {hasLeftColumn && <div>{knowCol}{helpCol}</div>}
        {/* §0c: the sheet carries no 3px world border. The world is already in
            the spine, the disc and the chosen-answer ring; a coloured lid on the
            sheet made the voice bar look like a second header. */}
        <div style={{ background: color.surface, borderRadius: radius.sheet, padding: 0, overflow: 'hidden' }}>
          {teaching
            ? <TeachSheet question={question} tokensLeft={tokensLeft} teachFree={teachFree}
              onBack={() => chooseHelp('teach')} />
            : <>
              {voiceBar}
              <div style={{ padding: '32px 40px' }}>
                {prompt}{scaffold}{answers}{!snag && wrongBar}
                {!snag && feedback === 'correct' && <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1px solid ${color.rule}` }}>
                  <PayoutLine payout={payout} /></div>}
              </div>
              {footerRow}
            </>}
        </div>
      </div>}
  </div>;
}
