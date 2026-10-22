/* The four teach-step layouts (§0b), plus the takeaway band and the voice row.

   A teach step is data, not markup: {layout, prompt, speak?, hint, takeaway, …}
   with one payload key per layout. The runner picks the component out of
   TEACH_LAYOUTS by `layout` and gets back a solved/unsolved signal — Next stays
   disabled until the step is solved, because reading is not learning.

   Zero-dependency by contract: no @kampus/engine import here. Anything these
   layouts need to know about correctness is in the step's own data.

   Every layout follows the same two ADHD rules as the rest of the product: a wrong
   pick reveals the hint and lets her carry on, and nothing is timed. */
import { color, radius, font, numeral, world } from './tokens.js';
import { Button, Kicker, Blob } from './primitives.jsx';

const tBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** The voice mode is the grade band, not a setting: a = read to her, c = on request. */
export const voiceMode = (grade) => (grade <= 4 ? 'a' : grade <= 6 ? 'b' : 'c');

/* ---------------------------------------------------------------- walk ----- */
/** Worked walk: ruled rows revealed one tap at a time, result row in green. */
export function WalkLayout({ step, solved, onSolve, phone }) {
  const rows = step.walk?.rows || [];
  const [shown, setShown] = React.useState(1);
  React.useEffect(() => { if (shown >= rows.length && !solved) onSolve(true); }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

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
export function FaceoffLayout({ step, onSolve, phone }) {
  const { cards = [], answer = 0, why } = step.faceoff || {};
  const [picked, setPicked] = React.useState(null);
  const right = picked === answer;

  const card = (c, i) => {
    const isPick = picked === i;
    const win = isPick && i === answer, lose = isPick && i !== answer;
    return <button key={i} onClick={() => { if (picked === null) { setPicked(i); onSolve(i === answer); } }}
      style={{ ...tBase, flex: 1, minWidth: phone ? '100%' : 230, border: 'none', textAlign: 'left',
        cursor: picked === null ? 'pointer' : 'default', borderRadius: radius.xl,
        // The "or" disc overlaps both cards by 24px, so the inner edge pads past it.
        padding: phone ? 20 : 26,
        ...(phone ? {} : { [i === 0 ? 'paddingRight' : 'paddingLeft']: 58 }),
        background: win ? color.greenTint : lose ? color.redTint : color.fill,
        boxShadow: win ? `inset 0 0 0 2px ${color.green}` : lose ? `inset 0 0 0 2px ${color.red}` : 'none' }}>
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
export function LineLayout({ step, onSolve, phone }) {
  const { min = -6, max = 6, start = 0, delta = 0, answer = 0, unit = '' } = step.line || {};
  const [picked, setPicked] = React.useState(null);
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const right = picked === answer;
  const vertical = phone;

  const tick = (v) => {
    const isPick = picked === v, isStart = v === start;
    const fill = isPick ? (right ? color.green : color.red) : isStart ? world.integers.color : '#fff';
    const big = isPick || isStart;
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
      {right && <span style={{ position: 'absolute', background: color.green, borderRadius: radius.full,
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
export function BarLayout({ step, onSolve, phone }) {
  const { parts = 4, target = 1, context } = step.bar || {};
  const [shaded, setShaded] = React.useState(0);
  const exact = shaded === target;
  React.useEffect(() => { onSolve(exact); }, [shaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const over = shaded > target;

  return <div style={tBase}>
    {context && <p style={{ fontSize: 17, color: color.muted, margin: '0 0 16px' }}>{context}</p>}
    <div style={{ display: 'flex', gap: 5 }}>
      {Array.from({ length: parts }, (_, i) => {
        const on = i < shaded;
        return <button key={i} onClick={() => setShaded(i + 1 === shaded ? i : i + 1)}
          style={{ ...tBase, flex: 1, height: phone ? 80 : 120, border: 'none', cursor: 'pointer',
            background: on ? (exact ? color.green : over ? color.red : color.ink) : color.track,
            borderTopLeftRadius: i === 0 ? 18 : 0, borderBottomLeftRadius: i === 0 ? 18 : 0,
            borderTopRightRadius: i === parts - 1 ? 18 : 0, borderBottomRightRadius: i === parts - 1 ? 18 : 0 }} />;
      })}
    </div>
    <div style={{ ...numeral(phone ? 44 : 64), marginTop: 16, color: exact ? color.greenDeep : over ? color.loss : color.ink }}>
      {shaded}/{parts}</div>
    {over && <p style={{ fontSize: 17, color: color.loss }}>Too many. Here is the step: {step.hint}</p>}
  </div>;
}

export const TEACH_LAYOUTS = { walk: WalkLayout, faceoff: FaceoffLayout, line: LineLayout, bar: BarLayout };

/* ------------------------------------------------------------ takeaway ----- */
/** The band that opens above the footer once a step is solved. */
export function TakeawayBand({ note, written, onWrite, phone }) {
  return <div style={{ ...tBase, background: color.greenTint, borderRadius: radius.dayCell,
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
/**
 * Band a reads every step aloud on open; band b is the same row without the
 * controls; band c is the "Read it to me" pill the lesson already had. Quiet is
 * per-session and sticky — a kid who wants it off should not have to ask twice.
 */
export function VoiceRow({ mode = 'c', text, worldColor = color.ink, quiet, onQuiet, speak, blobDir = '/blobs/', phone }) {
  const [reading, setReading] = React.useState(false);
  const read = (rate = 1) => { if (quiet) return; setReading(true); speak?.(text, rate); setTimeout(() => setReading(false), 1200); };
  // Band a auto-reads each new step; b and c never auto-read.
  React.useEffect(() => { if (mode === 'a' && text) read(); }, [text, mode, quiet]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mode === 'c') return <button onClick={() => read()} style={{ ...tBase, border: 'none', cursor: 'pointer',
    background: color.surface, borderRadius: radius.full, padding: '8px 15px', fontSize: 13, fontWeight: 700 }}>
    Read it to me</button>;

  return <div style={{ ...tBase, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
    <span style={{ width: 64, height: 64, flex: 'none', borderRadius: radius.full, background: worldColor,
      display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <Blob name="Singing" size={48} dir={blobDir} /></span>
    {mode === 'a' && <>
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: color.muted }}>
          {quiet ? 'Quiet for now.' : reading ? 'Reading it to you…' : 'Ready when you are.'}</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 18, marginTop: 6 }}>
          {[9, 15, 18, 13, 7].map((h, i) => <span key={i} style={{ width: 4, borderRadius: 2,
            height: reading ? h : 4, background: color.ink, transition: 'height .18s ease' }} />)}
        </div>
      </div>
      {!phone && <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="ink" size="sm" onClick={() => read()}>Again</Button>
        <Button variant="outline" size="sm" onClick={() => read(0.8)}>Slower</Button>
        <Button variant="ghost" size="sm" onClick={() => onQuiet?.(!quiet)}>{quiet ? 'Unmute' : 'Quiet'}</Button>
      </div>}
    </>}
  </div>;
}
