/* The shared Question screen — STYLE_GUIDE §0 "Question screen" (4d desktop, 4f phone).
   One component serves the daily lesson, free-practice missions, unit quizzes and the
   grade test; the context prop decides which help is offered, nothing else changes.

   Stateless by contract: every piece of state (what's picked, which help is open,
   tokens left, the payout to show) is owned by the caller and arrives as props.
   The component reports intent through callbacks and onEvent. No localStorage. */
import { color, type, radius, font, numeral } from './tokens.js';
import { Kicker, Button } from './primitives.jsx';
import { useWidth, speak } from './util.jsx';

const qBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** Help offered per context. Quiz and test allow read-aloud only (§0 / README). */
export const HELP_BY_CONTEXT = {
  lesson: ['read', 'hint', 'show', 'teach'],
  mission: ['read', 'hint', 'show', 'teach'],
  quiz: ['read'],
  test: ['read'],
};
const HELP_LABEL = { read: 'Read it', hint: 'Hint', show: 'Show me', teach: 'Teach me' };

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

/** The 2x2 help grid. Desktop sits on ground; phone sits inside the sheet. */
function HelpGrid({ ids, open, onPick, tokensLeft, teachFree, phone }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: phone ? 8 : 10 }}>
    {ids.map(id => {
      const picked = open === id, teach = id === 'teach';
      return <button key={id} onClick={() => onPick(id)} style={{ ...qBase, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 10, cursor: 'pointer', border: 'none', textAlign: 'left',
        minHeight: phone ? 44 : 52, padding: phone ? '0 14px' : '0 16px', borderRadius: radius.full,
        background: picked ? color.ink : teach ? color.gold : phone ? color.track : color.surface,
        color: picked ? '#fff' : color.ink, fontSize: phone ? 14 : 15, fontWeight: 700 }}>
        <span>{HELP_LABEL[id]}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: picked ? 'rgba(255,255,255,.7)' : color.mutedDeep, whiteSpace: 'nowrap' }}>
          {helpCost(id, { tokensLeft, teachFree })}</span>
      </button>;
    })}
  </div>;
}

/** Whatever help the kid opened, in a box under the grid. Teach shows the token gate first. */
function HelpBox({ open, question, teachConfirm, tokensLeft, teachFree, onTeachConfirm, phone }) {
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
  return <div style={box}>
    <Kicker style={{ marginBottom: 8 }}>{HELP_LABEL[open]}</Kicker>
    {open === 'teach'
      ? <ol style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.6 }}>
        {(question.teachSteps || []).map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}</ol>
      : <div style={{ fontSize: 16, lineHeight: 1.5 }}>{body}</div>}
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
  feedback = null, picked = null, payout = null, help = null, teachConfirm = false, selected = null,
  onAnswer = () => {}, onHelp = () => {}, onTeachConfirm = () => {}, onNext,
  onEvent = () => {}, style,
}) {
  const ref = React.useRef(null);
  const w = useWidth(ref);
  const phone = w < 760;
  const [sel, setSel] = React.useState(null);
  React.useEffect(() => { setSel(null); }, [question]);

  const helpIds = HELP_BY_CONTEXT[context] || HELP_BY_CONTEXT.mission;
  const locked = feedback === 'correct';
  const chooseHelp = (id) => {
    if (locked) return;
    const next = help === id ? null : id;
    onHelp(next, { needsConfirm: id === 'teach' && !teachFree });
    if (next === 'read') speak(question.text);
    if (next) onEvent('help_open', { id: next });
  };
  const commit = (i) => { if (feedback) return; onAnswer(i); };
  const pick = (i) => { if (feedback) return; phone ? setSel(i) : commit(i); };

  const answerStyle = (i) => {
    const right = feedback && i === question.correct;
    const wrong = feedback === 'wrong' && i === picked;
    // `selected` lets a quiz show the kid's pick without revealing right or wrong (§0).
    const chosen = !feedback && (sel === i || selected === i);
    return {
      ...qBase, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: feedback ? 'default' : 'pointer',
      background: right ? color.greenTint : wrong ? color.redTint : color.surface,
      border: `1.5px solid ${right ? color.green : wrong ? color.red : chosen ? color.ink : color.rule}`,
      borderRadius: radius.lg, padding: phone ? '16px 16px' : '20px 22px', width: '100%',
    };
  };

  const givens = question.givens || [];
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
      teachFree={teachFree} onTeachConfirm={onTeachConfirm} phone={phone} />
  </>;

  const prompt = <h2 style={{ fontSize: phone ? 26 : 40, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.18,
    margin: 0, textWrap: 'pretty' }}>{question.text}</h2>;

  const answers = <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: 12, marginTop: phone ? 18 : 26 }}>
    {(question.answers || []).map((a, i) => <button key={i} onClick={() => pick(i)} style={answerStyle(i)}>
      <span style={{ ...qBase, flex: 'none', width: 30, height: 30, borderRadius: radius.full, background: color.fill,
        display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: color.mutedDeep }}>{i + 1}</span>
      <span style={{ ...numeral(phone ? 26 : 34), color: color.ink }}>{a}</span>
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
    style={{ width: '100%', marginTop: 16 }} onClick={() => commit(sel)}>Check</Button>;

  return <div ref={ref} style={{ ...qBase, ...style }}>
    {phone
      ? <>
        {givens.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, givens.length)}, 1fr)`, gap: 10, marginBottom: 16 }}>
          {givens.slice(0, 3).map((g, i) => <div key={i}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: color.muted }}>{g.k}</div>
            <div style={{ ...numeral(26), marginTop: 2 }}>{g.v}</div></div>)}</div>}
        <div style={{ background: color.surface, borderRadius: radius.sheet, padding: 20 }}>
          {prompt}{scaffold}{answers}{helpCol}{wrongBar}
          {feedback === 'correct' && <div style={{ marginTop: 18 }}><PayoutLine payout={payout} /></div>}
          {checkBar}
        </div>
      </>
      : <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
        <div>{knowCol}{helpCol}</div>
        <div style={{ background: color.surface, borderRadius: radius.sheet, padding: 32 }}>
          {prompt}{scaffold}{answers}{wrongBar}
          {feedback === 'correct' && <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1px solid ${color.rule}` }}>
            <PayoutLine payout={payout} /></div>}
        </div>
      </div>}
  </div>;
}
