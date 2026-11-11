/* The four teach-step layouts (§0b), plus the takeaway band and the voice row.

   A teach step is data, not markup: {layout, prompt, speak?, hint, takeaway, …}
   with one payload key per layout. The runner picks the component out of
   TEACH_LAYOUTS by `layout` and gets back a solved/unsolved signal — Next stays
   disabled until the step is solved, because reading is not learning.

   Zero-dependency by contract: no @kampus/engine import here. Anything these
   layouts need to know about correctness is in the step's own data.

   Every layout follows the same two ADHD rules as the rest of the product: a wrong
   pick reveals the hint and lets her carry on, and nothing is timed. */
import { color, radius, font, numeral, world, spring } from './tokens.js';
import { Button, Kicker } from './primitives.jsx';
import { useReducedMotion } from './juice.jsx';

const tBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** The voice mode is the grade band, not a setting: a = read to her, c = on request. */
export const voiceMode = (grade) => (grade <= 4 ? 'a' : grade <= 6 ? 'b' : 'c');

/**
 * Run a cue when it arrives.
 *
 * A cue is `{ name, nonce }` — the nonce rises on every spoken line so the same
 * cue twice in a row (Again, or two lines that both pulse the bar) fires twice.
 * Cues are TRIGGERS into the transitions each layout already has; none of them is
 * a new renderer, and none of them calls onSolve.
 *
 * On a `tryIt` step every layout ignores the state-changing cues and keeps only
 * the orienting ones. The bank enforces the same rule from its side
 * (speak.test.js), so the two layers hold the line together rather than relying on
 * either alone.
 */
function useCue(cue, run) {
  const last = React.useRef(0);
  React.useEffect(() => {
    if (!cue?.name || cue.nonce === last.current) return;
    last.current = cue.nonce;
    run(cue.name);
  }, [cue?.nonce, cue?.name]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ---------------------------------------------------------------- walk ----- */
/** Worked walk: ruled rows revealed one tap at a time, result row in green. */
export function WalkLayout({ step, solved, onSolve, cue, phone }) {
  const rows = step.walk?.rows || [];
  const [shown, setShown] = React.useState(1);
  React.useEffect(() => { if (shown >= rows.length && !solved) onSolve(true); }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  // `row.N` reveals that row as Karla reaches it. Never on a Try it: there the
  // check is hers, and a cue that walks her through it is Karla sitting the test.
  useCue(cue, (name) => {
    if (step.tryIt) return;
    const m = /^row\.(\d+)$/.exec(name);
    if (m) setShown(n => Math.max(n, Math.min(rows.length, Number(m[1]))));
  });

  return <div style={tBase}>
    {rows.map((r, i) => {
      if (i >= shown) {
        if (i > shown) return null;    // only the next slot shows, and only as a slot
        return <button key={i} onClick={() => setShown(n => n + 1)}
          style={{ ...tBase, display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
            height: 56, borderRadius: radius.dayCell, background: color.fill, color: color.muted,
            fontSize: 15, fontWeight: 600, padding: '0 20px', marginBottom: 8 }}>
          Tap for the next line</button>;
      }
      const isResult = !!r.result || i === rows.length - 1;
      return <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: phone ? 14 : 22,
        padding: '14px 0', borderBottom: i < rows.length - 1 ? `1px solid ${color.rule}` : 'none',
        animation: 'none', opacity: 1 }}>
        <span style={{ ...numeral(phone ? 28 : 40), flex: 'none', color: isResult ? color.greenDeep : color.ink }}>{r.value}</span>
        <span style={{ fontSize: 17, fontWeight: 600, color: isResult ? color.greenDeep : color.muted }}>{r.how}</span>
      </div>;
    })}
    {shown < rows.length && <div style={{ fontSize: 14, color: color.muted, marginTop: 10 }}>
      {shown} of {rows.length}</div>}
  </div>;
}

/* ------------------------------------------------------------- faceoff ----- */
/** Face-off: two cards split by an "or" disc. Picking reveals the per-one line. */
export function FaceoffLayout({ step, onSolve, cue, phone }) {
  const { cards = [], answer = 0, why } = step.faceoff || {};
  const [picked, setPicked] = React.useState(null);
  // `card.N` spotlights a card while Karla talks about it. Spotlighting is not
  // picking — it never sets `picked`, so it cannot solve the step on either kind.
  const [lit, setLit] = React.useState(null);
  useCue(cue, (name) => {
    const m = /^card\.(\d+)$/.exec(name);
    if (m) setLit(Number(m[1]) - 1);
    if (name === 'pick') setLit(null);
  });
  const right = picked === answer;

  const card = (c, i) => {
    const isPick = picked === i;
    const win = isPick && i === answer, lose = isPick && i !== answer;
    const spotlit = lit === i && picked === null;
    return <button key={i} onClick={() => { if (picked === null) { setPicked(i); onSolve(i === answer); } }}
      style={{ ...tBase, flex: 1, minWidth: phone ? '100%' : 230, border: 'none', textAlign: 'left',
        cursor: picked === null ? 'pointer' : 'default', borderRadius: radius.xl,
        // The "or" disc overlaps both cards by 24px, so the inner edge pads past it.
        padding: phone ? 20 : 26,
        ...(phone ? {} : { [i === 0 ? 'paddingRight' : 'paddingLeft']: 58 }),
        background: win ? color.greenTint : lose ? color.redTint : color.fill,
        transition: 'box-shadow .25s, background .25s',
        boxShadow: win ? `inset 0 0 0 2px ${color.green}`
          : lose ? `inset 0 0 0 2px ${color.red}`
          : spotlit ? `inset 0 0 0 3px ${color.ink}` : 'none' }}>
      <Kicker style={{ marginBottom: 8 }}>{c.label}</Kicker>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{c.count}</div>
      <div style={{ ...numeral(phone ? 48 : 72), marginTop: 4 }}>{c.price}</div>
      {picked !== null && <div style={{ fontSize: 16, fontWeight: 600, color: color.muted, marginTop: 10 }}>{c.each}</div>}
      {win && <span style={{ display: 'inline-block', marginTop: 12, background: color.surface, borderRadius: radius.full,
        padding: '6px 13px', fontSize: 13, fontWeight: 800, color: color.greenDeep }}>Better buy ✓</span>}
    </button>;
  };

  return <div style={tBase}>
    <div style={{ display: 'flex', alignItems: 'center', gap: phone ? 10 : 0, flexWrap: phone ? 'wrap' : 'nowrap' }}>
      {card(cards[0] || {}, 0)}
      <span style={{ width: 48, height: 48, flex: 'none', margin: phone ? '0 auto' : '0 -24px', zIndex: 1,
        borderRadius: radius.full, background: color.ink, color: '#fff',
        display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>or</span>
      {card(cards[1] || {}, 1)}
    </div>
    {picked !== null && <p style={{ fontSize: 17, lineHeight: 1.5, marginTop: 18,
      color: right ? color.ink : color.loss }}>
      {right ? why : `Not yet. Here is the step: ${step.hint}`}</p>}
  </div>;
}

/* ---------------------------------------------------------------- line ----- */
/** Number line: tap where you land. Right shows the move as a green span. */
export function LineLayout({ step, onSolve, cue, phone }) {
  const { min = -6, max = 6, start = 0, delta = 0, answer = 0, unit = '' } = step.line || {};
  const [picked, setPicked] = React.useState(null);
  // line.draw/start orient; hop animates the journey; land marks where it ends.
  // `land` is the answer, so on a Try it it is ignored along with the hop.
  const [shownHop, setShownHop] = React.useState(false);
  const [demoLand, setDemoLand] = React.useState(false);
  const [markStart, setMarkStart] = React.useState(false);
  useCue(cue, (name) => {
    if (name === 'line.draw' || name === 'line.start') return setMarkStart(true);
    if (step.tryIt) return;
    // Demonstration only, for the same reason as the bar: showing where it lands
    // is not her landing it, so `picked` and onSolve stay untouched.
    if (name === 'line.hop') setShownHop(true);
    if (name === 'line.land') { setShownHop(true); setDemoLand(true); }
  });
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const right = picked === answer;
  const vertical = phone;

  const tick = (v) => {
    const isPick = picked === v, isStart = v === start || (markStart && v === start);
    const isDemo = demoLand && picked === null && v === answer;
    const fill = isPick ? (right ? color.green : color.red)
      : isDemo ? color.greenTint
      : isStart ? world.integers.color : '#fff';
    const big = isPick || isStart || isDemo;
    return <button key={v} onClick={() => { if (picked === null) { setPicked(v); onSolve(v === answer); } }}
      style={{ ...tBase, position: 'absolute', border: 'none', cursor: picked === null ? 'pointer' : 'default',
        ...(vertical ? { top: `${pct(v)}%`, left: '50%' } : { left: `${pct(v)}%`, top: '50%' }),
        transform: 'translate(-50%, -50%)', width: big ? 26 : 14, height: big ? 26 : 14,
        borderRadius: radius.full, background: fill,
        boxShadow: big ? 'none' : `inset 0 0 0 2px ${color.ink}`, padding: 0 }} />;
  };

  return <div style={tBase}>
    <div style={{ position: 'relative', ...(vertical ? { height: 420, width: 60, margin: '0 auto' } : { height: 90, margin: '18px 0' }) }}>
      <span style={{ position: 'absolute', background: color.ink,
        ...(vertical ? { left: '50%', top: 0, bottom: 0, width: 2, transform: 'translateX(-50%)' }
          : { top: '50%', left: 0, right: 0, height: 2, transform: 'translateY(-50%)' }) }} />
      {/* The move she made, drawn on the line, not described in words. */}
      {(right || shownHop) && <span style={{ position: 'absolute', background: color.green, borderRadius: radius.full,
        ...(vertical
          ? { left: '50%', transform: 'translateX(-50%)', width: 6, top: `${Math.min(pct(start), pct(answer))}%`, height: `${Math.abs(pct(answer) - pct(start))}%` }
          : { top: '50%', transform: 'translateY(-50%)', height: 6, left: `${Math.min(pct(start), pct(answer))}%`, width: `${Math.abs(pct(answer) - pct(start))}%` })
      }} />}
      {ticks.map(tick)}
      <span style={{ position: 'absolute', fontSize: 13, fontWeight: 800, color: color.muted,
        ...(vertical ? { left: 'calc(50% + 22px)', top: `${pct(start)}%` } : { left: `${pct(start)}%`, top: 'calc(50% + 22px)' }),
        transform: vertical ? 'translateY(-50%)' : 'translateX(-50%)' }}>START</span>
    </div>
    {picked !== null && (right
      ? <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: color.greenDeep }}>
          {Math.abs(delta)} {Math.abs(delta) === 1 ? 'step' : 'steps'} {delta < 0 ? 'down' : 'up'}</div>
        <div style={{ ...numeral(phone ? 30 : 40), marginTop: 6 }}>
          {start}{unit} {delta < 0 ? '−' : '+'} {Math.abs(delta)}{unit} = {answer}{unit}</div>
      </div>
      : <p style={{ fontSize: 17, color: color.loss, marginTop: 4 }}>Not yet. Here is the step: {step.hint}</p>)}
  </div>;
}

/* ----------------------------------------------------------------- bar ----- */
/** Bar: tap segments until the shaded part matches the target fraction. */
export function BarLayout({ step, onSolve, cue, phone }) {
  const { parts = 4, target = 1, context } = step.bar || {};
  const [shaded, setShaded] = React.useState(0);
  // `bar.pieces` draws the parts (they are already drawn — this pulses them into
  // notice), `bar.shade` fills the target, `bar.pulse` draws the eye. Shading IS
  // the answer, so on a Try it it is ignored and only the pulse survives.
  const [pulse, setPulse] = React.useState(0);
  // Karla's shading is a DEMONSTRATION, held apart from hers. Driving `shaded`
  // directly fired onSolve and enabled Next while the kid sat listening — audio
  // GRANTING progress, which breaks "gating is hers" exactly as surely as audio
  // blocking it would. She still has to shade it herself.
  const [demo, setDemo] = React.useState(0);
  useCue(cue, (name) => {
    if (name === 'bar.pieces' || name === 'bar.pulse') return setPulse(n => n + 1);
    if (step.tryIt) return;
    if (name === 'bar.shade') setDemo(target);
  });
  const exact = shaded === target;
  React.useEffect(() => { onSolve(exact); }, [shaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const over = shaded > target;

  return <div style={tBase}>
    {context && <p style={{ fontSize: 17, color: color.muted, margin: '0 0 16px' }}>{context}</p>}
    <div style={{ display: 'flex', gap: 5 }}>
      {Array.from({ length: parts }, (_, i) => {
        const on = i < shaded;
        const shownByKarla = !shaded && i < demo;
        return <button key={i} onClick={() => { setDemo(0); setShaded(i + 1 === shaded ? i : i + 1); }}
          style={{ ...tBase, flex: 1, height: phone ? 80 : 120, border: 'none', cursor: 'pointer',
            transition: 'background .25s, transform .25s',
            transform: pulse && !on ? 'scaleY(1.06)' : 'none',
            background: on ? (exact ? color.green : over ? color.red : color.ink)
              : shownByKarla ? color.greenTint : color.track,
            borderTopLeftRadius: i === 0 ? 18 : 0, borderBottomLeftRadius: i === 0 ? 18 : 0,
            borderTopRightRadius: i === parts - 1 ? 18 : 0, borderBottomRightRadius: i === parts - 1 ? 18 : 0 }} />;
      })}
    </div>
    <div style={{ ...numeral(phone ? 44 : 64), marginTop: 16, color: exact ? color.greenDeep : over ? color.loss : color.ink }}>
      {shaded || demo}/{parts}</div>
    {over && <p style={{ fontSize: 17, color: color.loss }}>Too many. Here is the step: {step.hint}</p>}
  </div>;
}

export const TEACH_LAYOUTS = { walk: WalkLayout, faceoff: FaceoffLayout, line: LineLayout, bar: BarLayout };

/* ------------------------------------------------------------ takeaway ----- */
/** The band that opens above the footer once a step is solved. */
export function TakeawayBand({ note, written, lit = false, onWrite, phone }) {
  return <div style={{ ...tBase, background: color.greenTint, borderRadius: radius.dayCell,
    boxShadow: lit ? `0 0 0 3px ${color.green}` : 'none', transition: 'box-shadow .3s',
    padding: phone ? '14px 16px' : '18px 24px', marginTop: 24,
    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
    <div style={{ flex: 1, minWidth: 200 }}>
      <Kicker style={{ marginBottom: 4 }}>For your notes</Kicker>
      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}>{note}</div>
    </div>
    {written
      ? <span style={{ fontSize: 15, fontWeight: 700, color: color.greenDeep }}>Written ✓</span>
      : <Button variant="ink" size="sm" onClick={onWrite}>Write it down</Button>}
  </div>;
}

/** The 4-cell notes counter that sits next to the cheat-sheet kicker. */
export function NotesCounter({ count = 0, total = 4 }) {
  return <span style={{ display: 'inline-flex', gap: 3, marginLeft: 10, verticalAlign: 'middle' }}>
    {Array.from({ length: total }, (_, i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 3,
      background: i < count ? color.green : color.locked }} />)}
  </span>;
}

/* --------------------------------------------------------------- voice ----- */


/* THE WORKED ANIMATION STAGE (§0c).

   A teach row says what happened to a number. The stage SHOWS it happening —
   once, to one number, with the arithmetic visible as a move rather than as a
   result. Three moves cover the money walk §0c draws:

     hop   — x10 or /10: the decimal point travels one place and the spare zero goes
     split — half: one bar opens into two, and one half greys out
     join  — add: two bars close the gap between them and become one

   RULES THIS KEEPS, all of them standing laws rather than style:

     - NOTHING WAITS ON IT. The stage is never on the path to solving a step.
       Next does not consult it, the row it illustrates is already revealed, and
       a stage that fails to render leaves a teach panel that works exactly as it
       did before stages existed.
     - ONE ANIMATION AT A TIME, on one number. The stage follows the newest
       revealed row, so there is never a second thing moving for the eye to
       choose between — the whole point of "one visual act".
     - REDUCED MOTION HOLDS INSTEAD OF MOVING. The move is shown in its finished
       state, with the readout already there. A kid who asked the device not to
       animate gets the answer, not a crawl.

   The DATA is the bank's, not this file's: a step carries `stage` and the
   component draws it. Nothing here invents numbers for a skill. */
const STAGE_W = 372, STAGE_H = 102;

/** Where the decimal point sits in "$64.00" — index among the digit cells. */
const dotIndexOf = (s) => {
  const digits = String(s).replace(/[^\d.]/g, '');
  const at = digits.indexOf('.');
  return at < 0 ? digits.length : at;
};
const digitsOf = (s) => String(s).replace(/[^\d]/g, '');

function HopAnimation({ from, to, playing, reduced }) {
  const d = digitsOf(from);
  const before = dotIndexOf(from), after = dotIndexOf(to);
  const CELL = 44, GAP = 16, PRE = 26;
  /* Digits sit in fixed cells; the POINT lives in a gap between two of them, and
     every digit after the gap is pushed right by it. So the move is one number:
     where the gap is. The currency mark is not a digit and never moves. */
  const landed = reduced || playing === 'done';
  const dotAt = landed ? after : before;
  const xOf = (i, at) => PRE + i * CELL + (i >= at ? GAP : 0);
  const dotX = PRE + dotAt * CELL + GAP / 2;
  const fromX = PRE + before * CELL + GAP / 2;
  const toX = PRE + after * CELL + GAP / 2;
  // The spare trailing zero goes only when the point moved LEFT past it.
  const dropIndex = after < before ? d.length - 1 : -1;
  const mark = (String(from).match(/^[^\d]+/) || [''])[0].trim();

  return <svg width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} role="img"
    aria-label={`${from} becomes ${to}`} data-anim="hop" data-landed={landed ? 'yes' : 'no'}>
    <defs><marker id="hopHead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 z" fill={color.ink} /></marker></defs>
    {/* The arc the point travels, drawn above it with an arrowhead. */}
    <path d={`M ${fromX} 30 Q ${(fromX + toX) / 2} 4 ${toX} 30`}
      fill="none" stroke={color.ink} strokeWidth="2" markerEnd="url(#hopHead)"
      style={{ strokeDasharray: 220, strokeDashoffset: landed ? 0 : 220,
        transition: reduced ? 'none' : `stroke-dashoffset .6s ${spring}` }} />
    {!!mark && <text x="0" y="88" fontSize="46" fontWeight="300" fill={color.ink}
      fontFamily="'Inter Tight', sans-serif">{mark}</text>}
    {d.split('').map((ch, i) => <text key={i} x={xOf(i, dotAt)} y={88}
      fontSize="72" fontWeight="300" letterSpacing="-.045em" fill={color.ink}
      fontFamily="'Inter Tight', sans-serif"
      style={{ opacity: landed && i === dropIndex ? 0 : 1,
        transition: reduced ? 'none' : `x .6s ${spring}, opacity .4s ease .5s` }}>{ch}</text>)}
    {/* The point itself: the 12px dot in the gap, and the thing that moves. */}
    <circle r="6" cy="82" cx={dotX} fill={landed ? color.greenDeep : color.ink}
      style={{ transition: reduced ? 'none' : `cx .6s ${spring}, fill .3s ease .45s` }} />
  </svg>;
}

function BarsAnimation({ kind, from, to, playing, reduced }) {
  const landed = reduced || playing === 'done';
  const H = 72, GAP = 12, FULL = 240, HALF = 120;
  const split = kind === 'split';
  // split: one bar opens into two. join: two bars close into one.
  const open = split ? landed : !landed;
  const label = (t) => ({ fontSize: 15, fontWeight: 700, fill: '#fff',
    fontFamily: "'Inter Tight', sans-serif" });
  const ease = reduced ? 'none' : `all .6s ${spring}`;
  const leftW = split ? HALF : FULL / 2;
  return <svg width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} role="img"
    aria-label={`${from} becomes ${to}`} data-anim={kind} data-landed={landed ? 'yes' : 'no'}>
    <rect x="0" y="15" width={split ? HALF : (landed ? FULL : HALF * 2)} height={H} rx="8"
      fill={!split && landed ? color.greenDeep : color.ink} style={{ transition: ease }} />
    <rect x={open ? HALF + GAP : HALF} y="15" width={HALF} height={H} rx="8"
      fill={split && landed ? color.locked : (!split && landed ? color.greenDeep : color.ink)}
      style={{ transition: ease, opacity: !split && landed ? 0 : 1 }} />
    <text x="14" y="60" {...label()} style={{ transition: ease }}>
      {landed ? (split ? to : to) : from}</text>
    {split && <text x={(open ? HALF + GAP : HALF) + 14} y="60" {...label()}
      fill={landed ? color.mutedDeep : '#fff'} style={{ transition: ease }}>{landed ? to : ''}</text>}
  </svg>;
}

export function TeachStage({ stage, index = 0, of = 0, phone, onWatch }) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = React.useState('idle');
  const [nonce, setNonce] = React.useState(0);

  /* One play per number shown. The stage follows the newest revealed row, so
     arriving at a row IS the cue — she does not have to ask for the first run. */
  React.useEffect(() => {
    if (!stage) return undefined;
    setPlaying('idle');
    const t = setTimeout(() => setPlaying('done'), reduced ? 0 : 120);
    return () => clearTimeout(t);
  }, [stage, nonce, reduced]);

  if (!stage) return null;
  const Anim = stage.kind === 'hop' ? HopAnimation : BarsAnimation;

  const watch = <button data-watch onClick={() => { setNonce(n => n + 1); onWatch?.(); }}
    style={{ ...tBase, border: 'none', cursor: 'pointer', background: color.surface,
      borderRadius: radius.full, height: phone ? 44 : 40, padding: '0 16px',
      fontSize: 13.5, fontWeight: 700, alignSelf: 'flex-start' }}>Watch again</button>;

  const words = <div style={{ minWidth: 0 }}>
    <Kicker style={{ marginBottom: 8 }}>Step {index + 1}{of ? ` of ${of}` : ''} · watch</Kicker>
    <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.45 }}>{stage.line}</div>
    {/* The readout arrives WHEN THE MOVE LANDS, not with it: the number is the
        consequence of what she just watched, so it may not be there first. */}
    {!!stage.readout && <div style={{ fontSize: 15, fontWeight: 600, color: color.greenDeep, marginTop: 8,
      opacity: playing === 'done' ? 1 : 0,
      transition: reduced ? 'none' : 'opacity .3s ease .55s' }}>{stage.readout}</div>}
  </div>;

  return <div data-teach-stage style={{ ...tBase, background: color.fill, borderRadius: radius.lg,
    padding: phone ? '18px 18px' : '20px 28px', margin: '18px 0',
    display: phone ? 'block' : 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10,
      transform: phone ? 'scale(.8)' : 'none', transformOrigin: 'left top',
      marginBottom: phone ? -14 : 0 }}>
      <Anim key={`${stage.kind}-${nonce}`} kind={stage.kind} from={stage.from} to={stage.to}
        playing={playing} reduced={reduced} />
      {watch}
    </div>
    <div style={{ marginTop: phone ? 16 : 0 }}>{words}</div>
  </div>;
}
